// ===== VER PROVEEDORES CON FILTROS =====
const proveedoresTableBody = document.getElementById("proveedoresTableBody");
const editarBtn = document.getElementById('editarBtn');
const eliminarBtn = document.getElementById('eliminarBtn');
const reactivarBtn = document.getElementById('reactivarBtn');
const verDetalleBtn = document.getElementById('verDetalleBtn');
const refreshBtn = document.getElementById("refreshBtn");
const searchProvider = document.getElementById("searchProvider");
const filterEstado = document.getElementById("filterEstado");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

let proveedores = [];
let proveedoresFiltrados = [];
let proveedorSeleccionado = null;

// ========================================
// CARGAR PROVEEDORES
// ========================================
async function cargarProveedores() {
  try {
    proveedoresTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Cargando proveedores...</td></tr>';
    
    const data = await apiRequest('/providers');
    proveedores = data;
    proveedoresFiltrados = data;

    // Cargar estadísticas
    await cargarEstadisticasProveedores();

    if (proveedores.length === 0) {
      proveedoresTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
            <div style="font-size: 3rem; margin-bottom: 10px;">📭</div>
            <p style="font-size: 1.1rem; margin: 0;">No hay proveedores registrados</p>
            <p style="font-size: 0.9rem; margin: 10px 0 0 0;">Comienza agregando tu primer proveedor</p>
          </td>
        </tr>
      `;
      return;
    }

    renderProveedores(proveedoresFiltrados);
  } catch (error) {
    console.error('Error al cargar proveedores:', error);
    proveedoresTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:red;">Error al cargar proveedores</td></tr>';
    showNotification('Error al cargar proveedores', 'error');
  }
}

// ========================================
// CARGAR ESTADÍSTICAS
// ========================================
async function cargarEstadisticasProveedores() {
  try {
    const stats = await apiRequest('/providers/stats');
    
    document.getElementById('totalProveedores').textContent = stats.totalProveedores || 0;
    document.getElementById('proveedoresActivos').textContent = stats.proveedoresActivos || 0;
    document.getElementById('productosAsociados').textContent = stats.productosAsociados || 0;
    document.getElementById('comprasMes').textContent = formatearMoneda(stats.comprasMes || 0);
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

// ========================================
// RENDERIZAR PROVEEDORES
// ========================================
function renderProveedores(items) {
  proveedoresTableBody.innerHTML = "";

  if (items.length === 0) {
    proveedoresTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No hay proveedores con estos filtros</td></tr>';
    document.getElementById('countProveedores').textContent = '0';
    return;
  }

  items.forEach((proveedor, i) => {
    const tr = document.createElement("tr");
    tr.dataset.index = i;
    tr.dataset.id = proveedor.idProveedor;
    tr.style.cursor = "pointer";

    // Badge de estado
    const estadoBadge = proveedor.activo === 1 
      ? '<span class="badge success"> Activo</span>'
      : '<span class="badge danger"> Inactivo</span>';

    tr.innerHTML = `
      <td style="text-align: center;">
        <input 
          type="radio" 
          name="proveedorSeleccionado" 
          value="${proveedor.idProveedor}"
        />
      </td>
      <td>${proveedor.idProveedor}</td>
      <td><strong>${proveedor.nombre}</strong></td>
      <td>${proveedor.telefono || '-'}</td>
      <td>${proveedor.correo || '-'}</td>
      <td style="text-align: center;">${proveedor.totalProductos || 0}</td>
      <td style="text-align: center;">${formatearMoneda(proveedor.comprasMes || 0)}</td>
      <td style="text-align: center;">${estadoBadge}</td>
    `;

    proveedoresTableBody.appendChild(tr);

    // Selección con click en la fila o radio button
    const radio = tr.querySelector('input[type="radio"]');
    
    tr.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') {
        radio.checked = true;
      }
      seleccionarProveedor(proveedor.idProveedor);
    });

    radio.addEventListener('change', () => {
      seleccionarProveedor(proveedor.idProveedor);
    });
  });

  document.getElementById('countProveedores').textContent = items.length;
}

// ========================================
// SELECCIONAR PROVEEDOR
// ========================================
function seleccionarProveedor(id) {
  proveedorSeleccionado = proveedores.find(p => p.idProveedor === id);
  
  // Resaltar fila
  proveedoresTableBody.querySelectorAll('tr').forEach(tr => {
    tr.style.backgroundColor = '';
  });
  
  const filaSeleccionada = proveedoresTableBody.querySelector(`tr[data-id="${id}"]`);
  if (filaSeleccionada) {
    filaSeleccionada.style.backgroundColor = '#e3f2fd';
  }
  
  // Habilitar botones
  editarBtn.disabled = false;
  eliminarBtn.disabled = false;
  reactivarBtn.disabled = false;
  verDetalleBtn.disabled = false;
  
  // Mostrar el botón correcto según estado
  actualizarBotonesAccion();
}


// Actualizar visibilidad de botones según el estado del producto
function actualizarBotonesAccion() {
  if (proveedorSeleccionado.activo === 0) {
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
// EDITAR PROVEEDOR
// ========================================
function editarProveedor() {
  if (!proveedorSeleccionado) {
    showNotification('Selecciona un proveedor primero', 'warning');
    return;
  }
  window.location.href = `add-provider.html?id=${proveedorSeleccionado.idProveedor}`;
}

// ========================================
// ELIMINAR PROVEEDOR
// ========================================
async function eliminarProveedor() {
  if (!proveedorSeleccionado) {
    showNotification('Selecciona un proveedor primero', 'warning');
    return;
  }

  if (!confirm(`¿Eliminar proveedor "${proveedorSeleccionado.nombre}"?`)) return;

  try {
    await apiRequest(`/providers/${proveedorSeleccionado.idProveedor}/toggle-status`, { method: 'PATCH' });
    showNotification('Proveedor eliminado correctamente', 'success');
    cargarProveedores();
  } catch (error) {
    showNotification('Error al eliminar proveedor', 'error');
  }
}

// ========================================
// REACTIVAR PROVEEDOR
// ========================================
async function reactivarProveedor() {
  if (!proveedorSeleccionado) {
    showNotification('Selecciona un proveedor primero', 'warning');
    return;
  }

  if (!confirm(`¿Reactivar proveedor "${proveedorSeleccionado.nombre}"?`)) return;

  try {
    await apiRequest(`/providers/${proveedorSeleccionado.idProveedor}/toggle-status`, { method: 'PATCH' });
    showNotification('Proveedor reactivado correctamente', 'success');
    cargarProveedores();
  } catch (error) {
    showNotification('Error al reactivar proveedor', 'error');
  }
}


// ========================================
// VER DETALLE
// ========================================
function verDetalleProveedor() {
  if (!proveedorSeleccionado) {
    showNotification('Selecciona un proveedor primero', 'warning');
    return;
  }

  alert(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 INFORMACIÓN DEL PROVEEDOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏢 Nombre: ${proveedorSeleccionado.nombre}
🆔 ID: ${proveedorSeleccionado.idProveedor}

📞 Contacto:
   • Teléfono: ${proveedorSeleccionado.telefono || 'No registrado'}
   • Correo: ${proveedorSeleccionado.correo || 'No registrado'}
   • Persona de contacto: ${proveedorSeleccionado.contactoNombre || 'No registrado'}

📍 Ubicación:
   • Dirección: ${proveedorSeleccionado.direccion || 'No registrada'}

🆔 Información Fiscal:
   • NIT/Documento: ${proveedorSeleccionado.nit || 'No registrado'}

📦 Estadísticas:
   • Productos asociados: ${proveedorSeleccionado.totalProductos || 0}
   • Compras este mes: ${formatearMoneda(proveedorSeleccionado.comprasMes || 0)}

📝 Notas:
${proveedorSeleccionado.notas || 'Sin notas adicionales'}

🏷️ Estado: ${proveedorSeleccionado.activo === 1 ? '✅ Activo' : '❌ Inactivo'}

📅 Fechas:
   • Creado: ${formatearFecha(proveedorSeleccionado.fechaCreacion)}
   • Última actualización: ${formatearFecha(proveedorSeleccionado.fechaActualizacion)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

// ========================================
// FILTRAR PROVEEDORES
// ========================================
function filtrarProveedores() {
  const busqueda = searchProvider.value.toLowerCase();
  const estado = filterEstado.value;

  proveedoresFiltrados = proveedores.filter(p => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda) ||
                         (p.telefono && p.telefono.toLowerCase().includes(busqueda)) ||
                         (p.correo && p.correo.toLowerCase().includes(busqueda));
    
    let matchEstado = true;
    if (estado === 'activo') {
      matchEstado = p.activo === 1;
    } else if (estado === 'inactivo') {
      matchEstado = p.activo === 0;
    }

    return matchBusqueda && matchEstado;
  });

  renderProveedores(proveedoresFiltrados);
}

// ========================================
// LIMPIAR FILTROS
// ========================================
function limpiarFiltros() {
  searchProvider.value = '';
  filterEstado.value = '';
  proveedoresFiltrados = proveedores;
  renderProveedores(proveedoresFiltrados);
}

// ========================================
// UTILIDADES
// ========================================
function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(valor);
}

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ========================================
// EVENT LISTENERS
// ========================================
if (refreshBtn) refreshBtn.addEventListener('click', cargarProveedores);
if (editarBtn) editarBtn.addEventListener('click', editarProveedor);
if (eliminarBtn) eliminarBtn.addEventListener('click', eliminarProveedor);
if (reactivarBtn) reactivarBtn.addEventListener('click', reactivarProveedor);
if (verDetalleBtn) verDetalleBtn.addEventListener('click', verDetalleProveedor);
if (searchProvider) searchProvider.addEventListener('input', filtrarProveedores);
if (filterEstado) filterEstado.addEventListener('change', filtrarProveedores);
if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', limpiarFiltros);

// ========================================
// INICIALIZAR
// ========================================
cargarProveedores();