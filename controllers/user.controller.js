const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const User = require('../models/user.model');
const Estado = require('../models/estado.model');
const UsuarioPermiso = require('../models/usuario_permiso.model');
const Permiso = require('../models/permisos.model');

// 🔐 Función para hashear contraseñas
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// ✅ Crear nuevo usuario (admin, soporte, etc.)
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
        
        const newUser = await User.create({
            Cedula,
            Telefono,
            Nombre,
            Apellidos,
            Funcion,
            User: username,
            Password: hashedPassword,
            estado_id: estado_id || 1, // Por defecto activo
            fecha_creacion: new Date(),
            fecha_modificacion: new Date()
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

// ✅ Login de usuario
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
                    attributes: ['Estado']
                }
            ]
        });
        
        if (!userRecord) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        // Verificar si el usuario está activo
        if (userRecord.estado && userRecord.estado.Estado !== 'Activo') {
            return res.status(403).json({ message: 'Usuario inactivo o suspendido' });
        }
        
        const hashedInput = hashPassword(password);
        
        if (userRecord.Password !== hashedInput) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }
        
        // Obtener los permisos del usuario
        const permisos = await UsuarioPermiso.findAll({
            where: { usuario_id: userRecord.ID },
            include: [
                {
                    model: Permiso,
                    as: 'permiso',
                    attributes: ['id', 'nombre']
                }
            ]
        });
        
        const permisosNombres = permisos.map(p => p.permiso.nombre);
        
        const token = jwt.sign(
            { 
                id: userRecord.ID, 
                nombre: userRecord.Nombre,
                permisos: permisosNombres
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
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

// Obtener todos los usuarios
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['ID', 'Cedula', 'Nombre', 'Apellidos', 'Telefono', 'Funcion', 'User', 'fecha_creacion', 'fecha_modificacion'],
            include: [
                {
                    model: Estado,
                    as: 'estado',
                    attributes: ['Estado']
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
        // await user.update({ estado_id: 2 }); // Asumiendo que 2 es "Inactivo"
        
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
        user: req.user // Asumiendo que req.user se establece en tu middleware de autenticación
    });
};