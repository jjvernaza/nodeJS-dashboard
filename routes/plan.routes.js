const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');

// Obtener todos los planes
router.get('/all', planController.getAllPlanes);

// Obtener plan por ID
router.get('/:id', planController.getPlanById);

// Crear nuevo plan
router.post('/create', planController.createPlan);

// Actualizar plan
router.put('/update/:id', planController.updatePlan);

// Eliminar plan
router.delete('/delete/:id', planController.deletePlan);

module.exports = router;