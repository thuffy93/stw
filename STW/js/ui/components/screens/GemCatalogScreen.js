// STW/js/ui/components/screens/GemCatalogScreen.js
import { Component } from '../Component.js';
import { ButtonComponent } from '../common/ButtonComponent.js';
import { GemComponent } from '../common/GemComponent.js';
import { EventBus } from '../../../core/eventbus.js';
import { GameState } from '../../../core/state.js';

/**
 * Gem Catalog screen component
 */
export class GemCatalogScreen extends Component {
  constructor() {
    super('gem-catalog-screen', `
      <div id="gem-catalog-screen" class="screen">
        <h1>Gem Catalog</h1>
        
        <div class="meta-info">
          <p>Meta Zenny: <span id="meta-zenny-display">0</span></p>
          <p>Class: <span id="class-display">None</span></p>
        </div>
        
        <div id="unlocked-gems-section" class="gem-section">
          <h2>Unlocked Gems</h2>
          <div id="unlocked-gems" class="gems-container"></div>
        </div>
        
        <div id="available-gems-section" class="gem-section">
          <h2>Available to Unlock</h2>
          <div id="available-gems" class="gems-container"></div>
        </div>
        
        <div id="continue-journey-btn-container"></div>
      </div>
    `);
    
    // Create action button
    this.continueButton = new ButtonComponent('continue-journey-btn', 'Continue Journey', {
      className: 'btn-large btn-primary',
      onClick: () => this.startJourney()
    });
    
    // Add child components
    this.addChild(this.continueButton);
    
    // Track state
    this.selectedGemKey = null;
    
    // Subscribe to events
    this.subscribeToEvent('META_ZENNY_UPDATED', this.updateMetaZenny);
    this.subscribeToEvent('GEM_UNLOCKED', this.updateGemCatalog);
    this.subscribeToEvent('GEM_CATALOG_SELECT', this.handleGemSelection);
  }
  
  /**
   * Start the journey (transition to battle)
   */
  startJourney() {
    console.log("Starting journey");
    
    // Show loading message
    EventBus.emit('UI_MESSAGE', {
      message: "Starting your adventure..."
    });
    
    // Emit journey start event
    EventBus.emit('JOURNEY_START');
    
    // Switch to battle screen
    setTimeout(() => {
      EventBus.emit('SCREEN_CHANGE', 'battle');
    }, 300);
  }
  
  /**
   * Handle gem selection in catalog
   * @param {Object} data - Selection data
   */
  handleGemSelection(data) {
    const { gemKey, gem } = data;
    
    // Store selected gem key
    this.selectedGemKey = gemKey;
    
    // If it's an available gem to unlock
    if (gem.isUnlockable) {
      this.promptUnlockGem(gemKey, gem);
    }
  }
  
  /**
   * Prompt to unlock a gem
   * @param {String} gemKey - Gem key
   * @param {Object} gem - Gem data
   */
  promptUnlockGem(gemKey, gem) {
    const metaZenny = GameState.get('metaZenny');
    
    // Check if player can afford it
    if (metaZenny < 50) {
      EventBus.emit('UI_MESSAGE', {
        message: "Not enough Meta $ZENNY to unlock gem!",
        type: 'error'
      });
      return;
    }
    
    // Confirm unlock
    if (confirm(`Would you like to unlock the ${gem.color} ${gem.name} gem for 50 $ZENNY?`)) {
      EventBus.emit('UNLOCK_GEM', { gemKey });
    }
  }
  
  /**
   * Update meta zenny display
   * @param {Object} data - Update data
   */
  updateMetaZenny(data) {
    const metaZenny = data.metaZenny !== undefined ? 
      data.metaZenny : 
      GameState.get('metaZenny');
    
    const display = this.element.querySelector('#meta-zenny-display');
    if (display) {
      display.textContent = metaZenny;
    }
  }
  
  /**
   * Override render to initialize catalog display
   */
  render() {
    const element = super.render();
    
    // Update class display
    this.updateClassDisplay();
    
    // Update meta zenny display
    this.updateMetaZenny({});
    
    // Render gem catalog
    this.updateGemCatalog();
    
    return element;
  }
  
  /**
   * Update class display
   */
  updateClassDisplay() {
    const playerClass = GameState.get('player.class');
    const classDisplay = this.element.querySelector('#class-display');
    
    if (classDisplay) {
      classDisplay.textContent = playerClass || 'None';
    }
  }
  
