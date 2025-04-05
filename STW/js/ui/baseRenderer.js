// BaseRenderer.js - Handles core UI rendering and screen management
import { GameState } from '../core/state.js';
import { EventBus } from '../core/eventbus.js';
import { Utils } from '../core/utils.js';
import { Config } from '../core/config.js';
import { GemRenderer } from './gemRenderer.js';

/**
 * Initialize the UI renderer
 */
export function initialize() {
  console.log("Initializing BaseRenderer");
  
  // Register event listeners for UI updates
  setupEventListeners();
  
  // Initial UI setup
  updateActiveScreen(GameState.get('currentScreen') || 'character-select');
  
  return true;
}

/**
 * Set up event listeners for UI updates
 */
function setupEventListeners() {
  // Screen changes
  EventBus.on('SCREEN_CHANGE', (screen) => {
    updateActiveScreen(screen);
  });
  
  // UI messages
  EventBus.on('UI_MESSAGE', ({ message, type = 'success', duration = 2000 }) => {
    showMessage(message, type, duration);
  });
  
  // Battle UI updates
  EventBus.on('BATTLE_UI_UPDATE', (data) => {
    updateBattleUI(data);
  });
  
  // Shop UI updates
  EventBus.on('SHOP_PREPARED', () => {
    updateShopUI();
  });
  
  // Hand updates
  EventBus.on('HAND_UPDATED', () => {
    GemRenderer.renderHand();
  });
  
  // Generic UI updates
  EventBus.on('UI_UPDATE', ({ target }) => {
    switch (target) {
      case 'battle':
        updateBattleUI();
        break;
      case 'shop':
        updateShopUI();
        break;
      case 'gemCatalog':
        updateGemCatalogUI();
        break;
      case 'camp':
        updateCampUI();
        break;
    }
  });
  
  // Visual effects
  EventBus.on('SHOW_DAMAGE', ({ target, amount, isPoison }) => {
    showDamageAnimation(target, amount, isPoison);
  });
  
  EventBus.on('SHOW_VICTORY', () => {
    showVictoryEffect();
  });
  
  EventBus.on('SHOW_DEFEAT', () => {
    showDefeatEffect();
  });
  
  // Gem selection events
  EventBus.on('GEM_SELECTION_CHANGED', ({ selectedIndices }) => {
    GemRenderer.updateGemSelection(selectedIndices);
  });
  
  // Gem unlocking
  EventBus.on('UNLOCK_GEM', ({ gemKey }) => {
    if (typeof EventHandler !== 'undefined' && EventHandler.unlockGem) {
      EventHandler.unlockGem(gemKey);
    }
  });
}

/**
 * Update active screen in the UI
 * @param {String} screenName - Screen to display
 */
export function updateActiveScreen(screenName) {
    console.log(`Switching to screen: ${screenName}`);
    
    // Update state
    GameState.set('currentScreen', screenName);
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    
    // The issue is with how we're getting the screen element - let's fix it
    let targetScreen;
    
    // Handle special case for gemCatalog screen which has a different ID format
    if (screenName === 'gemCatalog') {
      targetScreen = document.getElementById('gemCatalog-screen');
      // If still not found, try lowercase version as fallback
      if (!targetScreen) {
        targetScreen = document.getElementById('gem-catalog-screen');
      }
    } else {
      // Normal case - use the standard format
      targetScreen = document.getElementById(`${screenName}-screen`);
    }
    
    if (targetScreen) {
      targetScreen.classList.add('active');
      
      // Update screen-specific UI
      switch (screenName) {
        case 'character-select':
          // No special setup needed
          break;
        case 'gemCatalog':
          updateGemCatalogUI();
          break;
        case 'battle':
          updateBattleUI();
          break;
        case 'shop':
          updateShopUI();
          break;
        case 'camp':
          updateCampUI();
          break;
      }
      
      // Special handling for gem catalog screen
      if (screenName === 'gemCatalog') {
        const continueBtn = document.getElementById('continue-journey-btn');
        if (continueBtn) {
          continueBtn.onclick = function() {
            console.log("Continue journey button clicked");
            EventBus.emit('JOURNEY_START');
            setTimeout(() => EventBus.emit('SCREEN_CHANGE', 'battle'), 100);
          };
        }
      }
    } else {
      console.error(`Target screen for "${screenName}" not found. Tried with suffix "-screen".`);
      // Additional error reporting
      console.log("Available screens:", Array.from(document.querySelectorAll('.screen')).map(screen => screen.id));
    }
  }
