const Game = (() => {
  let initialized = false;
  
  const criticalComponents = [
      { name: 'EventBus', check: () => typeof EventBus !== 'undefined' },
      { name: 'State', check: () => typeof State !== 'undefined' && State.get && State.set },
      { name: 'UI', check: () => typeof UI !== 'undefined' && UI.initialize && UI.switchScreen },
      { name: 'Gems', check: () => typeof Gems !== 'undefined' && Gems.resetGemBag },
      { name: 'Battle', check: () => typeof Battle !== 'undefined' && Battle.startBattle },
      { name: 'Shop', check: () => typeof Shop !== 'undefined' && Shop.prepareShop },
      { name: 'Storage', check: () => typeof Storage !== 'undefined' && Storage.saveGameState }
  ];
  
  function setupEventBusListeners() {
      // Core system events
      EventBus.subscribe('GAME_SAVE', () => Storage.saveGameState());
      EventBus.subscribe('GAME_LOAD', () => Storage.loadGameState());
      
      // UI events
      EventBus.subscribe('SCREEN_CHANGE', (screen) => UI.switchScreen(screen));
      EventBus.subscribe('SHOW_MESSAGE', ({ message, type }) => UI.showMessage(message, type));
      
      // Debug events
      EventBus.subscribe('DEBUG_LOG', (data) => console.log('[DEBUG]', data));
  }
  
  function initialize() {
      if (initialized) {
          console.warn("Game already initialized");
          return;
      }
      
      console.log("Initializing Super Tiny World (EventBus Version)");
      
      if (!checkComponentsReady()) {
          EventBus.publish('SHOW_MESSAGE', {
              message: "Missing critical components!",
              type: "error"
          });
          return;
      }
      
      try {
          // Setup core listeners first
          setupEventBusListeners();
          
          // Initialize modules
          UI.initialize(EventBus);
          Storage.loadAllSavedData();
          Battle.initialize(EventBus);
          Shop.initialize(EventBus);
          
          // Start at character selection
          EventBus.publish('SCREEN_CHANGE', 'characterSelect');
          
          // Hide loading screen
          if (UI.hideLoading) UI.hideLoading();
          
          initialized = true;
          console.log("Game initialized with EventBus architecture");
      } catch (error) {
          console.error("Initialization error:", error);
          EventBus.publish('SHOW_MESSAGE', {
              message: "Failed to initialize game!",
              type: "error"
          });
      }
  }
  
  return {
      initialize
  };
})();

// Initialize when ready
if (document.readyState === 'complete') {
  setTimeout(Game.initialize, 100);
} else {
  document.addEventListener('DOMContentLoaded', Game.initialize);
}