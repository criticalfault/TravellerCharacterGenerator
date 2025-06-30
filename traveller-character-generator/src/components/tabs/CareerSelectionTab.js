import React, { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import careersData from '../../data/careers.json';

export default function CareerSelectionTab() {
  const { character, startCareer, getAttributeModifier } = useCharacter();
  const [selectedCareer, setSelectedCareer] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');

  const handleCareerSelect = (careerName) => {
    setSelectedCareer(careerName);
    setSelectedAssignment(''); // Reset assignment when career changes
  };

  const handleQualificationAttempt = () => {
    if (!selectedCareer || !selectedAssignment) return;
    
    const career = careersData[selectedCareer];
    if (!career) return;
    
    // Start the career (qualification logic will be implemented in task 6)
    startCareer(selectedCareer, selectedAssignment);
  };

  const getQualificationInfo = (careerName) => {
    const career = careersData[careerName];
    if (!career || !career.qualification) return null;
    
    const [attr, target] = Object.entries(career.qualification)[0];
    const modifier = getAttributeModifier(character.attributes[attr]);
    const totalTarget = target + modifier;
    
    return {
      attribute: attr,
      baseTarget: target,
      modifier: modifier,
      totalTarget: totalTarget
    };
  };

  return (
    <div className="career-selection-tab">
      <h2>Career Selection</h2>
      <p>Choose your first career path. Each career has different requirements and opportunities.</p>
      
      <div className="career-list">
        <h3>Available Careers</h3>
        <div className="careers-grid">
          {Object.entries(careersData).map(([careerName, careerData]) => {
            const qualInfo = getQualificationInfo(careerName);
            return (
              <div 
                key={careerName} 
                className={`career-card ${selectedCareer === careerName ? 'selected' : ''}`}
                onClick={() => handleCareerSelect(careerName)}
              >
                <h4 className="career-name">{careerName.charAt(0).toUpperCase() + careerName.slice(1)}</h4>
                {qualInfo && (
                  <div className="qualification-info">
                    <p>Qualification: {qualInfo.attribute} {qualInfo.baseTarget}+</p>
                    <p>Your modifier: {qualInfo.modifier >= 0 ? '+' : ''}{qualInfo.modifier}</p>
                    <p>Target: {qualInfo.totalTarget}+ on 2d6</p>
                  </div>
                )}
                <div className="assignments">
                  <strong>Assignments:</strong>
                  <ul>
                    {careerData.assignments?.map(assignment => (
                      <li key={assignment}>{assignment}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {selectedCareer && (
        <div className="assignment-selection">
          <h3>Select Assignment</h3>
          <p>Choose your specialization within the {selectedCareer} career:</p>
          <div className="assignment-options">
            {careersData[selectedCareer].assignments?.map(assignment => (
              <button
                key={assignment}
                className={`assignment-btn ${selectedAssignment === assignment ? 'selected' : ''}`}
                onClick={() => setSelectedAssignment(assignment)}
              >
                {assignment}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {selectedCareer && selectedAssignment && (
        <div className="qualification-section">
          <h3>Qualification Attempt</h3>
          <div className="qualification-details">
            {(() => {
              const qualInfo = getQualificationInfo(selectedCareer);
              return qualInfo ? (
                <div>
                  <p>Career: <strong>{selectedCareer.charAt(0).toUpperCase() + selectedCareer.slice(1)}</strong></p>
                  <p>Assignment: <strong>{selectedAssignment}</strong></p>
                  <p>Qualification Roll: <strong>{qualInfo.attribute} {qualInfo.baseTarget}+</strong></p>
                  <p>Your {qualInfo.attribute}: <strong>{character.attributes[qualInfo.attribute]} (DM: {qualInfo.modifier >= 0 ? '+' : ''}{qualInfo.modifier})</strong></p>
                  <p>Target Number: <strong>{qualInfo.totalTarget}+ on 2d6</strong></p>
                </div>
              ) : null;
            })()}
          </div>
          <button 
            className="btn btn-primary btn-large"
            onClick={handleQualificationAttempt}
          >
            Attempt Qualification
          </button>
        </div>
      )}
      
      <div className="career-info">
        <h3>Career Information</h3>
        <p>
          Each career offers different skills, advancement opportunities, and risks. 
          Consider your character's attributes when choosing a career, as they affect 
          qualification chances and career progression.
        </p>
        <p>
          If you fail qualification for your chosen career, you may be drafted into 
          a random career or choose to become a Drifter.
        </p>
      </div>
    </div>
  );
}