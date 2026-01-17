const express = require('express');
const router = express.Router();
const permisosController = require('../controllers/permisos.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');
const { auditMiddleware } = require('../middlewares/auditoria.middleware');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
// ⚠️ Todas las rutas de permisos requieren autenticación
router.use(authMiddleware);

// ============================================
// CONSULTA DE PERMISOS
// ============================================

/**
 * GET /api/permisos/all
 * Obtener todos los permisos del sistema
 * Requiere permiso: permisos.leer
 */
router.get('/all', 
    checkPermission(['permisos.leer']),
    permisosController.getAllPermisos
);

/**
 * GET /api/permisos/:id
 * Obtener un permiso específico por ID
 * Requiere permiso: permisos.leer
 */
router.get('/:id', 
    checkPermission(['permisos.leer']),
    permisosController.getPermisoById
);

// ============================================
// CRUD DE PERMISOS
// ============================================

/**
 * POST /api/permisos/create
 * Crear un nuevo permiso en el sistema
 * Requiere permiso: permisos.crear
 * Registra la acción en bitácora
 */
router.post('/create', 
    checkPermission(['permisos.crear']),
    auditMiddleware('PERMISOS', (req, data) => {
        const nombre = req.body.NombrePermiso || 'Desconocido';
        const codigo = req.body.CodigoPermiso || '';
        return `Permiso creado: ${nombre} (${codigo})`.trim();
    }),
    permisosController.createPermiso
);

/**
 * PUT /api/permisos/update/:id
 * Actualizar un permiso existente
 * Requiere permiso: permisos.actualizar
 * Registra la acción en bitácora
 */
router.put('/update/:id', 
    checkPermission(['permisos.actualizar']),
    auditMiddleware('PERMISOS', (req, data) => {
        const permisoId = req.params.id;
        const nombre = req.body.NombrePermiso || '';
        const codigo = req.body.CodigoPermiso || '';
        return `Permiso actualizado ID: ${permisoId} - ${nombre} (${codigo})`.trim();
    }),
    permisosController.updatePermiso
);

/**
 * DELETE /api/permisos/delete/:id
 * Eliminar un permiso del sistema
 * Requiere permiso: permisos.eliminar
 * Registra la acción en bitácora
 */
router.delete('/delete/:id', 
    checkPermission(['permisos.eliminar']),
    auditMiddleware('PERMISOS', (req, data) => {
        const permisoId = req.params.id;
        return `Permiso eliminado ID: ${permisoId}`;
    }),
    permisosController.deletePermiso
);

module.exports = router;