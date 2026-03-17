const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');
const { auditMiddleware } = require('../middlewares/auditoria.middleware');

router.use(authMiddleware);

// ============================================
// CONSULTA DE PAGOS
// ============================================

router.get('/all', 
    checkPermission(['pagos.leer']),
    paymentController.getAllPagos
);

router.get('/cliente/:clienteID', 
    checkPermission(['pagos.leer']),
    paymentController.getPagosCliente
);

router.get('/metodos-pago', 
    checkPermission(['pagos.leer']),
    paymentController.getMetodosPago
);

// ============================================
// REPORTES E INGRESOS
// ============================================

router.get('/ingresos-mensuales', 
    checkPermission(['dashboard.ver']),  // ← CAMBIADO
    auditMiddleware('PAGOS', (req) => {
        const anio = req.query.anio || new Date().getFullYear();
        return `Consulta de ingresos mensuales reales (${anio})`;
    }),
    paymentController.getMonthlyIncome
);

router.get('/ingresos-esperados', 
    checkPermission(['dashboard.ver']),  // ← CAMBIADO
    auditMiddleware('PAGOS', (req) => {
        const anio = req.query.anio || new Date().getFullYear();
        return `Consulta de ingresos esperados (${anio})`;
    }),
    paymentController.getIngresosEsperadosPorMes
);

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

router.delete('/delete/:id', 
    checkPermission(['pagos.eliminar']),
    auditMiddleware('PAGOS', (req, data) => {
        const pagoId = req.params.id;
        return `Pago eliminado ID: ${pagoId}`;
    }),
    paymentController.deletePayment
);

module.exports = router;
