// Renderer.js - Ensuring proper integration of BaseRenderer and GemRenderer

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
  
  // Initialize audio controls
  if (typeof BaseRenderer.initializeAudioControls === 'function') {
    BaseRenderer.initializeAudioControls();
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
}

// Export a unified Renderer that combines both modules
export const Renderer = {
  // Core initialization
  initialize,
  
  // BaseRenderer methods
  updateActiveScreen: BaseRenderer.updateActiveScreen,
  showMessage: BaseRenderer.showMessage,
  updateBattleUI: BaseRenderer.updateBattleUI,
  updateShopUI: BaseRenderer.updateShopUI,
  updateGemCatalogUI: BaseRenderer.updateGemCatalogUI,
  updateCampUI: BaseRenderer.updateCampUI,
  showDamageAnimation: BaseRenderer.showDamageAnimation,
  showVictoryEffect: BaseRenderer.showVictoryEffect,
  showDefeatEffect: BaseRenderer.showDefeatEffect,
  
  // UIManager consolidated functions
  showLoading: BaseRenderer.showLoading, 
  hideLoading: BaseRenderer.hideLoading,
  showError: BaseRenderer.showError,
  hideError: BaseRenderer.hideError,
  toggleAudio: BaseRenderer.toggleAudio,
  initializeAudioControls: BaseRenderer.initializeAudioControls,
  
  // GemRenderer methods
  renderHand: GemRenderer.renderHand,
  renderShopHand: GemRenderer.renderShopHand,
  createGemElement: GemRenderer.createGemElement,
  updateGemDisplay: GemRenderer.updateGemDisplay,
  updateGemSelection: GemRenderer.updateGemSelection,
  renderUnlockedGems: GemRenderer.renderUnlockedGems,
  renderAvailableGems: GemRenderer.renderAvailableGems,
  
  // Helper method to determine which renderer to use based on context
  getRendererForContext(context) {
    const gemContexts = ['hand', 'catalog', 'shop'];
    if (gemContexts.includes(context)) {
      return GemRenderer;
    }
    return BaseRenderer;
  }
};

// Also export as default for ES modules
export default Renderer;