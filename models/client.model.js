const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Estado = require('./estado.model');
const TipoServicio = require('./service_type.model');

const Cliente = sequelize.define('Cliente', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    NombreCliente: DataTypes.STRING,
    PlanMB: DataTypes.STRING,
    FechaInstalacion: DataTypes.DATE,
    Tarifa: DataTypes.DECIMAL(10, 2),
    IPAddress: DataTypes.STRING,
    Telefono: DataTypes.STRING,
    Ubicacion: DataTypes.STRING,
    Cedula: DataTypes.STRING,
    TipoServicioID: {
        type: DataTypes.INTEGER,
        references: {
            model: 'tipo_servicio',
            key: 'ID'
        }
    },
    EstadoID: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Estados',
            key: 'ID'
        }
    }
}, {
    tableName: 'clientes',
    timestamps: false
});

// Relaciones corregidas
Cliente.belongsTo(Estado, { foreignKey: 'EstadoID', as: 'estado' });
Cliente.belongsTo(TipoServicio, { foreignKey: 'TipoServicioID', as: 'tipoServicio' });

module.exports = Cliente;
