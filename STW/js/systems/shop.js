import { GameState } from '../core/state.js';
import { EventBus } from '../core/eventbus.js';
import { Config } from '../core/config.js';
import { Utils } from '../core/utils.js';
import { Gems } from './gem.js';

/**
 * Shop module - Handles shop interactions and gem upgrades
 */
export class Shop {
    constructor() {
        // Store event subscriptions for potential cleanup
        this.eventSubscriptions = [];
        this.initialize();
    }

    /**
     * Initialize the Shop module and register event handlers
     */
    initialize() {
        console.log("Initializing Shop module");
        
        // Register event handlers with consistent pattern
        this.subscribeToEvents();
        
        return true;
    }

    /**
     * Subscribe to all shop-related events
     */
    subscribeToEvents() {
        // Using consistent event subscription pattern
        this.subscribe('SHOP_PREPARE', this.prepareShop.bind(this));
        this.subscribe('BUY_RANDOM_GEM', this.buyRandomGem.bind(this));
        this.subscribe('DISCARD_GEM', this.discardSelectedGem.bind(this));
        this.subscribe('HEAL_IN_SHOP', this.healTen.bind(this));
        this.subscribe('INITIATE_UPGRADE', this.initiateGemUpgrade.bind(this));
        this.subscribe('UPGRADE_OPTION_SELECTED', ({ poolIndex }) => this.selectUpgradeOption(poolIndex));
        this.subscribe('CANCEL_UPGRADE', this.cancelUpgrade.bind(this));
        this.subscribe('CONTINUE_FROM_SHOP', this.continueFromShop.bind(this));
    }

    /**
     * Helper method to subscribe to events and track subscriptions
     * @param {String} eventName - Event name
     * @param {Function} handler - Event handler
     */
    subscribe(eventName, handler) {
        const subscription = EventBus.on(eventName, handler);
        this.eventSubscriptions.push(subscription);
        return subscription;
    }

    /**
     * Unsubscribe from all events (useful for cleanup/testing)
     */
    unsubscribeAll() {
        this.eventSubscriptions.forEach(subscription => {
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        });
        this.eventSubscriptions = [];
    }

    /**
     * Prepare the shop for a visit
     */
    prepareShop() {
        console.log("Preparing shop");
        
        // Reset shop-specific state
        GameState.set('inUpgradeMode', false);
        GameState.set('selectedGems', new Set());
        GameState.set('gemCatalog.upgradedThisShop', new Set());
        GameState.set('gemCatalog.gemPool', []);
        
        // Load hand from localStorage if it exists (backup mechanism)
        const savedHand = localStorage.getItem(Config.STORAGE_KEYS.TEMP_HAND);
        if (savedHand && (!GameState.get('hand') || GameState.get('hand').length === 0)) {
            try {
                const parsedHand = JSON.parse(savedHand);
                if (Array.isArray(parsedHand) && parsedHand.length > 0) {
                    console.log("RESTORING HAND FROM BACKUP:", parsedHand);
                    GameState.set('hand', parsedHand);
                }
            } catch (e) {
                console.error("Failed to parse saved hand:", e);
            }
        }
        
        // Emit shop prepared event with consistent pattern
        EventBus.emit('SHOP_PREPARED');
    }
    
    /**
     * Buy a random gem for the gem bag
     */
    buyRandomGem() {
        const player = GameState.get('player');
        const gemBag = GameState.get('gemBag');
        
        // Check if player can afford it
        if (player.zenny < 3) {
            EventBus.emit('UI_MESSAGE', {
                message: "Not enough $ZENNY!",
                type: 'error'
            });
            return false;
        }
        
        // Check if gem bag is full
        if (gemBag.length >= Config.MAX_GEM_BAG_SIZE) {
            EventBus.emit('UI_MESSAGE', {
                message: "Gem bag is full!",
                type: 'error'
            });
            return false;
        }
        
        // Get a list of unlocked gems
        const gemCatalog = GameState.get('gemCatalog');
        const unlockedGemKeys = gemCatalog.unlocked;
        
        if (unlockedGemKeys.length === 0) {
            EventBus.emit('UI_MESSAGE', {
                message: "No unlocked gems available!",
                type: 'error'
            });
            return false;
        }
        
        // Deduct cost
        GameState.set('player.zenny', player.zenny - 3);
        
        // Get a random gem from unlocked ones, weighted toward class-appropriate
        const randomGemKey = this.getRandomWeightedGem(unlockedGemKeys);
        
        // Create the new gem
        const newGem = { 
            ...Config.BASE_GEMS[randomGemKey], 
            id: `${randomGemKey}-${Utils.generateId()}`, 
            freshlySwapped: false
        };
        
        // Add to gem bag
        GameState.set('gemBag', [...gemBag, newGem]);
        
        // Shuffle the gem bag
        const shuffledBag = Utils.shuffle(GameState.get('gemBag'));
        GameState.set('gemBag', shuffledBag);
        
        // Show success message
        EventBus.emit('UI_MESSAGE', {
            message: `Bought ${newGem.name} and added to your Gem Bag!`
        });
        
        // Emit sound event
        EventBus.emit('PLAY_SOUND', { sound: 'BUTTON_CLICK' });
        
        // Emit shop update event
        EventBus.emit('UI_UPDATE', { target: 'shop' });
        
        return true;
    }
    
