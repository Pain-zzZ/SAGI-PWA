// ===== VER/IMPRIMIR COMPROBANTE =====

const urlParams = new URLSearchParams(window.location.search);
const comprobanteId = urlParams.get('id');

async function cargarComprobante() {
  if (!comprobanteId) {
    document.getElementById('comprobanteContent').innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <p style="color: #e63946;">❌ No se especificó un comprobante válido</p>
      </div>
    `;
    return;
  }

  try {
    const comprobante = await apiRequest(`/receipts/${comprobanteId}`);
    renderComprobante(comprobante);
  } catch (error) {
    console.error('Error al cargar comprobante:', error);
    document.getElementById('comprobanteContent').innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <p style="color: #e63946;">❌ Error al cargar el comprobante</p>
      </div>
    `;
  }
}

function renderComprobante(comp) {
  // Determinar nombres de tipo
  const tipoNombres = {
    'factura_venta': 'FACTURA DE VENTA',
    'factura_compra': 'FACTURA DE COMPRA',
    'recibo': 'RECIBO',
    'nota_credito': 'NOTA DE CRÉDITO',
    'nota_debito': 'NOTA DE DÉBITO'
  };

  const estadoBadges = {
    'emitido': '<span class="badge emitido">EMITIDO</span>',
    'pagado': '<span class="badge pagado">PAGADO</span>',
    'anulado': '<span class="badge anulado">ANULADO</span>'
  };

  // Formatear fecha
  const fecha = new Date(comp.fecha);
  const fechaFormateada = fecha.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Renderizar detalles
  let detallesHTML = '';
  if (comp.detalles && comp.detalles.length > 0) {
    detallesHTML = comp.detalles.map(det => `
      <tr>
        <td>${det.nombreProducto}</td>
        <td style="text-align: center;">${det.cantidad}</td>
        <td style="text-align: right;">$${parseFloat(det.precioUnitario).toLocaleString('es-CO', {minimumFractionDigits: 2})}</td>
        <td style="text-align: right;">$${parseFloat(det.subtotal).toLocaleString('es-CO', {minimumFractionDigits: 2})}</td>
      </tr>
    `).join('');
  }

  const html = `
    <div class="comprobante-header">
      <h1>SAGI - Sistema Automático de Gestión de Inventario</h1>
      <h2>${tipoNombres[comp.tipo] || comp.tipo.toUpperCase()}</h2>
      <p><strong>No. ${comp.numeroComprobante}</strong></p>
      <p>${estadoBadges[comp.estado]}</p>
    </div>

    <div class="comprobante-info">
      <div class="info-section">
        <h3>📅 Información del Documento</h3>
        <div class="info-row">
          <span>Fecha de emisión:</span>
          <strong>${fechaFormateada}</strong>
        </div>
        <div class="info-row">
          <span>Emitido por:</span>
          <strong>${comp.nombreUsuario || 'Sistema'}</strong>
        </div>
      </div>

      <div class="info-section">
        <h3>${comp.tipo === 'factura_compra' ? '🏢 Proveedor' : '👤 Cliente'}</h3>
        <div class="info-row">
          <span>Nombre:</span>
          <strong>${comp.nombreCliente || comp.nombreProveedor || '-'}</strong>
        </div>
        ${comp.documentoCliente ? `
          <div class="info-row">
            <span>Documento:</span>
            <strong>${comp.documentoCliente}</strong>
          </div>
        ` : ''}
      </div>
    </div>

    ${comp.detalles && comp.detalles.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Producto/Servicio</th>
            <th style="width: 100px; text-align: center;">Cantidad</th>
            <th style="width: 120px; text-align: right;">Precio Unit.</th>
            <th style="width: 120px; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${detallesHTML}
        </tbody>
      </table>
    ` : ''}

    <div class="totales">
      <div class="total-row">
        <span>Subtotal:</span>
        <strong>$${parseFloat(comp.subtotal).toLocaleString('es-CO', {minimumFractionDigits: 2})}</strong>
      </div>
      <div class="total-row">
        <span>Impuestos (IVA 19%):</span>
        <strong>$${parseFloat(comp.impuestos).toLocaleString('es-CO', {minimumFractionDigits: 2})}</strong>
      </div>
      <div class="total-row total-final">
        <span>TOTAL:</span>
        <strong>$${parseFloat(comp.total).toLocaleString('es-CO', {minimumFractionDigits: 2})}</strong>
      </div>
    </div>

    ${comp.observaciones ? `
      <div style="clear: both; margin-top: 30px; padding: 15px; background: #f9f9f9; border-left: 4px solid #4a90e2;">
        <strong>📝 Observaciones:</strong>
        <p style="margin-top: 5px;">${comp.observaciones}</p>
      </div>
    ` : ''}

    <div class="footer">
      <p>Documento generado por SAGI - Sistema Automático de Gestión de Inventario</p>
      <p style="font-size: 0.8rem; color: #666;">Este es un comprobante ${comp.estado}. Conserve este documento para su control interno.</p>
    </div>
  `;

  document.getElementById('comprobanteContent').innerHTML = html;
}

// Cargar al iniciar
cargarComprobante();