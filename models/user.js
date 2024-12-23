//  models/user.js
'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [3, 50],
            is: /^[a-zA-Z0-9_]+$/i,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [8, 255],
        },
        set(value) {
            if (value) {
                const salt = bcrypt.genSaltSync(10);
                const hashedPassword = bcrypt.hashSync(value, salt);
                this.setDataValue('password', hashedPassword);
            }
        },
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    type: {
        type: DataTypes.ENUM('player', 'npc'),
        allowNull: false,
        defaultValue: 'player',
    },
    npcType: {
        type: DataTypes.ENUM('mentor', 'practice', 'quest', 'enemy'),
        allowNull: true,
    },
    currentStage: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 0
        }
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        allowNull: false,
        defaultValue: 'user',
    },
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password') && user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
    },
});

// Define relationships:
User.associate = (models) => {
    User.hasMany(models.UserProficiency, { foreignKey: 'userId' });
};

module.exports = User;