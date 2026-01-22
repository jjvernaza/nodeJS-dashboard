const Sector = require('../models/sector.model');
const { Op } = require('sequelize');
const Cliente = require('../models/client.model');

// Obtener todos los sectores
exports.getAllSectores = async (req, res) => {
    try {
        const sectores = await Sector.findAll();
        res.json(sectores);
    } catch (error) {
        console.error('❌ Error al obtener sectores:', error);
        res.status(500).json({ message: 'Error al obtener sectores', error: error.message });
    }
};

// Obtener un sector por ID
exports.getSectorById = async (req, res) => {
    const { id } = req.params;
    try {
        const sector = await Sector.findByPk(id);
        if (!sector) {
            return res.status(404).json({ message: 'Sector no encontrado' });
        }
        res.json(sector);
    } catch (error) {
        console.error('❌ Error al obtener sector:', error);
        res.status(500).json({ message: 'Error al obtener sector', error: error.message });
    }
};

// Crear un nuevo sector
exports.createSector = async (req, res) => {
    const { nombre, descripcion } = req.body;
    try {
        if (!nombre) {
            return res.status(400).json({ message: 'El nombre es obligatorio' });
        }
        
        // Verificar si ya existe un sector con el mismo nombre
        const sectorExistente = await Sector.findOne({
            where: { nombre: { [Op.like]: nombre } }
        });
        
        if (sectorExistente) {
            return res.status(409).json({ message: 'Ya existe un sector con ese nombre' });
        }
        
        const nuevoSector = await Sector.create({
            nombre,
            descripcion
        });
        
        res.status(201).json({
            message: 'Sector creado correctamente',
            sector: nuevoSector
        });
    } catch (error) {
        console.error('❌ Error al crear sector:', error);
        res.status(500).json({ message: 'Error al crear sector', error: error.message });
    }
};

// Actualizar un sector
exports.updateSector = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    try {
        const sector = await Sector.findByPk(id);
        if (!sector) {
            return res.status(404).json({ message: 'Sector no encontrado' });
        }
        
        // Si se cambia el nombre, verificar que no exista otro sector con el mismo nombre
        if (nombre && nombre !== sector.nombre) {
            const sectorExistente = await Sector.findOne({
                where: {
                    nombre: { [Op.like]: nombre },
                    id: { [Op.ne]: id }
                }
            });
            
            if (sectorExistente) {
                return res.status(409).json({ message: 'Ya existe otro sector con ese nombre' });
            }
        }
        
        await sector.update({
            nombre: nombre || sector.nombre,
            descripcion: descripcion !== undefined ? descripcion : sector.descripcion
        });
        
        res.json({
            message: 'Sector actualizado correctamente',
            sector
        });
    } catch (error) {
        console.error('❌ Error al actualizar sector:', error);
        res.status(500).json({ message: 'Error al actualizar sector', error: error.message });
    }
};

// Eliminar un sector
exports.deleteSector = async (req, res) => {
    const { id } = req.params;
    try {
        const sector = await Sector.findByPk(id);
        if (!sector) {
            return res.status(404).json({ message: 'Sector no encontrado' });
        }
        
        // Verificar si hay clientes usando este sector
        const clientesConSector = await Cliente.count({
            where: { sector_id: id }
        });
        
        if (clientesConSector > 0) {
            return res.status(409).json({
                message: `No se puede eliminar el sector porque está siendo utilizado por ${clientesConSector} clientes`,
                clientesAsociados: clientesConSector
            });
        }
        
        await sector.destroy();
        
        res.json({ message: 'Sector eliminado correctamente' });
    } catch (error) {
        console.error('❌ Error al eliminar sector:', error);
        res.status(500).json({ message: 'Error al eliminar sector', error: error.message });
    }
};