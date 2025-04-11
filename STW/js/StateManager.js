// StateManager.js - Manages game state
export default class StateManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // Default game state - using a more consolidated structure
        this.state = {
            meta: {
                zenny: 0,
                unlockedGems: [], // Gems unlocked in the meta progression
                gemProficiency: {} // Map of gem IDs to proficiency (0-100%)
            },
            
            player: {
                class: null, // Knight, Mage, Rogue
                health: 0,
                maxHealth: 0,
                stamina: 0,
                maxStamina: 0,
                zenny: 0,
                buffs: []
            },
            
            journey: {
                day: 1,
                phase: 'DAWN', // DAWN, DUSK, DARK
                completed: false
            },
            
            battle: {
                inProgress: false,
                currentTurn: 'PLAYER', // PLAYER or ENEMY
                enemy: null,
                selectedGems: []
            },
            
            gems: {
                bag: [], // All gems in player's possession
                hand: [], // Currently drawn gems (max 3)
                discarded: [], // Gems discarded this battle
                played: [] // Gems played this battle
            },
            
            // Current active screen
            currentScreen: 'character-select-screen',
            
            // Gem bag size
            gemBagSize: 20
        };
        
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
    
    // Update state and emit change event - optimized for performance
    updateState(updates, eventType = 'state:updated') {
        // Deep merge the updates into current state
        this.mergeState(updates);
        
        // Emit the state change event
        this.eventBus.emit(eventType, this.state);
        
        // Save the state to local storage - but throttle to avoid excessive writes
        this.throttledSave();
    }
    
    // A simple throttling mechanism to avoid too many localStorage writes
    throttledSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        this.saveTimeout = setTimeout(() => {
            this.saveGameState();
            this.saveTimeout = null;
        }, 500); // Save at most once every 500ms
    }
    
    // Helper to deep merge updates into state
    mergeState(updates) {
        for (const [key, value] of Object.entries(updates)) {
            if (value === null) {
                // Handle null values explicitly
                this.state[key] = null;
            } else if (typeof value === 'object' && !Array.isArray(value) && 
                    typeof this.state[key] === 'object' && this.state[key] !== null) {
                // Deep merge objects
                this.state[key] = this.deepMerge(this.state[key], value);
            } else {
                // Direct assignment for primitives and arrays
                this.state[key] = value;
            }
        }
    }
    
    // Optimized deep merge function
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] === null) {
                result[key] = null;
            } else if (
                typeof source[key] === 'object' && 
                !Array.isArray(source[key]) && 
                typeof result[key] === 'object' && 
                result[key] !== null
            ) {
                result[key] = this.deepMerge(result[key], source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
    
    // Save game state to localStorage with error handling
    saveGameState() {
        try {
            localStorage.setItem('superTinyWorld', JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save game state:', error);
        }
    }
    
    // Load game state from localStorage with error handling
    loadGameState() {
        try {
            const savedState = localStorage.getItem('superTinyWorld');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                this.state = this.deepMerge(this.state, parsedState);
            }
        } catch (error) {
            console.error('Failed to load game state:', error);
        }
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
    
    // Reset all game progress
    resetGame() {
        localStorage.removeItem('superTinyWorld');
        
        // Reset to default state using a cleaner approach
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
                selectedGems: []
            },
            
            gems: {
                bag: [],
                hand: [],
                discarded: [],
                played: []
            },
            
            currentScreen: 'character-select-screen',
            gemBagSize: 20
        };
        
        this.eventBus.emit('game:reset', this.state);
    }
    
    // Change the active screen
    changeScreen(screenId) {
        this.state.currentScreen = screenId;
        this.eventBus.emit('screen:changed', screenId);
        
        // Update UI - optimize by caching DOM elements
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }
}