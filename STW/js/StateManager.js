// StateManager.js - Enhanced version with improved state management
export default class StateManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // Default game state
        this.state = {
            meta: {
                zenny: 0,
                unlockedGems: {
                    global: [],
                    knight: [],
                    mage: [],
                    rogue: []
                },
                gemProficiency: {}
            },
            
            player: {
                class: null,
                health: 0,
                maxHealth: 0,
                stamina: 0,
                maxStamina: 0,
                zenny: 0,
                buffs: []
            },
            
            journey: {
                day: 1,
                phase: 'DAWN',
                completed: false
            },
            
            battle: {
                inProgress: false,
                currentTurn: 'PLAYER',
                enemy: null,
                selectedGems: [],
                staminaUsed: 0,
                actionHistory: []
            },
            
            gems: {
                bag: [],
                hand: [],
                discarded: [],
                played: []
            },
            
            // Gem bag size limit
            gemBagSize: 20,
            
            // Current active screen
            currentScreen: 'character-select-screen'
        };
        
        // Batch update tracking
        this.batchMode = false;
        this.batchUpdates = {};
        this.batchEventTypes = new Set();
        
        // Initialize the game from saved state if available
        this.loadGameState();
    }
    
    // Get the current state or a slice of it
    getState(slice) {
        if (slice) {
            return this.state[slice];
        }
        return this.state;
    }
    
    // Start a batch update session
    startBatch() {
        this.batchMode = true;
        this.batchUpdates = {};
        this.batchEventTypes = new Set();
        return this;
    }
    
    // End batch update and apply all changes at once
    endBatch() {
        if (!this.batchMode || Object.keys(this.batchUpdates).length === 0) {
            this.batchMode = false;
            return;
        }
        
        // Apply all batched updates at once
        this.mergeState(this.batchUpdates);
        
        // Save state
        this.saveGameState();
        
        // Emit events
        const eventTypes = Array.from(this.batchEventTypes);
        if (eventTypes.length > 0) {
            // Always emit generic state update
            this.eventBus.emit('state:updated', this.state);
            
            // Emit specific events
            eventTypes.forEach(eventType => {
                if (eventType !== 'state:updated') {
                    this.eventBus.emit(eventType, this.state);
                }
            });
        }
        
        // Reset batch tracking
        this.batchMode = false;
        this.batchUpdates = {};
        this.batchEventTypes = new Set();
        
        return this;
    }
    
    // Enhanced update state with validation and path support
    updateState(updates, eventType = 'state:updated') {
        // If in batch mode, collect updates instead of applying immediately
        if (this.batchMode) {
            this.batchUpdates = this.deepMerge({}, this.batchUpdates, updates);
            this.batchEventTypes.add(eventType);
            return this;
        }
        
        // Apply updates through improved deep merge
        this.mergeState(updates);
        
        // Emit the state change event
        this.eventBus.emit(eventType, this.state);
        
        // Save the state to local storage
        this.saveGameState();
        
        return this;
    }
    
    // Improved deep merge with better array handling
    mergeState(updates) {
        for (const [key, value] of Object.entries(updates)) {
            // Handle null values properly
            if (value === null) {
                this.state[key] = null;
                continue;
            }
            
            // Special handling for arrays
            if (Array.isArray(value)) {
                this.state[key] = [...value]; // Create a new array instance
                continue;
            }
            
            // Deep merge objects
            if (typeof value === 'object' && value !== null && 
                typeof this.state[key] === 'object' && this.state[key] !== null) {
                // Recursively merge nested objects
                this.state[key] = this.deepMerge({}, this.state[key], value);
            } else {
                // Direct assignment for primitive values or when target isn't an object
                this.state[key] = value;
            }
        }
    }
    
    // Improved deep merge utility
    deepMerge(target, ...sources) {
        if (!sources.length) return target;
        
        const source = sources.shift();
        
        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                // Handle null values
                if (source[key] === null) {
                    target[key] = null;
                    continue;
                }
                
                // Handle arrays - replace instead of merge
                if (Array.isArray(source[key])) {
                    target[key] = [...source[key]];
                    continue;
                }
                
                // Recursive merge for objects
                if (this.isObject(source[key])) {
                    if (!target[key]) {
                        target[key] = {};
                    }
                    this.deepMerge(target[key], source[key]);
                } else {
                    // Direct assignment for other types
                    target[key] = source[key];
                }
            }
        }
        
        // Handle remaining sources recursively
        return this.deepMerge(target, ...sources);
    }
    
    // Helper method to check if a value is an object
    isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }
    
    // Enhanced save game state with error handling
    saveGameState() {
        try {
            // Create a serialization-safe copy
            const safeState = this.cleanStateForStorage(this.state);
            localStorage.setItem('superTinyWorld', JSON.stringify(safeState));
        } catch (error) {
            console.error('Failed to save game state:', error);
            
            // Try to save a reduced state if storage quota is exceeded
            if (error.name === 'QuotaExceededError') {
                try {
                    // Create a minimal state with just essential data
                    const minimalState = {
                        meta: this.state.meta,
                        player: this.state.player,
                        journey: this.state.journey,
                        currentScreen: this.state.currentScreen
                    };
                    localStorage.setItem('superTinyWorld_minimal', JSON.stringify(minimalState));
                    console.log('Saved minimal game state as fallback');
                } catch (fallbackError) {
                    console.error('Failed to save minimal game state:', fallbackError);
                }
            }
        }
    }
    
    // Clean state object for storage (remove circular references and functions)
    cleanStateForStorage(stateObj) {
        return JSON.parse(JSON.stringify(stateObj));
    }
    
    // Improved load game state with validation
    loadGameState() {
        try {
            const savedState = localStorage.getItem('superTinyWorld');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                
                // Validate critical parts of the loaded state
                if (this.validateLoadedState(parsedState)) {
                    // Use deep merge to preserve defaults for any missing properties
                    this.state = this.deepMerge({}, this.state, parsedState);
                    
                    // Ensure buffs arrays exist
                    if (this.state.player && !this.state.player.buffs) {
                        this.state.player.buffs = [];
                    }
                    
                    // Ensure unlockedGems has the correct structure
                    if (this.state.meta && this.state.meta.unlockedGems) {
                        // Convert from old array format to new object format if needed
                        if (Array.isArray(this.state.meta.unlockedGems)) {
                            const oldGems = [...this.state.meta.unlockedGems];
                            this.state.meta.unlockedGems = {
                                global: oldGems,
                                knight: [],
                                mage: [],
                                rogue: []
                            };
                        }
                    }
                    
                    // Ensure gems collections exist
                    if (!this.state.gems.played) {
                        this.state.gems.played = [];
                    }
                } else {
                    console.warn('Loaded state validation failed, using default state');
                }
            }
            
            // Try loading minimal state if main state failed
            if (!savedState) {
                const minimalState = localStorage.getItem('superTinyWorld_minimal');
                if (minimalState) {
                    const parsedMinimal = JSON.parse(minimalState);
                    // Merge only the essential parts
                    if (parsedMinimal.meta) this.state.meta = parsedMinimal.meta;
                    if (parsedMinimal.player) this.state.player = parsedMinimal.player;
                    if (parsedMinimal.journey) this.state.journey = parsedMinimal.journey;
                    if (parsedMinimal.currentScreen) this.state.currentScreen = parsedMinimal.currentScreen;
                    
                    console.log('Loaded minimal game state as fallback');
                }
            }
        } catch (error) {
            console.error('Failed to load game state:', error);
        }
    }
    
    // Validate critical parts of loaded state
    validateLoadedState(loadedState) {
        // Check for required top-level properties
        if (!loadedState || typeof loadedState !== 'object') {
            return false;
        }
        
        // Basic validation for critical game properties
        const hasPlayer = loadedState.player && typeof loadedState.player === 'object';
        const hasMeta = loadedState.meta && typeof loadedState.meta === 'object';
        const hasJourney = loadedState.journey && typeof loadedState.journey === 'object';
        
        return hasPlayer && hasMeta && hasJourney;
    }
    
    // Add method to modify meta zenny (for debugging/testing)
    addMetaZenny(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) {
            console.error('Invalid amount. Please provide a valid number.');
            return false;
        }
        
        const currentMetaZenny = this.state.meta.zenny || 0;
        const newMetaZenny = currentMetaZenny + amount;
        
        this.updateState({
            meta: {
                zenny: newMetaZenny
            }
        });
        
        console.log(`Added ${amount} Meta $ZENNY. New total: ${newMetaZenny}`);
        return true;
    }
    
    // Reset all game progress with confirmation
    resetGame() {
        localStorage.removeItem('superTinyWorld');
        localStorage.removeItem('superTinyWorld_minimal');
        
        // Reset to default state
        this.state = {
            meta: {
                zenny: 0,
                unlockedGems: {
                    global: [],
                    knight: [],
                    mage: [],
                    rogue: []
                },
                gemProficiency: {}
            },
            
            player: {
                class: null,
                health: 0,
                maxHealth: 0,
                stamina: 0,
                maxStamina: 0,
                zenny: 0,
                buffs: []
            },
            
            journey: {
                day: 1,
                phase: 'DAWN',
                completed: false
            },
            
            battle: {
                inProgress: false,
                currentTurn: 'PLAYER',
                enemy: null,
                selectedGems: [],
                staminaUsed: 0,
                actionHistory: []
            },
            
            gems: {
                bag: [],
                hand: [],
                discarded: [],
                played: []
            },
            
            gemBagSize: 20,
            
            currentScreen: 'character-select-screen'
        };
        
        this.eventBus.emit('game:reset', this.state);
    }
    
    // Change the active screen with validation
    changeScreen(screenId) {
        // Validate screen ID
        const validScreens = [
            'character-select-screen',
            'gem-catalog-screen',
            'battle-screen',
            'shop-screen',
            'camp-screen'
        ];
        
        if (!validScreens.includes(screenId)) {
            console.error(`Invalid screen ID: ${screenId}`);
            return;
        }
        
        this.state.currentScreen = screenId;
        this.eventBus.emit('screen:changed', screenId);
        
        // Save state on screen change
        this.saveGameState();
    }
}