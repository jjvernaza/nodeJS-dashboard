const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Estado = sequelize.define('Estado', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    Estado: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    tableName: 'Estados',
    timestamps: false
});

module.exports = Estado;
