import React from 'react';
import { useCharacter } from '../../context/CharacterContext';

export default function AttributesTab() {
  const { character, updateAttribute, getAttributeModifier } = useCharacter();

  return (
    <div className="attributes-tab">
      <h2>Character Attributes</h2>
      <p>Roll or set your character's attributes. In Traveller, attributes range from 1-15+ and determine your character's basic capabilities.</p>
      
      <div className="attributes-section">
        <div className="attribute-grid">
          {Object.entries(character.attributes).map(([attr, value]) => (
            <div key={attr} className="attribute-control">
              <label className="attr-label">{attr}</label>
              <div className="attr-input-group">
                <input
                  type="number"
                  min="1"
                  max="18"
                  value={value}
                  onChange={(e) => updateAttribute(attr, parseInt(e.target.value) || 0)}
                  className="attr-input"
                  disabled={character.attributesLocked}
                />
                <span className="attr-modifier">
                  DM: {getAttributeModifier(value) >= 0 ? '+' : ''}{getAttributeModifier(value)}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="attribute-actions">
          <button className="btn btn-primary" disabled={character.attributesLocked}>
            Roll All Attributes (2d6)
          </button>
          <button className="btn btn-secondary" disabled={character.attributesLocked}>
            Roll All Attributes (3d6 drop lowest)
          </button>
          <button className="btn btn-success">
            {character.attributesLocked ? 'Attributes Locked' : 'Lock Attributes'}
          </button>
        </div>
      </div>
      
      <div className="attribute-info">
        <h3>Attribute Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <strong>STR (Strength):</strong> Physical power and muscle
          </div>
          <div className="info-item">
            <strong>DEX (Dexterity):</strong> Agility, reflexes, and fine motor control
          </div>
          <div className="info-item">
            <strong>END (Endurance):</strong> Stamina, health, and constitution
          </div>
          <div className="info-item">
            <strong>INT (Intelligence):</strong> Reasoning ability and memory
          </div>
          <div className="info-item">
            <strong>EDU (Education):</strong> Formal and informal learning
          </div>
          <div className="info-item">
            <strong>SOC (Social Standing):</strong> Social class and connections
          </div>
        </div>
      </div>
    </div>
  );
}