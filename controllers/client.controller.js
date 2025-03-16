const Cliente = require('../models/client.model');
const Estado = require('../models/estado.model');
const TipoServicio = require('../models/service_type.model');
const Pago = require('../models/payment.model');

// ✅ Controlador para agregar cliente
exports.addCliente = async (req, res) => {
    try {
        const { NombreCliente, PlanMB, FechaInstalacion, EstadoID, Tarifa, IPAddress, Telefono, Ubicacion, Cedula, TipoServicioID } = req.body;

        if (!NombreCliente || !PlanMB || !FechaInstalacion || !EstadoID || !Tarifa || !IPAddress || !Telefono || !Ubicacion || !Cedula || !TipoServicioID) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        // ✅ Verificamos que el EstadoID y TipoServicioID existan antes de insertarlo
        const estadoExiste = await Estado.findByPk(EstadoID);
        const tipoServicioExiste = await TipoServicio.findByPk(TipoServicioID);

        if (!estadoExiste) {
            return res.status(400).json({ message: 'El EstadoID proporcionado no existe.' });
        }
        if (!tipoServicioExiste) {
            return res.status(400).json({ message: 'El TipoServicioID proporcionado no existe.' });
        }

        // ✅ Usar Sequelize en vez de db.query()
        const nuevoCliente = await Cliente.create({
            NombreCliente,
            PlanMB,
            FechaInstalacion,
            EstadoID,
            Tarifa,
            IPAddress,
            Telefono,
            Ubicacion,
            Cedula,
            TipoServicioID
        });

        res.status(201).json({ message: 'Cliente agregado correctamente', id: nuevoCliente.ID });
    } catch (error) {
        console.error('❌ Error al agregar cliente:', error);
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

// ✅ Buscar cliente por nombre
exports.searchClient = async (req, res) => {
    const { nombre } = req.query;
    try {
        const client = await Cliente.findOne({ where: { NombreCliente: nombre } });
        if (!client) return res.status(404).json({ message: "Cliente no encontrado" });
        res.json(client);
    } catch (error) {
        res.status(500).json({ message: "Error al buscar cliente", error });
    }
};

// ✅ Editar cliente
exports.updateClient = async (req, res) => {
    const { id } = req.params;
    try {
        const client = await Cliente.findByPk(id);
        if (!client) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }
        await client.update(req.body);
        res.json(client);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar cliente", error: error.message });
    }
};

// ✅ Eliminar cliente
exports.deleteClient = async (req, res) => {
    const { id } = req.params;
    try {
        const client = await Cliente.findByPk(id);
        if (!client) return res.status(404).json({ message: "Cliente no encontrado" });
        await client.destroy();
        res.json({ message: "Cliente eliminado" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar cliente", error });
    }
};

// ✅ Obtener clientes morosos
exports.getMorosos = async (req, res) => {
    try {
        const morosos = await Cliente.findAll({ where: { EstadoID: 2 } }); // Asumiendo que 2 es el ID para "retirado"
        res.json(morosos);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener morosos", error });
    }
};

// ✅ Obtener todos los clientes con su Estado y Tipo de Servicio
exports.getAllClients = async (req, res) => {
    try {
        const clientes = await Cliente.findAll({
            attributes: [
                'ID',
                'NombreCliente',
                'PlanMB',
                'FechaInstalacion',
                'Tarifa',
                'IPAddress',
                'Telefono',
                'Ubicacion',
                'Cedula'
            ],
            include: [
                {
                    model: Estado,
                    as: 'estado',
                    attributes: ['Estado']
                },
                {
                    model: TipoServicio,
                    as: 'tipoServicio',
                    attributes: ['Tipo']
                }
            ]
        });

        res.json(clientes);
    } catch (error) {
        console.error("❌ Error en getAllClients:", error);
        res.status(500).json({ 
            message: "Error al obtener clientes",
            error: error.message
        });
    }
};
