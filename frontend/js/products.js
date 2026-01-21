// ===== VER PRODUCTOS CON ESTADOS Y FILTROS =====
const tableBody = document.getElementById("productosTableBody");
const editarBtn = document.getElementById("editarBtn");
const eliminarBtn = document.getElementById("eliminarBtn");
const reactivarBtn = document.getElementById("reactivarBtn");
const verDetalleBtn = document.getElementById("verDetalleBtn");
const refreshBtn = document.getElementById("refreshBtn");
const searchInput = document.getElementById("searchProduct");
const filterCategory = document.getElementById("filterCategory");
const filterStatus = document.getElementById("filterStatus");

let productos = [];
let productosFiltrados = [];
let seleccionadoIndex = null;
let selectedProductId = null;
let selectedProductStatus = null;

// Cargar productos desde la API
async function cargarProductos() {
  try {
    tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Cargando productos...</td></tr>';
    
    const data = await apiRequest('/products');
    productos = data;
    productosFiltrados = data;

    if (productos.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No hay productos registrados</td></tr>';
      return;
    }

    renderProductos(productosFiltrados);
  } catch (error) {
    console.error('Error al cargar productos:', error);
    tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:red;">Error al cargar productos</td></tr>';
    showNotification('Error al cargar productos', 'error');
  }
}

// Renderizar productos en la tabla
function renderProductos(items) {
  tableBody.innerHTML = "";

  if (items.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No hay productos con estos filtros</td></tr>';
    return;
  }

  items.forEach((prod, i) => {
    const tr = document.createElement("tr");
    tr.dataset.index = i;
    tr.dataset.id = prod.idProducto;
    tr.dataset.status = prod.estado;

    // Determinar badge según el estado
    let estadoBadge = '';
    switch(prod.estado) {
      case 'Disponible':
        estadoBadge = '<span class="badge success"> Disponible</span>';
        break;
      case 'No disponible':
        estadoBadge = '<span class="badge warning"> No disponible</span>';
        break;
      case 'Inactivo':
        estadoBadge = '<span class="badge danger"> Inactivo</span>';
        break;
      default:
        estadoBadge = '<span class="badge">Desconocido</span>';
    }

    tr.innerHTML = `
      <td><div class="select-box"></div></td>
      <td>${prod.idProducto}</td>
      <td>${prod.nombre}</td>
      <td>${prod.categoria || 'Sin categoría'}</td>
      <td>${prod.cantidad || 0}</td>
      <td>${prod.stockMinimo || 0}</td>
      <td>$${parseInt(prod.precioCompra || 0)}</td>
      <td>$${parseInt(prod.precioVenta || 0)}</td>
      <td>${prod.proveedor || 'Sin proveedor'}</td>
      <td>${estadoBadge}</td>
    `;
    tableBody.appendChild(tr);

    const checkbox = tr.querySelector(".select-box");
    checkbox.addEventListener("click", () => {
      // Deseleccionar todos
      tableBody.querySelectorAll("tr").forEach(r => r.classList.remove("selected"));
      tableBody.querySelectorAll(".select-box").forEach(b => b.classList.remove("selected"));
      
      // Seleccionar el actual
      tr.classList.add("selected");
      checkbox.classList.add("selected");
      seleccionadoIndex = i;
      selectedProductId = prod.idProducto;
      selectedProductStatus = prod.estado;

      // Mostrar/ocultar botones según el estado
      actualizarBotonesAccion();
    });
  });
}

