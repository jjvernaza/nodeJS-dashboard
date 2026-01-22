const Plan = require('../models/plan_mb.model');
const { Op } = require('sequelize');
const Cliente = require('../models/client.model');

// Obtener todos los planes
exports.getAllPlanes = async (req, res) => {
    try {
        const planes = await Plan.findAll();
        res.json(planes);
    } catch (error) {
        console.error('❌ Error al obtener planes:', error);
        res.status(500).json({ message: 'Error al obtener planes', error: error.message });
    }
};

// Obtener un plan por ID
exports.getPlanById = async (req, res) => {
    const { id } = req.params;
    try {
        const plan = await Plan.findByPk(id);
        if (!plan) {
            return res.status(404).json({ message: 'Plan no encontrado' });
        }
        res.json(plan);
    } catch (error) {
        console.error('❌ Error al obtener plan:', error);
        res.status(500).json({ message: 'Error al obtener plan', error: error.message });
    }
};

// Crear un nuevo plan
exports.createPlan = async (req, res) => {
    const { nombre, velocidad } = req.body;
    try {
        if (!nombre || !velocidad) {
            return res.status(400).json({ message: 'Nombre y velocidad son obligatorios' });
        }
        
        // Verificar si ya existe un plan con el mismo nombre
        const planExistente = await Plan.findOne({
            where: { nombre: { [Op.like]: nombre } }
        });
        
        if (planExistente) {
            return res.status(409).json({ message: 'Ya existe un plan con ese nombre' });
        }
        
        const nuevoPlan = await Plan.create({
            nombre,
            velocidad
        });
        
        res.status(201).json({
            message: 'Plan creado correctamente',
            plan: nuevoPlan
        });
    } catch (error) {
        console.error('❌ Error al crear plan:', error);
        res.status(500).json({ message: 'Error al crear plan', error: error.message });
    }
};

// Actualizar un plan
exports.updatePlan = async (req, res) => {
    const { id } = req.params;
    const { nombre, velocidad } = req.body;
    try {
        const plan = await Plan.findByPk(id);
        if (!plan) {
            return res.status(404).json({ message: 'Plan no encontrado' });
        }
        
        // Si se cambia el nombre, verificar que no exista otro plan con el mismo nombre
        if (nombre && nombre !== plan.nombre) {
            const planExistente = await Plan.findOne({
                where: {
                    nombre: { [Op.like]: nombre },
                    id: { [Op.ne]: id }
                }
            });
            
            if (planExistente) {
                return res.status(409).json({ message: 'Ya existe otro plan con ese nombre' });
            }
        }
        
        await plan.update({
            nombre: nombre || plan.nombre,
            velocidad: velocidad || plan.velocidad
        });
        
        res.json({
            message: 'Plan actualizado correctamente',
            plan
        });
    } catch (error) {
        console.error('❌ Error al actualizar plan:', error);
        res.status(500).json({ message: 'Error al actualizar plan', error: error.message });
    }
};

// Eliminar un plan
exports.deletePlan = async (req, res) => {
    const { id } = req.params;
    try {
        const plan = await Plan.findByPk(id);
        if (!plan) {
            return res.status(404).json({ message: 'Plan no encontrado' });
        }
        
        // Verificar si hay clientes usando este plan
        const clientesConPlan = await Cliente.count({
            where: { plan_mb_id: id }
        });
        
        if (clientesConPlan > 0) {
            return res.status(409).json({
                message: `No se puede eliminar el plan porque está siendo utilizado por ${clientesConPlan} clientes`,
                clientesAsociados: clientesConPlan
            });
        }
        
        await plan.destroy();
        
        res.json({ message: 'Plan eliminado correctamente' });
    } catch (error) {
        console.error('❌ Error al eliminar plan:', error);
        res.status(500).json({ message: 'Error al eliminar plan', error: error.message });
    }
};