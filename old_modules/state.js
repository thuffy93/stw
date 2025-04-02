            // ===================================================
            // STATE MODULE - Core game state management
            // ===================================================
            const State = (() => {
                // Private internal state
                const state = {
                    // Game progression
                    currentScreen: "character-select",
                    currentDay: 1,
                    currentPhaseIndex: 0,
                    battleCount: 0,
                    metaZenny: 0,
                    
                    // Battle state
                    battleOver: false,
                    selectedGems: new Set(),
                    selectedPoolGem: null,
                    hasActedThisTurn: false,
                    hasPlayedGemThisTurn: false,
                    isEnemyTurnPending: false,
                    
                    // Shop state
                    inUpgradeMode: false,
                    
                    // Player stats
                    player: { 
                        class: null, 
                        maxHealth: 35, 
                        health: 35, 
                        stamina: 3, 
                        baseStamina: 3, 
                        zenny: 0,
                        buffs: []
                    },
                    
                    // Gem mechanics
                    hand: [],
                    discard: [],
                    gemBag: [],
                    
                    // Enemy data
                    enemy: null,
                    
                    // Active gem catalog and proficiency
                    gemCatalog: {
                        unlocked: [],
                        available: [],
                        maxCapacity: 15,
                        gemPool: [],
                        upgradedThisShop: new Set()
                    },
                    
                    // Store class-specific catalogs
                    classGemCatalogs: {
                        Knight: {
                            unlocked: [...Config.INITIAL_GEM_UNLOCKS.Knight.unlocked],
                            available: [...Config.INITIAL_GEM_UNLOCKS.Knight.available],
                            maxCapacity: 15,
                            gemPool: [],
                            upgradedThisShop: new Set()
                        },
                        Mage: {
                            unlocked: [...Config.INITIAL_GEM_UNLOCKS.Mage.unlocked],
                            available: [...Config.INITIAL_GEM_UNLOCKS.Mage.available],
                            maxCapacity: 15,
                            gemPool: [],
                            upgradedThisShop: new Set()
                        },
                        Rogue: {
                            unlocked: [...Config.INITIAL_GEM_UNLOCKS.Rogue.unlocked],
                            available: [...Config.INITIAL_GEM_UNLOCKS.Rogue.available],
                            maxCapacity: 15,
                            gemPool: [],
                            upgradedThisShop: new Set()
                        }
                    },
                    
                    // Store class-specific gem proficiency
                    gemProficiency: {},
                    
                    classGemProficiency: {
                        Knight: {...Config.INITIAL_GEM_PROFICIENCY.Knight},
                        Mage: {...Config.INITIAL_GEM_PROFICIENCY.Mage},
                        Rogue: {...Config.INITIAL_GEM_PROFICIENCY.Rogue}
                    },
                    
                    // State change listeners
                    _listeners: {}
                };
                
                // Keep a change history for debugging
                const stateChangeHistory = [];
                const MAX_HISTORY_ENTRIES = 100;
                
                /**
                 * State change listener function
                 * @callback stateChangeListener
                 * @param {String} property - Property that changed
                 * @param {*} newValue - New value
                 * @param {*} oldValue - Old value
                 */
                
                /**
                 * Add a state change listener
                 * @param {String} property - Property to listen for changes
                 * @param {stateChangeListener} listener - Function to call on change
                 * @returns {Function} Function to remove the listener
                 */
                function addListener(property, listener) {
                    if (!state._listeners[property]) {
                        state._listeners[property] = [];
                    }
                    
                    state._listeners[property].push(listener);
                    
                    // Return function to remove listener
                    return () => {
                        if (state._listeners[property]) {
                            state._listeners[property] = state._listeners[property].filter(l => l !== listener);
                        }
                    };
                }
                
                /**
                 * Notify listeners of state change
                 * @param {String} property - Property that changed
                 * @param {*} newValue - New value
                 * @param {*} oldValue - Old value
                 */
                function notifyListeners(property, newValue, oldValue) {
                    // Notify direct property listeners
                    if (state._listeners[property]) {
                        state._listeners[property].forEach(listener => {
                            try {
                                listener(property, newValue, oldValue);
                            } catch (error) {
                                console.error(`Error in state change listener for ${property}:`, error);
                            }
                        });
                    }
                    
                    // Notify wildcard listeners
                    if (state._listeners['*']) {
                        state._listeners['*'].forEach(listener => {
                            try {
                                listener(property, newValue, oldValue);
                            } catch (error) {
                                console.error(`Error in wildcard state change listener:`, error);
                            }
                        });
                    }
                }
                
                /**
                 * Track state change in history
                 * @param {String} property - Property that changed
                 * @param {*} newValue - New value
                 * @param {*} oldValue - Old value
                 */
                function trackStateChange(property, newValue, oldValue) {
                    stateChangeHistory.push({
                        timestamp: new Date(),
                        property,
                        newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : newValue,
                        oldValue: typeof oldValue === 'object' ? JSON.stringify(oldValue) : oldValue
                    });
                    
                    // Limit history size
                    if (stateChangeHistory.length > MAX_HISTORY_ENTRIES) {
                        stateChangeHistory.shift();
                    }
                }
                
                /**
                 * Get a value from state by property path
                 * @param {String} property - Property path (e.g. 'player.health')
                 * @returns {*} Property value
                 */
                function get(property) {
                    if (!property) return undefined;
                    
                    if (property.includes('.')) {
                        const parts = property.split('.');
                        let current = state;
                        for (const part of parts) {
                            if (current === undefined) return undefined;
                            current = current[part];
                        }
                        return current;
                    }
                    return state[property];
                }
                
                /**
                 * Set a value in state by property path
                 * @param {String|Object} property - Property path or object with multiple properties
                 * @param {*} value - Value to set (ignored if property is an object)
                 * @returns {Boolean} Whether the operation was successful
                 */
                function set(property, value) {
                    // Handle bulk updates
                    if (typeof property === 'object' && property !== null) {
                        let success = true;
                        
                        Object.entries(property).forEach(([key, val]) => {
                            if (!set(key, val)) {
                                success = false;
                            }
                        });
                        
                        return success;
                    }
                    
                    try {
                        // Handle property path
                        if (property.includes('.')) {
                            const parts = property.split('.');
                            let current = state;
                            
                            // Navigate to the parent object
                            for (let i = 0; i < parts.length - 1; i++) {
                                if (current[parts[i]] === undefined) {
                                    current[parts[i]] = {};
                                }
                                current = current[parts[i]];
                            }
                            
                            // Store the old value for notification
                            const oldValue = current[parts[parts.length - 1]];
                            
                            // Set the value on the parent object
                            current[parts[parts.length - 1]] = value;
                            
                            // Track and notify
                            trackStateChange(property, value, oldValue);
                            notifyListeners(property, value, oldValue);
                            
                            return true;
                        }
                        
                        // Simple property
                        const oldValue = state[property];
                        state[property] = value;
                        
                        // Track and notify
                        trackStateChange(property, value, oldValue);
                        notifyListeners(property, value, oldValue);
                        
                        return true;
                        
                    } catch (error) {
                        console.error(`Error setting state property ${property}:`, error);
                        return false;
                    }
                }
                
                /**
                 * Update a value in state by applying a function to the current value
                 * @param {String} property - Property path
                 * @param {Function} updateFn - Function to update value
                 * @returns {Boolean} Whether the operation was successful
                 */
                function update(property, updateFn) {
                    try {
                        const currentValue = get(property);
                        const newValue = updateFn(currentValue);
                        return set(property, newValue);
                    } catch (error) {
                        console.error(`Error updating state property ${property}:`, error);
                        return false;
                    }
                }
                
                /**
                 * Validate state against expected structure
                 * @returns {Object} Validation results
                 */
                function validateState() {
                    const issues = [];
                    
                    // Check critical fields
                    if (!state.player) {
                        issues.push('Missing player object');
                    } else {
                        // Check player fields
                        if (state.player.health === undefined) {
                            issues.push('Missing player.health');
                        }
                        if (state.player.maxHealth === undefined) {
                            issues.push('Missing player.maxHealth');
                        }
                        if (state.player.stamina === undefined) {
                            issues.push('Missing player.stamina');
                        }
                    }
                    
                    // Check gem collections
                    if (!Array.isArray(state.hand)) {
                        issues.push('Hand is not an array');
                    }
                    if (!Array.isArray(state.gemBag)) {
                        issues.push('GemBag is not an array');
                    }
                    if (!Array.isArray(state.discard)) {
                        issues.push('Discard is not an array');
                    }
                    
                    // Check class-specific data
                    if (state.player?.class) {
                        const classData = state.classGemCatalogs[state.player.class];
                        if (!classData) {
                            issues.push(`Missing gem catalog for class: ${state.player.class}`);
                        }
                        
                        const classProficiency = state.classGemProficiency[state.player.class];
                        if (!classProficiency) {
                            issues.push(`Missing gem proficiency for class: ${state.player.class}`);
                        }
                    }
                    
                    return {
                        valid: issues.length === 0,
                        issues
                    };
                }
                
                /**
                 * Reset player stats with class-specific values
                 * @param {String} className - Player class name
                 */
                function resetPlayerStats(className) {
                    const classConfig = Config.CLASSES[className];
                    
                    if (!classConfig) {
                        console.error(`Invalid class name: ${className}`);
                        return false;
                    }
                    
                    set('player', {
                        class: className,
                        maxHealth: classConfig.maxHealth,
                        health: classConfig.maxHealth,
                        stamina: classConfig.baseStamina,
                        baseStamina: classConfig.baseStamina,
                        zenny: classConfig.startingZenny || 0,
                        buffs: []
                    });
                    
                    set('currentDay', 1);
                    set('currentPhaseIndex', 0);
                    set('battleCount', 0);
                    set('battleOver', false);
                    set('selectedGems', new Set());
                    
                    // Set active catalog and proficiency for this class
                    const classGemCatalog = get('classGemCatalogs')[className];
                    console.log(`Setting gemCatalog for ${className}:`, classGemCatalog);
                    
                    // Ensure we make a deep copy to avoid reference issues
                    const catalogCopy = JSON.parse(JSON.stringify(classGemCatalog));
                    set('gemCatalog', catalogCopy);
                    
                    set('gemProficiency', JSON.parse(JSON.stringify(get('classGemProficiency')[className])));
                    
                    return true;
                }
                
                /**
                 * Export a snapshot of the current state for saving
                 * @returns {Object} State snapshot
                 */
                function exportSaveData() {
                    return {
                        playerState: {
                            class: get('player.class'),
                            health: get('player.health'),
                            maxHealth: get('player.maxHealth'),
                            stamina: get('player.stamina'),
                            baseStamina: get('player.baseStamina'),
                            zenny: get('player.zenny')
                        },
                        progress: {
                            currentDay: get('currentDay'),
                            currentPhaseIndex: get('currentPhaseIndex'),
                            battleCount: get('battleCount')
                        },
                        metaZenny: get('metaZenny'),
                        timestamp: Date.now()
                    };
                }
                
                /**
                 * Import saved data into state
                 * @param {Object} saveData - Save data to import
                 * @returns {Boolean} Whether import was successful
                 */
                function importSaveData(saveData) {
                    if (!saveData) return false;
                    
                    try {
                        // Restore player state
                        if (saveData.playerState) {
                            const { class: className, health, maxHealth, stamina, baseStamina, zenny } = saveData.playerState;
                            set('player.class', className);
                            set('player.health', health);
                            set('player.maxHealth', maxHealth);
                            set('player.stamina', stamina);
                            set('player.baseStamina', baseStamina);
                            set('player.zenny', zenny);
                            set('player.buffs', []);
                        }
                        
                        // Restore progress
                        if (saveData.progress) {
                            set('currentDay', saveData.progress.currentDay || 1);
                            set('currentPhaseIndex', saveData.progress.currentPhaseIndex || 0);
                            set('battleCount', saveData.progress.battleCount || 0);
                        }
                        
                        // Restore meta zenny
                        if (saveData.metaZenny !== undefined) {
                            set('metaZenny', saveData.metaZenny);
                        }
                        
                        return true;
                    } catch (error) {
                        console.error("Error importing save data:", error);
                        return false;
                    }
                }
                
                /**
                 * Create a backup of current state
                 * @returns {Object} Complete state backup
                 */
                function createBackup() {
                    return JSON.parse(JSON.stringify(state));
                }
                
                /**
                 * Restore from a backup
                 * @param {Object} backup - Backup to restore from
                 * @returns {Boolean} Whether restore was successful
                 */
                function restoreFromBackup(backup) {
                    if (!backup) return false;
                    
                    try {
                        // Restore all state properties
                        Object.keys(backup).forEach(key => {
                            // Skip internal properties
                            if (key.startsWith('_')) return;
                            
                            set(key, backup[key]);
                        });
                        
                        return true;
                    } catch (error) {
                        console.error("Error restoring from backup:", error);
                        return false;
                    }
                }
                
                /**
                 * Get state change history
                 * @returns {Array} State change history
                 */
                function getStateChangeHistory() {
                    return [...stateChangeHistory];
                }
                
                /**
                 * Clear state change history
                 */
                function clearStateChangeHistory() {
                    stateChangeHistory.length = 0;
                }
                
                /**
                 * Get full state (for debugging)
                 * @returns {Object} Full state
                 */
                function getFullState() {
                    return JSON.parse(JSON.stringify(state));
                }
                
                // Return public methods
                return {
                    get,
                    set,
                    update,
                    addListener,
                    resetPlayerStats,
                    exportSaveData,
                    importSaveData,
                    createBackup,
                    restoreFromBackup,
                    validateState,
                    getStateChangeHistory,
                    clearStateChangeHistory,
                    getFullState
                };
            })();