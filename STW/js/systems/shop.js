import { GameState } from '../core/state.js';
import { EventBus } from '../core/events.js';
import { GEM_TYPES } from '../core/config.js';

// Shop system for upgrading gems and restoring stamina
export function initShop() {
  console.log("Initializing shop...");
  
  // Create shop UI if it doesn't exist
  createShopUI();
  
  // Set up shop event handlers
  setupShopControls();
  
  // Display player's gems and zenny
  updateShopDisplay();
}

function createShopUI() {
  const shopScreen = document.getElementById('shop-screen');
  if (!shopScreen) return;
  
  // Only create UI if it doesn't already exist
  if (shopScreen.children.length === 0) {
    // Shop title
    const shopTitle = document.createElement('h1');
    shopTitle.textContent = 'Gem Shop';
    shopTitle.style.marginBottom = '20px';
    shopTitle.style.color = '#ffcc00';
    
    // Zenny display
    const zennyDisplay = document.createElement('div');
    zennyDisplay.id = 'shop-zenny';
    zennyDisplay.className = 'zenny-display';
    zennyDisplay.style.fontSize = '1.5em';
    zennyDisplay.style.marginBottom = '20px';
    zennyDisplay.innerHTML = '<span id="zenny-amount">0</span> <span style="color: #ffcc00;">ZENNY</span>';
    
    // Shop sections container
    const shopContainer = document.createElement('div');
    shopContainer.className = 'shop-container';
    shopContainer.style.display = 'flex';
    shopContainer.style.flexDirection = 'column';
    shopContainer.style.gap = '20px';
    shopContainer.style.alignItems = 'center';
    
    // Player's hand section
    const handSection = document.createElement('div');
    handSection.className = 'shop-section';
    handSection.innerHTML = `
      <h2>Your Gems</h2>
      <p class="shop-instruction">Select a gem to upgrade</p>
      <div id="shop-hand" class="gem-container"></div>
    `;
    
    // Upgrade options section
    const upgradeSection = document.createElement('div');
    upgradeSection.className = 'shop-section';
    upgradeSection.innerHTML = `
      <h2>Upgrade Options</h2>
      <p class="shop-instruction">Choose an upgrade (costs Zenny)</p>
      <div id="upgrade-options" class="gem-container"></div>
    `;
    
    // Stamina restore section
    const staminaSection = document.createElement('div');
    staminaSection.className = 'shop-section';
    staminaSection.innerHTML = `
      <h2>Restore Stamina</h2>
      <p>Current Stamina: <span id="shop-stamina">3/3</span></p>
      <button id="restore-stamina-btn" class="btn-shop">Restore Stamina (10 Zenny)</button>
    `;
    
    // Continue button
    const continueBtn = document.createElement('button');
    continueBtn.id = 'continue-btn';
    continueBtn.className = 'btn-large';
    continueBtn.textContent = 'Continue Journey';
    continueBtn.style.marginTop = '30px';
    
    // Add all elements to shop screen
    shopContainer.appendChild(handSection);
    shopContainer.appendChild(upgradeSection);
    shopContainer.appendChild(staminaSection);
    
    shopScreen.appendChild(shopTitle);
    shopScreen.appendChild(zennyDisplay);
    shopScreen.appendChild(shopContainer);
    shopScreen.appendChild(continueBtn);
    
    // Add some base styles
    const shopSections = shopScreen.querySelectorAll('.shop-section');
    shopSections.forEach(section => {
      section.style.backgroundColor = 'rgba(0,0,0,0.7)';
      section.style.padding = '20px';
      section.style.borderRadius = '8px';
      section.style.width = '80%';
      section.style.maxWidth = '600px';
    });
    
    const gemContainers = shopScreen.querySelectorAll('.gem-container');
    gemContainers.forEach(container => {
      container.style.display = 'flex';
      container.style.flexWrap = 'wrap';
      container.style.justifyContent = 'center';
      container.style.gap = '10px';
      container.style.marginTop = '15px';
      container.style.minHeight = '120px';
    });
  }
}

function setupShopControls() {
  // Set up continue button
  const continueBtn = document.getElementById('continue-btn');
  if (continueBtn) {
    // Remove existing listeners to prevent duplicates
    const newBtn = continueBtn.cloneNode(true);
    continueBtn.parentNode.replaceChild(newBtn, continueBtn);
    newBtn.addEventListener('click', continueBattle);
  }
  
  // Set up restore stamina button
  const restoreBtn = document.getElementById('restore-stamina-btn');
  if (restoreBtn) {
    const newRestoreBtn = restoreBtn.cloneNode(true);
    restoreBtn.parentNode.replaceChild(newRestoreBtn, restoreBtn);
    newRestoreBtn.addEventListener('click', restoreStamina);
  }
}

function updateShopDisplay() {
  // Update zenny display
  const zennyElem = document.getElementById('zenny-amount');
  if (zennyElem) {
    zennyElem.textContent = GameState.data.player.zenny || 0;
  }
  
  // Update stamina display
  const staminaElem = document.getElementById('shop-stamina');
  if (staminaElem) {
    const player = GameState.data.player;
    staminaElem.textContent = `${player.stamina}/${player.baseStamina}`;
  }
  
  // Display player's current gems
  displayPlayerGems();
}

