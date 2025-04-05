// STW/js/ui/components/battle/BattleControlsComponent.js
import { Component } from '../Component.js';
import { ButtonComponent } from '../common/ButtonComponent.js';
import { EventBus } from '../../../core/eventbus.js';
import { GameState } from '../../../core/state.js';

/**
 * Battle controls component
 * Handles player actions and turn management in battle
 */
export class BattleControlsComponent extends Component {
  /**
   * Create a new battle controls component
   */
  constructor() {
    super('battle-controls', `
      <div id="battle-controls">
        <div id="action-buttons">
          <div id="execute-btn-container"></div>
          <div id="wait-btn-container"></div>
          <div id="discard-end-btn-container"></div>
          <div id="end-turn-btn-container"></div>
        </div>
        <div id="flee-btn-container"></div>
      </div>
    `);
    
    // Create action buttons
    this.executeButton = new ButtonComponent('execute-btn', 'Execute Gems', {
      className: 'btn-execute',
      eventName: 'EXECUTE_GEMS',
      disabled: true
    });
    
    this.waitButton = new ButtonComponent('wait-btn', 'Wait (Focus)', {
      className: 'btn-primary',
      eventName: 'WAIT_TURN'
    });
    
    this.discardEndButton = new ButtonComponent('discard-end-btn', 'Discard & End', {
      className: 'btn-secondary',
      eventName: 'DISCARD_AND_END',
      disabled: true
    });
    
    this.endTurnButton = new ButtonComponent('end-turn-btn', 'End Turn', {
      className: 'btn-end-turn',
      eventName: 'END_TURN'
    });
    
    this.fleeButton = new ButtonComponent('flee-btn', 'Flee', {
      className: 'btn-flee',
      eventName: 'FLEE_BATTLE'
    });
    
    // Add child components
    this.addChild(this.executeButton)
        .addChild(this.waitButton)
        .addChild(this.discardEndButton)
        .addChild(this.endTurnButton)
        .addChild(this.fleeButton);
    
    // Subscribe to events for updating controls
    this.subscribeToEvent('GEM_SELECTION_CHANGED', this.updateButtonStates);
    this.subscribeToEvent('BATTLE_STATE_UPDATE', this.updateButtonStates);
  }
  
  /**
   * Update button states based on current game state
   */
  updateButtonStates() {
    const player = GameState.get('player');
    const selectedGems = GameState.get('selectedGems') || new Set();
    const hand = GameState.get('hand') || [];
    const isEnemyTurnPending = GameState.get('isEnemyTurnPending');
    const battleOver = GameState.get('battleOver');
    const hasActedThisTurn = GameState.get('hasActedThisTurn');
    const hasPlayedGemThisTurn = GameState.get('hasPlayedGemThisTurn');
    
    // Check if player is stunned
    const isStunned = player.buffs && player.buffs.some(b => b.type === "stunned");
    
    // Check if player can play gems
    const canPlayGems = selectedGems.size > 0 && 
                       Array.from(selectedGems).every(i => hand[i]) &&
                       player.stamina >= Math.min(...Array.from(selectedGems).map(i => hand[i].cost));
    
    // Update button states
    this.executeButton.update({
      disabled: battleOver || !canPlayGems || isEnemyTurnPending || isStunned
    });
    
    this.waitButton.update({
      disabled: battleOver || isEnemyTurnPending || hasActedThisTurn || hasPlayedGemThisTurn || isStunned
    });
    
    this.discardEndButton.update({
      disabled: battleOver || !selectedGems.size || isEnemyTurnPending || hasActedThisTurn || isStunned
    });
    
    this.endTurnButton.update({
      disabled: battleOver || isEnemyTurnPending || isStunned
    });
    
    // Show/hide flee button based on phase
    const currentPhaseIndex = GameState.get('currentPhaseIndex') || 0;
    if (currentPhaseIndex < 2 && !battleOver && !isEnemyTurnPending && !isStunned) {
      this.fleeButton.show();
    } else {
      this.fleeButton.hide();
    }
  }
  
  /**
   * Update component with new data
   * @param {Object} data - Update data
   */
  update(data) {
    // Just call updateButtonStates to refresh all controls
    this.updateButtonStates();
  }
}

export default BattleControlsComponent;