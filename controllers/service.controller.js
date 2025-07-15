const { Op } = require('sequelize');
const Cliente = require('../models/client.model');
const TipoServicio = require('../models/service_type.model');
const Estado = require('../models/estado.model');
const Pago = require('../models/payment.model');
const Sector = require('../models/sector.model');
const Plan = require('../models/plan_mb.model');
const Tarifa = require('../models/tarifa.model');
const moment = require('moment');

// Obtener estadísticas del dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        // Estadísticas de clientes
        const totalClientes = await Cliente.count();
        const clientesActivos = await Cliente.count({ where: { EstadoID: 1 } });  // Suponiendo que EstadoID = 1 es "activo"
        const clientesSuspendidos = await Cliente.count({ where: { EstadoID: 2 } });  // Suponiendo que EstadoID = 2 es "suspendido"
        const clientesRetirados = await Cliente.count({ where: { EstadoID: 3 } });  // Suponiendo que EstadoID = 3 es "retirado"
        
        // Estadísticas por tipo de servicio
        const tiposServicio = await TipoServicio.findAll();
        const clientesPorTipoServicio = [];
        
        for (const tipo of tiposServicio) {
            const count = await Cliente.count({ where: { TipoServicioID: tipo.ID } });
            clientesPorTipoServicio.push({
                tipo: tipo.Tipo,
                cantidad: count
            });
        }
        
        // Estadísticas por sector
        const sectores = await Sector.findAll();
        const clientesPorSector = [];
        
        for (const sector of sectores) {
            const count = await Cliente.count({ where: { sector_id: sector.id } });
            clientesPorSector.push({
                sector: sector.nombre,
                cantidad: count
            });
        }
        
        // Estadísticas de pagos
        const mesActual = moment().format('MMMM').toUpperCase();
        const anioActual = moment().year();
        
        const pagosMesActual = await Pago.sum('Monto', {
            where: {
                Mes: mesActual,
                Ano: anioActual
            }
        });
        
        // Ingresos de los últimos 6 meses
        const ingresosPorMes = [];
        for (let i = 0; i < 6; i++) {
            const fecha = moment().subtract(i, 'months');
            const mes = fecha.format('MMMM').toUpperCase();
            const anio = fecha.year();
            
            const ingresos = await Pago.sum('Monto', {
                where: {
                    Mes: mes,
                    Ano: anio
                }
            });
            
            ingresosPorMes.push({
                mes: mes,
                anio: anio,
                total: ingresos || 0
            });
        }
        
        // Generar estadísticas completas
        const stats = {
            clientes: {
                total: totalClientes,
                activos: clientesActivos,
                suspendidos: clientesSuspendidos,
                retirados: clientesRetirados
            },
            servicios: clientesPorTipoServicio,
            sectores: clientesPorSector,
            pagos: {
                mesActual: pagosMesActual || 0,
                ultimosSeisMeses: ingresosPorMes
            }
        };
        
        res.json(stats);
    } catch (error) {
        console.error("❌ Error al obtener estadísticas del dashboard:", error);
        res.status(500).json({ 
            message: "Error al obtener estadísticas del dashboard", 
            error: error.message || error 
        });
    }
};

// Obtener todos los tipos de servicio
exports.getTiposServicio = async (req, res) => {
    try {
        const tipos = await TipoServicio.findAll();
        res.json(tipos);
    } catch (error) {
        console.error("❌ Error al obtener tipos de servicio:", error);
        res.status(500).json({ message: "Error al obtener tipos de servicio", error: error.message });
    }
};

// Obtener un tipo de servicio por ID
exports.getTipoServicioById = async (req, res) => {
    try {
        const { id } = req.params;
        const tipoServicio = await TipoServicio.findByPk(id);
        
        if (!tipoServicio) {
            return res.status(404).json({ message: "Tipo de servicio no encontrado" });
        }
        
        res.json(tipoServicio);
    } catch (error) {
        console.error("❌ Error al obtener tipo de servicio:", error);
        res.status(500).json({ message: "Error al obtener tipo de servicio", error: error.message });
    }
};

// Crear un nuevo tipo de servicio
exports.createTipoServicio = async (req, res) => {
    try {
        const { Tipo } = req.body;
        
        if (!Tipo) {
            return res.status(400).json({ message: "El campo Tipo es obligatorio" });
        }
        
        // Verificar si ya existe un tipo con ese nombre
        const tipoExistente = await TipoServicio.findOne({
            where: { Tipo: { [Op.like]: Tipo } }
        });
        
        if (tipoExistente) {
            return res.status(409).json({ message: "Ya existe un tipo de servicio con ese nombre" });
        }
        
        const nuevoTipo = await TipoServicio.create({ Tipo });
        
        res.status(201).json({
            message: "Tipo de servicio creado correctamente",
            tipoServicio: nuevoTipo
        });
    } catch (error) {
        console.error("❌ Error al crear tipo de servicio:", error);
        res.status(500).json({ message: "Error al crear tipo de servicio", error: error.message });
    }
};

// Actualizar un tipo de servicio
exports.updateTipoServicio = async (req, res) => {
    try {
        const { id } = req.params;
        const { Tipo } = req.body;
        
        const tipoServicio = await TipoServicio.findByPk(id);
        
        if (!tipoServicio) {
            return res.status(404).json({ message: "Tipo de servicio no encontrado" });
        }
        
        if (!Tipo) {
            return res.status(400).json({ message: "El campo Tipo es obligatorio" });
        }
        
        // Verificar si ya existe otro tipo con ese nombre
        const tipoExistente = await TipoServicio.findOne({
            where: {
                Tipo: { [Op.like]: Tipo },
                ID: { [Op.ne]: id }
            }
        });
        
        if (tipoExistente) {
            return res.status(409).json({ message: "Ya existe otro tipo de servicio con ese nombre" });
        }
        
        await tipoServicio.update({ Tipo });
        
        res.json({
            message: "Tipo de servicio actualizado correctamente",
            tipoServicio
        });
    } catch (error) {
        console.error("❌ Error al actualizar tipo de servicio:", error);
        res.status(500).json({ message: "Error al actualizar tipo de servicio", error: error.message });
    }
};

// Eliminar un tipo de servicio
exports.deleteTipoServicio = async (req, res) => {
    try {
        const { id } = req.params;
        
        const tipoServicio = await TipoServicio.findByPk(id);
        
        if (!tipoServicio) {
            return res.status(404).json({ message: "Tipo de servicio no encontrado" });
        }
        
        // Verificar si hay clientes usando este tipo de servicio
        const clientesConTipo = await Cliente.count({
            where: { TipoServicioID: id }
        });
        
        if (clientesConTipo > 0) {
            return res.status(409).json({
                message: `No se puede eliminar el tipo de servicio porque está siendo utilizado por ${clientesConTipo} clientes`,
                clientesAsociados: clientesConTipo
            });
        }
        
        await tipoServicio.destroy();
        
        res.json({ message: "Tipo de servicio eliminado correctamente" });
    } catch (error) {
        console.error("❌ Error al eliminar tipo de servicio:", error);
        res.status(500).json({ message: "Error al eliminar tipo de servicio", error: error.message });
    }
};