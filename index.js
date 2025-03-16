const express = require('express');
const cors = require('cors');
const db = require('./config/db.config');

const userRoutes = require('./routes/user.routes');
const clientRoutes = require('./routes/client.routes');
const paymentRoutes = require('./routes/payment.routes');
const serviceRoutes = require('./routes/service.routes');
const estadoRoutes = require('./routes/estado.routes');

const app = express();

// ✅ Habilitar CORS antes de definir las rutas
app.use(cors({
    origin: 'http://localhost:4200', // Permitir peticiones desde Angular
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// ✅ Middleware para parsear JSON
app.use(express.json());

// ✅ Conectar con la base de datos
db.authenticate()
    .then(() => {
        console.log('✅ Database connected...');
        return db.sync();
    })
    .then(() => console.log('✅ Tablas sincronizadas'))
    .catch(err => console.error('❌ Error en la base de datos:', err));

// ✅ Definir rutas después de habilitar CORS
app.use('/api/users', userRoutes);
app.use('/api/clientes', clientRoutes);
app.use('/api/pagos', paymentRoutes);
app.use('/api/servicios', serviceRoutes);
app.use('/api', estadoRoutes);  

// ✅ Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
