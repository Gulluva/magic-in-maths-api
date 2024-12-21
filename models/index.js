//models/index.js

'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

// Create Sequelize instance
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// First pass: Load all models
const modelFiles = fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  });

// Load all models first
modelFiles.forEach(file => {
  const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
  // Use the model's name as defined in its modelName option
  db[model.name] = model;
});

// Debug logging to verify models are loaded
console.log('Loaded models:', Object.keys(db));

// Second pass: Set up associations after all models are loaded
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    try {
      db[modelName].associate(db);
      console.log(`Successfully set up associations for ${modelName}`);
    } catch (error) {
      console.error(`Error setting up associations for ${modelName}:`, error);
      throw error; // Re-throw to halt initialization if associations fail
    }
  }
});

// Add sequelize instance and class to db object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Debug check for expected models
const expectedModels = ['User', 'Sum', 'UserSumPractice'];
expectedModels.forEach(modelName => {
  if (!db[modelName]) {
    console.warn(`Warning: Expected model ${modelName} not found in db object`);
  }
});

module.exports = db;