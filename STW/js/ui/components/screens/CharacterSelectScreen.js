// STW/js/ui/components/screens/CharacterSelectScreen.js
import { Component } from '../Component.js';
import { ButtonComponent } from '../common/ButtonComponent.js';
import { EventBus } from '../../../core/eventbus.js';
import { GameState } from '../../../core/state.js';
import { Config } from '../../../core/config.js';

/**
 * Character selection screen component
 */
export class CharacterSelectScreen extends Component {
  constructor() {
    super('character-select-screen', `
      <div id="character-select-screen" class="screen">
        <h1>Choose Your Class</h1>
        <div class="character-buttons">
          <div id="knight-btn-container"></div>
          <div id="mage-btn-container"></div>
          <div id="rogue-btn-container"></div>
        </div>
        <div id="reset-btn-container"></div>
      </div>
    `);
    
    // Create child components
    this.knightButton = new ButtonComponent('knight-btn', 'Knight', {
      className: 'btn-knight btn-large',
      onClick: () => this.selectClass('Knight')
    });
    
    this.mageButton = new ButtonComponent('mage-btn', 'Mage', {
      className: 'btn-mage btn-large',
      onClick: () => this.selectClass('Mage')
    });
    
    this.rogueButton = new ButtonComponent('rogue-btn', 'Rogue', {
      className: 'btn-rogue btn-large',
      onClick: () => this.selectClass('Rogue')
    });
    
    this.resetButton = new ButtonComponent('reset-btn', 'Reset Progress', {
      className: 'btn-reset',
      onClick: () => this.resetMetaProgression()
    });
    
    // Add child components
    this.addChild(this.knightButton)
        .addChild(this.mageButton)
        .addChild(this.rogueButton)
        .addChild(this.resetButton);
  }
  
  /**
   * Handle class selection
   * @param {String} className - Selected class name
   */
  selectClass(className) {
    console.log(`Character class selected: ${className}`);
    
    // Validate class
    if (!Config.CLASSES[className]) {
      EventBus.emit('UI_MESSAGE', {
        message: `Invalid class: ${className}`,
        type: 'error'
      });
      return;
    }
    
    // Emit class selection event
    EventBus.emit('CLASS_SELECTED', { className });
  }
  
  /**
   * Reset meta progression
   */
  resetMetaProgression() {
    if (confirm("Are you sure you want to reset all meta-progression? This will clear Meta $ZENNY, unlocked gems, and proficiency.")) {
      EventBus.emit('META_PROGRESSION_RESET');
    }
  }
}

export default CharacterSelectScreen;