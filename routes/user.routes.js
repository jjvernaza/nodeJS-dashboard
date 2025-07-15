const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware'); // Asumiendo que tienes este middleware

// Rutas públicas
router.post('/login', userController.login);

// Rutas protegidas que requieren autenticación
router.use(authMiddleware); // Protege todas las rutas siguientes

// Verificar token
router.get('/verify-token', userController.verifyToken);

// Obtener todos los usuarios
router.get('/all', userController.getAllUsers);

// Obtener un usuario por ID
router.get('/:id', userController.getUserById);

// Crear nuevo usuario
router.post('/create', userController.createUser);

// Actualizar usuario
router.put('/update/:id', userController.updateUser);

// Cambiar contraseña
router.put('/change-password/:id', userController.changePassword);

// Eliminar usuario
router.delete('/delete/:id', userController.deleteUser);

module.exports = router;