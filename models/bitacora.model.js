const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const User = require('./user.model');

const Bitacora = sequelize.define('Bitacora', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'master_users',
            key: 'ID'
        }
    },
    accion: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'LOGIN, LOGOUT, CREAR, ACTUALIZAR, ELIMINAR, VER, EXPORTAR, ASIGNAR_PERMISO, REVOCAR_PERMISO, CAMBIAR_ESTADO, BUSCAR'
    },
    modulo: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'USUARIOS, CLIENTES, PAGOS, PERMISOS, PLANES, SECTORES, TARIFAS, ESTADOS, TIPOS_SERVICIO, MOROSOS, DASHBOARD, SISTEMA'
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    datos_anteriores: {
        type: DataTypes.JSON,
        allowNull: true
    },
    datos_nuevos: {
        type: DataTypes.JSON,
        allowNull: true
    },
    ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fecha_hora: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'bitacora',
    timestamps: false
});

// Relación con User
Bitacora.belongsTo(User, { foreignKey: 'usuario_id', as: 'usuario' });
User.hasMany(Bitacora, { foreignKey: 'usuario_id', as: 'bitacoras' });

module.exports = Bitacora;