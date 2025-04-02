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
      
      // Pass both gemType and the gem element itself to playGem
      gem.addEventListener('click', (event) => playGem(gemType, event.currentTarget));
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
  
/**
 * Play a gem from the player's hand
 * @param {Number} index - Index of the gem in hand
 * @returns {Boolean} Whether the gem was successfully played
 */
export function playGem(index) {
  try {
    const hand = GameState.data.hand;
    const player = GameState.data.player;
    const battleOver = GameState.data.battleOver;
    
    // Validation
    if (battleOver) {
      console.log("Cannot play gem: Battle is over");
      return false;
    }
    
    if (index < 0 || index >= hand.length) {
      console.warn(`Invalid gem index: ${index}, hand length: ${hand.length}`);
      return false;
    }
    
    const gem = hand[index];
    
    // Check stamina cost
    if (player.stamina < gem.cost) {
      EventBus.emit('SHOW_MESSAGE', { 
        message: "Not enough stamina!", 
        type: "error" 
      });
      return false;
    }
    
    // Deduct stamina
    GameState.setState('player.stamina', player.stamina - gem.cost);
    
    // Get gem proficiency and check for failure
    const gemKey = `${gem.color}${gem.name}`;
    const proficiency = getGemProficiency(gemKey);
    const gemFails = checkGemFails(proficiency);
    
    // Process gem effects
    if (gemFails) {
      // Handle failure effects
      handleGemFailure(gem);
    } else {
      // Handle success effects
      handleGemSuccess(gem);
      
      // Update proficiency on success
      updateGemProficiency(gemKey, true);
    }
    
    // Remove gem from hand and add to discard
    const newHand = [...hand];
    newHand.splice(index, 1);
    GameState.setState('hand', newHand);
    
    const discard = GameState.data.discard || [];
    GameState.setState('discard', [...discard, gem]);
    
    // Mark that player has played a gem this turn
    GameState.setState('hasPlayedGemThisTurn', true);
    
    // Emit event for played gem
    EventBus.emit('GEM_PLAYED', { 
      gem, 
      success: !gemFails,
      proficiency
    });
    
    return true;
  } catch (error) {
    console.error("Error playing gem:", error);
    EventBus.emit('SHOW_MESSAGE', { 
      message: "Error playing gem", 
      type: "error" 
    });
    return false;
  }
}
/**
 * Handle gem failure effects
 * @param {Object} gem - The gem that failed
 */
function handleGemFailure(gem) {
  const player = GameState.data.player;
  
  if (gem.damage) {
    // Self-damage on attack gem failure (50% of normal value)
    const damage = Math.floor(gem.damage * 0.5);
    
    // Apply damage
    const newHealth = Math.max(0, player.health - damage);
    GameState.setState('player.health', newHealth);
    
    // Random chance to stun player
    if (Math.random() < 0.5) {
      const playerBuffs = [...(player.buffs || [])];
      playerBuffs.push({ type: "stunned", turns: 1 });
      GameState.setState('player.buffs', playerBuffs);
      
      // Emit buff event
      EventBus.emit('BUFF_APPLIED', { 
        target: 'player', 
        buff: { type: "stunned", turns: 1 } 
      });
    }
    
    // Emit events
    EventBus.emit('DAMAGE_DEALT', { 
      amount: damage, 
      target: 'player', 
      source: 'gemFailure',
      type: 'attack'
    });
    
    EventBus.emit('SHOW_MESSAGE', { 
      message: `Failed ${gem.name}! Took ${damage} damage${player.buffs.some(b => b.type === "stunned") ? " and stunned!" : "!"}`, 
      type: "error" 
    });
    
    // Check for player defeat
    if (newHealth <= 0) {
      handlePlayerDefeated();
    }
  } 
  else if (gem.heal) {
    // Self-damage on heal gem failure
    const damage = 5;
    
    // Apply damage
    const newHealth = Math.max(0, player.health - damage);
    GameState.setState('player.health', newHealth);
    
    // Emit events
    EventBus.emit('DAMAGE_DEALT', { 
      amount: damage, 
      target: 'player', 
      source: 'gemFailure',
      type: 'attack'
    });
    
    EventBus.emit('SHOW_MESSAGE', { 
      message: `Failed ${gem.name}! Lost 5 HP!`, 
      type: "error" 
    });
    
    // Check for player defeat
    if (newHealth <= 0) {
      handlePlayerDefeated();
    }
  }
  else if (gem.poison) {
    // Self-poison on poison gem failure
    const damage = Math.floor(gem.poison * 0.5);
    
    // Apply damage
    const newHealth = Math.max(0, player.health - damage);
    GameState.setState('player.health', newHealth);
    
    // Emit events
    EventBus.emit('DAMAGE_DEALT', { 
      amount: damage, 
      target: 'player', 
      source: 'gemFailure',
      type: 'poison'
    });
    
    EventBus.emit('SHOW_MESSAGE', { 
      message: `Failed ${gem.name}! Took ${damage} self-poison damage!`, 
      type: "error" 
    });
    
    // Check for player defeat
    if (newHealth <= 0) {
      handlePlayerDefeated();
    }
  }
}

