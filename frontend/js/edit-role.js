// ===== EDITAR ROL =====
const editRoleForm = document.getElementById("editRoleForm");
const nombreInput = document.getElementById("nombre");
const descripcionInput = document.getElementById("descripcion");
const submitBtn = document.getElementById("submitBtn");
const errorMsg = document.getElementById("error-msg");
const pageTitle = document.getElementById("pageTitle");
const permisosCard = document.getElementById("permisosCard");
const permisosPreview = document.getElementById("permisosPreview");

let rolId = null;
let rolActual = null;

// ========================================
// OBTENER ID DEL ROL DESDE LA URL
// ========================================
function obtenerIdRolDeURL() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  
  if (!id) {
    showNotification('No se especificó un rol para editar', 'error');
    setTimeout(() => {
      window.location.href = 'roles.html';
    }, 2000);
    return null;
  }
  
  return parseInt(id);
}

// ========================================
// CARGAR DATOS DEL ROL
// ========================================
async function cargarDatosRol() {
  try {
    // Mostrar estado de carga
    nombreInput.value = 'Cargando...';
    descripcionInput.value = 'Cargando datos del rol...';
    submitBtn.disabled = true;

    const data = await apiRequest(`/roles/${rolId}`);
    rolActual = data;

    // Actualizar título de la página
    pageTitle.textContent = `✏️ Editar Rol: ${data.nombre}`;

    // Llenar el formulario
    nombreInput.value = data.nombre;
    descripcionInput.value = data.descripcion || '';

    // Habilitar formulario
    submitBtn.disabled = false;

    // Mostrar permisos
    mostrarPermisos(data);

    console.log('✅ Rol cargado:', data);
  } catch (error) {
    console.error('Error al cargar rol:', error);
    showNotification('Error al cargar los datos del rol', 'error');
    
    setTimeout(() => {
      window.location.href = 'roles.html';
    }, 2000);
  }
}

