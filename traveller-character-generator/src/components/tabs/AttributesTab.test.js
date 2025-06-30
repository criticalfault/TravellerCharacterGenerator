import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterProvider } from '../../context/CharacterContext';
import AttributesTab from './AttributesTab';

// Mock the dice utilities
jest.mock('../../utils/dice', () => ({
  generateAttributes2d6: jest.fn().mockReturnValue({
    STR: 8, DEX: 7, END: 9, INT: 10, EDU: 8, SOC: 6
  }),
  generateAttributes3d6DropLowest: jest.fn().mockReturnValue({
    attributes: { STR: 10, DEX: 9, END: 11, INT: 12, EDU: 10, SOC: 8 },
    details: {}
  }),
  roll2d6: jest.fn().mockReturnValue({ total: 8, dice: [4, 4] }),
  roll3d6DropLowest: jest.fn().mockReturnValue({ 
    total: 10, 
    allDice: [3, 5, 5], 
    keptDice: [5, 5], 
    droppedDie: 3 
  })
}));

const renderWithProvider = (component) => {
  return render(
    <CharacterProvider>
      {component}
    </CharacterProvider>
  );
};

describe('AttributesTab', () => {
  test('renders attribute controls', () => {
    renderWithProvider(<AttributesTab />);
    
    expect(screen.getByText('Character Attributes')).toBeInTheDocument();
    expect(screen.getByLabelText('STR')).toBeInTheDocument();
    expect(screen.getByLabelText('DEX')).toBeInTheDocument();
    expect(screen.getByLabelText('END')).toBeInTheDocument();
    expect(screen.getByLabelText('INT')).toBeInTheDocument();
    expect(screen.getByLabelText('EDU')).toBeInTheDocument();
    expect(screen.getByLabelText('SOC')).toBeInTheDocument();
  });

  test('displays attribute modifiers correctly', () => {
    renderWithProvider(<AttributesTab />);
    
    // All attributes start at 0, which should have DM -2
    const modifiers = screen.getAllByText('DM: -2');
    expect(modifiers).toHaveLength(6); // One for each attribute
  });

  test('allows manual input of attributes', () => {
    renderWithProvider(<AttributesTab />);
    
    const strInput = screen.getByLabelText('STR');
    fireEvent.change(strInput, { target: { value: '12' } });
    
    expect(strInput.value).toBe('12');
  });

  test('disables inputs when attributes are locked', () => {
    renderWithProvider(<AttributesTab />);
    
    // Lock attributes
    const lockButton = screen.getByText('Lock Attributes');
    fireEvent.click(lockButton);
    
    // Check that inputs are disabled
    const strInput = screen.getByLabelText('STR');
    expect(strInput).toBeDisabled();
    
    // Check that roll buttons are disabled
    const rollAllButton = screen.getByText('Roll All Attributes (2d6)');
    expect(rollAllButton).toBeDisabled();
  });

  test('can unlock attributes after locking', () => {
    renderWithProvider(<AttributesTab />);
    
    // Lock attributes
    const lockButton = screen.getByText('Lock Attributes');
    fireEvent.click(lockButton);
    
    // Unlock attributes
    const unlockButton = screen.getByText('Unlock Attributes');
    fireEvent.click(unlockButton);
    
    // Check that roll buttons are enabled again
    const rollAllButton = screen.getByText('Roll All Attributes (2d6)');
    expect(rollAllButton).not.toBeDisabled();
  });

  test('rolls all attributes with 2d6 method', () => {
    const { generateAttributes2d6 } = require('../../utils/dice');
    renderWithProvider(<AttributesTab />);
    
    const rollButton = screen.getByText('Roll All Attributes (2d6)');
    fireEvent.click(rollButton);
    
    expect(generateAttributes2d6).toHaveBeenCalled();
  });

  test('rolls all attributes with 3d6 drop lowest method', () => {
    const { generateAttributes3d6DropLowest } = require('../../utils/dice');
    renderWithProvider(<AttributesTab />);
    
    const rollButton = screen.getByText('Roll All Attributes (3d6 drop lowest)');
    fireEvent.click(rollButton);
    
    expect(generateAttributes3d6DropLowest).toHaveBeenCalled();
  });

  test('rolls single attribute with 2d6', () => {
    const { roll2d6 } = require('../../utils/dice');
    renderWithProvider(<AttributesTab />);
    
    // Find the first 2d6 button (for STR)
    const roll2d6Buttons = screen.getAllByText('2d6');
    fireEvent.click(roll2d6Buttons[0]);
    
    expect(roll2d6).toHaveBeenCalled();
  });

  test('shows and hides roll history', () => {
    renderWithProvider(<AttributesTab />);
    
    // Initially, roll history should not be visible
    expect(screen.queryByText('Roll History')).not.toBeInTheDocument();
    
    // Show roll history
    const showHistoryButton = screen.getByText('Show Roll History');
    fireEvent.click(showHistoryButton);
    
    // Make a roll to populate history
    const rollButton = screen.getByText('Roll All Attributes (2d6)');
    fireEvent.click(rollButton);
    
    // Now roll history should be visible
    expect(screen.getByText('Roll History')).toBeInTheDocument();
    
    // Hide roll history
    const hideHistoryButton = screen.getByText('Hide Roll History');
    fireEvent.click(hideHistoryButton);
    
    // Roll history should be hidden again
    expect(screen.queryByText('Roll History')).not.toBeInTheDocument();
  });

  test('displays attribute totals and averages', () => {
    renderWithProvider(<AttributesTab />);
    
    // Should show total and average (initially all 0s) - use more flexible matching
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Total: 0';
    })).toBeInTheDocument();
    
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Average: 0.0';
    })).toBeInTheDocument();
    
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Physical Total: 0';
    })).toBeInTheDocument();
  });

  test('shows detailed attribute descriptions', () => {
    renderWithProvider(<AttributesTab />);
    
    // Use getAllByText to handle multiple instances
    const physicalDescriptions = screen.getAllByText(/Physical power and muscle/);
    expect(physicalDescriptions.length).toBeGreaterThan(0);
    
    const agilityDescriptions = screen.getAllByText(/Agility, reflexes, and fine motor control/);
    expect(agilityDescriptions.length).toBeGreaterThan(0);
    
    const staminaDescriptions = screen.getAllByText(/Stamina, health, and constitution/);
    expect(staminaDescriptions.length).toBeGreaterThan(0);
  });

  test('displays dice modifier information', () => {
    renderWithProvider(<AttributesTab />);
    
    expect(screen.getByText(/Dice Modifiers \(DM\):/)).toBeInTheDocument();
    expect(screen.getByText(/3-5: -1 DM/)).toBeInTheDocument();
    expect(screen.getByText(/6-8: \+0 DM/)).toBeInTheDocument();
  });
});