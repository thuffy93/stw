import { GameState } from './core/state.js';
import { EventBus } from './core/events.js';
import { initCharacterSelect } from './systems/character.js';
import { 
    initBattle,
    drawGems,
    endPlayerTurn,
    updateEnemyDisplay,
} from './systems/battle.js';

// Initialize core systems
function init() {
    initCharacterSelect();
    
    GameState.subscribe((state) => {
      console.log('State updated:', state);
    });
  
    EventBus.on('SCREEN_CHANGE', ({ screen }) => {
      handleScreenChange(screen);
    });

    EventBus.on('TURN_END', ({ turn }) => {
      if (turn === 'enemy') {
        window.startEnemyTurn();
      } else {
        console.log('Player turn started');
      }
    });
}

function handleScreenChange(screen) {
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active');
    });
    
    const activeScreen = document.getElementById(`${screen}-screen`);
    if (!activeScreen) {
      console.error(`Screen ${screen} not found!`);
      return;
    }
  
    activeScreen.classList.add('active');
    
    if (screen === 'battle') {
      console.log("Battle screen elements:", {
        endTurnBtn: document.getElementById('end-turn-btn'),
        enemyName: document.getElementById('enemy-name'),
        hand: document.getElementById('hand')
      });
      initBattle();
    }
}

// Start the game
init();