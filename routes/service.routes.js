const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');

// Obtener estadísticas para el dashboard
router.get('/dashboard', serviceController.getDashboardStats);

// Obtener todos los tipos de servicio
router.get('/tipos', serviceController.getTiposServicio);

// Obtener un tipo de servicio por ID
router.get('/tipos/:id', serviceController.getTipoServicioById);

// Crear un nuevo tipo de servicio
router.post('/tipos/create', serviceController.createTipoServicio);

// Actualizar un tipo de servicio
router.put('/tipos/update/:id', serviceController.updateTipoServicio);

// Eliminar un tipo de servicio
router.delete('/tipos/delete/:id', serviceController.deleteTipoServicio);

module.exports = router;