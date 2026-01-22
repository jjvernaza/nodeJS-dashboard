const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const sequelize = require('../config/db.config');
const User = require('../models/user.model');
const Estado = require('../models/estado.model');
const UsuarioPermiso = require('../models/usuario_permiso.model');
const Permiso = require('../models/permisos.model');
const { registrarAuditoria } = require('../utils/auditoria.helper');

// 🔐 Función para hashear contraseñas
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// ✅ Crear nuevo usuario
exports.createUser = async (req, res) => {
    try {
        const { Cedula, Telefono, Nombre, Apellidos, Funcion, User: username, Password, estado_id } = req.body;
        
        if (!Cedula || !username || !Password) {
            return res.status(400).json({ message: "Cédula, usuario y contraseña son requeridos" });
        }
        
        // Verificar si ya existe un usuario con el mismo username o cédula
        const existingUser = await User.findOne({ 
            where: { 
                [Op.or]: [
                    { User: username },
                    { Cedula: Cedula }
                ]
            } 
        });
        
        if (existingUser) {
            return res.status(409).json({ 
                message: existingUser.User === username 
                    ? "Ya existe un usuario con ese nombre de usuario" 
                    : "Ya existe un usuario con esa cédula"
            });
        }
        
        const hashedPassword = hashPassword(Password);
        
        // ✅ BUSCAR el ID del estado "activo" (en minúscula)
        let estadoActivo = estado_id;
        if (!estadoActivo) {
            const estadoActivoRecord = await Estado.findOne({ 
                where: sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('Estado')),
                    'activo'
                )
            });
            estadoActivo = estadoActivoRecord ? estadoActivoRecord.ID : 1;
        }
        
        console.log('📝 Creando usuario con estado_id:', estadoActivo);
        
        const newUser = await User.create({
            Cedula,
            Telefono,
            Nombre,
            Apellidos,
            Funcion,
            User: username,
            Password: hashedPassword,
            estado_id: estadoActivo,
            fecha_creacion: new Date(),
            fecha_modificacion: new Date()
        });
        
        console.log('✅ Usuario creado:', {
            id: newUser.ID,
            nombre: newUser.Nombre,
            estado_id: newUser.estado_id
        });
        
        res.status(201).json({
            message: 'Usuario creado exitosamente',
            usuario: {
                id: newUser.ID,
                nombre: newUser.Nombre,
                apellidos: newUser.Apellidos,
                funcion: newUser.Funcion
            }
        });
    } catch (error) {
        console.error("❌ Error al crear usuario:", error);
        res.status(500).json({ message: "Error al crear usuario", error: error.message });
    }
};

