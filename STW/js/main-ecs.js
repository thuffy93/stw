// Main entry point for Super Tiny World with ECS architecture
import { EventBus } from './core/eventbus.js';
import { Config } from './core/config.js';
import { Utils } from './core/utils.js';
import { Storage } from './core/storage.js';
import { EntityManager } from './core/ecs/EntityManager.js';
import { SystemManager } from './core/ecs/SystemManager.js';
import { GameInitializer } from './core/ecs/GameInitializer.js';
import { Renderer } from './ui/renderer.js';

/**
 * Game - Main application controller with ECS architecture
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
        
        console.log("Initializing Super Tiny World with ECS architecture...");
        
        try {
            // Setup core EventBus listeners
            setupEventBusListeners();
            
            // Initialize core renderer
            Renderer.initialize();
            
            // Initialize game with ECS architecture
            GameInitializer.initializeGame();
            
            // Mark initialization as complete
            initialized = true;
            console.log("Game initialized successfully with ECS architecture");
            
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
        
        // Class selection event
        EventBus.on('CLASS_SELECTED', ({ className }) => {
            GameInitializer.createPlayerCharacter(className);
            EventBus.emit('SCREEN_CHANGE', 'gemCatalog');
        });
        
        // Debug events
        EventBus.on('DEBUG_LOG', (data) => console.log('[DEBUG]', data));
    }
    
    /**
     * Reset the game state (for testing)
     */
    function reset() {
        if (!initialized) {
            console.warn("Game not yet initialized, cannot reset");
            return;
        }
        
        // Reset game with GameInitializer
        GameInitializer.resetGame();
        
        // Reset UI
        EventBus.emit('SCREEN_CHANGE', 'characterSelect');
        
        console.log("Game reset complete");
    }
    
    /**
     * Get the ECS manager objects
     */
    function getECSManagers() {
        return {
            EntityManager,
            SystemManager
        };
    }
    
    // Public interface
    return {
        initialize,
        reset,
        getECSManagers
    };
})();

// Set up initialization to happen after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM content loaded, initializing game");
    Game.initialize();
});

// Backup initialization for older browsers or if DOMContentLoaded already fired
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    console.log("Document already interactive/complete, initializing game");
    setTimeout(Game.initialize, 100);
}

// Make Game available globally for debugging
window.Game = Game;

export default Game;