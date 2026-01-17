const express = require('express');
const router = express.Router();
const sectorController = require('../controllers/sector.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');
const { auditMiddleware } = require('../middlewares/auditoria.middleware');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
// ⚠️ Todas las rutas de sectores requieren autenticación
router.use(authMiddleware);

// ============================================
// CONSULTA DE SECTORES
// ============================================

/**
 * GET /api/sectores/all
 * Obtener todos los sectores del sistema
 * Requiere permiso: sectores.leer
 */
router.get('/all', 
    checkPermission(['sectores.leer']),
    sectorController.getAllSectores
);

/**
 * GET /api/sectores/:id
 * Obtener un sector específico por ID
 * Requiere permiso: sectores.leer
 */
router.get('/:id', 
    checkPermission(['sectores.leer']),
    sectorController.getSectorById
);

// ============================================
// CRUD DE SECTORES
// ============================================

/**
 * POST /api/sectores/create
 * Crear un nuevo sector
 * Requiere permiso: sectores.crear
 * Registra la acción en bitácora
 */
router.post('/create', 
    checkPermission(['sectores.crear']),
    auditMiddleware('SECTORES', (req, data) => {
        const nombreSector = req.body.NombreSector || req.body.Sector || 'Desconocido';
        return `Sector creado: ${nombreSector}`;
    }),
    sectorController.createSector
);

/**
 * PUT /api/sectores/update/:id
 * Actualizar un sector existente
 * Requiere permiso: sectores.actualizar
 * Registra la acción en bitácora
 */
router.put('/update/:id', 
    checkPermission(['sectores.actualizar']),
    auditMiddleware('SECTORES', (req, data) => {
        const sectorId = req.params.id;
        const nombreSector = req.body.NombreSector || req.body.Sector || '';
        return `Sector actualizado ID: ${sectorId} - ${nombreSector}`.trim();
    }),
    sectorController.updateSector
);

/**
 * DELETE /api/sectores/delete/:id
 * Eliminar un sector del sistema
 * Requiere permiso: sectores.eliminar
 * Registra la acción en bitácora
 */
router.delete('/delete/:id', 
    checkPermission(['sectores.eliminar']),
    auditMiddleware('SECTORES', (req, data) => {
        const sectorId = req.params.id;
        return `Sector eliminado ID: ${sectorId}`;
    }),
    sectorController.deleteSector
);

module.exports = router;