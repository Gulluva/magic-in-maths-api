const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const spellRoutes = require('./spellRoutes');

router.use('/users', userRoutes);
router.use('/spells', spellRoutes);

module.exports = router;