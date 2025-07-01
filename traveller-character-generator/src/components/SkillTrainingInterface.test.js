import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkillTrainingInterface from './SkillTrainingInterface';
import { CharacterProvider } from '../context/CharacterContext';

import {
  getAvailableSkillTables,
  rollOnSkillTable,
  applySkillTraining,
  getFormattedSkills,
  validateSkillTrainingPrerequisites,
} from '../utils/skillTraining';

// Mock the skill training utilities
jest.mock('../utils/skillTraining', () => ({
  getAvailableSkillTables: jest.fn(),
  rollOnSkillTable: jest.fn(),
  applySkillTraining: jest.fn(),
  handleSkillChoice: jest.fn(),
  getFormattedSkills: jest.fn(),
  validateSkillTrainingPrerequisites: jest.fn(),
}));

const mockCareer = {
  skills_and_training: {
    personal_development: {
      1: 'STR +1',
      2: 'DEX +1',
      3: 'Gun Combat',
      4: 'Melee',
      5: 'Athletics',
      6: 'END +1',
    },
    service_skills: {
      1: 'Drive',
      2: 'Electronics',
      3: 'Gun Combat',
      4: 'Investigate',
      5: 'Recon',
      6: 'Streetwise',
    },
  },
};

const mockTables = [
  {
    name: 'Personal Development',
    key: 'personal_development',
    skills: mockCareer.skills_and_training.personal_development,
    description: 'Basic personal improvement skills',
  },
  {
    name: 'Service Skills',
    key: 'service_skills',
    skills: mockCareer.skills_and_training.service_skills,
    description: 'Core skills for your career',
  },
];

const renderWithProvider = component => {
  return render(<CharacterProvider>{component}</CharacterProvider>);
};

