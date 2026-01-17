const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');
const { auditMiddleware } = require('../middlewares/auditoria.middleware');

// ============================================
// RUTAS PÚBLICAS (Sin autenticación)
// ============================================

/**
 * POST /api/users/login
 * Iniciar sesión
 * Registra el login en la bitácora automáticamente (dentro del controller)
 */
router.post('/login', userController.login);

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
// ⚠️ Todas las rutas debajo de esta línea requieren autenticación
router.use(authMiddleware);

// ============================================
// RUTAS PROTEGIDAS CON AUTENTICACIÓN
// ============================================

/**
 * GET /api/users/verify-token
 * Verificar si el token JWT es válido
 * Usado para validar sesión en el frontend
 */
router.get('/verify-token', userController.verifyToken);

/**
 * POST /api/users/logout
 * Cerrar sesión del usuario
 * Registra el logout en la bitácora
 */
router.post('/logout', userController.logout);

// ============================================
// CRUD DE USUARIOS
// ============================================

/**
 * GET /api/users/all
 * Obtener todos los usuarios del sistema
 * Requiere permiso: usuarios.leer
 */
router.get('/all', 
    checkPermission(['usuarios.leer']), 
    userController.getAllUsers
);

/**
 * GET /api/users/:id
 * Obtener un usuario específico por ID
 * Requiere permiso: usuarios.leer
 */
router.get('/:id', 
    checkPermission(['usuarios.leer']), 
    userController.getUserById
);

/**
 * POST /api/users/create
 * Crear un nuevo usuario
 * Requiere permiso: usuarios.crear
 * Registra la acción en bitácora
 */
router.post('/create', 
    checkPermission(['usuarios.crear']),
    auditMiddleware('USUARIOS', (req, data) => {
        const nombre = req.body.Nombre || 'Desconocido';
        const apellidos = req.body.Apellidos || '';
        const user = req.body.User || '';
        return `Usuario creado: ${nombre} ${apellidos} (${user})`;
    }),
    userController.createUser
);

/**
 * PUT /api/users/update/:id
 * Actualizar información de un usuario existente
 * Requiere permiso: usuarios.actualizar
 * Registra la acción en bitácora
 */
router.put('/update/:id', 
    checkPermission(['usuarios.actualizar']),
    auditMiddleware('USUARIOS', (req, data) => {
        const userId = req.params.id;
        const nombre = req.body.Nombre || '';
        const apellidos = req.body.Apellidos || '';
        return `Usuario actualizado ID: ${userId} - ${nombre} ${apellidos}`.trim();
    }),
    userController.updateUser
);

/**
 * PUT /api/users/change-password/:id
 * Cambiar contraseña de un usuario
 * Cualquier usuario autenticado puede cambiar su propia contraseña
 * Registra la acción en bitácora
 */
router.put('/change-password/:id', 
    auditMiddleware('USUARIOS', (req, data) => {
        const userId = req.params.id;
        return `Contraseña cambiada para usuario ID: ${userId}`;
    }),
    userController.changePassword
);

/**
 * DELETE /api/users/delete/:id
 * Eliminar un usuario del sistema
 * Requiere permiso: usuarios.eliminar
 * Registra la acción en bitácora
 */
router.delete('/delete/:id', 
    checkPermission(['usuarios.eliminar']),
    auditMiddleware('USUARIOS', (req, data) => {
        const userId = req.params.id;
        return `Usuario eliminado ID: ${userId}`;
    }),
    userController.deleteUser
);

module.exports = router;