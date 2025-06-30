import React, { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import careersData from '../../data/careers.json';
import { rollWithModifier, checkSuccess } from '../../utils/dice';

export default function CareerSelectionTab() {
  const { character, startCareer, getAttributeModifier, addSkill, dispatch, CHARACTER_ACTIONS } = useCharacter();
  const [selectedCareer, setSelectedCareer] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [qualificationResult, setQualificationResult] = useState(null);
  const [showQualificationRoll, setShowQualificationRoll] = useState(false);
  const [commissionAttempt, setCommissionAttempt] = useState(null);
  const [careerStarted, setCareerStarted] = useState(false);

  const handleCareerSelect = (careerName) => {
    setSelectedCareer(careerName);
    setSelectedAssignment(''); // Reset assignment when career changes
    setQualificationResult(null);
    setShowQualificationRoll(false);
    setCommissionAttempt(null);
    setCareerStarted(false);
  };

  const handleQualificationAttempt = () => {
    if (!selectedCareer || !selectedAssignment) return;
    
    const career = careersData[selectedCareer];
    if (!career) return;
    
    // Get qualification requirements
    const qualInfo = getQualificationInfo(selectedCareer);
    if (!qualInfo) return;
    
    // Roll 2d6 + attribute DM
    const rollResult = rollWithModifier(qualInfo.modifier);
    const successCheck = checkSuccess(rollResult.total, qualInfo.baseTarget);
    
    const result = {
      career: selectedCareer,
      assignment: selectedAssignment,
      roll: rollResult,
      success: successCheck.success,
      target: qualInfo.baseTarget,
      attribute: qualInfo.attribute,
      modifier: qualInfo.modifier,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setQualificationResult(result);
    setShowQualificationRoll(true);
    
    if (successCheck.success) {
      // Qualification successful - start career and assign basic training
      handleSuccessfulQualification(career, selectedCareer, selectedAssignment);
    } else {
      // Qualification failed - handle draft or drifter options
      handleFailedQualification();
    }
  };

  const handleSuccessfulQualification = (career, careerName, assignment) => {
    // Start the career
    startCareer(careerName, assignment);
    
    // Assign basic training (all service skills at level 0)
    if (career.skills_and_training?.service_skills) {
      Object.values(career.skills_and_training.service_skills).forEach(skill => {
        if (typeof skill === 'string') {
          // Single skill
          if (!character.skills[skill]) {
            addSkill(skill, 0);
          }
        } else if (Array.isArray(skill)) {
          // Multiple skill options - add all at level 0
          skill.forEach(s => {
            if (!character.skills[s]) {
              addSkill(s, 0);
            }
          });
        }
      });
    }
    
    // Check for commission attempt (military careers only)
    if (career.hasCommission && career.comission) {
      setCommissionAttempt({
        available: true,
        requirement: career.comission
      });
    }
    
    setCareerStarted(true);
  };

  const handleFailedQualification = () => {
    // In Traveller, failed qualification can lead to:
    // 1. Draft into a random career
    // 2. Become a Drifter
    // For now, we'll offer the choice to become a Drifter
    const confirmDrifter = window.confirm(
      'Qualification failed! You can become a Drifter or try a different career. Become a Drifter?'
    );
    
    if (confirmDrifter) {
      setSelectedCareer('drifter');
      setSelectedAssignment('Wanderer'); // Default drifter assignment
      // Auto-qualify for Drifter (very low requirement)
      const drifterCareer = careersData.drifter;
      if (drifterCareer) {
        handleSuccessfulQualification(drifterCareer, 'drifter', 'Wanderer');
      }
    }
  };

  const handleCommissionAttempt = () => {
    if (!commissionAttempt || !selectedCareer) return;
    
    const career = careersData[selectedCareer];
    const commissionReq = career.comission;
    const [attr, target] = Object.entries(commissionReq)[0];
    const modifier = getAttributeModifier(character.attributes[attr]);
    
    const rollResult = rollWithModifier(modifier);
    const successCheck = checkSuccess(rollResult.total, target);
    
    if (successCheck.success) {
      // Commission successful - update character to officer track
      dispatch({
        type: CHARACTER_ACTIONS.ADD_CAREER_EVENT,
        payload: {
          type: 'commission',
          success: true,
          roll: rollResult.total,
          description: 'Successfully commissioned as an officer'
        }
      });
      
      setCommissionAttempt({
        ...commissionAttempt,
        attempted: true,
        success: true,
        roll: rollResult
      });
    } else {
      // Commission failed - remain enlisted
      setCommissionAttempt({
        ...commissionAttempt,
        attempted: true,
        success: false,
        roll: rollResult
      });
    }
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
      
      {selectedCareer && !careerStarted && (
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
      
      {selectedCareer && selectedAssignment && !careerStarted && (
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
            disabled={showQualificationRoll}
          >
            {showQualificationRoll ? 'Rolling...' : 'Attempt Qualification'}
          </button>
        </div>
      )}
      
      {qualificationResult && (
        <div className="qualification-result">
          <h3>Qualification Result</h3>
          <div className={`result-display ${qualificationResult.success ? 'success' : 'failure'}`}>
            <div className="roll-details">
              <p><strong>Career:</strong> {qualificationResult.career.charAt(0).toUpperCase() + qualificationResult.career.slice(1)}</p>
              <p><strong>Assignment:</strong> {qualificationResult.assignment}</p>
              <p><strong>Roll:</strong> {qualificationResult.roll.formatted}</p>
              <p><strong>Target:</strong> {qualificationResult.target}+</p>
              <p><strong>Result:</strong> <span className={qualificationResult.success ? 'success-text' : 'failure-text'}>
                {qualificationResult.success ? 'SUCCESS' : 'FAILURE'}
              </span></p>
            </div>
            
            {qualificationResult.success ? (
              <div className="success-message">
                <h4>Qualification Successful!</h4>
                <p>You have been accepted into the {qualificationResult.career} career as a {qualificationResult.assignment}.</p>
                <p>You receive basic training in all service skills at level 0.</p>
              </div>
            ) : (
              <div className="failure-message">
                <h4>Qualification Failed</h4>
                <p>You did not meet the requirements for the {qualificationResult.career} career.</p>
                <p>You may choose to become a Drifter or try qualifying for a different career.</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {commissionAttempt && commissionAttempt.available && !commissionAttempt.attempted && (
        <div className="commission-section">
          <h3>Commission Opportunity</h3>
          <p>As a military career, you have the opportunity to attempt to become an officer.</p>
          <div className="commission-details">
            {(() => {
              const [attr, target] = Object.entries(commissionAttempt.requirement)[0];
              const modifier = getAttributeModifier(character.attributes[attr]);
              return (
                <div>
                  <p><strong>Commission Roll:</strong> {attr} {target}+</p>
                  <p><strong>Your {attr}:</strong> {character.attributes[attr]} (DM: {modifier >= 0 ? '+' : ''}{modifier})</p>
                  <p><strong>Target:</strong> {target + modifier}+ on 2d6</p>
                </div>
              );
            })()}
          </div>
          <div className="commission-actions">
            <button 
              className="btn btn-primary"
              onClick={handleCommissionAttempt}
            >
              Attempt Commission
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setCommissionAttempt({...commissionAttempt, attempted: true, success: false, declined: true})}
            >
              Remain Enlisted
            </button>
          </div>
        </div>
      )}
      
      {commissionAttempt && commissionAttempt.attempted && (
        <div className="commission-result">
          <h3>Commission Result</h3>
          {commissionAttempt.declined ? (
            <p>You chose to remain in the enlisted ranks.</p>
          ) : (
            <div className={`result-display ${commissionAttempt.success ? 'success' : 'failure'}`}>
              <p><strong>Roll:</strong> {commissionAttempt.roll.formatted}</p>
              <p><strong>Result:</strong> <span className={commissionAttempt.success ? 'success-text' : 'failure-text'}>
                {commissionAttempt.success ? 'COMMISSIONED' : 'COMMISSION FAILED'}
              </span></p>
              {commissionAttempt.success ? (
                <p>Congratulations! You have been commissioned as an officer.</p>
              ) : (
                <p>Commission attempt failed. You remain in the enlisted ranks.</p>
              )}
            </div>
          )}
        </div>
      )}
      
      {careerStarted && (
        <div className="career-started">
          <h3>Career Started</h3>
          <div className="career-summary">
            <p><strong>Career:</strong> {selectedCareer.charAt(0).toUpperCase() + selectedCareer.slice(1)}</p>
            <p><strong>Assignment:</strong> {selectedAssignment}</p>
            <p><strong>Status:</strong> {commissionAttempt?.success ? 'Officer' : 'Enlisted'}</p>
            <p>You have received basic training and are ready to begin your first term.</p>
          </div>
          <div className="next-steps">
            <p>You can now proceed to career terms to begin your service.</p>
          </div>
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