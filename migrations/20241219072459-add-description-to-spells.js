'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('spells', 'description', {
      type: Sequelize.TEXT,
      allowNull: true  // Initially allow null to not break existing records
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('spells', 'description');
  }
};
