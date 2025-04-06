// ui/components/gem/GemComponent.js - Updated with standardized event patterns
import { Component } from '../Component.js';
import { EventBus } from '../../../core/eventbus.js';
import { GameState } from '../../../core/state.js';

/**
 * Component for displaying and interacting with a gem
 * Refactored to use standardized ES6 event patterns
 */
export class GemComponent extends Component {
  /**
   * Create a new gem component
   * @param {Object} gem - Gem data to display
   * @param {Number} index - Index of the gem in the hand
   * @param {Object} options - Component options
   * @param {Boolean} options.isSelected - Whether the gem is initially selected
   * @param {String} options.context - Context for the gem (battle, shop, catalog, upgrade)
   * @param {Boolean} options.isClickable - Whether the gem is clickable
   * @param {String} options.size - Size of the gem (normal, small, large)
   */
  constructor(gem, index, options = {}) {
    // Extract options with defaults
    const { 
      isSelected = false, 
      context = 'battle',
      isClickable = true,
      size = 'normal'
    } = options;
    
    // Create a unique ID for this gem
    const id = `gem-${context}-${index}`;
    
    // Generate tooltip text
    const tooltipText = GemComponent.buildGemTooltip(gem, GemComponent.hasClassBonus(gem));
    
    // Size class
    const sizeClass = size !== 'normal' ? ` gem-${size}` : '';
    
    // Create the component with appropriate template
    super(id, `
      <div class="gem ${gem.color}${isSelected ? ' selected' : ''}${GemComponent.hasClassBonus(gem) ? ' class-bonus' : ''}${sizeClass}" 
           data-index="${index}" 
           data-gem-id="${gem.id || ''}"
           data-tooltip="${tooltipText}"
           ${isClickable ? '' : 'data-no-click="true"'}>
        <div class="gem-content">
          <div class="gem-icon">${GemComponent.getGemSymbol(gem, context)}</div>
          <div class="gem-value">${gem.damage || gem.heal || gem.poison || ''}</div>
          <div class="gem-name">${gem.name}</div>
        </div>
        <div class="gem-cost">${gem.cost}</div>
      </div>
    `);
    
    // Store properties
    this.gem = gem;
    this.index = index;
    this.context = context;
    this.isSelected = isSelected;
    this.isClickable = isClickable;
    
    // Add click handler for gem selection if clickable
    if (isClickable) {
      this.addEventListener('.', 'click', this.handleClick);
    }
  }
  
  /**
   * Handle click on the gem with standardized event emission
   */
  handleClick() {
    // Skip if not clickable
    if (!this.isClickable) return;
    
    // Emit appropriate event based on context with consistent data pattern
    switch (this.context) {
      case 'shop':
        EventBus.emit('GEM_SELECT', { 
          index: this.index, 
          gem: this.gem,
          context: 'shop',
          timestamp: Date.now()
        });
        break;
        
      case 'battle':
        EventBus.emit('GEM_SELECT', { 
          index: this.index,
          gem: this.gem,
          context: 'battle',
          timestamp: Date.now()
        });
        break;
        
      case 'catalog':
        EventBus.emit('GEM_CATALOG_SELECT', { 
          gemKey: this.gem.key || `${this.gem.color}${this.gem.name.replace(/\s+/g, '')}`,
          gem: this.gem,
          timestamp: Date.now()
        });
        break;
        
      case 'upgrade':
        EventBus.emit('UPGRADE_OPTION_SELECTED', { 
          poolIndex: this.index,
          gem: this.gem,
          timestamp: Date.now()
        });
        break;
        
      default:
        // Generic event
        EventBus.emit('GEM_INTERACTION', {
          index: this.index,
          gem: this.gem,
          context: this.context,
          timestamp: Date.now()
        });
    }
    
    // Play sound effect with consistent event format
    EventBus.emit('PLAY_SOUND', { 
      sound: 'GEM_CLICK', 
      context: this.context
    });
  }
  
  /**
   * Update the gem's selection state
   * @param {Boolean} isSelected - Whether the gem should be selected
   */
  update({ isSelected }) {
    if (isSelected !== undefined && isSelected !== this.isSelected) {
      this.isSelected = isSelected;
      
      if (this.element) {
        if (isSelected) {
          this.element.classList.add('selected');
        } else {
          this.element.classList.remove('selected');
        }
      }
      
      // Emit update event with consistent format
      EventBus.emit('GEM_COMPONENT_UPDATED', {
        gemId: this.gem.id,
        index: this.index,
        isSelected: this.isSelected,
        context: this.context,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Check if a gem has a class bonus for the current player
   * @static
   * @param {Object} gem - Gem to check
   * @returns {Boolean} Whether the gem has a class bonus
   */
  static hasClassBonus(gem) {
    const playerClass = GameState.get('player.class');
    
    return (playerClass === "Knight" && gem.color === "red") ||
           (playerClass === "Mage" && gem.color === "blue") ||
           (playerClass === "Rogue" && gem.color === "green");
  }

  /**
   * Get an appropriate symbol for a gem based on its type
   * @static
   * @param {Object} gem - Gem data
   * @param {String} context - Display context
   * @returns {String} Symbol to display
   */
  static getGemSymbol(gem, context = 'battle') {
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
    
    return "✨"; // Generic fallback
  }

  /**
   * Build tooltip text for a gem
   * @static
   * @param {Object} gem - Gem data
   * @param {Boolean} hasBonus - Whether gem has class bonus
   * @returns {String} Tooltip text
   */
  static buildGemTooltip(gem, hasBonus) {
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
   * Create a gem component from data
   * @static
   * @param {Object} gem - Gem data
   * @param {Number} index - Index in collection
   * @param {Object} options - Options for creation
   * @returns {GemComponent} New gem component
   */
  static create(gem, index, options = {}) {
    return new GemComponent(gem, index, options);
  }
}

export default GemComponent;