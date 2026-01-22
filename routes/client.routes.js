const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');
const { auditMiddleware } = require('../middlewares/auditoria.middleware');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
// ⚠️ Todas las rutas de clientes requieren autenticación
router.use(authMiddleware);

// ============================================
// CONSULTA DE CLIENTES
// ============================================

/**
 * GET /api/clientes/all
 * Obtener todos los clientes del sistema
 * Requiere permiso: clientes.leer
 */
router.get('/all', 
    checkPermission(['clientes.leer']),
    clientController.getAllClients
);

/**
 * GET /api/clientes/search
 * Buscar cliente por nombre, apellido, cédula, etc.
 * Requiere permiso: clientes.leer o clientes.buscar_avanzado
 */
router.get('/search', 
    checkPermission(['clientes.leer', 'clientes.buscar_avanzado']),
    clientController.searchClient
);

/**
 * GET /api/clientes/morosos
 * Obtener clientes con pagos pendientes/atrasados
 * Requiere permiso: morosos.ver
 * Registra la consulta en bitácora
 */
router.get('/morosos', 
    checkPermission(['morosos.ver']),
    auditMiddleware('MOROSOS', (req) => {
        const meses = req.query.meses || 'todos';
        return `Consulta de clientes morosos (${meses} meses de atraso)`;
    }),
    clientController.obtenerMorosos
);

// ============================================
// CRUD DE CLIENTES
// ============================================

/**
 * POST /api/clientes/create
 * Crear un nuevo cliente
 * Requiere permiso: clientes.crear
 * Registra la acción en bitácora
 */
router.post('/create', 
    checkPermission(['clientes.crear']),
    auditMiddleware('CLIENTES', (req, data) => {
        const nombre = req.body.NombreCliente || 'Desconocido';
        const apellido = req.body.ApellidoCliente || '';
        const cedula = req.body.Cedula || '';
        return `Cliente creado: ${nombre} ${apellido} (CC: ${cedula})`.trim();
    }),
    clientController.addCliente
);

/**
 * PUT /api/clientes/update/:id
 * Actualizar información de un cliente existente
 * Requiere permiso: clientes.actualizar
 * Registra la acción en bitácora
 */
router.put('/update/:id', 
    checkPermission(['clientes.actualizar']),
    auditMiddleware('CLIENTES', (req, data) => {
        const clienteId = req.params.id;
        const nombre = req.body.NombreCliente || '';
        const apellido = req.body.ApellidoCliente || '';
        return `Cliente actualizado ID: ${clienteId} - ${nombre} ${apellido}`.trim();
    }),
    clientController.updateClient
);

/**
 * DELETE /api/clientes/delete/:id
 * Eliminar un cliente del sistema
 * Requiere permiso: clientes.eliminar
 * Registra la acción en bitácora
 */
router.delete('/delete/:id', 
    checkPermission(['clientes.eliminar']),
    auditMiddleware('CLIENTES', (req, data) => {
        const clienteId = req.params.id;
        return `Cliente eliminado ID: ${clienteId}`;
    }),
    clientController.deleteClient
);

// ============================================
// EXPORTACIÓN DE DATOS
// ============================================

/**
 * GET /api/clientes/export/excel
 * Exportar todos los clientes a archivo Excel
 * Requiere permiso: clientes.exportar
 * Registra la acción en bitácora
 */
router.get('/export/excel', 
    checkPermission(['clientes.exportar']),
    auditMiddleware('CLIENTES', () => {
        return 'Exportación de todos los clientes a Excel';
    }),
    clientController.exportClientsToExcel
);

/**
 * GET /api/clientes/morosos/excel
 * Exportar clientes morosos a archivo Excel
 * Requiere permiso: morosos.exportar
 * Registra la acción en bitácora
 */
router.get('/morosos/excel', 
    checkPermission(['morosos.exportar']),
    auditMiddleware('MOROSOS', (req) => {
        const meses = req.query.meses || 'todos';
        return `Exportación de clientes morosos a Excel (${meses} meses de atraso)`;
    }),
    clientController.exportMorososToExcel
);

module.exports = router;