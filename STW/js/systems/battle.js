// Enhanced battle system with improved mechanics from standalone version
import { GameState } from '../core/state.js';
import { EventBus } from '../core/events.js';
import { GEM_TYPES } from '../core/config.js';

/**
 * Initialize a new battle
 */
export function startBattle() {
  console.log("Starting battle with enhanced system...");
  
  // Generate enemy
  const enemy = generateEnemy();
  GameState.set('battle.enemy', enemy);
  
  // Reset battle state
  GameState.set({
    'battleOver': false,
    'hasActedThisTurn': false,
    'hasPlayedGemThisTurn': false,
    'isEnemyTurnPending': false,
    'selectedGems': new Set()
  });
  
  // Clear player buffs
  GameState.set('player.buffs', []);
  
  // Reset stamina
  const player = GameState.get('player');
  GameState.set('player.stamina', player.baseStamina);
  
  // Draw initial cards
  drawGems(3);
  
  // Update UI
  updateBattleUI();
}

/**
 * Generate an enemy for the current battle
 * @returns {Object} Enemy data
 */
export function generateEnemy() {
  const currentPhaseIndex = GameState.get('currentPhaseIndex') || 0;
  const battleCount = GameState.get('battleCount') || 0;
  
  // Simple enemy types - could be expanded from config
  const enemies = [
    { name: "Grunt", maxHealth: 20, attack: 5, actions: ["Attack 5", "Defend"] },
    { name: "Bandit", maxHealth: 15, attack: 7, actions: ["Attack 7", "Steal 3"] },
    { name: "Wolf", maxHealth: 25, attack: 4, actions: ["Attack 4", "Charge"] }
  ];
  
  // Use a boss for the last battle of each phase
  const isBossBattle = battleCount % 3 === 2;
  
  let enemyBase;
  
  if (isBossBattle) {
    enemyBase = {
      name: "Dark Guardian",
      maxHealth: 30 + (currentPhaseIndex * 5),
      attack: 6 + currentPhaseIndex,
      actions: ["Attack 6", "Charge", "Defend"],
      isBoss: true,
      shield: true,
      shieldColor: "red"
    };
  } else {
    // Select a regular enemy based on battle count
    enemyBase = { ...enemies[battleCount % enemies.length] };
    
    // Scale up with phase
    enemyBase.maxHealth += currentPhaseIndex * 3;
    enemyBase.attack += currentPhaseIndex;
  }
  
  // Prepare enemy for battle
  const enemy = {
    ...enemyBase,
    health: enemyBase.maxHealth,
    actionQueue: shuffleArray([...enemyBase.actions]),
    currentAction: null,
    buffs: []
  };
  
  // Set initial action
  enemy.currentAction = enemy.actionQueue.shift();
  
  return enemy;
}

/**
 * Draw cards from the gem bag to hand
 * @param {Number} count - Number of cards to draw
 */
export function drawGems(count) {
  const hand = document.getElementById('hand');
  if (!hand) {
    console.error("Hand container not found!");
    return;
  }
  
  // Clear the hand display
  hand.innerHTML = '';
  
  // Keep existing hand or initialize empty
  let currentHand = GameState.get('hand') || [];
  
  // Calculate how many we need to draw
  const maxHandSize = 3; // Could come from config
  const neededCards = Math.min(count, maxHandSize - currentHand.length);
  
  if (neededCards <= 0) {
    // Just update UI if no new cards needed
    renderHand();
    return;
  }
  
  // Get gem bag
  let gemBag = GameState.get('gemBag') || [];
  let discard = GameState.get('discard') || [];
  
  // If gem bag is empty, shuffle discard pile into it
  if (gemBag.length < neededCards && discard.length > 0) {
    gemBag = [...gemBag, ...discard];
    discard = [];
    gemBag = shuffleArray(gemBag);
    
    GameState.set('gemBag', gemBag);
    GameState.set('discard', discard);
  }
  
  // For now, generate random gems since we don't have a full gem bag system yet
  for (let i = 0; i < neededCards; i++) {
    if (gemBag.length > 0) {
      // Draw from actual gem bag when implemented
      const gem = gemBag.pop();
      currentHand.push(gem);
    } else {
      // Fallback: create a random gem
      const gemTypeKeys = Object.keys(GEM_TYPES);
      const randomTypeKey = gemTypeKeys[Math.floor(Math.random() * gemTypeKeys.length)];
      const gemType = GEM_TYPES[randomTypeKey];
      
      // Create gem with unique ID
      const gem = {
        id: `${randomTypeKey}-${Date.now()}-${i}`,
        name: gemType.name,
        color: gemType.color || 'red',
        cost: gemType.staminaCost,
        damage: gemType.colors ? 
          (gemType.colors.red || gemType.colors.blue || gemType.colors.green || 0) : 0,
        heal: gemType.effect || 0,
        shield: gemType.name === 'Shield'
      };
      
      currentHand.push(gem);
    }
  }
  
  // Update state
  GameState.set('hand', currentHand);
  GameState.set('gemBag', gemBag);
  
  // Render the hand
  renderHand();
}

