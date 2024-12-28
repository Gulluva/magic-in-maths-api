// models/__tests__/sumSphereComparison.test.js

'use strict';
const db = require('../../models');
const { testLogger: log } = require('../../utils/logger');


describe('Sum-Sphere Comparison Tests', () => {
    let testUser;

    beforeAll(async () => {
        try {
            log('Environment:', process.env.NODE_ENV);
            log('Starting Sum-Sphere comparison tests');
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

    beforeEach(async () => {
        try {
            // Clear the database before each test
            await db.Sphere.destroy({ where: {} });
            await db.Sum.destroy({ where: {} });
        } catch (error) {
            log('Error clearing test database:', error);
            throw error;
        }
    });

    describe('Basic Comparisons', () => {
        it('should match simple single-value cases', async () => {
            // Create a sum with a single addend
            const sum = await db.Sum.create({
                addends: [2]
            });
            log('Created sum:', sum.toJSON());

            // Create a corresponding red sphere

            const whiteSphere = await db.Sphere.createSphere({
                backgroundColor: 'white',
                stage: 1
            });
            const sphere = await db.Sphere.createSphere({
                backgroundColor: 'red',
                primeValue: 2,
                parentId: whiteSphere.id,
                createdBy: testUser.id
            }, testUser.id);
            log('Created sphere:', sphere.toJSON());

            // Get contained spheres for comparison
            await sphere.reload({
                include: [{ model: db.Sphere, as: 'ContainedSpheres' }]
            });

            const isEqual = await sum.equals(whiteSphere);
            log('Comparison result:', isEqual);
            expect(isEqual).toBe(true);
        });

        it('should match spheres with multiple contained spheres', async () => {
            // Create a sum with multiple addends
            const sum = await db.Sum.create({
                addends: [2, 3]
            });
            log('Created sum:', sum.toJSON());

            // Create a white sphere containing red(2) and green(3)
            const whiteSphere = await db.Sphere.createSphere({
                backgroundColor: 'white',
                stage: 3  // Need stage 3 for green sphere
            });

            const redSphere = await db.Sphere.createSphere({
                backgroundColor: 'red',
                primeValue: 2,
                stage: 1,
                parentId: whiteSphere.id
            });

            const greenSphere = await db.Sphere.createSphere({
                backgroundColor: 'green',
                primeValue: 3,
                stage: 3,
                parentId: whiteSphere.id
            });

            log('Created sphere structure:', {
                parent: whiteSphere.toJSON(),
                children: [redSphere.toJSON(), greenSphere.toJSON()]
            });

            const isEqual = await sum.equals(whiteSphere);
            log('Comparison result:', isEqual);
            expect(isEqual).toBe(true);
        });

        it('should not match when addend counts differ', async () => {
            const sum = await db.Sum.create({
                addends: [2]
            });

            const whiteSphere = await db.Sphere.createSphere({
                backgroundColor: 'white',
                stage: 1
            });

            const redSphere1 = await db.Sphere.createSphere({
                backgroundColor: 'red',
                primeValue: 2,
                stage: 1,
                parentId: whiteSphere.id
            });

            const redSphere2 = await db.Sphere.createSphere({
                backgroundColor: 'red',
                primeValue: 2,
                stage: 1,
                parentId: whiteSphere.id
            });

            const isEqual = await sum.equals(whiteSphere);
            log('Comparison result:', isEqual);
            expect(isEqual).toBe(false);
        });

        it('should match regardless of addend order', async () => {
            const sum = await db.Sum.create({
                addends: [2, 3, 5]
            });

            const whiteSphere = await db.Sphere.createSphere({
                backgroundColor: 'white',
                stage: 3  // Need stage 3 for green
            });

            // Create spheres in different order than addends
            const blueSphere = await db.Sphere.createSphere({
                backgroundColor: 'blue',
                primeValue: 5,
                stage: 1,
                parentId: whiteSphere.id
            });

            const redSphere = await db.Sphere.createSphere({
                backgroundColor: 'red',
                primeValue: 2,
                stage: 1,
                parentId: whiteSphere.id
            });

            const greenSphere = await db.Sphere.createSphere({
                backgroundColor: 'green',
                primeValue: 3,
                stage: 3,
                parentId: whiteSphere.id
            });

            const isEqual = await sum.equals(whiteSphere);
            log('Comparison result:', isEqual);
            expect(isEqual).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty sphere comparison', async () => {
            const sum = await db.Sum.create({
                addends: [1]
            });

            const whiteSphere = await db.Sphere.createSphere({
                backgroundColor: 'white',
                stage: 1
            });

            const isEqual = await sum.equals(whiteSphere);
            expect(isEqual).toBe(false);
        });

        it('should handle null and undefined values', async () => {
            const sum = await db.Sum.create({
                addends: [2]
            });

            const sphere = await db.Sphere.createSphere({
                backgroundColor: 'red',
                stage: 1
                // Missing primeValue
            });

            const isEqual = await sum.equals(sphere);
            expect(isEqual).toBe(false);
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