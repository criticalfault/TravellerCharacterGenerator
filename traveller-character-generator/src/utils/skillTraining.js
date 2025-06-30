import { roll2d6 } from './dice';

/**
 * Skill Training and Advancement System
 * Handles multiple skill table rolling, skill level tracking, and advancement
 */

/**
 * Get available skill tables for a character's current career and assignment
 */
export const getAvailableSkillTables = (career, assignment, character) => {
  const tables = [];
  
  if (!career?.skills_and_training) return tables;
  
  const skillsData = career.skills_and_training;
  
  // Personal Development table (always available)
  if (skillsData.personal_development) {
    tables.push({
      name: 'Personal Development',
      key: 'personal_development',
      skills: skillsData.personal_development,
      description: 'Basic personal improvement skills'
    });
  }
  
  // Service Skills table (always available)
  if (skillsData.service_skills) {
    tables.push({
      name: 'Service Skills',
      key: 'service_skills',
      skills: skillsData.service_skills,
      description: 'Core skills for your career'
    });
  }
  
  // Advanced Education table (requires education check)
  if (skillsData.advanced_education && skillsData.advanced_education_requirements) {
    const eduReq = skillsData.advanced_education_requirements.EDU || 8;
    if (character.attributes.EDU >= eduReq) {
      tables.push({
        name: 'Advanced Education',
        key: 'advanced_education',
        skills: skillsData.advanced_education,
        description: `Advanced skills (requires EDU ${eduReq}+)`,
        requirement: `EDU ${eduReq}+`
      });
    }
  }
  
  // Officer table (for commissioned characters)
  if (skillsData.officer && character.careerHistory?.length > 0) {
    const currentCareer = character.careerHistory[character.careerHistory.length - 1];
    if (currentCareer.commissioned) {
      tables.push({
        name: 'Officer',
        key: 'officer',
        skills: skillsData.officer,
        description: 'Officer leadership and command skills'
      });
    }
  }
  
  // Assignment-specific table (specialist skills)
  const assignmentKey = assignment?.toLowerCase();
  if (assignmentKey && skillsData[assignmentKey]) {
    tables.push({
      name: `${assignment} Specialist`,
      key: assignmentKey,
      skills: skillsData[assignmentKey],
      description: `Specialized skills for ${assignment} assignment`
    });
  }
  
  return tables;
};

/**
 * Roll on a skill table and return the result
 */
export const rollOnSkillTable = (skillTable) => {
  const rollResult = roll2d6();
  const roll = rollResult.total;
  const skillEntry = skillTable.skills[roll.toString()];
  
  if (!skillEntry) {
    console.warn(`No skill entry found for roll ${roll} on table ${skillTable.name}`);
    return null;
  }
  
  return {
    roll,
    table: skillTable.name,
    tableKey: skillTable.key,
    skillEntry,
    skills: parseSkillEntry(skillEntry)
  };
};

/**
 * Parse a skill entry from the career data
 * Handles various formats: "Skill 1", ["Skill A", "Skill B"], "STR +1", etc.
 */
export const parseSkillEntry = (skillEntry) => {
  if (Array.isArray(skillEntry)) {
    // Multiple skill options - player must choose
    return {
      type: 'choice',
      options: skillEntry.map(skill => parseSkillEntry(skill)).map(parsed => parsed.skills[0])
    };
  }
  
  if (typeof skillEntry === 'string') {
    // Check if it's an attribute increase
    if (skillEntry.includes('+1')) {
      const parts = skillEntry.split(' ');
      const attribute = parts[0];
      return {
        type: 'attribute',
        skills: [{
          name: attribute,
          level: 1,
          isAttribute: true,
          displayName: `${attribute} +1`
        }]
      };
    }
    
    // Regular skill
    const parts = skillEntry.split(' ');
    const lastPart = parts[parts.length - 1];
    const level = parseInt(lastPart);
    
    // Handle skills without explicit level
    if (isNaN(level)) {
      return {
        type: 'skill',
        skills: [{
          name: skillEntry,
          level: 1,
          isAttribute: false,
          displayName: `${skillEntry} 1`
        }]
      };
    }
    
    // Skill with explicit level
    const skillName = parts.slice(0, -1).join(' ');
    return {
      type: 'skill',
      skills: [{
        name: skillName,
        level: level,
        isAttribute: false,
        displayName: skillEntry
      }]
    };
  }
  
  return {
    type: 'unknown',
    skills: []
  };
};

/**
 * Apply skill training result to character
 */
export const applySkillTraining = (character, skillResult, dispatch, CHARACTER_ACTIONS, addSkill, updateAttribute) => {
  if (!skillResult || !skillResult.skills) return;
  
  skillResult.skills.forEach(skill => {
    if (skill.isAttribute) {
      // Apply attribute increase
      const currentValue = character.attributes[skill.name] || 0;
      updateAttribute(skill.name, currentValue + skill.level);
    } else {
      // Apply skill increase with proper stacking
      const currentLevel = character.skills[skill.name] || 0;
      const newLevel = currentLevel + skill.level;
      addSkill(skill.name, skill.level);
    }
  });
  
  // Add training event to career history
  dispatch({
    type: CHARACTER_ACTIONS.ADD_CAREER_EVENT,
    payload: {
      type: 'skill_training',
      table: skillResult.table,
      roll: skillResult.roll,
      description: `Trained on ${skillResult.table}: ${skillResult.skills.map(s => s.displayName).join(', ')}`
    }
  });
};