/**
 * Show a notification message
 * @param {String} message - Message to display
 * @param {String} type - Message type ('success' or 'error')
 * @param {Number} duration - Time to display message in ms
 */
export function showMessage(message, type = 'success', duration = 2000) {
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
  
  // Clear after duration
  setTimeout(() => {
    messageEl.classList.remove('visible');
  }, duration);
}

/**
 * Update the battle UI with state data
 * @param {Object} data - Battle data (optional, will be fetched if not provided)
 */
export function updateBattleUI(data) {
  if (!data) {
    // Fetch current battle data
    const player = GameState.get('player');
    const enemy = GameState.get('battle.enemy');
    const currentPhaseIndex = GameState.get('currentPhaseIndex');
    const currentDay = GameState.get('currentDay');
    const isEnemyTurnPending = GameState.get('isEnemyTurnPending');
    
    data = {
      player: {
        health: player.health,
        maxHealth: player.maxHealth,
        stamina: player.stamina,
        baseStamina: player.baseStamina,
        zenny: player.zenny,
        buffs: player.buffs
      },
      enemy: enemy ? {
        name: enemy.name,
        health: enemy.health,
        maxHealth: enemy.maxHealth,
        currentAction: enemy.currentAction,
        actionQueue: enemy.actionQueue,
        buffs: enemy.buffs,
        shield: enemy.shield,
        shieldColor: enemy.shieldColor
      } : null,
      battle: {
        day: currentDay,
        phase: currentPhaseIndex,
        isEnemyTurn: isEnemyTurnPending,
        battleOver: GameState.get('battleOver'),
        selectedGems: GameState.get('selectedGems')
      },
      gems: {
        hand: GameState.get('hand'),
        gemBag: GameState.get('gemBag'),
        discard: GameState.get('discard')
      }
    };
  }
  
  // Make sure we're on the battle screen
  if (GameState.get('currentScreen') !== 'battle') return;
  
  // Update player stats
  updatePlayerStats(data.player);
  
  // Update enemy stats
  updateEnemyStats(data.enemy);
  
  // Update phase indicator
  updatePhaseIndicator(data.battle.day, data.battle.phase);
  
  // Update turn indicator
  updateTurnIndicator(data.battle.isEnemyTurn);
  
  // Update gems display
  GemRenderer.updateGemDisplay(data.gems, data.battle.selectedGems);
  
  // Update action buttons
  updateActionButtons(data.battle);
}

/**
 * Update player stats in the UI
 * @param {Object} playerData - Player data
 */
function updatePlayerStats(playerData) {
  const elements = {
    playerClass: document.getElementById('player-class'),
    playerHealth: document.getElementById('player-health'),
    playerMaxHealth: document.getElementById('player-max-health'),
    playerBuffs: document.getElementById('player-buffs'),
    zenny: document.getElementById('zenny'),
    staminaFill: document.getElementById('stamina-fill'),
    staminaText: document.getElementById('stamina-text')
  };
  
  // Update text values
  if (elements.playerClass) elements.playerClass.textContent = playerData.class || 'None';
  if (elements.playerHealth) elements.playerHealth.textContent = playerData.health;
  if (elements.playerMaxHealth) elements.playerMaxHealth.textContent = playerData.maxHealth;
  if (elements.zenny) elements.zenny.textContent = playerData.zenny;
  
  // Update health bar
  const healthBar = document.getElementById('player-health-bar');
  if (healthBar) {
    const healthPercent = (playerData.health / playerData.maxHealth) * 100;
    healthBar.style.width = `${healthPercent}%`;
  }
  
  // Update stamina display
  updateStaminaDisplay(playerData.stamina, playerData.baseStamina);
  
  // Update buffs
  updateBuffsDisplay(playerData.buffs, 'player');
}

/**
 * Update stamina display
 * @param {Number} stamina - Current stamina
 * @param {Number} baseStamina - Maximum stamina
 */
