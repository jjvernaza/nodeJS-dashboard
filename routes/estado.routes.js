const express = require('express');
const router = express.Router();
const estadoController = require('../controllers/estado.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');
const { auditMiddleware } = require('../middlewares/auditoria.middleware');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
// ⚠️ Todas las rutas de estados requieren autenticación
router.use(authMiddleware);

// ============================================
// CONSULTA DE ESTADOS
// ============================================

/**
 * GET /api/estados/all
 * Obtener todos los estados del sistema
 * Requiere permiso: estados.leer
 */
router.get('/all', 
    checkPermission(['estados.leer']),
    estadoController.getAllEstados
);

/**
 * GET /api/estados/:id
 * Obtener un estado específico por ID
 * Requiere permiso: estados.leer
 */
router.get('/:id', 
    checkPermission(['estados.leer']),
    estadoController.getEstadoById
);

// ============================================
// CRUD DE ESTADOS
// ============================================

/**
 * POST /api/estados/create
 * Crear un nuevo estado
 * Requiere permiso: estados.crear
 * Registra la acción en bitácora
 */
router.post('/create', 
    checkPermission(['estados.crear']),
    auditMiddleware('ESTADOS', (req, data) => {
        const estado = req.body.Estado || 'Desconocido';
        return `Estado creado: ${estado}`;
    }),
    estadoController.createEstado
);

/**
 * PUT /api/estados/update/:id
 * Actualizar un estado existente
 * Requiere permiso: estados.actualizar
 * Registra la acción en bitácora
 */
router.put('/update/:id', 
    checkPermission(['estados.actualizar']),
    auditMiddleware('ESTADOS', (req, data) => {
        const estadoId = req.params.id;
        const estado = req.body.Estado || '';
        return `Estado actualizado ID: ${estadoId} - ${estado}`.trim();
    }),
    estadoController.updateEstado
);

/**
 * DELETE /api/estados/delete/:id
 * Eliminar un estado del sistema
 * Requiere permiso: estados.eliminar
 * Registra la acción en bitácora
 */
router.delete('/delete/:id', 
    checkPermission(['estados.eliminar']),
    auditMiddleware('ESTADOS', (req, data) => {
        const estadoId = req.params.id;
        return `Estado eliminado ID: ${estadoId}`;
    }),
    estadoController.deleteEstado
);

module.exports = router;