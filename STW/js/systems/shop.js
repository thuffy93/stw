import { GameState } from '../core/state.js';
import { Utils } from '../core/utils.js';
import { Config } from '../core/config.js';
import { Gems } from './gems.js';

// Shop module - Handles shop mechanics
export const Shop = {
    /**
     * Prepare the shop for a visit
     */
    prepareShop() {
        // Reset shop-specific state
        GameState.set('inUpgradeMode', false);
        GameState.set('selectedGems', new Set());
        GameState.set('gemCatalog.upgradedThisShop', new Set());
        GameState.set('gemCatalog.gemPool', []);
        
        return {
            type: 'shop_prepared'
        };
    },
    
    /**
     * Handle buying a random gem
     * @returns {Object} Result of the purchase
     */
    buyRandomGem() {
        const player = GameState.get('player');
        const gemBag = GameState.get('gemBag');
        const maxGemBagSize = Config.MAX_GEM_BAG_SIZE;
        
        // Check if player can afford it
        if (player.zenny < Config.ZENNY.BUY_RANDOM_GEM_COST) {
            return {
                success: false,
                reason: 'not_enough_zenny'
            };
        }
        
        // Check if gem bag is full
        if (gemBag.length >= maxGemBagSize) {
            return {
                success: false,
                reason: 'gem_bag_full'
            };
        }
        
        // Get a list of unlocked gems
        const gemCatalog = GameState.get('gemCatalog');
        const unlockedGemKeys = gemCatalog.unlocked;
        
        if (unlockedGemKeys.length === 0) {
            return {
                success: false,
                reason: 'no_unlocked_gems'
            };
        }
        
        // Deduct cost
        player.zenny -= Config.ZENNY.BUY_RANDOM_GEM_COST;
        GameState.set('player.zenny', player.zenny);
        
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
        
        return {
            success: true,
            gem: newGem,
            cost: Config.ZENNY.BUY_RANDOM_GEM_COST
        };
    },
    
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
    },
    
    /**
     * Handle discarding a selected gem
     * @returns {Object} Result of the discard
     */
    discardSelectedGem() {
        const selectedGems = GameState.get('selectedGems');
        const hand = GameState.get('hand');
        const player = GameState.get('player');
        
        // Validation
        if (!selectedGems.size) {
            return {
                success: false,
                reason: 'no_selection'
            };
        }
        
        if (player.zenny < Config.ZENNY.DISCARD_GEM_COST) {
            return {
                success: false,
                reason: 'not_enough_zenny'
            };
        }
        
        // Get selected gem
        const index = Array.from(selectedGems)[0];
        
        // Validate index is in range
        if (index < 0 || index >= hand.length) {
            return {
                success: false,
                reason: 'invalid_selection'
            };
        }
        
        const gem = hand[index];
        
        // Remove gem from hand
        const newHand = [...hand];
        newHand.splice(index, 1);
        GameState.set('hand', newHand);
        
        // Deduct cost
        player.zenny -= Config.ZENNY.DISCARD_GEM_COST;
        GameState.set('player.zenny', player.zenny);
        
        // Clear selection
        GameState.set('selectedGems', new Set());
        
        return {
            success: true,
            gem: gem,
            cost: Config.ZENNY.DISCARD_GEM_COST
        };
    },
    
    /**
     * Handle healing in the shop
     * @returns {Object} Result of healing
     */
    healTen() {
        const player = GameState.get('player');
        
        // Validation
        if (player.zenny < Config.ZENNY.HEAL_COST) {
            return {
                success: false,
                reason: 'not_enough_zenny'
            };
        }
        
        if (player.health >= player.maxHealth) {
            return {
                success: false,
                reason: 'already_max_health'
            };
        }
        
        // Deduct cost
        player.zenny -= Config.ZENNY.HEAL_COST;
        
        // Calculate actual healing (considering max health cap)
        const startHealth = player.health;
        player.health = Math.min(player.health + Config.ZENNY.HEAL_AMOUNT, player.maxHealth);
        const actualHealing = player.health - startHealth;
        
        // Update player health
        GameState.set('player.health', player.health);
        GameState.set('player.zenny', player.zenny);
        
        return {
            success: true,
            healing: actualHealing,
            cost: Config.ZENNY.HEAL_COST
        };
    },
    
    /**
     * Initiate gem upgrade process
     * @returns {Object} Result of upgrade initiation
     */
    initiateGemUpgrade() {
        const selectedGems = GameState.get('selectedGems');
        const player = GameState.get('player');
        const hand = GameState.get('hand');
        const gemCatalog = GameState.get('gemCatalog');
        
        // Validate selection and cost
        if (selectedGems.size !== 1) {
            return {
                success: false,
                reason: 'invalid_selection'
            };
        }
        
        if (player.zenny < Config.ZENNY.UPGRADE_GEM_COST) {
            return {
                success: false,
                reason: 'not_enough_zenny'
            };
        }
        
        const selectedIndex = Array.from(selectedGems)[0];
        
        // Validate index is in range
        if (selectedIndex < 0 || selectedIndex >= hand.length) {
            return {
                success: false,
                reason: 'invalid_selection'
            };
        }
        
        const selectedGem = hand[selectedIndex];
        
        // Validate the selected gem exists
        if (!selectedGem) {
            return {
                success: false,
                reason: 'invalid_selection'
            };
        }
        
        if (selectedGem.freshlySwapped) {
            return {
                success: false,
                reason: 'freshly_swapped'
            };
        }
        
        if (gemCatalog.upgradedThisShop && gemCatalog.upgradedThisShop.has(selectedGem.id)) {
            return {
                success: false,
                reason: 'already_upgraded'
            };
        }
        
        // Deduct payment
        player.zenny -= Config.ZENNY.UPGRADE_GEM_COST;
        GameState.set('player.zenny', player.zenny);
        
        // Generate upgrade options using the Gems module
        const options = Gems.generateUpgradeOptions(selectedGem);
        
        // Ensure we have at least one upgrade option
        if (!options || options.length === 0) {
            console.error("No upgrade options generated");
            player.zenny += Config.ZENNY.UPGRADE_GEM_COST; // Refund
            GameState.set('player.zenny', player.zenny);
            
            return {
                success: false,
                reason: 'no_options'
            };
        }
        
        // Set the upgrade options in state
        GameState.set('gemCatalog.gemPool', options);
        
        // Set upgrade mode flag
        GameState.set('inUpgradeMode', true);
        
        return {
            success: true,
            options: options,
            cost: Config.ZENNY.UPGRADE_GEM_COST
        };
    },
    
    /**
     * Select an upgrade option
     * @param {Number} poolIndex - Index of the selected option in the pool
     * @returns {Object} Result of option selection
     */
    selectUpgradeOption(poolIndex) {
        const selectedGems = GameState.get('selectedGems');
        const gemCatalog = GameState.get('gemCatalog');
        const hand = GameState.get('hand');
        
        // Validation
        if (!GameState.get('inUpgradeMode') || selectedGems.size !== 1) {
            return {
                success: false,
                reason: 'not_in_upgrade_mode'
            };
        }
        
        if (poolIndex < 0 || !gemCatalog.gemPool || poolIndex >= gemCatalog.gemPool.length) {
            return {
                success: false,
                reason: 'invalid_option'
            };
        }
        
        // Get the selected gem and upgrade option
        const selectedIndex = Array.from(selectedGems)[0];
        
        // Validate index is in range
        if (selectedIndex < 0 || selectedIndex >= hand.length) {
            return {
                success: false,
                reason: 'invalid_selection'
            };
        }
        
        const selectedGem = hand[selectedIndex];
        const upgradeOption = gemCatalog.gemPool[poolIndex];
        
        if (!upgradeOption) {
            return {
                success: false,
                reason: 'invalid_option'
            };
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
            
            // Update proficiency in active state
            const gemProficiency = GameState.get('gemProficiency');
            gemProficiency[gemKey] = { 
                successCount: Config.COMBAT.FULL_PROFICIENCY_THRESHOLD, 
                failureChance: 0 
            };
            GameState.set('gemProficiency', gemProficiency);
            
            // Also update in class-specific proficiency
            const playerClass = GameState.get('player.class');
            if (playerClass) {
                GameState.set(`classGemProficiency.${playerClass}.${gemKey}`, { 
                    successCount: Config.COMBAT.FULL_PROFICIENCY_THRESHOLD, 
                    failureChance: 0 
                });
            }
        }
        
        // Reset upgrade mode state
        GameState.set('selectedGems', new Set());
        GameState.set('inUpgradeMode', false);
        GameState.set('gemCatalog.gemPool', []);
        
        return {
            success: true,
            originalGem: selectedGem,
            newGem: newHand[selectedIndex],
            isClassUpgrade: isClassUpgrade,
            isDirectUpgrade: upgradeOption.isDirectUpgrade,
            isAlternateUpgrade: upgradeOption.isAlternateUpgrade
        };
    },
    
    /**
     * Cancel gem upgrade in the shop
     * @returns {Object} Result of cancellation
     */
    cancelUpgrade() {
        // Refund the cost
        const player = GameState.get('player');
        GameState.set('player.zenny', player.zenny + Config.ZENNY.UPGRADE_GEM_COST);
        
        // Reset upgrade mode state
        GameState.set('inUpgradeMode', false);
        GameState.set('gemCatalog.gemPool', []);
        GameState.set('selectedGems', new Set());
        
        return {
            success: true,
            refund: Config.ZENNY.UPGRADE_GEM_COST
        };
    }
};