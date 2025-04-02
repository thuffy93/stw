import { GameState } from '../core/state.js';
import { EventBus } from '../core/events.js';
import { GEM_TYPES, ENEMY_TYPES, PHASES } from '../core/config.js';

export function initBattle() {
  console.log("Initializing battle...");
  
  // Reset player stamina to base value
  GameState.setState('player.stamina', GameState.data.player.baseStamina || 3);
  
  // Initialize enemy data if not set
  if (!GameState.data.battle.enemy) {
    // Get current day and phase
    const currentDay = GameState.data.battle.day || 1;
    const currentPhase = GameState.data.battle.phase || 'Dawn';
    
    // Find appropriate enemy for this day/phase
    const enemy = getEnemyForPhase(currentDay, currentPhase);
    
    // Set enemy in game state
    GameState.setState('battle.enemy', enemy);
  }
  
  // Set initial turn to player
  GameState.setState('battle.turn', 'player');
  
  // Update battle UI
  updateBattleUI();
  
  // Draw initial gems
  drawGems(3);
  
  // Set up battle event handlers
  setupBattleControls();
}

function getEnemyForPhase(day, phase) {
  // Find enemies for the current day/phase
  const potentialEnemies = Object.values(ENEMY_TYPES).filter(enemy => {
    return enemy.day === day && enemy.phase === phase;
  });
  
  // If no specific enemies found, create scaled generic enemy
  if (potentialEnemies.length === 0) {
    // Create basic enemy with scaling based on day
    const scaledHealth = Math.floor(20 * (1 + (day - 1) * 0.2));
    const scaledDamage = Math.floor(5 * (1 + (day - 1) * 0.15));
    
    return {
      name: `${phase} Minion`,
      health: scaledHealth,
      maxHealth: scaledHealth,
      attack: scaledDamage,
      icon: "👾",
      day: day,
      phase: phase,
      zenny: 10 * day
    };
  }
  
  // Return random enemy from potential enemies
  return { ...potentialEnemies[Math.floor(Math.random() * potentialEnemies.length)] };
}

function setupBattleControls() {
  // Set up end turn button
  const endTurnBtn = document.getElementById('end-turn-btn');
  if (endTurnBtn) {
    // Remove any existing listeners to prevent duplicates
    const newBtn = endTurnBtn.cloneNode(true);
    endTurnBtn.parentNode.replaceChild(newBtn, endTurnBtn);
    newBtn.addEventListener('click', endPlayerTurn);
  } else {
    console.error("End Turn button not found!");
  }
  
  // Add flee button if not present
  if (!document.getElementById('flee-btn')) {
    const battleScreen = document.getElementById('battle-screen');
    if (battleScreen) {
      const fleeBtn = document.createElement('button');
      fleeBtn.id = 'flee-btn';
      fleeBtn.className = 'btn-flee';
      fleeBtn.textContent = 'Flee';
      fleeBtn.addEventListener('click', fleeBattle);
      battleScreen.appendChild(fleeBtn);
    }
  }
}

function updateBattleUI() {
  // Update enemy display
  updateEnemyDisplay();
  
  // Update phase indicators
  const day = GameState.data.battle.day || 1;
  const phase = GameState.data.battle.phase || 'Dawn';
  
  // Update phase indicator if it exists
  const phaseIndicator = document.getElementById('day-phase-indicator');
  if (phaseIndicator) {
    phaseIndicator.textContent = `Day ${day}: ${phase}`;
  }
  
  // Update battle screen background based on phase
  const battleScreen = document.getElementById('battle-screen');
  if (battleScreen) {
    battleScreen.classList.remove('dawn', 'dusk', 'dark');
    battleScreen.classList.add(phase.toLowerCase());
  }
}

