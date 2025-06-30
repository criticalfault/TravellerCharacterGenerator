import React from 'react';
import { useCharacter } from '../../context/CharacterContext';

export default function MusteringOutTab() {
  const { character } = useCharacter();

  return (
    <div className="mustering-out-tab">
      <h2>Mustering Out</h2>
      <p>Collect your final benefits from your career(s) before beginning your adventuring life.</p>
      
      <div className="benefit-rolls-section">
        <h3>Benefit Rolls</h3>
        <p>You have <strong>{character.benefitRolls}</strong> benefit rolls available.</p>
        
        {character.benefitRolls > 0 ? (
          <div className="benefit-options">
            <div className="benefit-choice">
              <h4>Cash Benefits</h4>
              <p>Roll for credits and money.</p>
              <button className="btn btn-primary">Roll for Cash</button>
            </div>
            
            <div className="benefit-choice">
              <h4>Material Benefits</h4>
              <p>Roll for equipment, weapons, and other items.</p>
              <button className="btn btn-primary">Roll for Benefits</button>
            </div>
          </div>
        ) : (
          <p>No benefit rolls available. Complete career terms to earn benefit rolls.</p>
        )}
      </div>
      
      <div className="current-benefits">
        <h3>Current Benefits</h3>
        
        <div className="benefits-grid">
          <div className="benefit-category">
            <h4>Credits</h4>
            <p className="credits-amount">{character.money.toLocaleString()} Cr</p>
          </div>
          
          <div className="benefit-category">
            <h4>Equipment</h4>
            {character.gear.length > 0 ? (
              <ul className="equipment-list">
                {character.gear.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No equipment yet.</p>
            )}
          </div>
          
          <div className="benefit-category">
            <h4>Cyberware</h4>
            {character.cyberware.length > 0 ? (
              <ul className="cyberware-list">
                {character.cyberware.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No cyberware.</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mustering-out-info">
        <h3>Mustering Out Information</h3>
        <p>
          When you leave a career (voluntarily or involuntarily), you receive benefit rolls 
          based on your terms of service and rank achieved. These benefits represent your 
          savings, equipment, and connections gained during your career.
        </p>
        <p>
          You can choose to take cash benefits (guaranteed credits) or roll on the 
          material benefits table for potentially more valuable items and connections.
        </p>
      </div>
    </div>
  );
}