function displayPlayerGems() {
  const handContainer = document.getElementById('shop-hand');
  if (!handContainer) return;
  
  // Clear current display
  handContainer.innerHTML = '';
  
  // Get player's gem bag
  const gemBag = GameState.data.player.gemBag || [];
  
  if (gemBag.length === 0) {
    const message = document.createElement('p');
    message.textContent = 'No gems available';
    message.style.fontStyle = 'italic';
    handContainer.appendChild(message);
    return;
  }
  
  // Create a gem element for each gem in the bag
  gemBag.forEach((gem, index) => {
    const gemType = GEM_TYPES[gem.type];
    if (!gemType) return;
    
    // Create modified gemType with custom color
    const customGemType = { 
      ...gemType, 
      color: gem.color || gemType.color,
      level: gem.level || 1
    };
    
    // Create gem element
    const gemElement = createShopGemElement(customGemType, index);
    handContainer.appendChild(gemElement);
  });
}

function createShopGemElement(gemType, index) {
  const gem = document.createElement('div');
  
  // Set class based on gem color
  const gemColor = gemType.color || 'red';
  gem.className = `gem ${gemColor}`;
  
  // Apply smaller size for shop
  gem.style.width = '90px';
  gem.style.height = '90px';
  
  // Store gem data
  gem.dataset.index = index;
  gem.dataset.type = gemType.name;
  gem.dataset.color = gemColor;
  gem.dataset.level = gemType.level || 1;
  
  // Add class bonus indicator if applicable
  const player = GameState.data.player;
  if (player?.gemBonus?.[gemColor] > 1) {
    gem.classList.add('class-bonus');
  }
  
  // Show gem level
  const levelDisplay = gemType.level > 1 ? ` (Lvl ${gemType.level})` : '';
  
  // Create gem content
  gem.innerHTML = `
    <div class="gem-content">
      <div class="gem-icon">${gemType.icon}</div>
      <div class="gem-name">${gemType.name}${levelDisplay}</div>
    </div>
  `;
  
  // Add tooltip
  gem.setAttribute('data-tooltip', getGemShopDescription(gemType));
  
  // Add click handler
  gem.addEventListener('click', () => {
    selectGemForUpgrade(gemType, index);
  });
  
  return gem;
}

function getGemShopDescription(gemType) {
  let description = gemType.description || `${gemType.name} Gem`;
  
  // Add level info
  if (gemType.level > 1) {
    description += ` (Level ${gemType.level})`;
  }
  
  // Add upgrade hint
  description += '\nClick to see upgrade options.';
  
  return description;
}

function selectGemForUpgrade(gemType, index) {
  console.log(`Selected gem for upgrade: ${gemType.name} (index: ${index})`);
  
  // Highlight selected gem
  const gems = document.querySelectorAll('#shop-hand .gem');
  gems.forEach(g => g.classList.remove('selected'));
  
  const selectedGem = document.querySelector(`#shop-hand .gem[data-index="${index}"]`);
  if (selectedGem) {
    selectedGem.classList.add('selected');
  }
  
  // Show upgrade options
  displayUpgradeOptions(gemType, index);
}

function displayUpgradeOptions(gemType, index) {
  const upgradeContainer = document.getElementById('upgrade-options');
  if (!upgradeContainer) return;
  
  // Clear current options
  upgradeContainer.innerHTML = '';
  
  // Get gem level
  const level = gemType.level || 1;
  
  // Calculate upgrade cost
  const upgradeCost = calculateUpgradeCost(gemType, level);
  
  // Create upgraded version of the gem
  const upgradedGem = { ...gemType, level: level + 1 };
  
  // Enhance stats based on gem type
  enhanceGemStats(upgradedGem);
  
  // Create upgrade option
  const upgradeElement = document.createElement('div');
  upgradeElement.className = 'upgrade-option';
  upgradeElement.style.textAlign = 'center';
  
  // Create gem display
  const gemDisplay = createShopGemElement(upgradedGem, -1);
  gemDisplay.style.margin = '0 auto 10px auto';
  gemDisplay.classList.remove('selected');
  gemDisplay.style.pointerEvents = 'none';
  
  // Create cost and button
  const costButton = document.createElement('button');
  costButton.className = 'btn-shop';
  costButton.textContent = `Upgrade (${upgradeCost} Zenny)`;
  costButton.disabled = GameState.data.player.zenny < upgradeCost;
  
  costButton.addEventListener('click', () => {
    upgradeGem(index, upgradedGem, upgradeCost);
  });
  
  // Add to container
  upgradeElement.appendChild(gemDisplay);
  upgradeElement.appendChild(costButton);
  upgradeContainer.appendChild(upgradeElement);
}

