// Enhanced Game state management module
export const GameState = {
  // Initial state with expanded structure
  data: {
      // Game progression
      currentScreen: "character-select",
      currentDay: 1,
      currentPhaseIndex: 0,
      battleCount: 0,
      metaZenny: 0,
      
      // Battle state
      battleOver: false,
      selectedGems: new Set(),
      selectedPoolGem: null,
      hasActedThisTurn: false,
      hasPlayedGemThisTurn: false,
      isEnemyTurnPending: false,
      
      // Shop state
      inUpgradeMode: false,
      
      // Player stats
      player: { 
          class: null, 
          maxHealth: 35, 
          health: 35, 
          stamina: 3, 
          baseStamina: 3, 
          zenny: 0,
          buffs: []
      },
      
      // Gem mechanics
      hand: [],
      discard: [],
      gemBag: [],
      
      // Enemy data
      enemy: null,
      
      // Active gem catalog and proficiency
      gemCatalog: {
          unlocked: [],
          available: [],
          maxCapacity: 15,
          gemPool: [],
          upgradedThisShop: new Set()
      },
      
      // Store class-specific catalogs
      classGemCatalogs: {
          Knight: {
              unlocked: [],
              available: [],
              maxCapacity: 15,
              gemPool: [],
              upgradedThisShop: new Set()
          },
          Mage: {
              unlocked: [],
              available: [],
              maxCapacity: 15,
              gemPool: [],
              upgradedThisShop: new Set()
          },
          Rogue: {
              unlocked: [],
              available: [],
              maxCapacity: 15,
              gemPool: [],
              upgradedThisShop: new Set()
          }
      },
      
      // Store class-specific gem proficiency
      gemProficiency: {},
      
      classGemProficiency: {
          Knight: {},
          Mage: {},
          Rogue: {}
      },
      
      // State change listeners
      _listeners: {}
  },

  // Keep a change history for debugging
  stateChangeHistory: [],
  MAX_HISTORY_ENTRIES: 100,

  /**
   * Add a state change listener
   * @param {String} property - Property to listen for changes
   * @param {Function} listener - Function to call on change
   * @returns {Function} Function to remove the listener
   */
  addListener(property, listener) {
      if (!this.data._listeners[property]) {
          this.data._listeners[property] = [];
      }
      
      this.data._listeners[property].push(listener);
      
      // Return function to remove listener
      return () => {
          if (this.data._listeners[property]) {
              this.data._listeners[property] = this.data._listeners[property].filter(l => l !== listener);
          }
      };
  },

  /**
   * Notify listeners of state change
   * @param {String} property - Property that changed
   * @param {*} newValue - New value
   * @param {*} oldValue - Old value
   */
  notifyListeners(property, newValue, oldValue) {
      // Notify direct property listeners
      if (this.data._listeners[property]) {
          this.data._listeners[property].forEach(listener => {
              try {
                  listener(property, newValue, oldValue);
              } catch (error) {
                  console.error(`Error in state change listener for ${property}:`, error);
              }
          });
      }
      
      // Notify wildcard listeners
      if (this.data._listeners['*']) {
          this.data._listeners['*'].forEach(listener => {
              try {
                  listener(property, newValue, oldValue);
              } catch (error) {
                  console.error(`Error in wildcard state change listener:`, error);
              }
          });
      }
  },

  /**
   * Track state change in history
   * @param {String} property - Property that changed
   * @param {*} newValue - New value
   * @param {*} oldValue - Old value
   */
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

  /**
   * Get a value from state by property path
   * @param {String} property - Property path (e.g. 'player.health')
   * @returns {*} Property value
   */
  get(property) {
      if (!property) return undefined;
      
      if (property.includes('.')) {
          const parts = property.split('.');
          let current = this.data;
          for (const part of parts) {
              if (current === undefined) return undefined;
              current = current[part];
          }
          return current;
      }
      return this.data[property];
  },

  /**
   * Set a value in state by property path
   * @param {String|Object} property - Property path or object with multiple properties
   * @param {*} value - Value to set (ignored if property is an object)
   * @returns {Boolean} Whether the operation was successful
   */
  set(property, value) {
      // Handle bulk updates
      if (typeof property === 'object' && property !== null) {
          let success = true;
          
          Object.entries(property).forEach(([key, val]) => {
              if (!this.set(key, val)) {
                  success = false;
              }
          });
          
          return success;
      }
      
      try {
          // Handle property path
          if (property.includes('.')) {
              const parts = property.split('.');
              let current = this.data;
              
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
              
              // Track and notify
              this.trackStateChange(property, value, oldValue);
              this.notifyListeners(property, value, oldValue);
              
              return true;
          }
          
          // Simple property
          const oldValue = this.data[property];
          this.data[property] = value;
          
          // Track and notify
          this.trackStateChange(property, value, oldValue);
          this.notifyListeners(property, value, oldValue);
          
          return true;
          
      } catch (error) {
          console.error(`Error setting state property ${property}:`, error);
          return false;
      }
  },

  /**
   * Update a value in state by applying a function to the current value
   * @param {String} property - Property path
   * @param {Function} updateFn - Function to update value
   * @returns {Boolean} Whether the operation was successful
   */
  update(property, updateFn) {
      try {
          const currentValue = this.get(property);
          const newValue = updateFn(currentValue);
          return this.set(property, newValue);
      } catch (error) {
          console.error(`Error updating state property ${property}:`, error);
          return false;
      }
  },

  /**
   * Validate state against expected structure
   * @returns {Object} Validation results
   */
  validateState() {
      const issues = [];
      
      // Check critical fields
      if (!this.data.player) {
          issues.push('Missing player object');
      } else {
          // Check player fields
          if (this.data.player.health === undefined) {
              issues.push('Missing player.health');
          }
          if (this.data.player.maxHealth === undefined) {
              issues.push('Missing player.maxHealth');
          }
          if (this.data.player.stamina === undefined) {
              issues.push('Missing player.stamina');
          }
      }
      
      // Check gem collections
      if (!Array.isArray(this.data.hand)) {
          issues.push('Hand is not an array');
      }
      if (!Array.isArray(this.data.gemBag)) {
          issues.push('GemBag is not an array');
      }
      if (!Array.isArray(this.data.discard)) {
          issues.push('Discard is not an array');
      }
      
      // Check class-specific data
      if (this.data.player?.class) {
          const classData = this.data.classGemCatalogs[this.data.player.class];
          if (!classData) {
              issues.push(`Missing gem catalog for class: ${this.data.player.class}`);
          }
          
          const classProficiency = this.data.classGemProficiency[this.data.player.class];
          if (!classProficiency) {
              issues.push(`Missing gem proficiency for class: ${this.data.player.class}`);
          }
      }
      
      return {
          valid: issues.length === 0,
          issues
      };
  },

  /**
   * Reset player stats with class-specific values
   * @param {String} className - Player class name
   * @returns {Boolean} Whether reset was successful
   */
  resetPlayerStats(className, Config) {
      const classConfig = Config.CLASSES[className];
      
      if (!classConfig) {
          console.error(`Invalid class name: ${className}`);
          return false;
      }
      
      this.set('player', {
          class: className,
          maxHealth: classConfig.maxHealth,
          health: classConfig.maxHealth,
          stamina: classConfig.baseStamina,
          baseStamina: classConfig.baseStamina,
          zenny: classConfig.startingZenny || 0,
          buffs: []
      });
      
      this.set('currentDay', 1);
      this.set('currentPhaseIndex', 0);
      this.set('battleCount', 0);
      this.set('battleOver', false);
      this.set('selectedGems', new Set());
      
      // Set active catalog and proficiency for this class
      const classGemCatalog = this.get('classGemCatalogs')[className];
      console.log(`Setting gemCatalog for ${className}:`, classGemCatalog);
      
      // Ensure we make a deep copy to avoid reference issues
      const catalogCopy = JSON.parse(JSON.stringify(classGemCatalog));
      this.set('gemCatalog', catalogCopy);
      
      this.set('gemProficiency', JSON.parse(JSON.stringify(this.get('classGemProficiency')[className])));
      
      return true;
  },

  /**
   * Export a snapshot of the current state for saving
   * @returns {Object} State snapshot
   */
  exportSaveData() {
      return {
          playerState: {
              class: this.get('player.class'),
              health: this.get('player.health'),
              maxHealth: this.get('player.maxHealth'),
              stamina: this.get('player.stamina'),
              baseStamina: this.get('player.baseStamina'),
              zenny: this.get('player.zenny')
          },
          progress: {
              currentDay: this.get('currentDay'),
              currentPhaseIndex: this.get('currentPhaseIndex'),
              battleCount: this.get('battleCount')
          },
          metaZenny: this.get('metaZenny'),
          timestamp: Date.now()
      };
  },

  /**
   * Import saved data into state
   * @param {Object} saveData - Save data to import
   * @returns {Boolean} Whether import was successful
   */
  importSaveData(saveData) {
      if (!saveData) return false;
      
      try {
          // Restore player state
          if (saveData.playerState) {
              const { class: className, health, maxHealth, stamina, baseStamina, zenny } = saveData.playerState;
              this.set('player.class', className);
              this.set('player.health', health);
              this.set('player.maxHealth', maxHealth);
              this.set('player.stamina', stamina);
              this.set('player.baseStamina', baseStamina);
              this.set('player.zenny', zenny);
              this.set('player.buffs', []);
          }
          
          // Restore progress
          if (saveData.progress) {
              this.set('currentDay', saveData.progress.currentDay || 1);
              this.set('currentPhaseIndex', saveData.progress.currentPhaseIndex || 0);
              this.set('battleCount', saveData.progress.battleCount || 0);
          }
          
          // Restore meta zenny
          if (saveData.metaZenny !== undefined) {
              this.set('metaZenny', saveData.metaZenny);
          }
          
          return true;
      } catch (error) {
          console.error("Error importing save data:", error);
          return false;
      }
  },

  /**
   * Create a backup of current state
   * @returns {Object} Complete state backup
   */
  createBackup() {
      return JSON.parse(JSON.stringify(this.data));
  },

  /**
   * Restore from a backup
   * @param {Object} backup - Backup to restore from
   * @returns {Boolean} Whether restore was successful
   */
  restoreFromBackup(backup) {
      if (!backup) return false;
      
      try {
          // Restore all state properties
          Object.keys(backup).forEach(key => {
              // Skip internal properties
              if (key.startsWith('_')) return;
              
              this.set(key, backup[key]);
          });
          
          return true;
      } catch (error) {
          console.error("Error restoring from backup:", error);
          return false;
      }
  },

  /**
   * Get state change history
   * @returns {Array} State change history
   */
  getStateChangeHistory() {
      return [...this.stateChangeHistory];
  },

  /**
   * Clear state change history
   */
  clearStateChangeHistory() {
      this.stateChangeHistory.length = 0;
  },

  /**
   * Get full state (for debugging)
   * @returns {Object} Full state
   */
  getFullState() {
      return JSON.parse(JSON.stringify(this.data));
  },
  
  /**
   * Subscribe to state changes with a callback function
   * @param {Function} callback - Function to call on state change
   * @returns {Function} Function to unsubscribe
   */
  subscribe(callback) {
      return this.addListener('*', callback);
  }
};