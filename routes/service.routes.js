const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');
const { auditMiddleware } = require('../middlewares/auditoria.middleware');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
// ⚠️ Todas las rutas de servicios requieren autenticación
router.use(authMiddleware);

// ============================================
// DASHBOARD Y ESTADÍSTICAS
// ============================================

/**
 * GET /api/servicios/dashboard
 * Obtener estadísticas para el dashboard
 * Requiere permiso: dashboard.ver
 * Registra la consulta en bitácora
 */
router.get('/dashboard', 
    checkPermission(['dashboard.ver']),
    auditMiddleware('SERVICIOS', () => {
        const fecha = new Date().toLocaleDateString();
        return `Consulta de estadísticas del dashboard (${fecha})`;
    }),
    serviceController.getDashboardStats
);

// ============================================
// CONSULTA DE TIPOS DE SERVICIO
// ============================================

/**
 * GET /api/servicios/tipos
 * Obtener todos los tipos de servicio del sistema
 * Requiere permiso: tipos_servicio.leer
 */
router.get('/tipos', 
    checkPermission(['tipos_servicio.leer']),
    serviceController.getTiposServicio
);

/**
 * GET /api/servicios/tipos/:id
 * Obtener un tipo de servicio específico por ID
 * Requiere permiso: tipos_servicio.leer
 */
router.get('/tipos/:id', 
    checkPermission(['tipos_servicio.leer']),
    serviceController.getTipoServicioById
);

// ============================================
// CRUD DE TIPOS DE SERVICIO
// ============================================

/**
 * POST /api/servicios/tipos/create
 * Crear un nuevo tipo de servicio
 * Requiere permiso: tipos_servicio.crear
 * Registra la acción en bitácora
 */
router.post('/tipos/create', 
    checkPermission(['tipos_servicio.crear']),
    auditMiddleware('TIPOS_SERVICIO', (req, data) => {
        const tipoServicio = req.body.TipoServicio || req.body.NombreTipoServicio || 'Desconocido';
        return `Tipo de servicio creado: ${tipoServicio}`;
    }),
    serviceController.createTipoServicio
);

/**
 * PUT /api/servicios/tipos/update/:id
 * Actualizar un tipo de servicio existente
 * Requiere permiso: tipos_servicio.actualizar
 * Registra la acción en bitácora
 */
router.put('/tipos/update/:id', 
    checkPermission(['tipos_servicio.actualizar']),
    auditMiddleware('TIPOS_SERVICIO', (req, data) => {
        const tipoServicioId = req.params.id;
        const tipoServicio = req.body.TipoServicio || req.body.NombreTipoServicio || '';
        return `Tipo de servicio actualizado ID: ${tipoServicioId} - ${tipoServicio}`.trim();
    }),
    serviceController.updateTipoServicio
);

/**
 * DELETE /api/servicios/tipos/delete/:id
 * Eliminar un tipo de servicio del sistema
 * Requiere permiso: tipos_servicio.eliminar
 * Registra la acción en bitácora
 */
router.delete('/tipos/delete/:id', 
    checkPermission(['tipos_servicio.eliminar']),
    auditMiddleware('TIPOS_SERVICIO', (req, data) => {
        const tipoServicioId = req.params.id;
        return `Tipo de servicio eliminado ID: ${tipoServicioId}`;
    }),
    serviceController.deleteTipoServicio
);

module.exports = router;