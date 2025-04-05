// Updated main.js with new module structure integration

// Main entry point for Super Tiny World
import { EventBus } from './core/eventbus.js';
import { Config } from './core/config.js';
import { GameState } from './core/state.js';
import { Utils } from './core/utils.js';
import { Storage } from './core/storage.js';

// Import UI modules
import { BaseRenderer } from './ui/baseRenderer.js';
import { GemRenderer } from './ui/gemRenderer.js';
import { Renderer } from './ui/renderer.js';
import { ScreenManager } from './ui/ScreenManager.js';

// Import game systems
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
import { AssetManager } from './core/AssetManager.js';

/**
 * Game - Main application controller
 */
const Game = (() => {
    // Track initialization status
    let initialized = false;
    let screenManager = null;
    
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
            window.BaseRenderer = BaseRenderer;
            window.GemRenderer = GemRenderer;
            window.Renderer = Renderer;
            window.Character = Character;
            window.GemGeneration = GemGeneration;
            window.GemProficiency = GemProficiency;
            window.GemUpgrades = GemUpgrades;
            window.Gems = Gems;
            window.BattleInitialization = BattleInitialization;
            window.BattleMechanics = BattleMechanics;
            window.Battle = Battle;
            window.Shop = Shop;
            window.EventHandler = EventHandler;
            window.AssetManager = AssetManager;
            window.Game = this;
            
            // Create screen manager
            screenManager = new ScreenManager();
            window.ScreenManager = screenManager;
            
            // Setup core EventBus listeners
            setupEventBusListeners();
            
            // Initialize modules in the correct order
            initializeAllModules();
            
            // Initialize asset manager with gems
            initializeAssets();
            
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
        
        // Screen management
        EventBus.on('SCREEN_CHANGE', (screen) => {
            if (screenManager && typeof screenManager.changeScreen === 'function') {
                screenManager.changeScreen(screen);
            } else if (typeof Renderer.updateActiveScreen === 'function') {
                Renderer.updateActiveScreen(screen);
            }
        });
        
        // Selection events
        EventBus.on('GEM_SELECT', ({ index, context }) => {
            if (typeof EventHandler.toggleGemSelection === 'function') {
                EventHandler.toggleGemSelection(index, context === 'shop');
            } else if (typeof Battle.toggleGemSelection === 'function') {
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
        console.log("Initializing all modules in correct order");
        
        // Define module dependencies and initialization order
        const modules = [
            { name: 'EventBus', module: EventBus, required: true },
            { name: 'Config', module: Config, required: true },
            { name: 'Utils', module: Utils, required: true },
            { name: 'GameState', module: GameState, required: true },
            { name: 'Storage', module: Storage, required: true },
            
            // UI modules - initialize renderer and components first
            { name: 'BaseRenderer', module: BaseRenderer, required: true },
            { name: 'GemRenderer', module: GemRenderer, required: true },
            { name: 'Renderer', module: Renderer, required: true },
            
            // Initialize ScreenManager with error handling
            { 
                name: 'ScreenManager', 
                module: screenManager, 
                required: true,
                initialize: function() {
                    if (!screenManager) {
                        console.error("ScreenManager instance is null or undefined");
                        return false;
                    }
                    if (typeof screenManager.initialize !== 'function') {
                        console.error("ScreenManager does not have an initialize method");
                        return false;
                    }
                    return screenManager.initialize();
                }
            },
            
            // Game systems - in dependency order
            { name: 'Character', module: Character, required: true },
            
            // Gem system and submodules
            { name: 'GemGeneration', module: GemGeneration, required: false },
            { name: 'GemProficiency', module: GemProficiency, required: false },
            { name: 'GemUpgrades', module: GemUpgrades, required: false },
            { name: 'Gems', module: Gems, required: true },
            
            // Battle system and submodules
            { name: 'BattleInitialization', module: BattleInitialization, required: false },
            { name: 'BattleMechanics', module: BattleMechanics, required: false },
            { name: 'Battle', module: Battle, required: true },
            
            { name: 'Shop', module: Shop, required: true },
            { name: 'EventHandler', module: EventHandler, required: true },
            { name: 'AssetManager', module: AssetManager, required: true }
        ];
        
        // Initialize modules in order
        for (const moduleInfo of modules) {
            console.log(`Initializing module: ${moduleInfo.name}`);
            
            try {
                // Check if module is defined
                if (!moduleInfo.module) {
                    throw new Error(`Module ${moduleInfo.name} is not defined`);
                }
                
                // Use custom initializer if available
                if (typeof moduleInfo.initialize === 'function') {
                    const result = moduleInfo.initialize();
                    if (result !== true && moduleInfo.required) {
                        throw new Error(`Module ${moduleInfo.name} failed to initialize`);
                    }
                }
                // Otherwise use standard initialize method
                else if (typeof moduleInfo.module.initialize === 'function') {
                    const result = moduleInfo.module.initialize();
                    if (result !== true && moduleInfo.required) {
                        throw new Error(`Module ${moduleInfo.name} failed to initialize`);
                    }
                }
                else {
                    console.log(`Module ${moduleInfo.name} has no initialize method, skipping`);
                }
                
                console.log(`Successfully initialized: ${moduleInfo.name}`);
            } catch (e) {
                console.error(`Error initializing ${moduleInfo.name}:`, e);
                if (moduleInfo.required) {
                    throw new Error(`Failed to initialize required module: ${moduleInfo.name}`);
                }
            }
        }
        
        // Emit event for successful initialization
        EventBus.emit('ALL_MODULES_INITIALIZED');
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
        GameState.set('currentScreen', 'character-select');
        GameState.set('battleOver', false);
        GameState.set('selectedGems', new Set());
        
        // Reset UI
        EventBus.emit('SCREEN_CHANGE', 'characterSelect');
        
        console.log("Game reset complete");
    }
    
    // Public interface
    return {
        initialize,
        reset,
        getScreenManager: () => screenManager
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