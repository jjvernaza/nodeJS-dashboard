const Pago = require('../models/payment.model'); 
const Cliente = require('../models/client.model'); 
const MetodoDePago = require('../models/metodo_pago.model');
const Tarifa = require('../models/tarifa.model');
const PlanMB = require('../models/plan_mb.model');
const Sector = require('../models/sector.model');
const Estado = require('../models/estado.model');
const moment = require('moment');
const XLSX = require('xlsx');

// ✅ Añadir pago con registro histórico de plan y tarifa
exports.addPayment = async (req, res) => {     
    try {         
        let { ClienteID, FechaPago, Mes, Ano, Monto, Metodo_de_PagoID } = req.body;          
        
        // Verificar que el cliente existe e incluir plan y tarifa
        const cliente = await Cliente.findByPk(ClienteID, {
            include: [
                { 
                    model: Tarifa, 
                    as: 'tarifa' 
                },
                { 
                    model: PlanMB, 
                    as: 'plan',
                    attributes: ['id', 'nombre', 'velocidad']
                }
            ]
        });
        
        if (!cliente) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }
        
        // Verificar que el método de pago existe
        const metodoPago = await MetodoDePago.findByPk(Metodo_de_PagoID);
        if (!metodoPago) {
            return res.status(404).json({ message: "Método de pago no encontrado" });
        }
        
        // Si no se proporciona el monto, usar la tarifa del cliente
        if (!Monto && cliente.tarifa) {
            Monto = cliente.tarifa.valor;
        }
        
        if (!Monto) {
            return res.status(400).json({ message: "El monto es requerido y no se pudo determinar automáticamente" });
        }
        
        // ✅ Convertir la fecha al formato 'YYYY-MM-DD' antes de guardarla         
        FechaPago = moment(FechaPago, ['YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY', 'DD/MM/YYYY']).format('YYYY-MM-DD');          
        
        // ✅ Capturar plan y tarifa actual del cliente para registro histórico
        const datosHistoricos = {
            plan_mb_id: cliente.plan_mb_id || null,
            tarifa_id: cliente.tarifa_id || null,
            velocidad_contratada: cliente.plan?.velocidad || null
        };
        
        console.log('📊 Guardando pago con datos históricos:', datosHistoricos);
        
        const newPayment = await Pago.create({             
            ClienteID,             
            FechaPago,             
            Mes,             
            Ano,             
            Monto,             
            Metodo_de_PagoID,
            // ✅ Agregar campos históricos
            plan_mb_id: datosHistoricos.plan_mb_id,
            tarifa_id: datosHistoricos.tarifa_id,
            velocidad_contratada: datosHistoricos.velocidad_contratada
        });          
        
        res.status(201).json({
            message: "Pago registrado correctamente",
            payment: newPayment
        });     
    } catch (error) {         
        console.error("❌ Error al agregar pago:", error);         
        res.status(500).json({ message: "Error al agregar pago", error: error.message });     
    } 
};   

// Obtener los métodos de pago 
exports.getMetodosPago = async (req, res) => {     
    try {         
        const metodos = await MetodoDePago.findAll();                  
        
        if (!metodos || metodos.length === 0) {             
            return res.status(404).json({ message: "No hay métodos de pago registrados" });         
        }          
        
        res.json(metodos);     
    } catch (error) {         
        console.error('❌ Error al obtener métodos de pago:', error);         
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });     
    } 
};     

