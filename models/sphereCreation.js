// models/sphereCreation.js
'use strict';

const { modelLogger: log } = require('../utils/logger');

module.exports = (sequelize, DataTypes) => {
    const SphereCreation = sequelize.define('SphereCreation', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        configHash: {
            type: DataTypes.STRING,
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        firstCreatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    });

    SphereCreation.associate = (models) => {
        SphereCreation.belongsTo(models.User, { foreignKey: 'userId' });
    };

    return SphereCreation;
};