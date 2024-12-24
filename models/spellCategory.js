// models/spellCategory.js
'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../models');
const Spell = require('./spell'); // Assuming you have a Spell model
const UserProficiency = require('./userProficiency');

const SpellCategory = sequelize.define('SpellCategory', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.ENUM(
            'Physical',
            'Chemical',
            'Geological',
            'Social',
            'Biological',
            'Mental'
        ),
        allowNull: false,
        unique: true,
    },
    description: {
        type: DataTypes.TEXT, // You can use TEXT if you want longer descriptions
        allowNull: true,
    },
});

// Define relationships:
SpellCategory.hasMany(Spell, { foreignKey: 'spellCategoryId' });
Spell.belongsTo(SpellCategory, { foreignKey: 'spellCategoryId' });

SpellCategory.hasMany(UserProficiency, { foreignKey: 'spellCategoryId' });
UserProficiency.belongsTo(SpellCategory, { foreignKey: 'spellCategoryId' });

module.exports = SpellCategory;