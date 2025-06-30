import React from 'react';
import { useCharacter } from '../../context/CharacterContext';

export default function CareerTermsTab() {
  const { character } = useCharacter();

  return (
    <div className="career-terms-tab">
      <h2>Career Terms</h2>
      <p>Progress through your career terms, facing survival challenges, events, and advancement opportunities.</p>
      
      {character.currentCareer ? (
        <div className="current-career">
          <h3>Current Career: {character.currentCareer}</h3>
          <p>Term: {character.currentTerm}</p>
          <p>Age: {character.age}</p>
          
          <div className="term-progression">
            <div className="phase-card">
              <h4>1. Survival Roll</h4>
              <p>Roll to survive the dangers of your career.</p>
              <button className="btn btn-primary">Roll Survival</button>
            </div>
            
            <div className="phase-card">
              <h4>2. Event Roll</h4>
              <p>Experience events that shape your character.</p>
              <button className="btn btn-primary" disabled>Roll Event</button>
            </div>
            
            <div className="phase-card">
              <h4>3. Advancement Roll</h4>
              <p>Attempt to gain rank and recognition.</p>
              <button className="btn btn-primary" disabled>Roll Advancement</button>
            </div>
            
            <div className="phase-card">
              <h4>4. Skill Training</h4>
              <p>Gain new skills or improve existing ones.</p>
              <button className="btn btn-primary" disabled>Train Skills</button>
            </div>
            
            <div className="phase-card">
              <h4>5. Continue or Leave</h4>
              <p>Decide whether to continue in this career or leave.</p>
              <div className="career-decision">
                <button className="btn btn-success" disabled>Continue Career</button>
                <button className="btn btn-warning" disabled>Leave Career</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-career">
          <p>No active career. Please select a career first.</p>
        </div>
      )}
      
      <div className="career-history-display">
        <h3>Career History</h3>
        {character.careerHistory.length > 0 ? (
          <div className="history-list">
            {character.careerHistory.map((career, index) => (
              <div key={index} className="career-entry">
                <h4>{career.career} - {career.assignment}</h4>
                <p>Terms: {career.terms}, Rank: {career.rank} {career.rankTitle && `(${career.rankTitle})`}</p>
                {career.events.length > 0 && (
                  <div className="career-events">
                    <strong>Events:</strong>
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
          <p>No career history yet.</p>
        )}
      </div>
    </div>
  );
}