const express = require('express');
const router = express.Router();
const estadoController = require('../controllers/estado.controller');

// Obtener todos los estados
router.get('/all', estadoController.getAllEstados);

// Obtener estado por ID
router.get('/:id', estadoController.getEstadoById);

// Crear nuevo estado
router.post('/create', estadoController.createEstado);

// Actualizar estado
router.put('/update/:id', estadoController.updateEstado);

// Eliminar estado
router.delete('/delete/:id', estadoController.deleteEstado);

module.exports = router;