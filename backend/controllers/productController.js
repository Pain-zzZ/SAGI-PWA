const db = require('../config/database');

// Función auxiliar para registrar movimientos
async function registrarMovimiento(connection, idProducto, tipo, cantidad, descripcion, idUsuario) {
  await connection.query(
    `INSERT INTO movimientoinventario (idProducto, tipo, cantidad, descripcion, idUsuario) 
     VALUES (?, ?, ?, ?, ?)`,
    [idProducto, tipo, cantidad || null, descripcion, idUsuario]
  );
  console.log(`📝 Movimiento registrado: ${tipo} - ${descripcion}`);
}

// Obtener todos los productos con estado calculado
exports.getAllProducts = async (req, res, next) => {
  try {
    const [products] = await db.query(`
      SELECT 
        p.idProducto,
        p.nombre,
        p.descripcion,
        p.precioCompra,
        p.precioVenta,
        p.stockMinimo,
        p.activo,
        c.nombre as categoria,
        c.idCategoria,
        COALESCE(i.cantidad, 0) as cantidad,
        pr.nombre AS proveedor,
        CASE 
          WHEN p.activo = 0 THEN 'Inactivo'
          WHEN p.activo = 1 AND COALESCE(i.cantidad, 0) = 0 THEN 'No disponible'
          WHEN p.activo = 1 AND COALESCE(i.cantidad, 0) > 0 THEN 'Disponible'
        END AS estado
      FROM producto p
      LEFT JOIN categoria c ON p.idCategoria = c.idCategoria
      LEFT JOIN inventario i ON p.idProducto = i.idProducto
      LEFT JOIN productoproveedor pp ON p.idProducto = pp.idProducto
      LEFT JOIN proveedor pr ON pp.idProveedor = pr.idProveedor
      ORDER BY p.idProducto DESC
    `);

    res.json(products);
  } catch (error) {
    next(error);
  }
};

// Obtener un producto por ID
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [products] = await db.query(`
      SELECT 
        p.idProducto,
        p.nombre,
        p.descripcion,
        p.precioCompra,
        p.precioVenta,
        p.stockMinimo,
        p.activo,
        c.nombre AS categoria,
        c.idCategoria,
        COALESCE(i.cantidad, 0) AS cantidad,
        pr.nombre AS proveedor,
        CASE 
          WHEN p.activo = 0 THEN 'Inactivo'
          WHEN p.activo = 1 AND COALESCE(i.cantidad, 0) = 0 THEN 'No disponible'
          WHEN p.activo = 1 AND COALESCE(i.cantidad, 0) > 0 THEN 'Disponible'
        END AS estado
      FROM producto p
      LEFT JOIN categoria c ON p.idCategoria = c.idCategoria
      LEFT JOIN inventario i ON p.idProducto = i.idProducto
      LEFT JOIN productoproveedor pp ON p.idProducto = pp.idProducto
      LEFT JOIN proveedor pr ON pp.idProveedor = pr.idProveedor
      WHERE p.idProducto = ?
    `, [id]);

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json(products[0]);
  } catch (error) {
    next(error);
  }
};

