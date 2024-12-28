// models/__tests__/addendCreation.test.js
const { testLogger: log } = require('../../utils/logger');
const db = require('../../models');

describe('Addend Creation Tests', () => {
    let testUser;

    beforeAll(async () => {
        try {
            log('Starting addend creation tests');
            await db.sequelize.sync({ force: true });
            testUser = await db.User.create({
                username: 'test_user',
                email: 'test@example.com',
                password: 'password123'
            });
            log('Created test user:', testUser.id);
        } catch (error) {
            log('Error in setup:', error);
            throw error;
        }
    });

    describe('Black Sphere Addends', () => {
        it('should create addend from valid black sphere', async () => {
            const sphere = await db.Sphere.findOrCreateConfig({
                backgroundColor: 'black',
                containedSpheres: [
                    { backgroundColor: 'white' },
                    { backgroundColor: 'white' }
                ]
            }, testUser.id);

            const addend = await db.Addend.findOne({
                where: { value: 2 }  // 1 + 1 = 2
            });

            expect(addend).toBeTruthy();
            expect(addend.minStage).toBe(12);  // Black sphere addends are stage 12
            
            const sources = await addend.getSources();
            expect(sources.some(s => s.sphereId === sphere.id)).toBe(true);
        });

        it('should not create addend from black sphere with invalid contents', async () => {
            // This should fail to create the sphere
            await expect(db.Sphere.findOrCreateConfig({
                backgroundColor: 'black',
                containedSpheres: [
                    { backgroundColor: 'red', primeValue: 2 }
                ]
            }, testUser.id)).rejects.toThrow();

            // Check no addend was created
            const addends = await db.Addend.findAll();
            expect(addends.every(a => a.value !== 2)).toBe(true);
        });
    });

    describe('White Sphere Addends', () => {
        it('should create addend from white sphere with colored spheres', async () => {
            const sphere = await db.Sphere.findOrCreateConfig({
                backgroundColor: 'white',
                containedSpheres: [
                    { backgroundColor: 'red', primeValue: 2 },
                    { backgroundColor: 'green', primeValue: 3 }
                ]
            }, testUser.id);

            const addend = await db.Addend.findOne({
                where: { value: 6 }  // 2 * 3 = 6
            });

            expect(addend).toBeTruthy();
            expect(addend.minStage).toBe(3);  // Based on green sphere requirement
        });

        it('should not create addend from empty white sphere', async () => {
            await db.Sphere.findOrCreateConfig({
                backgroundColor: 'white'
            }, testUser.id);

            const addends = await db.Addend.findAll();
            expect(addends.every(a => a.value !== 1)).toBe(true);
        });
    });

    describe('Multiple Configurations', () => {
        it('should handle multiple ways to create same value', async () => {
            // First way: white sphere with red (2)
            await db.Sphere.findOrCreateConfig({
                backgroundColor: 'white',
                containedSpheres: [
                    { backgroundColor: 'red', primeValue: 2 }
                ]
            }, testUser.id);

            // Second way: black sphere with two whites (1+1)
            await db.Sphere.findOrCreateConfig({
                backgroundColor: 'black',
                containedSpheres: [
                    { backgroundColor: 'white' },
                    { backgroundColor: 'white' }
                ]
            }, testUser.id);

            // Should have one addend with value 2 but multiple sources
            const addend = await db.Addend.findOne({
                where: { value: 2 }
            });
            
            expect(addend).toBeTruthy();
            const sources = await addend.getSources();
            expect(sources.length).toBe(2);
            
            // minStage should be 1 (from the white/red configuration)
            expect(addend.minStage).toBe(1);
        });
    });

    describe('Addend Updates', () => {
        it('should update addend sources when equivalent configuration is created', async () => {
            const config = {
                backgroundColor: 'white',
                containedSpheres: [
                    { backgroundColor: 'red', primeValue: 2 }
                ]
            };

            // Create same configuration twice
            const sphere1 = await db.Sphere.findOrCreateConfig(config, testUser.id);
            const sphere2 = await db.Sphere.findOrCreateConfig(config, testUser.id);

            // Should have one addend with one source (same sphere)
            const addend = await db.Addend.findOne({
                where: { value: 2 }
            });
            const sources = await addend.getSources();
            expect(sources.length).toBe(1);
            expect(sources[0].sphereId).toBe(sphere1.id);
            expect(sphere1.id).toBe(sphere2.id);
        });

        it('should maintain lowest stage when new configurations are added', async () => {
            // First create high-stage version (black sphere)
            await db.Sphere.findOrCreateConfig({
                backgroundColor: 'black',
                containedSpheres: [
                    { backgroundColor: 'white' },
                    { backgroundColor: 'white' }
                ]
            }, testUser.id);

            const addendBefore = await db.Addend.findOne({
                where: { value: 2 }
            });
            expect(addendBefore.minStage).toBe(12);

            // Then create low-stage version (white/red)
            await db.Sphere.findOrCreateConfig({
                backgroundColor: 'white',
                containedSpheres: [
                    { backgroundColor: 'red', primeValue: 2 }
                ]
            }, testUser.id);

            const addendAfter = await db.Addend.findOne({
                where: { value: 2 }
            });
            expect(addendAfter.minStage).toBe(1);
        });
    });

    afterAll(async () => {
        try {
            await db.sequelize.close();
            log('Database connection closed');
            log.close();
        } catch (error) {
            console.error('Error during cleanup:', error);
            throw error;
        }
    });
});