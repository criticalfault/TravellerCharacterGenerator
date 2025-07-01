# Traveller Character Generator (Mongoose 2e) - Design Overview

## Purpose

A web-based character generator for Mongoose 2nd Edition Traveller. The goal is to provide a guided, tabbed interface that walks users through character creation, with features for saving, loading, and updating completed characters.

---

## Architecture Overview

### Frontend Stack

- **Framework**: React
- **Routing/Navigation**: Tabbed layout using React Router or component-level tab state
- **State Management**: useState / useReducer (possibly lifting state into context or Redux)
- **Storage**: LocalStorage or Firebase (planned for save/load)
- **Styling**: Bootstrap, Tailwind, or CSS Modules (based on preference)

---

## Component Layout

- `<App />`: Root component, holds global state and tab control
- `<CharacterContextProvider />`: Manages character state across tabs
- `<Tabs />`: Navigation for each step in the character creation process
  - `<AttributesTab />`
  - `<BackgroundSkillsTab />`
  - `<CareerSelectionTab />`
  - `<CareerTermsTab />`
  - `<MusteringOutTab />`
  - `<SummaryTab />` (tracks cyberware, gear, HP, etc.)
  - `<SaveLoadTab />` (storage integration)

---

## Character Creation Flow

Each tab corresponds to a step in character creation:

1. **AttributesTab** – Roll or assign stats
2. **BackgroundSkillsTab** – Assign skills based on education/homeworld
3. **CareerSelectionTab** – Choose a career, pass survival checks
4. **CareerTermsTab** – Repeat career cycles, gain skills, resolve events
5. **MusteringOutTab** – Final benefits, gear, money
6. **SummaryTab** – Editable character sheet with long-term tracking
7. **SaveLoadTab** – Persist character to local storage or external backend

---

## Data Structure

```js
{
  name: "Jane Traveller",
  age: 34,
  attributes: { STR: 7, DEX: 8, END: 6, INT: 9, EDU: 7, SOC: 5 },
  skills: { "Gun Combat": 1, "Mechanic": 2, "Investigate": 3 },
  careerHistory: [
    { 
      career: "Agent", 
      assignment: "Law Enforcement",
      terms: 2, 
      rank: 3, 
      rankTitle: "Detective",
      events: [
        { term: 1, type: "event", roll: 8, description: "Advanced training..." },
        { term: 2, type: "advancement", success: true }
      ]
    }
  ],
  contacts: ["Detective Smith", "Informant Joe"],
  allies: ["Captain Martinez"],
  enemies: ["Crime Boss Wilson"],
  rivals: [],
  gear: ["Vacc Suit", "Laser Rifle", "Scientific Equipment"],
  cyberware: ["Neural Link"],
  money: 32000,
  benefitRolls: 4,
  injuries: [],
  species: "Human",
  damage: { current: 0, max: 9 }
}
```

---

## Event Processing System

The career system uses a complex event chain processing engine to handle the rich career progression mechanics:

### Event Chain Structure
- Events contain `eventChain` arrays with multiple steps
- Each step has a `type` (Gain_Skill, Roll_Skill, choice, etc.)
- Conditional logic supports success/failure branches
- Player choices allow multiple outcome paths

### Event Types
- **Gain_Skill**: Add new skills or increase existing ones
- **Roll_Skill**: Make skill checks with consequences
- **choice**: Present player with multiple options
- **Gain_Enemy/Ally/Contact**: Add relationships
- **Injury**: Roll on injury tables
- **Automatic_Promotion**: Immediate rank advancement

### Processing Flow
1. Roll 2d6 on event/mishap tables
2. Look up result in career data
3. Process eventChain array sequentially
4. Handle player choices and conditional outcomes
5. Update character state with all changes

---

## State Flow

- Character state is stored in a context or lifted into `<App />`
- Tabs read from and write to this central state
- State can be exported to JSON or stored in Firebase/localStorage

---

## Save/Load System

Planned save/load functionality includes:

- Export/import to JSON file
- Save to browser localStorage
- Firebase integration for cloud saves (future)
- Optional shareable links

---

## Future Considerations

- Printable character sheet (PDF export)
- Rule variants / house rules toggle
- Support for non-human species or psionics
- Mobile-friendly layout

---

## Contributing

1. Fork and clone this repo
2. `npm install` to get dependencies
3. `npm start` to launch development mode

Contributions, bug reports, and feature suggestions are welcome!