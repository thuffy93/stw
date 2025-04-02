import { GameState } from '../core/state.js';
import { GAME_PHASES } from '../core/config.js';
import { EventBus } from '../core/events.js';

export function initRenderer() {
  // Subscribe to all state changes
  const unsubscribe = GameState.subscribe((state) => {
    updateHealthDisplays(state);
    updateStaminaDisplay(state);
    updatePhaseBackground(state);
    updateBuffsDisplay(state);
  });
  
  // Listen for screen change events
  EventBus.on('SCREEN_CHANGE', ({ screen }) => {
    updateActiveScreen(screen);
  });
  
  // Initial render
  updateHealthDisplays(GameState.data);
  
  // Cleanup on game exit
  return unsubscribe;
}

function updateHealthDisplays(state) {
  // Update player health
  const playerHealth = state.player?.health || 0;
  const playerMaxHealth = state.player?.maxHealth || 1;
  const playerHealthPercent = (playerHealth / playerMaxHealth) * 100;
  
  const playerHealthBar = document.getElementById('player-health-bar');
  const playerHealthText = document.getElementById('player-health');
  const playerMaxHealthText = document.getElementById('player-max-health');
  
  if (playerHealthBar) {
    playerHealthBar.style.width = `${playerHealthPercent}%`;
  }
  
  if (playerHealthText) {
    playerHealthText.textContent = playerHealth;
  }
  
  if (playerMaxHealthText) {
    playerMaxHealthText.textContent = playerMaxHealth;
  }
  
  // Update enemy health
  const enemy = state.battle?.enemy;
  if (enemy) {
    const enemyHealthPercent = (enemy.health / enemy.maxHealth) * 100;
    const enemyHealthBar = document.getElementById('enemy-health-bar');
    const enemyHealthText = document.getElementById('enemy-health');
    const enemyMaxHealthText = document.getElementById('enemy-max-health');
    
    if (enemyHealthBar) {
      enemyHealthBar.style.width = `${enemyHealthPercent}%`;
    }
    
    if (enemyHealthText) {
      enemyHealthText.textContent = enemy.health;
    }
    
    if (enemyMaxHealthText) {
      enemyMaxHealthText.textContent = enemy.maxHealth;
    }
  }
}

function updateStaminaDisplay(state) {
  const staminaFill = document.getElementById('stamina-fill');
  const staminaText = document.getElementById('stamina-text');
  
  if (!staminaFill || !staminaText) return;
  
  const currentStamina = state.player?.stamina || 0;
  const maxStamina = state.player?.baseStamina || 3;
  const staminaPercent = (currentStamina / maxStamina) * 100;
  
  staminaFill.style.width = `${staminaPercent}%`;
  staminaText.textContent = `${currentStamina}/${maxStamina}`;
  
  // Update stamina color based on amount
  staminaFill.className = '';
  if (currentStamina >= maxStamina) {
    staminaFill.classList.add('full');
  } else if (currentStamina >= maxStamina / 2) {
    staminaFill.classList.add('medium');
  } else {
    staminaFill.classList.add('low');
  }
}

function updatePhaseBackground(state) {
  const battleScreen = document.getElementById('battle-screen');
  if (!battleScreen) return;
  
  const phase = state.battle?.phase;
  if (!phase) return;
  
  // Remove existing phase classes
  battleScreen.classList.remove('dawn', 'dusk', 'dark');
  
  // Add new phase class
  battleScreen.classList.add(phase.toLowerCase());
  
  // Update phase indicator if it exists
  const phaseIndicator = document.getElementById('day-phase-indicator');
  if (phaseIndicator) {
    phaseIndicator.textContent = phase;
  }
}

function updateBuffsDisplay(state) {
  const playerBuffs = state.player?.buffs;
  if (!playerBuffs) return;
  
  const buffContainer = document.getElementById('player-buffs');
  if (!buffContainer) return;
  
  // Clear existing buffs
  buffContainer.innerHTML = '';
  
  // Add shield buff if active
  if (playerBuffs.shield > 0 && playerBuffs.shieldTurns > 0) {
    const shieldIcon = document.createElement('div');
    shieldIcon.className = 'buff-icon shield';
    shieldIcon.textContent = '🛡️';
    shieldIcon.dataset.tooltip = `Shield: ${playerBuffs.shield} (${playerBuffs.shieldTurns} turns)`;
    buffContainer.appendChild(shieldIcon);
  }
  
  // Add other buffs here as needed
}

function updateActiveScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.toggle('active', screen.id === `${screenId}-screen`);
  });
  
  // Update game state with current screen
  GameState.setState('currentScreen', screenId);
}