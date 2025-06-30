import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SaveLoadTab from './SaveLoadTab';
import { CharacterProvider } from '../../context/CharacterContext';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

const renderSaveLoadTab = () => {
  return render(
    <CharacterProvider>
      <SaveLoadTab />
    </CharacterProvider>
  );
};

describe('SaveLoadTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('renders save/load interface', () => {
    renderSaveLoadTab();
    
    expect(screen.getByText('Save & Load Characters')).toBeInTheDocument();
    expect(screen.getByText('Manage your Traveller characters with save, load, and export functionality.')).toBeInTheDocument();
    expect(screen.getByText('Current Character')).toBeInTheDocument();
    expect(screen.getByText('Saved Characters')).toBeInTheDocument();
    expect(screen.getByText('Import/Export')).toBeInTheDocument();
  });

  test('displays character name input', () => {
    renderSaveLoadTab();
    
    const nameInput = screen.getByLabelText('Character Name:');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute('placeholder', 'Enter character name');
  });

  test('displays action buttons', () => {
    renderSaveLoadTab();
    
    expect(screen.getByText('Save Character')).toBeInTheDocument();
    expect(screen.getByText('New Character')).toBeInTheDocument();
    expect(screen.getByText('Import Character')).toBeInTheDocument();
  });

  test('shows empty state when no saved characters', () => {
    renderSaveLoadTab();
    
    expect(screen.getByText('No saved characters found.')).toBeInTheDocument();
  });

  test('handles localStorage initialization', () => {
    // Test that the component doesn't crash when localStorage is empty
    renderSaveLoadTab();
    
    expect(screen.getByText('No saved characters found.')).toBeInTheDocument();
  });

  test('displays save/load information', () => {
    renderSaveLoadTab();
    
    expect(screen.getByText('Save/Load Information')).toBeInTheDocument();
    expect(screen.getByText(/Characters are saved to your browser's local storage/)).toBeInTheDocument();
    expect(screen.getByText(/Clearing your browser data will remove saved characters/)).toBeInTheDocument();
  });
});