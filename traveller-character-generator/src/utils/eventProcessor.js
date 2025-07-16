/**
 * Event Chain Processing System for Traveller RPG
 * Handles complex event chains from career data including player choices,
 * skill checks, and conditional outcomes
 */

import { roll2d6, makeSkillCheck, roll1d3, roll1d6 } from './dice';
import careersData from '../data/careers.json';

/**
 * Process an event chain from career data
 * @param {Array} eventChain - Array of event chain steps
 * @param {Object} character - Character object
 * @param {Function} dispatch - Character context dispatch function
 * @param {Object} CHARACTER_ACTIONS - Character action constants
 * @param {Function} addSkill - Add skill function
 * @param {Function} updateAttribute - Update attribute function
 * @param {Function} addRelationship - Add relationship function
 * @returns {Object} Processing result with outcomes and player choices
 */
export const processEventChain = async (
  eventChain,
  character,
  dispatch,
  CHARACTER_ACTIONS,
  addSkill,
  updateAttribute,
  addRelationship
) => {
  const results = [];
  const playerChoices = [];

  for (const step of eventChain) {
    const result = await processEventStep(
      step,
      character,
      dispatch,
      CHARACTER_ACTIONS,
      addSkill,
      updateAttribute,
      addRelationship
    );

    results.push(result);

    // If this step requires player choice, collect it
    if (result.requiresChoice) {
      playerChoices.push(result);
    }

    // If this step has conditional outcomes, process them
    if (result.conditionalOutcome) {
      const conditionalResult = await processEventChain(
        result.conditionalOutcome,
        character,
        dispatch,
        CHARACTER_ACTIONS,
        addSkill,
        updateAttribute,
        addRelationship
      );
      results.push(...conditionalResult.results);
    }
  }

  return {
    results,
    playerChoices,
    completed: playerChoices.length === 0,
  };
};

/**
 * Process a single event step
 * @param {Object} step - Event step object
 * @param {Object} character - Character object
 * @param {Function} dispatch - Character context dispatch function
 * @param {Object} CHARACTER_ACTIONS - Character action constants
 * @param {Function} addSkill - Add skill function
 * @param {Function} updateAttribute - Update attribute function
 * @param {Function} addRelationship - Add relationship function
 * @returns {Object} Step processing result
 */
export const processEventStep = async (
  step,
  character,
  dispatch,
  CHARACTER_ACTIONS,
  addSkill,
  updateAttribute,
  addRelationship
) => {
  const result = {
    type: step.type,
    success: true,
    description: '',
    requiresChoice: false,
    conditionalOutcome: null,
  };

  switch (step.type) {
    case 'Gain_Skill':
      return processGainSkill(step, character, addSkill);

    case 'Increase_Skill':
      return processIncreaseSkill(step, character, addSkill);

    case 'Roll_Skill':
      return processRollSkill(step, character);

    case 'choice':
      return processChoice(step);

    case 'Gain_Enemy':
    case 'Gain_Ally':
    case 'Gain_Contact':
    case 'Gain_Rival':
      return processGainRelationship(step, addRelationship);

    case 'Gain_Contacts':
      return processGainMultipleContacts(step, addRelationship);

    case 'Advancement_DM':
      return processAdvancementDM(step, dispatch, CHARACTER_ACTIONS);

    case 'Benefit_DM':
      return processBenefitDM(step, dispatch, CHARACTER_ACTIONS);

    case 'Automatic_Promotion':
      return processAutomaticPromotion(step);

    case 'Automatic_Promotion_Or_Comission':
      return processAutomaticPromotionOrCommission(step);

    case 'Injury':
    case 'Severe_Injury':
      return processInjury(step, character, dispatch, CHARACTER_ACTIONS);

    case 'Disaster':
      return processDisaster(step, character);

    case 'Life_Event':
      return processLifeEvent(step);

    case 'Roll_On_Events_Table':
    case 'Roll_On_Mishaps_Table':
      return processRollOnTable(step, character);

    case 'Roll_On_Specialist_Table':
      return processRollOnSpecialistTable(step, character);

    case 'Increase_Stat':
      return processIncreaseStat(step, character, updateAttribute);

    case 'Removed_From_Career':
    case 'Removed_From_Career_No_Benefits':
      return processRemovedFromCareer(step, dispatch, CHARACTER_ACTIONS);

    default:
      return {
        ...result,
        success: false,
        description: `Unknown event type: ${step.type}`,
      };
  }
};

