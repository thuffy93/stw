// STW/js/ui/integration.js
import { uiManager } from './UIManager.js';
import { EventBus } from '../core/eventbus.js';
import { GameState } from '../core/state.js';

// Import screen components
import { CharacterSelectScreen } from './components/screens/CharacterSelectScreen.js';
import { BattleScreen } from './components/screens/BattleScreen.js';
import { ShopScreen } from './components/screens/ShopScreen.js';
import { GemCatalogScreen } from './components/screens/GemCatalogscreen.js';
import { CampScreen } from './components/screens/CampScreen.js';

/**
 * Initialize the new UI component architecture and connect it to the existing game
 */
export function initializeComponentUI() {
  console.log("Initializing component-based UI architecture");
  
  // Initialize UI Manager
  uiManager.initialize();
  
  // Register all screen components
  registerAllScreens();
  
  // Setup bridge between old and new UI systems
  setupLegacyBridge();
  
  console.log("Component UI architecture initialized");
}

/**
 * Register all screen components
 */
function registerAllScreens() {
  // Register all screen components at startup for immediate availability
  uiManager.registerScreen('characterSelect', new CharacterSelectScreen());
  uiManager.registerScreen('battle', new BattleScreen());
  uiManager.registerScreen('shop', new ShopScreen());
  uiManager.registerScreen('gemCatalog', new GemCatalogScreen());
  uiManager.registerScreen('camp', new CampScreen());
}

/**
 * Setup a bridge between legacy UI code and new component architecture
 */
function setupLegacyBridge() {
  // Listen for events from old renderer/UI system and forward to component UI
  
  // Listen for screen change events from old system
  EventBus.on('SCREEN_CHANGE', (screenName) => {
    // Update GameState to match
    if (typeof screenName === 'string') {
      GameState.set('currentScreen', screenName);
      
      // Let the UI Manager handle the screen transition
      uiManager.switchScreen(screenName);
    } else if (screenName && screenName.screen) {
      // Handle object format { screen: 'screenName' }
      GameState.set('currentScreen', screenName.screen);
      
      // Let the UI Manager handle the screen transition
      uiManager.switchScreen(screenName.screen);
    }
  });
  
  // Listen for UI updates from game logic
  EventBus.on('UI_UPDATE', (data) => {
    // Forward to UI Manager
    uiManager.handleUIUpdate(data);
  });
  
  // Listen for battle updates
  EventBus.on('BATTLE_UI_UPDATE', (data) => {
    uiManager.handleUIUpdate({
      target: 'battle',
      ...data
    });
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
  
  // Listen for shop updates
  EventBus.on('SHOP_PREPARED', () => {
    uiManager.handleUIUpdate({
      target: 'shop'
    });
  });
  
  // Listen for gem selection
  EventBus.on('GEM_SELECTION_CHANGED', (data) => {
    // Forward to UI Manager for battle and shop screens
    uiManager.handleUIUpdate({
      target: GameState.get('currentScreen'),
      selectedIndices: data.selectedIndices
    });
  });
  
  // Handle legacy renderer messages
  EventBus.on('UI_MESSAGE', (data) => {
    // Let the UI Manager handle the message
    uiManager.showMessage(data);
  });
  
  // Handle special effects
  EventBus.on('SHOW_DAMAGE', (data) => {
    uiManager.handleUIUpdate({
      target: 'battle',
      effect: 'damage',
      data: data
    });
  });
  
  EventBus.on('SHOW_VICTORY', () => {
    uiManager.handleUIUpdate({
      target: 'battle',
      effect: 'victory'
    });
  });
  
  EventBus.on('SHOW_DEFEAT', () => {
    uiManager.handleUIUpdate({
      target: 'battle',
      effect: 'defeat'
    });
  });
  
  // Listen for state changes that should update UI
  GameState.addListener('player', (property, newValue) => {
    uiManager.handleUIUpdate({
      target: GameState.get('currentScreen'),
      player: newValue
    });
  });
  
  GameState.addListener('battle.enemy', (property, newValue) => {
    if (GameState.get('currentScreen') === 'battle') {
      uiManager.handleUIUpdate({
        target: 'battle',
        enemy: newValue
      });
    }
  });
  
  GameState.addListener('metaZenny', (property, newValue) => {
    uiManager.handleUIUpdate({
      target: GameState.get('currentScreen'),
      metaZenny: newValue
    });
  });
  
  GameState.addListener('inUpgradeMode', (property, newValue) => {
    if (GameState.get('currentScreen') === 'shop') {
      uiManager.handleUIUpdate({
        target: 'shop',
        inUpgradeMode: newValue
      });
    }
  });
}

/**
 * Clean up UI component resources
 */
export function cleanupComponentUI() {
  // Clean up UI Manager
  uiManager.cleanup();
}