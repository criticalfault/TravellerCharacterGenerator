import React, { useState } from 'react';
import './TabNavigation.css';

// Tab component definitions
import RaceSelectionTab from './tabs/RaceSelectionTab';
import AttributesTab from './tabs/AttributesTab';
import BackgroundSkillsTab from './tabs/BackgroundSkillsTab';
import CareerSelectionTab from './tabs/CareerSelectionTab';
import CareerTermsTab from './tabs/CareerTermsTab';
import MusteringOutTab from './tabs/MusteringOutTab';
import SummaryTab from './tabs/SummaryTab';
import SaveLoadTab from './tabs/SaveLoadTab';

const TABS = [
  { id: 'race-selection', label: 'Species', component: RaceSelectionTab },
  { id: 'attributes', label: 'Attributes', component: AttributesTab },
  { id: 'background', label: 'Background Skills', component: BackgroundSkillsTab },
  { id: 'career-selection', label: 'Career Selection', component: CareerSelectionTab },
  { id: 'career-terms', label: 'Career Terms', component: CareerTermsTab },
  { id: 'mustering-out', label: 'Mustering Out', component: MusteringOutTab },
  { id: 'summary', label: 'Summary', component: SummaryTab },
  { id: 'save-load', label: 'Save/Load', component: SaveLoadTab }
];

export default function TabNavigation() {
  const [activeTab, setActiveTab] = useState('race-selection');

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const getCurrentTabComponent = () => {
    const currentTab = TABS.find(tab => tab.id === activeTab);
    if (currentTab) {
      const Component = currentTab.component;
      return <Component />;
    }
    return null;
  };

  const canNavigateToTab = (tabId) => {
    // Basic navigation validation - can be enhanced later
    // For now, allow navigation to all tabs for development
    return true;
  };

  return (
    <div className="tab-navigation">
      <div className="tab-header">
        <div className="tab-list">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${!canNavigateToTab(tab.id) ? 'disabled' : ''}`}
              onClick={() => canNavigateToTab(tab.id) && handleTabChange(tab.id)}
              disabled={!canNavigateToTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="tab-content">
        {getCurrentTabComponent()}
      </div>
      
      <div className="tab-navigation-controls">
        <button 
          className="nav-button prev"
          onClick={() => {
            const currentIndex = TABS.findIndex(tab => tab.id === activeTab);
            if (currentIndex > 0) {
              const prevTab = TABS[currentIndex - 1];
              if (canNavigateToTab(prevTab.id)) {
                setActiveTab(prevTab.id);
              }
            }
          }}
          disabled={TABS.findIndex(tab => tab.id === activeTab) === 0}
        >
          Previous
        </button>
        
        <button 
          className="nav-button next"
          onClick={() => {
            const currentIndex = TABS.findIndex(tab => tab.id === activeTab);
            if (currentIndex < TABS.length - 1) {
              const nextTab = TABS[currentIndex + 1];
              if (canNavigateToTab(nextTab.id)) {
                setActiveTab(nextTab.id);
              }
            }
          }}
          disabled={TABS.findIndex(tab => tab.id === activeTab) === TABS.length - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}