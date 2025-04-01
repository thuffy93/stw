export const GEM_TYPES = {
    ATTACK: {
      name: "Attack",
      icon: "🗡️",
      colors: { red: 5, blue: 3, green: 4 }, // Damage values
      staminaCost: { red: 2, blue: 2, green: 1 }
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
    }
};
  