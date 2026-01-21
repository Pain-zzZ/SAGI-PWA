// ===== MENÚ Y NAVEGACIÓN =====
const sidebar = document.getElementById("sidebar");
const openMenu = document.getElementById("openMenu");
const closeMenu = document.getElementById("closeMenu");
const logoutBtn = document.getElementById("logout");

// Abrir/Cerrar menú en móviles
if (openMenu && sidebar) {
  openMenu.addEventListener("click", () => sidebar.classList.toggle("active"));
}
if (closeMenu && sidebar) {
  closeMenu.addEventListener("click", () => sidebar.classList.remove("active"));
}

// Manejo de submenús
document.querySelectorAll(".has-submenu > a").forEach(item => {
  const parent = item.parentElement;
  const id = item.textContent.trim();
  const state = localStorage.getItem("submenu-" + id);
  
  if (state === "true") parent.classList.add("open");

  item.addEventListener("click", (e) => {
    e.preventDefault();
    parent.classList.toggle("open");
    localStorage.setItem("submenu-" + id, parent.classList.contains("open"));
  });
});

// Mostrar información del usuario
function displayUserInfo() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    
    if (userNameEl) userNameEl.textContent = user.nombre || 'Usuario';
    if (userRoleEl) userRoleEl.textContent = user.rol || 'Sin rol';
  }
}

// Llamar al cargar la página
displayUserInfo();

// Cerrar sesión
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    if (confirm("¿Deseas cerrar sesión?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = "../html/index.html";
    }
  });
}