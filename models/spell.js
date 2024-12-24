//  models/spell.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../models');
const SpellCategory = require('./spellCategory');
const Sphere = require('./sphere'); // Import the Sphere model

const Spell = sequelize.define('Spell', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [3, 50], // Example: Enforce name length between 3 and 50 characters
        },
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    spellCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: SpellCategory,
            key: 'id',
        },
    },
    successExperience: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10, // Example default value
        validate: {
            min: 0,
        },
    },
    failureExperience: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5, // Example default value
        validate: {
            min: 0,
        },
    },
    formula: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    difficulty: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    minLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    sphereId: { // Use sphereId instead of sumId
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Sphere,
            key: 'id',
        },
    },
}, {
    timestamps: true,
});

// Define relationships:
Spell.associate = (models) => {
    Spell.belongsTo(models.SpellCategory, { foreignKey: 'spellCategoryId' });
    Spell.belongsTo(models.Sphere, { foreignKey: 'sphereId' });
};

module.exports = Spell;