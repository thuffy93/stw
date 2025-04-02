// Main entry point for Super Tiny World
import { EventBus } from './core/events.js';
import { Config } from './core/config.js';
import { GameState } from './core/state.js';
import { Utils } from './core/utils.js';
import { Storage } from './core/storage.js';
import { Renderer } from './ui/renderer.js';
import { Character } from './systems/character.js';
import { Gems } from './systems/gem.js';
import { Battle } from './systems/battle.js';
import { Shop } from './systems/shop.js';
import { EventHandler } from './systems/eventHandler.js';

/**
 * Game - Main application controller
 */
const Game = (() => {
    // Track initialization status
    let initialized = false;
    
    // Critical game components that must be verified
    const criticalComponents = [
        { name: 'EventBus', check: () => typeof EventBus !== 'undefined' },
        { name: 'GameState', check: () => typeof GameState !== 'undefined' && GameState.get && GameState.set },
        { name: 'Renderer', check: () => typeof Renderer !== 'undefined' && Renderer.initialize },
        { name: 'Gems', check: () => typeof Gems !== 'undefined' && Gems.initialize },
        { name: 'Battle', check: () => typeof Battle !== 'undefined' && Battle.initialize },
        { name: 'Shop', check: () => typeof Shop !== 'undefined' && Shop.initialize },
        { name: 'Storage', check: () => typeof Storage !== 'undefined' && Storage.initialize },
        { name: 'EventHandler', check: () => typeof EventHandler !== 'undefined' && EventHandler.initialize }
    ];
    
    /**
     * Check if all critical components are available
     * @returns {Boolean} Whether all components are ready
     */
    function checkComponentsReady() {
        const missingComponents = criticalComponents.filter(comp => !comp.check());
        
        if (missingComponents.length > 0) {
            console.error("Missing critical components:", 
                missingComponents.map(comp => comp.name).join(', '));
            return false;
        }
        
        return true;
    }
    
    /**
     * Set up core EventBus listeners
     */
    function setupEventBusListeners() {
        // Core system events
        EventBus.on('SAVE_GAME_STATE', () => Storage.saveGameState());
        EventBus.on('LOAD_GAME_STATE', () => Storage.loadGameState());
        EventBus.on('SAVE_META_ZENNY', () => Storage.saveMetaZenny());
        
        // Gem catalog events
        EventBus.on('UNLOCK_GEM', ({ gemKey }) => {
            EventHandler.unlockGem(gemKey);
        });
        
        // Selection events
        EventBus.on('GEM_SELECT', ({ index, context }) => {
            EventHandler.toggleGemSelection(index, context === 'shop');
        });
        
        // Journey events
        EventBus.on('JOURNEY_START', () => {
            Gems.resetGemBag(true);
        });
        
        // Debug events
        EventBus.on('DEBUG_LOG', (data) => console.log('[DEBUG]', data));
    }
    
    /**
     * Initialize the game
     */
    function initialize() {
        if (initialized) {
            console.warn("Game already initialized, skipping");
            return;
        }
        
        console.log("Initializing Super Tiny World with EventBus architecture...");
        
        try {
            // First verify all critical components are available
            if (!checkComponentsReady()) {
                console.error("Critical components missing, cannot initialize game");
                return false;
            }
            
            // Set up core EventBus listeners
            setupEventBusListeners();
            
            // Initialize core systems in sequence
            console.log("Initializing core systems...");
            
            Storage.initialize();
            Renderer.initialize();
            Character.initialize();
            Gems.initialize();
            Battle.initialize();
            Shop.initialize();
            EventHandler.initialize();
            
            // Try to load saved data
            Storage.loadAllSavedData();
            
            // Start at character selection screen
            EventBus.emit('SCREEN_CHANGE', 'characterSelect');
            
            // Mark initialization as complete
            initialized = true;
            console.log("Game initialized successfully");
            
            return true;
        } catch (error) {
            console.error("Error during game initialization:", error);
            alert("Failed to initialize game. Please refresh the page.");
            return false;
        }
    }
    
    /**
     * Reset the game state (for testing)
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
    
    // Public interface
    return {
        initialize,
        reset
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

export default Game;