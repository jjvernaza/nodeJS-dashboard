const Tarifa = require('../models/tarifa.model');
const Cliente = require('../models/client.model');
const { Op } = require('sequelize');

// Obtener todas las tarifas
exports.getAllTarifas = async (req, res) => {
    try {
        const tarifas = await Tarifa.findAll({
            order: [['valor', 'ASC']]
        });
        res.json(tarifas);
    } catch (error) {
        console.error('❌ Error al obtener tarifas:', error);
        res.status(500).json({ message: 'Error al obtener tarifas', error: error.message });
    }
};

// Obtener una tarifa por ID
exports.getTarifaById = async (req, res) => {
    const { id } = req.params;
    try {
        const tarifa = await Tarifa.findByPk(id);
        if (!tarifa) {
            return res.status(404).json({ message: 'Tarifa no encontrada' });
        }
        res.json(tarifa);
    } catch (error) {
        console.error('❌ Error al obtener tarifa:', error);
        res.status(500).json({ message: 'Error al obtener tarifa', error: error.message });
    }
};

// Crear una nueva tarifa
exports.createTarifa = async (req, res) => {
    const { valor } = req.body;
    try {
        if (valor === undefined || valor === null) {
            return res.status(400).json({ message: 'El valor es obligatorio' });
        }
        
        // Verificar si ya existe una tarifa con el mismo valor
        const tarifaExistente = await Tarifa.findOne({
            where: { valor }
        });
        
        if (tarifaExistente) {
            return res.status(409).json({ message: 'Ya existe una tarifa con ese valor' });
        }
        
        const nuevaTarifa = await Tarifa.create({
            valor
        });
        
        res.status(201).json({
            message: 'Tarifa creada correctamente',
            tarifa: nuevaTarifa
        });
    } catch (error) {
        console.error('❌ Error al crear tarifa:', error);
        res.status(500).json({ message: 'Error al crear tarifa', error: error.message });
    }
};

// Actualizar una tarifa
exports.updateTarifa = async (req, res) => {
    const { id } = req.params;
    const { valor } = req.body;
    try {
        const tarifa = await Tarifa.findByPk(id);
        if (!tarifa) {
            return res.status(404).json({ message: 'Tarifa no encontrada' });
        }
        
        if (valor === undefined || valor === null) {
            return res.status(400).json({ message: 'El valor es obligatorio' });
        }
        
        // Verificar si ya existe otra tarifa con el mismo valor
        const tarifaExistente = await Tarifa.findOne({
            where: {
                valor,
                id: { [Op.ne]: id }
            }
        });
        
        if (tarifaExistente) {
            return res.status(409).json({ message: 'Ya existe otra tarifa con ese valor' });
        }
        
        await tarifa.update({ valor });
        
        res.json({
            message: 'Tarifa actualizada correctamente',
            tarifa
        });
    } catch (error) {
        console.error('❌ Error al actualizar tarifa:', error);
        res.status(500).json({ message: 'Error al actualizar tarifa', error: error.message });
    }
};

// Eliminar una tarifa
exports.deleteTarifa = async (req, res) => {
    const { id } = req.params;
    try {
        const tarifa = await Tarifa.findByPk(id);
        if (!tarifa) {
            return res.status(404).json({ message: 'Tarifa no encontrada' });
        }
        
        // Verificar si hay clientes usando esta tarifa
        const clientesConTarifa = await Cliente.count({
            where: { tarifa_id: id }
        });
        
        if (clientesConTarifa > 0) {
            return res.status(409).json({
                message: `No se puede eliminar la tarifa porque está siendo utilizada por ${clientesConTarifa} clientes`,
                clientesAsociados: clientesConTarifa
            });
        }
        
        await tarifa.destroy();
        
        res.json({ message: 'Tarifa eliminada correctamente' });
    } catch (error) {
        console.error('❌ Error al eliminar tarifa:', error);
        res.status(500).json({ message: 'Error al eliminar tarifa', error: error.message });
    }
}; // <- Aquí faltó cerrar la función correctamente

// Esta función estaba definida dentro de la función anterior, debe estar fuera
exports.getTarifaCliente = async (req, res) => {
    try {
        const { clienteId } = req.params;
        
        const cliente = await Cliente.findByPk(clienteId, {
        include: [
            {
            model: Tarifa,
            as: 'tarifa'
            }
        ]
        });
        
        if (!cliente || !cliente.tarifa) {
        return res.status(404).json({ message: "Tarifa del cliente no encontrada" });
        }
        
        res.json(cliente.tarifa);
    } catch (error) {
        console.error("❌ Error al obtener tarifa del cliente:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};