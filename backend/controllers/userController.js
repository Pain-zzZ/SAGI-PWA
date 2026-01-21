const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Contraseña por defecto para nuevos usuarios y reseteos
const DEFAULT_PASSWORD = 'SAGI2026';

// Obtener todos los usuarios
exports.getAllUsers = async (req, res, next) => {
  try {
    const [users] = await db.query(`
      SELECT 
        u.idUsuario,
        u.nombre,
        u.correo,
        u.activo,
        u.fechaCreacion,
        u.ultimoAcceso,
        r.nombre as rol,
        r.idRol
      FROM usuario u
      LEFT JOIN rol r ON u.idRol = r.idRol
      ORDER BY u.idUsuario DESC
    `);

    res.json(users);
  } catch (error) {
    next(error);
  }
};

// Obtener un usuario por ID
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [users] = await db.query(`
      SELECT 
        u.idUsuario,
        u.nombre,
        u.correo,
        u.activo,
        u.fechaCreacion,
        u.ultimoAcceso,
        r.nombre as rol,
        r.idRol
      FROM usuario u
      LEFT JOIN rol r ON u.idRol = r.idRol
      WHERE u.idUsuario = ?
    `, [id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json(users[0]);
  } catch (error) {
    next(error);
  }
};

// Crear nuevo usuario
exports.createUser = async (req, res, next) => {
  try {
    const { nombre, correo, idRol } = req.body;

    // Validar campos obligatorios
    if (!nombre || !correo || !idRol) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, correo y rol son obligatorios'
      });
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico no es válido'
      });
    }

    // Verificar que el correo no exista
    const [existing] = await db.query(
      'SELECT idUsuario FROM usuario WHERE correo = ?',
      [correo.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado'
      });
    }

    // Verificar que el rol existe
    const [rol] = await db.query('SELECT idRol FROM rol WHERE idRol = ?', [idRol]);
    if (rol.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El rol seleccionado no es válido'
      });
    }

    // Hashear contraseña por defecto
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Insertar usuario
    const [result] = await db.query(
      `INSERT INTO usuario (nombre, correo, contrasena, idRol, activo) 
       VALUES (?, ?, ?, ?, 1)`,
      [nombre.trim(), correo.trim(), hashedPassword, idRol]
    );

    console.log(`✅ Usuario creado: ${nombre} (${correo}) - ID: ${result.insertId}`);

    res.status(201).json({
      success: true,
      message: `Usuario creado correctamente. Contraseña temporal: ${DEFAULT_PASSWORD}`,
      idUsuario: result.insertId,
      passwordTemporal: DEFAULT_PASSWORD
    });

  } catch (error) {
    next(error);
  }
};

// Actualizar usuario
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, correo, idRol } = req.body;

    // Verificar que el usuario existe
    const [user] = await db.query(
      'SELECT idUsuario, correo FROM usuario WHERE idUsuario = ?',
      [id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Validar campos obligatorios
    if (!nombre || !correo || !idRol) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, correo y rol son obligatorios'
      });
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico no es válido'
      });
    }

    // Verificar que el correo no esté en uso por otro usuario
    if (correo.trim() !== user[0].correo) {
      const [existing] = await db.query(
        'SELECT idUsuario FROM usuario WHERE correo = ? AND idUsuario != ?',
        [correo.trim(), id]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico ya está registrado por otro usuario'
        });
      }
    }

    // Verificar que el rol existe
    const [rol] = await db.query('SELECT idRol FROM rol WHERE idRol = ?', [idRol]);
    if (rol.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El rol seleccionado no es válido'
      });
    }

    // Actualizar usuario
    await db.query(
      `UPDATE usuario 
       SET nombre = ?, correo = ?, idRol = ?
       WHERE idUsuario = ?`,
      [nombre.trim(), correo.trim(), idRol, id]
    );

    console.log(`✏️ Usuario actualizado: ${nombre} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente'
    });

  } catch (error) {
    next(error);
  }
};

// Cambiar estado del usuario (activo/inactivo)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obtener estado actual
    const [user] = await db.query(
      'SELECT idUsuario, nombre, activo FROM usuario WHERE idUsuario = ?',
      [id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const nuevoEstado = user[0].activo === 1 ? 0 : 1;

    // Cambiar estado
    await db.query(
      'UPDATE usuario SET activo = ? WHERE idUsuario = ?',
      [nuevoEstado, id]
    );

    const accion = nuevoEstado === 1 ? 'activado' : 'desactivado';
    console.log(`🔄 Usuario ${accion}: ${user[0].nombre} (ID: ${id})`);

    res.json({
      success: true,
      message: `Usuario ${accion} correctamente`,
      nuevoEstado
    });

  } catch (error) {
    next(error);
  }
};

// Resetear contraseña
exports.resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const [user] = await db.query(
      'SELECT idUsuario, nombre, correo FROM usuario WHERE idUsuario = ?',
      [id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Hashear nueva contraseña temporal
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Actualizar contraseña
    await db.query(
      'UPDATE usuario SET contrasena = ? WHERE idUsuario = ?',
      [hashedPassword, id]
    );

    console.log(`🔑 Contraseña reseteada: ${user[0].nombre} (${user[0].correo})`);

    res.json({
      success: true,
      message: `Contraseña reseteada correctamente. Nueva contraseña temporal: ${DEFAULT_PASSWORD}`,
      passwordTemporal: DEFAULT_PASSWORD
    });

  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas de usuarios
exports.getUserStats = async (req, res, next) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as totalUsuarios,
        SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as usuariosActivos,
        SUM(CASE WHEN activo = 0 THEN 1 ELSE 0 END) as usuariosInactivos,
        SUM(CASE WHEN DATE(fechaCreacion) >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) THEN 1 ELSE 0 END) as nuevosEsteMes
      FROM usuario
    `);

    res.json(stats[0]);
  } catch (error) {
    next(error);
  }
};

// Obtener todos los roles (para el selector)
exports.getAllRoles = async (req, res, next) => {
  try {
    const [roles] = await db.query('SELECT idRol, nombre FROM rol ORDER BY nombre');
    res.json(roles);
  } catch (error) {
    next(error);
  }
};

// Eliminar usuario (lógico - marca como inactivo)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const [user] = await db.query(
      'SELECT idUsuario, nombre FROM usuario WHERE idUsuario = ?',
      [id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Marcar como inactivo (eliminación lógica)
    await db.query(
      'UPDATE usuario SET activo = 0 WHERE idUsuario = ?',
      [id]
    );

    console.log(`🗑️ Usuario "${user[0].nombre}" marcado como inactivo`);

    res.json({
      success: true,
      message: 'Usuario desactivado correctamente'
    });

  } catch (error) {
    next(error);
  }
};