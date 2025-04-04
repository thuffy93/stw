import { GameState } from '../core/state.js';
import { EventBus } from '../core/eventbus.js';
import { Utils } from '../core/utils.js';

// Constants
const MAX_HAND_SIZE = 3;
const MAX_GEM_BAG_SIZE = 20;

// Base gem definitions (simplified for this example)
// In a complete implementation, this would be imported from config
const BASE_GEMS = {
    redAttack: { name: "Attack", color: "red", cost: 2, damage: 5, upgradeCount: 0, rarity: "Common" },
    redBurst: { name: "Burst", color: "red", cost: 3, damage: 10, upgradeCount: 0, rarity: "Rare" },
    redStrongAttack: { name: "Strong Attack", color: "red", cost: 3, damage: 8, upgradeCount: 0, rarity: "Uncommon" },
    blueMagicAttack: { name: "Magic Attack", color: "blue", cost: 2, damage: 7, upgradeCount: 0, rarity: "Common" },
    blueShield: { name: "Shield", color: "blue", cost: 2, heal: 3, upgradeCount: 0, rarity: "Rare", shield: true },
    blueStrongHeal: { name: "Strong Heal", color: "blue", cost: 3, heal: 8, upgradeCount: 0, rarity: "Uncommon" },
    greenAttack: { name: "Attack", color: "green", cost: 1, damage: 5, upgradeCount: 0, rarity: "Common" },
    greenPoison: { name: "Poison", color: "green", cost: 2, damage: 3, upgradeCount: 0, rarity: "Rare", poison: 2 },
    greenQuickAttack: { name: "Quick Attack", color: "green", cost: 1, damage: 3, upgradeCount: 0, rarity: "Uncommon" },
    greyHeal: { name: "Heal", color: "grey", cost: 1, heal: 5, upgradeCount: 0, rarity: "Common" }
};


