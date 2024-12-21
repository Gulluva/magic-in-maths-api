// models/entityType.js
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
        type: DataTypes.ENUM('LIVING', 'MATTER', 'ENVIRONMENTAL', 'CONSTRUCTED', 'MENTAL'),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT
      }
    });
    return EntityType;
  };