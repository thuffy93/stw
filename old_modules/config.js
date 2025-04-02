            // ===================================================
            // CONFIG MODULE - Game constants and configuration
            // ===================================================//
            const Config = {
                MAX_HAND_SIZE: 3,
                MAX_GEM_BAG_SIZE: 20,
                MAX_DAYS: 7,
                BATTLES_PER_DAY: 3,
                PHASES: ["Dawn", "Dusk", "Dark"],
                
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
                
                BOSS: { 
                    name: "Dark Guardian", 
                    maxHealth: 30, 
                    actions: ["Attack 6", "Charge", "Defend"],
                    shield: true, 
                    shieldColor: "red" 
                },
                
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
                
                // Check this part of your Config object to ensure it looks like this:
                INITIAL_GEM_UNLOCKS: {
                    Knight: {
                        unlocked: ["redAttack", "greyHeal", "redStrongAttack", "blueMagicAttack", "greenAttack"],
                        available: ["redBurst"] // Make sure this isn't empty
                    },
                    Mage: {
                        unlocked: ["blueMagicAttack", "greyHeal", "blueStrongHeal", "redAttack", "greenAttack"],
                        available: ["blueShield"] // Make sure this isn't empty
                    },
                    Rogue: {
                        unlocked: ["greenAttack", "greyHeal", "greenQuickAttack", "redAttack", "blueMagicAttack"],
                        available: ["greenPoison"] // Make sure this isn't empty
                    }
                }, // <- Add the comma here!

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
                
                STORAGE_KEYS: {
                    META_ZENNY: "stw_metaZenny",
                    GEM_UNLOCKS_PREFIX: "stw_gemUnlocks_",
                    GEM_PROFICIENCY_PREFIX: "stw_gemProficiency_",
                    GAME_STATE: "stw_gameState",
                    AUDIO_ENABLED: "stw_audioEnabled",
                    AUDIO_VOLUME: "stw_audioVolume"
                },
                
                SOUNDS: {
                    BUTTON_CLICK: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAFhpbmcAAAAPAAAAAwAABBgAyMjIyMjIyMjIyMjIyMjI9/f39/f39/f39/f39/f///////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAABBjHvJZJAAAAAAAAAAAAAAAAAAAA//MkwAADkAGlIAAgAAjMGFMAAAjGMYxjGMYxjGMY/gA+AcA4BwA/8uAeBGMYx/GVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVf/zJMAAA8ABpKAAAjAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
                    GEM_PLAY: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAFhpbmcAAAAPAAAAAwAABBgAk5OTk5OTk5OTk5OTk5OTwcHBwcHBwcHBwcHBwcHB7u7u7u7u7u7u7u7u7u7u///////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAABBhyAZMvAAAAAAAAAAAAAAAAAAAA//MUwAADOAF9IAAhAAiIQMQAhAASIdA4Jge//MUwAQDiAF5GAAhAAhS8MgOw0BAA//MUwAkDuAGE+AAhAAkikHgJg5EEA//MUwAsEGAGM+ACQAAAA0gAAAAAA",
                    ENEMY_DAMAGE: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAFhpbmcAAAAPAAAAAgAACqQAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//MkwAAIsAGy8AAgAkHCwYLBgsGC0W9QtCBaECwgLQgWhAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE//MkwAUB8AFXMAAgAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB",
                    PLAYER_DAMAGE: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAFhpbmcAAAAPAAAAAgAACqQAxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//MkwAAH8AGXEAEgApWFgwWDBYMFot6haEC0IFhAWhAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE//MkwAcCGAF2mAEgAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB",
                    HEAL: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAFhpbmcAAAAPAAAAAwAABBgAm5ubm5ubm5ubm5ubm5vDw8PDw8PDw8PDw8PDw93d3d3d3d3d3d3d3d3d3f///////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAABBjsFFLIAAAAAAAAAAAAAAAAAAAA//MUwAADdAF3KAAhcgkgaZI5C1BxVQ==",
                    VICTORY: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAFhpbmcAAAAPAAAABQAABDkAICAgICAgICAgQEBAQEBAQEBgYGBgYGBgYGBwcHBwcHBwcHCAgICAgICAgICQkJCQkJCQkJCgoKCgoKCgoKCwsLCwsLCwsLDAwMDAwMDAwMDQ0NDQ0NDQ0NAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/zJMAAA8ABpKAAAjAAA0gAAABExTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//MkwAAIMARZKADGPYRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
                    DEFEAT: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAFhpbmcAAAAPAAAAAwAABBgA4ODg4ODg4ODg4ODg4ODw8PDw8PDw8PDw8PDw8PD///////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAAAAAAAAAAAAAP/zJMAAA9ABpKAAAjAAA0gAAABExTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//MkwG4HAAFpAAAAACAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"
                }
            };