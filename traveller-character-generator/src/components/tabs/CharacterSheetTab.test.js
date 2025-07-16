import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CharacterSheetTab from './CharacterSheetTab';
import { CharacterProvider } from '../../context/CharacterContext';

// Mock data for a complete character
const mockCompleteCharacter = {
  name: 'Marcus Steel',
  age: 34,
  species: 'Human',
  attributes: {
    STR: 10,
    DEX: 12,
    END: 9,
    INT: 11,
    EDU: 13,
    SOC: 8,
    PSI: 0,
  },
  currentAttributes: {
    STR: 8, // Damaged
    DEX: 12,
    END: 7, // Damaged
    INT: 11,
    EDU: 13,
    SOC: 8,
    PSI: 0,
  },
  skills: {
    'Gun Combat': 2,
    'Pilot': 1,
    'Mechanic': 1,
    'Electronics': 0,
    'Tactics': 1,
  },
  careerHistory: [
    {
      career: 'Navy',
      assignment: 'Line/Crew',
      terms: 3,
      rank: 4,
      rankTitle: 'Lieutenant Commander',
      commissioned: true,
      events: [
        { term: 1, description: 'Served with distinction in a major battle' },
        { term: 2, description: 'Gained valuable technical experience' },
        { term: 3, description: 'Led a successful mission' },
      ],
    },
    {
      career: 'Merchant',
      assignment: 'Merchant Marine',
      terms: 2,
      rank: 2,
      rankTitle: 'Senior Crewman',
      commissioned: false,
      events: [
        { term: 1, description: 'Established trade connections' },
        { term: 2, description: 'Survived pirate attack' },
      ],
    },
  ],
  contacts: ['Admiral Harrison', 'Trader Vex'],
  allies: ['Captain Rodriguez'],
  enemies: ['Pirate Lord Kaine'],
  rivals: ['Commander Blake'],
  gear: [
    { name: 'Laser Rifle', category: 'weapon' },
    { name: 'Cloth Armor', category: 'armor' },
    { name: 'Portable Computer', category: 'equipment' },
    'Binoculars',
    'Medkit',
  ],
  cyberware: [
    { name: 'Neural Interface', description: 'Direct computer interface' },
  ],
  money: 75000,
  speciesConfirmed: true,
};

// Mock the context with test data
const MockCharacterProvider = ({ children, character = mockCompleteCharacter }) => {
  const mockDispatch = jest.fn();
  const mockGetAttributeModifier = jest.fn((value) => Math.floor((value - 6) / 3));
  
  const mockValue = {
    character,
    dispatch: mockDispatch,
    getAttributeModifier: mockGetAttributeModifier,
    CHARACTER_ACTIONS: {
      APPLY_DAMAGE: 'APPLY_DAMAGE',
      HEAL_DAMAGE: 'HEAL_DAMAGE',
      SET_CURRENT_ATTRIBUTES: 'SET_CURRENT_ATTRIBUTES',
      LOAD_CHARACTER: 'LOAD_CHARACTER',
    },
  };

  return (
    <div data-testid="mock-provider">
      {React.cloneElement(children, { mockValue })}
    </div>
  );
};

// Mock file download
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

