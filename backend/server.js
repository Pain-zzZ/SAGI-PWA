const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const providerRoutes = require('./routes/providerRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const movementRoutes = require('./routes/movementRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');

// Importar middleware de errores
const errorHandler = require('./middleware/errorHandler');

// Crear aplicación Express
const app = express();

// Middlewares globales
app.use(cors()); // Permitir peticiones desde el frontend
app.use(express.json()); // Parsear JSON en el body
app.use(express.urlencoded({ extended: true }));

const path = require('path');

// Servir archivos estáticos del frontend (css, js, resources)
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/resources', express.static(path.join(__dirname, '../frontend/resources')));
app.use('/html', express.static(path.join(__dirname, '../frontend/html')));




// Servir manifest.json y sw.js desde la raíz del proyecto
app.use(express.static(path.join(__dirname, '..')));

// Ruta principal para cargar la app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/html/index.html'));
});



// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);

// Ruta de prueba
app.get('/api', (req, res) => {
  res.json({
    message: 'API de SAGI funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      providers: '/api/providers',
      dashboard: '/api/dashboard'
    }
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api`);
  console.log(`🔧 Modo: ${process.env.NODE_ENV || 'development'}`);
});