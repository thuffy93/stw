// Game configuration constants

// Gem types and properties
export const GEM_TYPES = {
  ATTACK: {
    name: "Attack",
    icon: "🗡️",
    colors: { 
      red: 5,    // Knight damage
      blue: 3,   // Mage damage
      green: 4   // Rogue damage
    },
    staminaCost: { 
      red: 2,    // Knight stamina cost
      blue: 2,   // Mage stamina cost
      green: 1   // Rogue stamina cost
    },
    description: "Deal damage to the enemy",
    color: "red" // Default color
  },
  
  HEAL: {
    name: "Heal",
    icon: "💚",
    effect: 3,       // Healing amount
    staminaCost: 2,
    description: "Restore health points",
    color: "blue"
  },
  
  SHIELD: {
    name: "Shield",
    icon: "🛡️",
    defense: 2,      // Damage reduction
    duration: 3,     // Turns
    staminaCost: 1,
    description: "Reduce incoming damage for several turns",
    color: "grey"
  },
  
  FOCUS: {
    name: "Focus",
    icon: "🔍",
    staminaGain: 2,   // Stamina recovery
    staminaCost: 0,   // Free to use
    description: "Recover stamina, skipping your attack",
    color: "grey" 
  },
  
  POISON: {
    name: "Poison",
    icon: "☠️",
    damage: 1,        // Damage per turn
    duration: 3,      // Turns
    staminaCost: 2,
    description: "Apply poison that damages over time",
    color: "green"
  }
};

// Enemy types
export const ENEMY_TYPES = {
  // Day 1: Ruined Village
  GRUNT: {
    name: "Grunt",
    health: 20,
    maxHealth: 20,
    attack: 5,
    icon: "👹",
    day: 1,
    phase: "Dawn",
    zenny: 10
  },
  
  WOLF: {
    name: "Wolf",
    health: 15,
    maxHealth: 15,
    attack: 7,
    icon: "🐺",
    day: 1,
    phase: "Dusk",
    zenny: 15
  },
  
  VILLAGE_CHIEF: {
    name: "Corrupted Chief",
    health: 30,
    maxHealth: 30,
    attack: 8,
    icon: "👑",
    day: 1,
    phase: "Dark",
    isBoss: true,
    zenny: 50
  }
};

// Phase configuration
export const PHASES = [
  "Dawn",
  "Dusk",
  "Dark"
];

// Game difficulty scaling
export const DIFFICULTY = {
  healthScaling: 1.2,   // Enemy health increase per day
  damageScaling: 1.15,  // Enemy damage increase per day
  zennyScaling: 1.5     // Zenny rewards increase per day
};

// Player progression
export const PROGRESSION = {
  maxGems: 20,         // Maximum gems in bag
  baseStamina: 3,      // Starting stamina
  maxHealth: {
    Knight: 40,
    Mage: 30,
    Rogue: 25
  }
};

// Game text constants
export const TEXT = {
  victoryMessage: "Victory!",
  defeatMessage: "Defeat...",
  dayComplete: "Day Complete!",
  shopPrompt: "Upgrade your gems or restore stamina before continuing"
};