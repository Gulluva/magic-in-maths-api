//  models/spell.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Spell = sequelize.define('Spell', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: "Spell name cannot be empty"
        },
        len: {
          args: [6, 30], // Example: name must be between 3 and 255 characters
          msg: "Spell name must be between 6 and 30 characters"
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: "Description cannot be empty" // if you decide to make description not null in the future
        }
      }
    },
    sumId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Sums',
        key: 'id',
      },
      onDelete: 'CASCADE', // Add onDelete behavior
      onUpdate: 'CASCADE', // Add onUpdate behavior
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'SpellCategories',
        key: 'id',
      },
      onDelete: 'CASCADE', // Add onDelete behavior
      onUpdate: 'CASCADE', // Consider if you need onUpdate here
    }
  },
  {
    timestamps: true,
  });

  Spell.associate = (models) => {
    Spell.belongsTo(models.Sum, { foreignKey: 'sumId', as: 'sum' });
    Spell.belongsTo(models.SpellCategory, { foreignKey: 'categoryId', as: 'category' });
  };

  return Spell;
};