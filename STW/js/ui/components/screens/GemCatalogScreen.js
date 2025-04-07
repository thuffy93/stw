// STW/js/ui/components/screens/GemCatalogScreen.js
import { Component } from '../Component.js';
import { ButtonComponent } from '../common/ButtonComponent.js';
import { GameState } from '../../../core/state.js';
import { EventBus } from '../../../core/eventbus.js';
import { Utils } from '../../../core/utils.js';
import { Config } from '../../../core/config.js';

/**
 * Gem catalog screen component
 */
export class GemCatalogScreen extends Component {
  constructor() {
    super('gem-catalog-screen', `
      <div id="gemCatalog-screen" class="screen">
        <h1>Gem Catalog</h1>
        <div class="meta-info">
          <p>Meta Zenny: <span id="meta-zenny-display">0</span></p>
        </div>
        
        <div id="unlocked-gems-section">
          <h2>Unlocked Gems</h2>
          <div id="unlocked-gems" class="gem-grid"></div>
        </div>
        
        <div id="available-gems-section">
          <h2>Available Gems</h2>
          <div id="available-gems" class="gem-grid"></div>
        </div>
        
        <div id="continue-journey-btn-container"></div>
      </div>
    `);
    
    // Create child components
    this.continueButton = new ButtonComponent('continue-journey-btn', 'Continue Journey', {
      className: 'btn-large',
      onClick: () => this.startJourney()
    });
    
    // Add child components
    this.addChild(this.continueButton);
    
    // Additional subscriptions to ensure catalog updates
    this.subscribeToEvent('GEM_UNLOCKED', this.updateGemCatalog.bind(this));
    this.subscribeToEvent('META_ZENNY_UPDATED', this.updateGemCatalog.bind(this));
    this.subscribeToEvent('CLASS_SELECTED', this.updateGemCatalog.bind(this));
    this.subscribeToEvent('GEM_CATALOG_INITIALIZED', this.updateGemCatalog.bind(this));
    this.subscribeToEvent('SCREEN_CHANGED', (data) => {
      if (data.screen === 'gemCatalog') {
        this.updateGemCatalog();
      }
    });
  }
  /**
   * Start the journey
   */
  startJourney() {
    console.log("GemCatalog: Starting journey");
    
    // Show loading message
    EventBus.emit('UI_MESSAGE', {
      message: "Starting your adventure..."
    });
    
    try {
      // Direct emit of JOURNEY_START event
      EventBus.emit('JOURNEY_START');
      
      // Force transition after a delay to ensure event processing completes
      setTimeout(() => {
        console.log("GemCatalog: Transitioning to battle screen");
        
        // Need to make sure battle screen is initialized properly
        // First prepare player data if needed
        const player = GameState.get('player');
        if (player) {
          // Reset necessary player state for battle
          GameState.set('player.buffs', []);
          GameState.set('player.stamina', player.baseStamina);
          
          // Create gem bag if not already created
          if (!GameState.get('gemBag') || GameState.get('gemBag').length === 0) {
            const baseGems = Object.entries(Config.BASE_GEMS).map(([key, gem]) => ({
              ...gem,
              id: `${gem.name}-${Utils.generateId()}`
            }));
            
            const gemBag = Utils.shuffle(baseGems);
            GameState.set('gemBag', gemBag);
            
            // Set up initial hand
            const initialHand = gemBag.slice(0, Config.MAX_HAND_SIZE);
            GameState.set('hand', initialHand);
            GameState.set('gemBag', gemBag.slice(Config.MAX_HAND_SIZE));
            GameState.set('discard', []);
          }
        }
        
        // Now change to battle screen
        EventBus.emit('SCREEN_CHANGE', { screen: 'battle' });
        
        // After screen change, initialize battle
        setTimeout(() => {
          console.log("GemCatalog: Initializing battle");
          EventBus.emit('BATTLE_INIT');
        }, 100);
      }, 200);
    } catch (error) {
      console.error("Error starting journey:", error);
      EventBus.emit('UI_MESSAGE', {
        message: "Failed to start journey. Please try again.",
        type: 'error'
      });
      EventBus.emit('LOADING_END');
    }
  }
  
