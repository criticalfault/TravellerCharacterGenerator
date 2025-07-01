import React, { createContext, useContext, useReducer } from 'react';

// Initial character state matching design specifications
const initialCharacterState = {
  name: '',
  age: 18,
  species: 'Human',
  attributes: {
    STR: 0,
    DEX: 0,
    END: 0,
    INT: 0,
    EDU: 0,
    SOC: 0,
    PSI: 0,
  },
  skills: {},
  careerHistory: [],
  contacts: [],
  allies: [],
  enemies: [],
  rivals: [],
  gear: [],
  cyberware: [],
  money: 0,
  benefitRolls: 0,
  injuries: [],
  damage: { current: 0, max: 0 },
  // Character creation state
  attributesLocked: false,
  backgroundSkillsSelected: false,
  currentCareer: null,
  currentTerm: 0,
  // Temporary state for career progression
  tempModifiers: {
    advancementDM: 0,
    benefitDM: 0,
  },
};

// Action types for character state management
export const CHARACTER_ACTIONS = {
  // Basic character info
  SET_NAME: 'SET_NAME',
  SET_AGE: 'SET_AGE',
  SET_SPECIES: 'SET_SPECIES',

  // Attributes
  SET_ATTRIBUTES: 'SET_ATTRIBUTES',
  UPDATE_ATTRIBUTE: 'UPDATE_ATTRIBUTE',
  LOCK_ATTRIBUTES: 'LOCK_ATTRIBUTES',

  // Skills
  ADD_SKILL: 'ADD_SKILL',
  UPDATE_SKILL: 'UPDATE_SKILL',
  REMOVE_SKILL: 'REMOVE_SKILL',

  // Career progression
  START_CAREER: 'START_CAREER',
  END_CAREER: 'END_CAREER',
  ADD_CAREER_EVENT: 'ADD_CAREER_EVENT',
  ADVANCE_TERM: 'ADVANCE_TERM',

  // Relationships
  ADD_CONTACT: 'ADD_CONTACT',
  ADD_ALLY: 'ADD_ALLY',
  ADD_ENEMY: 'ADD_ENEMY',
  ADD_RIVAL: 'ADD_RIVAL',

  // Equipment and benefits
  ADD_GEAR: 'ADD_GEAR',
  ADD_CYBERWARE: 'ADD_CYBERWARE',
  UPDATE_MONEY: 'UPDATE_MONEY',
  ADD_BENEFIT_ROLLS: 'ADD_BENEFIT_ROLLS',

  // Injuries and damage
  ADD_INJURY: 'ADD_INJURY',
  UPDATE_DAMAGE: 'UPDATE_DAMAGE',

  // Temporary modifiers
  SET_ADVANCEMENT_DM: 'SET_ADVANCEMENT_DM',
  SET_BENEFIT_DM: 'SET_BENEFIT_DM',
  CLEAR_TEMP_MODIFIERS: 'CLEAR_TEMP_MODIFIERS',

  // Character creation flow
  SET_BACKGROUND_SKILLS_SELECTED: 'SET_BACKGROUND_SKILLS_SELECTED',

  // Full character reset
  RESET_CHARACTER: 'RESET_CHARACTER',
  LOAD_CHARACTER: 'LOAD_CHARACTER',
};

