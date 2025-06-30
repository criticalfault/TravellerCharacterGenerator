import {
  getAttributeModifier,
  calculatePhysicalTotal,
  makeQualificationRoll,
  makeSurvivalRoll,
  makeAdvancementRoll,
  makeCommissionRoll,
  rollEvent,
  rollMishap,
  rollSkillTable,
  rollMusteringOutBenefit,
  calculateAgingEffects,
  validateCareerPrerequisites
} from './gameMechanics';

// Mock the dice module
jest.mock('./dice', () => ({
  roll2d6: jest.fn(),
  rollWithModifier: jest.fn(),
  makeSkillCheck: jest.fn()
}));

import { roll2d6, rollWithModifier, makeSkillCheck } from './dice';

describe('Game Mechanics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAttributeModifier', () => {
    test('calculates modifiers correctly', () => {
      expect(getAttributeModifier(3)).toBe(-1); // (3-6)/3 = -1
      expect(getAttributeModifier(6)).toBe(0);  // (6-6)/3 = 0
      expect(getAttributeModifier(9)).toBe(1);  // (9-6)/3 = 1
      expect(getAttributeModifier(12)).toBe(2); // (12-6)/3 = 2
      expect(getAttributeModifier(15)).toBe(3); // (15-6)/3 = 3
    });

    test('handles edge cases', () => {
      expect(getAttributeModifier(0)).toBe(-2); // (0-6)/3 = -2
      expect(getAttributeModifier(18)).toBe(4); // (18-6)/3 = 4
    });
  });

  describe('calculatePhysicalTotal', () => {
    test('calculates total correctly', () => {
      const attributes = { STR: 8, DEX: 7, END: 9, INT: 10, EDU: 8, SOC: 6 };
      expect(calculatePhysicalTotal(attributes)).toBe(24); // 8 + 7 + 9
    });

    test('handles missing attributes', () => {
      const attributes = { STR: 8, INT: 10 };
      expect(calculatePhysicalTotal(attributes)).toBe(8); // 8 + 0 + 0
    });
  });

  describe('makeQualificationRoll', () => {
    test('handles automatic qualification', () => {
      const character = { attributes: { STR: 8 } };
      const career = {}; // No qualification requirement
      
      const result = makeQualificationRoll(character, career);
      expect(result.success).toBe(true);
      expect(result.automatic).toBe(true);
    });

    test('makes qualification roll', () => {
      rollWithModifier.mockReturnValue({
        total: 10,
        baseRoll: 8,
        modifier: 2,
        dice: [4, 4],
        formatted: '10 (4, 4+2)'
      });

      const character = { attributes: { INT: 12 } };
      const career = { qualification: { INT: 8 } };
      
      const result = makeQualificationRoll(character, career);
      
      expect(result.success).toBe(true);
      expect(result.roll).toBe(10);
      expect(result.target).toBe(8);
      expect(result.attribute).toBe('INT');
      expect(result.attributeDM).toBe(2); // (12-6)/3 = 2
      expect(rollWithModifier).toHaveBeenCalledWith(2);
    });

    test('handles failed qualification', () => {
      rollWithModifier.mockReturnValue({
        total: 6,
        baseRoll: 8,
        modifier: -2,
        dice: [4, 4],
        formatted: '6 (4, 4-2)'
      });

      const character = { attributes: { END: 3 } };
      const career = { qualification: { END: 8 } };
      
      const result = makeQualificationRoll(character, career);
      
      expect(result.success).toBe(false);
      expect(result.margin).toBe(-2); // 6 - 8
    });
  });

  describe('makeSurvivalRoll', () => {
    test('handles automatic survival', () => {
      const character = { attributes: { STR: 8 } };
      const career = {}; // No survival requirement
      const assignment = 'Infantry';
      
      const result = makeSurvivalRoll(character, career, assignment);
      expect(result.success).toBe(true);
      expect(result.automatic).toBe(true);
    });

    test('makes survival roll', () => {
      rollWithModifier.mockReturnValue({
        total: 9,
        baseRoll: 8,
        modifier: 1,
        dice: [4, 4],
        formatted: '9 (4, 4+1)'
      });

      const character = { attributes: { END: 9 } };
      const career = {
        career_progress: {
          survival: {
            Infantry: { END: 6 }
          }
        }
      };
      
      const result = makeSurvivalRoll(character, career, 'Infantry');
      
      expect(result.success).toBe(true);
      expect(result.roll).toBe(9);
      expect(result.target).toBe(6);
      expect(result.attributeDM).toBe(1); // (9-6)/3 = 1
    });
  });

  describe('makeAdvancementRoll', () => {
    test('handles no advancement available', () => {
      const character = { attributes: { INT: 8 } };
      const career = {}; // No advancement requirement
      const assignment = 'Support';
      
      const result = makeAdvancementRoll(character, career, assignment);
      expect(result.success).toBe(false);
      expect(result.noAdvancement).toBe(true);
    });

    test('makes advancement roll with additional DM', () => {
      rollWithModifier.mockReturnValue({
        total: 12,
        baseRoll: 8,
        modifier: 4,
        dice: [4, 4],
        formatted: '12 (4, 4+4)'
      });

      const character = { attributes: { INT: 12 } };
      const career = {
        career_progress: {
          advancement: {
            Support: { INT: 7 }
          }
        }
      };
      
      const result = makeAdvancementRoll(character, career, 'Support', 2);
      
      expect(result.success).toBe(true);
      expect(result.totalDM).toBe(4); // 2 (attribute) + 2 (additional)
      expect(rollWithModifier).toHaveBeenCalledWith(4);
    });
  });

  describe('makeCommissionRoll', () => {
    test('handles non-commissioned careers', () => {
      const character = { attributes: { SOC: 8 } };
      const career = { hasCommission: false };
      
      const result = makeCommissionRoll(character, career);
      expect(result.success).toBe(false);
      expect(result.notApplicable).toBe(true);
    });

    test('makes commission roll', () => {
      rollWithModifier.mockReturnValue({
        total: 10,
        baseRoll: 8,
        modifier: 2,
        dice: [4, 4],
        formatted: '10 (4, 4+2)'
      });

      const character = { attributes: { SOC: 12 } };
      const career = { 
        hasCommission: true,
        comission: { SOC: 8 } // Note: typo in original data structure
      };
      
      const result = makeCommissionRoll(character, career);
      
      expect(result.success).toBe(true);
      expect(result.attributeDM).toBe(2); // (12-6)/3 = 2
    });
  });

  describe('rollEvent', () => {
    test('rolls event successfully', () => {
      roll2d6.mockReturnValue({
        total: 8,
        dice: [4, 4],
        formatted: '8 (4, 4)'
      });

      const eventTable = {
        8: {
          description: 'You make a friend',
          eventChain: [{ type: 'Gain_Ally', amount: 1 }]
        }
      };
      
      const result = rollEvent(eventTable);
      
      expect(result.roll).toBe(8);
      expect(result.description).toBe('You make a friend');
      expect(result.eventChain).toHaveLength(1);
    });

    test('handles missing event', () => {
      roll2d6.mockReturnValue({
        total: 13, // Invalid roll
        dice: [6, 6],
        formatted: '12 (6, 6)'
      });

      const eventTable = {
        8: { description: 'Event' }
      };
      
      const result = rollEvent(eventTable);
      
      expect(result.event).toBeNull();
      expect(result.description).toBe('No event found for this roll');
    });
  });

  describe('rollSkillTable', () => {
    test('rolls single skill', () => {
      roll2d6.mockReturnValue({
        total: 4,
        dice: [2, 2],
        formatted: '4 (2, 2)'
      });

      const skillTable = {
        4: 'Gun Combat'
      };
      
      const result = rollSkillTable(skillTable);
      
      expect(result.skill).toBe('Gun Combat');
      expect(result.skills).toEqual(['Gun Combat']);
      expect(result.isChoice).toBe(false);
    });

    test('rolls skill choice', () => {
      roll2d6.mockReturnValue({
        total: 6,
        dice: [3, 3],
        formatted: '6 (3, 3)'
      });

      const skillTable = {
        6: ['Drive', 'Flyer']
      };
      
      const result = rollSkillTable(skillTable);
      
      expect(result.skills).toEqual(['Drive', 'Flyer']);
      expect(result.isChoice).toBe(true);
    });
  });

  describe('rollMusteringOutBenefit', () => {
    test('rolls cash benefit', () => {
      rollWithModifier.mockReturnValue({
        total: 5,
        baseRoll: 4,
        modifier: 1,
        dice: [2, 2],
        formatted: '5 (2, 2+1)'
      });

      const benefitTable = {
        cash: {
          1: 1000,
          5: 10000
        },
        benefits: {
          5: 'Weapon'
        }
      };
      
      const result = rollMusteringOutBenefit(benefitTable, true, 1);
      
      expect(result.benefit).toBe(10000);
      expect(result.isCash).toBe(true);
      expect(result.clampedRoll).toBe(5);
    });

    test('clamps roll to valid range', () => {
      rollWithModifier.mockReturnValue({
        total: 15, // Too high
        baseRoll: 12,
        modifier: 3,
        dice: [6, 6],
        formatted: '15 (6, 6+3)'
      });

      const benefitTable = {
        benefits: {
          7: 'Ship Share'
        }
      };
      
      const result = rollMusteringOutBenefit(benefitTable, false, 3);
      
      expect(result.clampedRoll).toBe(7); // Clamped to maximum
      expect(result.benefit).toBe('Ship Share');
    });
  });

  describe('validateCareerPrerequisites', () => {
    test('validates successful prerequisites', () => {
      const character = {
        age: 25,
        attributes: { STR: 8, INT: 10 },
        skills: { 'Gun Combat': 1 }
      };
      
      const career = {
        minAge: 18,
        maxAge: 30,
        minimumAttributes: { STR: 6, INT: 8 },
        requiredSkills: ['Gun Combat']
      };
      
      const result = validateCareerPrerequisites(character, career);
      
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('identifies age issues', () => {
      const character = { age: 16, attributes: {}, skills: {} };
      const career = { minAge: 18 };
      
      const result = validateCareerPrerequisites(character, career);
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Too young (minimum age: 18)');
    });

    test('identifies attribute issues', () => {
      const character = {
        age: 25,
        attributes: { STR: 4, INT: 6 },
        skills: {}
      };
      
      const career = {
        minimumAttributes: { STR: 6, INT: 8 }
      };
      
      const result = validateCareerPrerequisites(character, career);
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('STR too low (minimum: 6, current: 4)');
      expect(result.issues).toContain('INT too low (minimum: 8, current: 6)');
    });

    test('identifies missing skills', () => {
      const character = {
        age: 25,
        attributes: {},
        skills: { 'Pilot': 1 }
      };
      
      const career = {
        requiredSkills: ['Gun Combat', 'Tactics']
      };
      
      const result = validateCareerPrerequisites(character, career);
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Missing required skill: Gun Combat');
      expect(result.issues).toContain('Missing required skill: Tactics');
    });
  });
});