// STW/js/ui/components/battle/HandComponent.js
import { Component } from '../Component.js';
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
    this.gemElements = [];
    this.selectedIndices = new Set();
    
    // Subscribe to events
    this.subscribeToEvent('HAND_UPDATED', this.updateHand);
    this.subscribeToEvent('GEM_SELECTION_CHANGED', this.updateSelection);
  }
  
  /**
   * Update the hand with new gems
   */
  updateHand() {
    // Get hand from GameState
    const hand = GameState.get('hand') || [];
    
    // Clear existing gems
    if (this.element) {
      this.element.innerHTML = '';
    }
    
    // Clear element references
    this.gemElements = [];
    
    // Add each gem to the hand
    hand.forEach((gem, index) => {
      const isSelected = this.selectedIndices.has(index);
      const gemElement = this.createGemElement(gem, index, isSelected);
      
      // Store reference
      this.gemElements.push(gemElement);
      
      // Add to DOM
      if (this.element) {
        this.element.appendChild(gemElement);
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
   * Create a gem element
   * @param {Object} gem - Gem data
   * @param {Number} index - Index in hand
   * @param {Boolean} isSelected - Whether selected
   * @returns {HTMLElement} Created gem element
   */
  createGemElement(gem, index, isSelected) {
    const gemElement = document.createElement('div');
    gemElement.className = `gem ${gem.color}${isSelected ? ' selected' : ''}`;
    gemElement.setAttribute('data-index', index);
    
    // Check for class bonus
    const playerClass = GameState.get('player.class');
    const hasBonus = (playerClass === "Knight" && gem.color === "red") ||
                     (playerClass === "Mage" && gem.color === "blue") ||
                     (playerClass === "Rogue" && gem.color === "green");
    
    if (hasBonus) {
      gemElement.classList.add("class-bonus");
    }
    
    // Create content structure
    const gemContent = document.createElement('div');
    gemContent.className = 'gem-content';
    
    // Add icon
    const gemIcon = document.createElement('div');
    gemIcon.className = 'gem-icon';
    gemIcon.textContent = this.getGemSymbol(gem);
    gemContent.appendChild(gemIcon);
    
    // Add value
    if (gem.damage || gem.heal || gem.poison) {
      const gemValue = document.createElement('div');
      gemValue.className = 'gem-value';
      gemValue.textContent = gem.damage || gem.heal || gem.poison || "";
      gemContent.appendChild(gemValue);
    }
    
    // Add name (hidden in battle/shop, shown in catalog)
    const gemName = document.createElement('div');
    gemName.className = 'gem-name';
    gemName.textContent = gem.name;
    gemContent.appendChild(gemName);
    
    gemElement.appendChild(gemContent);
    
    // Add cost
    const gemCost = document.createElement('div');
    gemCost.className = 'gem-cost';
    gemCost.textContent = gem.cost;
    gemElement.appendChild(gemCost);
    
    // Add tooltip
    const tooltip = this.buildGemTooltip(gem, hasBonus);
    gemElement.setAttribute('data-tooltip', tooltip);
    
    // Add click handler
    gemElement.addEventListener('click', () => {
      EventBus.emit('GEM_SELECT', { 
        index, 
        context: this.context 
      });
    });
    
    return gemElement;
  }
  
  /**
   * Get a symbol for a gem
   * @param {Object} gem - Gem data
   * @returns {String} Symbol
   */
  getGemSymbol(gem) {
    if (gem.shield) return "🛡️";
    if (gem.poison) return "☠️";
    
    if (gem.damage) {
      if (gem.name.includes("Strong")) return "⚔️";
      if (gem.name.includes("Quick")) return "⚡";
      if (gem.name.includes("Burst")) return "💥";
      return "🗡️";
    }
    
    if (gem.heal) {
      if (gem.name.includes("Strong")) return "❤️";
      return "💚";
    }
    
    return "✨";
  }
  
  /**
   * Build tooltip text for a gem
   * @param {Object} gem - Gem data
   * @param {Boolean} hasBonus - Whether gem has class bonus
   * @returns {String} Tooltip text
   */
  buildGemTooltip(gem, hasBonus) {
    let tooltip = '';
    
    if (gem.damage) {
      tooltip += `DMG: ${gem.damage}`;
      if (hasBonus) tooltip += ' (+50%)';
    }
    
    if (gem.heal) {
      if (tooltip) tooltip += ' | ';
      tooltip += `HEAL: ${gem.heal}`;
      if (hasBonus) tooltip += ' (+50%)';
    }
    
    if (gem.shield) {
      if (tooltip) tooltip += ' | ';
      tooltip += 'SHIELD';
    }
    
    if (gem.poison) {
      if (tooltip) tooltip += ' | ';
      tooltip += `PSN: ${gem.poison}`;
      if (hasBonus) tooltip += ' (+50%)';
    }
    
    tooltip += ` | (${gem.cost}⚡)`;
    
    return tooltip;
  }
  
  /**
   * Update gem selection
   * @param {Object} data - Selection data
   */
  updateSelection(data) {
    const { selectedIndices } = data;
    
    if (!selectedIndices) return;
    
    // Update internal state
    this.selectedIndices = new Set(selectedIndices);
    
    // Update gem elements
    this.gemElements.forEach((element, index) => {
      if (this.selectedIndices.has(index)) {
        element.classList.add('selected');
      } else {
        element.classList.remove('selected');
      }
    });
  }
  
  /**
   * Override render to update hand contents
   */
  render() {
    const element = super.render();
    this.updateHand();
    return element;
  }
}

export default HandComponent;