/**
 * Process Gain_Skill event
 */
const processGainSkill = (step, character, addSkill) => {
  const skills = step.skills_list || step.Skills_To_Increase || [];

  if (skills.length === 1) {
    // Single skill - apply directly
    const skillEntry = skills[0];
    const { skillName, level } = parseSkillEntry(skillEntry);
    addSkill(skillName, level);

    return {
      type: 'Gain_Skill',
      success: true,
      description: `Gained ${skillName} ${level}`,
      skillGained: { name: skillName, level },
    };
  } else if (skills.length > 1) {
    // Multiple skills - requires player choice
    return {
      type: 'Gain_Skill',
      success: true,
      requiresChoice: true,
      description: 'Choose a skill to gain',
      choices: skills.map(skill => {
        const { skillName, level } = parseSkillEntry(skill);
        return {
          type: 'skill',
          skill: skillName,
          level,
          description: `Gain ${skillName} ${level}`,
        };
      }),
    };
  }

  return {
    type: 'Gain_Skill',
    success: false,
    description: 'No skills specified',
  };
};

/**
 * Process Increase_Skill event
 */
const processIncreaseSkill = (step, character, addSkill) => {
  const skills = step.skills_list || step.Skills_To_Increase || [];

  if (skills.includes('Any')) {
    // Player chooses any existing skill to increase
    const existingSkills = Object.keys(character.skills).filter(
      skill => character.skills[skill] > 0
    );

    if (existingSkills.length === 0) {
      return {
        type: 'Increase_Skill',
        success: false,
        description: 'No existing skills to increase',
      };
    }

    return {
      type: 'Increase_Skill',
      success: true,
      requiresChoice: true,
      description: 'Choose an existing skill to increase by 1 level',
      choices: existingSkills.map(skill => ({
        type: 'increase_skill',
        skill,
        level: 1,
        description: `Increase ${skill} by 1 level`,
      })),
    };
  } else if (skills.length === 1) {
    // Single skill to increase
    const skillName = skills[0];
    addSkill(skillName, 1);

    return {
      type: 'Increase_Skill',
      success: true,
      description: `Increased ${skillName} by 1 level`,
    };
  } else if (skills.length > 1) {
    // Multiple skills - player choice
    return {
      type: 'Increase_Skill',
      success: true,
      requiresChoice: true,
      description: 'Choose a skill to increase by 1 level',
      choices: skills.map(skill => ({
        type: 'increase_skill',
        skill,
        level: 1,
        description: `Increase ${skill} by 1 level`,
      })),
    };
  }

  return {
    type: 'Increase_Skill',
    success: false,
    description: 'No skills specified',
  };
};

/**
 * Process Roll_Skill event
 */
const processRollSkill = (step, character) => {
  const skillsToRoll = step.SkillsAbleToRoll || [];

  // For now, we'll automatically attempt the first available skill
  // In a full implementation, this might require player choice
  for (const skillCheck of skillsToRoll) {
    const [skillName, target] = Object.entries(skillCheck)[0];
    const skillLevel = character.skills[skillName] || 0;

    // Find the attribute for this skill (simplified - would need skill-to-attribute mapping)
    const attributeValue = getSkillAttribute(skillName, character.attributes);
    const checkResult = makeSkillCheck(attributeValue, skillLevel, target);

    const result = {
      type: 'Roll_Skill',
      success: checkResult.success,
      description: `${skillName} check: ${checkResult.formatted}`,
      skillCheck: {
        skill: skillName,
        target,
        result: checkResult,
      },
    };

    // Process conditional outcomes based on success/failure
    if (checkResult.success && step.Success) {
      result.conditionalOutcome = Array.isArray(step.Success)
        ? step.Success
        : [step.Success];
    } else if (!checkResult.success && step.Failure) {
      result.conditionalOutcome = Array.isArray(step.Failure)
        ? step.Failure
        : [step.Failure];
    }

    return result;
  }

  return {
    type: 'Roll_Skill',
    success: false,
    description: 'No valid skills to roll',
  };
};

