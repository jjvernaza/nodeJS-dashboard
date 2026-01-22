const express = require('express');
const router = express.Router();
const tarifaController = require('../controllers/tarifa.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');
const { auditMiddleware } = require('../middlewares/auditoria.middleware');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
// ⚠️ Todas las rutas de tarifas requieren autenticación
router.use(authMiddleware);

// ============================================
// CONSULTA DE TARIFAS
// ============================================

/**
 * GET /api/tarifas/all
 * Obtener todas las tarifas del sistema
 * Requiere permiso: tarifas.leer
 */
router.get('/all', 
    checkPermission(['tarifas.leer']),
    tarifaController.getAllTarifas
);

/**
 * GET /api/tarifas/:id
 * Obtener una tarifa específica por ID
 * Requiere permiso: tarifas.leer
 */
router.get('/:id', 
    checkPermission(['tarifas.leer']),
    tarifaController.getTarifaById
);

/**
 * GET /api/tarifas/cliente/:clienteId
 * Obtener tarifa de un cliente específico (para PDF)
 * Requiere permiso: tarifas.leer
 */
router.get('/cliente/:clienteId', 
    checkPermission(['tarifas.leer']),
    tarifaController.getTarifaCliente
);

// ============================================
// CRUD DE TARIFAS
// ============================================

/**
 * POST /api/tarifas/create
 * Crear una nueva tarifa
 * Requiere permiso: tarifas.crear
 * Registra la acción en bitácora
 */
router.post('/create', 
    checkPermission(['tarifas.crear']),
    auditMiddleware('TARIFAS', (req, data) => {
        const nombreTarifa = req.body.NombreTarifa || req.body.Tarifa || 'Desconocida';
        const precio = req.body.Precio || req.body.Monto || 0;
        return `Tarifa creada: ${nombreTarifa} - Precio: $${precio}`;
    }),
    tarifaController.createTarifa
);

/**
 * PUT /api/tarifas/update/:id
 * Actualizar una tarifa existente
 * Requiere permiso: tarifas.actualizar
 * Registra la acción en bitácora
 */
router.put('/update/:id', 
    checkPermission(['tarifas.actualizar']),
    auditMiddleware('TARIFAS', (req, data) => {
        const tarifaId = req.params.id;
        const nombreTarifa = req.body.NombreTarifa || req.body.Tarifa || '';
        const precio = req.body.Precio || req.body.Monto || '';
        return `Tarifa actualizada ID: ${tarifaId} - ${nombreTarifa} ($${precio})`.trim();
    }),
    tarifaController.updateTarifa
);

/**
 * DELETE /api/tarifas/delete/:id
 * Eliminar una tarifa del sistema
 * Requiere permiso: tarifas.eliminar
 * Registra la acción en bitácora
 */
router.delete('/delete/:id', 
    checkPermission(['tarifas.eliminar']),
    auditMiddleware('TARIFAS', (req, data) => {
        const tarifaId = req.params.id;
        return `Tarifa eliminada ID: ${tarifaId}`;
    }),
    tarifaController.deleteTarifa
);

module.exports = router;