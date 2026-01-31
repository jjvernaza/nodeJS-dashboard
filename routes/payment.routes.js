const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');
const { auditMiddleware } = require('../middlewares/auditoria.middleware');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
// ⚠️ Todas las rutas de pagos requieren autenticación
router.use(authMiddleware);

// ============================================
// CONSULTA DE PAGOS
// ============================================

/**
 * GET /api/pagos/all
 * Obtener todos los pagos del sistema
 * Requiere permiso: pagos.leer
 */
router.get('/all', 
    checkPermission(['pagos.leer']),
    paymentController.getAllPagos
);

/**
 * GET /api/pagos/cliente/:clienteID
 * Obtener todos los pagos de un cliente específico
 * Requiere permiso: pagos.leer
 */
router.get('/cliente/:clienteID', 
    checkPermission(['pagos.leer']),
    paymentController.getPagosCliente
);

/**
 * GET /api/pagos/metodos-pago
 * Obtener todos los métodos de pago disponibles
 * Requiere permiso: pagos.leer
 */
router.get('/metodos-pago', 
    checkPermission(['pagos.leer']),
    paymentController.getMetodosPago
);

// ============================================
// REPORTES E INGRESOS
// ============================================

/**
 * GET /api/pagos/ingresos-mensuales
 * Obtener ingresos mensuales REALES del sistema
 * Requiere permiso: pagos.ver_ingresos
 * Registra la consulta en bitácora
 */
router.get('/ingresos-mensuales', 
    checkPermission(['pagos.ver_ingresos']),
    auditMiddleware('PAGOS', (req) => {
        const anio = req.query.anio || new Date().getFullYear();
        return `Consulta de ingresos mensuales reales (${anio})`;
    }),
    paymentController.getMonthlyIncome
);

/**
 * GET /api/pagos/ingresos-esperados
 * Obtener ingresos esperados mes a mes
 * Calcula los ingresos esperados basándose en clientes instalados antes de cada mes
 * Requiere permiso: pagos.ver_ingresos
 * Registra la consulta en bitácora
 */
router.get('/ingresos-esperados', 
    checkPermission(['pagos.ver_ingresos']),
    auditMiddleware('PAGOS', (req) => {
        const anio = req.query.anio || new Date().getFullYear();
        return `Consulta de ingresos esperados (${anio})`;
    }),
    paymentController.getIngresosEsperadosPorMes
);

/**
 * GET /api/pagos/reporte-clientes-pagos
 * Generar reporte de clientes con sus pagos
 * Requiere permiso: pagos.generar_reportes
 * Registra la acción en bitácora
 */
router.get('/reporte-clientes-pagos', 
    checkPermission(['pagos.generar_reportes']),
    auditMiddleware('PAGOS', (req) => {
        const fecha = new Date().toLocaleDateString();
        const anio = req.query.ano || new Date().getFullYear();
        return `Generación de reporte clientes-pagos ${anio} (${fecha})`;
    }),
    paymentController.generarReporteClientesPagos
);

// ============================================
// CRUD DE PAGOS
// ============================================

/**
 * POST /api/pagos/add
 * Agregar un nuevo pago al sistema
 * Requiere permiso: pagos.crear
 * Registra la acción en bitácora
 */
router.post('/add', 
    checkPermission(['pagos.crear']),
    auditMiddleware('PAGOS', (req, data) => {
        const monto = req.body.Monto || 0;
        const clienteID = req.body.ClienteID || 'Desconocido';
        const mes = req.body.Mes || '';
        const ano = req.body.Ano || '';
        return `Pago registrado: $${monto} - Cliente ID: ${clienteID} (${mes} ${ano})`;
    }),
    paymentController.addPayment
);

/**
 * PUT /api/pagos/update/:id
 * Actualizar un pago existente
 * Requiere permiso: pagos.actualizar
 * Registra la acción en bitácora
 */
router.put('/update/:id', 
    checkPermission(['pagos.actualizar']),
    auditMiddleware('PAGOS', (req, data) => {
        const pagoId = req.params.id;
        const monto = req.body.Monto || '';
        const mes = req.body.Mes || '';
        const ano = req.body.Ano || '';
        return `Pago actualizado ID: ${pagoId} - Monto: $${monto} (${mes} ${ano})`.trim();
    }),
    paymentController.updatePayment
);

/**
 * DELETE /api/pagos/delete/:id
 * Eliminar un pago del sistema
 * Requiere permiso: pagos.eliminar
 * Registra la acción en bitácora
 */
router.delete('/delete/:id', 
    checkPermission(['pagos.eliminar']),
    auditMiddleware('PAGOS', (req, data) => {
        const pagoId = req.params.id;
        return `Pago eliminado ID: ${pagoId}`;
    }),
    paymentController.deletePayment
);

module.exports = router;