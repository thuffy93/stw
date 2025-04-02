export const GEM_TYPES = {
    ATTACK: {
      name: "Attack",
      icon: "🗡️",
      description: "Deal damage to enemy",
      colors: { red: 5, blue: 3, green: 4 }, // Damage values by color
      staminaCost: { red: 2, blue: 2, green: 1 }
    },
    HEAL: {
      name: "Heal",
      icon: "💚",
      description: "Restore health",
      effect: 3, // Healing amount
      staminaCost: 2,
      color: "blue"
    },
    SHIELD: {
      name: "Shield",
      icon: "🛡️",
      description: "Block incoming damage",
      defense: 2,  // Damage reduction value
      duration: 3, // Turns
      staminaCost: 1,
      color: "grey"
    },
    POISON: {
      name: "Poison",
      icon: "☠️",
      description: "Deal damage over time",
      effect: 2,    // Damage per turn
      duration: 3,  // Turns
      staminaCost: 2,
      color: "green"
    },
    STUN: {
      name: "Stun",
      icon: "⚡",
      description: "Skip enemy's next turn",
      duration: 1,  // Turns
      staminaCost: 3,
      color: "yellow"
    }
}