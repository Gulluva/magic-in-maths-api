// models/sphere.js
'use strict';

const crypto = require('crypto');
const { modelLogger: log } = require('../utils/logger');
const { getRequiredStageForColor, getRequiredStageForValue } = require('../utils/stageCalculation');


module.exports = (sequelize, DataTypes) => {

const primeColors = {
    2: 'red',
    3: 'green',
    5: 'blue',
    7: 'purple',
    11: 'yellow',
    13: 'orange',
    17: 'pink',
    19: 'brown',
    23: 'gold', 
    29: 'silver',
    31: 'bronze'
};

const generateConfigHash = async (sphere) => {
    const containedSpheres = await sphere.getContainedSpheres({
        include: [{
            model: sequelize.models.Sphere,
            as: 'ContainedSpheres',
            recursive: true
        }]
    });

    // Helper function to get configuration without IDs or timestamps
    const getConfigObject = (s) => {
        // Only include properties that define the sphere's logical structure
        const config = {
            color: s.backgroundColor,
            primeValue: s.primeValue || null
        };

        // If there are contained spheres, add them (sorted to ensure consistency)
        if (s.ContainedSpheres && s.ContainedSpheres.length > 0) {
            config.contained = s.ContainedSpheres
                .map(getConfigObject)
                // Sort by color and then by primeValue to ensure consistent ordering
                .sort((a, b) => {
                    if (a.color !== b.color) return a.color.localeCompare(b.color);
                    return (a.primeValue || 0) - (b.primeValue || 0);
                });
        }

        return config;
    };

    // Create configuration object
    const config = getConfigObject({
        backgroundColor: sphere.backgroundColor,
        primeValue: sphere.primeValue,
        ContainedSpheres: containedSpheres
    });

    // Create deterministic string representation
    const configString = JSON.stringify(config, Object.keys(config).sort());

    log(`Generating hash for configuration: ${configString}`);

    // Generate hash
    return crypto.createHash('sha256')
        .update(configString)
        .digest('hex');
};

// Add test for hash consistency
const verifyConfigHash = async (sphere1, sphere2) => {
    const hash1 = await generateConfigHash(sphere1);
    const hash2 = await generateConfigHash(sphere2);
    
    if (hash1 !== hash2) {
        log('Hash mismatch:');
        log('Sphere 1 config:', await getConfigObject(sphere1));
        log('Sphere 2 config:', await getConfigObject(sphere2));
        log(`Hash 1: ${hash1}`);
        log(`Hash 2: ${hash2}`);
    }
    
    return hash1 === hash2;
};

const Sphere = sequelize.define('Sphere', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    backgroundColor: {
        type: DataTypes.ENUM('black', 'white', ...Object.values(primeColors)),
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    value: {
        type: DataTypes.VIRTUAL,
        async get() {
            log(`\nCalculating value for sphere ${this.id} (${this.backgroundColor})`);

            try{
                const containedSpheres = await this.getContainedSpheres();
                log(`Found ${containedSpheres?.length || 0} contained spheres`);

                    // Default values for empty spheres:
                    if (!containedSpheres || containedSpheres.length === 0) {
                        log('No contained spheres, returning default value');

                    if (this.backgroundColor !== 'black' && this.backgroundColor !== 'white') {
                        log(`Colored sphere with prime value: ${this.primeValue}`);
                        return  Number(this.primeValue);
                    }  //Coloured disk                  
                    
                    if (this.backgroundColor === 'black') {
                        log('Black sphere default: 0');
                        return 0;
                    } // Additive identity

                    if (this.backgroundColor === 'white'){
                        log('White sphere default: 1');
                        return 1; 
                    }// Multiplicative identity


                    log('No specific default, returning 0');
                    return 0;
                    
                }

                        // Need to await the values of contained spheres
                log('Getting values of contained spheres...');
                    const containedValues = await Promise.all(
                        containedSpheres.map(async (sphere) => {
                            const val = await sphere.get('value');
                            log(`Contained sphere ${sphere.id} (${sphere.backgroundColor}) value: ${val}`);
                            return Number(val);
                    })
                );
            log('Contained sphere values:', containedValues);

            // Calculate value based on contained spheres:
                // For colored spheres (prime numbers)
            if (this.backgroundColor !== 'black' && this.backgroundColor !== 'white') {
                const base = Number(this.primeValue);
                const exponent = containedValues.reduce((sum, val) => sum + val, 0);
                const result = Math.pow(base, exponent);
                log(`Colored sphere calculation: Base ${base} ^ Exponent ${exponent} = ${result}`);
                return result;
            }
        

            if (this.backgroundColor === 'black') {
                const sum =  containedValues.reduce((acc, val) => acc + (Number(val) || 0), 0);
                 log(`Black sphere sum calculation: ${containedValues.join(' + ')} = ${sum}`);
                return sum;
            } 
            
            if (this.backgroundColor === 'white') {
                if (containedValues.some(val => val === 0)) {
                     log('White sphere containing a zero value, returning 0');
                    return 0; // If a white sphere contains a black sphere (value 0), the total value is 0
                }                
                const product =  containedValues.reduce((acc, val) => acc * (Number(val) || 1), 1);
                 log(`White sphere multiplication: ${containedValues.join(' * ')} = ${product}`);
                return product;
            }

            const exponent = containedValues.reduce((sum, sphere) => sum + sphere.value, 0);
            const result =  Math.pow(parseInt(primeValue), exponent);
                log(`Prime calculation: ${primeValue}^${exponent} = ${result}`);

            return result;
        
            } catch (error) {
                log('Error calculating value:', error);
                return 0;
            }
        }   
    },
    parentId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Null if it's a top-level sphere
    },
    primeValue: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    stage: {  // Changed from level to stage
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1,
            max: 11
        }
    }, 
    createdBy: {
        type: DataTypes.INTEGER,  // userId
        allowNull: true
    },
    configHash: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: true,
    hooks: {
        beforeValidate: async (sphere) => {
            log(`Starting validation for sphere ${sphere.id} (${sphere.backgroundColor})`);
    
            // Stage calculation logic...
            // First calculate stage based on color
            let requiredStage = 1;  // Default
                
            // Check for exponential calculations (colored spheres with contents)
            if (sphere.backgroundColor !== 'black' && sphere.backgroundColor !== 'white') {
                const containedSpheres = await sphere.getContainedSpheres();
                if (containedSpheres && containedSpheres.length > 0) {
                    log('Colored sphere contains spheres - setting stage to 13 for exponential calculation');
                    requiredStage = 13;
                } else {
                    requiredStage = getRequiredStageForColor(sphere.backgroundColor);
                    log(`Required stage for color ${sphere.backgroundColor}: ${requiredStage}`);
                }
            }
            // Check for black sphere addends
            else if (sphere.backgroundColor === 'black') {
                const containedSpheres = await sphere.getContainedSpheres();
                if (containedSpheres && containedSpheres.length > 0) {
                    log('Black sphere with contents - setting stage to 12');
                    requiredStage = 12;
                }
            }
            // For white spheres, calculate based on value
            else if (sphere.backgroundColor === 'white') {
                const value = await sphere.get('value');
                const valueStage = getRequiredStageForValue(Math.abs(value));
                log(`Required stage for value ${value}: ${valueStage}`);
                requiredStage = Math.max(requiredStage, valueStage);
            }

            // Update stage to required minimum regardless of what was set
            sphere.stage = Math.max(sphere.stage || 1, requiredStage);
            log(`Final stage set to: ${sphere.stage}`);
            
            // Check for circular references
            if (sphere.parentId) {
                let currentParent = await sphere.getParent();
                const parentIds = new Set([sphere.id]);
                
                while (currentParent) {
                    if (parentIds.has(currentParent.id)) {
                        log('Validation failed: Circular reference detected');
                        throw new Error('Circular reference detected in sphere hierarchy');
                    }
                    parentIds.add(currentParent.id);
                    currentParent = await currentParent.getParent();
                }
            }
        },
        beforeUpdate: async (sphere) => {
            // If parentId is being changed, check for circular references
            if (sphere.changed('parentId')) {
                let currentParent = await Sphere.findByPk(sphere.parentId);
                const parentIds = new Set([sphere.id]);
                
                while (currentParent) {
                    if (parentIds.has(currentParent.id)) {
                        log('Validation failed: Circular reference detected in update');
                        throw new Error('Circular reference detected in sphere hierarchy');
                    }
                    parentIds.add(currentParent.id);
                    currentParent = await currentParent.getParent();
                }
            }
        },
    
            beforeSave: async (sphere) => {
            // Generate and set configHash
            sphere.configHash = await generateConfigHash(sphere);
            
            // Validate parent-child relationships
            const parent = await sphere.getParent();
            if (parent) {
                if (parent.backgroundColor === 'black' && !['white', 'black'].includes(sphere.backgroundColor)) {
                    log('Validation failed: Black spheres can only contain white or black spheres');
                    throw new Error('Black spheres can only contain white or black spheres');
                }
            }
        },
        afterCreate: async (sphere, options) => {
            try {
                const parent = await sphere.getParent();
                if (parent) {
                    await parent.reload({ include: [{ model: sequelize.models.Sphere, as: 'ContainedSpheres' }] });
                    parent.changed('value', true);
                    await parent.save();
                }

                // Create addend if this is a valid configuration
                const value = await sphere.get('value');
                if (value !== null && value !== undefined) {
                    // Determine addend type based on sphere configuration
                    let addendType;
                    if (sphere.backgroundColor === 'black') {
                        addendType = 'black';
                    } else {
                        addendType = 'simple';  // for white spheres and basic colored spheres
                    }

                    const [addend] = await sequelize.models.Addend.findOrCreate({
                        where: { value },
                        defaults: {
                            minStage: sphere.stage,
                            addendType: addendType,
                            configHash: sphere.configHash  // Reference the configuration, not the specific sphere
                        }
                    });
    
                    await addend.addSourceSphere(sphere);
                }
            } catch (error) {
                log('Error in afterCreate hook:', error);
                throw error;
            }
            
        },
        afterDestroy: async (sphere, options) => {
            const parent = await sphere.getParent();
            if (parent) {
                await parent.reload({ include: [{ model: sequelize.models.Sphere, as: 'ContainedSpheres' }] });
                parent.changed('value', true);
                await parent.save();
            }
        }
    }
});

