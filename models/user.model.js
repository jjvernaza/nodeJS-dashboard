const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const Estado = require('./estado.model');

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
    Apellidos: DataTypes.STRING, // Nuevo campo según tu diagrama
    Funcion: DataTypes.STRING,
    User: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    Password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    fecha_modificacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    estado_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Estado,
            key: 'ID'
        },
        defaultValue: 1 // Asumiendo que 1 es "Activo"
    }
}, {
    tableName: 'master_users',
    timestamps: false,
    hooks: {
        beforeUpdate: (user) => {
            user.fecha_modificacion = new Date();
        }
    }
});

// Relaciones
User.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });

module.exports = User;