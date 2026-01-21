const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Login - Iniciar sesión
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son obligatorios'
      });
    }

    // Buscar usuario en la base de datos
    const [users] = await db.query(
      `SELECT u.*, r.nombre as nombreRol 
       FROM usuario u 
       LEFT JOIN rol r ON u.idRol = r.idRol 
       WHERE u.correo = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    const user = users[0];

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.contrasena);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    // ACTUALIZAR ÚLTIMO ACCESO
    await db.query(
      'UPDATE usuario SET ultimoAcceso = NOW() WHERE idUsuario = ?',
      [user.idUsuario]
    );

    console.log(`✅ Login exitoso: ${user.nombre} (${user.correo}) - Último acceso actualizado`);


    // Generar token JWT
    const token = jwt.sign(
      { 
        idUsuario: user.idUsuario, 
        correo: user.correo, 
        idRol: user.idRol 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Responder con token y datos del usuario
    res.json({
      success: true,
      token,
      user: {
        idUsuario: user.idUsuario,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.nombreRol || 'Sin rol'
      }
    });

  } catch (error) {
    next(error);
  }
};

// Register - Registrar nuevo usuario
exports.register = async (req, res, next) => {
  try {
    const { nombre, correo, contrasena, idRol } = req.body;

    // Validar campos
    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
    }

    // Verificar si el correo ya existe
    const [existingUsers] = await db.query(
      'SELECT idUsuario FROM usuario WHERE correo = ?',
      [correo]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El correo ya está registrado'
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Insertar usuario
    const [result] = await db.query(
      'INSERT INTO usuario (nombre, correo, contrasena, idRol) VALUES (?, ?, ?, ?)',
      [nombre, correo, hashedPassword, idRol || 1]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      idUsuario: result.insertId
    });

  } catch (error) {
    next(error);
  }
};