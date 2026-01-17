const { Sequelize, DataTypes } = require('sequelize'); 
const sequelize = require('../config/db.config');  

const Estado = require('./estado.model'); 
const TipoServicio = require('./service_type.model');
// Nuevas relaciones
const Plan = require('./plan_mb.model');
const Sector = require('./sector.model');
const Tarifa = require('./tarifa.model');

const Cliente = sequelize.define('Cliente', {     
    ID: {         
        type: DataTypes.INTEGER,         
        primaryKey: true,         
        autoIncrement: true,     
    },     
    NombreCliente: DataTypes.STRING,
    ApellidoCliente: DataTypes.STRING,
    plan_mb_id: {  // Nueva relación
        type: DataTypes.INTEGER,
        references: {
            model: 'plan_mb',
            key: 'id'
        }
    },
    FechaInstalacion: DataTypes.DATE,
    TipoServicioID: {         
        type: DataTypes.INTEGER,         
        references: {             
            model: 'tipo_servicio',             
            key: 'ID'         
        }     
    },
    tarifa_id: {  // Nueva relación
        type: DataTypes.INTEGER,
        references: {
            model: 'tarifa',
            key: 'id'
        }
    },
    sector_id: {  // Nueva relación
        type: DataTypes.INTEGER,
        references: {
            model: 'sector',
            key: 'id'
        }
    },
    IPAddress: DataTypes.STRING,     
    Telefono: DataTypes.STRING,     
    Ubicacion: DataTypes.STRING,     
    Cedula: DataTypes.STRING,
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

// Relaciones corregidas y nuevas
Cliente.belongsTo(Estado, { foreignKey: 'EstadoID', as: 'estado' }); 
Cliente.belongsTo(TipoServicio, { foreignKey: 'TipoServicioID', as: 'tipoServicio' });
// Nuevas relaciones
Cliente.belongsTo(Plan, { foreignKey: 'plan_mb_id', as: 'plan' });
Cliente.belongsTo(Sector, { foreignKey: 'sector_id', as: 'sector' });
Cliente.belongsTo(Tarifa, { foreignKey: 'tarifa_id', as: 'tarifa' });

module.exports = Cliente;