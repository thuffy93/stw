// Main entry point for Super Tiny World
import { EventBus } from './core/eventbus.js';
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
    
    /**
     * Initialize the game
     */
    function initialize() {
        if (initialized) {
            console.warn("Game already initialized, skipping");
            return;
        }
        
        console.log("Initializing Super Tiny World...");
        
        try {
            // Register global objects for module access
            window.EventBus = EventBus;
            window.Config = Config;
            window.GameState = GameState;
            window.Utils = Utils;
            window.Storage = Storage;
            window.Renderer = Renderer;
            window.Character = Character;
            window.Gems = Gems;
            window.Battle = Battle;
            window.Shop = Shop;
            window.EventHandler = EventHandler;
            window.Game = this;
            
            // Setup core EventBus listeners
            setupEventBusListeners();
            
            // Initialize modules in the correct order
            initializeAllModules();
            
            // Mark initialization as complete
            initialized = true;
            console.log("Game initialized successfully");
            
            // Start at character selection screen
            EventBus.emit('SCREEN_CHANGE', 'character-select');
            
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
        
        // Screen management
        EventBus.on('SCREEN_CHANGE', (screen) => {
            if (typeof Renderer.updateActiveScreen === 'function') {
                Renderer.updateActiveScreen(screen);
            }
        });
        
        // Selection events
        EventBus.on('GEM_SELECT', ({ index, context }) => {
            EventHandler.toggleGemSelection(index, context === 'shop');
        });
        
        // Debug events
        EventBus.on('DEBUG_LOG', (data) => console.log('[DEBUG]', data));
    }
    
    /**
     * Initialize all modules in the correct order
     */
    function initializeAllModules() {
        console.log("Initializing all modules in correct order");
        
        // Define module dependencies and initialization order
        const modules = [
            { name: 'EventBus', module: EventBus, required: true },
            { name: 'Config', module: Config, required: true },
            { name: 'Utils', module: Utils, required: true },
            { name: 'GameState', module: GameState, required: true },
            { name: 'Storage', module: Storage, required: true },
            { name: 'Renderer', module: Renderer, required: true },
            { name: 'Character', module: Character, required: true },
            { name: 'Gems', module: Gems, required: true },
            { name: 'Battle', module: Battle, required: true },
            { name: 'Shop', module: Shop, required: true },
            { name: 'EventHandler', module: EventHandler, required: true }
        ];
        
        // Initialize modules in order
        for (const moduleInfo of modules) {
            console.log(`Initializing module: ${moduleInfo.name}`);
            
            if (typeof moduleInfo.module.initialize === 'function') {
                try {
                    moduleInfo.module.initialize();
                    console.log(`Successfully initialized: ${moduleInfo.name}`);
                } catch (e) {
                    console.error(`Error initializing ${moduleInfo.name}:`, e);
                    if (moduleInfo.required) {
                        throw new Error(`Failed to initialize required module: ${moduleInfo.name}`);
                    }
                }
            } else {
                console.log(`Module ${moduleInfo.name} has no initialize method, skipping`);
            }
        }
        
        // Emit event for successful initialization
        EventBus.emit('ALL_MODULES_INITIALIZED');
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
        GameState.set('currentScreen', 'character-select');
        GameState.set('battleOver', false);
        GameState.set('selectedGems', new Set());
        
        // Reset UI
        EventBus.emit('SCREEN_CHANGE', 'character-select');
        
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