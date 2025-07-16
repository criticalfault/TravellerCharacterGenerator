import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterProvider } from '../context/CharacterContext';
import TabNavigation from './TabNavigation';

const renderWithProvider = component => {
  return render(<CharacterProvider>{component}</CharacterProvider>);
};

describe('TabNavigation', () => {
  test('renders all tab buttons', () => {
    renderWithProvider(<TabNavigation />);

    expect(screen.getByText('Attributes')).toBeInTheDocument();
    expect(screen.getByText('Background Skills')).toBeInTheDocument();
    expect(screen.getByText('Career Selection')).toBeInTheDocument();
    expect(screen.getByText('Career Terms')).toBeInTheDocument();
    expect(screen.getByText('Mustering Out')).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Save/Load')).toBeInTheDocument();
  });

  test('starts with species tab active', () => {
    renderWithProvider(<TabNavigation />);

    const speciesTab = screen.getByText('Species');
    expect(speciesTab).toHaveClass('active');
    expect(screen.getByText('Species Selection')).toBeInTheDocument();
  });

  test('can switch between tabs', () => {
    renderWithProvider(<TabNavigation />);

    // Click on Background Skills tab
    const backgroundTabButton = screen.getAllByText('Background Skills')[0]; // Get the button, not the heading
    fireEvent.click(backgroundTabButton);

    // Check that Background Skills tab is now active
    expect(backgroundTabButton).toHaveClass('active');
    expect(
      screen.getByRole('heading', { name: 'Background Skills' })
    ).toBeInTheDocument();
  });

  test('navigation buttons work correctly', () => {
    renderWithProvider(<TabNavigation />);

    // Previous button should be disabled on first tab
    const prevButton = screen.getByText('Previous');
    expect(prevButton).toBeDisabled();

    // Click next button
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Should now be on Attributes tab
    const attributesTabButton = screen.getAllByText('Attributes')[0];
    expect(attributesTabButton).toHaveClass('active');

    // Previous button should now be enabled
    expect(prevButton).not.toBeDisabled();
  });
});