/**
 * Render the player's hand of gems
 */
export function renderHand() {
  const hand = document.getElementById('hand');
  if (!hand) return;
  
  // Clear the hand area
  hand.innerHTML = '';
  
  // Get current hand from state
  const currentHand = GameState.get('hand') || [];
  const selectedGems = GameState.get('selectedGems') || new Set();
  const playerClass = GameState.get('player.class');
  
  // Add gems to the display
  currentHand.forEach((gem, index) => {
    const gemElement = createGemElement(gem, index, playerClass);
    hand.appendChild(gemElement);
  });
}

/**
 * Create a gem DOM element
 * @param {Object} gem - Gem data
 * @param {Number} index - Index in hand
 * @param {String} playerClass - Player's class
 * @returns {HTMLElement} Gem element
 */
function createGemElement(gem, index, playerClass) {
  // Create the gem element
  const gemElement = document.createElement('div');
  gemElement.className = `gem ${gem.color || 'red'}`;
  
  // Add selected class if needed
  const selectedGems = GameState.get('selectedGems') || new Set();
  if (selectedGems.has(index)) {
    gemElement.classList.add('selected');
  }
  
  // Check for class bonus
  const hasClassBonus = 
    (playerClass === 'Knight' && gem.color === 'red') || 
    (playerClass === 'Mage' && gem.color === 'blue') || 
    (playerClass === 'Rogue' && gem.color === 'green');
  
  if (hasClassBonus) {
    gemElement.classList.add('class-bonus');
  }
  
  // Build the gem content
  gemElement.innerHTML = `
    <div class="gem-content">
      <div class="gem-icon">${getGemIcon(gem)}</div>
      <div class="gem-value">${gem.damage || gem.heal || ''}</div>
    </div>
    <div class="gem-cost">${gem.cost}</div>
  `;
  
  // Add tooltip
  let tooltip = '';
  if (gem.damage) tooltip += `Damage: ${gem.damage}${hasClassBonus ? ' (+50%)' : ''}`;
  if (gem.heal) tooltip += `Heal: ${gem.heal}${hasClassBonus ? ' (+50%)' : ''}`;
  if (gem.shield) tooltip += 'Adds shield buff';
  
  if (tooltip) {
    gemElement.setAttribute('data-tooltip', tooltip);
  }
  
  // Add click handler
  gemElement.addEventListener('click', () => toggleGemSelection(index));
  
  return gemElement;
}

/**
 * Get the appropriate icon for a gem
 * @param {Object} gem - Gem data
 * @returns {String} Icon character
 */
function getGemIcon(gem) {
  if (gem.damage) return '🗡️';
  if (gem.heal) return '💚';
  if (gem.shield) return '🛡️';
  return '✨';
}

/**
 * Toggle gem selection in the hand
 * @param {Number} index - Index of the gem in the hand
 */
export function toggleGemSelection(index) {
  const hand = GameState.get('hand') || [];
  let selectedGems = GameState.get('selectedGems') || new Set();
  
  // Validate index
  if (index < 0 || index >= hand.length) {
    console.warn(`Invalid gem index: ${index}`);
    return;
  }
  
  // Toggle selection
  if (selectedGems.has(index)) {
    selectedGems.delete(index);
  } else {
    selectedGems.add(index);
  }
  
  // Update state
  GameState.set('selectedGems', selectedGems);
  
  // Update UI
  renderHand();
  updateBattleUI();
}

/**
 * Execute selected gems
 */
export function executeSelectedGems() {
  const battleOver = GameState.get('battleOver');
  const selectedGems = GameState.get('selectedGems') || new Set();
  const isEnemyTurnPending = GameState.get('isEnemyTurnPending');
  const hand = GameState.get('hand') || [];
  
  // Skip if battle is over or no gems selected
  if (battleOver || selectedGems.size === 0 || isEnemyTurnPending) {
    return;
  }
  
  // Verify all selected indices are valid
  const validIndices = Array.from(selectedGems).filter(index => 
    index >= 0 && index < hand.length
  );
  
  if (validIndices.length === 0) {
    console.warn("No valid gems selected");
    return;
  }
  
  // Sort indices in descending order to avoid index shifting problems
  const sortedIndices = validIndices.sort((a, b) => b - a);
  
  // Try to play each selected gem
  for (const index of sortedIndices) {
    playGem(index);
  }
  
  // Clear selection
  GameState.set('selectedGems', new Set());
  
  // Update UI
  renderHand();
  updateBattleUI();
}

/**
 * Play a gem from the player's hand
 * @param {Number} index - Index of the gem in the hand
 * @returns {Boolean} Whether the gem was successfully played
 */
