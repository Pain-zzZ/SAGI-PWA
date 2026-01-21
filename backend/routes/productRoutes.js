const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorizeMiddleware');

// Todas las rutas protegidas con JWT
router.use(verifyToken);

// GET /api/products - Obtener todos los productos
router.get('/', authorize('productos:ver'), productController.getAllProducts);

// GET /api/products/:id - Obtener un producto por ID
router.get('/:id', authorize('productos:ver'), productController.getProductById);

// POST /api/products - Crear nuevo producto
router.post('/', authorize('productos:crear'), productController.createProduct);

// PUT /api/products/:id - Actualizar producto
router.put('/:id', authorize('productos:editar'), productController.updateProduct);

// DELETE /api/products/:id - Eliminar producto (lógico)
router.delete('/:id', authorize('productos:eliminar'), productController.deleteProduct);

// PATCH /api/products/:id/reactivate - Reactivar producto  
router.patch('/:id/reactivate', authorize('productos:reactivar'), productController.reactivateProduct);

module.exports = router;