const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { verifyToken } = require('../middleware/authMiddleware');

// Todas las rutas protegidas con JWT
router.use(verifyToken);

// GET /api/roles/stats - Obtener estadísticas
router.get('/stats', roleController.getRoleStats);

// GET /api/roles/permissions - Obtener todos los permisos disponibles
router.get('/permissions', roleController.getAllPermissions);

// GET /api/roles - Obtener todos los roles
router.get('/', roleController.getAllRoles);

// GET /api/roles/:id - Obtener un rol por ID con usuarios
router.get('/:id', roleController.getRoleById);

// PUT /api/roles/:id - Actualizar rol
router.put('/:id', roleController.updateRole);

// PATCH /api/roles/:id/toggle-status - Cambiar estado (activo/inactivo)
router.patch('/:id/toggle-status', roleController.toggleRoleStatus);

module.exports = router;