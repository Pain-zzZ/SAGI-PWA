const db = require('../config/database');

// Obtener todos los movimientos (con filtros opcionales)
exports.getAllMovements = async (req, res, next) => {
  try {
    const { tipo, idProducto, fechaInicio, fechaFin } = req.query;
    
    let query = `
      SELECT 
        m.idMovimiento,
        m.tipo,
        m.cantidad,
        m.descripcion,
        m.fecha,
        p.idProducto,
        p.nombre as nombreProducto,
        u.nombre as nombreUsuario,
        u.correo as correoUsuario
      FROM movimientoinventario m
      LEFT JOIN producto p ON m.idProducto = p.idProducto
      LEFT JOIN usuario u ON m.idUsuario = u.idUsuario
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filtros opcionales
    if (tipo) {
      query += ' AND m.tipo = ?';
      params.push(tipo);
    }
    
    if (idProducto) {
      query += ' AND m.idProducto = ?';
      params.push(idProducto);
    }
    
    if (fechaInicio) {
      query += ' AND m.fecha >= ?';
      params.push(fechaInicio);
    }
    
    if (fechaFin) {
      query += ' AND m.fecha <= ?';
      params.push(fechaFin);
    }
    
    query += ' ORDER BY m.fecha DESC LIMIT 100';
    
    const [movements] = await db.query(query, params);
    
    res.json(movements);
  } catch (error) {
    next(error);
  }
};

// Registrar movimiento manual de entrada/salida
exports.createMovement = async (req, res, next) => {
  const connection = await db.getConnection();
  
  try {
    const { idProducto, tipo, cantidad, descripcion } = req.body;
    
    // Validar
    if (!idProducto || !tipo || !cantidad) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios'
      });
    }
    
    if (!['entrada', 'salida', 'ajuste'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de movimiento inválido'
      });
    }
    
    await connection.beginTransaction();
    
    // Obtener stock actual
    const [inventario] = await connection.query(
      'SELECT cantidad FROM inventario WHERE idProducto = ?',
      [idProducto]
    );
    
    if (inventario.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado en inventario'
      });
    }
    
    const stockActual = inventario[0].cantidad;
    let nuevoStock = stockActual;
    
    // Calcular nuevo stock
    if (tipo === 'entrada' || tipo === 'ajuste') {
      nuevoStock = stockActual + cantidad;
    } else if (tipo === 'salida') {
      if (stockActual < cantidad) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente. Actual: ${stockActual}, solicitado: ${cantidad}`
        });
      }
      nuevoStock = stockActual - cantidad;
    }
    
    // Actualizar inventario
    await connection.query(
      'UPDATE inventario SET cantidad = ? WHERE idProducto = ?',
      [nuevoStock, idProducto]
    );
    
    // Registrar movimiento
    await connection.query(
      `INSERT INTO movimientoinventario (idProducto, tipo, cantidad, descripcion, idUsuario)
       VALUES (?, ?, ?, ?, ?)`,
      [idProducto, tipo, cantidad, descripcion || `Movimiento manual: ${tipo}`, req.user.idUsuario]
    );
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Movimiento registrado correctamente',
      stockAnterior: stockActual,
      stockNuevo: nuevoStock
    });
    
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// Obtener estadísticas de movimientos
exports.getMovementStats = async (req, res, next) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as totalMovimientos,
        SUM(CASE WHEN tipo = 'entrada' THEN 1 ELSE 0 END) as totalEntradas,
        SUM(CASE WHEN tipo = 'salida' THEN 1 ELSE 0 END) as totalSalidas,
        SUM(CASE WHEN DATE(fecha) = CURDATE() THEN 1 ELSE 0 END) as movimientosHoy
      FROM movimientoinventario
    `);
    
    res.json(stats[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = exports;