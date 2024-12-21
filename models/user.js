// models/user.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.UserProficiency);
      User.belongsToMany(models.SpellCategory, { 
        through: models.UserProficiency
      });
      User.hasMany(models.UserSumPractice);
      User.belongsToMany(models.Sum, { 
        through: models.UserSumPractice 
      });
    }
  }
  
  User.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    currentStage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    type: {
      type: DataTypes.ENUM('player', 'npc'),
      allowNull: false,
      defaultValue: 'player'
    },
    npcType: {
      type: DataTypes.STRING,
      allowNull: true  // Only used for NPCs
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users'
  });
  
  return User;
};