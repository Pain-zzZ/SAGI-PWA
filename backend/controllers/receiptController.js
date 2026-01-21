const db = require('../config/database');

// Obtener todos los comprobantes con filtros
exports.getAllReceipts = async (req, res, next) => {
  try {
    const { tipo, estado, fechaInicio, fechaFin } = req.query;
    
    let query = `
      SELECT 
        c.*,
        u.nombre as nombreUsuario,
        p.nombre as nombreProveedor
      FROM comprobante c
      LEFT JOIN usuario u ON c.idUsuario = u.idUsuario
      LEFT JOIN proveedor p ON c.idProveedor = p.idProveedor
      WHERE 1=1
    `;
    
    const params = [];
    
    if (tipo) {
      query += ' AND c.tipo = ?';
      params.push(tipo);
    }
    
    if (estado) {
      query += ' AND c.estado = ?';
      params.push(estado);
    }
    
    if (fechaInicio) {
      query += ' AND DATE(c.fecha) >= ?';
      params.push(fechaInicio);
    }
    
    if (fechaFin) {
      query += ' AND DATE(c.fecha) <= ?';
      params.push(fechaFin);
    }
    
    query += ' ORDER BY c.fecha DESC, c.idComprobante DESC LIMIT 200';
    
    const [receipts] = await db.query(query, params);
    
    res.json(receipts);
  } catch (error) {
    next(error);
  }
};

// Obtener un comprobante por ID con sus productos
exports.getReceiptById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obtener comprobante
    const [receipts] = await db.query(`
      SELECT 
        c.*,
        u.nombre as nombreUsuario,
        u.correo as correoUsuario,
        p.nombre as nombreProveedor
      FROM comprobante c
      LEFT JOIN usuario u ON c.idUsuario = u.idUsuario
      LEFT JOIN proveedor p ON c.idProveedor = p.idProveedor
      WHERE c.idComprobante = ?
    `, [id]);

    if (receipts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comprobante no encontrado'
      });
    }

    const comprobante = receipts[0];

    // Obtener productos del comprobante
    const [productos] = await db.query(`
      SELECT 
        dc.*,
        p.nombre as nombreProducto
      FROM detalle_comprobante dc
      LEFT JOIN producto p ON dc.idProducto = p.idProducto
      WHERE dc.idComprobante = ?
      ORDER BY dc.idDetalle
    `, [id]);

    comprobante.productos = productos;

    res.json(comprobante);
  } catch (error) {
    next(error);
  }
};

