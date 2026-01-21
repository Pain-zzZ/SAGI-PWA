// ===== GENERAR COMPROBANTE =====
const addReceiptForm = document.getElementById("addReceiptForm");
const tipoSelect = document.getElementById("tipo");
const nombreClienteInput = document.getElementById("nombreCliente");
const documentoClienteInput = document.getElementById("documentoCliente");
const proveedorSelect = document.getElementById("proveedor");
const clienteGroup = document.getElementById("clienteGroup");
const proveedorGroup = document.getElementById("proveedorGroup");
const observacionesInput = document.getElementById("observaciones");
const productosContainer = document.getElementById("productosContainer");
const addProductBtn = document.getElementById("addProductBtn");
const errorMsg = document.getElementById("error-msg");

let productos = [];
let productosSeleccionados = [];
let contadorProductos = 0;

// Cargar productos disponibles
async function cargarProductos() {
  try {
    const data = await apiRequest('/products');
    productos = data.filter(p => p.estado !== 'Inactivo');
  } catch (error) {
    console.error('Error al cargar productos:', error);
  }
}

// Cargar proveedores
async function cargarProveedores() {
  try {
    const proveedores = await apiRequest('/providers');
    proveedorSelect.innerHTML = '<option value="">Selecciona un proveedor...</option>';
    
    proveedores.forEach(prov => {
      const option = document.createElement('option');
      option.value = prov.idProveedor;
      option.textContent = prov.nombre;
      proveedorSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar proveedores:', error);
  }
}

// Cambiar entre cliente/proveedor según el tipo
tipoSelect.addEventListener('change', () => {
  const tipo = tipoSelect.value;
  
  if (tipo === 'factura_compra') {
    // Mostrar proveedor, ocultar cliente
    clienteGroup.style.display = 'none';
    proveedorGroup.style.display = 'block';
    nombreClienteInput.removeAttribute('required');
    proveedorSelect.setAttribute('required', 'required');
  } else {
    // Mostrar cliente, ocultar proveedor
    clienteGroup.style.display = 'block';
    proveedorGroup.style.display = 'none';
    nombreClienteInput.setAttribute('required', 'required');
    proveedorSelect.removeAttribute('required');
  }
});

// Agregar fila de producto
function agregarProducto() {
  contadorProductos++;
  
  const productoRow = document.createElement('div');
  productoRow.className = 'producto-row';
  productoRow.dataset.id = contadorProductos;
  
  productoRow.innerHTML = `
    <div class="producto-grid">
      <div class="form-group">
        <label>Producto:</label>
        <select class="producto-select filter-select" required>
          <option value="">Selecciona...</option>
          ${productos.map(p => `<option value="${p.idProducto}" data-precio="${p.precioVenta}" data-nombre="${p.nombre}">${p.nombre} - $${p.precioVenta}</option>`).join('')}
        </select>
      </div>
      
      <div class="form-group">
        <label>Cantidad:</label>
        <input type="number" class="cantidad-input filter-input" min="1" value="1" required />
      </div>
      
      <div class="form-group">
        <label>Precio Unitario:</label>
        <input type="number" class="precio-input filter-input" min="0" step="0.01" required />
      </div>
      
      <div class="form-group">
        <label>Subtotal:</label>
        <input type="text" class="subtotal-input filter-input" readonly style="background: #f5f5f5;" />
      </div>
      
      <div class="form-group" style="display: flex; align-items: flex-end;">
        <button type="button" class="btn-remove" onclick="eliminarProducto(${contadorProductos})">🗑️</button>
      </div>
    </div>
  `;
  
  productosContainer.appendChild(productoRow);
  
  // Event listeners para cálculos
  const productoSelect = productoRow.querySelector('.producto-select');
  const cantidadInput = productoRow.querySelector('.cantidad-input');
  const precioInput = productoRow.querySelector('.precio-input');
  const subtotalInput = productoRow.querySelector('.subtotal-input');
  
  productoSelect.addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const precio = selectedOption.dataset.precio;
    precioInput.value = precio || '';
    calcularSubtotalFila(productoRow);
  });
  
  cantidadInput.addEventListener('input', () => calcularSubtotalFila(productoRow));
  precioInput.addEventListener('input', () => calcularSubtotalFila(productoRow));
}

// Calcular subtotal de una fila
function calcularSubtotalFila(row) {
  const cantidad = parseFloat(row.querySelector('.cantidad-input').value) || 0;
  const precio = parseFloat(row.querySelector('.precio-input').value) || 0;
  const subtotal = cantidad * precio;
  
  row.querySelector('.subtotal-input').value = `$${subtotal.toFixed(2)}`;
  
  calcularTotales();
}

// Eliminar producto
function eliminarProducto(id) {
  const row = document.querySelector(`.producto-row[data-id="${id}"]`);
  if (row) {
    row.remove();
    calcularTotales();
  }
}