// ✅ Obtener pagos de un cliente con información histórica
exports.getPagosCliente = async (req, res) => {     
    try {         
        const { clienteID } = req.params;         
        if (!clienteID) {             
            return res.status(400).json({ message: "El ID del cliente es requerido" });         
        }          
        
        const pagos = await Pago.findAll({             
            where: { ClienteID: clienteID },             
            include: [
                {                 
                    model: MetodoDePago,                 
                    as: 'metodoPago',                   
                    attributes: ['ID', 'Metodo']             
                },
                {
                    model: PlanMB,
                    as: 'planHistorico',
                    attributes: ['id', 'nombre', 'velocidad']
                },
                {
                    model: Tarifa,
                    as: 'tarifaHistorica',
                    attributes: ['id', 'valor']
                }
            ],
            order: [['FechaPago', 'DESC'], ['ID', 'DESC']]
        });          
        
        if (!pagos || pagos.length === 0) {             
            return res.json([]);         
        }          
        
        res.json(pagos);     
    } catch (error) {         
        console.error("❌ Error al obtener pagos del cliente:", error);         
        res.status(500).json({ message: "Error interno del servidor", error: error.message });     
    } 
};

// ✅ Obtener todos los pagos con información histórica
exports.getAllPagos = async (req, res) => {
    try {
        const pagos = await Pago.findAll({
            include: [
                {
                    model: Cliente,
                    as: 'cliente',
                    attributes: ['ID', 'NombreCliente', 'ApellidoCliente', 'Cedula']
                },
                {
                    model: MetodoDePago,
                    as: 'metodoPago',
                    attributes: ['ID', 'Metodo']
                },
                {
                    model: PlanMB,
                    as: 'planHistorico',
                    attributes: ['id', 'nombre', 'velocidad']
                },
                {
                    model: Tarifa,
                    as: 'tarifaHistorica',
                    attributes: ['id', 'valor']
                }
            ],
            order: [['FechaPago', 'DESC'], ['ID', 'DESC']]
        });
        
        res.json(pagos);
    } catch (error) {
        console.error("❌ Error al obtener todos los pagos:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Actualizar pago
exports.updatePayment = async (req, res) => {
    try {
        const { id } = req.params;
        let { FechaPago, Mes, Ano, Monto, Metodo_de_PagoID } = req.body;
        
        const pago = await Pago.findByPk(id);
        if (!pago) {
            return res.status(404).json({ message: "Pago no encontrado" });
        }
        
        // Si se proporciona FechaPago, formatearlo
        if (FechaPago) {
            FechaPago = moment(FechaPago, ['YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY', 'DD/MM/YYYY']).format('YYYY-MM-DD');
        }
        
        // Si se proporciona Metodo_de_PagoID, verificar que existe
        if (Metodo_de_PagoID) {
            const metodoPago = await MetodoDePago.findByPk(Metodo_de_PagoID);
            if (!metodoPago) {
                return res.status(404).json({ message: "Método de pago no encontrado" });
            }
        }
        
        // ⚠️ NOTA: No actualizamos plan_mb_id, tarifa_id ni velocidad_contratada
        // porque son datos históricos que deben permanecer como estaban al momento del pago original
        
        await pago.update({
            FechaPago: FechaPago || pago.FechaPago,
            Mes: Mes || pago.Mes,
            Ano: Ano || pago.Ano,
            Monto: Monto || pago.Monto,
            Metodo_de_PagoID: Metodo_de_PagoID || pago.Metodo_de_PagoID
        });
        
        res.json({
            message: "Pago actualizado correctamente",
            payment: pago
        });
    } catch (error) {
        console.error("❌ Error al actualizar pago:", error);
        res.status(500).json({ message: "Error al actualizar pago", error: error.message });
    }
};

// Eliminar pago
exports.deletePayment = async (req, res) => {
    try {
        const { id } = req.params;
        
        const pago = await Pago.findByPk(id);
        if (!pago) {
            return res.status(404).json({ message: "Pago no encontrado" });
        }
        
        await pago.destroy();
        
        res.json({ message: "Pago eliminado correctamente" });
    } catch (error) {
        console.error("❌ Error al eliminar pago:", error);
        res.status(500).json({ message: "Error al eliminar pago", error: error.message });
    }
};

// ✅ Obtener ingresos mensuales por año con orden cronológico correcto
exports.getMonthlyIncome = async (req, res) => {
    try {
        const year = req.query.anio || new Date().getFullYear();
        const anioNum = parseInt(year, 10);
        
        console.log(`📊 Obteniendo ingresos mensuales para el año: ${anioNum}`);
        
        // Definir orden de meses EN ESPAÑOL
        const mesesOrdenados = [
            'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
            'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
        ];
        
        // Query para obtener ingresos mensuales del año seleccionado
        const pagos = await Pago.findAll({
            attributes: [
                'Mes',
                'Ano',
                [Pago.sequelize.fn('SUM', Pago.sequelize.col('Monto')), 'total']
            ],
            where: { 
                Ano: anioNum 
            },
            group: ['Mes', 'Ano'],
            raw: true
        });
        
        console.log(`✅ Pagos encontrados: ${pagos.length} meses con datos`);
        
        // Crear estructura completa con todos los meses
        const resultadoCompleto = mesesOrdenados.map(mes => {
            // Buscar si hay datos para este mes
            const pagoMes = pagos.find(p => p.Mes === mes);
            
            return {
                Mes: mes,
                anio: anioNum,
                total: pagoMes ? parseFloat(pagoMes.total) || 0 : 0
            };
        });
        
        console.log(`📈 Devolviendo ${resultadoCompleto.length} meses ordenados`);
        res.status(200).json(resultadoCompleto);
        
    } catch (error) {
        console.error('❌ Error al obtener ingresos mensuales:', error);
        res.status(500).json({ 
            message: 'Error al obtener ingresos mensuales', 
            error: error.message 
        });
    }
};

// ✅ NUEVA FUNCIÓN: Calcular ingresos esperados por mes
/**
 * Calcula los ingresos esperados mes a mes para un año específico
 * 
 * LÓGICA:
 * - Para cada mes del año, contamos SOLO los clientes que:
 *   1. Se instalaron ANTES del primer día de ese mes
 *   2. Están en estado Activo o Convenio (EstadoID 1 o 4)
 * - Sumamos las tarifas de esos clientes para obtener el ingreso esperado del mes
 * 
 * EJEMPLO:
 * - Cliente instalado el 15 de Enero 2024
 * - En Enero 2024: NO se cuenta (aún no debe pagar)
 * - En Febrero 2024: SÍ se cuenta (ya debe pagar febrero)
 * - En Marzo 2024: SÍ se cuenta (ya debe pagar marzo)
 */
exports.getIngresosEsperadosPorMes = async (req, res) => {
    try {
        const anio = parseInt(req.query.anio) || new Date().getFullYear();
        
        console.log(`\n📊 ===== CÁLCULO DE INGRESOS ESPERADOS ${anio} =====`);
        
        const mesesNombres = [
            'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
            'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
        ];
        
        const resultados = [];
        
        // Obtener todos los clientes una sola vez
        const todosLosClientes = await Cliente.findAll({
            attributes: ['ID', 'FechaInstalacion', 'EstadoID', 'tarifa_id'],
            include: [
                {
                    model: Tarifa,
                    as: 'tarifa',
                    attributes: ['id', 'valor']
                },
                {
                    model: Estado,
                    as: 'estado',
                    attributes: ['ID', 'Estado']
                }
            ]
        });
        
        console.log(`📋 Total de clientes en la base de datos: ${todosLosClientes.length}`);
        
        // Procesar cada mes del año
        for (let mesIndex = 0; mesIndex < 12; mesIndex++) {
            const nombreMes = mesesNombres[mesIndex];
            const numeroMes = mesIndex + 1; // 1-12
            
            // Fecha del primer día del mes actual
            const primerDiaDelMes = new Date(anio, mesIndex, 1);
            
            console.log(`\n📅 Procesando ${nombreMes} ${anio} (Mes ${numeroMes})`);
            console.log(`   Primer día del mes: ${primerDiaDelMes.toISOString().split('T')[0]}`);
            
            let totalEsperado = 0;
            let cantidadClientes = 0;
            const clientesDetalle = [];
            
            // Filtrar clientes que deben pagar este mes
            for (const cliente of todosLosClientes) {
                // Verificar que el cliente tenga fecha de instalación
                if (!cliente.FechaInstalacion) {
                    continue;
                }
                
                const fechaInstalacion = new Date(cliente.FechaInstalacion);
                
                // ✅ REGLA CRÍTICA: El cliente debe estar instalado ANTES del primer día del mes
                // Ejemplo: Para cobrar Febrero, el cliente debe estar instalado antes del 1 de Febrero
                const estabaInstaladoAntesDelMes = fechaInstalacion < primerDiaDelMes;
                
                if (!estabaInstaladoAntesDelMes) {
                    continue;
                }
                
                // Verificar que el cliente esté activo (Activo=1 o Convenio=4)
                const estaActivo = cliente.EstadoID === 1 || cliente.EstadoID === 4;
                
                if (!estaActivo) {
                    continue;
                }
                
                // Verificar que tenga tarifa
                if (!cliente.tarifa || !cliente.tarifa.valor) {
                    console.log(`   ⚠️ Cliente ${cliente.ID} sin tarifa, omitido`);
                    continue;
                }
                
                // ✅ Este cliente SÍ debe pagar este mes
                const tarifaCliente = parseFloat(cliente.tarifa.valor);
                totalEsperado += tarifaCliente;
                cantidadClientes++;
                
                clientesDetalle.push({
                    id: cliente.ID,
                    fechaInstalacion: fechaInstalacion.toISOString().split('T')[0],
                    estado: cliente.estado?.Estado || 'N/A',
                    tarifa: tarifaCliente
                });
            }
            
            console.log(`   ✅ Clientes que deben pagar: ${cantidadClientes}`);
            console.log(`   💰 Ingreso esperado: $${totalEsperado.toLocaleString('es-CO')}`);
            
            // Agregar resultado del mes
            resultados.push({
                mes: nombreMes,
                numeroMes: numeroMes,
                anio: anio,
                totalEsperado: totalEsperado,
                cantidadClientes: cantidadClientes,
                // Incluir detalle solo en desarrollo para debugging
                ...(process.env.NODE_ENV === 'development' && clientesDetalle.length <= 10 ? { clientesDetalle } : {})
            });
        }
        
        console.log(`\n✅ ===== FIN DEL CÁLCULO =====`);
        console.log(`📈 Meses procesados: ${resultados.length}`);
        console.log(`💵 Total anual esperado: $${resultados.reduce((sum, m) => sum + m.totalEsperado, 0).toLocaleString('es-CO')}\n`);
        
        res.json(resultados);
        
    } catch (error) {
        console.error('❌ Error al calcular ingresos esperados:', error);
        res.status(500).json({ 
            message: 'Error al calcular ingresos esperados',
            error: error.message 
        });
    }
};

// ✅ Generar reporte de clientes con pagos anuales en Excel
exports.generarReporteClientesPagos = async (req, res) => {
    try {
        const { ano } = req.query;
        const anioSeleccionado = ano ? parseInt(ano) : new Date().getFullYear();
        
        console.log(`📊 Generando reporte de pagos para el año ${anioSeleccionado}`);
        
        // Obtener todos los clientes con sus relaciones
        const clientes = await Cliente.findAll({
            include: [
                {
                    model: PlanMB,
                    as: 'plan',
                    attributes: ['id', 'nombre', 'velocidad']
                },
                {
                    model: Tarifa,
                    as: 'tarifa',
                    attributes: ['id', 'valor']
                },
                {
                    model: Sector,
                    as: 'sector',
                    attributes: ['id', 'nombre']
                },
                {
                    model: Estado,
                    as: 'estado',
                    attributes: ['ID', 'Estado']
                }
            ],
            order: [['NombreCliente', 'ASC'], ['ApellidoCliente', 'ASC']]
        });
        
        console.log(`👥 Clientes encontrados: ${clientes.length}`);
        
        // Obtener pagos con información histórica
        const pagos = await Pago.findAll({
            where: {
                Ano: anioSeleccionado
            },
            include: [
                {
                    model: PlanMB,
                    as: 'planHistorico',
                    attributes: ['nombre', 'velocidad']
                },
                {
                    model: Tarifa,
                    as: 'tarifaHistorica',
                    attributes: ['valor']
                }
            ],
            attributes: ['ClienteID', 'Mes', 'Monto', 'velocidad_contratada']
        });
        
        console.log(`💰 Pagos encontrados: ${pagos.length}`);
        
        // Meses en orden
        const meses = [
            'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
            'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
        ];
        
        // Crear estructura de datos para Excel
        const datosExcel = [];
        
        // Encabezados
        const encabezados = [
            'Nombre',
            'Apellido',
            'CC',
            'Plan MB',
            'Tarifa',
            'Teléfono',
            'Ubicación',
            'Sector',
            'Estado',
            ...meses
        ];
        
        datosExcel.push(encabezados);
        
        // Procesar cada cliente
        for (const cliente of clientes) {
            const fila = [
                cliente.NombreCliente || '',
                cliente.ApellidoCliente || '',
                cliente.Cedula || '',
                cliente.plan?.nombre || 'Sin plan',
                cliente.tarifa ? `$${parseFloat(cliente.tarifa.valor).toLocaleString('es-CO')}` : 'Sin tarifa',
                cliente.Telefono || '',
                cliente.Ubicacion || '',
                cliente.sector?.nombre || 'Sin sector',
                cliente.estado?.Estado || 'Sin estado'
            ];
            
            // Agregar pagos por mes con información histórica
            for (const mes of meses) {
                const pagoMes = pagos.find(p => 
                    p.ClienteID === cliente.ID && 
                    p.Mes === mes
                );
                
                if (pagoMes) {
                    // Mostrar monto con información del plan histórico si está disponible
                    let textoPago = `$${parseFloat(pagoMes.Monto).toLocaleString('es-CO')}`;
                    if (pagoMes.planHistorico?.nombre) {
                        textoPago += ` (${pagoMes.planHistorico.nombre})`;
                    }
                    if (pagoMes.velocidad_contratada) {
                        textoPago += ` ${pagoMes.velocidad_contratada}`;
                    }
                    fila.push(textoPago);
                } else {
                    fila.push('No ha pagado aún');
                }
            }
            
            datosExcel.push(fila);
        }
        
        // Crear libro de Excel
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(datosExcel);
        
        // Ajustar anchos de columnas
        const columnWidths = [
            { wch: 20 }, // Nombre
            { wch: 20 }, // Apellido
            { wch: 15 }, // CC
            { wch: 18 }, // Plan MB
            { wch: 12 }, // Tarifa
            { wch: 15 }, // Teléfono
            { wch: 30 }, // Ubicación
            { wch: 15 }, // Sector
            { wch: 12 }, // Estado
            ...meses.map(() => ({ wch: 20 })) // Meses
        ];
        
        worksheet['!cols'] = columnWidths;
        
        // Estilo para encabezados
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + "1";
            if (!worksheet[address]) continue;
            worksheet[address].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: "4472C4" } },
                alignment: { horizontal: "center" }
            };
        }
        
        // Agregar hoja al libro
        XLSX.utils.book_append_sheet(workbook, worksheet, `Pagos ${anioSeleccionado}`);
        
        // Generar buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        // Configurar headers para descarga
        const fechaActual = new Date().toISOString().split('T')[0];
        const nombreArchivo = `reporte_clientes_pagos_${anioSeleccionado}_${fechaActual}.xlsx`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Length', buffer.length);
        
        console.log(`✅ Reporte generado exitosamente: ${nombreArchivo}`);
        res.send(buffer);
        
    } catch (error) {
        console.error('❌ Error al generar reporte:', error);
        res.status(500).json({ 
            message: 'Error al generar reporte', 
            error: error.message 
        });
    }
};