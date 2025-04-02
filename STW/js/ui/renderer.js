import { GameState } from '../core/state.js';

export function initRenderer() {
  // Example of using the new API with the original subscribe method
  const unsubscribe = GameState.subscribe((state) => {
    // Update health bar width - use the new API
    const healthPercent = (GameState.get('player.health') / GameState.get('player.maxHealth')) * 100;
    document.getElementById('player-health-bar').style.width = `${healthPercent}%`;

    // Update active screen
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.toggle('active', screen.id === `${GameState.get('currentScreen')}-screen`);
    });
  });

  // Cleanup on game exit
  return unsubscribe;
}