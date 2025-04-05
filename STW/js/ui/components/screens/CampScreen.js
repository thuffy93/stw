// STW/js/ui/components/screens/CampScreen.js
import { Component } from '../Component.js';
import { ButtonComponent } from '../common/ButtonComponent.js';
import { EventBus } from '../../../core/eventbus.js';
import { GameState } from '../../../core/state.js';

/**
 * Camp screen component
 */
export class CampScreen extends Component {
  constructor() {
    super('camp-screen', `
      <div id="camp-screen" class="screen">
        <h1>Camp</h1>
        
        <div class="camp-info">
          <p>Day <span id="camp-day">1</span> Complete!</p>
          <p>Take a moment to rest and prepare for the next day.</p>
        </div>
        
        <div class="zenny-management">
          <h2>Zenny Management</h2>
          
          <div class="zenny-display">
            <div class="zenny-section">
              <h3>Journey Wallet</h3>
              <p><span id="camp-zenny">0</span> $ZENNY</p>
              
              <div class="withdraw-section">
                <input type="number" id="withdraw-amount" placeholder="Amount to withdraw" min="1" />
                <div id="withdraw-btn-container"></div>
              </div>
            </div>
            
            <div class="zenny-section">
              <h3>Meta Wallet</h3>
              <p><span id="camp-meta-zenny">0</span> $ZENNY</p>
              
              <div class="deposit-section">
                <input type="number" id="deposit-amount" placeholder="Amount to deposit" min="1" />
                <div id="deposit-btn-container"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="journal-section">
          <h2>Journey Journal</h2>
          <p id="journal-entry">You've made it through another day. The road ahead looks challenging, but you feel ready to face whatever comes next.</p>
        </div>
        
        <div id="next-day-btn-container"></div>
      </div>
    `);
    
    // Create action buttons
    this.withdrawButton = new ButtonComponent('withdraw-btn', 'Withdraw', {
      className: 'btn-primary',
      onClick: () => this.withdrawZenny()
    });
    
    this.depositButton = new ButtonComponent('deposit-btn', 'Deposit', {
      className: 'btn-primary',
      onClick: () => this.depositZenny()
    });
    
    this.nextDayButton = new ButtonComponent('next-day-btn', 'Begin Next Day', {
      className: 'btn-large btn-primary',
      eventName: 'START_NEXT_DAY'
    });
    
    // Add child components
    this.addChild(this.withdrawButton)
        .addChild(this.depositButton)
        .addChild(this.nextDayButton);
        
    // Subscribe to events
    this.subscribeToEvent('META_ZENNY_UPDATED', this.updateMetaZenny);
    this.subscribeToEvent('ZENNY_WITHDRAWN', this.updateZennyDisplay);
    this.subscribeToEvent('ZENNY_DEPOSITED', this.updateZennyDisplay);
  }
  
  /**
   * Withdraw zenny to meta wallet
   */
  withdrawZenny() {
    const withdrawInput = this.element.querySelector('#withdraw-amount');
    if (!withdrawInput) return;
    
    const amount = parseInt(withdrawInput.value);
    const player = GameState.get('player');
    
    if (isNaN(amount) || amount <= 0) {
      EventBus.emit('UI_MESSAGE', {
        message: "Enter a valid amount to withdraw!",
        type: 'error'
      });
      return;
    }
    
    if (amount > player.zenny) {
      EventBus.emit('UI_MESSAGE', {
        message: "Not enough $ZENNY in Journey Wallet!",
        type: 'error'
      });
      return;
    }
    
    // Transfer zenny
    GameState.set('player.zenny', player.zenny - amount);
    const metaZenny = GameState.get('metaZenny');
    GameState.set('metaZenny', metaZenny + amount);
    
    // Emit zenny withdraw event
    EventBus.emit('ZENNY_WITHDRAWN', { amount });
    
    // Show success message
    EventBus.emit('UI_MESSAGE', {
      message: `Withdrew ${amount} $ZENNY to Meta Wallet!`
    });
    
    // Clear input field
    withdrawInput.value = "";
  }
  
