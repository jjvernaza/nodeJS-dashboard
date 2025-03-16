const Estado = require('../models/estado.model');

// Obtener todos los estados
exports.getAllEstados = async (req, res) => {
    try {
        const estados = await Estado.findAll();
        res.json(estados);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener estados", error });
    }
};
