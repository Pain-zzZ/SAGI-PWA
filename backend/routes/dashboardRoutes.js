const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

// Proteger ruta
router.use(verifyToken);

// GET /api/dashboard/stats - Obtener estadísticas del dashboard
router.get('/stats', dashboardController.getStats);

module.exports = router;