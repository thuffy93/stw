// main.js - Updated to use proper ES6 module imports and initialization

// Core system imports
import { EventBus } from './core/eventbus.js';
import { Config } from './core/config.js';
import { GameState } from './core/state.js';
import { Utils } from './core/utils.js';
import { Storage } from './core/storage.js';

// UI system imports
import { initializeComponentUI } from './ui/integration.js';

// Game system imports
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
          // Setup core EventBus listeners
          setupEventBusListeners();
          
          // Initialize the component UI architecture
          initializeComponentUI();
          
          // Initialize all core systems in the correct order
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
            // Emit UI update event for screen change
            EventBus.emit('UI_UPDATE', { target: 'screen', screen });
        });
        
        // Selection events
        EventBus.on('GEM_SELECT', ({ index, context }) => {
            EventHandler.toggleGemSelection(index, context === 'shop');
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