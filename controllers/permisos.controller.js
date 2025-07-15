const Permiso = require('../models/permisos.model');
const UsuarioPermiso = require('../models/usuario_permiso.model');
const { Op } = require('sequelize');

// Obtener todos los permisos
exports.getAllPermisos = async (req, res) => {
    try {
        const permisos = await Permiso.findAll({
            order: [['nombre', 'ASC']]
        });
        res.json(permisos);
    } catch (error) {
        console.error('❌ Error al obtener permisos:', error);
        res.status(500).json({ message: 'Error al obtener permisos', error: error.message });
    }
};

// Obtener un permiso por ID
exports.getPermisoById = async (req, res) => {
    const { id } = req.params;
    try {
        const permiso = await Permiso.findByPk(id);
        if (!permiso) {
            return res.status(404).json({ message: 'Permiso no encontrado' });
        }
        res.json(permiso);
    } catch (error) {
        console.error('❌ Error al obtener permiso:', error);
        res.status(500).json({ message: 'Error al obtener permiso', error: error.message });
    }
};

// Crear un nuevo permiso
exports.createPermiso = async (req, res) => {
    const { nombre, descripcion } = req.body;
    try {
        if (!nombre) {
            return res.status(400).json({ message: 'El nombre es obligatorio' });
        }
        
        // Verificar si ya existe un permiso con el mismo nombre
        const permisoExistente = await Permiso.findOne({
            where: { nombre: { [Op.like]: nombre } }
        });
        
        if (permisoExistente) {
            return res.status(409).json({ message: 'Ya existe un permiso con ese nombre' });
        }
        
        const nuevoPermiso = await Permiso.create({
            nombre,
            descripcion
        });
        
        res.status(201).json({
            message: 'Permiso creado correctamente',
            permiso: nuevoPermiso
        });
    } catch (error) {
        console.error('❌ Error al crear permiso:', error);
        res.status(500).json({ message: 'Error al crear permiso', error: error.message });
    }
};

// Actualizar un permiso
exports.updatePermiso = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    try {
        const permiso = await Permiso.findByPk(id);
        if (!permiso) {
            return res.status(404).json({ message: 'Permiso no encontrado' });
        }
        
        if (!nombre) {
            return res.status(400).json({ message: 'El nombre es obligatorio' });
        }
        
        // Si se cambia el nombre, verificar que no exista otro permiso con el mismo nombre
        if (nombre !== permiso.nombre) {
            const permisoExistente = await Permiso.findOne({
                where: {
                    nombre: { [Op.like]: nombre },
                    id: { [Op.ne]: id }
                }
            });
            
            if (permisoExistente) {
                return res.status(409).json({ message: 'Ya existe otro permiso con ese nombre' });
            }
        }
        
        await permiso.update({
            nombre,
            descripcion: descripcion !== undefined ? descripcion : permiso.descripcion
        });
        
        res.json({
            message: 'Permiso actualizado correctamente',
            permiso
        });
    } catch (error) {
        console.error('❌ Error al actualizar permiso:', error);
        res.status(500).json({ message: 'Error al actualizar permiso', error: error.message });
    }
};

// Eliminar un permiso
exports.deletePermiso = async (req, res) => {
    const { id } = req.params;
    try {
        const permiso = await Permiso.findByPk(id);
        if (!permiso) {
            return res.status(404).json({ message: 'Permiso no encontrado' });
        }
        
        // Verificar si hay usuarios con este permiso asignado
        const asignaciones = await UsuarioPermiso.count({
            where: { permiso_id: id }
        });
        
        if (asignaciones > 0) {
            return res.status(409).json({
                message: `No se puede eliminar el permiso porque está asignado a ${asignaciones} usuarios`,
                usuariosAsociados: asignaciones
            });
        }
        
        await permiso.destroy();
        
        res.json({ message: 'Permiso eliminado correctamente' });
    } catch (error) {
        console.error('❌ Error al eliminar permiso:', error);
        res.status(500).json({ message: 'Error al eliminar permiso', error: error.message });
    }
};