    /**
     * Get a random gem with weighting toward class-appropriate gems
     * @param {Array} gemKeys - Array of gem keys
     * @returns {String} Selected gem key
     */
    getRandomWeightedGem(gemKeys) {
        const playerClass = GameState.get('player.class');
        
        // Define weights for different gem types
        const weights = {
            classMatched: 3,  // Higher chance for class-matching gems
            grey: 2,         // Medium chance for grey (universal) gems
            other: 1         // Lower chance for non-matching gems
        };
        
        // Get player's class color
        const classColors = {
            "Knight": "red",
            "Mage": "blue",
            "Rogue": "green"
        };
        const classColor = classColors[playerClass];
        
        // Build weighted list
        const weightedList = [];
        
        gemKeys.forEach(key => {
            const gem = Config.BASE_GEMS[key];
            if (!gem) return;
            
            let weight = weights.other;
            
            if (gem.color === classColor) {
                weight = weights.classMatched;
            } else if (gem.color === "grey") {
                weight = weights.grey;
            }
            
            // Add gem to list multiple times based on weight
            for (let i = 0; i < weight; i++) {
                weightedList.push(key);
            }
        });
        
        // Pick random entry from weighted list
        return weightedList[Math.floor(Math.random() * weightedList.length)];
    }
    
    /**
     * Discard a selected gem
     */
    discardSelectedGem() {
        const selectedGems = GameState.get('selectedGems');
        const hand = GameState.get('hand');
        const player = GameState.get('player');
        
        // Validation
        if (!selectedGems.size) {
            EventBus.emit('UI_MESSAGE', {
                message: "Select a gem to discard!",
                type: 'error'
            });
            return false;
        }
        
        if (player.zenny < 3) {
            EventBus.emit('UI_MESSAGE', {
                message: "Not enough $ZENNY to discard!",
                type: 'error'
            });
            return false;
        }
        
        // Get selected gem
        const index = Array.from(selectedGems)[0];
        
        // Validate index is in range
        if (index < 0 || index >= hand.length) {
            EventBus.emit('UI_MESSAGE', {
                message: "Invalid gem selection",
                type: 'error'
            });
            return false;
        }
        
        const gem = hand[index];
        
        // Remove gem from hand
        const newHand = [...hand];
        newHand.splice(index, 1);
        GameState.set('hand', newHand);
        
        // Deduct cost
        GameState.set('player.zenny', player.zenny - 3);
        
        // Show success message
        EventBus.emit('UI_MESSAGE', {
            message: `Discarded ${gem.name} for 3 $ZENNY`
        });
        
        // Emit sound event
        EventBus.emit('PLAY_SOUND', { sound: 'BUTTON_CLICK' });
        
        // Clear selection
        GameState.set('selectedGems', new Set());
        
        // Emit UI update events
        EventBus.emit('HAND_UPDATED');
        EventBus.emit('UI_UPDATE', { target: 'shop' });
        
        return true;
    }
    
    /**
     * Heal player in the shop
     */
    healTen() {
        const player = GameState.get('player');
        
        // Validation
        if (player.zenny < 3) {
            EventBus.emit('UI_MESSAGE', {
                message: "Not enough $ZENNY!",
                type: 'error'
            });
            return false;
        }
        
        if (player.health >= player.maxHealth) {
            EventBus.emit('UI_MESSAGE', {
                message: "Already at full health!",
                type: 'error'
            });
            return false;
        }
        
        // Calculate actual healing (considering max health cap)
        const startHealth = player.health;
        const newHealth = Math.min(player.health + 10, player.maxHealth);
        const actualHealing = newHealth - startHealth;
        
        // Deduct cost
        GameState.set('player.zenny', player.zenny - 3);
        
        // Update player health
        GameState.set('player.health', newHealth);
        
        // Show success message with actual amount healed
        EventBus.emit('UI_MESSAGE', {
            message: `Healed ${actualHealing} health!`
        });
        
        // Emit sound event
        EventBus.emit('PLAY_SOUND', { sound: 'HEAL' });
        
        // Emit UI update event
        EventBus.emit('UI_UPDATE', { target: 'shop' });
        
        return true;
    }
    
