// STW/js/ui/baseRenderer.js
import { EventBus } from '../core/eventbus.js';
import { GameState } from '../core/state.js';

/**
 * Base Renderer - Core UI rendering functionality
 */
export const BaseRenderer = {
  /**
   * Initialize the renderer
   */
  initialize() {
    console.log("Initializing Base Renderer");
    return true;
  },
  
  /**
   * Show a message to the user
   * @param {String} message - Message text
   * @param {String} type - Message type ('success', 'error', etc.)
   * @param {Number} duration - Display duration in ms
   */
  showMessage(message, type = 'success', duration = 2000) {
    const messageEl = document.getElementById('message');
    if (!messageEl) {
      console.warn("Message element not found");
      return;
    }
    
    // Set message content and type
    messageEl.textContent = message;
    messageEl.className = '';
    messageEl.classList.add(type);
    messageEl.classList.add('visible');
    
    // Clear previous timeout
    if (this._messageTimeout) {
      clearTimeout(this._messageTimeout);
    }
    
    // Hide after duration
    this._messageTimeout = setTimeout(() => {
      messageEl.classList.remove('visible');
    }, duration);
  },
  
  /**
   * Update active screen
   * @param {String} screenName - Screen to switch to
   */
  updateActiveScreen(screenName) {
    console.log(`Switching to screen: ${screenName}`);
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    
    // Update state
    GameState.set('currentScreen', screenName);
    
    // Show targeted screen
    let screenElement;
    
    // Handle special case for gem catalog
    if (screenName === 'gemCatalog') {
      screenElement = document.getElementById('gemCatalog-screen');
    } else {
      screenElement = document.getElementById(`${screenName}-screen`);
    }
    
    if (screenElement) {
      screenElement.classList.add('active');
    } else {
      console.error(`Screen element '${screenName}-screen' not found`);
    }
  },
  
  /**
   * Update battle UI with current state
   */
  updateBattleUI() {
    const player = GameState.get('player');
    const enemy = GameState.get('battle.enemy');
    const currentDay = GameState.get('currentDay') || 1;
    const currentPhaseIndex = GameState.get('currentPhaseIndex') || 0;
    const isEnemyTurnPending = GameState.get('isEnemyTurnPending') || false;
    
    // Update phase indicator
    this.updatePhaseIndicator(currentDay, currentPhaseIndex);
    
    // Update turn indicator
    this.updateTurnIndicator(isEnemyTurnPending);
    
    // Update player and enemy stats
    this.updatePlayerStats(player);
    this.updateEnemyStats(enemy);
    
    // Update UI buttons based on game state
    this.updateBattleControls();
  },
  
  /**
   * Update the phase indicator
   * @param {Number} day - Current day
   * @param {Number} phaseIndex - Current phase index
   */
  updatePhaseIndicator(day, phaseIndex) {
    const phaseIndicator = document.getElementById('day-phase-indicator');
    if (!phaseIndicator) return;
    
    const phaseNames = ["Dawn", "Dusk", "Dark"];
    const phaseName = phaseNames[phaseIndex] || "Dawn";
    const phaseSymbols = ["☀️", "🌅", "🌙"];
    
    phaseIndicator.textContent = `Day ${day} ${phaseSymbols[phaseIndex]}`;
    
    // Update screen background based on phase
    const battleScreen = document.getElementById('battle-screen');
    if (battleScreen) {
      battleScreen.className = 'screen active';
      battleScreen.classList.add(phaseName.toLowerCase());
    }
  },
  
  /**
   * Update turn indicator
   * @param {Boolean} isEnemyTurn - Whether it's the enemy's turn
   */
  updateTurnIndicator(isEnemyTurn) {
    const turnIndicator = document.getElementById('turn-indicator');
    if (!turnIndicator) return;
    
    turnIndicator.className = isEnemyTurn ? 'enemy' : 'player';
    turnIndicator.textContent = isEnemyTurn ? "Enemy Turn" : "Your Turn";
  },
  
  /**
   * Update player stats display
   * @param {Object} player - Player data
   */
  updatePlayerStats(player) {
    if (!player) return;
    
    // Update player class
    const playerClassEl = document.getElementById('player-class');
    if (playerClassEl) playerClassEl.textContent = player.class || 'None';
    
    // Update health
    const playerHealth = document.getElementById('player-health');
    const playerMaxHealth = document.getElementById('player-max-health');
    const playerHealthBar = document.getElementById('player-health-bar');
    
    if (playerHealth) playerHealth.textContent = player.health;
    if (playerMaxHealth) playerMaxHealth.textContent = player.maxHealth;
    
    if (playerHealthBar) {
      const healthPercent = (player.health / player.maxHealth) * 100;
      playerHealthBar.style.width = `${healthPercent}%`;
    }
    
    // Update stamina
    this.updateStaminaDisplay(player.stamina, player.baseStamina);
    
    // Update zenny
    const zennyDisplay = document.getElementById('zenny');
    if (zennyDisplay) zennyDisplay.textContent = player.zenny;
    
    // Update buffs
    this.updateBuffsDisplay(player.buffs, 'player');
  },
  
  /**
   * Update stamina display
   * @param {Number} stamina - Current stamina
   * @param {Number} baseStamina - Max stamina
   */
  updateStaminaDisplay(stamina, baseStamina) {
    const staminaFill = document.getElementById('stamina-fill');
    const staminaText = document.getElementById('stamina-text');
    
    if (!staminaFill || !staminaText) return;
    
    // Update stamina bar
    const staminaPercent = (stamina / baseStamina) * 100;
    staminaFill.style.width = `${staminaPercent}%`;
    
    // Update stamina classes based on level
    staminaFill.classList.remove("full", "medium", "low");
    if (stamina === baseStamina) staminaFill.classList.add("full");
    else if (stamina >= baseStamina / 2) staminaFill.classList.add("medium");
    else staminaFill.classList.add("low");
    
    // Update stamina text
    staminaText.textContent = `${stamina}/${baseStamina}`;
  },
  
  /**
   * Update enemy stats display
   * @param {Object} enemy - Enemy data
   */
  updateEnemyStats(enemy) {
    // Get elements
    const enemyName = document.getElementById('enemy-name');
    const enemyHealth = document.getElementById('enemy-health');
    const enemyMaxHealth = document.getElementById('enemy-max-health');
    const enemyHealthBar = document.getElementById('enemy-health-bar');
    
    if (!enemy) {
      // No enemy present
      if (enemyName) enemyName.textContent = "None";
      if (enemyHealth) enemyHealth.textContent = "0";
      if (enemyMaxHealth) enemyMaxHealth.textContent = "0";
      if (enemyHealthBar) enemyHealthBar.style.width = "0%";
      return;
    }
    
    // Update enemy info
    if (enemyName) enemyName.textContent = enemy.name || "Enemy";
    if (enemyHealth) enemyHealth.textContent = Math.max(0, enemy.health || 0);
    if (enemyMaxHealth) enemyMaxHealth.textContent = enemy.maxHealth || 0;
    
    if (enemyHealthBar) {
      const healthPercent = (enemy.health / enemy.maxHealth) * 100;
      enemyHealthBar.style.width = `${healthPercent}%`;
    }
    
    // Update next action
    const actionElement = document.getElementById('enemy-current-action');
    if (actionElement && enemy.currentAction) {
      actionElement.textContent = this.formatEnemyAction(enemy.currentAction);
    }
    
    // Update buffs
    this.updateBuffsDisplay(enemy.buffs, 'enemy');
  },
  
  /**
   * Format enemy action for display
   * @param {String} action - Raw action string
   * @returns {String} Formatted action
   */
  formatEnemyAction(action) {
    if (!action) return 'Unknown';
    
    if (action.startsWith('Attack')) {
      return 'Attack';
    } else if (action === 'Defend') {
      return 'Defend';
    } else if (action === 'Charge') {
      return 'Charge';
    } else if (action.startsWith('Steal')) {
      return 'Steal';
    }
    
    return action;
  },
  
  /**
   * Update buffs display
   * @param {Array} buffs - Array of buff objects
   * @param {String} target - 'player' or 'enemy'
   */
  updateBuffsDisplay(buffs, target) {
    const buffsContainer = document.getElementById(`${target}-buffs`);
    if (!buffsContainer) return;
    
    // Clear current buffs
    buffsContainer.innerHTML = '';
    
    // If no buffs, exit early
    if (!buffs || !buffs.length) return;
    
    // Add each buff
    buffs.forEach(buff => {
      const buffIcon = document.createElement('div');
      buffIcon.className = `buff-icon ${buff.type}`;
      
      // Set icon based on buff type
      let icon = '⚡';
      let description = `${buff.type}`;
      
      switch (buff.type) {
        case 'focused':
          icon = '✦';
          description = 'Focused: Increases damage and healing by 20%';
          break;
        case 'defense':
          icon = '🛡️';
          description = 'Defense: Reduces damage by 50%';
          break;
        case 'stunned':
          icon = '💫';
          description = 'Stunned: Cannot take actions';
          break;
        case 'poison':
          icon = '☠️';
          description = `Poison: Takes ${buff.damage} damage per turn`;
          break;
      }
      
      buffIcon.textContent = icon;
      buffIcon.setAttribute('data-tooltip', `${description}\nRemaining: ${buff.turns} turn(s)`);
      
      // Add turns remaining
      const turnsSpan = document.createElement('span');
      turnsSpan.className = 'turns';
      turnsSpan.textContent = buff.turns;
      buffIcon.appendChild(turnsSpan);
      
      // Add to container
      buffsContainer.appendChild(buffIcon);
    });
  },
  
  /**
   * Update battle controls based on game state
   */
  updateBattleControls() {
    const player = GameState.get('player');
    const selectedGems = GameState.get('selectedGems') || new Set();
    const hand = GameState.get('hand') || [];
    const isEnemyTurnPending = GameState.get('isEnemyTurnPending');
    const battleOver = GameState.get('battleOver');
    const hasActedThisTurn = GameState.get('hasActedThisTurn');
    const hasPlayedGemThisTurn = GameState.get('hasPlayedGemThisTurn');
    
    // Check if player is stunned
    const isStunned = player.buffs && player.buffs.some(b => b.type === "stunned");
    
    // Check if player can play gems
    const canPlayGems = selectedGems.size > 0 && 
                       Array.from(selectedGems).every(i => hand[i]) &&
                       player.stamina >= Math.min(...Array.from(selectedGems).map(i => hand[i].cost));
    
    // Update button states
    this.updateButtonState('execute-btn', !canPlayGems || isEnemyTurnPending || battleOver || isStunned);
    this.updateButtonState('wait-btn', hasActedThisTurn || hasPlayedGemThisTurn || isEnemyTurnPending || battleOver || isStunned);
    this.updateButtonState('discard-end-btn', !selectedGems.size || hasActedThisTurn || isEnemyTurnPending || battleOver || isStunned);
    this.updateButtonState('end-turn-btn', isEnemyTurnPending || battleOver || isStunned);
    
    // Show/hide flee button based on phase
    const fleeBtn = document.getElementById('flee-btn');
    if (fleeBtn) {
      const currentPhaseIndex = GameState.get('currentPhaseIndex') || 0;
      fleeBtn.style.display = (currentPhaseIndex < 2 && !battleOver && !isEnemyTurnPending && !isStunned) ? 'block' : 'none';
    }
  },
  
  /**
   * Update a button's disabled state
   * @param {String} buttonId - Button ID
   * @param {Boolean} disabled - Whether the button should be disabled
   */
  updateButtonState(buttonId, disabled) {
    const button = document.getElementById(buttonId);
    if (button) button.disabled = disabled;
  },
  
  /**
   * Update shop UI
   */
  updateShopUI() {
    const player = GameState.get('player');
    const gemBag = GameState.get('gemBag') || [];
    const selectedGems = GameState.get('selectedGems') || new Set();
    const inUpgradeMode = GameState.get('inUpgradeMode') || false;
    
    // Update shop stats
    const shopHealth = document.getElementById('shop-health');
    const shopMaxHealth = document.getElementById('shop-max-health');
    const shopZenny = document.getElementById('shop-zenny');
    
    if (shopHealth) shopHealth.textContent = player.health;
    if (shopMaxHealth) shopMaxHealth.textContent = player.maxHealth;
    if (shopZenny) shopZenny.textContent = player.zenny;
    
    // Update gem bag info
    const gemBagCount = document.getElementById('shop-gem-bag-count');
    const gemBagTotal = document.getElementById('shop-gem-bag-total');
    
    if (gemBagCount) gemBagCount.textContent = gemBag.length;
    if (gemBagTotal) gemBagTotal.textContent = "20"; // MAX_GEM_BAG_SIZE
    
    // Update button states based on mode
    this.updateShopButtons(player, selectedGems, inUpgradeMode);
    
    // Handle upgrade mode UI
    if (inUpgradeMode) {
      this.renderGemPool();
    }
  },
  
  /**
   * Update shop button states
   * @param {Object} player - Player data
   * @param {Set} selectedGems - Selected gem indices
   * @param {Boolean} inUpgradeMode - Whether in upgrade mode
   */
  updateShopButtons(player, selectedGems, inUpgradeMode) {
    // Get needed buttons
    const upgradeBtn = document.getElementById('upgrade-gem');
    const discardBtn = document.getElementById('discard-gem');
    const buyRandomBtn = document.getElementById('buy-random-gem');
    const healBtn = document.getElementById('heal-10');
    const cancelUpgradeBtn = document.getElementById('cancel-upgrade');
    
    // Show/hide buttons based on mode
    if (inUpgradeMode) {
      // Hide normal buttons, show cancel
      if (upgradeBtn) upgradeBtn.style.display = 'none';
      if (discardBtn) discardBtn.style.display = 'none';
      if (buyRandomBtn) buyRandomBtn.style.display = 'none';
      if (cancelUpgradeBtn) cancelUpgradeBtn.style.display = 'block';
    } else {
      // Show normal buttons, hide cancel
      if (upgradeBtn) upgradeBtn.style.display = 'block';
      if (discardBtn) discardBtn.style.display = 'block';
      if (buyRandomBtn) buyRandomBtn.style.display = 'block';
      if (cancelUpgradeBtn) cancelUpgradeBtn.style.display = 'none';
      
      // Update button disabled states
      this.updateButtonState('upgrade-gem', !selectedGems.size || player.zenny < 5);
      this.updateButtonState('discard-gem', !selectedGems.size || player.zenny < 3);
      this.updateButtonState('buy-random-gem', player.zenny < 3);
      this.updateButtonState('heal-10', player.zenny < 3 || player.health >= player.maxHealth);
    }
  },
  
  /**
   * Render gem pool for upgrades
   */
  renderGemPool() {
    const gemPool = document.getElementById('gem-pool');
    if (!gemPool) return;
    
    // Clear current content
    gemPool.innerHTML = '';
    
    // Get gem pool from state
    const upgradeOptions = GameState.get('gemCatalog.gemPool') || [];
    
    // Show message if pool is empty
    if (!upgradeOptions.length) {
      const message = document.createElement('p');
      message.textContent = 'No upgrade options available';
      message.className = 'pool-message';
      gemPool.appendChild(message);
      return;
    }
    
    // Add each upgrade option
    upgradeOptions.forEach((gem, index) => {
      // Use GemRenderer if available
      if (typeof GemRenderer !== 'undefined' && typeof GemRenderer.createGemElement === 'function') {
        const gemElement = GemRenderer.createGemElement(gem, index);
        
        // Add click handler
        gemElement.addEventListener('click', () => {
          EventBus.emit('UPGRADE_OPTION_SELECTED', { poolIndex: index });
        });
        
        gemPool.appendChild(gemElement);
      } else {
        // Basic fallback
        const gemElement = document.createElement('div');
        gemElement.className = `gem ${gem.color}`;
        gemElement.textContent = gem.name;
        gemElement.onclick = () => {
          EventBus.emit('UPGRADE_OPTION_SELECTED', { poolIndex: index });
        };
        gemPool.appendChild(gemElement);
      }
    });
  },
  
  /**
   * Update gem catalog UI
   */
  updateGemCatalogUI() {
    const metaZenny = GameState.get('metaZenny');
    
    // Update meta zenny display
    const metaZennyDisplay = document.getElementById('meta-zenny-display');
    if (metaZennyDisplay) {
      metaZennyDisplay.textContent = metaZenny;
    }
    
    // Use GemRenderer for rendering unlocked and available gems
    if (typeof GemRenderer !== 'undefined') {
      if (typeof GemRenderer.renderUnlockedGems === 'function') {
        GemRenderer.renderUnlockedGems();
      }
      
      if (typeof GemRenderer.renderAvailableGems === 'function') {
        GemRenderer.renderAvailableGems();
      }
    }
  },
  
  /**
   * Update camp UI
   */
  updateCampUI() {
    const player = GameState.get('player');
    const metaZenny = GameState.get('metaZenny');
    const currentDay = GameState.get('currentDay');
    
    // Update day display
    const dayDisplay = document.getElementById('camp-day');
    if (dayDisplay) {
      dayDisplay.textContent = currentDay;
    }
    
    // Update zenny displays
    const journeyZenny = document.getElementById('camp-zenny');
    const metaZennyDisplay = document.getElementById('camp-meta-zenny');
    
    if (journeyZenny) journeyZenny.textContent = player.zenny;
    if (metaZennyDisplay) metaZennyDisplay.textContent = metaZenny;
  },
  
  /**
   * Show damage animation
   * @param {Object} data - Animation data
   */
  showDamageAnimation(data) {
    const { target, amount, isPoison = false } = data;
    const battleEffects = document.getElementById('battle-effects');
    if (!battleEffects) return;
    
    // Create effect element
    const effect = document.createElement('div');
    
    // Set class based on effect type
    if (amount > 0) {
      effect.className = isPoison ? 'poison-text' : 'damage-text';
      effect.textContent = `-${amount}`;
    } else {
      effect.className = 'heal-text';
      effect.textContent = `+${Math.abs(amount)}`;
    }
    
    // Position based on target
    if (target === 'player') {
      effect.style.bottom = '40%';
      effect.style.left = '20%';
    } else {
      effect.style.top = '30%';
      effect.style.right = '40%';
    }
    
    // Add to battle effects container
    battleEffects.appendChild(effect);
    
    // Remove after animation completes
    setTimeout(() => {
      effect.remove();
    }, 1500);
  },
  
  /**
   * Show victory effect
   */
  showVictoryEffect() {
    const battleScreen = document.getElementById('battle-screen');
    if (!battleScreen) return;
    
    // Create victory text
    const victoryText = document.createElement('div');
    victoryText.className = 'victory-text';
    victoryText.textContent = 'VICTORY!';
    
    // Add to battle screen
    battleScreen.appendChild(victoryText);
    
    // Play victory sound
    EventBus.emit('PLAY_SOUND', { sound: 'VICTORY' });
    
    // Remove after transition
    setTimeout(() => {
      victoryText.remove();
    }, 1500);
  },
  
  /**
   * Show defeat effect
   */
  showDefeatEffect() {
    const battleScreen = document.getElementById('battle-screen');
    if (!battleScreen) return;
    
    // Create defeat text
    const defeatText = document.createElement('div');
    defeatText.className = 'defeat-text';
    defeatText.textContent = 'DEFEAT';
    
    // Add to battle screen
    battleScreen.appendChild(defeatText);
    
    // Play defeat sound
    EventBus.emit('PLAY_SOUND', { sound: 'DEFEAT' });
    
    // Remove after transition
    setTimeout(() => {
      defeatText.remove();
    }, 1500);
  },
  
  /**
   * Show loading overlay
   * @param {String} message - Loading message
   */
  showLoading(message = 'Loading...') {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) return;
    
    const loadingMessage = loadingOverlay.querySelector('.loading-message');
    if (loadingMessage) {
      loadingMessage.textContent = message;
    }
    
    loadingOverlay.style.display = 'flex';
  },
  
  /**
   * Hide loading overlay
   */
  hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  },
  
  /**
   * Show error message
   * @param {String} message - Error message
   * @param {Boolean} isFatal - Whether error is fatal
   */
  showError(message, isFatal = false) {
    console.error("Game error:", message);
    
    try {
      const errorOverlay = document.getElementById('error-overlay');
      
      if (!errorOverlay) {
        alert(message); // Fallback if overlay not found
        return;
      }
      
      const errorMessage = errorOverlay.querySelector('.error-message');
      const errorCloseBtn = errorOverlay.querySelector('.error-close');
      
      if (errorMessage) {
        errorMessage.textContent = message;
      }
      
      if (errorCloseBtn) {
        errorCloseBtn.textContent = isFatal ? 'Restart Game' : 'Continue';
        errorCloseBtn.onclick = () => {
          this.hideError();
          if (isFatal) {
            window.location.reload();
          }
        };
      }
      
      errorOverlay.style.display = 'flex';
    } catch (e) {
      // Fallback to alert if showing the error overlay fails
      console.error("Error showing error overlay:", e);
      alert(message);
    }
  },
  
  /**
   * Hide error overlay
   */
  hideError() {
    const errorOverlay = document.getElementById('error-overlay');
    if (errorOverlay) {
      errorOverlay.style.display = 'none';
    }
  },
};

export default BaseRenderer;