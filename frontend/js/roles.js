// ===== VER ROLES Y PERMISOS =====
const rolesTableBody = document.getElementById("rolesTableBody");
const editarBtn = document.getElementById("editarBtn");
const eliminarBtn = document.getElementById("eliminarBtn");
const reactivarBtn = document.getElementById("reactivarBtn");
const verDetalleBtn = document.getElementById("verDetalleBtn");
const refreshBtn = document.getElementById("refreshBtn");

let roles = [];
let rolesFiltrados = [];
let rolSeleccionado = null;

// ========================================
// CARGAR ROLES
// ========================================
async function cargarRoles() {
  try {
    if (rolesTableBody) {
      rolesTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando roles...</td></tr>';
    }
    
    const data = await apiRequest('/roles');
    roles = data;
    rolesFiltrados = data;

    // Cargar estadísticas
    await cargarEstadisticasRoles();

    if (roles.length === 0) {
      if (rolesTableBody) {
        rolesTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay roles registrados</td></tr>';
      }
      return;
    }

    renderRoles(rolesFiltrados);
  } catch (error) {
    console.error('Error al cargar roles:', error);
    if (rolesTableBody) {
      rolesTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">Error al cargar roles</td></tr>';
    }
    showNotification('Error al cargar roles', 'error');
  }
}

// ========================================
// CARGAR ESTADÍSTICAS
// ========================================
async function cargarEstadisticasRoles() {
  try {
    const stats = await apiRequest('/roles/stats');
    
    const totalRolesEl = document.getElementById('totalRoles');
    const rolesActivosEl = document.getElementById('rolesActivos');
    const totalUsuariosEl = document.getElementById('totalUsuarios');
    const rolMasUsadoEl = document.getElementById('rolMasUsado');
    
    if (totalRolesEl) totalRolesEl.textContent = stats.totalRoles || 0;
    if (rolesActivosEl) rolesActivosEl.textContent = stats.rolesActivos || 0;
    if (totalUsuariosEl) totalUsuariosEl.textContent = stats.totalUsuarios || 0;
    
    // Rol más usado
    if (stats.distribucion && stats.distribucion.length > 0) {
      const rolTop = stats.distribucion[0];
      if (rolMasUsadoEl) rolMasUsadoEl.textContent = rolTop.rol;
    }

    // Renderizar gráfico de distribución
    renderDistribucionChart(stats.distribucion);
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

// ========================================
// RENDERIZAR ROLES
// ========================================
function renderRoles(items) {
  if (!rolesTableBody) return;
  
  rolesTableBody.innerHTML = "";

  if (items.length === 0) {
    rolesTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay roles</td></tr>';
    const countEl = document.getElementById('countRoles');
    if (countEl) countEl.textContent = '0';
    return;
  }

  items.forEach((rol, i) => {
    const tr = document.createElement("tr");
    tr.dataset.index = i;
    tr.dataset.id = rol.idRol;
    tr.style.cursor = "pointer";

    // Badge de estado
    const estadoBadge = rol.activo === 1 
      ? '<span class="badge success"> Activo</span>'
      : '<span class="badge danger"> Inactivo</span>';

    // Badge de permisos
    const permisosBadge = rol.tieneAccesoTotal
      ? '<span class="badge" style="background: #9c27b0; color: white;">⭐ Todos</span>'
      : `<span class="badge" style="background: #2196f3; color: white;">${rol.permisos.length} permisos</span>`;

    tr.innerHTML = `
      <td style="text-align: center;">
        <input 
          type="radio" 
          name="rolSeleccionado" 
          value="${rol.idRol}"
        />
      </td>
      <td>${rol.idRol}</td>
      <td><strong>${rol.nombre}</strong></td>
      <td style="max-width: 400px;">${rol.descripcion || '-'}</td>
      <td style="text-align: center;">${rol.totalUsuarios || 0}</td>
      <td style="text-align: center;">${permisosBadge}</td>
      <td style="text-align: center;">${estadoBadge}</td>
    `;

    rolesTableBody.appendChild(tr);

    // Selección con click en la fila o radio button
    const radio = tr.querySelector('input[type="radio"]');
    
    tr.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') {
        radio.checked = true;
      }
      seleccionarRol(rol.idRol);
    });

    radio.addEventListener('change', () => {
      seleccionarRol(rol.idRol);
    });
  });

  const countEl = document.getElementById('countRoles');
  if (countEl) countEl.textContent = items.length;
}

