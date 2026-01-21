const db = require('../config/database');

// Obtener todos los proveedores con estadísticas
exports.getAllProviders = async (req, res, next) => {
  try {
    const [providers] = await db.query(`
      SELECT 
        p.idProveedor,
        p.nombre,
        p.telefono,
        p.correo,
        p.direccion,
        p.nit,
        p.contactoNombre,
        p.notas,
        p.activo,
        p.fechaCreacion,
        p.fechaActualizacion,
        COUNT(DISTINCT pp.idProducto) as totalProductos,
        COALESCE(SUM(CASE 
          WHEN m.tipo = 'entrada' AND m.fecha >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
          THEN prod.precioCompra * m.cantidad 
          ELSE 0 
        END), 0) as comprasMes
      FROM proveedor p
      LEFT JOIN productoproveedor pp ON p.idProveedor = pp.idProveedor
      LEFT JOIN producto prod ON pp.idProducto = prod.idProducto
      LEFT JOIN movimientoinventario m ON prod.idProducto = m.idProducto
      GROUP BY p.idProveedor
      ORDER BY p.idProveedor DESC
    `);

    res.json(providers);
  } catch (error) {
    next(error);
  }
};

// Obtener un proveedor por ID
exports.getProviderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [providers] = await db.query(`
      SELECT 
        p.idProveedor,
        p.nombre,
        p.telefono,
        p.correo,
        p.direccion,
        p.nit,
        p.contactoNombre,
        p.notas,
        p.activo,
        p.fechaCreacion,
        p.fechaActualizacion,
        COUNT(DISTINCT pp.idProducto) as totalProductos
      FROM proveedor p
      LEFT JOIN productoproveedor pp ON p.idProveedor = pp.idProveedor
      WHERE p.idProveedor = ?
      GROUP BY p.idProveedor
    `, [id]);

    if (providers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    res.json(providers[0]);
  } catch (error) {
    next(error);
  }
};

// Crear nuevo proveedor
exports.createProvider = async (req, res, next) => {
  try {
    const { 
      nombre, 
      telefono, 
      correo, 
      direccion,
      nit,
      contactoNombre,
      notas
    } = req.body;

    // Validar campo obligatorio
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre del proveedor es obligatorio'
      });
    }

    // Validar email si se proporciona
    if (correo && correo.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico no es válido'
        });
      }
    }

    // Insertar proveedor (activo por defecto)
    const [result] = await db.query(
      `INSERT INTO proveedor (nombre, telefono, correo, direccion, nit, contactoNombre, notas, activo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        nombre.trim(), 
        telefono?.trim() || null, 
        correo?.trim() || null, 
        direccion?.trim() || null,
        nit?.trim() || null,
        contactoNombre?.trim() || null,
        notas?.trim() || null
      ]
    );

    console.log(`✅ Proveedor creado: ${nombre} (ID: ${result.insertId})`);

    res.status(201).json({
      success: true,
      message: 'Proveedor creado correctamente',
      idProveedor: result.insertId
    });

  } catch (error) {
    next(error);
  }
};

// Actualizar proveedor
exports.updateProvider = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      telefono, 
      correo, 
      direccion,
      nit,
      contactoNombre,
      notas
    } = req.body;

    // Verificar que el proveedor existe
    const [provider] = await db.query(
      'SELECT idProveedor FROM proveedor WHERE idProveedor = ?',
      [id]
    );

    if (provider.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    // Validar campo obligatorio
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre del proveedor es obligatorio'
      });
    }

    // Validar email si se proporciona
    if (correo && correo.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico no es válido'
        });
      }
    }

    // Actualizar proveedor
    await db.query(
      `UPDATE proveedor 
       SET nombre = ?, telefono = ?, correo = ?, direccion = ?, nit = ?, contactoNombre = ?, notas = ?
       WHERE idProveedor = ?`,
      [
        nombre.trim(), 
        telefono?.trim() || null, 
        correo?.trim() || null, 
        direccion?.trim() || null,
        nit?.trim() || null,
        contactoNombre?.trim() || null,
        notas?.trim() || null,
        id
      ]
    );

    console.log(`✏️ Proveedor actualizado: ${nombre} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Proveedor actualizado correctamente'
    });

  } catch (error) {
    next(error);
  }
};

// Cambiar estado del proveedor (activo/inactivo)
exports.toggleProviderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obtener estado actual
    const [provider] = await db.query(
      'SELECT idProveedor, nombre, activo FROM proveedor WHERE idProveedor = ?',
      [id]
    );

    if (provider.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    const nuevoEstado = provider[0].activo === 1 ? 0 : 1;

    // Cambiar estado
    await db.query(
      'UPDATE proveedor SET activo = ? WHERE idProveedor = ?',
      [nuevoEstado, id]
    );

    const accion = nuevoEstado === 1 ? 'reactivado' : 'inactivado';
    console.log(`🔄 Proveedor ${accion}: ${provider[0].nombre} (ID: ${id})`);

    res.json({
      success: true,
      message: `Proveedor ${accion} correctamente`,
      nuevoEstado
    });

  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas de proveedores
exports.getProviderStats = async (req, res, next) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as totalProveedores,
        SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as proveedoresActivos,
        (SELECT COUNT(DISTINCT idProducto) FROM productoproveedor) as productosAsociados,
        COALESCE((
          SELECT SUM(prod.precioCompra * m.cantidad)
          FROM movimientoinventario m
          JOIN producto prod ON m.idProducto = prod.idProducto
          WHERE m.tipo = 'entrada' 
            AND m.fecha >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        ), 0) as comprasMes
      FROM proveedor
    `);

    res.json(stats[0]);
  } catch (error) {
    next(error);
  }
};

// Eliminar proveedor (lógico - marca como inactivo)
exports.deleteProvider = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el proveedor existe
    const [provider] = await db.query(
      'SELECT idProveedor, nombre FROM proveedor WHERE idProveedor = ?',
      [id]
    );

    if (provider.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    // Marcar como inactivo (eliminación lógica)
    await db.query(
      'UPDATE proveedor SET activo = 0 WHERE idProveedor = ?',
      [id]
    );

    console.log(`🗑️ Proveedor "${provider[0].nombre}" marcado como inactivo`);

    res.json({
      success: true,
      message: 'Proveedor eliminado correctamente'
    });

  } catch (error) {
    next(error);
  }
};