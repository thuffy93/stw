// renderer.js - Simplified to use BaseRenderer for screen management

import { EventBus } from '../core/eventbus.js';
import { BaseRenderer } from './baseRenderer.js';
import { GemRenderer } from './gemRenderer.js';

/**
 * Initialize both renderers
 */
export function initialize() {
  console.log("Initializing Unified Renderer");
  
  // Initialize both sub-renderers
  if (typeof BaseRenderer.initialize === 'function') {
    BaseRenderer.initialize();
  }
  
  if (typeof GemRenderer.initialize === 'function') {
    GemRenderer.initialize();
  }
  
  // Set up event listeners for UI functions
  setupRendererEventListeners();
  
  return true;
}

/**
 * Set up event listeners for renderer functions
 */
function setupRendererEventListeners() {
  // Loading indicators
  EventBus.on('LOADING_START', ({message = 'Loading...'}) => {
    BaseRenderer.showLoading(message);
  });
  
  EventBus.on('LOADING_END', () => {
    BaseRenderer.hideLoading();
  });
  
  // Error handling
  EventBus.on('ERROR_SHOW', ({message, isFatal = false}) => {
    BaseRenderer.showError(message, isFatal);
  });
  
  EventBus.on('ERROR_HIDE', () => {
    BaseRenderer.hideError();
  });
  
  // Animation and effects
  EventBus.on('SHOW_DAMAGE', (data) => {
    BaseRenderer.showDamageAnimation(data);
  });
  
  EventBus.on('SHOW_VICTORY', () => {
    BaseRenderer.showVictoryEffect();
  });
  
  EventBus.on('SHOW_DEFEAT', () => {
    BaseRenderer.showDefeatEffect();
  });
  
  // UI updates
  EventBus.on('UI_UPDATE', ({ target }) => {
    switch (target) {
      case 'battle':
        BaseRenderer.updateBattleUI();
        break;
      case 'shop':
        BaseRenderer.updateShopUI();
        break;
      case 'gemCatalog':
        BaseRenderer.updateGemCatalogUI();
        break;
      case 'camp':
        BaseRenderer.updateCampUI();
        break;
    }
  });
}

// Export a unified Renderer that combines both modules
export const Renderer = {
  // Core initialization
  initialize,
  
  // Screen management (delegated to BaseRenderer)
  updateActiveScreen: BaseRenderer.updateActiveScreen,
  registerScreen: BaseRenderer.registerScreen,
  
  // UI messaging
  showMessage: BaseRenderer.showMessage,
  
  // UI updates
  updateBattleUI: BaseRenderer.updateBattleUI,
  updateShopUI: BaseRenderer.updateShopUI,
  updateGemCatalogUI: BaseRenderer.updateGemCatalogUI,
  updateCampUI: BaseRenderer.updateCampUI,
  
  // UI animations
  showDamageAnimation: BaseRenderer.showDamageAnimation,
  showVictoryEffect: BaseRenderer.showVictoryEffect,
  showDefeatEffect: BaseRenderer.showDefeatEffect,
  
  // Loading and error handling
  showLoading: BaseRenderer.showLoading, 
  hideLoading: BaseRenderer.hideLoading,
  showError: BaseRenderer.showError,
  hideError: BaseRenderer.hideError,
  
  // GemRenderer methods (for gem-specific rendering)
  renderHand: GemRenderer.renderHand,
  renderShopHand: GemRenderer.renderShopHand,
  createGemElement: GemRenderer.createGemElement,
  updateGemDisplay: GemRenderer.updateGemDisplay,
  updateGemSelection: GemRenderer.updateGemSelection,
  renderUnlockedGems: GemRenderer.renderUnlockedGems,
  renderAvailableGems: GemRenderer.renderAvailableGems
};

// Also export as default for ES modules
export default Renderer;