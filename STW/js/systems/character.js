import { GameState } from '../core/state.js';
import { EventBus } from '../core/events.js';
import { GEM_TYPES, PROGRESSION } from '../core/config.js';

export function initCharacterSelect() {
  console.log("Initializing character select...");
  
  // Add class selection click handlers
  setupClassButtons();
  
  // Add character information display
  createClassInfoDisplay();
  
  // Add character select title if not present
  addCharacterSelectTitle();
}

function setupClassButtons() {
  // Knight selection
  const knightBtn = document.getElementById('knight-btn');
  if (knightBtn) {
    // Remove existing listeners to prevent duplicates
    const newKnightBtn = knightBtn.cloneNode(true);
    knightBtn.parentNode.replaceChild(newKnightBtn, knightBtn);
    newKnightBtn.addEventListener('click', () => selectClass('Knight'));
    newKnightBtn.addEventListener('mouseover', () => showClassInfo('Knight'));
  }
  
  // Mage selection
  const mageBtn = document.getElementById('mage-btn');
  if (mageBtn) {
    const newMageBtn = mageBtn.cloneNode(true);
    mageBtn.parentNode.replaceChild(newMageBtn, mageBtn);
    newMageBtn.addEventListener('click', () => selectClass('Mage'));
    newMageBtn.addEventListener('mouseover', () => showClassInfo('Mage'));
  }
  
  // Rogue selection
  const rogueBtn = document.getElementById('rogue-btn');
  if (rogueBtn) {
    const newRogueBtn = rogueBtn.cloneNode(true);
    rogueBtn.parentNode.replaceChild(newRogueBtn, rogueBtn);
    newRogueBtn.addEventListener('click', () => selectClass('Rogue'));
    newRogueBtn.addEventListener('mouseover', () => showClassInfo('Rogue'));
  }
}

function selectClass(className) {
  console.log(`Selected class: ${className}`);
  
  // Reset game state for new character
  resetGameState();
  
  // Update state with class-specific stats
  switch(className) {
    case 'Knight':
      GameState.update({
        player: {
          class: 'Knight',
          gemBonus: { red: 1.5 }, // 50% damage boost to red gems
          health: PROGRESSION.maxHealth.Knight,
          maxHealth: PROGRESSION.maxHealth.Knight,
          stamina: PROGRESSION.baseStamina,
          baseStamina: PROGRESSION.baseStamina,
          race: 'Human', // Default race
          persona: 'Warrior' // Default persona
        }
      });
      break;
      
    case 'Mage':
      GameState.update({
        player: {
          class: 'Mage',
          gemBonus: { blue: 1.5 }, // 50% damage boost to blue gems
          health: PROGRESSION.maxHealth.Mage,
          maxHealth: PROGRESSION.maxHealth.Mage,
          stamina: PROGRESSION.baseStamina + 1, // Mages get extra stamina
          baseStamina: PROGRESSION.baseStamina + 1,
          race: 'Human', // Default race
          persona: 'Scholar' // Default persona
        }
      });
      break;
      
    case 'Rogue':
      GameState.update({
        player: {
          class: 'Rogue',
          gemBonus: { green: 1.5 }, // 50% damage boost to green gems
          health: PROGRESSION.maxHealth.Rogue,
          maxHealth: PROGRESSION.maxHealth.Rogue,
          stamina: PROGRESSION.baseStamina,
          baseStamina: PROGRESSION.baseStamina,
          race: 'Human', // Default race
          persona: 'Trickster' // Default persona
        }
      });
      break;
  }
  
  // Initialize starting gems based on class
  initializeGemBag(className);
  
  // Begin game by going to battle screen
  EventBus.emit('SCREEN_CHANGE', { screen: 'battle' });
}

function resetGameState() {
  // Reset necessary parts of game state
  GameState.update({
    battle: {
      phase: 'Dawn',
      day: 1,
      turn: 'player',
      enemy: null,
      completed: false
    },
    // Reset player's progress but preserve class
    player: {
      // Class will be set by selectClass
      health: 30,
      maxHealth: 30,
      stamina: PROGRESSION.baseStamina,
      baseStamina: PROGRESSION.baseStamina,
      zenny: 0,
      gemBag: [],
      hand: [],
      buffs: {
        shield: 0,
        shieldTurns: 0
      }
    }
  });
}

function initializeGemBag(className) {
  // Create starting gems based on class
  const startingGems = [];
  
  // All classes get some basic gems
  // We'll add multiple attack gems and other basic gems
  
  // Add class-specific attack gems
  const classColor = getClassColor(className);
  
  // Add 3 attack gems of the class color
  for (let i = 0; i < 3; i++) {
    startingGems.push({
      type: 'ATTACK',
      level: 1,
      color: classColor
    });
  }
  
  // Add 1 off-color attack gem
  const offColors = ['red', 'blue', 'green'].filter(color => color !== classColor);
  startingGems.push({
    type: 'ATTACK',
    level: 1,
    color: offColors[Math.floor(Math.random() * offColors.length)]
  });
  
  // Add focus gem for stamina recovery (all classes)
  startingGems.push({
    type: 'FOCUS',
    level: 1,
    color: 'grey'
  });
  
  // Add class-specific special gems
  switch(className) {
    case 'Knight':
      // Knights get shield gem
      startingGems.push({ type: 'SHIELD', level: 1, color: 'grey' });
      break;
      
    case 'Mage':
      // Mages get heal gem
      startingGems.push({ type: 'HEAL', level: 1, color: 'blue' });
      break;
      
    case 'Rogue':
      // Rogues get poison gem
      startingGems.push({ type: 'POISON', level: 1, color: 'green' });
      break;
  }
  
  // Set gems in player state
  GameState.setState('player.gemBag', startingGems);
  
  console.log(`Initialized ${startingGems.length} gems for ${className}`);
}

