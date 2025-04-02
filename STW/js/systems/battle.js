import { GameState } from '../core/state.js';
import { EventBus } from '../core/events.js';
import { GEM_TYPES } from '../core/config.js';

export function drawGems(count) {
    const hand = document.getElementById('hand');
    hand.innerHTML = '';
  
    // Get all gem type keys
    const gemTypeKeys = Object.keys(GEM_TYPES);
    
    for (let i = 0; i < count; i++) {
      // Select random gem type
      const randomTypeKey = gemTypeKeys[Math.floor(Math.random() * gemTypeKeys.length)];
      const gemType = GEM_TYPES[randomTypeKey];
      
      const gem = createGemElement(gemType);
      hand.appendChild(gem);
    }
}

export function initBattle() {
    console.log("Initializing battle...");
    
    // 1. Initialize enemy data
    if (!GameState.data.battle.enemy) {
      GameState.setState('battle.enemy', {
        name: "Grunt",
        health: 20,
        maxHealth: 20,
        attack: 5
      });
    }
  
    // 2. Update displays
    updateEnemyDisplay();
    drawGems(3);
  
    // 3. Safely set up end turn button
    const endTurnBtn = document.getElementById('end-turn-btn');
    if (!endTurnBtn) {
      console.error("End Turn button not found!");
      return;
    }
    
    // Remove any existing event listeners to prevent duplicates
    const newEndTurnBtn = endTurnBtn.cloneNode(true);
    endTurnBtn.parentNode.replaceChild(newEndTurnBtn, endTurnBtn);
    newEndTurnBtn.addEventListener('click', endPlayerTurn);
}

export function startEnemyTurn() {
    console.log("Enemy turn started");
    
    const enemy = GameState.data.battle.enemy || { 
      name: "Grunt", 
      health: 20, 
      attack: 5 
    };
    
    const player = GameState.data.player;

    // Simple enemy AI: 50% chance to attack or defend
    if (Math.random() > 0.5) {
      // Calculate damage considering shield if present
      const rawDamage = enemy.attack;
      const shieldValue = player.buffs?.shield || 0;
      const damage = Math.max(0, rawDamage - shieldValue);
      
      GameState.setState('player.health', player.health - damage);
      showDamageEffect(damage, 'player');
      
      // Update shield duration
      if (player.buffs && player.buffs.shield > 0) {
        const newTurns = player.buffs.shieldTurns - 1;
        GameState.setState('player.buffs.shieldTurns', newTurns);
        
        if (newTurns <= 0) {
          GameState.setState('player.buffs.shield', 0);
          document.querySelector('.buff-icon.shield')?.remove();
        }
      }
    } else {
      console.log(`${enemy.name} defends!`);
    }
  
    // Return to player turn after delay
    setTimeout(() => {
      EventBus.emit('TURN_END', { turn: 'player' });
      drawGems(3); // Draw new gems
    }, 1500);
}
  
function playGem(gemType, gemElement) {
    const player = GameState.data.player;
    const enemy = GameState.data.battle.enemy || { health: 20, maxHealth: 20 };
  
    // Check stamina
    if (player.stamina < gemType.staminaCost) {
      gemElement.classList.add('disabled');
      setTimeout(() => gemElement.classList.remove('disabled'), 500);
      return;
    }
  
    // Deduct stamina
    GameState.setState('player.stamina', player.stamina - gemType.staminaCost);
  
    // Apply effects
    switch(gemType.name) {
      case 'Attack':
        const damage = calculateDamage(gemType, player);
        GameState.setState('battle.enemy.health', Math.max(0, enemy.health - damage));
        showDamageEffect(damage, 'enemy');
        break;
  
      case 'Heal':
        const healAmount = gemType.effect;
        GameState.setState('player.health', 
          Math.min(player.maxHealth, player.health + healAmount));
        showHealEffect(healAmount);
        break;
  
      case 'Shield':
        // Initialize buffs if undefined (safety check)
        if (!player.buffs) {
          GameState.setState('player.buffs', { shield: 0, shieldTurns: 0 });
        }
        GameState.setState('player.buffs.shield', gemType.defense);
        GameState.setState('player.buffs.shieldTurns', gemType.duration);
        showShieldEffect();
        break;
    }
  
    // Remove gem
    gemElement.remove();
}
  
