/**
 * Dice rolling utilities for Traveller RPG
 * Implements standard Traveller dice mechanics including 2d6, 3d6, and various modifiers
 */

/**
 * Roll a single die with specified number of sides
 * @param {number} sides - Number of sides on the die (default: 6)
 * @returns {number} Random number between 1 and sides (inclusive)
 */
export const rollDie = (sides = 6) => {
  return Math.floor(Math.random() * sides) + 1;
};

/**
 * Roll multiple dice and return individual results
 * @param {number} count - Number of dice to roll
 * @param {number} sides - Number of sides per die (default: 6)
 * @returns {number[]} Array of individual die results
 */
export const rollDice = (count, sides = 6) => {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(rollDie(sides));
  }
  return results;
};

/**
 * Roll 2d6 - Standard Traveller roll
 * @returns {object} Object with total, dice array, and formatted string
 */
export const roll2d6 = () => {
  const dice = rollDice(2, 6);
  const total = dice.reduce((sum, die) => sum + die, 0);
  return {
    total,
    dice,
    formatted: `${total} (${dice.join(', ')})`
  };
};

/**
 * Roll 3d6 and drop the lowest - Alternative attribute generation method
 * @returns {object} Object with total, all dice, kept dice, dropped die, and formatted string
 */
export const roll3d6DropLowest = () => {
  const dice = rollDice(3, 6);
  const sorted = [...dice].sort((a, b) => b - a); // Sort descending
  const kept = sorted.slice(0, 2); // Keep highest 2
  const dropped = sorted[2]; // Lowest die
  const total = kept.reduce((sum, die) => sum + die, 0);
  
  return {
    total,
    allDice: dice,
    keptDice: kept,
    droppedDie: dropped,
    formatted: `${total} (kept: ${kept.join(', ')}, dropped: ${dropped})`
  };
};

/**
 * Roll 1d6 - Single die roll
 * @returns {object} Object with total and formatted string
 */
export const roll1d6 = () => {
  const result = rollDie(6);
  return {
    total: result,
    dice: [result],
    formatted: `${result}`
  };
};

/**
 * Roll 1d3 - Used for some Traveller tables
 * @returns {object} Object with total and formatted string
 */
export const roll1d3 = () => {
  const result = rollDie(3);
  return {
    total: result,
    dice: [result],
    formatted: `${result}`
  };
};

/**
 * Roll with modifier - Standard 2d6 + DM roll
 * @param {number} modifier - Dice modifier (DM)
 * @returns {object} Object with total (including modifier), base roll, modifier, and formatted string
 */
export const rollWithModifier = (modifier = 0) => {
  const baseRoll = roll2d6();
  const total = baseRoll.total + modifier;
  
  return {
    total,
    baseRoll: baseRoll.total,
    modifier,
    dice: baseRoll.dice,
    formatted: `${total} (${baseRoll.dice.join(', ')}${modifier >= 0 ? '+' : ''}${modifier})`
  };
};

/**
 * Check if a roll succeeds against a target number
 * @param {number} roll - The roll result
 * @param {number} target - Target number to meet or exceed
 * @returns {object} Object with success boolean, roll, target, and margin
 */
export const checkSuccess = (roll, target) => {
  const success = roll >= target;
  const margin = roll - target;
  
  return {
    success,
    roll,
    target,
    margin,
    formatted: `${roll} vs ${target}: ${success ? 'SUCCESS' : 'FAILURE'} (margin: ${margin >= 0 ? '+' : ''}${margin})`
  };
};

/**
 * Make a skill check with attribute modifier and skill level
 * @param {number} attributeValue - Character's attribute value
 * @param {number} skillLevel - Character's skill level (0 for untrained)
 * @param {number} target - Target number (default: 8)
 * @param {number} additionalDM - Additional dice modifiers
 * @returns {object} Complete skill check result
 */
export const makeSkillCheck = (attributeValue, skillLevel = 0, target = 8, additionalDM = 0) => {
  // Calculate attribute modifier (Traveller: (attribute - 6) / 3 rounded down)
  const attributeDM = Math.floor((attributeValue - 6) / 3);
  
  // Unskilled penalty: -3 DM if skill level is 0
  const unskilledPenalty = skillLevel === 0 ? -3 : 0;
  
  // Total modifier
  const totalDM = attributeDM + skillLevel + additionalDM + unskilledPenalty;
  
  // Make the roll
  const rollResult = rollWithModifier(totalDM);
  const successCheck = checkSuccess(rollResult.total, target);
  
  return {
    ...successCheck,
    attributeValue,
    attributeDM,
    skillLevel,
    unskilledPenalty,
    additionalDM,
    totalDM,
    rollResult,
    breakdown: {
      baseRoll: rollResult.baseRoll,
      attributeDM,
      skillLevel: skillLevel > 0 ? skillLevel : 0,
      unskilledPenalty,
      additionalDM,
      total: rollResult.total
    },
    formatted: `Skill Check: ${rollResult.formatted} vs ${target} = ${successCheck.success ? 'SUCCESS' : 'FAILURE'}`
  };
};

/**
 * Generate random attributes using 2d6 method
 * @returns {object} Object with all six attributes
 */
export const generateAttributes2d6 = () => {
  return {
    STR: roll2d6().total,
    DEX: roll2d6().total,
    END: roll2d6().total,
    INT: roll2d6().total,
    EDU: roll2d6().total,
    SOC: roll2d6().total
  };
};

/**
 * Generate random attributes using 3d6 drop lowest method
 * @returns {object} Object with all six attributes and generation details
 */
export const generateAttributes3d6DropLowest = () => {
  const str = roll3d6DropLowest();
  const dex = roll3d6DropLowest();
  const end = roll3d6DropLowest();
  const int = roll3d6DropLowest();
  const edu = roll3d6DropLowest();
  const soc = roll3d6DropLowest();
  
  return {
    attributes: {
      STR: str.total,
      DEX: dex.total,
      END: end.total,
      INT: int.total,
      EDU: edu.total,
      SOC: soc.total
    },
    details: { str, dex, end, int, edu, soc }
  };
};

/**
 * Roll on a table with 2d6
 * @param {object} table - Table object with keys 2-12 or ranges
 * @returns {object} Result with roll and table entry
 */
export const rollOnTable = (table) => {
  const roll = roll2d6();
  const result = table[roll.total] || table['default'] || 'No result found';
  
  return {
    roll: roll.total,
    dice: roll.dice,
    result,
    formatted: `Rolled ${roll.formatted}: ${result}`
  };
};

/**
 * Roll multiple dice and sum them (generic utility)
 * @param {string} diceNotation - Dice notation like "2d6", "1d3", etc.
 * @returns {object} Roll result with total and dice details
 */
export const rollDiceNotation = (diceNotation) => {
  const match = diceNotation.match(/(\d+)d(\d+)([+-]\d+)?/i);
  if (!match) {
    throw new Error(`Invalid dice notation: ${diceNotation}`);
  }
  
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;
  
  const dice = rollDice(count, sides);
  const baseTotal = dice.reduce((sum, die) => sum + die, 0);
  const total = baseTotal + modifier;
  
  return {
    total,
    baseTotal,
    modifier,
    dice,
    notation: diceNotation,
    formatted: `${total} (${dice.join(', ')}${modifier !== 0 ? (modifier >= 0 ? '+' : '') + modifier : ''})`
  };
};