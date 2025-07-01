import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RaceSelectionTab from './RaceSelectionTab';
import { CharacterProvider } from '../../context/CharacterContext';
import raceData from '../../data/races.json';

// Helper function to render component with context
const renderWithContext = component => {
  return render(<CharacterProvider>{component}</CharacterProvider>);
};

describe('RaceSelectionTab', () => {
  test('renders race selection interface', () => {
    renderWithContext(<RaceSelectionTab />);

    expect(screen.getByText('Species Selection')).toBeInTheDocument();
    expect(screen.getByText('Available Species')).toBeInTheDocument();
    expect(
      screen.getByText(
        "Choose your character's species. Each species has unique traits and attribute modifiers."
      )
    ).toBeInTheDocument();
  });

  test('displays all available races', () => {
    renderWithContext(<RaceSelectionTab />);

    Object.keys(raceData).forEach(raceName => {
      expect(
        screen.getByRole('button', { name: raceName })
      ).toBeInTheDocument();
    });
  });

  test('shows race details when race is selected', () => {
    renderWithContext(<RaceSelectionTab />);

    // Click on Aslan race
    fireEvent.click(screen.getByRole('button', { name: 'Aslan' }));

    expect(screen.getByText(raceData.Aslan.description)).toBeInTheDocument();
    expect(screen.getByText('Attribute Modifiers')).toBeInTheDocument();
    expect(screen.getByText('Special Abilities')).toBeInTheDocument();
    expect(screen.getByText('Racial Traits')).toBeInTheDocument();
  });

  test('displays attribute modifiers correctly', () => {
    renderWithContext(<RaceSelectionTab />);

    // Select Aslan which has STR +2, DEX -2
    fireEvent.click(screen.getByRole('button', { name: 'Aslan' }));

    expect(screen.getByText('STR: +2')).toBeInTheDocument();
    expect(screen.getByText('DEX: -2')).toBeInTheDocument();
  });

  test('shows special abilities for selected race', () => {
    renderWithContext(<RaceSelectionTab />);

    // Select Aslan
    fireEvent.click(screen.getByRole('button', { name: 'Aslan' }));

    raceData.Aslan.specialAbilities.forEach(ability => {
      expect(screen.getByText(ability)).toBeInTheDocument();
    });
  });

  test('shows racial traits for selected race', () => {
    renderWithContext(<RaceSelectionTab />);

    // Select Vargr
    fireEvent.click(screen.getByRole('button', { name: 'Vargr' }));

    raceData.Vargr.traits.forEach(trait => {
      expect(screen.getByText(trait)).toBeInTheDocument();
    });
  });

  test('confirms race selection', () => {
    renderWithContext(<RaceSelectionTab />);

    // Select and confirm Zhodani
    fireEvent.click(screen.getByRole('button', { name: 'Zhodani' }));
    fireEvent.click(screen.getByText('Confirm Zhodani'));

    expect(screen.getByText('Species Confirmed: Zhodani')).toBeInTheDocument();
    expect(screen.getByText('Applied Attribute Modifiers')).toBeInTheDocument();
    expect(screen.getByText('Your Special Abilities')).toBeInTheDocument();
  });

  test('allows changing race after confirmation', () => {
    renderWithContext(<RaceSelectionTab />);

    // Select and confirm a race
    fireEvent.click(screen.getByRole('button', { name: 'Vilani' }));
    fireEvent.click(screen.getByText('Confirm Vilani'));

    // Verify confirmation
    expect(screen.getByText('Species Confirmed: Vilani')).toBeInTheDocument();

    // Change race
    fireEvent.click(screen.getByText('Change Species'));

    // Should be back to selection interface
    expect(screen.getByText('Available Species')).toBeInTheDocument();
    expect(screen.getByText('Confirm Human')).toBeInTheDocument(); // Should reset to Human
  });

  test('handles races with no attribute modifiers', () => {
    renderWithContext(<RaceSelectionTab />);

    // Human is selected by default and has no attribute modifiers
    // Should not show attribute modifiers section for Human
    expect(screen.queryByText('Attribute Modifiers')).not.toBeInTheDocument();
  });

  test('displays current character info', () => {
    renderWithContext(<RaceSelectionTab />);

    expect(screen.getByText('Current Character')).toBeInTheDocument();
    expect(screen.getByText('Species:')).toBeInTheDocument();
    expect(screen.getByText('Name:')).toBeInTheDocument();
  });

  test('highlights selected race button', () => {
    renderWithContext(<RaceSelectionTab />);

    const aslanButton = screen.getByRole('button', { name: 'Aslan' });
    fireEvent.click(aslanButton);

    expect(aslanButton).toHaveClass('selected');
  });
});
