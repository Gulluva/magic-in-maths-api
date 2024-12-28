// models/spellCategory.js
'use strict';

module.exports = (sequelize, DataTypes) => {
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

 // Define associations in the associate method
 SpellCategory.associate = (models) => {
    SpellCategory.hasMany(models.Spell, { foreignKey: 'spellCategoryId' });
    SpellCategory.hasMany(models.UserProficiency, { foreignKey: 'spellCategoryId' });
};

return SpellCategory;

};