# Requirements Document

## Introduction

This React program will help create unique characters for the Mongoose Traveller 2nd Edition Roleplaying game. It will be accomplished by following the strict rules in the Traveller 2nd Edition character creation rules. First by choosen a race, then randomizing attributes and finally working through each of the characters career choices until the player decides to finish.


## Requirements

### Requirement 1

**User Story:** As a user, I want to generate a character of one of the many races across the universe of Traveller and have it automatically track the racial abilities and statisitics changes.

#### Acceptance Criteria

1. WHEN the user requests a character race THEN the system SHALL apply racial modifiers to statisitics 
2. WHEN the user requests a character name THEN the system SHALL make note of racial abilities in a special place on the character generator.

### Requirement 2

**User Story:** As a user, I want the generated statisitics randomly until I feel I have the score I wish to proceed.

#### Acceptance Criteria

1. WHEN generating a new character and reaching the statisitics page. The user will be able to click a randomize statisitics button THEN the system SHALL randomize the statisitics using legal methods and randominess (to the best of the ability of our software) to be use for the character.
2. WHEN the user feels like they have good statisitics, they will be able to click a finish button which THEN the system SHALL lock in those statisitics and make them only updated by events which occur during the character career path choices and outcomes.

### Requirement 3

** User Story:** As a user, I want to select background skills before starting my first career term. 

#### Acceptance Criteria

1. WHEN proceeding to the background skills selection THEN the system SHALL allow the character to purchase background skills equal to 3 plus or minus Education's DM. These skills shall come from the following list: [Admin, Electronics, Science, Animals, Flyer, Seafarer, Art, Language, Streetwise, Athletics, Mechanic, Survival, Carouse, Medic, Vacc Suit, Drive, Profession]

### Requirement 4

**User Story:** As a user, I want to be able choose careers and follow my character journey through them. Making the choices and recieving both the benefits and downfalls of the career path based on randomize events that occur during the progression of each of those careers.

#### Acceptance Criteria

1. WHEN the user selects their first career term THEN the system SHALL provide that character with the Basic training profession skills of that career. This will be a collection of all Service Skills at level 0.
2. WHEN proceeding to the qualification roll THEN the system SHALL ensure to randomize the results 2d6 of the specific attribute the career term requires. Upon success it will proceed to the event roll. Upon failure it will proceed to the survival roll.
3a. WHEN proceeding to the event roll THEN the system SHALL roll the event and process it.
3b. WHEN proceeding to the survival roll THEN the system SHALL roll survival and process it. 

4a. WHEN proceeding passed the event roll THEN the system SHALL proceed to roll advancement and process it.
4b. WHEN rolling the survival roll THEN the system SHALL determine success or failure. On failure it will it will roll for Mishap. On Success, roll for an event and proceed to 5a.

5a. WHEN proceeding passed the event roll THEN the system SHALL allow the user to decide if they will proceed to the next term or choose another career.