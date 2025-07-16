import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import weaponsData from '../../data/weapons.json';
import armorData from '../../data/armor.json';
import equipmentData from '../../data/equipment.json';

const CATEGORIES = {
  weapons: 'Weapons',
  armor: 'Armor',
  equipment: 'Equipment'
};

export default function ShoppingTab() {
  const { character, dispatch, CHARACTER_ACTIONS } = useCharacter();
  const [selectedCategory, setSelectedCategory] = useState('weapons');
  const [searchTerm, setSearchTerm] = useState('');
  const [maxTechLevel, setMaxTechLevel] = useState(12);
  const [sortBy, setSortBy] = useState('name'); // name, cost, tech_level
  const [showCart, setShowCart] = useState(false);

  // Use persistent cart from character context
  const cart = character.shoppingCart;

  // Combine all equipment data
  const getAllItems = () => {
    const items = [];
    
    // Add weapons
    if (weaponsData.weapons) {
      weaponsData.weapons.forEach(item => {
        items.push({ ...item, category: 'weapons', id: `weapon_${item.name}` });
      });
    }
    
    // Add armor
    if (armorData.armor) {
      armorData.armor.forEach(item => {
        items.push({ ...item, category: 'armor', id: `armor_${item.name}` });
      });
    }
    
    // Add equipment
    if (equipmentData.equipment) {
      equipmentData.equipment.forEach(item => {
        items.push({ ...item, category: 'equipment', id: `equipment_${item.name}` });
      });
    }
    
    return items;
  };

  // Filter and sort items
  const getFilteredItems = () => {
    const allItems = getAllItems();
    
    return allItems
      .filter(item => {
        // Category filter
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }
        
        // Tech level filter
        if (item.tech_level > maxTechLevel) {
          return false;
        }
        
        // Search filter
        if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !(item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'cost':
            return a.cost - b.cost;
          case 'tech_level':
            return a.tech_level - b.tech_level;
          case 'name':
          default:
            return a.name.localeCompare(b.name);
        }
      });
  };

  // Add item to cart
  const addToCart = (item) => {
    dispatch({
      type: CHARACTER_ACTIONS.ADD_TO_CART,
      payload: item
    });
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    dispatch({
      type: CHARACTER_ACTIONS.REMOVE_FROM_CART,
      payload: itemId
    });
  };

  // Update cart item quantity
  const updateCartQuantity = (itemId, quantity) => {
    dispatch({
      type: CHARACTER_ACTIONS.UPDATE_CART_QUANTITY,
      payload: { id: itemId, quantity }
    });
  };

  // Calculate cart total
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.cost * item.quantity), 0);
  };

  // Purchase items in cart
  const purchaseItems = () => {
    const total = getCartTotal();
    
    if (total > character.money) {
      alert('Insufficient credits for this purchase!');
      return;
    }
    
    // Deduct money
    dispatch({
      type: CHARACTER_ACTIONS.UPDATE_MONEY,
      payload: -total
    });
    
    // Add items to character's gear
    cart.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        dispatch({
          type: CHARACTER_ACTIONS.ADD_GEAR,
          payload: {
            name: item.name,
            category: item.category,
            cost: item.cost,
            tech_level: item.tech_level,
            description: item.description,
            damage: item.damage,
            protection: item.protection,
            traits: item.traits,
            mass: item.mass
          }
        });
      }
    });
    
    // Clear cart
    dispatch({
      type: CHARACTER_ACTIONS.CLEAR_CART
    });
    setShowCart(false);
    
    alert(`Purchase successful! Spent ${total.toLocaleString()} credits.`);
  };

  // Check if character owns an item
  const getOwnedQuantity = (itemName) => {
    return character.gear.filter(item => 
      (typeof item === 'string' ? item : item.name) === itemName
    ).length;
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="shopping-tab">
      <h2>Equipment Shopping</h2>
      <p>Outfit your character with weapons, armor, and equipment using your earned credits.</p>
      
      <div className="shopping-header">
        <div className="credit-display">
          <h3>Available Credits: {character.money.toLocaleString()} Cr</h3>
          {cart.length > 0 && (
            <div className="cart-summary">
              <button 
                className="cart-button"
                onClick={() => setShowCart(!showCart)}
              >
                Cart ({cart.length} items) - {getCartTotal().toLocaleString()} Cr
              </button>
            </div>
          )}
        </div>
        
        <div className="shopping-controls">
          <div className="filter-controls">
            <label>
              Category:
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>
            
            <label>
              Max Tech Level:
              <input 
                type="number" 
                min="1" 
                max="15" 
                value={maxTechLevel}
                onChange={(e) => setMaxTechLevel(parseInt(e.target.value) || 12)}
              />
            </label>
            
            <label>
              Sort by:
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="name">Name</option>
                <option value="cost">Cost</option>
                <option value="tech_level">Tech Level</option>
              </select>
            </label>
          </div>
          
          <div className="search-control">
            <input 
              type="text"
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {showCart && (
        <div className="shopping-cart">
          <h3>Shopping Cart</h3>
          {cart.length === 0 ? (
            <p>Cart is empty</p>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <strong>{item.name}</strong>
                      <span className="cart-item-cost">
                        {item.cost.toLocaleString()} Cr each
                      </span>
                    </div>
                    <div className="cart-item-controls">
                      <button 
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="quantity-btn"
                      >
                        -
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="quantity-btn"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="remove-btn"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="cart-item-total">
                      {(item.cost * item.quantity).toLocaleString()} Cr
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-total">
                <strong>Total: {getCartTotal().toLocaleString()} Cr</strong>
              </div>
              <div className="cart-actions">
                <button 
                  className="purchase-btn"
                  onClick={purchaseItems}
                  disabled={getCartTotal() > character.money}
                >
                  {getCartTotal() > character.money ? 'Insufficient Credits' : 'Purchase All'}
                </button>
                <button 
                  className="clear-cart-btn"
                  onClick={() => dispatch({ type: CHARACTER_ACTIONS.CLEAR_CART })}
                >
                  Clear Cart
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="equipment-grid">
        {filteredItems.length === 0 ? (
          <p>No items found matching your criteria.</p>
        ) : (
          filteredItems.map(item => {
            const ownedQuantity = getOwnedQuantity(item.name);
            const canAfford = item.cost <= character.money;
            
            return (
              <div key={item.id} className={`equipment-card ${!canAfford ? 'unaffordable' : ''}`}>
                <div className="equipment-header">
                  <h4>{item.name}</h4>
                  <div className="equipment-meta">
                    <span className="tech-level">TL{item.tech_level}</span>
                    <span className="category">{CATEGORIES[item.category] || item.category}</span>
                  </div>
                </div>
                
                <div className="equipment-stats">
                  {item.damage && (
                    <div className="stat">
                      <strong>Damage:</strong> {item.damage}
                    </div>
                  )}
                  {item.protection && (
                    <div className="stat">
                      <strong>Protection:</strong> {item.protection}
                    </div>
                  )}
                  {item.mass && (
                    <div className="stat">
                      <strong>Mass:</strong> {item.mass} kg
                    </div>
                  )}
                  {item.traits && item.traits.length > 0 && (
                    <div className="stat">
                      <strong>Traits:</strong> {item.traits.join(', ')}
                    </div>
                  )}
                </div>
                
                <div className="equipment-description">
                  {item.description}
                </div>
                
                <div className="equipment-footer">
                  <div className="cost">
                    <strong>{item.cost.toLocaleString()} Cr</strong>
                  </div>
                  
                  {ownedQuantity > 0 && (
                    <div className="owned-indicator">
                      Owned: {ownedQuantity}
                    </div>
                  )}
                  
                  <button 
                    className="add-to-cart-btn"
                    onClick={() => addToCart(item)}
                    disabled={!canAfford}
                  >
                    {canAfford ? 'Add to Cart' : 'Too Expensive'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="current-equipment">
        <h3>Current Equipment</h3>
        {character.gear.length === 0 ? (
          <p>No equipment owned yet.</p>
        ) : (
          <div className="equipment-list">
            {character.gear.map((item, index) => (
              <div key={index} className="owned-item">
                <strong>{typeof item === 'string' ? item : item.name}</strong>
                {typeof item === 'object' && item.description && (
                  <span className="item-description"> - {item.description}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .shopping-tab {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .shopping-header {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .credit-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .credit-display h3 {
          color: #28a745;
          margin: 0;
        }
        
        .cart-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        
        .cart-button:hover {
          background: #0056b3;
        }
        
        .shopping-controls {
          display: flex;
          gap: 20px;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .filter-controls {
          display: flex;
          gap: 15px;
          align-items: center;
        }
        
        .filter-controls label {
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-weight: bold;
        }
        
        .filter-controls select,
        .filter-controls input {
          padding: 5px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .search-control input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 250px;
        }
        
        .shopping-cart {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .cart-items {
          margin: 15px 0;
        }
        
        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }
        
        .cart-item-info {
          flex: 1;
        }
        
        .cart-item-cost {
          color: #666;
          font-size: 0.9em;
          margin-left: 10px;
        }
        
        .cart-item-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .quantity-btn {
          background: #6c757d;
          color: white;
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .quantity {
          min-width: 30px;
          text-align: center;
          font-weight: bold;
        }
        
        .remove-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .cart-total {
          text-align: right;
          font-size: 1.2em;
          margin: 15px 0;
        }
        
        .cart-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        
        .purchase-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        
        .purchase-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        
        .clear-cart-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .equipment-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        
        .equipment-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          background: white;
        }
        
        .equipment-card.unaffordable {
          opacity: 0.6;
          border-color: #dc3545;
        }
        
        .equipment-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        
        .equipment-header h4 {
          margin: 0;
          color: #333;
        }
        
        .equipment-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
        }
        
        .tech-level {
          background: #17a2b8;
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.8em;
        }
        
        .category {
          background: #6c757d;
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.8em;
        }
        
        .equipment-stats {
          margin: 10px 0;
        }
        
        .stat {
          margin: 5px 0;
          font-size: 0.9em;
        }
        
        .equipment-description {
          color: #666;
          font-size: 0.9em;
          margin: 10px 0;
          line-height: 1.4;
        }
        
        .equipment-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #eee;
        }
        
        .cost {
          color: #28a745;
          font-size: 1.1em;
        }
        
        .owned-indicator {
          color: #007bff;
          font-weight: bold;
          font-size: 0.9em;
        }
        
        .add-to-cart-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 15px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .add-to-cart-btn:hover:not(:disabled) {
          background: #0056b3;
        }
        
        .add-to-cart-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        
        .current-equipment {
          margin-top: 30px;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }
        
        .equipment-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 10px;
          margin-top: 15px;
        }
        
        .owned-item {
          background: white;
          padding: 10px;
          border-radius: 4px;
          border-left: 4px solid #28a745;
        }
        
        .item-description {
          color: #666;
          font-weight: normal;
        }
      `}</style>
    </div>
  );
}