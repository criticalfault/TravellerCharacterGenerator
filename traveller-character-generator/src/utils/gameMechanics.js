/**
 * Game mechanics utilities for Traveller RPG
 * Implements specific game rules and calculations
 */

import { roll2d6, rollWithModifier, makeSkillCheck, rollOnTable } from './dice';

/**
 * Calculate attribute modifier (DM) using Traveller rules
 * @param {number} attributeValue - The attribute value
 * @returns {number} The dice modifier
 */
export const getAttributeModifier = (attributeValue) => {
  return Math.floor((attributeValue - 6) / 3);
};

/**
 * Calculate the total of physical attributes (STR + DEX + END) for damage tracking
 * @param {object} attributes - Character attributes object
 * @returns {number} Total physical damage capacity
 */
export const calculatePhysicalTotal = (attributes) => {
  return (attributes.STR || 0) + (attributes.DEX || 0) + (attributes.END || 0);
};

/**
 * Make a qualification roll for a career
 * @param {object} character - Character object with attributes
 * @param {object} career - Career data from careers.json
 * @returns {object} Qualification roll result
 */
export const makeQualificationRoll = (character, career) => {
  if (!career.qualification) {
    return { success: true, automatic: true };
  }
  
  const [attribute, target] = Object.entries(career.qualification)[0];
  const attributeValue = character.attributes[attribute];
  const attributeDM = getAttributeModifier(attributeValue);
  
  const roll = rollWithModifier(attributeDM);
  const success = roll.total >= target;
  
  return {
    success,
    roll: roll.total,
    target,
    attribute,
    attributeValue,
    attributeDM,
    margin: roll.total - target,
    formatted: `${attribute} ${target}+: ${roll.formatted} = ${success ? 'QUALIFIED' : 'FAILED'}`
  };
};

/**
 * Make a survival roll for a career term
 * @param {object} character - Character object
 * @param {object} career - Career data
 * @param {string} assignment - Current assignment
 * @returns {object} Survival roll result
 */
export const makeSurvivalRoll = (character, career, assignment) => {
  const survivalReq = career.career_progress?.survival?.[assignment];
  if (!survivalReq) {
    return { success: true, automatic: true };
  }
  
  const [attribute, target] = Object.entries(survivalReq)[0];
  const attributeValue = character.attributes[attribute];
  const attributeDM = getAttributeModifier(attributeValue);
  
  const roll = rollWithModifier(attributeDM);
  const success = roll.total >= target;
  
  return {
    success,
    roll: roll.total,
    target,
    attribute,
    attributeValue,
    attributeDM,
    margin: roll.total - target,
    formatted: `Survival (${attribute} ${target}+): ${roll.formatted} = ${success ? 'SURVIVED' : 'FAILED'}`
  };
};

/**
 * Make an advancement roll for promotion
 * @param {object} character - Character object
 * @param {object} career - Career data
 * @param {string} assignment - Current assignment
 * @param {number} additionalDM - Additional modifiers (from events, etc.)
 * @returns {object} Advancement roll result
 */
export const makeAdvancementRoll = (character, career, assignment, additionalDM = 0) => {
  const advancementReq = career.career_progress?.advancement?.[assignment];
  if (!advancementReq) {
    return { success: false, noAdvancement: true };
  }
  
  const [attribute, target] = Object.entries(advancementReq)[0];
  const attributeValue = character.attributes[attribute];
  const attributeDM = getAttributeModifier(attributeValue);
  const totalDM = attributeDM + additionalDM;
  
  const roll = rollWithModifier(totalDM);
  const success = roll.total >= target;
  
  return {
    success,
    roll: roll.total,
    target,
    attribute,
    attributeValue,
    attributeDM,
    additionalDM,
    totalDM,
    margin: roll.total - target,
    formatted: `Advancement (${attribute} ${target}+): ${roll.formatted} = ${success ? 'PROMOTED' : 'NO PROMOTION'}`
  };
};

/**
 * Make a commission roll for military careers
 * @param {object} character - Character object
 * @param {object} career - Career data
 * @returns {object} Commission roll result
 */
export const makeCommissionRoll = (character, career) => {
  if (!career.hasCommission || !career.comission) {
    return { success: false, notApplicable: true };
  }
  
  const [attribute, target] = Object.entries(career.comission)[0];
  const attributeValue = character.attributes[attribute];
  const attributeDM = getAttributeModifier(attributeValue);
  
  const roll = rollWithModifier(attributeDM);
  const success = roll.total >= target;
  
  return {
    success,
    roll: roll.total,
    target,
    attribute,
    attributeValue,
    attributeDM,
    margin: roll.total - target,
    formatted: `Commission (${attribute} ${target}+): ${roll.formatted} = ${success ? 'COMMISSIONED' : 'REMAIN ENLISTED'}`
  };
};

/**
 * Roll on an event table
 * @param {object} eventTable - Event table from career data
 * @returns {object} Event result
 */
export const rollEvent = (eventTable) => {
  const roll = roll2d6();
  const event = eventTable[roll.total];
  
  if (!event) {
    return {
      roll: roll.total,
      dice: roll.dice,
      event: null,
      description: 'No event found for this roll',
      eventChain: []
    };
  }
  
  return {
    roll: roll.total,
    dice: roll.dice,
    event,
    description: event.description || 'Event occurred',
    eventChain: event.eventChain || [],
    formatted: `Event Roll ${roll.formatted}: ${event.description || 'Event occurred'}`
  };
};

/**
 * Roll on a mishap table
 * @param {object} mishapTable - Mishap table from career data
 * @returns {object} Mishap result
 */
