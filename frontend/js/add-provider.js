// ===== AÑADIR/EDITAR PROVEEDOR =====
let modoEdicion = false;
let idProveedorActual = null;

// ========================================
// DETECTAR MODO (AÑADIR vs EDITAR)
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  idProveedorActual = urlParams.get('id');

  if (idProveedorActual) {
    modoEdicion = true;
    document.getElementById('pageTitle').innerHTML = '✏️ Editar Proveedor';
    document.querySelector('header p').textContent = 'Modifica la información del proveedor';
    document.querySelector('.form-header h2').textContent = '✏️ Editar Proveedor';
    document.getElementById('submitBtn').innerHTML = '<span class="btn-icon">💾</span> Actualizar Proveedor';
    
    await cargarDatosProveedor(idProveedorActual);
  }
});

// ========================================
// CARGAR DATOS DEL PROVEEDOR (MODO EDICIÓN)
// ========================================
async function cargarDatosProveedor(id) {
  try {
    const proveedor = await apiRequest(`/providers/${id}`);
    
    // Llenar formulario
    document.getElementById('nombre').value = proveedor.nombre || '';
    document.getElementById('telefono').value = proveedor.telefono || '';
    document.getElementById('correo').value = proveedor.correo || '';
    document.getElementById('direccion').value = proveedor.direccion || '';
    document.getElementById('nit').value = proveedor.nit || '';
    document.getElementById('contactoNombre').value = proveedor.contactoNombre || '';
    document.getElementById('notas').value = proveedor.notas || '';
    
    console.log('✅ Datos del proveedor cargados:', proveedor.nombre);
    
  } catch (error) {
    console.error('❌ Error al cargar proveedor:', error);
    showNotification('Error al cargar los datos del proveedor', 'error');
    setTimeout(() => {
      window.location.href = 'providers.html';
    }, 2000);
  }
}

// ========================================
// ENVIAR FORMULARIO
// ========================================
document.getElementById('addProviderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const errorMsg = document.getElementById('error-msg');
  errorMsg.style.display = 'none';
  
  // Obtener datos del formulario
  const formData = {
    nombre: document.getElementById('nombre').value.trim(),
    telefono: document.getElementById('telefono').value.trim(),
    correo: document.getElementById('correo').value.trim(),
    direccion: document.getElementById('direccion').value.trim(),
    nit: document.getElementById('nit').value.trim(),
    contactoNombre: document.getElementById('contactoNombre').value.trim(),
    notas: document.getElementById('notas').value.trim()
  };
  
  // Validar nombre
  if (!formData.nombre) {
    errorMsg.textContent = '❌ El nombre del proveedor es obligatorio';
    errorMsg.style.display = 'block';
    document.getElementById('nombre').focus();
    return;
  }
  
  // Validar correo (si se proporciona)
  if (formData.correo) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.correo)) {
      errorMsg.textContent = '❌ El correo electrónico no es válido';
      errorMsg.style.display = 'block';
      document.getElementById('correo').focus();
      return;
    }
  }
  
  try {
    const submitBtn = document.getElementById('submitBtn');
    
    // Deshabilitar botón
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Guardando...';
    
    if (modoEdicion) {
      // Actualizar proveedor existente
      await apiRequest(`/providers/${idProveedorActual}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      showNotification('Proveedor actualizado correctamente', 'success');
    } else {
      // Crear nuevo proveedor
      await apiRequest('/providers', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      showNotification('Proveedor creado correctamente', 'success');
    }
    
    // Redirigir a la lista
    setTimeout(() => {
      window.location.href = 'providers.html';
    }, 1500);
    
  } catch (error) {
    console.error('❌ Error:', error);
    errorMsg.textContent = `❌ ${error.message || 'Error al guardar proveedor'}`;
    errorMsg.style.display = 'block';
    
    // Rehabilitar botón
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = false;
    submitBtn.innerHTML = modoEdicion 
      ? '<span class="btn-icon">💾</span> Actualizar Proveedor'
      : '<span class="btn-icon">💾</span> Guardar Proveedor';
  }
});