// Calcular totales generales
function calcularTotales() {
  const filas = document.querySelectorAll('.producto-row');
  let subtotal = 0;
  
  filas.forEach(fila => {
    const cantidad = parseFloat(fila.querySelector('.cantidad-input').value) || 0;
    const precio = parseFloat(fila.querySelector('.precio-input').value) || 0;
    subtotal += cantidad * precio;
  });
  
  const impuestos = subtotal * 0.19; // IVA 19%
  const total = subtotal + impuestos;
  
  document.getElementById('subtotalDisplay').textContent = `$${subtotal.toLocaleString('es-CO', {minimumFractionDigits: 2})}`;
  document.getElementById('impuestosDisplay').textContent = `$${impuestos.toLocaleString('es-CO', {minimumFractionDigits: 2})}`;
  document.getElementById('totalDisplay').textContent = `$${total.toLocaleString('es-CO', {minimumFractionDigits: 2})}`;
}

// Event listener para agregar producto
addProductBtn.addEventListener('click', agregarProducto);

// Manejo del formulario
if (addReceiptForm) {
  addReceiptForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = addReceiptForm.querySelector('button[type="submit"]');
    errorMsg.style.display = 'none';

    // Validar que haya al menos un producto
    const filas = document.querySelectorAll('.producto-row');
    if (filas.length === 0) {
      errorMsg.style.display = 'block';
      errorMsg.textContent = '⚠️ Debes agregar al menos un producto';
      return;
    }

    // Obtener productos
    const detalles = [];
    let valido = true;
    
    filas.forEach(fila => {
      const productoSelect = fila.querySelector('.producto-select');
      const cantidad = parseInt(fila.querySelector('.cantidad-input').value);
      const precio = parseFloat(fila.querySelector('.precio-input').value);
      
      if (!productoSelect.value || !cantidad || !precio) {
        valido = false;
        return;
      }
      
      const selectedOption = productoSelect.options[productoSelect.selectedIndex];
      
      detalles.push({
        idProducto: parseInt(productoSelect.value),
        nombreProducto: selectedOption.dataset.nombre,
        cantidad: cantidad,
        precioUnitario: precio,
        subtotal: cantidad * precio
      });
    });

    if (!valido) {
      errorMsg.style.display = 'block';
      errorMsg.textContent = '⚠️ Completa todos los campos de los productos';
      return;
    }

    // Calcular totales
    const subtotal = detalles.reduce((sum, d) => sum + (d.cantidad * d.precioUnitario), 0);
    const impuestos = subtotal * 0.19;
    const total = subtotal + impuestos;

    // Construir datos del comprobante
    const data = {
      tipo: tipoSelect.value,
      nombreCliente: tipoSelect.value === 'factura_compra' ? null : nombreClienteInput.value.trim(),
      documentoCliente: documentoClienteInput.value.trim() || null,
      idProveedor: tipoSelect.value === 'factura_compra' ? parseInt(proveedorSelect.value) : null,
      subtotal: subtotal,
      impuestos: impuestos,
      total: total,
      observaciones: observacionesInput.value.trim() || null,
      productos: detalles
    };

    // Validaciones
    if (!data.tipo) {
      errorMsg.style.display = 'block';
      errorMsg.textContent = '⚠️ Selecciona el tipo de comprobante';
      return;
    }

    if (data.tipo === 'factura_compra' && !data.idProveedor) {
      errorMsg.style.display = 'block';
      errorMsg.textContent = '⚠️ Selecciona un proveedor';
      return;
    }

    if (data.tipo !== 'factura_compra' && !data.nombreCliente) {
      errorMsg.style.display = 'block';
      errorMsg.textContent = '⚠️ Ingresa el nombre del cliente';
      return;
    }

    // Confirmar
    if (!confirm(`¿Generar comprobante?\n\nTipo: ${tipoSelect.options[tipoSelect.selectedIndex].text}\nTotal: $${total.toLocaleString('es-CO', {minimumFractionDigits: 2})}`)) {
      return;
    }

    // Deshabilitar botón
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> Generando...';

    try {
      const response = await apiRequest('/receipts', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      showNotification(`✅ Comprobante ${response.numeroComprobante} generado correctamente`, 'success');
      
      // Preguntar si desea imprimir
      if (confirm('¿Deseas ver/imprimir el comprobante ahora?')) {
        window.open(`view-receipt.html?id=${response.idComprobante}`, '_blank');
      }
      
      // Redirigir
      setTimeout(() => {
        window.location.href = 'receipts.html';
      }, 1500);

    } catch (error) {
      console.error('Error al generar comprobante:', error);
      errorMsg.style.display = 'block';
      errorMsg.textContent = error.message || '❌ Error al generar el comprobante';
      showNotification('Error al generar el comprobante', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="btn-icon">💾</span> Generar Comprobante';
    }
  });
}

// Inicializar correctamente
(async () => {
  await cargarProductos();     // Espera a que se carguen los productos
  await cargarProveedores();   // Carga proveedores
  agregarProducto();           // Ahora sí agrega la primera fila con productos disponibles
})();
