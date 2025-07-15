const express = require('express');
const router = express.Router();
const usuarioPermisoController = require('../controllers/usuario_permiso.controller');

// Obtener todos los permisos de usuario
router.get('/all', usuarioPermisoController.getAllUsuarioPermisos);

// Obtener permisos por usuario
router.get('/usuario/:usuarioId', usuarioPermisoController.getPermisosByUsuario);

// Obtener usuarios por permiso
router.get('/permiso/:permisoId', usuarioPermisoController.getUsuariosByPermiso);

// Asignar permiso a usuario
router.post('/assign', usuarioPermisoController.assignPermiso);

// Revocar permiso (por ID de asignación)
router.delete('/revoke/:id', usuarioPermisoController.revokePermiso);

// Revocar permiso específico de un usuario
router.delete('/revoke/usuario/:usuario_id/permiso/:permiso_id', usuarioPermisoController.revokePermisoUsuario);

module.exports = router;