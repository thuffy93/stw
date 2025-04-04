// Core game configuration constants
export const Config = {
  // Game constraints
  MAX_HAND_SIZE: 3,
  MAX_GEM_BAG_SIZE: 20,
  MAX_DAYS: 7,
  BATTLES_PER_DAY: 3,
  PHASES: ["Dawn", "Dusk", "Dark"],
  COMBAT: {
      FULL_PROFICIENCY_THRESHOLD: 6,
      STAMINA_RECOVERY_AMOUNT: 2,
      STAMINA_RECOVERY_PERCENT: 0.75,
      CRITICAL_CHANCE: 0.15,
      CRITICAL_MULTIPLIER: 1.5
  },
  
  // Class definitions
  CLASSES: {
      Knight: {
          color: "red",
          maxHealth: 40,
          baseStamina: 3
      },
      Mage: {
          color: "blue",
          maxHealth: 30,
          baseStamina: 4
      },
      Rogue: {
          color: "green",
          maxHealth: 35,
          baseStamina: 3,
          startingZenny: 5
      }
  },
  
  // Enemy definitions
  ENEMIES: [
      { 
          name: "Grunt", 
          maxHealth: 20, 
          actions: ["Attack 5", "Defend", "Attack 3"] 
      },
      { 
          name: "Bandit", 
          maxHealth: 15, 
          actions: ["Attack 7", "Steal 3", "Defend"] 
      },
      { 
          name: "Wolf", 
          maxHealth: 25, 
          actions: ["Attack 4", "Charge", "Attack 6"] 
      }
  ],
  
  // Boss definition
  BOSS: { 
      name: "Dark Guardian", 
      maxHealth: 30, 
      actions: ["Attack 6", "Charge", "Defend"],
      shield: true, 
      shieldColor: "red" 
  },
  
  // Gem type definitions
  GEM_DEFINITIONS: {
      // Attack gems
      attack: {
          icon: "🗡️",        // For battle/shop
          label: "Attack",    // For catalog
          property: "damage"  // Property to check for this type
      },
      strongAttack: {
          icon: "⚔️",
          label: "Strong",
          property: "damage",
          nameCheck: "Strong"
      },
      quickAttack: {
          icon: "⚡",
          label: "Quick",
          property: "damage",
          nameCheck: "Quick"
      },
      burstAttack: {
          icon: "💥",
          label: "Burst",
          property: "damage",
          nameCheck: "Burst"
      },
      
      // Healing gems
      heal: {
          icon: "💚",
          label: "Heal",
          property: "heal"
      },
      strongHeal: {
          icon: "❤️",
          label: "Strong Heal",
          property: "heal",
          nameCheck: "Strong"
      },
      
      // Special types
      shield: {
          icon: "🛡️",
          label: "Shield",
          property: "shield"
      },
      poison: {
          icon: "☠️",
          label: "Poison",
          property: "poison"
      }
  },

  // Base gem definitions
  BASE_GEMS: {
      redAttack: { name: "Attack", color: "red", cost: 2, damage: 5, upgradeCount: 0, rarity: "Common" },
      redBurst: { name: "Burst", color: "red", cost: 3, damage: 10, upgradeCount: 0, rarity: "Rare" },
      redStrongAttack: { name: "Strong Attack", color: "red", cost: 3, damage: 8, upgradeCount: 0, rarity: "Uncommon" },
      blueMagicAttack: { name: "Magic Attack", color: "blue", cost: 2, damage: 7, upgradeCount: 0, rarity: "Common" },
      blueShield: { name: "Shield", color: "blue", cost: 2, heal: 3, upgradeCount: 0, rarity: "Rare", shield: true },
      blueStrongHeal: { name: "Strong Heal", color: "blue", cost: 3, heal: 8, upgradeCount: 0, rarity: "Uncommon" },
      greenAttack: { name: "Attack", color: "green", cost: 1, damage: 5, upgradeCount: 0, rarity: "Common" },
      greenPoison: { name: "Poison", color: "green", cost: 2, damage: 3, upgradeCount: 0, rarity: "Rare", poison: 2 },
      greenQuickAttack: { name: "Quick Attack", color: "green", cost: 1, damage: 3, upgradeCount: 0, rarity: "Uncommon" },
      greyHeal: { name: "Heal", color: "grey", cost: 1, heal: 5, upgradeCount: 0, rarity: "Common" }
  },
  
  // Standard starting gems for each class
  STARTING_GEMS: {
      Knight: ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal", "redStrongAttack"],
      Mage: ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal", "blueStrongHeal"],
      Rogue: ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal", "greenQuickAttack"]
  },
  
  // Initial gem unlocks for each class
  INITIAL_GEM_UNLOCKS: {
      Knight: {
          unlocked: ["redAttack", "greyHeal", "redStrongAttack", "blueMagicAttack", "greenAttack"],
          available: ["redBurst"]
      },
      Mage: {
          unlocked: ["blueMagicAttack", "greyHeal", "blueStrongHeal", "redAttack", "greenAttack"],
          available: ["blueShield"]
      },
      Rogue: {
          unlocked: ["greenAttack", "greyHeal", "greenQuickAttack", "redAttack", "blueMagicAttack"],
          available: ["greenPoison"]
      }
  },

  // Initial gem proficiency for each class
  INITIAL_GEM_PROFICIENCY: {
      Knight: {
          redAttack: { successCount: 6, failureChance: 0 },
          blueMagicAttack: { successCount: 6, failureChance: 0 },
          greenAttack: { successCount: 6, failureChance: 0 },
          greyHeal: { successCount: 6, failureChance: 0 },
          redStrongAttack: { successCount: 6, failureChance: 0 }
      },
      Mage: {
          redAttack: { successCount: 6, failureChance: 0 },
          blueMagicAttack: { successCount: 6, failureChance: 0 },
          greenAttack: { successCount: 6, failureChance: 0 },
          greyHeal: { successCount: 6, failureChance: 0 },
          blueStrongHeal: { successCount: 6, failureChance: 0 }
      },
      Rogue: {
          redAttack: { successCount: 6, failureChance: 0 },
          blueMagicAttack: { successCount: 6, failureChance: 0 },
          greenAttack: { successCount: 6, failureChance: 0 },
          greyHeal: { successCount: 6, failureChance: 0 },
          greenQuickAttack: { successCount: 6, failureChance: 0 }
      }
  },
  
  // Storage keys for persistent data
  STORAGE_KEYS: {
      META_ZENNY: "stw_metaZenny",
      GEM_UNLOCKS_PREFIX: "stw_gemUnlocks_",
      GEM_PROFICIENCY_PREFIX: "stw_gemProficiency_",
      GAME_STATE: "stw_gameState",
      AUDIO_ENABLED: "stw_audioEnabled",
      AUDIO_VOLUME: "stw_audioVolume",
      TEMP_HAND: "stw_temp_hand"
  },
};

export default Config;