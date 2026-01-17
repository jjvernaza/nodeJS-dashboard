const express = require('express');
const router = express.Router();
const usuarioPermisoController = require('../controllers/usuario_permiso.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');
const { auditMiddleware } = require('../middlewares/auditoria.middleware');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
// ⚠️ Todas las rutas de usuario-permisos requieren autenticación
router.use(authMiddleware);

// ============================================
// CONSULTA DE PERMISOS DE USUARIO
// ============================================

/**
 * GET /api/usuario-permisos/all
 * Obtener todas las asignaciones de permisos de usuario
 * Requiere permiso: permisos.gestionar
 */
router.get('/all', 
    checkPermission(['permisos.gestionar']),
    usuarioPermisoController.getAllUsuarioPermisos
);

/**
 * GET /api/usuario-permisos/usuario/:usuarioId
 * Obtener todos los permisos asignados a un usuario específico
 * Requiere permiso: permisos.leer
 */
router.get('/usuario/:usuarioId', 
    checkPermission(['permisos.leer']),
    usuarioPermisoController.getPermisosByUsuario
);

/**
 * GET /api/usuario-permisos/permiso/:permisoId
 * Obtener todos los usuarios que tienen un permiso específico
 * Requiere permiso: permisos.leer
 */
router.get('/permiso/:permisoId', 
    checkPermission(['permisos.leer']),
    usuarioPermisoController.getUsuariosByPermiso
);

// ============================================
// ASIGNACIÓN Y REVOCACIÓN DE PERMISOS
// ============================================

/**
 * POST /api/usuario-permisos/assign
 * Asignar un permiso a un usuario
 * Requiere permiso: permisos.asignar
 * Registra la acción en bitácora
 */
router.post('/assign', 
    checkPermission(['permisos.asignar']),
    auditMiddleware('PERMISOS', (req, data) => {
        const usuarioId = req.body.UsuarioID || req.body.usuario_id || 'Desconocido';
        const permisoId = req.body.PermisoID || req.body.permiso_id || 'Desconocido';
        return `Permiso asignado: Usuario ID ${usuarioId} - Permiso ID ${permisoId}`;
    }),
    usuarioPermisoController.assignPermiso
);

/**
 * DELETE /api/usuario-permisos/revoke/:id
 * Revocar un permiso por ID de asignación
 * Requiere permiso: permisos.revocar
 * Registra la acción en bitácora
 */
router.delete('/revoke/:id', 
    checkPermission(['permisos.revocar']),
    auditMiddleware('PERMISOS', (req, data) => {
        const asignacionId = req.params.id;
        return `Permiso revocado - Asignación ID: ${asignacionId}`;
    }),
    usuarioPermisoController.revokePermiso
);

/**
 * DELETE /api/usuario-permisos/revoke/usuario/:usuario_id/permiso/:permiso_id
 * Revocar un permiso específico de un usuario
 * Requiere permiso: permisos.revocar
 * Registra la acción en bitácora
 */
router.delete('/revoke/usuario/:usuario_id/permiso/:permiso_id', 
    checkPermission(['permisos.revocar']),
    auditMiddleware('PERMISOS', (req, data) => {
        const usuarioId = req.params.usuario_id;
        const permisoId = req.params.permiso_id;
        return `Permiso revocado: Usuario ID ${usuarioId} - Permiso ID ${permisoId}`;
    }),
    usuarioPermisoController.revokePermisoUsuario
);

module.exports = router;