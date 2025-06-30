import React, { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';

const BACKGROUND_SKILLS = [
  'Admin', 'Electronics', 'Science', 'Animals', 'Flyer', 'Seafarer',
  'Art', 'Language', 'Streetwise', 'Athletics', 'Mechanic', 'Survival',
  'Carouse', 'Medic', 'Vacc Suit', 'Drive', 'Profession'
];

// Skill descriptions for better user understanding
const SKILL_DESCRIPTIONS = {
  'Admin': 'Bureaucracy, paperwork, and organizational management',
  'Electronics': 'Understanding and operating electronic devices and systems',
  'Science': 'General scientific knowledge and research methods',
  'Animals': 'Handling, training, and understanding animal behavior',
  'Flyer': 'Operating flying vehicles and aircraft',
  'Seafarer': 'Navigation and operation of watercraft',
  'Art': 'Creative expression through various artistic mediums',
  'Language': 'Communication in foreign languages',
  'Streetwise': 'Understanding urban environments and criminal activities',
  'Athletics': 'Physical fitness, sports, and bodily coordination',
  'Mechanic': 'Repair and maintenance of mechanical devices',
  'Survival': 'Living and thriving in wilderness environments',
  'Carouse': 'Social drinking, partying, and gathering information',
  'Medic': 'First aid, medical treatment, and healthcare',
  'Vacc Suit': 'Operating in vacuum and zero-gravity environments',
  'Drive': 'Operating ground vehicles and transportation',
  'Profession': 'Specialized trade or professional knowledge'
};

export default function BackgroundSkillsTab() {
  const { character, addSkill, updateSkill, dispatch, getAttributeModifier, CHARACTER_ACTIONS } = useCharacter();
  const [selectedSkillInfo, setSelectedSkillInfo] = useState(null);
  const [showSkillDescriptions, setShowSkillDescriptions] = useState(false);
  
  // Calculate available skill points (3 + Education DM)
  const basePoints = 3;
  const educationDM = getAttributeModifier(character.attributes.EDU);
  const availablePoints = Math.max(1, basePoints + educationDM); // Minimum 1 point
  const usedPoints = Object.values(character.skills).reduce((sum, level) => sum + level, 0);
  const remainingPoints = Math.max(0, availablePoints - usedPoints);

  const handleSkillAdd = (skillName) => {
    if (remainingPoints > 0) {
      addSkill(skillName, 1);
    }
  };

  const handleSkillRemove = (skillName) => {
    const currentLevel = character.skills[skillName] || 0;
    if (currentLevel > 0) {
      if (currentLevel === 1) {
        // Remove skill entirely if it would go to 0
        dispatch({
          type: CHARACTER_ACTIONS.REMOVE_SKILL,
          payload: skillName
        });
      } else {
        // Reduce skill level by 1
        updateSkill(skillName, currentLevel - 1);
      }
    }
  };

  const handleSkillLevelChange = (skillName, newLevel) => {
    const currentLevel = character.skills[skillName] || 0;
    const levelDifference = newLevel - currentLevel;
    
    // Check if we have enough points for the increase
    if (levelDifference > 0 && levelDifference > remainingPoints) {
      // If not enough points, set to maximum possible level
      const maxPossibleLevel = currentLevel + remainingPoints;
      newLevel = Math.min(newLevel, maxPossibleLevel);
    }
    
    if (newLevel <= 0) {
      // Remove skill if level is 0 or less
      dispatch({
        type: CHARACTER_ACTIONS.REMOVE_SKILL,
        payload: skillName
      });
    } else {
      updateSkill(skillName, newLevel);
    }
  };

  const resetAllSkills = () => {
    if (window.confirm('Are you sure you want to reset all background skills?')) {
      // Remove all skills one by one
      Object.keys(character.skills).forEach(skillName => {
        dispatch({
          type: CHARACTER_ACTIONS.REMOVE_SKILL,
          payload: skillName
        });
      });
    }
  };

  const finishBackgroundSkills = () => {
    dispatch({
      type: CHARACTER_ACTIONS.SET_BACKGROUND_SKILLS_SELECTED,
      payload: true
    });
  };

  const getSkillLevel = (skillName) => {
    return character.skills[skillName] || 0;
  };

  const isSkillMaxed = (skillName) => {
    // Background skills typically max at level 3
    return getSkillLevel(skillName) >= 3;
  };

  return (
    <div className="background-skills-tab">
      <h2>Background Skills</h2>
      <p>
        Select background skills based on your character's education and early life. 
        You have <strong>{availablePoints}</strong> skill points to spend 
        ({basePoints} base + Education DM of {educationDM >= 0 ? '+' : ''}{educationDM}).
      </p>
      
      <div className="skill-points-display">
        <div className="points-info">
          <span className="points-available">Available: {availablePoints}</span>
          <span className="points-used">Used: {usedPoints}</span>
          <span className="points-remaining">Remaining: {remainingPoints}</span>
        </div>
        <div className="skill-actions">
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setShowSkillDescriptions(!showSkillDescriptions)}
          >
            {showSkillDescriptions ? 'Hide' : 'Show'} Skill Descriptions
          </button>
          <button 
            className="btn btn-warning btn-sm"
            onClick={resetAllSkills}
            disabled={usedPoints === 0}
          >
            Reset All Skills
          </button>
          <button 
            className="btn btn-success"
            onClick={finishBackgroundSkills}
            disabled={character.backgroundSkillsSelected}
          >
            {character.backgroundSkillsSelected ? 'Background Skills Complete' : 'Finish Background Skills'}
          </button>
        </div>
      </div>
      
      <div className="skills-section">
        <h3>Available Background Skills</h3>
        <div className="skills-grid">
          {BACKGROUND_SKILLS.map(skill => {
            const currentLevel = getSkillLevel(skill);
            const isMaxed = isSkillMaxed(skill);
            
            return (
              <div 
                key={skill} 
                className={`skill-item ${currentLevel > 0 ? 'skill-selected' : ''} ${isMaxed ? 'skill-maxed' : ''}`}
                onMouseEnter={() => setSelectedSkillInfo(skill)}
                onMouseLeave={() => setSelectedSkillInfo(null)}
              >
                <div className="skill-header">
                  <span className="skill-name">{skill}</span>
                  <span className="skill-level-display">Level {currentLevel}</span>
                </div>
                
                {showSkillDescriptions && (
                  <div className="skill-description">
                    <small>{SKILL_DESCRIPTIONS[skill]}</small>
                  </div>
                )}
                
                <div className="skill-controls">
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleSkillRemove(skill)}
                    disabled={currentLevel === 0 || character.backgroundSkillsSelected}
                    title="Remove one level"
                  >
                    -
                  </button>
                  
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={currentLevel}
                    onChange={(e) => handleSkillLevelChange(skill, parseInt(e.target.value) || 0)}
                    className="skill-level-input"
                    disabled={character.backgroundSkillsSelected}
                  />
                  
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleSkillAdd(skill)}
                    disabled={remainingPoints <= 0 || isMaxed || character.backgroundSkillsSelected}
                    title="Add one level"
                  >
                    +
                  </button>
                </div>
                
                {selectedSkillInfo === skill && !showSkillDescriptions && (
                  <div className="skill-tooltip">
                    {SKILL_DESCRIPTIONS[skill]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="selected-skills">
        <h3>Selected Skills Summary</h3>
        {Object.keys(character.skills).length > 0 ? (
          <div className="selected-skills-list">
            {Object.entries(character.skills)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([skill, level]) => (
                <div key={skill} className="selected-skill">
                  <span className="skill-name">{skill}</span>
                  <span className="skill-level">Level {level}</span>
                  <button
                    className="btn btn-sm btn-danger remove-skill-btn"
                    onClick={() => handleSkillRemove(skill)}
                    disabled={character.backgroundSkillsSelected}
                    title="Remove one level"
                  >
                    -1
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <p>No skills selected yet. Choose from the available background skills above.</p>
        )}
      </div>
      
      <div className="background-info">
        <h3>Background Skills Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <strong>What are Background Skills?</strong>
            <p>
              Background skills represent training and experience gained before beginning your career. 
              These skills are typically learned through education, hobbies, or early life experiences.
            </p>
          </div>
          <div className="info-item">
            <strong>Skill Points Calculation:</strong>
            <p>
              You receive 3 base skill points plus your Education DM. 
              Higher education provides more opportunities to learn diverse skills.
              Minimum 1 skill point is guaranteed regardless of Education.
            </p>
          </div>
          <div className="info-item">
            <strong>Skill Levels:</strong>
            <p>
              Background skills can be raised to a maximum of level 3. 
              Each level represents increasing competency in that skill area.
            </p>
          </div>
          <div className="info-item">
            <strong>Skill Usage:</strong>
            <p>
              These skills will be available throughout your character's career and adventures. 
              They provide bonuses to related skill checks and open up new possibilities.
            </p>
          </div>
        </div>
      </div>
      
      {character.backgroundSkillsSelected && (
        <div className="completion-notice">
          <h4>Background Skills Complete</h4>
          <p>You have finished selecting your background skills. You can now proceed to career selection.</p>
        </div>
      )}
    </div>
  );
}