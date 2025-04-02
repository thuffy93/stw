// Game state singleton
export const GameState = {
  // Initial state
  data: {
    currentScreen: 'character-select',
    player: {
      class: null,
      health: 30,
      maxHealth: 30,
      stamina: 3,
      baseStamina: 3,
      zenny: 0,
      hand: [],       // Active gems in battle
      gemBag: [],     // All owned gems
      buffs: {
          shield: 0,     // Current shield value
          shieldTurns: 0 // Turns remaining
      }
    },
    battle: {
      phase: 'Dawn',    // Dawn/Dusk/Dark
      day: 1,           // Current day (1-7)
      turn: 'player',   // player/enemy
      enemy: null,      // Current enemy data
      completed: false  // Battle completion flag
    },
    gemCatalog: {
      unlocked: [],     // Unlocked gems for discovery
      available: []     // Gems available to be unlocked
    }
  },

  // State subscribers (for UI updates)
  listeners: [],

  // Deep set state property by path (e.g., 'player.health')
  setState(path, value) {
    const keys = path.split('.');
    let obj = this.data;
    
    // Navigate to the correct nested object
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) {
        obj[keys[i]] = {};
      }
      obj = obj[keys[i]];
    }
    
    // Set the value
    obj[keys[keys.length - 1]] = value;
    
    // Auto-update health bars
    if (path === 'player.health' || path === 'player.maxHealth') {
      this.updateHealthBar('player');
    }
    if (path.includes('enemy.health') || path.includes('enemy.maxHealth')) {
      this.updateHealthBar('enemy');
    }
    
    // Update stamina bar if stamina changed
    if (path === 'player.stamina' || path === 'player.baseStamina') {
      this.updateStaminaBar();
    }

    // Notify listeners of state change
    this.notify();
  },

  // Batch updates (e.g., loading saved games)
  update(updates) {
    // Deep merge updates into data
    this.deepMerge(this.data, updates);
    this.notify();
  },
  
  // Deep merge helper
  deepMerge(target, source) {
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
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
  
  // Update health bar UI
  updateHealthBar(target) {
    const state = this.data;
    const bar = document.getElementById(`${target}-health-bar`);
    
    if (bar) {
      const health = target === 'player' ? state.player.health : state.battle.enemy?.health;
      const maxHealth = target === 'player' ? state.player.maxHealth : state.battle.enemy?.maxHealth;
      
      if (health !== undefined && maxHealth !== undefined) {
        const percent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
        bar.style.width = `${percent}%`;
        
        // Update text display if exists
        const textElem = document.getElementById(`${target}-health`);
        if (textElem) textElem.textContent = health;
      }
    }
  },
  
  // Update stamina bar UI
  updateStaminaBar() {
    const staminaFill = document.getElementById('stamina-fill');
    const staminaText = document.getElementById('stamina-text');
    
    if (staminaFill && staminaText) {
      const { stamina, baseStamina } = this.data.player;
      const percent = (stamina / baseStamina) * 100;
      
      staminaFill.style.width = `${percent}%`;
      staminaText.textContent = `${stamina}/${baseStamina}`;
      
      // Update stamina bar color based on value
      if (percent >= 66) {
        staminaFill.className = 'full';
      } else if (percent >= 33) {
        staminaFill.className = 'medium';
      } else {
        staminaFill.className = 'low';
      }
    }
  }
};