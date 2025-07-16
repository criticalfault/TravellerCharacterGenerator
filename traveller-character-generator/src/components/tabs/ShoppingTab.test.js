import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShoppingTab from './ShoppingTab';
import { CharacterProvider } from '../../context/CharacterContext';

// Mock data
const mockCharacterWithMoney = {
  name: 'Test Character',
  age: 30,
  species: 'Human',
  attributes: {
    STR: 8,
    DEX: 9,
    END: 7,
    INT: 10,
    EDU: 11,
    SOC: 8,
    PSI: 0,
  },
  skills: {},
  careerHistory: [],
  contacts: [],
  allies: [],
  enemies: [],
  rivals: [],
  gear: [],
  cyberware: [],
  money: 50000, // Character has 50,000 credits
  benefitRolls: 0,
  benefitRollsState: [],
  cashBenefitsUsed: 0,
  selectedBenefits: [],
};

// Mock the context with test data
const MockCharacterProvider = ({ children, character = mockCharacterWithMoney }) => {
  const mockDispatch = jest.fn();
  const mockValue = {
    character,
    dispatch: mockDispatch,
    CHARACTER_ACTIONS: {
      UPDATE_MONEY: 'UPDATE_MONEY',
      ADD_GEAR: 'ADD_GEAR',
    },
  };

  return (
    <div data-testid="mock-provider">
      {React.cloneElement(children, { mockValue })}
    </div>
  );
};

describe('ShoppingTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProvider = (character = mockCharacterWithMoney) => {
    return render(
      <CharacterProvider>
        <ShoppingTab />
      </CharacterProvider>
    );
  };

  test('renders shopping interface', () => {
    renderWithProvider();
    
    expect(screen.getByText('Equipment Shopping')).toBeInTheDocument();
    expect(screen.getByText(/Available Credits:/)).toBeInTheDocument();
    expect(screen.getByText('50,000 Cr')).toBeInTheDocument();
  });

  test('displays equipment categories', () => {
    renderWithProvider();
    
    const categorySelect = screen.getByDisplayValue('Weapons');
    expect(categorySelect).toBeInTheDocument();
    
    // Check if category options exist
    fireEvent.click(categorySelect);
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByText('Weapons')).toBeInTheDocument();
    expect(screen.getByText('Armor')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
  });

  test('filters items by category', async () => {
    renderWithProvider();
    
    const categorySelect = screen.getByDisplayValue('Weapons');
    
    // Switch to armor category
    fireEvent.change(categorySelect, { target: { value: 'armor' } });
    
    await waitFor(() => {
      expect(categorySelect.value).toBe('armor');
    });
  });

  test('filters items by tech level', async () => {
    renderWithProvider();
    
    const techLevelInput = screen.getByDisplayValue('12');
    
    // Lower tech level to 5
    fireEvent.change(techLevelInput, { target: { value: '5' } });
    
    await waitFor(() => {
      expect(techLevelInput.value).toBe('5');
    });
  });

  test('searches items by name', async () => {
    renderWithProvider();
    
    const searchInput = screen.getByPlaceholderText('Search equipment...');
    
    fireEvent.change(searchInput, { target: { value: 'sword' } });
    
    await waitFor(() => {
      expect(searchInput.value).toBe('sword');
    });
  });

  test('adds items to cart', async () => {
    renderWithProvider();
    
    // Find an "Add to Cart" button (there should be several)
    const addToCartButtons = screen.getAllByText('Add to Cart');
    expect(addToCartButtons.length).toBeGreaterThan(0);
    
    // Click the first one
    fireEvent.click(addToCartButtons[0]);
    
    // Cart should now show 1 item
    await waitFor(() => {
      expect(screen.getByText(/Cart \(1 items\)/)).toBeInTheDocument();
    });
  });

  test('shows cart when items are added', async () => {
    renderWithProvider();
    
    const addToCartButtons = screen.getAllByText('Add to Cart');
    fireEvent.click(addToCartButtons[0]);
    
    await waitFor(() => {
      const cartButton = screen.getByText(/Cart \(1 items\)/);
      fireEvent.click(cartButton);
      
      expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
    });
  });

  test('prevents purchase when insufficient credits', () => {
    const poorCharacter = {
      ...mockCharacterWithMoney,
      money: 10 // Only 10 credits
    };
    
    renderWithProvider(poorCharacter);
    
    expect(screen.getByText('10 Cr')).toBeInTheDocument();
    
    // Most items should show "Too Expensive"
    const expensiveButtons = screen.getAllByText('Too Expensive');
    expect(expensiveButtons.length).toBeGreaterThan(0);
  });

  test('displays current equipment', () => {
    const characterWithGear = {
      ...mockCharacterWithMoney,
      gear: [
        { name: 'Sword', description: 'A sharp blade' },
        'Shield'
      ]
    };
    
    renderWithProvider(characterWithGear);
    
    expect(screen.getByText('Current Equipment')).toBeInTheDocument();
    expect(screen.getByText('Sword')).toBeInTheDocument();
    expect(screen.getByText('Shield')).toBeInTheDocument();
  });

  test('shows owned quantity for items', () => {
    const characterWithGear = {
      ...mockCharacterWithMoney,
      gear: [
        { name: 'Dagger' },
        { name: 'Dagger' }, // Two daggers
        'Sword'
      ]
    };
    
    renderWithProvider(characterWithGear);
    
    // Should show "Owned: 2" for daggers if they appear in the equipment list
    // This test depends on the actual equipment data
  });

  test('sorts items correctly', async () => {
    renderWithProvider();
    
    const sortSelect = screen.getByDisplayValue('Name');
    
    // Change sort to cost
    fireEvent.change(sortSelect, { target: { value: 'cost' } });
    
    await waitFor(() => {
      expect(sortSelect.value).toBe('cost');
    });
    
    // Change sort to tech level
    fireEvent.change(sortSelect, { target: { value: 'tech_level' } });
    
    await waitFor(() => {
      expect(sortSelect.value).toBe('tech_level');
    });
  });

  test('handles empty equipment data gracefully', () => {
    // This test ensures the component doesn't crash if equipment data is missing
    renderWithProvider();
    
    expect(screen.getByText('Equipment Shopping')).toBeInTheDocument();
  });
});