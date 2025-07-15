const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) return res.status(401).json({ message: 'Token no proporcionado' });

  const token = authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: 'Token no válido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Guarda los datos del usuario en la request
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};
