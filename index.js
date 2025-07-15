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

// ✅ Usar rutas existentes
app.use('/api/users', userRoutes);
app.use('/api/clientes', clientRoutes);
app.use('/api/pagos', paymentRoutes);
app.use('/api/servicios', serviceRoutes);
app.use('/api/estados', estadoRoutes); // ⚠️ CORREGIDO: Cambiado de '/api' a '/api/estados'

// ✅ Importar nuevas rutas
const planRoutes = require('./routes/plan.routes');
const sectorRoutes = require('./routes/sector.routes');
const tarifaRoutes = require('./routes/tarifa.routes');
const permisosRoutes = require('./routes/permisos.routes');
const usuarioPermisoRoutes = require('./routes/usuario_permiso.routes');
const metodoPagoRoutes = require('./routes/metodo_pago.routes');

// ✅ Usar nuevas rutas
app.use('/api/planes', planRoutes);
app.use('/api/sectores', sectorRoutes);
app.use('/api/tarifas', tarifaRoutes);
app.use('/api/permisos', permisosRoutes);
app.use('/api/usuario-permisos', usuarioPermisoRoutes);
app.use('/api/metodos-pago', metodoPagoRoutes);

// ✅ Ruta protegida de prueba con middleware JWT (opcional)
const authMiddleware = require('./middlewares/auth.middleware');
app.get('/api/secure', authMiddleware, (req, res) => {
  res.json({ message: `Hola usuario autenticado, tu ID es ${req.user.id}` });
});

// ✅ Ruta para comprobar estado del servidor
app.get('/api/status', (req, res) => {
  res.json({
     status: 'online',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date()
  });
});

// ✅ Middleware para manejar errores 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// ✅ Middleware para manejar errores generales
app.use((err, req, res, next) => {
  console.error('❌ Error de servidor:', err);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Detalles ocultos en producción'
  });
});

// ✅ Levantar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});