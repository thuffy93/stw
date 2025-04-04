// STW/js/ui/components/screens/BattleScreen.js
import { Component } from '../Component.js';
import { HandComponent } from '../battle/HandComponent.js';
import { ButtonComponent } from '../common/ButtonComponent.js';
import { EventBus } from '../../../core/eventbus.js';
import { GameState } from '../../../core/state.js';

/**
 * Battle screen component
 */
export class BattleScreen extends Component {
  constructor() {
    super('battle-screen', `
      <div id="battle-screen" class="screen">
        <div id="battle-container">
          <!-- Day/Phase indicator -->
          <div id="day-phase-indicator"></div>
          <div id="turn-indicator-container"></div>
          
          <!-- Enemy section -->
          <div id="enemy-section">
            <div id="enemy-stats">
              <span id="enemy-name">Enemy</span>
              <div class="health-bar">
                <div id="enemy-health-bar"></div>
                <span id="enemy-health">20</span>/<span id="enemy-max-health">20</span>
              </div>
              <div id="enemy-buffs"></div>
            </div>
          </div>
          
          <!-- Battle effects container -->
          <div id="battle-effects"></div>
          
          <!-- Hand container -->
          <div id="hand-container"></div>
          
          <!-- Player section -->
          <div id="player-section">
            <div id="player-stats">
              <div id="player-buffs"></div>
              <div class="health-bar">
                <div id="player-health-bar"></div>
                <span id="player-health">30</span>/<span id="player-max-health">30</span>
              </div>
              <div class="stamina-bar">
                <div id="stamina-fill"></div>
                <span id="stamina-text">3/3</span>
              </div>
              <p>Zenny: <span id="zenny">0</span></p>
            </div>
          </div>
          
          <!-- Battle controls -->
          <div id="battle-controls">
            <div id="execute-btn-container"></div>
            <div id="wait-btn-container"></div>
            <div id="discard-end-btn-container"></div>
            <div id="end-turn-btn-container"></div>
            <div id="flee-btn-container"></div>
          </div>
          
          <!-- Gem bag info -->
          <div id="gem-bag-container">
            Gem Bag: <span id="gem-bag-count">0</span>/<span id="gem-bag-total">20</span>
          </div>
        </div>
      </div>
    `);
    
    // Create child components
    this.hand = new HandComponent({ context: 'battle' });
    
    // Create action buttons
    this.executeButton = new ButtonComponent('execute-btn', 'Execute', {
      className: 'btn-execute',
      eventName: 'EXECUTE_GEMS',
      disabled: true
    });
    
    this.waitButton = new ButtonComponent('wait-btn', 'Wait', {
      className: 'btn-primary',
      eventName: 'WAIT_TURN'
    });
    
    this.discardEndButton = new ButtonComponent('discard-end-btn', 'Discard & End', {
      className: 'btn-secondary',
      eventName: 'DISCARD_AND_END',
      disabled: true
    });
    
    this.endTurnButton = new ButtonComponent('end-turn-btn', 'End Turn', {
      className: 'btn-end-turn',
      eventName: 'END_TURN'
    });
    
    this.fleeButton = new ButtonComponent('flee-btn', 'Flee', {
      className: 'btn-flee',
      eventName: 'FLEE_BATTLE'
    });
    
    // Add child components
    this.addChild(this.hand)
        .addChild(this.executeButton)
        .addChild(this.waitButton)
        .addChild(this.discardEndButton)
        .addChild(this.endTurnButton)
        .addChild(this.fleeButton);
    
    // Subscribe to events
    this.subscribeToEvent('BATTLE_UI_UPDATE', this.update);
    this.subscribeToEvent('SHOW_DAMAGE', this.showDamageAnimation);
    this.subscribeToEvent('SHOW_VICTORY', this.showVictoryEffect);
    this.subscribeToEvent('SHOW_DEFEAT', this.showDefeatEffect);
  }
  
  /**
   * Override render to set phase styling
   */
  render() {
    const element = super.render();
    
    // Get current phase
    const currentPhaseIndex = GameState.get('currentPhaseIndex') || 0;
    const phaseNames = ["dawn", "dusk", "dark"];
    const phaseName = phaseNames[currentPhaseIndex] || "dawn";
    
    // Add phase class
    element.classList.add(phaseName);
    
    // Update UI with current data
    this.updateBattleUI();
    
    return element;
  }
  
