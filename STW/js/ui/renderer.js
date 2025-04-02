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
// Add to js/ui/renderer.js

// Update buff display
function updateBuffs(target, buffs) {
  const targetElement = document.getElementById(`${target}-buffs`);
  if (!targetElement) return;
  
  // Clear current buffs
  targetElement.innerHTML = '';
  
  // Add each buff
  buffs.forEach(buff => {
    const buffIcon = document.createElement('div');
    buffIcon.className = `buff-icon ${buff.type}`;
    
    // Set appropriate icon based on buff type
    switch(buff.type) {
      case "focused": buffIcon.textContent = "✦"; break;
      case "defense": buffIcon.textContent = "🛡️"; break;
      case "stunned": buffIcon.textContent = "💫"; break;
      case "poison": buffIcon.textContent = "☠️"; break;
      default: buffIcon.textContent = "⚡"; break;
    }
    
    // Add turns indicator
    const turns = document.createElement('span');
    turns.className = 'turns';
    turns.textContent = buff.turns;
    buffIcon.appendChild(turns);
    
    // Add tooltip with description
    let tooltipText = '';
    switch(buff.type) {
      case "focused":
        tooltipText = `Focused\nIncreases damage and healing by 20%\nRemaining: ${buff.turns} turn${buff.turns !== 1 ? 's' : ''}`;
        break;
      case "defense":
        tooltipText = `Defense\nReduces incoming damage by 50%\nRemaining: ${buff.turns} turn${buff.turns !== 1 ? 's' : ''}`;
        break;
      case "stunned":
        tooltipText = `Stunned\nCannot take actions this turn\nRemaining: ${buff.turns} turn${buff.turns !== 1 ? 's' : ''}`;
        break;
      case "poison":
        tooltipText = `Poison\nTaking ${buff.damage} damage per turn\nRemaining: ${buff.turns} turn${buff.turns !== 1 ? 's' : ''}`;
        break;
      default:
        tooltipText = `${buff.type}\nRemaining: ${buff.turns} turn${buff.turns !== 1 ? 's' : ''}`;
        break;
    }
    
    buffIcon.setAttribute('data-tooltip', tooltipText);
    
    // Append to container
    targetElement.appendChild(buffIcon);
  });
}