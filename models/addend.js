// models/addend.js
'use strict';

const { modelLogger: log } = require('../utils/logger');
const { getRequiredStageForValue } = require('../utils/stageCalculation');

module.exports = (sequelize, DataTypes) => {
    const Addend = sequelize.define('Addend', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        value: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                max: 1009 // Maximum possible value
            }
        },
        addendType: {
            type: DataTypes.ENUM('simple', 'black', 'compound'),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        stage: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1,
                max: 13
            }
        },
        sphereId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Spheres',
                key: 'configHash'
            }
        }
    }, {
        hooks: {
            beforeValidate: async (addend) => {
                log(`Validating addend: value=${addend.value}, type=${addend.addendType}`);
                
                // Calculate stage based on type
                if (addend.addendType === 'black') {
                    addend.stage = 12;
                    log('Set stage to 12 for black sphere addend');
                } else if (addend.addendType === 'compound') {
                    addend.stage = 13;
                    log('Set stage to 13 for compound colored sphere');
                } else {
                    // For simple addends, use the original stage calculation
                    const requiredStage = getRequiredStageForValue(Math.abs(addend.value));
                    addend.stage = requiredStage;
                    log(`Set stage to ${requiredStage} for simple addend`);
                }
            },
            afterCreate: async (addend, options) => {
                log(`Created new addend: ${JSON.stringify(addend.toJSON())}`);
                await generatePrimeSums(addend, options.transaction);
            }
        }
    });

    // Function to generate prime sums using this addend
    const generatePrimeSums = async (newAddend, transaction) => {
        try {
            log(`Generating prime sums for addend: ${newAddend.value}`);
            
            // Get existing addends
            const existingAddends = await Addend.findAll({
                where: {
                    id: { [sequelize.Op.ne]: newAddend.id }
                }
            });
            
            // Generate combinations (up to 4 addends)
            const combinations = [];
            combinations.push([newAddend.value]); // Single addend

            // Add combinations with existing addends
            for (let i = 1; i <= 3; i++) { // Max 3 additional addends
                generateCombinations(
                    existingAddends.map(a => a.value),
                    i,
                    [newAddend.value],
                    combinations
                );
            }

            log(`Generated ${combinations.length} possible combinations`);

            // Create sums for prime combinations
            for (const addends of combinations) {
                const sum = addends.reduce((a, b) => a + b, 0);
                if (sum <= 1009 && isPrime(sum)) {
                    log(`Creating prime sum for addends: [${addends.join(', ')}] = ${sum}`);
                    
                    // Calculate minimum stage
                    let minStage = Math.max(
                        ...addends.map(value => 
                            getRequiredStageForValue(Math.abs(value))
                        )
                    );

                    // Increase stage for sums with more than 2 addends
                    if (addends.length > 2) {
                        minStage = Math.max(minStage, 10);
                        log(`Increased stage to ${minStage} due to multiple addends`);
                    }

                    await sequelize.models.Sum.create({
                        addends: addends,
                        isPrime: true,
                        stage: minStage
                    }, { transaction });
                }
            }
        } catch (error) {
            log('Error generating prime sums:', error);
            throw error;
        }
    };

    // Helper function to generate combinations
    const generateCombinations = (arr, len, current, result) => {
        if (len === 0) {
            result.push([...current]);
            return;
        }
        for (let i = 0; i < arr.length; i++) {
            current.push(arr[i]);
            generateCombinations(arr.slice(i + 1), len - 1, current, result);
            current.pop();
        }
    };

    // Define relationships
    Addend.associate = (models) => {
        Addend.belongsToMany(models.Sphere, { 
            through: 'AddendSources',
            as: 'SourceSpheres'
        });
    };

    return Addend;
};