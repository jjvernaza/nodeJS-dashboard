const EstadoModel = require('../models/estado.model');

// Obtener todos los estados
exports.getAllEstados = async (req, res) => {
    try {
        console.log('🔍 Obteniendo todos los estados...');
        
        const estados = await EstadoModel.findAll({
            attributes: ['ID', 'Estado', 'Color'],
            order: [['ID', 'ASC']]
        });
        
        console.log(`✅ Se encontraron ${estados.length} estados`);
        
        res.json(estados);
    } catch (error) {
        console.error('❌ Error al obtener estados:', error);
        res.status(500).json({ 
            message: "Error al obtener estados", 
            error: error.message
        });
    }
};

// Obtener un estado por ID
exports.getEstadoById = async (req, res) => {
    const { id } = req.params;
    try {
        const estado = await EstadoModel.findByPk(id);
        if (!estado) {
            return res.status(404).json({ message: "Estado no encontrado" });
        }
        res.json(estado);
    } catch (error) {
        console.error('❌ Error al obtener estado por ID:', error);
        res.status(500).json({ 
            message: "Error al obtener estado", 
            error: error.message 
        });
    }
};

// Crear un nuevo estado
exports.createEstado = async (req, res) => {
    try {
        const { Estado: nombreEstado, Color } = req.body;
        
        console.log('📝 Creando estado:', { nombreEstado, Color });
        
        if (!nombreEstado || nombreEstado.trim() === '') {
            return res.status(400).json({ message: "El campo Estado es obligatorio" });
        }
        
        // Verificar si ya existe
        const estadoExistente = await EstadoModel.findOne({ 
            where: { Estado: nombreEstado.trim() } 
        });
        
        if (estadoExistente) {
            return res.status(400).json({ message: 'Ya existe un estado con ese nombre' });
        }
        
        const nuevoEstado = await EstadoModel.create({ 
            Estado: nombreEstado.trim(),
            Color: Color || '#22c55e'
        });
        
        console.log('✅ Estado creado:', nuevoEstado.toJSON());
        
        res.status(201).json({ 
            message: "Estado creado correctamente", 
            id: nuevoEstado.ID,
            estado: nuevoEstado 
        });
    } catch (error) {
        console.error('❌ Error al crear estado:', error);
        res.status(500).json({ 
            message: "Error al crear estado", 
            error: error.message 
        });
    }
};

// Actualizar un estado
exports.updateEstado = async (req, res) => {
    const { id } = req.params;
    try {
        const { Estado: nombreEstado, Color } = req.body;
        
        console.log('🔄 Actualizando estado ID:', id);
        console.log('📋 Datos recibidos:', { nombreEstado, Color });
        
        const estado = await EstadoModel.findByPk(id);
        if (!estado) {
            return res.status(404).json({ message: "Estado no encontrado" });
        }
        
        if (!nombreEstado || nombreEstado.trim() === '') {
            return res.status(400).json({ message: "El campo Estado es obligatorio" });
        }
        
        // Verificar duplicados
        const estadoExistente = await EstadoModel.findOne({ 
            where: { 
                Estado: nombreEstado.trim(),
                ID: { [require('sequelize').Op.ne]: id }
            } 
        });
        
        if (estadoExistente) {
            return res.status(400).json({ message: 'Ya existe otro estado con ese nombre' });
        }
        
        const datosActualizar = {
            Estado: nombreEstado.trim(),
            Color: Color || estado.Color || '#22c55e'
        };
        
        console.log('💾 Actualizando con:', datosActualizar);
        
        await estado.update(datosActualizar);
        
        console.log('✅ Estado actualizado correctamente');
        
        res.json({ 
            message: "Estado actualizado correctamente", 
            estado: estado 
        });
    } catch (error) {
        console.error('❌ Error al actualizar estado:', error);
        res.status(500).json({ 
            message: "Error al actualizar estado", 
            error: error.message
        });
    }
};

// Eliminar un estado
exports.deleteEstado = async (req, res) => {
    const { id } = req.params;
    try {
        const estado = await EstadoModel.findByPk(id);
        if (!estado) {
            return res.status(404).json({ message: "Estado no encontrado" });
        }
        
        // Verificar clientes asociados
        try {
            const Cliente = require('../models/client.model');
            const clientesConEstado = await Cliente.count({ where: { EstadoID: id } });
            
            if (clientesConEstado > 0) {
                return res.status(400).json({ 
                    message: `No se puede eliminar el estado porque hay ${clientesConEstado} cliente(s) que lo están usando` 
                });
            }
        } catch (clienteError) {
            console.warn('⚠️ No se pudo verificar clientes asociados');
        }
        
        await estado.destroy();
        
        res.json({ message: "Estado eliminado correctamente" });
    } catch (error) {
        console.error('❌ Error al eliminar estado:', error);
        res.status(500).json({ 
            message: "Error al eliminar estado", 
            error: error.message 
        });
    }
};