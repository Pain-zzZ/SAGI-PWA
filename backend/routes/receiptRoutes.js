const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorizeMiddleware');

// Proteger todas las rutas
router.use(verifyToken);

// GET /api/receipts - Obtener todos los comprobantes
router.get('/', authorize('comprobantes:ver'), receiptController.getAllReceipts);

// GET /api/receipts/stats - Estadísticas
router.get('/stats', authorize('comprobantes:ver'), receiptController.getReceiptStats);

// GET /api/receipts/:id - Obtener un comprobante por ID
router.get('/:id', receiptController.getReceiptById);

// POST /api/receipts - Crear nuevo comprobante
router.post('/', authorize('comprobantes:crear'), receiptController.createReceipt);

// PATCH /api/receipts/:id/anular - Anular comprobante
router.patch('/:id/anular', authorize('comprobantes:anular'), receiptController.anularReceipt);

module.exports = router;