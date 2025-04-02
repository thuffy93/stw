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
    
    // Enhanced setState with tracking and notification control
    setState(key, value, notify = true) {
      const keys = key.split('.');
      let obj = this.data;
      
      // Track old value for history (if needed)
      let oldValue;
      if (this.trackStateChange) {
        oldValue = this.getNestedProperty(this.data, keys);
      }
      
      // Set the value
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) {
          obj[keys[i]] = {};
        }
        obj = obj[keys[i]];
      }
      
      obj[keys[keys.length - 1]] = value;
      
      // Track state change if tracking is enabled
      if (this.trackStateChange) {
        this.trackStateChange(key, value, oldValue);
      }
      
      // Auto-update health bars
      if (key === 'player.health' || key === 'player.maxHealth') {
        updateHealthBar('player');
      }
      if (key.includes('enemy.health')) {
        updateHealthBar('enemy');
      }

      // Only notify if requested
      if (notify) {
        this.notify();
      }
    },
    
    // Optimized batch update method
    update(updates) {
      // Track changes for history
      const changes = {};
      
      // Apply all updates at once
      for (const key in updates) {
        const oldValue = this.getNestedProperty(this.data, key.split('.'));
        changes[key] = { oldValue, newValue: updates[key] };
        
        // Set the value without triggering notification
        this.setState(key, updates[key], false);
      }
      
      // Process any special UI updates needed (like health bars)
      this.processSpecialUpdates(changes);
      
      // Single notification at the end
      this.notify();
      
      return true;
    },
    
    // Helper to get a nested property value
    getNestedProperty(obj, pathArray) {
      return pathArray.reduce((prev, curr) => 
        prev && typeof prev === 'object' ? prev[curr] : undefined
      , obj);
    },
    
    // Process special UI updates based on changed properties
    processSpecialUpdates(changes) {
      // Check if health properties changed
      if (changes['player.health'] || changes['player.maxHealth']) {
        updateHealthBar('player');
      }
      
      const enemyHealthChanged = Object.keys(changes).some(key => 
        key.includes('enemy.health')
      );
      
      if (enemyHealthChanged) {
        updateHealthBar('enemy');
      }
      
      // Can add more special case handling here
    },
    
    // Optional: Add state change tracking for debugging
    stateChangeHistory: [],
    MAX_HISTORY_ENTRIES: 100,
    
    trackStateChange(property, newValue, oldValue) {
      this.stateChangeHistory.push({
        timestamp: new Date(),
        property,
        newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : newValue,
        oldValue: typeof oldValue === 'object' ? JSON.stringify(oldValue) : oldValue
      });
      
      // Limit history size
      if (this.stateChangeHistory.length > this.MAX_HISTORY_ENTRIES) {
        this.stateChangeHistory.shift();
      }
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
    },
    
    // Helper to set state without notification
    setStateInternal(key, value, notify = true) {
      const keys = key.split('.');
      let obj = this.data;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) {
          obj[keys[i]] = {};
        }
        obj = obj[keys[i]];
      }
      
      obj[keys[keys.length - 1]] = value;
      
      // Track the change for history
      this.trackStateChange(key, value, oldValue);
      
      // Notify listeners if required
      if (notify) {
        this.notifyListeners(key, value, oldValue);
      }
    },

    // Batch notification
    notifyBatch(changes) {
      // Notify individual property listeners
      for (const key in changes) {
        const { oldValue, newValue } = changes[key];
        this.notifyListeners(key, newValue, oldValue);
      }
      
      // Notify wildcard listeners with the full change set
      if (this._listeners['*']) {
        this._listeners['*'].forEach(listener => {
          try {
            listener(changes);
          } catch (error) {
            console.error(`Error in wildcard state change listener:`, error);
          }
        });
      }
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