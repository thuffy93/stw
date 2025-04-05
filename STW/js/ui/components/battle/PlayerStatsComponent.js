// STW/js/ui/components/battle/PlayerStatsComponent.js
import { Component } from '../Component.js';
import { EventBus } from '../../../core/eventbus.js';
import { GameState } from '../../../core/state.js';

/**
 * Player stats component for displaying player statistics in battle
 */
export class PlayerStatsComponent extends Component {
  /**
   * Create a new player stats component
   */
  constructor() {
    super('player-stats', `
      <div id="player-stats">
        <div id="player-class-display">
          <span id="player-class">None</span>
          <div id="player-buffs"></div>
        </div>
        <div class="health-container">
          <div class="health-bar">
            <div id="player-health-bar"></div>
            <div class="health-text">
              <span id="player-health">30</span>/<span id="player-max-health">30</span>
            </div>
          </div>
        </div>
        <div class="stamina-container">
          <div class="stamina-bar">
            <div id="stamina-fill"></div>
            <div id="stamina-text">3/3</div>
          </div>
        </div>
        <div class="resources">
          <p>Zenny: <span id="zenny">0</span></p>
        </div>
      </div>
    `);
    
    // Subscribe to relevant events
    this.subscribeToEvent('CHARACTER_CREATED', this.updatePlayer);
    this.subscribeToEvent('DAMAGE_TAKEN', this.updateAfterDamage);
    this.subscribeToEvent('PLAYER_HEALED', this.updateAfterHealing);
    this.subscribeToEvent('STAMINA_UPDATED', this.updateStamina);
    this.subscribeToEvent('BUFF_APPLIED', this.updateBuffs);
    this.subscribeToEvent('ZENNY_UPDATED', this.updateZenny);
  }
  
  /**
   * Update player information display
   * @param {Object} data - Player data
   */
  updatePlayer(data) {
    const player = data?.character || GameState.get('player');
    
    if (!player) {
      console.warn("No player data available");
      return;
    }
    
    // Update class
    const classElement = this.element.querySelector('#player-class');
    if (classElement) classElement.textContent = player.class || 'None';
    
    // Update health
    const healthElement = this.element.querySelector('#player-health');
    const maxHealthElement = this.element.querySelector('#player-max-health');
    
    if (healthElement) healthElement.textContent = player.health;
    if (maxHealthElement) maxHealthElement.textContent = player.maxHealth;
    
    // Update health bar
    const healthBar = this.element.querySelector('#player-health-bar');
    if (healthBar) {
      const healthPercent = (player.health / player.maxHealth) * 100;
      healthBar.style.width = `${healthPercent}%`;
    }
    
    // Update stamina
    this.updateStamina({
      current: player.stamina,
      max: player.baseStamina
    });
    
    // Update zenny
    const zennyElement = this.element.querySelector('#zenny');
    if (zennyElement) zennyElement.textContent = player.zenny;
    
    // Update buffs
    this.updateBuffs({ target: 'player', buff: null }); // Will grab buffs from GameState
  }
  
  /**
   * Update player health after damage
   * @param {Object} data - Damage data
   */
  updateAfterDamage(data) {
    if (data.target !== 'player') return;
    
    const player = GameState.get('player');
    if (!player) return;
    
    // Update health display
    const healthElement = this.element.querySelector('#player-health');
    if (healthElement) healthElement.textContent = player.health;
    
    // Update health bar
    const healthBar = this.element.querySelector('#player-health-bar');
    if (healthBar) {
      const healthPercent = (player.health / player.maxHealth) * 100;
      healthBar.style.width = `${healthPercent}%`;
    }
  }
  
  /**
   * Update player health after healing
   * @param {Object} data - Healing data
   */
  updateAfterHealing(data) {
    const player = GameState.get('player');
    if (!player) return;
    
    // Update health display
    const healthElement = this.element.querySelector('#player-health');
    if (healthElement) healthElement.textContent = player.health;
    
    // Update health bar
    const healthBar = this.element.querySelector('#player-health-bar');
    if (healthBar) {
      const healthPercent = (player.health / player.maxHealth) * 100;
      healthBar.style.width = `${healthPercent}%`;
    }
  }
  
  /**
   * Update stamina display
   * @param {Object} data - Stamina data
   */
  updateStamina(data) {
    const staminaFill = this.element.querySelector('#stamina-fill');
    const staminaText = this.element.querySelector('#stamina-text');
    
    if (!staminaFill || !staminaText) return;
    
    const current = data.current !== undefined ? data.current : GameState.get('player.stamina');
    const max = data.max !== undefined ? data.max : GameState.get('player.baseStamina');
    
    // Update stamina bar
    const staminaPercent = (current / max) * 100;
    staminaFill.style.width = `${staminaPercent}%`;
    
    // Update stamina classes based on level
    staminaFill.classList.remove("full", "medium", "low");
    if (current === max) staminaFill.classList.add("full");
    else if (current >= max * 0.5) staminaFill.classList.add("medium");
    else staminaFill.classList.add("low");
    
    // Update stamina text
    staminaText.textContent = `${current}/${max}`;
  }
  
  /**
   * Update player buffs display
   * @param {Object} data - Buff data
   */
  updateBuffs(data) {
    if (data.target !== 'player') return;
    
    const player = GameState.get('player');
    if (!player || !player.buffs) return;
    
    const buffsContainer = this.element.querySelector('#player-buffs');
    if (!buffsContainer) return;
    
    // Clear existing buffs
    buffsContainer.innerHTML = '';
    
    // Add each buff
    player.buffs.forEach(buff => {
      const buffIcon = document.createElement('div');
      buffIcon.className = `buff-icon ${buff.type}`;
      
      // Set icon and tooltip based on buff type
      switch (buff.type) {
        case 'focused':
          buffIcon.textContent = '✦';
          buffIcon.setAttribute('data-tooltip', `Focused: Increases damage and healing by 20%\nRemaining: ${buff.turns} turn(s)`);
          break;
        case 'defense':
          buffIcon.textContent = '🛡️';
          buffIcon.setAttribute('data-tooltip', `Defense: Reduces damage by 50%\nRemaining: ${buff.turns} turn(s)`);
          break;
        case 'stunned':
          buffIcon.textContent = '💫';
          buffIcon.setAttribute('data-tooltip', `Stunned: Cannot take actions\nRemaining: ${buff.turns} turn(s)`);
          break;
        default:
          buffIcon.textContent = '⚡';
          buffIcon.setAttribute('data-tooltip', `${buff.type}\nRemaining: ${buff.turns} turn(s)`);
      }
      
      // Add turns remaining
      const turnsSpan = document.createElement('span');
      turnsSpan.className = 'turns';
      turnsSpan.textContent = buff.turns;
      buffIcon.appendChild(turnsSpan);
      
      // Add to container
      buffsContainer.appendChild(buffIcon);
    });
  }
  
  /**
   * Update zenny display
   * @param {Object} data - Zenny data
   */
  updateZenny(data) {
    const zennyElement = this.element.querySelector('#zenny');
    if (!zennyElement) return;
    
    const zenny = data.current !== undefined ? data.current : GameState.get('player.zenny');
    zennyElement.textContent = zenny;
  }
  
  /**
   * Update component with new data
   * @param {Object} data - Update data
   */
  update(data) {
    if (data.player) {
      this.updatePlayer({ character: data.player });
    }
    
    if (data.stamina) {
      this.updateStamina(data.stamina);
    }
    
    if (data.zenny !== undefined) {
      this.updateZenny({ current: data.zenny });
    }
  }
}

export default PlayerStatsComponent;