  /**
   * Update the battle UI with current state
   */
  updateBattleUI() {
    const player = GameState.get('player');
    const enemy = GameState.get('battle.enemy');
    const currentDay = GameState.get('currentDay') || 1;
    const currentPhaseIndex = GameState.get('currentPhaseIndex') || 0;
    const isEnemyTurnPending = GameState.get('isEnemyTurnPending') || false;
    const selectedGems = GameState.get('selectedGems') || new Set();
    const gemBag = GameState.get('gemBag') || [];
    
    // Update phase indicator
    this.updatePhaseIndicator(currentDay, currentPhaseIndex);
    
    // Update turn indicator
    this.updateTurnIndicator(isEnemyTurnPending);
    
    // Update player stats
    this.updatePlayerStats(player);
    
    // Update enemy stats
    this.updateEnemyStats(enemy);
    
    // Update gem bag info
    this.updateGemBagInfo(gemBag);
    
    // Update button states
    this.updateButtonStates({
      player,
      isEnemyTurnPending,
      selectedGems,
      battleOver: GameState.get('battleOver') || false,
      hasActedThisTurn: GameState.get('hasActedThisTurn') || false,
      hasPlayedGemThisTurn: GameState.get('hasPlayedGemThisTurn') || false
    });
  }
  
  /**
   * Update the phase indicator
   * @param {Number} day - Current day
   * @param {Number} phaseIndex - Current phase index
   */
  updatePhaseIndicator(day, phaseIndex) {
    const phaseIndicator = this.element.querySelector('#day-phase-indicator');
    if (!phaseIndicator) return;
    
    const phaseNames = ["Dawn", "Dusk", "Dark"];
    const phaseName = phaseNames[phaseIndex] || "Dawn";
    const phaseSymbols = ["☀️", "🌅", "🌙"];
    
    phaseIndicator.textContent = `Day ${day} ${phaseSymbols[phaseIndex]}`;
    
    // Update screen phase class
    const phaseClasses = ["dawn", "dusk", "dark"];
    this.element.className = `screen active ${phaseClasses[phaseIndex] || "dawn"}`;
  }
  
  /**
   * Update the turn indicator
   * @param {Boolean} isEnemyTurn - Whether it's the enemy's turn
   */
  updateTurnIndicator(isEnemyTurn) {
    const turnIndicator = this.element.querySelector('#turn-indicator-container');
    if (!turnIndicator) return;
    
    // Clear current content
    turnIndicator.innerHTML = '';
    
    // Create turn indicator
    const indicator = document.createElement('div');
    indicator.id = 'turn-indicator';
    indicator.className = isEnemyTurn ? 'enemy' : 'player';
    indicator.textContent = isEnemyTurn ? "Enemy Turn" : "Your Turn";
    
    turnIndicator.appendChild(indicator);
  }
  
  /**
   * Update player stats display
   * @param {Object} player - Player data
   */
  updatePlayerStats(player) {
    // Update health
    const playerHealth = this.element.querySelector('#player-health');
    const playerMaxHealth = this.element.querySelector('#player-max-health');
    const playerHealthBar = this.element.querySelector('#player-health-bar');
    
    if (playerHealth) playerHealth.textContent = player.health;
    if (playerMaxHealth) playerMaxHealth.textContent = player.maxHealth;
    
    if (playerHealthBar) {
      const healthPercent = (player.health / player.maxHealth) * 100;
      playerHealthBar.style.width = `${healthPercent}%`;
    }
    
    // Update stamina
    this.updateStaminaDisplay(player.stamina, player.baseStamina);
    
    // Update zenny
    const zennyDisplay = this.element.querySelector('#zenny');
    if (zennyDisplay) zennyDisplay.textContent = player.zenny;
    
    // Update buffs
    this.updateBuffsDisplay(player.buffs, 'player');
  }
  
