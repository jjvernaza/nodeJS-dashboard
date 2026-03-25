const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db.config');

dotenv.config();

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
const bitacoraRoutes = require('./routes/bitacora.routes');

const app = express();

// ✅ CORS actualizado para aceptar admin y portal de clientes
app.use(cors({
  origin: [
    'http://localhost:4200',
    'https://ictlatam.com',
    'https://administracion.ictlatam.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

db.authenticate()
  .then(() => {
    console.log('✅ Conectado a la base de datos');
    return db.sync();
  })
  .then(() => console.log('✅ Tablas sincronizadas'))
  .catch(err => console.error('❌ Error en la conexión a la base de datos:', err));

// ========================================
// RUTAS DE LA API
// ========================================

app.use('/api/users',           userRoutes);
app.use('/api/clientes',        clientRoutes);
app.use('/api/pagos',           paymentRoutes);
app.use('/api/servicios',       serviceRoutes);
app.use('/api/estados',         estadoRoutes);
app.use('/api/planes',          planRoutes);
app.use('/api/sectores',        sectorRoutes);
app.use('/api/tarifas',         tarifaRoutes);
app.use('/api/permisos',        permisosRoutes);
app.use('/api/usuario-permisos',usuarioPermisoRoutes);
app.use('/api/metodos-pago',    metodoPagoRoutes);
app.use('/api/bitacora',        bitacoraRoutes);

// ========================================
// RUTAS DE PRUEBA Y STATUS
// ========================================

const authMiddleware = require('./middlewares/auth.middleware');

app.get('/api/secure', authMiddleware, (req, res) => {
  res.json({ message: `Hola usuario autenticado, tu ID es ${req.user.id}` });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date(),
    version: '2.0.0'
  });
});

// ========================================
// MANEJO DE ERRORES
// ========================================

app.use((req, res, next) => {
  res.status(404).json({
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

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