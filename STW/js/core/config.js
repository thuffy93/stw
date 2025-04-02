export const GEM_TYPES = {
  ATTACK_RED: {
    name: "Red Attack",
    icon: "🗡️",
    colors: { red: 5, blue: 3, green: 4 }, // Damage values by class
    staminaCost: 2,
    color: "red"
  },
  ATTACK_BLUE: {
    name: "Blue Attack",
    icon: "❄️",
    colors: { red: 3, blue: 5, green: 3 }, // Damage values by class
    staminaCost: 2,
    color: "blue"
  },
  ATTACK_GREEN: {
    name: "Green Attack",
    icon: "🌀",
    colors: { red: 4, blue: 3, green: 5 }, // Damage values by class
    staminaCost: 1,
    color: "green"
  },
  HEAL: {
    name: "Heal",
    icon: "💚",
    effect: 3, // Healing amount
    staminaCost: 2,
    color: "blue"
  },
  SHIELD: {
    name: "Shield",
    icon: "🛡️",
    defense: 2,       // Damage reduction value
    duration: 3,      // Turns
    staminaCost: 1,
    color: "grey"
  },
  FOCUS: {
    name: "Focus",
    icon: "👁️",
    effect: "Increases critical hit chance",
    staminaCost: 1,
    color: "green"
  }
};

export const ENEMIES = {
  GRUNT: {
      name: "Grunt",
      health: 20,
      maxHealth: 20,
      attack: 5,
      defense: 1
  },
  SLIME: {
      name: "Slime",
      health: 15,
      maxHealth: 15,
      attack: 3,
      defense: 3
  },
  GOBLIN: {
      name: "Goblin",
      health: 25,
      maxHealth: 25,
      attack: 7,
      defense: 0
  }
};

export const GAME_PHASES = {
  DAWN: {
      name: "Dawn",
      background: "#fff0d0",
      enemyMultiplier: 1
  },
  DUSK: {
      name: "Dusk",
      background: "#d0c0ff",
      enemyMultiplier: 1.5
  },
  DARK: {
      name: "Dark",
      background: "#203060",
      enemyMultiplier: 2
  }
};