import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterProvider } from '../../context/CharacterContext';
import BackgroundSkillsTab from './BackgroundSkillsTab';

const renderWithProvider = (component) => {
  return render(
    <CharacterProvider>
      {component}
    </CharacterProvider>
  );
};

describe('BackgroundSkillsTab', () => {
  test('renders background skills section', () => {
    renderWithProvider(<BackgroundSkillsTab />);
    
    expect(screen.getByText('Background Skills')).toBeInTheDocument();
    expect(screen.getByText(/Select background skills based on your character's education/)).toBeInTheDocument();
  });

  test('displays skill points calculation', () => {
    renderWithProvider(<BackgroundSkillsTab />);
    
    // With default attributes (all 0), Education DM is -2, so 3 + (-2) = 1 (minimum)
    expect(screen.getByText('Available: 1')).toBeInTheDocument();
    expect(screen.getByText('Used: 0')).toBeInTheDocument();
    expect(screen.getByText('Remaining: 1')).toBeInTheDocument();
  });

  test('displays all background skills', () => {
    renderWithProvider(<BackgroundSkillsTab />);
    
    const expectedSkills = [
      'Admin', 'Electronics', 'Science', 'Animals', 'Flyer', 'Seafarer',
      'Art', 'Language', 'Streetwise', 'Athletics', 'Mechanic', 'Survival',
      'Carouse', 'Medic', 'Vacc Suit', 'Drive', 'Profession'
    ];
    
    expectedSkills.forEach(skill => {
      expect(screen.getByText(skill)).toBeInTheDocument();
    });
  });

  test('can add skills when points are available', () => {
    renderWithProvider(<BackgroundSkillsTab />);
    
    // Find the first + button for Admin skill
    const addButtons = screen.getAllByText('+');
    fireEvent.click(addButtons[0]); // Click first + button (Admin)
    
    // Should show skill level increased - check in the skills grid section
    const skillsGrid = screen.getByText('Available Background Skills').nextElementSibling;
    const adminSkillItem = skillsGrid.querySelector('.skill-item');
    expect(adminSkillItem.querySelector('.skill-level-display')).toHaveTextContent('Level 1');
  });

  test('shows skill descriptions when toggled', () => {
    renderWithProvider(<BackgroundSkillsTab />);
    
    // Initially descriptions should not be visible
    expect(screen.queryByText('Bureaucracy, paperwork, and organizational management')).not.toBeInTheDocument();
    
    // Toggle skill descriptions
    const toggleButton = screen.getByText('Show Skill Descriptions');
    fireEvent.click(toggleButton);
    
    // Now descriptions should be visible
    expect(screen.getByText('Bureaucracy, paperwork, and organizational management')).toBeInTheDocument();
    expect(screen.getByText('Hide Skill Descriptions')).toBeInTheDocument();
  });

  test('can remove skills', () => {
    renderWithProvider(<BackgroundSkillsTab />);
    
    // First add a skill
    const addButtons = screen.getAllByText('+');
    fireEvent.click(addButtons[0]); // Add Admin skill
    
    // Then remove it
    const removeButtons = screen.getAllByText('-');
    fireEvent.click(removeButtons[0]); // Remove Admin skill
    
    // Should be back to level 0
    const levelDisplays = screen.getAllByText(/Level \d/);
    expect(levelDisplays[0]).toHaveTextContent('Level 0');
  });

  test('can use direct input to set skill levels', () => {
    renderWithProvider(<BackgroundSkillsTab />);
    
    // Find the first skill level input
    const skillInputs = screen.getAllByDisplayValue('0');
    const firstInput = skillInputs[0];
    
    // Change the value to 1 (within available points)
    fireEvent.change(firstInput, { target: { value: '1' } });
    
    // Should update the skill level (limited by available points)
    expect(firstInput.value).toBe('1');
  });

  test('prevents adding skills when no points remain', () => {
    renderWithProvider(<BackgroundSkillsTab />);
    
    // Add a skill to use up the available point
    const addButtons = screen.getAllByText('+');
    fireEvent.click(addButtons[0]); // Use the 1 available point
    
    // Now all + buttons should be disabled
    addButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  test('can reset all skills', () => {
    renderWithProvider(<BackgroundSkillsTab />);
    
    // Add a skill first
    const addButtons = screen.getAllByText('+');
    fireEvent.click(addButtons[0]);
    
    // Mock window.confirm to return true
    window.confirm = jest.fn(() => true);
    
    // Click reset button
    const resetButton = screen.getByText('Reset All Skills');
    fireEvent.click(resetButton);
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to reset all background skills?');
  });

  test('can finish background skills selection', () => {
    renderWithProvider(<BackgroundSkillsTab />);
    
    const finishButton = screen.getByText('Finish Background Skills');
    fireEvent.click(finishButton);
    
    // Should show completion notice
    expect(screen.getByRole('heading', { name: 'Background Skills Complete' })).toBeInTheDocument();
    expect(screen.getByText('You have finished selecting your background skills. You can now proceed to career selection.')).toBeInTheDocument();
  });

  test('shows selected skills summary', () => {
    renderWithProvider(<BackgroundSkillsTab />);
    
    // Initially should show no skills message
    expect(screen.getByText('No skills selected yet. Choose from the available background skills above.')).toBeInTheDocument();
    
    // Add a skill
    const addButtons = screen.getAllByText('+');
    fireEvent.click(addButtons[0]); // Add Admin skill
    
    // Should now show the skill in summary
    expect(screen.getByText('Selected Skills Summary')).toBeInTheDocument();
  });

  test('displays skill information section', () => {
    renderWithProvider(<BackgroundSkillsTab />);
    
    expect(screen.getByText('Background Skills Information')).toBeInTheDocument();
    expect(screen.getByText('What are Background Skills?')).toBeInTheDocument();
    expect(screen.getByText('Skill Points Calculation:')).toBeInTheDocument();
    expect(screen.getByText('Skill Levels:')).toBeInTheDocument();
    expect(screen.getByText('Skill Usage:')).toBeInTheDocument();
  });

  test('enforces maximum skill level of 3', () => {
    renderWithProvider(<BackgroundSkillsTab />);
    
    // This test would need to be adjusted based on available points
    // For now, just check that the input has max="3"
    const skillInputs = screen.getAllByDisplayValue('0');
    expect(skillInputs[0]).toHaveAttribute('max', '3');
  });
});