import { GameState } from '../core/state.js';

export function initRenderer() {
  console.log("Initializing renderer...");
  
  // Create stamina bar if it doesn't exist
  createStaminaBar();
  
  // Create turn indicator if it doesn't exist
  createTurnIndicator();
  
  // Create day/phase indicator if it doesn't exist
  createDayPhaseIndicator();
  
  // Subscribe to state changes for UI updates
  const unsubscribe = GameState.subscribe((state) => {
    // Update active screen
    updateActiveScreen(state.currentScreen);
    
    // Update battle-specific UI if on battle screen
    if (state.currentScreen === 'battle') {
      updateBattleUI(state);
    }
  });

  // Initial UI update
  updateActiveScreen(GameState.data.currentScreen);
  
  // Return unsubscribe function for cleanup
  return unsubscribe;
}

function updateActiveScreen(screenName) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.toggle('active', screen.id === `${screenName}-screen`);
  });
}

function updateBattleUI(state) {
  // Update health bars
  GameState.updateHealthBar('player');
  GameState.updateHealthBar('enemy');
  
  // Update stamina bar
  GameState.updateStaminaBar();
  
  // Update turn indicator
  updateTurnIndicator(state.battle.turn);
  
  // Update day/phase indicator
  updateDayPhaseIndicator(state.battle.day, state.battle.phase);
}

function createStaminaBar() {
  // Only create if it doesn't exist
  if (!document.getElementById('stamina-bar')) {
    const playerStats = document.getElementById('player-stats');
    if (!playerStats) return;
    
    const staminaBar = document.createElement('div');
    staminaBar.className = 'stamina-bar';
    staminaBar.id = 'stamina-bar';
    staminaBar.innerHTML = `
      <div id="stamina-fill" class="full"></div>
      <div id="stamina-text">3/3</div>
    `;
    
    playerStats.appendChild(staminaBar);
  }
  
  // Initial update
  GameState.updateStaminaBar();
}

function createTurnIndicator() {
  if (!document.getElementById('turn-indicator')) {
    const battleScreen = document.getElementById('battle-screen');
    if (!battleScreen) return;
    
    const turnIndicator = document.createElement('div');
    turnIndicator.id = 'turn-indicator';
    turnIndicator.className = 'player';
    turnIndicator.textContent = 'Your Turn';
    
    battleScreen.appendChild(turnIndicator);
  }
}

function createDayPhaseIndicator() {
  if (!document.getElementById('day-phase-indicator')) {
    const battleScreen = document.getElementById('battle-screen');
    if (!battleScreen) return;
    
    const dayPhaseIndicator = document.createElement('div');
    dayPhaseIndicator.id = 'day-phase-indicator';
    dayPhaseIndicator.textContent = 'Day 1: Dawn';
    
    battleScreen.appendChild(dayPhaseIndicator);
  }
}

function updateTurnIndicator(turn) {
  const indicator = document.getElementById('turn-indicator');
  if (indicator) {
    indicator.className = turn;
    indicator.textContent = turn === 'player' ? 'Your Turn' : 'Enemy Turn';
  }
}

function updateDayPhaseIndicator(day, phase) {
  const indicator = document.getElementById('day-phase-indicator');
  if (indicator) {
    indicator.textContent = `Day ${day}: ${phase}`;
    
    // Update battle screen background based on phase
    const battleScreen = document.getElementById('battle-screen');
    if (battleScreen) {
      battleScreen.className = 'screen'; // Reset classes
      battleScreen.classList.add('active');
      battleScreen.classList.add(phase.toLowerCase());
    }
  }
}