// Actualizar visibilidad de botones según el estado del producto
function actualizarBotonesAccion() {
  if (selectedProductStatus === 'Inactivo') {
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

// Cargar categorías para el filtro
async function cargarCategorias() {
  try {
    const categorias = await apiRequest('/categories');
    filterCategory.innerHTML = '<option value="">Todas las categorías</option>';
    categorias.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.idCategoria;
      option.textContent = cat.nombre;
      filterCategory.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar categorías:', error);
  }
}

// Filtrar productos
function filtrarProductos() {
  const searchTerm = searchInput.value.toLowerCase();
  const categoryId = filterCategory.value;
  const status = filterStatus.value;

  productosFiltrados = productos.filter(prod => {
    const matchSearch = prod.nombre.toLowerCase().includes(searchTerm) ||
                       (prod.descripcion && prod.descripcion.toLowerCase().includes(searchTerm));
    const matchCategory = !categoryId || prod.idCategoria == categoryId;
    const matchStatus = !status || prod.estado === status;
    
    return matchSearch && matchCategory && matchStatus;
  });

  renderProductos(productosFiltrados);
}

// Eliminar producto (marcar como inactivo)
async function eliminarProducto() {
  if (!selectedProductId) {
    showNotification('Selecciona un producto primero', 'warning');
    return;
  }

  const producto = productos.find(p => p.idProducto === selectedProductId);
  if (!confirm(`¿Deseas marcar como inactivo el producto "${producto.nombre}"?\n\nPodrás reactivarlo después si lo necesitas.`)) return;

  try {
    await apiRequest(`/products/${selectedProductId}`, {
      method: 'DELETE'
    });

    showNotification('Producto marcado como inactivo', 'success');
    selectedProductId = null;
    seleccionadoIndex = null;
    selectedProductStatus = null;
    cargarProductos();
  } catch (error) {
    showNotification('Error al desactivar el producto', 'error');
  }
}

// Reactivar producto
async function reactivarProducto() {
  if (!selectedProductId) {
    showNotification('Selecciona un producto primero', 'warning');
    return;
  }

  const producto = productos.find(p => p.idProducto === selectedProductId);
  if (!confirm(`¿Deseas reactivar el producto "${producto.nombre}"?`)) return;

  try {
    await apiRequest(`/products/${selectedProductId}/reactivate`, {
      method: 'PATCH'
    });

    showNotification('Producto reactivado correctamente', 'success');
    selectedProductId = null;
    seleccionadoIndex = null;
    selectedProductStatus = null;
    cargarProductos();
  } catch (error) {
    showNotification('Error al reactivar el producto', 'error');
  }
}

// Editar producto
function editarProducto() {
  if (!selectedProductId) {
    showNotification('Selecciona un producto primero', 'warning');
    return;
  }
  window.location.href = `../html/add-product.html?id=${selectedProductId}`;
}

// Ver detalle
function verDetalle() {
  if (!selectedProductId) {
    showNotification('Selecciona un producto primero', 'warning');
    return;
  }
  const producto = productos.find(p => p.idProducto === selectedProductId);
  alert(`
    📋 DETALLE DEL PRODUCTO
    ═══════════════════════════════
    
    ID: ${producto.idProducto}
    Nombre: ${producto.nombre}
    Categoría: ${producto.categoria || 'Sin categoría'}
    Estado: ${producto.estado}
    
    Stock actual: ${producto.cantidad}
    Stock mínimo: ${producto.stockMinimo}
    
    Precio compra: $${producto.precioCompra}
    Precio venta: $${producto.precioVenta}
    
    🏢 Proveedor: ${producto.proveedor || 'Sin proveedor asignado'}
    
    Descripción: ${producto.descripcion || 'Sin descripción'}
  `);
}

// Event Listeners
if (refreshBtn) refreshBtn.addEventListener('click', cargarProductos);
if (eliminarBtn) eliminarBtn.addEventListener('click', eliminarProducto);
if (reactivarBtn) reactivarBtn.addEventListener('click', reactivarProducto);
if (editarBtn) editarBtn.addEventListener('click', editarProducto);
if (verDetalleBtn) verDetalleBtn.addEventListener('click', verDetalle);
if (searchInput) searchInput.addEventListener('input', filtrarProductos);
if (filterCategory) filterCategory.addEventListener('change', filtrarProductos);
if (filterStatus) filterStatus.addEventListener('change', filtrarProductos);

// Inicializar
cargarProductos();
cargarCategorias();