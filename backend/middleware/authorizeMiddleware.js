const { tienePermiso } = require('../config/permissions');

function authorize(permiso) {
  return (req, res, next) => {
    const idRol = req.user?.idRol;

    if (!idRol) {
      return res.status(403).json({ message: 'Rol no definido en el token' });
    }

    if (!tienePermiso(idRol, permiso)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    next();
  };
}

module.exports = { authorize };
