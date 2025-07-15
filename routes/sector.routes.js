const express = require('express');
const router = express.Router();
const sectorController = require('../controllers/sector.controller');

// Obtener todos los sectores
router.get('/all', sectorController.getAllSectores);

// Obtener sector por ID
router.get('/:id', sectorController.getSectorById);

// Crear nuevo sector
router.post('/create', sectorController.createSector);

// Actualizar sector
router.put('/update/:id', sectorController.updateSector);

// Eliminar sector
router.delete('/delete/:id', sectorController.deleteSector);

module.exports = router;