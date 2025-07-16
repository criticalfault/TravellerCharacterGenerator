import React, { useState, useEffect } from 'react';
import { useCharacter } from '../context/CharacterContext';
import { rollWithModifier } from '../utils/dice';
import benefitsData from '../data/benefits.json';
import weaponsData from '../data/weapons.json';
import armorData from '../data/armor.json';

const MusteringOut = () => {
  const { character, dispatch, CHARACTER_ACTIONS } = useCharacter();
  const [benefitRolls, setBenefitRolls] = useState([]);
  const [currentRoll, setCurrentRoll] = useState(null);
  const [cashBenefitsUsed, setCashBenefitsUsed] = useState(0);
  const [selectedBenefits, setSelectedBenefits] = useState([]);
  const [showBenefitChoice, setShowBenefitChoice] = useState(false);
  const [availableWeapons, setAvailableWeapons] = useState([]);
  const [availableArmor, setAvailableArmor] = useState([]);

  // Calculate total benefit rolls available
  const calculateBenefitRolls = () => {
    let totalRolls = 0;
    
    character.careerHistory.forEach(career => {
      // One roll per full term
      totalRolls += career.terms;
      
      // Additional rolls for ranks (every 2 ranks rounded up until Rank 6)
      if (career.rank > 0) {
        const rankBonusRolls = Math.min(Math.ceil(career.rank / 2), 3); // Max 3 bonus rolls (rank 6)
        totalRolls += rankBonusRolls;
      }
    });
    
    return totalRolls;
  };

  // Check if character has Rank 5+ in any career for +1 DM
  const hasRank5Bonus = () => {
    return character.careerHistory.some(career => career.rank >= 5);
  };

  // Check if character has Gamble skill for cash roll bonus
  const hasGambleBonus = () => {
    return (character.skills.Gamble || 0) >= 1;
  };

  // Filter equipment by cost and tech level limits
  useEffect(() => {
    if (weaponsData.weapons) {
      const filteredWeapons = weaponsData.weapons.filter(
        weapon => weapon.cost <= 3000 && weapon.tech_level <= 12
      );
      setAvailableWeapons(filteredWeapons);
    }

    if (armorData.armor) {
      const filteredArmor = armorData.armor.filter(
        armor => armor.cost <= 10000 && armor.tech_level <= 12
      );
      setAvailableArmor(filteredArmor);
    }
  }, []);

  // Initialize benefit rolls when component mounts
  useEffect(() => {
    const totalRolls = calculateBenefitRolls();
    const rolls = Array(totalRolls).fill(null).map((_, index) => ({
      id: index,
      used: false,
      result: null,
      type: null // 'cash' or 'material'
    }));
    setBenefitRolls(rolls);
  }, [character.careerHistory]);

  // Handle benefit roll
  const handleBenefitRoll = (rollId, benefitType) => {
    const roll = benefitRolls.find(r => r.id === rollId);
    if (roll.used) return;

    // Calculate modifiers
    let modifier = 0;
    if (hasRank5Bonus()) modifier += 1;
    if (benefitType === 'cash' && hasGambleBonus()) modifier += 1;

    // Make the roll
    const rollResult = rollWithModifier(modifier);
    const diceTotal = rollResult.total;

    // Get benefit from appropriate table
    let benefit;
    if (benefitType === 'cash') {
      benefit = {
        type: 'cash',
        amount: benefitsData.cash_benefits[diceTotal] || benefitsData.cash_benefits[12],
        description: `Cr${benefitsData.cash_benefits[diceTotal] || benefitsData.cash_benefits[12]}`
      };
    } else {
      const materialBenefit = benefitsData.material_benefits[diceTotal] || benefitsData.material_benefits[12];
      benefit = {
        ...materialBenefit,
        rollResult: diceTotal
      };
    }

    // Update the roll
    const updatedRolls = benefitRolls.map(r => 
      r.id === rollId 
        ? { ...r, used: true, result: benefit, type: benefitType, diceRoll: rollResult }
        : r
    );
    setBenefitRolls(updatedRolls);

    // Track cash benefits used
    if (benefitType === 'cash') {
      setCashBenefitsUsed(prev => prev + 1);
    }

    // Process the benefit
    processBenefit(benefit);
    setCurrentRoll({ rollId, benefit, rollResult });
  };

  // Process the received benefit
  const processBenefit = (benefit) => {
    switch (benefit.type) {
      case 'cash':
        dispatch({
          type: CHARACTER_ACTIONS.UPDATE_MONEY,
          payload: benefit.amount
        });
        break;
        
      case 'contact':
        dispatch({
          type: CHARACTER_ACTIONS.ADD_CONTACT,
          payload: 'Mustering Out Contact'
        });
        break;
        
      case 'ally':
        dispatch({
          type: CHARACTER_ACTIONS.ADD_ALLY,
          payload: 'Mustering Out Ally'
        });
        break;
        
      case 'characteristic_increase':
        const currentValue = character.attributes[benefit.characteristic];
        const maxValue = character.species === 'Human' ? 15 : 15; // Could be race-specific
        const newValue = Math.min(currentValue + benefit.amount, maxValue);
        
        // Handle SOC overflow as ship shares
        if (benefit.characteristic === 'SOC' && currentValue + benefit.amount > maxValue) {
          const overflow = (currentValue + benefit.amount) - maxValue;
          // Add ship shares for overflow
          dispatch({
            type: CHARACTER_ACTIONS.ADD_GEAR,
            payload: {
              name: 'Ship Shares',
              quantity: overflow,
              description: `${overflow} Ship Share${overflow > 1 ? 's' : ''} from SOC overflow`
            }
          });
        }
        
        dispatch({
          type: CHARACTER_ACTIONS.UPDATE_ATTRIBUTE,
          payload: { attribute: benefit.characteristic, value: newValue }
        });
        break;
        
      case 'ship_shares':
        dispatch({
          type: CHARACTER_ACTIONS.ADD_GEAR,
          payload: {
            name: 'Ship Shares',
            quantity: benefit.amount,
            description: `${benefit.amount} Ship Share${benefit.amount > 1 ? 's' : ''}`
          }
        });
        break;
        
      case 'weapon':
      case 'blade':
      case 'gun':
        // For now, add a generic weapon - could be expanded to allow selection
        dispatch({
          type: CHARACTER_ACTIONS.ADD_GEAR,
          payload: {
            name: 'Weapon',
            description: benefit.description,
            category: 'Weapon'
          }
        });
        break;
        
      case 'armor':
        dispatch({
          type: CHARACTER_ACTIONS.ADD_GEAR,
          payload: {
            name: 'Armor',
            description: benefit.description,
            category: 'Armor'
          }
        });
        break;
        
      case 'cybernetic_implant':
        dispatch({
          type: CHARACTER_ACTIONS.ADD_CYBERWARE,
          payload: {
            name: 'Cybernetic Implant',
            description: benefit.description
          }
        });
        break;
        
      case 'special':
        // Handle special benefits (ships, TAS membership, etc.)
        if (benefit.options) {
          // For now, just add the first option - could be expanded for choice
          const selectedOption = benefit.options[0];
          dispatch({
            type: CHARACTER_ACTIONS.ADD_GEAR,
            payload: {
              name: selectedOption.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
              description: selectedOption.description,
              category: 'Special'
            }
          });
        }
        break;
        
      default:
        // Generic gear item
        dispatch({
          type: CHARACTER_ACTIONS.ADD_GEAR,
          payload: {
            name: benefit.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: benefit.description
          }
        });
    }
    
    setSelectedBenefits(prev => [...prev, benefit]);
  };

  // Start a benefit roll (show choice between cash and material)
  const startBenefitRoll = (rollId) => {
    setCurrentRoll({ rollId });
    setShowBenefitChoice(true);
  };

  // Handle benefit type choice
  const chooseBenefitType = (type) => {
    setShowBenefitChoice(false);
    handleBenefitRoll(currentRoll.rollId, type);
  };

  const totalRolls = calculateBenefitRolls();
  const usedRolls = benefitRolls.filter(r => r.used).length;
  const canUseCash = cashBenefitsUsed < 3;

  return (
    <div className="mustering-out">
      <h2>Mustering Out</h2>
      
      <div className="benefit-summary">
        <h3>Benefit Rolls Available</h3>
        <p>Total Rolls: {totalRolls} | Used: {usedRolls} | Remaining: {totalRolls - usedRolls}</p>
        <p>Cash Benefits Used: {cashBenefitsUsed}/3</p>
        
        {hasRank5Bonus() && (
          <p className="bonus-info">✓ Rank 5+ Bonus: +1 DM to all benefit rolls</p>
        )}
        {hasGambleBonus() && (
          <p className="bonus-info">✓ Gamble Skill Bonus: +1 DM to cash benefit rolls</p>
        )}
      </div>

      <div className="career-breakdown">
        <h4>Benefit Roll Breakdown by Career:</h4>
        {character.careerHistory.map((career, index) => {
          const termRolls = career.terms;
          const rankRolls = career.rank > 0 ? Math.min(Math.ceil(career.rank / 2), 3) : 0;
          const totalCareerRolls = termRolls + rankRolls;
          
          return (
            <div key={index} className="career-benefits">
              <strong>{career.career} ({career.assignment})</strong>
              <ul>
                <li>Terms: {career.terms} (×1 = {termRolls} rolls)</li>
                {career.rank > 0 && (
                  <li>Rank {career.rank}: +{rankRolls} bonus rolls</li>
                )}
                <li><strong>Total: {totalCareerRolls} rolls</strong></li>
              </ul>
            </div>
          );
        })}
      </div>

      <div className="benefit-rolls">
        <h3>Make Benefit Rolls</h3>
        <div className="rolls-grid">
          {benefitRolls.map(roll => (
            <div key={roll.id} className={`benefit-roll ${roll.used ? 'used' : 'available'}`}>
              <h4>Roll #{roll.id + 1}</h4>
              {!roll.used ? (
                <button 
                  onClick={() => startBenefitRoll(roll.id)}
                  className="roll-button"
                >
                  Make Roll
                </button>
              ) : (
                <div className="roll-result">
                  <p><strong>Type:</strong> {roll.type}</p>
                  <p><strong>Dice:</strong> {roll.diceRoll.formatted}</p>
                  <p><strong>Result:</strong> {roll.result.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showBenefitChoice && (
        <div className="benefit-choice-modal">
          <div className="modal-content">
            <h3>Choose Benefit Type</h3>
            <p>Roll #{currentRoll.rollId + 1}</p>
            
            <div className="choice-buttons">
              {canUseCash ? (
                <button 
                  onClick={() => chooseBenefitType('cash')}
                  className="cash-button"
                >
                  Cash Benefits
                  {hasGambleBonus() && <span className="bonus"> (+1 DM)</span>}
                </button>
              ) : (
                <button disabled className="cash-button disabled">
                  Cash Benefits (Limit Reached: 3/3)
                </button>
              )}
              
              <button 
                onClick={() => chooseBenefitType('material')}
                className="material-button"
              >
                Other Benefits
              </button>
            </div>
            
            <button 
              onClick={() => setShowBenefitChoice(false)}
              className="cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="received-benefits">
        <h3>Received Benefits</h3>
        {selectedBenefits.length === 0 ? (
          <p>No benefits received yet.</p>
        ) : (
          <ul>
            {selectedBenefits.map((benefit, index) => (
              <li key={index}>
                <strong>{benefit.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {benefit.description}
              </li>
            ))}
          </ul>
        )}
      </div>

      <style jsx>{`
        .mustering-out {
          padding: 20px;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .benefit-summary {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .bonus-info {
          color: #28a745;
          font-weight: bold;
        }
        
        .career-breakdown {
          margin-bottom: 20px;
        }
        
        .career-benefits {
          background: #fff;
          border: 1px solid #ddd;
          padding: 10px;
          margin: 10px 0;
          border-radius: 4px;
        }
        
        .rolls-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        
        .benefit-roll {
          border: 2px solid #ddd;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }
        
        .benefit-roll.available {
          border-color: #007bff;
          background: #f8f9fa;
        }
        
        .benefit-roll.used {
          border-color: #28a745;
          background: #d4edda;
        }
        
        .roll-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        
        .roll-button:hover {
          background: #0056b3;
        }
        
        .benefit-choice-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          text-align: center;
          min-width: 400px;
        }
        
        .choice-buttons {
          display: flex;
          gap: 15px;
          margin: 20px 0;
          justify-content: center;
        }
        
        .cash-button, .material-button {
          padding: 15px 25px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
        }
        
        .cash-button {
          background: #28a745;
          color: white;
        }
        
        .cash-button:hover:not(.disabled) {
          background: #218838;
        }
        
        .cash-button.disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        
        .material-button {
          background: #17a2b8;
          color: white;
        }
        
        .material-button:hover {
          background: #138496;
        }
        
        .bonus {
          font-size: 12px;
          color: #ffc107;
        }
        
        .cancel-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .received-benefits {
          margin-top: 30px;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }
        
        .received-benefits ul {
          list-style-type: none;
          padding: 0;
        }
        
        .received-benefits li {
          background: white;
          margin: 10px 0;
          padding: 10px;
          border-radius: 4px;
          border-left: 4px solid #007bff;
        }
      `}</style>
    </div>
  );
};

export default MusteringOut;