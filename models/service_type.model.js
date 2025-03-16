const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const TipoServicio = sequelize.define('TipoServicio', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Tipo: DataTypes.STRING
}, {
    tableName: 'tipo_servicio',
    timestamps: false
});

module.exports = TipoServicio;
