const db = require('../config/database');

// Obtener estadísticas para el dashboard
exports.getStats = async (req, res, next) => {
  try {
    // Total de productos
    const [totalProducts] = await db.query(
      'SELECT COUNT(*) as total FROM producto WHERE activo = 1'
    );

    // Productos con stock bajo (activos y con cantidad <= stockMinimo)
    const [lowStock] = await db.query(`
      SELECT COUNT(*) as total 
      FROM producto p
      LEFT JOIN inventario i ON p.idProducto = i.idProducto
      WHERE p.activo = 1 
        AND COALESCE(i.cantidad, 0) <= p.stockMinimo
        AND COALESCE(i.cantidad, 0) > 0
    `);

    // Movimientos de hoy
    const [todayMovements] = await db.query(`
      SELECT COUNT(*) as total 
      FROM movimientoinventario 
      WHERE DATE(fecha) = CURDATE()
    `);

    // Total de proveedores activos
    const [totalProviders] = await db.query(
      'SELECT COUNT(*) as total FROM proveedor WHERE activo = 1'
    );

    res.json({
      totalProducts: totalProducts[0].total,
      lowStock: lowStock[0].total,
      todayMovements: todayMovements[0].total,
      totalProviders: totalProviders[0].total
    });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas del dashboard:', error);
    next(error);
  }
};