// Crear nuevo comprobante
exports.createReceipt = async (req, res, next) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { 
      tipo, 
      subtotal, 
      impuestos, 
      total,
      observaciones,
      nombreCliente,
      documentoCliente,
      idProveedor,
      productos
    } = req.body;

    // Validaciones
    if (!tipo || !total || !productos || productos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios o productos'
      });
    }

    // Generar número de comprobante
    const [numeroResult] = await connection.query(
      'SELECT generar_numero_comprobante(?) as numero',
      [tipo]
    );
    const numeroComprobante = numeroResult[0].numero;

    // Insertar comprobante
    const [comprobanteResult] = await connection.query(`
      INSERT INTO comprobante (
        numeroComprobante,
        tipo,
        subtotal,
        impuestos,
        total,
        observaciones,
        nombreCliente,
        documentoCliente,
        idProveedor,
        idUsuario,
        estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'emitido')
    `, [
      numeroComprobante,
      tipo,
      subtotal,
      impuestos,
      total,
      observaciones || null,
      nombreCliente || null,
      documentoCliente || null,
      idProveedor || null,
      req.user.idUsuario
    ]);

    const idComprobante = comprobanteResult.insertId;

    // Insertar detalle de productos
    for (const producto of productos) {
      await connection.query(`
        INSERT INTO detalle_comprobante (
          idComprobante,
          idProducto,
          nombreProducto,
          cantidad,
          precioUnitario,
          subtotal
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        idComprobante,
        producto.idProducto,
        producto.nombreProducto,
        producto.cantidad,
        producto.precioUnitario,
        producto.subtotal || (producto.cantidad * producto.precioUnitario)
      ]);

      // Si es factura de venta, registrar salida de inventario
      if (tipo === 'factura_venta') {
        // Actualizar inventario
        await connection.query(`
          UPDATE inventario 
          SET cantidad = cantidad - ? 
          WHERE idProducto = ?
        `, [producto.cantidad, producto.idProducto]);

        // Registrar movimiento
        await connection.query(`
          INSERT INTO movimientoinventario (
            idProducto,
            tipo,
            cantidad,
            descripcion,
            idUsuario
          ) VALUES (?, 'salida', ?, ?, ?)
        `, [
          producto.idProducto,
          producto.cantidad,
          `Venta - Comprobante ${numeroComprobante}`,
          req.user.idUsuario
        ]);
      }

      // Si es factura de compra, registrar entrada de inventario
      if (tipo === 'factura_compra') {
        // Actualizar inventario
        await connection.query(`
          UPDATE inventario 
          SET cantidad = cantidad + ? 
          WHERE idProducto = ?
        `, [producto.cantidad, producto.idProducto]);

        // Registrar movimiento
        await connection.query(`
          INSERT INTO movimientoinventario (
            idProducto,
            tipo,
            cantidad,
            descripcion,
            idUsuario
          ) VALUES (?, 'entrada', ?, ?, ?)
        `, [
          producto.idProducto,
          producto.cantidad,
          `Compra - Comprobante ${numeroComprobante}`,
          req.user.idUsuario
        ]);
      }
    }

    await connection.commit();

    console.log(`✅ Comprobante ${numeroComprobante} generado correctamente`);

    res.status(201).json({
      success: true,
      message: 'Comprobante generado correctamente',
      idComprobante: idComprobante,
      numeroComprobante: numeroComprobante
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error al crear comprobante:', error);
    next(error);
  } finally {
    connection.release();
  }
};

// Anular comprobante
exports.anularReceipt = async (req, res, next) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    // Verificar que el comprobante existe y no está anulado
    const [comprobante] = await connection.query(
      'SELECT * FROM comprobante WHERE idComprobante = ?',
      [id]
    );

    if (comprobante.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comprobante no encontrado'
      });
    }

    if (comprobante[0].estado === 'anulado') {
      return res.status(400).json({
        success: false,
        message: 'El comprobante ya está anulado'
      });
    }

    // Anular comprobante
    await connection.query(
      'UPDATE comprobante SET estado = "anulado" WHERE idComprobante = ?',
      [id]
    );

    // Obtener productos del comprobante
    const [productos] = await connection.query(
      'SELECT * FROM detalle_comprobante WHERE idComprobante = ?',
      [id]
    );

    const tipo = comprobante[0].tipo;
    const numeroComprobante = comprobante[0].numeroComprobante;

    // Revertir movimientos de inventario
    for (const producto of productos) {
      if (tipo === 'factura_venta') {
        // Era una venta, devolver stock
        await connection.query(
          'UPDATE inventario SET cantidad = cantidad + ? WHERE idProducto = ?',
          [producto.cantidad, producto.idProducto]
        );

        // Registrar movimiento de anulación
        await connection.query(`
          INSERT INTO movimientoinventario (
            idProducto,
            tipo,
            cantidad,
            descripcion,
            idUsuario
          ) VALUES (?, 'entrada', ?, ?, ?)
        `, [
          producto.idProducto,
          producto.cantidad,
          `Anulación de venta - ${numeroComprobante}`,
          req.user.idUsuario
        ]);
      }

      if (tipo === 'factura_compra') {
        // Era una compra, restar stock
        await connection.query(
          'UPDATE inventario SET cantidad = cantidad - ? WHERE idProducto = ?',
          [producto.cantidad, producto.idProducto]
        );

        // Registrar movimiento de anulación
        await connection.query(`
          INSERT INTO movimientoinventario (
            idProducto,
            tipo,
            cantidad,
            descripcion,
            idUsuario
          ) VALUES (?, 'salida', ?, ?, ?)
        `, [
          producto.idProducto,
          producto.cantidad,
          `Anulación de compra - ${numeroComprobante}`,
          req.user.idUsuario
        ]);
      }
    }

    await connection.commit();

    console.log(`✅ Comprobante ${numeroComprobante} anulado`);

    res.json({
      success: true,
      message: 'Comprobante anulado correctamente'
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// Obtener estadísticas financieras detalladas
exports.getReceiptStats = async (req, res, next) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    // Construir condición de fecha
    let fechaCondition = '';
    const params = [];
    
    if (fechaInicio && fechaFin) {
      fechaCondition = ' AND DATE(fecha) BETWEEN ? AND ?';
      params.push(fechaInicio, fechaFin);
    } else {
      // Por defecto, mes actual
      fechaCondition = ' AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())';
    }

    // Estadísticas generales
    const [general] = await db.query(`
      SELECT 
        COUNT(*) as totalComprobantes,
        COUNT(CASE WHEN estado != 'anulado' THEN 1 END) as comprobantesActivos,
        COUNT(CASE WHEN estado = 'anulado' THEN 1 END) as comprobantesAnulados
      FROM comprobante
      WHERE 1=1 ${fechaCondition}
    `, params);

    // Ventas (Facturas de venta)
    const [ventas] = await db.query(`
      SELECT 
        COUNT(*) as cantidadVentas,
        COALESCE(SUM(CASE WHEN estado != 'anulado' THEN total ELSE 0 END), 0) as totalVentas,
        COALESCE(SUM(CASE WHEN estado != 'anulado' THEN subtotal ELSE 0 END), 0) as subtotalVentas,
        COALESCE(SUM(CASE WHEN estado != 'anulado' THEN impuestos ELSE 0 END), 0) as impuestosVentas
      FROM comprobante
      WHERE tipo = 'factura_venta' ${fechaCondition}
    `, params);

    // Compras (Facturas de compra)
    const [compras] = await db.query(`
      SELECT 
        COUNT(*) as cantidadCompras,
        COALESCE(SUM(CASE WHEN estado != 'anulado' THEN total ELSE 0 END), 0) as totalCompras,
        COALESCE(SUM(CASE WHEN estado != 'anulado' THEN subtotal ELSE 0 END), 0) as subtotalCompras
      FROM comprobante
      WHERE tipo = 'factura_compra' ${fechaCondition}
    `, params);

    // Recibos (Pagos recibidos)
    const [recibos] = await db.query(`
      SELECT 
        COUNT(*) as cantidadRecibos,
        COALESCE(SUM(CASE WHEN estado != 'anulado' THEN total ELSE 0 END), 0) as totalRecibos
      FROM comprobante
      WHERE tipo = 'recibo' ${fechaCondition}
    `, params);

    // Notas de crédito
    const [notasCredito] = await db.query(`
      SELECT 
        COUNT(*) as cantidadNC,
        COALESCE(SUM(CASE WHEN estado != 'anulado' THEN total ELSE 0 END), 0) as totalNC
      FROM comprobante
      WHERE tipo = 'nota_credito' ${fechaCondition}
    `, params);

    // Notas de débito
    const [notasDebito] = await db.query(`
      SELECT 
        COUNT(*) as cantidadND,
        COALESCE(SUM(CASE WHEN estado != 'anulado' THEN total ELSE 0 END), 0) as totalND
      FROM comprobante
      WHERE tipo = 'nota_debito' ${fechaCondition}
    `, params);

    // Calcular utilidades
    const totalVentasNeto = parseFloat(ventas[0].totalVentas || 0);
    const totalComprasNeto = parseFloat(compras[0].totalCompras || 0);
    const totalNotasCredito = parseFloat(notasCredito[0].totalNC || 0);
    const totalNotasDebito = parseFloat(notasDebito[0].totalND || 0);

    // Utilidad bruta = Ventas - Compras
    const utilidadBruta = totalVentasNeto - totalComprasNeto;

    // Utilidad neta = Ventas - Compras - Notas de Crédito + Notas de Débito
    const utilidadNeta = totalVentasNeto - totalComprasNeto - totalNotasCredito + totalNotasDebito;

    // Productos más vendidos en el periodo
    const [topProductos] = await db.query(`
      SELECT 
        dc.nombreProducto,
        SUM(dc.cantidad) as totalVendido,
        SUM(dc.subtotal) as totalGenerado
      FROM detalle_comprobante dc
      INNER JOIN comprobante c ON dc.idComprobante = c.idComprobante
      WHERE c.tipo = 'factura_venta' 
        AND c.estado != 'anulado' ${fechaCondition}
      GROUP BY dc.nombreProducto
      ORDER BY totalVendido DESC
      LIMIT 5
    `, params);

    const response = {
      // General
      totalComprobantes: general[0].totalComprobantes,
      comprobantesActivos: general[0].comprobantesActivos,
      comprobantesAnulados: general[0].comprobantesAnulados,

      // Ventas
      ventas: {
        cantidad: ventas[0].cantidadVentas,
        total: ventas[0].totalVentas,
        subtotal: ventas[0].subtotalVentas,
        impuestos: ventas[0].impuestosVentas
      },

      // Compras
      compras: {
        cantidad: compras[0].cantidadCompras,
        total: compras[0].totalCompras,
        subtotal: compras[0].subtotalCompras
      },

      // Recibos
      recibos: {
        cantidad: recibos[0].cantidadRecibos,
        total: recibos[0].totalRecibos
      },

      // Notas
      notasCredito: {
        cantidad: notasCredito[0].cantidadNC,
        total: notasCredito[0].totalNC
      },
      notasDebito: {
        cantidad: notasDebito[0].cantidadND,
        total: notasDebito[0].totalND
      },

      // Utilidades
      utilidadBruta: utilidadBruta,
      utilidadNeta: utilidadNeta,
      margenUtilidad: totalVentasNeto > 0 ? ((utilidadBruta / totalVentasNeto) * 100).toFixed(2) : 0,

      // Top productos
      topProductos: topProductos,

      // Periodo
      periodo: {
        fechaInicio: fechaInicio || 'Mes actual',
        fechaFin: fechaFin || 'Mes actual'
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    next(error);
  }
};
module.exports = exports;