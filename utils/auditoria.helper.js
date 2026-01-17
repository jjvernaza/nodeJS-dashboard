const Bitacora = require('../models/bitacora.model');

/**
 * Registrar una acción en la bitácora
 * @param {number} usuario_id - ID del usuario que realiza la acción
 * @param {string} modulo - Módulo del sistema (USUARIOS, CLIENTES, PAGOS, etc.)
 * @param {string} accion - Acción realizada (LOGIN, LOGOUT, CREAR, ACTUALIZAR, etc.)
 * @param {string} descripcion - Descripción detallada de la acción
 * @param {object} req - Objeto request de Express (para obtener IP y user agent)
 * @param {object} datosAnteriores - Datos antes de la modificación (opcional)
 * @param {object} datosNuevos - Datos después de la modificación (opcional)
 */
async function registrarAuditoria(
    usuario_id,
    modulo,
    accion,
    descripcion,
    req = null,
    datosAnteriores = null,
    datosNuevos = null
) {
    try {
        const ip_address = req ? (req.ip || req.connection.remoteAddress || 'Desconocida') : 'Sistema';
        const user_agent = req ? req.get('user-agent') : 'Sistema';

        await Bitacora.create({
            usuario_id: usuario_id || null,
            accion,
            modulo,
            descripcion,
            datos_anteriores: datosAnteriores,
            datos_nuevos: datosNuevos,
            ip_address: ip_address.replace('::ffff:', ''), // Limpiar formato IPv6
            user_agent,
            fecha_hora: new Date()
        });

        console.log(`📝 Bitácora: [${modulo}] ${accion} - ${descripcion}`);
    } catch (error) {
        console.error('❌ Error al registrar en bitácora:', error.message);
        // No lanzar error para no interrumpir el flujo principal
    }
}

module.exports = {
    registrarAuditoria
};