describe('SkillTrainingInterface', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    validateSkillTrainingPrerequisites.mockReturnValue({
      valid: true,
      issues: [],
    });

    getAvailableSkillTables.mockReturnValue(mockTables);

    getFormattedSkills.mockReturnValue([
      {
        name: 'Gun Combat',
        level: 1,
        modifier: 0,
        displayName: 'Gun Combat 1',
      },
      {
        name: 'Electronics',
        level: 2,
        modifier: 0,
        displayName: 'Electronics 2',
      },
    ]);
  });

  test('renders skill training interface', () => {
    renderWithProvider(
      <SkillTrainingInterface
        career={mockCareer}
        assignment="Law Enforcement"
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Skill Training')).toBeInTheDocument();
    expect(
      screen.getByText('Select a skill table to roll for training this term.')
    ).toBeInTheDocument();
  });

  test('displays available skill tables', () => {
    renderWithProvider(
      <SkillTrainingInterface
        career={mockCareer}
        assignment="Law Enforcement"
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Personal Development')).toBeInTheDocument();
    expect(screen.getByText('Service Skills')).toBeInTheDocument();
    expect(
      screen.getByText('Basic personal improvement skills')
    ).toBeInTheDocument();
    expect(screen.getByText('Core skills for your career')).toBeInTheDocument();
  });

  test('shows table contents preview', () => {
    renderWithProvider(
      <SkillTrainingInterface
        career={mockCareer}
        assignment="Law Enforcement"
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getAllByText('Skills Available:')).toHaveLength(2); // One for each table
    expect(screen.getByText('1: STR +1')).toBeInTheDocument();
    expect(screen.getAllByText('3: Gun Combat')).toHaveLength(2); // Appears in both tables
  });

  test('allows table selection', () => {
    renderWithProvider(
      <SkillTrainingInterface
        career={mockCareer}
        assignment="Law Enforcement"
        onComplete={mockOnComplete}
      />
    );

    const personalDevTable = screen
      .getByText('Personal Development')
      .closest('.table-option');
    fireEvent.click(personalDevTable);

    expect(personalDevTable).toHaveClass('selected');
    expect(
      screen.getByText('Selected: Personal Development')
    ).toBeInTheDocument();
    expect(screen.getByText('Roll for Training (1d6)')).toBeInTheDocument();
  });

  test('handles skill training roll with direct result', async () => {
    const mockResult = {
      roll: 7,
      table: 'Personal Development',
      tableKey: 'personal_development',
      skillEntry: 'Gun Combat',
      skills: {
        type: 'skill',
        skills: [
          {
            name: 'Gun Combat',
            level: 1,
            isAttribute: false,
            displayName: 'Gun Combat 1',
          },
        ],
      },
    };

    rollOnSkillTable.mockReturnValue(mockResult);

    renderWithProvider(
      <SkillTrainingInterface
        career={mockCareer}
        assignment="Law Enforcement"
        onComplete={mockOnComplete}
      />
    );

    // Select table and roll
    const personalDevTable = screen
      .getByText('Personal Development')
      .closest('.table-option');
    fireEvent.click(personalDevTable);

    const rollButton = screen.getByText('Roll for Training (1d6)');
    fireEvent.click(rollButton);

    await waitFor(() => {
      expect(screen.getByText('Training Result')).toBeInTheDocument();
      expect(screen.getByText('7 on 1d6')).toBeInTheDocument();
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === 'Result: Gun Combat';
        })
      ).toBeInTheDocument();
    });

    expect(applySkillTraining).toHaveBeenCalled();
  });

  test('handles skill training roll with choice', async () => {
    const mockResult = {
      roll: 6,
      table: 'Service Skills',
      tableKey: 'service_skills',
      skillEntry: ['Pilot', 'Flyer'],
      skills: {
        type: 'choice',
        options: [
          {
            name: 'Pilot',
            level: 1,
            isAttribute: false,
            displayName: 'Pilot 1',
          },
          {
            name: 'Flyer',
            level: 1,
            isAttribute: false,
            displayName: 'Flyer 1',
          },
        ],
      },
    };

    rollOnSkillTable.mockReturnValue(mockResult);

    renderWithProvider(
      <SkillTrainingInterface
        career={mockCareer}
        assignment="Law Enforcement"
        onComplete={mockOnComplete}
      />
    );

    // Select table and roll
    const serviceTable = screen
      .getByText('Service Skills')
      .closest('.table-option');
    fireEvent.click(serviceTable);

    const rollButton = screen.getByText('Roll for Training (1d6)');
    fireEvent.click(rollButton);

    await waitFor(() => {
      expect(screen.getByText('Make Your Choice')).toBeInTheDocument();
      expect(screen.getByText('Pilot 1')).toBeInTheDocument();
      expect(screen.getByText('Flyer 1')).toBeInTheDocument();
    });

    // Make choice
    const pilotButton = screen.getByText('Pilot 1');
    fireEvent.click(pilotButton);

    await waitFor(() => {
      expect(screen.getByText('✅ Training Complete')).toBeInTheDocument();
    });
  });

  test('displays current character skills', () => {
    renderWithProvider(
      <SkillTrainingInterface
        career={mockCareer}
        assignment="Law Enforcement"
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Current Skills')).toBeInTheDocument();
    expect(screen.getByText('Gun Combat')).toBeInTheDocument();
    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Level 2')).toBeInTheDocument();
  });

  test('shows help section', () => {
    renderWithProvider(
      <SkillTrainingInterface
        career={mockCareer}
        assignment="Law Enforcement"
        onComplete={mockOnComplete}
      />
    );

    const helpSection = screen.getByText('Skill System Help');
    expect(helpSection).toBeInTheDocument();

    // Click to expand help
    fireEvent.click(helpSection);

    expect(screen.getByText('How Skill Training Works:')).toBeInTheDocument();
    expect(screen.getByText('Personal Development:')).toBeInTheDocument();
  });

  test('handles validation errors', () => {
    validateSkillTrainingPrerequisites.mockReturnValue({
      valid: false,
      issues: ['No active career', 'Career data not found'],
    });

    renderWithProvider(
      <SkillTrainingInterface
        career={null}
        assignment="Law Enforcement"
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Skill Training - Error')).toBeInTheDocument();
    expect(
      screen.getByText('Cannot proceed with skill training:')
    ).toBeInTheDocument();
    expect(screen.getByText('No active career')).toBeInTheDocument();
    expect(screen.getByText('Career data not found')).toBeInTheDocument();
  });

  test('calls onComplete when training is finished', async () => {
    const mockResult = {
      roll: 7,
      table: 'Personal Development',
      tableKey: 'personal_development',
      skillEntry: 'Gun Combat',
      skills: {
        type: 'skill',
        skills: [
          {
            name: 'Gun Combat',
            level: 1,
            isAttribute: false,
            displayName: 'Gun Combat 1',
          },
        ],
      },
    };

    rollOnSkillTable.mockReturnValue(mockResult);

    renderWithProvider(
      <SkillTrainingInterface
        career={mockCareer}
        assignment="Law Enforcement"
        onComplete={mockOnComplete}
      />
    );

    // Complete training process
    const personalDevTable = screen
      .getByText('Personal Development')
      .closest('.table-option');
    fireEvent.click(personalDevTable);

    const rollButton = screen.getByText('Roll for Training (1d6)');
    fireEvent.click(rollButton);

    await waitFor(() => {
      const continueButton = screen.getByText('Continue Career Progression');
      fireEvent.click(continueButton);
    });

    expect(mockOnComplete).toHaveBeenCalledWith({
      table: 'Personal Development',
      result: mockResult,
      completed: true,
    });
  });

  test('allows training reset', async () => {
    const mockResult = {
      roll: 7,
      table: 'Personal Development',
      tableKey: 'personal_development',
      skillEntry: 'Gun Combat',
      skills: {
        type: 'skill',
        skills: [
          {
            name: 'Gun Combat',
            level: 1,
            isAttribute: false,
            displayName: 'Gun Combat 1',
          },
        ],
      },
    };

    rollOnSkillTable.mockReturnValue(mockResult);

    renderWithProvider(
      <SkillTrainingInterface
        career={mockCareer}
        assignment="Law Enforcement"
        onComplete={mockOnComplete}
      />
    );

    // Complete training process
    const personalDevTable = screen
      .getByText('Personal Development')
      .closest('.table-option');
    fireEvent.click(personalDevTable);

    const rollButton = screen.getByText('Roll for Training (1d6)');
    fireEvent.click(rollButton);

    await waitFor(() => {
      const resetButton = screen.getByText('Train Again (if allowed)');
      fireEvent.click(resetButton);
    });

    // Should reset to initial state
    expect(
      screen.getByText('Select a skill table to roll for training this term.')
    ).toBeInTheDocument();
    expect(screen.queryByText('✅ Training Complete')).not.toBeInTheDocument();
  });

  test('displays no skills message for new character', () => {
    getFormattedSkills.mockReturnValue([]);

    renderWithProvider(
      <SkillTrainingInterface
        career={mockCareer}
        assignment="Law Enforcement"
        onComplete={mockOnComplete}
      />
    );

    expect(
      screen.getByText(
        'No skills yet. Complete training to gain your first skills!'
      )
    ).toBeInTheDocument();
  });
});
