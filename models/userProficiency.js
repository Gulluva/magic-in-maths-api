// models/userProficiency.js
'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../models');
const User = require('./user');
const SpellCategory = require('./spellCategory');



const UserProficiency = sequelize.define('UserProficiency', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
    },
    spellCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: SpellCategory,
            key: 'id',
        },
    },
    experience: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    lastPracticedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    level: {
        type: DataTypes.VIRTUAL,
        get() {
            const currentExperience = this.getDataValue('experience');
            const lastPracticedAt = this.getDataValue('lastPracticedAt');
            const minExperience = this.minExperience;

            // Apply decay if lastPracticedAt is set
            const experienceAfterDecay = lastPracticedAt
                ? calculateExperienceDecay(currentExperience, lastPracticedAt, minExperience)
                : currentExperience;

            // Find the highest level for which the experience is greater than or equal to the threshold
            let calculatedLevel = 1;
            for (const level in levelExperienceThresholds) {
                const threshold = levelExperienceThresholds[level];
                if (experienceAfterDecay >= threshold) {
                    calculatedLevel = Math.max(calculatedLevel, parseInt(level, 10));
                }
            }

            return calculatedLevel;
        },
        set(value) {
            throw new Error('Do not try to set the `level` value!');
        },
    },
    minExperience: {
        type: DataTypes.VIRTUAL,
        get() {
            const currentLevel = this.level; // Get the calculated level
            return levelExperienceThresholds[currentLevel] || 0; // Return the minimum experience for that level or 0 if not found
        },
    },
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['userId', 'spellCategoryId'],
        },
    ],
});

const levelExperienceThresholds = {
    1: 0,
    2: 100,
    3: 400,
    4: 900,
    5: 1600,
    6: 2500,
    7: 3600,
    8: 4900,
    9: 6400,
    10: 8100,
    11: 10000,
    12: 12100,
    13: 14400,
    14: 16900,
    15: 19600,
    16: 22500,
    17: 25600,
    18: 28900,
    19: 32400,
    20: 36100,
    21: 40000,
    22: 44100,
    23: 48400,
    24: 52900,
    25: 57600,
    26: 62500,
    27: 67600,
    28: 72900,
    29: 78400,
    30: 84100,
    31: 90000,
    32: 96100,
    33: 102400,
    34: 108900,
    35: 115600,
    36: 122500,
    37: 129600,
    38: 136900,
    39: 144400,
    40: 152100,
    41: 160000,
    42: 168100,
    43: 176400,
    44: 184900,
    45: 193600
};

function calculateExperienceDecay(currentExperience, lastPracticedAt, minExp) {
  const now = new Date();
  const daysSinceLastPractice = ((now - 1000 * 60 * 60 * 24) - lastPracticedAt) / (1000 * 60 * 60 * 24);
  if (daysSinceLastPractice > 0) {
      const decayRate = 0.1; // 10% decay per day
      const decayedExperience = (currentExperience - minExp) * Math.pow(1 - decayRate, daysSinceLastPractice) + minExp;
      return Math.max(0, Math.floor(decayedExperience));
  }
  return currentExperience;
}

// Define relationships:
UserProficiency.associate = (models) => {
  UserProficiency.belongsTo(models.User, { foreignKey: 'userId' });
  UserProficiency.belongsTo(models.SpellCategory, { foreignKey: 'spellCategoryId' });
};


module.exports = UserProficiency;