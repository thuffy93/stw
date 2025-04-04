// STW/js/ui/components/screens/CharacterSelectScreen.js
import { Component } from '../Component.js';
import { ButtonComponent } from '../common/ButtonComponent.js';
import { EventBus } from '../../../core/eventbus.js';
import { GameState } from '../../../core/state.js';

/**
 * Character selection screen component
 */
export class CharacterSelectScreen extends Component {
  constructor() {
    // Create screen template
    super('character-select-screen', `
      <div id="character-select-screen" class="screen">
        <h1>Choose Your Class</h1>
        
        <div class="class-selection">
          <div id="knight-btn-container" class="class-option"></div>
          <div id="mage-btn-container" class="class-option"></div>
          <div id="rogue-btn-container" class="class-option"></div>
        </div>
        
        <div class="meta-actions">
          <div id="reset-btn-container"></div>
        </div>
        
        <div class="meta-info">
          <p>Meta Zenny: <span id="meta-zenny-display">0</span></p>
        </div>
      </div>
    `);
    
    // Create button components
    this.knightButton = new ButtonComponent('knight-btn', 'Knight', {
      className: 'btn-knight btn-large',
      eventName: 'CLASS_SELECTED',
      eventData: { className: 'Knight' }
    });
    
    this.mageButton = new ButtonComponent('mage-btn', 'Mage', {
      className: 'btn-mage btn-large',
      eventName: 'CLASS_SELECTED',
      eventData: { className: 'Mage' }
    });
    
    this.rogueButton = new ButtonComponent('rogue-btn', 'Rogue', {
      className: 'btn-rogue btn-large',
      eventName: 'CLASS_SELECTED',
      eventData: { className: 'Rogue' }
    });
    
    this.resetButton = new ButtonComponent('reset-btn', 'Reset Progress', {
      className: 'btn-danger',
      onClick: () => this.confirmReset()
    });
    
    // Add buttons as children
    this.addChild(this.knightButton)
        .addChild(this.mageButton)
        .addChild(this.rogueButton)
        .addChild(this.resetButton);
        
    // Set up event listeners
    EventBus.on('CLASS_SELECTED', (data) => {
      this.handleClassSelection(data);
    });
    
    // Additional event subscriptions
    this.subscribeToEvent('META_ZENNY_UPDATED', this.updateMetaZenny);
  }
  
  /**
   * Handle class selection
   * @param {Object} data - Selection data with className
   */
  handleClassSelection(data) {
    const { className } = data;
    console.log(`Character class selected: ${className}`);
    
    // Show confirmation message
    EventBus.emit('UI_MESSAGE', {
      message: `${className} selected! Prepare for your journey.`,
      type: 'success'
    });
    
    // Navigate to gem catalog after a short delay
    setTimeout(() => {
      EventBus.emit('SCREEN_CHANGE', 'gemCatalog');
    }, 500);
  }
  
  /**
   * Confirm reset action
   */
  confirmReset() {
    if (confirm("Are you sure you want to reset all meta-progression? This will clear Meta $ZENNY, unlocked gems, and proficiency.")) {
      EventBus.emit('RESET_META_PROGRESSION');
      
      // Show confirmation
      EventBus.emit('UI_MESSAGE', {
        message: "Meta progression has been reset",
        type: 'success'
      });
      
      // Update the display
      this.updateMetaZenny({ metaZenny: 0 });
    }
  }
  
  /**
   * Update meta zenny display
   * @param {Object} data - Update data with metaZenny value
   */
  updateMetaZenny(data) {
    const metaZenny = data.metaZenny !== undefined ? 
      data.metaZenny : 
      GameState.get('metaZenny');
    
    const display = this.element.querySelector('#meta-zenny-display');
    if (display) {
      display.textContent = metaZenny;
    }
  }
  
  /**
   * Override render to add meta zenny
   */
  render() {
    const element = super.render();
    
    // Update meta zenny display
    this.updateMetaZenny({});
    
    return element;
  }
  
  /**
   * Update the screen with new data
   * @param {Object} data - Update data
   */
  update(data) {
    if (data.metaZenny !== undefined) {
      this.updateMetaZenny(data);
    }
  }
}