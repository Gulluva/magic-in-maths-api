const express = require('express');
const router = express.Router();
const { Spell, UserSpell } = require('../models');
const authenticateToken = require('../middleware/authenticateToken');

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userSpells = await UserSpell.findAll({
      where: { userId: req.user.userId },
      include: [{ model: Spell }]
    });
    res.json(userSpells);
  } catch (error) {
    next(error);
  }
}); 

module.exports = router;