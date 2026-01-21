// ===== VER COMPROBANTES =====
const tableBody = document.getElementById("comprobantesTableBody");
const refreshBtn = document.getElementById("refreshBtn");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const searchInput = document.getElementById("searchReceipt");
const filterTipo = document.getElementById("filterTipo");
const filterEstado = document.getElementById("filterEstado");
const filterFechaInicio = document.getElementById("filterFechaInicio");
const filterFechaFin = document.getElementById("filterFechaFin");
const countComprobantes = document.getElementById("countComprobantes");
const rangoFechaSelect = document.getElementById("rangoFecha");
const periodoTexto = document.getElementById("periodoTexto");

let comprobantes = [];

// Cargar estadísticas financieras
async function cargarEstadisticas() {
  try {
    // Calcular fechas según el rango seleccionado
    const rango = rangoFechaSelect.value;
    let params = '';
    let textoRango = '';

    const hoy = new Date();
    let fechaInicio, fechaFin;

    switch(rango) {
      case 'mes_actual':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        textoRango = `${fechaInicio.toLocaleDateString('es-ES', {month: 'long', year: 'numeric'})}`;
        break;
      
      case 'mes_anterior':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        textoRango = `${fechaInicio.toLocaleDateString('es-ES', {month: 'long', year: 'numeric'})}`;
        break;
      
      case 'trimestre':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1);
        fechaFin = hoy;
        textoRango = 'Último trimestre';
        break;
      
      case 'ano_actual':
        fechaInicio = new Date(hoy.getFullYear(), 0, 1);
        fechaFin = hoy;
        textoRango = `Año ${hoy.getFullYear()}`;
        break;
      
      case 'personalizado':
        if (filterFechaInicio.value && filterFechaFin.value) {
          fechaInicio = new Date(filterFechaInicio.value);
          fechaFin = new Date(filterFechaFin.value);
          textoRango = `${fechaInicio.toLocaleDateString('es-ES')} - ${fechaFin.toLocaleDateString('es-ES')}`;
        } else {
          showNotification('Selecciona fechas personalizadas', 'warning');
          return;
        }
        break;
    }

    const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
    const fechaFinStr = fechaFin.toISOString().split('T')[0];
    params = `?fechaInicio=${fechaInicioStr}&fechaFin=${fechaFinStr}`;

    periodoTexto.textContent = textoRango;

    const stats = await apiRequest(`/receipts/stats${params}`);
    
    // Formatear moneda
    const formatMoney = (value) => {
      return `$${parseFloat(value || 0).toLocaleString('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
    };

    // Actualizar tarjetas
    document.getElementById('ventasTotal').textContent = formatMoney(stats.ventas.total);
    document.getElementById('ventasCantidad').textContent = stats.ventas.cantidad;

    document.getElementById('comprasTotal').textContent = formatMoney(stats.compras.total);
    document.getElementById('comprasCantidad').textContent = stats.compras.cantidad;

    document.getElementById('recibosTotal').textContent = formatMoney(stats.recibos.total);
    document.getElementById('recibosCantidad').textContent = stats.recibos.cantidad;

    document.getElementById('utilidadNeta').textContent = formatMoney(stats.utilidadNeta);
    document.getElementById('margenUtilidad').textContent = stats.margenUtilidad;

    // Color según utilidad
    const utilidadElement = document.getElementById('utilidadNeta');
    if (stats.utilidadNeta > 0) {
      utilidadElement.style.color = '#4caf50';
    } else if (stats.utilidadNeta < 0) {
      utilidadElement.style.color = '#e63946';
    } else {
      utilidadElement.style.color = '#ff9800';
    }

    // Detalles adicionales
    document.getElementById('notasCreditoTotal').textContent = formatMoney(stats.notasCredito.total);
    document.getElementById('notasCreditoCantidad').textContent = stats.notasCredito.cantidad;

    document.getElementById('notasDebitoTotal').textContent = formatMoney(stats.notasDebito.total);
    document.getElementById('notasDebitoCantidad').textContent = stats.notasDebito.cantidad;

    document.getElementById('utilidadBruta').textContent = formatMoney(stats.utilidadBruta);

    document.getElementById('totalComprobantesPeriodo').textContent = stats.totalComprobantes;
    document.getElementById('comprobantesAnulados').textContent = stats.comprobantesAnulados;

    // Top productos
    if (stats.topProductos && stats.topProductos.length > 0) {
      document.getElementById('topProductosCard').style.display = 'block';
      const container = document.getElementById('topProductosContainer');
      container.innerHTML = stats.topProductos.map((p, i) => `
        <div class="top-producto-item">
          <div class="top-ranking">${i + 1}</div>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 3px;">${p.nombreProducto}</div>
            <div style="font-size: 0.9rem; color: #666;">
              ${p.totalVendido} unidades vendidas
            </div>
          </div>
          <div style="text-align: right; font-weight: bold; color: #4a90e2;">
            ${formatMoney(p.totalGenerado)}
          </div>
        </div>
      `).join('');
    } else {
      document.getElementById('topProductosCard').style.display = 'none';
    }

  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
    showNotification('Error al cargar estadísticas', 'error');
  }
}

// Cargar comprobantes
async function cargarComprobantes() {
  try {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px;">
          <div class="loading"></div>
          <p style="margin-top: 10px;">Cargando comprobantes...</p>
        </td>
      </tr>
    `;
    
    // Construir parámetros de filtro
    const params = new URLSearchParams();
    
    if (filterTipo.value) params.append('tipo', filterTipo.value);
    if (filterEstado.value) params.append('estado', filterEstado.value);
    if (filterFechaInicio.value) params.append('fechaInicio', filterFechaInicio.value);
    if (filterFechaFin.value) params.append('fechaFin', filterFechaFin.value);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/receipts?${queryString}` : '/receipts';
    
    const data = await apiRequest(endpoint);
    comprobantes = data;

    if (comprobantes.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px;">
            <p style="font-size: 1.2rem; color: #666;">📭 No hay comprobantes registrados</p>
          </td>
        </tr>
      `;
      countComprobantes.textContent = '0';
      return;
    }

    renderComprobantes(comprobantes);
  } catch (error) {
    console.error('Error al cargar comprobantes:', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px;">
          <p style="font-size: 1.2rem; color: #e63946;">❌ Error al cargar comprobantes</p>
        </td>
      </tr>
    `;
    showNotification('Error al cargar comprobantes', 'error');
  }
}

// Renderizar comprobantes
function renderComprobantes(items) {
  tableBody.innerHTML = "";

  // Filtrar por búsqueda
  const searchTerm = searchInput.value.toLowerCase();
  const filtered = items.filter(comp => 
    (comp.numeroComprobante && comp.numeroComprobante.toLowerCase().includes(searchTerm)) ||
    (comp.nombreCliente && comp.nombreCliente.toLowerCase().includes(searchTerm))
  );

  countComprobantes.textContent = filtered.length;

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px;">
          <p style="font-size: 1.2rem; color: #666;">🔍 No se encontraron resultados</p>
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach((comp) => {
    const tr = document.createElement("tr");

    // Badge de tipo
    let tipoBadge = '';
    switch(comp.tipo) {
      case 'factura_venta':
        tipoBadge = '<span class="badge success">📤 Factura Venta</span>';
        break;
      case 'factura_compra':
        tipoBadge = '<span class="badge" style="background: #2196f3; color: white;">📥 Factura Compra</span>';
        break;
      case 'recibo':
        tipoBadge = '<span class="badge warning">🧾 Recibo</span>';
        break;
      case 'nota_credito':
        tipoBadge = '<span class="badge" style="background: #9c27b0; color: white;">📝 Nota Crédito</span>';
        break;
      case 'nota_debito':
        tipoBadge = '<span class="badge" style="background: #ff5722; color: white;">📝 Nota Débito</span>';
        break;
    }

    // Badge de estado
    let estadoBadge = '';
    switch(comp.estado) {
      case 'emitido':
        estadoBadge = '<span class="badge success"> Emitido</span>';
        break;
      case 'pagado':
        estadoBadge = '<span class="badge" style="background: #4caf50; color: white;">💰 Pagado</span>';
        break;
      case 'anulado':
        estadoBadge = '<span class="badge danger"> Anulado</span>';
        break;
    }

    // Formatear fecha
    const fecha = new Date(comp.fecha);
    const fechaFormateada = fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    tr.innerHTML = `
      <td><strong>${comp.numeroComprobante}</strong></td>
      <td style="font-size: 0.9em;">${fechaFormateada}</td>
      <td>${tipoBadge}</td>
      <td>${comp.nombreCliente || comp.nombreProveedor || '-'}</td>
      <td style="text-align: right; font-weight: bold; color: #1b263b;">$${parseFloat(comp.total).toLocaleString('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 2})}</td>
      <td>${estadoBadge}</td>
      <td style="text-align: center;">
        <button onclick="verComprobante(${comp.idComprobante})" class="btn-ver" title="Ver/Imprimir">
          👁️
        </button>
        ${comp.estado !== 'anulado' ? `
          <button onclick="anularComprobante(${comp.idComprobante})" class="btn-anular" title="Anular">
            ❌
          </button>
        ` : ''}
      </td>
    `;
    
    tableBody.appendChild(tr);
  });
}

// Ver comprobante
function verComprobante(id) {
  window.open(`view-receipt.html?id=${id}`, '_blank');
}

// Anular comprobante
async function anularComprobante(id) {
  const comprobante = comprobantes.find(c => c.idComprobante === id);
  
  if (!confirm(`¿Deseas anular el comprobante ${comprobante.numeroComprobante}?\n\nEsta acción no se puede deshacer.`)) {
    return;
  }

  try {
    await apiRequest(`/receipts/${id}/anular`, {
      method: 'PATCH'
    });

    showNotification('Comprobante anulado correctamente', 'success');
    cargarComprobantes();
    cargarEstadisticas();
  } catch (error) {
    showNotification('Error al anular el comprobante', 'error');
  }
}

// Limpiar filtros
function limpiarFiltros() {
  searchInput.value = '';
  filterTipo.value = '';
  filterEstado.value = '';
  filterFechaInicio.value = '';
  filterFechaFin.value = '';
  cargarComprobantes();
}

// Event Listeners
if (refreshBtn) refreshBtn.addEventListener('click', () => {
  cargarComprobantes();
  cargarEstadisticas();
});

if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', limpiarFiltros);
if (searchInput) searchInput.addEventListener('input', () => renderComprobantes(comprobantes));
if (filterTipo) filterTipo.addEventListener('change', cargarComprobantes);
if (filterEstado) filterEstado.addEventListener('change', cargarComprobantes);
if (filterFechaInicio) filterFechaInicio.addEventListener('change', cargarComprobantes);
if (filterFechaFin) filterFechaFin.addEventListener('change', cargarComprobantes);

// Event listener para cambio de rango
if (rangoFechaSelect) {
  rangoFechaSelect.addEventListener('change', () => {
    if (rangoFechaSelect.value === 'personalizado') {
      // Mostrar los filtros de fecha
      filterFechaInicio.parentElement.style.display = 'block';
      filterFechaFin.parentElement.style.display = 'block';
    }
    cargarEstadisticas();
  });
}

// Inicializar
cargarComprobantes();
cargarEstadisticas();