function playGem(index) {
  try {
    const hand = GameState.get('hand') || [];
    const player = GameState.get('player');
    
    // Validate index
    if (index < 0 || index >= hand.length) {
      console.warn(`Invalid gem index: ${index}`);
      return false;
    }
    
    const gem = hand[index];
    
    // Check stamina cost
    if (player.stamina < gem.cost) {
      showMessage("Not enough stamina!", "error");
      return false;
    }
    
    // Deduct stamina
    GameState.set('player.stamina', player.stamina - gem.cost);
    
    // Calculate damage/healing multiplier
    const multiplier = calculateGemMultiplier(gem);
    
    // Process gem effects
    processGemEffect(gem, false, multiplier);
    
    // Remove gem from hand and add to discard
    const newHand = [...hand];
    const playedGem = newHand.splice(index, 1)[0];
    
    GameState.set('hand', newHand);
    
    const discard = GameState.get('discard') || [];
    GameState.set('discard', [...discard, playedGem]);
    
    // Mark that player has played a gem this turn
    GameState.set('hasPlayedGemThisTurn', true);
    
    return true;
  } catch (error) {
    console.error("Error playing gem:", error);
    return false;
  }
}

/**
 * Calculate gem effect multiplier
 * @param {Object} gem - Gem data
 * @returns {Number} Multiplier value
 */
function calculateGemMultiplier(gem) {
  const player = GameState.get('player');
  let multiplier = 1;
  
  // Class bonus
  if ((player.class === "Knight" && gem.color === "red") || 
      (player.class === "Mage" && gem.color === "blue") || 
      (player.class === "Rogue" && gem.color === "green")) {
    multiplier *= 1.5;
  }
  
  // Focus buff
  const hasFocusBuff = player.buffs && player.buffs.some(b => b.type === "focused");
  if (hasFocusBuff) {
    multiplier *= 1.2;
  }
  
  return multiplier;
}

/**
 * Process gem effect
 * @param {Object} gem - Gem data
 * @param {Boolean} failed - Whether the gem effect failed
 * @param {Number} multiplier - Effect multiplier
 */
function processGemEffect(gem, failed, multiplier) {
  if (failed) {
    // Handle failed effects
    const player = GameState.get('player');
    
    if (gem.damage) {
      const damage = Math.floor(gem.damage * multiplier * 0.5);
      const newHealth = Math.max(0, player.health - damage);
      GameState.set('player.health', newHealth);
      
      showMessage(`Failed ${gem.name}! Took ${damage} damage!`, "error");
      showDamageEffect(damage, 'player');
    } else if (gem.heal) {
      const damage = 5; // Fixed value for heal failures
      const newHealth = Math.max(0, player.health - damage);
      GameState.set('player.health', newHealth);
      
      showMessage(`Failed ${gem.name}! Lost ${damage} health!`, "error");
      showDamageEffect(damage, 'player');
    }
  } else {
    // Handle successful effects
    const player = GameState.get('player');
    const enemy = GameState.get('battle.enemy');
    
    if (gem.damage && enemy) {
      // Calculate final damage
      let damage = Math.floor(gem.damage * multiplier);
      
      // Apply enemy defense if present
      const hasDefenseBuff = enemy.buffs && enemy.buffs.some(b => b.type === "defense");
      if (hasDefenseBuff) {
        damage = Math.floor(damage / 2);
      }
      
      // Check for shield bypass
      if (enemy.shield && gem.color !== enemy.shieldColor) {
        damage = Math.floor(damage / 2);
        showMessage(`Shield reduced damage!`);
      }
      
      // Apply damage
      const newHealth = Math.max(0, enemy.health - damage);
      GameState.set('battle.enemy.health', newHealth);
      
      showMessage(`Dealt ${damage} damage to ${enemy.name}!`);
      showDamageEffect(damage, 'enemy');
      
      // Check for enemy defeat
      if (newHealth <= 0) {
        handleEnemyDefeated();
      }
    }
    
    if (gem.heal) {
      // Calculate healing
      const healAmount = Math.floor(gem.heal * multiplier);
      const newHealth = Math.min(player.health + healAmount, player.maxHealth);
      GameState.set('player.health', newHealth);
      
      showMessage(`Healed for ${healAmount} health!`);
      showHealEffect(healAmount);
    }
    
    if (gem.shield) {
      // Add shield buff to player
      const buffs = [...(player.buffs || [])];
      buffs.push({
        type: "defense",
        turns: 2
      });
      
      GameState.set('player.buffs', buffs);
      showMessage(`Gained defensive shield for 2 turns!`);
    }
  }
}

/**
 * End the current turn
 */
export function endPlayerTurn() {
  const battleOver = GameState.get('battleOver');
  
  // Don't process if battle is over
  if (battleOver) return;
  
  // Check if player is stunned
  const player = GameState.get('player');
  const isStunned = player.buffs && player.buffs.some(b => b.type === "stunned");
  
  if (isStunned) {
    showMessage("You are stunned and skip your turn!", "error");
  }
  
  // Mark enemy turn as pending
  GameState.set('isEnemyTurnPending', true);
  GameState.set('battle.turn', 'enemy');
  
  // Update UI
  updateBattleUI();
  
  // Process enemy turn with a delay
  setTimeout(() => {
    processEnemyTurn();
  }, 500);
}

