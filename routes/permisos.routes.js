const express = require('express');
const router = express.Router();
const permisosController = require('../controllers/permisos.controller');

// Obtener todos los permisos
router.get('/all', permisosController.getAllPermisos);

// Obtener permiso por ID
router.get('/:id', permisosController.getPermisoById);

// Crear nuevo permiso
router.post('/create', permisosController.createPermiso);

// Actualizar permiso
router.put('/update/:id', permisosController.updatePermiso);

// Eliminar permiso
router.delete('/delete/:id', permisosController.deletePermiso);

module.exports = router;