// ========================================
// SELECCIONAR ROL
// ========================================
function seleccionarRol(id) {
  rolSeleccionado = roles.find(r => r.idRol === id);
  
  if (!rolSeleccionado) return;
  
  // Resaltar fila
  if (rolesTableBody) {
    rolesTableBody.querySelectorAll('tr').forEach(tr => {
      tr.style.backgroundColor = '';
    });
    
    const filaSeleccionada = rolesTableBody.querySelector(`tr[data-id="${id}"]`);
    if (filaSeleccionada) {
      filaSeleccionada.style.backgroundColor = '#e3f2fd';
    }
  }
  
  // Habilitar botones
  if (editarBtn) editarBtn.disabled = false;
  if (eliminarBtn) eliminarBtn.disabled = false;
  if (reactivarBtn) reactivarBtn.disabled = false;
  if (verDetalleBtn) verDetalleBtn.disabled = false;
  
  console.log('✅ Rol seleccionado:', rolSeleccionado.nombre);
  actualizarBotonesAccionRoles();
}

// ========================================
// ACTUALIZAR VISIBILIDAD DE BOTONES
// ========================================
function actualizarBotonesAccionRoles() {
  if (!rolSeleccionado) return;
  
  if (rolSeleccionado.activo === 0) {
    // Si está inactivo, mostrar botón de reactivar
    if (editarBtn) editarBtn.style.display = 'inline-block';
    if (eliminarBtn) eliminarBtn.style.display = 'none';
    if (reactivarBtn) reactivarBtn.style.display = 'inline-block';
  } else {
    // Si está activo, mostrar editar y eliminar
    if (editarBtn) editarBtn.style.display = 'inline-block';
    if (eliminarBtn) {
      // No mostrar eliminar para Administrador
      eliminarBtn.style.display = rolSeleccionado.idRol === 1 ? 'none' : 'inline-block';
    }
    if (reactivarBtn) reactivarBtn.style.display = 'none';
  }
}

// ========================================
// DESHABILITAR BOTONES
// ========================================
function deshabilitarBotones() {
  if (editarBtn) editarBtn.disabled = true;
  if (eliminarBtn) eliminarBtn.disabled = true;
  if (reactivarBtn) reactivarBtn.disabled = true;
  if (verDetalleBtn) verDetalleBtn.disabled = true;
}

// ========================================
// EDITAR ROL
// ========================================
function editarRol() {
  if (!rolSeleccionado) {
    showNotification('Selecciona un rol primero', 'warning');
    return;
  }
  window.location.href = `edit-role.html?id=${rolSeleccionado.idRol}`;
}

// ========================================
// ELIMINAR ROL (DESACTIVAR)
// ========================================
async function eliminarRol() {
  if (!rolSeleccionado) {
    showNotification('Selecciona un rol primero', 'warning');
    return;
  }

  // No permitir desactivar Administrador
  if (rolSeleccionado.idRol === 1) {
    showNotification('No se puede desactivar el rol de Administrador', 'error');
    return;
  }

  if (!confirm(`¿Estás seguro de desactivar el rol "${rolSeleccionado.nombre}"?\n\nLos usuarios con este rol no podrán acceder al sistema hasta que se reactive.`)) {
    return;
  }

  try {
    await apiRequest(`/roles/${rolSeleccionado.idRol}/toggle-status`, { 
      method: 'PATCH' 
    });
    
    showNotification('Rol desactivado correctamente', 'success');
    rolSeleccionado = null;
    deshabilitarBotones();
    cargarRoles();
  } catch (error) {
    console.error('Error al desactivar rol:', error);
    showNotification('Error al desactivar rol', 'error');
  }
}

// ========================================
// REACTIVAR ROL
// ========================================
async function reactivarRol() {
  if (!rolSeleccionado) {
    showNotification('Selecciona un rol primero', 'warning');
    return;
  }

  if (!confirm(`¿Reactivar el rol "${rolSeleccionado.nombre}"?`)) {
    return;
  }

  try {
    await apiRequest(`/roles/${rolSeleccionado.idRol}/toggle-status`, { 
      method: 'PATCH' 
    });
    
    showNotification('Rol reactivado correctamente', 'success');
    rolSeleccionado = null;
    deshabilitarBotones();
    cargarRoles();
  } catch (error) {
    console.error('Error al reactivar rol:', error);
    showNotification('Error al reactivar rol', 'error');
  }
}

