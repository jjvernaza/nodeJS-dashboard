const UsuarioPermiso = require('../models/usuario_permiso.model');
const Usuario = require('../models/user.model');
const Permiso = require('../models/permisos.model');

// Obtener todos los permisos de usuario
exports.getAllUsuarioPermisos = async (req, res) => {
    try {
        const usuarioPermisos = await UsuarioPermiso.findAll({
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['ID', 'Nombre', 'Apellidos', 'User']
                },
                {
                    model: Permiso,
                    as: 'permiso',
                    attributes: ['id', 'nombre', 'descripcion']
                }
            ]
        });
        res.json(usuarioPermisos);
    } catch (error) {
        console.error('❌ Error al obtener permisos de usuario:', error);
        res.status(500).json({ message: 'Error al obtener permisos de usuario', error: error.message });
    }
};

// Obtener permisos por usuario
exports.getPermisosByUsuario = async (req, res) => {
    const { usuarioId } = req.params;
    try {
        // Verificar que el usuario existe
        const usuario = await Usuario.findByPk(usuarioId);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        const permisos = await UsuarioPermiso.findAll({
            where: { usuario_id: usuarioId },
            include: [
                {
                    model: Permiso,
                    as: 'permiso',
                    attributes: ['id', 'nombre', 'descripcion']
                }
            ]
        });
        
        res.json(permisos);
    } catch (error) {
        console.error('❌ Error al obtener permisos del usuario:', error);
        res.status(500).json({ message: 'Error al obtener permisos del usuario', error: error.message });
    }
};

// Obtener usuarios por permiso
exports.getUsuariosByPermiso = async (req, res) => {
    const { permisoId } = req.params;
    try {
        // Verificar que el permiso existe
        const permiso = await Permiso.findByPk(permisoId);
        if (!permiso) {
            return res.status(404).json({ message: 'Permiso no encontrado' });
        }
        
        const usuarios = await UsuarioPermiso.findAll({
            where: { permiso_id: permisoId },
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['ID', 'Nombre', 'Apellidos', 'User', 'Funcion']
                }
            ]
        });
        
        res.json(usuarios);
    } catch (error) {
        console.error('❌ Error al obtener usuarios con permiso:', error);
        res.status(500).json({ message: 'Error al obtener usuarios con permiso', error: error.message });
    }
};

// Asignar permiso a usuario
exports.assignPermiso = async (req, res) => {
    const { usuario_id, permiso_id } = req.body;
    try {
        if (!usuario_id || !permiso_id) {
            return res.status(400).json({ message: 'usuario_id y permiso_id son obligatorios' });
        }
        
        // Verificar si el usuario y el permiso existen
        const usuario = await Usuario.findByPk(usuario_id);
        const permiso = await Permiso.findByPk(permiso_id);
        
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        if (!permiso) {
            return res.status(404).json({ message: 'Permiso no encontrado' });
        }
        
        // Verificar si ya existe la asignación
        const existingAssignment = await UsuarioPermiso.findOne({
            where: {
                usuario_id,
                permiso_id
            }
        });
        
        if (existingAssignment) {
            return res.status(409).json({ message: 'El permiso ya está asignado a este usuario' });
        }
        
        // Crear la asignación
        const nuevaAsignacion = await UsuarioPermiso.create({
            usuario_id,
            permiso_id,
            fecha_asignacion: new Date()
        });
        
        res.status(201).json({
            message: 'Permiso asignado correctamente',
            asignacion: nuevaAsignacion
        });
    } catch (error) {
        console.error('❌ Error al asignar permiso:', error);
        res.status(500).json({ message: 'Error al asignar permiso', error: error.message });
    }
};

// Revocar permiso de usuario
exports.revokePermiso = async (req, res) => {
    const { id } = req.params;
    try {
        const asignacion = await UsuarioPermiso.findByPk(id);
        if (!asignacion) {
            return res.status(404).json({ message: 'Asignación de permiso no encontrada' });
        }
        
        await asignacion.destroy();
        res.json({ message: 'Permiso revocado correctamente' });
    } catch (error) {
        console.error('❌ Error al revocar permiso:', error);
        res.status(500).json({ message: 'Error al revocar permiso', error: error.message });
    }
};

// Revocar un permiso específico de un usuario
exports.revokePermisoUsuario = async (req, res) => {
    const { usuario_id, permiso_id } = req.params;
    try {
        const asignacion = await UsuarioPermiso.findOne({
            where: {
                usuario_id,
                permiso_id
            }
        });
        
        if (!asignacion) {
            return res.status(404).json({ message: 'Asignación de permiso no encontrada' });
        }
        
        await asignacion.destroy();
        res.json({ message: 'Permiso revocado correctamente del usuario' });
    } catch (error) {
        console.error('❌ Error al revocar permiso del usuario:', error);
        res.status(500).json({ message: 'Error al revocar permiso del usuario', error: error.message });
    }
};