export function drawGems(count) {
  const hand = document.getElementById('hand');
  if (!hand) {
    console.error("Hand element not found!");
    return;
  }
  
  // Clear current hand
  hand.innerHTML = '';
  
  // Get player's gem bag
  const gemBag = GameState.data.player.gemBag || [];
  
  // If gem bag is empty, use basic gems
  if (gemBag.length === 0) {
    // Draw random gems from GEM_TYPES
    const gemTypeKeys = Object.keys(GEM_TYPES);
    
    for (let i = 0; i < count; i++) {
      // Select random gem type
      const randomTypeKey = gemTypeKeys[Math.floor(Math.random() * gemTypeKeys.length)];
      const gemType = GEM_TYPES[randomTypeKey];
      
      // Create and add gem to hand
      const gemElement = createGemElement(gemType);
      hand.appendChild(gemElement);
    }
  } else {
    // Draw from player's gem bag (randomly)
    // Shuffle the gem bag first (temporary copy)
    const shuffledBag = [...gemBag].sort(() => Math.random() - 0.5);
    
    // Draw the requested number of gems (or all if bag is smaller)
    const drawCount = Math.min(count, shuffledBag.length);
    
    for (let i = 0; i < drawCount; i++) {
      const gem = shuffledBag[i];
      const gemType = GEM_TYPES[gem.type];
      
      if (gemType) {
        // Override color if specified in gem
        const gemWithColor = { ...gemType };
        if (gem.color) gemWithColor.color = gem.color;
        
        // Create gem element and add to hand
        const gemElement = createGemElement(gemWithColor);
        hand.appendChild(gemElement);
      }
    }
  }
  
  // Store drawn gems in player state
  GameState.setState('player.hand', Array.from(hand.children).map(element => {
    return {
      type: element.dataset.gemType,
      color: element.dataset.gemColor
    };
  }));
}

export function endPlayerTurn() {
  console.log("Player turn ended");
  
  // Update game state
  GameState.setState('battle.turn', 'enemy');
  
  // Disable gem clicking during enemy turn
  const gems = document.querySelectorAll('.gem');
  gems.forEach(gem => {
    gem.style.pointerEvents = 'none';
    gem.classList.add('disabled');
  });
  
  // Disable end turn button
  const endTurnBtn = document.getElementById('end-turn-btn');
  if (endTurnBtn) endTurnBtn.disabled = true;
  
  // Trigger enemy turn
  EventBus.emit('TURN_END', { turn: 'enemy' });
}

export function updateEnemyDisplay() {
  const enemyNameElem = document.getElementById('enemy-name');
  const enemyHealthElem = document.getElementById('enemy-health');
  const enemyMaxHealthElem = document.getElementById('enemy-max-health');
  const enemyHealthBar = document.getElementById('enemy-health-bar');
  
  // Safely get enemy data
  const enemy = GameState.data.battle.enemy || { 
    name: "Grunt", 
    health: 20,
    maxHealth: 20
  };
  
  // Update text elements if they exist
  if (enemyNameElem) enemyNameElem.textContent = enemy.name;
  if (enemyHealthElem) enemyHealthElem.textContent = enemy.health;
  if (enemyMaxHealthElem) enemyMaxHealthElem.textContent = enemy.maxHealth;
  
  // Update health bar
  if (enemyHealthBar) {
    const percent = (enemy.health / enemy.maxHealth) * 100;
    enemyHealthBar.style.width = `${percent}%`;
  }
  
  // Check for victory condition
  if (enemy.health <= 0) {
    // Award zenny
    if (enemy.zenny) {
      const currentZenny = GameState.data.player.zenny || 0;
      GameState.setState('player.zenny', currentZenny + enemy.zenny);
      showZennyEffect(enemy.zenny);
    }
    
    // Show victory message
    showBattleResult('victory');
    
    // Emit victory event
    EventBus.emit('BATTLE_VICTORY');
  }
}

