const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');
const { auditMiddleware } = require('../middlewares/auditoria.middleware');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
// ⚠️ Todas las rutas de planes requieren autenticación
router.use(authMiddleware);

// ============================================
// CONSULTA DE PLANES
// ============================================

/**
 * GET /api/planes/all
 * Obtener todos los planes del sistema
 * Requiere permiso: planes.leer
 */
router.get('/all', 
    checkPermission(['planes.leer']),
    planController.getAllPlanes
);

/**
 * GET /api/planes/:id
 * Obtener un plan específico por ID
 * Requiere permiso: planes.leer
 */
router.get('/:id', 
    checkPermission(['planes.leer']),
    planController.getPlanById
);

// ============================================
// CRUD DE PLANES
// ============================================

/**
 * POST /api/planes/create
 * Crear un nuevo plan
 * Requiere permiso: planes.crear
 * Registra la acción en bitácora
 */
router.post('/create', 
    checkPermission(['planes.crear']),
    auditMiddleware('PLANES', (req, data) => {
        const nombrePlan = req.body.NombrePlan || 'Desconocido';
        const precio = req.body.Precio || 0;
        return `Plan creado: ${nombrePlan} - Precio: $${precio}`;
    }),
    planController.createPlan
);

/**
 * PUT /api/planes/update/:id
 * Actualizar un plan existente
 * Requiere permiso: planes.actualizar
 * Registra la acción en bitácora
 */
router.put('/update/:id', 
    checkPermission(['planes.actualizar']),
    auditMiddleware('PLANES', (req, data) => {
        const planId = req.params.id;
        const nombrePlan = req.body.NombrePlan || '';
        const precio = req.body.Precio || '';
        return `Plan actualizado ID: ${planId} - ${nombrePlan} ($${precio})`.trim();
    }),
    planController.updatePlan
);

/**
 * DELETE /api/planes/delete/:id
 * Eliminar un plan del sistema
 * Requiere permiso: planes.eliminar
 * Registra la acción en bitácora
 */
router.delete('/delete/:id', 
    checkPermission(['planes.eliminar']),
    auditMiddleware('PLANES', (req, data) => {
        const planId = req.params.id;
        return `Plan eliminado ID: ${planId}`;
    }),
    planController.deletePlan
);

module.exports = router;