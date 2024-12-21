// models/sum.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Sum extends Model {
    static associate(models) {
      Sum.hasMany(models.UserSumPractice, {
        foreignKey: 'sumId'
      });
    }
  }
  
  Sum.init({
    addend1: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    addend2: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    result: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isPrime: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    stage: {  // Added stage field
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'Sum',
    tableName: 'sums',
    timestamps: false
  });
  
  return Sum;
};