/**
 * Process choice event
 */
const processChoice = step => {
  return {
    type: 'choice',
    success: true,
    requiresChoice: true,
    description: 'Make a choice',
    choices: step.choices.map((choice, index) => ({
      ...choice,
      choiceIndex: index,
      description: getChoiceDescription(choice),
    })),
  };
};

/**
 * Process relationship gain events
 */
const processGainRelationship = (step, addRelationship) => {
  const amount = step.amount || 1;
  const relationshipType = step.type.toLowerCase().replace('gain_', '');

  // Generate random relationship names
  const relationships = [];
  for (let i = 0; i < amount; i++) {
    const name = generateRelationshipName(relationshipType);
    relationships.push(name);
    addRelationship(relationshipType, name);
  }

  return {
    type: step.type,
    success: true,
    description: `Gained ${amount} ${relationshipType}${amount > 1 ? 's' : ''}: ${relationships.join(', ')}`,
    relationships,
  };
};

/**
 * Process multiple contacts gain
 */
const processGainMultipleContacts = (step, addRelationship) => {
  const amount = step.amount === 'D3' ? roll1d3().total : step.amount || 1;

  const contacts = [];
  for (let i = 0; i < amount; i++) {
    const name = generateRelationshipName('contact');
    contacts.push(name);
    addRelationship('contact', name);
  }

  return {
    type: 'Gain_Contacts',
    success: true,
    description: `Gained ${amount} contact${amount > 1 ? 's' : ''}: ${contacts.join(', ')}`,
    contacts,
  };
};

/**
 * Process advancement DM bonus
 */
const processAdvancementDM = (step, dispatch, CHARACTER_ACTIONS) => {
  const dm = step.DM || 0;

  dispatch({
    type: CHARACTER_ACTIONS.SET_ADVANCEMENT_DM,
    payload: dm,
  });

  return {
    type: 'Advancement_DM',
    success: true,
    description: `Gained +${dm} DM to next advancement roll`,
    advancementDM: dm,
  };
};

/**
 * Process benefit DM bonus
 */
const processBenefitDM = (step, dispatch, CHARACTER_ACTIONS) => {
  const dm = step.DM || 0;

  dispatch({
    type: CHARACTER_ACTIONS.SET_BENEFIT_DM,
    payload: dm,
  });

  return {
    type: 'Benefit_DM',
    success: true,
    description: `Gained +${dm} DM to benefit rolls`,
    benefitDM: dm,
  };
};

/**
 * Process automatic promotion
 */
const processAutomaticPromotion = step => {
  return {
    type: 'Automatic_Promotion',
    success: true,
    description: 'Automatically promoted!',
    promotion: true,
  };
};

/**
 * Process automatic promotion or commission choice
 */
const processAutomaticPromotionOrCommission = step => {
  return {
    type: 'Automatic_Promotion_Or_Comission',
    success: true,
    requiresChoice: true,
    description: 'Choose automatic promotion or commission',
    choices: [
      {
        type: 'promotion',
        description: 'Gain automatic promotion',
      },
      {
        type: 'commission',
        description: 'Gain automatic commission (if eligible)',
      },
    ],
  };
};

/**
 * Process injury events
 */
const processInjury = (step, character, dispatch, CHARACTER_ACTIONS) => {
  const injuryType = step.type === 'Severe_Injury' ? 'Severe_Injury' : 'Injury';
  const injuryResult = rollOnInjuryTable(injuryType);

  // Apply injury effects
  if (injuryResult.attributeReduction) {
    const { attribute, amount } = injuryResult.attributeReduction;
    dispatch({
      type: CHARACTER_ACTIONS.REDUCE_ATTRIBUTE,
      payload: { attribute, amount },
    });
  }

  dispatch({
    type: CHARACTER_ACTIONS.ADD_INJURY,
    payload: {
      type: injuryType,
      term: character.currentTerm,
      description: injuryResult.description,
      effect: injuryResult.effect,
    },
  });

  return {
    type: step.type,
    success: true,
    description: injuryResult.description,
    injury: {
      type: injuryType,
      effect: injuryResult.effect,
      attributeReduction: injuryResult.attributeReduction,
    },
  };
};

