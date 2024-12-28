// config/config.js
require('dotenv').config(); // This allows us to use environment variables

// Add this debug logging
console.log('Environment:', process.env.NODE_ENV);
console.log('Database Config:', {
  username: process.env.DB_USERNAME,
  database: process.env.NODE_ENV === 'test' ? process.env.DB_TEST_NAME : process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT
});

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log, // Set to false to disable SQL query logging
  },
  test: {
    // Test environment configuration
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_TEST_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log, // Set to false to disable SQL query logging
  },
  production: {
    // Production environment configuration
    use_env_variable: 'DATABASE_URL', // For services like Heroku that provide a DATABASE_URL
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for some hosting providers
      }
    },
    logging: false, // Set to false to disable SQL query logging
  }
};