export function startEnemyTurn() {
  console.log("Enemy turn started");
  
  const enemy = GameState.data.battle.enemy;
  const player = GameState.data.player;
  
  if (!enemy || !player) {
    console.error("Missing enemy or player data!");
    return;
  }
  
  // Process poison effect if enemy is poisoned
  if (enemy.poisoned) {
    const poisonDamage = enemy.poisonDamage || 1;
    enemy.health = Math.max(0, enemy.health - poisonDamage);
    enemy.poisonTurns = (enemy.poisonTurns || 0) - 1;
    
    // Show poison damage
    showPoisonEffect(poisonDamage, 'enemy');
    
    // Remove poison if duration is over
    if (enemy.poisonTurns <= 0) {
      enemy.poisoned = false;
      
      // Remove poison icon if it exists
      const poisonIcon = document.querySelector('.enemy-poison');
      if (poisonIcon) poisonIcon.remove();
    }
    
    // Update enemy display
    updateEnemyDisplay();
    
    // Check if enemy died from poison
    if (enemy.health <= 0) {
      setTimeout(() => {
        // This will trigger BATTLE_VICTORY event
        updateEnemyDisplay();
      }, 1000);
      return;
    }
  }
  
  // Enemy chooses action (simple AI)
  setTimeout(() => {
    // Always attack for now
    let damage = enemy.attack;
    
    // Apply shield if player has it
    if (player.buffs && player.buffs.shield > 0) {
      const originalDamage = damage;
      damage = Math.max(0, damage - player.buffs.shield);
      
      // Show shield effect
      if (originalDamage > damage) {
        showShieldBlockEffect(originalDamage - damage);
      }
      
      // Reduce shield duration
      const newTurns = player.buffs.shieldTurns - 1;
      GameState.setState('player.buffs.shieldTurns', newTurns);
      
      // Remove shield if duration is over
      if (newTurns <= 0) {
        GameState.setState('player.buffs.shield', 0);
        document.querySelector('.buff-icon.shield')?.remove();
      }
    }
    
    // Apply damage to player
    GameState.setState('player.health', Math.max(0, player.health - damage));
    
    // Show damage effect
    if (damage > 0) {
      showDamageEffect(damage, 'player');
    }
    
    // Check for defeat condition
    if (player.health <= 0) {
      // Show defeat message
      showBattleResult('defeat');
      
      // Emit defeat event
      EventBus.emit('BATTLE_DEFEAT');
      return;
    }
    
    // Return to player turn after 1.5s delay
    setTimeout(() => {
      // Re-enable gem clicking for player turn
      const gems = document.querySelectorAll('.gem');
      gems.forEach(gem => {
        gem.style.pointerEvents = 'auto';
        gem.classList.remove('disabled');
      });
      
      // Re-enable end turn button
      const endTurnBtn = document.getElementById('end-turn-btn');
      if (endTurnBtn) endTurnBtn.disabled = false;
      
      // Update game state for player turn
      GameState.setState('battle.turn', 'player');
      
      // Emit player turn event
      EventBus.emit('TURN_END', { turn: 'player' });
    }, 1500);
  }, 1000);
}

