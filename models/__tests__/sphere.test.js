// models/__tests__/Sphere.test.js

const { Sphere, sequelize } = require('../../models'); // Adjust path to your models

describe('Sphere Model', () => {
    beforeAll(async () => {
        // Connect to the test database
        await sequelize.sync({ force: true }); // Use force: true to drop and recreate tables before all tests
    });

    beforeEach(async () => {
        // Clear the database or create a clean state before each test
        await Sphere.destroy({ where: {} });
    });

    afterAll(async () => {
        // Close the database connection after all tests
        await sequelize.close();
    });

    it('should create a white sphere with default value 1', async () => {
        const sphere = await Sphere.create({ backgroundColor: 'white' });
        expect(sphere.value).toBe(1);
    });

    it('should create a black sphere with default value 0', async () => {
        const sphere = await Sphere.create({ backgroundColor: 'black' });
        expect(sphere.value).toBe(0);
    });

    it('should calculate the correct value for a white sphere with contained spheres', async () => {
        const whiteSphere = await Sphere.create({ backgroundColor: 'white' });
        const redSphere = await Sphere.create({ backgroundColor: 'red', primeValue: 2 });
        const greenSphere = await Sphere.create({ backgroundColor: 'green', primeValue: 3 });

        await whiteSphere.addContainedSphere(redSphere);
        await whiteSphere.addContainedSphere(greenSphere);

        await whiteSphere.reload({ include: [{ model: Sphere, as: 'ContainedSpheres' }] });

        expect(whiteSphere.value).toBe(6); // 2 * 3
    });

    it('should calculate the correct value for a black sphere with contained spheres', async () => {
        const blackSphere = await Sphere.create({ backgroundColor: 'black' });
        const whiteSphere1 = await Sphere.create({ backgroundColor: 'white' });
        const whiteSphere2 = await Sphere.create({ backgroundColor: 'white' });
        const redSphere = await Sphere.create({ backgroundColor: 'red', primeValue: 2 });

        await blackSphere.addContainedSphere(whiteSphere1);
        await blackSphere.addContainedSphere(whiteSphere2);
        await whiteSphere1.addContainedSphere(redSphere);

        await blackSphere.reload({ include: [{ model: Sphere, as: 'ContainedSpheres' }] });
        await whiteSphere1.reload({ include: [{ model: Sphere, as: 'ContainedSpheres' }] });

        expect(blackSphere.value).toBe(3); // 1 + 2
    });

    it('should set the value of a white sphere to 0 if it contains a black sphere', async () => {
        const whiteSphere = await Sphere.create({ backgroundColor: 'white' });
        const blackSphere = await Sphere.create({ backgroundColor: 'black' });

        await whiteSphere.addContainedSphere(blackSphere);
        await whiteSphere.reload({ include: [{ model: Sphere, as: 'ContainedSpheres' }] });

        expect(whiteSphere.value).toBe(0);
    });

    it('should throw an error when creating a colored sphere inside a black sphere', async () => {
        const blackSphere = await Sphere.create({ backgroundColor: 'black' });
        const redSphere = await Sphere.create({ backgroundColor: 'red', primeValue: 2 });

        await expect(blackSphere.addContainedSphere(redSphere)).rejects.toThrow();
    });
});