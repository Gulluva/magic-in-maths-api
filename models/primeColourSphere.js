// models/primeColourSphere.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PrimeColourSphere extends Model {
    static associate(models) {
      // define associations here if needed
    }
  }
  PrimeColourSphere.init({
    number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      primaryKey: true
    },
    black: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    white: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    red: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    blue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    green: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    purple: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    yellow: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    pink: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    brown: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    orange: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    gold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'PrimeColourSphere',
    tableName: 'prime_colour_spheres',
    timestamps: false
  });
  return PrimeColourSphere;
};