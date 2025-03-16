const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');  // Importación correcta del controlador

// Ruta para crear usuario
router.post('/create', userController.createUser);

// Ruta para login
router.post('/login', userController.login);

module.exports = router;
