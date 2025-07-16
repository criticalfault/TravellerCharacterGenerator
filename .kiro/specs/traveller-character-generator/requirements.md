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

### Requirement 5

**User Story:** As a user, I want to receive mustering out benefits when I finish my career terms, with appropriate dice modifiers and restrictions on cash benefits.

#### Acceptance Criteria

1. WHEN a player finishes their career terms THEN the system SHALL calculate the number of benefit rolls based on:
   - One benefit roll for each full term spent in the career
   - One additional benefit roll for every 2 ranks gained (rounded up) until Rank 6
2. WHEN a player has reached Rank 5 in a career THEN the system SHALL apply a +1 modifier to any benefit roll performed for that career.

3. WHEN a player has the Gamble skill at level 1 or higher THEN the system SHALL apply a +1 modifier to any Cash Benefit roll made.

4. WHEN a player selects benefit rolls THEN the system SHALL enforce the restriction that cash benefits can only be chosen 3 times maximum, after which all remaining benefits must come from the other benefit chart.

5. WHEN a player receives a "weapon" benefit THEN the system SHALL allow selection of any weapon under 3,000 credits and Tech Level 12 or lower.

6. WHEN processing benefit rolls THEN the system SHALL:

   - Present the player with a choice between Cash Benefits and Other Benefits (unless cash limit reached)
   - Apply appropriate dice modifiers (+1 for Rank 5, +1 for Gamble skill on cash rolls)
   - Roll 2d6 with modifiers and determine the benefit from the appropriate table
   - Track and display all received benefits (cash, weapons, ship shares, equipment, etc.)
   - Maintain a running total of cash benefits selected to enforce the 3-benefit limit

7. WHEN implementing benefit types THEN the system SHALL support the following benefit categories with their specific rules:

   **Equipment Benefits:**

   - **Armour**: Any type up to Cr10,000 and TL12. Second roll allows another armour or upgrade to Cr25,000 limit
   - **Blade**: Any blade weapon up to Cr1,000 and TL12. Second roll grants another blade or +1 Melee (blade) skill
   - **Gun**: Any common/military ranged weapon up to Cr3,000 and TL12. Second roll grants another weapon or +1 Gun Combat skill
   - **Weapon**: Any weapon up to Cr3,000 and TL12. Second roll grants another weapon or +1 appropriate combat skill
   - **Scientific Equipment**: Any piece up to Cr2,000 and TL12. Second roll grants another piece or +1 Electronics/Science skill
   - **Personal Vehicle**: Any unarmed vehicle up to Cr300,000 and TL10. Second roll grants +1 Drive or Flyer skill
   - **Cybernetic Implant**: Any augmentation up to Cr75,000 and TL12. Second roll grants different implant or upgrade existing one

   **Spacecraft Benefits:**

   - **Free Trader**: 25% mortgage paid off, roll 1D for quirks. Additional rolls pay off 25% more mortgage
   - **Lab Ship**: 25% mortgage paid off, roll 1D for quirks. Additional rolls pay off 25% more mortgage
   - **Yacht**: 25% mortgage paid off, roll 1D for quirks. Additional rolls pay off 25% more mortgage
   - **Scout Ship**: Full use but belongs to Scout Service, subject to recall for missions. Re-roll if received again
   - **Ship's Boat**: Small craft up to MCr10 and TL12. Second roll grants +1 Pilot (small craft) or Ship Share instead
   - **Ship Shares**: MCr1 value each, cannot be redeemed for cash, used toward ship purchase

   **Social Benefits:**

   - **Ally**: Gain an Ally relationship
   - **Contact**: Gain a Contact relationship
   - **TAS Membership**: Lifetime Traveller's Aid Society membership with high passage dividends. Second roll grants 2 Ship Shares

   **Character Improvements:**

   - **Characteristic Increases**: Increase specified characteristic up to racial maximum (15 for humans). Excess SOC becomes Ship Shares

### Requirement 6

**User Story:** As a user, I want to spend my earned credits on equipment, weapons, armor, and gear to outfit my character for adventures.

#### Acceptance Criteria

1. WHEN a player has completed mustering out and has credits THEN the system SHALL provide a shopping interface to purchase equipment.

