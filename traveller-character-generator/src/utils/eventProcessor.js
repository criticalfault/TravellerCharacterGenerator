/**
 * Event Chain Processing System for Traveller RPG
 * Handles complex event chains from career data including player choices,
 * skill checks, and conditional outcomes
 */

import { roll2d6, rollWithModifier, makeSkillCheck, roll1d3 } from './dice';
import { getAttributeModifier, rollEvent, rollMishap } from './gameMechanics';
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
    completed: playerChoices.length === 0
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
    conditionalOutcome: null
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
      
    case 'Increase_Stat':
      return processIncreaseStat(step, character, updateAttribute);
      
    case 'Removed_From_Career':
    case 'Removed_From_Career_No_Benefits':
      return processRemovedFromCareer(step, dispatch, CHARACTER_ACTIONS);
      
    default:
      return {
        ...result,
        success: false,
        description: `Unknown event type: ${step.type}`
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
      skillGained: { name: skillName, level }
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
          description: `Gain ${skillName} ${level}`
        };
      })
    };
  }
  
  return {
    type: 'Gain_Skill',
    success: false,
    description: 'No skills specified'
  };
};

/**
 * Process Increase_Skill event
 */
const processIncreaseSkill = (step, character, addSkill) => {
  const skills = step.skills_list || step.Skills_To_Increase || [];
  
  if (skills.includes('Any')) {
    // Player chooses any existing skill to increase
    const existingSkills = Object.keys(character.skills).filter(skill => character.skills[skill] > 0);
    
    if (existingSkills.length === 0) {
      return {
        type: 'Increase_Skill',
        success: false,
        description: 'No existing skills to increase'
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
        description: `Increase ${skill} by 1 level`
      }))
    };
  } else if (skills.length === 1) {
    // Single skill to increase
    const skillName = skills[0];
    addSkill(skillName, 1);
    
    return {
      type: 'Increase_Skill',
      success: true,
      description: `Increased ${skillName} by 1 level`
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
        description: `Increase ${skill} by 1 level`
      }))
    };
  }
  
  return {
    type: 'Increase_Skill',
    success: false,
    description: 'No skills specified'
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
        result: checkResult
      }
    };
    
    // Process conditional outcomes based on success/failure
    if (checkResult.success && step.Success) {
      result.conditionalOutcome = Array.isArray(step.Success) ? step.Success : [step.Success];
    } else if (!checkResult.success && step.Failure) {
      result.conditionalOutcome = Array.isArray(step.Failure) ? step.Failure : [step.Failure];
    }
    
    return result;
  }
  
  return {
    type: 'Roll_Skill',
    success: false,
    description: 'No valid skills to roll'
  };
};

/**
 * Process choice event
 */
const processChoice = (step) => {
  return {
    type: 'choice',
    success: true,
    requiresChoice: true,
    description: 'Make a choice',
    choices: step.choices.map((choice, index) => ({
      ...choice,
      choiceIndex: index,
      description: getChoiceDescription(choice)
    }))
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
    relationships
  };
};

/**
 * Process multiple contacts gain
 */
const processGainMultipleContacts = (step, addRelationship) => {
  const amount = step.amount === 'D3' ? roll1d3().total : (step.amount || 1);
  
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
    contacts
  };
};

/**
 * Process advancement DM bonus
 */
const processAdvancementDM = (step, dispatch, CHARACTER_ACTIONS) => {
  const dm = step.DM || 0;
  
  dispatch({
    type: CHARACTER_ACTIONS.SET_ADVANCEMENT_DM,
    payload: dm
  });
  
  return {
    type: 'Advancement_DM',
    success: true,
    description: `Gained +${dm} DM to next advancement roll`,
    advancementDM: dm
  };
};

/**
 * Process benefit DM bonus
 */
const processBenefitDM = (step, dispatch, CHARACTER_ACTIONS) => {
  const dm = step.DM || 0;
  
  dispatch({
    type: CHARACTER_ACTIONS.SET_BENEFIT_DM,
    payload: dm
  });
  
  return {
    type: 'Benefit_DM',
    success: true,
    description: `Gained +${dm} DM to benefit rolls`,
    benefitDM: dm
  };
};

/**
 * Process automatic promotion
 */
const processAutomaticPromotion = (step) => {
  return {
    type: 'Automatic_Promotion',
    success: true,
    description: 'Automatically promoted!',
    promotion: true
  };
};

