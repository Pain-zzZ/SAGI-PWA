const bcrypt = require('bcryptjs');
const db = require('./config/database');

async function fixPasswords() {
  try {
    // Obtener todos los usuarios
    const [usuarios] = await db.query('SELECT idUsuario, nombre, correo FROM usuario');
    
    console.log('📋 Usuarios encontrados:', usuarios.length);
    console.log('\n🔧 Generando hashes...\n');
    
    // Contraseña temporal para TODOS (luego cada uno la cambia)
    const passwordTemporal = 'SAGI2026';
    const hash = await bcrypt.hash(passwordTemporal, 10);
    
    // Actualizar todos los usuarios con la misma contraseña hasheada
    for (const user of usuarios) {
      await db.query(
        'UPDATE usuario SET contrasena = ? WHERE idUsuario = ?',
        [hash, user.idUsuario]
      );
      console.log(`✅ ${user.nombre} (${user.correo}) - Contraseña actualizada`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TODOS LOS USUARIOS ACTUALIZADOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔑 Contraseña temporal para TODOS: ${passwordTemporal}`);
    console.log('\nPuedes iniciar sesión con cualquier usuario usando:');
    console.log(`   Contraseña: ${passwordTemporal}`);
    console.log('\n💡 Recomendación: Cada usuario debe cambiarla después\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPasswords();