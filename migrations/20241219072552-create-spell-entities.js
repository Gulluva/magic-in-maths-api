'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('spell_entities', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      spellId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'spells',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      entityTypeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'entity_types',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add index for better query performance
    await queryInterface.addIndex('spell_entities', ['spellId', 'entityTypeId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('spell_entities');
  }
};
