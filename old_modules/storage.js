            // ===================================================
            // STORAGE MODULE - Persistent data storage
            // ===================================================
            const Storage = (() => {
                /**
                 * Check if localStorage is available
                 * @returns {Boolean} Whether localStorage is available
                 */
                function isStorageAvailable() {
                    try {
                        const test = 'test';
                        localStorage.setItem(test, test);
                        localStorage.removeItem(test);
                        return true;
                    } catch (e) {
                        console.warn("localStorage not available:", e);
                        return false;
                    }
                }
                
                /**
                 * Save meta zenny to localStorage
                 */
                function saveMetaZenny() {
                    if (!isStorageAvailable()) return false;
                    
                    const metaZenny = State.get('metaZenny');
                    try {
                        localStorage.setItem(Config.STORAGE_KEYS.META_ZENNY, metaZenny.toString());
                        return true;
                    } catch (e) {
                        console.error("Error saving meta zenny:", e);
                        return false;
                    }
                }
                
                /**
                 * Load meta zenny from localStorage
                 */
                function loadMetaZenny() {
                    if (!isStorageAvailable()) return false;
                    
                    try {
                        const savedZenny = localStorage.getItem(Config.STORAGE_KEYS.META_ZENNY);
                        const metaZenny = savedZenny ? parseInt(savedZenny) : 0;
                        State.set('metaZenny', metaZenny);
                        return true;
                    } catch (e) {
                        console.error("Error loading meta zenny:", e);
                        return false;
                    }
                }
                
                /**
                 * Save gem unlocks for the current class
                 */
                function saveGemUnlocks() {
                    if (!isStorageAvailable()) return false;
                    
                    const playerClass = State.get('player.class');
                    
                    if (!playerClass) {
                        console.warn("No player class set, skipping gem unlock save");
                        return false;
                    }
                    
                    try {
                        const gemCatalog = State.get('classGemCatalogs')[playerClass];
                        
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
                }
                
                /**
                 * Load gem unlocks for all classes
                 */
                function loadGemUnlocks() {
                    if (!isStorageAvailable()) return false;
                    
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
                                    State.set(`classGemCatalogs.${className}.unlocked`, unlocks);
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
                }
                
                /**
                 * Save gem proficiency for the current class
                 */
                function saveGemProficiency() {
                    if (!isStorageAvailable()) return false;
                    
                    const playerClass = State.get('player.class');
                    
                    if (!playerClass) {
                        console.warn("No player class set, skipping gem proficiency save");
                        return false;
                    }
                    
                    try {
                        const proficiency = State.get('classGemProficiency')[playerClass];
                        
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
                }
                
                /**
                 * Load gem proficiency for all classes
                 */
                function loadGemProficiency() {
                    if (!isStorageAvailable()) return false;
                    
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
                                            proficiency[gemKey] = { successCount: 6, failureChance: 0 };
                                        }
                                    });
                                    
                                    // Update state
                                    State.set(`classGemProficiency.${className}`, proficiency);
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
                }
                
                /**
                 * Save game state to localStorage
                 */
                function saveGameState() {
                    if (!isStorageAvailable()) return false;
                    
                    try {
                        const saveData = State.exportSaveData();
                        
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
                }
                
                /**
                 * Load game state from localStorage
                 * @returns {Boolean} Whether loading was successful
                 */
                function loadGameState() {
                    if (!isStorageAvailable()) return false;
                    
                    try {
                        const savedData = localStorage.getItem(Config.STORAGE_KEYS.GAME_STATE);
                        if (!savedData) return false;
                        
                        const saveData = JSON.parse(savedData);
                        
                        // Check if save data is too old (more than 7 days)
                        const now = Date.now();
                        const saveAge = now - (saveData.timestamp || 0);
                        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
                        
                        if (saveAge > maxAge) {
                            UI.showMessage("Save data too old - starting new game", "error");
                            return false;
                        }
                        
                        // Import save data
                        const success = State.importSaveData(saveData);
                        
                        if (success) {
                            UI.showMessage("Game progress loaded!");
                            return true;
                        }
                        
                        return false;
                    } catch (e) {
                        console.error("Failed to load game state:", e);
                        UI.showMessage("Failed to load saved game", "error");
                        return false;
                    }
                }
                
                /**
                 * Clear all storage
                 */
                function clearAllStorage() {
                    if (!isStorageAvailable()) return false;
                    
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
                }
                
                /**
                 * Load all saved data
                 */
                function loadAllSavedData() {
                    if (!isStorageAvailable()) {
                        console.warn("Local storage not available, skipping data load");
                        return false;
                    }
                    
                    try {
                        // Load in sequence to ensure proper dependencies
                        loadMetaZenny();
                        loadGemUnlocks();
                        loadGemProficiency();
                        
                        // Attempt to load game state last
                        const gameStateLoaded = loadGameState();
                        
                        return true;
                    } catch (e) {
                        console.error("Error loading saved data:", e);
                        return false;
                    }
                }
                
                /**
                 * Reset meta progression
                 */
                function resetMetaProgression() {
                    // Reset meta zenny
                    State.set('metaZenny', 0);
                    
                    // Reset class-specific gem catalogs
                    Object.keys(Config.CLASSES).forEach(className => {
                        // Get initial unlocks and available gems for this class
                        const initialUnlocks = Config.INITIAL_GEM_UNLOCKS[className].unlocked || [];
                        const initialAvailable = Config.INITIAL_GEM_UNLOCKS[className].available || [];
                        
                        // Reset to initial values - create a fresh copy
                        State.set(`classGemCatalogs.${className}`, {
                            unlocked: [...initialUnlocks],
                            available: [...initialAvailable],
                            maxCapacity: 15,
                            gemPool: [],
                            upgradedThisShop: new Set()
                        });
                        
                        // Reset proficiency to initial values
                        State.set(`classGemProficiency.${className}`, {
                            ...Config.INITIAL_GEM_PROFICIENCY[className]
                        });
                    });
                    
                    // Also reset current gemCatalog if there's an active player class
                    const playerClass = State.get('player.class');
                    if (playerClass) {
                        const initialUnlocks = Config.INITIAL_GEM_UNLOCKS[playerClass].unlocked || [];
                        const initialAvailable = Config.INITIAL_GEM_UNLOCKS[playerClass].available || [];
                        
                        State.set('gemCatalog', {
                            unlocked: [...initialUnlocks],
                            available: [...initialAvailable],
                            maxCapacity: 15,
                            gemPool: [],
                            upgradedThisShop: new Set()
                        });
                    }
                    
                    // Clear localStorage as well to ensure complete reset
                    Object.keys(Config.CLASSES).forEach(className => {
                        localStorage.removeItem(`${Config.STORAGE_KEYS.GEM_UNLOCKS_PREFIX}${className}`);
                        localStorage.removeItem(`${Config.STORAGE_KEYS.GEM_PROFICIENCY_PREFIX}${className}`);
                    });
                    
                    // Save changes
                    localStorage.setItem(Config.STORAGE_KEYS.META_ZENNY, "0");
                    
                    // If we have a UI module, update screens
                    if (UI && typeof UI.updateGemCatalogScreen === 'function') {
                        UI.updateGemCatalogScreen();
                    }
                    
                    UI.showMessage("Meta-progression reset!");
                    return true;
                }
                
                /**
                 * Save player's current hand to temporary storage
                 * Used when transitioning between screens to preserve hand state
                 */
                function saveHandState() {
                    if (!isStorageAvailable()) return false;
                    
                    try {
                        const hand = State.get('hand');
                        if (!hand || !Array.isArray(hand)) {
                            console.warn("Invalid hand state, not saving");
                            return false;
                        }
                        
                        localStorage.setItem('stw_temp_hand', JSON.stringify(hand));
                        console.log("Hand state saved successfully", hand.length, "gems");
                        return true;
                    } catch (e) {
                        console.error("Failed to save hand state:", e);
                        return false;
                    }
                }
                
                /**
                 * Load player's hand from temporary storage
                 * Used when transitioning between screens to restore hand state
                 */
                function loadHandState() {
                    if (!isStorageAvailable()) return false;
                    
                    try {
                        const savedHand = localStorage.getItem('stw_temp_hand');
                        if (!savedHand) {
                            console.log("No saved hand state found");
                            return false;
                        }
                        
                        const parsedHand = JSON.parse(savedHand);
                        if (Array.isArray(parsedHand) && parsedHand.length > 0) {
                            State.set('hand', parsedHand);
                            console.log("Hand state loaded successfully", parsedHand.length, "gems");
                            return true;
                        }
                        
                        console.warn("Saved hand state was invalid", parsedHand);
                        return false;
                    } catch (e) {
                        console.error("Failed to load hand state:", e);
                        return false;
                    }
                }
                
                /**
                 * Create a backup of the current game state
                 * Useful for debugging and recovery
                 */
                function createBackup(label = 'backup') {
                    if (!isStorageAvailable()) return false;
                    
                    try {
                        // Get all relevant game state
                        const backup = {
                            player: State.get('player'),
                            hand: State.get('hand'),
                            gemBag: State.get('gemBag'),
                            discard: State.get('discard'),
                            gemCatalog: State.get('gemCatalog'),
                            currentScreen: State.get('currentScreen'),
                            currentDay: State.get('currentDay'),
                            currentPhaseIndex: State.get('currentPhaseIndex'),
                            battleCount: State.get('battleCount'),
                            metaZenny: State.get('metaZenny'),
                            timestamp: Date.now()
                        };
                        
                        // Save to localStorage with timestamp
                        const backupKey = `stw_backup_${label}_${Date.now()}`;
                        localStorage.setItem(backupKey, JSON.stringify(backup));
                        
                        console.log(`Game state backup created: ${backupKey}`);
                        return backupKey;
                    } catch (e) {
                        console.error("Failed to create backup:", e);
                        return false;
                    }
                }
                
                /**
                 * Restore from a backup
                 * @param {String} backupKey - Key of the backup to restore
                 */
                function restoreBackup(backupKey) {
                    if (!isStorageAvailable()) return false;
                    
                    try {
                        // Get the backup data
                        const backupData = localStorage.getItem(backupKey);
                        if (!backupData) {
                            console.error(`Backup ${backupKey} not found`);
                            return false;
                        }
                        
                        const backup = JSON.parse(backupData);
                        
                        // Restore all state properties
                        if (backup.player) State.set('player', backup.player);
                        if (backup.hand) State.set('hand', backup.hand);
                        if (backup.gemBag) State.set('gemBag', backup.gemBag);
                        if (backup.discard) State.set('discard', backup.discard);
                        if (backup.gemCatalog) State.set('gemCatalog', backup.gemCatalog);
                        if (backup.currentScreen) State.set('currentScreen', backup.currentScreen);
                        if (backup.currentDay) State.set('currentDay', backup.currentDay);
                        if (backup.currentPhaseIndex) State.set('currentPhaseIndex', backup.currentPhaseIndex);
                        if (backup.battleCount) State.set('battleCount', backup.battleCount);
                        if (backup.metaZenny) State.set('metaZenny', backup.metaZenny);
                        
                        console.log(`Restored game state from backup: ${backupKey}`);
                        
                        // Update UI for the current screen
                        if (UI) {
                            if (backup.currentScreen === 'battle' && UI.updateBattleScreen) {
                                UI.updateBattleScreen();
                            } else if (backup.currentScreen === 'shop' && UI.updateShopScreen) {
                                UI.updateShopScreen();
                            } else if (backup.currentScreen === 'gemCatalog' && UI.updateGemCatalogScreen) {
                                UI.updateGemCatalogScreen();
                            } else if (backup.currentScreen === 'camp' && UI.updateCampScreen) {
                                UI.updateCampScreen();
                            }
                            
                            // Switch to the restored screen
                            if (UI.switchScreen) {
                                UI.switchScreen(backup.currentScreen);
                            }
                        }
                        
                        return true;
                    } catch (e) {
                        console.error("Failed to restore backup:", e);
                        return false;
                    }
                }
                
                /**
                 * List all available backups
                 * @returns {Array} Array of backup keys
                 */
                function listBackups() {
                    if (!isStorageAvailable()) return [];
                    
                    try {
                        const backups = [];
                        
                        // Scan through localStorage for backup keys
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && key.startsWith('stw_backup_')) {
                                backups.push(key);
                            }
                        }
                        
                        return backups;
                    } catch (e) {
                        console.error("Failed to list backups:", e);
                        return [];
                    }
                }
                
                // Return public methods
                return {
                    saveMetaZenny,
                    loadMetaZenny,
                    saveGemUnlocks,
                    loadGemUnlocks,
                    saveGemProficiency,
                    loadGemProficiency,
                    saveGameState,
                    loadGameState,
                    clearAllStorage,
                    loadAllSavedData,
                    resetMetaProgression,
                    saveHandState,
                    loadHandState,
                    createBackup,
                    restoreBackup,
                    listBackups,
                    isStorageAvailable
                };
            })();