// Main entry point for Super Tiny World with direct initialization (no ModuleLoader)
import { EventBus } from './core/eventbus.js';
import { Config } from './core/config.js';
import { GameState } from './core/state.js';
import { Utils } from './core/utils.js';
import { Storage } from './core/storage.js';
import Renderer from './ui/renderer.js';
import { Character } from './systems/character.js';
import { Gems } from './systems/gem.js';
import { Battle } from './systems/battle.js';
import { Shop } from './systems/shop.js';
import { EventHandler } from './systems/eventHandler.js';

// Flag to track initialization status
let gameInitialized = false;

/**
 * Initialize the game with direct module initialization
 */
function initializeGame() {
    if (gameInitialized) {
        console.log("Game already initialized");
        return true;
    }
    
    console.log("Starting Super Tiny World initialization...");
    
    try {
        // STEP 1: Register modules globally
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
        
        // STEP 2: Set up event listeners
        setupEventListeners();
        
        // STEP 3: Initialize modules directly in the correct order
        console.log("Initializing modules directly...");
        
        // 3.1: Initialize basic utilities first
        console.log("Initializing Utils...");
        if (typeof Utils.initialize === 'function') Utils.initialize();
        
        // 3.2: Initialize state management
        console.log("Initializing GameState...");
        if (typeof GameState.initialize === 'function') GameState.initialize();
        
        // 3.3: Initialize storage
        console.log("Initializing Storage...");
        if (typeof Storage.initialize === 'function') Storage.initialize();
        
        // 3.4: Initialize UI renderer
        console.log("Initializing Renderer...");
        if (typeof Renderer.initialize === 'function') Renderer.initialize();
        
        // 3.5: Initialize game systems
        console.log("Initializing Gems...");
        if (typeof Gems.initialize === 'function') Gems.initialize();
        
        console.log("Initializing Character...");
        if (typeof Character.initialize === 'function') Character.initialize();
        
        console.log("Initializing Battle...");
        if (typeof Battle.initialize === 'function') Battle.initialize();
        
        console.log("Initializing Shop...");
        if (typeof Shop.initialize === 'function') Shop.initialize();
        
        console.log("Initializing EventHandler...");
        if (typeof EventHandler.initialize === 'function') EventHandler.initialize();
        
        // STEP 4: Start the game
        console.log("Switching to character select screen...");
        EventBus.emit('SCREEN_CHANGE', 'characterSelect');
        
        // Mark initialization as complete
        gameInitialized = true;
        console.log("Game initialization completed successfully!");
        
        return true;
    } catch (error) {
        console.error("Critical error during game initialization:", error);
        alert("Error initializing game. See console for details.");
        return false;
    }
}

/**
 * Set up core event listeners
 */
function setupEventListeners() {
    // Core system events
    EventBus.on('SAVE_GAME_STATE', () => {
        if (Storage && typeof Storage.saveGameState === 'function') {
            Storage.saveGameState();
        }
    });
    
    EventBus.on('LOAD_GAME_STATE', () => {
        if (Storage && typeof Storage.loadGameState === 'function') {
            Storage.loadGameState();
        }
    });
    
    EventBus.on('SAVE_META_ZENNY', () => {
        if (Storage && typeof Storage.saveMetaZenny === 'function') {
            Storage.saveMetaZenny();
        }
    });
    
    // Screen management
    EventBus.on('SCREEN_CHANGE', (screen) => {
        console.log("Screen change event:", screen);
        // Use updateActiveScreen if available, else fallback to switchScreen
        if (Renderer) {
            if (typeof Renderer.updateActiveScreen === 'function') {
                Renderer.updateActiveScreen(screen);
            } else if (typeof Renderer.switchScreen === 'function') {
                Renderer.switchScreen(screen);
            } else {
                console.error("No screen change method found in Renderer");
            }
        } else {
            console.error("Renderer not available for screen change");
        }
    });
    
    // Selection events
    EventBus.on('GEM_SELECT', ({ index, context }) => {
        if (EventHandler && typeof EventHandler.toggleGemSelection === 'function') {
            EventHandler.toggleGemSelection(index, context === 'shop');
        }
    });
}

/**
 * Reset the game state
 */
function resetGame() {
    // Reset state
    if (GameState) {
        GameState.set('currentScreen', 'characterSelect');
        GameState.set('battleOver', false);
        GameState.set('selectedGems', new Set());
    }
    
    // Reset UI
    EventBus.emit('SCREEN_CHANGE', 'characterSelect');
    
    console.log("Game reset complete");
}

// Set up initialization to happen after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM content loaded, initializing game");
    initializeGame();
});

// Expose functions globally for convenience
window.Game = {
    initialize: initializeGame,
    reset: resetGame
};

// Backup initialization for older browsers
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    console.log("Document already interactive/complete, initializing game");
    setTimeout(initializeGame, 100);
}

export default {
    initialize: initializeGame,
    reset: resetGame
};