// ui/components/screens/BattleScreen.js
import { Component } from '../Component.js';
import { HandComponent } from '../battle/HandComponent.js';
import { EnemyComponent } from '../battle/EnemyComponent.js';
import { PlayerStatsComponent } from '../battle/PlayerStatsComponent.js';
import { BattleControlsComponent } from '../battle/BattleControlsComponent.js';
import { PhaseIndicatorComponent } from '../battle/PhaseIndicatorComponent.js';
import { EventBus } from '../../../core/eventbus.js';
import { GameState } from '../../../core/state.js';

export class BattleScreen extends Component {
  constructor() {
    super('battle-screen', `
      <div id="battle-screen" class="screen">
        <div id="battle-container">
          <div id="phase-indicator-container"></div>
          <div id="turn-indicator-container"></div>
          
          <div id="enemy-section">
            <div id="enemy-container"></div>
          </div>
          
          <div id="battle-effects"></div>
          
          <div id="hand-container"></div>
          
          <div id="player-section">
            <div id="player-stats-container"></div>
          </div>
          
          <div id="controls-container"></div>
          
          <div id="gem-bag-container">
            Gem Bag: <span id="gem-bag-count">0</span>/<span id="gem-bag-total">20</span>
          </div>
        </div>
      </div>
    `);
    
    // Create child components
    this.phaseIndicator = new PhaseIndicatorComponent();
    this.turnIndicator = new TurnIndicatorComponent();
    this.enemy = new EnemyComponent();
    this.hand = new HandComponent();
    this.playerStats = new PlayerStatsComponent();
    this.controls = new BattleControlsComponent();
    
    // Add child components
    this.addChild(this.phaseIndicator)
        .addChild(this.turnIndicator)
        .addChild(this.enemy)
        .addChild(this.hand)
        .addChild(this.playerStats)
        .addChild(this.controls);
    
    // Listen for battle updates
    EventBus.on('BATTLE_UI_UPDATE', (data) => this.update(data));
    EventBus.on('SHOW_DAMAGE', (data) => this.showDamageAnimation(data));
    EventBus.on('SHOW_VICTORY', () => this.showVictoryEffect());
    EventBus.on('SHOW_DEFEAT', () => this.showDefeatEffect());
  }
  
  // Override the render method to add phase styling
  render() {
    const element = super.render();
    
    // Apply current phase styling
    const currentPhaseIndex = GameState.get('currentPhaseIndex');
    const phaseNames = ["dawn", "dusk", "dark"];
    const phaseName = phaseNames[currentPhaseIndex] || "dawn";
    
    element.classList.add(phaseName);
    
    return element;
  }
  
  update(data) {
    // Update the enemy component with enemy data
    if (data.enemy) {
      this.enemy.update(data.enemy);
    }
    
    // Update player stats component
    if (data.player) {
      this.playerStats.update(data.player);
    }
    
    // Update battle state components
    if (data.battle) {
      // Update phase indicator
      this.phaseIndicator.update({
        day: data.battle.day,
        phase: data.battle.phase
      });
      
      // Update turn indicator
      this.turnIndicator.update({
        isEnemyTurn: data.battle.isEnemyTurn
      });
      
      // Update battle controls
      this.controls.update({
        battleOver: data.battle.battleOver,
        isEnemyTurn: data.battle.isEnemyTurn,
        canPlayGems: this.canPlayGems(data)
      });
      
      // Update screen phase styling
      const phaseNames = ["dawn", "dusk", "dark"];
      const phaseName = phaseNames[data.battle.phase] || "dawn";
      
      this.element.className = `screen active ${phaseName}`;
    }
    
    // Update gem bag display
    if (data.gems) {
      const gemBagCount = this.element.querySelector('#gem-bag-count');
      const gemBagTotal = this.element.querySelector('#gem-bag-total');
      
      if (gemBagCount) gemBagCount.textContent = data.gems.gemBag.length;
      if (gemBagTotal) gemBagTotal.textContent = "20"; // MAX_GEM_BAG_SIZE
    }
  }
  
  canPlayGems(data) {
    const player = data.player;
    const selectedGems = data.battle.selectedGems;
    const hand = data.gems.hand;
    
    // Check if player can play selected gems
    return selectedGems.size > 0 && 
           Array.from(selectedGems).every(i => hand[i]) &&
           player.stamina >= Math.min(...Array.from(selectedGems).map(i => hand[i].cost));
  }
  
  showDamageAnimation({ target, amount, isPoison = false }) {
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
  
  showVictoryEffect() {
    // Create victory text
    const victoryText = document.createElement('div');
    victoryText.className = 'victory-text';
    victoryText.textContent = 'VICTORY!';
    
    // Add to battle screen
    this.element.appendChild(victoryText);
    
    // Remove after transition
    setTimeout(() => {
      victoryText.remove();
    }, 1500);
  }
  
  showDefeatEffect() {
    // Create defeat text
    const defeatText = document.createElement('div');
    defeatText.className = 'defeat-text';
    defeatText.textContent = 'DEFEAT';
    
    // Add to battle screen
    this.element.appendChild(defeatText);
    
    // Remove after transition
    setTimeout(() => {
      defeatText.remove();
    }, 1500);
  }
}

// Individual subcomponents for the battle screen

class TurnIndicatorComponent extends Component {
  constructor() {
    super('turn-indicator', `
      <div id="turn-indicator" class="player">Your Turn</div>
    `);
  }
  
  update({ isEnemyTurn }) {
    this.element.textContent = isEnemyTurn ? "Enemy Turn" : "Your Turn";
    this.element.classList.toggle("player", !isEnemyTurn);
    this.element.classList.toggle("enemy", isEnemyTurn);
  }
}