  /**
   * Update stamina display
   * @param {Number} stamina - Current stamina
   * @param {Number} baseStamina - Max stamina
   */
  updateStaminaDisplay(stamina, baseStamina) {
    const staminaFill = this.element.querySelector('#stamina-fill');
    const staminaText = this.element.querySelector('#stamina-text');
    
    if (!staminaFill || !staminaText) return;
    
    // Update stamina bar
    const staminaPercent = (stamina / baseStamina) * 100;
    staminaFill.style.width = `${staminaPercent}%`;
    
    // Update stamina classes based on level
    staminaFill.classList.remove("full", "medium", "low");
    if (stamina === baseStamina) staminaFill.classList.add("full");
    else if (stamina === 2) staminaFill.classList.add("medium");
    else if (stamina <= 1) staminaFill.classList.add("low");
    
    // Update stamina text
    staminaText.textContent = `${stamina}/${baseStamina}`;
  }
  
  /**
   * Update enemy stats display
   * @param {Object} enemy - Enemy data
   */
  updateEnemyStats(enemy) {
    // Get elements
    const enemyName = this.element.querySelector('#enemy-name');
    const enemyHealth = this.element.querySelector('#enemy-health');
    const enemyMaxHealth = this.element.querySelector('#enemy-max-health');
    const enemyHealthBar = this.element.querySelector('#enemy-health-bar');
    
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
    
    // Update buffs
    this.updateBuffsDisplay(enemy.buffs, 'enemy');
  }
  
  /**
   * Update buffs display
   * @param {Array} buffs - Array of buff objects
   * @param {String} target - 'player' or 'enemy'
   */
  updateBuffsDisplay(buffs, target) {
    const buffsContainer = this.element.querySelector(`#${target}-buffs`);
    if (!buffsContainer) return;
    
    // Clear current buffs
    buffsContainer.innerHTML = '';
    
    // If no buffs, exit early
    if (!buffs || !buffs.length) return;
    
    // Add each buff
    buffs.forEach(buff => {
      const buffIcon = this.createBuffIcon(buff);
      buffsContainer.appendChild(buffIcon);
    });
  }
  
  /**
   * Create a buff icon element
   * @param {Object} buff - Buff data
   * @returns {HTMLElement} Buff icon element
   */
  createBuffIcon(buff) {
    const icon = document.createElement('div');
    icon.className = `buff-icon ${buff.type}`;
    
    // Set icon based on buff type
    icon.innerHTML = this.getBuffIcon(buff.type);
    
    // Add turns indicator
    const turns = document.createElement('span');
    turns.className = 'turns';
    turns.textContent = buff.turns;
    icon.appendChild(turns);
    
    // Add tooltip
    icon.setAttribute('data-tooltip', this.getBuffDescription(buff));
    
    return icon;
  }
  
  /**
   * Get icon for a buff
   * @param {String} buffType - Type of buff
   * @returns {String} Icon character
   */
  getBuffIcon(buffType) {
    switch (buffType) {
      case "focused": return "✦";
      case "defense": return "🛡️";
      case "stunned": return "💫";
      case "poison": return "☠️";
      default: return "⚡";
    }
  }
  
  /**
   * Get description for a buff
   * @param {Object} buff - Buff data
   * @returns {String} Description text
   */
  getBuffDescription(buff) {
    const turns = buff.turns > 1 ? 's' : '';
    
    switch (buff.type) {
      case "focused":
        return `Focused\nIncreases damage and healing by 20%\nRemaining: ${buff.turns} turn${turns}`;
      case "defense":
        return `Defense\nReduces incoming damage by 50%\nRemaining: ${buff.turns} turn${turns}`;
      case "stunned":
        return `Stunned\nCannot take actions this turn\nRemaining: ${buff.turns} turn${turns}`;
      case "poison":
        return `Poison\nTaking ${buff.damage} damage per turn\nRemaining: ${buff.turns} turn${turns}`;
      default:
        return `${buff.type}\nRemaining: ${buff.turns} turn${turns}`;
    }
  }
  
  /**
   * Update gem bag info
   * @param {Array} gemBag - Current gem bag
   */
  updateGemBagInfo(gemBag) {
    const gemBagCount = this.element.querySelector('#gem-bag-count');
    const gemBagTotal = this.element.querySelector('#gem-bag-total');
    
    if (gemBagCount) gemBagCount.textContent = gemBag.length;
    if (gemBagTotal) gemBagTotal.textContent = "20"; // MAX_GEM_BAG_SIZE
  }
  
