/**
 * Show a notification message
 * @param {String} message - Message to display
 * @param {String} type - Message type ('success' or 'error')
 * @param {Number} duration - Time to display message in ms
 */
function showMessage(message, type = 'success', duration = 2000) {
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
function updateBattleUI(data) {
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
  updateGemDisplay(data.gems, data.battle.selectedGems);
  
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
* Update gem display in the UI
* @param {Object} gems - Gem collections data
* @param {Set} selectedGems - Set of selected gem indices
*/
function updateGemDisplay(gems, selectedGems) {
  // Update gem bag info
  const gemBagCount = document.getElementById('gem-bag-count');
  const gemBagTotal = document.getElementById('gem-bag-total');
  const gemBagCount2 = document.getElementById('gem-bag-count2');
  const gemBagTotal2 = document.getElementById('gem-bag-total2');
  
  if (gemBagCount) gemBagCount.textContent = gems.gemBag.length;
  if (gemBagTotal) gemBagTotal.textContent = "20"; // MAX_GEM_BAG_SIZE
  if (gemBagCount2) gemBagCount2.textContent = gems.gemBag.length;
  if (gemBagTotal2) gemBagTotal2.textContent = "20"; // MAX_GEM_BAG_SIZE
  
  // Render hand
  renderHand(gems.hand, selectedGems);
}

/**
* Render the hand of gems
* @param {Array} hand - Hand of gems (optional, will be fetched if not provided)
* @param {Set} selectedGems - Set of selected gem indices (optional)
*/
function renderHand(hand, selectedGems) {
  // Get data if not provided
  if (!hand) hand = GameState.get('hand');
  if (!selectedGems) selectedGems = GameState.get('selectedGems');
  
  const handContainer = document.getElementById('hand');
  if (!handContainer) return;
  
  // Clear current hand
  handContainer.innerHTML = '';
  
  // Add each gem
  hand.forEach((gem, index) => {
      const isSelected = selectedGems.has(index);
      const gemElement = createGemElement(gem, index, isSelected);
      handContainer.appendChild(gemElement);
  });
}

/**
* Create a gem element for the UI
* @param {Object} gem - Gem data
* @param {Number} index - Index in hand
* @param {Boolean} isSelected - Whether the gem is selected
* @returns {HTMLElement} Gem element
*/
function createGemElement(gem, index, isSelected = false) {
  const gemElement = document.createElement("div");
  gemElement.className = `gem ${gem.color}`;
  
  // Check for class bonus
  const playerClass = GameState.get('player.class');
  const hasBonus = (playerClass === "Knight" && gem.color === "red") ||
                 (playerClass === "Mage" && gem.color === "blue") ||
                 (playerClass === "Rogue" && gem.color === "green");
  
  if (hasBonus) {
      gemElement.classList.add("class-bonus");
  }
  
  // Check for proficiency
  const gemKey = `${gem.color}${gem.name}`;
  // This would normally call Gems.getGemProficiency, but for simplicity we'll use a default proficiency
  const isUnlearned = false; // Simplified
  
  if (isUnlearned) {
      gemElement.classList.add("unlearned");
  }
  
  // Add selected class if selected
  if (isSelected) {
      gemElement.classList.add("selected");
  }
  
  // Create content structure
  const gemContent = document.createElement("div");
  gemContent.className = "gem-content";
  
  // Add icon
  const gemIcon = document.createElement("div");
  gemIcon.className = "gem-icon";
  gemIcon.textContent = getGemSymbol(gem);
  gemContent.appendChild(gemIcon);
  
  // Add value
  if (gem.damage || gem.heal || gem.poison) {
      const gemValue = document.createElement("div");
      gemValue.className = "gem-value";
      gemValue.textContent = gem.damage || gem.heal || gem.poison || "";
      gemContent.appendChild(gemValue);
  }
  
  // Add hidden name
  const gemName = document.createElement("div");
  gemName.className = "gem-name";
  gemName.textContent = gem.name;
  gemContent.appendChild(gemName);
  
  gemElement.appendChild(gemContent);
  
  // Add cost
  const gemCost = document.createElement("div");
  gemCost.className = "gem-cost";
  gemCost.textContent = gem.cost;
  gemElement.appendChild(gemCost);
  
  // Add tooltip
  gemElement.setAttribute("data-tooltip", buildGemTooltip(gem, hasBonus));
  
  // Add click handler
  gemElement.addEventListener("click", () => {
      // Emit gem selection event
      EventBus.emit('GEM_SELECT', { index });
  });
  
  return gemElement;
}

/**
* Get a symbol for a gem
* @param {Object} gem - Gem data
* @returns {String} Symbol
*/
function getGemSymbol(gem) {
  // This is a simplified version - normally would use Gems.getGemSymbol
  if (gem.shield) return "🛡️";
  if (gem.poison) return "☠️";
  if (gem.damage) {
      if (gem.name.includes("Strong")) return "⚔️";
      if (gem.name.includes("Quick")) return "⚡";
      if (gem.name.includes("Burst")) return "💥";
      return "🗡️";
  }
  if (gem.heal) {
      if (gem.name.includes("Strong")) return "❤️";
      return "💚";
  }
  return "✨";
}

/**
* Build tooltip text for a gem
* @param {Object} gem - Gem data
* @param {Boolean} hasBonus - Whether the gem has a class bonus
* @returns {String} Tooltip text
*/
function buildGemTooltip(gem, hasBonus) {
  // This is a simplified version - normally would use Gems.buildGemTooltip
  let tooltip = '';
  
  if (gem.damage) {
      tooltip += `DMG: ${gem.damage}`;
      if (hasBonus) tooltip += ' (+50%)';
  }
  
  if (gem.heal) {
      if (tooltip) tooltip += ' | ';
      tooltip += `HEAL: ${gem.heal}`;
      if (hasBonus) tooltip += ' (+50%)';
  }
  
  if (gem.shield) {
      if (tooltip) tooltip += ' | ';
      tooltip += 'SHIELD';
  }
  
  if (gem.poison) {
      if (tooltip) tooltip += ' | ';
      tooltip += `PSN: ${gem.poison}`;
      if (hasBonus) tooltip += ' (+50%)';
  }
  
  tooltip += ` | (${gem.cost}⚡)`;
  
  return tooltip;
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
* Update gem selection in the UI
* @param {Array} selectedIndices - Array of selected gem indices
*/
function updateGemSelection(selectedIndices) {
  const hand = document.querySelectorAll('#hand .gem');
  
  // Reset all selections
  hand.forEach((gemEl, index) => {
      gemEl.classList.remove('selected');
  });
  
  // Apply new selections
  selectedIndices.forEach(index => {
      if (index >= 0 && index < hand.length) {
          hand[index].classList.add('selected');
      }
  });
}

/**
* Show a damage/healing animation
* @param {String} target - 'player' or 'enemy'
* @param {Number} amount - Amount of damage or healing (negative for healing)
* @param {Boolean} isPoison - Whether it's poison damage
*/
function showDamageAnimation(target, amount, isPoison = false) {
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
function showVictoryEffect() {
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
function showDefeatEffect() {
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
function updateShopUI() {
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
  renderShopHand();
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
      gemCatalog.gemPool.forEach((gem, index) => {
          const gemElement = createGemElement(gem, index, false);
          gemElement.addEventListener('click', () => {
              EventBus.emit('UPGRADE_OPTION_SELECTED', { poolIndex: index });
          });
          gemPool.appendChilimport { GameState } from '../core/state.js';
import { EventBus } from '../core/events.js';

/**
* Initialize the UI renderer
*/
export function initRenderer() {
  console.log("Initializing UI Renderer");
  
  // Register event listeners for UI updates
  setupEventListeners();
  
  // Initial UI setup
  updateActiveScreen(GameState.get('currentScreen') || 'characterSelect');
  
  return true;
}

/**
* Set up event listeners for UI updates
*/
function setupEventListeners() {
  // Screen changes
  EventBus.on('SCREEN_CHANGE', ({ screen }) => {
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
      renderHand();
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
  EventBus.on('GEM_SELECTION_CHANGED', ({ index, selected, selectedIndices }) => {
      updateGemSelection(selectedIndices);
  });
}

/**
* Update active screen in the UI
* @param {String} screenName - Screen to display
*/
function updateActiveScreen(screenName) {
  console.log(`Switching to screen: ${screenName}`);
  
  // Update state
  GameState.set('currentScreen', screenName);
  
  // Hide all screens
  document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
  });
  
  // Show the target screen
  const targetScreen = document.getElementById(`${screenName}-screen`);
  if (targetScreen) {
      targetScreen.classList.add('active');
      
      // Update screen-specific UI
      switch (screenName) {
          case 'characterSelect':
              updateCharacterSelectUI();
              break;
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
  } else {
      console.error(`Target screen "${screenName}" not found`);
  }
}