const Cliente = require('../models/client.model');  // Asegúrate de que el modelo esté importado correctamente
const TipoServicio = require('../models/service_type.model');

// Obtener estadísticas del dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        // Ejemplo de estadísticas: contar el total de clientes y activos
        const totalClientes = await Cliente.count();
        const clientesActivos = await Cliente.count({ where: { EstadoID: 1 } });  // Suponiendo que EstadoID = 1 es "activo"
        
        // Aquí podrías incluir más estadísticas, por ejemplo, ingresos mensuales, retirados, etc.
        const stats = {
            totalClientes,
            clientesActivos,
            // Agrega otros datos según tus necesidades
        };
        res.json(stats);
    } catch (error) {
        // Captura y muestra el mensaje de error completo en la respuesta
        res.status(500).json({ message: "Error al obtener estadísticas del dashboard", error: error.message || error });
    }
};


// Obtener todos los tipos de servicio
exports.getTiposServicio = async (req, res) => {
    try {
        const tipos = await TipoServicio.findAll();
        res.json(tipos);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener tipos de servicio", error });
    }
};

