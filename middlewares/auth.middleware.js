const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    console.log('❌ No se proporcionó token de autorización');
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    console.log('❌ Token inválido en el header');
    return res.status(401).json({ message: 'Token no válido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Guarda los datos del usuario en la request
    
    console.log('✅ Token verificado exitosamente');
    console.log('   Usuario:', decoded.nombre);
    console.log('   Función:', decoded.funcion);
    console.log('   Permisos en token:', decoded.permisos ? decoded.permisos.length : 0);
    
    next();
  } catch (err) {
    console.error('❌ Error al verificar token:', err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};