// Static method to create new spheres
Sphere.createSphere = async function(config, userId) {
    // Set an initial hash using just the basic properties
    const initialHash = crypto.createHash('sha256')
                        .update(JSON.stringify({
                            color: config.backgroundColor,
                            primeValue: config.primeValue || null
                        }))
                        .digest('hex');

    // Create the new sphere with initial hash
    const sphere = await Sphere.create({
        ...config,
        configHash: initialHash,
        createdBy: userId
    });

    // Add contents if any
    if (config.containedSpheres) {
        for (const childConfig of config.containedSpheres) {
            const childSphere = await this.createSphere(childConfig, userId);
            await childSphere.setParent(sphere);
        }
        
        // After all children are added, update the hash
        const finalHash = await generateConfigHash(sphere);
        await sphere.update({ configHash: finalHash });
    }

    return sphere;
};


    // Instance method to find equivalent configurations
    Sphere.prototype.findEquivalentConfigs = async function() {
        return await Sphere.findAll({
            where: { configHash: this.configHash },
            include: [{
                model: sequelize.models.User,
                as: 'Creator',
                attributes: ['id', 'username']
            }]
        });
    };

// Static methods for analytics
Sphere.getMostPopularConfigs = async function(limit = 10) {
    return await this.findAll({
        attributes: [
            'configHash',
            [sequelize.fn('COUNT', 'id'), 'useCount'],
            [sequelize.fn('MIN', 'createdAt'), 'firstCreated']
        ],
        include: [{
            model: sequelize.models.User,
            as: 'Creator',
            attributes: ['username']
        }],
        group: ['configHash', 'Creator.id', 'Creator.username'],
        order: [[sequelize.fn('COUNT', 'id'), 'DESC']],
        limit
    });
};

Sphere.getCreatorStats = async function(userId) {
    const stats = await this.findAll({
        attributes: [
            [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('configHash'))), 'uniqueConfigs'],
            [sequelize.fn('COUNT', 'id'), 'totalSpheres']
        ],
        where: { createdBy: userId }
    });

    return {
        uniqueConfigs: parseInt(stats[0].getDataValue('uniqueConfigs')),
        totalSpheres: parseInt(stats[0].getDataValue('totalSpheres'))
    };
};

    // Define associations
    Sphere.associate = (models) => {
        Sphere.hasMany(models.Sphere, { as: 'ContainedSpheres', foreignKey: 'parentId' });
        Sphere.belongsTo(models.Sphere, { as: 'Parent', foreignKey: 'parentId' });
        Sphere.belongsTo(models.User, { as: 'Creator', foreignKey: 'createdBy' });
    };


return Sphere;

};