/**
 * Handle gem success effects
 * @param {Object} gem - The gem that succeeded
 */
function handleGemSuccess(gem) {
  const player = GameState.data.player;
  const enemy = GameState.data.battle.enemy;
  
  // Apply class bonus
  let multiplier = 1;
  if ((player.class === "Knight" && gem.color === "red") || 
      (player.class === "Mage" && gem.color === "blue") || 
      (player.class === "Rogue" && gem.color === "green")) {
    multiplier = 1.5;
  }
  
  // Apply focus buff
  if (player.buffs && player.buffs.some(b => b.type === "focused")) {
    multiplier *= 1.2;
  }
  
  if (gem.damage && enemy) {
    // Calculate damage with modifiers
    let damage = Math.floor(gem.damage * multiplier);
    
    // Apply shield reduction
    if (enemy.shield && gem.color !== enemy.shieldColor) {
      damage = Math.floor(damage / 2);
    }
    
    // Apply defense buff reduction
    if (enemy.buffs && enemy.buffs.some(b => b.type === "defense")) {
      damage = Math.floor(damage / 2);
    }
    
    // Apply damage
    const newHealth = Math.max(0, enemy.health - damage);
    GameState.setState('battle.enemy.health', newHealth);
    
    // Emit events
    EventBus.emit('DAMAGE_DEALT', { 
      amount: damage, 
      target: 'enemy', 
      source: 'player',
      type: 'attack'
    });
    
    EventBus.emit('SHOW_MESSAGE', { 
      message: `Played ${gem.name} for ${damage} damage!` 
    });
    
    // Check for enemy defeat
    if (newHealth <= 0) {
      handleEnemyDefeated();
    }
  }
  if (gem.heal) {
    // Calculate healing with modifier
    const heal = Math.floor(gem.heal * multiplier);
    
    // Apply healing (capped at max health)
    const newHealth = Math.min(player.health + heal, player.maxHealth);
    GameState.setState('player.health', newHealth);
    
    // Apply shield if the gem has that property
    if (gem.shield) {
      const playerBuffs = [...(player.buffs || [])];
      playerBuffs.push({ type: "defense", turns: 2 });
      GameState.setState('player.buffs', playerBuffs);
      
      // Emit buff event
      EventBus.emit('BUFF_APPLIED', { 
        target: 'player', 
        buff: { type: "defense", turns: 2 } 
      });
    }
    
    // Emit events
    EventBus.emit('DAMAGE_DEALT', { 
      amount: -heal, // Negative amount for healing
      target: 'player', 
      source: 'player',
      type: 'heal'
    });
    
    EventBus.emit('SHOW_MESSAGE', { 
      message: `Played ${gem.name} for ${heal} healing${gem.shield ? " and defense" : ""}!` 
    });
  }
  
  if (gem.poison && enemy) {
    // Calculate poison damage with modifier
    const poisonDamage = Math.floor(gem.poison * multiplier);
    
    // Add poison buff to enemy
    const enemyBuffs = [...(enemy.buffs || [])];
    enemyBuffs.push({ type: "poison", turns: 2, damage: poisonDamage });
    GameState.setState('battle.enemy.buffs', enemyBuffs);
    
    // Emit buff event
    EventBus.emit('BUFF_APPLIED', { 
      target: 'enemy', 
      buff: { type: "poison", turns: 2, damage: poisonDamage } 
    });
    
    // Emit message
    EventBus.emit('SHOW_MESSAGE', { 
      message: `Played ${gem.name} for ${poisonDamage} poison damage/turn!` 
    });
  }
} 
/**
 * Wait for a turn (gain focus)
 */
