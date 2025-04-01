import { GameState } from '../core/state.js';

export function initRenderer() {
  const unsubscribe = GameState.subscribe((state) => {
    // Update health bar width
    const healthPercent = (state.player.health / state.player.maxHealth) * 100;
    document.getElementById('player-health-bar').style.width = `${healthPercent}%`;

    // Update active screen
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.toggle('active', screen.id === `${state.currentScreen}-screen`);
    });
  });

  // Cleanup on game exit
  return unsubscribe;
}