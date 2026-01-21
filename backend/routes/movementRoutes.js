const express = require('express');
const router = express.Router();
const movementController = require('../controllers/movementController');
const { verifyToken } = require('../middleware/authMiddleware');

// Proteger todas las rutas
router.use(verifyToken);

// GET /api/movements - Obtener movimientos (con filtros opcionales)
router.get('/', movementController.getAllMovements);

// GET /api/movements/stats - Estadísticas de movimientos
router.get('/stats', movementController.getMovementStats);

// POST /api/movements - Registrar movimiento manual
router.post('/', movementController.createMovement);

module.exports = router;