// ✅ Login de usuario con auditoría completa
exports.login = async (req, res) => {
    try {
        const { user, password } = req.body;
        
        if (!user || !password) {
            return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
        }
        
        const userRecord = await User.findOne({ 
            where: { User: user },
            include: [
                {
                    model: Estado,
                    as: 'estado',
                    attributes: ['ID', 'Estado']
                }
            ]
        });
        
        if (!userRecord) {
            // ✅ Registrar intento fallido - usuario no encontrado
            await registrarAuditoria(
                null, 
                'AUTENTICACION', 
                'LOGIN_FALLIDO', 
                `Intento de login fallido - Usuario no encontrado: ${user}`, 
                req
            );
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        // ✅ Verificar si el usuario está activo (case-insensitive)
        const estadoActual = userRecord.estado?.Estado?.toLowerCase() || '';
        console.log('👤 Intento de login:', {
            usuario: userRecord.User,
            estadoEnBD: userRecord.estado?.Estado,
            estadoNormalizado: estadoActual
        });
        
        if (estadoActual !== 'activo') {
            // ✅ Registrar intento con usuario inactivo
            await registrarAuditoria(
                userRecord.ID, 
                'AUTENTICACION', 
                'LOGIN_BLOQUEADO', 
                `Intento de login con usuario ${estadoActual}: ${userRecord.Nombre} ${userRecord.Apellidos}`, 
                req
            );
            console.log('❌ Login rechazado - Usuario no activo');
            return res.status(403).json({ 
                message: 'Usuario inactivo o suspendido',
                estadoActual: userRecord.estado?.Estado
            });
        }
        
        const hashedInput = hashPassword(password);
        
        if (userRecord.Password !== hashedInput) {
            // ✅ Registrar contraseña incorrecta
            await registrarAuditoria(
                userRecord.ID, 
                'AUTENTICACION', 
                'LOGIN_FALLIDO', 
                `Intento de login con contraseña incorrecta: ${userRecord.Nombre} ${userRecord.Apellidos}`, 
                req
            );
            console.log('❌ Login rechazado - Contraseña incorrecta');
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }
        
        // ✅ Obtener los permisos del usuario
        let permisosNombres = [];
        
        try {
            const permisos = await UsuarioPermiso.findAll({
                where: { usuario_id: userRecord.ID },
                include: [
                    {
                        model: Permiso,
                        as: 'permiso',
                        attributes: ['id', 'nombre'],
                        required: true
                    }
                ]
            });
            
            permisosNombres = permisos
                .filter(p => p.permiso && p.permiso.nombre)
                .map(p => p.permiso.nombre);
            
            console.log('✅ Login exitoso para:', userRecord.User);
            console.log('🔐 Total de permisos cargados:', permisosNombres.length);
            console.log('📋 Permisos:', permisosNombres);
            
        } catch (permError) {
            console.error('⚠️ Error al cargar permisos:', permError.message);
            console.log('⚠️ Usuario autenticado sin permisos asignados');
        }
        
        // ✅ Incluir permisos y función en el token
        const token = jwt.sign(
            { 
                id: userRecord.ID, 
                nombre: userRecord.Nombre,
                funcion: userRecord.Funcion,
                permisos: permisosNombres
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        
        // ✅ Registrar login exitoso en bitácora
        await registrarAuditoria(
            userRecord.ID, 
            'AUTENTICACION', 
            'LOGIN', 
            `Login exitoso: ${userRecord.Nombre} ${userRecord.Apellidos} (${userRecord.Funcion})`, 
            req
        );
        
        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            user: {
                id: userRecord.ID,
                nombre: userRecord.Nombre,
                apellidos: userRecord.Apellidos,
                funcion: userRecord.Funcion,
                permisos: permisosNombres
            }
        });
    } catch (err) {
        console.error("❌ Error al iniciar sesión:", err);
        res.status(500).json({ message: "Error al intentar iniciar sesión", error: err.message });
    }
};

// ✅ Logout de usuario con registro en bitácora
exports.logout = async (req, res) => {
    try {
        const usuario = req.user; // Viene del authMiddleware
        
        // ✅ Registrar el logout en bitácora
        await registrarAuditoria(
            usuario.id,
            'AUTENTICACION',
            'LOGOUT',
            `Cierre de sesión: ${usuario.nombre} (${usuario.funcion})`,
            req
        );
        
        console.log(`🚪 Logout exitoso: ${usuario.nombre}`);
        
        res.json({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
        console.error('❌ Error al cerrar sesión:', error);
        res.status(500).json({ message: 'Error al cerrar sesión', error: error.message });
    }
};

// Obtener todos los usuarios
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['ID', 'Cedula', 'Nombre', 'Apellidos', 'Telefono', 'Funcion', 'User', 'estado_id', 'fecha_creacion', 'fecha_modificacion'],
            include: [
                {
                    model: Estado,
                    as: 'estado',
                    attributes: ['ID', 'Estado']
                }
            ]
        });
        
        res.json(users);
    } catch (error) {
        console.error("❌ Error al obtener usuarios:", error);
        res.status(500).json({ message: "Error al obtener usuarios", error: error.message });
    }
};