/**
 * Process the enemy's turn
 */
function processEnemyTurn() {
  // Skip if battle is over
  if (GameState.get('battleOver')) {
    console.log("Battle is over, skipping enemy turn");
    return;
  }
  
  const enemy = GameState.get('battle.enemy');
  if (!enemy) {
    console.error("No enemy found for turn processing");
    finishEnemyTurn();
    return;
  }
  
  // Execute enemy action with delay
  setTimeout(() => {
    executeEnemyAction();
    
    // Apply poison effects after executing action
    setTimeout(() => {
      applyStatusEffects();
      
      // Prepare next action
      setTimeout(() => {
        prepareNextEnemyAction();
        
        // Finish turn
        setTimeout(() => {
          finishEnemyTurn();
        }, 500);
      }, 500);
    }, 500);
  }, 500);
}

/**
 * Execute the enemy's current action
 */
function executeEnemyAction() {
  const enemy = GameState.get('battle.enemy');
  const player = GameState.get('player');
  
  if (!enemy || !enemy.currentAction || enemy.health <= 0) {
    console.log("No enemy action to execute");
    return;
  }
  
  // Process based on action type
  if (enemy.currentAction.startsWith("Attack")) {
    // Extract damage value
    let damage = 0;
    try {
      const parts = enemy.currentAction.split(" ");
      damage = parseInt(parts[1]) || 5; // Default to 5 if parsing fails
    } catch (e) {
      console.warn("Error parsing enemy attack damage, using default");
      damage = 5;
    }
    
    // Apply attack boost if present
    if (enemy.nextAttackBoost) {
      damage *= enemy.nextAttackBoost;
      enemy.nextAttackBoost = null;
      GameState.set('battle.enemy', enemy);
    }
    
    // Apply player defense if present
    if (player.buffs && player.buffs.some(b => b.type === "defense")) {
      damage = Math.floor(damage / 2);
    }
    
    // Apply damage to player
    const newHealth = Math.max(0, player.health - damage);
    GameState.set('player.health', newHealth);
    
    showMessage(`${enemy.name} attacks for ${damage} damage!`);
    showDamageEffect(damage, 'player');
    
    // Check if player defeated
    if (newHealth <= 0) {
      handlePlayerDefeated();
    }
  } else if (enemy.currentAction === "Defend") {
    showMessage(`${enemy.name} defends, reducing next damage!`);
    
    // Add defense buff
    const buffs = [...(enemy.buffs || [])];
    buffs.push({ type: "defense", turns: 2 });
    
    enemy.buffs = buffs;
    GameState.set('battle.enemy', enemy);
  } else if (enemy.currentAction === "Charge") {
    showMessage(`${enemy.name} charges for a stronger attack next turn!`);
    
    enemy.nextAttackBoost = 2;
    GameState.set('battle.enemy', enemy);
  } else if (enemy.currentAction.startsWith("Steal")) {
    // Extract zenny value
    let zenny = 3; // Default value
    try {
      const parts = enemy.currentAction.split(" ");
      zenny = parseInt(parts[1]) || zenny;
    } catch (e) {
      console.warn("Error parsing steal amount, using default");
    }
    
    // Steal zenny from player
    const currentZenny = player.zenny || 0;
    const stolenAmount = Math.min(currentZenny, zenny);
    GameState.set('player.zenny', currentZenny - stolenAmount);
    
    showMessage(`${enemy.name} steals ${stolenAmount} $ZENNY!`);
  }
}

/**
 * Apply status effects like poison
 */
function applyStatusEffects() {
  const player = GameState.get('player');
  const enemy = GameState.get('battle.enemy');
  
  if (!enemy) return;
  
  // Apply poison effect to enemy
  const poisonBuff = enemy.buffs && enemy.buffs.find(b => b.type === "poison");
  if (poisonBuff) {
    const damage = poisonBuff.damage || 2;
    const newHealth = Math.max(0, enemy.health - damage);
    
    GameState.set('battle.enemy.health', newHealth);
    showMessage(`${enemy.name} takes ${damage} poison damage!`);
    showDamageEffect(damage, 'enemy', true);
    
    // Check if enemy defeated
    if (newHealth <= 0) {
      handleEnemyDefeated();
      return;
    }
  }
  
  // Apply poison effect to player
  const playerPoisonBuff = player.buffs && player.buffs.find(b => b.type === "poison");
  if (playerPoisonBuff) {
    const damage = playerPoisonBuff.damage || 2;
    const newHealth = Math.max(0, player.health - damage);
    
    GameState.set('player.health', newHealth);
    showMessage(`You take ${damage} poison damage!`);
    showDamageEffect(damage, 'player', true);
    
    // Check if player defeated
    if (newHealth <= 0) {
      handlePlayerDefeated();
    }
  }
}

