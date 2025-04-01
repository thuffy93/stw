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
  
    // Update state and notify listeners
    setState(key, value) {
      const keys = key.split('.');
      let obj = this.data;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) {
          obj[keys[i]] = {};
        }
        obj = obj[keys[i]];
      }
      
      obj[keys[keys.length - 1]] = value;
    // Auto-update health bars
    if (key === 'player.health' || key === 'player.maxHealth') {
        updateHealthBar('player');
    }
    if (key.includes('enemy.health')) {
        updateHealthBar('enemy');
    }

      this.notify();
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