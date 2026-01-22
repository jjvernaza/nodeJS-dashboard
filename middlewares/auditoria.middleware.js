const Bitacora = require('../models/bitacora.model');

/**
 * Función helper para registrar en bitácora
 * @param {Object} req - Request de Express
 * @param {String} accion - Tipo de acción (LOGIN, CREAR, ACTUALIZAR, etc.)
 * @param {String} modulo - Módulo del sistema (USUARIOS, CLIENTES, etc.)
 * @param {String} descripcion - Descripción de la acción
 * @param {Object} datosAnteriores - Datos antes de la modificación (opcional)
 * @param {Object} datosNuevos - Datos después de la modificación (opcional)
 */
async function registrarBitacora(req, accion, modulo, descripcion, datosAnteriores = null, datosNuevos = null) {
    try {
        const usuario_id = req.user?.id || null;
        
        if (!usuario_id) {
            console.log('⚠️ No se pudo registrar en bitácora: usuario no autenticado');
            return;
        }

        // Obtener IP del cliente
        const ip_address = req.ip || 
                          req.headers['x-forwarded-for']?.split(',')[0] || 
                          req.connection.remoteAddress || 
                          req.socket.remoteAddress ||
                          'unknown';

        const user_agent = req.get('User-Agent') || 'unknown';

        // Limpiar datos sensibles antes de guardar
        const datosSeguros = limpiarDatosSensibles(datosNuevos);

        await Bitacora.create({
            usuario_id,
            accion,
            modulo,
            descripcion,
            datos_anteriores: datosAnteriores,
            datos_nuevos: datosSeguros,
            ip_address,
            user_agent
        });

        console.log(`📝 Bitácora registrada: ${modulo} - ${accion} - Usuario: ${usuario_id}`);
    } catch (error) {
        console.error('❌ Error al registrar en bitácora:', error);
        // No lanzamos error para no interrumpir la operación principal
    }
}

/**
 * Middleware para registrar automáticamente según el método HTTP
 * @param {String} modulo - Nombre del módulo
 * @param {Function|String} getDescripcion - Función o string para generar descripción
 */
function auditMiddleware(modulo, getDescripcion) {
    return async (req, res, next) => {
        const originalJson = res.json;
        const originalSend = res.send;
        
        // Interceptar res.json
        res.json = function(data) {
            registrarAccion(req, res, data);
            return originalJson.call(this, data);
        };
        
        // Interceptar res.send
        res.send = function(data) {
            registrarAccion(req, res, data);
            return originalSend.call(this, data);
        };
        
        function registrarAccion(req, res, data) {
            // Solo registrar si la operación fue exitosa (status 2xx)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                let accion = 'DESCONOCIDA';
                
                switch (req.method) {
                    case 'POST':
                        accion = 'CREAR';
                        break;
                    case 'PUT':
                    case 'PATCH':
                        accion = 'ACTUALIZAR';
                        break;
                    case 'DELETE':
                        accion = 'ELIMINAR';
                        break;
                    case 'GET':
                        // Solo registrar GET para operaciones sensibles
                        if (req.path.includes('/export') || 
                            req.path.includes('/report') ||
                            req.path.includes('/morosos')) {
                            accion = 'EXPORTAR';
                        } else {
                            accion = null; // No registrar GET normales
                        }
                        break;
                }

                if (accion) {
                    const descripcion = typeof getDescripcion === 'function' 
                        ? getDescripcion(req, data) 
                        : getDescripcion || `${accion} en ${modulo}`;

                    registrarBitacora(
                        req, 
                        accion, 
                        modulo, 
                        descripcion,
                        req.datosAnteriores || null,
                        req.body || null
                    ).catch(err => console.error('Error en auditoría:', err));
                }
            }
        }
        
        next();
    };
}

/**
 * Limpiar datos sensibles antes de guardar en bitácora
 */
function limpiarDatosSensibles(datos) {
    if (!datos || typeof datos !== 'object') return datos;
    
    const datosCopia = JSON.parse(JSON.stringify(datos));
    const camposSensibles = ['password', 'Password', 'token', 'Token', 'secret', 'Secret'];
    
    function limpiarObjeto(obj) {
        for (let key in obj) {
            if (camposSensibles.some(campo => key.toLowerCase().includes(campo.toLowerCase()))) {
                obj[key] = '***OCULTO***';
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                limpiarObjeto(obj[key]);
            }
        }
    }
    
    limpiarObjeto(datosCopia);
    return datosCopia;
}

/**
 * Middleware específico para registrar login
 */
async function registrarLogin(req, res, next) {
    const originalJson = res.json;
    
    res.json = function(data) {
        if (res.statusCode === 200 && data.token) {
            // Login exitoso
            const usuario_id = data.user?.id;
            if (usuario_id) {
                registrarBitacora(
                    { ...req, user: { id: usuario_id } },
                    'LOGIN',
                    'SISTEMA',
                    `Inicio de sesión exitoso - Usuario: ${data.user?.nombre || 'Desconocido'}`,
                    null,
                    { usuario: data.user?.nombre }
                ).catch(err => console.error('Error al registrar login:', err));
            }
        }
        return originalJson.call(this, data);
    };
    
    next();
}

/**
 * Middleware específico para registrar logout
 */
async function registrarLogout(req, res, next) {
    try {
        if (req.user?.id) {
            await registrarBitacora(
                req,
                'LOGOUT',
                'SISTEMA',
                `Cierre de sesión - Usuario: ${req.user?.nombre || 'Desconocido'}`,
                null,
                null
            );
        }
        res.json({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
        console.error('Error al registrar logout:', error);
        res.json({ message: 'Sesión cerrada exitosamente' });
    }
}

module.exports = {
    registrarBitacora,
    auditMiddleware,
    registrarLogin,
    registrarLogout
};