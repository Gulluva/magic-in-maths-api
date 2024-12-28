// utils/stageCalculation.js

const STAGE_COLORS = {
    1: ['red', 'blue'],
    2: ['yellow'],
    3: ['green'],
    4: ['purple'],
    5: ['orange'],
    7: ['pink'],
    8: ['brown'],
    9: ['gold'],
    10: ['silver'],
    11: ['bronze']
};

const COLOR_TO_PRIME = {
    'red': 2,
    'green': 3,
    'blue': 5,
    'purple': 7,
    'yellow': 11,
    'orange': 13,
    'pink': 17,
    'brown': 19,
    'gold': 23,
    'silver': 29,
    'bronze': 31
};

const calculateMaxValueForStage = (stage) => {
    if (stage <= 5) return 100;
    if (stage === 6) return 200;
    return Math.min(1000, 200 + (stage - 6) * 200);
};

const getRequiredStageForValue = (value) => {
    if (value <= 100) return 1;
    if (value <= 200) return 6;
    const additionalStages = Math.ceil((value - 200) / 200);
    return Math.min(11, 6 + additionalStages);
};

const getRequiredStageForColor = (color) => {
    for (const [stage, colors] of Object.entries(STAGE_COLORS)) {
        if (colors.includes(color)) {
            return parseInt(stage);
        }
    }
    throw new Error(`Invalid color: ${color}`);
};

const calculateSumStage = (sum) => {
    // Get stage required based only on the addend values
    const valueStage = Math.max(
        ...sum.addends.map(value => getRequiredStageForValue(Math.abs(value)))
    );

    return valueStage;
};

module.exports = {
    STAGE_COLORS,
    COLOR_TO_PRIME,
    calculateMaxValueForStage,
    getRequiredStageForValue,
    getRequiredStageForColor,
    calculateSumStage
};