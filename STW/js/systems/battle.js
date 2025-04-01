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
      
      const gem = document.createElement('div');
      gem.className = `gem ${gemType.color || 'red'}`;
      gem.innerHTML = `
        <div class="gem-icon">${gemType.icon}</div>
        <div class="gem-cost">${gemType.staminaCost}</div>
      `;
      
      gem.addEventListener('click', () => playGem(gemType));
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
    
    endTurnBtn.addEventListener('click', endPlayerTurn);
}

window.startEnemyTurn = function() {
    console.log("Enemy turn started");
    
    const enemy = GameState.data.battle.enemy || { 
      name: "Grunt", 
      health: 20, 
      attack: 5 
    };
  
    if (Math.random() > 0.5) {
      const damage = enemy.attack;
      GameState.setState('player.health', GameState.data.player.health - damage);
      showDamageEffect(damage, 'player');
    } else {
      console.log(`${enemy.name} defends!`);
    }
  
    setTimeout(() => {
      EventBus.emit('TURN_END', { turn: 'player' });
      drawGems(3);
    }, 1500);
};
  
function playGem(gemType, gemElement) {
    // Validate inputs
    if (!gemElement?.remove) {
      console.error('Invalid gem element:', gemElement);
      return;
    }
  
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
        if (!GameState.data.player.buffs) {
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
    const baseDamage = gemType.colors[player.class?.toLowerCase()] || 3;
    return Math.floor(baseDamage * (player.gemBonus?.[gemType.color] || 1));
}

function showShieldEffect() {
    const shieldIcon = document.createElement('div');
    shieldIcon.className = 'buff-icon shield';
    shieldIcon.textContent = '🛡️';
    shieldIcon.title = `Shield: ${GameState.data.player.buffs.shield} (${GameState.data.player.buffs.shieldTurns} turns)`;
    document.getElementById('player-buffs').appendChild(shieldIcon);
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
}

export function startEnemyTurn() {
    console.log("Enemy turn started");
    
    const enemy = GameState.data.battle.enemy || { 
      name: "Grunt", 
      health: 20, 
      attack: 5 
    };
  
    // Simple enemy AI: 50% chance to attack or defend
    if (Math.random() > 0.5) {
      const damage = enemy.attack;
      GameState.setState('player.health', GameState.data.player.health - damage);
      showDamageEffect(damage, 'player');
    } else {
      console.log(`${enemy.name} defends!`);
    }
    
    const damage = enemy.attack - (GameState.data.player.buffs.shield || 0);
    GameState.setState('player.health', player.health - Math.max(0, damage));
    if (GameState.data.player.buffs.shield > 0) {
        const newTurns = GameState.data.player.buffs.shieldTurns - 1;
        GameState.setState('player.buffs.shieldTurns', newTurns);
        
        if (newTurns <= 0) {
          GameState.setState('player.buffs.shield', 0);
          document.querySelector('.buff-icon.shield')?.remove();
        }
    }
      
    // Return to player turn after delay
    setTimeout(() => {
      EventBus.emit('TURN_END', { turn: 'player' });
      drawGems(3); // Draw new gems
    }, 1500);
}
  
  // Modify showDamageEffect to include health updates:
function showDamageEffect(amount, target) {
    // Update health display immediately
    const healthElem = document.getElementById(`${target}-health`);
    if (healthElem) {
      const current = parseInt(healthElem.textContent);
      healthElem.textContent = current - amount;
    }
    
    // Create damage text effect
    const element = document.createElement('div');
    element.className = `damage-text ${target}-damage`;
    element.textContent = `-${amount}`;
    document.getElementById(`${target}-section`).appendChild(element);
    
    setTimeout(() => element.remove(), 1000);
}

function createGemElement(gemType) {
    const gem = document.createElement('div');
    gem.className = `gem ${gemType.color || 'red'}`;
    
    gem.innerHTML = `
      <div class="gem-icon">${gemType.icon}</div>
      <div class="gem-cost">${gemType.staminaCost}</div>
    `;
  
    // Store gem type as data attribute
    gem.dataset.gemType = gemType.name;
  
    // Use arrow function to maintain proper context
    gem.addEventListener('click', (event) => {
      event.stopPropagation();
      if (event.currentTarget && event.currentTarget.remove) {
        playGem(gemType, event.currentTarget);
      } else {
        console.error('Invalid gem element:', event.currentTarget);
      }
    });
    
    return gem;
}

function showHealEffect(amount) {
    const element = document.createElement('div');
    element.className = 'heal-text';
    element.textContent = `+${amount}`;
    document.getElementById('player-section').appendChild(element);
    setTimeout(() => element.remove(), 1000);
}