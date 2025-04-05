// GemRenderer.js - Specialized module for gem rendering
import { GameState } from '../core/state.js';
import { EventBus } from '../core/eventbus.js';
import { Config } from '../core/config.js';

/**
 * Initialize the GemRenderer
 */
export function initialize() {
  console.log("Initializing GemRenderer");
  return true;
}

/**
 * Update gem display in the UI
 * @param {Object} gems - Gem collections data
 * @param {Set} selectedGems - Set of selected gem indices
 */
export function updateGemDisplay(gems, selectedGems) {
  // Update gem bag info
  const gemBagCount = document.getElementById('gem-bag-count');
  const gemBagTotal = document.getElementById('gem-bag-total');
  const gemBagCount2 = document.getElementById('gem-bag-count2');
  const gemBagTotal2 = document.getElementById('gem-bag-total2');
  
  if (gemBagCount) gemBagCount.textContent = gems.gemBag.length;
  if (gemBagTotal) gemBagTotal.textContent = "20"; // MAX_GEM_BAG_SIZE
  if (gemBagCount2) gemBagCount2.textContent = gems.gemBag.length;
  if (gemBagTotal2) gemBagTotal2.textContent = "20"; // MAX_GEM_BAG_SIZE
  
  // Render hand
  renderHand(gems.hand, selectedGems);
}

/**
 * Render the hand of gems
 * @param {Array} hand - Hand of gems (optional, will be fetched if not provided)
 * @param {Set} selectedGems - Set of selected gem indices (optional)
 */
export function renderHand(hand, selectedGems) {
  // Get data if not provided
  if (!hand) hand = GameState.get('hand');
  if (!selectedGems) selectedGems = GameState.get('selectedGems');
  
  const handContainer = document.getElementById('hand');
  if (!handContainer) return;
  
  // Clear current hand
  handContainer.innerHTML = '';
  
  // Add each gem
  if (Array.isArray(hand) && hand.length > 0) {
    hand.forEach((gem, index) => {
      const isSelected = selectedGems.has(index);
      const gemElement = createGemElement(gem, index, isSelected);
      
      // Add click handler for battle context
      gemElement.addEventListener('click', () => {
        EventBus.emit('GEM_SELECT', { index });
      });
      
      handContainer.appendChild(gemElement);
    });
  } else {
    console.log("Hand is empty or not an array:", hand);
  }
}

/**
 * Render gems in shop hand
 */
export function renderShopHand() {
  const hand = GameState.get('hand');
  const selectedGems = GameState.get('selectedGems');
  
  const shopHandContainer = document.getElementById('shop-hand');
  if (!shopHandContainer) return;
  
  // Clear current hand
  shopHandContainer.innerHTML = '';
  
  // Add each gem
  if (Array.isArray(hand) && hand.length > 0) {
    hand.forEach((gem, index) => {
      const isSelected = selectedGems.has(index);
      const gemElement = createGemElement(gem, index, isSelected);
      
      // Add click handler specifically for shop context
      gemElement.addEventListener('click', () => {
        EventBus.emit('GEM_SELECT', { index, context: 'shop' });
      });
      
      shopHandContainer.appendChild(gemElement);
    });
  } else {
    console.log("Shop hand is empty or not an array:", hand);
  }
}

/**
 * Create a gem element for the UI
 * @param {Object} gem - Gem data
 * @param {Number} index - Index in hand
 * @param {Boolean} isSelected - Whether the gem is selected
 * @returns {HTMLElement} Gem element
 */