/**
 * Handle choice-based skill selection
 */
export const handleSkillChoice = (character, choiceOptions, selectedOption, dispatch, CHARACTER_ACTIONS, addSkill, updateAttribute) => {
  const skill = choiceOptions[selectedOption];
  
  if (skill.isAttribute) {
    const currentValue = character.attributes[skill.name] || 0;
    updateAttribute(skill.name, currentValue + skill.level);
  } else {
    addSkill(skill.name, skill.level);
  }
  
  // Add choice event to career history
  dispatch({
    type: CHARACTER_ACTIONS.ADD_CAREER_EVENT,
    payload: {
      type: 'skill_choice',
      description: `Chose: ${skill.displayName}`
    }
  });
};

/**
 * Get skill descriptions for display
 */
export const getSkillDescriptions = () => {
  return {
    // Combat Skills
    'Gun Combat': 'Proficiency with firearms and ranged weapons',
    'Heavy Weapons': 'Operation of heavy military weapons and artillery',
    'Melee': 'Hand-to-hand combat and melee weapons',
    
    // Physical Skills
    'Athletics': 'Physical fitness, climbing, swimming, and endurance',
    'Drive': 'Operation of ground vehicles',
    'Flyer': 'Piloting of atmospheric aircraft',
    'Pilot': 'Operation of spacecraft and starships',
    'Vacc Suit': 'Working in vacuum and zero-gravity environments',
    
    // Mental Skills
    'Electronics': 'Computer systems, sensors, and electronic devices',
    'Engineer': 'Maintenance and repair of complex systems',
    'Investigate': 'Research, analysis, and detective work',
    'Medic': 'Medical treatment and first aid',
    'Navigation': 'Plotting courses and finding directions',
    'Science': 'Scientific knowledge and research',
    
    // Social Skills
    'Admin': 'Bureaucracy, paperwork, and organizational skills',
    'Advocate': 'Legal knowledge and courtroom procedures',
    'Carouse': 'Social drinking and party skills',
    'Deception': 'Lying, disguise, and misdirection',
    'Diplomat': 'Negotiation and international relations',
    'Leadership': 'Command and inspiring others',
    'Persuade': 'Convincing and influencing others',
    'Streetwise': 'Urban survival and criminal contacts',
    
    // Survival Skills
    'Animals': 'Handling and training animals',
    'Recon': 'Scouting, surveillance, and intelligence gathering',
    'Stealth': 'Moving unseen and unheard',
    'Survival': 'Wilderness survival and resource management',
    
    // Technical Skills
    'Broker': 'Trade negotiations and market analysis',
    'Explosives': 'Handling and using explosive devices',
    'Gambler': 'Games of chance and reading people',
    'Language': 'Communication in foreign languages',
    'Mechanic': 'Repair and maintenance of vehicles and equipment',
    'Profession': 'Specialized professional knowledge',
    'Trader': 'Commercial transactions and business',
    
    // Military Skills
    'Tactics': 'Military strategy and battlefield command',
    'Jack of All Trades': 'Basic competence in many areas'
  };
};

/**
 * Format skill display with level and description
 */
export const formatSkillDisplay = (skillName, level) => {
  const descriptions = getSkillDescriptions();
  const description = descriptions[skillName] || 'Specialized skill';
  
  return {
    name: skillName,
    level: level,
    description: description,
    displayName: `${skillName} ${level}`,
    modifier: Math.floor(level / 3) // Traveller skill DM calculation
  };
};

/**
 * Get all character skills formatted for display
 */
export const getFormattedSkills = (character) => {
  const skills = [];
  
  Object.entries(character.skills || {}).forEach(([skillName, level]) => {
    if (level > 0) {
      skills.push(formatSkillDisplay(skillName, level));
    }
  });
  
  return skills.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Check if character can access advanced education table
 */
export const canAccessAdvancedEducation = (character, career) => {
  if (!career?.skills_and_training?.advanced_education_requirements) return false;
  
  const eduReq = career.skills_and_training.advanced_education_requirements.EDU || 8;
  return character.attributes.EDU >= eduReq;
};

/**
 * Validate skill training prerequisites
 */
export const validateSkillTrainingPrerequisites = (character, career, assignment) => {
  const issues = [];
  
  if (!character.currentCareer) {
    issues.push('No active career');
  }
  
  if (!career) {
    issues.push('Career data not found');
  }
  
  if (!assignment) {
    issues.push('No assignment selected');
  }
  
  if (!career?.skills_and_training) {
    issues.push('No skill training data available for this career');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
};