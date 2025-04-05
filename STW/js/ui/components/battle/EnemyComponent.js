// STW/js/ui/components/battle/EnemyComponent.js
import { Component } from '../Component.js';
import { EventBus } from '../../../core/eventbus.js';
import { GameState } from '../../../core/state.js';

/**
 * Enemy component for displaying enemy information in battle
 */
export class EnemyComponent extends Component {
  /**
   * Create a new enemy component
   */
  constructor() {
    super('enemy-section', `
      <div id="enemy-section">
        <div id="enemy-stats">
          <div class="enemy-header">
            <span id="enemy-name">Enemy</span>
            <div id="enemy-buffs"></div>
          </div>
          <div class="enemy-health-container">
            <div class="health-bar">
              <div id="enemy-health-bar"></div>
              <div class="health-text">
                <span id="enemy-health">20</span>/<span id="enemy-max-health">20</span>
              </div>
            </div>
          </div>
          <div class="enemy-actions">
            <div class="current-action">
              <span class="action-label">Next Action:</span>
              <span id="enemy-current-action">Unknown</span>
              <span id="enemy-attack" class="hidden"></span>
            </div>
            <div id="enemy-condition"></div>
          </div>
        </div>
        <div id="enemy-appearance">
          <div class="enemy-avatar">
            <div class="enemy-image"></div>
          </div>
        </div>
      </div>
    `);
    
    // Subscribe to relevant events
    this.subscribeToEvent('BATTLE_INITIALIZED', this.updateEnemy);
    this.subscribeToEvent('DAMAGE_TAKEN', this.updateAfterDamage);
    this.subscribeToEvent('BUFF_APPLIED', this.updateBuffs);
  }
  
  /**
   * Update enemy display with new enemy data
   * @param {Object} data - Enemy data
   */
  updateEnemy(data) {
    const enemy = data?.enemy || GameState.get('battle.enemy');
    
    if (!enemy) {
      // No enemy data available
      this.resetEnemyDisplay();
      return;
    }
    
    // Update enemy name
    const nameElement = this.element.querySelector('#enemy-name');
    if (nameElement) nameElement.textContent = enemy.name || 'Enemy';
    
    // Update health values
    const healthElement = this.element.querySelector('#enemy-health');
    const maxHealthElement = this.element.querySelector('#enemy-max-health');
    
    if (healthElement) healthElement.textContent = Math.max(0, enemy.health || 0);
    if (maxHealthElement) maxHealthElement.textContent = enemy.maxHealth || 0;
    
    // Update health bar
    const healthBar = this.element.querySelector('#enemy-health-bar');
    if (healthBar) {
      const healthPercent = (enemy.health / enemy.maxHealth) * 100;
      healthBar.style.width = `${healthPercent}%`;
    }
    
    // Update enemy appearance
    const enemyAvatar = this.element.querySelector('.enemy-avatar');
    if (enemyAvatar) {
      // Remove any existing class
      enemyAvatar.className = 'enemy-avatar';
      
      // Add appropriate class based on enemy name
      const enemyType = enemy.name.toLowerCase().replace(/\s+/g, '-');
      enemyAvatar.classList.add(`enemy-${enemyType}`);
      
      // Set image content
      const enemyImage = enemyAvatar.querySelector('.enemy-image');
      if (enemyImage) {
        let imageContent = '👹'; // Default
        
        // Set appropriate emoji based on enemy type
        if (enemy.name.includes('Bandit')) imageContent = '💀';
        else if (enemy.name.includes('Wolf')) imageContent = '🐺';
        else if (enemy.name.includes('Guardian') || enemy.name.includes('Boss')) {
          imageContent = '👿';
          enemyAvatar.classList.add('enemy-boss');
        }
        
        enemyImage.textContent = imageContent;
      }
    }
    
    // Update next action
    const actionElement = this.element.querySelector('#enemy-current-action');
    if (actionElement && enemy.currentAction) {
      actionElement.textContent = this.formatAction(enemy.currentAction);
      
      // Update attack value if present
      if (enemy.currentAction.startsWith('Attack')) {
        const attackElement = this.element.querySelector('#enemy-attack');
        if (attackElement) {
          const attackValue = this.extractAttackValue(enemy.currentAction);
          attackElement.textContent = attackValue;
          attackElement.classList.remove('hidden');
        }
      } else {
        // Hide attack value for non-attack actions
        const attackElement = this.element.querySelector('#enemy-attack');
        if (attackElement) attackElement.classList.add('hidden');
      }
    }
    
    // Update buffs
    this.updateBuffs({ target: 'enemy', buff: null }); // Will grab buffs from GameState
  }
  