function calculateDamage(gemType, player) {
    // Handle different gem color formats
    if (gemType.colors) {
      // For gems with color-specific damage values
      const color = player.class?.toLowerCase() || 'red';
      const baseDamage = gemType.colors[color] || 3;
      return Math.floor(baseDamage * (player.gemBonus?.[gemType.color] || 1));
    } else {
      // For gems with a single damage value
      const baseDamage = gemType.damage || 3;
      return Math.floor(baseDamage * (player.gemBonus?.[gemType.color] || 1));
    }
}

function showShieldEffect() {
    // Remove existing shield icon if present
    const existingShield = document.querySelector('.buff-icon.shield');
    if (existingShield) {
        existingShield.remove();
    }
    
    const shieldIcon = document.createElement('div');
    shieldIcon.className = 'buff-icon shield';
    shieldIcon.textContent = '🛡️';
    
    const playerBuffs = GameState.data.player.buffs || { shield: 0, shieldTurns: 0 };
    shieldIcon.dataset.tooltip = `Shield: ${playerBuffs.shield} (${playerBuffs.shieldTurns} turns)`;
    
    const buffContainer = document.getElementById('player-buffs');
    if (buffContainer) {
        buffContainer.appendChild(shieldIcon);
    }
}

export function endPlayerTurn() {
    GameState.setState('battle.turn', 'enemy');
    EventBus.emit('TURN_END', { turn: 'enemy' });
}

export function updateEnemyDisplay() {
    const enemyNameElem = document.getElementById('enemy-name');
    const enemyHealthElem = document.getElementById('enemy-health');
    const enemyMaxHealthElem = document.getElementById('enemy-max-health');
    
    // Check if elements exist before updating
    if (!enemyNameElem || !enemyHealthElem || !enemyMaxHealthElem) {
      console.error("Missing enemy display elements!");
      return;
    }
  
    const enemy = GameState.data.battle.enemy || { 
      name: "Grunt", 
      health: 20,
      maxHealth: 20
    };
  
    enemyNameElem.textContent = enemy.name;
    enemyHealthElem.textContent = enemy.health;
    enemyMaxHealthElem.textContent = enemy.maxHealth;
    
    // Update health bar
    const healthBar = document.getElementById('enemy-health-bar');
    if (healthBar) {
        const percent = (enemy.health / enemy.maxHealth) * 100;
        healthBar.style.width = `${percent}%`;
    }
}

function showDamageEffect(amount, target) {
    // Update health display immediately
    const targetData = target === 'player' ? 
        GameState.data.player : 
        GameState.data.battle.enemy;
        
    if (!targetData) return;
    
    // Create damage text effect
    const element = document.createElement('div');
    element.className = `damage-text ${target}-damage`;
    element.textContent = `-${amount}`;
    
    const section = document.getElementById(`${target}-section`);
    if (section) {
        section.appendChild(element);
        setTimeout(() => element.remove(), 1000);
    }
}

function createGemElement(gemType) {
    const gem = document.createElement('div');
    gem.className = `gem ${gemType.color || 'red'}`;
    
    gem.innerHTML = `
      <div class="gem-icon">${gemType.icon}</div>
      <div class="gem-cost">${gemType.staminaCost || 2}</div>
    `;
  
    // Add tooltip with information
    gem.dataset.tooltip = `${gemType.name}: ${gemType.effect || gemType.colors?.[gemType.color] || 'Special effect'}`;
  
    // Use arrow function to maintain proper context
    gem.addEventListener('click', (event) => {
      playGem(gemType, event.currentTarget);
    });
    
    return gem;
}

function showHealEffect(amount) {
    const element = document.createElement('div');
    element.className = 'heal-text';
    element.textContent = `+${amount}`;
    
    const section = document.getElementById('player-section');
    if (section) {
        section.appendChild(element);
        setTimeout(() => element.remove(), 1000);
    }
}