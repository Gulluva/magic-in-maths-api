//  models/user.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
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
            len: [3, 50], // Example: Enforce username length between 3 and 50 characters
            is: /^[a-zA-Z0-9_]+$/i, // Example: Allow only alphanumeric characters and underscores
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true, // Allow null for NPCs (they won't have passwords)
        validate: {
            len: [8, 255],
            // You could add a validation function to check for password complexity, e.g.:
            // isComplexEnough(value) {
            //   if (!/[a-z]/.test(value)) {
            //     throw new Error('Password must contain at least one lowercase letter');
            //   }
            //   // Add more complexity checks as needed (uppercase, numbers, symbols)
            // }
        },
        set(value) {
            // Hash the password before storing it (only if it's not null)
            if (value) {
                const salt = bcrypt.genSaltSync(10); // You can adjust the salt rounds
                const hashedPassword = bcrypt.hashSync(value, salt);
                this.setDataValue('password', hashedPassword);
            }
        },
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true, // Make email optional (consider making it required for players later)
        unique: true,
        validate: {
            isEmail: true,
        },
    },

    type: {
        type: DataTypes.ENUM('player', 'npc'), // Differentiates between players and NPCs
        allowNull: false,
        defaultValue: 'player',
    },
    npcType: {
        type: DataTypes.ENUM('mentor', 'practice', 'quest', 'enemy'), // Types of NPCs
        allowNull: true, // Only applicable to NPCs
    },
    currentStage: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1
        }
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'), // Possible roles for players (e.g., regular user, administrator)
        allowNull: false,
        defaultValue: 'user',
    },
}, {
    // Other model options go here
    // For example, if you don't want Sequelize to automatically add createdAt and updatedAt timestamps:
    // timestamps: false,
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

module.exports = User;