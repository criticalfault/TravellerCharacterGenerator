import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MusteringOutTab from './MusteringOutTab';
import { CharacterProvider } from '../../context/CharacterContext';

// Mock data
const mockCharacterWithCareers = {
  name: 'Test Character',
  age: 30,
  species: 'Human',
  attributes: {
    STR: 8,
    DEX: 9,
    END: 7,
    INT: 10,
    EDU: 11,
    SOC: 8,
    PSI: 0,
  },
  skills: {
    Gamble: 1, // Should provide +1 DM to cash rolls
  },
  careerHistory: [
    {
      career: 'Navy',
      assignment: 'Line/Crew',
      terms: 3,
      rank: 5, // Should provide +1 DM to all benefit rolls
      rankTitle: 'Commander',
      events: [],
    },
    {
      career: 'Merchant',
      assignment: 'Merchant Marine',
      terms: 2,
      rank: 2,
      rankTitle: 'Senior Crewman',
      events: [],
    }
  ],
  contacts: [],
  allies: [],
  enemies: [],
  rivals: [],
  gear: [],
  cyberware: [],
  money: 5000,
};

// Mock the context with test data
const MockCharacterProvider = ({ children, character = mockCharacterWithCareers }) => {
  const mockDispatch = jest.fn();
  const mockValue = {
    character,
    dispatch: mockDispatch,
    CHARACTER_ACTIONS: {
      UPDATE_MONEY: 'UPDATE_MONEY',
      ADD_CONTACT: 'ADD_CONTACT',
      ADD_ALLY: 'ADD_ALLY',
      UPDATE_ATTRIBUTE: 'UPDATE_ATTRIBUTE',
      ADD_GEAR: 'ADD_GEAR',
      ADD_CYBERWARE: 'ADD_CYBERWARE',
    },
  };

  return (
    <div data-testid="mock-provider">
      {React.cloneElement(children, { mockValue })}
    </div>
  );
};

// Mock the dice utility
jest.mock('../../utils/dice', () => ({
  rollWithModifier: jest.fn(() => ({
    total: 8,
    baseRoll: 7,
    modifier: 1,
    dice: [3, 4],
    formatted: '8 (3, 4+1)',
  })),
}));

describe('MusteringOutTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProvider = (character = mockCharacterWithCareers) => {
    return render(
      <CharacterProvider>
        <MusteringOutTab />
      </CharacterProvider>
    );
  };

  test('renders mustering out interface', () => {
    renderWithProvider();
    
    expect(screen.getByText('Mustering Out')).toBeInTheDocument();
    expect(screen.getByText('Benefit Rolls Available')).toBeInTheDocument();
    expect(screen.getByText('Make Benefit Rolls')).toBeInTheDocument();
  });

  test('calculates benefit rolls correctly', () => {
    renderWithProvider();
    
    // Navy: 3 terms + 3 rank bonus rolls (rank 5 = ceil(5/2) = 3) = 6 rolls
    // Merchant: 2 terms + 1 rank bonus roll (rank 2 = ceil(2/2) = 1) = 3 rolls
    // Total: 9 rolls
    expect(screen.getByText(/Total Rolls: 9/)).toBeInTheDocument();
  });

  test('shows rank 5 bonus indicator', () => {
    renderWithProvider();
    
    expect(screen.getByText('✓ Rank 5+ Bonus: +1 DM to all benefit rolls')).toBeInTheDocument();
  });

  test('shows gamble skill bonus indicator', () => {
    renderWithProvider();
    
    expect(screen.getByText('✓ Gamble Skill Bonus: +1 DM to cash benefit rolls')).toBeInTheDocument();
  });

  test('displays career breakdown correctly', () => {
    renderWithProvider();
    
    expect(screen.getByText('Navy (Line/Crew)')).toBeInTheDocument();
    expect(screen.getByText('Merchant (Merchant Marine)')).toBeInTheDocument();
    expect(screen.getByText('Terms: 3 (×1 = 3 rolls)')).toBeInTheDocument();
    expect(screen.getByText('Rank 5: +3 bonus rolls')).toBeInTheDocument();
  });

  test('shows benefit roll buttons', () => {
    renderWithProvider();
    
    const rollButtons = screen.getAllByText('Make Roll');
    expect(rollButtons).toHaveLength(9); // Should have 9 roll buttons
  });

  test('opens benefit choice modal when roll button clicked', async () => {
    renderWithProvider();
    
    const firstRollButton = screen.getAllByText('Make Roll')[0];
    fireEvent.click(firstRollButton);
    
    await waitFor(() => {
      expect(screen.getByText('Choose Benefit Type')).toBeInTheDocument();
      expect(screen.getByText('Cash Benefits')).toBeInTheDocument();
      expect(screen.getByText('Other Benefits')).toBeInTheDocument();
    });
  });

  test('tracks cash benefit limit', async () => {
    renderWithProvider();
    
    expect(screen.getByText('Cash Benefits Used: 0/3')).toBeInTheDocument();
  });

  test('displays current character status', () => {
    renderWithProvider();
    
    expect(screen.getByText('Current Character Status')).toBeInTheDocument();
    expect(screen.getByText('5,000 Cr')).toBeInTheDocument();
    expect(screen.getByText('Credits')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('Cyberware')).toBeInTheDocument();
    expect(screen.getByText('Contacts & Relationships')).toBeInTheDocument();
  });

  test('handles character with no careers', () => {
    const characterNoCareers = {
      ...mockCharacterWithCareers,
      careerHistory: []
    };
    
    renderWithProvider(characterNoCareers);
    
    expect(screen.getByText(/Total Rolls: 0/)).toBeInTheDocument();
  });

  test('handles character without gamble skill', () => {
    const characterNoGamble = {
      ...mockCharacterWithCareers,
      skills: {}
    };
    
    renderWithProvider(characterNoGamble);
    
    expect(screen.queryByText('✓ Gamble Skill Bonus')).not.toBeInTheDocument();
  });

  test('handles character without rank 5', () => {
    const characterNoRank5 = {
      ...mockCharacterWithCareers,
      careerHistory: [
        {
          career: 'Navy',
          assignment: 'Line/Crew',
          terms: 2,
          rank: 3,
          rankTitle: 'Lieutenant',
          events: [],
        }
      ]
    };
    
    renderWithProvider(characterNoRank5);
    
    expect(screen.queryByText('✓ Rank 5+ Bonus')).not.toBeInTheDocument();
  });
});