  /**
   * Update gem catalog display
   */
  updateGemCatalog() {
    // Check if the component has been rendered
    // If this.element is null, the component hasn't been rendered yet
    if (!this.element) {
      console.log("GemCatalog: Component not yet rendered, deferring update");
      return; // Exit early, we'll update when the component renders
    }
  
    const metaZenny = GameState.get('metaZenny');
    const gemCatalog = GameState.get('gemCatalog');
    const playerClass = GameState.get('player.class');
    
    console.log("GemCatalog: Updating catalog with:", {
      metaZenny,
      playerClass,
      gemCatalog: gemCatalog ? {
        unlocked: gemCatalog.unlocked,
        available: gemCatalog.available
      } : 'Not found'
    });
    
    // Update meta zenny display
    const metaZennyDisplay = this.element.querySelector('#meta-zenny-display');
    if (metaZennyDisplay) {
      metaZennyDisplay.textContent = metaZenny;
    }
    
    // Update unlocked gems
    this.renderUnlockedGems(gemCatalog, playerClass);
    
    // Update available gems
    this.renderAvailableGems(gemCatalog, playerClass, metaZenny);
  }  
  
  /**
   * Render unlocked gems
   * @param {Object} gemCatalog - Gem catalog data
   * @param {String} playerClass - Player class
   */
  renderUnlockedGems(gemCatalog, playerClass) {
    // Exit early if component not rendered
    if (!this.element) return;
    
    const unlockedGemsContainer = this.element.querySelector('#unlocked-gems');
    if (!unlockedGemsContainer) {
      console.warn("GemCatalog: #unlocked-gems container not found");
      return;
    }
    unlockedGemsContainer.innerHTML = '';
    
    if (!gemCatalog || !gemCatalog.unlocked || !Array.isArray(gemCatalog.unlocked)) {
      console.warn("Invalid gem catalog:", gemCatalog);
      return;
    }
    
    // Filter gems by class color appropriateness
    const filteredGems = gemCatalog.unlocked.filter(gemKey => {
      const gem = Config.BASE_GEMS[gemKey];
      if (!gem) return false;
      
      // Grey gems are universal
      if (gem.color === "grey") return true;
      
      // Basic gems (show for all classes)
      const baseGems = ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal"];
      if (baseGems.includes(gemKey)) return true;
      
      // Class-specific color filtering
      const classColors = {
        "Knight": "red",
        "Mage": "blue",
        "Rogue": "green"
      };
      
      return gem.color === classColors[playerClass];
    });
    
    // Add gem elements
    filteredGems.forEach(gemKey => {
      const gem = Config.BASE_GEMS[gemKey];
      if (!gem) return;
      
      const gemElement = this.createGemElement(gem, playerClass);
      unlockedGemsContainer.appendChild(gemElement);
    });
  }
  
  /**
   * Render available gems
   * @param {Object} gemCatalog - Gem catalog data
   * @param {String} playerClass - Player class
   * @param {Number} metaZenny - Available meta zenny
   */
  renderAvailableGems(gemCatalog, playerClass, metaZenny) {
    // Exit early if component not rendered
    if (!this.element) return;
    
    const availableGemsContainer = this.element.querySelector('#available-gems');
    if (!availableGemsContainer) return;
    
    availableGemsContainer.innerHTML = '';
    
    if (!gemCatalog || !gemCatalog.available) {
      console.warn("Invalid gem catalog:", gemCatalog);
      return;
    }
    
    // Create a Set of unlocked gem keys for faster lookups
    const unlockedGemKeys = new Set(gemCatalog.unlocked || []);
    
    // Filter for gems that are not unlocked and match the class
    const availableGems = gemCatalog.available.filter(gemKey => {
      // Skip already unlocked gems
      if (unlockedGemKeys.has(gemKey)) return false;
      
      const gem = Config.BASE_GEMS[gemKey];
      if (!gem) return false;
      
      // Grey gems are universal
      if (gem.color === "grey") return true;
      
      // Class-specific color filtering
      const classColors = {
        "Knight": "red",
        "Mage": "blue",
        "Rogue": "green"
      };
      
      return gem.color === classColors[playerClass];
    });
    
    // Add gem elements
    availableGems.forEach(gemKey => {
      const gem = Config.BASE_GEMS[gemKey];
      if (!gem) return;
      
      const gemContainer = this.createUnlockableGemContainer(gem, gemKey, playerClass, metaZenny);
      availableGemsContainer.appendChild(gemContainer);
    });
  }
  
