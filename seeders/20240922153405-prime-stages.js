'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('prime_stages', [
      { name: 'Trainee', level: 1, primes: [2, 5] },
      { name: 'Novice', level: 2, primes: [2, 5, 11] },
      { name: 'Apprentice', level: 3, primes: [2, 3, 5, 11] },
      { name: 'Graduate', level: 4, primes: [2, 3, 5, 7, 11] },
      { name: 'Magician', level: 5, primes: [2, 3, 5, 7, 11, 13] },
      { name: 'Witch/Warlock', level: 6, primes: [2, 3, 5, 7, 11, 13, 17] },
      { name: 'Sourcerer', level: 7, primes: [2, 3, 5, 7, 11, 13, 17, 19, 23] }
      
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('prime_stages', null, {});
  }
};
