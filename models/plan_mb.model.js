const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Plan = sequelize.define('Plan', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    velocidad: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'plan_mb',
    timestamps: false
});

module.exports = Plan;