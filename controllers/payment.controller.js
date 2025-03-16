const Pago = require('../models/payment.model');
const Cliente = require('../models/client.model');
const MetodoDePago = require('../models/metodo_pago.model');  // Importa el modelo correcto
const moment = require('moment'); 


exports.addPayment = async (req, res) => {
    try {
        let { ClienteID, FechaPago, Mes, Ano, Monto, Metodo_de_PagoID } = req.body;

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

        res.status(201).json(newPayment);
    } catch (error) {
        console.error("❌ Error al agregar pago:", error);
        res.status(500).json({ message: "Error al agregar pago", error });
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
        res.status(500).json({ message: 'Error interno del servidor', error });
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
            }]
        });

        if (!pagos || pagos.length === 0) {
            return res.json([]);
        }

        res.json(pagos);
    } catch (error) {
        console.error("❌ Error al obtener pagos del cliente:", error);
        res.status(500).json({ message: "Error interno del servidor", error });
    }
};


