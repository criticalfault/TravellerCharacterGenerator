import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CharacterProvider } from '../../context/CharacterContext';
import CareerSelectionTab from './CareerSelectionTab';

// Mock the dice utilities
jest.mock('../../utils/dice', () => ({
  rollWithModifier: jest.fn(() => ({
    total: 8,
    baseRoll: 7,
    modifier: 1,
    dice: [3, 4],
    formatted: '8 (3, 4+1)'
  })),
  checkSuccess: jest.fn((roll, target) => ({
    success: roll >= target,
    roll,
    target,
    margin: roll - target
  }))
}));

const renderWithProvider = (component) => {
  return render(
    <CharacterProvider>
      {component}
    </CharacterProvider>
  );
};

describe('CareerSelectionTab', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Mock window.confirm
    window.confirm = jest.fn(() => false);
  });

  test('renders career selection interface', () => {
    renderWithProvider(<CareerSelectionTab />);
    
    expect(screen.getByText('Career Selection')).toBeInTheDocument();
    expect(screen.getByText(/Choose your first career path/)).toBeInTheDocument();
    expect(screen.getByText('Available Careers')).toBeInTheDocument();
  });

  test('displays career cards with qualification info', () => {
    renderWithProvider(<CareerSelectionTab />);
    
    // Should show career cards
    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getByText('Army')).toBeInTheDocument();
    expect(screen.getByText('Citizen')).toBeInTheDocument();
    
    // Should show qualification requirements
    expect(screen.getByText(/Qualification:/)).toBeInTheDocument();
    expect(screen.getByText(/Your modifier:/)).toBeInTheDocument();
  });

  test('can select a career', () => {
    renderWithProvider(<CareerSelectionTab />);
    
    // Click on Agent career
    const agentCard = screen.getByText('Agent').closest('.career-card');
    fireEvent.click(agentCard);
    
    // Should show assignment selection
    expect(screen.getByText('Select Assignment')).toBeInTheDocument();
    expect(screen.getByText(/Choose your specialization within the agent career/)).toBeInTheDocument();
  });

  test('shows assignment options when career is selected', () => {
    renderWithProvider(<CareerSelectionTab />);
    
    // Select Agent career
    const agentCard = screen.getByText('Agent').closest('.career-card');
    fireEvent.click(agentCard);
    
    // Should show assignment buttons in the assignment section
    const assignmentSection = screen.getByText('Select Assignment').closest('.assignment-selection');
    expect(assignmentSection.querySelector('button[class*="assignment-btn"]')).toBeInTheDocument();
    expect(screen.getByText('Choose your specialization within the agent career')).toBeInTheDocument();
  });

  test('can select assignment and shows qualification section', () => {
    renderWithProvider(<CareerSelectionTab />);
    
    // Select Agent career
    const agentCard = screen.getByText('Agent').closest('.career-card');
    fireEvent.click(agentCard);
    
    // Select Law Enforcement assignment from the assignment section
    const assignmentSection = screen.getByText('Select Assignment').closest('.assignment-selection');
    const lawEnforcementBtn = assignmentSection.querySelector('button');
    fireEvent.click(lawEnforcementBtn);
    
    // Should show qualification attempt section
    expect(screen.getByText('Qualification Attempt')).toBeInTheDocument();
    expect(screen.getByText('Attempt Qualification')).toBeInTheDocument();
  });

  test('displays qualification details correctly', () => {
    renderWithProvider(<CareerSelectionTab />);
    
    // Select Agent career and Law Enforcement assignment
    const agentCard = screen.getByText('Agent').closest('.career-card');
    fireEvent.click(agentCard);
    
    const assignmentSection = screen.getByText('Select Assignment').closest('.assignment-selection');
    const lawEnforcementBtn = assignmentSection.querySelector('button');
    fireEvent.click(lawEnforcementBtn);
    
    // Should show qualification details
    expect(screen.getByText(/Career:/)).toBeInTheDocument();
    expect(screen.getByText(/Assignment:/)).toBeInTheDocument();
    expect(screen.getByText(/Qualification Roll:/)).toBeInTheDocument();
    expect(screen.getByText(/Target Number:/)).toBeInTheDocument();
  });

  test('handles successful qualification', async () => {
    const { rollWithModifier, checkSuccess } = require('../../utils/dice');
    
    // Mock successful roll
    rollWithModifier.mockReturnValue({
      total: 10,
      baseRoll: 8,
      modifier: 2,
      dice: [4, 4],
      formatted: '10 (4, 4+2)'
    });
    
    checkSuccess.mockReturnValue({
      success: true,
      roll: 10,
      target: 6,
      margin: 4
    });

    renderWithProvider(<CareerSelectionTab />);
    
    // Select career and assignment
    const agentCard = screen.getByText('Agent').closest('.career-card');
    fireEvent.click(agentCard);
    
    const assignmentSection = screen.getByText('Select Assignment').closest('.assignment-selection');
    const lawEnforcementBtn = assignmentSection.querySelector('button');
    fireEvent.click(lawEnforcementBtn);
    
    // Attempt qualification
    const qualifyBtn = screen.getByText('Attempt Qualification');
    fireEvent.click(qualifyBtn);
    
    // Should show success result
    await waitFor(() => {
      expect(screen.getByText('Qualification Successful!')).toBeInTheDocument();
      expect(screen.getByText('Career Started')).toBeInTheDocument();
    });
  });

  test('handles failed qualification', async () => {
    const { rollWithModifier, checkSuccess } = require('../../utils/dice');
    
    // Mock failed roll
    rollWithModifier.mockReturnValue({
      total: 4,
      baseRoll: 5,
      modifier: -1,
      dice: [2, 3],
      formatted: '4 (2, 3-1)'
    });
    
    checkSuccess.mockReturnValue({
      success: false,
      roll: 4,
      target: 6,
      margin: -2
    });

    renderWithProvider(<CareerSelectionTab />);
    
    // Select career and assignment
    const agentCard = screen.getByText('Agent').closest('.career-card');
    fireEvent.click(agentCard);
    
    const assignmentSection = screen.getByText('Select Assignment').closest('.assignment-selection');
    const lawEnforcementBtn = assignmentSection.querySelector('button');
    fireEvent.click(lawEnforcementBtn);
    
    // Attempt qualification
    const qualifyBtn = screen.getByText('Attempt Qualification');
    fireEvent.click(qualifyBtn);
    
    // Should show failure result
    await waitFor(() => {
      expect(screen.getByText('Qualification Failed')).toBeInTheDocument();
    });
    
    // Should prompt for Drifter option
    expect(window.confirm).toHaveBeenCalledWith(
      'Qualification failed! You can become a Drifter or try a different career. Become a Drifter?'
    );
  });

  test('shows commission opportunity for military careers', async () => {
    const { rollWithModifier, checkSuccess } = require('../../utils/dice');
    
    // Mock successful qualification
    rollWithModifier.mockReturnValue({
      total: 8,
      baseRoll: 7,
      modifier: 1,
      dice: [3, 4],
      formatted: '8 (3, 4+1)'
    });
    
    checkSuccess.mockReturnValue({
      success: true,
      roll: 8,
      target: 5,
      margin: 3
    });

    renderWithProvider(<CareerSelectionTab />);
    
    // Select Army career (has commission)
    const armyCard = screen.getByText('Army').closest('.career-card');
    fireEvent.click(armyCard);
    
    const assignmentSection = screen.getByText('Select Assignment').closest('.assignment-selection');
    const supportBtn = assignmentSection.querySelector('button');
    fireEvent.click(supportBtn);
    
    // Attempt qualification
    const qualifyBtn = screen.getByText('Attempt Qualification');
    fireEvent.click(qualifyBtn);
    
    // Should show qualification success first
    await waitFor(() => {
      expect(screen.getByText('Qualification Successful!')).toBeInTheDocument();
    });
    
    // Then should show commission opportunity
    await waitFor(() => {
      expect(screen.getByText('Commission Opportunity')).toBeInTheDocument();
      expect(screen.getByText('Attempt Commission')).toBeInTheDocument();
      expect(screen.getByText('Remain Enlisted')).toBeInTheDocument();
    });
  });

  test('can decline commission and remain enlisted', async () => {
    const { rollWithModifier, checkSuccess } = require('../../utils/dice');
    
    // Mock successful qualification
    rollWithModifier.mockReturnValue({
      total: 8,
      baseRoll: 7,
      modifier: 1,
      dice: [3, 4],
      formatted: '8 (3, 4+1)'
    });
    
    checkSuccess.mockReturnValue({
      success: true,
      roll: 8,
      target: 5,
      margin: 3
    });

    renderWithProvider(<CareerSelectionTab />);
    
    // Select Army career and qualify
    const armyCard = screen.getByText('Army').closest('.career-card');
    fireEvent.click(armyCard);
    
    const assignmentSection = screen.getByText('Select Assignment').closest('.assignment-selection');
    const supportBtn = assignmentSection.querySelector('button');
    fireEvent.click(supportBtn);
    
    const qualifyBtn = screen.getByText('Attempt Qualification');
    fireEvent.click(qualifyBtn);
    
    // Wait for qualification success and commission opportunity
    await waitFor(() => {
      expect(screen.getByText('Commission Opportunity')).toBeInTheDocument();
    });
    
    // Decline commission
    const remainEnlistedBtn = screen.getByText('Remain Enlisted');
    fireEvent.click(remainEnlistedBtn);
    
    // Should show enlisted status
    await waitFor(() => {
      expect(screen.getByText('You chose to remain in the enlisted ranks.')).toBeInTheDocument();
    });
  });

  test('displays career information section', () => {
    renderWithProvider(<CareerSelectionTab />);
    
    expect(screen.getByText('Career Information')).toBeInTheDocument();
    expect(screen.getByText(/Each career offers different skills/)).toBeInTheDocument();
    expect(screen.getByText(/If you fail qualification/)).toBeInTheDocument();
  });

  test('resets state when selecting different career', () => {
    renderWithProvider(<CareerSelectionTab />);
    
    // Select Agent career and assignment
    const agentCard = screen.getByText('Agent').closest('.career-card');
    fireEvent.click(agentCard);
    
    const assignmentSection = screen.getByText('Select Assignment').closest('.assignment-selection');
    const lawEnforcementBtn = assignmentSection.querySelector('button');
    fireEvent.click(lawEnforcementBtn);
    
    // Should show qualification section
    expect(screen.getByText('Qualification Attempt')).toBeInTheDocument();
    
    // Select different career
    const armyCard = screen.getByText('Army').closest('.career-card');
    fireEvent.click(armyCard);
    
    // Should reset and not show qualification section
    expect(screen.queryByText('Qualification Attempt')).not.toBeInTheDocument();
    expect(screen.getByText('Select Assignment')).toBeInTheDocument();
  });
});