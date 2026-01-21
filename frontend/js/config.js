// ===== CONFIGURACIÓN GLOBAL =====
const API_URL = 'http://localhost:3000/api';

// Helper para hacer peticiones a la API
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error en la petición');
    }

    return data;
  } catch (error) {
    console.error('Error en la API:', error);
    throw error;
  }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// Función para verificar autenticación
function checkAuth() {
  const token = localStorage.getItem('token');
  const currentPage = window.location.pathname;

  // ✅ Detecta correctamente si estamos en index.html
  const isLoginPage = currentPage.endsWith('index.html') || 
                      currentPage === '/' || 
                      currentPage.endsWith('/');

  // Si no hay token y NO estamos en login, redirigir
  if (!token && !isLoginPage) {
    window.location.href = 'index.html';
  }
}

// ✅ Verificar autenticación solo si NO estamos en la página de login
const currentPage = window.location.pathname;
const isLoginPage = currentPage.endsWith('index.html') || 
                    currentPage === '/' || 
                    currentPage.endsWith('/');

if (!isLoginPage) {
  checkAuth();
}