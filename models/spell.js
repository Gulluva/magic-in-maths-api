// models/spell.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Spell extends Model {
    static associate(models) {
      // Existing associations
      Spell.belongsTo(models.SpellCategory, {
        foreignKey: 'spellCategoryId',
        as: 'SpellCategory'
      });
      Spell.belongsToMany(models.User, { 
        through: 'UserSpells',
        as: 'practitioners'
      });

      // New association for entity types
      Spell.belongsToMany(models.EntityType, {
        through: 'SpellEntities',
        as: 'targetEntities'
      });
    }
  }
  
  Spell.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // New field for spell description
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    spellCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'spell_categories',
        key: 'id'
      }
    },
    requiredSum: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    difficultyLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    experienceGranted: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10
    }
  }, {
    sequelize,
    modelName: 'Spell',
    tableName: 'spells'
  });
  return Spell;
};