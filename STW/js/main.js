// main.js - Consolidated with standardized event handling

// Core imports
import { EventBus } from './core/eventbus.js';
import { Config } from './core/config.js';
import { GameState } from './core/state.js';
import { Utils } from './core/utils.js';
import { Storage } from './core/storage.js';
import { AssetManager } from './core/AssetManager.js';

// UI modules
import { BaseRenderer } from './ui/baseRenderer.js';
import { GemRenderer } from './ui/gemRenderer.js';
import { Renderer } from './ui/renderer.js';

// Import screen components directly
import { CharacterSelectScreen } from './ui/components/screens/CharacterSelectScreen.js';
import { BattleScreen } from './ui/components/screens/BattleScreen.js';
import { ShopScreen } from './ui/components/screens/ShopScreen.js';
import { GemCatalogScreen } from './ui/components/screens/GemCatalogScreen.js';
import { CampScreen } from './ui/components/screens/CampScreen.js';

// Game systems
import { Character } from './systems/character.js';
import { GemGeneration } from './systems/gem-generation.js';
import { GemProficiency } from './systems/gem-proficiency.js';
import { GemUpgrades } from './systems/gem-upgrades.js';
import { Gems } from './systems/gem.js';
import { BattleInitialization } from './systems/battle-initialization.js';
import { BattleMechanics } from './systems/battle-mechanics.js';
import { Battle } from './systems/battle.js';
import { Shop } from './systems/shop.js';
import { EventHandler } from './systems/eventHandler.js';

/**
 * Game - Main application controller
 */