function updateStaminaDisplay(stamina, baseStamina) {
  const staminaFill = document.getElementById('stamina-fill');
  const staminaText = document.getElementById('stamina-text');
  
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
 * Update enemy stats in the UI
 * @param {Object} enemyData - Enemy data
 */
function updateEnemyStats(enemyData) {
  const elements = {
    enemyName: document.getElementById('enemy-name'),
    enemyHealth: document.getElementById('enemy-health'),
    enemyMaxHealth: document.getElementById('enemy-max-health'),
    enemyAttack: document.getElementById('enemy-attack'),
    enemyCondition: document.getElementById('enemy-condition'),
    enemyBuffs: document.getElementById('enemy-buffs'),
    enemyActionQueue: document.getElementById('enemy-action-queue')
  };
  
  if (!enemyData) {
    // Hide or reset enemy UI if no enemy
    if (elements.enemyName) elements.enemyName.textContent = "None";
    if (elements.enemyHealth) elements.enemyHealth.textContent = "0";
    if (elements.enemyMaxHealth) elements.enemyMaxHealth.textContent = "0";
    return;
  }
  
  // Update text values
  if (elements.enemyName) elements.enemyName.textContent = enemyData.name || "None";
  if (elements.enemyHealth) elements.enemyHealth.textContent = Math.max(enemyData.health || 0, 0);
  if (elements.enemyMaxHealth) elements.enemyMaxHealth.textContent = enemyData.maxHealth || 0;
  
  // Extract attack value from current action
  if (elements.enemyAttack && enemyData.currentAction) {
    if (enemyData.currentAction.startsWith("Attack")) {
      const attackValue = enemyData.currentAction.split(" ")[1] || "0";
      elements.enemyAttack.textContent = attackValue;
    } else {
      elements.enemyAttack.textContent = "0";
    }
  }
  
  // Update shield condition
  if (elements.enemyCondition) {
    elements.enemyCondition.textContent = enemyData.shield 
      ? `Shielded: Use ${enemyData.shieldColor.charAt(0).toUpperCase() + enemyData.shieldColor.slice(1)} Gems to bypass` 
      : "";
  }
  
  // Update action queue
  if (elements.enemyActionQueue && enemyData.actionQueue) {
    elements.enemyActionQueue.textContent = `Next: ${enemyData.actionQueue.slice(0, 3).map(action => action.split(" ")[0]).join(", ")}`;
  }
  
  // Update health bar
  const healthBar = document.getElementById('enemy-health-bar');
  if (healthBar) {
    const healthPercent = (enemyData.health / enemyData.maxHealth) * 100;
    healthBar.style.width = `${healthPercent}%`;
  }
  
  // Update buffs
  updateBuffsDisplay(enemyData.buffs, 'enemy');
}

/**
 * Update buffs display for player or enemy
 * @param {Array} buffs - Active buffs
 * @param {String} target - 'player' or 'enemy'
 */
function updateBuffsDisplay(buffs, target) {
  const buffsContainer = document.getElementById(`${target}-buffs`);
  if (!buffsContainer) return;
  
  // Clear current buffs
  buffsContainer.innerHTML = "";
  
  // No buffs to show
  if (!buffs || !buffs.length) return;
  
  // Add each buff
  buffs.forEach(buff => {
    const buffIcon = createBuffIcon(buff, target === 'enemy');
    buffsContainer.appendChild(buffIcon);
  });
}

/**
 * Create a buff icon element
 * @param {Object} buff - Buff data
 * @param {Boolean} isEnemy - Whether this is an enemy buff
 * @returns {HTMLElement} Buff icon element
 */
function createBuffIcon(buff, isEnemy = false) {
  const icon = document.createElement("div");
  icon.className = `buff-icon ${buff.type}`;
  
  // Set appropriate icon based on buff type
  icon.innerHTML = getBuffIcon(buff.type);
  
  // Add turns indicator
  const turns = document.createElement("span");
  turns.className = "turns";
  turns.textContent = buff.turns;
  icon.appendChild(turns);
  
  // Add tooltip with description
  const description = getBuffDescription(buff, isEnemy);
  icon.setAttribute("data-tooltip", description);
  
  return icon;
}

/**
 * Get an icon for a buff
 * @param {String} buffType - Buff type
 * @returns {String} Icon character
 */
function getBuffIcon(buffType) {
  switch (buffType) {
    case "focused": return "✦";
    case "defense": return "🛡️";
    case "stunned": return "💫";
    case "poison": return "☠️";
    default: return "⚡";
  }
}

/**
 * Get a description for a buff
 * @param {Object} buff - Buff object
 * @param {Boolean} isEnemy - Whether this is an enemy buff
 * @returns {String} Buff description
 */
function getBuffDescription(buff, isEnemy) {
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
 * Update phase indicator in battle UI
 * @param {Number} day - Current day
 * @param {Number} phase - Current phase index
 */
function updatePhaseIndicator(day, phase) {
  const phaseIndicator = document.getElementById('day-phase-indicator');
  if (!phaseIndicator) return;
  
  // Get phase name
  const phaseNames = ["Dawn", "Dusk", "Dark"];
  const phaseName = phaseNames[phase] || "Unknown";
  
  // Set phase class on battle screen
  const battleScreen = document.getElementById('battle-screen');
  if (battleScreen) {
    battleScreen.className = 'screen active ' + phaseName.toLowerCase();
  }
  
  // Update day/phase indicator
  const phaseSymbols = ["☀️", "🌅", "🌙"];
  phaseIndicator.textContent = `Day ${day} ${phaseSymbols[phase]}`;
}

/**
 * Update turn indicator in battle UI
 * @param {Boolean} isEnemyTurn - Whether it's the enemy's turn
 */
function updateTurnIndicator(isEnemyTurn) {
  const turnIndicator = document.getElementById('turn-indicator');
  if (!turnIndicator) return;
  
  turnIndicator.textContent = isEnemyTurn ? "Enemy Turn" : "Your Turn";
  turnIndicator.classList.toggle("player", !isEnemyTurn);
  turnIndicator.classList.toggle("enemy", isEnemyTurn);
}

/**
 * Update action buttons state in battle UI
 * @param {Object} battleData - Battle state data
 */
function updateActionButtons(battleData) {
  const executeBtn = document.getElementById('execute-btn');
  const waitBtn = document.getElementById('wait-btn');
  const discardEndBtn = document.getElementById('discard-end-btn');
  const endTurnBtn = document.getElementById('end-turn-btn');
  const fleeBtn = document.getElementById('flee-btn');
  
  const player = GameState.get('player');
  const selectedGems = battleData.selectedGems;
  const hand = GameState.get('hand');
  const isStunned = player.buffs.some(b => b.type === "stunned");
  
  // Check if player can execute gems
  const canPlayGems = selectedGems.size > 0 && 
                  Array.from(selectedGems).every(i => hand[i]) &&
                  player.stamina >= Math.min(...Array.from(selectedGems).map(i => hand[i].cost));
  
  // Update button states
  if (executeBtn) executeBtn.disabled = battleData.battleOver || !canPlayGems || battleData.isEnemyTurn || isStunned;
  if (waitBtn) waitBtn.disabled = battleData.battleOver || battleData.isEnemyTurn || GameState.get('hasActedThisTurn') || GameState.get('hasPlayedGemThisTurn') || isStunned;
  if (discardEndBtn) discardEndBtn.disabled = battleData.battleOver || !selectedGems.size || battleData.isEnemyTurn || GameState.get('hasActedThisTurn') || isStunned;
  if (endTurnBtn) endTurnBtn.disabled = battleData.battleOver || battleData.isEnemyTurn || isStunned;
  
  // Show/hide flee button
  if (fleeBtn) {
    fleeBtn.style.display = (battleData.phase < 2 && !battleData.battleOver && !battleData.isEnemyTurn && !isStunned) ? "block" : "none";
  }
}

/**
 * Show a damage/healing animation
 * @param {String} target - 'player' or 'enemy'
 * @param {Number} amount - Amount of damage or healing (negative for healing)
 * @param {Boolean} isPoison - Whether it's poison damage
 */
export function showDamageAnimation(target, amount, isPoison = false) {
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
}

/**
 * Show victory effect animation
 */
export function showVictoryEffect() {
  const battleScreen = document.getElementById('battle-screen');
  if (!battleScreen) return;
  
  // Create victory text
  const victoryText = document.createElement('div');
  victoryText.className = 'victory-text';
  victoryText.textContent = 'VICTORY!';
  
  // Add to battle screen
  battleScreen.appendChild(victoryText);
  
  // Remove after transition
  setTimeout(() => {
    victoryText.remove();
  }, 1500);
}

/**
 * Show defeat effect animation
 */
export function showDefeatEffect() {
  const battleScreen = document.getElementById('battle-screen');
  if (!battleScreen) return;
  
  // Create defeat text
  const defeatText = document.createElement('div');
  defeatText.className = 'defeat-text';
  defeatText.textContent = 'DEFEAT';
  
  // Add to battle screen
  battleScreen.appendChild(defeatText);
  
  // Remove after transition
  setTimeout(() => {
    defeatText.remove();
  }, 1500);
}

/**
 * Update the shop UI
 */
export function updateShopUI() {
  const player = GameState.get('player');
  const inUpgradeMode = GameState.get('inUpgradeMode');
  
  // Update shop stats
  const shopHealth = document.getElementById('shop-health');
  const shopMaxHealth = document.getElementById('shop-max-health');
  const shopZenny = document.getElementById('shop-zenny');
  
  if (shopHealth) shopHealth.textContent = player.health;
  if (shopMaxHealth) shopMaxHealth.textContent = player.maxHealth;
  if (shopZenny) shopZenny.textContent = player.zenny;
  
  // Update gem bag info
  const shopGemBagCount = document.getElementById('shop-gem-bag-count');
  const shopGemBagTotal = document.getElementById('shop-gem-bag-total');
  
  if (shopGemBagCount) shopGemBagCount.textContent = GameState.get('gemBag').length;
  if (shopGemBagTotal) shopGemBagTotal.textContent = "20"; // MAX_GEM_BAG_SIZE
  
  // Handle different shop modes
  if (inUpgradeMode) {
    updateShopUpgradeMode();
  } else {
    updateShopNormalMode();
  }
  
  // Update healing button state
  const healBtn = document.getElementById('heal-10');
  if (healBtn) {
    healBtn.disabled = player.zenny < 3 || player.health >= player.maxHealth;
    healBtn.title = player.health >= player.maxHealth ? "Already at full health" : 
                     player.zenny < 3 ? "Not enough $ZENNY (need 3)" : 
                     "Heal 10 health";
  }
  
  // Render shop hand
  GemRenderer.renderShopHand();
}

/**
 * Update shop UI for upgrade mode
 */
function updateShopUpgradeMode() {
  const gemCatalog = GameState.get('gemCatalog');
  const hand = GameState.get('hand');
  const selectedGems = GameState.get('selectedGems');
  
  // Get UI elements
  const gemPool = document.getElementById('gem-pool');
  const gemPoolInstructions = document.getElementById('gem-pool-instructions');
  const cancelUpgrade = document.getElementById('cancel-upgrade');
  const upgradeGem = document.getElementById('upgrade-gem');
  const discardGem = document.getElementById('discard-gem');
  const buyRandomGem = document.getElementById('buy-random-gem');
  const swapGem = document.getElementById('swap-gem');
  
  // Show gem pool, hide other options
  if (gemPool) gemPool.style.display = 'flex';
  
  // Update instructions
  if (gemPoolInstructions && selectedGems.size === 1) {
    const selectedGem = hand[Array.from(selectedGems)[0]];
    gemPoolInstructions.textContent = `Choose an upgrade option for your ${selectedGem.color} ${selectedGem.name}:`;
    gemPoolInstructions.style.fontWeight = 'bold';
  }
  
  // Show cancel button, hide all other buttons
  if (cancelUpgrade) cancelUpgrade.style.display = 'block';
  if (upgradeGem) upgradeGem.style.display = 'none';
  if (discardGem) discardGem.style.display = 'none';
  if (buyRandomGem) buyRandomGem.style.display = 'none';
  if (swapGem) swapGem.style.display = 'none';
  
  // Render all upgrade options
  if (gemPool) {
    gemPool.innerHTML = '';
    
    if (gemCatalog && gemCatalog.gemPool && Array.isArray(gemCatalog.gemPool)) {
      gemCatalog.gemPool.forEach((gem, index) => {
        const gemElement = GemRenderer.createGemElement(gem, index, false);
        
        // Add click handler
        gemElement.addEventListener('click', () => {
          EventBus.emit('UPGRADE_OPTION_SELECTED', { poolIndex: index });
        });
        
        gemPool.appendChild(gemElement);
      });
    }
  }
}

/**
 * Update shop UI for normal mode
 */
function updateShopNormalMode() {
  const selectedGems = GameState.get('selectedGems');
  const hand = GameState.get('hand');
  
  // Get UI elements
  const gemPool = document.getElementById('gem-pool');
  const gemPoolInstructions = document.getElementById('gem-pool-instructions');
  const cancelUpgrade = document.getElementById('cancel-upgrade');
  const upgradeGem = document.getElementById('upgrade-gem');
  const discardGem = document.getElementById('discard-gem');
  const buyRandomGem = document.getElementById('buy-random-gem');
  const swapGem = document.getElementById('swap-gem');
  
  // Hide gem pool, show normal options
  if (gemPool) {
    gemPool.style.display = 'none';
  }
  
  // Show/hide appropriate buttons
  if (cancelUpgrade) cancelUpgrade.style.display = 'none';
  if (buyRandomGem) buyRandomGem.style.display = 'block';
  if (upgradeGem) upgradeGem.style.display = 'block';
  if (discardGem) discardGem.style.display = 'block';
  if (swapGem) swapGem.style.display = 'none';
  
  // Update instructions based on selection
  if (gemPoolInstructions) {
    if (selectedGems.size === 1) {
      const selectedGem = hand[Array.from(selectedGems)[0]];
      gemPoolInstructions.textContent = `Selected: ${selectedGem.color} ${selectedGem.name}`;
      gemPoolInstructions.style.fontWeight = 'normal';
    } else {
      gemPoolInstructions.textContent = 'Select a gem from your hand';
      gemPoolInstructions.style.fontWeight = 'normal';
    }
  }
  
  updateShopButtonStates();
}

/**
 * Update shop button states
 */
function updateShopButtonStates() {
  const player = GameState.get('player');
  const selectedGems = GameState.get('selectedGems');
  const hand = GameState.get('hand');
  const gemCatalog = GameState.get('gemCatalog');
  const inUpgradeMode = GameState.get('inUpgradeMode');
  
  // Skip if in upgrade mode
  if (inUpgradeMode) return;
  
  const hasSelection = selectedGems.size > 0;
  
  // Get UI elements
  const upgradeGem = document.getElementById('upgrade-gem');
  const discardGem = document.getElementById('discard-gem');
  const buyRandomGem = document.getElementById('buy-random-gem');
  
  // Update button states
  if (upgradeGem) upgradeGem.disabled = !hasSelection || player.zenny < 5;
  if (discardGem) discardGem.disabled = !hasSelection || player.zenny < 3;
  
  if (hasSelection) {
    // Additional checks for upgrade eligibility
    const selectedIndex = Array.from(selectedGems)[0];
    const selectedGem = hand[selectedIndex];
    const canUpgrade = selectedGem && 
                    !selectedGem.freshlySwapped && 
                    !gemCatalog.upgradedThisShop.has(selectedGem.id);
    
    if (upgradeGem) {
      upgradeGem.disabled = !canUpgrade || player.zenny < 5;
      upgradeGem.title = !canUpgrade ? "Cannot upgrade this gem now" :
                            player.zenny < 5 ? "Not enough $ZENNY (need 5)" :
                            "Upgrade selected gem (5 $ZENNY)";
    }
  }
  
  // Update buy random gem button
  if (buyRandomGem) {
    buyRandomGem.disabled = player.zenny < 3;
    buyRandomGem.title = player.zenny < 3 ? "Not enough $ZENNY" : "Buy random gem for Gem Bag";
  }
}

/**
 * Update the gem catalog UI
 */
export function updateGemCatalogUI() {
  const metaZenny = GameState.get('metaZenny');
  
  // Update meta zenny display
  const metaZennyDisplay = document.getElementById('meta-zenny-display');
  if (metaZennyDisplay) {
    metaZennyDisplay.textContent = metaZenny;
  }
  
  // Update unlocked gems
  GemRenderer.renderUnlockedGems();
  
  // Update available gems
  GemRenderer.renderAvailableGems();
}

/**
 * Update the camp screen
 */
export function updateCampUI() {
  const currentDay = GameState.get('currentDay');
  const player = GameState.get('player');
  const metaZenny = GameState.get('metaZenny');
  
  // Update day display
  const campDay = document.getElementById('camp-day');
  if (campDay) campDay.textContent = currentDay;
  
  // Update zenny displays
  const campZenny = document.getElementById('camp-zenny');
  const campMetaZenny = document.getElementById('camp-meta-zenny');
  
  if (campZenny) campZenny.textContent = player.zenny;
  if (campMetaZenny) campMetaZenny.textContent = metaZenny;
  
  // Clear input fields
  const withdrawAmount = document.getElementById('withdraw-amount');
  const depositAmount = document.getElementById('deposit-amount');
  
  if (withdrawAmount) withdrawAmount.value = "";
  if (depositAmount) depositAmount.value = "";
  
  // Disable buttons if no zenny available
  const withdrawBtn = document.getElementById('withdraw-btn');
  const depositBtn = document.getElementById('deposit-btn');
  
  if (withdrawBtn) withdrawBtn.disabled = player.zenny <= 0;
  if (depositBtn) depositBtn.disabled = metaZenny <= 0;
}

// Export BaseRenderer
export const BaseRenderer = {
  initialize,
  updateActiveScreen,
  showMessage,
  updateBattleUI,
  updateShopUI,
  updateGemCatalogUI,
  updateCampUI,
  showDamageAnimation,
  showVictoryEffect,
  showDefeatEffect
};