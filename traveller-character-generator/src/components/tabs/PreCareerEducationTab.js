import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { rollWithModifier, roll2d6, roll1d6, roll1d3 } from '../../utils/dice';
import preCareerData from '../../data/preCareerEducation.json';

export default function PreCareerEducationTab() {
  const { character, dispatch, CHARACTER_ACTIONS, updateAttribute, addSkill, updateSkill, getAttributeModifier, addRelationship } = useCharacter();
  
  // Use persistent state from character context
  const currentPhase = character.preCareerCurrentPhase;
  const entryResult = character.preCareerEntryResult;
  const eventResult = character.preCareerEventResult;
  const graduationResult = character.preCareerGraduationResult;
  const educationCompleted = character.preCareerEducationCompleted;
  
  // Local state for UI interactions
  const [selectedEducation, setSelectedEducation] = useState(character.preCareerEducation);
  const [selectedAcademyType, setSelectedAcademyType] = useState(character.preCareerEducationType);
  const [skillSelections, setSkillSelections] = useState({ level0: '', level1: '' });
  const [academySkillSelections, setAcademySkillSelections] = useState([]);
  const [pendingChoices, setPendingChoices] = useState([]);

  // Check if pre-career education is available (terms 1-3 only)
  const isPreCareerAvailable = () => {
    const totalTerms = character.careerHistory.reduce((sum, career) => sum + career.terms, 0) + character.currentTerm;
    return totalTerms <= 3 && !character.preCareerEducationCompleted;
  };

  // Calculate entry roll modifiers
  const getEntryModifiers = (educationType, academyType = null) => {
    let modifiers = 0;
    const currentTermCount = character.careerHistory.reduce((sum, career) => sum + career.terms, 0) + character.currentTerm;
    
    if (educationType === 'university') {
      if (currentTermCount === 2) modifiers -= 1;
      if (currentTermCount === 3) modifiers -= 2;
      if (character.attributes.SOC >= 9) modifiers += 1;
    } else if (educationType === 'military_academy') {
      if (currentTermCount === 2) modifiers -= 2;
      if (currentTermCount === 3) modifiers -= 4;
    }
    
    return modifiers;
  };

  // Handle education selection
  const handleEducationSelection = (type, subtype = null) => {
    setSelectedEducation(type);
    setSelectedAcademyType(subtype);
    dispatch({
      type: CHARACTER_ACTIONS.SET_PRE_CAREER_PHASE,
      payload: 'entry'
    });
  };

  // Handle entry roll
  const handleEntryRoll = () => {
    const educationData = selectedEducation === 'university' 
      ? preCareerData.university 
      : preCareerData.military_academy.types[selectedAcademyType];
    
    const entry = selectedEducation === 'university' 
      ? preCareerData.university.entry 
      : educationData.entry;
    
    const attributeValue = character.attributes[entry.attribute];
    const modifiers = getEntryModifiers(selectedEducation, selectedAcademyType);
    
    const rollResult = rollWithModifier(modifiers);
    const success = rollResult.total >= entry.target;
    
    const result = {
      success,
      roll: rollResult.total,
      target: entry.target,
      attribute: entry.attribute,
      attributeValue,
      modifiers,
      formatted: `${rollResult.formatted} vs ${entry.target} = ${success ? 'SUCCESS' : 'FAILURE'}`
    };
    
    // Store entry result in persistent state
    dispatch({
      type: CHARACTER_ACTIONS.SET_PRE_CAREER_ENTRY_RESULT,
      payload: result
    });
    
    if (success) {
      // Start pre-career education
      dispatch({
        type: CHARACTER_ACTIONS.START_PRE_CAREER_EDUCATION,
        payload: {
          type: selectedEducation,
          subtype: selectedAcademyType
        }
      });
      
      if (selectedEducation === 'university') {
        // Automatic EDU +1 for university
        updateAttribute('EDU', character.attributes.EDU + 1);
        dispatch({
          type: CHARACTER_ACTIONS.SET_PRE_CAREER_PHASE,
          payload: 'skills'
        });
      } else {
        // Grant service skills at level 0 for military academy
        const serviceSkills = educationData.service_skills;
        serviceSkills.forEach(skill => {
          updateSkill(skill, 0);
        });
        dispatch({
          type: CHARACTER_ACTIONS.SET_PRE_CAREER_PHASE,
          payload: 'events'
        });
      }
    } else {
      // Entry failed - must attempt career entry or be drafted
      dispatch({
        type: CHARACTER_ACTIONS.SET_PRE_CAREER_PHASE,
        payload: 'entry_failed'
      });
    }
  };

  // Handle university skill selection
  const handleUniversitySkillSelection = () => {
    if (!skillSelections.level0 || !skillSelections.level1) {
      alert('Please select both a level 0 and level 1 skill.');
      return;
    }
    
    // Apply selected skills
    updateSkill(skillSelections.level0, 0);
    updateSkill(skillSelections.level1, 1);
    
    dispatch({
      type: CHARACTER_ACTIONS.SET_PRE_CAREER_SKILLS,
      payload: [skillSelections.level0, skillSelections.level1]
    });
    
    dispatch({
      type: CHARACTER_ACTIONS.SET_PRE_CAREER_PHASE,
      payload: 'events'
    });
  };

  // Handle military academy skill selection (for graduation benefits)
  const handleAcademySkillSelection = () => {
    if (academySkillSelections.length !== 3) {
      alert('Please select exactly 3 skills to increase to level 1.');
      return;
    }
    
    // Apply selected skills
    academySkillSelections.forEach(skill => {
      updateSkill(skill, 1);
    });
    
    dispatch({
      type: CHARACTER_ACTIONS.SET_PRE_CAREER_SKILLS,
      payload: academySkillSelections
    });
    
    dispatch({
      type: CHARACTER_ACTIONS.SET_PRE_CAREER_PHASE,
      payload: 'completed'
    });
  };

  // Handle event roll
  const handleEventRoll = () => {
    const eventRoll = roll2d6();
    const event = preCareerData.events[eventRoll.total.toString()];
    
    if (!event) return;
    
    const result = {
      roll: eventRoll.total,
      dice: eventRoll.dice,
      event: event,
      description: event.description
    };
    
    // Store event result in persistent state
    dispatch({
      type: CHARACTER_ACTIONS.SET_PRE_CAREER_EVENT_RESULT,
      payload: result
    });
    
    processEventEffects(event.effects);
    
    dispatch({
      type: CHARACTER_ACTIONS.SET_PRE_CAREER_PHASE,
      payload: 'graduation'
    });
  };

  // Process event effects
  const processEventEffects = (effects) => {
    let effectsApplied = [];
    
    if (effects.graduation_failure) {
      // Automatic graduation failure
      dispatch({
        type: CHARACTER_ACTIONS.SET_PRE_CAREER_GRADUATION_RESULT,
        payload: { success: false, automatic: true }
      });
      dispatch({
        type: CHARACTER_ACTIONS.SET_PRE_CAREER_PHASE,
        payload: 'graduation_failed'
      });
      return;
    }
    
    if (effects.skills) {
      Object.entries(effects.skills).forEach(([skill, level]) => {
        addSkill(skill, level);
        effectsApplied.push(`Gained ${skill} ${level}`);
      });
    }
    
    if (effects.attributes) {
      Object.entries(effects.attributes).forEach(([attr, bonus]) => {
        updateAttribute(attr, character.attributes[attr] + bonus);
        effectsApplied.push(`${attr} ${bonus >= 0 ? '+' : ''}${bonus}`);
      });
    }
    
    if (effects.allies) {
      if (effects.allies === '1d3') {
        const allyCount = roll1d3().total;
        for (let i = 0; i < allyCount; i++) {
          addRelationship('ally', 'Education Ally');
        }
        effectsApplied.push(`Gained ${allyCount} Allies`);
      } else {
        for (let i = 0; i < effects.allies; i++) {
          addRelationship('ally', 'Education Ally');
        }
        effectsApplied.push(`Gained ${effects.allies} Ally${effects.allies > 1 ? 's' : ''}`);
      }
    }
    
    if (effects.rival) {
      addRelationship('rival', 'Education Rival');
      effectsApplied.push('Gained a Rival');
    }
    
    if (effects.enemy) {
      addRelationship('enemy', 'Education Enemy');
      effectsApplied.push('Gained an Enemy');
    }
    
    if (effects.roll_required) {
      // Handle complex event effects that require additional rolls
      const rollEffects = handleComplexEventEffect(effects.roll_required);
      if (rollEffects) effectsApplied.push(...rollEffects);
    }
    
    if (effects.choice_required) {
      // Handle events that require player choices
      setPendingChoices([effects.choice_required]);
      effectsApplied.push('Choice required - see options below');
    }
    
    if (effects.skill_choice) {
      // Handle skill choice events
      setPendingChoices([{
        type: 'skill_choice',
        description: 'Choose a skill to gain at level 0',
        effects: effects.skill_choice
      }]);
      effectsApplied.push('Choose a skill to gain at level 0');
    }
    
    // Update the event result with applied effects
    if (effectsApplied.length > 0) {
      const currentEventResult = character.preCareerEventResult;
      if (currentEventResult) {
        dispatch({
          type: CHARACTER_ACTIONS.SET_PRE_CAREER_EVENT_RESULT,
          payload: {
            ...currentEventResult,
            effectsApplied: effectsApplied
          }
        });
      }
    }
  };

  // Handle complex event effects
  const handleComplexEventEffect = (rollRequired) => {
    const attributeValue = character.attributes[rollRequired.attribute];
    const rollResult = rollWithModifier(0);
    const success = rollResult.total >= rollRequired.target;
    
    if (success && rollRequired.success) {
      processEventEffects(rollRequired.success);
    } else if (!success && rollRequired.failure) {
      processEventEffects(rollRequired.failure);
    }
    
    // Check for critical failure (roll of 2)
    if (rollResult.baseRoll === 2 && rollRequired.critical_failure) {
      processEventEffects(rollRequired.critical_failure);
    }
  };

  // Handle graduation roll
  const handleGraduationRoll = () => {
    if (graduationResult && graduationResult.automatic) {
      // Already failed due to event
      return;
    }
    
    const graduationData = selectedEducation === 'university' 
      ? preCareerData.university.graduation 
      : preCareerData.military_academy.graduation;
    
    let modifiers = 0;
    
    if (selectedEducation === 'military_academy') {
      if (character.attributes.END >= 8) modifiers += 1;
      if (character.attributes.SOC >= 8) modifiers += 1;
    }
    
    const rollResult = rollWithModifier(modifiers);
    const success = rollResult.total >= graduationData.target;
    const honors = rollResult.total >= graduationData.honors_target;
    
    const result = {
      success,
      honors,
      roll: rollResult.total,
      target: graduationData.target,
      honorsTarget: graduationData.honors_target,
      modifiers,
      formatted: `${rollResult.formatted} vs ${graduationData.target} = ${success ? (honors ? 'HONORS' : 'SUCCESS') : 'FAILURE'}`
    };
    
    // Store graduation result in persistent state
    dispatch({
      type: CHARACTER_ACTIONS.SET_PRE_CAREER_GRADUATION_RESULT,
      payload: result
    });
    
    dispatch({
      type: CHARACTER_ACTIONS.SET_PRE_CAREER_GRADUATION,
      payload: { graduated: success, honors }
    });
    
    if (success) {
      applyGraduationBenefits(honors);
      if (selectedEducation === 'military_academy') {
        dispatch({
          type: CHARACTER_ACTIONS.SET_PRE_CAREER_PHASE,
          payload: 'academy_skills'
        });
      } else {
        dispatch({
          type: CHARACTER_ACTIONS.SET_PRE_CAREER_PHASE,
          payload: 'completed'
        });
      }
    } else {
      dispatch({
        type: CHARACTER_ACTIONS.SET_PRE_CAREER_PHASE,
        payload: 'graduation_failed'
      });
    }
  };

  // Apply graduation benefits
  const applyGraduationBenefits = (honors) => {
    const benefitsData = selectedEducation === 'university' 
      ? preCareerData.university.graduation_benefits 
      : preCareerData.military_academy.graduation_benefits;
    
    const benefits = honors ? benefitsData.honors : benefitsData.standard;
    
    if (selectedEducation === 'university') {
      // Increase both chosen skills by 1 level
      const chosenSkills = character.preCareerSkillsChosen;
      chosenSkills.forEach(skill => {
        const currentLevel = character.skills[skill] || 0;
        updateSkill(skill, currentLevel + 1);
      });
      
      // Additional EDU bonus
      updateAttribute('EDU', character.attributes.EDU + benefits.edu_bonus);
    } else {
      // Military academy benefits applied after skill selection
      updateAttribute('EDU', character.attributes.EDU + benefits.edu_bonus);
      if (honors && benefits.soc_bonus) {
        updateAttribute('SOC', character.attributes.SOC + benefits.soc_bonus);
      }
    }
  };

  // Complete pre-career education
  const completeEducation = () => {
    dispatch({
      type: CHARACTER_ACTIONS.COMPLETE_PRE_CAREER_EDUCATION
    });
  };

  if (!isPreCareerAvailable()) {
    return (
      <div className="pre-career-education-tab">
        <h2>Pre-Career Education</h2>
        <div className="unavailable">
          <p>Pre-career education is no longer available.</p>
          <p>It can only be pursued in terms 1-3, and you have already completed this phase or are beyond term 3.</p>
        </div>
      </div>
    );
  }

  if (educationCompleted) {
    return (
      <div className="pre-career-education-tab">
        <h2>Pre-Career Education Complete</h2>
        <div className="completion-summary">
          <h3>Education Summary</h3>
          <p><strong>Type:</strong> {selectedEducation === 'university' ? 'University' : `${selectedAcademyType} Military Academy`}</p>
          <p><strong>Graduated:</strong> {character.preCareerGraduated ? (character.preCareerHonors ? 'Yes (with Honors)' : 'Yes') : 'No'}</p>
          {character.preCareerSkillsChosen.length > 0 && (
            <p><strong>Skills Gained:</strong> {character.preCareerSkillsChosen.join(', ')}</p>
          )}
          <p>You may now proceed to career selection with any bonuses earned from your education.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pre-career-education-tab">
      <h2>Pre-Career Education</h2>
      <p>Choose to pursue higher education before beginning your career. This is only available in terms 1-3.</p>
      
      <div className="current-term-info">
        <p><strong>Current Term:</strong> {character.currentTerm || 1}</p>
        <p><strong>Age:</strong> {character.age}</p>
      </div>

      {currentPhase === 'selection' && (
        <div className="education-selection">
          <h3>Choose Your Education Path</h3>
          
          <div className="education-options">
            <div className="education-option">
              <h4>University</h4>
              <p>{preCareerData.university.description}</p>
              <div className="requirements">
                <p><strong>Entry Requirement:</strong> EDU {preCareerData.university.entry.target}+</p>
                <p><strong>Your EDU:</strong> {character.attributes.EDU} (DM: {getAttributeModifier(character.attributes.EDU)})</p>
                <p><strong>Modifiers:</strong></p>
                <ul>
                  <li>Term 2: DM-1, Term 3: DM-2</li>
                  <li>SOC 9+: DM+1 {character.attributes.SOC >= 9 ? '✓' : ''}</li>
                </ul>
                <p><strong>Total DM:</strong> {getEntryModifiers('university')}</p>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => handleEducationSelection('university')}
              >
                Choose University
              </button>
            </div>

            <div className="education-option">
              <h4>Military Academy</h4>
              <p>{preCareerData.military_academy.description}</p>
              
              <div className="academy-types">
                {Object.entries(preCareerData.military_academy.types).map(([type, data]) => (
                  <div key={type} className="academy-type">
                    <h5>{data.name}</h5>
                    <p><strong>Entry:</strong> {data.entry.attribute} {data.entry.target}+</p>
                    <p><strong>Your {data.entry.attribute}:</strong> {character.attributes[data.entry.attribute]}</p>
                    <p><strong>Total DM:</strong> {getEntryModifiers('military_academy', type)}</p>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleEducationSelection('military_academy', type)}
                    >
                      Choose {data.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentPhase === 'entry' && (
        <div className="entry-phase">
          <h3>Entry Roll</h3>
          <p>Attempting to enter {selectedEducation === 'university' ? 'University' : `${selectedAcademyType} Military Academy`}</p>
          
          {!entryResult ? (
            <button className="btn btn-primary" onClick={handleEntryRoll}>
              Roll for Entry
            </button>
          ) : (
            <div className="entry-result">
              <p><strong>Result:</strong> {entryResult.formatted}</p>
              {entryResult.success ? (
                <div className="success">
                  <p>✅ Entry successful! You begin your education.</p>
                  {selectedEducation === 'university' && (
                    <p>You automatically gain EDU +1 from university education.</p>
                  )}
                </div>
              ) : (
                <div className="failure">
                  <p>❌ Entry failed. You must immediately attempt career entry or be drafted.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {currentPhase === 'skills' && selectedEducation === 'university' && (
        <div className="skill-selection">
          <h3>University Skill Selection</h3>
          <p>Choose one skill at level 0 and one skill at level 1 from the available list:</p>
          
          <div className="skill-selectors">
            <div className="skill-selector">
              <label>Level 0 Skill:</label>
              <select 
                value={skillSelections.level0} 
                onChange={(e) => setSkillSelections({...skillSelections, level0: e.target.value})}
              >
                <option value="">Select a skill...</option>
                {preCareerData.university.skills.available.map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>
            
            <div className="skill-selector">
              <label>Level 1 Skill:</label>
              <select 
                value={skillSelections.level1} 
                onChange={(e) => setSkillSelections({...skillSelections, level1: e.target.value})}
              >
                <option value="">Select a skill...</option>
                {preCareerData.university.skills.available.map(skill => (
                  <option key={skill} value={skill} disabled={skill === skillSelections.level0}>
                    {skill}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={handleUniversitySkillSelection}
            disabled={!skillSelections.level0 || !skillSelections.level1}
          >
            Confirm Skill Selection
          </button>
        </div>
      )}

      {currentPhase === 'events' && (
        <div className="events-phase">
          <h3>Pre-Career Events</h3>
          <p>Roll for events during your education:</p>
          
          {!eventResult ? (
            <button className="btn btn-primary" onClick={handleEventRoll}>
              Roll for Event
            </button>
          ) : (
            <div className="event-result">
              <p><strong>Roll:</strong> {eventResult.roll} ({eventResult.dice.join(', ')})</p>
              <p><strong>Event:</strong> {eventResult.description}</p>
            </div>
          )}
        </div>
      )}

      {currentPhase === 'graduation' && (
        <div className="graduation-phase">
          <h3>Graduation Roll</h3>
          <p>Roll to see if you successfully graduate:</p>
          
          {!graduationResult ? (
            <button className="btn btn-primary" onClick={handleGraduationRoll}>
              Roll for Graduation
            </button>
          ) : (
            <div className="graduation-result">
              <p><strong>Result:</strong> {graduationResult.formatted}</p>
              {graduationResult.success ? (
                <div className="success">
                  <p>✅ {graduationResult.honors ? 'Graduated with Honors!' : 'Graduated successfully!'}</p>
                  <p>You receive graduation benefits and bonuses for future career entry.</p>
                </div>
              ) : (
                <div className="failure">
                  <p>❌ Failed to graduate. You gain no graduation benefits but keep any skills learned.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {currentPhase === 'academy_skills' && (
        <div className="academy-skill-selection">
          <h3>Military Academy Graduation Benefits</h3>
          <p>Select 3 service skills to increase to level 1:</p>
          
          <div className="service-skills">
            {preCareerData.military_academy.types[selectedAcademyType].service_skills.map(skill => (
              <label key={skill} className="skill-checkbox">
                <input 
                  type="checkbox"
                  checked={academySkillSelections.includes(skill)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (academySkillSelections.length < 3) {
                        setAcademySkillSelections([...academySkillSelections, skill]);
                      }
                    } else {
                      setAcademySkillSelections(academySkillSelections.filter(s => s !== skill));
                    }
                  }}
                  disabled={!academySkillSelections.includes(skill) && academySkillSelections.length >= 3}
                />
                {skill}
              </label>
            ))}
          </div>
          
          <p>Selected: {academySkillSelections.length}/3</p>
          
          <button 
            className="btn btn-primary" 
            onClick={handleAcademySkillSelection}
            disabled={academySkillSelections.length !== 3}
          >
            Confirm Skill Selection
          </button>
        </div>
      )}

      {(currentPhase === 'completed' || currentPhase === 'graduation_failed') && (
        <div className="education-complete">
          <h3>Education Complete</h3>
          {currentPhase === 'completed' ? (
            <div className="success">
              <p>✅ Your pre-career education is complete!</p>
              <p>You may now proceed to career selection with any bonuses earned.</p>
            </div>
          ) : (
            <div className="failure">
              <p>Your education ended without graduation, but you still gained valuable experience.</p>
            </div>
          )}
          
          <button className="btn btn-success" onClick={completeEducation}>
            Complete Education
          </button>
        </div>
      )}

      <style jsx>{`
        .pre-career-education-tab {
          padding: 20px;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .current-term-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .education-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin: 20px 0;
        }
        
        .education-option {
          border: 2px solid #ddd;
          padding: 20px;
          border-radius: 8px;
          background: white;
        }
        
        .education-option h4 {
          color: #007bff;
          margin-top: 0;
        }
        
        .requirements {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }
        
        .requirements ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        
        .academy-types {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .academy-type {
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 4px;
          background: #f9f9f9;
        }
        
        .academy-type h5 {
          margin-top: 0;
          color: #28a745;
        }
        
        .entry-result, .event-result, .graduation-result {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .success {
          color: #28a745;
          font-weight: bold;
        }
        
        .failure {
          color: #dc3545;
          font-weight: bold;
        }
        
        .skill-selectors {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }
        
        .skill-selector label {
          display: block;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .skill-selector select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .service-skills {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin: 20px 0;
        }
        
        .skill-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .skill-checkbox:hover {
          background: #f8f9fa;
        }
        
        .skill-checkbox input[type="checkbox"] {
          margin: 0;
        }
        
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          margin: 5px;
        }
        
        .btn-primary {
          background: #007bff;
          color: white;
        }
        
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        
        .btn-success {
          background: #28a745;
          color: white;
        }
        
        .btn:hover {
          opacity: 0.9;
        }
        
        .btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
          opacity: 0.6;
        }
        
        .unavailable {
          text-align: center;
          padding: 40px;
          background: #f8f9fa;
          border-radius: 8px;
          color: #6c757d;
        }
        
        .completion-summary {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          padding: 20px;
          border-radius: 8px;
          color: #155724;
        }
      `}</style>
    </div>
  );
}