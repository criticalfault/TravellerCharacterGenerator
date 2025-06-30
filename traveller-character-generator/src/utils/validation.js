/**
 * Validation utilities for character creation workflow
 */

/**
 * Validate character attributes
 * @param {object} attributes - Character attributes object
 * @returns {object} Validation result with isValid boolean and errors array
 */
export const validateAttributes = (attributes) => {
  const errors = [];
  const requiredAttributes = ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'];
  
  for (const attr of requiredAttributes) {
    const value = attributes[attr];
    if (typeof value !== 'number' || value < 1 || value > 18) {
      errors.push(`${attr} must be a number between 1 and 18`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate character species selection
 * @param {string} species - Selected species
 * @returns {object} Validation result
 */
export const validateSpecies = (species) => {
  const validSpecies = ['Human', 'Aslan', 'Vargr', 'Zhodani', 'Vilani', 'Solomani'];
  
  return {
    isValid: validSpecies.includes(species),
    errors: validSpecies.includes(species) ? [] : ['Invalid species selection']
  };
};

/**
 * Validate background skills selection
 * @param {object} skills - Character skills object
 * @param {number} eduDM - Education dice modifier
 * @returns {object} Validation result
 */
export const validateBackgroundSkills = (skills, eduDM) => {
  const backgroundSkills = [
    'Admin', 'Electronics', 'Science', 'Animals', 'Flyer', 'Seafarer',
    'Art', 'Language', 'Streetwise', 'Athletics', 'Mechanic', 'Survival',
    'Carouse', 'Medic', 'Vacc Suit', 'Drive', 'Profession'
  ];
  
  const maxPoints = Math.max(0, 3 + eduDM);
  let usedPoints = 0;
  const errors = [];
  
  for (const [skill, level] of Object.entries(skills)) {
    if (backgroundSkills.includes(skill)) {
      usedPoints += level;
    }
  }
  
  if (usedPoints > maxPoints) {
    errors.push(`Too many background skill points used (${usedPoints}/${maxPoints})`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    usedPoints,
    maxPoints
  };
};

/**
 * Validate career selection and qualification
 * @param {object} character - Character object
 * @param {string} careerName - Selected career name
 * @returns {object} Validation result
 */
export const validateCareerSelection = (character, careerName) => {
  const errors = [];
  
  if (!careerName) {
    errors.push('No career selected');
  }
  
  if (!character.attributes || !validateAttributes(character.attributes).isValid) {
    errors.push('Character attributes must be set before selecting career');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate complete character for final summary
 * @param {object} character - Complete character object
 * @returns {object} Validation result
 */
export const validateCompleteCharacter = (character) => {
  const errors = [];
  
  // Check species
  const speciesValidation = validateSpecies(character.species);
  if (!speciesValidation.isValid) {
    errors.push(...speciesValidation.errors);
  }
  
  // Check attributes
  const attributesValidation = validateAttributes(character.attributes);
  if (!attributesValidation.isValid) {
    errors.push(...attributesValidation.errors);
  }
  
  // Check career history
  if (!character.careerHistory || character.careerHistory.length === 0) {
    errors.push('Character must have at least one career');
  }
  
  // Check age consistency
  const expectedAge = 18 + (character.careerHistory.reduce((total, career) => total + career.terms, 0) * 4);
  if (character.age !== expectedAge) {
    errors.push(`Age inconsistency: expected ${expectedAge}, got ${character.age}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get character creation progress
 * @param {object} character - Character object
 * @returns {object} Progress information
 */
export const getCharacterProgress = (character) => {
  const steps = [
    { id: 'species', name: 'Species Selection', completed: !!character.species },
    { id: 'attributes', name: 'Attributes', completed: character.attributesLocked && validateAttributes(character.attributes).isValid },
    { id: 'background', name: 'Background Skills', completed: character.backgroundSkillsSelected },
    { id: 'career', name: 'Career', completed: character.careerHistory && character.careerHistory.length > 0 },
    { id: 'mustering', name: 'Mustering Out', completed: character.benefitRolls === 0 }, // All benefits used
    { id: 'complete', name: 'Complete', completed: validateCompleteCharacter(character).isValid }
  ];
  
  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);
  
  return {
    steps,
    completedSteps,
    totalSteps,
    progressPercentage,
    isComplete: completedSteps === totalSteps
  };
};

/**
 * Check if navigation to a specific tab is allowed
 * @param {string} targetTab - Tab to navigate to
 * @param {object} character - Current character state
 * @returns {object} Navigation validation result
 */
export const validateTabNavigation = (targetTab, character) => {
  const progress = getCharacterProgress(character);
  const errors = [];
  
  switch (targetTab) {
    case 'attributes':
      if (!character.species) {
        errors.push('Please select a species first');
      }
      break;
      
    case 'background':
      if (!progress.steps.find(s => s.id === 'attributes').completed) {
        errors.push('Please complete attribute generation first');
      }
      break;
      
    case 'career-selection':
      if (!progress.steps.find(s => s.id === 'background').completed) {
        errors.push('Please complete background skills selection first');
      }
      break;
      
    case 'career-terms':
      if (!character.currentCareer && (!character.careerHistory || character.careerHistory.length === 0)) {
        errors.push('Please select a career first');
      }
      break;
      
    case 'mustering-out':
      if (!character.careerHistory || character.careerHistory.length === 0) {
        errors.push('Please complete at least one career term first');
      }
      break;
      
    case 'summary':
      if (!progress.steps.find(s => s.id === 'mustering').completed) {
        errors.push('Please complete mustering out first');
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};