// Crear nuevo producto
exports.createProduct = async (req, res, next) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { 
      nombre, 
      descripcion, 
      precioCompra, 
      precioVenta, 
      stockMinimo, 
      idCategoria,
      cantidadInicial,
      idProveedor
    } = req.body;

    // Validar campos obligatorios
    if (!nombre || !precioCompra || !precioVenta || !idCategoria) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios'
      });
    }

     // Insertar producto (con activo = 1 por defecto)
    const [productResult] = await connection.query(
      `INSERT INTO producto (nombre, descripcion, precioCompra, precioVenta, stockMinimo, idCategoria, activo) 
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [nombre, descripcion || null, precioCompra, precioVenta, stockMinimo || 0, idCategoria]
    );

    const idProducto = productResult.insertId;

    // Crear registro en inventario
    await connection.query(
      'INSERT INTO inventario (idProducto, cantidad) VALUES (?, ?)',
      [idProducto, cantidadInicial || 0]
    );

    // Si hay proveedor, crear relación
    if (idProveedor) {
      await connection.query(
        'INSERT INTO productoproveedor (idProducto, idProveedor) VALUES (?, ?)',
        [idProducto, idProveedor]
      );
    }

    // Si hay cantidad inicial, registrar movimiento
    if (cantidadInicial && cantidadInicial > 0) {
      await connection.query(
        `INSERT INTO movimientoinventario (idProducto, tipo, cantidad, descripcion, idUsuario) 
         VALUES (?, 'entrada', ?, 'Stock inicial', ?)`,
        [idProducto, cantidadInicial, req.user.idUsuario]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Producto creado correctamente',
      idProducto
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// Actualizar producto (con ajuste de stock opcional)
exports.updateProduct = async (req, res, next) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;
    const { 
      nombre, 
      descripcion, 
      precioCompra, 
      precioVenta, 
      stockMinimo, 
      idCategoria,
      stockDisponible 
    } = req.body;

    // Obtener datos anteriores del producto
    const [oldProduct] = await connection.query(
      'SELECT * FROM producto WHERE idProducto = ?',
      [id]
    );

    if (oldProduct.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Obtener stock actual del inventario
    const [inventario] = await connection.query(
      'SELECT cantidad FROM inventario WHERE idProducto = ?',
      [id]
    );

    const stockAnterior = inventario.length > 0 ? inventario[0].cantidad : 0;

    await connection.beginTransaction();

    // Actualizar datos del producto
    await connection.query(
      `UPDATE producto 
       SET nombre = ?, descripcion = ?, precioCompra = ?, precioVenta = ?, stockMinimo = ?, idCategoria = ?
       WHERE idProducto = ?`,
      [nombre, descripcion, precioCompra, precioVenta, stockMinimo, idCategoria, id]
    );

    // Detectar cambios para el registro de movimiento
    const cambios = [];
    if (oldProduct[0].nombre !== nombre) cambios.push(`Nombre: "${oldProduct[0].nombre}" → "${nombre}"`);
    if (oldProduct[0].precioCompra !== precioCompra) cambios.push(`Precio compra: $${oldProduct[0].precioCompra} → $${precioCompra}`);
    if (oldProduct[0].precioVenta !== precioVenta) cambios.push(`Precio venta: $${oldProduct[0].precioVenta} → $${precioVenta}`);
    if (oldProduct[0].stockMinimo !== stockMinimo) cambios.push(`Stock mínimo: ${oldProduct[0].stockMinimo} → ${stockMinimo}`);

    // Si hay cambios en datos administrativos, registrar edición
    if (cambios.length > 0) {
      await registrarMovimiento(
        connection,
        id,
        'edicion',
        null,
        `Producto editado: ${cambios.join(', ')}`,
        req.user.idUsuario
      );
    }

    // Si se proporcionó stockDisponible y cambió, actualizar inventario
    if (stockDisponible !== undefined && stockDisponible !== stockAnterior) {
      const diferencia = stockDisponible - stockAnterior;
      
      // Actualizar inventario
      await connection.query(
        'UPDATE inventario SET cantidad = ? WHERE idProducto = ?',
        [stockDisponible, id]
      );

      // Registrar movimiento de ajuste
      await registrarMovimiento(
        connection,
        id,
        'ajuste',
        Math.abs(diferencia),
        `Ajuste manual desde edición: ${stockAnterior} → ${stockDisponible} (${diferencia > 0 ? '+' : ''}${diferencia})`,
        req.user.idUsuario
      );

      console.log(`📊 Stock ajustado: ${stockAnterior} → ${stockDisponible} (diferencia: ${diferencia})`);
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Producto actualizado correctamente',
      stockActualizado: stockDisponible !== undefined && stockDisponible !== stockAnterior
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// Eliminar producto (eliminación lógica)
exports.deleteProduct = async (req, res, next) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;

    // Verificar que el producto existe
    const [product] = await connection.query(
      'SELECT idProducto, nombre FROM producto WHERE idProducto = ?',
      [id]
    );

    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    await connection.beginTransaction();

    // Marcar como inactivo (eliminación lógica)
    await connection.query(
      'UPDATE producto SET activo = 0 WHERE idProducto = ?',
      [id]
    );

    // Registrar movimiento de inactivación
    await registrarMovimiento(
      connection,
      id,
      'inactivacion',
      null,
      `Producto "${product[0].nombre}" marcado como inactivo`,
      req.user.idUsuario
    );

    await connection.commit();

    console.log(`🗑️ Producto "${product[0].nombre}" marcado como inactivo`);

    res.json({
      success: true,
      message: 'Producto eliminado correctamente'
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// Reactivar producto
exports.reactivateProduct = async (req, res, next) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;

    // Verificar que el producto existe
    const [product] = await connection.query(
      'SELECT idProducto, nombre FROM producto WHERE idProducto = ?',
      [id]
    );

    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    await connection.beginTransaction();

    // Reactivar producto
    await connection.query(
      'UPDATE producto SET activo = 1 WHERE idProducto = ?',
      [id]
    );

    // Registrar movimiento de reactivación
    await registrarMovimiento(
      connection,
      id,
      'reactivacion',
      null,
      `Producto "${product[0].nombre}" reactivado`,
      req.user.idUsuario
    );

    await connection.commit();

    console.log(`♻️ Producto "${product[0].nombre}" reactivado`);

    res.json({
      success: true,
      message: 'Producto reactivado correctamente'
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};