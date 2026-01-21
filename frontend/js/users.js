// ===== VER USUARIOS CON FILTROS =====
const usuariosTableBody = document.getElementById("usuariosTableBody");
const editarBtn = document.getElementById("editarBtn");
const eliminarBtn = document.getElementById('eliminarBtn');
const reactivarBtn = document.getElementById('reactivarBtn');
const resetPasswordBtn = document.getElementById("resetPasswordBtn");
const verDetalleBtn = document.getElementById("verDetalleBtn");
const refreshBtn = document.getElementById("refreshBtn");
const searchUser = document.getElementById("searchUser");
const filterRol = document.getElementById("filterRol");
const filterEstado = document.getElementById("filterEstado");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

let usuarios = [];
let usuariosFiltrados = [];
let usuarioSeleccionado = null;

// ========================================
// CARGAR USUARIOS
// ========================================
async function cargarUsuarios() {
  try {
    usuariosTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Cargando usuarios...</td></tr>';
    
    const data = await apiRequest('/users');
    usuarios = data;
    usuariosFiltrados = data;

    // Cargar estadísticas
    await cargarEstadisticasUsuarios();

    if (usuarios.length === 0) {
      usuariosTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
            <div style="font-size: 3rem; margin-bottom: 10px;">👥</div>
            <p style="font-size: 1.1rem; margin: 0;">No hay usuarios registrados</p>
            <p style="font-size: 0.9rem; margin: 10px 0 0 0;">Comienza agregando tu primer usuario</p>
          </td>
        </tr>
      `;
      return;
    }

    renderUsuarios(usuariosFiltrados);
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    usuariosTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:red;">Error al cargar usuarios</td></tr>';
    showNotification('Error al cargar usuarios', 'error');
  }
}

// ========================================
// CARGAR ESTADÍSTICAS
// ========================================
async function cargarEstadisticasUsuarios() {
  try {
    const stats = await apiRequest('/users/stats');
    
    document.getElementById('totalUsuarios').textContent = stats.totalUsuarios || 0;
    document.getElementById('usuariosActivos').textContent = stats.usuariosActivos || 0;
    document.getElementById('usuariosInactivos').textContent = stats.usuariosInactivos || 0;
    document.getElementById('nuevosEsteMes').textContent = stats.nuevosEsteMes || 0;
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

// ========================================
// CARGAR ROLES PARA FILTRO
// ========================================
async function cargarRolesFiltro() {
  try {
    const roles = await apiRequest('/users/roles');
    
    filterRol.innerHTML = '<option value="">Todos los roles</option>';
    roles.forEach(rol => {
      const option = document.createElement('option');
      option.value = rol.idRol;
      option.textContent = rol.nombre;
      filterRol.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar roles:', error);
  }
}

// ========================================
// RENDERIZAR USUARIOS
// ========================================
function renderUsuarios(items) {
  usuariosTableBody.innerHTML = "";

  if (items.length === 0) {
    usuariosTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No hay usuarios con estos filtros</td></tr>';
    document.getElementById('countUsuarios').textContent = '0';
    return;
  }

  items.forEach((usuario, i) => {
    const tr = document.createElement("tr");
    tr.dataset.index = i;
    tr.dataset.id = usuario.idUsuario;
    tr.style.cursor = "pointer";

    // Badge de estado
    const estadoBadge = usuario.activo === 1 
      ? '<span class="badge success"> Activo</span>'
      : '<span class="badge danger"> Inactivo</span>';

    // Formatear fechas
    const fechaCreacion = usuario.fechaCreacion 
      ? new Date(usuario.fechaCreacion).toLocaleDateString('es-CO')
      : '-';
    
    const ultimoAcceso = usuario.ultimoAcceso 
      ? new Date(usuario.ultimoAcceso).toLocaleString('es-CO', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Nunca';

    tr.innerHTML = `
      <td style="text-align: center;">
        <input 
          type="radio" 
          name="usuarioSeleccionado" 
          value="${usuario.idUsuario}"
        />
      </td>
      <td>${usuario.idUsuario}</td>
      <td><strong>${usuario.nombre}</strong></td>
      <td>${usuario.correo}</td>
      <td><span class="badge" style="background: #667eea;">${usuario.rol || 'Sin rol'}</span></td>
      <td style="text-align: center;">${estadoBadge}</td>
      <td>${fechaCreacion}</td>
      <td style="font-size: 0.85rem; color: #666;">${ultimoAcceso}</td>
    `;

    usuariosTableBody.appendChild(tr);

    // Selección con click en la fila o radio button
    const radio = tr.querySelector('input[type="radio"]');
    
    tr.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') {
        radio.checked = true;
      }
      seleccionarUsuario(usuario.idUsuario);
    });

    radio.addEventListener('change', () => {
      seleccionarUsuario(usuario.idUsuario);
    });
  });

  document.getElementById('countUsuarios').textContent = items.length;
}

// ========================================
// SELECCIONAR USUARIO
// ========================================
function seleccionarUsuario(id) {
  usuarioSeleccionado = usuarios.find(u => u.idUsuario === id);

  // Resaltar fila
  usuariosTableBody.querySelectorAll('tr').forEach(tr => {
    tr.style.backgroundColor = '';
  });

  const filaSeleccionada = usuariosTableBody.querySelector(`tr[data-id="${id}"]`);
  if (filaSeleccionada) {
    filaSeleccionada.style.backgroundColor = '#e3f2fd';
  }

  // Habilitar botones correctos
  editarBtn.disabled = false;
  eliminarBtn.disabled = false;
  reactivarBtn.disabled = false;
  resetPasswordBtn.disabled = false;
  verDetalleBtn.disabled = false;

  console.log('✅ Usuario seleccionado:', usuarioSeleccionado.nombre);
  actualizarBotonesAccionUsuario();
}

// Actualizar visibilidad de botones según el estado del producto
function actualizarBotonesAccionUsuario() {
  if (usuarioSeleccionado.activo === 0) {
    // Si está inactivo, mostrar botón de reactivar
    editarBtn.style.display = 'inline-block';
    eliminarBtn.style.display = 'none';
    reactivarBtn.style.display = 'inline-block';
  } else {
    // Si está activo, mostrar editar y eliminar
    editarBtn.style.display = 'inline-block';
    eliminarBtn.style.display = 'inline-block';
    reactivarBtn.style.display = 'none';
  }
}
// ========================================
// EDITAR USUARIO
// ========================================
function editarUsuario() {
  if (!usuarioSeleccionado) {
    showNotification('Selecciona un usuario primero', 'warning');
    return;
  }
  window.location.href = `add-user.html?id=${usuarioSeleccionado.idUsuario}`;
}

// ========================================
// ELIMINAR USUARIO
// ========================================
async function eliminarUsuario() {
  if (!usuarioSeleccionado) {
    showNotification('Selecciona un usuario primero', 'warning');
    return;
  }

  if (!confirm(`¿Eliminar usuario "${usuarioSeleccionado.nombre}"?`)) return;

  try {
    await apiRequest(`/users/${usuarioSeleccionado.idUsuario}/toggle-status`, { method: 'PATCH' });
    showNotification('Usuario eliminado correctamente', 'success');
    usuarioSeleccionado = null;
    cargarUsuarios();
  } catch (error) {
    showNotification('Error al eliminar usuario', 'error');
  }
}

// ========================================
// REACTIVAR USUARIO
// ========================================
async function reactivarUsuario() {
  if (!usuarioSeleccionado) {
    showNotification('Selecciona un usuario primero', 'warning');
    return;
  }

  if (!confirm(`¿Reactivar usuario "${usuarioSeleccionado.nombre}"?`)) return;

  try {
    await apiRequest(`/users/${usuarioSeleccionado.idUsuario}/toggle-status`, { method: 'PATCH' });
    showNotification('Usuario reactivado correctamente', 'success');
    usuarioSeleccionado = null;
    cargarUsuarios();
  } catch (error) {
    showNotification('Error al reactivar usuario', 'error');
  }
}


// ========================================
// RESETEAR CONTRASEÑA
// ========================================
async function resetearContrasena() {
  if (!usuarioSeleccionado) {
    showNotification('Selecciona un usuario primero', 'warning');
    return;
  }

  if (!confirm(`¿Estás seguro de resetear la contraseña de "${usuarioSeleccionado.nombre}"?\n\nLa nueva contraseña será: SAGI2026`)) {
    return;
  }

  try {
    const result = await apiRequest(`/users/${usuarioSeleccionado.idUsuario}/reset-password`, {
      method: 'PATCH'
    });

    alert(`✅ ${result.message}\n\n📋 Copia esta información para el usuario:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nCorreo: ${usuarioSeleccionado.correo}\nContraseña temporal: ${result.passwordTemporal}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    showNotification('Contraseña reseteada correctamente', 'success');
  } catch (error) {
    showNotification('Error al resetear contraseña', 'error');
  }
}

// ========================================
// VER DETALLE
// ========================================
function verDetalleUsuario() {
  if (!usuarioSeleccionado) {
    showNotification('Selecciona un usuario primero', 'warning');
    return;
  }

  const ultimoAcceso = usuarioSeleccionado.ultimoAcceso 
    ? new Date(usuarioSeleccionado.ultimoAcceso).toLocaleString('es-CO')
    : 'Nunca ha iniciado sesión';

  alert(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 INFORMACIÓN DEL USUARIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 ID: ${usuarioSeleccionado.idUsuario}
👤 Nombre: ${usuarioSeleccionado.nombre}
📧 Correo: ${usuarioSeleccionado.correo}

🔐 Rol: ${usuarioSeleccionado.rol || 'Sin rol asignado'}
🏷️ Estado: ${usuarioSeleccionado.activo === 1 ? '✅ Activo' : '❌ Inactivo'}

📅 Fecha de creación: ${new Date(usuarioSeleccionado.fechaCreacion).toLocaleString('es-CO')}
🕐 Último acceso: ${ultimoAcceso}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

// ========================================
// FILTRAR USUARIOS
// ========================================
function filtrarUsuarios() {
  const busqueda = searchUser.value.toLowerCase();
  const rol = filterRol.value;
  const estado = filterEstado.value;

  usuariosFiltrados = usuarios.filter(u => {
    const matchBusqueda = u.nombre.toLowerCase().includes(busqueda) ||
                         u.correo.toLowerCase().includes(busqueda);
    
    const matchRol = !rol || u.idRol == rol;
    
    let matchEstado = true;
    if (estado === 'activo') {
      matchEstado = u.activo === 1;
    } else if (estado === 'inactivo') {
      matchEstado = u.activo === 0;
    }

    return matchBusqueda && matchRol && matchEstado;
  });

  renderUsuarios(usuariosFiltrados);
}

// ========================================
// LIMPIAR FILTROS
// ========================================
function limpiarFiltros() {
  searchUser.value = '';
  filterRol.value = '';
  filterEstado.value = '';
  usuariosFiltrados = usuarios;
  renderUsuarios(usuariosFiltrados);
}

// ========================================
// EVENT LISTENERS
// ========================================
if (refreshBtn) refreshBtn.addEventListener('click', cargarUsuarios);
if (editarBtn) editarBtn.addEventListener('click', editarUsuario);
if (eliminarBtn) eliminarBtn.addEventListener('click', eliminarUsuario);
if (reactivarBtn) reactivarBtn.addEventListener('click', reactivarUsuario);
if (resetPasswordBtn) resetPasswordBtn.addEventListener('click', resetearContrasena);
if (verDetalleBtn) verDetalleBtn.addEventListener('click', verDetalleUsuario);
if (searchUser) searchUser.addEventListener('input', filtrarUsuarios);
if (filterRol) filterRol.addEventListener('change', filtrarUsuarios);
if (filterEstado) filterEstado.addEventListener('change', filtrarUsuarios);
if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', limpiarFiltros);

// ========================================
//INICIALIZAR
// ========================================
cargarUsuarios();
cargarRolesFiltro();