  /**
   * Update gem catalog display
   */
  updateGemCatalog() {
    this.renderUnlockedGems();
    this.renderAvailableGems();
  }
  
  /**
   * Render unlocked gems
   */
  renderUnlockedGems() {
    const gemCatalog = GameState.get('gemCatalog');
    const playerClass = GameState.get('player.class');
    const container = this.element.querySelector('#unlocked-gems');
    
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Get base gems
    const baseGems = Config.BASE_GEMS || {};
    
    // Filter gems by class appropriateness
    const unlocked = gemCatalog.unlocked || [];
    const filteredGems = unlocked.filter(gemKey => {
      const gem = baseGems[gemKey];
      if (!gem) return false;
      
      // Grey gems are universal
      if (gem.color === "grey") return true;
      
      // Class-specific filtering
      const classColors = {
        "Knight": "red",
        "Mage": "blue",
        "Rogue": "green"
      };
      
      // Base gems for all classes
      const baseGemKeys = ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal"];
      if (baseGemKeys.includes(gemKey)) return true;
      
      return gem.color === classColors[playerClass];
    });
    
    // Render each unlocked gem
    filteredGems.forEach((gemKey, index) => {
      const gem = baseGems[gemKey];
      if (!gem) return;
      
      // Create gem object with key
      const gemWithKey = { ...gem, key: gemKey };
      
      // Create gem component
      const gemComponent = new GemComponent(gemWithKey, index, {
        context: 'catalog',
        isClickable: false,
        size: 'large'
      });
      
      // Render and add to container
      container.appendChild(gemComponent.render());
    });
    
    // Show empty state if no gems
    if (filteredGems.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'No gems unlocked yet';
      container.appendChild(emptyMessage);
    }
  }
  
  /**
   * Render available gems to unlock
   */
  renderAvailableGems() {
    const gemCatalog = GameState.get('gemCatalog');
    const playerClass = GameState.get('player.class');
    const metaZenny = GameState.get('metaZenny');
    const container = this.element.querySelector('#available-gems');
    
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Get base gems 
    const baseGems = Config.BASE_GEMS || {};
    
    // Create a Set of unlocked gem keys for faster lookups
    const unlockedGemKeys = new Set(gemCatalog.unlocked || []);
    
    // Filter available gems
    const available = gemCatalog.available || [];
    const filteredGems = available.filter(gemKey => {
      // Skip already unlocked gems
      if (unlockedGemKeys.has(gemKey)) return false;
      
      const gem = baseGems[gemKey];
      if (!gem) return false;
      
      // Grey gems are universal
      if (gem.color === "grey") return true;
      
      // Class-specific filtering
      const classColors = {
        "Knight": "red",
        "Mage": "blue",
        "Rogue": "green"
      };
      
      return gem.color === classColors[playerClass];
    });
    
    // Render each available gem
    filteredGems.forEach((gemKey, index) => {
      const gem = baseGems[gemKey];
      if (!gem) return;
      
      // Create gem container
      const gemContainer = document.createElement('div');
      gemContainer.className = 'unlockable-gem-container';
      
      // Create gem with key and unlockable flag
      const gemWithKey = { 
        ...gem, 
        key: gemKey,
        isUnlockable: true
      };
      
      // Create gem component
      const gemComponent = new GemComponent(gemWithKey, index, {
        context: 'catalog',
        isClickable: true,
        size: 'large'
      });
      
      // Create cost label
      const costLabel = document.createElement('div');
      costLabel.className = 'gem-cost-label';
      costLabel.textContent = "50 $ZENNY";
      
      // Add disabled styling if can't afford
      if (metaZenny < 50) {
        costLabel.classList.add('disabled');
      }
      
      // Add to container
      gemContainer.appendChild(gemComponent.render());
      gemContainer.appendChild(costLabel);
      
      // Add to main container
      container.appendChild(gemContainer);
    });
    
    // Show empty state if no available gems
    if (filteredGems.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'No gems available to unlock';
      container.appendChild(emptyMessage);
    }
  }
  
  /**
   * Update component with new data
   * @param {Object} data - Update data
   */
  update(data) {
    if (data.metaZenny !== undefined) {
      this.updateMetaZenny(data);
    }
    
    if (data.gemCatalog || data.gemUnlocked) {
      this.updateGemCatalog();
    }
  }
}