const Game = (() => {
    // Track initialization status
    let initialized = false;
    
    // Track event subscriptions
    let eventSubscriptions = [];
    
    /**
     * Helper method to subscribe to events and track subscriptions
     * @param {String} eventName - Event name
     * @param {Function} handler - Event handler
     * @returns {Object} Subscription object
     */
    function subscribe(eventName, handler) {
        const subscription = EventBus.on(eventName, handler);
        eventSubscriptions.push(subscription);
        return subscription;
    }
    
    /**
     * Clear all subscriptions
     */
    function unsubscribeAll() {
        eventSubscriptions.forEach(subscription => {
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        });
        eventSubscriptions = [];
    }
    
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
            // Register global objects for module access (helps with component integration)
            window.EventBus = EventBus;
            window.GameState = GameState;
            window.Utils = Utils;
            window.Config = Config;
            
            // Setup core EventBus listeners
            setupEventBusListeners();
            
            // Initialize modules in the correct order
            initializeAllModules();
            
            // Initialize asset manager with gems
            initializeAssets();
            
            // Initialize screens
            initializeScreens();
            
            // Mark initialization as complete
            initialized = true;
            console.log("Game initialized successfully");
            
            // Start at character selection screen
            EventBus.emit('SCREEN_CHANGE', { screen: 'characterSelect' });
            
            return true;
        } catch (error) {
            console.error("Error during game initialization:", error);
            BaseRenderer.showError("Failed to initialize game. Please refresh the page.", true);
            return false;
        }
    }
    
    /**
     * Set up core EventBus listeners with standardized subscription pattern
     */
    function setupEventBusListeners() {
        // Core system events
        subscribe('SAVE_GAME_STATE', () => Storage.saveGameState());
        subscribe('LOAD_GAME_STATE', () => Storage.loadGameState());
        subscribe('SAVE_META_ZENNY', () => Storage.saveMetaZenny());
        
        // Selection events
        subscribe('GEM_SELECT', ({ index, context }) => {
            if (typeof Battle.toggleGemSelection === 'function') {
                Battle.toggleGemSelection(index, context === 'shop');
            }
        });
        
        // Debug events
        subscribe('DEBUG_LOG', (data) => console.log('[DEBUG]', data));
        
        // Error handling
        subscribe('ERROR_OCCURRED', ({ error, source, isFatal = false }) => {
            console.error(`[ERROR] in ${source}:`, error);
            
            // Show error message
            EventBus.emit('ERROR_SHOW', {
                message: error.message || String(error),
                isFatal
            });
        });
    }
    
   /**
     * Initialize all modules in the correct order
     * Fixed to handle modules that are instances rather than static classes
     */
    function initializeAllModules() {
        console.log("Initializing core modules");
        
        // Initialize renderer first
        if (typeof BaseRenderer.initialize === 'function') {
            BaseRenderer.initialize();
        }
        
        if (typeof GemRenderer.initialize === 'function') {
            GemRenderer.initialize();
        }
        
        if (typeof Renderer.initialize === 'function') {
            Renderer.initialize();
        }
        
        // Initialize system modules - handle both function and method approaches
        if (typeof Character.initialize === 'function') {
            Character.initialize();
        }
        
        // Gems module - check if it's a class instance or static class
        if (typeof Gems.initialize === 'function') {
            Gems.initialize();
        }
        
        // Battle module - check different possible forms
        if (typeof Battle.initialize === 'function') {
            Battle.initialize();
        } else if (Battle && typeof Battle === 'object') {
            // If Battle is an instance and doesn't have initialize, just log a message
            console.log("Battle module is an instance, no initialization needed");
        }
        
        // Shop module - check if it's a class instance or static class
        if (typeof Shop.initialize === 'function') {
            Shop.initialize();
        } else if (Shop && typeof Shop === 'object') {
            console.log("Shop module is an instance, no initialization needed");
        }
        
        // EventHandler module
        if (typeof EventHandler.initialize === 'function') {
            EventHandler.initialize();
        }
        
        // AssetManager module
        if (typeof AssetManager.initialize === 'function') {
            AssetManager.initialize();
        }
        
        // Emit event for successful initialization
        EventBus.emit('ALL_MODULES_INITIALIZED', {
            timestamp: Date.now()
        });
    }
    
    /**
     * Initialize screen components and register them with BaseRenderer
     */
    function initializeScreens() {
        console.log("Initializing screen components");
        
        try {
            // Create screen instances
            const screens = {
                characterSelect: new CharacterSelectScreen(),
                battle: new BattleScreen(),
                shop: new ShopScreen(),
                gemCatalog: new GemCatalogScreen(),
                camp: new CampScreen()
            };
            
            // Register each screen with BaseRenderer
            Object.entries(screens).forEach(([name, screen]) => {
                BaseRenderer.registerScreen(name, screen);
            });
            
            console.log("Screens registered successfully");
            
            // Emit event for successful screen initialization
            EventBus.emit('SCREENS_INITIALIZED', {
                screens: Object.keys(screens),
                timestamp: Date.now()
            });
            
            return true;
        } catch (error) {
            console.error("Error initializing screens:", error);
            
            // Emit error event with consistent format
            EventBus.emit('ERROR_OCCURRED', {
                error,
                source: 'screen_initialization',
                isFatal: false
            });
            
            // Continue anyway with what we have
            return false;
        }
    }
    
    /**
     * Initialize asset manager with gem assets
     */
    function initializeAssets() {
        // Queue up gem assets in AssetManager
        Object.entries(Config.BASE_GEMS).forEach(([key, gem]) => {
            AssetManager.queue(key, gem, 'data');
        });
        
        // Emit event for successful asset initialization
        EventBus.emit('ASSETS_INITIALIZED', {
            gemCount: Object.keys(Config.BASE_GEMS).length,
            timestamp: Date.now()
        });
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
        EventBus.emit('SCREEN_CHANGE', { screen: 'characterSelect' });
        
        console.log("Game reset complete");
        
        // Emit reset complete event
        EventBus.emit('GAME_RESET_COMPLETE', {
            timestamp: Date.now()
        });
    }
    
    /**
     * Clean up resources on unload
     */
    function cleanup() {
        // Unsubscribe from all events
        unsubscribeAll();
        
        // Cleanup all module subscriptions if they have cleanup methods
        [BaseRenderer, Battle, Shop, Gems, Character, EventHandler].forEach(module => {
            if (module && typeof module.unsubscribeAll === 'function') {
                module.unsubscribeAll();
            }
        });
        
        // Save state
        if (initialized && GameState.get('player.class')) {
            Storage.saveGameState();
        }
        
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

// Single initialization function
function initializeGame() {
    console.log("Initializing game");
    EventBus.emit('GAME_INITIALIZATION_STARTED', {
        timestamp: Date.now()
    });
    Game.initialize();
}

// Set up initialization to happen once, using the most appropriate method
if (document.readyState === 'loading') {
    // If document is still loading, add event listener
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    // If document is already loaded, initialize now
    console.log("Document already loaded, initializing game");
    initializeGame();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    Game.cleanup();
});

export default Game;