// Character state reducer
const characterReducer = (state, action) => {
  switch (action.type) {
    case CHARACTER_ACTIONS.SET_NAME:
      return { ...state, name: action.payload };

    case CHARACTER_ACTIONS.SET_AGE:
      return { ...state, age: action.payload };

    case CHARACTER_ACTIONS.SET_SPECIES:
      return { ...state, species: action.payload };

    case CHARACTER_ACTIONS.SET_ATTRIBUTES:
      const updatedAttributes = { ...state.attributes, ...action.payload };
      return {
        ...state,
        attributes: updatedAttributes,
        damage: {
          ...state.damage,
          max: calculateMaxDamage(
            updatedAttributes.STR,
            updatedAttributes.DEX,
            updatedAttributes.END
          ),
        },
      };

    case CHARACTER_ACTIONS.UPDATE_ATTRIBUTE:
      const newAttributes = {
        ...state.attributes,
        [action.payload.attribute]: action.payload.value,
      };
      return {
        ...state,
        attributes: newAttributes,
        damage: {
          ...state.damage,
          max: calculateMaxDamage(
            newAttributes.STR,
            newAttributes.DEX,
            newAttributes.END
          ),
        },
      };

    case CHARACTER_ACTIONS.LOCK_ATTRIBUTES:
      return {
        ...state,
        attributesLocked: action.payload !== undefined ? action.payload : true,
      };

    case CHARACTER_ACTIONS.ADD_SKILL:
      return {
        ...state,
        skills: {
          ...state.skills,
          [action.payload.skill]:
            (state.skills[action.payload.skill] || 0) +
            (action.payload.level || 1),
        },
      };

    case CHARACTER_ACTIONS.UPDATE_SKILL:
      return {
        ...state,
        skills: {
          ...state.skills,
          [action.payload.skill]: action.payload.level,
        },
      };

    case CHARACTER_ACTIONS.REMOVE_SKILL:
      const { [action.payload]: removed, ...remainingSkills } = state.skills;
      return { ...state, skills: remainingSkills };

    case CHARACTER_ACTIONS.START_CAREER:
      return {
        ...state,
        currentCareer: action.payload.career,
        currentTerm: 1,
        careerHistory: [
          ...state.careerHistory,
          {
            career: action.payload.career,
            assignment: action.payload.assignment,
            terms: 0,
            rank: 0,
            rankTitle: action.payload.rankTitle || '',
            events: [],
            commissioned: action.payload.commissioned || false,
          },
        ],
      };

    case CHARACTER_ACTIONS.END_CAREER:
      const updatedHistory = [...state.careerHistory];
      if (updatedHistory.length > 0) {
        updatedHistory[updatedHistory.length - 1].terms = state.currentTerm;
      }
      return {
        ...state,
        currentCareer: null,
        currentTerm: 0,
        careerHistory: updatedHistory,
        age: state.age + state.currentTerm * 4,
      };

    case CHARACTER_ACTIONS.ADD_CAREER_EVENT:
      const historyWithEvent = [...state.careerHistory];
      if (historyWithEvent.length > 0) {
        const currentCareer = historyWithEvent[historyWithEvent.length - 1];
        const newEvent = {
          term: state.currentTerm,
          ...action.payload,
        };

        // More comprehensive duplicate check to prevent similar events
        const eventExists = currentCareer.events.some(existingEvent => {
          // Same term and type
          if (
            existingEvent.term === newEvent.term &&
            existingEvent.type === newEvent.type
          ) {
            // For some event types, check additional fields
            if (
              newEvent.type === 'survival' ||
              newEvent.type === 'advancement'
            ) {
              return (
                existingEvent.success === newEvent.success &&
                existingEvent.roll === newEvent.roll &&
                existingEvent.target === newEvent.target
              );
            }
            // For other events, check description
            return existingEvent.description === newEvent.description;
          }
          return false;
        });

        if (!eventExists) {
          currentCareer.events.push(newEvent);
        }
      }
      return { ...state, careerHistory: historyWithEvent };

    case CHARACTER_ACTIONS.ADVANCE_TERM:
      return {
        ...state,
        currentTerm: state.currentTerm + 1,
        age: state.age + 4,
      };

    case CHARACTER_ACTIONS.ADD_CONTACT:
      return {
        ...state,
        contacts: [...state.contacts, action.payload],
      };

    case CHARACTER_ACTIONS.ADD_ALLY:
      return {
        ...state,
        allies: [...state.allies, action.payload],
      };

    case CHARACTER_ACTIONS.ADD_ENEMY:
      return {
        ...state,
        enemies: [...state.enemies, action.payload],
      };

    case CHARACTER_ACTIONS.ADD_RIVAL:
      return {
        ...state,
        rivals: [...state.rivals, action.payload],
      };

    case CHARACTER_ACTIONS.ADD_GEAR:
      return {
        ...state,
        gear: [...state.gear, action.payload],
      };

    case CHARACTER_ACTIONS.ADD_CYBERWARE:
      return {
        ...state,
        cyberware: [...state.cyberware, action.payload],
      };

    case CHARACTER_ACTIONS.UPDATE_MONEY:
      return {
        ...state,
        money: Math.max(0, state.money + action.payload),
      };

    case CHARACTER_ACTIONS.ADD_BENEFIT_ROLLS:
      return {
        ...state,
        benefitRolls: state.benefitRolls + action.payload,
      };

    case CHARACTER_ACTIONS.ADD_INJURY:
      return {
        ...state,
        injuries: [...state.injuries, action.payload],
      };

    case CHARACTER_ACTIONS.UPDATE_DAMAGE:
      return {
        ...state,
        damage: { ...state.damage, ...action.payload },
      };

    case CHARACTER_ACTIONS.SET_ADVANCEMENT_DM:
      return {
        ...state,
        tempModifiers: {
          ...state.tempModifiers,
          advancementDM: action.payload,
        },
      };

    case CHARACTER_ACTIONS.SET_BENEFIT_DM:
      return {
        ...state,
        tempModifiers: { ...state.tempModifiers, benefitDM: action.payload },
      };

    case CHARACTER_ACTIONS.CLEAR_TEMP_MODIFIERS:
      return {
        ...state,
        tempModifiers: { advancementDM: 0, benefitDM: 0 },
      };

    case CHARACTER_ACTIONS.SET_BACKGROUND_SKILLS_SELECTED:
      return { ...state, backgroundSkillsSelected: action.payload };

    case CHARACTER_ACTIONS.RESET_CHARACTER:
      return { ...initialCharacterState };

    case CHARACTER_ACTIONS.LOAD_CHARACTER:
      return { ...initialCharacterState, ...action.payload };

    default:
      return state;
  }
};

