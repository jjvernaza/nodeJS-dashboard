const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');

// ✅ Crear cliente (Corrigiendo el nombre de la función)
router.post('/create', clientController.addCliente); // Antes era clientController.createClient ❌

// ✅ Buscar cliente por nombre
router.get('/search', clientController.searchClient);

// ✅ Actualizar cliente por ID
router.put('/update/:id', clientController.updateClient);

// ✅ Eliminar cliente por ID
router.delete('/delete/:id', clientController.deleteClient);

// ✅ Obtener clientes morosos
router.get('/morosos', clientController.getMorosos);

// ✅ Obtener todos los clientes
router.get('/all', clientController.getAllClients);

module.exports = router;
