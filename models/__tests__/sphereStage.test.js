// models/__tests__/sphereStage.test.js
const { testLogger: log } = require('../../utils/logger');
const db = require('../../models');

describe('Sphere Stage Calculation Tests', () => {
    let testUser;

    beforeAll(async () => {
        try {
            await db.sequelize.sync({ force: true });
            testUser = await db.User.create({
                username: 'test_user',
                email: 'test@example.com',
                password: 'password123'
            });
        } catch (error) {
            log('Error in setup:', error);
            throw error;
        }
    });

    describe('Basic Color Stage Rules', () => {
        it('should set correct stages for basic colored spheres', async () => {
            const testCases = [
                { color: 'red', expectedStage: 1 },
                { color: 'blue', expectedStage: 1 },
                { color: 'yellow', expectedStage: 2 },
                { color: 'green', expectedStage: 3 },
                { color: 'purple', expectedStage: 4 },
                { color: 'orange', expectedStage: 5 }
            ];

            for (const testCase of testCases) {
                const sphere = await db.Sphere.createSphere({
                    backgroundColor: testCase.color,
                    primeValue: 2 // Value doesn't matter for this test
                }, testUser.id);

                expect(sphere.stage).toBe(testCase.expectedStage);
                log(`${testCase.color} sphere stage: ${sphere.stage}`);
            }
        });

        it('should default white and black spheres to stage 1', async () => {
            const whiteSphere = await db.Sphere.createSphere({
                backgroundColor: 'white'
            }, testUser.id);
            expect(whiteSphere.stage).toBe(1);

            const blackSphere = await db.Sphere.createSphere({
                backgroundColor: 'black'
            }, testUser.id);
            expect(blackSphere.stage).toBe(1);
        });
    });

    describe('Stage 12 - Black Sphere Addends', () => {
        it('should set stage 12 for black spheres with contents', async () => {
            const blackSphere = await db.Sphere.createSphere({
                backgroundColor: 'black',
                containedSpheres: [
                    { backgroundColor: 'white' },
                    { backgroundColor: 'white' }
                ]
            }, testUser.id);

            expect(blackSphere.stage).toBe(12);
        });

        it('should maintain stage 1 for empty black spheres', async () => {
            const blackSphere = await db.Sphere.createSphere({
                backgroundColor: 'black'
            }, testUser.id);

            expect(blackSphere.stage).toBe(1);
        });
    });

    describe('Stage 13 - Exponential Calculations', () => {
        it('should set stage 13 for colored spheres with contents', async () => {
            const redSphere = await db.Sphere.createSphere({
                backgroundColor: 'red',
                primeValue: 2,
                containedSpheres: [
                    { backgroundColor: 'white' }
                ]
            }, testUser.id);

            expect(redSphere.stage).toBe(13);
        });

        it('should maintain normal stage for colored spheres without contents', async () => {
            const redSphere = await db.Sphere.createSphere({
                backgroundColor: 'red',
                primeValue: 2
            }, testUser.id);

            expect(redSphere.stage).toBe(1);
        });
    });

    describe('White Sphere Value-Based Stages', () => {
        it('should set stage based on multiplication results', async () => {
            const whiteSphere = await db.Sphere.createSphere({
                backgroundColor: 'white',
                containedSpheres: [
                    {
                        backgroundColor: 'red',
                        primeValue: 2
                    },
                    {
                        backgroundColor: 'blue',
                        primeValue: 5
                    }
                ]
            }, testUser.id);

            // Value will be 10 (2 * 5), which should be stage 1
            expect(whiteSphere.stage).toBe(1);

            const largeWhiteSphere = await db.Sphere.createSphere({
                backgroundColor: 'white',
                containedSpheres: [
                    {
                        backgroundColor: 'yellow',
                        primeValue: 11
                    },
                    {
                        backgroundColor: 'blue',
                        primeValue: 5
                    }
                ]
            }, testUser.id);

            // Value will be 55 (11 * 5), which should be stage 1
            expect(largeWhiteSphere.stage).toBe(1);

            const hugeWhiteSphere = await db.Sphere.createSphere({
                backgroundColor: 'white',
                containedSpheres: [
                    {
                        backgroundColor: 'red',
                        primeValue: 2
                    },
                    {
                        backgroundColor: 'green',
                        primeValue: 3
                    },
                    {
                        backgroundColor: 'blue',
                        primeValue: 5
                    }
                ]
            }, testUser.id);

            // Value will be 30 (2 * 3 * 5), which should be stage 1
            expect(hugeWhiteSphere.stage).toBe(1);
        });
    });

    describe('Complex Configurations', () => {
        it('should handle nested configurations with correct stages', async () => {
            const complexSphere = await db.Sphere.createSphere({
                backgroundColor: 'black',
                containedSpheres: [
                    {
                        backgroundColor: 'white',
                        containedSpheres: [
                            {
                                backgroundColor: 'red',
                                primeValue: 2,
                                containedSpheres: [
                                    { backgroundColor: 'white' }
                                ]
                            }
                        ]
                    }
                ]
            }, testUser.id);

            // Black sphere with contents = stage 12
            expect(complexSphere.stage).toBe(12);

            // Find the red sphere within the configuration
            const containedWhite = (await complexSphere.getContainedSpheres())[0];
            const containedRed = (await containedWhite.getContainedSpheres())[0];
            
            // Red sphere with contents = stage 13
            expect(containedRed.stage).toBe(13);
        });
    });

    afterAll(async () => {
        await db.sequelize.close();
        log.close();
    });
});