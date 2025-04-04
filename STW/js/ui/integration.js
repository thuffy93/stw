// STW/js/ui/integration.js
import { uiManager } from './UIManager.js';
import { EventBus } from '../core/eventbus.js';
import { GameState } from '../core/state.js';

// Import screen components for initial registration
import { CharacterSelectScreen } from './components/screens/CharacterSelectScreen.js';

/**
 * Initialize the new UI component architecture and connect it to the existing game
 */
export function initializeComponentUI() {
  console.log("Initializing component-based UI architecture");
  
  // Initialize UI Manager
  uiManager.initialize();
  
  // Register initial screens
  registerInitialScreens();
  
  // Setup bridge between old and new UI systems
  setupLegacyBridge();
  
  console.log("Component UI architecture initialized");
}

/**
 * Register initial screen components
 */
function registerInitialScreens() {
  // Register character select screen (starting point)
  uiManager.registerScreen('characterSelect', new CharacterSelectScreen());
  
  // Other screens will be lazy-loaded when needed
}

/**
 * Setup a bridge between legacy UI code and new component architecture
 */
function setupLegacyBridge() {
  // Listen for events from old renderer/UI system and forward to component UI
  
  // Listen for screen change events from old system
  const originalScreenChange = EventBus.subscribe('SCREEN_CHANGE');
  EventBus.on('SCREEN_CHANGE', (screenName) => {
    // Update GameState to match
    GameState.set('currentScreen', screenName);
    
    // Let the UI Manager handle the screen transition
    uiManager.switchScreen(screenName);
  });
  
  // Listen for UI updates from game logic
  EventBus.on('UI_UPDATE', (data) => {
    // Forward to UI Manager
    uiManager.handleUIUpdate(data);
  });
  
  // Listen for hand updates
  EventBus.on('HAND_UPDATED', () => {
    // Get hand data from GameState
    const hand = GameState.get('hand');
    
    // Forward to UI Manager
    uiManager.handleUIUpdate({ 
      target: 'battle',
      hand: hand
    });
  });
  
  // Listen for gem selection
  EventBus.on('GEM_SELECTION_CHANGED', (data) => {
    // Forward to UI Manager
    uiManager.handleUIUpdate({
      target: 'battle',
      selectedIndices: data.selectedIndices
    });
  });
  
  // Handle legacy renderer messages
  const originalMessageEvent = EventBus.subscribe('UI_MESSAGE');
  EventBus.on('UI_MESSAGE', (data) => {
    // Let the UI Manager handle the message
    uiManager.showMessage(data);
  });
}

/**
 * Clean up UI component resources
 */
export function cleanupComponentUI() {
  // Clean up UI Manager
  uiManager.cleanup();
}