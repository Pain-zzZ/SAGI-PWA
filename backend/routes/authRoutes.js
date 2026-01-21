const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/login - Iniciar sesión
router.post('/login', authController.login);

// POST /api/auth/register - Registrar usuario (opcional)
router.post('/register', authController.register);

module.exports = router;