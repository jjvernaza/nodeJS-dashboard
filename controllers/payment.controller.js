const Pago = require('../models/payment.model'); 
const Cliente = require('../models/client.model'); 
const MetodoDePago = require('../models/metodo_pago.model');
const Tarifa = require('../models/tarifa.model');
const moment = require('moment');    

// Añadir pago
exports.addPayment = async (req, res) => {     
    try {         
        let { ClienteID, FechaPago, Mes, Ano, Monto, Metodo_de_PagoID } = req.body;          
        
        // Verificar que el cliente existe
        const cliente = await Cliente.findByPk(ClienteID, {
            include: [{ model: Tarifa, as: 'tarifa' }]
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
        
        const newPayment = await Pago.create({             
            ClienteID,             
            FechaPago,             
            Mes,             
            Ano,             
            Monto,             
            Metodo_de_PagoID         
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

// Nueva función para obtener los métodos de pago 
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

// ✅ Obtener pagos de un cliente 
exports.getPagosCliente = async (req, res) => {     
    try {         
        const { clienteID } = req.params;         
        if (!clienteID) {             
            return res.status(400).json({ message: "El ID del cliente es requerido" });         
        }          
        
        const pagos = await Pago.findAll({             
            where: { ClienteID: clienteID },             
            include: [{                 
                model: MetodoDePago,                 
                as: 'metodoPago',                   
                attributes: ['ID', 'Metodo']             
            }],
            order: [['FechaPago', 'DESC'], ['ID', 'DESC']] // Ordenar por fecha más reciente primero
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

// Obtener todos los pagos con información del cliente y método de pago
exports.getAllPagos = async (req, res) => {
    try {
        const pagos = await Pago.findAll({
            include: [
                {
                    model: Cliente,
                    as: 'cliente',
                    attributes: ['ID', 'NombreCliente', 'ApellidoCliente']
                },
                {
                    model: MetodoDePago,
                    as: 'metodoPago',
                    attributes: ['ID', 'Metodo']
                }
            ],
            order: [['FechaPago', 'DESC'], ['ID', 'DESC']] // Ordenar por fecha más reciente primero
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

// ✅ NUEVO: Obtener ingresos mensuales por año
exports.getMonthlyIncome = async (req, res) => {
    try {
        const year = req.query.anio || new Date().getFullYear();
        
        // Convertir a número para la comparación
        const anioNum = parseInt(year, 10);
        
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
            order: [['Mes', 'ASC']]
        });
        
        // Si no hay datos, crear array con valores cero
        if (pagos.length === 0) {
            const mesesData = [];
            const meses = [
                'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
            ];
            
            for (let i = 0; i < meses.length; i++) {
                mesesData.push({
                    Mes: meses[i],
                    anio: anioNum,
                    total: 0
                });
            }
            return res.status(200).json(mesesData);
        }
        
        // Formatear los datos para la respuesta
        const result = pagos.map(pago => {
            const pagoObj = pago.get({ plain: true });
            return {
                Mes: pagoObj.Mes,
                anio: pagoObj.Ano,
                total: parseFloat(pagoObj.total) || 0
            };
        });
        
        res.status(200).json(result);
    } catch (error) {
        console.error('❌ Error al obtener ingresos mensuales:', error);
        res.status(500).json({ 
            message: 'Error al obtener ingresos mensuales', 
            error: error.message 
        });
    }
};