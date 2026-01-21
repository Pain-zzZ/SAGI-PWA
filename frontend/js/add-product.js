// ===== AÑADIR O EDITAR PRODUCTO CON STOCK =====
const addProductForm = document.getElementById("addProductForm");
const categoriaSelect = document.getElementById("categoria");
const proveedorSelect = document.getElementById("proveedor");
const errorMsg = document.getElementById("error-msg");
const pageTitle = document.getElementById("pageTitle");
const submitBtn = document.getElementById("submitBtn");

// Campos de stock
const cantidadInicialGroup = document.getElementById("cantidadInicialGroup");
const stockActualGroup = document.getElementById("stockActualGroup");
const cantidadInicialInput = document.getElementById("cantidadInicial");
const stockActualInput = document.getElementById("stockActual");

// Obtener ID del producto si existe en la URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');
const isEditMode = !!productId;

let stockOriginal = 0; // Guardamos el stock original para detectar cambios

// Cambiar título según el modo
if (isEditMode) {
  pageTitle.textContent = '✏️ Editar Producto';
  submitBtn.textContent = '💾 Actualizar producto';
  
  // En edición: ocultar cantidad inicial y mostrar stock actual
  cantidadInicialGroup.style.display = 'none';
  stockActualGroup.style.display = 'block';
  cantidadInicialInput.removeAttribute('required');
  stockActualInput.setAttribute('required', 'required');
}

// Cargar categorías desde la API
async function cargarCategorias() {
  try {
    const categorias = await apiRequest('/categories');
    categoriaSelect.innerHTML = '<option value="">Selecciona una categoría</option>';
    
    categorias.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.idCategoria;
      option.textContent = cat.nombre;
      categoriaSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar categorías:', error);
    showNotification('Error al cargar categorías', 'error');
  }
}

// Cargar proveedores desde la API
async function cargarProveedores() {
  try {
    const proveedores = await apiRequest('/providers');
    proveedorSelect.innerHTML = '<option value="">Sin proveedor asignado</option>';
    
    proveedores.forEach(prov => {
      const option = document.createElement('option');
      option.value = prov.idProveedor;
      option.textContent = prov.nombre;
      proveedorSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar proveedores:', error);
    showNotification('Error al cargar proveedores', 'error');
  }
}

// Cargar datos del producto si estamos en modo edición
async function cargarDatosProducto() {
  if (!isEditMode) return;

  try {
    const producto = await apiRequest(`/products/${productId}`);
    
    // Llenar el formulario con los datos existentes
    document.getElementById("nombre").value = producto.nombre || '';
    document.getElementById("descripcion").value = producto.descripcion || '';
    document.getElementById("precioCompra").value = producto.precioCompra || '';
    document.getElementById("precioVenta").value = producto.precioVenta || '';
    document.getElementById("stockMinimo").value = producto.stockMinimo || '';
    
    // Cargar stock actual
    stockActualInput.value = producto.cantidad || 0;
    stockOriginal = producto.cantidad || 0; // Guardar para comparar después
    
    // Resaltar el campo de stock
    stockActualInput.style.backgroundColor = '#fff9e6';
    stockActualInput.style.border = '2px solid #ff9800';
    
    // Esperar a que se carguen las categorías y luego seleccionar
    await cargarCategorias();
    document.getElementById("categoria").value = producto.idCategoria || '';
    
    console.log('✅ Datos del producto cargados para edición');
    console.log('📦 Stock original:', stockOriginal);

  } catch (error) {
    console.error('Error al cargar producto:', error);
    showNotification('Error al cargar los datos del producto', 'error');
    setTimeout(() => {
      window.location.href = '../html/products.html';
    }, 2000);
  }
}

// Manejo del formulario (crear o actualizar)
if (addProductForm) {
  addProductForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    errorMsg.style.display = 'none';

    // Obtener datos del formulario
    const data = {
      nombre: document.getElementById("nombre").value.trim(),
      idCategoria: parseInt(document.getElementById("categoria").value),
      descripcion: document.getElementById("descripcion").value.trim(),
      precioCompra: parseFloat(document.getElementById("precioCompra").value),
      precioVenta: parseFloat(document.getElementById("precioVenta").value),
      stockMinimo: parseInt(document.getElementById("stockMinimo").value),
      idProveedor: document.getElementById("proveedor").value ? parseInt(document.getElementById("proveedor").value) : null
    };

    // Agregar campos específicos según el modo
    if (isEditMode) {
      data.stockDisponible = parseInt(stockActualInput.value);
    } else {
      data.cantidadInicial = parseInt(cantidadInicialInput.value);
    }

    // Validaciones
    if (!data.nombre || !data.idCategoria || data.precioCompra < 0 || data.precioVenta < 0) {
      errorMsg.style.display = 'block';
      errorMsg.textContent = "Por favor, completa todos los campos obligatorios correctamente.";
      return;
    }

    if (data.precioVenta < data.precioCompra) {
      if (!confirm("El precio de venta es menor al precio de compra. ¿Deseas continuar?")) {
        return;
      }
    }

    // Confirmar cambio de stock si está en modo edición
    if (isEditMode && data.stockDisponible !== stockOriginal) {
      const diferencia = data.stockDisponible - stockOriginal;
      const tipoMov = diferencia > 0 ? 'incremento' : 'reducción';
      const mensaje = `⚠️ Vas a ${tipoMov === 'incremento' ? 'aumentar' : 'reducir'} el stock en ${Math.abs(diferencia)} unidades.\n\nStock actual: ${stockOriginal}\nNuevo stock: ${data.stockDisponible}\n\nEsto registrará un movimiento de ajuste. ¿Continuar?`;
      
      if (!confirm(mensaje)) {
        return;
      }
    }

    // Deshabilitar botón
    submitBtn.disabled = true;
    submitBtn.textContent = isEditMode ? "Actualizando..." : "Guardando...";

    try {
      if (isEditMode) {
        // ACTUALIZAR producto existente
        await apiRequest(`/products/${productId}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });

        if (data.stockDisponible !== stockOriginal) {
          showNotification(`✅ Producto "${data.nombre}" actualizado. Stock ajustado: ${stockOriginal} → ${data.stockDisponible}`, 'success');
        } else {
          showNotification(`✅ Producto "${data.nombre}" actualizado correctamente`, 'success');
        }
      } else {
        // CREAR nuevo producto
        await apiRequest('/products', {
          method: 'POST',
          body: JSON.stringify(data)
        });

        showNotification(`✅ Producto "${data.nombre}" agregado correctamente`, 'success');
        addProductForm.reset();
      }
      
      // Redirigir a la lista de productos después de 2 segundos
      setTimeout(() => {
        window.location.href = '../html/products.html';
      }, 2000);

    } catch (error) {
      console.error('Error al guardar producto:', error);
      errorMsg.style.display = 'block';
      errorMsg.textContent = error.message || 'Error al guardar el producto';
      showNotification('Error al guardar el producto', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isEditMode ? "💾 Actualizar producto" : "💾 Guardar producto";
    }
  });
}

// Inicializar: cargar datos
async function inicializar() {
  await cargarCategorias();
  await cargarProveedores();
  
  // Si estamos en modo edición, cargar los datos del producto
  if (isEditMode) {
    await cargarDatosProducto();
  }
}

// Ejecutar al cargar la página
inicializar();