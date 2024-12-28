// models/__tests__/sphereConfigurations.test.js
const { testLogger: log } = require('../../utils/logger');
const db = require('../../models');

describe('Sphere Configuration Tests', () => {
    let testUser;

    beforeAll(async () => {
        try {
            log('Starting sphere configuration tests');
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

    describe('Basic Configurations', () => {
        it('should handle simple colored spheres', async () => {
            const redSphere = await db.Sphere.findOrCreateConfig({
                backgroundColor: 'red',
                primeValue: 2
            }, testUser.id);

            expect(redSphere.stage).toBe(1);
            expect(await redSphere.get('value')).toBe(2);
        });

        it('should create equivalent configurations only once', async () => {
            // Create first sphere
            const config = {
                backgroundColor: 'white',
                containedSpheres: [{
                    backgroundColor: 'red',
                    primeValue: 2
                }]
            };

            const sphere1 = await db.Sphere.findOrCreateConfig(config, testUser.id);
            const sphere2 = await db.Sphere.findOrCreateConfig(config, testUser.id);

            expect(sphere1.id).toBe(sphere2.id);
        });
    });

    describe('Sphere Simplification', () => {
        it('should simplify nested white spheres', async () => {
            const config = {
                backgroundColor: 'white',
                containedSpheres: [{
                    backgroundColor: 'white',
                    containedSpheres: [{
                        backgroundColor: 'red',
                        primeValue: 2
                    }]
                }]
            };

            const sphere = await db.Sphere.findOrCreateConfig(config, testUser.id);
            const containedSpheres = await sphere.getContainedSpheres();
            
            // Should have simplified to a single red sphere inside white
            expect(containedSpheres.length).toBe(1);
            expect(containedSpheres[0].backgroundColor).toBe('red');
        });

        it('should simplify nested black spheres', async () => {
            const config = {
                backgroundColor: 'black',
                containedSpheres: [{
                    backgroundColor: 'black',
                    containedSpheres: [{
                        backgroundColor: 'white'
                    }, {
                        backgroundColor: 'white'
                    }]
                }]
            };

            const sphere = await db.Sphere.findOrCreateConfig(config, testUser.id);
            const containedSpheres = await sphere.getContainedSpheres();

            // Should have simplified to just two white spheres inside black
            expect(containedSpheres.length).toBe(2);
            expect(containedSpheres.every(s => s.backgroundColor === 'white')).toBe(true);
        });
    });

    describe('Complex Value Calculations', () => {
        it('should calculate nested multiplication correctly', async () => {
            const config = {
                backgroundColor: 'white',
                containedSpheres: [{
                    backgroundColor: 'red',
                    primeValue: 2
                }, {
                    backgroundColor: 'white',
                    containedSpheres: [{
                        backgroundColor: 'green',
                        primeValue: 3
                    }]
                }]
            };

            const sphere = await db.Sphere.findOrCreateConfig(config, testUser.id);
            expect(await sphere.get('value')).toBe(6); // 2 * 3
        });

        it('should calculate mixed operations correctly', async () => {
            const config = {
                backgroundColor: 'black',
                containedSpheres: [{
                    backgroundColor: 'white',
                    containedSpheres: [{
                        backgroundColor: 'red',
                        primeValue: 2
                    }]
                }, {
                    backgroundColor: 'white',
                    containedSpheres: [{
                        backgroundColor: 'green',
                        primeValue: 3
                    }]
                }]
            };

            const sphere = await db.Sphere.findOrCreateConfig(config, testUser.id);
            expect(await sphere.get('value')).toBe(5); // 2 + 3
        });
    });

    describe('Invalid Configurations', () => {
        it('should reject colored spheres in black spheres', async () => {
            const config = {
                backgroundColor: 'black',
                containedSpheres: [{
                    backgroundColor: 'red',
                    primeValue: 2
                }]
            };

            await expect(
                db.Sphere.findOrCreateConfig(config, testUser.id)
            ).rejects.toThrow('Black spheres can only contain white or black spheres');
        });

        it('should prevent circular references', async () => {
            // This would require modifying an existing sphere to create a circle
            const sphere1 = await db.Sphere.findOrCreateConfig({
                backgroundColor: 'white'
            }, testUser.id);

            const sphere2 = await db.Sphere.findOrCreateConfig({
                backgroundColor: 'white',
                parentId: sphere1.id
            }, testUser.id);

            await expect(
                sphere1.update({ parentId: sphere2.id })
            ).rejects.toThrow('Circular reference detected');
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