function getClassColor(className) {
  switch(className) {
    case 'Knight': return 'red';
    case 'Mage': return 'blue';
    case 'Rogue': return 'green';
    default: return 'grey';
  }
}

function createClassInfoDisplay() {
  const selectScreen = document.getElementById('character-select-screen');
  
  if (selectScreen) {
    // Check if info container already exists
    if (!document.getElementById('class-info')) {
      const infoContainer = document.createElement('div');
      infoContainer.id = 'class-info';
      infoContainer.style.marginTop = '30px';
      infoContainer.style.maxWidth = '600px';
      infoContainer.style.padding = '20px';
      infoContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
      infoContainer.style.color = 'white';
      infoContainer.style.borderRadius = '8px';
      infoContainer.style.textAlign = 'left';
      infoContainer.style.display = 'none'; // Hidden initially
      
      // Create class info content
      infoContainer.innerHTML = `
        <h2 id="info-class-name" style="margin-bottom: 10px; color: #ffcc00;">Select a Class</h2>
        <p id="info-class-description" style="margin-bottom: 15px; line-height: 1.4;">Choose one of the three classes to begin your journey.</p>
        
        <div id="info-class-stats" style="margin-top: 15px; display: grid; grid-template-columns: auto auto; gap: 10px;">
          <div><strong>Health:</strong> <span id="info-health">-</span></div>
          <div><strong>Stamina:</strong> <span id="info-stamina">-</span></div>
          <div><strong>Specialty:</strong> <span id="info-specialty">-</span></div>
          <div><strong>Starting Gems:</strong> <span id="info-gems">-</span></div>
        </div>
        
        <div id="info-class-lore" style="margin-top: 20px; font-style: italic; color: #cccccc;">
          <p id="info-lore">Hover over a class to see details.</p>
        </div>
      `;
      
      selectScreen.appendChild(infoContainer);
    }
  }
}

function addCharacterSelectTitle() {
  const selectScreen = document.getElementById('character-select-screen');
  
  if (selectScreen && !document.getElementById('character-select-title')) {
    const title = document.createElement('h1');
    title.id = 'character-select-title';
    title.textContent = 'Choose Your Class';
    title.style.marginBottom = '40px';
    title.style.fontSize = '32px';
    title.style.color = '#ffcc00';
    title.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)';
    
    // Insert at the beginning of the select screen
    selectScreen.insertBefore(title, selectScreen.firstChild);
  }
}

function showClassInfo(className) {
  const infoContainer = document.getElementById('class-info');
  const classNameElem = document.getElementById('info-class-name');
  const descriptionElem = document.getElementById('info-class-description');
  const healthElem = document.getElementById('info-health');
  const staminaElem = document.getElementById('info-stamina');
  const specialtyElem = document.getElementById('info-specialty');
  const gemsElem = document.getElementById('info-gems');
  const loreElem = document.getElementById('info-lore');
  
  if (!infoContainer || !classNameElem || !descriptionElem) {
    return;
  }
  
  // Make info visible
  infoContainer.style.display = 'block';
  
  // Set class-specific information
  classNameElem.textContent = className;
  
  // Set class color
  const classColor = getClassColor(className);
  const colorMap = {
    red: '#ff5555',
    blue: '#5555ff',
    green: '#55cc55'
  };
  classNameElem.style.color = colorMap[classColor] || '#ffcc00';
  
  switch(className) {
    case 'Knight':
      descriptionElem.textContent = 'Stout, melee-focused, and protective. Knights excel in close-quarters combat with high durability and defensive abilities.';
      healthElem.textContent = PROGRESSION.maxHealth.Knight;
      staminaElem.textContent = PROGRESSION.baseStamina;
      specialtyElem.textContent = '50% bonus to Red gems';
      gemsElem.textContent = 'Attack, Shield, Focus';
      loreElem.textContent = 'Knights are trained from childhood in the art of war. They stand as the bulwark between civilization and the forces of darkness, protecting the innocent with their strength and courage.';
      break;
      
    case 'Mage':
      descriptionElem.textContent = 'Versatile but fragile, with powerful ranged spells. Mages master elemental magic and strategic abilities, controlling the battlefield from a distance.';
      healthElem.textContent = PROGRESSION.maxHealth.Mage;
      staminaElem.textContent = PROGRESSION.baseStamina + 1;
      specialtyElem.textContent = '50% bonus to Blue gems';
      gemsElem.textContent = 'Attack, Heal, Focus';
      loreElem.textContent = 'Mages dedicate their lives to the study of arcane arts. Through discipline and intellect, they harness the fundamental forces of reality, bending them to their will.';
      break;
      
    case 'Rogue':
      descriptionElem.textContent = 'Nimble, evasive, and deadly. Rogues excel in speed, stealth, and precision strikes, overwhelming enemies with rapid attacks.';
      healthElem.textContent = PROGRESSION.maxHealth.Rogue;
      staminaElem.textContent = PROGRESSION.baseStamina;
      specialtyElem.textContent = '50% bonus to Green gems';
      gemsElem.textContent = 'Attack, Poison, Focus';
      loreElem.textContent = 'Rogues live in the shadows, mastering the arts of stealth and subterfuge. They strike when least expected, using speed and cunning rather than brute force to overcome obstacles.';
      break;
  }
}

// Export additional functions for testing
export { selectClass, showClassInfo };