# SAGI PWA
Sistema de Administración de Gestión de Inventarios (SAGI) desarrollado como Progressive Web App (PWA).

## 📌 Objetivo
Este proyecto corresponde a la evidencia **GA8-220501096-AA2-EV02** del SENA.  
El propósito es implementar módulos móviles orientados a Android mediante una PWA, aplicando buenas prácticas de desarrollo, separación de capas y soporte offline.

## 🚀 Características
- Login y gestión de usuarios.
- Administración de roles.
- CRUD de productos, proveedores, movimientos y recibos.
- Manifest.json para instalación como aplicación independiente.
- Service Worker para funcionamiento offline.
- Compatible con dispositivos móviles.

## ⚙️ Instalación y uso
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/Pain-zzZ/SAGI-PWA.git


---

## 📌 Nota importante sobre el funcionamiento

Si descargas el proyecto y abres `http://localhost:3000/html/index.html`, la **interfaz gráfica** funciona correctamente porque los archivos HTML, CSS y JS están incluidos en el proyecto y el navegador los carga.  
Además, gracias al **Service Worker**, las pantallas pueden mostrarse incluso en modo **offline**.

- **Sin backend/base de datos:**  
  La aplicación abre, se instala como PWA y permite navegar entre módulos, pero los listados estarán vacíos o mostrarán errores al intentar consultar datos.

- **Con backend/base de datos activos:**  
  La aplicación abre igual, pero además carga y guarda información real desde la API, permitiendo el funcionamiento completo de los módulos (productos, usuarios, roles, recibos, etc.).




#### **Instalación**



**---**



**🗄️ Base de Datos**

**El proyecto utiliza una base de datos \*\*MySQL\*\*.**



**Dentro de la carpeta `/database` se encuentra el archivo:**



**- `sagi_db.sql`**



**Este archivo contiene:**

**- Creación de la base de datos**

**- Creación de las tablas**

**- Inserción de datos de prueba**



**📥 Importar la Base de Datos**

**1. Abrir \*\*MySQL Workbench\*\***

**2. Crear una conexión local**

**3. Abrir el archivo `sagi_db.sql`**

**4. Ejecutar el script completo**



**---**



**👤 Usuarios de Prueba**



**| Rol           | Email             | Contraseña    |**

**|---------------|-------------------|---------------|**

**| Administrador | admin@sagi.com    | SAGI2026      |**

**| Usuario       | maria@sagi.com    | SAGI2026      |**

**| Usuario       | juan@sagi.com     | SAGI2026      |**



**\*(Las contraseñas se almacenan encriptadas con bcrypt)\***



**---**



**🔐 Autenticación**

**El sistema implementa autenticación basada en:**

**- JSON Web Tokens (JWT)**

**- Encriptación de contraseñas**

**- Protección de rutas según autenticación**



**---**



**🚀 Ejecución del Proyecto**



**Backend**

**```bash**

**npm install**

**npm run dev**


🔗 Repositorio

El código fuente del proyecto se encuentra en el siguiente repositorio:

👉 [https://github.com/Pain-zzZ/Proyecto-SAGI]


