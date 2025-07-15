const express = require('express');
const router = express.Router();
const metodoPagoController = require('../controllers/metodo_pago.controller');

// Obtener todos los métodos de pago
router.get('/all', metodoPagoController.getAllMetodosPago);

// Obtener método de pago por ID
router.get('/:id', metodoPagoController.getMetodoPagoById);

// Crear nuevo método de pago
router.post('/create', metodoPagoController.createMetodoPago);

// Actualizar método de pago
router.put('/update/:id', metodoPagoController.updateMetodoPago);

// Eliminar método de pago
router.delete('/delete/:id', metodoPagoController.deleteMetodoPago);

module.exports = router;