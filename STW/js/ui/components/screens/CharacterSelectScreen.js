// STW/js/ui/components/screens/CharacterSelectScreen.js
import { Component } from '../Component.js';
import { ButtonComponent } from '../common/ButtonComponent.js';
import { EventBus } from '../../../core/eventbus.js';
import { GameState } from '../../../core/state.js';
import { Config } from '../../../core/config.js';

/**
 * Character selection screen component with standardized event handling
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
    
    // Create child components with standardized event patterns
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
        
    // Subscribe to events with standardized pattern
    this.subscribeToEvent('META_PROGRESSION_RESET_COMPLETE', this.onResetComplete.bind(this));
    this.subscribeToEvent('LOAD_GAME_STATE_COMPLETE', this.updateButtonsBasedOnSaveData.bind(this));
  }
  
  /**
   * Handle class selection with consistent event emission pattern
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
    
    // Emit class selection event with consistent object pattern
    EventBus.emit('CLASS_SELECTED', { 
      className,
      timestamp: Date.now()
    });
    
    // Play sound with consistent pattern
    EventBus.emit('PLAY_SOUND', { sound: 'BUTTON_CLICK' });
    
    // Navigate to next screen
    EventBus.emit('SCREEN_CHANGE', { screen: 'gemCatalog' });
  }
  
  /**
   * Reset meta progression with standardized confirmation
   */
  resetMetaProgression() {
    // Use consistent pattern for confirmation
    EventBus.emit('SHOW_CONFIRMATION', {
      message: "Are you sure you want to reset all meta-progression? This will clear Meta $ZENNY, unlocked gems, and proficiency.",
      onConfirm: () => {
        // Show loading indicator while resetting
        EventBus.emit('LOADING_START', { message: "Resetting progression..." });
        
        // Emit reset event
        EventBus.emit('META_PROGRESSION_RESET');
      }
    });
  }
  
  /**
   * Handle reset completion
   */
  onResetComplete() {
    EventBus.emit('LOADING_END');
    EventBus.emit('UI_MESSAGE', {
      message: "Progress reset successfully!",
      type: 'success'
    });
  }
  
  /**
   * Update buttons based on save data
   * @param {Object} data - Save data
   */
  updateButtonsBasedOnSaveData(data) {
    // If saved class exists, update button states
    const savedClass = data?.playerState?.class;
    
    if (savedClass) {
      // Update button tooltips
      this.knightButton.update({
        tooltip: savedClass === 'Knight' ? 
          'Continue with Knight' : 'Start new game as Knight'
      });
      
      this.mageButton.update({
        tooltip: savedClass === 'Mage' ? 
          'Continue with Mage' : 'Start new game as Mage'
      });
      
      this.rogueButton.update({
        tooltip: savedClass === 'Rogue' ? 
          'Continue with Rogue' : 'Start new game as Rogue'
      });
    }
  }
  
  /**
   * After render actions
   */
  afterRender() {
    // Add any post-render initialization here
    
    // Try to load saved data
    EventBus.emit('LOAD_GAME_STATE');
  }
}

export default CharacterSelectScreen;