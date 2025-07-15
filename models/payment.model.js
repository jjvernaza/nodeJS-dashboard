const { DataTypes } = require('sequelize'); 
const sequelize = require('../config/db.config'); 
const MetodoDePago = require('./metodo_pago.model');
const Cliente = require('./client.model');

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

module.exports = Pago;