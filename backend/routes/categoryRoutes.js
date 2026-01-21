const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken } = require('../middleware/authMiddleware');

// Proteger todas las rutas
router.use(verifyToken);

// GET /api/categories - Obtener todas las categorías
router.get('/', categoryController.getAllCategories);

// POST /api/categories - Crear nueva categoría
router.post('/', categoryController.createCategory);

module.exports = router;