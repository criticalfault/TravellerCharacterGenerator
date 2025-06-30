import React from 'react';
import { useCharacter } from '../../context/CharacterContext';

const BACKGROUND_SKILLS = [
  'Admin', 'Electronics', 'Science', 'Animals', 'Flyer', 'Seafarer',
  'Art', 'Language', 'Streetwise', 'Athletics', 'Mechanic', 'Survival',
  'Carouse', 'Medic', 'Vacc Suit', 'Drive', 'Profession'
];

export default function BackgroundSkillsTab() {
  const { character, addSkill, getAttributeModifier } = useCharacter();
  
  // Calculate available skill points (3 + Education DM)
  const availablePoints = 3 + getAttributeModifier(character.attributes.EDU);
  const usedPoints = Object.values(character.skills).reduce((sum, level) => sum + level, 0);
  const remainingPoints = Math.max(0, availablePoints - usedPoints);

  const handleSkillAdd = (skillName) => {
    if (remainingPoints > 0) {
      addSkill(skillName, 1);
    }
  };

  return (
    <div className="background-skills-tab">
      <h2>Background Skills</h2>
      <p>
        Select background skills based on your character's education and early life. 
        You have <strong>{availablePoints}</strong> skill points to spend (3 + Education DM of {getAttributeModifier(character.attributes.EDU)}).
      </p>
      
      <div className="skill-points-display">
        <div className="points-info">
          <span className="points-available">Available: {availablePoints}</span>
          <span className="points-used">Used: {usedPoints}</span>
          <span className="points-remaining">Remaining: {remainingPoints}</span>
        </div>
      </div>
      
      <div className="skills-section">
        <h3>Available Background Skills</h3>
        <div className="skills-grid">
          {BACKGROUND_SKILLS.map(skill => (
            <div key={skill} className="skill-item">
              <span className="skill-name">{skill}</span>
              <div className="skill-controls">
                <span className="skill-level">
                  Level: {character.skills[skill] || 0}
                </span>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleSkillAdd(skill)}
                  disabled={remainingPoints <= 0}
                >
                  Add +1
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="selected-skills">
        <h3>Selected Skills</h3>
        {Object.keys(character.skills).length > 0 ? (
          <div className="selected-skills-list">
            {Object.entries(character.skills).map(([skill, level]) => (
              <div key={skill} className="selected-skill">
                <span className="skill-name">{skill}</span>
                <span className="skill-level">Level {level}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No skills selected yet.</p>
        )}
      </div>
      
      <div className="background-info">
        <h3>Background Skills Information</h3>
        <p>
          Background skills represent training and experience gained before beginning your career. 
          These skills are typically learned through education, hobbies, or early life experiences.
        </p>
        <p>
          The number of background skill points you receive is based on your Education attribute. 
          Higher education provides more opportunities to learn diverse skills.
        </p>
      </div>
    </div>
  );
}