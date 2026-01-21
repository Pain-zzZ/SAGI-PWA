const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorizeMiddleware');

// Todas las rutas protegidas con JWT
router.use(verifyToken);

// GET /api/users/stats - Obtener estadísticas
router.get('/stats', authorize('usuarios:ver'), userController.getUserStats);

// GET /api/users/roles - Obtener todos los roles
router.get('/roles', authorize('roles:ver'), userController.getAllRoles);

// GET /api/users - Obtener todos los usuarios
router.get('/', authorize('usuarios:ver'), userController.getAllUsers);

// GET /api/users/:id - Obtener un usuario por ID
router.get('/:id', authorize('usuarios:ver'), userController.getUserById);

// POST /api/users - Crear nuevo usuario
router.post('/', authorize('usuarios:crear'), userController.createUser);

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', authorize('usuarios:ver'), userController.updateUser);

// PATCH /api/users/:id/toggle-status - Cambiar estado (activo/inactivo)
router.patch('/:id/toggle-status', authorize('usuarios:ver'), userController.toggleUserStatus);

// PATCH /api/users/:id/reset-password - Resetear contraseña
router.patch('/:id/reset-password', authorize('usuarios:ver'), userController.resetPassword);

// DELETE /api/users/:id - Eliminar usuario (lógico)
router.delete('/:id', authorize('usuarios:ver'), userController.deleteUser);

module.exports = router;