export function createGemElement(gem, index, isSelected = false) {
  if (!gem || typeof gem !== 'object' || !gem.color || !gem.name) {
    console.error("Invalid gem object:", gem);
    return document.createElement("div"); // Return empty div for invalid gems
  }

  const gemElement = document.createElement("div");
  gemElement.className = `gem ${gem.color}`;
  
  // Check for class bonus
  const playerClass = GameState.get('player.class');
  const hasBonus = (playerClass === "Knight" && gem.color === "red") ||
                 (playerClass === "Mage" && gem.color === "blue") ||
                 (playerClass === "Rogue" && gem.color === "green");
  
  if (hasBonus) {
    gemElement.classList.add("class-bonus");
  }
  
  // Check for proficiency - more robust check for the proficiency structure
  let isUnlearned = false;
  try {
    const gemKey = `${gem.color}${gem.name.replace(/\s+/g, '')}`;
    const gemProficiency = GameState.get('gemProficiency') || {};
    
    // Check if the gem is unlearned
    isUnlearned = gemProficiency[gemKey] && 
                 gemProficiency[gemKey].failureChance > 0.1;
  } catch (e) {
    console.error("Error checking gem proficiency:", e);
  }
  
  if (isUnlearned) {
    gemElement.classList.add("unlearned");
  }
  
  // Add selected class if selected
  if (isSelected) {
    gemElement.classList.add("selected");
  }
  
  // Create content structure
  const gemContent = document.createElement("div");
  gemContent.className = "gem-content";
  
  // Add icon
  const gemIcon = document.createElement("div");
  gemIcon.className = "gem-icon";
  gemIcon.textContent = getGemSymbol(gem);
  gemContent.appendChild(gemIcon);
  
  // Add value
  if (gem.damage || gem.heal || gem.poison) {
    const gemValue = document.createElement("div");
    gemValue.className = "gem-value";
    gemValue.textContent = gem.damage || gem.heal || gem.poison || "";
    gemContent.appendChild(gemValue);
  }
  
  // Add name (hidden in battle/shop, shown in catalog)
  const gemName = document.createElement("div");
  gemName.className = "gem-name";
  gemName.textContent = gem.name;
  gemContent.appendChild(gemName);
  
  gemElement.appendChild(gemContent);
  
  // Add cost
  const gemCost = document.createElement("div");
  gemCost.className = "gem-cost";
  gemCost.textContent = gem.cost;
  gemElement.appendChild(gemCost);
  
  // Add tooltip
  gemElement.setAttribute("data-tooltip", buildGemTooltip(gem, hasBonus));
  
  return gemElement;
}

/**
 * Get a symbol for a gem
 * @param {Object} gem - Gem data
 * @returns {String} Symbol
 */
export function getGemSymbol(gem) {
  if (gem.shield) return "🛡️";
  if (gem.poison) return "☠️";
  if (gem.damage) {
    if (gem.name.includes("Strong")) return "⚔️";
    if (gem.name.includes("Quick")) return "⚡";
    if (gem.name.includes("Burst")) return "💥";
    return "🗡️";
  }
  if (gem.heal) {
    if (gem.name.includes("Strong")) return "❤️";
    return "💚";
  }
  return "✨";
}

/**
 * Build tooltip text for a gem
 * @param {Object} gem - Gem data
 * @param {Boolean} hasBonus - Whether the gem has a class bonus
 * @returns {String} Tooltip text
 */
export function buildGemTooltip(gem, hasBonus) {
  let tooltip = '';
  
  if (gem.damage) {
    tooltip += `DMG: ${gem.damage}`;
    if (hasBonus) tooltip += ' (+50%)';
  }
  
  if (gem.heal) {
    if (tooltip) tooltip += ' | ';
    tooltip += `HEAL: ${gem.heal}`;
    if (hasBonus) tooltip += ' (+50%)';
  }
  
  if (gem.shield) {
    if (tooltip) tooltip += ' | ';
    tooltip += 'SHIELD';
  }
  
  if (gem.poison) {
    if (tooltip) tooltip += ' | ';
    tooltip += `PSN: ${gem.poison}`;
    if (hasBonus) tooltip += ' (+50%)';
  }
  
  tooltip += ` | (${gem.cost}⚡)`;
  
  return tooltip;
}

/**
 * Update gem selection in UI
 * @param {Array} selectedIndices - Array of selected gem indices
 */
