// ===== DASHBOARD - ESTADÍSTICAS =====

async function loadDashboardStats() {
  try {
    // Mostrar indicador de carga
    document.getElementById('totalProducts').textContent = '...';
    document.getElementById('lowStock').textContent = '...';
    document.getElementById('todayMovements').textContent = '...';
    document.getElementById('totalProviders').textContent = '...';

    // Cargar estadísticas desde la API
    const stats = await apiRequest('/dashboard/stats');

    // Actualizar números en las tarjetas con animación
    animateValue('totalProducts', 0, stats.totalProducts || 0, 1000);
    animateValue('lowStock', 0, stats.lowStock || 0, 1000);
    animateValue('todayMovements', 0, stats.todayMovements || 0, 1000);
    animateValue('totalProviders', 0, stats.totalProviders || 0, 1000);

    console.log('✅ Estadísticas del dashboard cargadas:', stats);

  } catch (error) {
    console.error('❌ Error al cargar estadísticas:', error);
    // Mostrar guiones en caso de error
    document.getElementById('totalProducts').textContent = '-';
    document.getElementById('lowStock').textContent = '-';
    document.getElementById('todayMovements').textContent = '-';
    document.getElementById('totalProviders').textContent = '-';
    
    showNotification('Error al cargar estadísticas del dashboard', 'error');
  }
}

// Función para animar números (efecto contador)
function animateValue(id, start, end, duration) {
  const element = document.getElementById(id);
  if (!element) return;
  
  const range = end - start;
  const increment = range / (duration / 16); // 60 FPS
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current);
  }, 16);
}

// Cargar estadísticas al iniciar (solo en la página del dashboard)
document.addEventListener('DOMContentLoaded', () => {
  // Verificar si estamos en el dashboard
  if (document.getElementById('totalProducts')) {
    loadDashboardStats();
    
    // Recargar estadísticas cada 30 segundos
    setInterval(loadDashboardStats, 30000);
  }
});