// main.js - Consolidated with simplified screen management approach

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
            EventBus.emit('SCREEN_CHANGE', 'characterSelect');
            
            return true;
        } catch (error) {
            console.error("Error during game initialization:", error);
            BaseRenderer.showError("Failed to initialize game. Please refresh the page.", true);
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
        
        // Selection events
        EventBus.on('GEM_SELECT', ({ index, context }) => {
            if (typeof Battle.toggleGemSelection === 'function') {
                Battle.toggleGemSelection(index, context === 'shop');
            }
        });
        
        // Debug events
        EventBus.on('DEBUG_LOG', (data) => console.log('[DEBUG]', data));
    }
    
    /**
     * Initialize all modules in the correct order
     */
    function initializeAllModules() {
        console.log("Initializing core modules");
        
        // Initialize renderer first
        BaseRenderer.initialize();
        GemRenderer.initialize();
        Renderer.initialize();
        
        // Initialize system modules
        Character.initialize();
        Gems.initialize();
        Battle.initialize();
        Shop.initialize();
        EventHandler.initialize();
        AssetManager.initialize();
        
        // Emit event for successful initialization
        EventBus.emit('ALL_MODULES_INITIALIZED');
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
            return true;
        } catch (error) {
            console.error("Error initializing screens:", error);
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

// Single initialization function
function initializeGame() {
    console.log("Initializing game");
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

export default Game;