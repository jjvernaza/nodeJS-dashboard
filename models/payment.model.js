const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const MetodoDePago = require('./metodo_pago.model');

const Pago = sequelize.define('Pago', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ClienteID: {
        type: DataTypes.INTEGER,
        allowNull: false
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

// ✅ Relación con MetodoDePago
Pago.belongsTo(MetodoDePago, { foreignKey: 'Metodo_de_PagoID', as: 'metodoPago' });

module.exports = Pago;
