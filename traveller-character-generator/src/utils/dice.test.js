import {
  rollDie,
  rollDice,
  roll2d6,
  roll3d6DropLowest,
  rollWithModifier,
  checkSuccess,
  makeSkillCheck,
  generateAttributes2d6,
  rollDiceNotation
} from './dice';

describe('Dice Utilities', () => {
  // Mock Math.random for predictable testing
  const originalRandom = Math.random;
  
  beforeEach(() => {
    // Reset Math.random before each test
    Math.random = originalRandom;
  });

  afterAll(() => {
    // Restore original Math.random
    Math.random = originalRandom;
  });

  describe('rollDie', () => {
    test('returns a number between 1 and 6 by default', () => {
      const result = rollDie();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
      expect(Number.isInteger(result)).toBe(true);
    });

    test('returns a number within specified range', () => {
      const result = rollDie(10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    });
  });

  describe('rollDice', () => {
    test('returns correct number of dice', () => {
      const result = rollDice(3, 6);
      expect(result).toHaveLength(3);
      result.forEach(die => {
        expect(die).toBeGreaterThanOrEqual(1);
        expect(die).toBeLessThanOrEqual(6);
      });
    });
  });

  describe('roll2d6', () => {
    test('returns correct structure', () => {
      const result = roll2d6();
      
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('dice');
      expect(result).toHaveProperty('formatted');
      expect(result.dice).toHaveLength(2);
      expect(result.total).toBe(result.dice[0] + result.dice[1]);
      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.total).toBeLessThanOrEqual(12);
    });
  });

  describe('roll3d6DropLowest', () => {
    test('returns correct structure and drops lowest', () => {
      const result = roll3d6DropLowest();
      
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('allDice');
      expect(result).toHaveProperty('keptDice');
      expect(result).toHaveProperty('droppedDie');
      expect(result.allDice).toHaveLength(3);
      expect(result.keptDice).toHaveLength(2);
      
      // Verify the dropped die is indeed the lowest
      const sortedDice = [...result.allDice].sort((a, b) => a - b);
      expect(result.droppedDie).toBe(sortedDice[0]);
      
      // Verify total is sum of kept dice
      expect(result.total).toBe(result.keptDice.reduce((sum, die) => sum + die, 0));
    });
  });

  describe('rollWithModifier', () => {
    test('applies modifier correctly', () => {
      Math.random = jest.fn()
        .mockReturnValueOnce(0.5) // First die: 4
        .mockReturnValueOnce(0.5); // Second die: 4
      
      const result = rollWithModifier(3);
      
      expect(result.baseRoll).toBe(8); // 4 + 4
      expect(result.modifier).toBe(3);
      expect(result.total).toBe(11); // 8 + 3
      expect(result.dice).toEqual([4, 4]);
    });

    test('handles negative modifiers', () => {
      Math.random = jest.fn()
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.5);
      
      const result = rollWithModifier(-2);
      
      expect(result.total).toBe(6); // 8 - 2
      expect(result.modifier).toBe(-2);
    });
  });

  describe('checkSuccess', () => {
    test('identifies success correctly', () => {
      const result = checkSuccess(10, 8);
      
      expect(result.success).toBe(true);
      expect(result.roll).toBe(10);
      expect(result.target).toBe(8);
      expect(result.margin).toBe(2);
    });

    test('identifies failure correctly', () => {
      const result = checkSuccess(6, 8);
      
      expect(result.success).toBe(false);
      expect(result.margin).toBe(-2);
    });

    test('handles exact success', () => {
      const result = checkSuccess(8, 8);
      
      expect(result.success).toBe(true);
      expect(result.margin).toBe(0);
    });
  });

  describe('makeSkillCheck', () => {
    test('calculates skill check correctly', () => {
      Math.random = jest.fn()
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.5);
      
      const result = makeSkillCheck(12, 2, 8, 0);
      
      // Attribute DM: (12-6)/3 = 2
      // Total DM: 2 (attribute) + 2 (skill) + 0 (additional) + 0 (no unskilled penalty) = 4
      // Roll: 8 + 4 = 12 vs 8 = SUCCESS
      expect(result.success).toBe(true);
      expect(result.attributeDM).toBe(2);
      expect(result.skillLevel).toBe(2);
      expect(result.unskilledPenalty).toBe(0);
      expect(result.totalDM).toBe(4);
    });

    test('applies unskilled penalty', () => {
      Math.random = jest.fn()
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.5);
      
      const result = makeSkillCheck(12, 0, 8, 0);
      
      // Total DM: 2 (attribute) + 0 (skill) + 0 (additional) - 3 (unskilled) = -1
      // Roll: 8 - 1 = 7 vs 8 = FAILURE
      expect(result.success).toBe(false);
      expect(result.unskilledPenalty).toBe(-3);
      expect(result.totalDM).toBe(-1);
    });
  });

  describe('generateAttributes2d6', () => {
    test('generates all six attributes', () => {
      const result = generateAttributes2d6();
      
      expect(result).toHaveProperty('STR');
      expect(result).toHaveProperty('DEX');
      expect(result).toHaveProperty('END');
      expect(result).toHaveProperty('INT');
      expect(result).toHaveProperty('EDU');
      expect(result).toHaveProperty('SOC');
      
      // Each attribute should be between 2 and 12
      Object.values(result).forEach(attr => {
        expect(attr).toBeGreaterThanOrEqual(2);
        expect(attr).toBeLessThanOrEqual(12);
      });
    });
  });

  describe('rollDiceNotation', () => {
    test('parses 2d6 correctly', () => {
      Math.random = jest.fn()
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.8);
      
      const result = rollDiceNotation('2d6');
      
      expect(result.total).toBe(9); // 4 + 5
      expect(result.dice).toEqual([4, 5]);
      expect(result.notation).toBe('2d6');
      expect(result.modifier).toBe(0);
    });

    test('handles modifiers', () => {
      Math.random = jest.fn()
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.5);
      
      const result = rollDiceNotation('2d6+3');
      
      expect(result.baseTotal).toBe(8);
      expect(result.modifier).toBe(3);
      expect(result.total).toBe(11);
    });

    test('throws error for invalid notation', () => {
      expect(() => rollDiceNotation('invalid')).toThrow('Invalid dice notation: invalid');
    });
  });
});