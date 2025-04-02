// Game state singleton
export const GameState = {
    // Initial state (matches your HTML structure)
    data: {
      player: {
        class: null,
        health: 30,
        maxHealth: 30,
        stamina: 3,
        baseStamina: 3,
        zenny: 0,
        hand: [],       // Active gems in battle
        deck: [],        // All owned gems
        buffs: {
            shield: 0,     // Current shield value
            shieldTurns: 0 // Turns remaining
        }
      },
      battle: {
        phase: 'Dawn',  // Dawn/Dusk/Dark
        turn: 'player', // player/enemy
        enemy: null
      },
    },
  
    // State subscribers (for UI updates)
    listeners: [],
    
    // Add stateChangeHistory
    stateChangeHistory: [],
    MAX_HISTORY_ENTRIES: 100,
    
    trackStateChange(property, newValue, oldValue) {
      this.stateChangeHistory.push({
        timestamp: new Date(),
        property,
        newValue,
        oldValue
      });
      
      // Limit history size
      if (this.stateChangeHistory.length > this.MAX_HISTORY_ENTRIES) {
        this.stateChangeHistory.shift();
      }
    },
    
    // Enhanced setState with history tracking
    setState(key, value) {
        const keys = key.split('.');
        let obj = this.data;
        
        // Get the old value for history
        const oldValue = this.getNestedValue(this.data, keys);
        
        // Set the new value (keep existing logic)
        for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) {
            obj[keys[i]] = {};
        }
        obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = value;
        
        // Track the change
        this.trackStateChange(key, value, oldValue);
        
        // Keep existing notification logic
        this.notify();
    },
    
    // Helper function to get nested values
    getNestedValue(obj, keys) {
        let currentObj = obj;
        for (const key of keys) {
        if (!currentObj || typeof currentObj !== 'object') return undefined;
        currentObj = currentObj[key];
        }
        return currentObj;
    },
    
    // Add new validate method
    validateState() {
        const issues = [];
        
        // Validate critical state properties
        if (!this.data.player) {
        issues.push('Missing player object');
        }
        // Add more validation checks
        
        return {
        valid: issues.length === 0,
        issues
        };
    },
    
    // Batch updates (e.g., loading saved games)
    update(updates) {
      Object.assign(this.data, updates);
      this.notify();
    },
    // Notify all subscribed UI components
    notify() {
      this.listeners.forEach(callback => callback(this.data));
    },
  
    // Subscribe to state changes (returns unsubscribe function)
    subscribe(callback) {
      this.listeners.push(callback);
      return () => {
        this.listeners = this.listeners.filter(cb => cb !== callback);
      };
    }
};
function updateHealthBar(target) {
    const state = GameState.data;
    const bar = document.getElementById(`${target}-health-bar`);
    
    if (bar) {
      const health = state[target]?.health || state.battle.enemy?.health;
      const maxHealth = state[target]?.maxHealth || state.battle.enemy?.maxHealth;
      const percent = (health / maxHealth) * 100;
      bar.style.width = `${percent}%`;
      
      // Update text display if exists
      const textElem = document.getElementById(`${target}-health`);
      if (textElem) textElem.textContent = health;
    }
}