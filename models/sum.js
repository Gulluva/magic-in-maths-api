// models/sum.js
// This should be populated by spheres that are created.  Everytime a sphere is created, it is added to all other spheres and sums are created whether they be prime or not.  Only prime results create magic
'use strict';
const { calculateMaxValueForStage } = require('../utils/stageCalculation');

const { modelLogger: log } = require('../utils/logger');

const isPrime = (num) => {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;

  for (let i = 5; i * i <= num; i += 6) {
      if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
};

module.exports = (sequelize, DataTypes) => {
    const Sum = sequelize.define('Sum', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        addends: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            allowNull: false,
            defaultValue: [],
            validate: {
              notEmpty: true,
              validSum(value) {
                  const sum = value.reduce((acc, val) => acc + val, 0);
                  if (sum > 1009) {
                    log(`Invalid sum: ${sum} exceeds maximum allowed value of 1009`);
                      throw new Error('Sum cannot exceed 1009');
                  }
                  log(`Valid sum calculation: ${value.join(' + ')} = ${sum}`);
              }
            }
        },
        result: {
            type: DataTypes.VIRTUAL,
            get() {
              const result = this.addends.reduce((sum, num) => sum + num, 0);
              log(`Calculating result for sum ${this.id}: ${this.addends.join(' + ')} = ${result}`);
              return result;
            }
        },
        isPrime: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        stage: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
          validate: {
              min: 1,
              max: 11
          }
        }
    }, {
        timestamps: false,
        hooks: {
          beforeValidate: (sum) => {
              log(`Validating sum with addends: ${sum.addends}`);
              
              // Calculate result
              const result = sum.addends.reduce((acc, val) => acc + val, 0);
              log(`Calculated result: ${result}`);
              
              // Check if prime
              const primeResult = isPrime(result);
              log(`Prime check for ${result}: ${primeResult}`);
              sum.isPrime = primeResult;
              
              // Calculate and validate stage
              const maxValue = Math.max(...sum.addends.map(Math.abs));
              log(`Maximum absolute value in addends: ${maxValue}`);
              
              // Validate maximum values for addends based on stage
              const maxAddendValue = calculateMaxValueForStage(sum.stage);
              log(`Maximum allowed value for stage ${sum.stage}: ${maxAddendValue}`);
              
              if (maxValue > maxAddendValue) {
                  log(`Validation failed: Value ${maxValue} exceeds maximum ${maxAddendValue} for stage ${sum.stage}`);
                  throw new Error(`Value ${maxValue} exceeds maximum allowed for stage ${sum.stage}`);
              }
          }
      }
  });

  Sum.prototype.equals = async function(sphere) {
    try {
        log(`\nStarting comparison of Sum ${this.id} with Sphere ${sphere.id}`);
        log(`Sum addends: [${this.addends.join(', ')}]`);
        
        // Get the contained spheres
        const containedSpheres = await sphere.getContainedSpheres();
        log(`Found ${containedSpheres?.length || 0} contained spheres`);
        
        // If no contained spheres but sum has addends, they're not equal
        if ((!containedSpheres || containedSpheres.length === 0) && this.addends.length > 0) {
            log('Sphere has no contained spheres but sum has addends - not equal');
            return false;
        }

        // Get the values of all contained spheres
        const sphereValues = await Promise.all(
            containedSpheres.map(async (s) => {
                const value = await s.get('value');
                log(`Contained sphere ${s.id} (${s.backgroundColor}) value: ${value}`);
                return value;
            })
        );
        log(`All sphere values: [${sphereValues.join(', ')}]`);

        // Sort both arrays to compare them regardless of order
        const sortedAddends = [...this.addends].sort((a, b) => a - b);
        const sortedSphereValues = sphereValues.sort((a, b) => a - b);
        log('Sorted arrays for comparison:');
        log(`Addends: [${sortedAddends.join(', ')}]`);
        log(`Sphere values: [${sortedSphereValues.join(', ')}]`);

        // Check if arrays have same length
        if (sortedAddends.length !== sortedSphereValues.length) {
            log(`Length mismatch: addends(${sortedAddends.length}) vs spheres(${sortedSphereValues.length})`);
            return false;
        }

        // Compare each value
        const isEqual = sortedAddends.every((val, idx) => {
            const matches = val === sortedSphereValues[idx];
            if (!matches) {
                log(`Mismatch at position ${idx}: ${val} !== ${sortedSphereValues[idx]}`);
            }
            return matches;
        });

        log(`Final comparison result: ${isEqual}`);
        return isEqual;
    } catch (error) {
        log('Error comparing sum to sphere:', error);
        return false;
    }
};


    Sum.associate = (models) => {
        Sum.hasMany(models.Spell, { foreignKey: 'sumId' });
        Sum.hasMany(models.UserSumPractice, { foreignKey: 'SumId' });
    };

    return Sum;
};