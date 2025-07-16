import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PreCareerEducationTab from './PreCareerEducationTab';
import { CharacterProvider } from '../../context/CharacterContext';

// Mock data
const mockCharacterEarlyTerm = {
  name: 'Test Character',
  age: 18,
  species: 'Human',
  attributes: {
    STR: 8,
    DEX: 9,
    END: 8,
    INT: 10,
    EDU: 9,
    SOC: 10,
    PSI: 0,
  },
  skills: {},
  careerHistory: [],
  currentTerm: 0, // Early enough for pre-career education
  preCareerEducation: null,
  preCareerEducationCompleted: false,
  preCareerSkillsChosen: [],
  preCareerGraduated: false,
  preCareerHonors: false,
};

const mockCharacterLateTerm = {
  ...mockCharacterEarlyTerm,
  currentTerm: 4, // Too late for pre-career education
};

// Mock dice utilities
jest.mock('../../utils/dice', () => ({
  rollWithModifier: jest.fn(() => ({
    total: 8,
    baseRoll: 7,
    modifier: 1,
    dice: [3, 4],
    formatted: '8 (3, 4+1)',
  })),
  roll2d6: jest.fn(() => ({
    total: 7,
    dice: [3, 4],
  })),
  roll1d6: jest.fn(() => ({
    total: 4,
    dice: [4],
  })),
  roll1d3: jest.fn(() => ({
    total: 2,
    dice: [2],
  })),
}));

describe('PreCareerEducationTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProvider = (character = mockCharacterEarlyTerm) => {
    return render(
      <CharacterProvider>
        <PreCareerEducationTab />
      </CharacterProvider>
    );
  };

  test('renders pre-career education options for early terms', () => {
    renderWithProvider();
    
    expect(screen.getByText('Pre-Career Education')).toBeInTheDocument();
    expect(screen.getByText('Choose Your Education Path')).toBeInTheDocument();
    expect(screen.getByText('University')).toBeInTheDocument();
    expect(screen.getByText('Military Academy')).toBeInTheDocument();
  });

  test('shows unavailable message for late terms', () => {
    renderWithProvider(mockCharacterLateTerm);
    
    expect(screen.getByText('Pre-career education is no longer available.')).toBeInTheDocument();
    expect(screen.getByText(/only be pursued in terms 1-3/)).toBeInTheDocument();
  });

  test('displays university requirements correctly', () => {
    renderWithProvider();
    
    expect(screen.getByText(/Entry Requirement.*EDU 6\+/)).toBeInTheDocument();
    expect(screen.getByText(/Your EDU.*9/)).toBeInTheDocument();
    expect(screen.getByText(/SOC 9\+.*✓/)).toBeInTheDocument(); // Character has SOC 10
  });

  test('displays military academy options', () => {
    renderWithProvider();
    
    expect(screen.getByText('Army Academy')).toBeInTheDocument();
    expect(screen.getByText('Marine Academy')).toBeInTheDocument();
    expect(screen.getByText('Naval Academy')).toBeInTheDocument();
  });

  test('shows correct entry requirements for military academies', () => {
    renderWithProvider();
    
    // Army Academy - END 7+
    expect(screen.getByText(/Entry.*END 7\+/)).toBeInTheDocument();
    // Marines Academy - END 8+  
    expect(screen.getByText(/Entry.*END 8\+/)).toBeInTheDocument();
    // Naval Academy - INT 8+
    expect(screen.getByText(/Entry.*INT 8\+/)).toBeInTheDocument();
  });

  test('handles university selection', async () => {
    renderWithProvider();
    
    const universityButton = screen.getByText('Choose University');
    fireEvent.click(universityButton);
    
    await waitFor(() => {
      expect(screen.getByText('Entry Roll')).toBeInTheDocument();
      expect(screen.getByText('Attempting to enter University')).toBeInTheDocument();
    });
  });

  test('handles military academy selection', async () => {
    renderWithProvider();
    
    const armyButton = screen.getByText('Choose Army Academy');
    fireEvent.click(armyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Entry Roll')).toBeInTheDocument();
      expect(screen.getByText('Attempting to enter army Military Academy')).toBeInTheDocument();
    });
  });

  test('calculates entry modifiers correctly', () => {
    renderWithProvider();
    
    // University should show positive modifier due to SOC 10
    const universitySection = screen.getByText('University').closest('.education-option');
    expect(universitySection).toHaveTextContent('Total DM: 1'); // SOC 9+ gives +1
  });

  test('shows current term and age information', () => {
    renderWithProvider();
    
    expect(screen.getByText(/Current Term.*1/)).toBeInTheDocument(); // currentTerm 0 displays as 1
    expect(screen.getByText(/Age.*18/)).toBeInTheDocument();
  });

  test('handles completed education state', () => {
    const completedCharacter = {
      ...mockCharacterEarlyTerm,
      preCareerEducationCompleted: true,
      preCareerEducation: 'university',
      preCareerGraduated: true,
      preCareerHonors: true,
      preCareerSkillsChosen: ['Science', 'Electronics'],
    };
    
    renderWithProvider(completedCharacter);
    
    expect(screen.getByText('Pre-Career Education Complete')).toBeInTheDocument();
    expect(screen.getByText(/Type.*University/)).toBeInTheDocument();
    expect(screen.getByText(/Graduated.*Yes \(with Honors\)/)).toBeInTheDocument();
    expect(screen.getByText(/Skills Gained.*Science, Electronics/)).toBeInTheDocument();
  });

  test('shows education unavailable for characters who already completed it', () => {
    const completedCharacter = {
      ...mockCharacterEarlyTerm,
      preCareerEducationCompleted: true,
    };
    
    renderWithProvider(completedCharacter);
    
    expect(screen.getByText('Pre-career education is no longer available.')).toBeInTheDocument();
  });

  test('displays term penalties correctly', () => {
    const term2Character = {
      ...mockCharacterEarlyTerm,
      currentTerm: 1, // This would be term 2
    };
    
    renderWithProvider(term2Character);
    
    // Should show DM-1 penalty for university in term 2
    expect(screen.getByText(/Term 2: DM-1/)).toBeInTheDocument();
  });

  test('handles attribute requirements display', () => {
    renderWithProvider();
    
    // Check that character attributes are displayed
    expect(screen.getByText(/Your EDU.*9/)).toBeInTheDocument();
    expect(screen.getByText(/Your END.*8/)).toBeInTheDocument();
    expect(screen.getByText(/Your INT.*10/)).toBeInTheDocument();
  });

  test('shows service skills for military academies', () => {
    renderWithProvider();
    
    // The service skills should be mentioned in the data structure
    // This tests that the component can access the military academy data
    const armySection = screen.getByText('Army Academy').closest('.academy-type');
    expect(armySection).toBeInTheDocument();
  });
});