  /**
   * Deposit zenny to journey wallet
   */
  depositZenny() {
    const depositInput = this.element.querySelector('#deposit-amount');
    if (!depositInput) return;
    
    const amount = parseInt(depositInput.value);
    const metaZenny = GameState.get('metaZenny');
    
    if (isNaN(amount) || amount <= 0) {
      EventBus.emit('UI_MESSAGE', {
        message: "Enter a valid amount to deposit!",
        type: 'error'
      });
      return;
    }
    
    if (amount > metaZenny) {
      EventBus.emit('UI_MESSAGE', {
        message: "Not enough $ZENNY in Meta Wallet!",
        type: 'error'
      });
      return;
    }
    
    // Transfer zenny
    GameState.set('metaZenny', metaZenny - amount);
    const player = GameState.get('player');
    GameState.set('player.zenny', player.zenny + amount);
    
    // Emit zenny deposit event
    EventBus.emit('ZENNY_DEPOSITED', { amount });
    
    // Show success message
    EventBus.emit('UI_MESSAGE', {
      message: `Deposited ${amount} $ZENNY to Journey Wallet!`
    });
    
    // Clear input field
    depositInput.value = "";
  }
  
  /**
   * Update zenny display
   */
  updateZennyDisplay() {
    // Get current values
    const player = GameState.get('player');
    const metaZenny = GameState.get('metaZenny');
    
    // Update journey wallet display
    const journeyZenny = this.element.querySelector('#camp-zenny');
    if (journeyZenny) journeyZenny.textContent = player.zenny;
    
    // Update meta wallet display
    const metaZennyDisplay = this.element.querySelector('#camp-meta-zenny');
    if (metaZennyDisplay) metaZennyDisplay.textContent = metaZenny;
    
    // Update button states
    this.withdrawButton.update({
      disabled: player.zenny <= 0
    });
    
    this.depositButton.update({
      disabled: metaZenny <= 0
    });
  }
  
  /**
   * Update meta zenny display
   * @param {Object} data - Update data
   */
  updateMetaZenny(data) {
    const metaZenny = data.metaZenny !== undefined ? 
      data.metaZenny : 
      GameState.get('metaZenny');
    
    const display = this.element.querySelector('#camp-meta-zenny');
    if (display) {
      display.textContent = metaZenny;
    }
    
    // Update button states
    this.depositButton.update({
      disabled: metaZenny <= 0
    });
  }
  
  /**
   * Update journal entry with personalized content
   */
  updateJournalEntry() {
    const player = GameState.get('player');
    const currentDay = GameState.get('currentDay');
    const journalEntry = this.element.querySelector('#journal-entry');
    
    if (!journalEntry) return;
    
    // Generate a journal entry based on game state
    let entry = "";
    
    // Add day-specific content
    if (currentDay === 1) {
      entry = "Your journey has just begun. The road ahead is long, but your determination is strong.";
    } else if (currentDay === 2) {
      entry = "You've survived your first day. The monsters were tough, but you prevailed.";
    } else if (currentDay === 3) {
      entry = "Halfway through your journey. The Dark Lord's castle looms in the distance.";
    } else if (currentDay >= 4) {
      entry = "You're getting closer to the Dark Lord's castle. Your skills have improved, but the challenges grow tougher.";
    }
    
    // Add class-specific content
    if (player.class === "Knight") {
      entry += " Your armor has protected you well, though it bears some new dents.";
    } else if (player.class === "Mage") {
      entry += " Your magic grows stronger with each spell you cast.";
    } else if (player.class === "Rogue") {
      entry += " You've become more adept at striking from the shadows.";
    }
    
    // Add health-based content
    if (player.health < player.maxHealth / 2) {
      entry += " You're wounded and should consider healing before continuing.";
    } else {
      entry += " You're feeling rested and ready for tomorrow's challenges.";
    }
    
    journalEntry.textContent = entry;
  }
  
  /**
   * Override render to initialize camp display
   */
  render() {
    const element = super.render();
    
    // Update current day
    const currentDay = GameState.get('currentDay');
    const dayDisplay = element.querySelector('#camp-day');
    if (dayDisplay) {
      dayDisplay.textContent = currentDay;
    }
    
    // Update zenny display
    this.updateZennyDisplay();
    
    // Update journal entry
    this.updateJournalEntry();
    
    return element;
  }
  
  /**
   * Update component with new data
   * @param {Object} data - Update data
   */
  update(data) {
    // Update day if provided
    if (data.currentDay !== undefined) {
      const dayDisplay = this.element.querySelector('#camp-day');
      if (dayDisplay) {
        dayDisplay.textContent = data.currentDay;
      }
      
      // Update journal entry when day changes
      this.updateJournalEntry();
    }
    
    // Update zenny displays
    if (data.player || data.metaZenny !== undefined) {
      this.updateZennyDisplay();
    }
  }
}

export default CampScreen;