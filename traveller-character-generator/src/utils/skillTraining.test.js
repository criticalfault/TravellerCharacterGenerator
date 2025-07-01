import {
  getAvailableSkillTables,
  rollOnSkillTable,
  parseSkillEntry,
  applySkillTraining,
  getFormattedSkills,
  canAccessAdvancedEducation,
  validateSkillTrainingPrerequisites,
} from './skillTraining';
import { roll1d6 } from './dice';

// Mock dice rolling for consistent testing
jest.mock('./dice', () => ({
  roll1d6: jest.fn(),
}));

describe('Skill Training System', () => {
  const mockCareer = {
    skills_and_training: {
      personal_development: {
        1: 'STR +1',
        2: 'DEX +1',
        3: 'END +1',
        4: 'Gun Combat',
        5: 'Melee',
        6: 'Athletics',
      },
      service_skills: {
        1: 'Drive',
        2: 'Electronics',
        3: 'Gun Combat',
        4: 'Investigate',
        5: 'Recon',
        6: ['Pilot', 'Flyer'],
      },
      advanced_education_requirements: { EDU: 8 },
      advanced_education: {
        1: 'Advocate',
        2: 'Electronics',
        3: 'Language',
        4: 'Medic',
        5: 'Navigation',
        6: 'Science',
      },
      officer: {
        1: 'Leadership',
        2: 'Admin',
        3: 'Tactics',
        4: 'Diplomat',
        5: 'Electronics',
        6: 'Advocate',
      },
      law_enforcement: {
        1: 'Investigate',
        2: 'Streetwise',
        3: 'Gun Combat',
        4: 'Advocate',
        5: 'Athletics',
        6: 'Drive',
      },
    },
  };

  const mockCharacter = {
    attributes: {
      STR: 8,
      DEX: 7,
      END: 9,
      INT: 10,
      EDU: 9,
      SOC: 6,
    },
    skills: {
      'Gun Combat': 1,
      Electronics: 2,
    },
    currentCareer: 'agent',
    careerHistory: [
      {
        career: 'agent',
        assignment: 'Law Enforcement',
        commissioned: false,
        rank: 1,
      },
    ],
  };

  const mockCommissionedCharacter = {
    ...mockCharacter,
    careerHistory: [
      {
        career: 'agent',
        assignment: 'Law Enforcement',
        commissioned: true,
        rank: 2,
      },
    ],
  };

  describe('getAvailableSkillTables', () => {
    test('returns basic tables for enlisted character', () => {
      const tables = getAvailableSkillTables(
        mockCareer,
        'Law Enforcement',
        mockCharacter
      );

      expect(tables).toHaveLength(3); // personal, service, advanced (no specialist in mock)
      expect(tables.map(t => t.name)).toContain('Personal Development');
      expect(tables.map(t => t.name)).toContain('Service Skills');
      expect(tables.map(t => t.name)).toContain('Advanced Education');
    });

    test('includes officer table for commissioned characters', () => {
      const tables = getAvailableSkillTables(
        mockCareer,
        'Law Enforcement',
        mockCommissionedCharacter
      );

      expect(tables).toHaveLength(4); // includes officer table
      expect(tables.map(t => t.name)).toContain('Officer');
    });

    test('excludes advanced education for low EDU characters', () => {
      const lowEduCharacter = {
        ...mockCharacter,
        attributes: { ...mockCharacter.attributes, EDU: 6 },
      };

      const tables = getAvailableSkillTables(
        mockCareer,
        'Law Enforcement',
        lowEduCharacter
      );

      expect(tables.map(t => t.name)).not.toContain('Advanced Education');
    });

    test('handles missing career data gracefully', () => {
      const tables = getAvailableSkillTables(
        null,
        'Law Enforcement',
        mockCharacter
      );
      expect(tables).toHaveLength(0);
    });
  });

  describe('parseSkillEntry', () => {
    test('parses attribute increases correctly', () => {
      const result = parseSkillEntry('STR +1');

      expect(result.type).toBe('attribute');
      expect(result.skills[0].name).toBe('STR');
      expect(result.skills[0].level).toBe(1);
      expect(result.skills[0].isAttribute).toBe(true);
    });

    test('parses regular skills correctly', () => {
      const result = parseSkillEntry('Gun Combat');

      expect(result.type).toBe('skill');
      expect(result.skills[0].name).toBe('Gun Combat');
      expect(result.skills[0].level).toBe(1);
      expect(result.skills[0].isAttribute).toBe(false);
    });

    test('parses skill arrays as choices', () => {
      const result = parseSkillEntry(['Pilot', 'Flyer']);

      expect(result.type).toBe('choice');
      expect(result.options).toHaveLength(2);
      expect(result.options[0].name).toBe('Pilot');
      expect(result.options[1].name).toBe('Flyer');
    });

    test('handles skills with explicit levels', () => {
      const result = parseSkillEntry('Leadership 2');

      expect(result.type).toBe('skill');
      expect(result.skills[0].name).toBe('Leadership');
      expect(result.skills[0].level).toBe(2);
    });
  });

  describe('rollOnSkillTable', () => {
    beforeEach(() => {
      roll1d6.mockReturnValue({
        total: 4,
        dice: [4],
        formatted: '4',
      });
    });

    test('returns valid skill roll result', () => {
      const table = {
        name: 'Personal Development',
        key: 'personal_development',
        skills: mockCareer.skills_and_training.personal_development,
      };

      const result = rollOnSkillTable(table);

      expect(result.roll).toBe(4); // Mocked roll
      expect(result.table).toBe('Personal Development');
      expect(result.skillEntry).toBe('Gun Combat'); // Roll 4 maps to "4" in test data
      expect(result.skills).toBeDefined();
    });

    test('handles missing skill entries gracefully', () => {
      roll1d6.mockReturnValue({
        total: 5,
        dice: [5],
        formatted: '5',
      });

      const table = {
        name: 'Test Table',
        key: 'test',
        skills: { 2: 'Test Skill' }, // Only has entry for roll 2
      };

      const result = rollOnSkillTable(table);
      expect(result).toBeNull(); // Should return null for missing entry
    });
  });

  describe('applySkillTraining', () => {
    const mockDispatch = jest.fn();
    const mockAddSkill = jest.fn();
    const mockUpdateAttribute = jest.fn();
    const CHARACTER_ACTIONS = { ADD_CAREER_EVENT: 'ADD_CAREER_EVENT' };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('applies skill increases correctly', () => {
      const skillResult = {
        table: 'Service Skills',
        roll: 7,
        skills: {
          type: 'skill',
          skills: [
            {
              name: 'Electronics',
              level: 1,
              isAttribute: false,
              displayName: 'Electronics 1',
            },
          ],
        },
      };

      applySkillTraining(
        mockCharacter,
        skillResult,
        mockDispatch,
        CHARACTER_ACTIONS,
        mockAddSkill,
        mockUpdateAttribute
      );

      expect(mockAddSkill).toHaveBeenCalledWith('Electronics', 1);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_CAREER_EVENT',
        payload: expect.objectContaining({
          type: 'skill_training',
          table: 'Service Skills',
        }),
      });
    });

    test('applies attribute increases correctly', () => {
      const skillResult = {
        table: 'Personal Development',
        roll: 7,
        skills: {
          type: 'attribute',
          skills: [
            {
              name: 'STR',
              level: 1,
              isAttribute: true,
              displayName: 'STR +1',
            },
          ],
        },
      };

      applySkillTraining(
        mockCharacter,
        skillResult,
        mockDispatch,
        CHARACTER_ACTIONS,
        mockAddSkill,
        mockUpdateAttribute
      );

      expect(mockUpdateAttribute).toHaveBeenCalledWith('STR', 9); // 8 + 1
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe('getFormattedSkills', () => {
    test('formats character skills correctly', () => {
      const skills = getFormattedSkills(mockCharacter);

      expect(skills).toHaveLength(2);
      expect(skills[0].name).toBe('Electronics');
      expect(skills[0].level).toBe(2);
      expect(skills[0].modifier).toBe(0); // Level 2 gives DM+0
      expect(skills[1].name).toBe('Gun Combat');
      expect(skills[1].level).toBe(1);
    });

    test('calculates skill modifiers correctly', () => {
      const highSkillCharacter = {
        skills: {
          Electronics: 4, // Should give DM+1
          'Gun Combat': 7, // Should give DM+2
          Pilot: 10, // Should give DM+3
        },
      };

      const skills = getFormattedSkills(highSkillCharacter);

      expect(skills.find(s => s.name === 'Electronics').modifier).toBe(1);
      expect(skills.find(s => s.name === 'Gun Combat').modifier).toBe(2);
      expect(skills.find(s => s.name === 'Pilot').modifier).toBe(3);
    });

    test('excludes zero-level skills', () => {
      const characterWithZeroSkills = {
        skills: {
          Electronics: 2,
          'Gun Combat': 0, // Should be excluded
          Pilot: 1,
        },
      };

      const skills = getFormattedSkills(characterWithZeroSkills);

      expect(skills).toHaveLength(2);
      expect(skills.map(s => s.name)).not.toContain('Gun Combat');
    });
  });

  describe('canAccessAdvancedEducation', () => {
    test('allows access with sufficient education', () => {
      const canAccess = canAccessAdvancedEducation(mockCharacter, mockCareer);
      expect(canAccess).toBe(true); // EDU 9 >= 8
    });

    test('denies access with insufficient education', () => {
      const lowEduCharacter = {
        ...mockCharacter,
        attributes: { ...mockCharacter.attributes, EDU: 6 },
      };

      const canAccess = canAccessAdvancedEducation(lowEduCharacter, mockCareer);
      expect(canAccess).toBe(false); // EDU 6 < 8
    });

    test('handles missing requirements gracefully', () => {
      const careerWithoutAdvanced = {
        skills_and_training: {
          personal_development:
            mockCareer.skills_and_training.personal_development,
        },
      };

      const canAccess = canAccessAdvancedEducation(
        mockCharacter,
        careerWithoutAdvanced
      );
      expect(canAccess).toBe(false);
    });
  });

  describe('validateSkillTrainingPrerequisites', () => {
    test('validates successful prerequisites', () => {
      const validation = validateSkillTrainingPrerequisites(
        mockCharacter,
        mockCareer,
        'Law Enforcement'
      );

      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    test('identifies missing career', () => {
      const characterWithoutCareer = { ...mockCharacter, currentCareer: null };
      const validation = validateSkillTrainingPrerequisites(
        characterWithoutCareer,
        mockCareer,
        'Law Enforcement'
      );

      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain('No active career');
    });

    test('identifies missing career data', () => {
      const validation = validateSkillTrainingPrerequisites(
        mockCharacter,
        null,
        'Law Enforcement'
      );

      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain('Career data not found');
    });

    test('identifies missing assignment', () => {
      const validation = validateSkillTrainingPrerequisites(
        mockCharacter,
        mockCareer,
        null
      );

      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain('No assignment selected');
    });

    test('identifies missing skill training data', () => {
      const careerWithoutSkills = { name: 'test' };
      const validation = validateSkillTrainingPrerequisites(
        mockCharacter,
        careerWithoutSkills,
        'Law Enforcement'
      );

      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain(
        'No skill training data available for this career'
      );
    });
  });
});
