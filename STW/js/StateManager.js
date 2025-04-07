// StateManager.js - Manages game state
export default class StateManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // Default game state
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
                discarded: [] // Gems discarded this battle
            },
            
            // Current active screen
            currentScreen: 'character-select-screen'
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
    
    // Update state and emit change event
    updateState(updates, eventType = 'state:updated') {
        // Deep merge the updates into current state
        this.mergeState(updates);
        
        // Emit the state change event
        this.eventBus.emit(eventType, this.state);
        
        // Save the state to local storage
        this.saveGameState();
    }
    
    // Helper to deep merge updates into state
    mergeState(updates) {
        for (const [key, value] of Object.entries(updates)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value) && 
                typeof this.state[key] === 'object' && this.state[key] !== null) {
                this.state[key] = { ...this.state[key], ...value };
            } else {
                this.state[key] = value;
            }
        }
    }
    
    // Save game state to localStorage
    saveGameState() {
        try {
            localStorage.setItem('superTinyWorld', JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save game state:', error);
        }
    }
    
    // Load game state from localStorage
    loadGameState() {
        try {
            const savedState = localStorage.getItem('superTinyWorld');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                this.state = { ...this.state, ...parsedState };
            }
        } catch (error) {
            console.error('Failed to load game state:', error);
        }
    }
    
    // Reset all game progress
    resetGame() {
        localStorage.removeItem('superTinyWorld');
        
        // Reset to default state
        this.state = {
            meta: {
                zenny: 0,
                unlockedGems: [], 
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
                discarded: []
            },
            
            currentScreen: 'character-select-screen'
        };
        
        this.eventBus.emit('game:reset', this.state);
    }
    
    // Change the active screen
    changeScreen(screenId) {
        this.state.currentScreen = screenId;
        this.eventBus.emit('screen:changed', screenId);
        
        // Update UI
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }
}