  /**
   * Update enemy health after damage
   * @param {Object} data - Damage data
   */
  updateAfterDamage(data) {
    if (data.target !== 'enemy') return;
    
    const enemy = GameState.get('battle.enemy');
    if (!enemy) return;
    
    // Update health display
    const healthElement = this.element.querySelector('#enemy-health');
    if (healthElement) healthElement.textContent = Math.max(0, enemy.health);
    
    // Update health bar
    const healthBar = this.element.querySelector('#enemy-health-bar');
    if (healthBar) {
      const healthPercent = (enemy.health / enemy.maxHealth) * 100;
      healthBar.style.width = `${healthPercent}%`;
    }
  }
  
  /**
   * Update enemy buffs display
   * @param {Object} data - Buff data
   */
  updateBuffs(data) {
    if (data.target !== 'enemy') return;
    
    const enemy = GameState.get('battle.enemy');
    if (!enemy || !enemy.buffs) return;
    
    const buffsContainer = this.element.querySelector('#enemy-buffs');
    if (!buffsContainer) return;
    
    // Clear existing buffs
    buffsContainer.innerHTML = '';
    
    // Add each buff
    enemy.buffs.forEach(buff => {
      const buffIcon = document.createElement('div');
      buffIcon.className = `buff-icon ${buff.type}`;
      
      // Set icon and tooltip based on buff type
      switch (buff.type) {
        case 'defense':
          buffIcon.textContent = '🛡️';
          buffIcon.setAttribute('data-tooltip', `Defense: Reduces damage by 50%\nRemaining: ${buff.turns} turn(s)`);
          break;
        case 'poison':
          buffIcon.textContent = '☠️';
          buffIcon.setAttribute('data-tooltip', `Poison: Takes ${buff.damage} damage per turn\nRemaining: ${buff.turns} turn(s)`);
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
   * Format enemy action for display
   * @param {String} action - Raw action string
   * @returns {String} Formatted action
   */
  formatAction(action) {
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
  }
  
  /**
   * Extract attack value from action string
   * @param {String} action - Action string
   * @returns {Number} Attack value
   */
  extractAttackValue(action) {
    try {
      const parts = action.split(' ');
      return parseInt(parts[1]) || 5; // Default to 5 if parsing fails
    } catch (e) {
      return 5;
    }
  }
  
  /**
   * Reset the enemy display when no enemy is present
   */
  resetEnemyDisplay() {
    const nameElement = this.element.querySelector('#enemy-name');
    const healthElement = this.element.querySelector('#enemy-health');
    const maxHealthElement = this.element.querySelector('#enemy-max-health');
    const healthBar = this.element.querySelector('#enemy-health-bar');
    const actionElement = this.element.querySelector('#enemy-current-action');
    const buffContainer = this.element.querySelector('#enemy-buffs');
    
    // Reset text content
    if (nameElement) nameElement.textContent = 'No Enemy';
    if (healthElement) healthElement.textContent = '0';
    if (maxHealthElement) maxHealthElement.textContent = '0';
    if (healthBar) healthBar.style.width = '0%';
    if (actionElement) actionElement.textContent = 'None';
    if (buffContainer) buffContainer.innerHTML = '';
  }
  
  /**
   * Update component with new data
   * @param {Object} data - Update data
   */
  update(data) {
    if (data.enemy) {
      this.updateEnemy({ enemy: data.enemy });
    }
  }
}

export default EnemyComponent;