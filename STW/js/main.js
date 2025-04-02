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
    EventBus.on('GEM_SELECTED', ({ index }) => {
        toggleGemSelection(index);
    });
      
    // Listen for action commands
    EventBus.on('EXECUTE_GEMS', () => {
        executeSelectedGems();
    });
      
    EventBus.on('WAIT_TURN', () => {
        waitTurn();
    });
      
    EventBus.on('DISCARD_END', () => {
        discardAndEndTurn();
    });
      
    EventBus.on('END_TURN', () => {
        endTurn();
    });
      
    EventBus.on('FLEE_BATTLE', () => {
        fleeBattle();
    });
      
    // Listen for battle initialization
    EventBus.on('BATTLE_START', (data) => {
        startBattle(data);
    });
      
    console.log("Battle system initialized with event listeners");
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