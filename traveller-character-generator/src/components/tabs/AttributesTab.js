import React, { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import {
  generateAttributes2d6,
  generateAttributes3d6DropLowest,
  roll2d6,
  roll3d6DropLowest,
} from '../../utils/dice';

export default function AttributesTab() {
  const {
    character,
    updateAttribute,
    getAttributeModifier,
    dispatch,
    CHARACTER_ACTIONS,
  } = useCharacter();
  const [rollHistory, setRollHistory] = useState([]);
  const [showRollDetails, setShowRollDetails] = useState(false);

  const handleRollAll2d6 = () => {
    if (character.attributesLocked) return;

    const newAttributes = generateAttributes2d6();
    const rollDetails = {
      method: '2d6',
      timestamp: new Date().toLocaleTimeString(),
      attributes: newAttributes,
    };

    // Update character attributes
    dispatch({
      type: CHARACTER_ACTIONS.SET_ATTRIBUTES,
      payload: newAttributes,
    });

    // Add to roll history
    setRollHistory(prev => [rollDetails, ...prev.slice(0, 4)]); // Keep last 5 rolls
  };

  const handleRoll3d6DropLowest = () => {
    if (character.attributesLocked) return;

    const result = generateAttributes3d6DropLowest();
    if (!result || !result.attributes) {
      console.error('Invalid 3d6 drop lowest result:', result);
      return;
    }

    const rollDetails = {
      method: '3d6 drop lowest',
      timestamp: new Date().toLocaleTimeString(),
      attributes: result.attributes,
      details: result.details,
    };

    // Update character attributes
    dispatch({
      type: CHARACTER_ACTIONS.SET_ATTRIBUTES,
      payload: result.attributes,
    });

    // Add to roll history
    setRollHistory(prev => [rollDetails, ...prev.slice(0, 4)]);
  };

  const handleRollSingleAttribute = attr => {
    if (character.attributesLocked) return;

    const roll = roll2d6();
    if (!roll || typeof roll.total !== 'number') {
      console.error('Invalid roll result:', roll);
      return;
    }

    updateAttribute(attr, roll.total);

    const rollDetails = {
      method: `Single ${attr}`,
      timestamp: new Date().toLocaleTimeString(),
      singleRoll: { attribute: attr, roll: roll.total, dice: roll.dice },
    };

    setRollHistory(prev => [rollDetails, ...prev.slice(0, 4)]);
  };

  const handleRollSingle3d6DropLowest = attr => {
    if (character.attributesLocked) return;

    const roll = roll3d6DropLowest();
    if (!roll || typeof roll.total !== 'number') {
      console.error('Invalid 3d6 drop lowest roll result:', roll);
      return;
    }

    updateAttribute(attr, roll.total);

    const rollDetails = {
      method: `Single ${attr} (3d6 drop lowest)`,
      timestamp: new Date().toLocaleTimeString(),
      singleRoll: {
        attribute: attr,
        roll: roll.total,
        allDice: roll.allDice,
        keptDice: roll.keptDice,
        droppedDie: roll.droppedDie,
      },
    };

    setRollHistory(prev => [rollDetails, ...prev.slice(0, 4)]);
  };

  const handleLockAttributes = () => {
    if (character.attributesLocked) {
      // Unlock attributes
      dispatch({ type: CHARACTER_ACTIONS.LOCK_ATTRIBUTES, payload: false });
    } else {
      // Lock attributes
      dispatch({ type: CHARACTER_ACTIONS.LOCK_ATTRIBUTES });
    }
  };

  const handleManualInput = (attr, value) => {
    if (character.attributesLocked) return;
    updateAttribute(attr, parseInt(value) || 0);
  };

  const calculateAttributeTotal = () => {
    return Object.values(character.attributes).reduce(
      (sum, value) => sum + value,
      0
    );
  };

  const getAttributeDescription = attr => {
    const descriptions = {
      STR: 'Physical power and muscle. Used for melee combat, carrying capacity, and physical tasks.',
      DEX: 'Agility, reflexes, and fine motor control. Used for ranged combat, piloting, and stealth.',
      END: 'Stamina, health, and constitution. Determines physical damage capacity and endurance.',
      INT: 'Reasoning ability and memory. Used for technical skills and problem-solving.',
      EDU: 'Formal and informal learning. Determines background skill points and knowledge.',
      SOC: 'Social class and connections. Used for social interactions and influence.',
    };
    return descriptions[attr] || '';
  };

  return (
    <div className="attributes-tab">
      <h2>Character Attributes</h2>
      <p>
        Roll or set your character's attributes. In Traveller, attributes range
        from 2-12 (2d6) or 2-18+ and determine your character's basic
        capabilities.
      </p>

      <div className="attributes-section">
        <div className="attribute-summary">
          <div className="summary-stats">
            <span className="stat-item">
              <strong>Total:</strong> {calculateAttributeTotal()}
            </span>
            <span className="stat-item">
              <strong>Average:</strong>{' '}
              {(calculateAttributeTotal() / 6).toFixed(1)}
            </span>
            <span className="stat-item">
              <strong>Physical Total:</strong>{' '}
              {character.attributes.STR +
                character.attributes.DEX +
                character.attributes.END}
            </span>
          </div>
        </div>

        <div className="attribute-grid">
          {Object.entries(character.attributes).map(([attr, value]) => (
            <div key={attr} className="attribute-control">
              <label className="attr-label" htmlFor={`attr-${attr}`}>
                {attr}
              </label>
              <div className="attr-input-group">
                <input
                  id={`attr-${attr}`}
                  type="number"
                  min="1"
                  max="18"
                  value={value}
                  onChange={e => handleManualInput(attr, e.target.value)}
                  className="attr-input"
                  disabled={character.attributesLocked}
                />
                <span className="attr-modifier">
                  DM: {getAttributeModifier(value) >= 0 ? '+' : ''}
                  {getAttributeModifier(value)}
                </span>
              </div>
              <div className="attr-actions">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleRollSingleAttribute(attr)}
                  disabled={character.attributesLocked}
                  title="Roll 2d6 for this attribute"
                >
                  2d6
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleRollSingle3d6DropLowest(attr)}
                  disabled={character.attributesLocked}
                  title="Roll 3d6 drop lowest for this attribute"
                >
                  3d6↓
                </button>
              </div>
              <div className="attr-description">
                <small>{getAttributeDescription(attr)}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="attribute-actions">
          <button
            className="btn btn-primary"
            onClick={handleRollAll2d6}
            disabled={character.attributesLocked}
          >
            Roll All Attributes (2d6)
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleRoll3d6DropLowest}
            disabled={character.attributesLocked}
          >
            Roll All Attributes (3d6 drop lowest)
          </button>
          <button
            className={`btn ${character.attributesLocked ? 'btn-warning' : 'btn-success'}`}
            onClick={handleLockAttributes}
          >
            {character.attributesLocked
              ? 'Unlock Attributes'
              : 'Lock Attributes'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowRollDetails(!showRollDetails)}
          >
            {showRollDetails ? 'Hide' : 'Show'} Roll History
          </button>
        </div>
      </div>

      {showRollDetails && rollHistory.length > 0 && (
        <div className="roll-history">
          <h3>Roll History</h3>
          <div className="history-list">
            {rollHistory.map((roll, index) => (
              <div key={index} className="history-item">
                <div className="history-header">
                  <strong>{roll.method}</strong>
                  <span className="timestamp">{roll.timestamp}</span>
                </div>
                {roll.attributes && (
                  <div className="history-attributes">
                    {Object.entries(roll.attributes).map(([attr, value]) => (
                      <span key={attr} className="attr-result">
                        {attr}: {value}
                      </span>
                    ))}
                  </div>
                )}
                {roll.singleRoll && (
                  <div className="history-single">
                    <span className="single-result">
                      {roll.singleRoll.attribute}: {roll.singleRoll.roll}
                      {roll.singleRoll.dice &&
                        ` (${roll.singleRoll.dice.join(', ')})`}
                      {roll.singleRoll.keptDice &&
                        ` (kept: ${roll.singleRoll.keptDice.join(', ')}, dropped: ${roll.singleRoll.droppedDie})`}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="attribute-info">
        <h3>Attribute Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <strong>Rolling Methods:</strong>
            <ul>
              <li>
                <strong>2d6:</strong> Standard Traveller method (2-12 range)
              </li>
              <li>
                <strong>3d6 drop lowest:</strong> Higher average results (2-12
                range, better odds)
              </li>
            </ul>
          </div>
          <div className="info-item">
            <strong>Dice Modifiers (DM):</strong>
            <p>Calculated as (Attribute - 6) ÷ 3, rounded down</p>
            <ul>
              <li>3-5: -1 DM</li>
              <li>6-8: +0 DM</li>
              <li>9-11: +1 DM</li>
              <li>12-14: +2 DM</li>
              <li>15+: +3 DM</li>
            </ul>
          </div>
          <div className="info-item">
            <strong>Physical Damage:</strong>
            <p>
              Your physical damage capacity is STR + DEX + END ={' '}
              {character.attributes.STR +
                character.attributes.DEX +
                character.attributes.END}
            </p>
          </div>
        </div>

        <div className="attribute-details">
          <h4>Detailed Attribute Descriptions</h4>
          <div className="details-grid">
            {Object.entries(character.attributes).map(([attr, value]) => (
              <div key={attr} className="detail-item">
                <h5>
                  {attr} ({value}) - DM{' '}
                  {getAttributeModifier(value) >= 0 ? '+' : ''}
                  {getAttributeModifier(value)}
                </h5>
                <p>{getAttributeDescription(attr)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