function enhanceGemStats(gem) {
  // Update gem stats based on type and new level
  switch(gem.type || gem.name) {
    case 'Attack':
      // Increase damage for attack gems
      if (gem.colors) {
        Object.keys(gem.colors).forEach(color => {
          gem.colors[color] = Math.floor(gem.colors[color] * 1.5);
        });
      }
      break;
      
    case 'Heal':
      // Increase healing amount
      gem.effect = Math.floor(gem.effect * 1.5);
      break;
      
    case 'Shield':
      // Increase shield value and duration
      gem.defense = Math.floor(gem.defense * 1.4);
      gem.duration += 1;
      break;
      
    case 'Focus':
      // Increase stamina gain
      gem.staminaGain += 1;
      break;
      
    case 'Poison':
      // Increase poison damage and duration
      gem.damage += 1;
      gem.duration += 1;
      break;
  }
  
  return gem;
}

function calculateUpgradeCost(gemType, level) {
  // Base cost is 10 zenny
  let baseCost = 10;
  
  // Multiply by level
  let cost = baseCost * level;
  
  // Special gems cost more
  if (gemType.name === 'Shield' || gemType.name === 'Heal' || gemType.name === 'Poison') {
    cost *= 1.5;
  }
  
  return Math.floor(cost);
}

function upgradeGem(index, upgradedGem, cost) {
  // Check if player has enough zenny
  const currentZenny = GameState.data.player.zenny || 0;
  if (currentZenny < cost) {
    alert('Not enough Zenny!');
    return;
  }
  
  // Get current gem bag
  const gemBag = [...(GameState.data.player.gemBag || [])];
  
  // Replace the gem at index with upgraded version
  gemBag[index] = {
    type: upgradedGem.type || upgradedGem.name,
    color: upgradedGem.color,
    level: upgradedGem.level
  };
  
  // Update player state
  GameState.setState('player.gemBag', gemBag);
  GameState.setState('player.zenny', currentZenny - cost);
  
  // Show upgrade effect
  showUpgradeEffect();
  
  // Update shop display
  updateShopDisplay();
}

function restoreStamina() {
  const player = GameState.data.player;
  const staminaCost = 10;
  
  // Check if stamina is already full
  if (player.stamina >= player.baseStamina) {
    alert('Stamina is already full!');
    return;
  }
  
  // Check if player has enough zenny
  if (player.zenny < staminaCost) {
    alert('Not enough Zenny!');
    return;
  }
  
  // Restore stamina and deduct cost
  GameState.setState('player.stamina', player.baseStamina);
  GameState.setState('player.zenny', player.zenny - staminaCost);
  
  // Show restoration effect
  showRestoreEffect();
  
  // Update shop display
  updateShopDisplay();
}

function showUpgradeEffect() {
  // Create visual effect for gem upgrade
  const effect = document.createElement('div');
  effect.textContent = 'GEM UPGRADED!';
  effect.style.position = 'fixed';
  effect.style.top = '50%';
  effect.style.left = '50%';
  effect.style.transform = 'translate(-50%, -50%)';
  effect.style.color = '#ffcc00';
  effect.style.fontSize = '2em';
  effect.style.fontWeight = 'bold';
  effect.style.textShadow = '0 0 10px rgba(255, 204, 0, 0.7)';
  effect.style.animation = 'pulsate 2s';
  effect.style.zIndex = '1000';
  
  document.body.appendChild(effect);
  setTimeout(() => effect.remove(), 2000);
}

function showRestoreEffect() {
  // Create visual effect for stamina restoration
  const effect = document.createElement('div');
  effect.textContent = 'STAMINA RESTORED!';
  effect.style.position = 'fixed';
  effect.style.top = '50%';
  effect.style.left = '50%';
  effect.style.transform = 'translate(-50%, -50%)';
  effect.style.color = '#55cc55';
  effect.style.fontSize = '2em';
  effect.style.fontWeight = 'bold';
  effect.style.textShadow = '0 0 10px rgba(85, 204, 85, 0.7)';
  effect.style.animation = 'pulsate 2s';
  effect.style.zIndex = '1000';
  
  document.body.appendChild(effect);
  setTimeout(() => effect.remove(), 2000);
}

function continueBattle() {
  console.log('Continuing to next battle...');
  
  // Progress to next phase or day
  progressGamePhase();
  
  // Return to battle screen
  EventBus.emit('SCREEN_CHANGE', { screen: 'battle' });
}

function progressGamePhase() {
  // Get current phase and day
  let currentPhase = GameState.data.battle.phase;
  let currentDay = GameState.data.battle.day || 1;
  
  // Get phase index
  const phaseIndex = PHASES.indexOf(currentPhase);
  
  if (phaseIndex === -1) {
    // If phase not found, reset to Dawn
    GameState.setState('battle.phase', 'Dawn');
  } else if (phaseIndex === PHASES.length - 1) {
    // If at last phase (Dark), move to next day and reset to Dawn
    GameState.setState('battle.day', currentDay + 1);
    GameState.setState('battle.phase', 'Dawn');
  } else {
    // Otherwise, move to next phase
    GameState.setState('battle.phase', PHASES[phaseIndex + 1]);
  }
}

// Export functions for accessibility
export { updateShopDisplay, continueBattle, restoreStamina };