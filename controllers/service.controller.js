const { Op, Sequelize } = require('sequelize');
const Cliente = require('../models/client.model');
const TipoServicio = require('../models/service_type.model');
const Estado = require('../models/estado.model');
const Pago = require('../models/payment.model');
const Sector = require('../models/sector.model');
const Plan = require('../models/plan_mb.model');
const Tarifa = require('../models/tarifa.model');
const moment = require('moment');

// Obtener estadísticas del dashboard - VERSIÓN FINAL CON MESES EN ESPAÑOL
exports.getDashboardStats = async (req, res) => {
    try {
        console.log('📊 Obteniendo estadísticas del dashboard...');
        
        // 1. Obtener TODOS los estados con sus conteos de clientes
        const clientesPorEstado = await Cliente.findAll({
            attributes: [
                'EstadoID',
                [Sequelize.fn('COUNT', Sequelize.col('Cliente.ID')), 'cantidad']
            ],
            include: [
                {
                    model: Estado,
                    as: 'estado',
                    attributes: ['ID', 'Estado'],
                    required: false
                }
            ],
            group: ['EstadoID', 'estado.ID', 'estado.Estado'],
            raw: false
        });

        console.log('🔍 Clientes por estado encontrados:', JSON.stringify(clientesPorEstado.map(item => ({
            EstadoID: item.EstadoID,
            estado: item.estado?.Estado,
            cantidad: item.dataValues.cantidad
        })), null, 2));

        // 2. Procesar conteos por estado según tus estados específicos
        const estadisticasClientes = {
            total: 0,
            activos: 0,      // activo + convenio
            suspendidos: 0,  // solo suspendido
            retirados: 0     // retirado + inactivo
        };

        clientesPorEstado.forEach(item => {
            const cantidad = parseInt(item.dataValues.cantidad);
            const estadoNombre = item.estado?.Estado?.toLowerCase().trim();
            
            estadisticasClientes.total += cantidad;
            
            console.log(`🏷️ Procesando estado: "${estadoNombre}" con cantidad: ${cantidad}`);
            
            // Mapear según tus estados específicos
            if (estadoNombre) {
                switch (estadoNombre) {
                    case 'activo':
                    case 'convenio':
                        estadisticasClientes.activos += cantidad;
                        break;
                    case 'suspendido':
                        estadisticasClientes.suspendidos += cantidad;
                        break;
                    case 'retirado':
                    case 'inactivo':
                        estadisticasClientes.retirados += cantidad;
                        break;
                    default:
                        console.log(`⚠️ Estado no mapeado: "${estadoNombre}"`);
                        break;
                }
            }
        });

        console.log('📈 Estadísticas de clientes procesadas:', estadisticasClientes);
        
        // 3. Obtener distribución por tipo de servicio
        const clientesPorTipoServicio = await Cliente.findAll({
            attributes: [
                'TipoServicioID',
                [Sequelize.fn('COUNT', Sequelize.col('Cliente.ID')), 'cantidad']
            ],
            include: [
                {
                    model: TipoServicio,
                    as: 'tipoServicio',
                    attributes: ['ID', 'Tipo'],
                    required: false
                }
            ],
            group: ['TipoServicioID', 'tipoServicio.ID', 'tipoServicio.Tipo'],
            raw: false
        });

        const servicios = clientesPorTipoServicio.map(item => ({
            tipo: item.tipoServicio?.Tipo || 'Sin tipo',
            cantidad: parseInt(item.dataValues.cantidad)
        }));

        // 4. Obtener distribución por sector
        const clientesPorSector = await Cliente.findAll({
            attributes: [
                'sector_id',
                [Sequelize.fn('COUNT', Sequelize.col('Cliente.ID')), 'cantidad']
            ],
            include: [
                {
                    model: Sector,
                    as: 'sector',
                    attributes: ['id', 'nombre'],
                    required: false
                }
            ],
            group: ['sector_id', 'sector.id', 'sector.nombre'],
            raw: false
        });

        const sectores = clientesPorSector.map(item => ({
            sector: item.sector?.nombre || 'Sin sector',
            cantidad: parseInt(item.dataValues.cantidad)
        }));
        
        // 5. Estadísticas de pagos del mes actual - CORREGIDO PARA ESPAÑOL
        const fechaActual = moment();
        
        // Mapeo de nombres de mes en inglés a español
        const mesEnIngles = fechaActual.format('MMMM').toUpperCase();
        const mesesMap = {
            'JANUARY': 'ENERO',
            'FEBRUARY': 'FEBRERO',
            'MARCH': 'MARZO',
            'APRIL': 'ABRIL',
            'MAY': 'MAYO',
            'JUNE': 'JUNIO',
            'JULY': 'JULIO',
            'AUGUST': 'AGOSTO',
            'SEPTEMBER': 'SEPTIEMBRE',
            'OCTOBER': 'OCTUBRE',
            'NOVEMBER': 'NOVIEMBRE',
            'DECEMBER': 'DICIEMBRE'
        };
        
        const mesActual = mesesMap[mesEnIngles] || mesEnIngles;
        const anioActual = fechaActual.year();
        
        console.log(`💰 Buscando pagos para: ${mesActual} ${anioActual}`);
        
        const pagosMesActual = await Pago.sum('Monto', {
            where: {
                Mes: mesActual,
                Ano: anioActual
            }
        });
        
        console.log(`✅ Pagos del mes actual: ${pagosMesActual || 0}`);
        
        // 6. Ingresos de los últimos 12 meses ordenados (EN ESPAÑOL)
        const ingresosPorMes = [];
        const mesesOrdenados = [
            'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
            'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
        ];
        
        for (let mes of mesesOrdenados) {
            const ingresos = await Pago.sum('Monto', {
                where: {
                    Mes: mes,
                    Ano: anioActual
                }
            });
            
            ingresosPorMes.push({
                mes: mes,
                anio: anioActual,
                total: ingresos || 0
            });
        }
        
        // 7. Calcular ingresos esperados por mes (basado en tarifas de clientes activos)
        console.log('💡 Calculando ingresos esperados...');
        const ingresosEsperados = await this.calcularIngresosEsperados(anioActual);
        console.log('✅ Ingresos esperados calculados:', ingresosEsperados.length);
        
        // 8. Construir respuesta final
        const stats = {
            clientes: estadisticasClientes,
            servicios: servicios,
            sectores: sectores,
            pagos: {
                mesActual: pagosMesActual || 0,
                ultimosDosMeses: ingresosPorMes,
                esperados: ingresosEsperados
            },
            debug: {
                estadosEncontrados: clientesPorEstado.map(item => ({
                    id: item.EstadoID,
                    nombre: item.estado?.Estado,
                    cantidad: parseInt(item.dataValues.cantidad)
                }))
            }
        };

        console.log('✅ Estadísticas completas generadas');
        res.json(stats);
        
    } catch (error) {
        console.error("❌ Error al obtener estadísticas del dashboard:", error);
        res.status(500).json({ 
            message: "Error al obtener estadísticas del dashboard", 
            error: error.message || error,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Método para calcular ingresos esperados basados en tarifas de clientes activos
// ADAPTADO PARA MESES EN ESPAÑOL
exports.calcularIngresosEsperados = async (anio) => {
    try {
        const mesesOrdenados = [
            'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
            'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
        ];
        
        // Mapeo de meses a números
        const mesANumero = {
            'ENERO': 1, 'FEBRERO': 2, 'MARZO': 3, 'ABRIL': 4,
            'MAYO': 5, 'JUNIO': 6, 'JULIO': 7, 'AGOSTO': 8,
            'SEPTIEMBRE': 9, 'OCTUBRE': 10, 'NOVIEMBRE': 11, 'DICIEMBRE': 12
        };
        
        const ingresosEsperados = [];
        
        for (let mes of mesesOrdenados) {
            const numeroMes = mesANumero[mes];
            
            // Crear fecha límite para el mes actual
            const fechaLimite = moment(`${anio}-${numeroMes.toString().padStart(2, '0')}-01`).endOf('month').format('YYYY-MM-DD');
            
            console.log(`📅 Calculando para ${mes} ${anio} - Fecha límite: ${fechaLimite}`);
            
            // Obtener clientes activos que estaban registrados hasta este mes
            const clientesActivos = await Cliente.findAll({
                attributes: ['ID', 'tarifa_id', 'FechaInstalacion'],
                include: [
                    {
                        model: Estado,
                        as: 'estado',
                        attributes: ['Estado'],
                        where: {
                            Estado: {
                                [Op.in]: ['activo', 'convenio']
                            }
                        }
                    },
                    {
                        model: Tarifa,
                        as: 'tarifa',
                        attributes: ['valor'],
                        required: false
                    }
                ],
                where: {
                    FechaInstalacion: {
                        [Op.lte]: fechaLimite
                    }
                }
            });
            
            console.log(`   👥 Clientes activos encontrados: ${clientesActivos.length}`);
            
            // Sumar las tarifas de todos los clientes activos
            const totalEsperado = clientesActivos.reduce((sum, cliente) => {
                const valor = cliente.tarifa?.valor || 0;
                return sum + parseFloat(valor);
            }, 0);
            
            console.log(`   💰 Total esperado: ${totalEsperado}`);
            
            ingresosEsperados.push({
                mes: mes,
                anio: anio,
                totalEsperado: totalEsperado,
                cantidadClientes: clientesActivos.length
            });
        }
        
        return ingresosEsperados;
        
    } catch (error) {
        console.error('❌ Error al calcular ingresos esperados:', error);
        return [];
    }
};

// Método auxiliar para debuggear los estados en la BD
exports.getEstadosDebug = async (req, res) => {
    try {
        console.log('🔍 Obteniendo todos los estados para debug...');
        
        const estados = await Estado.findAll({
            attributes: ['ID', 'Estado'],
            order: [['ID', 'ASC']]
        });
        
        const clientesPorEstado = await Promise.all(
            estados.map(async (estado) => {
                const count = await Cliente.count({ where: { EstadoID: estado.ID } });
                return {
                    id: estado.ID,
                    nombre: estado.Estado,
                    cantidad: count
                };
            })
        );
        
        console.log('📋 Estados disponibles:', clientesPorEstado);
        
        res.json({
            message: 'Estados encontrados en la base de datos',
            estados: clientesPorEstado,
            totalClientes: await Cliente.count()
        });
        
    } catch (error) {
        console.error("❌ Error al obtener estados debug:", error);
        res.status(500).json({ 
            message: "Error al obtener estados", 
            error: error.message 
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