export function updateGemSelection(selectedIndices) {
  const handGems = document.querySelectorAll('#hand .gem');
  const shopGems = document.querySelectorAll('#shop-hand .gem');
  
  // Reset all selections in hand
  handGems.forEach((gemEl) => {
    gemEl.classList.remove('selected');
  });
  
  // Reset all selections in shop
  shopGems.forEach((gemEl) => {
    gemEl.classList.remove('selected');
  });
  
  // Apply new selections
  selectedIndices.forEach(index => {
    // Try to select in hand
    if (index >= 0 && index < handGems.length) {
      handGems[index].classList.add('selected');
    }
    
    // Try to select in shop hand
    if (index >= 0 && index < shopGems.length) {
      shopGems[index].classList.add('selected');
    }
  });
}

/**
 * Render unlocked gems in the gem catalog
 */
export function renderUnlockedGems() {
  const gemCatalog = GameState.get('gemCatalog');
  const playerClass = GameState.get('player.class');
  const unlockedGemsContainer = document.getElementById('unlocked-gems');
  
  if (!unlockedGemsContainer) return;
  
  unlockedGemsContainer.innerHTML = '';
  
  if (!gemCatalog || !gemCatalog.unlocked || !Array.isArray(gemCatalog.unlocked)) {
    console.error("Invalid gem catalog:", gemCatalog);
    return;
  }
  
  // Filter gems by class color appropriateness
  const filteredGems = gemCatalog.unlocked.filter(gemKey => {
    const baseGem = Config.BASE_GEMS[gemKey];
    if (!baseGem) return false;
    
    // Grey gems are universal
    if (baseGem.color === "grey") return true;
    
    // Basic gems (show for all classes)
    const baseGems = ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal"];
    if (baseGems.includes(gemKey)) return true;
    
    // Class-specific color filtering
    const classColors = {
      "Knight": "red",
      "Mage": "blue",
      "Rogue": "green"
    };
    
    return baseGem.color === classColors[playerClass];
  });
  
  // Create gem elements
  filteredGems.forEach(gemKey => {
    const baseGem = Config.BASE_GEMS[gemKey];
    if (!baseGem) return;
    
    // Create a special gem element for the catalog
    const gemElement = document.createElement("div");
    gemElement.className = `gem ${baseGem.color}`;
    
    // Create content structure
    const gemContent = document.createElement("div");
    gemContent.className = "gem-content";
    
    // Add icon
    const gemIcon = document.createElement("div");
    gemIcon.className = "gem-icon";
    gemIcon.textContent = getGemSymbol(baseGem);
    gemContent.appendChild(gemIcon);
    
    // Add value
    if (baseGem.damage || baseGem.heal || baseGem.poison) {
      const gemValue = document.createElement("div");
      gemValue.className = "gem-value";
      gemValue.textContent = baseGem.damage || baseGem.heal || baseGem.poison || "";
      gemContent.appendChild(gemValue);
    }
    
    // Add name (visible in catalog)
    const gemName = document.createElement("div");
    gemName.className = "gem-name";
    gemName.style.display = "block";
    gemName.textContent = baseGem.name;
    gemContent.appendChild(gemName);
    
    gemElement.appendChild(gemContent);
    
    // Add cost
    const gemCost = document.createElement("div");
    gemCost.className = "gem-cost";
    gemCost.textContent = baseGem.cost;
    gemElement.appendChild(gemCost);
    
    // Add tooltip
    const hasBonus = (playerClass === "Knight" && baseGem.color === "red") ||
                   (playerClass === "Mage" && baseGem.color === "blue") ||
                   (playerClass === "Rogue" && baseGem.color === "green");
    
    gemElement.setAttribute("data-tooltip", buildGemTooltip(baseGem, hasBonus));
    
    unlockedGemsContainer.appendChild(gemElement);
  });
}

/**
 * Render available gems to unlock in the gem catalog
 */
