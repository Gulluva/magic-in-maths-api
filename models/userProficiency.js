// models/userProficiency.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserProficiency extends Model {
    static associate(models) {
      UserProficiency.belongsTo(models.User, {
        foreignKey: 'UserId'
      });
      UserProficiency.belongsTo(models.SpellCategory, {
        foreignKey: 'spellCategoryId'
      });
    }
  }
  
  UserProficiency.init({
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    spellCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'spell_categories',
        key: 'id'
      }
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    experiencePoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'UserProficiency',
    tableName: 'user_proficiencies'
  });
  
  return UserProficiency;
};