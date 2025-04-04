// STW/js/component-main.js
// New main entry point for component-based UI architecture

// Core systems
import { EventBus } from './core/eventbus.js';
import { GameState } from './core/state.js';
import { Storage } from './core/storage.js';
import { Utils } from './core/utils.js';
import { Config } from './core/config.js';

// Game systems
import { Character } from './systems/character.js';
import { Gems } from './systems/gem.js';
import { Battle } from './systems/battle.js';
import { Shop } from './systems/shop.js';
import { EventHandler } from './systems/eventHandler.js';

// Component UI
import { initializeComponentUI, cleanupComponentUI } from './ui/integration.js';

/**
 * Game - Main application controller with component-based UI
 */
const Game = (() => {
    // Track initialization status
    let initialized = false;
    
    /**
     * Initialize the game
     */
    function initialize() {
        if (initialized) {
            console.warn("Game already initialized, skipping");
            return;
        }
        
        console.log("Initializing Super Tiny World with component-based UI...");
        
        try {
            // Setup core EventBus listeners
            setupEventBusListeners();
            
            // Initialize component UI architecture
            initializeComponentUI();
            
            // Initialize all game systems
            initializeSystems();
            
            // Load saved game data
            Storage.loadAllSavedData();
            
            // Mark initialization as complete
            initialized = true;
            console.log("Game initialized successfully");
            
            // Start at character selection screen
            EventBus.emit('SCREEN_CHANGE', 'characterSelect');
            
            return true;
        } catch (error) {
            console.error("Error during game initialization:", error);
            alert("Failed to initialize game. Please refresh the page.");
            return false;
        }
    }
    
    /**
     * Set up core EventBus listeners
     */
    function setupEventBusListeners() {
        // Core system events
        EventBus.on('SAVE_GAME_STATE', () => Storage.saveGameState());
        EventBus.on('LOAD_GAME_STATE', () => Storage.loadGameState());
        EventBus.on('SAVE_META_ZENNY', () => Storage.saveMetaZenny());
        
        // Debug events
        EventBus.on('DEBUG_LOG', (data) => console.log('[DEBUG]', data));
        
        // Journey events
        EventBus.on('JOURNEY_START', () => {
            // Prepare for journey to battle
            console.log("Journey starting");
            
            // Ensure setup is complete
            const playerClass = GameState.get('player.class');
            if (!playerClass) {
                console.warn("No player class set, can't start journey");
                EventBus.emit('UI_MESSAGE', {
                    message: "Please select a class first",
                    type: 'error'
                });
                return;
            }
            
            // Reset gem bag if needed
            Gems.resetGemBag(true);
        });
        
        // Restart game
        EventBus.on('RESTART_GAME', () => {
            reset();
        });
    }
    
    /**
     * Initialize game systems
     */
    function initializeSystems() {
        const systems = [
            { name: 'Character', init: Character.initialize },
            { name: 'Gems', init: Gems.initialize },
            { name: 'Battle', init: Battle.initialize },
            { name: 'Shop', init: Shop.initialize },
            { name: 'EventHandler', init: EventHandler.initialize }
        ];
        
        // Initialize each system
        systems.forEach(system => {
            try {
                console.log(`Initializing ${system.name}...`);
                const result = system.init();
                
                if (result === false) {
                    console.error(`Failed to initialize ${system.name}`);
                }
            } catch (err) {
                console.error(`Error initializing ${system.name}:`, err);
            }
        });
    }
    
    /**
     * Reset the game state (for testing or restart)
     */
    function reset() {
        if (!initialized) {
            console.warn("Game not yet initialized, cannot reset");
            return;
        }
        
        // Reset state
        GameState.set('currentScreen', 'characterSelect');
        GameState.set('battleOver', false);
        GameState.set('selectedGems', new Set());
        
        // Reset UI
        EventBus.emit('SCREEN_CHANGE', 'characterSelect');
        
        console.log("Game reset complete");
    }
    
    /**
     * Clean up resources before unload
     */
    function cleanup() {
        // Save game state
        Storage.saveGameState();
        
        // Clean up component UI
        cleanupComponentUI();
        
        // Mark as uninitialized
        initialized = false;
        
        console.log("Game cleanup complete");
    }
    
    // Public interface
    return {
        initialize,
        reset,
        cleanup
    };
})();

// Set up initialization to happen after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM content loaded, initializing game");
    Game.initialize();
});

// Set up cleanup on page unload
window.addEventListener('beforeunload', function() {
    console.log("Page unloading, cleaning up");
    Game.cleanup();
});

// Backup initialization for older browsers or if DOMContentLoaded already fired
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    console.log("Document already interactive/complete, initializing game");
    setTimeout(Game.initialize, 100);
}

export default Game;