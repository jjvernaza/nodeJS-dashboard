const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Ruta para agregar un pago
router.post('/add', paymentController.addPayment);

// Ruta para obtener los métodos de pago
router.get('/metodos-pago', paymentController.getMetodosPago);

// Obtener pagos de un cliente específico
router.get('/:clienteID', paymentController.getPagosCliente);

module.exports = router;