    /**
     * Initiate gem upgrade process
     */
    initiateGemUpgrade() {
        const selectedGems = GameState.get('selectedGems');
        const player = GameState.get('player');
        const hand = GameState.get('hand');
        const gemCatalog = GameState.get('gemCatalog');
        
        // Validate selection and cost
        if (selectedGems.size !== 1) {
            EventBus.emit('UI_MESSAGE', {
                message: "Select a gem to upgrade",
                type: 'error'
            });
            return false;
        }
        
        if (player.zenny < 5) {
            EventBus.emit('UI_MESSAGE', {
                message: "Not enough $ZENNY! Need 5.",
                type: 'error'
            });
            return false;
        }
        
        const selectedIndex = Array.from(selectedGems)[0];
        
        // Validate index is in range
        if (selectedIndex < 0 || selectedIndex >= hand.length) {
            EventBus.emit('UI_MESSAGE', {
                message: "Invalid gem selection",
                type: 'error'
            });
            return false;
        }
        
        const selectedGem = hand[selectedIndex];
        
        // Validate the selected gem exists
        if (!selectedGem) {
            EventBus.emit('UI_MESSAGE', {
                message: "Invalid gem selection",
                type: 'error'
            });
            return false;
        }
        
        if (selectedGem.freshlySwapped) {
            EventBus.emit('UI_MESSAGE', {
                message: "Cannot upgrade a freshly swapped gem!",
                type: 'error'
            });
            return false;
        }
        
        if (gemCatalog.upgradedThisShop && gemCatalog.upgradedThisShop.has(selectedGem.id)) {
            EventBus.emit('UI_MESSAGE', {
                message: "This gem was already upgraded this shop visit!",
                type: 'error'
            });
            return false;
        }
        
        // Deduct payment
        GameState.set('player.zenny', player.zenny - 5);
        
        // Generate upgrade options using the Gems module
        const options = Gems.generateUpgradeOptions(selectedGem);
        
        // Ensure we have at least one upgrade option
        if (!options || options.length === 0) {
            console.error("No upgrade options generated");
            GameState.set('player.zenny', player.zenny + 5); // Refund
            EventBus.emit('UI_MESSAGE', {
                message: "Unable to generate upgrade options",
                type: 'error'
            });
            return false;
        }
        
        // Set the upgrade options in state
        GameState.set('gemCatalog.gemPool', options);
        
        // Set upgrade mode flag
        GameState.set('inUpgradeMode', true);
        
        // Emit sound event
        EventBus.emit('PLAY_SOUND', { sound: 'BUTTON_CLICK' });
        
        // Emit UI update event
        EventBus.emit('UI_UPDATE', { target: 'shop' });
        
        return true;
    }
    