// Obtener un usuario por ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findByPk(id, {
            attributes: ['ID', 'Cedula', 'Nombre', 'Apellidos', 'Telefono', 'Funcion', 'User', 'fecha_creacion', 'fecha_modificacion'],
            include: [
                {
                    model: Estado,
                    as: 'estado',
                    attributes: ['Estado']
                }
            ]
        });
        
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        
        // Obtener los permisos del usuario
        const permisos = await UsuarioPermiso.findAll({
            where: { usuario_id: user.ID },
            include: [
                {
                    model: Permiso,
                    as: 'permiso',
                    attributes: ['id', 'nombre', 'descripcion']
                }
            ]
        });
        
        const userData = user.toJSON();
        userData.permisos = permisos.map(p => p.permiso);
        
        res.json(userData);
    } catch (error) {
        console.error("❌ Error al obtener usuario:", error);
        res.status(500).json({ message: "Error al obtener usuario", error: error.message });
    }
};

// Actualizar un usuario
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { Cedula, Telefono, Nombre, Apellidos, Funcion, User: username, Password, estado_id } = req.body;
        
        const user = await User.findByPk(id);
        
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        
        // Si se cambia el username o cédula, verificar que no existan duplicados
        if (username && username !== user.User) {
            const existingUsername = await User.findOne({ where: { User: username } });
            if (existingUsername) {
                return res.status(409).json({ message: "Ya existe un usuario con ese nombre de usuario" });
            }
        }
        
        if (Cedula && Cedula !== user.Cedula) {
            const existingCedula = await User.findOne({ where: { Cedula } });
            if (existingCedula) {
                return res.status(409).json({ message: "Ya existe un usuario con esa cédula" });
            }
        }
        
        // Procesar la actualización
        const updateData = {
            Cedula: Cedula || user.Cedula,
            Telefono: Telefono || user.Telefono,
            Nombre: Nombre || user.Nombre,
            Apellidos: Apellidos || user.Apellidos,
            Funcion: Funcion || user.Funcion,
            User: username || user.User,
            estado_id: estado_id || user.estado_id,
            fecha_modificacion: new Date()
        };
        
        // Solo actualiza la contraseña si se proporciona una nueva
        if (Password) {
            updateData.Password = hashPassword(Password);
        }
        
        await user.update(updateData);
        
        res.json({ 
            message: "Usuario actualizado correctamente",
            usuario: {
                id: user.ID,
                nombre: user.Nombre,
                apellidos: user.Apellidos,
                funcion: user.Funcion
            }
        });
    } catch (error) {
        console.error("❌ Error al actualizar usuario:", error);
        res.status(500).json({ message: "Error al actualizar usuario", error: error.message });
    }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Se requieren la contraseña actual y la nueva" });
        }
        
        const user = await User.findByPk(id);
        
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        
        // Verificar la contraseña actual
        const hashedCurrent = hashPassword(currentPassword);
        if (user.Password !== hashedCurrent) {
            return res.status(401).json({ message: "Contraseña actual incorrecta" });
        }
        
        // Actualizar la contraseña
        const hashedNew = hashPassword(newPassword);
        await user.update({ 
            Password: hashedNew,
            fecha_modificacion: new Date()
        });
        
        res.json({ message: "Contraseña actualizada correctamente" });
    } catch (error) {
        console.error("❌ Error al cambiar contraseña:", error);
        res.status(500).json({ message: "Error al cambiar contraseña", error: error.message });
    }
};

// Eliminar un usuario
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findByPk(id);
        
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        
        // En lugar de eliminar físicamente, opcionalmente puedes desactivar el usuario
        // await user.update({ estado_id: 4 }); // 4 es "inactivo"
        
        // Si prefieres eliminar físicamente:
        await user.destroy();
        
        res.json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
        console.error("❌ Error al eliminar usuario:", error);
        res.status(500).json({ message: "Error al eliminar usuario", error: error.message });
    }
};

// Verificar token (útil para rutas protegidas)
exports.verifyToken = (req, res) => {
    res.json({ 
        message: "Token válido", 
        user: req.user
    });
};