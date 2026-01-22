/**
 * Middleware para verificar si el usuario tiene un permiso específico
 * @param {string|string[]} requiredPermissions - Permiso(s) requerido(s)
 */
function checkPermission(requiredPermissions) {
    return (req, res, next) => {
        try {
            // El usuario ya fue autenticado por authMiddleware
            const userPermissions = req.user.permisos || [];
            
            // Convertir a array si es un solo permiso
            const permisos = Array.isArray(requiredPermissions) 
                ? requiredPermissions 
                : [requiredPermissions];
            
            console.log('🔐 Verificando permisos para crear usuario...');
            console.log('   Usuario:', req.user.nombre);
            console.log('   Permisos requeridos:', permisos);
            console.log('   Permisos del usuario:', userPermissions);
            
            // Verificar si el usuario tiene al menos uno de los permisos requeridos
            const hasPermission = permisos.some(permiso => 
                userPermissions.includes(permiso)
            );
            
            if (!hasPermission) {
                console.log('❌ Acceso denegado - Permisos insuficientes');
                return res.status(403).json({ 
                    message: 'No tienes permisos suficientes para realizar esta acción',
                    permisosRequeridos: permisos,
                    permisosUsuario: userPermissions
                });
            }
            
            console.log('✅ Permiso concedido - Continuando con la operación');
            next();
        } catch (error) {
            console.error('❌ Error en middleware de permisos:', error);
            return res.status(500).json({ message: 'Error al verificar permisos' });
        }
    };
}

/**
 * Middleware para verificar si el usuario tiene TODOS los permisos especificados
 */
function checkAllPermissions(requiredPermissions) {
    return (req, res, next) => {
        try {
            const userPermissions = req.user.permisos || [];
            
            const hasAllPermissions = requiredPermissions.every(permiso => 
                userPermissions.includes(permiso)
            );
            
            if (!hasAllPermissions) {
                return res.status(403).json({ 
                    message: 'No tienes todos los permisos necesarios para realizar esta acción',
                    permisosRequeridos: requiredPermissions,
                    permisosUsuario: userPermissions
                });
            }
            
            next();
        } catch (error) {
            console.error('❌ Error en middleware de permisos:', error);
            return res.status(500).json({ message: 'Error al verificar permisos' });
        }
    };
}

/**
 * Middleware para verificar si el usuario es administrador o gerente
 */
function isAdmin(req, res, next) {
    try {
        const userRole = req.user.funcion || req.user.Funcion;
        
        const adminRoles = ['Administrador', 'Gerente', 'Admin'];
        
        if (!adminRoles.includes(userRole)) {
            return res.status(403).json({ 
                message: 'Esta acción requiere permisos de administrador' 
            });
        }
        
        next();
    } catch (error) {
        console.error('❌ Error en middleware de administrador:', error);
        return res.status(500).json({ message: 'Error al verificar permisos de administrador' });
    }
}

module.exports = {
    checkPermission,
    checkAllPermissions,
    isAdmin
};