function playGem(gemType, gemElement) {
  const player = GameState.data.player;
  const enemy = GameState.data.battle.enemy;
  
  if (!player || !enemy) {
    console.error("Missing player or enemy data!");
    return;
  }
  
  // Get the correct stamina cost based on gem type and player class
  let staminaCost = getGemStaminaCost(gemType, player);
  
  // Check if player has enough stamina
  if (player.stamina < staminaCost) {
    console.log("Not enough stamina!");
    gemElement.classList.add('disabled');
    setTimeout(() => gemElement.classList.remove('disabled'), 500);
    return;
  }
  
  // Deduct stamina
  GameState.setState('player.stamina', player.stamina - staminaCost);
  
  // Apply effects based on gem type
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
      // Initialize buffs if undefined
      if (!player.buffs) {
        GameState.setState('player.buffs', { shield: 0, shieldTurns: 0 });
      }
      GameState.setState('player.buffs.shield', gemType.defense);
      GameState.setState('player.buffs.shieldTurns', gemType.duration);
      showShieldEffect();
      break;
      
    case 'Focus':
      // Restore stamina
      const staminaGain = gemType.staminaGain || 2;
      GameState.setState('player.stamina', 
        Math.min(player.baseStamina, player.stamina + staminaGain));
      showFocusEffect(staminaGain);
      break;
      
    case 'Poison':
      // Apply poison to enemy
      enemy.poisoned = true;
      enemy.poisonDamage = gemType.damage || 1;
      enemy.poisonTurns = gemType.duration || 3;
      showPoisonApplyEffect();
      break;
  }
  
  // Update displays
  updateEnemyDisplay();
  
  // Play gem animation
  gemElement.classList.add('playing');
  setTimeout(() => {
    gemElement.remove();
    
    // Update hand in state
    const hand = document.getElementById('hand');
    if (hand) {
      GameState.setState('player.hand', Array.from(hand.children).map(element => {
        return {
          type: element.dataset.gemType,
          color: element.dataset.gemColor
        };
      }));
    }
  }, 500);
}

function getGemStaminaCost(gemType, player) {
  if (!gemType) return 1;
  
  // Handle gems with fixed costs
  if (typeof gemType.staminaCost === 'number') {
    return gemType.staminaCost;
  }
  
  // Handle gems with color-specific costs (like Attack)
  if (typeof gemType.staminaCost === 'object') {
    const playerClass = player.class?.toLowerCase();
    
    // If player class matches a specific cost, use it
    if (playerClass && gemType.staminaCost[playerClass]) {
      return gemType.staminaCost[playerClass];
    }
    
    // Otherwise use the cost for the gem's color
    const gemColor = gemType.color || 'grey';
    if (gemType.staminaCost[gemColor]) {
      return gemType.staminaCost[gemColor];
    }
    
    // Default fallback
    return 1;
  }
  
  // Default fallback
  return 1;
}

function calculateDamage(gemType, player) {
  // Get base damage for the gem color
  let baseDamage = 3; // Default damage
  
  if (gemType.colors) {
    // Try to get class-specific damage
    const playerClass = player.class?.toLowerCase();
    if (playerClass && gemType.colors[playerClass]) {
      baseDamage = gemType.colors[playerClass];
    } else {
      // Try to get color-specific damage
      const gemColor = gemType.color || 'red';
      if (gemType.colors[gemColor]) {
        baseDamage = gemType.colors[gemColor];
      } else {
        // Use the first available damage value
        const firstColor = Object.keys(gemType.colors)[0];
        baseDamage = gemType.colors[firstColor];
      }
    }
  }
  
  // Apply class bonus if applicable
  const gemColor = gemType.color || 'red';
  const bonus = player.gemBonus?.[gemColor] || 1;
  
  const finalDamage = Math.floor(baseDamage * bonus);
  console.log(`Damage calculation: ${baseDamage} × ${bonus} = ${finalDamage}`);
  
  return finalDamage;
}

function createGemElement(gemType) {
  const gem = document.createElement('div');
  
  // Set class based on gem color
  const gemColor = gemType.color || 'red';
  gem.className = `gem ${gemColor}`;
  
  // Store gem data for reference
  gem.dataset.gemType = gemType.name;
  gem.dataset.gemColor = gemColor;
  
  // Add class bonus indicator if applicable
  const player = GameState.data.player;
  if (player && player.gemBonus && player.gemBonus[gemColor] > 1) {
    gem.classList.add('class-bonus');
  }
  
  // Create gem content
  gem.innerHTML = `
    <div class="gem-content">
      <div class="gem-icon">${gemType.icon}</div>
      <div class="gem-name">${gemType.name}</div>
    </div>
    <div class="gem-cost">${getGemStaminaCost(gemType, GameState.data.player)}</div>
  `;
  
  // Add tooltip with description
  const description = getGemDescription(gemType);
  gem.setAttribute('data-tooltip', description);

  // Add click handler
  gem.addEventListener('click', () => {
    playGem(gemType, gem);
  });
  
  return gem;
}