export function waitTurn() {
  const battleOver = GameState.data.battleOver;
  const hasActedThisTurn = GameState.data.hasActedThisTurn;
  const hasPlayedGemThisTurn = GameState.data.hasPlayedGemThisTurn;
  
  // Don't allow waiting if battle is over or player has already acted
  if (battleOver || hasActedThisTurn || hasPlayedGemThisTurn) return;
  
  // Mark that player has acted this turn
  GameState.setState('hasActedThisTurn', true);
  
  // Add focus buff
  const player = GameState.data.player;
  const playerBuffs = [...(player.buffs || [])];
  playerBuffs.push({ type: "focused", turns: 2 });
  GameState.setState('player.buffs', playerBuffs);
  
  // Emit buff event
  EventBus.emit('BUFF_APPLIED', { 
    target: 'player', 
    buff: { type: "focused", turns: 2 } 
  });
  
  // Show message
  EventBus.emit('SHOW_MESSAGE', { 
    message: "Waited, gaining focus for next turn (+20% damage/heal)!" 
  });
  
  // End turn after a short delay
  setTimeout(() => {
    endTurn();
  }, 300);
}

/**
 * Discard selected gems and end turn
 */
export function discardAndEndTurn() {
  const battleOver = GameState.data.battleOver;
  const selectedGems = GameState.data.selectedGems;
  const hand = GameState.data.hand;
  const gemBag = GameState.data.gemBag;
  const hasActedThisTurn = GameState.data.hasActedThisTurn;
  
  // Don't allow discarding if battle is over or no gems selected or already acted
  if (battleOver || !selectedGems.size || hasActedThisTurn) return;
  
  // Get indices in descending order to avoid index shifting problems
  const indices = Array.from(selectedGems).sort((a, b) => b - a);
  
  // Create copies of arrays to modify
  const newHand = [...hand];
  const newGemBag = [...gemBag];
  
  // Remove selected gems from hand and add to gem bag
  indices.forEach(index => {
    if (index >= 0 && index < newHand.length) {
      const gem = newHand.splice(index, 1)[0];
      newGemBag.push(gem);
    }
  });
  
  // Update state
  GameState.setState('hand', newHand);
  GameState.setState('gemBag', Utils.shuffle(newGemBag)); // Shuffle bag
  GameState.setState('selectedGems', new Set());
  GameState.setState('hasActedThisTurn', true);
  
  // Show message
  EventBus.emit('SHOW_MESSAGE', { 
    message: "Discarded and recycled to Gem Bag, ending turn..." 
  });
  
  // End turn after a short delay
  setTimeout(() => {
    endTurn();
  }, 300);
}

/**
 * Flee from battle
 */