    /**
     * Select an upgrade option
     * @param {Number} poolIndex - Index of the selected option in the pool
     */
    selectUpgradeOption(poolIndex) {
        const selectedGems = GameState.get('selectedGems');
        const gemCatalog = GameState.get('gemCatalog');
        const hand = GameState.get('hand');
        
        // Validation
        if (!GameState.get('inUpgradeMode') || selectedGems.size !== 1) {
            EventBus.emit('UI_MESSAGE', {
                message: "Please select a gem first",
                type: 'error'
            });
            return false;
        }
        
        if (poolIndex < 0 || !gemCatalog.gemPool || poolIndex >= gemCatalog.gemPool.length) {
            EventBus.emit('UI_MESSAGE', {
                message: "Invalid upgrade option",
                type: 'error'
            });
            return false;
        }
        
        // Get the selected gem and upgrade option
        const selectedIndex = Array.from(selectedGems)[0];
        
        // Validate index is in range
        if (selectedIndex < 0 || selectedIndex >= hand.length) {
            EventBus.emit('UI_MESSAGE', {
                message: "Invalid gem selection",
                type: 'error'
            });
            return false;
        }
        
        const selectedGem = hand[selectedIndex];
        const upgradeOption = gemCatalog.gemPool[poolIndex];
        
        if (!upgradeOption) {
            EventBus.emit('UI_MESSAGE', {
                message: "Upgrade option not available",
                type: 'error'
            });
            return false;
        }
        
        // Check if this is a class-specific upgrade
        const isClassUpgrade = upgradeOption.isClassUpgrade;
        
        // Replace the selected gem with the upgrade
        const newHand = [...hand];
        newHand[selectedIndex] = {
            ...upgradeOption,
            id: `${upgradeOption.name}-${Utils.generateId()}`,
            freshlySwapped: false
        };
        
        GameState.set('hand', newHand);
        
        // Ensure upgradedThisShop is initialized as a Set
        if (!gemCatalog.upgradedThisShop || !(gemCatalog.upgradedThisShop instanceof Set)) {
            gemCatalog.upgradedThisShop = new Set();
        }
        
        // Mark as upgraded this shop visit
        gemCatalog.upgradedThisShop.add(newHand[selectedIndex].id);
        GameState.set('gemCatalog.upgradedThisShop', gemCatalog.upgradedThisShop);
        
        // IMPORTANT: If this is a class-specific upgrade, ensure proficiency
        if (isClassUpgrade) {
            const gemName = upgradeOption.name;
            const gemColor = upgradeOption.color;
            const gemKey = `${gemColor}${gemName.replace(/\s+/g, '')}`;
            
            console.log(`Ensuring proficiency for class-specific upgrade: ${gemKey}`);
            
            // Update proficiency in active state
            const gemProficiency = GameState.get('gemProficiency');
            gemProficiency[gemKey] = { successCount: 6, failureChance: 0 };
            GameState.set('gemProficiency', gemProficiency);
            
            // Also update in class-specific proficiency
            const playerClass = GameState.get('player.class');
            if (playerClass) {
                GameState.set(`classGemProficiency.${playerClass}.${gemKey}`, { successCount: 6, failureChance: 0 });
            }
            
            // Emit proficiency update event
            EventBus.emit('GEM_PROFICIENCY_UPDATED', { 
                gemKey, 
                proficiency: { successCount: 6, failureChance: 0 } 
            });
        }
        
        // Emit sound event
        EventBus.emit('PLAY_SOUND', { sound: 'BUTTON_CLICK' });
        
        // Reset upgrade mode state
        GameState.set('selectedGems', new Set());
        GameState.set('inUpgradeMode', false);
        GameState.set('gemCatalog.gemPool', []);
        
        // Show appropriate success message
        if (upgradeOption.isDirectUpgrade) {
            EventBus.emit('UI_MESSAGE', {
                message: `Upgraded ${selectedGem.name} to +${upgradeOption.upgradeCount}!`
            });
        } else if (isClassUpgrade) {
            EventBus.emit('UI_MESSAGE', {
                message: `Transformed ${selectedGem.name} into ${upgradeOption.name} (fully mastered)!`
            });
        } else if (upgradeOption.isAlternateUpgrade) {
            EventBus.emit('UI_MESSAGE', {
                message: `Transformed ${selectedGem.name} into ${upgradeOption.name}!`
            });
        }
        
        // Emit upgrade event
        EventBus.emit('GEM_UPGRADED', {
            originalGem: selectedGem,
            newGem: newHand[selectedIndex],
            isClassUpgrade,
            isDirectUpgrade: upgradeOption.isDirectUpgrade
        });
        
        // Emit UI update events
        EventBus.emit('HAND_UPDATED');
        EventBus.emit('UI_UPDATE', { target: 'shop' });
        
        return true;
    }
    
    /**
     * Cancel gem upgrade in the shop
     */
    cancelUpgrade() {
        // Refund the cost
        const player = GameState.get('player');
        GameState.set('player.zenny', player.zenny + 5);
        
        // Reset upgrade mode state
        GameState.set('inUpgradeMode', false);
        GameState.set('gemCatalog.gemPool', []);
        GameState.set('selectedGems', new Set());
        
        // Show success message
        EventBus.emit('UI_MESSAGE', {
            message: "Upgrade canceled, 5 $ZENNY refunded"
        });
        
        // Emit UI update event
        EventBus.emit('UI_UPDATE', { target: 'shop' });
        
        return true;
    }
    
    /**
     * Continue from shop to next battle
     */
    continueFromShop() {
        // Save hand state to localStorage
        const hand = GameState.get('hand');
        try {
            localStorage.setItem(Config.STORAGE_KEYS.TEMP_HAND, JSON.stringify(hand));
            console.log("Saved hand state for next battle", hand);
        } catch (e) {
            console.error("Error saving hand state:", e);
        }
        
        // Emit continue from shop event
        EventBus.emit('CONTINUE_FROM_SHOP');
        
        return true;
    }
}

// Create and export singleton instance
export const ShopInstance = new Shop();

// For backwards compatibility
export default ShopInstance;