// Renderer.js - Facade for BaseRenderer and GemRenderer
import { BaseRenderer } from './baseRenderer.js';
import { GemRenderer } from './gemRenderer.js';

/**
 * Initialize both renderers
 */
export function initialize() {
  console.log("Initializing Unified Renderer");
  
  // Initialize both sub-renderers
  BaseRenderer.initialize();
  GemRenderer.initialize();
  
  return true;
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
  
  // GemRenderer methods
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