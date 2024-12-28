// models/__tests__/sphereIntegration.test.js

const { testLogger: log } = require('../../utils/logger');
const db = require('../../models');

describe('Sphere Integration Tests', () => {
    let testUser;

    beforeAll(async () => {
        log('Starting tests');
        await db.sequelize.sync({ force: true });
        // Create test user
        testUser = await db.User.create({
            username: 'test_user',
            email: 'test@example.com',
            password: 'password123'
        });
        log('Created test user:', testUser.id);
    });

    describe('Configuration Management', () => {
        it('should track equivalent configurations', async () => {
            const config = {
                backgroundColor: 'white'
            };
    
            // Create two spheres with same config
            const sphere1 = await db.Sphere.createSphere(config, testUser.id);
            const sphere2 = await db.Sphere.createSphere(config, testUser.id);
    
            // Should have different IDs but same hash
            expect(sphere1.id).not.toBe(sphere2.id);
            expect(sphere1.configHash).toBe(sphere2.configHash);
        });
    
        it('should handle nested configurations', async () => {
            const config = {
                backgroundColor: 'white',
                containedSpheres: [{
                    backgroundColor: 'red',
                    primeValue: 2
                }]
            };
    
            const sphere = await db.Sphere.createSphere(config, testUser.id);
            await sphere.reload({ 
                include: [{ model: db.Sphere, as: 'ContainedSpheres' }] 
            });
            expect(sphere.ContainedSpheres).toHaveLength(1);
        });

        it('should track original creators', async () => {
            const config = {
                backgroundColor: 'black',
                createdBy: testUser.id
            };

            const sphere = await db.Sphere.createSphere(config, testUser.id);
            const creator = await sphere.getCreator();
            expect(creator.id).toBe(testUser.id);
        });
    });

    describe('Addend Integration', () => {
        it('should create addends from valid sphere configurations', async () => {
            // Create a white sphere containing red (value 2)
            const whiteSphere = await db.Sphere.createSphere({
                backgroundColor: 'white',
                createdBy: testUser.id,
                containedSpheres: [{
                    backgroundColor: 'red',
                    primeValue: 2
                }]
            }, testUser.id);

            // Check if addend was created
            const addend = await db.Addend.findOne({
                where: { value: 2 }
            });
            expect(addend).toBeTruthy();
            expect(addend.minStage).toBe(1);

            // Create black sphere with same value
            const blackSphere = await db.Sphere.createSphere({
                backgroundColor: 'black',
                createdBy: testUser.id,
                containedSpheres: [
                    { backgroundColor: 'white' },
                    { backgroundColor: 'white' }
                ]
            }, testUser.id);

            // Check if addend sources were updated
            const sources = await addend.getSources();
            expect(sources).toHaveLength(2);
            expect(sources.some(s => s.sourceType === 'black')).toBe(true);
        });

        it('should handle equivalent configurations for addends', async () => {
            // Create two different sphere configurations that yield the same value
            const config1 = {
                backgroundColor: 'white',
                createdBy: testUser.id,
                containedSpheres: [{
                    backgroundColor: 'red',
                    primeValue: 2
                }]
            };

            const config2 = {
                backgroundColor: 'black',
                createdBy: testUser.id,
                containedSpheres: [
                    { backgroundColor: 'white' },
                    { backgroundColor: 'white' }
                ]
            };

            await db.Sphere.createSphere(config1, testUser.id);
            await db.Sphere.createSphere(config2, testUser.id);

            // Should have one addend with value 2 and two sources
            const addend = await db.Addend.findOne({
                where: { value: 2 },
                include: ['SourceSpheres']
            });

            expect(addend.SourceSpheres).toHaveLength(2);
        });
    });

    describe('Complex Configurations', () => {
        it('should handle deeply nested equivalent configurations', async () => {
            const config1 = {
                backgroundColor: 'white',
                createdBy: testUser.id,
                containedSpheres: [{
                    backgroundColor: 'white',
                    containedSpheres: [{
                        backgroundColor: 'red',
                        primeValue: 2
                    }]
                }]
            };

            const config2 = {
                backgroundColor: 'white',
                createdBy: testUser.id,
                containedSpheres: [{
                    backgroundColor: 'red',
                    primeValue: 2
                }]
            };

            // These should be recognized as equivalent after simplification
            const sphere1 = await db.Sphere.createSphere(config1, testUser.id);
            const sphere2 = await db.Sphere.createSphere(config2, testUser.id);

            expect(sphere1.configHash).toBe(sphere2.configHash);
        });
    });
    // Add test methods for these in the sphereIntegration.test.js file:

    describe('Analytics', () => {
        it('should track popular configurations', async () => {
            // Create some spheres with the same configuration
            const config = {
                backgroundColor: 'white',
                containedSpheres: [{ backgroundColor: 'red', primeValue: 2 }],
                createdBy: testUser.id
            };

            await Promise.all([
                db.Sphere.createSphere(config, testUser.id),
                db.Sphere.createSphere(config, testUser.id),
                db.Sphere.createSphere(config, testUser.id)
            ]);

            const popular = await db.Sphere.getMostPopularConfigs(1);
            expect(popular[0].getDataValue('useCount')).toBe('3');
        });

        it('should track prolific creators', async () => {
            const stats = await db.Sphere.getCreatorStats(testUser.id);
            expect(stats.uniqueConfigs).toBeGreaterThan(0);
        });
    });

    describe('Configuration Hash Tests', () => {
        it('should generate same hash for equivalent configurations', async () => {
            // Create two equivalent configurations in different orders
            const config1 = {
                backgroundColor: 'white',
                containedSpheres: [
                    { backgroundColor: 'red', primeValue: 2 },
                    { backgroundColor: 'blue', primeValue: 5 }
                ]
            };
    
            const config2 = {
                backgroundColor: 'white',
                containedSpheres: [
                    { backgroundColor: 'blue', primeValue: 5 },
                    { backgroundColor: 'red', primeValue: 2 }
                ]
            };
    
            const sphere1 = await db.Sphere.createSphere(config1, testUser.id);
            const sphere2 = await db.Sphere.createSphere(config2, testUser.id);
    
            // Should have different IDs but same hash
            expect(sphere1.id).not.toBe(sphere2.id);
            expect(sphere1.configHash).toBe(sphere2.configHash);
        });
    
        it('should generate different hashes for different configurations', async () => {
            const sphere1 = await db.Sphere.createSphere({
                backgroundColor: 'white',
                containedSpheres: [{ backgroundColor: 'red', primeValue: 2 }]
            }, testUser.id);
    
            const sphere2 = await db.Sphere.createSphere({
                backgroundColor: 'white',
                containedSpheres: [{ backgroundColor: 'blue', primeValue: 5 }]
            }, testUser.id);
    
            expect(sphere1.configHash).not.toBe(sphere2.configHash);
        });
    
        it('should handle deeply nested configurations correctly', async () => {
            const config = {
                backgroundColor: 'white',
                containedSpheres: [{
                    backgroundColor: 'red',
                    containedSpheres: [{
                        backgroundColor: 'white',
                        containedSpheres: [{
                            backgroundColor: 'blue',
                            primeValue: 5
                        }]
                    }]
                }]
            };
    
            const sphere1 = await db.Sphere.createSphere(config, testUser.id);
            const sphere2 = await db.Sphere.createSphere(config, testUser.id);
    
            expect(sphere1.configHash).toBe(sphere2.configHash);
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