// ========================================
// VER DETALLE
// ========================================
async function verDetalleRol() {
  if (!rolSeleccionado) {
    showNotification('Selecciona un rol primero', 'warning');
    return;
  }

  try {
    const detalle = await apiRequest(`/roles/${rolSeleccionado.idRol}`);
    
    // Organizar permisos por módulo
    const permisosPorModulo = organizarPermisos(detalle.permisos);
    
    const mensaje = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 DETALLE DEL ROL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Nombre: ${detalle.nombre}
🆔 ID: ${detalle.idRol}

📝 Descripción:
${detalle.descripcion || 'Sin descripción'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 PERMISOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${detalle.tieneAccesoTotal ? '⭐ ACCESO TOTAL AL SISTEMA' : permisosPorModulo ? Object.entries(permisosPorModulo).map(([modulo, permisos]) => {
      return `${obtenerNombreModulo(modulo)}:\n${permisos.map(p => '  • ' + obtenerNombrePermiso(p)).join('\n')}`;
    }).join('\n\n') : 'Sin permisos específicos'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 USUARIOS CON ESTE ROL (${detalle.usuarios.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${detalle.usuarios.length === 0 ? 'No hay usuarios asignados' : detalle.usuarios.map(u => {
      const estado = u.activo === 1 ? '✅' : '❌';
      return `${estado} ${u.nombre} (${u.correo})`;
    }).join('\n')}

🏷️ Estado: ${detalle.activo === 1 ? '✅ Activo' : '❌ Inactivo'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;

    alert(mensaje);
  } catch (error) {
    console.error('Error al cargar detalle:', error);
    showNotification('Error al cargar detalle del rol', 'error');
  }
}

// ========================================
// UTILIDADES
// ========================================
function organizarPermisos(permisos) {
  if (!permisos || permisos.includes('*')) return null;
  
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
// RENDERIZAR GRÁFICO DE DISTRIBUCIÓN
// ========================================
function renderDistribucionChart(distribucion) {
  const chartDiv = document.getElementById('distribucionChart');
  
  if (!chartDiv) return;
  
  if (!distribucion || distribucion.length === 0) {
    chartDiv.innerHTML = '<p style="text-align: center; color: #666;">No hay datos de distribución</p>';
    return;
  }

  const maxCantidad = Math.max(...distribucion.map(d => d.cantidad));
  
  let html = '<div style="display: flex; flex-direction: column; gap: 15px;">';
  
  distribucion.forEach(item => {
    const porcentaje = maxCantidad > 0 ? (item.cantidad / maxCantidad) * 100 : 0;
    const color = getColorForRole(item.rol);
    
    html += `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="min-width: 150px; font-weight: 500;">${item.rol}</div>
        <div style="flex: 1; background: #f0f0f0; border-radius: 8px; height: 30px; position: relative; overflow: hidden;">
          <div style="background: ${color}; height: 100%; width: ${porcentaje}%; transition: width 0.5s ease; display: flex; align-items: center; padding: 0 10px; color: white; font-weight: bold;">
            ${item.cantidad > 0 ? item.cantidad : ''}
          </div>
        </div>
        <div style="min-width: 60px; text-align: right; font-weight: bold;">${item.cantidad} user${item.cantidad !== 1 ? 's' : ''}</div>
      </div>
    `;
  });
  
  html += '</div>';
  chartDiv.innerHTML = html;
}

function getColorForRole(rolNombre) {
  const colores = {
    'Administrador': '#9c27b0', // morado
    'Gerente': '#2196f3',       // azul
    'Operador': '#4caf50',      // verde
    'Visualizador': '#ff9800'   // naranja
  };
  return colores[rolNombre] || '#607d8b'; // gris por defecto
}

// ========================================
// EVENTOS DE BOTONES
// ========================================
if (refreshBtn) refreshBtn.addEventListener('click', cargarRoles);
if (editarBtn) editarBtn.addEventListener('click', editarRol);
if (eliminarBtn) eliminarBtn.addEventListener('click', eliminarRol);
if (reactivarBtn) reactivarBtn.addEventListener('click', reactivarRol);
if (verDetalleBtn) verDetalleBtn.addEventListener('click', verDetalleRol);

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  cargarRoles();
  deshabilitarBotones();
});