/**
 * Process automatic promotion or commission choice
 */
const processAutomaticPromotionOrCommission = (step) => {
  return {
    type: 'Automatic_Promotion_Or_Comission',
    success: true,
    requiresChoice: true,
    description: 'Choose automatic promotion or commission',
    choices: [
      {
        type: 'promotion',
        description: 'Gain automatic promotion'
      },
      {
        type: 'commission',
        description: 'Gain automatic commission (if eligible)'
      }
    ]
  };
};

/**
 * Process injury events
 */
const processInjury = (step, character, dispatch, CHARACTER_ACTIONS) => {
  // For now, just note the injury - full injury system would be more complex
  const injuryType = step.type === 'Severe_Injury' ? 'Severe Injury' : 'Injury';
  
  dispatch({
    type: CHARACTER_ACTIONS.ADD_INJURY,
    payload: {
      type: injuryType,
      term: character.currentTerm,
      description: `Suffered ${injuryType.toLowerCase()}`
    }
  });
  
  return {
    type: step.type,
    success: true,
    description: `Suffered ${injuryType.toLowerCase()}`,
    injury: injuryType
  };
};

/**
 * Process disaster event (rolls on mishap table)
 */
const processDisaster = (step, character) => {
  return {
    type: 'Disaster',
    success: true,
    description: 'Disaster occurred - roll on mishap table but remain in career',
    requiresMishapRoll: true
  };
};

/**
 * Process life event
 */
const processLifeEvent = (step) => {
  // Life events would typically roll on a separate life events table
  // For now, just note that a life event occurred
  return {
    type: 'Life_Event',
    success: true,
    description: 'A significant life event occurred'
  };
};

/**
 * Process rolling on other tables
 */
const processRollOnTable = (step, character) => {
  const tables = step.Events_Tables || [];
  const tableType = step.type.includes('Mishaps') ? 'mishaps' : 'events';
  
  // For now, just note that we need to roll on other tables
  return {
    type: step.type,
    success: true,
    description: `Roll on ${tableType} table for: ${tables.join(', ')}`,
    requiresTableRoll: true,
    tables,
    tableType
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
      statIncrease: { stat, amount }
    };
  }
  
  return {
    type: 'Increase_Stat',
    success: false,
    description: `Invalid stat: ${stat}`
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
    keepBenefits
  };
};

/**
 * Helper functions
 */

/**
 * Parse skill entry string (e.g., "Gun Combat 1" -> {skillName: "Gun Combat", level: 1})
 */
const parseSkillEntry = (skillEntry) => {
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
    'Melee': attributes.STR,
    'Athletics': attributes.STR,
    'Investigate': attributes.INT,
    'Streetwise': attributes.INT,
    'Deception': attributes.INT,
    'Persuade': attributes.SOC,
    'Leadership': attributes.SOC,
    'Recon': attributes.INT,
    'Stealth': attributes.DEX,
    'Pilot': attributes.DEX,
    'Drive': attributes.DEX,
    'Mechanic': attributes.INT,
    'Electronics': attributes.INT,
    'Medic': attributes.EDU,
    'Science': attributes.EDU,
    'Admin': attributes.EDU,
    'Advocate': attributes.EDU,
    'Diplomat': attributes.SOC
  };
  
  return skillAttributeMap[skillName] || attributes.INT; // Default to INT
};

/**
 * Generate description for choice options
 */
const getChoiceDescription = (choice) => {
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
const generateRelationshipName = (type) => {
  const names = [
    'Alex Chen', 'Morgan Smith', 'Jordan Taylor', 'Casey Johnson', 'Riley Brown',
    'Avery Davis', 'Quinn Wilson', 'Sage Miller', 'River Jones', 'Phoenix Garcia'
  ];
  
  const titles = {
    contact: ['Contact', 'Informant', 'Associate', 'Colleague'],
    ally: ['Ally', 'Friend', 'Supporter', 'Partner'],
    enemy: ['Enemy', 'Rival', 'Opponent', 'Adversary'],
    rival: ['Rival', 'Competitor', 'Challenger']
  };
  
  const name = names[Math.floor(Math.random() * names.length)];
  const title = titles[type]?.[Math.floor(Math.random() * titles[type].length)] || type;
  
  return `${name} (${title})`;
};