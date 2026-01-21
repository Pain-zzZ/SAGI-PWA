// ===== VER MOVIMIENTOS MEJORADO =====
const tableBody = document.getElementById("movimientosTableBody");
const refreshBtn = document.getElementById("refreshBtn");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const exportBtn = document.getElementById("exportBtn");
const searchInput = document.getElementById("searchMovement");
const filterTipo = document.getElementById("filterTipo");
const filterFechaInicio = document.getElementById("filterFechaInicio");
const filterFechaFin = document.getElementById("filterFechaFin");
const countMovimientos = document.getElementById("countMovimientos");

let movimientos = [];
let movimientosFiltrados = [];

// Cargar estadísticas
async function cargarEstadisticas() {
  try {
    const stats = await apiRequest('/movements/stats');
    
    document.getElementById('totalMovimientos').textContent = stats.totalMovimientos || 0;
    document.getElementById('totalEntradas').textContent = stats.totalEntradas || 0;
    document.getElementById('totalSalidas').textContent = stats.totalSalidas || 0;
    document.getElementById('movimientosHoy').textContent = stats.movimientosHoy || 0;
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

// Cargar movimientos desde la API
async function cargarMovimientos() {
  try {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px;">
          <div class="loading"></div>
          <p style="margin-top: 10px;">Cargando movimientos...</p>
        </td>
      </tr>
    `;
    
    // Construir parámetros de filtro
    const params = new URLSearchParams();
    
    if (filterTipo.value) params.append('tipo', filterTipo.value);
    if (filterFechaInicio.value) params.append('fechaInicio', filterFechaInicio.value + ' 00:00:00');
    if (filterFechaFin.value) params.append('fechaFin', filterFechaFin.value + ' 23:59:59');
    
    const queryString = params.toString();
    const endpoint = queryString ? `/movements?${queryString}` : '/movements';
    
    const data = await apiRequest(endpoint);
    movimientos = data;
    movimientosFiltrados = data;

    if (movimientos.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px;">
            <p style="font-size: 1.2rem; color: #666;">📭 No hay movimientos registrados</p>
            <p style="color: #999; margin-top: 5px;">Intenta cambiar los filtros o registra un nuevo movimiento</p>
          </td>
        </tr>
      `;
      countMovimientos.textContent = '0';
      return;
    }

    renderMovimientos(movimientosFiltrados);
  } catch (error) {
    console.error('Error al cargar movimientos:', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px;">
          <p style="font-size: 1.2rem; color: #e63946;">❌ Error al cargar movimientos</p>
          <p style="color: #999; margin-top: 5px;">Por favor, intenta de nuevo</p>
        </td>
      </tr>
    `;
    showNotification('Error al cargar movimientos', 'error');
  }
}

// Renderizar movimientos en la tabla
function renderMovimientos(items) {
  tableBody.innerHTML = "";

  // Filtrar por búsqueda de texto
  const searchTerm = searchInput.value.toLowerCase();
  const filtered = items.filter(mov => 
    (mov.nombreProducto && mov.nombreProducto.toLowerCase().includes(searchTerm)) ||
    (mov.descripcion && mov.descripcion.toLowerCase().includes(searchTerm)) ||
    (mov.nombreUsuario && mov.nombreUsuario.toLowerCase().includes(searchTerm))
  );

  // Actualizar contador
  countMovimientos.textContent = filtered.length;

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px;">
          <p style="font-size: 1.2rem; color: #666;">🔍 No se encontraron resultados</p>
          <p style="color: #999; margin-top: 5px;">Intenta con otros términos de búsqueda</p>
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach((mov) => {
    const tr = document.createElement("tr");

    // Determinar badge y estilo según el tipo
    let tipoBadge = '';
    let cantidadTexto = mov.cantidad ? mov.cantidad : '-';
    let cantidadStyle = '';
    
    switch(mov.tipo) {
      case 'entrada':
        tipoBadge = '<span class="badge success">📥 Entrada</span>';
        cantidadTexto = `+${mov.cantidad}`;
        cantidadStyle = 'color: #4caf50; font-weight: bold;';
        break;
      case 'salida':
        tipoBadge = '<span class="badge danger">📤 Salida</span>';
        cantidadTexto = `-${mov.cantidad}`;
        cantidadStyle = 'color: #e63946; font-weight: bold;';
        break;
      case 'ajuste':
        tipoBadge = '<span class="badge warning">⚖️ Ajuste</span>';
        cantidadTexto = `±${mov.cantidad}`;
        cantidadStyle = 'color: #ff9800; font-weight: bold;';
        break;
      case 'creacion':
        tipoBadge = '<span class="badge success">➕ Creación</span>';
        break;
      case 'edicion':
        tipoBadge = '<span class="badge" style="background: #2196f3; color: white;">✏️ Edición</span>';
        break;
      case 'inactivacion':
        tipoBadge = '<span class="badge danger">🗑️ Inactivación</span>';
        break;
      case 'reactivacion':
        tipoBadge = '<span class="badge success">♻️ Reactivación</span>';
        break;
      default:
        tipoBadge = `<span class="badge">${mov.tipo}</span>`;
    }

    // Formatear fecha
    const fecha = new Date(mov.fecha);
    const fechaFormateada = fecha.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Determinar color de la fila según el tipo
    let rowClass = '';
    if (mov.tipo === 'entrada') rowClass = 'row-entrada';
    if (mov.tipo === 'salida') rowClass = 'row-salida';

    tr.className = rowClass;
    tr.innerHTML = `
      <td style="text-align: center; font-weight: 600; color: #666;">${mov.idMovimiento}</td>
      <td style="font-size: 0.9em; color: #555;">${fechaFormateada}</td>
      <td>${tipoBadge}</td>
      <td><strong style="color: #1b263b;">${mov.nombreProducto || '<em style="color: #999;">Producto eliminado</em>'}</strong></td>
      <td style="text-align: center; ${cantidadStyle}">${cantidadTexto}</td>
      <td style="color: #555;">
        <div style="display: flex; align-items: center; gap: 5px;">
          <span style="background: #e3f2fd; padding: 2px 8px; border-radius: 12px; font-size: 0.85em;">
            👤 ${mov.nombreUsuario || 'Sistema'}
          </span>
        </div>
      </td>
      <td style="font-size: 0.9em; color: #666;">
        ${mov.descripcion || '<em style="color: #ccc;">Sin descripción</em>'}
      </td>
    `;
    
    tableBody.appendChild(tr);
  });
}

// Limpiar filtros
function limpiarFiltros() {
  searchInput.value = '';
  filterTipo.value = '';
  filterFechaInicio.value = '';
  filterFechaFin.value = '';
  cargarMovimientos();
  showNotification('Filtros limpiados', 'success');
}

// Exportar a Excel (simulado - para implementar después)
function exportarExcel() {
  showNotification('⚠️ Función en desarrollo. Próximamente podrás exportar a Excel', 'warning');
  // TODO: Implementar exportación real con librería como xlsx
}

// Event Listeners
if (refreshBtn) refreshBtn.addEventListener('click', () => {
  cargarMovimientos();
  cargarEstadisticas();
  showNotification('Datos actualizados', 'success');
});

if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', limpiarFiltros);
if (exportBtn) exportBtn.addEventListener('click', exportarExcel);
if (searchInput) searchInput.addEventListener('input', () => renderMovimientos(movimientosFiltrados));
if (filterTipo) filterTipo.addEventListener('change', cargarMovimientos);
if (filterFechaInicio) filterFechaInicio.addEventListener('change', cargarMovimientos);
if (filterFechaFin) filterFechaFin.addEventListener('change', cargarMovimientos);

// Inicializar
cargarMovimientos();
cargarEstadisticas();