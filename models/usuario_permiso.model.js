const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const Usuario = require('./user.model');
const Permiso = require('./permisos.model');

const UsuarioPermiso = sequelize.define('UsuarioPermiso', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'master_users',
            key: 'ID'
        },
        allowNull: false
    },
    permiso_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'permisos',
            key: 'id'
        },
        allowNull: false
    },
    fecha_asignacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    }
}, {
    tableName: 'usuario_permiso',
    timestamps: false
});

// Definir relaciones
UsuarioPermiso.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
UsuarioPermiso.belongsTo(Permiso, { foreignKey: 'permiso_id', as: 'permiso' });

module.exports = UsuarioPermiso;