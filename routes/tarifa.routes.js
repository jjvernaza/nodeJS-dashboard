const express = require('express');
const router = express.Router();
const tarifaController = require('../controllers/tarifa.controller');

// Obtener todas las tarifas
router.get('/all', tarifaController.getAllTarifas);

// Obtener tarifa por ID
router.get('/:id', tarifaController.getTarifaById);

// Crear nueva tarifa
router.post('/create', tarifaController.createTarifa);

// Actualizar tarifa
router.put('/update/:id', tarifaController.updateTarifa);

// Eliminar tarifa
router.delete('/delete/:id', tarifaController.deleteTarifa);

// para el pdf
router.get('/cliente/:clienteId', tarifaController.getTarifaCliente);

module.exports = router;