import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterProvider } from '../context/CharacterContext';
import TabNavigation from './TabNavigation';

const renderWithProvider = (component) => {
  return render(
    <CharacterProvider>
      {component}
    </CharacterProvider>
  );
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

  test('starts with attributes tab active', () => {
    renderWithProvider(<TabNavigation />);
    
    const attributesTab = screen.getByText('Attributes');
    expect(attributesTab).toHaveClass('active');
    expect(screen.getByText('Character Attributes')).toBeInTheDocument();
  });

  test('can switch between tabs', () => {
    renderWithProvider(<TabNavigation />);
    
    // Click on Background Skills tab
    const backgroundTabButton = screen.getAllByText('Background Skills')[0]; // Get the button, not the heading
    fireEvent.click(backgroundTabButton);
    
    // Check that Background Skills tab is now active
    expect(backgroundTabButton).toHaveClass('active');
    expect(screen.getByRole('heading', { name: 'Background Skills' })).toBeInTheDocument();
  });

  test('navigation buttons work correctly', () => {
    renderWithProvider(<TabNavigation />);
    
    // Previous button should be disabled on first tab
    const prevButton = screen.getByText('Previous');
    expect(prevButton).toBeDisabled();
    
    // Click next button
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Should now be on Background Skills tab
    const backgroundTabButton = screen.getAllByText('Background Skills')[0];
    expect(backgroundTabButton).toHaveClass('active');
    
    // Previous button should now be enabled
    expect(prevButton).not.toBeDisabled();
  });
});