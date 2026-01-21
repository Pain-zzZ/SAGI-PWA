const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorizeMiddleware');

// Todas las rutas protegidas con JWT
router.use(verifyToken);

// GET /api/providers/stats - Obtener estadísticas
router.get('/stats', authorize('proveedores:ver'), providerController.getProviderStats);

// GET /api/providers - Obtener todos los proveedores
router.get('/', authorize('proveedores:ver'), providerController.getAllProviders);

// GET /api/providers/:id - Obtener un proveedor por ID
router.get('/:id', authorize('proveedores:ver'), providerController.getProviderById);

// POST /api/providers - Crear nuevo proveedor
router.post('/', authorize('proveedores:crear'), providerController.createProvider);

// PUT /api/providers/:id - Actualizar proveedor
router.put('/:id', authorize('proveedores:editar'), providerController.updateProvider);

// PATCH /api/providers/:id/toggle-status - Cambiar estado (activo/inactivo)
router.patch('/:id/toggle-status', authorize('proveedores:cambiar_estado'), providerController.toggleProviderStatus);

// DELETE /api/providers/:id - Eliminar proveedor (lógico)
router.delete('/:id', authorize('proveedores:cambiar_estado'), providerController.deleteProvider);

module.exports = router;