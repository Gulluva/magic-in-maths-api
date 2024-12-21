// models/spellCategory.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SpellCategory extends Model {
    static associate(models) {
      SpellCategory.hasMany(models.Spell, {
        foreignKey: 'spellCategoryId'
      });
      SpellCategory.hasMany(models.UserProficiency, {
        foreignKey: 'spellCategoryId'
      });
    }
  }
  
  SpellCategory.init({
    name: {
      type: DataTypes.ENUM('Physical', 'Chemical', 'Geological', 'Social', 'Biological', 'Mental'),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'SpellCategory',
    tableName: 'spell_categories'
  });
  return SpellCategory;
};