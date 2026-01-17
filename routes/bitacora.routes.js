const express = require('express');
const router = express.Router();
const bitacoraController = require('../controllers/bitacora.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');

// ========================================
// RUTAS DE BITÁCORA
// ========================================

// Obtener todos los registros de bitácora (con filtros)
router.get(
    '/all',
    authenticateToken,
    checkPermission('bitacora.leer'),
    bitacoraController.getAllBitacora
);

// Obtener bitácora de un usuario específico
router.get(
    '/usuario/:usuario_id',
    authenticateToken,
    checkPermission('bitacora.leer'),
    bitacoraController.getBitacoraByUsuario
);

// Obtener estadísticas de la bitácora
router.get(
    '/estadisticas',
    authenticateToken,
    checkPermission('bitacora.estadisticas'),
    bitacoraController.getEstadisticas
);

// Exportar bitácora a Excel
router.get(
    '/exportar',
    authenticateToken,
    checkPermission('bitacora.exportar'),
    bitacoraController.exportarBitacora
);

// Obtener módulos disponibles
router.get(
    '/modulos',
    authenticateToken,
    checkPermission('bitacora.leer'),
    bitacoraController.getModulos
);

// Obtener acciones disponibles
router.get(
    '/acciones',
    authenticateToken,
    checkPermission('bitacora.leer'),
    bitacoraController.getAcciones
);

// Limpiar registros antiguos (solo administradores)
router.delete(
    '/limpiar',
    authenticateToken,
    checkPermission('bitacora.limpiar'),
    bitacoraController.limpiarRegistrosAntiguos
);

module.exports = router;