import React, { useState, useEffect } from 'react';
import { useCharacter } from '../context/CharacterContext';
import {
  getAvailableSkillTables,
  rollOnSkillTable,
  applySkillTraining,
  getFormattedSkills,
  validateSkillTrainingPrerequisites,
} from '../utils/skillTraining';

export default function SkillTrainingInterface({
  career,
  assignment,
  onComplete,
}) {
  const { character, dispatch, CHARACTER_ACTIONS, addSkill, updateAttribute } =
    useCharacter();

  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [trainingResult, setTrainingResult] = useState(null);
  const [pendingChoice, setPendingChoice] = useState(null);
  const [trainingComplete, setTrainingComplete] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Initialize available skill tables
  useEffect(() => {
    const validation = validateSkillTrainingPrerequisites(
      character,
      career,
      assignment
    );

    if (!validation.valid) {
      setValidationErrors(validation.issues);
      return;
    }

    const tables = getAvailableSkillTables(career, assignment, character);
    setAvailableTables(tables);
    setValidationErrors([]);

    // Auto-select first table if only one available
    if (tables.length === 1) {
      setSelectedTable(tables[0]);
    }
  }, [career, assignment, character]);

  const handleTableSelection = table => {
    setSelectedTable(table);
    setTrainingResult(null);
    setPendingChoice(null);
  };

  const handleRollTraining = () => {
    if (!selectedTable) return;

    try {
      const result = rollOnSkillTable(selectedTable);

      if (!result) {
        console.error('Failed to get skill training result');
        return;
      }

      setTrainingResult(result);

      if (result.skills && result.skills.type === 'choice') {
        // Player needs to make a choice
        setPendingChoice({
          description: `Choose your skill from ${selectedTable.name}:`,
          options: result.skills.options || [],
          result: result,
        });
      } else {
        // Apply training immediately
        applySkillTraining(
          character,
          result,
          dispatch,
          CHARACTER_ACTIONS,
          addSkill,
          updateAttribute
        );
        setTrainingComplete(true);
      }
    } catch (error) {
      console.error('Error during skill training roll:', error);
    }
  };

  const handleChoiceSelection = optionIndex => {
    if (!pendingChoice) return;

    const selectedSkill = pendingChoice.options[optionIndex];

    // Create a skill result with the chosen skill for applySkillTraining
    const choiceResult = {
      roll: pendingChoice.result.roll,
      table: pendingChoice.result.table,
      tableKey: pendingChoice.result.tableKey,
      skillEntry: selectedSkill.displayName,
      skills: {
        type: 'skill',
        skills: [selectedSkill],
      },
    };

    // Apply the chosen skill through the standard training function
    applySkillTraining(
      character,
      choiceResult,
      dispatch,
      CHARACTER_ACTIONS,
      addSkill,
      updateAttribute
    );

    setPendingChoice(null);
    setTrainingComplete(true);
  };

  const handleCompleteTraining = () => {
    if (onComplete) {
      onComplete({
        table: selectedTable?.name,
        result: trainingResult,
        completed: true,
      });
    }
  };

  const handleResetTraining = () => {
    setSelectedTable(null);
    setTrainingResult(null);
    setPendingChoice(null);
    setTrainingComplete(false);
  };

  if (validationErrors.length > 0) {
    return (
      <div className="skill-training-interface error">
        <h4>Skill Training - Error</h4>
        <div className="validation-errors">
          <p>Cannot proceed with skill training:</p>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="skill-training-interface">
      <h4>Skill Training</h4>
      <p>Select a skill table to roll for training this term.</p>

      {/* Available Skill Tables */}
      <div className="skill-tables">
        <h5>Available Training Tables</h5>
        <div className="table-selection">
          {availableTables.map((table, index) => (
            <div
              key={index}
              className={`table-option ${selectedTable?.key === table.key ? 'selected' : ''}`}
              onClick={() => handleTableSelection(table)}
            >
              <div className="table-header">
                <strong>{table.name}</strong>
                {table.requirement && (
                  <span className="requirement">({table.requirement})</span>
                )}
              </div>
              <p className="table-description">{table.description}</p>

              {/* Show table contents */}
              <div className="table-preview">
                <strong>Skills Available:</strong>
                <div className="skills-list">
                  {Object.entries(table.skills).map(([roll, skill]) => (
                    <span key={roll} className="skill-preview">
                      {roll}:{' '}
                      {Array.isArray(skill) ? skill.join(' or ') : skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Training Action */}
      {selectedTable && !trainingResult && (
        <div className="training-action">
          <h5>Selected: {selectedTable.name}</h5>
          <p>{selectedTable.description}</p>
          <button className="btn btn-primary" onClick={handleRollTraining}>
            Roll for Training (1d6)
          </button>
        </div>
      )}

      {/* Training Result */}
      {trainingResult && (
        <div className="training-result">
          <h5>Training Result</h5>
          <div className="result-details">
            <p>
              <strong>Table:</strong> {trainingResult.table}
            </p>
            <p>
              <strong>Roll:</strong> {trainingResult.roll} on 1d6
            </p>
            <p>
              <strong>Result:</strong> {trainingResult.skillEntry}
            </p>
          </div>

          {!pendingChoice && !trainingComplete && (
            <div className="skills-gained">
              <h6>Skills Gained:</h6>
              <ul>
                {trainingResult.skills.skills?.map((skill, index) => (
                  <li
                    key={index}
                    className={
                      skill.isAttribute ? 'attribute-gain' : 'skill-gain'
                    }
                  >
                    {skill.displayName}
                    {skill.isAttribute && ' (Attribute Increase)'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Pending Choice */}
      {pendingChoice && (
        <div className="pending-choice">
          <h5>Make Your Choice</h5>
          <p>{pendingChoice.description}</p>
          <div className="choice-options">
            {pendingChoice.options.map((option, index) => (
              <button
                key={index}
                className="btn btn-secondary choice-btn"
                onClick={() => handleChoiceSelection(index)}
              >
                {option.displayName}
                {option.isAttribute && ' (Attribute)'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Training Complete */}
      {trainingComplete && (
        <div className="training-complete">
          <h5>✅ Training Complete</h5>
          <p>Your character has completed skill training for this term.</p>

          <div className="training-actions">
            <button
              className="btn btn-success"
              onClick={handleCompleteTraining}
            >
              Continue Career Progression
            </button>
            <button className="btn btn-secondary" onClick={handleResetTraining}>
              Train Again (if allowed)
            </button>
          </div>
        </div>
      )}

      {/* Current Skills Display */}
      <div className="current-skills">
        <h5>Current Skills</h5>
        <div className="skills-display">
          {getFormattedSkills(character).length > 0 ? (
            <div className="skills-grid">
              {getFormattedSkills(character).map((skill, index) => (
                <div key={index} className="skill-item">
                  <span className="skill-name">{skill.name}</span>
                  <span className="skill-level">Level {skill.level}</span>
                  <span className="skill-modifier">DM+{skill.modifier}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>No skills yet. Complete training to gain your first skills!</p>
          )}
        </div>
      </div>

      {/* Skill Descriptions Help */}
      <div className="skill-help">
        <details>
          <summary>Skill System Help</summary>
          <div className="help-content">
            <h6>How Skill Training Works:</h6>
            <ul>
              <li>
                <strong>Personal Development:</strong> Basic improvement skills
                available to all characters
              </li>
              <li>
                <strong>Service Skills:</strong> Core skills for your current
                career
              </li>
              <li>
                <strong>Advanced Education:</strong> Requires EDU 8+ for access
                to advanced skills
              </li>
              <li>
                <strong>Officer:</strong> Available only to commissioned
                officers
              </li>
              <li>
                <strong>Specialist:</strong> Assignment-specific skills for your
                chosen specialization
              </li>
            </ul>

            <h6>Skill Levels:</h6>
            <ul>
              <li>
                <strong>Level 0:</strong> Basic familiarity (no DM bonus)
              </li>
              <li>
                <strong>Level 1-3:</strong> DM+0 (competent)
              </li>
              <li>
                <strong>Level 4-6:</strong> DM+1 (skilled)
              </li>
              <li>
                <strong>Level 7-9:</strong> DM+2 (expert)
              </li>
              <li>
                <strong>Level 10+:</strong> DM+3+ (master)
              </li>
            </ul>

            <h6>Attribute Increases:</h6>
            <p>
              Some training results increase attributes (STR +1, DEX +1, etc.)
              instead of skills. These permanently improve your character's
              physical or mental capabilities.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