// Helper function to calculate maximum damage (STR + DEX + END)
const calculateMaxDamage = (str, dex, end) => {
  return (str || 0) + (dex || 0) + (end || 0);
};

// Create context
const CharacterContext = createContext();

// Context provider component
export const CharacterProvider = ({ children }) => {
  const [character, dispatch] = useReducer(
    characterReducer,
    initialCharacterState
  );

  // Helper functions for common operations
  const updateAttribute = (attribute, value) => {
    dispatch({
      type: CHARACTER_ACTIONS.UPDATE_ATTRIBUTE,
      payload: { attribute, value },
    });
  };

  const addSkill = (skill, level = 1) => {
    dispatch({
      type: CHARACTER_ACTIONS.ADD_SKILL,
      payload: { skill, level },
    });
  };

  const updateSkill = (skill, level) => {
    dispatch({
      type: CHARACTER_ACTIONS.UPDATE_SKILL,
      payload: { skill, level },
    });
  };

  const startCareer = (
    career,
    assignment,
    rankTitle = '',
    commissioned = false
  ) => {
    dispatch({
      type: CHARACTER_ACTIONS.START_CAREER,
      payload: { career, assignment, rankTitle, commissioned },
    });
  };

  const addCareerEvent = eventData => {
    dispatch({
      type: CHARACTER_ACTIONS.ADD_CAREER_EVENT,
      payload: eventData,
    });
  };

  const addRelationship = (type, name) => {
    const actionMap = {
      contact: CHARACTER_ACTIONS.ADD_CONTACT,
      ally: CHARACTER_ACTIONS.ADD_ALLY,
      enemy: CHARACTER_ACTIONS.ADD_ENEMY,
      rival: CHARACTER_ACTIONS.ADD_RIVAL,
    };

    if (actionMap[type]) {
      dispatch({
        type: actionMap[type],
        payload: name,
      });
    }
  };

  // Calculate attribute modifier (DM) - Traveller uses (attribute - 6) / 3 rounded down
  const getAttributeModifier = attributeValue => {
    return Math.floor((attributeValue - 6) / 3);
  };

  const value = {
    character,
    dispatch,
    // Helper functions
    updateAttribute,
    addSkill,
    updateSkill,
    startCareer,
    addCareerEvent,
    addRelationship,
    getAttributeModifier,
    // Action constants for direct dispatch usage
    CHARACTER_ACTIONS,
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
};

// Custom hook to use character context
export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
};

export default CharacterContext;
