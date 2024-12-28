'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '..', 'config', 'config.js'))[env];
const db = {};

// Create Sequelize instance
let sequelize;
if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
    sequelize = new Sequelize(
        config.database,
        config.username,
        config.password,
        config
    );
}

// Read model files and initialize them
fs.readdirSync(__dirname)
    .filter(file => {
        return (
            file.indexOf('.') !== 0 &&
            file !== basename &&
            file.slice(-3) === '.js' &&
            !file.includes('.test.js')
        );
    })
    .forEach(file => {
        try {
            const model = require(path.join(__dirname, file));
            if (typeof model === 'function') {
                const initModel = model(sequelize, Sequelize.DataTypes);
                db[initModel.name] = initModel;
                console.log(`Initialized model: ${initModel.name}`);
            }
        } catch (error) {
            console.error(`Error initializing model in file ${file}:`, error);
        }
    });

// Set up associations after all models are loaded
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        try {
            db[modelName].associate(db);
            console.log(`Set up associations for model: ${modelName}`);
        } catch (error) {
            console.error(`Error setting up associations for ${modelName}:`, error);
        }
    }
});

// Add sequelize instance and Sequelize class to db object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;