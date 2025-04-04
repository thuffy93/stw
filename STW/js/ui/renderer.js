// Import Config explicitly since it's used in the module
import { GameState } from '../core/state.js';
import { EventBus } from '../core/eventbus.js';
import { Utils } from '../core/utils.js';
import { Config } from '../core/config.js';  // Added Config import

/**
 * Initialize the UI renderer
 */
export function initialize() {
  console.log("Initializing UI Renderer");
  
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
  EventBus.on('GEM_SELECTION_CHANGED', ({ selectedIndices }) => {
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
 * Update the character select UI
 */
function updateCharacterSelectUI() {
  // Simple character select UI doesn't need much updating
  console.log("Character select screen active");
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

// Rest of the file continues...

/**
 * Update phase indicator in battle UI
 * @param {Number} day - Current day
 * @param {Number} phase - Current phase index
 */
function updatePhaseIndicator(day, phase) {
  const phaseIndicator = document.getElementById('day-phase-indicator');
  if (!phaseIndicator) return;
  
  // Get phase name - using Config properly here
  const phaseNames = Config.PHASES || ["Dawn", "Dusk", "Dark"];  // Add fallback
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

// Export all functions so they can be used by other modules
export default {
  initialize,
  showMessage,
  updateBattleUI,
  updateShopUI,
  updateGemCatalogUI,
  updateCampUI,
  renderHand,
  renderShopHand,
  showDamageAnimation,
  showVictoryEffect,
  showDefeatEffect
};