2. WHEN browsing equipment THEN the system SHALL display items organized by category (Weapons, Armor, Equipment, Vehicles, etc.) with:
   - Item name and description
   - Cost in credits
   - Tech Level requirements
   - Relevant game statistics (damage, protection, etc.)

3. WHEN purchasing items THEN the system SHALL:
   - Deduct the cost from the character's available credits
   - Add the item to the character's equipment list
   - Prevent purchases if insufficient credits
   - Track total credits spent

4. WHEN managing equipment THEN the system SHALL allow players to:
   - View their current credit balance
   - See all purchased items in an organized inventory
   - Remove items from inventory (refunding credits)
   - Filter and search available items

5. WHEN displaying items THEN the system SHALL respect Tech Level restrictions based on the campaign setting (default TL12 maximum).
### Re
quirement 7

**User Story:** As a user, I want the option to pursue pre-career education (University or Military Academy) before starting my career terms to gain additional skills and benefits.

#### Acceptance Criteria

1. WHEN a player is in terms 1-3 THEN the system SHALL offer the option to pursue pre-career education instead of starting a career.

2. WHEN selecting pre-career education THEN the system SHALL offer two options:
   - University (EDU 6+ entry, with modifiers for term and SOC)
   - Military Academy (varies by service: Army END 7+, Marines END 8+, Navy INT 8+)

3. WHEN attempting entry to University THEN the system SHALL:
   - Require EDU 6+ roll
   - Apply DM-1 if in Term 2, DM-2 if in Term 3
   - Apply DM+1 if SOC 9 or higher
   - On failure, force immediate career entry or draft

4. WHEN attending University THEN the system SHALL:
   - Allow selection of one level 0 and one level 1 skill from specified list
   - Increase EDU by +1
   - Roll on Pre-career Events table
   - Require INT 6+ graduation roll (10+ for honors)

5. WHEN graduating University THEN the system SHALL grant benefits:
   - Increase both chosen skills by one level
   - Increase EDU by additional +1
   - Grant career entry bonuses to specific careers
   - Allow commission roll for military careers with bonuses

6. WHEN attempting Military Academy THEN the system SHALL:
   - Require service-specific entry rolls with term penalties
   - Grant all Service Skills of chosen military branch at level 0
   - Roll on Pre-career Events table
   - Require INT 7+ graduation roll (11+ for honors) with END/SOC bonuses

7. WHEN graduating Military Academy THEN the system SHALL grant benefits:
   - Select any three Service Skills and increase to level 1
   - Increase EDU by +1 (and SOC by +1 if honors)
   - Grant automatic entry to associated military career
   - Allow commission roll with bonuses or automatic commission if honors

8. WHEN processing Pre-career Events THEN the system SHALL handle all event outcomes including:
   - Skill gains, allies, enemies, rivals
   - Potential graduation failure
   - Draft possibilities
   - Life events and special circumstances#
## Requirement 8

**User Story:** As a user, I want a comprehensive character sheet that displays all my character information and allows me to manage my character during play.

#### Acceptance Criteria

1. WHEN viewing the character sheet THEN the system SHALL display:
   - Character name, age, species, and basic information
   - All six characteristics with current and maximum values
   - Complete skills list with levels and modifiers
   - Equipment inventory organized by category
   - Species bonuses and special abilities

2. WHEN hovering over equipment THEN the system SHALL display:
   - Item descriptions and special properties
   - Weapon statistics (damage, range, traits)
   - Armor protection values and special effects
   - Equipment tech levels and costs

3. WHEN managing damage THEN the system SHALL allow:
   - Applying damage to reduce characteristics temporarily
   - Tracking current vs maximum characteristic values
   - Visual indicators for damaged characteristics
   - Damage recovery/healing functionality

4. WHEN loading characters THEN the system SHALL:
   - Provide character save/load functionality
   - Display character creation summary
   - Allow importing previously created characters
   - Maintain all character data integrity

5. WHEN displaying the character sheet THEN the system SHALL:
   - Use a clean, readable layout suitable for gameplay
   - Organize information logically for quick reference
   - Provide print-friendly formatting options
   - Show calculated values (DMs, totals, etc.)