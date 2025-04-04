// Enhanced state management system with simplified API
export const GameState = (() => {
  // Private internal state with initial values
  const _state = {
    player: {
      class: null,
      health: 30,
      maxHealth: 30,
      stamina: 3,
      baseStamina: 3,
      zenny: 0,
      buffs: []
    },
    battle: {
      phase: 'Dawn',  // Dawn/Dusk/Dark
      turn: 'player', // player/enemy
      enemy: null
    },
    currentScreen: 'character-select',
    currentDay: 1,
    currentPhaseIndex: 0,
    battleCount: 0,
    battleOver: false,
    selectedGems: new Set(),
    isEnemyTurnPending: false,
    hasActedThisTurn: false,
    hasPlayedGemThisTurn: false,
    
    // Game collections
    hand: [],
    gemBag: [],
    discard: [],
    
    // Storage for gem catalog
    gemCatalog: {
      unlocked: [],
      available: [],
      maxCapacity: 15,
      gemPool: [],
      upgradedThisShop: new Set()
    },
    
    // Meta progression
    metaZenny: 0
  };
  
  // Property-specific listeners
  const propertyListeners = {
    '*': [] // Wildcard listeners for any property change
  };
  
  // Keep a change history for debugging (limited size)
  const stateChangeHistory = [];
  const MAX_HISTORY_ENTRIES = 100;
  
  /**
   * Add a listener for specific property changes
   * @param {String} property - Property to listen for (use '*' for all changes)
   * @param {Function} listener - Function to call when property changes
   * @returns {Function} Function to remove the listener
   */
  function addListener(property, listener) {
    if (!propertyListeners[property]) {
      propertyListeners[property] = [];
    }
    
    propertyListeners[property].push(listener);
    
    return () => {
      if (propertyListeners[property]) {
        propertyListeners[property] = propertyListeners[property].filter(l => l !== listener);
      }
    };
  }
  
  /**
   * Notify listeners of state changes
   * @param {String} property - Property that changed
   * @param {*} newValue - New property value
   * @param {*} oldValue - Old property value
   */
  function notifyListeners(property, newValue, oldValue) {
    // Notify property-specific listeners
    if (propertyListeners[property]) {
      propertyListeners[property].forEach(listener => {
        try {
          listener(property, newValue, oldValue);
        } catch (error) {
          console.error(`Error in listener for ${property}:`, error);
        }
      });
    }
    
    // Notify wildcard listeners
    if (propertyListeners['*']) {
      propertyListeners['*'].forEach(listener => {
        try {
          listener(property, newValue, oldValue);
        } catch (error) {
          console.error(`Error in wildcard listener:`, error);
        }
      });
    }
  }
  
  /**
   * Track state changes in history
   * @param {String} property - Property that changed
   * @param {*} newValue - New value
   * @param {*} oldValue - Old value
   */
  function trackStateChange(property, newValue, oldValue) {
    stateChangeHistory.push({
      timestamp: new Date(),
      property,
      newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : newValue,
      oldValue: typeof oldValue === 'object' ? JSON.stringify(oldValue) : oldValue
    });
    
    // Limit history size
    if (stateChangeHistory.length > MAX_HISTORY_ENTRIES) {
      stateChangeHistory.shift();
    }
  }
  
  /**
   * Get a value from state using a property path
   * @param {String} property - Property path (e.g., 'player.health')
   * @returns {*} Property value
   */
  function get(property) {
    if (!property) return undefined;
    
    if (property.includes('.')) {
      const parts = property.split('.');
      let current = _state;
      
      for (const part of parts) {
        if (current === undefined) return undefined;
        current = current[part];
      }
      
      return current;
    }
    
    return _state[property];
  }
  
  /**
   * Set a state value by property path
   * @param {String|Object} property - Property path or object with multiple properties
   * @param {*} value - Value to set (ignored if property is an object)
   * @returns {Boolean} Whether the operation was successful
   */
  function set(property, value) {
    // Handle bulk updates
    if (typeof property === 'object' && property !== null) {
      let success = true;
      
      Object.entries(property).forEach(([key, val]) => {
        if (!set(key, val)) {
          success = false;
        }
      });
      
      return success;
    }
    
    try {
      // Handle property path (e.g., 'player.health')
      if (property.includes('.')) {
        const parts = property.split('.');
        let current = _state;
        
        // Navigate to the parent object
        for (let i = 0; i < parts.length - 1; i++) {
          if (current[parts[i]] === undefined) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        
        // Store the old value for notification
        const oldValue = current[parts[parts.length - 1]];
        
        // Set the value on the parent object
        current[parts[parts.length - 1]] = value;
        
        // Auto-update health bars for backward compatibility
        if (property === 'player.health' || property === 'player.maxHealth') {
          updateHealthBar('player');
        }
        if (property.includes('enemy.health')) {
          updateHealthBar('enemy');
        }
        
        // Track and notify
        trackStateChange(property, value, oldValue);
        notifyListeners(property, value, oldValue);
        
        return true;
      }
      
      // Simple property
      const oldValue = _state[property];
      _state[property] = value;
      
      // Track and notify
      trackStateChange(property, value, oldValue);
      notifyListeners(property, value, oldValue);
      
      return true;
      
    } catch (error) {
      console.error(`Error setting state property ${property}:`, error);
      return false;
    }
  }
  
  /**
   * Update a value in state by applying a function to the current value
   * @param {String} property - Property path
   * @param {Function} updateFn - Function to update value
   * @returns {Boolean} Whether the operation was successful
   */
  function update(property, updateFn) {
    try {
      const currentValue = get(property);
      const newValue = updateFn(currentValue);
      return set(property, newValue);
    } catch (error) {
      console.error(`Error updating state property ${property}:`, error);
      return false;
    }
  }
  
  /**
   * Export a snapshot of the current state for saving
   * @returns {Object} State snapshot
   */
  function exportSaveData() {
    return {
      playerState: {
        class: get('player.class'),
        health: get('player.health'),
        maxHealth: get('player.maxHealth'),
        stamina: get('player.stamina'),
        baseStamina: get('player.baseStamina'),
        zenny: get('player.zenny')
      },
      progress: {
        currentDay: get('currentDay'),
        currentPhaseIndex: get('currentPhaseIndex'),
        battleCount: get('battleCount')
      },
      metaZenny: get('metaZenny'),
      timestamp: Date.now()
    };
  }
  
  /**
   * Import saved data into state
   * @param {Object} saveData - Save data to import
   * @returns {Boolean} Whether import was successful
   */
  function importSaveData(saveData) {
    if (!saveData) return false;
    
    try {
      // Restore player state
      if (saveData.playerState) {
        const { class: className, health, maxHealth, stamina, baseStamina, zenny } = saveData.playerState;
        set('player.class', className);
        set('player.health', health);
        set('player.maxHealth', maxHealth);
        set('player.stamina', stamina);
        set('player.baseStamina', baseStamina);
        set('player.zenny', zenny);
        set('player.buffs', []);
      }
      
      // Restore progress
      if (saveData.progress) {
        set('currentDay', saveData.progress.currentDay || 1);
        set('currentPhaseIndex', saveData.progress.currentPhaseIndex || 0);
        set('battleCount', saveData.progress.battleCount || 0);
      }
      
      // Restore meta zenny
      if (saveData.metaZenny !== undefined) {
        set('metaZenny', saveData.metaZenny);
      }
      
      return true;
    } catch (error) {
      console.error("Error importing save data:", error);
      return false;
    }
  }
  
  /**
   * Create a backup of current state
   * @returns {Object} Complete state backup
   */
  function createBackup() {
    return JSON.parse(JSON.stringify(_state));
  }
  
  /**
   * Restore from a backup
   * @param {Object} backup - Backup to restore from
   * @returns {Boolean} Whether restore was successful
   */
  function restoreFromBackup(backup) {
    if (!backup) return false;
    
    try {
      // Restore all state properties
      Object.keys(backup).forEach(key => {
        set(key, backup[key]);
      });
      
      return true;
    } catch (error) {
      console.error("Error restoring from backup:", error);
      return false;
    }
  }
  
  /**
   * Get state change history
   * @returns {Array} State change history
   */
  function getStateChangeHistory() {
    return [...stateChangeHistory];
  }
  
  /**
   * Clear state change history
   */
  function clearStateChangeHistory() {
    stateChangeHistory.length = 0;
  }
  
  /**
   * Reset player stats with class-specific values
   * @param {String} className - Player class name
   */
  function resetPlayerStats(className) {
    // This would be imported from Config in real implementation
    const classConfig = {
      Knight: {
        maxHealth: 40,
        baseStamina: 3
      },
      Mage: {
        maxHealth: 30,
        baseStamina: 4
      },
      Rogue: {
        maxHealth: 35,
        baseStamina: 3,
        startingZenny: 5
      }
    };
    
    if (!classConfig[className]) {
      console.error(`Invalid class name: ${className}`);
      return false;
    }
    
    set('player', {
      class: className,
      maxHealth: classConfig[className].maxHealth,
      health: classConfig[className].maxHealth,
      stamina: classConfig[className].baseStamina,
      baseStamina: classConfig[className].baseStamina,
      zenny: classConfig[className].startingZenny || 0,
      buffs: []
    });
    
    set('currentDay', 1);
    set('currentPhaseIndex', 0);
    set('battleCount', 0);
    set('battleOver', false);
    set('selectedGems', new Set());
    
    return true;
  }
  
  // For backward compatibility with health bar updates
  function updateHealthBar(target) {
    const bar = document.getElementById(`${target}-health-bar`);
    
    if (bar) {
      const health = target === 'player' ? _state.player.health : 
                     (_state.battle.enemy ? _state.battle.enemy.health : 0);
      const maxHealth = target === 'player' ? _state.player.maxHealth : 
                        (_state.battle.enemy ? _state.battle.enemy.maxHealth : 1);
      
      const percent = (health / maxHealth) * 100;
      bar.style.width = `${percent}%`;
      
      // Update text display if exists
      const textElem = document.getElementById(`${target}-health`);
      if (textElem) textElem.textContent = health;
    }
  }

  // Return public methods and properties
  return {
    // Core API - simplified but comprehensive
    get,
    set,
    update,
    addListener,
    
    // State management
    resetPlayerStats,
    exportSaveData,
    importSaveData,
    createBackup,
    restoreFromBackup,
    
    // Debugging
    getStateChangeHistory,
    clearStateChangeHistory
  };
})();

export default GameState;