/**
 * Prepare the enemy's next action
 */
function prepareNextEnemyAction() {
  const enemy = GameState.get('battle.enemy');
  
  if (!enemy || enemy.health <= 0) return;
  
  // Get next action from queue
  enemy.currentAction = enemy.actionQueue.shift();
  
  // Refill action queue if needed
  if (enemy.actionQueue.length < 2) {
    const shuffledActions = shuffleArray([...enemy.actions]);
    enemy.actionQueue.push(...shuffledActions);
  }
  
  // Update enemy state
  GameState.set('battle.enemy', enemy);
  
  // Show message about next action
  if (enemy.currentAction) {
    showMessage(`${enemy.name} prepares to ${enemy.currentAction.toLowerCase()}...`);
  }
}

/**
 * Finish the enemy turn and prepare player turn
 */
function finishEnemyTurn() {
  const battleOver = GameState.get('battleOver');
  
  // Skip if battle is over
  if (battleOver) return;
  
  // Reset turn state flags
  GameState.set({
    'hasActedThisTurn': false,
    'hasPlayedGemThisTurn': false,
    'isEnemyTurnPending': false,
    'battle.turn': 'player'
  });
  
  // Clear any selected gems
  GameState.set('selectedGems', new Set());
  
  // Restore player stamina
  const baseStamina = GameState.get('player.baseStamina') || 3;
  GameState.set('player.stamina', baseStamina);
  
  // Reduce buff durations for player
  const playerBuffs = GameState.get('player.buffs') || [];
  const updatedPlayerBuffs = playerBuffs
    .map(buff => ({ ...buff, turns: buff.turns - 1 }))
    .filter(buff => buff.turns > 0);
  
  GameState.set('player.buffs', updatedPlayerBuffs);
  
  // Reduce buff durations for enemy
  const enemy = GameState.get('battle.enemy');
  if (enemy && enemy.buffs) {
    const updatedEnemyBuffs = enemy.buffs
      .map(buff => ({ ...buff, turns: buff.turns - 1 }))
      .filter(buff => buff.turns > 0);
    
    enemy.buffs = updatedEnemyBuffs;
    GameState.set('battle.enemy', enemy);
  }
  
  // Draw new cards
  drawGems(3);
  
  // Update UI
  updateBattleUI();
  showMessage("Your turn", "info");
}

/**
 * Wait to gain focus (focus buff)
 */
export function waitTurn() {
  const battleOver = GameState.get('battleOver');
  const hasActedThisTurn = GameState.get('hasActedThisTurn');
  const hasPlayedGemThisTurn = GameState.get('hasPlayedGemThisTurn');
  
  if (battleOver || hasActedThisTurn || hasPlayedGemThisTurn) {
    return;
  }
  
  // Mark as acted this turn
  GameState.set('hasActedThisTurn', true);
  
  // Add focus buff
  const playerBuffs = GameState.get('player.buffs') || [];
  playerBuffs.push({ type: "focused", turns: 2 });
  GameState.set('player.buffs', playerBuffs);
  
  showMessage("Waited, gaining focus for next turn (+20% damage/heal)!");
  
  // End turn after delay
  setTimeout(() => {
    endPlayerTurn();
  }, 300);
}

/**
 * Discard selected gems and end turn
 */
export function discardAndEndTurn() {
  const battleOver = GameState.get('battleOver');
  const selectedGems = GameState.get('selectedGems') || new Set();
  const hasActedThisTurn = GameState.get('hasActedThisTurn');
  
  if (battleOver || selectedGems.size === 0 || hasActedThisTurn) {
    return;
  }
  
  // Get current hand and gem bag
  const hand = GameState.get('hand') || [];
  const gemBag = GameState.get('gemBag') || [];
  
  // Get indices in descending order
  const indices = Array.from(selectedGems).sort((a, b) => b - a);
  
  // Remove gems from hand and add to gem bag
  const newHand = [...hand];
  const discardedGems = [];
  
  indices.forEach(index => {
    if (index >= 0 && index < newHand.length) {
      const gem = newHand.splice(index, 1)[0];
      discardedGems.push(gem);
    }
  });
  
  // Update state
  GameState.set('hand', newHand);
  GameState.set('gemBag', [...gemBag, ...discardedGems]);
  GameState.set('selectedGems', new Set());
  GameState.set('hasActedThisTurn', true);
  
  showMessage(`Discarded ${discardedGems.length} gems and recycled to gem bag`);
  
  // Update UI
  renderHand();
  updateBattleUI();
  
  // End turn after delay
  setTimeout(() => {
    endPlayerTurn();
  }, 300);
}

/**
 * Flee from battle
 */