function getGemDescription(gemType) {
  if (!gemType) return "Unknown";
  
  switch(gemType.name) {
    case 'Attack':
      // Get damage value based on player class
      const player = GameState.data.player;
      let damage = 3;
      
      if (gemType.colors && player) {
        const playerClass = player.class?.toLowerCase();
        if (playerClass && gemType.colors[playerClass]) {
          damage = gemType.colors[playerClass];
        } else if (gemType.colors[gemType.color]) {
          damage = gemType.colors[gemType.color];
        }
      }
      
      // Apply class bonus if applicable
      const gemColor = gemType.color || 'red';
      const bonus = player?.gemBonus?.[gemColor] || 1;
      
      const finalDamage = Math.floor(damage * bonus);
      return `Deal ${finalDamage} damage to enemy.`;
      
    case 'Heal':
      return `Restore ${gemType.effect} health points.`;
      
    case 'Shield':
      return `Reduce incoming damage by ${gemType.defense} for ${gemType.duration} turns.`;
      
    case 'Focus':
      return `Recover ${gemType.staminaGain} stamina.`;
      
    case 'Poison':
      return `Apply poison dealing ${gemType.damage} damage per turn for ${gemType.duration} turns.`;
      
    default:
      return gemType.description || gemType.name;
  }
}

function showDamageEffect(amount, target) {
  // Create floating damage text
  const element = document.createElement('div');
  element.className = `damage-text ${target}-damage`;
  element.textContent = `-${amount}`;
  
  const targetSection = document.getElementById(`${target}-section`);
  if (targetSection) {
    targetSection.appendChild(element);
    setTimeout(() => element.remove(), 1000);
  }
}

function showHealEffect(amount) {
  const element = document.createElement('div');
  element.className = 'heal-text';
  element.textContent = `+${amount}`;
  
  const playerSection = document.getElementById('player-section');
  if (playerSection) {
    playerSection.appendChild(element);
    setTimeout(() => element.remove(), 1000);
  }
}

function showShieldEffect() {
  // Remove existing shield icon if present
  const existingShield = document.querySelector('.buff-icon.shield');
  if (existingShield) {
    existingShield.remove();
  }
  
  // Create new shield buff icon
  const shieldIcon = document.createElement('div');
  shieldIcon.className = 'buff-icon shield';
  shieldIcon.textContent = '🛡️';
  
  const playerBuffs = document.getElementById('player-buffs');
  if (!playerBuffs) {
    console.error("Player buffs container not found!");
    return;
  }
  
  // Set tooltip with shield info
  const shieldValue = GameState.data.player.buffs.shield;
  const shieldTurns = GameState.data.player.buffs.shieldTurns;
  shieldIcon.setAttribute('data-tooltip', `Shield: Reduces damage by ${shieldValue} for ${shieldTurns} turns`);
  
  playerBuffs.appendChild(shieldIcon);
}

function showShieldBlockEffect(amount) {
  const element = document.createElement('div');
  element.className = 'block-text';
  element.textContent = `BLOCKED ${amount}`;
  element.style.color = '#6666ff';
  element.style.position = 'absolute';
  element.style.fontSize = '1.2em';
  element.style.fontWeight = 'bold';
  element.style.animation = 'float-up 1s forwards';
  
  const playerSection = document.getElementById('player-section');
  if (playerSection) {
    playerSection.appendChild(element);
    setTimeout(() => element.remove(), 1000);
  }
}

function showFocusEffect(amount) {
  const element = document.createElement('div');
  element.className = 'focus-text';
  element.textContent = `+${amount} STAMINA`;
  element.style.color = '#ffcc00';
  element.style.position = 'absolute';
  element.style.fontSize = '1.2em';
  element.style.fontWeight = 'bold';
  element.style.animation = 'float-up 1s forwards';
  
  const playerSection = document.getElementById('player-section');
  if (playerSection) {
    playerSection.appendChild(element);
    setTimeout(() => element.remove(), 1000);
  }
}

