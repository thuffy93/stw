// STW/js/ui/components/screens/ShopScreen.js
import { Component } from '../Component.js';
import { HandComponent } from '../battle/HandComponent.js';
import { ButtonComponent } from '../common/ButtonComponent.js';
import { GemComponent } from '../common/GemComponent.js';
import { EventBus } from '../../../core/eventbus.js';
import { GameState } from '../../../core/state.js';

/**
 * Shop screen component
 */
export class ShopScreen extends Component {
  constructor() {
    super('shop-screen', `
      <div id="shop-screen" class="screen">
        <div class="shop-header">
          <h1>Shop</h1>
          <div class="shop-stats">
            <p>Health: <span id="shop-health">30</span>/<span id="shop-max-health">30</span></p>
            <p>Zenny: <span id="shop-zenny">0</span></p>
          </div>
        </div>
        
        <div id="shop-selections">
          <div class="shop-section">
            <h2>Your Hand</h2>
            <div id="shop-hand-container"></div>
          </div>
          
          <div id="gem-pool-instructions">Select a gem from your hand</div>
          
          <div id="gem-pool" class="gem-pool"></div>
          
          <div class="shop-actions">
            <div id="upgrade-gem-container"></div>
            <div id="discard-gem-container"></div>
            <div id="buy-random-gem-container"></div>
            <div id="heal-10-container"></div>
            <div id="cancel-upgrade-container"></div>
          </div>
          
          <div id="continue-btn-container"></div>
        </div>
        
        <div id="shop-gem-bag-container">
          Gem Bag: <span id="shop-gem-bag-count">0</span>/<span id="shop-gem-bag-total">20</span>
        </div>
      </div>
    `);
    
    // Create child components
    this.shopHand = new HandComponent({ context: 'shop', id: 'shop-hand' });
    
    // Create action buttons
    this.upgradeButton = new ButtonComponent('upgrade-gem', 'Upgrade Gem (5 ¤)', {
      className: 'btn-primary',
      eventName: 'INITIATE_UPGRADE',
      disabled: true
    });
    
    this.discardButton = new ButtonComponent('discard-gem', 'Discard Gem (3 ¤)', {
      className: 'btn-secondary',
      eventName: 'DISCARD_GEM',
      disabled: true
    });
    
    this.buyRandomButton = new ButtonComponent('buy-random-gem', 'Buy Random Gem (3 ¤)', {
      className: 'btn-primary',
      eventName: 'BUY_RANDOM_GEM'
    });
    
    this.healButton = new ButtonComponent('heal-10', 'Heal 10 HP (3 ¤)', {
      className: 'btn-success',
      eventName: 'HEAL_IN_SHOP'
    });
    
    this.cancelUpgradeButton = new ButtonComponent('cancel-upgrade', 'Cancel Upgrade', {
      className: 'btn-danger',
      eventName: 'CANCEL_UPGRADE'
    });
    
    this.continueButton = new ButtonComponent('continue-btn', 'Continue to Battle', {
      className: 'btn-large btn-primary',
      eventName: 'CONTINUE_FROM_SHOP'
    });
    
    // Add child components
    this.addChild(this.shopHand)
        .addChild(this.upgradeButton)
        .addChild(this.discardButton)
        .addChild(this.buyRandomButton)
        .addChild(this.healButton)
        .addChild(this.cancelUpgradeButton)
        .addChild(this.continueButton);
    
    // Store state
    this.inUpgradeMode = false;
    this.gemPool = [];
    
    // Subscribe to events
    this.subscribeToEvent('SHOP_UPDATE', this.update);
    this.subscribeToEvent('SHOP_PREPARED', this.updateShopUI);
    this.subscribeToEvent('UPGRADE_OPTION_SELECTED', this.handleUpgradeSelection);
  }
  
  /**
   * Handle upgrade selection
   * @param {Object} data - Selection data
   */
  handleUpgradeSelection(data) {
    const { poolIndex } = data;
    // Forward to event bus with the appropriate event
    EventBus.emit('UPGRADE_OPTION_SELECTED', { poolIndex });
  }
  
  /**
   * Override render method to set up initial UI
   */
  render() {
    const element = super.render();
    
    // Initialize initial states
    this.cancelUpgradeButton.hide(); // Hide cancel button initially
    this.updateShopUI(); // Update UI with current state
    
    return element;
  }
  
  /**
   * Update the shop UI with current state
   */
  updateShopUI() {
    const player = GameState.get('player');
    const gemBag = GameState.get('gemBag') || [];
    const inUpgradeMode = GameState.get('inUpgradeMode') || false;
    
    // Update shop stats
    this.updateShopStats(player);
    
    // Update gem bag info
    this.updateGemBagInfo(gemBag);
    
    // Update based on mode
    if (inUpgradeMode !== this.inUpgradeMode) {
      this.inUpgradeMode = inUpgradeMode;
      this.updateShopMode();
    }
    
    // Update button states
    this.updateButtonStates();
  }
  
  /**
   * Update shop stats display
   * @param {Object} player - Player data
   */
  updateShopStats(player) {
    const shopHealth = this.element.querySelector('#shop-health');
    const shopMaxHealth = this.element.querySelector('#shop-max-health');
    const shopZenny = this.element.querySelector('#shop-zenny');
    
    if (shopHealth) shopHealth.textContent = player.health;
    if (shopMaxHealth) shopMaxHealth.textContent = player.maxHealth;
    if (shopZenny) shopZenny.textContent = player.zenny;
  }
  