export function fleeBattle() {
  const battleOver = GameState.get('battleOver');
  const isEnemyTurnPending = GameState.get('isEnemyTurnPending');
  const currentPhaseIndex = GameState.get('currentPhaseIndex') || 0;
  
  // Can only flee in first two phases
  if (battleOver || isEnemyTurnPending || currentPhaseIndex >= 2) {
    return;
  }
  
  // Mark battle as over
  GameState.set('battleOver', true);
  
  // Clear buffs
  GameState.set('player.buffs', []);
  
  const enemy = GameState.get('battle.enemy');
  if (enemy) {
    enemy.buffs = [];
    GameState.set('battle.enemy', enemy);
  }
  
  showMessage("You fled the battle, skipping rewards!");
  
  // Increment battle count and phase
  const battleCount = GameState.get('battleCount') || 0;
  GameState.set('battleCount', battleCount + 1);
  GameState.set('currentPhaseIndex', currentPhaseIndex + 1);
  
  // Transition to shop after delay
  setTimeout(() => {
    // This would transition to the shop screen
    EventBus.emit('SCREEN_CHANGE', { screen: 'shop' });
  }, 1000);
}

/**
 * Handle enemy defeat
 */
function handleEnemyDefeated() {
  const enemy = GameState.get('battle.enemy');
  
  // Mark battle as over
  GameState.set('battleOver', true);
  
  // Calculate reward based on enemy type
  const reward = enemy.isBoss ? 30 : 10;
  
  // Give reward to player
  const currentZenny = GameState.get('player.zenny') || 0;
  GameState.set('player.zenny', currentZenny + reward);
  
  showMessage(`${enemy.name} defeated! +${reward} $ZENNY`, "success");
  
  // Show victory effect
  showVictoryEffect();
  
  // Update battle count
  const battleCount = GameState.get('battleCount') || 0;
  GameState.set('battleCount', battleCount + 1);
  
  // Progress game state after delay
  setTimeout(() => {
    progressGameState();
  }, 1500);
}

/**
 * Handle player defeat
 */
function handlePlayerDefeated() {
  // Mark battle as over
  GameState.set('battleOver', true);
  
  showMessage("You were defeated!", "error");
  
  // Show defeat effect
  showDefeatEffect();
  
  // Transition to character select after delay
  setTimeout(() => {
    EventBus.emit('SCREEN_CHANGE', { screen: 'character-select' });
  }, 2000);
}

/**
 * Progress game state after battle victory
 */
function progressGameState() {
  const battleCount = GameState.get('battleCount') || 0;
  const currentPhaseIndex = GameState.get('currentPhaseIndex') || 0;
  const currentDay = GameState.get('currentDay') || 1;
  
  // Check if we need to move to the next phase
  if (battleCount % 3 !== 0) {
    // Move to next phase within the same day
    GameState.set('currentPhaseIndex', currentPhaseIndex + 1);
    
    // Transition to shop
    setTimeout(() => {
      EventBus.emit('SCREEN_CHANGE', { screen: 'shop' });
    }, 1000);
  } else {
    // Complete day - reset phase and increment day
    GameState.set('currentPhaseIndex', 0);
    GameState.set('currentDay', currentDay + 1);
    
    // Check if game is complete (7 days)
    if (currentDay + 1 > 7) {
      // Handle game completion
      handleGameCompletion();
    } else {
      // Transition to camp screen
      setTimeout(() => {
        EventBus.emit('SCREEN_CHANGE', { screen: 'camp' });
      }, 1000);
    }
  }
}

/**
 * Handle game completion
 */
function handleGameCompletion() {
  // Award bonus meta zenny
  const metaZenny = GameState.get('metaZenny') || 0;
  GameState.set('metaZenny', metaZenny + 100);
  
  showMessage("Journey complete! Victory!");
  
  // Return to character select
  setTimeout(() => {
    EventBus.emit('SCREEN_CHANGE', { screen: 'character-select' });
  }, 2000);
}

/**
 * Update battle UI based on current state
 */
function updateBattleUI() {
  // This will be implemented in the UI module
  // For now we'll just update some basic elements
  
  // Update enemy health bar
  const enemy = GameState.get('battle.enemy');
  if (enemy) {
    updateEnemyDisplay();
  }
  
  // Update player stats
  const player = GameState.get('player');
  updatePlayerDisplay();
  
  // Update turn indicator
  const isEnemyTurn = GameState.get('isEnemyTurnPending');
  const turnIndicator = document.getElementById('turn-indicator');
  
  if (turnIndicator) {
    turnIndicator.textContent = isEnemyTurn ? "Enemy Turn" : "Your Turn";
    turnIndicator.className = isEnemyTurn ? "enemy" : "player";
  }
  
  // Update stamina bar
  updateStaminaDisplay();
  
  // Update action buttons
  updateActionButtons();
}

/**
 * Update the player display
 */