  /**
   * Update button states based on game state
   * @param {Object} data - State data
   */
  updateButtonStates(data) {
    const { 
      player, 
      isEnemyTurnPending, 
      selectedGems, 
      battleOver,
      hasActedThisTurn,
      hasPlayedGemThisTurn
    } = data;
    
    // Check if player is stunned
    const isStunned = player.buffs && player.buffs.some(b => b.type === "stunned");
    
    // Check if player can execute gems
    const hand = GameState.get('hand') || [];
    const canPlayGems = selectedGems.size > 0 && 
                    Array.from(selectedGems).every(i => hand[i]) &&
                    player.stamina >= Math.min(...Array.from(selectedGems).map(i => hand[i].cost));
    
    // Update button states
    this.executeButton.update({
      disabled: battleOver || !canPlayGems || isEnemyTurnPending || isStunned
    });
    
    this.waitButton.update({
      disabled: battleOver || isEnemyTurnPending || hasActedThisTurn || hasPlayedGemThisTurn || isStunned
    });
    
    this.discardEndButton.update({
      disabled: battleOver || !selectedGems.size || isEnemyTurnPending || hasActedThisTurn || isStunned
    });
    
    this.endTurnButton.update({
      disabled: battleOver || isEnemyTurnPending || isStunned
    });
    
    // Show/hide flee button based on phase and state
    const currentPhaseIndex = GameState.get('currentPhaseIndex') || 0;
    if (currentPhaseIndex < 2 && !battleOver && !isEnemyTurnPending && !isStunned) {
      this.fleeButton.show();
    } else {
      this.fleeButton.hide();
    }
  }
  
  /**
   * Show damage/healing animation
   * @param {Object} data - Animation data
   */
  showDamageAnimation(data) {
    const { target, amount, isPoison = false } = data;
    const battleEffects = this.element.querySelector('#battle-effects');
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
  }
  
  /**
   * Show victory effect
   */
  showVictoryEffect() {
    // Create victory text
    const victoryText = document.createElement('div');
    victoryText.className = 'victory-text';
    victoryText.textContent = 'VICTORY!';
    
    // Add to battle screen
    this.element.appendChild(victoryText);
    
    // Remove after transition
    setTimeout(() => {
      victoryText.remove();
    }, 1500);
  }
  
  /**
   * Show defeat effect
   */
  showDefeatEffect() {
    // Create defeat text
    const defeatText = document.createElement('div');
    defeatText.className = 'defeat-text';
    defeatText.textContent = 'DEFEAT';
    
    // Add to battle screen
    this.element.appendChild(defeatText);
    
    // Remove after transition
    setTimeout(() => {
      defeatText.remove();
    }, 1500);
  }
  
  /**
   * Update component with new data
   * @param {Object} data - Update data
   */
  update(data) {
    // Handle different types of updates
    if (data.hand) {
      // Update hand is handled by child HandComponent
    }
    
    if (data.player) {
      this.updatePlayerStats(data.player);
    }
    
    if (data.enemy) {
      this.updateEnemyStats(data.enemy);
    }
    
    if (data.battle) {
      if (data.battle.day !== undefined && data.battle.phase !== undefined) {
        this.updatePhaseIndicator(data.battle.day, data.battle.phase);
      }
      
      if (data.battle.isEnemyTurn !== undefined) {
        this.updateTurnIndicator(data.battle.isEnemyTurn);
      }
      
      // Update button states
      this.updateButtonStates({
        player: GameState.get('player'),
        isEnemyTurnPending: data.battle.isEnemyTurn,
        selectedGems: data.battle.selectedGems || GameState.get('selectedGems') || new Set(),
        battleOver: data.battle.battleOver,
        hasActedThisTurn: GameState.get('hasActedThisTurn') || false,
        hasPlayedGemThisTurn: GameState.get('hasPlayedGemThisTurn') || false
      });
    }
    
    if (data.gems && data.gems.gemBag) {
      this.updateGemBagInfo(data.gems.gemBag);
    }
  }
}