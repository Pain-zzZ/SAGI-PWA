
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const checkEmail = document.getElementById("check-email");
const checkPass = document.getElementById("check-pass");
const errorMsg = document.getElementById("error-msg");

// Mostrar checks mientras escriben
[emailInput,passwordInput].forEach(input => {
input.addEventListener("input", () => {
if (input === emailInput) checkEmail.style.display = input.value.trim() ? "inline" : "none";
if (input === passwordInput) checkPass.style.display = input.value.trim() ? "inline" : "none";
});
});
// Manejo del formulario de login
if (loginForm) {
loginForm.addEventListener("submit", async function (e) {
e.preventDefault();

const email = emailInput.value.trim();
const password = passwordInput.value.trim();

errorMsg.style.display = "none";

// Validaciones básicas
if (!email || !password) {
  errorMsg.style.display = "block";
  errorMsg.textContent = "Por favor completa todos los campos";
  return;
}

// Deshabilitar botón mientras se procesa
const submitBtn = loginForm.querySelector('button[type="submit"]');
submitBtn.disabled = true;
submitBtn.textContent = "Iniciando sesión...";

try {
  // Hacer petición a la API
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (response.ok) {
    // Guardar token y datos del usuario
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Mostrar checks de éxito
    checkEmail.style.display = "inline";
    checkPass.style.display = "inline";

    // Redireccionar al dashboard
    window.location.href = "menu.html";
  } else {
    // Mostrar error
    checkEmail.style.display = "none";
    checkPass.style.display = "none";
    errorMsg.style.display = "block";
    errorMsg.textContent = data.message || "Credenciales incorrectas";
  }
} catch (error) {
  console.error('Error en login:', error);
  errorMsg.style.display = "block";
  errorMsg.textContent = "Error de conexión. Verifica que el servidor esté funcionando.";
} finally {
  submitBtn.disabled = false;
  submitBtn.textContent = "Iniciar sesión";
}
});
}
