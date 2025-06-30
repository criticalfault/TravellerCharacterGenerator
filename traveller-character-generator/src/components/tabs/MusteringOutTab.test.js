import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MusteringOutTab from './MusteringOutTab';
import * as gameMechanics from '../../utils/gameMechanics';

// Mock the game mechanics module
jest.mock('../../utils/gameMechanics');

// Mock career data
jest.mock('../../data/careers.json', () => ({
  agent: {
    muster_out_benefits: {
      cash: {
        1: 1000,
        2: 2000,
        3: 5000,
        4: 7500,
        5: 10000,
        6: 25000,
        7: 50000
      },
      benefits: {
        1: "Scientific Equipment",
        2: "INT +1",
        3: "Ship Share",
        4: "Weapon",
        5: "Cybernetic Implant",
        6: ["SOC +1", "Cybernetic Implant"],
        7: "TAS Membership"
      }
    }
  }
}), { virtual: true });

// Mock the useCharacter hook
jest.mock('../../context/CharacterContext', () => ({
  useCharacter: jest.fn()
}));

const { useCharacter } = require('../../context/CharacterContext');

describe('MusteringOutTab', () => {
  const mockDispatch = jest.fn();
  const CHARACTER_ACTIONS = {
    UPDATE_MONEY: 'UPDATE_MONEY',
    UPDATE_ATTRIBUTE: 'UPDATE_ATTRIBUTE',
    ADD_BENEFIT_ROLLS: 'ADD_BENEFIT_ROLLS',
    ADD_CONTACT: 'ADD_CONTACT',
    ADD_GEAR: 'ADD_GEAR',
    ADD_CYBERWARE: 'ADD_CYBERWARE'
  };

  const defaultCharacter = {
    name: "Test Character",
    age: 30,
    attributes: { STR: 8, DEX: 7, END: 9, INT: 10, EDU: 8, SOC: 6 },
    skills: {},
    careerHistory: [
      {
        career: "Agent",
        assignment: "Law Enforcement",
        terms: 2,
        rank: 3,
        rankTitle: "Detective",
        events: []
      }
    ],
    contacts: [],
    allies: [],
    enemies: [],
    rivals: [],
    gear: [],
    cyberware: [],
    money: 5000,
    benefitRolls: 3,
    tempModifiers: { benefitDM: 0 }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCharacter.mockReturnValue({
      character: defaultCharacter,
      dispatch: mockDispatch,
      CHARACTER_ACTIONS
    });
  });

  test('renders mustering out tab with benefit rolls available', () => {
    render(<MusteringOutTab />);

    expect(screen.getByText('Mustering Out')).toBeInTheDocument();
    expect(screen.getByText('Benefit Rolls Available: 3')).toBeInTheDocument();
    expect(screen.getByText('Agent (Law Enforcement)')).toBeInTheDocument();
    expect(screen.getByText('Terms: 2, Rank: 3 (Detective)')).toBeInTheDocument();
  });

  test('displays current benefits correctly', () => {
    const characterWithBenefits = {
      ...defaultCharacter,
      money: 15000,
      gear: ['Weapon', 'Scientific Equipment'],
      cyberware: ['Neural Interface'],
      contacts: ['Detective Smith'],
      allies: ['Captain Martinez']
    };

    useCharacter.mockReturnValue({
      character: characterWithBenefits,
      dispatch: mockDispatch,
      CHARACTER_ACTIONS
    });

    render(<MusteringOutTab />);

    expect(screen.getByText('15,000 Cr')).toBeInTheDocument();
    expect(screen.getByText('Weapon')).toBeInTheDocument();
    expect(screen.getByText('Scientific Equipment')).toBeInTheDocument();
    expect(screen.getByText('Neural Interface')).toBeInTheDocument();
    expect(screen.getByText(/Contacts:.*Detective Smith/)).toBeInTheDocument();
    expect(screen.getByText(/Allies:.*Captain Martinez/)).toBeInTheDocument();
  });

  test('calculates benefit DM correctly based on rank', () => {
    render(<MusteringOutTab />);

    // Rank 3 should give +1 DM (floor(3/2) = 1)
    expect(screen.getByText('Benefit DM: +1')).toBeInTheDocument();
  });

  test('handles cash benefit roll', () => {
    const mockRollResult = {
      roll: 8,
      clampedRoll: 6,
      benefit: 25000,
      isCash: true,
      dice: [4, 4],
      additionalDM: 1
    };

    gameMechanics.rollMusteringOutBenefit.mockReturnValue(mockRollResult);

    render(<MusteringOutTab />);

    const cashButton = screen.getByText('Roll for Cash');
    fireEvent.click(cashButton);

    expect(gameMechanics.rollMusteringOutBenefit).toHaveBeenCalledWith(
      expect.objectContaining({
        cash: expect.any(Object),
        benefits: expect.any(Object)
      }),
      true, // isCash
      1 // benefit DM
    );

    // Check roll history appears
    expect(screen.getByText('Benefit Roll History')).toBeInTheDocument();
    expect(screen.getByText(/Cash Roll.*Agent.*Rolled 8.*table: 6.*DM \+1.*25000/)).toBeInTheDocument();
  });

  test('shows no benefit rolls message when none available', () => {
    const characterWithNoBenefits = {
      ...defaultCharacter,
      benefitRolls: 0
    };

    useCharacter.mockReturnValue({
      character: characterWithNoBenefits,
      dispatch: mockDispatch,
      CHARACTER_ACTIONS
    });

    render(<MusteringOutTab />);

    expect(screen.getByText('No benefit rolls remaining.')).toBeInTheDocument();
    expect(screen.queryByText('Roll for Cash')).not.toBeInTheDocument();
    expect(screen.queryByText('Roll for Benefits')).not.toBeInTheDocument();
  });

  test('displays mustering out information', () => {
    render(<MusteringOutTab />);

    expect(screen.getByText('Mustering Out Information')).toBeInTheDocument();
    expect(screen.getByText('Cash Benefits:')).toBeInTheDocument();
    expect(screen.getByText('Material Benefits:')).toBeInTheDocument();
    expect(screen.getByText('Benefit DM:')).toBeInTheDocument();
  });
});