/**
 * Process disaster event (rolls on mishap table)
 */
const processDisaster = (step, character) => {
  return {
    type: 'Disaster',
    success: true,
    description:
      'Disaster occurred - roll on mishap table but remain in career',
    requiresMishapRoll: true,
  };
};

/**
 * Process life event
 */
const processLifeEvent = step => {
  // Life events would typically roll on a separate life events table
  // For now, just note that a life event occurred
  return {
    type: 'Life_Event',
    success: true,
    description: 'A significant life event occurred',
  };
};

/**
 * Process rolling on other tables
 */
const processRollOnTable = (step, character) => {
  const tables = step.Events_Tables || [];
  const tableType = step.type.includes('Mishaps') ? 'mishaps' : 'events';

  // For cross-career table rolls, we need to actually roll on those tables
  const results = [];

  for (const careerName of tables) {
    const career = careersData[careerName.toLowerCase()];
    if (career) {
      if (tableType === 'events' && career.events) {
        const eventRoll = roll2d6().total;
        const event = career.events[eventRoll];
        if (event) {
          results.push({
            career: careerName,
            roll: eventRoll,
            description: event.description,
            eventChain: event.eventChain,
          });
        }
      } else if (tableType === 'mishaps' && career.mishaps) {
        const mishapRoll = roll1d6().total;
        const mishap = career.mishaps[mishapRoll];
        if (mishap) {
          results.push({
            career: careerName,
            roll: mishapRoll,
            description: mishap.description,
            eventChain: mishap.eventChain,
          });
        }
      }
    }
  }

  return {
    type: step.type,
    success: true,
    description: `Rolled on ${tableType} table${tables.length > 1 ? 's' : ''} for: ${tables.join(', ')}`,
    crossCareerResults: results,
    requiresProcessing: results.some(
      r => r.eventChain && r.eventChain.length > 0
    ),
  };
};

/**
 * Process stat increase
 */
const processIncreaseStat = (step, character, updateAttribute) => {
  const stat = step.stat;
  const amount = step.amount || 1;

  if (character.attributes[stat] !== undefined) {
    updateAttribute(stat, character.attributes[stat] + amount);

    return {
      type: 'Increase_Stat',
      success: true,
      description: `${stat} increased by ${amount}`,
      statIncrease: { stat, amount },
    };
  }

  return {
    type: 'Increase_Stat',
    success: false,
    description: `Invalid stat: ${stat}`,
  };
};

/**
 * Process career removal
 */
const processRemovedFromCareer = (step, dispatch, CHARACTER_ACTIONS) => {
  const keepBenefits = !step.type.includes('No_Benefits');

  dispatch({ type: CHARACTER_ACTIONS.END_CAREER });

  return {
    type: step.type,
    success: true,
    description: `Removed from career${keepBenefits ? '' : ' (no benefits)'}`,
    careerEnded: true,
    keepBenefits,
  };
};

/**
 * Helper functions
 */

/**
 * Parse skill entry string (e.g., "Gun Combat 1" -> {skillName: "Gun Combat", level: 1})
 */
const parseSkillEntry = skillEntry => {
  if (typeof skillEntry === 'string') {
    const parts = skillEntry.trim().split(' ');
    const level = parseInt(parts[parts.length - 1]) || 1;
    const skillName = isNaN(parseInt(parts[parts.length - 1]))
      ? skillEntry
      : parts.slice(0, -1).join(' ');

    return { skillName, level };
  }

  return { skillName: skillEntry, level: 1 };
};

/**
 * Get appropriate attribute for a skill (simplified mapping)
 */