export const rollMishap = (mishapTable) => {
  const roll = roll2d6();
  const mishap = mishapTable[roll.total];
  
  if (!mishap) {
    return {
      roll: roll.total,
      dice: roll.dice,
      mishap: null,
      description: 'No mishap found for this roll',
      eventChain: []
    };
  }
  
  return {
    roll: roll.total,
    dice: roll.dice,
    mishap,
    description: mishap.description || 'Mishap occurred',
    eventChain: mishap.eventChain || [],
    formatted: `Mishap Roll ${roll.formatted}: ${mishap.description || 'Mishap occurred'}`
  };
};

/**
 * Roll on a skill table and return a skill
 * @param {object} skillTable - Skill table from career data
 * @returns {object} Skill roll result
 */
export const rollSkillTable = (skillTable) => {
  const roll = roll2d6();
  const skillEntry = skillTable[roll.total];
  
  if (!skillEntry) {
    return {
      roll: roll.total,
      dice: roll.dice,
      skill: null,
      skills: [],
      formatted: `Skill Roll ${roll.formatted}: No skill found`
    };
  }
  
  // Handle different skill entry formats
  let skills = [];
  if (typeof skillEntry === 'string') {
    skills = [skillEntry];
  } else if (Array.isArray(skillEntry)) {
    skills = skillEntry;
  }
  
  return {
    roll: roll.total,
    dice: roll.dice,
    skill: skills[0] || null,
    skills,
    isChoice: skills.length > 1,
    formatted: `Skill Roll ${roll.formatted}: ${skills.length > 1 ? `Choose from: ${skills.join(', ')}` : skills[0] || 'No skill'}`
  };
};

/**
 * Roll for mustering out benefits
 * @param {object} benefitTable - Benefit table from career data
 * @param {boolean} isCash - Whether rolling on cash or benefits table
 * @param {number} additionalDM - Additional DM from rank, etc.
 * @returns {object} Benefit roll result
 */
export const rollMusteringOutBenefit = (benefitTable, isCash = false, additionalDM = 0) => {
  const roll = rollWithModifier(additionalDM);
  const tableToUse = isCash ? benefitTable.cash : benefitTable.benefits;
  
  // Clamp roll to valid table range (usually 1-7)
  const clampedRoll = Math.max(1, Math.min(7, roll.total));
  const benefit = tableToUse[clampedRoll];
  
  return {
    roll: roll.total,
    clampedRoll,
    dice: roll.dice,
    additionalDM,
    benefit,
    isCash,
    formatted: `${isCash ? 'Cash' : 'Benefit'} Roll ${roll.formatted} (${clampedRoll}): ${benefit}`
  };
};

/**
 * Calculate aging effects for characters over 34
 * @param {number} age - Character's current age
 * @param {object} attributes - Character's attributes
 * @returns {object} Aging effects result
 */
export const calculateAgingEffects = (age, attributes) => {
  if (age < 34) {
    return { noAging: true, age };
  }
  
  const agingChecks = [];
  let currentAge = age;
  
  // Determine how many aging checks are needed
  while (currentAge >= 34) {
    const checkAge = Math.floor(currentAge / 4) * 4; // Round down to nearest 4-year period
    if (checkAge >= 34) {
      agingChecks.push(checkAge);
    }
    currentAge -= 4;
  }
  
  // Calculate target numbers based on age
  const getAgingTarget = (checkAge) => {
    if (checkAge < 50) return 8;
    if (checkAge < 66) return 9;
    if (checkAge < 82) return 10;
    return 11;
  };
  
  const results = agingChecks.map(checkAge => {
    const target = getAgingTarget(checkAge);
    const strCheck = makeSkillCheck(attributes.STR, 0, target);
    const dexCheck = makeSkillCheck(attributes.DEX, 0, target);
    const endCheck = makeSkillCheck(attributes.END, 0, target);
    
    return {
      age: checkAge,
      target,
      checks: { strCheck, dexCheck, endCheck },
      effects: {
        STR: strCheck.success ? 0 : -1,
        DEX: dexCheck.success ? 0 : -1,
        END: endCheck.success ? 0 : -1
      }
    };
  });
  
  return {
    age,
    agingChecks: results,
    totalEffects: results.reduce((total, result) => ({
      STR: total.STR + result.effects.STR,
      DEX: total.DEX + result.effects.DEX,
      END: total.END + result.effects.END
    }), { STR: 0, DEX: 0, END: 0 })
  };
};

/**
 * Validate if a character meets career prerequisites
 * @param {object} character - Character object
 * @param {object} career - Career data
 * @returns {object} Validation result
 */
export const validateCareerPrerequisites = (character, career) => {
  const issues = [];
  
  // Check age restrictions (if any)
  if (career.minAge && character.age < career.minAge) {
    issues.push(`Too young (minimum age: ${career.minAge})`);
  }
  
  if (career.maxAge && character.age > career.maxAge) {
    issues.push(`Too old (maximum age: ${career.maxAge})`);
  }
  
  // Check attribute minimums (if any)
  if (career.minimumAttributes) {
    Object.entries(career.minimumAttributes).forEach(([attr, min]) => {
      if (character.attributes[attr] < min) {
        issues.push(`${attr} too low (minimum: ${min}, current: ${character.attributes[attr]})`);
      }
    });
  }
  
  // Check required skills (if any)
  if (career.requiredSkills) {
    career.requiredSkills.forEach(skill => {
      if (!character.skills[skill] || character.skills[skill] < 1) {
        issues.push(`Missing required skill: ${skill}`);
      }
    });
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
};