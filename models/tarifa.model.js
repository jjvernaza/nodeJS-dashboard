const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Tarifa = sequelize.define('Tarifa', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    tableName: 'tarifa',
    timestamps: false
});

module.exports = Tarifa;