const db = require('../config/database');
const { obtenerPermisos, obtenerInfoRol, obtenerTodosLosPermisos } = require('../config/permissions');

// Obtener todos los roles
exports.getAllRoles = async (req, res, next) => {
  try {
    const [roles] = await db.query(`
      SELECT 
        r.idRol,
        r.nombre,
        r.descripcion,
        r.activo,
        COUNT(u.idUsuario) as totalUsuarios
      FROM rol r
      LEFT JOIN usuario u ON r.idRol = u.idRol
      GROUP BY r.idRol
      ORDER BY r.idRol ASC
    `);

    // Agregar permisos a cada rol
    const rolesConPermisos = roles.map(rol => ({
      ...rol,
      permisos: obtenerPermisos(rol.idRol),
      tieneAccesoTotal: obtenerPermisos(rol.idRol).includes('*')
    }));

    res.json(rolesConPermisos);
  } catch (error) {
    next(error);
  }
};

// Obtener un rol por ID con usuarios asignados
exports.getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obtener información del rol
    const [roles] = await db.query(`
      SELECT 
        r.idRol,
        r.nombre,
        r.descripcion,
        r.activo
      FROM rol r
      WHERE r.idRol = ?
    `, [id]);

    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    const rol = roles[0];

    // Obtener usuarios con este rol
    const [usuarios] = await db.query(`
      SELECT 
        idUsuario,
        nombre,
        correo,
        activo
      FROM usuario
      WHERE idRol = ?
      ORDER BY nombre ASC
    `, [id]);

    // Obtener permisos del rol
    const infoRol = obtenerInfoRol(parseInt(id));
    const permisos = obtenerPermisos(parseInt(id));

    res.json({
      ...rol,
      permisos,
      tieneAccesoTotal: permisos.includes('*'),
      descripcionPermisos: infoRol?.descripcion || '',
      usuarios
    });

  } catch (error) {
    next(error);
  }
};

// Actualizar rol (solo nombre y descripción)
exports.updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    // Verificar que el rol existe
    const [role] = await db.query(
      'SELECT idRol FROM rol WHERE idRol = ?',
      [id]
    );

    if (role.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Validar campos obligatorios
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre del rol es obligatorio'
      });
    }

    // Actualizar rol
    await db.query(
      'UPDATE rol SET nombre = ?, descripcion = ? WHERE idRol = ?',
      [nombre.trim(), descripcion?.trim() || null, id]
    );

    console.log(`✏️ Rol actualizado: ${nombre} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Rol actualizado correctamente'
    });

  } catch (error) {
    next(error);
  }
};

// Cambiar estado del rol (activo/inactivo)
exports.toggleRoleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obtener estado actual
    const [role] = await db.query(
      'SELECT idRol, nombre, activo FROM rol WHERE idRol = ?',
      [id]
    );

    if (role.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    const nuevoEstado = role[0].activo === 1 ? 0 : 1;

    // No permitir desactivar el rol Administrador
    if (id === '1' && nuevoEstado === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede desactivar el rol de Administrador'
      });
    }

    // Cambiar estado
    await db.query(
      'UPDATE rol SET activo = ? WHERE idRol = ?',
      [nuevoEstado, id]
    );

    const accion = nuevoEstado === 1 ? 'activado' : 'desactivado';
    console.log(`🔄 Rol ${accion}: ${role[0].nombre} (ID: ${id})`);

    res.json({
      success: true,
      message: `Rol ${accion} correctamente`,
      nuevoEstado
    });

  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas de roles
exports.getRoleStats = async (req, res, next) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as totalRoles,
        SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as rolesActivos,
        (SELECT COUNT(*) FROM usuario) as totalUsuarios
      FROM rol
    `);

    // Obtener distribución de usuarios por rol
    const [distribucion] = await db.query(`
      SELECT 
        r.nombre as rol,
        COUNT(u.idUsuario) as cantidad
      FROM rol r
      LEFT JOIN usuario u ON r.idRol = u.idRol
      GROUP BY r.idRol, r.nombre
      ORDER BY cantidad DESC
    `);

    res.json({
      ...stats[0],
      distribucion
    });
  } catch (error) {
    next(error);
  }
};

// Obtener todos los permisos disponibles organizados
exports.getAllPermissions = async (req, res, next) => {
  try {
    const permisos = obtenerTodosLosPermisos();
    res.json(permisos);
  } catch (error) {
    next(error);
  }
};