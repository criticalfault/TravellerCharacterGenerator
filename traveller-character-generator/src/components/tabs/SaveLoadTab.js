import React, { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';

export default function SaveLoadTab() {
  const { character, dispatch, CHARACTER_ACTIONS } = useCharacter();
  const [savedCharacters, setSavedCharacters] = useState(() => {
    try {
      const saved = localStorage.getItem('travellerCharacters');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved characters:', error);
      return [];
    }
  });
  const [characterName, setCharacterName] = useState(character.name || '');

  const saveCharacter = () => {
    if (!characterName.trim()) {
      alert('Please enter a character name');
      return;
    }

    const characterToSave = {
      ...character,
      name: characterName,
      savedAt: new Date().toISOString(),
    };

    const updatedSaved = [...savedCharacters];
    const existingIndex = updatedSaved.findIndex(
      char => char.name === characterName
    );

    if (existingIndex >= 0) {
      if (
        window.confirm(
          `A character named "${characterName}" already exists. Overwrite?`
        )
      ) {
        updatedSaved[existingIndex] = characterToSave;
      } else {
        return;
      }
    } else {
      updatedSaved.push(characterToSave);
    }

    try {
      setSavedCharacters(updatedSaved);
      localStorage.setItem('travellerCharacters', JSON.stringify(updatedSaved));
    } catch (error) {
      console.error('Error saving character:', error);
      alert('Error saving character. Please try again.');
      return;
    }

    // Update current character name
    dispatch({ type: CHARACTER_ACTIONS.SET_NAME, payload: characterName });

    alert('Character saved successfully!');
  };

  const loadCharacter = savedCharacter => {
    if (
      window.confirm(
        `Load character "${savedCharacter.name}"? This will replace your current character.`
      )
    ) {
      dispatch({
        type: CHARACTER_ACTIONS.LOAD_CHARACTER,
        payload: savedCharacter,
      });
      setCharacterName(savedCharacter.name);
    }
  };

  const deleteCharacter = characterName => {
    if (
      window.confirm(
        `Delete character "${characterName}"? This cannot be undone.`
      )
    ) {
      try {
        const updatedSaved = savedCharacters.filter(
          char => char.name !== characterName
        );
        setSavedCharacters(updatedSaved);
        localStorage.setItem(
          'travellerCharacters',
          JSON.stringify(updatedSaved)
        );
      } catch (error) {
        console.error('Error deleting character:', error);
        alert('Error deleting character. Please try again.');
      }
    }
  };

  const exportCharacter = savedCharacter => {
    const characterData = JSON.stringify(savedCharacter, null, 2);
    const blob = new Blob([characterData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${savedCharacter.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importCharacter = event => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const characterData = JSON.parse(e.target.result);

        // Basic validation of character data
        if (!characterData || typeof characterData !== 'object') {
          throw new Error('Invalid character data structure');
        }

        if (
          window.confirm(
            `Import character "${characterData.name || 'Unknown'}"? This will replace your current character.`
          )
        ) {
          dispatch({
            type: CHARACTER_ACTIONS.LOAD_CHARACTER,
            payload: characterData,
          });
          setCharacterName(characterData.name || '');
          alert('Character imported successfully!');
        }
      } catch (error) {
        console.error('Error importing character:', error);
        alert(
          'Error importing character: Invalid file format or corrupted data'
        );
      }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
  };

  const newCharacter = () => {
    if (
      window.confirm(
        'Create a new character? This will clear your current character.'
      )
    ) {
      dispatch({ type: CHARACTER_ACTIONS.RESET_CHARACTER });
      setCharacterName('');
    }
  };

  return (
    <div className="save-load-tab">
      <h2>Save & Load Characters</h2>
      <p>
        Manage your Traveller characters with save, load, and export
        functionality.
      </p>

      <div className="current-character-section">
        <h3>Current Character</h3>
        <div className="current-character-info">
          <div className="character-name-input">
            <label htmlFor="characterName">Character Name:</label>
            <input
              id="characterName"
              type="text"
              value={characterName}
              onChange={e => setCharacterName(e.target.value)}
              placeholder="Enter character name"
              className="form-input"
            />
          </div>
          <div className="current-character-actions">
            <button className="btn btn-primary" onClick={saveCharacter}>
              Save Character
            </button>
            <button className="btn btn-secondary" onClick={newCharacter}>
              New Character
            </button>
          </div>
        </div>
      </div>

      <div className="saved-characters-section">
        <h3>Saved Characters</h3>
        {savedCharacters.length > 0 ? (
          <div className="saved-characters-list">
            {savedCharacters.map((savedChar, index) => (
              <div key={index} className="saved-character-item">
                <div className="character-info">
                  <h4>{savedChar.name}</h4>
                  <p>
                    Age: {savedChar.age} | Species: {savedChar.species}
                  </p>
                  <p>
                    Saved: {new Date(savedChar.savedAt).toLocaleDateString()}
                  </p>
                  {savedChar.careerHistory.length > 0 && (
                    <p>
                      Careers:{' '}
                      {savedChar.careerHistory.map(c => c.career).join(', ')}
                    </p>
                  )}
                </div>
                <div className="character-actions">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => loadCharacter(savedChar)}
                  >
                    Load
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => exportCharacter(savedChar)}
                  >
                    Export
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteCharacter(savedChar.name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No saved characters found.</p>
        )}
      </div>

      <div className="import-export-section">
        <h3>Import/Export</h3>
        <div className="import-export-actions">
          <div className="import-section">
            <label htmlFor="importFile" className="btn btn-secondary">
              Import Character
            </label>
            <input
              id="importFile"
              type="file"
              accept=".json"
              onChange={importCharacter}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>

      <div className="save-load-info">
        <h3>Save/Load Information</h3>
        <p>
          Characters are saved to your browser's local storage and will persist
          between sessions. You can also export characters as JSON files for
          backup or sharing.
        </p>
        <p>
          <strong>Note:</strong> Clearing your browser data will remove saved
          characters. Use the export function to create backups of important
          characters.
        </p>
      </div>
    </div>
  );
}
