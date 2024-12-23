// services/userProficiencyService

const { User, UserProficiency, SpellCategory, Spell } = require('../models');

async function awardExperience(userId, spellId, isSuccess) {
    try {
        // 1. Find the User, Spell, and SpellCategory
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        const spell = await Spell.findByPk(spellId);
        if (!spell) throw new Error('Spell not found');

        const spellCategory = await SpellCategory.findByPk(spell.spellCategoryId);
        if (!spellCategory) throw new Error('Spell category not found');

        // 2. Find or Create UserProficiency
        let userProficiency = await UserProficiency.findOne({
            where: {
                userId: user.id,
                spellCategoryId: spellCategory.id,
            },
        });

        if (!userProficiency) {
            userProficiency = await UserProficiency.create({
                userId: user.id,
                spellCategoryId: spellCategory.id,
                experience: 0,
                lastPracticedAt: new Date(), // Set initial practice time
            });
        }

        // 3. Calculate Experience Gain
        let experienceGain = 0;
        if (isSuccess) {
            experienceGain = spell.successExperience; // Assuming your Spell model has a successExperience attribute
            userProficiency.lastPracticedAt = new Date(); // Update lastPracticedAt only on success
        } else {
            experienceGain = spell.failureExperience; // Assuming your Spell model has a failureExperience attribute
        }

        // 4. Apply Decay (if needed)
        if (userProficiency.lastPracticedAt) {
            const minExperience = userProficiency.minExperience;
            userProficiency.experience = calculateExperienceDecay(
                userProficiency.experience,
                userProficiency.lastPracticedAt,
                minExperience
            );
        }

        // 5. Ensure Minimum Experience
        userProficiency.experience = Math.max(
            userProficiency.experience + experienceGain,
            userProficiency.minExperience
        );

        // 6. Save Changes
        await userProficiency.save();

        console.log(
            `Awarded ${experienceGain} experience to user ${user.username} in category ${spellCategory.name}`
        );

        return userProficiency;
    } catch (error) {
        console.error('Error awarding experience:', error);
        throw error;
    }
}