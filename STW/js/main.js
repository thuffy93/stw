import { GameState } from './core/state.js';
import { EventBus } from './core/events.js';
import { initCharacterSelect } from './systems/character.js';
import { 
    drawGems,
    endPlayerTurn,
    discardAndEndTurn,
    executeSelectedGems,
    toggleGemSelection,
    generateEnemy,
    startBattle,
    renderHand,
    waitTurn,
    fleeBattle,
    updateEnemyDisplay,
} from './systems/battle.js';

// Initialize core systems
function init() {
    initCharacterSelect();
    
    // Use the original subscribe method (still supported)
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
    
    // Update the state using new API
    GameState.set('currentScreen', screen);
    
    if (screen === 'battle') {
      console.log("Battle screen elements:", {
        endTurnBtn: document.getElementById('end-turn-btn'),
        enemyName: document.getElementById('enemy-name'),
        hand: document.getElementById('hand')
      });
      startBattle();
    }
}

// Start the game
init();