export function initializeGemBag(playerClass) {
    console.log(`Initializing gem bag for ${playerClass}`);
    
    // Make sure we have a valid class
    if (!playerClass || !['Knight', 'Mage', 'Rogue'].includes(playerClass)) {
        console.error(`Invalid player class: ${playerClass}`);
        return [];
    }
    
    // Get base gem definitions from Config if available
    let BASE_GEMS = {};
    if (window.Config && window.Config.BASE_GEMS) {
        BASE_GEMS = window.Config.BASE_GEMS;
    } else {
        // Fallback definitions if Config is not available
        BASE_GEMS = {
            redAttack: { name: "Attack", color: "red", cost: 2, damage: 5, upgradeCount: 0, rarity: "Common" },
            redBurst: { name: "Burst", color: "red", cost: 3, damage: 10, upgradeCount: 0, rarity: "Rare" },
            redStrongAttack: { name: "Strong Attack", color: "red", cost: 3, damage: 8, upgradeCount: 0, rarity: "Uncommon" },
            blueMagicAttack: { name: "Magic Attack", color: "blue", cost: 2, damage: 7, upgradeCount: 0, rarity: "Common" },
            blueShield: { name: "Shield", color: "blue", cost: 2, heal: 3, upgradeCount: 0, rarity: "Rare", shield: true },
            blueStrongHeal: { name: "Strong Heal", color: "blue", cost: 3, heal: 8, upgradeCount: 0, rarity: "Uncommon" },
            greenAttack: { name: "Attack", color: "green", cost: 1, damage: 5, upgradeCount: 0, rarity: "Common" },
            greenPoison: { name: "Poison", color: "green", cost: 2, damage: 3, upgradeCount: 0, rarity: "Rare", poison: 2 },
            greenQuickAttack: { name: "Quick Attack", color: "green", cost: 1, damage: 3, upgradeCount: 0, rarity: "Uncommon" },
            greyHeal: { name: "Heal", color: "grey", cost: 1, heal: 5, upgradeCount: 0, rarity: "Common" }
        };
    }

    // Define starting gems for each class
    const classStartingGems = {
        Knight: ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal", "redStrongAttack"],
        Mage: ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal", "blueStrongHeal"],
        Rogue: ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal", "greenQuickAttack"]
    };
    
    // Get the starting gems for the player's class
    const startingGemKeys = classStartingGems[playerClass] || [];
    
    // Create the gem bag with the starting gems
    const gemBag = [];
    
    // Add each gem to the bag (2-3 copies of each)
    startingGemKeys.forEach(gemKey => {
        const baseGem = BASE_GEMS[gemKey];
        if (!baseGem) {
            console.warn(`Gem key not found: ${gemKey}`);
            return;
        }
        
        // Determine how many copies to add based on gem type
        let copies = 2;
        if (gemKey.includes('Attack')) {
            copies = 3; // More attack gems
        }
        
        // Add copies of this gem
        for (let i = 0; i < copies; i++) {
            gemBag.push({ 
                ...baseGem, 
                id: `${gemKey}-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                freshlySwapped: false 
            });
        }
    });
    
    // Shuffle the gem bag
    const shuffledBag = shuffleArray(gemBag);
    
    // Update the game state with the new gem bag
    if (window.GameState) {
        window.GameState.set('gemBag', shuffledBag);
        console.log(`Gem bag initialized with ${shuffledBag.length} gems`);
    } else {
        console.error("GameState not found, cannot update gem bag");
    }
    
    return shuffledBag;
}
/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
/**
 * Reset the gem bag
 * @param {Boolean} fullReset - Whether to fully reset the bag
 */
export function resetGemBag(fullReset = false) {
    console.log(`Resetting gem bag: fullReset = ${fullReset}`);
    
    if (fullReset) {
        // Clear all current gem collections
        GameState.set('gemBag', []);
        GameState.set('hand', []);
        GameState.set('discard', []);
        
        const playerClass = GameState.get('player.class');
        if (!playerClass) {
            console.error("No player class set during gem bag reset!");
            return;
        }
        
        console.log(`Generating gem bag for ${playerClass} class`);
        
        const gemBag = [];
        
        // Basic universal gems
        const basicGems = [
            { name: "Heal", color: "grey", cost: 1, heal: 5 },
            { name: "Attack", color: "red", cost: 2, damage: 5 },
            { name: "Magic Attack", color: "blue", cost: 2, damage: 7 },
            { name: "Attack", color: "green", cost: 1, damage: 5 }
        ];
        
        // Adding universal basic gems (in multiple copies)
        basicGems.forEach(gemTemplate => {
            for (let i = 0; i < 3; i++) {
                gemBag.push({
                    ...gemTemplate,
                    id: `${gemTemplate.name}-${i}-${Utils.generateId()}`,
                    upgradeCount: 0,
                    rarity: "Common",
                    freshlySwapped: false
                });
            }
        });
        
        // Class-specific gems
        const classSpecificGems = {
            "Knight": [
                { name: "Strong Attack", color: "red", cost: 3, damage: 8 },
                { name: "Attack", color: "red", cost: 2, damage: 5 }
            ],
            "Mage": [
                { name: "Strong Heal", color: "blue", cost: 3, heal: 8 },
                { name: "Magic Attack", color: "blue", cost: 2, damage: 7 }
            ],
            "Rogue": [
                { name: "Quick Attack", color: "green", cost: 1, damage: 3 },
                { name: "Attack", color: "green", cost: 1, damage: 5 }
            ]
        };
        
        // Adding class-specific gems
        const classGems = classSpecificGems[playerClass] || [];
        classGems.forEach(gemTemplate => {
            for (let i = 0; i < 3; i++) {
                gemBag.push({
                    ...gemTemplate,
                    id: `${gemTemplate.name}-${i}-${Utils.generateId()}`,
                    upgradeCount: 0,
                    rarity: "Uncommon",
                    freshlySwapped: false
                });
            }
        });
        
        // Shuffle the gem bag
        const shuffledBag = Utils.shuffle(gemBag);
        
        console.log(`Generated gem bag with ${shuffledBag.length} gems`);
        
        GameState.set('gemBag', shuffledBag);
        
        // Emit event for bag reset
        EventBus.emit('GEM_BAG_RESET', { 
            fullReset: true, 
            bagSize: shuffledBag.length 
        });
    }
    
    // Ensure we have a shuffled bag
    const currentBag = GameState.get('gemBag');
    if (!currentBag || currentBag.length === 0) {
        console.warn("Gem bag is empty after reset. Retrying full reset.");
        return resetGemBag(true);
    }
    
    // Shuffle the bag again
    const shuffledBag = Utils.shuffle(currentBag);
    GameState.set('gemBag', shuffledBag);
    
    console.log(`Final gem bag size: ${shuffledBag.length}`);
    
    // Emit shuffle event
    EventBus.emit('GEM_BAG_SHUFFLED');
    
    return shuffledBag;
}

function drawCards(num) {
    console.log('Drawing cards', { 
        currentHand: GameState.get('hand'), 
        currentBag: GameState.get('gemBag'),
        drawRequest: num
    });

    let hand = GameState.get('hand') || [];
    let gemBag = GameState.get('gemBag') || [];
    let discard = GameState.get('discard') || [];
    
    // Calculate how many cards we need to draw
    const needed = Math.min(num, MAX_HAND_SIZE - hand.length);
    
    console.log('Draw details', { needed, handLength: hand.length, bagLength: gemBag.length });
    
    if (needed <= 0) {
        console.log('No cards needed to be drawn');
        return;
    }
    
    // If gem bag is empty, recycle discard
    if (gemBag.length < needed && discard.length > 0) {
        console.log('Recycling discard pile');
        recycleDiscardPile();
        gemBag = GameState.get('gemBag'); // Get updated gem bag
    }
    
    // Emergency refill if bag is still empty
    if (gemBag.length === 0) {
        console.warn('Gem bag is empty after recycling. Resetting.');
        resetGemBag(true);
        gemBag = GameState.get('gemBag');
    }
    
    // Draw cards from bag to hand
    const newHand = [...hand];
    const drawnGems = [];
    
    for (let i = 0; i < needed && gemBag.length > 0; i++) {
        // Draw from the end for better performance than shift()
        const drawnGem = gemBag[gemBag.length - 1];
        newHand.push(drawnGem);
        drawnGems.push(drawnGem);
        gemBag = gemBag.slice(0, -1);
    }
    
    console.log('Draw result', { 
        drawnGemsCount: drawnGems.length, 
        newHandSize: newHand.length, 
        remainingBagSize: gemBag.length 
    });
    
    // Update state
    GameState.set('hand', newHand);
    GameState.set('gemBag', gemBag);
    
    // Emit events for UI updates
    EventBus.emit('GEMS_DRAWN', { gems: drawnGems, count: drawnGems.length });
    EventBus.emit('HAND_UPDATED');
}
/**
 * Recycle discard pile into gem bag
 */
export function recycleDiscardPile() {
    let gemBag = GameState.get('gemBag');
    let discard = GameState.get('discard');
    
    // Move all cards from discard to gem bag
    gemBag = [...gemBag, ...discard];
    
    // Clear discard pile and shuffle gem bag
    GameState.set('discard', []);
    GameState.set('gemBag', Utils.shuffle(gemBag));
    
    // Notify player via event
    EventBus.emit('UI_MESSAGE', {
        message: "Discard pile reshuffled into gem bag!"
    });
    
    // Emit recycle event
    EventBus.emit('DISCARD_RECYCLED');
}

/**
 * Standardize gem key format for consistency
 * @param {String} gemKey - Gem key to standardize
 * @returns {String} Standardized gem key
 */
export function standardizeGemKey(gemKey) {
    // Remove whitespace
    let standardizedKey = gemKey.replace(/\s+/g, '');
    
    // Key mappings for consistency
    const keyMappings = {
        "redAttack": "redAttack",
        "blueMagicAttack": "blueMagicAttack",
        "greenQuickAttack": "greenQuickAttack",
        "redStrongAttack": "redStrongAttack",
        "greyHeal": "greyHeal",
        "blueStrongHeal": "blueStrongHeal",
        "greenPoison": "greenPoison",
        "blueShield": "blueShield"
    };
    
    // Apply mapping if available
    return keyMappings[standardizedKey] || standardizedKey;
}

/**
 * Get the type of a gem based on its properties
 * @param {Object} gem - Gem object
 * @returns {Object} Gem type definition
 */
export function getGemType(gem) {
    // Gem definitions
    const definitions = {
        // Attack gems
        attack: {
            icon: "🗡️",        // For battle/shop
            label: "Attack",    // For catalog
            property: "damage"  // Property to check for this type
        },
        strongAttack: {
            icon: "⚔️",
            label: "Strong",
            property: "damage",
            nameCheck: "Strong"
        },
        quickAttack: {
            icon: "⚡",
            label: "Quick",
            property: "damage",
            nameCheck: "Quick"
        },
        burstAttack: {
            icon: "💥",
            label: "Burst",
            property: "damage",
            nameCheck: "Burst"
        },
        
        // Healing gems
        heal: {
            icon: "💚",
            label: "Heal",
            property: "heal"
        },
        strongHeal: {
            icon: "❤️",
            label: "Strong Heal",
            property: "heal",
            nameCheck: "Strong"
        },
        
        // Special types
        shield: {
            icon: "🛡️",
            label: "Shield",
            property: "shield"
        },
        poison: {
            icon: "☠️",
            label: "Poison",
            property: "poison"
        }
    };
    
    // Check for special types first
    if (gem.shield) return definitions.shield;
    if (gem.poison) return definitions.poison;
    
    // Check for attack variants
    if (gem.damage) {
        if (gem.name.includes("Strong")) return definitions.strongAttack;
        if (gem.name.includes("Quick")) return definitions.quickAttack;
        if (gem.name.includes("Burst")) return definitions.burstAttack;
        return definitions.attack;
    }
    
    // Check for heal variants
    if (gem.heal) {
        if (gem.name.includes("Strong")) return definitions.strongHeal;
        return definitions.heal;
    }
    
    // Fallback
    return { 
        icon: "✨", 
        label: "Special", 
        property: null 
    };
}

/**
 * Get the appropriate symbol for a gem based on context
 * @param {Object} gem - Gem object
 * @param {String} context - Context ('battle', 'shop', or 'catalog')
 * @returns {String} Gem symbol
 */
export function getGemSymbol(gem, context = 'battle') {
    const gemType = getGemType(gem);
    
    // Use emoji for battle/shop, text label for catalog
    return (context === 'battle' || context === 'shop') 
        ? gemType.icon 
        : gemType.label;
}

/**
 * Build tooltip text for a gem
 * @param {Object} gem - Gem object
 * @param {Boolean} hasBonus - Whether the gem has a class bonus
 * @returns {String} Tooltip text
 */
export function buildGemTooltip(gem, hasBonus) {
    let tooltip = '';
    
    // Add primary effect and value
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
    
    // Add stamina cost at the end
    tooltip += ` | (${gem.cost}⚡)`;
    
    return tooltip;
}

/**
 * Get the proficiency for a gem
 * @param {String} gemKey - Gem key
 * @returns {Object} Proficiency data
 */
export function getGemProficiency(gemKey) {
    const gemProficiency = GameState.get('gemProficiency');
    
    // Standardize gem key format
    const standardizedKey = standardizeGemKey(gemKey);
    
    // Special handling for class-specific gems
    const classGems = ["redStrongAttack", "blueStrongHeal", "greenQuickAttack"];
    
    // If this is a class gem, return full proficiency regardless of whether it's in the state
    if (classGems.includes(standardizedKey)) {
        return { successCount: 6, failureChance: 0 };
    }
    
    // If we don't have proficiency data yet, create default
    if (!gemProficiency || !gemProficiency[standardizedKey]) {
        // Check if the gemKey might be in color+name format
        if (standardizedKey.length > 0) {
            // Try to extract color and name
            const colors = ['red', 'blue', 'green', 'grey'];
            
            for (const color of colors) {
                if (standardizedKey.toLowerCase().startsWith(color)) {
                    const alternateKey = standardizedKey.substring(color.length);
                    if (gemProficiency && gemProficiency[alternateKey]) {
                        return gemProficiency[alternateKey];
                    }
                    break;
                }
            }
        }
        
        // Still no match, return default values
        // For base gems or class-specific gems, set them as already learned
        const baseGems = ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal", 
                        "redStrongAttack", "blueStrongHeal", "greenQuickAttack"];
        
        if (baseGems.includes(standardizedKey)) {
            return { successCount: 6, failureChance: 0 };
        } else {
            return { successCount: 0, failureChance: 0.9 };
        }
    }
    
    return gemProficiency[standardizedKey];
}

/**
 * Update proficiency for a gem based on success/failure
 * @param {String} gemKey - Gem key
 * @param {Boolean} success - Whether the gem use was successful
 */
export function updateGemProficiency(gemKey, success) {
    const gemProficiency = GameState.get('gemProficiency') || {};
    const playerClass = GameState.get('player.class');
    
    // Standardize the key using our helper function
    const standardizedKey = standardizeGemKey(gemKey);
    
    // Get current proficiency
    let proficiency = getGemProficiency(standardizedKey);
    
    // Update proficiency based on success
    if (success) {
        proficiency.successCount++;
        proficiency.failureChance = Math.max(0, 0.9 - proficiency.successCount * 0.15);
        
        // Update proficiency in state for both gem-specific and class-specific proficiency
        const updatedGemProficiency = { ...gemProficiency, [standardizedKey]: proficiency };
        GameState.set('gemProficiency', updatedGemProficiency);
        
        // Also update in class-specific proficiency if we have a player class
        if (playerClass) {
            const classGemProficiency = GameState.get(`classGemProficiency.${playerClass}`) || {};
            classGemProficiency[standardizedKey] = proficiency;
            GameState.set(`classGemProficiency.${playerClass}`, classGemProficiency);
        }
        
        // Emit proficiency update event
        EventBus.emit('GEM_PROFICIENCY_UPDATED', { 
            gemKey: standardizedKey, 
            proficiency,
            success: true
        });
        
        console.log(`Updated proficiency for ${standardizedKey}`, proficiency);
    }
}

/**
 * Check if a gem will fail based on proficiency
 * @param {Object} proficiency - Gem proficiency data
 * @returns {Boolean} Whether the gem will fail
 */
export function checkGemFails(proficiency) {
    return proficiency.failureChance > 0 && Math.random() < proficiency.failureChance;
}

/**
 * Calculate the damage/healing multiplier for a gem
 * @param {Object} gem - Gem object
 * @returns {Number} Multiplier value
 */
export function calculateGemMultiplier(gem) {
    const player = GameState.get('player');
    let multiplier = 1;
    
    // Class bonus
    if ((player.class === "Knight" && gem.color === "red") || 
        (player.class === "Mage" && gem.color === "blue") || 
        (player.class === "Rogue" && gem.color === "green")) {
        multiplier *= 1.5;
    }
    
    // Focus buff
    if (player.buffs.some(b => b.type === "focused")) {
        multiplier *= 1.2;
    }
    
    return multiplier;
}

/**
 * Process gem effect when played
 * @param {Object} gem - Gem being played
 * @param {Boolean} gemFails - Whether the gem fails
 * @param {Number} multiplier - Damage/healing multiplier
 * @returns {Object} Result of the effect processing
 */
export function processGemEffect(gem, gemFails, multiplier) {
    if (gemFails) {
        return processGemFailure(gem, multiplier);
    } else {
        return processGemSuccess(gem, multiplier);
    }
}

/**
 * Process the effects of a failed gem
 * @param {Object} gem - Gem being played
 * @param {Number} multiplier - Damage/healing multiplier
 * @returns {Object} Result of the effect processing
 */
/**
 * Process the effects of a failed gem
 * @param {Object} gem - Gem being played
 * @param {Number} multiplier - Damage/healing multiplier
 * @returns {Object} Result of the effect processing
 */
function processGemFailure(gem, multiplier) {
    const player = GameState.get('player');
    const result = { success: false };
    
    if (gem.damage) {
        const damage = Math.floor((gem.damage) * multiplier * 0.5);
        player.health = Math.max(0, player.health - damage);
        GameState.set('player.health', player.health);
        
        result.damage = damage;
        
        if (Math.random() < 0.5) {
            const playerBuffs = [...player.buffs];
            playerBuffs.push({ type: "stunned", turns: 1 });
            GameState.set('player.buffs', playerBuffs);
            result.stunned = true;
        }
        
        EventBus.emit('UI_MESSAGE', {
            message: `Failed ${gem.name}! Took ${damage} damage${result.stunned ? " and stunned!" : "!"}`,
            type: 'error'
        });
        
        EventBus.emit('SHOW_DAMAGE', {
            target: 'player',
            amount: damage
        });
    } else if (gem.heal) {
        const damage = 5;
        player.health = Math.max(0, player.health - damage);
        GameState.set('player.health', player.health);
        
        result.damage = damage;
        
        EventBus.emit('UI_MESSAGE', {
            message: `Failed ${gem.name}! Lost ${damage} HP!`,
            type: 'error'
        });
        
        EventBus.emit('SHOW_DAMAGE', {
            target: 'player',
            amount: damage
        });
    } else if (gem.poison) {
        const damage = Math.floor((gem.poison) * multiplier * 0.5);
        player.health = Math.max(0, player.health - damage);
        GameState.set('player.health', player.health);
        
        result.poison = true;
        result.damage = damage;
        
        EventBus.emit('UI_MESSAGE', {
            message: `Failed ${gem.name}! Took ${damage} self-poison damage!`,
            type: 'error'
        });
        
        EventBus.emit('SHOW_DAMAGE', {
            target: 'player',
            amount: damage,
            isPoison: true
        });
    }
    
    return result;
}

/**
 * Process the effects of a successful gem
 * @param {Object} gem - Gem being played
 * @param {Number} multiplier - Damage/healing multiplier
 * @returns {Object} Result of the effect processing
 */
function processGemSuccess(gem, multiplier) {
    const player = GameState.get('player');
    const enemy = GameState.get('battle.enemy');
    const result = { success: true };
    
    if (gem.damage && enemy) {
        let damage = Math.floor(gem.damage * multiplier);
        
        if (enemy.shield && gem.color !== enemy.shieldColor) {
            damage = Math.floor(damage / 2);
            result.shieldReduced = true;
        }
        
        if (enemy.buffs && enemy.buffs.some(b => b.type === "defense")) {
            damage = Math.floor(damage / 2);
            result.defenseReduced = true;
        }
        
        enemy.health = Math.max(0, enemy.health - damage);
        GameState.set('battle.enemy', enemy);
        
        result.damage = damage;
        
        EventBus.emit('UI_MESSAGE', {
            message: `Played ${gem.name} for ${damage} damage!`
        });
        
        EventBus.emit('SHOW_DAMAGE', {
            target: 'enemy',
            amount: damage
        });
        
        // Check for enemy defeat immediately after dealing damage
        if (enemy.health <= 0) {
            EventBus.emit('ENEMY_DEFEATED');
            result.enemyDefeated = true;
        }
    }
    
    if (gem.heal) {
        const heal = Math.floor(gem.heal * multiplier);
        player.health = Math.min(player.health + heal, player.maxHealth);
        GameState.set('player.health', player.health);
        
        result.heal = heal;
        
        if (gem.shield) {
            const playerBuffs = [...player.buffs];
            playerBuffs.push({ type: "defense", turns: 2 });
            GameState.set('player.buffs', playerBuffs);
            result.shieldApplied = true;
        }
        
        EventBus.emit('UI_MESSAGE', {
            message: `Played ${gem.name} for ${heal} healing${gem.shield ? " and defense" : ""}!`
        });
        
        EventBus.emit('SHOW_DAMAGE', {
            target: 'player',
            amount: -heal
        });
    }
    
    if (gem.poison && enemy) {
        const poisonDamage = Math.floor(gem.poison * multiplier);
        if (!enemy.buffs) enemy.buffs = [];
        const enemyBuffs = [...enemy.buffs];
        enemyBuffs.push({ type: "poison", turns: 2, damage: poisonDamage });
        enemy.buffs = enemyBuffs;
        GameState.set('battle.enemy', enemy);
        
        result.poisonApplied = true;
        result.poisonDamage = poisonDamage;
        
        EventBus.emit('UI_MESSAGE', {
            message: `Played ${gem.name} for ${poisonDamage} poison damage/turn!`
        });
    }
    
    return result;
}

/**
 * Get upgrade multiplier based on gem rarity
 * @param {String} rarity - Gem rarity
 * @returns {Number} Multiplier
 */
export function getUpgradeMultiplier(rarity) {
    switch (rarity) {
        case "Common": return 1.25;
        case "Uncommon": return 1.3;
        case "Rare": return 1.35;
        default: return 1.4;
    }
}

/**
 * Generate upgrade options for a gem
 * @param {Object} selectedGem - The gem to upgrade
 * @returns {Array} Upgrade options
 */
export function generateUpgradeOptions(selectedGem) {
    const gemColor = selectedGem.color;
    const player = GameState.get('player');
    const playerClass = player.class;
    const gemCatalog = GameState.get('gemCatalog');
    const options = [];
    
    // Option 1: Direct upgrade (always available)
    options.push(createDirectUpgrade(selectedGem));
    
    // Option 2: Class-specific upgrade if applicable
    const classUpgrade = createClassUpgrade(selectedGem);
    if (classUpgrade) {
        options.push(classUpgrade);
    }
    
    // Option 3-4: Alternative gems from unlocked catalog
    const alternativeCount = options.length > 1 ? 1 : 2; // Fewer alternatives if we have a class upgrade
    const alternatives = createAlternativeUpgrades(selectedGem, gemCatalog, alternativeCount);
    options.push(...alternatives);
    
    return options;
}

/**
 * Create a direct upgrade for a gem
 * @param {Object} gem - The gem to upgrade
 * @returns {Object} Upgraded gem
 */
function createDirectUpgrade(gem) {
    const directUpgrade = { 
        ...gem,
        id: `${gem.name}-upgraded-${Utils.generateId()}`,
        upgradeCount: (gem.upgradeCount || 0) + 1,
        freshlySwapped: false,
        isDirectUpgrade: true
    };
    
    // Calculate stat improvements based on rarity
    const upgradeMultiplier = getUpgradeMultiplier(gem.rarity);
    
    // Apply stat improvements
    if (directUpgrade.damage) {
        directUpgrade.damage = Math.floor(directUpgrade.damage * upgradeMultiplier);
    }
    if (directUpgrade.heal) {
        directUpgrade.heal = Math.floor(directUpgrade.heal * upgradeMultiplier);
    }
    if (directUpgrade.poison) {
        directUpgrade.poison = Math.floor(directUpgrade.poison * upgradeMultiplier);
    }
    
    return directUpgrade;
}

/**
 * Create a class-specific upgrade for a gem
 * @param {Object} gem - The gem to upgrade
 * @returns {Object|null} Class-specific upgrade or null if not applicable
 */
function createClassUpgrade(gem) {
    const classSpecificUpgrades = {
        "redAttack": "redStrongAttack",
        "blueMagicAttack": "blueStrongHeal",
        "greenAttack": "greenQuickAttack"
    };
    
    const gemKey = `${gem.color}${gem.name.replace(/\s+/g, '')}`;
    
    if (!classSpecificUpgrades[gemKey]) return null;
    
    const upgradeKey = classSpecificUpgrades[gemKey];
    const upgradeBase = BASE_GEMS[upgradeKey];
    
    if (!upgradeBase) return null;
    
    return { 
        ...upgradeBase,
        id: `${upgradeKey}-class-upgrade-${Utils.generateId()}`,
        upgradeCount: 0,
        freshlySwapped: false,
        isClassUpgrade: true
    };
}

/**
 * Create alternative upgrade options for a gem
 * @param {Object} gem - The gem to upgrade
 * @param {Object} catalog - Gem catalog
 * @param {Number} maxCount - Maximum number of alternatives
 * @returns {Array} Alternative upgrades
 */
function createAlternativeUpgrades(gem, catalog, maxCount) {
    const baseGemKeys = [
        "redAttack", "blueMagicAttack", "greenAttack", "greyHeal",
        "redStrongAttack", "blueStrongHeal", "greenQuickAttack"
    ];
    
    // Filter for explicitly unlocked (non-base) gems of the same color
    const explicitlyUnlockedGems = catalog.unlocked.filter(gemKey => {
        if (baseGemKeys.includes(gemKey)) return false;
        
        const gemDef = BASE_GEMS[gemKey];
        return gemDef && gemDef.color === gem.color && gemDef.name !== gem.name;
    });
    
    if (explicitlyUnlockedGems.length === 0) return [];
    
    // Shuffle and take up to maxCount alternatives
    const shuffledGems = Utils.shuffle([...explicitlyUnlockedGems]);
    const alternatives = [];
    
    for (let i = 0; i < Math.min(maxCount, shuffledGems.length); i++) {
        const gemKey = shuffledGems[i];
        const baseGem = BASE_GEMS[gemKey];
        if (!baseGem) continue;
        
        const alternativeGem = { 
            ...baseGem, 
            id: `${gemKey}-alternative-${Utils.generateId()}`, 
            freshlySwapped: false,
            isAlternateUpgrade: true 
        };
        
        // 50% chance to upgrade it
        if (Math.random() < 0.5) {
            alternativeGem.upgradeCount = 1;
            const altUpgradeMultiplier = getUpgradeMultiplier(baseGem.rarity);
            
            if (alternativeGem.damage) {
                alternativeGem.damage = Math.floor(alternativeGem.damage * altUpgradeMultiplier);
            }
            if (alternativeGem.heal) {
                alternativeGem.heal = Math.floor(alternativeGem.heal * altUpgradeMultiplier);
            }
            if (alternativeGem.poison) {
                alternativeGem.poison = Math.floor(alternativeGem.poison * altUpgradeMultiplier);
            }
        }
        
        alternatives.push(alternativeGem);
    }
    
    return alternatives;
}

/**
 * Create an alternative gem when no suitable upgrades found
 * @param {Object} originalGem - Original gem to create an alternative for
 * @returns {Object} Alternative gem
 */
export function createAlternativeGem(originalGem) {
    const gemColor = originalGem.color;
    
    // Find a different gem of the same color
    const baseGemKeys = Object.keys(BASE_GEMS);
    const sameColorGems = baseGemKeys.filter(key => {
        const gem = BASE_GEMS[key];
        return gem.color === gemColor && gem.name !== originalGem.name;
    });
    
    if (sameColorGems.length === 0) {
        // Fallback - create a slightly different variant of the original
        return {
            ...originalGem,
            name: `${originalGem.name}+`,
            id: `${originalGem.name}-variant-${Utils.generateId()}`,
            damage: originalGem.damage ? Math.floor(originalGem.damage * 1.2) : null,
            heal: originalGem.heal ? Math.floor(originalGem.heal * 1.2) : null,
            poison: originalGem.poison ? Math.floor(originalGem.poison * 1.2) : null,
            freshlySwapped: false,
            isAlternateUpgrade: true
        };
    }
    
    // Select a random gem of the same color
    const randomKey = sameColorGems[Math.floor(Math.random() * sameColorGems.length)];
    const baseGem = BASE_GEMS[randomKey];
    
    const alternativeGem = { 
        ...baseGem, 
        id: `${randomKey}-alternative-${Utils.generateId()}`, 
        freshlySwapped: false,
        isAlternateUpgrade: true 
    };
    
    // 50% chance to give it an upgrade too
    if (Math.random() < 0.5) {
        alternativeGem.upgradeCount = 1;
        const altUpgradeMultiplier = getUpgradeMultiplier(baseGem.rarity);
        
        if (alternativeGem.damage) {
            alternativeGem.damage = Math.floor(alternativeGem.damage * altUpgradeMultiplier);
        }
        if (alternativeGem.heal) {
            alternativeGem.heal = Math.floor(alternativeGem.heal * altUpgradeMultiplier);
        }
        if (alternativeGem.poison) {
            alternativeGem.poison = Math.floor(alternativeGem.poison * altUpgradeMultiplier);
        }
    }
    
    return alternativeGem;
}

/**
 * Create a gem pool appropriate for a specific class
 * @param {String} playerClass - Player class
 * @returns {Array} Gem keys
 */
export function createClassAppropriateGemPool(playerClass) {
    let gemPool = [];
    const classColors = {
        "Knight": "red",
        "Mage": "blue",
        "Rogue": "green"
    };
    const classColor = classColors[playerClass];
    
    // Basic gems that should be available to all classes
    const basicGemKeys = ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal"];
    
    // First, ensure the basic gems are in the pool
    for (const basicKey of basicGemKeys) {
        gemPool.push(basicKey);
    }
    
    // Add other unlocked gems that match the class color or are grey
    const gemCatalog = GameState.get('gemCatalog');
    gemCatalog.unlocked.forEach(key => {
        // Skip basic gems (already added)
        if (basicGemKeys.includes(key)) return;
        
        const gemColor = BASE_GEMS[key]?.color;
        
        // Only add if it's class-appropriate (matches class color or is grey)
        if (gemColor === classColor || gemColor === "grey") {
            gemPool.push(key);
        }
    });
    
    return gemPool;
}

/**
 * Get explicitly unlocked gems (not starting gems)
 * @returns {Array} Explicitly unlocked gems
 */
export function getExplicitlyUnlockedGems() {
    const gemCatalog = GameState.get('gemCatalog');
    const player = GameState.get('player');
    
    // Define the starting gems for each class
    const startingGemsByClass = {
        Knight: ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal", "redStrongAttack"],
        Mage: ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal", "blueStrongHeal"],
        Rogue: ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal", "greenQuickAttack"]
    };
    
    // Get starting gems for player's class
    const startingGems = startingGemsByClass[player.class] || [];
    
    // Filter to get ONLY explicitly unlocked gems (not starting gems)
    const explicitlyUnlocked = gemCatalog.unlocked.filter(key => !startingGems.includes(key));
    
    return explicitlyUnlocked.map(key => ({
        key,
        gem: BASE_GEMS[key]
    }));
}

/**
 * Create a gem element for the UI (DOM element)
 * For this implementation, we'll just return gem data for UI renderer
 * 
 * @param {Object} gem - Gem object
 * @param {Number} index - Index of the gem
 * @param {String} context - Context ('battle', 'shop', or 'catalog')
 * @returns {Object} Gem UI data
 */
export function createGemElement(gem, index, context = 'battle') {
    const playerClass = GameState.get('player.class');
    const hasBonus = (playerClass === "Knight" && gem.color === "red") ||
                (playerClass === "Mage" && gem.color === "blue") ||
                (playerClass === "Rogue" && gem.color === "green");
    
    const gemSymbol = getGemSymbol(gem, context);
    const tooltip = buildGemTooltip(gem, hasBonus);
    const gemKey = `${gem.color}${gem.name}`;
    const proficiency = getGemProficiency(gemKey);
    const isUnlearned = proficiency.failureChance > 0;
    
    // Return data to be used by UI renderer
    return {
        id: gem.id,
        index,
        name: gem.name,
        color: gem.color,
        cost: gem.cost,
        damage: gem.damage,
        heal: gem.heal,
        poison: gem.poison,
        shield: gem.shield,
        symbol: gemSymbol,
        tooltip,
        hasBonus,
        isUnlearned,
        proficiency: isUnlearned ? Math.round((1 - proficiency.failureChance) * 100) : 100,
        context
    };
}

/**
 * Initialize the gems system
 */
export function initialize() {
    console.log("Initializing Gems system");
    
    // Register event handlers
    EventBus.on('GEM_SELECT', ({ index, context }) => {
        // This is handled by battle/shop modules
    });
    
    EventBus.on('BATTLE_INIT', () => {
        // Reset gem collections if needed
    });
    
    EventBus.on('SHOP_PREPARE', () => {
        // Prepare gem pool for shop
    });
    
    return true;
}

// Export both named functions and a default object for flexibility
export const Gems = {
    initialize,
    resetGemBag,
    drawCards,
    recycleDiscardPile,
    standardizeGemKey,
    getGemType,
    getGemSymbol,
    buildGemTooltip,
    getGemProficiency,
    updateGemProficiency,
    checkGemFails,
    calculateGemMultiplier,
    processGemEffect,
    getUpgradeMultiplier,
    generateUpgradeOptions,
    createAlternativeGem,
    createClassAppropriateGemPool,
    getExplicitlyUnlockedGems,
    createGemElement
};

export default Gems;