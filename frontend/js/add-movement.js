// ===== REGISTRAR MOVIMIENTO MANUAL MEJORADO =====
const addMovementForm = document.getElementById("addMovementForm");
const productoSelect = document.getElementById("producto");
const tipoSelect = document.getElementById("tipo");
const cantidadInput = document.getElementById("cantidad");
const descripcionInput = document.getElementById("descripcion");
const errorMsg = document.getElementById("error-msg");

// Elementos de información
const productoInfoCard = document.getElementById("productoInfo");
const stockActualValue = document.getElementById("stockActualValue");
const stockMinimoValue = document.getElementById("stockMinimoValue");
const estadoValue = document.getElementById("estadoValue");
const categoriaValue = document.getElementById("categoriaValue");
const stockWarning = document.getElementById("stockWarning");
const cantidadHelper = document.getElementById("cantidadHelper");

// Vista previa
const resultadoPreview = document.getElementById("resultadoPreview");
const previewStockActual = document.getElementById("previewStockActual");
const previewStockFinal = document.getElementById("previewStockFinal");

let productos = [];
let productoSeleccionado = null;

// Cargar productos activos
async function cargarProductos() {
  try {
    const data = await apiRequest('/products');
    // Filtrar solo productos activos
    productos = data.filter(p => p.estado !== 'Inactivo');
    
    productoSelect.innerHTML = '<option value="">Selecciona un producto...</option>';
    
    productos.forEach(prod => {
      const option = document.createElement('option');
      option.value = prod.idProducto;
      
      // Emoji según estado
      let emoji = '';
      if (prod.estado === 'Disponible') emoji = '✅';
      else if (prod.estado === 'No disponible') emoji = '⚠️';
      
      option.textContent = `${emoji} ${prod.nombre} (Stock: ${prod.cantidad})`;
      option.dataset.stock = prod.cantidad;
      option.dataset.stockMinimo = prod.stockMinimo;
      option.dataset.nombre = prod.nombre;
      option.dataset.estado = prod.estado;
      option.dataset.categoria = prod.categoria;
      
      productoSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar productos:', error);
    showNotification('Error al cargar productos', 'error');
  }
}

// Actualizar información cuando se selecciona un producto
productoSelect.addEventListener('change', (e) => {
  const selectedOption = e.target.options[e.target.selectedIndex];
  
  if (selectedOption.value) {
    const stock = parseInt(selectedOption.dataset.stock);
    const stockMinimo = parseInt(selectedOption.dataset.stockMinimo);
    const nombre = selectedOption.dataset.nombre;
    const estado = selectedOption.dataset.estado;
    const categoria = selectedOption.dataset.categoria;
    
    productoSeleccionado = {
      id: selectedOption.value,
      nombre: nombre,
      stock: stock,
      stockMinimo: stockMinimo,
      estado: estado,
      categoria: categoria
    };
    
    // Mostrar card de información
    productoInfoCard.style.display = 'block';
    stockActualValue.textContent = `${stock} unidades`;
    stockActualValue.style.color = stock > stockMinimo ? '#4caf50' : '#e63946';
    stockMinimoValue.textContent = `${stockMinimo} unidades`;
    
    // Badge de estado
    let estadoBadge = '';
    if (estado === 'Disponible') {
      estadoBadge = '<span class="badge success">Disponible</span>';
    } else if (estado === 'No disponible') {
      estadoBadge = '<span class="badge warning">Sin stock</span>';
    }
    estadoValue.innerHTML = estadoBadge;
    categoriaValue.textContent = categoria;
    
    // Actualizar vista previa si hay cantidad y tipo
    actualizarVistaPrevia();
  } else {
    productoInfoCard.style.display = 'none';
    resultadoPreview.style.display = 'none';
    productoSeleccionado = null;
  }
});

// Validar cantidad según el tipo
function validarCantidad() {
  if (!productoSeleccionado || !tipoSelect.value || !cantidadInput.value) {
    stockWarning.style.display = 'none';
    cantidadHelper.textContent = '';
    return true;
  }
  
  const cantidad = parseInt(cantidadInput.value);
  const tipo = tipoSelect.value;
  
  if (tipo === 'salida' && cantidad > productoSeleccionado.stock) {
    stockWarning.style.display = 'block';
    cantidadInput.style.borderColor = '#e63946';
    cantidadHelper.textContent = `⚠️ Máximo: ${productoSeleccionado.stock}`;
    cantidadHelper.style.color = '#e63946';
    return false;
  } else {
    stockWarning.style.display = 'none';
    cantidadInput.style.borderColor = '#4a90e2';
    cantidadHelper.textContent = '✓';
    cantidadHelper.style.color = '#4caf50';
    return true;
  }
}

// Actualizar vista previa del resultado
function actualizarVistaPrevia() {
  if (!productoSeleccionado || !tipoSelect.value || !cantidadInput.value) {
    resultadoPreview.style.display = 'none';
    return;
  }
  
  const cantidad = parseInt(cantidadInput.value);
  const tipo = tipoSelect.value;
  const stockActual = productoSeleccionado.stock;
  let stockFinal = stockActual;
  
  if (tipo === 'entrada') {
    stockFinal = stockActual + cantidad;
  } else if (tipo === 'salida') {
    stockFinal = stockActual - cantidad;
  } else if (tipo === 'ajuste') {
    // Para ajuste, mostrar que puede ser + o -
    stockFinal = '±' + cantidad;
  }
  
  resultadoPreview.style.display = 'block';
  previewStockActual.textContent = stockActual;
  previewStockFinal.textContent = stockFinal;
  
  // Color según el resultado
  if (tipo === 'entrada') {
    previewStockFinal.style.color = '#4caf50';
  } else if (tipo === 'salida') {
    previewStockFinal.style.color = '#e63946';
  } else {
    previewStockFinal.style.color = '#ff9800';
  }
}

// Event listeners para vista previa
tipoSelect.addEventListener('change', () => {
  validarCantidad();
  actualizarVistaPrevia();
  
  // Sugerir descripción según el tipo
  if (!descripcionInput.value) {
    const tipo = tipoSelect.value;
    if (tipo === 'entrada') {
      descripcionInput.placeholder = 'Ej: Compra a proveedor, devolución de cliente...';
    } else if (tipo === 'salida') {
      descripcionInput.placeholder = 'Ej: Venta, consumo interno, pérdida, merma...';
    } else if (tipo === 'ajuste') {
      descripcionInput.placeholder = 'Ej: Ajuste por conteo físico, corrección de inventario...';
    }
  }
});

cantidadInput.addEventListener('input', () => {
  validarCantidad();
  actualizarVistaPrevia();
});

// Manejo del formulario
if (addMovementForm) {
  addMovementForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const submitBtn = addMovementForm.querySelector('button[type="submit"]');
    errorMsg.style.display = 'none';

    // Obtener datos del formulario
    const data = {
      idProducto: parseInt(productoSelect.value),
      tipo: tipoSelect.value,
      cantidad: parseInt(cantidadInput.value),
      descripcion: descripcionInput.value.trim() || `Movimiento manual: ${tipoSelect.value}`
    };

    // Validaciones
    if (!data.idProducto || !data.tipo || !data.cantidad || data.cantidad <= 0) {
      errorMsg.style.display = 'block';
      errorMsg.textContent = "⚠️ Por favor, completa todos los campos obligatorios correctamente.";
      return;
    }

    // Validar stock para salidas
    if (data.tipo === 'salida' && productoSeleccionado) {
      if (data.cantidad > productoSeleccionado.stock) {
        errorMsg.style.display = 'block';
        errorMsg.textContent = `❌ Stock insuficiente. Stock actual: ${productoSeleccionado.stock}, cantidad solicitada: ${data.cantidad}`;
        return;
      }
    }

    // Confirmar acción con detalles
    const tipoTexto = {
      'entrada': '📥 ENTRADA',
      'salida': '📤 SALIDA',
      'ajuste': '⚖️ AJUSTE'
    };
    
    const stockFinal = data.tipo === 'entrada' 
      ? productoSeleccionado.stock + data.cantidad
      : productoSeleccionado.stock - data.cantidad;
    
    const mensaje = `¿Confirmar ${tipoTexto[data.tipo]}?\n\n` +
                   `Producto: ${productoSeleccionado.nombre}\n` +
                   `Cantidad: ${data.cantidad} unidades\n` +
                   `Stock actual: ${productoSeleccionado.stock}\n` +
                   `Stock final: ${stockFinal}\n\n` +
                   `Descripción: ${data.descripcion}`;
    
    if (!confirm(mensaje)) return;

    // Deshabilitar botón
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> Registrando...';

    try {
      // Enviar a la API
      const response = await apiRequest('/movements', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      showNotification(
        `✅ Movimiento registrado correctamente\nNuevo stock: ${response.stockNuevo} unidades`, 
        'success'
      );
      
      // Redirigir al historial después de 1.5 segundos
      setTimeout(() => {
        window.location.href = '../html/movements.html';
      }, 1500);

    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      errorMsg.style.display = 'block';
      errorMsg.textContent = error.message || '❌ Error al registrar el movimiento';
      showNotification('Error al registrar el movimiento', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="btn-icon">💾</span> Registrar Movimiento';
    }
  });
}

// Inicializar
cargarProductos();