// models/entityType.js
'use strict';

module.exports = (sequelize, DataTypes) => {
    const EntityType = sequelize.define('EntityType', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      category: {
        type: DataTypes.ENUM('LIVING', 'MATTER', 'ENVIRONMENTAL', 'CONSTRUCTED', 'MENTAL', 'SOCIAL'),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT
      }
    });

//  Define relationships
    EntityType.associate = (models) => {
      EntityType.hasMany(models.SpellEntity, {
          foreignKey: 'entityTypeId'
      });
  };

    return EntityType;
  };