const getSkillAttribute = (skillName, attributes) => {
  // Simplified skill-to-attribute mapping
  const skillAttributeMap = {
    'Gun Combat': attributes.DEX,
    Melee: attributes.STR,
    Athletics: attributes.STR,
    Investigate: attributes.INT,
    Streetwise: attributes.INT,
    Deception: attributes.INT,
    Persuade: attributes.SOC,
    Leadership: attributes.SOC,
    Recon: attributes.INT,
    Stealth: attributes.DEX,
    Pilot: attributes.DEX,
    Drive: attributes.DEX,
    Mechanic: attributes.INT,
    Electronics: attributes.INT,
    Medic: attributes.EDU,
    Science: attributes.EDU,
    Admin: attributes.EDU,
    Advocate: attributes.EDU,
    Diplomat: attributes.SOC,
  };

  return skillAttributeMap[skillName] || attributes.INT; // Default to INT
};

/**
 * Generate description for choice options
 */
const getChoiceDescription = choice => {
  if (choice.description) return choice.description;

  switch (choice.type) {
    case 'Gain_Skill':
      return `Gain ${choice.skills_list?.[0] || 'skill'}`;
    case 'Increase_Skill':
      return `Increase ${choice.skills_list?.[0] || 'skill'}`;
    case 'Advancement_DM':
      return `Gain +${choice.DM} advancement DM`;
    case 'Gain_Ally':
      return 'Gain an ally';
    case 'Gain_Enemy':
      return 'Gain an enemy';
    default:
      return choice.type;
  }
};

/**
 * Generate random relationship names
 */
const generateRelationshipName = type => {
  const names = [
    'Alex Chen',
    'Morgan Smith',
    'Jordan Taylor',
    'Casey Johnson',
    'Riley Brown',
    'Avery Davis',
    'Quinn Wilson',
    'Sage Miller',
    'River Jones',
    'Phoenix Garcia',
  ];

  const titles = {
    contact: ['Contact', 'Informant', 'Associate', 'Colleague'],
    ally: ['Ally', 'Friend', 'Supporter', 'Partner'],
    enemy: ['Enemy', 'Rival', 'Opponent', 'Adversary'],
    rival: ['Rival', 'Competitor', 'Challenger'],
  };

  const name = names[Math.floor(Math.random() * names.length)];
  const title =
    titles[type]?.[Math.floor(Math.random() * titles[type].length)] || type;

  return `${name} (${title})`;
};

/**
 * Injury table system
 */
const INJURY_TABLE = {
  1: {
    description: 'Nearly killed',
    effect:
      'Reduce one physical characteristic by 1d6, reduce two other physical characteristics by 2',
    severe: true,
  },
  2: {
    description: 'Severely injured',
    effect: 'Reduce one physical characteristic by 1d6',
    severe: true,
  },
  3: {
    description: 'Missing eye or limb',
    effect: 'Reduce STR or DEX by 2',
    permanent: true,
  },
  4: {
    description: 'Scarred',
    effect:
      'You are scarred and injured. Reduce any physical characteristic by 2',
  },
  5: {
    description: 'Injured',
    effect: 'Reduce any physical characteristic by 1',
  },
  6: { description: 'Lightly injured', effect: 'No permanent effect' },
};

/**
 * Roll on injury table
 */
const rollOnInjuryTable = injuryType => {
  // For testing purposes, use a simple mock result
  if (process.env.NODE_ENV === 'test') {
    return {
      roll: 5,
      description: 'Test injury',
      effect: 'Test effect',
      attributeReduction: {
        attribute: 'STR',
        amount: 1,
      },
      permanent: false,
      severe: injuryType === 'Severe_Injury',
    };
  }

  let roll = roll2d6().total;

  // Severe injuries use the lower of two rolls
  if (injuryType === 'Severe_Injury') {
    const roll2 = roll2d6().total;
    roll = Math.min(roll, roll2);
  }

  // Map 2d6 result to injury table (2-7 maps to 1-6)
  const injuryIndex = Math.max(1, Math.min(6, roll - 1));
  const injury = INJURY_TABLE[injuryIndex];

  let attributeReduction = null;

  // Apply specific injury effects
  switch (injuryIndex) {
    case 1: // Nearly killed
      attributeReduction = {
        attribute: ['STR', 'DEX', 'END'][Math.floor(Math.random() * 3)],
        amount: roll1d6().total,
      };
      break;
    case 2: // Severely injured
      attributeReduction = {
        attribute: ['STR', 'DEX', 'END'][Math.floor(Math.random() * 3)],
        amount: roll1d6().total,
      };
      break;
    case 3: // Missing eye or limb
      attributeReduction = {
        attribute: Math.random() < 0.5 ? 'STR' : 'DEX',
        amount: 2,
      };
      break;
    case 4: // Scarred
      attributeReduction = {
        attribute: ['STR', 'DEX', 'END'][Math.floor(Math.random() * 3)],
        amount: 2,
      };
      break;
    case 5: // Injured
      attributeReduction = {
        attribute: ['STR', 'DEX', 'END'][Math.floor(Math.random() * 3)],
        amount: 1,
      };
      break;
    case 6: // Lightly injured
      // No permanent effect
      break;
    default:
      // No effect for unexpected values
      break;
  }

  return {
    roll,
    description: injury.description,
    effect: injury.effect,
    attributeReduction,
    permanent: injury.permanent || false,
    severe: injury.severe || false,
  };
};

