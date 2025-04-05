import { GameState } from '../core/state.js';
import { Utils } from '../core/utils.js';
import { Config } from '../core/config.js';

// Storage module - Handles saving and loading game state
export const Storage = {
    /**
     * Check if localStorage is available
     * @returns {Boolean} Whether localStorage is available
     */
    isStorageAvailable() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn("localStorage not available:", e);
            return false;
        }
    },
    
    /**
     * Save meta zenny to localStorage
     * @returns {Boolean} Success or failure
     */
    saveMetaZenny() {
        if (!this.isStorageAvailable()) return false;
        
        const metaZenny = GameState.get('metaZenny');
        try {
            localStorage.setItem(Config.STORAGE_KEYS.META_ZENNY, metaZenny.toString());
            return true;
        } catch (e) {
            console.error("Error saving meta zenny:", e);
            return false;
        }
    },
    
    /**
     * Load meta zenny from localStorage
     * @returns {Boolean} Success or failure
     */
    loadMetaZenny() {
        if (!this.isStorageAvailable()) return false;
        
        try {
            const savedZenny = localStorage.getItem(Config.STORAGE_KEYS.META_ZENNY);
            const metaZenny = savedZenny ? parseInt(savedZenny) : 0;
            GameState.set('metaZenny', metaZenny);
            return true;
        } catch (e) {
            console.error("Error loading meta zenny:", e);
            return false;
        }
    },
    
    /**
     * Save gem unlocks for the current class
     * @returns {Boolean} Success or failure
     */
    saveGemUnlocks() {
        if (!this.isStorageAvailable()) return false;
        
        const playerClass = GameState.get('player.class');
        
        if (!playerClass) {
            console.warn("No player class set, skipping gem unlock save");
            return false;
        }
        
        try {
            const gemCatalog = GameState.get('classGemCatalogs')[playerClass];
            
            if (!gemCatalog) {
                console.warn(`No gem catalog found for class ${playerClass}`);
                return false;
            }
            
            localStorage.setItem(
                `${Config.STORAGE_KEYS.GEM_UNLOCKS_PREFIX}${playerClass}`,
                JSON.stringify(gemCatalog.unlocked)
            );
            
            return true;
        } catch (e) {
            console.error(`Error saving gem unlocks for ${playerClass}:`, e);
            return false;
        }
    },
    
    /**
     * Load gem unlocks for all classes
     * @returns {Boolean} Success or failure 
     */
    loadGemUnlocks() {
        if (!this.isStorageAvailable()) return false;
        
        try {
            const classes = Object.keys(Config.CLASSES);
            let anyLoaded = false;
            
            classes.forEach(className => {
                const storageKey = `${Config.STORAGE_KEYS.GEM_UNLOCKS_PREFIX}${className}`;
                const savedUnlocks = localStorage.getItem(storageKey);
                
                if (savedUnlocks) {
                    try {
                        const unlocks = JSON.parse(savedUnlocks);
                        
                        // Ensure basic gems are included
                        const basicGems = ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal"];
                        const classGem = {
                            "Knight": "redStrongAttack",
                            "Mage": "blueStrongHeal",
                            "Rogue": "greenQuickAttack"
                        }[className];
                        
                        const allRequiredGems = [...basicGems];
                        if (classGem) allRequiredGems.push(classGem);
                        
                        // Add any missing required gems
                        allRequiredGems.forEach(gemKey => {
                            if (!unlocks.includes(gemKey)) {
                                unlocks.push(gemKey);
                            }
                        });
                        
                        // Update state
                        GameState.set(`classGemCatalogs.${className}.unlocked`, unlocks);
                        anyLoaded = true;
                    } catch (e) {
                        console.error(`Failed to parse gem unlocks for ${className}:`, e);
                    }
                }
            });
            
            return anyLoaded;
        } catch (e) {
            console.error("Error loading gem unlocks:", e);
            return false;
        }
    },
    
    /**
     * Save gem proficiency for the current class
     * @returns {Boolean} Success or failure
     */
    saveGemProficiency() {
        if (!this.isStorageAvailable()) return false;
        
        const playerClass = GameState.get('player.class');
        
        if (!playerClass) {
            console.warn("No player class set, skipping gem proficiency save");
            return false;
        }
        
        try {
            const proficiency = GameState.get('classGemProficiency')[playerClass];
            
            if (!proficiency) {
                console.warn(`No gem proficiency found for class ${playerClass}`);
                return false;
            }
            
            localStorage.setItem(
                `${Config.STORAGE_KEYS.GEM_PROFICIENCY_PREFIX}${playerClass}`,
                JSON.stringify(proficiency)
            );
            
            return true;
        } catch (e) {
            console.error(`Error saving gem proficiency for ${playerClass}:`, e);
            return false;
        }
    },
    
    /**
     * Load gem proficiency for all classes
     * @returns {Boolean} Success or failure
     */
    loadGemProficiency() {
        if (!this.isStorageAvailable()) return false;
        
        try {
            const classes = Object.keys(Config.CLASSES);
            let anyLoaded = false;
            
            classes.forEach(className => {
                const storageKey = `${Config.STORAGE_KEYS.GEM_PROFICIENCY_PREFIX}${className}`;
                const savedProficiency = localStorage.getItem(storageKey);
                
                if (savedProficiency) {
                    try {
                        const proficiency = JSON.parse(savedProficiency);
                        
                        // Ensure basic gems have proficiency
                        const basicGems = ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal"];
                        const classGem = {
                            "Knight": "redStrongAttack",
                            "Mage": "blueStrongHeal",
                            "Rogue": "greenQuickAttack"
                        }[className];
                        
                        const allRequiredGems = [...basicGems];
                        if (classGem) allRequiredGems.push(classGem);
                        
                        // Add proficiency for any missing required gems
                        allRequiredGems.forEach(gemKey => {
                            if (!proficiency[gemKey]) {
                                proficiency[gemKey] = { 
                                    successCount: Config.COMBAT.FULL_PROFICIENCY_THRESHOLD, 
                                    failureChance: 0 
                                };
                            }
                        });
                        
                        // Update state
                        GameState.set(`classGemProficiency.${className}`, proficiency);
                        anyLoaded = true;
                    } catch (e) {
                        console.error(`Failed to parse gem proficiency for ${className}:`, e);
                    }
                }
            });
            
            return anyLoaded;
        } catch (e) {
            console.error("Error loading gem proficiency:", e);
            return false;
        }
    },
    
    /**
     * Save game state to localStorage
     * @returns {Boolean} Success or failure
     */
    saveGameState() {
        if (!this.isStorageAvailable()) return false;
        
        try {
            const saveData = GameState.exportSaveData();
            
            if (!saveData) {
                console.warn("No save data to save");
                return false;
            }
            
            localStorage.setItem(Config.STORAGE_KEYS.GAME_STATE, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error("Failed to save game state:", e);
            return false;
        }
    },
    
    /**
     * Load game state from localStorage
     * @returns {Boolean} Success or failure 
     */
    loadGameState() {
        if (!this.isStorageAvailable()) return false;
        
        try {
            const savedData = localStorage.getItem(Config.STORAGE_KEYS.GAME_STATE);
            if (!savedData) return false;
            
            const saveData = Utils.safeJsonParse(savedData);
            if (!saveData) return false;
            
            // Check if save data is too old (more than 7 days)
            const now = Date.now();
            const saveAge = now - (saveData.timestamp || 0);
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
            
            if (saveAge > maxAge) {
                console.warn("Save data too old - starting new game");
                return false;
            }
            
            // Import save data
            const success = GameState.importSaveData(saveData);
            return success;
        } catch (e) {
            console.error("Failed to load game state:", e);
            return false;
        }
    },
    
    /**
     * Clear all storage
     * @returns {Boolean} Success or failure
     */
    clearAllStorage() {
        if (!this.isStorageAvailable()) return false;
        
        try {
            // Clear specific keys
            const keysToClear = [
                Config.STORAGE_KEYS.GAME_STATE,
                Config.STORAGE_KEYS.META_ZENNY
            ];
            
            // Add class-specific keys
            Object.keys(Config.CLASSES).forEach(className => {
                keysToClear.push(`${Config.STORAGE_KEYS.GEM_UNLOCKS_PREFIX}${className}`);
                keysToClear.push(`${Config.STORAGE_KEYS.GEM_PROFICIENCY_PREFIX}${className}`);
            });
            
            // Clear keys
            keysToClear.forEach(key => localStorage.removeItem(key));
            
            return true;
        } catch (e) {
            console.error("Failed to clear storage:", e);
            return false;
        }
    },
    
    /**
     * Load all saved data
     * @returns {Boolean} Success or failure
     */
    loadAllSavedData() {
        if (!this.isStorageAvailable()) {
            console.warn("Local storage not available, skipping data load");
            return false;
        }
        
        try {
            // Load in sequence to ensure proper dependencies
            this.loadMetaZenny();
            this.loadGemUnlocks();
            this.loadGemProficiency();
            
            // Attempt to load game state last
            const gameStateLoaded = this.loadGameState();
            
            return true;
        } catch (e) {
            console.error("Error loading saved data:", e);
            return false;
        }
    },
    
    /**
     * Reset meta progression
     * @returns {Boolean} Success or failure 
     */
    resetMetaProgression() {
        try {
            // Reset meta zenny
            GameState.set('metaZenny', 0);
            
            // Reset class-specific gem catalogs
            Object.keys(Config.CLASSES).forEach(className => {
                // Get initial unlocks and available gems for this class
                const initialUnlocks = Config.INITIAL_GEM_UNLOCKS[className].unlocked || [];
                const initialAvailable = Config.INITIAL_GEM_UNLOCKS[className].available || [];
                
                // Reset to initial values - create a fresh copy
                GameState.set(`classGemCatalogs.${className}`, {
                    unlocked: [...initialUnlocks],
                    available: [...initialAvailable],
                    maxCapacity: 15,
                    gemPool: [],
                    upgradedThisShop: new Set()
                });
                
                // Reset proficiency to initial values
                GameState.set(`classGemProficiency.${className}`, {
                    ...Config.INITIAL_GEM_PROFICIENCY[className]
                });
            });
            
            // Also reset current gemCatalog if there's an active player class
            const playerClass = GameState.get('player.class');
            if (playerClass) {
                const initialUnlocks = Config.INITIAL_GEM_UNLOCKS[playerClass].unlocked || [];
                const initialAvailable = Config.INITIAL_GEM_UNLOCKS[playerClass].available || [];
                
                GameState.set('gemCatalog', {
                    unlocked: [...initialUnlocks],
                    available: [...initialAvailable],
                    maxCapacity: 15,
                    gemPool: [],
                    upgradedThisShop: new Set()
                });
            }
            
            // Clear localStorage as well to ensure complete reset
            if (this.isStorageAvailable()) {
                Object.keys(Config.CLASSES).forEach(className => {
                    localStorage.removeItem(`${Config.STORAGE_KEYS.GEM_UNLOCKS_PREFIX}${className}`);
                    localStorage.removeItem(`${Config.STORAGE_KEYS.GEM_PROFICIENCY_PREFIX}${className}`);
                });
                
                // Save changes
                localStorage.setItem(Config.STORAGE_KEYS.META_ZENNY, "0");
            }
            
            return true;
        } catch (e) {
            console.error("Failed to reset meta progression:", e);
            return false;
        }
    },
    
    /**
     * Save player's current hand to temporary storage
     * Used when transitioning between screens to preserve hand state
     * @returns {Boolean} Success or failure
     */
    saveHandState() {
        if (!this.isStorageAvailable()) return false;
        
        try {
            const hand = GameState.get('hand');
            if (!hand || !Array.isArray(hand)) {
                console.warn("Invalid hand state, not saving");
                return false;
            }
            
            localStorage.setItem(Config.STORAGE_KEYS.TEMP_HAND, JSON.stringify(hand));
            console.log("Hand state saved successfully", hand.length, "gems");
            
            // Emit hand saved event
            EventBus.emit('HAND_STATE_SAVED', { handSize: hand.length });
            
            return true;
        } catch (e) {
            console.error("Failed to save hand state:", e);
            return false;
        }
    },

    /**
     * Load player's hand from temporary storage
     * Used when transitioning between screens to restore hand state
     * @returns {Boolean} Success or failure
     */
    loadHandState() {
        if (!this.isStorageAvailable()) return false;
        
        try {
            const savedHand = localStorage.getItem(Config.STORAGE_KEYS.TEMP_HAND);
            if (!savedHand) {
                console.log("No saved hand state found");
                return false;
            }
            
            const parsedHand = Utils.safeJsonParse(savedHand);
            if (Array.isArray(parsedHand) && parsedHand.length > 0) {
                GameState.set('hand', parsedHand);
                console.log("Hand state loaded successfully", parsedHand.length, "gems");
                
                // Emit hand loaded event
                EventBus.emit('HAND_STATE_LOADED', { handSize: parsedHand.length });
                EventBus.emit('HAND_UPDATED'); // Trigger hand render update
                
                return true;
            }
            
            console.warn("Saved hand state was invalid", parsedHand);
            return false;
        } catch (e) {
            console.error("Failed to load hand state:", e);
            return false;
        }
    }

};