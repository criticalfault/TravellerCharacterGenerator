import { processEventChain, processEventStep } from './eventProcessor';

// Mock dependencies
jest.mock('./dice', () => ({
  roll2d6: jest.fn(() => ({ total: 8, dice: [4, 4], formatted: '8 (4, 4)' })),
  rollWithModifier: jest.fn(() => ({ total: 10, baseRoll: 8, modifier: 2, dice: [4, 4], formatted: '10 (4, 4+2)' })),
  makeSkillCheck: jest.fn(() => ({ success: true, formatted: 'Success' })),
  roll1d3: jest.fn(() => ({ total: 2 }))
}));

jest.mock('./gameMechanics', () => ({
  getAttributeModifier: jest.fn(() => 1),
  rollEvent: jest.fn(),
  rollMishap: jest.fn()
}));

jest.mock('../data/careers.json', () => ({}));

describe('Event Processor', () => {
  const mockCharacter = {
    attributes: { STR: 8, DEX: 7, END: 9, INT: 8, EDU: 7, SOC: 6 },
    skills: { 'Gun Combat': 1, 'Investigate': 2 },
    currentTerm: 1
  };

  const mockDispatch = jest.fn();
  const mockCHARACTER_ACTIONS = {
    ADD_CAREER_EVENT: 'ADD_CAREER_EVENT',
    SET_ADVANCEMENT_DM: 'SET_ADVANCEMENT_DM',
    SET_BENEFIT_DM: 'SET_BENEFIT_DM',
    ADD_INJURY: 'ADD_INJURY',
    END_CAREER: 'END_CAREER'
  };
  const mockAddSkill = jest.fn();
  const mockUpdateAttribute = jest.fn();
  const mockAddRelationship = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('processes Gain_Skill event with single skill', async () => {
    const eventChain = [
      {
        type: 'Gain_Skill',
        skills_list: ['Gun Combat 1']
      }
    ];

    const result = await processEventChain(
      eventChain,
      mockCharacter,
      mockDispatch,
      mockCHARACTER_ACTIONS,
      mockAddSkill,
      mockUpdateAttribute,
      mockAddRelationship
    );

    expect(result.completed).toBe(true);
    expect(result.playerChoices).toHaveLength(0);
    expect(mockAddSkill).toHaveBeenCalledWith('Gun Combat', 1);
  });

  test('processes Gain_Skill event with multiple skills requiring choice', async () => {
    const eventChain = [
      {
        type: 'Gain_Skill',
        skills_list: ['Gun Combat 1', 'Melee 1', 'Athletics 1']
      }
    ];

    const result = await processEventChain(
      eventChain,
      mockCharacter,
      mockDispatch,
      mockCHARACTER_ACTIONS,
      mockAddSkill,
      mockUpdateAttribute,
      mockAddRelationship
    );

    expect(result.completed).toBe(false);
    expect(result.playerChoices).toHaveLength(1);
    expect(result.playerChoices[0].requiresChoice).toBe(true);
    expect(result.playerChoices[0].choices).toHaveLength(3);
  });

  test('processes Advancement_DM event', async () => {
    const eventChain = [
      {
        type: 'Advancement_DM',
        DM: 2
      }
    ];

    const result = await processEventChain(
      eventChain,
      mockCharacter,
      mockDispatch,
      mockCHARACTER_ACTIONS,
      mockAddSkill,
      mockUpdateAttribute,
      mockAddRelationship
    );

    expect(result.completed).toBe(true);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_ADVANCEMENT_DM',
      payload: 2
    });
  });

  test('processes Gain_Enemy event', async () => {
    const eventChain = [
      {
        type: 'Gain_Enemy',
        amount: 1
      }
    ];

    const result = await processEventChain(
      eventChain,
      mockCharacter,
      mockDispatch,
      mockCHARACTER_ACTIONS,
      mockAddSkill,
      mockUpdateAttribute,
      mockAddRelationship
    );

    expect(result.completed).toBe(true);
    expect(mockAddRelationship).toHaveBeenCalledWith('enemy', expect.any(String));
  });

  test('processes Gain_Contacts with D3 amount', async () => {
    const eventChain = [
      {
        type: 'Gain_Contacts',
        amount: 'D3'
      }
    ];

    const result = await processEventChain(
      eventChain,
      mockCharacter,
      mockDispatch,
      mockCHARACTER_ACTIONS,
      mockAddSkill,
      mockUpdateAttribute,
      mockAddRelationship
    );

    expect(result.completed).toBe(true);
    expect(mockAddRelationship).toHaveBeenCalledTimes(2); // D3 rolled 2
  });

  test('processes choice event', async () => {
    const eventChain = [
      {
        type: 'choice',
        choices: [
          {
            type: 'Gain_Skill',
            skills_list: ['Leadership 1']
          },
          {
            type: 'Advancement_DM',
            DM: 4
          }
        ]
      }
    ];

    const result = await processEventChain(
      eventChain,
      mockCharacter,
      mockDispatch,
      mockCHARACTER_ACTIONS,
      mockAddSkill,
      mockUpdateAttribute,
      mockAddRelationship
    );

    expect(result.completed).toBe(false);
    expect(result.playerChoices).toHaveLength(1);
    expect(result.playerChoices[0].choices).toHaveLength(2);
  });

  test('processes Injury event', async () => {
    const eventChain = [
      {
        type: 'Injury'
      }
    ];

    const result = await processEventChain(
      eventChain,
      mockCharacter,
      mockDispatch,
      mockCHARACTER_ACTIONS,
      mockAddSkill,
      mockUpdateAttribute,
      mockAddRelationship
    );

    expect(result.completed).toBe(true);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'ADD_INJURY',
      payload: {
        type: 'Injury',
        term: 1,
        description: 'Suffered injury'
      }
    });
  });

  test('processes Increase_Stat event', async () => {
    const eventChain = [
      {
        type: 'Increase_Stat',
        stat: 'STR',
        amount: 1
      }
    ];

    const result = await processEventChain(
      eventChain,
      mockCharacter,
      mockDispatch,
      mockCHARACTER_ACTIONS,
      mockAddSkill,
      mockUpdateAttribute,
      mockAddRelationship
    );

    expect(result.completed).toBe(true);
    expect(mockUpdateAttribute).toHaveBeenCalledWith('STR', 9); // 8 + 1
  });

  test('handles unknown event type gracefully', async () => {
    const eventChain = [
      {
        type: 'Unknown_Event_Type'
      }
    ];

    const result = await processEventChain(
      eventChain,
      mockCharacter,
      mockDispatch,
      mockCHARACTER_ACTIONS,
      mockAddSkill,
      mockUpdateAttribute,
      mockAddRelationship
    );

    expect(result.completed).toBe(true);
    expect(result.results[0].success).toBe(false);
    expect(result.results[0].description).toContain('Unknown event type');
  });
});