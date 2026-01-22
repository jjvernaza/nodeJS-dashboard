const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const TipoServicio = sequelize.define('TipoServicio', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Tipo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true // Garantiza que no haya tipos duplicados
    }
}, {
    tableName: 'tipo_servicio',
    timestamps: false
});

module.exports = TipoServicio;