import React, { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import raceData from '../../data/races.json';

export default function RaceSelectionTab() {
  const { character, dispatch, CHARACTER_ACTIONS } = useCharacter();
  const [selectedRace, setSelectedRace] = useState(
    character.species || 'Human'
  );
  const [raceConfirmed, setRaceConfirmed] = useState(false);

  const handleRaceSelection = raceName => {
    setSelectedRace(raceName);
    setRaceConfirmed(false);
  };

  const confirmRaceSelection = () => {
    const race = raceData[selectedRace];

    // Set the species in character state
    dispatch({
      type: CHARACTER_ACTIONS.SET_SPECIES,
      payload: selectedRace,
    });

    // Apply racial attribute modifiers to current attributes
    if (race.attributeModifiers) {
      const modifiedAttributes = { ...character.attributes };
      Object.entries(race.attributeModifiers).forEach(([attr, modifier]) => {
        if (attr !== 'PSI') {
          // Handle PSI separately as it's not a standard attribute
          modifiedAttributes[attr] = Math.max(
            0,
            (modifiedAttributes[attr] || 0) + modifier
          );
        }
      });

      dispatch({
        type: CHARACTER_ACTIONS.SET_ATTRIBUTES,
        payload: modifiedAttributes,
      });
    }

    setRaceConfirmed(true);
  };

  const resetRaceSelection = () => {
    setRaceConfirmed(false);
    // Reset to Human baseline
    setSelectedRace('Human');
    dispatch({
      type: CHARACTER_ACTIONS.SET_SPECIES,
      payload: 'Human',
    });
  };

  const getRaceDetails = raceName => {
    return raceData[raceName] || raceData['Human'];
  };

  const selectedRaceData = getRaceDetails(selectedRace);

  return (
    <div className="race-selection-tab">
      <h2>Species Selection</h2>
      <p>
        Choose your character's species. Each species has unique traits and
        attribute modifiers.
      </p>

      {!raceConfirmed ? (
        <div className="race-selection-content">
          <div className="race-list">
            <h3>Available Species</h3>
            <div className="race-buttons">
              {Object.keys(raceData).map(raceName => (
                <button
                  key={raceName}
                  className={`race-button ${selectedRace === raceName ? 'selected' : ''}`}
                  onClick={() => handleRaceSelection(raceName)}
                >
                  {raceName}
                </button>
              ))}
            </div>
          </div>

          <div className="race-details">
            <h3>{selectedRaceData.name}</h3>
            <p className="race-description">{selectedRaceData.description}</p>

            {Object.keys(selectedRaceData.attributeModifiers).length > 0 && (
              <div className="attribute-modifiers">
                <h4>Attribute Modifiers</h4>
                <ul>
                  {Object.entries(selectedRaceData.attributeModifiers).map(
                    ([attr, modifier]) => (
                      <li key={attr}>
                        {attr}: {modifier > 0 ? '+' : ''}
                        {modifier}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {selectedRaceData.specialAbilities.length > 0 && (
              <div className="special-abilities">
                <h4>Special Abilities</h4>
                <ul>
                  {selectedRaceData.specialAbilities.map((ability, index) => (
                    <li key={index}>{ability}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="racial-traits">
              <h4>Racial Traits</h4>
              <ul>
                {selectedRaceData.traits.map((trait, index) => (
                  <li key={index}>{trait}</li>
                ))}
              </ul>
            </div>

            <div className="race-selection-actions">
              <button
                className="confirm-race-button"
                onClick={confirmRaceSelection}
              >
                Confirm {selectedRaceData.name}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="race-confirmed">
          <h3>Species Confirmed: {character.species}</h3>
          <div className="confirmed-race-summary">
            <p>{selectedRaceData.description}</p>

            {Object.keys(selectedRaceData.attributeModifiers).length > 0 && (
              <div className="applied-modifiers">
                <h4>Applied Attribute Modifiers</h4>
                <ul>
                  {Object.entries(selectedRaceData.attributeModifiers).map(
                    ([attr, modifier]) => (
                      <li key={attr}>
                        {attr}: {modifier > 0 ? '+' : ''}
                        {modifier}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            <div className="special-abilities-summary">
              <h4>Your Special Abilities</h4>
              <ul>
                {selectedRaceData.specialAbilities.map((ability, index) => (
                  <li key={index}>{ability}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="race-actions">
            <button className="change-race-button" onClick={resetRaceSelection}>
              Change Species
            </button>
          </div>
        </div>
      )}

      <div className="current-character-info">
        <h4>Current Character</h4>
        <p>
          <strong>Species:</strong> {character.species}
        </p>
        <p>
          <strong>Name:</strong> {character.name || 'Unnamed'}
        </p>
      </div>
    </div>
  );
}
