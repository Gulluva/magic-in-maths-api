// models/userSumPractice.js
'use strict';


module.exports = (sequelize, DataTypes) => {
  
const UserSumPractice = sequelize.define('UserSumPractice', {
    UserId: {  // Match the capitalization Sequelize is using
      type: DataTypes.INTEGER,
      allowNull: false
    },
    SumId: {   // Match the capitalization Sequelize is using
      type: DataTypes.INTEGER,
      allowNull: false
    },
    practiceCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    lastPracticedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    masteryLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'user_sum_practices',
    timestamps: true
  });

  UserSumPractice.associate = (models) => {
    UserSumPractice.belongsTo(models.User, {
        foreignKey: 'UserId'
    });
    UserSumPractice.belongsTo(models.Sum, {
        foreignKey: 'SumId'
    });
};
  
  return UserSumPractice;
};