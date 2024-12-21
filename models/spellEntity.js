// models/spellEntity.js
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
    return SpellEntity;
  };