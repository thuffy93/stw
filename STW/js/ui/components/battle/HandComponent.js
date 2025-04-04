// STW/js/ui/components/battle/HandComponent.js
import { Component } from '../Component.js';
import { GemComponent } from '../common/GemComponent.js';
import { EventBus } from '../../../core/eventbus.js';
import { GameState } from '../../../core/state.js';

/**
 * Component for displaying and managing the player's hand of gems
 */
export class HandComponent extends Component {
  /**
   * Create a new hand component
   * @param {Object} options - Component options
   * @param {String} options.context - Context (battle, shop)
   * @param {String} options.id - Component ID (defaults to 'hand' for battle or 'shop-hand' for shop)
   */
  constructor(options = {}) {
    const { 
      context = 'battle',
      id = context === 'battle' ? 'hand' : 'shop-hand'
    } = options;
    
    // Create container template
    const template = `<div id="${id}" class="hand-container ${context}"></div>`;
    
    // Initialize component
    super(id, template);
    
    // Store properties
    this.context = context;
    this.gemComponents = [];
    this.selectedIndices = new Set();
    
    // Subscribe to events
    const updateEvent = context === 'battle' ? 'HAND_UPDATED' : 'SHOP_HAND_UPDATED';
    this.subscribeToEvent(updateEvent, this.updateHand);
    
    this.subscribeToEvent('GEM_SELECTION_CHANGED', this.updateSelection);
  }
  
  /**
   * Update the hand with new gems
   * @param {Array} hand - New hand data (optional, will fetch from GameState if not provided)
   */
  updateHand(hand) {
    // If hand is not provided, get it from GameState
    if (!hand || !Array.isArray(hand)) {
      hand = GameState.get('hand') || [];
    }
    
    // Clear existing gems
    if (this.element) {
      this.element.innerHTML = '';
    }
    
    // Clear component references
    this.gemComponents = [];
    
    // Create gem components for each gem in hand
    hand.forEach((gem, index) => {
      const isSelected = this.selectedIndices.has(index);
      
      // Create options for gem component
      const gemOptions = {
        context: this.context,
        isSelected: isSelected,
        isUnlearned: this.isGemUnlearned(gem)
      };
      
      // Create gem component
      const gemComponent = new GemComponent(gem, index, gemOptions);
      
      // Add to tracking array
      this.gemComponents.push(gemComponent);
      
      // Render and add to hand container
      if (this.element) {
        this.element.appendChild(gemComponent.render());
      }
    });
    
    // Show empty state if no gems
    if (hand.length === 0 && this.element) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-hand-message';
      emptyMessage.textContent = 'Your hand is empty';
      this.element.appendChild(emptyMessage);
    }
  }
  
  /**
   * Update the selection state of gems
   * @param {Object} data - Selection data
   */
  updateSelection(data) {
    const { selectedIndices } = data;
    
    if (!selectedIndices) return;
    
    // Update internal state
    this.selectedIndices = new Set(selectedIndices);
    
    // Update gem components
    this.gemComponents.forEach((gemComponent, index) => {
      gemComponent.update({ isSelected: this.selectedIndices.has(index) });
    });
  }
  
  /**
   * Check if a gem is unlearned by the player
   * @param {Object} gem - Gem data
   * @returns {Boolean} Whether the gem is unlearned
   */
  isGemUnlearned(gem) {
    // Generate gem key based on color and name
    const gemKey = `${gem.color}${gem.name.replace(/\s+/g, '')}`;
    
    // Get proficiency data
    const proficiency = GameState.get('gemProficiency');
    
    // Check if proficiency data exists and if failure chance is greater than 0
    return proficiency && 
           proficiency[gemKey] && 
           proficiency[gemKey].failureChance > 0;
  }
  
  /**
   * Override render method to populate hand
   */
  render() {
    const element = super.render();
    
    // Get initial hand data and update
    const hand = GameState.get('hand') || [];
    this.updateHand(hand);
    
    return element;
  }
  
  /**
   * Play animation for a gem being played
   * @param {Number} index - Index of gem to animate
   * @returns {Promise} Promise that resolves when animation completes
   */
  playGemAnimation(index) {
    if (index < 0 || index >= this.gemComponents.length) {
      return Promise.resolve();
    }
    
    return this.gemComponents[index].playAnimation();
  }
  
  /**
   * Play shake animation for a gem (invalid action)
   * @param {Number} index - Index of gem to animate
   */
  shakeGem(index) {
    if (index < 0 || index >= this.gemComponents.length) return;
    
    this.gemComponents[index].shakeAnimation();
  }
  
  /**
   * Update component with new data
   * @param {Object} data - Update data
   */
  update(data) {
    if (data.hand) {
      this.updateHand(data.hand);
    }
    
    if (data.selectedIndices) {
      this.updateSelection({ selectedIndices: data.selectedIndices });
    }
  }
}