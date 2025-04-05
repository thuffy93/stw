// STW/js/ui/components/screens/BattleScreen.js
import { Component } from '../Component.js';
import { HandComponent } from '../battle/HandComponent.js';
import { PlayerStatsComponent } from '../battle/PlayerStatsComponent.js';
import { EnemyComponent } from '../battle/EnemyComponent.js';
import { BattleControlsComponent } from '../battle/BattleControlsComponent.js';
import { EventBus } from '../../../core/eventbus.js';
import { GameState } from '../../../core/state.js';

/**
 * Battle screen component
 */
export class BattleScreen extends Component {
  constructor() {
    super('battle-screen', `
      <div id="battle-screen" class="screen">
        <div id="battle-container">
          <!-- Day/Phase indicator -->
          <div id="day-phase-indicator"></div>
          <div id="turn-indicator-container"></div>
          
          <!-- Enemy section container -->
          <div id="enemy-section-container"></div>
          
          <!-- Battle effects container -->
          <div id="battle-effects"></div>
          
          <!-- Hand container -->
          <div id="hand-container"></div>
          
          <!-- Player section container -->
          <div id="player-stats-container"></div>
          
          <!-- Battle controls container -->
          <div id="battle-controls-container"></div>
          
          <!-- Gem bag info -->
          <div id="gem-bag-container">
            Gem Bag: <span id="gem-bag-count">0</span>/<span id="gem-bag-total">20</span>
          </div>
        </div>
      </div>
    `);
    
    // Create child components
    this.handComponent = new HandComponent({ context: 'battle' });
    this.playerStatsComponent = new PlayerStatsComponent();
    this.enemyComponent = new EnemyComponent();
    this.battleControlsComponent = new BattleControlsComponent();
    
    // Add child components
    this.addChild(this.handComponent)
        .addChild(this.playerStatsComponent)
        .addChild(this.enemyComponent)
        .addChild(this.battleControlsComponent);
    
    // Subscribe to events
    this.subscribeToEvent('BATTLE_UI_UPDATE', this.update);
    this.subscribeToEvent('SHOW_DAMAGE', this.showDamageAnimation);
    this.subscribeToEvent('SHOW_VICTORY', this.showVictoryEffect);
    this.subscribeToEvent('SHOW_DEFEAT', this.showDefeatEffect);
    this.subscribeToEvent('BATTLE_INITIALIZED', this.updatePhaseDisplay);
  }
  
  /**
   * Update phase display and background
   * @param {Object} data - Battle initialization data
   */
  updatePhaseDisplay(data) {
    const currentDay = GameState.get('currentDay') || 1;
    const currentPhaseIndex = GameState.get('currentPhaseIndex') || 0;
    
    // Update day-phase indicator
    const phaseIndicator = this.element.querySelector('#day-phase-indicator');
    if (phaseIndicator) {
      const phaseNames = ["Dawn", "Dusk", "Dark"];
      const phaseSymbols = ["☀️", "🌅", "🌙"];
      phaseIndicator.textContent = `Day ${currentDay} ${phaseSymbols[currentPhaseIndex]}`;
    }
    
    // Update turn indicator
    const turnIndicatorContainer = this.element.querySelector('#turn-indicator-container');
    if (turnIndicatorContainer) {
      turnIndicatorContainer.innerHTML = '';
      
      const turnIndicator = document.createElement('div');
      turnIndicator.id = 'turn-indicator';
      turnIndicator.className = 'player';
      turnIndicator.textContent = 'Your Turn';
      
      turnIndicatorContainer.appendChild(turnIndicator);
    }
    
    // Update screen background based on phase
    const phaseNames = ["dawn", "dusk", "dark"];
    const phaseName = phaseNames[currentPhaseIndex] || "dawn";
    
    // Remove any existing phase classes
    this.element.classList.remove('dawn', 'dusk', 'dark');
    
    // Add current phase class
    this.element.classList.add(phaseName);
  }
  
  /**
   * Show damage/healing animation
   * @param {Object} data - Animation data
   */
  showDamageAnimation(data) {
    const { target, amount, isPoison = false } = data;
    const battleEffects = this.element.querySelector('#battle-effects');
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
   * Show victory effect
   */
  showVictoryEffect() {
    // Create victory text
    const victoryText = document.createElement('div');
    victoryText.className = 'victory-text';
    victoryText.textContent = 'VICTORY!';
    
    // Add to battle screen
    this.element.appendChild(victoryText);
    
    // Play victory sound
    EventBus.emit('PLAY_SOUND', { sound: 'VICTORY' });
    
    // Remove after transition
    setTimeout(() => {
      victoryText.remove();
    }, 1500);
  }
  
  /**
   * Show defeat effect
   */
  showDefeatEffect() {
    // Create defeat text
    const defeatText = document.createElement('div');
    defeatText.className = 'defeat-text';
    defeatText.textContent = 'DEFEAT';
    
    // Add to battle screen
    this.element.appendChild(defeatText);
    
    // Play defeat sound
    EventBus.emit('PLAY_SOUND', { sound: 'DEFEAT' });
    
    // Remove after transition
    setTimeout(() => {
      defeatText.remove();
    }, 1500);
  }
  
  /**
   * Update gem bag info
   * @param {Array} gemBag - Current gem bag
   */
  updateGemBagInfo(gemBag) {
    const gemBagCount = this.element.querySelector('#gem-bag-count');
    const gemBagTotal = this.element.querySelector('#gem-bag-total');
    
    if (gemBagCount) gemBagCount.textContent = gemBag.length;
    if (gemBagTotal) gemBagTotal.textContent = "20"; // MAX_GEM_BAG_SIZE
  }
  
  /**
   * Override render to set phase styling
   */
  render() {
    const element = super.render();
    
    // Set up initial phase display
    this.updatePhaseDisplay();
    
    return element;
  }
  
  /**
   * Update component with new data
   * @param {Object} data - Update data
   */
  update(data) {
    // Update gem bag info if provided
    if (data.gems && data.gems.gemBag) {
      this.updateGemBagInfo(data.gems.gemBag);
    }
    
    // Update phase display if battle data provided
    if (data.battle) {
      if (data.battle.day !== undefined && data.battle.phase !== undefined) {
        this.updatePhaseDisplay();
      }
    }
  }
}

export default BattleScreen;