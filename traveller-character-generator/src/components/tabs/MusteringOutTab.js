import React, { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { rollMusteringOutBenefit } from '../../utils/gameMechanics';
import careerData from '../../data/careers.json';

export default function MusteringOutTab() {
  const { character, dispatch, CHARACTER_ACTIONS } = useCharacter();
  const [rollHistory, setRollHistory] = useState([]);
  const [selectedCareer, setSelectedCareer] = useState(null);

  // Get available careers from character history for benefit rolling
  const availableCareers = character.careerHistory.filter(career => career.terms > 0);

  // Calculate benefit DM based on rank (if applicable)
  const getBenefitDM = (career) => {
    let dm = 0;
    
    // Add rank bonus for benefit rolls (typically +1 for each rank above 1)
    if (career.rank > 1) {
      dm += Math.floor(career.rank / 2); // +1 DM per 2 ranks
    }
    
    // Add any temporary benefit DM from events
    dm += character.tempModifiers.benefitDM;
    
    return dm;
  };

  // Process benefit result and update character
  const processBenefitResult = (result, careerName) => {
    const benefit = result.benefit;
    
    if (result.isCash) {
      // Add cash to character
      dispatch({
        type: CHARACTER_ACTIONS.UPDATE_MONEY,
        payload: benefit
      });
    } else {
      // Process material benefit
      if (typeof benefit === 'string') {
        processSingleBenefit(benefit);
      } else if (Array.isArray(benefit)) {
        // Player choice between multiple benefits
        // For now, just take the first one - could be enhanced with choice UI
        processSingleBenefit(benefit[0]);
      }
    }
    
    // Reduce available benefit rolls
    dispatch({
      type: CHARACTER_ACTIONS.ADD_BENEFIT_ROLLS,
      payload: -1
    });
  };

  // Process individual benefit
  const processSingleBenefit = (benefit) => {
    if (benefit.includes('+1')) {
      // Attribute increase
      const attribute = benefit.split(' ')[0];
      if (['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'].includes(attribute)) {
        dispatch({
          type: CHARACTER_ACTIONS.UPDATE_ATTRIBUTE,
          payload: { 
            attribute, 
            value: character.attributes[attribute] + 1 
          }
        });
      }
    } else if (benefit === 'Contact') {
      dispatch({
        type: CHARACTER_ACTIONS.ADD_CONTACT,
        payload: 'Career Contact'
      });
    } else if (benefit === 'Ship Share') {
      dispatch({
        type: CHARACTER_ACTIONS.ADD_GEAR,
        payload: 'Ship Share'
      });
    } else if (benefit === 'TAS Membership') {
      dispatch({
        type: CHARACTER_ACTIONS.ADD_GEAR,
        payload: 'Travellers\' Aid Society Membership'
      });
    } else if (benefit === 'Cybernetic Implant') {
      dispatch({
        type: CHARACTER_ACTIONS.ADD_CYBERWARE,
        payload: 'Cybernetic Implant'
      });
    } else {
      // Generic equipment/weapon
      dispatch({
        type: CHARACTER_ACTIONS.ADD_GEAR,
        payload: benefit
      });
    }
  };

  // Roll for cash benefit
  const rollCashBenefit = (career) => {
    const careerName = career.career.toLowerCase();
    const benefitTable = careerData[careerName]?.muster_out_benefits;
    
    if (!benefitTable) {
      console.error(`No benefit table found for career: ${careerName}`);
      return;
    }
    
    const benefitDM = getBenefitDM(career);
    const result = rollMusteringOutBenefit(benefitTable, true, benefitDM);
    
    // Add to roll history
    const rollEntry = {
      type: 'Cash',
      career: career.career,
      roll: result.roll,
      clampedRoll: result.clampedRoll,
      benefit: result.benefit,
      dm: benefitDM,
      timestamp: Date.now()
    };
    
    setRollHistory(prev => [...prev, rollEntry]);
    processBenefitResult(result, careerName);
  };

  // Roll for material benefit
  const rollMaterialBenefit = (career) => {
    const careerName = career.career.toLowerCase();
    const benefitTable = careerData[careerName]?.muster_out_benefits;
    
    if (!benefitTable) {
      console.error(`No benefit table found for career: ${careerName}`);
      return;
    }
    
    const benefitDM = getBenefitDM(career);
    const result = rollMusteringOutBenefit(benefitTable, false, benefitDM);
    
    // Add to roll history
    const rollEntry = {
      type: 'Material',
      career: career.career,
      roll: result.roll,
      clampedRoll: result.clampedRoll,
      benefit: result.benefit,
      dm: benefitDM,
      timestamp: Date.now()
    };
    
    setRollHistory(prev => [...prev, rollEntry]);
    processBenefitResult(result, careerName);
  };

  return (
    <div className="mustering-out-tab">
      <h2>Mustering Out</h2>
      <p>Collect your final benefits from your career(s) before beginning your adventuring life.</p>
      
      <div className="benefit-rolls-section">
        <h3>Benefit Rolls Available: {character.benefitRolls}</h3>
        
        {character.benefitRolls > 0 && availableCareers.length > 0 ? (
          <div className="career-selection">
            <h4>Select Career for Benefit Roll</h4>
            <div className="career-options">
              {availableCareers.map((career, index) => {
                const benefitDM = getBenefitDM(career);
                return (
                  <div key={index} className="career-option">
                    <h5>{career.career} ({career.assignment})</h5>
                    <p>Terms: {career.terms}, Rank: {career.rank} ({career.rankTitle})</p>
                    <p>Benefit DM: {benefitDM >= 0 ? '+' : ''}{benefitDM}</p>
                    
                    <div className="benefit-buttons">
                      <button 
                        className="btn btn-success"
                        onClick={() => rollCashBenefit(career)}
                      >
                        Roll for Cash
                      </button>
                      <button 
                        className="btn btn-primary"
                        onClick={() => rollMaterialBenefit(career)}
                      >
                        Roll for Benefits
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : character.benefitRolls === 0 ? (
          <p>No benefit rolls remaining.</p>
        ) : (
          <p>No completed careers available for mustering out benefits.</p>
        )}
      </div>

      {rollHistory.length > 0 && (
        <div className="roll-history">
          <h3>Benefit Roll History</h3>
          <div className="roll-entries">
            {rollHistory.map((entry, index) => (
              <div key={index} className="roll-entry">
                <strong>{entry.type} Roll</strong> ({entry.career}): 
                Rolled {entry.roll} (table: {entry.clampedRoll}) 
                {entry.dm !== 0 && ` with DM ${entry.dm >= 0 ? '+' : ''}${entry.dm}`}
                → <em>{Array.isArray(entry.benefit) ? entry.benefit.join(' or ') : entry.benefit}</em>
              </div>
            ))}
          </div>
        </div>
      )}
      
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

          <div className="benefit-category">
            <h4>Contacts & Relationships</h4>
            <div className="relationships">
              {character.contacts.length > 0 && (
                <div>
                  <strong>Contacts:</strong> {character.contacts.join(', ')}
                </div>
              )}
              {character.allies.length > 0 && (
                <div>
                  <strong>Allies:</strong> {character.allies.join(', ')}
                </div>
              )}
              {character.enemies.length > 0 && (
                <div>
                  <strong>Enemies:</strong> {character.enemies.join(', ')}
                </div>
              )}
              {character.rivals.length > 0 && (
                <div>
                  <strong>Rivals:</strong> {character.rivals.join(', ')}
                </div>
              )}
              {character.contacts.length === 0 && character.allies.length === 0 && 
               character.enemies.length === 0 && character.rivals.length === 0 && (
                <p>No relationships established.</p>
              )}
            </div>
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
          <strong>Cash Benefits:</strong> Guaranteed credits based on your career and rank.
        </p>
        <p>
          <strong>Material Benefits:</strong> Equipment, weapons, attribute increases, and other valuable items.
          These can be more valuable than cash but are random.
        </p>
        <p>
          <strong>Benefit DM:</strong> Higher ranks provide dice modifiers to benefit rolls, 
          increasing your chances of better results.
        </p>
      </div>
    </div>
  );
}