const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Ruta para agregar un pago
router.post('/add', paymentController.addPayment);

// Ruta para obtener los métodos de pago
router.get('/metodos-pago', paymentController.getMetodosPago);

// Obtener todos los pagos
router.get('/all', paymentController.getAllPagos);

// Actualizar pago
router.put('/update/:id', paymentController.updatePayment);

// Eliminar pago
router.delete('/delete/:id', paymentController.deletePayment);

// Obtener pagos de un cliente específico
router.get('/cliente/:clienteID', paymentController.getPagosCliente);

// obtener ingresos mensuales
router.get('/ingresos-mensuales', paymentController.getMonthlyIncome);

module.exports = router;