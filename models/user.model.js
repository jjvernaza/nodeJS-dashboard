const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');  // Asegúrate de que este archivo apunta correctamente a tu configuración de base de datos

const User = sequelize.define('User', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Cedula: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    Telefono: DataTypes.STRING,
    Nombre: DataTypes.STRING,
    Funcion: DataTypes.STRING,
    User: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    Password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'master_users',  // Asegúrate de que el nombre coincide con la tabla en la base de datos
    timestamps: false
});

module.exports = User;  // Exporta el modelo correctamente
