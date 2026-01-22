const express = require('express');
const router = express.Router();
const metodoPagoController = require('../controllers/metodo_pago.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');
const { auditMiddleware } = require('../middlewares/auditoria.middleware');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
// ⚠️ Todas las rutas de métodos de pago requieren autenticación
router.use(authMiddleware);

// ============================================
// CONSULTA DE MÉTODOS DE PAGO
// ============================================

/**
 * GET /api/metodos-pago/all
 * Obtener todos los métodos de pago del sistema
 * Requiere permiso: metodos_pago.leer
 */
router.get('/all', 
    checkPermission(['metodos_pago.leer']),
    metodoPagoController.getAllMetodosPago
);

/**
 * GET /api/metodos-pago/:id
 * Obtener un método de pago específico por ID
 * Requiere permiso: metodos_pago.leer
 */
router.get('/:id', 
    checkPermission(['metodos_pago.leer']),
    metodoPagoController.getMetodoPagoById
);

// ============================================
// CRUD DE MÉTODOS DE PAGO
// ============================================

/**
 * POST /api/metodos-pago/create
 * Crear un nuevo método de pago
 * Requiere permiso: metodos_pago.crear
 * Registra la acción en bitácora
 */
router.post('/create', 
    checkPermission(['metodos_pago.crear']),
    auditMiddleware('METODOS_PAGO', (req, data) => {
        const metodoPago = req.body.MetodoPago || 'Desconocido';
        return `Método de pago creado: ${metodoPago}`;
    }),
    metodoPagoController.createMetodoPago
);

/**
 * PUT /api/metodos-pago/update/:id
 * Actualizar un método de pago existente
 * Requiere permiso: metodos_pago.actualizar
 * Registra la acción en bitácora
 */
router.put('/update/:id', 
    checkPermission(['metodos_pago.actualizar']),
    auditMiddleware('METODOS_PAGO', (req, data) => {
        const metodoPagoId = req.params.id;
        const metodoPago = req.body.MetodoPago || '';
        return `Método de pago actualizado ID: ${metodoPagoId} - ${metodoPago}`.trim();
    }),
    metodoPagoController.updateMetodoPago
);

/**
 * DELETE /api/metodos-pago/delete/:id
 * Eliminar un método de pago del sistema
 * Requiere permiso: metodos_pago.eliminar
 * Registra la acción en bitácora
 */
router.delete('/delete/:id', 
    checkPermission(['metodos_pago.eliminar']),
    auditMiddleware('METODOS_PAGO', (req, data) => {
        const metodoPagoId = req.params.id;
        return `Método de pago eliminado ID: ${metodoPagoId}`;
    }),
    metodoPagoController.deleteMetodoPago
);

module.exports = router;