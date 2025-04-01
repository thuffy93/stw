import { GameState } from '../core/state.js';
import { EventBus } from '../core/events.js';

export function initCharacterSelect() {
  // Knight selection
  document.getElementById('knight-btn').addEventListener('click', () => {
    GameState.update({
      player: {
        class: 'Knight',
        gemBonus: { red: 1.5 }, // 50% damage boost to red gems
        health: 40,
        maxHealth: 40,
        baseStamina: 3
      }
    });
    EventBus.emit('SCREEN_CHANGE', { screen: 'battle' });
  });
  document.getElementById('mage-btn').addEventListener('click', () => {
    GameState.update({
      player: {
        class: 'Mage',
        gemBonus: { blue: 1.5 }, // 50% damage boost to blue gems
        health: 30,
        maxHealth: 30,
        baseStamina: 4
      }
    });
    EventBus.emit('SCREEN_CHANGE', { screen: 'battle' });
  });
  document.getElementById('rogue-btn').addEventListener('click', () => {
    GameState.update({
      player: {
        class: 'Rogue',
        gemBonus: { green: 1.5 }, // 50% damage boost to green gems
        health: 25,
        maxHealth: 25,
        baseStamina: 3
      }
    });
    EventBus.emit('SCREEN_CHANGE', { screen: 'battle' });
  });
}