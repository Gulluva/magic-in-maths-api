// server.js
const express = require('express');
const { Op } = require('sequelize');
const db = require('./models');
const app = express();

app.use(express.json());

// User endpoints
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.User.findAll({
      include: [{
        model: db.UserProficiency,
        include: [db.SpellCategory]
      }]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.userId, {
      include: [{
        model: db.UserProficiency,
        include: [db.SpellCategory]
      }]
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Spell Categories endpoints
app.get('/api/spell-categories', async (req, res) => {
  try {
    const categories = await db.SpellCategory.findAll({
      include: [db.Spell]
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/spell-categories/:id', async (req, res) => {
  try {
    const category = await db.SpellCategory.findByPk(req.params.id, {
      include: [db.Spell]
    });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Spells endpoints
app.get('/api/spells', async (req, res) => {
  try {
    const spells = await db.Spell.findAll({
      include: [{
        model: db.SpellCategory,
        as: 'SpellCategory'  // Add this alias
      },
      {
        model: db.EntityType,
        as: 'targetEntities'
      }]
    });
    res.json(spells);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/spells/:id', async (req, res) => {
  try {
    const spell = await db.Spell.findByPk(req.params.id, {
      include: [
        {
          model: db.SpellCategory,
          as: 'SpellCategory'
        },
        {
          model: db.EntityType,
          as: 'targetEntities'
        }
      ]
    });
    if (!spell) {
      return res.status(404).json({ message: 'Spell not found' });
    }
    res.json(spell);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sums endpoints
app.get('/api/sums', async (req, res) => {
  try {
    const sums = await db.Sum.findAll({
      order: [
        ['stage', 'ASC'],
        ['result', 'ASC']
      ]
    });
    res.json(sums);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sums/stage/:stage', async (req, res) => {
  try {
    const sums = await db.Sum.findAll({
      where: {
        stage: req.params.stage
      },
      order: [['result', 'ASC']]
    });
    res.json(sums);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sums for user's stage and below
app.get('/api/users/:userId/sums', async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const sums = await db.Sum.findAll({
      where: {
        stage: {
          [Op.lte]: user.currentStage
        }
      },
      order: [
        ['stage', 'ASC'],
        ['result', 'ASC']
      ]
    });
    res.json(sums);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all NPCs
app.get('/api/npcs', async (req, res) => {
  try {
    const npcs = await db.User.findAll({
      where: {
        type: 'npc',
        isActive: true
      },
      include: [{
        model: db.UserProficiency,
        include: [db.SpellCategory]
      }]
    });
    res.json(npcs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get NPCs by type
app.get('/api/npcs/:npcType', async (req, res) => {
  try {
    const npcs = await db.User.findAll({
      where: {
        type: 'npc',
        npcType: req.params.npcType,
        isActive: true
      },
      include: [{
        model: db.UserProficiency,
        include: [db.SpellCategory]
      }]
    });
    res.json(npcs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available practice partners for a user's stage
app.get('/api/users/:userId/practice-partners', async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const practicePartners = await db.User.findAll({
      where: {
        type: 'npc',
        npcType: 'practice',
        currentStage: {
          [db.Sequelize.Op.lte]: user.currentStage + 1  // Partners at or slightly above user's stage
        },
        isActive: true
      },
      include: [{
        model: db.UserProficiency,
        include: [db.SpellCategory]
      }]
    });
    res.json(practicePartners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Proficiencies endpoints
app.get('/api/users/:userId/proficiencies', async (req, res) => {
  try {
               const proficiencies = await db.UserProficiency.findAll({
      where: { userId: req.params.userId },
      include: [db.SpellCategory]
    });
    res.json(proficiencies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to create a spell with entities
app.post('/api/spells', async (req, res) => {
  try {
    const {
      name,
      description,
      spellCategoryId,
      requiredSum,
      difficultyLevel,
      experienceGranted,
      entityTypeIds  // Array of entity type IDs
    } = req.body;

    const spell = await db.Spell.create({
      name,
      description,
      spellCategoryId,
      requiredSum,
      difficultyLevel,
      experienceGranted
    });

    if (entityTypeIds && entityTypeIds.length > 0) {
      await spell.setTargetEntities(entityTypeIds);
    }

        // Fetch the complete spell with associations
        const completeSpell = await db.Spell.findByPk(spell.id, {
          include: [
            {
              model: db.SpellCategory,
              as: 'SpellCategory'
            },
            {
              model: db.EntityType,
              as: 'targetEntities'
            }
          ]
        });
    
        res.status(201).json(completeSpell);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });


// New endpoint to update a spell
app.put('/api/spells/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      spellCategoryId,
      requiredSum,
      difficultyLevel,
      experienceGranted,
      entityTypeIds
    } = req.body;

    const spell = await db.Spell.findByPk(req.params.id);
    if (!spell) {
      return res.status(404).json({ message: 'Spell not found' });
    }

    await spell.update({
      name,
      description,
      spellCategoryId,
      requiredSum,
      difficultyLevel,
      experienceGranted
    });

    if (entityTypeIds) {
      await spell.setTargetEntities(entityTypeIds);
    }

    // Fetch updated spell with associations
    const updatedSpell = await db.Spell.findByPk(spell.id, {
      include: [
        {
          model: db.SpellCategory,
          as: 'SpellCategory'
        },
        {
          model: db.EntityType,
          as: 'targetEntities'
        }
      ]
    });

    res.json(updatedSpell);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Create new user practice record for a sum
app.post('/api/users/:userId/practice', async (req, res) => {
  try {
    const { userId } = req.params;
    const sumId = req.body.sumId || req.query.sumId;
    const isCorrect = req.body.isCorrect || req.query.isCorrect === 'true';

    if (!sumId) {
      return res.status(400).json({ error: "sumId is required" });
    }

    // First check if the practice record exists
    let practice = await db.UserSumPractice.findOne({
      where: { 
        UserId: parseInt(userId),
        SumId: parseInt(sumId)
      },
      include: [
        { model: db.User },
        { model: db.Sum }
      ]
    });

    if (practice) {
      // Update existing record
      practice = await practice.update({
        practiceCount: practice.practiceCount + 1,
        lastPracticedAt: new Date(),
        masteryLevel: isCorrect ? 
          Math.min(practice.masteryLevel + 1, 5) : 
          Math.max(practice.masteryLevel - 1, 0)
      });
    } else {
      // Create new record
      practice = await db.UserSumPractice.create({
        UserId: parseInt(userId),
        SumId: parseInt(sumId),
        practiceCount: 1,
        lastPracticedAt: new Date(),
        masteryLevel: isCorrect ? 1 : 0
      });
    }

    // Always reload with associations after create or update
    practice = await db.UserSumPractice.findOne({
      where: { 
        UserId: parseInt(userId),
        SumId: parseInt(sumId)
      },
      include: [
        { model: db.User },
        { model: db.Sum }
      ]
    });

    // Remove the lowercase sumId from the response
    const response = practice.toJSON();
    delete response.sumId;  // Remove the null sumId field

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Create new spell proficiency
app.post('/api/users/:userId/spells/:spellId/proficiency', async (req, res) => {
  try {
    const { userId, spellId } = req.params;
    const spell = await db.Spell.findByPk(spellId);
    
    if (!spell) {
      return res.status(404).json({ message: 'Spell not found' });
    }

    // Create or update user's proficiency in this spell's category
    const [proficiency, created] = await db.UserProficiency.findOrCreate({
      where: {
        userId,
        spellCategoryId: spell.spellCategoryId
      },
      defaults: {
        level: 1,
        experiencePoints: spell.experienceGranted
      }
    });

    if (!created) {
      await proficiency.update({
        experiencePoints: proficiency.experiencePoints + spell.experienceGranted,
        level: Math.floor(proficiency.experiencePoints / 100) + 1 // Simple level calculation
      });
    }

    res.json(proficiency);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Progress user to next stage
app.post('/api/users/:userId/progress', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find the user
    const user = await db.User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Progress to next stage
    const newStage = user.currentStage + 1;
    await user.update({ currentStage: newStage });

    // Return updated user data
    const updatedUser = await db.User.findByPk(userId, {
      include: [{
        model: db.UserProficiency,
        include: [db.SpellCategory]
      }]
    });

    res.json({
      message: 'Stage progressed successfully',
      user: updatedUser,
      previousStage: newStage - 1,
      newStage: newStage
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Entity Types endpoints
app.get('/api/entity-types', async (req, res) => {
  try {
    const entityTypes = await db.EntityType.findAll({
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    res.json(entityTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/entity-types/category/:category', async (req, res) => {
  try {
    const entityTypes = await db.EntityType.findAll({
      where: {
        category: req.params.category
      },
      order: [['name', 'ASC']]
    });
    res.json(entityTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});