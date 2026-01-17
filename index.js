const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db.config');

// ✅ Cargar variables del archivo .env
dotenv.config();

// ✅ Importar rutas existentes
const userRoutes = require('./routes/user.routes');
const clientRoutes = require('./routes/client.routes');
const paymentRoutes = require('./routes/payment.routes');
const serviceRoutes = require('./routes/service.routes');
const estadoRoutes = require('./routes/estado.routes');
const planRoutes = require('./routes/plan.routes');
const sectorRoutes = require('./routes/sector.routes');
const tarifaRoutes = require('./routes/tarifa.routes');
const permisosRoutes = require('./routes/permisos.routes');
const usuarioPermisoRoutes = require('./routes/usuario_permiso.routes');
const metodoPagoRoutes = require('./routes/metodo_pago.routes');

// ✅ NUEVO: Importar rutas de bitácora
const bitacoraRoutes = require('./routes/bitacora.routes');

// ✅ Inicializar app de Express
const app = express();

// ✅ Configurar CORS para permitir solicitudes desde el frontend Angular
app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ✅ Middleware para parsear JSON
app.use(express.json());

// ✅ Conectar a la base de datos con Sequelize
db.authenticate()
  .then(() => {
    console.log('✅ Conectado a la base de datos');
    return db.sync(); // Sincroniza modelos
  })
  .then(() => console.log('✅ Tablas sincronizadas'))
  .catch(err => console.error('❌ Error en la conexión a la base de datos:', err));

// ========================================
// RUTAS DE LA API
// ========================================

// ✅ Rutas de autenticación y usuarios
app.use('/api/users', userRoutes);

// ✅ Rutas de clientes
app.use('/api/clientes', clientRoutes);

// ✅ Rutas de pagos
app.use('/api/pagos', paymentRoutes);

// ✅ Rutas de servicios
app.use('/api/servicios', serviceRoutes);

// ✅ Rutas de estados
app.use('/api/estados', estadoRoutes);

// ✅ Rutas de planes
app.use('/api/planes', planRoutes);

// ✅ Rutas de sectores
app.use('/api/sectores', sectorRoutes);

// ✅ Rutas de tarifas
app.use('/api/tarifas', tarifaRoutes);

// ✅ Rutas de permisos
app.use('/api/permisos', permisosRoutes);

// ✅ Rutas de usuario-permisos
app.use('/api/usuario-permisos', usuarioPermisoRoutes);

// ✅ Rutas de métodos de pago
app.use('/api/metodos-pago', metodoPagoRoutes);

// ✅ NUEVO: Rutas de bitácora
app.use('/api/bitacora', bitacoraRoutes);

// ========================================
// RUTAS DE PRUEBA Y STATUS
// ========================================

// ✅ Ruta protegida de prueba con middleware JWT
const authMiddleware = require('./middlewares/auth.middleware');
app.get('/api/secure', authMiddleware, (req, res) => {
  res.json({ message: `Hola usuario autenticado, tu ID es ${req.user.id}` });
});

// ✅ Ruta para comprobar estado del servidor
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date(),
    version: '2.0.0'
  });
});

// ========================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ========================================

// ✅ Middleware para manejar errores 404
app.use((req, res, next) => {
  res.status(404).json({ 
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// ✅ Middleware para manejar errores generales
app.use((err, req, res, next) => {
  console.error('❌ Error de servidor:', err);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Detalles ocultos en producción'
  });
});

// ========================================
// LEVANTAR SERVIDOR
// ========================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  console.log(`📡 API disponible en: http://localhost:${PORT}/api`);
  console.log(`📊 Bitácora disponible en: http://localhost:${PORT}/api/bitacora`);
  console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
});