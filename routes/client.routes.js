const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');
const { auditMiddleware } = require('../middlewares/auditoria.middleware');

// ============================================
// RUTAS PÚBLICAS — sin authMiddleware
// ============================================

/**
 * POST /api/clientes/login-cliente
 * Login del portal de clientes con cédula
 * SIN autenticación JWT — ruta pública
 */
router.post('/login-cliente', clientController.loginCliente);

// ============================================
// RUTAS PRIVADAS — requieren authMiddleware
// ============================================

router.get('/all',
    authMiddleware,
    checkPermission(['clientes.leer']),
    clientController.getAllClients
);

router.get('/search',
    authMiddleware,
    checkPermission(['clientes.leer', 'clientes.buscar_avanzado']),
    clientController.searchClient
);

router.get('/morosos',
    authMiddleware,
    checkPermission(['morosos.ver']),
    auditMiddleware('MOROSOS', (req) => {
        const meses = req.query.meses || 'todos';
        return `Consulta de clientes morosos (${meses} meses de atraso)`;
    }),
    clientController.obtenerMorosos
);

router.post('/create',
    authMiddleware,
    checkPermission(['clientes.crear']),
    auditMiddleware('CLIENTES', (req) => {
        const nombre   = req.body.NombreCliente  || 'Desconocido';
        const apellido = req.body.ApellidoCliente || '';
        const cedula   = req.body.Cedula          || '';
        return `Cliente creado: ${nombre} ${apellido} (CC: ${cedula})`.trim();
    }),
    clientController.addCliente
);

router.put('/update/:id',
    authMiddleware,
    checkPermission(['clientes.actualizar']),
    auditMiddleware('CLIENTES', (req) => {
        const clienteId = req.params.id;
        const nombre    = req.body.NombreCliente   || '';
        const apellido  = req.body.ApellidoCliente || '';
        return `Cliente actualizado ID: ${clienteId} - ${nombre} ${apellido}`.trim();
    }),
    clientController.updateClient
);

router.delete('/delete/:id',
    authMiddleware,
    checkPermission(['clientes.eliminar']),
    auditMiddleware('CLIENTES', (req) => {
        return `Cliente eliminado ID: ${req.params.id}`;
    }),
    clientController.deleteClient
);

router.get('/export/excel',
    authMiddleware,
    checkPermission(['clientes.exportar']),
    auditMiddleware('CLIENTES', () => 'Exportación de todos los clientes a Excel'),
    clientController.exportClientsToExcel
);

router.get('/morosos/excel',
    authMiddleware,
    checkPermission(['morosos.exportar']),
    auditMiddleware('MOROSOS', (req) => {
        const meses = req.query.meses || 'todos';
        return `Exportación de clientes morosos a Excel (${meses} meses de atraso)`;
    }),
    clientController.exportMorososToExcel
);

module.exports = router;