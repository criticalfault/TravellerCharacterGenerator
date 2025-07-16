# Traveller Character Generator (Mongoose 2nd Edition)

A web-based character generator for Mongoose 2nd Edition Traveller RPG. This React application guides users through the complete character creation process, following the official rules and mechanics of the game.

## Features

### Core Character Creation
- **Race Selection**: Choose from various races across the Traveller universe with automatic racial modifiers and abilities
- **Attribute Generation**: Randomize character statistics with re-roll capability until satisfied
- **Background Skills**: Select background skills based on Education DM (3 + Education DM skills from a predefined list)
- **Career Progression**: Navigate through multiple career terms with:
  - Qualification rolls for career entry
  - Event processing with complex branching outcomes
  - Survival and advancement checks
  - Skill training and rank progression
  - Mishap handling for failed survival rolls

### Advanced Features
- **Event Chain System**: Complex event processing with multiple outcome paths, player choices, and conditional logic
- **Character Relationships**: Track contacts, allies, enemies, and rivals gained through career events
- **Equipment & Benefits**: Mustering out benefits including gear, money, and cyberware
- **Save/Load System**: Persist characters to local storage with import/export functionality
- **Character Summary**: Complete character sheet with long-term tracking capabilities

### User Interface
- **Tabbed Navigation**: Intuitive step-by-step character creation process
- **Real-time Updates**: Character state updates automatically as you progress
- **Error Handling**: Comprehensive validation and error boundaries
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

This project follows a component-based architecture with:

- **Context Management**: `CharacterContext` for global character state
- **Tabbed Interface**: Separate components for each creation step
- **Utility Functions**: Game mechanics, dice rolling, and validation helpers
- **Data Files**: Career and race definitions in JSON format
- **Comprehensive Testing**: Unit tests for all major components and utilities

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation
1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode. The test suite includes:

- **Component Tests**: Verify UI components render correctly and handle user interactions
- **Utility Tests**: Validate game mechanics, dice rolling, and character generation logic
- **Integration Tests**: Ensure proper data flow between components and context
- **Event Processing Tests**: Verify complex career event chains work correctly

Run tests to ensure all character generation mechanics work correctly.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

Your app is ready to be deployed!

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## How to Use

1. **Start the Application**: Run `npm start` and navigate to `http://localhost:3000`
2. **Race Selection**: Choose your character's race from the available options
3. **Generate Attributes**: Roll for your character's six core attributes (STR, DEX, END, INT, EDU, SOC)
4. **Background Skills**: Select skills based on your Education modifier
5. **Career Selection**: Choose your first career and attempt qualification
6. **Career Terms**: Progress through career terms, handling events and making choices
7. **Mustering Out**: Collect benefits when leaving careers
8. **Save Character**: Use the Save/Load tab to persist your character

## Character Data Structure

Characters are stored with the following key information:
- Basic details (name, age, species)
- Six core attributes with modifiers
- Skills with levels
- Career history with terms and ranks
- Relationships (contacts, allies, enemies, rivals)
- Equipment and cyberware
- Money and benefit rolls
- Injuries and damage tracking

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for:
- Bug fixes
- New features
- Career data updates
- UI improvements
- Test coverage expansion

## Learn More

To learn React, check out the [React documentation](https://reactjs.org/).
