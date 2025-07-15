const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Sector = sequelize.define('Sector', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'sector',
    timestamps: false
});

module.exports = Sector;