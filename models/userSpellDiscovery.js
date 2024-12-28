// models/userSpellDiscovery.js
'use strict';

const { modelLogger: log } = require('../utils/logger');

module.exports = (sequelize, DataTypes) => {
    const UserSpellDiscovery = sequelize.define('UserSpellDiscovery', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        spellId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        discoveryState: {
            type: DataTypes.ENUM('encountered', 'practiced', 'mastered'),
            allowNull: false,
            defaultValue: 'encountered',
            comment: 'encountered = seen in training, practiced = attempted configuration, mastered = successfully used'
        },
        firstEncounteredAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        firstPracticedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        masteredAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        practiceAttempts: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        successfulAttempts: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        lastPracticedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        knownValue: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether the spell value has been revealed through practice'
        }
    }, {
        indexes: [
            {
                unique: true,
                fields: ['userId', 'spellId']
            },
            {
                fields: ['discoveryState']
            }
        ]
    });

    // Track practice attempt
    UserSpellDiscovery.prototype.recordPracticeAttempt = async function(succeeded) {
        // Update practice counts
        this.practiceAttempts += 1;
        if (succeeded) {
            this.successfulAttempts += 1;
        }
        
        // Update state if needed
        if (this.discoveryState === 'encountered') {
            this.discoveryState = 'practiced';
            this.firstPracticedAt = this.firstPracticedAt || new Date();
        }
        
        if (succeeded && this.discoveryState === 'practiced') {
            this.discoveryState = 'mastered';
            this.masteredAt = new Date();
        }
        
        this.lastPracticedAt = new Date();
        await this.save();
    };

    // Class method for discovery statistics
    UserSpellDiscovery.getDiscoveryStats = async function(filters = {}) {
        const stats = await UserSpellDiscovery.findAll({
            where: filters,
            attributes: [
                'discoveryState',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('AVG', sequelize.col('practiceAttempts')), 'avgAttempts'],
                [sequelize.fn('AVG', 
                    sequelize.literal('CAST(successfulAttempts AS FLOAT) / NULLIF(practiceAttempts, 0)')), 
                    'successRate']
            ],
            group: ['discoveryState']
        });

        // Get time-to-master stats
        const masterTimeStats = await UserSpellDiscovery.findAll({
            where: { 
                ...filters,
                discoveryState: 'mastered',
                firstEncounteredAt: { [sequelize.Op.ne]: null },
                masteredAt: { [sequelize.Op.ne]: null }
            },
            attributes: [
                [sequelize.fn('AVG', 
                    sequelize.literal("EXTRACT(EPOCH FROM (\"masteredAt\" - \"firstEncounteredAt\")) / 86400")),
                    'avgDaysToMaster']
            ]
        });

        return {
            byState: stats.reduce((acc, stat) => ({
                ...acc,
                [stat.discoveryState]: {
                    count: parseInt(stat.get('count')),
                    avgAttempts: parseFloat(stat.get('avgAttempts')),
                    successRate: parseFloat(stat.get('successRate'))
                }
            }), { encountered: {}, practiced: {}, mastered: {} }),
            avgDaysToMaster: parseFloat(masterTimeStats[0]?.get('avgDaysToMaster') || 0)
        };
    };

    // Define associations
    UserSpellDiscovery.associate = (models) => {
        UserSpellDiscovery.belongsTo(models.User, { foreignKey: 'userId' });
        UserSpellDiscovery.belongsTo(models.Spell, { foreignKey: 'spellId' });
    };

    return UserSpellDiscovery;
};