function updatePlayerDisplay() {
  const player = GameState.get('player');
  
  // Update health values
  const playerHealthElem = document.getElementById('player-health');
  const playerMaxHealthElem = document.getElementById('player-max-health');
  
  if (playerHealthElem) playerHealthElem.textContent = player.health;
  if (playerMaxHealthElem) playerMaxHealthElem.textContent = player.maxHealth;
  
  // Update health bar
  const playerHealthBar = document.getElementById('player-health-bar');
  if (playerHealthBar) {
    const percent = (player.health / player.maxHealth) * 100;
    playerHealthBar.style.width = `${percent}%`;
  }
  
  // Update buffs display
  const playerBuffsElem = document.getElementById('player-buffs');
  if (playerBuffsElem) {
    playerBuffsElem.innerHTML = '';
    
    if (player.buffs && player.buffs.length > 0) {
      player.buffs.forEach(buff => {
        const buffIcon = document.createElement('div');
        buffIcon.className = `buff-icon ${buff.type}`;
        
        // Set icon based on buff type
        let icon = '⚡';
        if (buff.type === 'focused') icon = '✦';
        if (buff.type === 'defense') icon = '🛡️';
        if (buff.type === 'stunned') icon = '💫';
        if (buff.type === 'poison') icon = '☠️';
        
        buffIcon.innerHTML = `${icon}<span class="turns">${buff.turns}</span>`;
        buffIcon.setAttribute('data-tooltip', `${buff.type} (${buff.turns} turns)`);
        
        playerBuffsElem.appendChild(buffIcon);
      });
    }
  }
}

/**
 * Update the enemy display
 */
export function updateEnemyDisplay() {
  const enemy = GameState.get('battle.enemy');
  if (!enemy) return;
  
  // Update name and health
  const enemyNameElem = document.getElementById('enemy-name');
  const enemyHealthElem = document.getElementById('enemy-health');
  const enemyMaxHealthElem = document.getElementById('enemy-max-health');
  
  if (enemyNameElem) enemyNameElem.textContent = enemy.name;
  if (enemyHealthElem) enemyHealthElem.textContent = enemy.health;
  if (enemyMaxHealthElem) enemyMaxHealthElem.textContent = enemy.maxHealth;
  
  // Update health bar
  const enemyHealthBar = document.getElementById('enemy-health-bar');
  if (enemyHealthBar) {
    const percent = (enemy.health / enemy.maxHealth) * 100;
    enemyHealthBar.style.width = `${percent}%`;
  }
  
  // Update attack display
  const enemyAttackElem = document.getElementById('enemy-attack');
  if (enemyAttackElem) {
    let attackValue = "?";
    
    // Extract attack value from current action if it's an attack
    if (enemy.currentAction && enemy.currentAction.startsWith("Attack")) {
      const parts = enemy.currentAction.split(" ");
      attackValue = parts[1] || "?";
    }
    
    enemyAttackElem.textContent = attackValue;
  }
  
  // Update enemy condition (shield, etc.)
  const enemyConditionElem = document.getElementById('enemy-condition');
  if (enemyConditionElem) {
    let conditionText = "";
    
    if (enemy.shield) {
      conditionText = `Shielded: Use ${enemy.shieldColor} Gems to bypass`;
    }
    
    enemyConditionElem.textContent = conditionText;
  }
  
  // Update enemy buffs
  const enemyBuffsElem = document.getElementById('enemy-buffs');
  if (enemyBuffsElem && enemy.buffs) {
    enemyBuffsElem.innerHTML = '';
    
    enemy.buffs.forEach(buff => {
      const buffIcon = document.createElement('div');
      buffIcon.className = `buff-icon ${buff.type}`;
      
      // Set icon based on buff type
      let icon = '⚡';
      if (buff.type === 'defense') icon = '🛡️';
      if (buff.type === 'poison') icon = '☠️';
      
      buffIcon.innerHTML = `${icon}<span class="turns">${buff.turns}</span>`;
      buffIcon.setAttribute('data-tooltip', `${buff.type} (${buff.turns} turns)`);
      
      enemyBuffsElem.appendChild(buffIcon);
    });
  }
}

/**
 * Update stamina display
 */
function updateStaminaDisplay() {
  const player = GameState.get('player');
  const staminaFill = document.getElementById('stamina-fill');
  const staminaText = document.getElementById('stamina-text');
  
  if (!staminaFill || !staminaText) return;
  
  // Update stamina bar
  const staminaPercent = (player.stamina / player.baseStamina) * 100;
  staminaFill.style.width = `${staminaPercent}%`;
  
  // Update stamina classes
  staminaFill.classList.remove('full', 'medium', 'low');
  
  if (player.stamina === player.baseStamina) {
    staminaFill.classList.add('full');
  } else if (player.stamina >= player.baseStamina / 2) {
    staminaFill.classList.add('medium');
  } else {
    staminaFill.classList.add('low');
  }
  
  // Update stamina text
  staminaText.textContent = `${player.stamina}/${player.baseStamina}`;
}

/**
 * Update action buttons based on game state
 */
