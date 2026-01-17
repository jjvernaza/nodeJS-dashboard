const { DataTypes } = require('sequelize'); 
const sequelize = require('../config/db.config'); 
const MetodoDePago = require('./metodo_pago.model');
const Cliente = require('./client.model');
const PlanMB = require('./plan_mb.model');
const Tarifa = require('./tarifa.model');

const Pago = sequelize.define('Pago', {     
    ID: {         
        type: DataTypes.INTEGER,         
        primaryKey: true,         
        autoIncrement: true     
    },     
    ClienteID: {         
        type: DataTypes.INTEGER,         
        allowNull: false,
        references: {
            model: Cliente,
            key: 'ID'
        }
    },     
    FechaPago: {         
        type: DataTypes.DATE,         
        allowNull: false     
    },     
    Mes: {         
        type: DataTypes.STRING(20),         
        allowNull: false     
    },     
    Ano: {         
        type: DataTypes.INTEGER,         
        allowNull: false     
    },     
    Monto: {         
        type: DataTypes.DECIMAL(10,2),         
        allowNull: false     
    },
    // ✅ NUEVOS CAMPOS AGREGADOS
    plan_mb_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: PlanMB,
            key: 'id'
        },
        comment: 'Plan contratado al momento del pago'
    },
    tarifa_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Tarifa,
            key: 'id'
        },
        comment: 'Tarifa aplicada al momento del pago'
    },
    velocidad_contratada: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Velocidad del plan al momento del pago'
    },
    Metodo_de_PagoID: {         
        type: DataTypes.INTEGER,         
        allowNull: false,         
        references: {             
            model: MetodoDePago,             
            key: 'ID'         
        }     
    } 
}, {     
    tableName: 'pagos',     
    timestamps: false 
});  

// ✅ Relaciones
Pago.belongsTo(MetodoDePago, { foreignKey: 'Metodo_de_PagoID', as: 'metodoPago' });
Pago.belongsTo(Cliente, { foreignKey: 'ClienteID', as: 'cliente' });
Pago.belongsTo(PlanMB, { foreignKey: 'plan_mb_id', as: 'planHistorico' });
Pago.belongsTo(Tarifa, { foreignKey: 'tarifa_id', as: 'tarifaHistorica' });

module.exports = Pago;