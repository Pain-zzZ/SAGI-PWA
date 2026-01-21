// ===== AÑADIR/EDITAR USUARIO =====
let modoEdicion = false;
let idUsuarioActual = null;

// ========================================
// CARGAR ROLES EN EL SELECTOR
// ========================================
async function cargarRoles() {
  try {
    const roles = await apiRequest('/users/roles');
    
    const select = document.getElementById('idRol');
    select.innerHTML = '<option value="">Selecciona un rol...</option>';
    
    roles.forEach(rol => {
      const option = document.createElement('option');
      option.value = rol.idRol;
      option.textContent = rol.nombre;
      select.appendChild(option);
    });
    
    console.log('✅ Roles cargados:', roles.length);
  } catch (error) {
    console.error('❌ Error al cargar roles:', error);
    showNotification('Error al cargar roles', 'error');
  }
}

// ========================================
// DETECTAR MODO (AÑADIR vs EDITAR)
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
  // Cargar roles primero
  await cargarRoles();
  
  const urlParams = new URLSearchParams(window.location.search);
  idUsuarioActual = urlParams.get('id');

  if (idUsuarioActual) {
    modoEdicion = true;
    document.getElementById('pageTitle').innerHTML = '✏️ Editar Usuario';
    document.querySelector('header p').textContent = 'Modifica la información del usuario';
    document.querySelector('.form-header h2').textContent = '✏️ Editar Usuario';
    document.getElementById('submitBtn').innerHTML = '<span class="btn-icon">💾</span> Actualizar Usuario';
    
    // Ocultar la tarjeta de contraseña en modo edición
    const passwordCard = document.querySelector('.card[style*="background: #e3f2fd"]');
    if (passwordCard) {
      passwordCard.style.display = 'none';
    }
    
    await cargarDatosUsuario(idUsuarioActual);
  }
});

// ========================================
// CARGAR DATOS DEL USUARIO (MODO EDICIÓN)
// ========================================
async function cargarDatosUsuario(id) {
  try {
    const usuario = await apiRequest(`/users/${id}`);
    
    // Llenar formulario
    document.getElementById('nombre').value = usuario.nombre || '';
    document.getElementById('correo').value = usuario.correo || '';
    document.getElementById('idRol').value = usuario.idRol || '';
    
    console.log('✅ Datos del usuario cargados:', usuario.nombre);
    
  } catch (error) {
    console.error('❌ Error al cargar usuario:', error);
    showNotification('Error al cargar los datos del usuario', 'error');
    setTimeout(() => {
      window.location.href = 'users.html';
    }, 2000);
  }
}

// ========================================
// ENVIAR FORMULARIO
// ========================================
document.getElementById('addUserForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const errorMsg = document.getElementById('error-msg');
  errorMsg.style.display = 'none';
  
  // Obtener datos del formulario
  const formData = {
    nombre: document.getElementById('nombre').value.trim(),
    correo: document.getElementById('correo').value.trim().toLowerCase(),
    idRol: parseInt(document.getElementById('idRol').value)
  };
  
  // Validaciones
  if (!formData.nombre) {
    errorMsg.textContent = '❌ El nombre del usuario es obligatorio';
    errorMsg.style.display = 'block';
    document.getElementById('nombre').focus();
    return;
  }
  
  if (!formData.correo) {
    errorMsg.textContent = '❌ El correo electrónico es obligatorio';
    errorMsg.style.display = 'block';
    document.getElementById('correo').focus();
    return;
  }
  
  // Validar formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.correo)) {
    errorMsg.textContent = '❌ El correo electrónico no es válido';
    errorMsg.style.display = 'block';
    document.getElementById('correo').focus();
    return;
  }
  
  if (!formData.idRol) {
    errorMsg.textContent = '❌ Debes seleccionar un rol';
    errorMsg.style.display = 'block';
    document.getElementById('idRol').focus();
    return;
  }
  
  try {
    const submitBtn = document.getElementById('submitBtn');
    
    // Deshabilitar botón
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Guardando...';
    
    if (modoEdicion) {
      // Actualizar usuario existente
      await apiRequest(`/users/${idUsuarioActual}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      showNotification('Usuario actualizado correctamente', 'success');
    } else {
      // Crear nuevo usuario
      const result = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      // Mostrar contraseña temporal
      if (result.passwordTemporal) {
        showNotification(
          `✅ Usuario creado correctamente\n\n🔑 Contraseña temporal: ${result.passwordTemporal}\n\n⚠️ Asegúrate de comunicarle esta contraseña al usuario`,
          'success'
        );
        
        // Mostrar modal con la contraseña
        mostrarModalPassword(formData.nombre, formData.correo, result.passwordTemporal);
      } else {
        showNotification('Usuario creado correctamente', 'success');
      }
    }
    
    // Redirigir a la lista después de 3 segundos (para que lean la contraseña)
    setTimeout(() => {
      window.location.href = 'users.html';
    }, modoEdicion ? 1500 : 4000);
    
  } catch (error) {
    console.error('❌ Error:', error);
    errorMsg.textContent = `❌ ${error.message || 'Error al guardar usuario'}`;
    errorMsg.style.display = 'block';
    
    // Rehabilitar botón
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = false;
    submitBtn.innerHTML = modoEdicion 
      ? '<span class="btn-icon">💾</span> Actualizar Usuario'
      : '<span class="btn-icon">💾</span> Guardar Usuario';
  }
});

// ========================================
// MOSTRAR MODAL CON CONTRASEÑA TEMPORAL
// ========================================
function mostrarModalPassword(nombre, correo, password) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  modal.innerHTML = `
    <div style="
      background: white;
      padding: 30px;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      text-align: center;
    ">
      <div style="font-size: 3rem; margin-bottom: 15px;">✅</div>
      <h2 style="margin: 0 0 15px 0; color: #1b263b;">Usuario Creado Exitosamente</h2>
      
      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: #666;"><strong>Nombre:</strong> ${nombre}</p>
        <p style="margin: 0 0 10px 0; color: #666;"><strong>Correo:</strong> ${correo}</p>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #2196f3;">
          <p style="margin: 0 0 5px 0; color: #1976d2; font-weight: bold;">🔑 Contraseña Temporal:</p>
          <p style="
            font-size: 1.8rem; 
            font-weight: bold; 
            color: #1976d2; 
            margin: 10px 0;
            font-family: monospace;
            background: white;
            padding: 10px;
            border-radius: 6px;
          ">${password}</p>
        </div>
      </div>
      
      <p style="color: #666; font-size: 0.9rem; margin: 15px 0;">
        ⚠️ <strong>Importante:</strong> Comunica esta contraseña al usuario de forma segura.<br>
        El usuario debe cambiarla en su primer inicio de sesión.
      </p>
      
      <button 
        onclick="this.parentElement.parentElement.remove()" 
        style="
          background: #1976d2;
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 10px;
        "
      >
        Entendido
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Cerrar al hacer click fuera del modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// ========================================
// VALIDACIÓN EN TIEMPO REAL
// ========================================

// Validar correo mientras se escribe
document.getElementById('correo').addEventListener('blur', function() {
  const correo = this.value.trim();
  const errorMsg = document.getElementById('error-msg');
  
  if (correo) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      errorMsg.textContent = '⚠️ El correo electrónico no tiene un formato válido';
      errorMsg.style.display = 'block';
      this.style.borderColor = '#f44336';
    } else {
      errorMsg.style.display = 'none';
      this.style.borderColor = '#4caf50';
    }
  }
});

// Resetear estilo al escribir
document.getElementById('correo').addEventListener('input', function() {
  this.style.borderColor = '';
});