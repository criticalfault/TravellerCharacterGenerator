import React, { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import raceData from '../../data/races.json';
import weaponsData from '../../data/weapons.json';
import armorData from '../../data/armor.json';
import equipmentData from '../../data/equipment.json';

export default function CharacterSheetTab() {
  const { character, dispatch, CHARACTER_ACTIONS, getAttributeModifier } = useCharacter();
  const [damageMode, setDamageMode] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState('');
  const [damageAmount, setDamageAmount] = useState(1);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [loadData, setLoadData] = useState('');

  // Get species data for bonuses and abilities
  const getSpeciesData = () => {
    return raceData[character.species] || raceData['Human'];
  };

  // Get equipment details from data files
  const getEquipmentDetails = (itemName) => {
    // Check weapons
    const weapon = weaponsData.weapons?.find(w => w.name === itemName);
    if (weapon) return { ...weapon, type: 'weapon' };

    // Check armor
    const armor = armorData.armor?.find(a => a.name === itemName);
    if (armor) return { ...armor, type: 'armor' };

    // Check equipment
    const equipment = equipmentData.equipment?.find(e => e.name === itemName);
    if (equipment) return { ...equipment, type: 'equipment' };

    return null;
  };

  // Apply damage to attribute
  const applyDamage = () => {
    if (!selectedAttribute || damageAmount <= 0) return;

    dispatch({
      type: CHARACTER_ACTIONS.APPLY_DAMAGE,
      payload: { attribute: selectedAttribute, amount: damageAmount }
    });

    setSelectedAttribute('');
    setDamageAmount(1);
  };

  // Heal damage from attribute
  const healDamage = (attribute, amount = 1) => {
    dispatch({
      type: CHARACTER_ACTIONS.HEAL_DAMAGE,
      payload: { attribute, amount }
    });
  };

  // Full heal all attributes
  const fullHeal = () => {
    dispatch({
      type: CHARACTER_ACTIONS.SET_CURRENT_ATTRIBUTES,
      payload: { ...character.attributes }
    });
  };

  // Save character to JSON
  const saveCharacter = () => {
    const characterData = JSON.stringify(character, null, 2);
    const blob = new Blob([characterData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${character.name || 'character'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load character from JSON
  const loadCharacter = () => {
    try {
      const characterData = JSON.parse(loadData);
      dispatch({
        type: CHARACTER_ACTIONS.LOAD_CHARACTER,
        payload: characterData
      });
      setShowLoadDialog(false);
      setLoadData('');
      alert('Character loaded successfully!');
    } catch (error) {
      alert('Invalid character data. Please check the JSON format.');
    }
  };

  // Organize gear by category
  const organizeGear = () => {
    const organized = {
      weapons: [],
      armor: [],
      equipment: [],
      other: []
    };

    character.gear.forEach(item => {
      const itemName = typeof item === 'string' ? item : item.name;
      const details = getEquipmentDetails(itemName);
      
      if (details) {
        organized[details.type === 'weapon' ? 'weapons' : details.type === 'armor' ? 'armor' : 'equipment'].push({
          ...item,
          details
        });
      } else {
        organized.other.push(item);
      }
    });

    return organized;
  };

  const speciesData = getSpeciesData();
  const organizedGear = organizeGear();

  // Equipment tooltip component
  const EquipmentTooltip = ({ item, children }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const itemName = typeof item === 'string' ? item : item.name;
    const details = typeof item === 'object' && item.details ? item.details : getEquipmentDetails(itemName);

    if (!details) return children;

    return (
      <div 
        className="equipment-item-wrapper"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
        {showTooltip && (
          <div className="equipment-tooltip">
            <div className="tooltip-header">
              <strong>{details.name}</strong>
              <span className="tech-level">TL{details.tech_level}</span>
            </div>
            
            {details.type === 'weapon' && (
              <div className="weapon-stats">
                <div><strong>Damage:</strong> {details.damage}</div>
                {details.range && <div><strong>Range:</strong> {details.range}</div>}
                {details.traits && details.traits.length > 0 && (
                  <div><strong>Traits:</strong> {details.traits.join(', ')}</div>
                )}
              </div>
            )}
            
            {details.type === 'armor' && (
              <div className="armor-stats">
                <div><strong>Protection:</strong> {details.protection}</div>
                {details.traits && details.traits.length > 0 && (
                  <div><strong>Traits:</strong> {details.traits.join(', ')}</div>
                )}
              </div>
            )}
            
            <div className="equipment-description">
              {details.description}
            </div>
            
            <div className="equipment-footer">
              <div><strong>Cost:</strong> {details.cost?.toLocaleString()} Cr</div>
              {details.mass && <div><strong>Mass:</strong> {details.mass} kg</div>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="character-sheet">
      <div className="character-sheet-header">
        <div className="character-basic-info">
          <h1>{character.name || 'Unnamed Character'}</h1>
          <div className="basic-details">
            <span><strong>Species:</strong> {character.species}</span>
            <span><strong>Age:</strong> {character.age}</span>
            <span><strong>Credits:</strong> {character.money.toLocaleString()} Cr</span>
          </div>
        </div>
        
        <div className="character-actions">
          <button className="btn btn-primary" onClick={saveCharacter}>
            Save Character
          </button>
          <button className="btn btn-secondary" onClick={() => setShowLoadDialog(true)}>
            Load Character
          </button>
          <button 
            className={`btn ${damageMode ? 'btn-danger' : 'btn-warning'}`}
            onClick={() => setDamageMode(!damageMode)}
          >
            {damageMode ? 'Exit Damage Mode' : 'Damage Mode'}
          </button>
        </div>
      </div>

      <div className="character-sheet-content">
        {/* Characteristics Section */}
        <div className="characteristics-section">
          <h2>Characteristics</h2>
          <div className="characteristics-grid">
            {Object.entries(character.attributes).map(([attr, maxValue]) => {
              const currentValue = character.currentAttributes[attr];
              const modifier = getAttributeModifier(currentValue);
              const isDamaged = currentValue < maxValue;
              
              return (
                <div key={attr} className={`characteristic ${isDamaged ? 'damaged' : ''}`}>
                  <div className="char-name">{attr}</div>
                  <div className="char-values">
                    <span className="current-value">{currentValue}</span>
                    {isDamaged && <span className="max-value">/{maxValue}</span>}
                  </div>
                  <div className="char-modifier">
                    DM{modifier >= 0 ? '+' : ''}{modifier}
                  </div>
                  {damageMode && (
                    <div className="damage-controls">
                      <button 
                        className="damage-btn"
                        onClick={() => dispatch({
                          type: CHARACTER_ACTIONS.APPLY_DAMAGE,
                          payload: { attribute: attr, amount: 1 }
                        })}
                        disabled={currentValue <= 0}
                      >
                        -1
                      </button>
                      <button 
                        className="heal-btn"
                        onClick={() => healDamage(attr, 1)}
                        disabled={currentValue >= maxValue}
                      >
                        +1
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {damageMode && (
            <div className="damage-panel">
              <h3>Apply Damage</h3>
              <div className="damage-form">
                <select 
                  value={selectedAttribute} 
                  onChange={(e) => setSelectedAttribute(e.target.value)}
                >
                  <option value="">Select Attribute</option>
                  {Object.keys(character.attributes).map(attr => (
                    <option key={attr} value={attr}>{attr}</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  min="1" 
                  value={damageAmount}
                  onChange={(e) => setDamageAmount(parseInt(e.target.value) || 1)}
                />
                <button className="btn btn-danger" onClick={applyDamage}>
                  Apply Damage
                </button>
                <button className="btn btn-success" onClick={fullHeal}>
                  Full Heal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Skills Section */}
        <div className="skills-section">
          <h2>Skills</h2>
          <div className="skills-grid">
            {Object.entries(character.skills).length === 0 ? (
              <p>No skills learned yet.</p>
            ) : (
              Object.entries(character.skills)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([skill, level]) => (
                  <div key={skill} className="skill-item">
                    <span className="skill-name">{skill}</span>
                    <span className="skill-level">{level}</span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Species Bonuses Section */}
        {speciesData && (speciesData.attributeModifiers || speciesData.abilities) && (
          <div className="species-section">
            <h2>{character.species} Traits</h2>
            
            {speciesData.attributeModifiers && (
              <div className="attribute-modifiers">
                <h3>Attribute Modifiers</h3>
                <div className="modifiers-list">
                  {Object.entries(speciesData.attributeModifiers).map(([attr, mod]) => (
                    <span key={attr} className="modifier">
                      {attr} {mod >= 0 ? '+' : ''}{mod}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {speciesData.abilities && speciesData.abilities.length > 0 && (
              <div className="species-abilities">
                <h3>Special Abilities</h3>
                <ul>
                  {speciesData.abilities.map((ability, index) => (
                    <li key={index}>{ability}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Equipment Section */}
        <div className="equipment-section">
          <h2>Equipment</h2>
          
          {organizedGear.weapons.length > 0 && (
            <div className="equipment-category">
              <h3>Weapons</h3>
              <div className="equipment-list">
                {organizedGear.weapons.map((item, index) => (
                  <EquipmentTooltip key={index} item={item}>
                    <div className="equipment-item weapon">
                      <span className="item-name">
                        {typeof item === 'string' ? item : item.name}
                      </span>
                      {item.details && (
                        <span className="item-stats">
                          {item.details.damage}
                        </span>
                      )}
                    </div>
                  </EquipmentTooltip>
                ))}
              </div>
            </div>
          )}

          {organizedGear.armor.length > 0 && (
            <div className="equipment-category">
              <h3>Armor</h3>
              <div className="equipment-list">
                {organizedGear.armor.map((item, index) => (
                  <EquipmentTooltip key={index} item={item}>
                    <div className="equipment-item armor">
                      <span className="item-name">
                        {typeof item === 'string' ? item : item.name}
                      </span>
                      {item.details && (
                        <span className="item-stats">
                          Protection {item.details.protection}
                        </span>
                      )}
                    </div>
                  </EquipmentTooltip>
                ))}
              </div>
            </div>
          )}

          {organizedGear.equipment.length > 0 && (
            <div className="equipment-category">
              <h3>Equipment</h3>
              <div className="equipment-list">
                {organizedGear.equipment.map((item, index) => (
                  <EquipmentTooltip key={index} item={item}>
                    <div className="equipment-item equipment">
                      <span className="item-name">
                        {typeof item === 'string' ? item : item.name}
                      </span>
                    </div>
                  </EquipmentTooltip>
                ))}
              </div>
            </div>
          )}

          {organizedGear.other.length > 0 && (
            <div className="equipment-category">
              <h3>Other Items</h3>
              <div className="equipment-list">
                {organizedGear.other.map((item, index) => (
                  <div key={index} className="equipment-item other">
                    <span className="item-name">
                      {typeof item === 'string' ? item : item.name}
                    </span>
                    {typeof item === 'object' && item.description && (
                      <span className="item-description">{item.description}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {character.cyberware.length > 0 && (
            <div className="equipment-category">
              <h3>Cyberware</h3>
              <div className="equipment-list">
                {character.cyberware.map((item, index) => (
                  <div key={index} className="equipment-item cyberware">
                    <span className="item-name">
                      {typeof item === 'string' ? item : item.name}
                    </span>
                    {typeof item === 'object' && item.description && (
                      <span className="item-description">{item.description}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {character.gear.length === 0 && character.cyberware.length === 0 && (
            <p>No equipment owned.</p>
          )}
        </div>

        {/* Career History Section */}
        {character.careerHistory.length > 0 && (
          <div className="career-section">
            <h2>Career History</h2>
            <div className="career-list">
              {character.careerHistory.map((career, index) => (
                <div key={index} className="career-item">
                  <div className="career-header">
                    <h3>{career.career} - {career.assignment}</h3>
                    <div className="career-stats">
                      <span>Terms: {career.terms}</span>
                      <span>Rank: {career.rank} {career.rankTitle && `(${career.rankTitle})`}</span>
                      {career.commissioned && <span className="commissioned">Officer</span>}
                    </div>
                  </div>
                  {career.events && career.events.length > 0 && (
                    <div className="career-events">
                      <strong>Notable Events:</strong>
                      <ul>
                        {career.events.slice(0, 3).map((event, eventIndex) => (
                          <li key={eventIndex}>{event.description}</li>
                        ))}
                        {career.events.length > 3 && (
                          <li><em>...and {career.events.length - 3} more events</em></li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Relationships Section */}
        {(character.contacts.length > 0 || character.allies.length > 0 || 
          character.enemies.length > 0 || character.rivals.length > 0) && (
          <div className="relationships-section">
            <h2>Relationships</h2>
            <div className="relationships-grid">
              {character.contacts.length > 0 && (
                <div className="relationship-category">
                  <h3>Contacts</h3>
                  <ul>
                    {character.contacts.map((contact, index) => (
                      <li key={index}>{contact}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {character.allies.length > 0 && (
                <div className="relationship-category">
                  <h3>Allies</h3>
                  <ul>
                    {character.allies.map((ally, index) => (
                      <li key={index}>{ally}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {character.enemies.length > 0 && (
                <div className="relationship-category">
                  <h3>Enemies</h3>
                  <ul>
                    {character.enemies.map((enemy, index) => (
                      <li key={index}>{enemy}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {character.rivals.length > 0 && (
                <div className="relationship-category">
                  <h3>Rivals</h3>
                  <ul>
                    {character.rivals.map((rival, index) => (
                      <li key={index}>{rival}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Load Character Dialog */}
      {showLoadDialog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Load Character</h3>
            <p>Paste your character JSON data below:</p>
            <textarea
              value={loadData}
              onChange={(e) => setLoadData(e.target.value)}
              placeholder="Paste character JSON here..."
              rows={10}
              cols={50}
            />
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={loadCharacter}>
                Load Character
              </button>
              <button className="btn btn-secondary" onClick={() => setShowLoadDialog(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .character-sheet {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .character-sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #ddd;
        }
        
        .character-basic-info h1 {
          margin: 0 0 10px 0;
          color: #333;
        }
        
        .basic-details {
          display: flex;
          gap: 20px;
          color: #666;
        }
        
        .character-actions {
          display: flex;
          gap: 10px;
        }
        
        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        
        .btn-primary { background: #007bff; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .btn-warning { background: #ffc107; color: black; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-success { background: #28a745; color: white; }
        
        .character-sheet-content {
          display: grid;
          gap: 30px;
        }
        
        .characteristics-section h2,
        .skills-section h2,
        .species-section h2,
        .equipment-section h2,
        .career-section h2,
        .relationships-section h2 {
          color: #333;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        
        .characteristics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .characteristic {
          background: #f8f9fa;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        
        .characteristic.damaged {
          border-color: #dc3545;
          background: #f8d7da;
        }
        
        .char-name {
          font-weight: bold;
          font-size: 0.9em;
          color: #666;
          margin-bottom: 5px;
        }
        
        .char-values {
          font-size: 1.5em;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .current-value {
          color: #333;
        }
        
        .max-value {
          color: #666;
          font-size: 0.8em;
        }
        
        .char-modifier {
          font-size: 0.9em;
          color: #007bff;
          font-weight: bold;
        }
        
        .damage-controls {
          display: flex;
          gap: 5px;
          margin-top: 10px;
          justify-content: center;
        }
        
        .damage-btn, .heal-btn {
          width: 30px;
          height: 25px;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
          font-weight: bold;
        }
        
        .damage-btn {
          background: #dc3545;
          color: white;
        }
        
        .heal-btn {
          background: #28a745;
          color: white;
        }
        
        .damage-panel {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 20px;
          border-radius: 8px;
        }
        
        .damage-form {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .damage-form select,
        .damage-form input {
          padding: 5px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
        }
        
        .skill-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          border-left: 4px solid #007bff;
        }
        
        .skill-name {
          font-weight: bold;
        }
        
        .skill-level {
          background: #007bff;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.9em;
          font-weight: bold;
        }
        
        .species-section {
          background: #e7f3ff;
          padding: 20px;
          border-radius: 8px;
        }
        
        .modifiers-list {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .modifier {
          background: #007bff;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.9em;
        }
        
        .species-abilities ul {
          list-style-type: disc;
          padding-left: 20px;
        }
        
        .equipment-category {
          margin-bottom: 25px;
        }
        
        .equipment-category h3 {
          color: #495057;
          margin-bottom: 15px;
          font-size: 1.1em;
        }
        
        .equipment-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 10px;
        }
        
        .equipment-item-wrapper {
          position: relative;
        }
        
        .equipment-item {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          padding: 12px;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: help;
        }
        
        .equipment-item.weapon {
          border-left: 4px solid #dc3545;
        }
        
        .equipment-item.armor {
          border-left: 4px solid #28a745;
        }
        
        .equipment-item.equipment {
          border-left: 4px solid #17a2b8;
        }
        
        .equipment-item.cyberware {
          border-left: 4px solid #6f42c1;
        }
        
        .equipment-item.other {
          border-left: 4px solid #6c757d;
        }
        
        .item-name {
          font-weight: bold;
          flex: 1;
        }
        
        .item-stats {
          color: #666;
          font-size: 0.9em;
          font-weight: bold;
        }
        
        .item-description {
          color: #666;
          font-size: 0.8em;
          font-style: italic;
        }
        
        .equipment-tooltip {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 1000;
          background: #333;
          color: white;
          padding: 12px;
          border-radius: 6px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          min-width: 250px;
          max-width: 350px;
          font-size: 0.9em;
        }
        
        .tooltip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #555;
        }
        
        .tech-level {
          background: #007bff;
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.8em;
        }
        
        .weapon-stats, .armor-stats {
          margin: 8px 0;
        }
        
        .weapon-stats div, .armor-stats div {
          margin: 4px 0;
        }
        
        .equipment-description {
          margin: 8px 0;
          font-style: italic;
          color: #ccc;
        }
        
        .equipment-footer {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #555;
          font-size: 0.8em;
          color: #aaa;
        }
        
        .career-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .career-item {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          padding: 20px;
          border-radius: 8px;
        }
        
        .career-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .career-header h3 {
          margin: 0;
          color: #333;
        }
        
        .career-stats {
          display: flex;
          gap: 15px;
          font-size: 0.9em;
          color: #666;
        }
        
        .commissioned {
          background: #28a745;
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.8em;
        }
        
        .career-events ul {
          margin: 10px 0 0 0;
          padding-left: 20px;
        }
        
        .relationships-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        
        .relationship-category {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #007bff;
        }
        
        .relationship-category h3 {
          margin-top: 0;
          color: #333;
        }
        
        .relationship-category ul {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }
        
        .relationship-category li {
          padding: 5px 0;
          border-bottom: 1px solid #dee2e6;
        }
        
        .relationship-category li:last-child {
          border-bottom: none;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
        }
        
        .modal-content h3 {
          margin-top: 0;
        }
        
        .modal-content textarea {
          width: 100%;
          margin: 15px 0;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: monospace;
        }
        
        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        
        @media print {
          .character-actions,
          .damage-panel,
          .damage-controls {
            display: none;
          }
          
          .character-sheet {
            max-width: none;
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
}