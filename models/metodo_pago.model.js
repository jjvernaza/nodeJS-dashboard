const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const MetodoDePago = sequelize.define('MetodoDePago', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true  // 🔥 Esto asegura que se generen IDs automáticamente
    },
    Metodo: {
        type: DataTypes.STRING(20),
        allowNull: false // 🔥 Asegura que cada método tenga un nombre
    }
}, {
    tableName: 'Metodo_de_Pago',
    timestamps: false
});

module.exports = MetodoDePago;
