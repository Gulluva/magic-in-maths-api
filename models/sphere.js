const { DataTypes } = require('sequelize');
const { sequelize } = require('../models');

console.log('Sequelize instance:', Sequelize);

const primeColors = {
    2: 'red',
    3: 'green',
    5: 'blue',
    7: 'purple',
    11: 'yellow',
    13: 'orange',
    17: 'pink',
    19: 'brown',
    23: 'gold'
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
            const containedSpheres = await this.getContainedSpheres();

            // Default values for empty spheres:
            if (containedSpheres.length === 0) {
                if (this.backgroundColor === 'black') return 0; // Additive identity
                if (this.backgroundColor === 'white') return 1; // Multiplicative identity
                if (this.getDataValue('primeValue')) return this.getDataValue('primeValue'); // Prime value for colored spheres
                return 0; // Default to 0 if no other value is determined
            }

            // Calculate value based on contained spheres:
            let sphereValue = 0;
            if (this.backgroundColor === 'black') {
                sphereValue = containedSpheres.reduce((sum, sphere) => sum + sphere.value, 0);
            } else if (this.backgroundColor === 'white') {
                sphereValue = containedSpheres.reduce((product, sphere) => product * sphere.value, 1);
                if (containedSpheres.some(sphere => sphere.value === 0)) {
                    sphereValue = 0; // If a white sphere contains a black sphere (value 0), the total value is 0
                }
            } else {
                // Logic for colored spheres (prime number raised to power)
                const primeValue = Object.keys(primeColors).find(key => primeColors[key] === this.backgroundColor);
                const exponent = containedSpheres.length > 0
                    ? containedSpheres.reduce((sum, sphere) => sum + sphere.value, 0)
                    : 0;
                sphereValue = primeValue ? Math.pow(parseInt(primeValue), exponent) : 0;
            }

            return sphereValue;
        }
    },
    parentId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Spheres', // Note: Self-reference to the Sphere model
            key: 'id',
        },
        allowNull: true, // Null if it's a top-level sphere
    },
    primeValue: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1
        }
    }
}, {
    timestamps: true,
    hooks: {
        beforeSave: async (sphere, options) => {
            const parent = await sphere.getParent();

            if (parent) {
                // Black spheres can only contain white or black spheres
                if (parent.backgroundColor === 'black' && !['white', 'black'].includes(sphere.backgroundColor)) {
                    throw new Error('Black spheres can only contain white or black spheres');
                }
            }
        },
        afterCreate: async (sphere, options) => {
            const parent = await sphere.getParent();
            if (parent) {
                await parent.reload({ include: [{ model: Sphere, as: 'ContainedSpheres' }] })
                parent.changed('value', true);
                await parent.save({ fields: ['value'] });
            }
        },
        afterDestroy: async (sphere, options) => {
            const parent = await sphere.getParent();
            if (parent) {
                await parent.reload({ include: [{ model: Sphere, as: 'ContainedSpheres' }] })
                parent.changed('value', true);
                await parent.save({ fields: ['value'] });
            }
        }
    }
});

// Define relationships:
Sphere.associate = (models) => {
    Sphere.hasMany(models.Sphere, { as: 'ContainedSpheres', foreignKey: 'parentId' });
    Sphere.belongsTo(models.Sphere, { as: 'Parent', foreignKey: 'parentId' });
};

module.exports = Sphere;