// ========================================
// MOSTRAR PERMISOS DEL ROL (SOLO LECTURA)
// ========================================
function mostrarPermisos(rol) {
  permisosCard.style.display = 'block';
  
  if (rol.tieneAccesoTotal) {
    permisosPreview.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <div style="font-size: 3rem; margin-bottom: 10px;">⭐</div>
        <h3 style="color: #9c27b0; margin: 0;">ACCESO TOTAL AL SISTEMA</h3>
        <p style="color: #666; margin-top: 10px;">
          Este rol tiene permisos completos sobre todos los módulos
        </p>
      </div>
    `;
    return;
  }

  // Organizar permisos por módulo
  const permisosPorModulo = organizarPermisos(rol.permisos);
  
  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">';
  
  for (const [modulo, permisos] of Object.entries(permisosPorModulo)) {
    html += `
      <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0;">
        <h4 style="margin: 0 0 10px 0; color: #1976d2; font-size: 0.95rem;">
          ${obtenerNombreModulo(modulo)}
        </h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 0.85rem; color: #555;">
          ${permisos.map(p => `<li style="margin: 5px 0;">${obtenerNombrePermiso(p)}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  html += '</div>';
  
  if (Object.keys(permisosPorModulo).length === 0) {
    html = '<p style="text-align: center; color: #666;">Este rol no tiene permisos asignados</p>';
  }
  
  permisosPreview.innerHTML = html;
}

// ========================================
// VALIDAR FORMULARIO
// ========================================
function validarFormulario() {
  errorMsg.style.display = 'none';
  
  const nombre = nombreInput.value.trim();
  
  // Validar nombre vacío
  if (!nombre) {
    mostrarError('El nombre del rol es obligatorio');
    nombreInput.focus();
    return false;
  }
  
  // Validar longitud del nombre
  if (nombre.length < 3) {
    mostrarError('El nombre debe tener al menos 3 caracteres');
    nombreInput.focus();
    return false;
  }
  
  if (nombre.length > 50) {
    mostrarError('El nombre no puede tener más de 50 caracteres');
    nombreInput.focus();
    return false;
  }
  
  // Validar longitud de descripción
  const descripcion = descripcionInput.value.trim();
  if (descripcion.length > 500) {
    mostrarError('La descripción no puede tener más de 500 caracteres');
    descripcionInput.focus();
    return false;
  }
  
  return true;
}

// ========================================
// MOSTRAR ERROR
// ========================================
function mostrarError(mensaje) {
  errorMsg.textContent = mensaje;
  errorMsg.style.display = 'block';
  errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ========================================
// GUARDAR CAMBIOS
// ========================================
async function guardarCambios(e) {
  e.preventDefault();
  
  if (!validarFormulario()) {
    return;
  }
  
  const nombre = nombreInput.value.trim();
  const descripcion = descripcionInput.value.trim();
  
  // Verificar si hubo cambios
  if (nombre === rolActual.nombre && descripcion === (rolActual.descripcion || '')) {
    showNotification('No se detectaron cambios', 'info');
    return;
  }
  
  // Confirmar cambios
  if (!confirm(`¿Estás seguro de actualizar el rol "${rolActual.nombre}"?\n\nEsto afectará a todos los usuarios que tengan este rol asignado.`)) {
    return;
  }
  
  try {
    // Deshabilitar botón mientras se procesa
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Guardando...';
    
    const datosActualizados = {
      nombre: nombre,
      descripcion: descripcion || null
    };
    
    await apiRequest(`/roles/${rolId}`, {
      method: 'PUT',
      body: JSON.stringify(datosActualizados)
    });
    
    showNotification('✅ Rol actualizado correctamente', 'success');
    
    // Redirigir después de un breve delay
    setTimeout(() => {
      window.location.href = 'roles.html';
    }, 1500);
    
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    showNotification('Error al actualizar el rol', 'error');
    
    // Restaurar botón
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="btn-icon">💾</span> Guardar Cambios';
  }
}

// ========================================
// UTILIDADES
// ========================================
function organizarPermisos(permisos) {
  if (!permisos || permisos.length === 0) return {};
  if (permisos.includes('*')) return {};
  
  const porModulo = {};
  permisos.forEach(permiso => {
    const [modulo] = permiso.split(':');
    if (!porModulo[modulo]) {
      porModulo[modulo] = [];
    }
    porModulo[modulo].push(permiso);
  });
  return porModulo;
}

function obtenerNombreModulo(modulo) {
  const nombres = {
    'dashboard': '🏠 Dashboard',
    'productos': '📦 Productos',
    'movimientos': '🔄 Movimientos',
    'proveedores': '🤝 Proveedores',
    'comprobantes': '🧾 Comprobantes',
    'usuarios': '👥 Usuarios',
    'roles': '🔐 Roles',
    'reportes': '📊 Reportes'
  };
  return nombres[modulo] || modulo;
}

function obtenerNombrePermiso(permiso) {
  const [, accion] = permiso.split(':');
  const acciones = {
    'ver': '👁️ Ver',
    'crear': '➕ Crear',
    'editar': '✏️ Editar',
    'eliminar': '🗑️ Eliminar',
    'reactivar': '♻️ Reactivar',
    'cambiar_estado': '🔄 Cambiar estado',
    'resetear_password': '🔑 Resetear contraseña',
    'generar': '📄 Generar'
  };
  return acciones[accion] || accion;
}

// ========================================
// EVENTOS
// ========================================
editRoleForm.addEventListener('submit', guardarCambios);

// Limpiar mensaje de error al escribir
nombreInput.addEventListener('input', () => {
  errorMsg.style.display = 'none';
});

descripcionInput.addEventListener('input', () => {
  errorMsg.style.display = 'none';
});

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  rolId = obtenerIdRolDeURL();
  
  if (rolId) {
    cargarDatosRol();
  }
});