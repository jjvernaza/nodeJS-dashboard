const { Op } = require('sequelize');
const MetodoDePago = require('../models/metodo_pago.model');

// Obtener todos los métodos de pago
exports.getAllMetodosPago = async (req, res) => {
    try {
        const metodosPago = await MetodoDePago.findAll();
        res.json(metodosPago);
    } catch (error) {
        console.error('❌ Error al obtener métodos de pago:', error);
        res.status(500).json({ message: 'Error al obtener métodos de pago', error: error.message });
    }
};

// Obtener un método de pago por ID
exports.getMetodoPagoById = async (req, res) => {
    const { id } = req.params;
    try {
        const metodoPago = await MetodoDePago.findByPk(id);
        if (!metodoPago) {
            return res.status(404).json({ message: 'Método de pago no encontrado' });
        }
        res.json(metodoPago);
    } catch (error) {
        console.error('❌ Error al obtener método de pago:', error);
        res.status(500).json({ message: 'Error al obtener método de pago', error: error.message });
    }
};

// Crear un nuevo método de pago
exports.createMetodoPago = async (req, res) => {
    const { Metodo } = req.body;
    try {
        if (!Metodo) {
            return res.status(400).json({ message: 'El campo Metodo es obligatorio' });
        }
        
        // Verificar si ya existe un método con ese nombre
        const metodoExistente = await MetodoDePago.findOne({ 
            where: { Metodo }
        });
        
        if (metodoExistente) {
            return res.status(409).json({ message: 'Ya existe un método de pago con ese nombre' });
        }
        
        const nuevoMetodoPago = await MetodoDePago.create({ Metodo });
        
        res.status(201).json({
            message: 'Método de pago creado correctamente',
            id: nuevoMetodoPago.ID
        });
    } catch (error) {
        console.error('❌ Error al crear método de pago:', error);
        res.status(500).json({ message: 'Error al crear método de pago', error: error.message });
    }
};

// Actualizar un método de pago
exports.updateMetodoPago = async (req, res) => {
    const { id } = req.params;
    const { Metodo } = req.body;
    try {
        const metodoPago = await MetodoDePago.findByPk(id);
        if (!metodoPago) {
            return res.status(404).json({ message: 'Método de pago no encontrado' });
        }
        
        if (!Metodo) {
            return res.status(400).json({ message: 'El campo Metodo es obligatorio' });
        }
        
        // Verificar si ya existe otro método con ese nombre (excluyendo el actual)
        const metodoExistente = await MetodoDePago.findOne({ 
            where: { 
                Metodo,
                ID: { [Op.ne]: id } // No igual al ID actual
            } 
        });
        
        if (metodoExistente) {
            return res.status(409).json({ message: 'Ya existe otro método de pago con ese nombre' });
        }
        
        await metodoPago.update({ Metodo });
        res.json({ 
            message: 'Método de pago actualizado correctamente', 
            metodoPago 
        });
    } catch (error) {
        console.error('❌ Error al actualizar método de pago:', error);
        res.status(500).json({ message: 'Error al actualizar método de pago', error: error.message });
    }
};

// Eliminar un método de pago
exports.deleteMetodoPago = async (req, res) => {
    const { id } = req.params;
    try {
        const metodoPago = await MetodoDePago.findByPk(id);
        if (!metodoPago) {
            return res.status(404).json({ message: 'Método de pago no encontrado' });
        }
        
        await metodoPago.destroy();
        res.json({ message: 'Método de pago eliminado correctamente' });
    } catch (error) {
        console.error('❌ Error al eliminar método de pago:', error);
        res.status(500).json({ message: 'Error al eliminar método de pago', error: error.message });
    }
};