function updateActionButtons() {
  const battleOver = GameState.get('battleOver');
  const isEnemyTurnPending = GameState.get('isEnemyTurnPending');
  const selectedGems = GameState.get('selectedGems') || new Set();
  const hasActedThisTurn = GameState.get('hasActedThisTurn');
  const hasPlayedGemThisTurn = GameState.get('hasPlayedGemThisTurn');
  const player = GameState.get('player');
  const hand = GameState.get('hand') || [];
  
  // Check if player is stunned
  const isStunned = player.buffs && player.buffs.some(b => b.type === "stunned");
  
  // Get action buttons
  const executeBtn = document.getElementById('execute-btn');
  const waitBtn = document.getElementById('wait-btn');
  const discardEndBtn = document.getElementById('discard-end-btn');
  const endTurnBtn = document.getElementById('end-turn-btn');
  const fleeBtn = document.getElementById('flee-btn');
  
  // Check if execute button is available
  if (executeBtn) {
    const canPlayGems = selectedGems.size > 0 && 
                     Array.from(selectedGems).every(i => i >= 0 && i < hand.length) &&
                     player.stamina >= Math.min(...Array.from(selectedGems).map(i => hand[i].cost));
                     
    executeBtn.disabled = battleOver || !canPlayGems || isEnemyTurnPending || isStunned;
  }
  
  // Update wait button
  if (waitBtn) {
    waitBtn.disabled = battleOver || isEnemyTurnPending || hasActedThisTurn || hasPlayedGemThisTurn || isStunned;
  }
  
  // Update discard button
  if (discardEndBtn) {
    discardEndBtn.disabled = battleOver || !selectedGems.size || isEnemyTurnPending || hasActedThisTurn || isStunned;
  }
  
  // Update end turn button
  if (endTurnBtn) {
    endTurnBtn.disabled = battleOver || isEnemyTurnPending || isStunned;
  }
  
  // Update flee button
  if (fleeBtn) {
    const currentPhaseIndex = GameState.get('currentPhaseIndex') || 0;
    fleeBtn.style.display = (currentPhaseIndex < 2 && !battleOver && !isEnemyTurnPending && !isStunned) ? "block" : "none";
  }
}

/**
 * Show a damage/healing effect
 * @param {Number} amount - Amount of damage or healing
 * @param {String} target - Target ('player' or 'enemy')
 * @param {Boolean} isPoison - Whether it's poison damage
 */
function showDamageEffect(amount, target, isPoison = false) {
  // Create effect element
  const effect = document.createElement('div');
  
  if (amount > 0) {
    // Damage effect
    effect.className = isPoison ? 'poison-text' : 'damage-text';
    effect.textContent = `-${amount}`;
  } else {
    // Healing effect
    effect.className = 'heal-text';
    effect.textContent = `+${Math.abs(amount)}`;
  }
  
  // Position effect based on target
  const targetSection = document.getElementById(`${target}-section`);
  if (targetSection) {
    targetSection.appendChild(effect);
    
    // Remove after animation
    setTimeout(() => {
      effect.remove();
    }, 1000);
  }
}

/**
 * Show healing effect
 * @param {Number} amount - Healing amount
 */
function showHealEffect(amount) {
  showDamageEffect(-amount, 'player');
}

/**
 * Show victory effect
 */
function showVictoryEffect() {
  const battleScreen = document.getElementById('battle-screen');
  if (!battleScreen) return;
  
  // Create victory text
  const victoryText = document.createElement('div');
  victoryText.className = 'victory-text';
  victoryText.textContent = 'VICTORY!';
  
  // Add to battle screen
  battleScreen.appendChild(victoryText);
  
  // Remove after animation
  setTimeout(() => {
    victoryText.remove();
  }, 1500);
}

/**
 * Show defeat effect
 */
function showDefeatEffect() {
  const battleScreen = document.getElementById('battle-screen');
  if (!battleScreen) return;
  
  // Create defeat text
  const defeatText = document.createElement('div');
  defeatText.className = 'defeat-text';
  defeatText.textContent = 'DEFEAT';
  
  // Add to battle screen
  battleScreen.appendChild(defeatText);
  
  // Remove after animation
  setTimeout(() => {
    defeatText.remove();
  }, 1500);
}

/**
 * Show a message to the player
 * @param {String} text - Message text
 * @param {String} type - Message type ('success', 'error', 'info')
 */
function showMessage(text, type = 'info') {
  // Find message element or create it
  let messageElement = document.getElementById('message');
  
  if (!messageElement) {
    messageElement = document.createElement('div');
    messageElement.id = 'message';
    document.body.appendChild(messageElement);
  }
  
  // Set message content and style
  messageElement.textContent = text;
  messageElement.className = type;
  messageElement.classList.add('visible');
  
  // Hide message after delay
  setTimeout(() => {
    messageElement.classList.remove('visible');
  }, 2000);
}

/**
 * Utility function to shuffle an array
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const result = [...array];
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}