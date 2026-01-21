const db = require('../config/database');

// Obtener todas las categorías
exports.getAllCategories = async (req, res, next) => {
  try {
    const [categories] = await db.query(`
      SELECT 
        idCategoria,
        nombre,
        descripcion
      FROM categoria
      ORDER BY nombre ASC
    `);

    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// Crear nueva categoría
exports.createCategory = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es obligatorio'
      });
    }

    const [result] = await db.query(
      'INSERT INTO categoria (nombre, descripcion) VALUES (?, ?)',
      [nombre, descripcion || null]
    );

    res.status(201).json({
      success: true,
      message: 'Categoría creada correctamente',
      idCategoria: result.insertId
    });

  } catch (error) {
    next(error);
  }
};