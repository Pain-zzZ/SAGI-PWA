// =========================================
// CONFIGURACIÓN DE PERMISOS POR ROL
// =========================================

const PERMISSIONS = {
  // ROL 1: Administrador - Acceso total
  1: {
    nombre: 'Administrador',
    permisos: ['*'], // Comodín: todos los permisos
    descripcion: 'Acceso completo al sistema'
  },

  // ROL 2: Gerente - Gestión de inventario
  2: {
    nombre: 'Gerente',
    permisos: [
      // Dashboard
      'dashboard:ver',
      
      // Productos
      'productos:ver',
      'productos:crear',
      'productos:editar',
      'productos:eliminar',
      'productos:reactivar',
      
      // Movimientos
      'movimientos:ver',
      'movimientos:crear',
      
      // Proveedores
      'proveedores:ver',
      'proveedores:crear',
      'proveedores:editar',
      'proveedores:cambiar_estado',
      
      // Comprobantes
      'comprobantes:ver',
      'comprobantes:generar',
      
      // Reportes
      'reportes:ver'
    ],
    descripcion: 'Gestión completa de inventario y reportes'
  },

  // ROL 3: Operador - Operaciones básicas
  3: {
    nombre: 'Operador',
    permisos: [
      // Dashboard
      'dashboard:ver',
      
      // Productos (solo lectura)
      'productos:ver',
      
      // Movimientos
      'movimientos:ver',
      'movimientos:crear',
      
      // Proveedores (solo lectura)
      'proveedores:ver',
      
      // Comprobantes
      'comprobantes:ver'
    ],
    descripcion: 'Registro de movimientos y consulta de información'
  },

  // ROL 4: Visualizador - Solo lectura
  4: {
    nombre: 'Visualizador',
    permisos: [
      // Dashboard
      'dashboard:ver',
      
      // Productos (solo lectura)
      'productos:ver',
      
      // Movimientos (solo lectura)
      'movimientos:ver',
      
      // Proveedores (solo lectura)
      'proveedores:ver',
      
      // Comprobantes (solo lectura)
      'comprobantes:ver',
      
      // Reportes (solo lectura)
      'reportes:ver'
    ],
    descripcion: 'Solo consulta de información, sin modificaciones'
  }
};

// =========================================
// FUNCIÓN PARA VERIFICAR PERMISOS
// =========================================

/**
 * Verifica si un rol tiene un permiso específico
 * @param {number} idRol - ID del rol a verificar
 * @param {string} permiso - Permiso a verificar (ej: 'productos:crear')
 * @returns {boolean} - true si tiene el permiso, false si no
 */
function tienePermiso(idRol, permiso) {
  const rol = PERMISSIONS[idRol];
  
  if (!rol) {
    console.warn(`⚠️ Rol ${idRol} no encontrado en configuración de permisos`);
    return false;
  }

  // Administrador tiene todos los permisos
  if (rol.permisos.includes('*')) {
    return true;
  }

  // Verificar permiso específico
  return rol.permisos.includes(permiso);
}

/**
 * Obtiene todos los permisos de un rol
 * @param {number} idRol - ID del rol
 * @returns {array} - Array de permisos
 */
function obtenerPermisos(idRol) {
  const rol = PERMISSIONS[idRol];
  
  if (!rol) {
    return [];
  }

  return rol.permisos;
}

/**
 * Obtiene información completa del rol
 * @param {number} idRol - ID del rol
 * @returns {object} - Objeto con información del rol
 */
function obtenerInfoRol(idRol) {
  return PERMISSIONS[idRol] || null;
}

/**
 * Obtiene todos los permisos del sistema organizados por módulo
 * @returns {object} - Objeto con permisos organizados
 */
function obtenerTodosLosPermisos() {
  return {
    dashboard: [
      { codigo: 'dashboard:ver', nombre: 'Ver dashboard' }
    ],
    productos: [
      { codigo: 'productos:ver', nombre: 'Ver productos' },
      { codigo: 'productos:crear', nombre: 'Crear productos' },
      { codigo: 'productos:editar', nombre: 'Editar productos' },
      { codigo: 'productos:eliminar', nombre: 'Eliminar productos' },
      { codigo: 'productos:reactivar', nombre: 'Reactivar productos' }
    ],
    movimientos: [
      { codigo: 'movimientos:ver', nombre: 'Ver movimientos' },
      { codigo: 'movimientos:crear', nombre: 'Crear movimientos' }
    ],
    proveedores: [
      { codigo: 'proveedores:ver', nombre: 'Ver proveedores' },
      { codigo: 'proveedores:crear', nombre: 'Crear proveedores' },
      { codigo: 'proveedores:editar', nombre: 'Editar proveedores' },
      { codigo: 'proveedores:cambiar_estado', nombre: 'Activar/Desactivar proveedores' }
    ],
    comprobantes: [
      { codigo: 'comprobantes:ver', nombre: 'Ver comprobantes' },
      { codigo: 'comprobantes:generar', nombre: 'Generar comprobantes' }
    ],
    usuarios: [
      { codigo: 'usuarios:ver', nombre: 'Ver usuarios' },
      { codigo: 'usuarios:crear', nombre: 'Crear usuarios' },
      { codigo: 'usuarios:editar', nombre: 'Editar usuarios' },
      { codigo: 'usuarios:cambiar_estado', nombre: 'Activar/Desactivar usuarios' },
      { codigo: 'usuarios:resetear_password', nombre: 'Resetear contraseñas' }
    ],
    roles: [
      { codigo: 'roles:ver', nombre: 'Ver roles' },
      { codigo: 'roles:editar', nombre: 'Editar roles' }
    ],
    reportes: [
      { codigo: 'reportes:ver', nombre: 'Ver reportes' }
    ]
  };
}

module.exports = {
  PERMISSIONS,
  tienePermiso,
  obtenerPermisos,
  obtenerInfoRol,
  obtenerTodosLosPermisos
};