function showPoisonApplyEffect() {
  // Create poison icon on enemy
  const enemySection = document.getElementById('enemy-section');
  if (!enemySection) return;
  
  const poisonIcon = document.createElement('div');
  poisonIcon.className = 'buff-icon enemy-poison';
  poisonIcon.textContent = '☠️';
  poisonIcon.style.position = 'absolute';
  poisonIcon.style.top = '10px';
  poisonIcon.style.right = '10px';
  poisonIcon.style.backgroundColor = '#55aa55';
  
  // Set tooltip
  const enemy = GameState.data.battle.enemy;
  if (enemy) {
    poisonIcon.setAttribute('data-tooltip', 
      `Poison: ${enemy.poisonDamage} damage per turn for ${enemy.poisonTurns} turns`);
  }
  
  enemySection.appendChild(poisonIcon);
  
  // Floating text effect
  const element = document.createElement('div');
  element.className = 'poison-text';
  element.textContent = 'POISONED';
  element.style.color = '#55aa55';
  element.style.position = 'absolute';
  element.style.fontSize = '1.2em';
  element.style.fontWeight = 'bold';
  element.style.animation = 'float-up 1s forwards';
  
  enemySection.appendChild(element);
  setTimeout(() => element.remove(), 1000);
}

function showPoisonEffect(amount, target) {
  const element = document.createElement('div');
  element.className = 'poison-damage';
  element.textContent = `-${amount} POISON`;
  element.style.color = '#55aa55';
  element.style.position = 'absolute';
  element.style.fontSize = '1.2em';
  element.style.fontWeight = 'bold';
  element.style.animation = 'float-up 1s forwards';
  
  const targetSection = document.getElementById(`${target}-section`);
  if (targetSection) {
    targetSection.appendChild(element);
    setTimeout(() => element.remove(), 1000);
  }
}

function showZennyEffect(amount) {
  const element = document.createElement('div');
  element.className = 'zenny-text';
  element.textContent = `+${amount} ZENNY`;
  element.style.color = '#ffcc00';
  element.style.position = 'absolute';
  element.style.fontSize = '1.5em';
  element.style.fontWeight = 'bold';
  element.style.animation = 'float-up 1.5s forwards';
  
  const battleScreen = document.getElementById('battle-screen');
  if (battleScreen) {
    element.style.top = '50%';
    element.style.left = '50%';
    element.style.transform = 'translate(-50%, -50%)';
    
    battleScreen.appendChild(element);
    setTimeout(() => element.remove(), 1500);
  }
}

function showBattleResult(result) {
  const messageElement = document.createElement('div');
  
  if (result === 'victory') {
    messageElement.className = 'victory-text';
    messageElement.textContent = 'VICTORY!';
  } else {
    messageElement.className = 'defeat-text';
    messageElement.textContent = 'DEFEAT!';
  }
  
  const battleScreen = document.getElementById('battle-screen');
  if (battleScreen) {
    battleScreen.appendChild(messageElement);
    
    // Remove after transition to next screen
    setTimeout(() => messageElement.remove(), 3000);
  }
}

function fleeBattle() {
  console.log("Fleeing battle...");
  
  // Can only flee during Dawn or Dusk phases (not during Dark/boss phase)
  const currentPhase = GameState.data.battle.phase;
  if (currentPhase === 'Dark') {
    // Cannot flee from boss battles
    alert("You cannot flee from boss battles!");
    return;
  }
  
  // Return to character select for now (later could go to shop/camp)
  EventBus.emit('SCREEN_CHANGE', { screen: 'character-select' });
}

// Export additional functions for testing
export { playGem, fleeBattle, showBattleResult };