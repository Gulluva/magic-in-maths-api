// models/userSumPractice.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserSumPractice extends Model {
    static associate(models) {
      UserSumPractice.belongsTo(models.User, {
        foreignKey: 'UserId',  // Match the capitalization Sequelize is expecting
      });
      UserSumPractice.belongsTo(models.Sum, {
        foreignKey: 'SumId',   // Match the capitalization Sequelize is expecting
      });
    }
  }
  
  UserSumPractice.init({
    UserId: {  // Match the capitalization Sequelize is using
      type: DataTypes.INTEGER,
      allowNull: false
    },
    SumId: {   // Match the capitalization Sequelize is using
      type: DataTypes.INTEGER,
      allowNull: false
    },
    practiceCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    lastPracticedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    masteryLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'UserSumPractice',
    tableName: 'user_sum_practices',
    timestamps: true
  });
  
  return UserSumPractice;
};