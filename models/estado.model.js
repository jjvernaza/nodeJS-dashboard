const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Estado = sequelize.define('Estado', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Estado: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  Color: {
    type: DataTypes.STRING(7), // Para almacenar colores hex como #22c55e
    allowNull: true,
    defaultValue: '#22c55e',
    validate: {
      is: /^#[0-9A-F]{6}$/i // Validar formato hexadecimal
    }
  }
}, {
  tableName: 'Estados',
  timestamps: false
});

module.exports = Estado;