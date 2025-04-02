import { GameState } from '../core/state.js';
import { EventBus } from '../core/events.js';

export function initCharacterSelect() {
  // Knight selection
  document.getElementById('knight-btn').addEventListener('click', () => {
    // Use resetPlayerStats which handles all these updates in one call:
    GameState.resetPlayerStats('Knight');
    
    EventBus.emit('SCREEN_CHANGE', { screen: 'battle' });
  });
  
  // Update other character selection handlers similarly
  document.getElementById('mage-btn').addEventListener('click', () => {
    GameState.resetPlayerStats('Mage');
    EventBus.emit('SCREEN_CHANGE', { screen: 'battle' });
  });
  
  document.getElementById('rogue-btn').addEventListener('click', () => {
    GameState.resetPlayerStats('Rogue');
    EventBus.emit('SCREEN_CHANGE', { screen: 'battle' });
  });
}