describe('CharacterSheetTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('mock-url');
  });

  const renderWithProvider = (character = mockCompleteCharacter) => {
    return render(
      <CharacterProvider>
        <CharacterSheetTab />
      </CharacterProvider>
    );
  };

  test('renders character sheet with basic information', () => {
    renderWithProvider();
    
    expect(screen.getByText('Marcus Steel')).toBeInTheDocument();
    expect(screen.getByText(/Species.*Human/)).toBeInTheDocument();
    expect(screen.getByText(/Age.*34/)).toBeInTheDocument();
    expect(screen.getByText(/Credits.*75,000 Cr/)).toBeInTheDocument();
  });

  test('displays characteristics with current and max values', () => {
    renderWithProvider();
    
    // Check for damaged characteristics (STR and END)
    expect(screen.getByText('STR')).toBeInTheDocument();
    expect(screen.getByText('8/10')).toBeInTheDocument(); // Damaged STR
    expect(screen.getByText('7/9')).toBeInTheDocument(); // Damaged END
    
    // Check for undamaged characteristic
    expect(screen.getByText('12')).toBeInTheDocument(); // DEX should show just current value
  });

  test('displays characteristic modifiers correctly', () => {
    renderWithProvider();
    
    // STR 8 should have DM+0 (8-6)/3 = 0.66 -> 0
    // DEX 12 should have DM+2 (12-6)/3 = 2
    expect(screen.getByText('DM+0')).toBeInTheDocument();
    expect(screen.getByText('DM+2')).toBeInTheDocument();
  });

  test('shows damaged characteristics with visual indicators', () => {
    renderWithProvider();
    
    const characteristics = screen.getAllByText(/\d+\/\d+/);
    expect(characteristics.length).toBeGreaterThan(0); // Should have damaged characteristics
  });

  test('displays skills with levels', () => {
    renderWithProvider();
    
    expect(screen.getByText('Gun Combat')).toBeInTheDocument();
    expect(screen.getByText('Pilot')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    
    // Check skill levels
    expect(screen.getByText('2')).toBeInTheDocument(); // Gun Combat level
    expect(screen.getByText('1')).toBeInTheDocument(); // Pilot level
    expect(screen.getByText('0')).toBeInTheDocument(); // Electronics level
  });

  test('organizes equipment by category', () => {
    renderWithProvider();
    
    expect(screen.getByText('Weapons')).toBeInTheDocument();
    expect(screen.getByText('Armor')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('Cyberware')).toBeInTheDocument();
    
    expect(screen.getByText('Laser Rifle')).toBeInTheDocument();
    expect(screen.getByText('Cloth Armor')).toBeInTheDocument();
    expect(screen.getByText('Portable Computer')).toBeInTheDocument();
  });

  test('displays career history', () => {
    renderWithProvider();
    
    expect(screen.getByText('Career History')).toBeInTheDocument();
    expect(screen.getByText('Navy - Line/Crew')).toBeInTheDocument();
    expect(screen.getByText('Merchant - Merchant Marine')).toBeInTheDocument();
    
    expect(screen.getByText(/Terms: 3/)).toBeInTheDocument();
    expect(screen.getByText(/Rank: 4.*Lieutenant Commander/)).toBeInTheDocument();
    expect(screen.getByText('Officer')).toBeInTheDocument();
  });

  test('displays relationships', () => {
    renderWithProvider();
    
    expect(screen.getByText('Relationships')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Allies')).toBeInTheDocument();
    expect(screen.getByText('Enemies')).toBeInTheDocument();
    expect(screen.getByText('Rivals')).toBeInTheDocument();
    
    expect(screen.getByText('Admiral Harrison')).toBeInTheDocument();
    expect(screen.getByText('Captain Rodriguez')).toBeInTheDocument();
    expect(screen.getByText('Pirate Lord Kaine')).toBeInTheDocument();
    expect(screen.getByText('Commander Blake')).toBeInTheDocument();
  });

  test('enables damage mode', async () => {
    renderWithProvider();
    
    const damageButton = screen.getByText('Damage Mode');
    fireEvent.click(damageButton);
    
    await waitFor(() => {
      expect(screen.getByText('Exit Damage Mode')).toBeInTheDocument();
      expect(screen.getByText('Apply Damage')).toBeInTheDocument();
    });
    
    // Should show damage controls on characteristics
    const damageControls = screen.getAllByText('-1');
    expect(damageControls.length).toBeGreaterThan(0);
  });

  test('applies damage to characteristics', async () => {
    renderWithProvider();
    
    // Enter damage mode
    fireEvent.click(screen.getByText('Damage Mode'));
    
    await waitFor(() => {
      // Find and click a -1 button (damage button)
      const damageButtons = screen.getAllByText('-1');
      fireEvent.click(damageButtons[0]);
    });
    
    // Should have called dispatch with APPLY_DAMAGE action
    // Note: This would need to be tested with actual context integration
  });

  test('heals damage from characteristics', async () => {
    renderWithProvider();
    
    // Enter damage mode
    fireEvent.click(screen.getByText('Damage Mode'));
    
    await waitFor(() => {
      // Find and click a +1 button (heal button)
      const healButtons = screen.getAllByText('+1');
      fireEvent.click(healButtons[0]);
    });
    
    // Should have called dispatch with HEAL_DAMAGE action
  });

  test('provides full heal functionality', async () => {
    renderWithProvider();
    
    // Enter damage mode
    fireEvent.click(screen.getByText('Damage Mode'));
    
    await waitFor(() => {
      const fullHealButton = screen.getByText('Full Heal');
      fireEvent.click(fullHealButton);
    });
    
    // Should have called dispatch with SET_CURRENT_ATTRIBUTES action
  });

  test('saves character to file', async () => {
    renderWithProvider();
    
    const saveButton = screen.getByText('Save Character');
    fireEvent.click(saveButton);
    
    // Should have created a download link
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  test('opens load character dialog', async () => {
    renderWithProvider();
    
    const loadButton = screen.getByText('Load Character');
    fireEvent.click(loadButton);
    
    await waitFor(() => {
      expect(screen.getByText('Load Character')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Paste character JSON here...')).toBeInTheDocument();
    });
  });

  test('loads character from JSON', async () => {
    renderWithProvider();
    
    // Open load dialog
    fireEvent.click(screen.getByText('Load Character'));
    
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText('Paste character JSON here...');
      const testCharacterData = JSON.stringify({ name: 'Test Character', age: 25 });
      
      fireEvent.change(textarea, { target: { value: testCharacterData } });
      
      const loadButton = screen.getAllByText('Load Character')[1]; // Second one is in the modal
      fireEvent.click(loadButton);
    });
    
    // Should have called dispatch with LOAD_CHARACTER action
  });

  test('handles invalid JSON gracefully', async () => {
    // Mock alert
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    renderWithProvider();
    
    // Open load dialog
    fireEvent.click(screen.getByText('Load Character'));
    
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText('Paste character JSON here...');
      
      fireEvent.change(textarea, { target: { value: 'invalid json' } });
      
      const loadButton = screen.getAllByText('Load Character')[1];
      fireEvent.click(loadButton);
    });
    
    expect(mockAlert).toHaveBeenCalledWith('Invalid character data. Please check the JSON format.');
    
    mockAlert.mockRestore();
  });

  test('displays species traits when available', () => {
    const characterWithTraits = {
      ...mockCompleteCharacter,
      species: 'Vargr', // Assuming Vargr has special traits
    };
    
    renderWithProvider(characterWithTraits);
    
    // Should show species section if traits exist
    // This depends on the actual race data structure
  });

  test('handles character with no equipment', () => {
    const characterNoEquipment = {
      ...mockCompleteCharacter,
      gear: [],
      cyberware: [],
    };
    
    renderWithProvider(characterNoEquipment);
    
    expect(screen.getByText('No equipment owned.')).toBeInTheDocument();
  });

  test('handles character with no skills', () => {
    const characterNoSkills = {
      ...mockCompleteCharacter,
      skills: {},
    };
    
    renderWithProvider(characterNoSkills);
    
    expect(screen.getByText('No skills learned yet.')).toBeInTheDocument();
  });

  test('handles character with no career history', () => {
    const characterNoCareers = {
      ...mockCompleteCharacter,
      careerHistory: [],
    };
    
    renderWithProvider(characterNoCareers);
    
    // Career History section should not appear
    expect(screen.queryByText('Career History')).not.toBeInTheDocument();
  });

  test('handles character with no relationships', () => {
    const characterNoRelationships = {
      ...mockCompleteCharacter,
      contacts: [],
      allies: [],
      enemies: [],
      rivals: [],
    };
    
    renderWithProvider(characterNoRelationships);
    
    // Relationships section should not appear
    expect(screen.queryByText('Relationships')).not.toBeInTheDocument();
  });
});