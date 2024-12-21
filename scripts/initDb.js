// scripts/initDb.js
const db = require('../models');
const populatePrimeColourSpheres = require('./populatePrimeColourSpheres');
const populateSums = require('./populateSums');

async function initDb() {
    try {
        await db.sequelize.sync({ force: true });

        // Populate prime colour spheres
        await populatePrimeColourSpheres();

        // Populate sums
        await populateSums();

        // Create spell categories
        const categories = await db.SpellCategory.bulkCreate([
            { name: 'Physical', description: 'Spells involving forces and motion' },
            { name: 'Chemical', description: 'Spells involving material transformations' },
            { name: 'Geological', description: 'Spells that interact with rocks, minerals, earth, and terrain'},
            { name: 'Social', description: 'Spells affecting social interactions' },            
            { name: 'Biological', description: 'Spells affecting living things' },
            { name: 'Mental', description: 'Spells affecting mind and thought' }
        ]);
        console.log('Spell categories created successfully');

        // Create users
        const users = await db.User.bulkCreate([
            { 
                username: 'testuser',
                currentStage: 2,
                type: 'player'
            },
            { 
                username: 'Jason',
                currentStage: 3,
                type: 'player'
            },
            { 
                username: 'Wizard Mentor',
                type: 'npc',
                npcType: 'mentor',
                currentStage: 5
            },
            { 
                username: 'Practice Partner',
                type: 'npc',
                npcType: 'practice',
                currentStage: 2
            },
            { 
                username: 'Quest Giver',
                type: 'npc',
                npcType: 'quest',
                currentStage: 3
            }
        ]);
        console.log('Users created successfully');

        // Create proficiencies for all users
        const proficiencies = [];
        for (const user of users) {
            for (const category of categories) {
                proficiencies.push({
                    UserId: user.id,
                    spellCategoryId: category.id,
                    level: user.type === 'npc' && user.npcType === 'mentor' ? 5 : 1,
                    experiencePoints: user.type === 'npc' && user.npcType === 'mentor' ? 500 : 0
                });
            }
        }

        await db.UserProficiency.bulkCreate(proficiencies);
        console.log('User proficiencies created successfully');

        // Create sample spells
        const spells = await db.Spell.bulkCreate([
            { 
                name: 'Move Object',
                spellCategoryId: categories[0].id,
                requiredSum: 7,
                difficultyLevel: 1
            },
            {
                name: 'Transform Water',
                spellCategoryId: categories[1].id,
                requiredSum: 5,
                difficultyLevel: 1
            },
            {
                name: 'Create a Spring',
                spellCategoryId: categories[2].id,
                requiredSum: 23,
                difficultyLevel: 1
            },
            {
                name: 'Heal Minor Wound',
                spellCategoryId: categories[4].id,
                requiredSum: 11,
                difficultyLevel: 2
            },
            {
                name: 'Memory Boost',
                spellCategoryId: categories[5].id,
                requiredSum: 13,
                difficultyLevel: 2
            },
            {
                name: 'Friendship Charm',
                spellCategoryId: categories[3].id,
                requiredSum: 17,
                difficultyLevel: 2
            }
        ]);
        console.log('Spells created successfully');

        // Create sums
        // const sums = await db.Sum.bulkCreate([
        //     { addend1: 1, addend2: 1, result: 2, isPrime: true, stage: 1 },
        //     { addend1: 1, addend2: 2, result: 3, isPrime: true, stage: 1 },
        //     { addend1: 1, addend2: 4, result: 5, isPrime: true, stage: 1 },
        //     { addend1: 1, addend2: 10, result: 11, isPrime: true, stage: 1 },
        //     { addend1: 1, addend2: 16, result: 17, isPrime: true, stage: 1 },
        //     { addend1: 1, addend2: 40, result: 41, isPrime: true, stage: 1 },
        //     { addend1: 1, addend2: 100, result: 101, isPrime: true, stage: 1 },
        //     { addend1: 2, addend2: 5, result: 7, isPrime: true, stage: 1 },
        //     { addend1: 4, addend2: 25, result: 29, isPrime: true, stage: 1 },
        //     { addend1: 5, addend2: 8, result: 13, isPrime: true, stage: 1 },
        //     { addend1: 5, addend2: 32, result: 37, isPrime: true, stage: 1 },
        //     { addend1: 64, addend2: 25, result: 89, isPrime: true, stage: 1 },
        //     { addend1: 11, addend2: 2, result: 13, isPrime: true, stage: 2 },
        //     { addend1: 11, addend2: 8, result: 19, isPrime: true, stage: 2 },
        //     { addend1: 15, addend2: 2, result: 17, isPrime: true, stage: 3 },
        //     { addend1: 11, addend2: 12, result: 19, isPrime: true, stage: 3 }
        // ]);
        // console.log('Sums created successfully');

        console.log('Database initialized with test data');
        return users[0].id;

    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Run the initialization
initDb()
    .then(userId => {
        console.log(`You can use user ID ${userId} for testing the API endpoints.`);
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    });