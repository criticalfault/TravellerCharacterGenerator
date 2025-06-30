import React from 'react';
import { useCharacter } from '../../context/CharacterContext';

export default function SummaryTab() {
  const { character, getAttributeModifier } = useCharacter();

  const exportCharacter = () => {
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

  return (
    <div className="summary-tab">
      <h2>Character Summary</h2>
      <p>Complete overview of your Traveller character.</p>
      
      <div className="character-sheet">
        <div className="character-header">
          <div className="basic-info-summary">
            <h3>{character.name || "Unnamed Character"}</h3>
            <p><strong>Species:</strong> {character.species}</p>
            <p><strong>Age:</strong> {character.age}</p>
          </div>
        </div>
        
        <div className="attributes-summary">
          <h4>Attributes</h4>
          <div className="attributes-grid-summary">
            {Object.entries(character.attributes).map(([attr, value]) => (
              <div key={attr} className="attribute-summary">
                <span className="attr-name">{attr}</span>
                <span className="attr-value">{value}</span>
                <span className="attr-modifier">({getAttributeModifier(value) >= 0 ? '+' : ''}{getAttributeModifier(value)})</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="skills-summary">
          <h4>Skills</h4>
          {Object.keys(character.skills).length > 0 ? (
            <div className="skills-list-summary">
              {Object.entries(character.skills)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([skill, level]) => (
                  <div key={skill} className="skill-summary">
                    <span className="skill-name">{skill}</span>
                    <span className="skill-level">{level}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p>No skills acquired.</p>
          )}
        </div>
        
        <div className="career-summary">
          <h4>Career History</h4>
          {character.careerHistory.length > 0 ? (
            <div className="career-history-summary">
              {character.careerHistory.map((career, index) => (
                <div key={index} className="career-summary-item">
                  <h5>{career.career} - {career.assignment}</h5>
                  <p>
                    <strong>Terms:</strong> {career.terms} | 
                    <strong> Rank:</strong> {career.rank} {career.rankTitle && `(${career.rankTitle})`}
                  </p>
                  {career.events.length > 0 && (
                    <div className="career-events-summary">
                      <strong>Notable Events:</strong>
                      <ul>
                        {career.events.map((event, eventIndex) => (
                          <li key={eventIndex}>Term {event.term}: {event.description}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No career history.</p>
          )}
        </div>
        
        <div className="relationships-summary">
          <h4>Relationships</h4>
          <div className="relationships-grid">
            {character.contacts.length > 0 && (
              <div className="relationship-type">
                <strong>Contacts:</strong>
                <ul>
                  {character.contacts.map((contact, index) => (
                    <li key={index}>{contact}</li>
                  ))}
                </ul>
              </div>
            )}
            {character.allies.length > 0 && (
              <div className="relationship-type">
                <strong>Allies:</strong>
                <ul>
                  {character.allies.map((ally, index) => (
                    <li key={index}>{ally}</li>
                  ))}
                </ul>
              </div>
            )}
            {character.enemies.length > 0 && (
              <div className="relationship-type">
                <strong>Enemies:</strong>
                <ul>
                  {character.enemies.map((enemy, index) => (
                    <li key={index}>{enemy}</li>
                  ))}
                </ul>
              </div>
            )}
            {character.rivals.length > 0 && (
              <div className="relationship-type">
                <strong>Rivals:</strong>
                <ul>
                  {character.rivals.map((rival, index) => (
                    <li key={index}>{rival}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {character.contacts.length === 0 && character.allies.length === 0 && 
           character.enemies.length === 0 && character.rivals.length === 0 && (
            <p>No relationships established.</p>
          )}
        </div>
        
        <div className="possessions-summary">
          <h4>Possessions</h4>
          <div className="possessions-grid">
            <div className="possession-type">
              <strong>Credits:</strong> {character.money.toLocaleString()} Cr
            </div>
            {character.gear.length > 0 && (
              <div className="possession-type">
                <strong>Equipment:</strong>
                <ul>
                  {character.gear.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {character.cyberware.length > 0 && (
              <div className="possession-type">
                <strong>Cyberware:</strong>
                <ul>
                  {character.cyberware.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="health-summary">
          <h4>Health</h4>
          <p><strong>Physical Damage:</strong> {character.damage.current} / {character.damage.max}</p>
          {character.injuries.length > 0 && (
            <div>
              <strong>Injuries:</strong>
              <ul>
                {character.injuries.map((injury, index) => (
                  <li key={index}>{injury}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="summary-actions">
        <button className="btn btn-primary" onClick={exportCharacter}>
          Export Character
        </button>
        <button className="btn btn-secondary">
          Print Character Sheet
        </button>
      </div>
    </div>
  );
}