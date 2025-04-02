// Main entry point for Super Tiny World
import { GameState } from './core/state.js';
import { EventBus } from './core/events.js';
import { initCharacterSelect } from './systems/character.js';
import { initRenderer } from './ui/renderer.js';
import { 
    initBattle,
    drawGems,
    endPlayerTurn,
    updateEnemyDisplay,
    startEnemyTurn
} from './systems/battle.js';
import { initShop, updateShopDisplay } from './systems/shop.js';

// Initialize core systems
function init() {
    console.log('Initializing Super Tiny World...');
    
    // Initialize the UI renderer
    initRenderer();
    
    // Initialize character selection screen
    initCharacterSelect();
    
    // Debug: Log state changes
    GameState.subscribe((state) => {
      console.log('State updated:', state);
      
      // Update stamina and health displays when state changes
      if (state.currentScreen === 'battle') {
        updateBattleDisplay();
      }
    });
  
    // Set up event handlers
    setupEventHandlers();
    
    // Set initial screen
    GameState.setState('currentScreen', 'character-select');
    
    // Create any missing UI elements
    createMissingElements();
}

function setupEventHandlers() {
    // Screen transition handler
    EventBus.on('SCREEN_CHANGE', ({ screen }) => {
      handleScreenChange(screen);
    });

    // Turn management
    EventBus.on('TURN_END', ({ turn }) => {
      if (turn === 'enemy') {
        startEnemyTurn();
      } else {
        console.log('Player turn started');
        // Draw new gems when player turn starts
        drawGems(3);
      }
    });
    
    // Battle events
    EventBus.on('BATTLE_VICTORY', () => {
      console.log('Battle won!');
      // Transition to shop after victory
      setTimeout(() => {
        EventBus.emit('SCREEN_CHANGE', { screen: 'shop' });
      }, 2000);
    });
    
    EventBus.on('BATTLE_DEFEAT', () => {
      console.log('Battle lost!');
      // Return to character select after defeat
      setTimeout(() => {
        EventBus.emit('SCREEN_CHANGE', { screen: 'character-select' });
      }, 2000);
    });
}

function handleScreenChange(screen) {
    console.log(`Changing screen to: ${screen}`);
    
    // Update game state
    GameState.setState('currentScreen', screen);
    
    // Initialize screen-specific logic
    if (screen === 'battle') {
      initBattle();
    } else if (screen === 'shop') {
      initShop();
    } else if (screen === 'camp') {
      // Initialize camp when implemented
      console.log('Camp screen not yet implemented');
    }
}

function updateBattleDisplay() {
    // Update stamina display
    const staminaFill = document.getElementById('stamina-fill');
    const staminaText = document.getElementById('stamina-text');
    
    if (staminaFill && staminaText) {
        const player = GameState.data.player;
        if (player) {
            const percent = (player.stamina / player.baseStamina) * 100;
            staminaFill.style.width = `${percent}%`;
            staminaText.textContent = `${player.stamina}/${player.baseStamina}`;
            
            // Update color based on value
            staminaFill.className = '';
            if (percent >= 66) {
                staminaFill.classList.add('full');
            } else if (percent >= 33) {
                staminaFill.classList.add('medium');
            } else {
                staminaFill.classList.add('low');
            }
        }
    }
}

function createMissingElements() {
    // Create stamina bar if it doesn't exist
    if (!document.getElementById('stamina-bar')) {
        const playerStats = document.getElementById('player-stats');
        if (playerStats) {
            const staminaBar = document.createElement('div');
            staminaBar.className = 'stamina-bar';
            staminaBar.id = 'stamina-bar';
            staminaBar.innerHTML = `
                <div id="stamina-fill" class="full"></div>
                <div id="stamina-text">3/3</div>
            `;
            playerStats.appendChild(staminaBar);
        }
    }
    
    // Create player buffs container if it doesn't exist
    if (!document.getElementById('player-buffs')) {
        const playerStats = document.getElementById('player-stats');
        if (playerStats) {
            const buffsContainer = document.createElement('div');
            buffsContainer.id = 'player-buffs';
            playerStats.appendChild(buffsContainer);
        }
    }
}

// Start the game
init();