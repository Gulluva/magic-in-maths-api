// models/__tests__/Sphere.test.js


const db = require('../../models');     // We still need db for setup/teardown
const { testLogger: log } = require('../../utils/logger');

describe('Sphere Model', () => {
    beforeAll(async () => {
        try {
            // Debug logging
             log('Environment:', process.env.NODE_ENV);
             log('Database Config:', {
                database: db.sequelize.config.database,
                username: db.sequelize.config.username,
                host: db.sequelize.config.host,
                port: db.sequelize.config.port,
                dialect: db.sequelize.config.dialect
            });
            
            await db.sequelize.sync({ force: true });
            testUser = await db.User.create({
                username: 'test_user',
                email: 'test@example.com',
                password: 'password123'
            });
            log('Test database synced');
        } catch (error) {
            log('Error syncing test database:', error);
            log('Detailed error:', error.original || error);
            throw error;
        }
    });

    beforeEach(async () => {
        try {
            // Clear the database before each test
            await db.Sphere.destroy({ where: {} });
        } catch (error) {
            log('Error clearing test database:', error);
            throw error;
        }
    });

    describe('Basic Sphere Creation', () => {
        it('should create a white sphere with default value 1', async () => {
            const sphere = await db.Sphere.createSphere({ backgroundColor: 'white' }, testUser.id);
            expect(sphere).toBeTruthy();
            expect(await sphere.get('value')).toBe(1);
        log('created WhiteSphere', sphere.toJSON());
        });


        it('should create a black sphere with default value 0', async () => {
            const sphere = await db.Sphere.createSphere({ backgroundColor: 'black' }, testUser.id);
            expect(sphere).toBeTruthy();
            expect(await sphere.get('value')).toBe(0);
            log('created Black Sphere', sphere.toJSON());
        });
    });

    describe('Sphere Value Calculations', () => {
        it('should calculate the correct value for a white sphere with contained spheres', async () => {
            // Create parent sphere
            const whiteSphere = await db.Sphere.createSphere({ 
                backgroundColor: 'white', 
                stage: 1
            }, testUser.id);
            log('created WhiteSphere', whiteSphere.toJSON());
            
            // Create child spheres
            const redSphere = await db.Sphere.createSphere({ 
                backgroundColor: 'red', 
                primeValue: 2,
                parentId: whiteSphere.id
            }, testUser.id);
            log('created red Sphere', redSphere.toJSON());

            const greenSphere = await db.Sphere.createSphere({ 
                backgroundColor: 'green', 
                primeValue: 3,
                parentId: whiteSphere.id
            }, testUser.id);
            log('created green Sphere', greenSphere.toJSON());

            // Reload parent with children
            await whiteSphere.reload({ 
                include: [{ model: db.Sphere, as: 'ContainedSpheres' }] 
            });

            // Check contained spheres were loaded correctly
            expect(whiteSphere.ContainedSpheres).toHaveLength(2);
            log('Contained spheres count:', whiteSphere.ContainedSpheres.length);
            
            // Get individual values
            const redValue = await redSphere.get('value');
            const greenValue = await greenSphere.get('value');
            log('Red sphere value:', redValue);
            log('Green sphere value:', greenValue);

            expect(redValue).toBe(2);
            expect(greenValue).toBe(3);

            const whiteValue = await whiteSphere.get('value');
            log('White sphere final value:', whiteValue);
            expect(whiteValue).toBe(6); // 2 * 3
        });

        it('should calculate the correct value for a black sphere with contained spheres', async () => {
            // Create spheres with proper hierarchy
            const blackSphere = await db.Sphere.createSphere({ backgroundColor: 'black' }, testUser.id);
            const whiteSphere1 = await db.Sphere.createSphere({ 
                backgroundColor: 'white',
                parentId: blackSphere.id
            }, testUser.id);
            const whiteSphere2 = await db.Sphere.createSphere({ 
                backgroundColor: 'white',
                parentId: blackSphere.id
            }, testUser.id);
            const redSphere = await db.Sphere.createSphere({ 
                backgroundColor: 'red', 
                primeValue: 2,
                parentId: whiteSphere1.id
            }, testUser.id);

            // Reload parents with children
            await whiteSphere1.reload({ 
                include: [{ model: db.Sphere, as: 'ContainedSpheres' }] 
            });
            await blackSphere.reload({ 
                include: [{ model: db.Sphere, as: 'ContainedSpheres' }] 
            });

            expect(await blackSphere.get('value')).toBe(3); // 1 + 2
        });

        it('should set the value of a white sphere to 0 if it contains a black sphere', async () => {
            const whiteSphere = await db.Sphere.createSphere({ backgroundColor: 'white' }, testUser.id);
            const blackSphere = await db.Sphere.createSphere({ 
                backgroundColor: 'black',
                parentId: whiteSphere.id
            }, testUser.id);

            await whiteSphere.reload({ 
                include: [{ model: db.Sphere, as: 'ContainedSpheres' }] 
            });

            expect(await whiteSphere.get('value')).toBe(0);
        });

        it('should handle deeply nested spheres', async () => {
            log('Creating nested spheres...');
            const whiteSphere = await db.Sphere.createSphere({ backgroundColor: 'white' }, testUser.id);
            log('Created white sphere:', whiteSphere.toJSON());
        
            const redSphere = await db.Sphere.createSphere({ 
                backgroundColor: 'red', 
                primeValue: 2,
                parentId: whiteSphere.id 
            }, testUser.id);
            log('Created red sphere:', redSphere.toJSON());
        
            const greenInsideRed = await db.Sphere.createSphere({ 
                backgroundColor: 'green', 
                primeValue: 3,
                parentId: redSphere.id 
            }, testUser.id);
            log('Created green sphere:', greenInsideRed.toJSON());
        
            // First reload red sphere
            await redSphere.reload({ 
                include: [{ model: db.Sphere, as: 'ContainedSpheres' }] 
            });
            log('Reloaded red sphere:', redSphere.toJSON());
        
            const greenValue = await greenInsideRed.get('value');
            log('Green sphere value:', greenValue);
        
            const redValue = await redSphere.get('value');
            log('Red sphere value:', redValue);
        
            await whiteSphere.reload({ 
                include: [{ 
                    model: db.Sphere, 
                    as: 'ContainedSpheres',
                    include: [{ model: db.Sphere, as: 'ContainedSpheres' }]
                }]
            });
            log('Reloaded white sphere:', whiteSphere.toJSON());
        
            const whiteValue = await whiteSphere.get('value');
            log('White sphere final value:', whiteValue);
        
            expect(await whiteSphere.get('value')).toBe(8);
        });

        it('should correctly handle spheres with many contained spheres', async () => {
            const blackSphere = await db.Sphere.createSphere({ backgroundColor: 'black' });
            const values = [1, 1, 1, 1, 1]; // Create 5 white spheres
            
            await Promise.all(values.map(() => 
                db.Sphere.createSphere({ 
                    backgroundColor: 'white',
                    parentId: blackSphere.id 
                }, testUser.id)
            ));
        
            await blackSphere.reload({ include: [{ model: db.Sphere, as: 'ContainedSpheres' }] });
            expect(await blackSphere.get('value')).toBe(5);
        });

        it('should handle multiple prime spheres in combination', async () => {
            const whiteSphere = await db.Sphere.createSphere({ backgroundColor: 'white' }, testUser.id);
            
            // Create red(2), blue(5), yellow(11) spheres
            await db.Sphere.createSphere({ 
                backgroundColor: 'red', 
                primeValue: 2,
                parentId: whiteSphere.id 
            }, testUser.id);
            await db.Sphere.createSphere({ 
                backgroundColor: 'blue', 
                primeValue: 5,
                parentId: whiteSphere.id 
            }, testUser.id);
            await db.Sphere.createSphere({ 
                backgroundColor: 'yellow', 
                primeValue: 11,
                parentId: whiteSphere.id 
            }, testUser.id);
        
            await whiteSphere.reload({ include: [{ model: db.Sphere, as: 'ContainedSpheres' }] });
            expect(await whiteSphere.get('value')).toBe(110); // 2 * 5 * 11
        });

        it('should handle invalid color combinations gracefully', async () => {
            const blackSphere = await db.Sphere.createSphere({ backgroundColor: 'black' }, testUser.id);
            
            // Try to put a colored sphere in a black sphere (should fail)
            await expect(
                db.Sphere.createSphere({ 
                    backgroundColor: 'red', 
                    primeValue: 2,
                    parentId: blackSphere.id 
                })
            ).rejects.toThrow('Black spheres can only contain white or black spheres');
        });
        
        it('should handle missing or null values gracefully', async () => {
            const sphere = await db.Sphere.createSphere({ backgroundColor: 'red' }, testUser.id);
            expect(await sphere.get('value')).toBe(0); // No primeValue set
        });

        it('should prevent circular references', async () => {
            const sphere1 = await db.Sphere.createSphere({
                backgroundColor: 'white'
            }, testUser.id);
        
            const sphere2 = await db.Sphere.createSphere({
                backgroundColor: 'white',
                parentId: sphere1.id
            }, testUser.id);
        
            // Try to make sphere1 a child of sphere2 (should fail)
            await expect(
                sphere1.update({ parentId: sphere2.id }, { validate: true })
            ).rejects.toThrow('Circular reference detected');
        });

        it('should enforce level constraints', async () => {
            const parentSphere = await db.Sphere.createSphere({ 
                backgroundColor: 'white',
                stage: 1 
            }, testUser.id);
            
            // Create child sphere at higher level
            const childSphere = await db.Sphere.createSphere({ 
                backgroundColor: 'white',
                parentId: parentSphere.id,
                stage: 2
            }, testUser.id);
        
            expect(childSphere.stage).toBe(2);
        });
    });

    it('should handle multiple nested paths correctly', async () => {
        // Create a white sphere containing both:
        // 1. red(2) -> green(3) -> blue(5)  = 2^(3+5)
        // 2. yellow(11)                      = 11
        const whiteSphere = await db.Sphere.createSphere({ backgroundColor: 'white' }, testUser.id);
        
        // First path
        const redSphere = await db.Sphere.createSphere({ 
            backgroundColor: 'red', 
            primeValue: 2,
            parentId: whiteSphere.id 
        }, testUser.id);
        // const blackSphereInner = await db.Sphere.createSphere({ 
        //     backgroundColor: 'white', 
        //     parentId: redSphere.id 
        // }, testUser.id);        
        const whiteSphereInner = await db.Sphere.createSphere({ 
            backgroundColor: 'white', 
            parentId: redSphere.id 
        }, testUser.id);        
        const greenSphere = await db.Sphere.createSphere({ 
            backgroundColor: 'green', 
            primeValue: 3,
            parentId: whiteSphereInner.id 
        }, testUser.id);
        const whiteSphereInner2 = await db.Sphere.createSphere({ 
            backgroundColor: 'white', 
            parentId: redSphere.id 
        }, testUser.id);
        const blueSphere = await db.Sphere.createSphere({ 
            backgroundColor: 'blue', 
            primeValue: 5,
            parentId: whiteSphereInner2.id 
        }, testUser.id);
    
        // Second path
        const yellowSphere = await db.Sphere.createSphere({ 
            backgroundColor: 'yellow', 
            primeValue: 11,
            parentId: whiteSphere.id 
        }, testUser.id);
    
        await whiteSphere.reload({
            include: [{
                model: db.Sphere,
                as: 'ContainedSpheres',
                include: [{
                    model: db.Sphere,
                    as: 'ContainedSpheres',
                    include: [{
                        model: db.Sphere,
                        as: 'ContainedSpheres'
                    }]
                }]
            }]
        });
    
        // Calculate expected value based on your rules
        expect(await whiteSphereInner.get('value')).toBe(3);
        expect(await whiteSphereInner2.get('value')).toBe(5);
        expect(await redSphere.get('value')).toBe(256);
        expect(await whiteSphere.get('value')).toBe(2816);
    });

    it('should handle edge cases in value calculations', async () => {
        const blackSphere = await db.Sphere.createSphere({ backgroundColor: 'black' }, testUser.id);
        
        // Create a very large number of contained spheres
        const numberOfSpheres = 10;
        await Promise.all(Array(numberOfSpheres).fill(null).map(() => 
            db.Sphere.createSphere({ 
                backgroundColor: 'white',
                parentId: blackSphere.id 
            }, testUser.id)
        ));
    
        await blackSphere.reload({ include: [{ model: db.Sphere, as: 'ContainedSpheres' }] });
        expect(await blackSphere.get('value')).toBe(numberOfSpheres);
    });
    
    it('should handle very large exponents correctly', async () => {
        const redSphere = await db.Sphere.createSphere({ 
            backgroundColor: 'red', 
            primeValue: 2
        }, testUser.id);
    
        // Create many spheres to generate a large exponent
        await Promise.all(Array(10).fill(null).map(() => 
            db.Sphere.createSphere({ 
                backgroundColor: 'white',
                parentId: redSphere.id 
            }, testUser.id)
        ));
    
        await redSphere.reload({ include: [{ model: db.Sphere, as: 'ContainedSpheres' }] });
        const value = await redSphere.get('value');
        expect(value).toBe(Math.pow(2, 10)); // 2^10 = 1024
    });

    it('should handle concurrent modifications safely', async () => {
        const whiteSphere = await db.Sphere.createSphere({ backgroundColor: 'white' }, testUser.id);
        
        // Create multiple children concurrently
        await Promise.all([
            db.Sphere.createSphere({ 
                backgroundColor: 'red', 
                primeValue: 2,
                parentId: whiteSphere.id 
            }, testUser.id),
            db.Sphere.createSphere({ 
                backgroundColor: 'green', 
                primeValue: 3,
                parentId: whiteSphere.id 
            }, testUser.id),
            db.Sphere.createSphere({ 
                backgroundColor: 'blue', 
                primeValue: 5,
                parentId: whiteSphere.id 
            }, testUser.id)
        ]);
    
        await whiteSphere.reload({ include: [{ model: db.Sphere, as: 'ContainedSpheres' }] });
        expect(whiteSphere.ContainedSpheres).toHaveLength(3);
    });

describe('Sphere Stage Validation', () => {
    it('should enforce minimum stage requirements for colors', async () => {
        // Try to create a yellow sphere (stage 2) at stage 1
        const yellowSphere = await db.Sphere.createSphere({
            backgroundColor: 'yellow',
            stage: 1
        }, testUser.id);
        expect(yellowSphere.stage).toBe(2);
        expect(yellowSphere).toBeTruthy();
        log('Created yellow sphere at stage 2:', yellowSphere.toJSON());
    });

    it('should allow black and white spheres at any stage', async () => {
        const whiteSphere = await db.Sphere.createSphere({
            backgroundColor: 'white',
            stage: 1
        }, testUser.id);
        expect(whiteSphere).toBeTruthy();
        log('Created white sphere at stage 1:', whiteSphere.toJSON());

        const blackSphere = await db.Sphere.createSphere({
            backgroundColor: 'black',
            stage: 1
        }, testUser.id);
        expect(blackSphere).toBeTruthy();
        log('Created black sphere at stage 1:', blackSphere.toJSON());
    });

    it('should validate stage requirements for complex sphere structures', async () => {
        const parentSphere = await db.Sphere.createSphere({
            backgroundColor: 'white',
            stage: 3
        }, testUser.id);

        const greenSphere = await db.Sphere.createSphere({
            backgroundColor: 'green',
            stage: 3,
            parentId: parentSphere.id
        }, testUser.id);

        await parentSphere.reload({
            include: [{ model: db.Sphere, as: 'ContainedSpheres' }]
        });

        expect(parentSphere.ContainedSpheres).toHaveLength(1);
        expect(parentSphere.ContainedSpheres[0].backgroundColor).toBe('green');
        log('Created complex sphere structure:', {
            parent: parentSphere.toJSON(),
            contained: parentSphere.ContainedSpheres.map(s => s.toJSON())
        });
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