export function renderAvailableGems() {
  const gemCatalog = GameState.get('gemCatalog');
  const playerClass = GameState.get('player.class');
  const metaZenny = GameState.get('metaZenny');
  const availableGemsContainer = document.getElementById('available-gems');
  
  if (!availableGemsContainer) return;
  
  availableGemsContainer.innerHTML = '';
  
  if (!gemCatalog || !gemCatalog.unlocked || !gemCatalog.available) {
    console.error("Invalid gem catalog:", gemCatalog);
    return;
  }
  
  // Create a Set of unlocked gem keys for faster lookups
  const unlockedGemKeys = new Set(gemCatalog.unlocked);
  
  // Make sure we're working with arrays
  const availableGems = Array.isArray(gemCatalog.available) ? gemCatalog.available : [];
  
  // Filter out gems that are already unlocked
  const filteredGems = availableGems
    .filter(gemKey => !unlockedGemKeys.has(gemKey)) // Only show gems that are not already unlocked
    .filter(gemKey => {
      const baseGem = Config.BASE_GEMS[gemKey];
      if (!baseGem) {
        console.warn(`Gem not found in BASE_GEMS: ${gemKey}`);
        return false;
      }
      
      // Grey gems are universal
      if (baseGem.color === "grey") return true;
      
      // Class-specific color filtering
      const classColors = {
        "Knight": "red",
        "Mage": "blue",
        "Rogue": "green"
      };
      
      return baseGem.color === classColors[playerClass];
    });
  
  // Add each available gem
  filteredGems.forEach((gemKey) => {
    const baseGem = Config.BASE_GEMS[gemKey];
    if (!baseGem) return;
    
    // Create a container for the unlockable gem
    const gemContainer = document.createElement("div");
    gemContainer.className = "unlockable-gem-container";
    
    // Create special gem element for catalog
    const gemElement = document.createElement("div");
    gemElement.className = `gem ${baseGem.color}`;
    gemElement.style.cursor = 'pointer';
    
    // Create content structure
    const gemContent = document.createElement("div");
    gemContent.className = "gem-content";
    
    // Add icon
    const gemIcon = document.createElement("div");
    gemIcon.className = "gem-icon";
    gemIcon.textContent = getGemSymbol(baseGem);
    gemContent.appendChild(gemIcon);
    
    // Add value
    if (baseGem.damage || baseGem.heal || baseGem.poison) {
      const gemValue = document.createElement("div");
      gemValue.className = "gem-value";
      gemValue.textContent = baseGem.damage || baseGem.heal || baseGem.poison || "";
      gemContent.appendChild(gemValue);
    }
    
    // Add name (visible in catalog)
    const gemName = document.createElement("div");
    gemName.className = "gem-name";
    gemName.style.display = "block";
    gemName.textContent = baseGem.name;
    gemContent.appendChild(gemName);
    
    gemElement.appendChild(gemContent);
    
    // Add cost
    const gemCost = document.createElement("div");
    gemCost.className = "gem-cost";
    gemCost.textContent = baseGem.cost;
    gemElement.appendChild(gemCost);
    
    // Add click handler for unlocking
    gemElement.onclick = function() {
      if (metaZenny < 50) {
        EventBus.emit('UI_MESSAGE', {
          message: "Not enough Meta $ZENNY!",
          type: 'error'
        });
        return;
      }
      
      if (confirm(`Would you like to unlock the ${baseGem.color} ${baseGem.name} gem for 50 $ZENNY?`)) {
        EventBus.emit('UNLOCK_GEM', { gemKey });
      }
    };
    
    // Add cost label
    const costLabel = document.createElement("div");
    costLabel.className = "gem-cost-label";
    costLabel.textContent = "50 $ZENNY";
    
    // Add to container
    gemContainer.appendChild(gemElement);
    gemContainer.appendChild(costLabel);
    
    // Add to available gems section
    availableGemsContainer.appendChild(gemContainer);
  });
}

// Export GemRenderer
export const GemRenderer = {
  initialize,
  updateGemDisplay,
  renderHand,
  renderShopHand,
  createGemElement,
  getGemSymbol,
  buildGemTooltip,
  updateGemSelection,
  renderUnlockedGems,
  renderAvailableGems
};