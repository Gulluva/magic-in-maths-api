// models/spellEntity.js
'use strict';

module.exports = (sequelize, DataTypes) => {
    const SpellEntity = sequelize.define('SpellEntity', {
      spellId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Spells',
          key: 'id'
        }
      },
      entityTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'EntityTypes',
          key: 'id'
        }
      }
    });

//  Define relationships
SpellEntity.associate = (models) => {
        SpellEntity.belongsTo(models.Spell, {
            foreignKey: 'spellId'
        });
        SpellEntity.belongsTo(models.EntityType, {
            foreignKey: 'entityTypeId'
        });
    };

    return SpellEntity;
  };