/**
 * Process rolling on specialist skill tables
 */
const processRollOnSpecialistTable = (step, character) => {
  const careers = step.Events_Tables || [];
  const results = [];

  for (const careerName of careers) {
    const career = careersData[careerName.toLowerCase()];
    if (career && career.skills_and_training) {
      // Roll on a random specialist table for this career
      const specialistTables = Object.keys(career.skills_and_training).filter(
        key =>
          ![
            'personal_development',
            'service_skills',
            'advanced_education',
            'advanced_education_requirements',
          ].includes(key)
      );

      if (specialistTables.length > 0) {
        const randomTable =
          specialistTables[Math.floor(Math.random() * specialistTables.length)];
        const skillRoll = roll1d6().total;
        const skill = career.skills_and_training[randomTable][skillRoll];

        if (skill) {
          results.push({
            career: careerName,
            table: randomTable,
            roll: skillRoll,
            skill: skill,
          });
        }
      }
    }
  }

  return {
    type: 'Roll_On_Specialist_Table',
    success: true,
    description: `Rolled on specialist skill table${careers.length > 1 ? 's' : ''} for: ${careers.join(', ')}`,
    specialistResults: results,
    requiresSkillApplication: true,
  };
};

/**
 * Resolve player choice and continue processing
 * @param {Object} choice - The player's choice
 * @param {Object} character - Character object
 * @param {Function} dispatch - Character context dispatch function
 * @param {Object} CHARACTER_ACTIONS - Character action constants
 * @param {Function} addSkill - Add skill function
 * @param {Function} updateAttribute - Update attribute function
 * @param {Function} addRelationship - Add relationship function
 * @returns {Object} Processing result
 */
export const resolvePlayerChoice = async (
  choice,
  character,
  dispatch,
  CHARACTER_ACTIONS,
  addSkill,
  updateAttribute,
  addRelationship
) => {
  // Convert the choice back into an event step and process it
  const eventStep = {
    type: choice.type,
    ...choice,
  };

  return await processEventStep(
    eventStep,
    character,
    dispatch,
    CHARACTER_ACTIONS,
    addSkill,
    updateAttribute,
    addRelationship
  );
};

/**
 * Process cross-career event results
 * @param {Array} crossCareerResults - Results from cross-career table rolls
 * @param {Object} character - Character object
 * @param {Function} dispatch - Character context dispatch function
 * @param {Object} CHARACTER_ACTIONS - Character action constants
 * @param {Function} addSkill - Add skill function
 * @param {Function} updateAttribute - Update attribute function
 * @param {Function} addRelationship - Add relationship function
 * @returns {Array} Processing results
 */
export const processCrossCareerResults = async (
  crossCareerResults,
  character,
  dispatch,
  CHARACTER_ACTIONS,
  addSkill,
  updateAttribute,
  addRelationship
) => {
  const results = [];

  for (const result of crossCareerResults) {
    if (result.eventChain && result.eventChain.length > 0) {
      const chainResult = await processEventChain(
        result.eventChain,
        character,
        dispatch,
        CHARACTER_ACTIONS,
        addSkill,
        updateAttribute,
        addRelationship
      );

      results.push({
        ...result,
        chainResults: chainResult,
      });
    } else {
      results.push(result);
    }
  }

  return results;
};
