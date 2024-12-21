const { User, Sum } = require('../models');
const { Op } = require('sequelize');

async function selectSumsForUser(userId) {
  const user = await User.findByPk(userId);
  
  const sums = await Sum.findAll({
    where: {
      stage: { [Op.lte]: user.currentStage }
    },
    order: sequelize.random(),
    limit: 10
  });

  return sums;
}

module.exports = { selectSumsForUser };