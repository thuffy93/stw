// ui/components/gem/GemComponent.js
import { Component } from '../Component.js';
import { EventBus } from '../../../core/eventbus.js';
import { GameState } from '../../../core/state.js';

/**
 * Component for displaying and interacting with a gem
 */
export class GemComponent extends Component {
  /**
   * Create a new gem component
   * @param {Object} gem - Gem data to display
   * @param {Number} index - Index of the gem in the hand
   * @param {Boolean} isSelected - Whether the gem is initially selected
   * @param {String} context - Context for the gem (battle, shop, catalog)
   */
  constructor(gem, index, isSelected = false, context = 'battle') {
    // Create a unique ID for this gem
    const id = `gem-${context}-${index}`;
    
    // Generate tooltip text
    const tooltipText = buildGemTooltip(gem, hasClassBonus(gem));
    
    // Create the component with appropriate template
    super(id, `
      <div class="gem ${gem.color}${isSelected ? ' selected' : ''}${hasClassBonus(gem) ? ' class-bonus' : ''}" 
           data-index="${index}" 
           data-tooltip="${tooltipText}">
        <div class="gem-content">
          <div class="gem-icon">${getGemSymbol(gem, context)}</div>
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
    
    // Add click handler for gem selection
    this.addEventListener('.', 'click', this.handleClick);
  }
  
  /**
   * Handle click on the gem
   */
  handleClick() {
    // Dispatch event based on context
    if (this.context === 'shop') {
      EventBus.emit('GEM_SELECT', { 
        index: this.index, 
        context: 'shop' 
      });
    } else if (this.context === 'battle') {
      EventBus.emit('GEM_SELECT', { 
        index: this.index, 
        context: 'battle' 
      });
    } else if (this.context === 'catalog') {
      EventBus.emit('GEM_CATALOG_SELECT', { 
        gemKey: this.gem.key,
        gem: this.gem
      });
    }
    
    // Play sound effect
    EventBus.emit('PLAY_SOUND', { sound: 'UI_CLICK' });
  }
  
  /**
   * Update the gem's selection state
   * @param {Boolean} isSelected - Whether the gem should be selected
   */
  update(isSelected) {
    this.isSelected = isSelected;
    
    if (this.element) {
      if (isSelected) {
        this.element.classList.add('selected');
      } else {
        this.element.classList.remove('selected');
      }
    }
  }
}

/**
 * Check if a gem has a class bonus for the current player
 * @param {Object} gem - Gem to check
 * @returns {Boolean} Whether the gem has a class bonus
 */
function hasClassBonus(gem) {
  const playerClass = GameState.get('player.class');
  
  return (playerClass === "Knight" && gem.color === "red") ||
         (playerClass === "Mage" && gem.color === "blue") ||
         (playerClass === "Rogue" && gem.color === "green");
}

/**
 * Get an appropriate symbol for a gem based on its type
 * @param {Object} gem - Gem data
 * @param {String} context - Display context
 * @returns {String} Symbol to display
 */
function getGemSymbol(gem, context = 'battle') {
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
 * @param {Object} gem - Gem data
 * @param {Boolean} hasBonus - Whether gem has class bonus
 * @returns {String} Tooltip text
 */
function buildGemTooltip(gem, hasBonus) {
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