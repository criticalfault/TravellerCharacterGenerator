import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterProvider, useCharacter, CHARACTER_ACTIONS } from './CharacterContext';

// Test component to verify context functionality
const TestComponent = () => {
  const { character, dispatch, updateAttribute, getAttributeModifier } = useCharacter();
  
  const handleSetName = () => {
    dispatch({ type: CHARACTER_ACTIONS.SET_NAME, payload: "Test Character" });
  };
  
  const handleSetAttribute = () => {
    updateAttribute('STR', 12);
  };
  
  return (
    <div>
      <div data-testid="character-name">{character.name}</div>
      <div data-testid="character-str">{character.attributes.STR}</div>
      <div data-testid="str-modifier">{getAttributeModifier(character.attributes.STR)}</div>
      <button onClick={handleSetName}>Set Name</button>
      <button onClick={handleSetAttribute}>Set STR</button>
    </div>
  );
};

describe('CharacterContext', () => {
  test('provides initial character state', () => {
    render(
      <CharacterProvider>
        <TestComponent />
      </CharacterProvider>
    );
    
    expect(screen.getByTestId('character-name')).toHaveTextContent('');
    expect(screen.getByTestId('character-str')).toHaveTextContent('0');
  });
  
  test('updates character name', () => {
    render(
      <CharacterProvider>
        <TestComponent />
      </CharacterProvider>
    );
    
    fireEvent.click(screen.getByText('Set Name'));
    expect(screen.getByTestId('character-name')).toHaveTextContent('Test Character');
  });
  
  test('updates character attributes and calculates modifiers', () => {
    render(
      <CharacterProvider>
        <TestComponent />
      </CharacterProvider>
    );
    
    fireEvent.click(screen.getByText('Set STR'));
    expect(screen.getByTestId('character-str')).toHaveTextContent('12');
    expect(screen.getByTestId('str-modifier')).toHaveTextContent('2'); // (12-6)/3 = 2
  });
  
  test('calculates attribute modifiers correctly', () => {
    const { result } = renderHook(() => useCharacter(), {
      wrapper: CharacterProvider,
    });
    
    // Test various attribute values
    expect(result.current.getAttributeModifier(3)).toBe(-1); // (3-6)/3 = -1
    expect(result.current.getAttributeModifier(6)).toBe(0);  // (6-6)/3 = 0
    expect(result.current.getAttributeModifier(9)).toBe(1);  // (9-6)/3 = 1
    expect(result.current.getAttributeModifier(12)).toBe(2); // (12-6)/3 = 2
    expect(result.current.getAttributeModifier(15)).toBe(3); // (15-6)/3 = 3
  });
});

// Need to import renderHook for the last test
import { renderHook } from '@testing-library/react';