  /**
   * Create a gem element
   * @param {Object} gem - Gem data
   * @param {String} playerClass - Player class
   * @returns {HTMLElement} Gem element
   */
  createGemElement(gem, playerClass) {
    const gemElement = document.createElement("div");
    gemElement.className = `gem ${gem.color}`;
    
    // Check for class bonus
    const hasBonus = (playerClass === "Knight" && gem.color === "red") ||
                  (playerClass === "Mage" && gem.color === "blue") ||
                  (playerClass === "Rogue" && gem.color === "green");
    
    if (hasBonus) {
      gemElement.classList.add("class-bonus");
    }
    
    // Create content structure
    const gemContent = document.createElement("div");
    gemContent.className = "gem-content";
    
    // Add icon
    const gemIcon = document.createElement("div");
    gemIcon.className = "gem-icon";
    gemIcon.textContent = this.getGemSymbol(gem);
    gemContent.appendChild(gemIcon);
    
    // Add name (visible in catalog)
    const gemName = document.createElement("div");
    gemName.className = "gem-name";
    gemName.style.display = "block";
    gemName.textContent = gem.name;
    gemContent.appendChild(gemName);
    
    // Add value if it exists
    if (gem.damage || gem.heal || gem.poison) {
      const gemValue = document.createElement("div");
      gemValue.className = "gem-value";
      gemValue.textContent = gem.damage || gem.heal || gem.poison || "";
      gemContent.appendChild(gemValue);
    }
    
    gemElement.appendChild(gemContent);
    
    // Add cost
    const gemCost = document.createElement("div");
    gemCost.className = "gem-cost";
    gemCost.textContent = gem.cost;
    gemElement.appendChild(gemCost);
    
    // Add tooltip
    gemElement.setAttribute("data-tooltip", this.buildGemTooltip(gem, hasBonus));
    
    return gemElement;
  }
  
  /**
   * Create an unlockable gem container
   * @param {Object} gem - Gem data
   * @param {String} gemKey - Gem key
   * @param {String} playerClass - Player class
   * @param {Number} metaZenny - Available meta zenny
   * @returns {HTMLElement} Gem container element
   */
  createUnlockableGemContainer(gem, gemKey, playerClass, metaZenny) {
    // Create container
    const gemContainer = document.createElement("div");
    gemContainer.className = "unlockable-gem-container";
    
    // Create gem element
    const gemElement = this.createGemElement(gem, playerClass);
    gemElement.style.cursor = 'pointer';
    
    // Add click handler for unlocking
    gemElement.onclick = () => {
      if (metaZenny < 50) {
        EventBus.emit('UI_MESSAGE', {
          message: "Not enough Meta $ZENNY!",
          type: 'error'
        });
        return;
      }
      
      if (confirm(`Would you like to unlock the ${gem.color} ${gem.name} gem for 50 $ZENNY?`)) {
        EventBus.emit('UNLOCK_GEM', { gemKey });
      }
    };
    
    // Create cost label
    const costLabel = document.createElement("div");
    costLabel.className = "gem-cost-label";
    costLabel.textContent = "50 $ZENNY";
    
    // Add to container
    gemContainer.appendChild(gemElement);
    gemContainer.appendChild(costLabel);
    
    return gemContainer;
  }
  
  /**
   * Get a symbol for a gem
   * @param {Object} gem - Gem data
   * @returns {String} Gem symbol
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
   * @param {Boolean} hasBonus - Whether the gem has a class bonus
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
   * Override render to update gem catalog
   */
  render() {
    const element = super.render();
    this.updateGemCatalog();
    return element;
  }
  
  /**
   * Update component with new data
   * @param {Object} data - Update data
   */
  update(data) {
    this.updateGemCatalog();
  }
  afterRender() {
    console.log("GemCatalog: afterRender called");
    // Update the catalog after rendering
    this.updateGemCatalog();
  }
  
}


export default GemCatalogScreen;