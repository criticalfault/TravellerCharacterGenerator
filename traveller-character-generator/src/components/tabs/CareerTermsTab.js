import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import careersData from '../../data/careers.json';
import {
  makeSurvivalRoll,
  makeAdvancementRoll,
  calculateAgingEffects,
  rollEvent,
  rollMishap,
} from '../../utils/gameMechanics';
import { processEventChain } from '../../utils/eventProcessor';
import SkillTrainingInterface from '../SkillTrainingInterface';

export default function CareerTermsTab() {
  const {
    character,
    dispatch,
    CHARACTER_ACTIONS,
    addSkill,
    updateAttribute,
    addRelationship,
  } = useCharacter();

  // Term progression state
  const [currentPhase, setCurrentPhase] = useState('survival'); // survival, event, advancement, skills, decision
  const [termResults, setTermResults] = useState({
    survival: null,
    event: null,
    mishap: null,
    advancement: null,
    skillTraining: null,
    aging: null,
  });

  const [showTermSummary, setShowTermSummary] = useState(false);
  const [pendingChoices, setPendingChoices] = useState([]);
  const [eventProcessing, setEventProcessing] = useState(false);

  // Get current career data
  const getCurrentCareer = () => {
    if (!character.currentCareer) return null;
    return careersData[character.currentCareer];
  };

  const getCurrentAssignment = () => {
    if (!character.careerHistory.length) return null;
    const currentCareerEntry =
      character.careerHistory[character.careerHistory.length - 1];
    return currentCareerEntry.assignment;
  };

  const getCurrentRank = () => {
    if (!character.careerHistory.length) return 0;
    const currentCareerEntry =
      character.careerHistory[character.careerHistory.length - 1];
    return currentCareerEntry.rank || 0;
  };

  const isCommissioned = () => {
    if (!character.careerHistory.length) return false;
    const currentCareerEntry =
      character.careerHistory[character.careerHistory.length - 1];
    return currentCareerEntry.commissioned || false;
  };

  // Reset term state when starting a new term
  useEffect(() => {
    if (character.currentCareer && character.currentTerm > 0) {
      setCurrentPhase('survival');
      setTermResults({
        survival: null,
        event: null,
        mishap: null,
        advancement: null,
        skillTraining: null,
        aging: null,
      });
      setShowTermSummary(false);
      setPendingChoices([]);
      setEventProcessing(false);
    }
  }, [character.currentTerm, character.currentCareer]);

  const handleSurvivalRoll = () => {
    const career = getCurrentCareer();
    const assignment = getCurrentAssignment();

    if (!career || !assignment) return;

    const survivalResult = makeSurvivalRoll(character, career, assignment);

    setTermResults(prev => ({ ...prev, survival: survivalResult }));

    // Add event to career history
    dispatch({
      type: CHARACTER_ACTIONS.ADD_CAREER_EVENT,
      payload: {
        type: 'survival',
        success: survivalResult.success,
        roll: survivalResult.roll,
        target: survivalResult.target,
        description: survivalResult.formatted,
      },
    });

    if (survivalResult.success) {
      // Survival successful - proceed to event roll
      setCurrentPhase('event');
    } else {
      // Survival failed - career ends, roll mishap
      handleSurvivalFailure();
    }
  };

  const handleSurvivalFailure = async () => {
    const career = getCurrentCareer();
    if (!career || !career.mishaps) return;

    // Roll on mishap table
    const mishapResult = rollMishap(career.mishaps);

    setTermResults(prev => ({ ...prev, mishap: mishapResult }));

    // Add mishap event to career history
    dispatch({
      type: CHARACTER_ACTIONS.ADD_CAREER_EVENT,
      payload: {
        type: 'mishap',
        roll: mishapResult.roll,
        description: mishapResult.description,
      },
    });

    // Process mishap event chain if it exists
    if (mishapResult.eventChain && mishapResult.eventChain.length > 0) {
      setEventProcessing(true);
      try {
        const eventResult = await processEventChain(
          mishapResult.eventChain,
          character,
          dispatch,
          CHARACTER_ACTIONS,
          addSkill,
          updateAttribute,
          addRelationship
        );

        if (eventResult.playerChoices.length > 0) {
          setPendingChoices(eventResult.playerChoices);
        }
      } catch (error) {
        console.error('Error processing mishap event chain:', error);
      } finally {
        setEventProcessing(false);
      }
    }

    // End current career (mishaps typically end careers)
    dispatch({ type: CHARACTER_ACTIONS.END_CAREER });

    setCurrentPhase('ended');
  };

  const handleEventRoll = async () => {
    const career = getCurrentCareer();
    if (!career || !career.events) return;

    // Roll on event table
    const eventResult = rollEvent(career.events);

    setTermResults(prev => ({ ...prev, event: eventResult }));

    // Add event to career history
    dispatch({
      type: CHARACTER_ACTIONS.ADD_CAREER_EVENT,
      payload: {
        type: 'event',
        roll: eventResult.roll,
        description: eventResult.description,
      },
    });

    // Process event chain if it exists
    if (eventResult.eventChain && eventResult.eventChain.length > 0) {
      setEventProcessing(true);
      try {
        const chainResult = await processEventChain(
          eventResult.eventChain,
          character,
          dispatch,
          CHARACTER_ACTIONS,
          addSkill,
          updateAttribute,
          addRelationship
        );

        if (chainResult.playerChoices.length > 0) {
          setPendingChoices(chainResult.playerChoices);
        }
      } catch (error) {
        console.error('Error processing event chain:', error);
      } finally {
        setEventProcessing(false);
      }
    }

    // Proceed to advancement roll
    setCurrentPhase('advancement');
  };

  const handleAdvancementRoll = () => {
    const career = getCurrentCareer();
    const assignment = getCurrentAssignment();

    if (!career || !assignment) return;

    // Use any advancement DM from temporary modifiers
    const additionalDM = character.tempModifiers?.advancementDM || 0;
    const advancementResult = makeAdvancementRoll(
      character,
      career,
      assignment,
      additionalDM
    );

    setTermResults(prev => ({ ...prev, advancement: advancementResult }));

    // Add event to career history
    dispatch({
      type: CHARACTER_ACTIONS.ADD_CAREER_EVENT,
      payload: {
        type: 'advancement',
        success: advancementResult.success,
        roll: advancementResult.roll,
        target: advancementResult.target,
        description: advancementResult.formatted,
      },
    });

    if (advancementResult.success) {
      // Promotion successful - increase rank and apply rank bonuses
      handlePromotion(career);
    }

    // Clear advancement DM after use
    if (additionalDM !== 0) {
      dispatch({
        type: CHARACTER_ACTIONS.SET_ADVANCEMENT_DM,
        payload: 0,
      });
    }

    // Proceed to skill training
    setCurrentPhase('skills');
  };

  const handlePromotion = career => {
    const currentRank = getCurrentRank();
    const newRank = currentRank + 1;
    const assignment = getCurrentAssignment();
    const commissioned = isCommissioned();

    // Update rank in career history
    const updatedHistory = [...character.careerHistory];
    if (updatedHistory.length > 0) {
      updatedHistory[updatedHistory.length - 1].rank = newRank;

      // Get rank title
      const rankTable = commissioned
        ? career.ranks?.officer
        : career.ranks?.enlisted || career.ranks?.[assignment.toLowerCase()];
      if (rankTable) {
        const rankTitle = rankTable[newRank] || '';
        updatedHistory[updatedHistory.length - 1].rankTitle = rankTitle;
      }
    }

    // Apply rank bonus skills if any
    const rankBonusTable = commissioned
      ? career.rank_bonus?.officer
      : career.rank_bonus?.enlisted ||
        career.rank_bonus?.[assignment.toLowerCase()];
    if (
      rankBonusTable &&
      rankBonusTable[newRank] &&
      rankBonusTable[newRank] !== '-'
    ) {
      const bonus = rankBonusTable[newRank];
      applyRankBonus(bonus);
    }

    // Update character state
    dispatch({
      type: CHARACTER_ACTIONS.LOAD_CHARACTER,
      payload: { ...character, careerHistory: updatedHistory },
    });
  };

  const applyRankBonus = bonus => {
    if (typeof bonus === 'string') {
      if (bonus.includes('+1')) {
        // Attribute increase (e.g., "SOC +1")
        const attr = bonus.split(' ')[0];
        if (character.attributes[attr] !== undefined) {
          updateAttribute(attr, character.attributes[attr] + 1);
        }
      } else {
        // Skill bonus (e.g., "Leadership 1")
        const [skillName, level] = bonus.split(' ');
        addSkill(skillName, parseInt(level) || 1);
      }
    } else if (Array.isArray(bonus)) {
      // Multiple bonuses - apply all
      bonus.forEach(b => applyRankBonus(b));
    }
  };

  const handleSkillTrainingComplete = trainingData => {
    // Record skill training completion
    setTermResults(prev => ({
      ...prev,
      skillTraining: {
        completed: true,
        table: trainingData.table,
        note: `Completed training on ${trainingData.table}`,
      },
    }));

    // Check for aging effects
    handleAging();

    // Proceed to decision phase
    setCurrentPhase('decision');
  };

  const handleAging = () => {
    const agingResult = calculateAgingEffects(
      character.age,
      character.attributes
    );

    if (!agingResult.noAging && agingResult.totalEffects) {
      // Apply aging effects
      Object.entries(agingResult.totalEffects).forEach(([attr, change]) => {
        if (change !== 0) {
          updateAttribute(
            attr,
            Math.max(1, character.attributes[attr] + change)
          );
        }
      });

      setTermResults(prev => ({ ...prev, aging: agingResult }));

      dispatch({
        type: CHARACTER_ACTIONS.ADD_CAREER_EVENT,
        payload: {
          type: 'aging',
          description: `Aging effects applied: ${Object.entries(
            agingResult.totalEffects
          )
            .filter(([_, change]) => change !== 0)
            .map(
              ([attr, change]) => `${attr} ${change >= 0 ? '+' : ''}${change}`
            )
            .join(', ')}`,
        },
      });
    }
  };

  const handleContinueCareer = () => {
    // Advance to next term
    dispatch({ type: CHARACTER_ACTIONS.ADVANCE_TERM });
    setShowTermSummary(false);
  };

  const handleLeaveCareer = () => {
    // End current career
    dispatch({ type: CHARACTER_ACTIONS.END_CAREER });
    setCurrentPhase('ended');
  };

  const handleShowTermSummary = () => {
    setShowTermSummary(true);
  };

  const handlePlayerChoice = (option, choiceIndex) => {
    // Apply the chosen option
    switch (option.type) {
      case 'skill':
        addSkill(option.skill, option.level);
        break;
      case 'increase_skill':
        addSkill(option.skill, option.level);
        break;
      case 'promotion':
        // Handle automatic promotion
        const career = getCurrentCareer();
        if (career) {
          handlePromotion(career);
        }
        break;
      case 'commission':
        // Handle automatic commission
        dispatch({
          type: CHARACTER_ACTIONS.ADD_CAREER_EVENT,
          payload: {
            type: 'commission',
            success: true,
            description: 'Automatically commissioned as an officer',
          },
        });
        break;
      default:
        console.log('Unhandled choice type:', option.type);
    }

    // Remove this choice from pending choices
    const newPendingChoices = [...pendingChoices];
    newPendingChoices.splice(choiceIndex, 1);
    setPendingChoices(newPendingChoices);

    // Add event to career history
    dispatch({
      type: CHARACTER_ACTIONS.ADD_CAREER_EVENT,
      payload: {
        type: 'player_choice',
        description: `Chose: ${option.description}`,
      },
    });
  };

  if (!character.currentCareer) {
    return (
      <div className="career-terms-tab">
        <h2>Career Terms</h2>
        <div className="no-career">
          <p>
            No active career. Please select a career first in the Career
            Selection tab.
          </p>
        </div>
      </div>
    );
  }

  const career = getCurrentCareer();
  const assignment = getCurrentAssignment();
  const currentRank = getCurrentRank();
  const commissioned = isCommissioned();

  return (
    <div className="career-terms-tab">
      <h2>Career Terms</h2>
      <p>
        Progress through your career terms, facing survival challenges, events,
        and advancement opportunities.
      </p>

      <div className="current-career-info">
        <h3>
          Current Career:{' '}
          {character.currentCareer.charAt(0).toUpperCase() +
            character.currentCareer.slice(1)}
        </h3>
        <div className="career-details">
          <p>
            <strong>Assignment:</strong> {assignment}
          </p>
          <p>
            <strong>Term:</strong> {character.currentTerm}
          </p>
          <p>
            <strong>Age:</strong> {character.age}
          </p>
          <p>
            <strong>Rank:</strong> {currentRank}{' '}
            {character.careerHistory[character.careerHistory.length - 1]
              ?.rankTitle &&
              `(${character.careerHistory[character.careerHistory.length - 1].rankTitle})`}
          </p>
          <p>
            <strong>Status:</strong> {commissioned ? 'Officer' : 'Enlisted'}
          </p>
        </div>
      </div>

      {currentPhase === 'ended' ? (
        <div className="career-ended">
          <h3>Career Ended</h3>
          <p>
            Your career has ended. You can now select a new career or proceed to
            mustering out benefits.
          </p>
        </div>
      ) : (
        <div className="term-progression">
          <div
            className={`phase-card ${currentPhase === 'survival' ? 'active' : termResults.survival ? 'completed' : 'pending'}`}
          >
            <h4>1. Survival Roll</h4>
            <p>Roll to survive the dangers of your career assignment.</p>
            {career && assignment && (
              <div className="roll-info">
                <p>
                  <strong>Requirement:</strong>{' '}
                  {Object.entries(
                    career.career_progress?.survival?.[assignment] || {}
                  )[0]?.join(' ') || 'No requirement'}{' '}
                  {
                    Object.entries(
                      career.career_progress?.survival?.[assignment] || {}
                    )[0]?.[1]
                  }
                  +
                </p>
              </div>
            )}
            {currentPhase === 'survival' && (
              <button className="btn btn-primary" onClick={handleSurvivalRoll}>
                Roll Survival
              </button>
            )}
            {termResults.survival && (
              <div
                className={`roll-result ${termResults.survival.success ? 'success' : 'failure'}`}
              >
                <p>
                  <strong>Result:</strong> {termResults.survival.formatted}
                </p>
              </div>
            )}
          </div>

          <div
            className={`phase-card ${currentPhase === 'event' ? 'active' : termResults.event ? 'completed' : 'pending'}`}
          >
            <h4>2. Event Roll</h4>
            <p>Experience events that shape your character's career.</p>
            {currentPhase === 'event' && (
              <button
                className="btn btn-primary"
                onClick={handleEventRoll}
                disabled={eventProcessing}
              >
                {eventProcessing ? 'Processing...' : 'Roll Event'}
              </button>
            )}
            {termResults.event && (
              <div className="roll-result success">
                <p>
                  <strong>Event:</strong> {termResults.event.description}
                </p>
                <p>
                  <strong>Roll:</strong> {termResults.event.roll} on 2d6
                </p>
              </div>
            )}
          </div>

          <div
            className={`phase-card ${currentPhase === 'advancement' ? 'active' : termResults.advancement ? 'completed' : 'pending'}`}
          >
            <h4>3. Advancement Roll</h4>
            <p>Attempt to gain rank and recognition in your career.</p>
            {career && assignment && (
              <div className="roll-info">
                <p>
                  <strong>Requirement:</strong>{' '}
                  {Object.entries(
                    career.career_progress?.advancement?.[assignment] || {}
                  )[0]?.join(' ') || 'No advancement'}{' '}
                  {
                    Object.entries(
                      career.career_progress?.advancement?.[assignment] || {}
                    )[0]?.[1]
                  }
                  +
                </p>
                {character.tempModifiers?.advancementDM !== 0 && (
                  <p>
                    <strong>Bonus DM:</strong> +
                    {character.tempModifiers.advancementDM}
                  </p>
                )}
              </div>
            )}
            {currentPhase === 'advancement' && (
              <button
                className="btn btn-primary"
                onClick={handleAdvancementRoll}
              >
                Roll Advancement
              </button>
            )}
            {termResults.advancement && (
              <div
                className={`roll-result ${termResults.advancement.success ? 'success' : 'failure'}`}
              >
                <p>
                  <strong>Result:</strong> {termResults.advancement.formatted}
                </p>
                {termResults.advancement.success && (
                  <p className="promotion-notice">
                    🎉 Promoted to Rank {currentRank + 1}!
                  </p>
                )}
              </div>
            )}
          </div>

          <div
            className={`phase-card ${currentPhase === 'skills' ? 'active' : termResults.skillTraining ? 'completed' : 'pending'}`}
          >
            <h4>4. Skill Training</h4>
            <p>Gain new skills or improve existing ones through training.</p>
            {currentPhase === 'skills' && !termResults.skillTraining && (
              <SkillTrainingInterface
                career={career}
                assignment={assignment}
                onComplete={handleSkillTrainingComplete}
              />
            )}
            {termResults.skillTraining && (
              <div className="roll-result success">
                <p>
                  <strong>Result:</strong> {termResults.skillTraining.note}
                </p>
              </div>
            )}
          </div>

          {termResults.mishap && (
            <div className="phase-card mishap-effects">
              <h4>Mishap</h4>
              <p>A mishap has occurred, ending your career.</p>
              <div className="mishap-result">
                <p>
                  <strong>Mishap:</strong> {termResults.mishap.description}
                </p>
                <p>
                  <strong>Roll:</strong> {termResults.mishap.roll} on 2d6
                </p>
              </div>
            </div>
          )}

          {termResults.aging && !termResults.aging.noAging && (
            <div className="phase-card aging-effects">
              <h4>Aging Effects</h4>
              <p>The passage of time takes its toll on your character.</p>
              <div className="aging-result">
                {Object.entries(termResults.aging.totalEffects).map(
                  ([attr, change]) =>
                    change !== 0 && (
                      <p key={attr}>
                        <strong>{attr}:</strong> {change >= 0 ? '+' : ''}
                        {change}
                      </p>
                    )
                )}
              </div>
            </div>
          )}

          {pendingChoices.length > 0 && (
            <div className="phase-card player-choices">
              <h4>Player Choices</h4>
              <p>Make your choices to continue:</p>
              {pendingChoices.map((choice, index) => (
                <div key={index} className="choice-section">
                  <p>
                    <strong>{choice.description}</strong>
                  </p>
                  <div className="choice-options">
                    {choice.choices?.map((option, optionIndex) => (
                      <button
                        key={optionIndex}
                        className="btn btn-secondary choice-btn"
                        onClick={() => handlePlayerChoice(option, index)}
                      >
                        {option.description}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            className={`phase-card ${currentPhase === 'decision' ? 'active' : 'pending'}`}
          >
            <h4>5. Continue or Leave</h4>
            <p>
              Decide whether to continue in this career for another term or
              leave.
            </p>
            {currentPhase === 'decision' && (
              <div className="career-decision">
                <button
                  className="btn btn-success"
                  onClick={handleContinueCareer}
                >
                  Continue Career (+4 years)
                </button>
                <button className="btn btn-warning" onClick={handleLeaveCareer}>
                  Leave Career
                </button>
                <button
                  className="btn btn-info"
                  onClick={handleShowTermSummary}
                >
                  Show Term Summary
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showTermSummary && (
        <div className="term-summary">
          <h3>Term {character.currentTerm} Summary</h3>
          <div className="summary-content">
            <div className="summary-section">
              <h4>Results</h4>
              <ul>
                {termResults.survival && (
                  <li>
                    Survival:{' '}
                    {termResults.survival.success ? '✅ Passed' : '❌ Failed'}
                  </li>
                )}
                {termResults.advancement && (
                  <li>
                    Advancement:{' '}
                    {termResults.advancement.success
                      ? '✅ Promoted'
                      : '❌ No promotion'}
                  </li>
                )}
                {termResults.skillTraining && <li>Training: ✅ Completed</li>}
                {termResults.aging && !termResults.aging.noAging && (
                  <li>Aging: Applied effects</li>
                )}
              </ul>
            </div>

            <div className="summary-section">
              <h4>Character Status</h4>
              <p>
                <strong>Age:</strong> {character.age}
              </p>
              <p>
                <strong>Rank:</strong> {currentRank}{' '}
                {
                  character.careerHistory[character.careerHistory.length - 1]
                    ?.rankTitle
                }
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="career-history-display">
        <h3>Career History</h3>
        {character.careerHistory.length > 0 ? (
          <div className="history-list">
            {character.careerHistory.map((career, index) => (
              <div key={index} className="career-entry">
                <h4>
                  {career.career.charAt(0).toUpperCase() +
                    career.career.slice(1)}{' '}
                  - {career.assignment}
                </h4>
                <p>
                  <strong>Terms:</strong>{' '}
                  {career.terms || character.currentTerm},
                  <strong> Rank:</strong> {career.rank}{' '}
                  {career.rankTitle && `(${career.rankTitle})`}
                  {career.commissioned && (
                    <span className="commissioned-badge">Officer</span>
                  )}
                </p>
                {career.events.length > 0 && (
                  <div className="career-events">
                    <strong>Events:</strong>
                    <ul>
                      {career.events.map((event, eventIndex) => (
                        <li key={eventIndex}>
                          <strong>Term {event.term}:</strong>{' '}
                          {event.description}
                          {event.success !== undefined && (
                            <span
                              className={`event-result ${event.success ? 'success' : 'failure'}`}
                            >
                              {event.success ? ' ✅' : ' ❌'}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No career history yet.</p>
        )}
      </div>
    </div>
  );
}
