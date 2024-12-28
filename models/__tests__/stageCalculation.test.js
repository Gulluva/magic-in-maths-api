// models/__tests__/stageCalculation.test.js

const {
    calculateMaxValueForStage,
    getRequiredStageForValue,
    getRequiredStageForColor,
    calculateSumStage
} = require('../../utils/stageCalculation');
const db = require('../../models');
const { testLogger: log } = require('../../utils/logger');

describe('Stage Calculation Tests', () => {
    beforeAll(async () => {
        log('Starting Stage Calculation Tests');
        await db.sequelize.sync({ force: true });
    });

    describe('calculateMaxValueForStage', () => {
        it('should return 100 for stages 1-5', () => {
            for (let stage = 1; stage <= 5; stage++) {
                const maxValue = calculateMaxValueForStage(stage);
                log(`Stage ${stage} max value: ${maxValue}`);
                expect(maxValue).toBe(100);
            }
        });

        it('should return 200 for stage 6', () => {
            const maxValue = calculateMaxValueForStage(6);
            log(`Stage 6 max value: ${maxValue}`);
            expect(maxValue).toBe(200);
        });

        it('should increase by 200 for each stage after 6', () => {
            const testStages = [7, 8, 9];
            testStages.forEach(stage => {
                const maxValue = calculateMaxValueForStage(stage);
                log(`Stage ${stage} max value: ${maxValue}`);
                expect(maxValue).toBe(200 + (stage - 6) * 200);
            });
        });

        it('should cap at 1000', () => {
            const stage10Value = calculateMaxValueForStage(10);
            const stage11Value = calculateMaxValueForStage(11);
            log('Stage 10 max value:', stage10Value);
            log('Stage 11 max value:', stage11Value);
            expect(stage10Value).toBe(1000);
            expect(stage11Value).toBe(1000);
        });
    });

    describe('getRequiredStageForValue', () => {
        it('should return stage 1 for values <= 100', () => {
            const testValues = [50, 100];
            testValues.forEach(value => {
                const stage = getRequiredStageForValue(value);
                log(`Required stage for value ${value}: ${stage}`);
                expect(stage).toBe(1);
            });
        });

        it('should return stage 6 for values <= 200', () => {
            const testValues = [150, 200];
            testValues.forEach(value => {
                const stage = getRequiredStageForValue(value);
                log(`Required stage for value ${value}: ${stage}`);
                expect(stage).toBe(6);
            });
        });

        it('should calculate correct stage for values > 200', () => {
            const testCases = [
                { value: 350, expectedStage: 7 },
                { value: 550, expectedStage: 8 },
                { value: 950, expectedStage: 10 }
            ];
            
            testCases.forEach(({ value, expectedStage }) => {
                const stage = getRequiredStageForValue(value);
                log(`Required stage for value ${value}: ${stage}`);
                expect(stage).toBe(expectedStage);
            });
        });

        it('should allow maximum value of 1000', () => {
            const stage = getRequiredStageForValue(1000);
            log('Required stage for value 1000:', stage);
            expect(stage).toBe(10);
        });
    });

    describe('getRequiredStageForColor', () => {
        it('should return correct stage for each color', () => {
            const testCases = [
                { color: 'red', expectedStage: 1 },
                { color: 'blue', expectedStage: 1 },
                { color: 'yellow', expectedStage: 2 },
                { color: 'green', expectedStage: 3 },
                { color: 'bronze', expectedStage: 11 }
            ];
            
            testCases.forEach(({ color, expectedStage }) => {
                const stage = getRequiredStageForColor(color);
                log(`Required stage for color ${color}: ${stage}`);
                expect(stage).toBe(expectedStage);
            });
        });

        it('should throw error for invalid color', () => {
            log('Testing invalid color handling');
            expect(() => getRequiredStageForColor('invalid'))
                .toThrow('Invalid color');
        });
    });

    describe('calculateSumStage', () => {
        it('should calculate stage based only on addends', () => {
            const sum = {
                addends: [50, 40],
                result: 90  // High result shouldn't affect stage
            };
            const stage = calculateSumStage(sum);
            log('Testing sum with small addends:', { sum, stage });
            expect(stage).toBe(1);
        });

        it('should use highest required stage from addends', () => {
            const sum = {
                addends: [150, 40],  // Stage 6 required for 150
                result: 190
            };
            const stage = calculateSumStage(sum);
            log('Testing sum with mixed addends:', { sum, stage });
            expect(stage).toBe(6);
        });

        it('should handle negative addends', () => {
            const sum = {
                addends: [-250, 300], // Stage 7 required for 300
                result: 50
            };
            const stage = calculateSumStage(sum);
            log('Testing sum with negative addends:', { sum, stage });
            expect(stage).toBe(7);
        });

        it('should validate maximum addend of 1000', () => {
            const sum = {
                addends: [1000, 9],
                result: 1009
            };
            const stage = calculateSumStage(sum);
            log('Testing sum with maximum addend:', { sum, stage });
            expect(stage).toBe(10);
        });
    });

    afterAll(async () => {
        try {
            // Close database connection
            await db.sequelize.close();
            log('Database connection closed');
            
            // Close logger
            log.close();
        } catch (error) {
            console.error('Error during cleanup:', error);
            throw error;
        }
    });
});