  /**
   * Update gem bag info
   * @param {Array} gemBag - Gem bag array
   */
  updateGemBagInfo(gemBag) {
    const gemBagCount = this.element.querySelector('#shop-gem-bag-count');
    const gemBagTotal = this.element.querySelector('#shop-gem-bag-total');
    
    if (gemBagCount) gemBagCount.textContent = gemBag.length;
    if (gemBagTotal) gemBagTotal.textContent = "20"; // MAX_GEM_BAG_SIZE
  }
  
  /**
   * Update the shop mode (normal or upgrade)
   */
  updateShopMode() {
    const gemPoolElem = this.element.querySelector('#gem-pool');
    const instructionsElem = this.element.querySelector('#gem-pool-instructions');
    
    if (this.inUpgradeMode) {
      // Upgrade mode
      this.enterUpgradeMode();
      
      // Show instructions
      if (instructionsElem) {
        const selectedGems = GameState.get('selectedGems') || new Set();
        if (selectedGems.size === 1) {
          const hand = GameState.get('hand') || [];
          const selectedGem = hand[Array.from(selectedGems)[0]];
          instructionsElem.textContent = `Choose an upgrade option for your ${selectedGem.color} ${selectedGem.name}:`;
          instructionsElem.style.fontWeight = 'bold';
        }
      }
      
      // Render upgrade options
      this.renderGemPool();
      
    } else {
      // Normal mode
      this.exitUpgradeMode();
      
      // Update instructions
      if (instructionsElem) {
        instructionsElem.textContent = 'Select a gem from your hand';
        instructionsElem.style.fontWeight = 'normal';
      }
      
      // Clear gem pool
      if (gemPoolElem) {
        gemPoolElem.innerHTML = '';
      }
    }
  }
  
  /**
   * Configure UI for upgrade mode
   */
  enterUpgradeMode() {
    // Hide normal buttons, show cancel
    this.upgradeButton.hide();
    this.discardButton.hide();
    this.buyRandomButton.hide();
    this.cancelUpgradeButton.show();
    
    // Store previous gem pool
    this.gemPool = GameState.get('gemCatalog.gemPool') || [];
  }
  
  /**
   * Configure UI for normal mode
   */
  exitUpgradeMode() {
    // Show normal buttons, hide cancel
    this.upgradeButton.show();
    this.discardButton.show();
    this.buyRandomButton.show();
    this.cancelUpgradeButton.hide();
  }
  
  /**
   * Render gem pool for upgrade options
   */
  renderGemPool() {
    const gemPool = this.element.querySelector('#gem-pool');
    if (!gemPool) return;
    
    // Clear current content
    gemPool.innerHTML = '';
    
    // Get gem pool from state
    const upgradeOptions = GameState.get('gemCatalog.gemPool') || [];
    
    // Render each upgrade option
    upgradeOptions.forEach((gem, index) => {
      // Create gem component
      const gemComponent = new GemComponent(gem, index, {
        context: 'upgrade',
        isClickable: true,
        size: 'large'
      });
      
      // Render and add to pool
      gemPool.appendChild(gemComponent.render());
    });
  }
  
  /**
   * Update button states based on game state
   */
  updateButtonStates() {
    const player = GameState.get('player');
    const selectedGems = GameState.get('selectedGems') || new Set();
    const hand = GameState.get('hand') || [];
    const gemCatalog = GameState.get('gemCatalog') || {};
    const hasSelection = selectedGems.size > 0;
    
    // Skip if in upgrade mode
    if (this.inUpgradeMode) return;
    
    // Update upgrade button
    this.upgradeButton.update({
      disabled: !hasSelection || player.zenny < 5
    });
    
    // Update discard button
    this.discardButton.update({
      disabled: !hasSelection || player.zenny < 3
    });
    
    // Additional checks for upgrade eligibility
    if (hasSelection) {
      const selectedIndex = Array.from(selectedGems)[0];
      const selectedGem = hand[selectedIndex];
      
      if (selectedGem) {
        const canUpgrade = !selectedGem.freshlySwapped && 
                        !(gemCatalog.upgradedThisShop && 
                          gemCatalog.upgradedThisShop.has(selectedGem.id));
        
        // Update upgrade button with detailed tooltip
        this.upgradeButton.update({
          disabled: !canUpgrade || player.zenny < 5,
          tooltip: !canUpgrade ? "Cannot upgrade this gem now" :
                   player.zenny < 5 ? "Not enough $ZENNY (need 5)" :
                   "Upgrade selected gem (5 $ZENNY)"
        });
      }
    }
    
    // Update buy random gem button
    this.buyRandomButton.update({
      disabled: player.zenny < 3,
      tooltip: player.zenny < 3 ? "Not enough $ZENNY" : "Buy random gem for Gem Bag"
    });
    
    // Update heal button
    this.healButton.update({
      disabled: player.zenny < 3 || player.health >= player.maxHealth,
      tooltip: player.health >= player.maxHealth ? "Already at full health" :
              player.zenny < 3 ? "Not enough $ZENNY (need 3)" :
              "Heal 10 health"
    });
  }
  
  /**
   * Update component with new data
   * @param {Object} data - Update data
   */
  update(data) {
    const player = data.player || GameState.get('player');
    
    // Update shop stats
    this.updateShopStats(player);
    
    // Update gem bag info if provided
    if (data.gemBag) {
      this.updateGemBagInfo(data.gemBag);
    }
    
    // Update mode if changed
    const inUpgradeMode = data.inUpgradeMode !== undefined ? 
                        data.inUpgradeMode : 
                        GameState.get('inUpgradeMode') || false;
    
    if (inUpgradeMode !== this.inUpgradeMode) {
      this.inUpgradeMode = inUpgradeMode;
      this.updateShopMode();
    }
    
    // Update button states
    this.updateButtonStates();
  }
}