export function fleeBattle() {
  const battleOver = GameState.data.battleOver;
  const currentPhaseIndex = GameState.data.currentPhaseIndex;
  const isEnemyTurnPending = GameState.data.isEnemyTurnPending;
  
  // Only allow fleeing in first two phases and when not enemy turn
  if (battleOver || currentPhaseIndex >= 2 || isEnemyTurnPending) return;
  
  // Mark battle as over
  GameState.setState('battleOver', true);
  
  // Clear buffs
  GameState.setState('player.buffs', []);
  
  const enemy = GameState.data.battle.enemy;
  if (enemy) {
    GameState.setState('battle.enemy.buffs', []);
  }
  
  // Show message
  EventBus.emit('SHOW_MESSAGE', { 
    message: "You fled the battle, skipping rewards!" 
  });
  
  // Increment battle count and phase
  const battleCount = GameState.data.battleCount;
  GameState.setState('battleCount', battleCount + 1);
  GameState.setState('currentPhaseIndex', currentPhaseIndex + 1);
  
  // Emit flee event
  EventBus.emit('BATTLE_FLED', {});
  
  // Transition to shop after delay
  setTimeout(() => {
    EventBus.emit('SCREEN_CHANGE', { screen: 'shop' });
  }, 1000);
}

function calculateDamage(gemType, player) {
    const baseDamage = gemType.colors?.[player.class?.toLowerCase()] || 3;
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
    
    // Access player safely
    const player = GameState.data.player;
    const playerBuffs = player.buffs || { shield: 0, shieldTurns: 0 };
    
    // Calculate damage with shield
    const damage = enemy.attack - (playerBuffs.shield || 0);
    GameState.setState('player.health', player.health - Math.max(0, damage));
    
    // Update shield turns if active
    if (playerBuffs.shield > 0) {
        const newTurns = playerBuffs.shieldTurns - 1;
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
/**
 * Process the enemy turn with a phased approach
 */
export function processEnemyTurn() {
    const enemy = GameState.data.battle.enemy;
    const battleOver = GameState.data.battleOver;
    
    // Safety check - don't process if battle is over or enemy doesn't exist
    if (battleOver || !enemy) {
      console.log("Cannot process enemy turn: battle over or no enemy");
      finishEnemyTurn();
      return;
    }
  
    // Define each phase with its function and delay
    const phases = [
      { fn: executeEnemyAction, delay: 500 },
      { fn: applyEnemyPoisonEffects, delay: 800 },
      { fn: prepareNextAction, delay: 800 },
      { fn: finishEnemyTurn, delay: 800 }
    ];
  
    // Execute first phase, which will chain to others
    executePhase(0);
  
    // Helper function to execute phases sequentially
    function executePhase(index) {
      if (index >= phases.length) return;
      
      const phase = phases[index];
      
      setTimeout(() => {
        try {
          // Execute the phase
          phase.fn();
          
          // Check if battle ended during phase
          if (GameState.data.battleOver && index < phases.length - 1) {
            console.log(`Battle ended during phase ${index}`);
            return;
          }
          
          // Continue to next phase
          executePhase(index + 1);
        } catch (error) {
          console.error(`Error in phase ${index}:`, error);
          safeFinishEnemyTurn();
        }
      }, phase.delay);
    }
}
  
  /**
   * Execute the enemy's action (Phase 1)
   */
function executeEnemyAction() {
    const enemy = GameState.data.battle.enemy;
    const player = GameState.data.player;
    
    // Skip if no action or enemy is dead
    if (!enemy || !enemy.currentAction || enemy.health <= 0) {
      return;
    }
    
    // Get the action and emit an event to animate it
    EventBus.emit('ENEMY_ACTION_START', { enemy, action: enemy.currentAction });
    
    // Process based on action type
    if (enemy.currentAction.startsWith("Attack")) {
      // Extract damage value safely
      let damage = 0;
      try {
        const parts = enemy.currentAction.split(" ");
        damage = parseInt(parts[1]) || 5; // Default to 5 if parsing fails
      } catch (e) {
        console.warn("Error parsing enemy attack damage, using default", e);
        damage = 5;
      }
      
      // Apply attack boost if present
      if (enemy.nextAttackBoost) {
        damage *= enemy.nextAttackBoost;
        enemy.nextAttackBoost = null;
      }
      
      // Apply player defense if present
      if (player.buffs.some(b => b.type === "defense")) {
        damage = Math.floor(damage / 2);
      }
      
      // Apply damage to player
      GameState.setState('player.health', Math.max(0, player.health - damage));
      
      // Emit event for damage effect
      EventBus.emit('DAMAGE_DEALT', { 
        amount: damage, 
        target: 'player', 
        source: 'enemy',
        type: 'attack'
      });
      
      // Send message to UI
      EventBus.emit('SHOW_MESSAGE', { 
        message: `${enemy.name} attacks for ${damage} damage!` 
      });
      
      // Check if player defeated
      if (player.health <= 0) {
        handlePlayerDefeated();
      }
    } 
    else if (enemy.currentAction === "Defend") {
      // Add defense buff to enemy
      const enemyBuffs = [...(enemy.buffs || [])];
      enemyBuffs.push({ type: "defense", turns: 2 });
      GameState.setState('battle.enemy.buffs', enemyBuffs);
      
      // Emit event for UI
      EventBus.emit('BUFF_APPLIED', { 
        target: 'enemy', 
        buff: { type: "defense", turns: 2 } 
      });
      
      // Send message to UI
      EventBus.emit('SHOW_MESSAGE', { 
        message: `${enemy.name} defends, reducing next damage!` 
      });
    }
    else if (enemy.currentAction === "Charge") {
      // Set next attack boost
      GameState.setState('battle.enemy.nextAttackBoost', 2);
      
      // Send message to UI
      EventBus.emit('SHOW_MESSAGE', { 
        message: `${enemy.name} charges for a stronger attack next turn!` 
      });
    }
    // Add more enemy action types as needed
}
/**
 * Prepare the enemy's next action (Phase 3)
 */
function prepareNextAction() {
    const enemy = GameState.data.battle.enemy;
    
    // Skip if enemy is dead
    if (!enemy || enemy.health <= 0) return;
    
    // Get next action from queue
    const nextAction = enemy.actionQueue.shift();
    GameState.setState('battle.enemy.currentAction', nextAction);
    
    // Refill action queue if needed
    if (enemy.actionQueue.length < 3) {
      const shuffledActions = Utils.shuffle([...enemy.actions]);
      const newQueue = [...enemy.actionQueue, ...shuffledActions.slice(0, 3 - enemy.actionQueue.length)];
      GameState.setState('battle.enemy.actionQueue', newQueue);
    }
}
  
  /**
   * Finish the enemy turn and prepare player turn (Phase 4)
   */
function finishEnemyTurn() {
    // Skip if battle is over
    if (GameState.data.battleOver) return;
    
    // Reset turn state flags
    GameState.setState('hasActedThisTurn', false);
    GameState.setState('hasPlayedGemThisTurn', false);
    GameState.setState('isEnemyTurnPending', false);
    
    // Clear any selected gems at the start of player turn
    GameState.setState('selectedGems', new Set());
    
    // Restore player stamina
    const baseStamina = GameState.data.player.baseStamina;
    GameState.setState('player.stamina', baseStamina);
    
    // Reduce buff durations for player
    const player = GameState.data.player;
    if (player.buffs && player.buffs.length > 0) {
      const updatedPlayerBuffs = player.buffs
        .map(b => ({ ...b, turns: b.turns - 1 }))
        .filter(b => b.turns > 0);
      
      GameState.setState('player.buffs', updatedPlayerBuffs);
    }
    
    // Reduce buff durations for enemy
    const enemy = GameState.data.battle.enemy;
    if (enemy && enemy.buffs && enemy.buffs.length > 0) {
      const updatedEnemyBuffs = enemy.buffs
        .map(b => ({ ...b, turns: b.turns - 1 }))
        .filter(b => b.turns > 0);
      
      GameState.setState('battle.enemy.buffs', updatedEnemyBuffs);
    }
    
    // Draw new cards to fill hand
    drawGems(Config.MAX_HAND_SIZE - GameState.data.hand.length);
    
    // Emit event to update UI
    EventBus.emit('PLAYER_TURN_START', {});
    
    // Check if battle is over
    checkBattleStatus();
}
/**
 * Process all status effects for both player and enemy
 * @returns {Boolean} Whether either combatant was defeated
 */
function processStatusEffects() {
  const player = GameState.data.player;
  const enemy = GameState.data.battle.enemy;
  
  // Skip if battle is already over
  if (GameState.data.battleOver) return true;
  
  // Process player poison effects
  if (player && player.health > 0) {
    const poisonBuff = player.buffs?.find(b => b.type === "poison");
    if (poisonBuff) {
      // Apply poison damage
      const newHealth = Math.max(0, player.health - poisonBuff.damage);
      GameState.setState('player.health', newHealth);
      
      // Emit events for UI updates
      EventBus.emit('DAMAGE_DEALT', { 
        amount: poisonBuff.damage, 
        target: 'player', 
        source: 'poison',
        type: 'poison'
      });
      
      EventBus.emit('SHOW_MESSAGE', { 
        message: `You take ${poisonBuff.damage} poison damage!` 
      });
      
      // Check if player was defeated
      if (newHealth <= 0) {
        handlePlayerDefeated();
        return true;
      }
    }
  }
  
  // Process enemy poison effects
  if (enemy && enemy.health > 0) {
    const poisonBuff = enemy.buffs?.find(b => b.type === "poison");
    if (poisonBuff) {
      // Apply poison damage
      const newHealth = Math.max(0, enemy.health - poisonBuff.damage);
      GameState.setState('battle.enemy.health', newHealth);
      
      // Emit events for UI updates
      EventBus.emit('DAMAGE_DEALT', { 
        amount: poisonBuff.damage, 
        target: 'enemy', 
        source: 'poison',
        type: 'poison'
      });
      
      EventBus.emit('SHOW_MESSAGE', { 
        message: `${enemy.name} takes ${poisonBuff.damage} poison damage!` 
      });
      
      // Check if enemy was defeated
      if (newHealth <= 0) {
        handleEnemyDefeated();
        return true;
      }
    }
  }
  
  // Here you can add other status effects like burning, regeneration, etc.
  // For example:
  // processRegeneration();
  // processBurning();
  
  return false; // No one was defeated by status effects
}

/**
 * Apply a buff to a target (player or enemy)
 * @param {String} target - 'player' or 'enemy'
 * @param {Object} buff - Buff object with type and turns properties
 */
export function applyBuff(target, buff) {
  if (target !== 'player' && target !== 'enemy') {
    console.error("Invalid buff target:", target);
    return;
  }
  
  // Get the current target and their buffs
  const targetPath = target === 'player' ? 'player' : 'battle.enemy';
  const targetObj = GameState.data[target === 'player' ? 'player' : 'battle'].enemy;
  
  if (!targetObj) {
    console.error(`Target ${target} not found in state`);
    return;
  }
  
  // Initialize buffs array if it doesn't exist
  const currentBuffs = targetObj.buffs || [];
  
  // Check if a buff of this type already exists
  const existingBuffIndex = currentBuffs.findIndex(b => b.type === buff.type);
  
  if (existingBuffIndex >= 0) {
    // Update existing buff
    const updatedBuffs = [...currentBuffs];
    updatedBuffs[existingBuffIndex] = {
      ...currentBuffs[existingBuffIndex],
      turns: Math.max(currentBuffs[existingBuffIndex].turns, buff.turns), // Use the longer duration
      ...buff // Override with any new properties
    };
    
    GameState.setState(`${targetPath}.buffs`, updatedBuffs);
  } else {
    // Add new buff
    GameState.setState(`${targetPath}.buffs`, [...currentBuffs, buff]);
  }
  
  // Emit event for UI update
  EventBus.emit('BUFF_APPLIED', { target, buff });
  
  // Show buff message
  EventBus.emit('SHOW_MESSAGE', { 
    message: getBuffMessage(target, buff),
    type: buff.type === 'stunned' && target === 'player' ? 'error' : 'normal'
  });
}

/**
 * Get a message describing the buff
 * @param {String} target - 'player' or 'enemy'
 * @param {Object} buff - Buff object
 * @returns {String} Message describing the buff
 */
function getBuffMessage(target, buff) {
  const targetName = target === 'player' ? 'You' : GameState.data.battle.enemy.name;
  
  switch (buff.type) {
    case 'defense':
      return `${targetName} gained Defense (50% damage reduction)!`;
    case 'focused':
      return `${targetName} gained Focus (20% increased damage/healing)!`;
    case 'stunned':
      return `${targetName} ${target === 'player' ? 'are' : 'is'} Stunned (skip next turn)!`;
    case 'poison':
      return `${targetName} ${target === 'player' ? 'are' : 'is'} Poisoned (${buff.damage} damage per turn)!`;
    default:
      return `${targetName} gained ${buff.type} buff!`;
  }
}

/**
 * Process buff effects at the start of a turn
 * @param {String} target - 'player' or 'enemy'
 */
export function processBuffEffects(target) {
  const targetPath = target === 'player' ? 'player' : 'battle.enemy';
  const targetObj = GameState.data[target === 'player' ? 'player' : 'battle'].enemy;
  
  if (!targetObj || !targetObj.buffs || targetObj.buffs.length === 0) {
    return;
  }
  
  // Process each buff effect
  targetObj.buffs.forEach(buff => {
    switch (buff.type) {
      case 'poison':
        // Apply poison damage
        const newHealth = Math.max(0, targetObj.health - buff.damage);
        GameState.setState(`${targetPath}.health`, newHealth);
        
        // Emit events
        EventBus.emit('DAMAGE_DEALT', { 
          amount: buff.damage, 
          target, 
          source: 'poison',
          type: 'poison'
        });
        
        EventBus.emit('SHOW_MESSAGE', { 
          message: `${target === 'player' ? 'You take' : `${targetObj.name} takes`} ${buff.damage} poison damage!` 
        });
        
        // Check for defeat
        if (newHealth <= 0) {
          if (target === 'player') {
            handlePlayerDefeated();
          } else {
            handleEnemyDefeated();
          }
        }
        break;
      
      // Add other buff type processing as needed
    }
  });
}
// Add to js/systems/battle.js or js/systems/combat.js

/**
 * Calculate damage with modifiers
 * @param {Object} gem - The gem being used
 * @param {String} source - 'player' or 'enemy'
 * @param {String} target - 'player' or 'enemy'
 * @returns {Number} Final damage amount
 */
export function calculateDamage(gem, source = 'player', target = 'enemy') {
  // Get state objects
  const player = GameState.data.player;
  const enemy = GameState.data.battle.enemy;
  
  // Base damage
  let damage = gem.damage;
  
  // Apply source modifiers
  if (source === 'player') {
    // Apply class bonus
    if ((player.class === "Knight" && gem.color === "red") || 
        (player.class === "Mage" && gem.color === "blue") || 
        (player.class === "Rogue" && gem.color === "green")) {
      damage *= 1.5;
    }
    
    // Apply focus buff
    if (player.buffs.some(b => b.type === "focused")) {
      damage *= 1.2;
    }
  }
  
  // Round to integer
  damage = Math.floor(damage);
  
  // Apply target modifiers
  if (target === 'enemy') {
    // Apply shield type reduction (only affects non-matching colors)
    if (enemy.shield && gem.color !== enemy.shieldColor) {
      damage = Math.floor(damage / 2);
    }
    
    // Apply defense buff
    if (enemy.buffs && enemy.buffs.some(b => b.type === "defense")) {
      damage = Math.floor(damage / 2);
    }
  } else if (target === 'player') {
    // Apply player defense
    if (player.buffs && player.buffs.some(b => b.type === "defense")) {
      damage = Math.floor(damage / 2);
    }
  }
  
  return Math.max(0, damage);
}

/**
 * Apply damage to a target
 * @param {Number} damage - Damage amount
 * @param {String} target - 'player' or 'enemy'
 * @param {String} damageType - Type of damage (attack, poison, etc.)
 * @returns {Boolean} Whether the target was defeated
 */
export function applyDamage(damage, target, damageType = 'attack') {
  // Determine target path and object
  const targetPath = target === 'player' ? 'player' : 'battle.enemy';
  const targetObj = target === 'player' ? GameState.data.player : GameState.data.battle.enemy;
  
  if (!targetObj) {
    console.error(`Target ${target} not found in state`);
    return false;
  }
  
  // Apply damage
  const newHealth = Math.max(0, targetObj.health - damage);
  GameState.setState(`${targetPath}.health`, newHealth);
  
  // Emit damage event for UI
  EventBus.emit('DAMAGE_DEALT', { 
    amount: damage, 
    target, 
    type: damageType 
  });
  
  // Return whether target was defeated
  return newHealth <= 0;
}
/**
 * Handle enemy defeat
 */
export function handleEnemyDefeated() {
  const enemy = GameState.data.battle.enemy;
  
  // Mark battle as over
  GameState.setState('battleOver', true);
  
  // Calculate reward based on enemy type
  const reward = enemy.name === "Dark Guardian" ? 30 : 10;
  
  // Add reward to player zenny
  const player = GameState.data.player;
  GameState.setState('player.zenny', player.zenny + reward);
  
  // Show success message
  EventBus.emit('SHOW_MESSAGE', { 
    message: `${enemy.name} defeated! +${reward} $ZENNY` 
  });
  
  // Emit victory event
  EventBus.emit('BATTLE_VICTORY', { enemy, reward });
  
  // Increment battle count
  const battleCount = GameState.data.battleCount;
  GameState.setState('battleCount', battleCount + 1);
  
  // Progress game state after delay
  setTimeout(() => {
    progressGameState();
  }, 1500);
}

/**
 * Handle player defeat
 */
export function handlePlayerDefeated() {
  // Mark battle as over
  GameState.setState('battleOver', true);
  
  // Show defeat message
  EventBus.emit('SHOW_MESSAGE', { 
    message: "You were defeated!", 
    type: "error" 
  });
  
  // Emit defeat event
  EventBus.emit('BATTLE_DEFEAT', {});
  
  // Return to character select after delay
  setTimeout(() => {
    EventBus.emit('SCREEN_CHANGE', { screen: 'characterSelect' });
  }, 2000);
}

/**
 * Progress game state after battle victory
 */
function progressGameState() {
  const battleCount = GameState.data.battleCount;
  const battlesPerDay = Config.BATTLES_PER_DAY;
  const currentPhaseIndex = GameState.data.currentPhaseIndex;
  const currentDay = GameState.data.currentDay;
  
  // Check if we need to move to the next phase
  if (battleCount % battlesPerDay !== 0) {
    // Move to next phase within the same day
    GameState.setState('currentPhaseIndex', currentPhaseIndex + 1);
    
    // Save hand state
    saveHandState();
    
    // Prepare shop and go there
    EventBus.emit('SHOP_PREPARE', {});
    EventBus.emit('SCREEN_CHANGE', { screen: 'shop' });
  } else {
    // Complete day - reset phase and increment day
    GameState.setState('currentPhaseIndex', 0);
    GameState.setState('currentDay', currentDay + 1);
    
    // Check if game is complete
    if (currentDay + 1 > Config.MAX_DAYS) {
      handleGameCompletion();
    } else {
      EventBus.emit('SCREEN_CHANGE', { screen: 'camp' });
    }
  }
}

/**
 * Handle game completion
 */
function handleGameCompletion() {
  // Award bonus meta zenny for completion
  const metaZenny = GameState.data.metaZenny;
  GameState.setState('metaZenny', metaZenny + 100);
  
  // Emit completion event
  EventBus.emit('GAME_COMPLETED', { reward: 100 });
  
  // Show victory message
  EventBus.emit('SHOW_MESSAGE', { 
    message: "Journey complete! Victory!" 
  });
  
  // Return to character select
  setTimeout(() => {
    EventBus.emit('SCREEN_CHANGE', { screen: 'characterSelect' });
  }, 2000);
}

/**
 * Save the current hand state (for transitions)
 */
function saveHandState() {
  const hand = GameState.data.hand;
  localStorage.setItem('stw_temp_hand', JSON.stringify(hand));
}