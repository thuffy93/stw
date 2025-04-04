// Shop System - Handles shop interactions in the ECS architecture
import { System } from '../core/ecs/System.js';
import { EntityManager } from '../core/ecs/EntityManager.js';
import { ComponentFactory } from '../core/ecs/ComponentFactory.js';
import { EventBus } from '../core/eventbus.js';
import { Utils } from '../core/utils.js';
import { Config } from '../core/config.js';

/**
 * ShopSystem - Manages shop interactions and gem upgrades
 */
export class ShopSystem extends System {
    constructor() {
        super('ShopSystem');
        this.currentShopId = null;
    }
    
    /**
     * Get event handlers for this system
     * @returns {Map} Map of event names to handler functions
     */
    getEventHandlers() {
        const handlers = new Map();
        
        handlers.set('SHOP_PREPARE', this.handleShopPrepare);
        handlers.set('BUY_RANDOM_GEM', this.handleBuyRandomGem);
        handlers.set('DISCARD_GEM', this.handleDiscardGem);
        handlers.set('HEAL_IN_SHOP', this.handleHealInShop);
        handlers.set('INITIATE_UPGRADE', this.handleInitiateUpgrade);
        handlers.set('UPGRADE_OPTION_SELECTED', this.handleUpgradeOptionSelected);
        handlers.set('CANCEL_UPGRADE', this.handleCancelUpgrade);
        handlers.set('CONTINUE_FROM_SHOP', this.handleContinueFromShop);
        handlers.set('GEM_SELECT', this.handleGemSelect);
        
        return handlers;
    }
    
    /**
     * Prepare the shop for a visit
     */
    handleShopPrepare() {
        console.log('Preparing shop in ECS architecture');
        
        // Create a shop entity to track state
        const shopId = EntityManager.createEntity(['shop']);
        this.currentShopId = shopId;
        
        // Add shop state component
        EntityManager.addComponent(shopId, 'ShopState', {
            inUpgradeMode: false,
            selectedGems: new Set(),
            upgradedGems: new Set()
        });
        
        // Load hand from localStorage if it exists (backup mechanism)
        const collectionsId = this.getPlayerCollectionsEntity();
        if (collectionsId) {
            const handComponent = EntityManager.getComponent(collectionsId, 'Hand');
            
            if (handComponent && (!handComponent.items || handComponent.items.length === 0)) {
                try {
                    const savedHand = localStorage.getItem('stw_temp_hand');
                    if (savedHand) {
                        const parsedHand = JSON.parse(savedHand);
                        if (Array.isArray(parsedHand) && parsedHand.length > 0) {
                            console.log('Restoring hand from backup:', parsedHand);
                            EntityManager.updateComponent(collectionsId, 'Hand', {
                                items: parsedHand
                            });
                        }
                    }
                } catch (e) {
                    console.error('Error loading saved hand:', e);
                }
            }
        }
        
        // Emit shop prepared event
        EventBus.emit('SHOP_PREPARED');
    }
    
    /**
     * Handle gem selection in shop
     * @param {Object} data - Selection data
     */
    handleGemSelect(data) {
        if (!this.currentShopId) return;
        
        // Only handle events in shop context
        if (data.context !== 'shop') return;
        
        const shopState = EntityManager.getComponent(this.currentShopId, 'ShopState');
        if (!shopState) return;
        
        // In upgrade mode, we don't allow new selections
        if (shopState.inUpgradeMode) return;
        
        const { index } = data;
        
        // Get collections to validate index
        const collectionsId = this.getPlayerCollectionsEntity();
        if (!collectionsId) return;
        
        const handComponent = EntityManager.getComponent(collectionsId, 'Hand');
        if (!handComponent || index < 0 || index >= handComponent.items.length) return;
        
        // Check if already selected
        const selectedGems = new Set(shopState.selectedGems);
        
        // In shop, only one gem can be selected at a time (toggle behavior)
        if (selectedGems.has(index)) {
            selectedGems.delete(index);
        } else {
            selectedGems.clear();
            selectedGems.add(index);
        }
        
        // Update shop state
        EntityManager.updateComponent(this.currentShopId, 'ShopState', {
            selectedGems
        });
        
        // Emit selection changed event
        EventBus.emit('GEM_SELECTION_CHANGED', {
            selectedIndices: Array.from(selectedGems)
        });
        
        // Update shop UI
        EventBus.emit('UI_UPDATE', { target: 'shop' });
    }
    
    /**
     * Buy a random gem
     */
    handleBuyRandomGem() {
        const playerId = this.getPlayerEntity();
        if (!playerId) return;
        
        const statsComponent = EntityManager.getComponent(playerId, 'Stats');
        if (!statsComponent) return;
        
        const collectionsId = this.getPlayerCollectionsEntity();
        if (!collectionsId) return;
        
        const gemBagComponent = EntityManager.getComponent(collectionsId, 'GemBag');
        if (!gemBagComponent) return;
        
        // Check if player can afford it
        if (statsComponent.zenny < 3) {
            EventBus.emit('UI_MESSAGE', {
                message: 'Not enough $ZENNY!',
                type: 'error'
            });
            return;
        }
        
        // Check if gem bag is full
        if (gemBagComponent.items.length >= Config.MAX_GEM_BAG_SIZE) {
            EventBus.emit('UI_MESSAGE', {
                message: 'Gem bag is full!',
                type: 'error'
            });
            return;
        }
        
        // Get a random gem from unlocked gems
        const gemCatalogComponent = EntityManager.getComponent(playerId, 'GemCatalog');
        if (!gemCatalogComponent || !gemCatalogComponent.unlocked || gemCatalogComponent.unlocked.length === 0) {
            EventBus.emit('UI_MESSAGE', {
                message: 'No unlocked gems available!',
                type: 'error'
            });
            return;
        }
        
        // Deduct cost
        EntityManager.updateComponent(playerId, 'Stats', {
            zenny: statsComponent.zenny - 3
        });
        
        // Get a random gem using weighted selection
        const randomGemKey = this.getRandomWeightedGem(gemCatalogComponent.unlocked);
        
        // Create the new gem
        const gemId = EntityManager.createEntity(['gem']);
        EntityManager.addComponent(gemId, 'Gem', ComponentFactory.createGemComponent({
            ...Config.BASE_GEMS[randomGemKey],
            id: `${randomGemKey}-${Utils.generateId()}`
        }));
        
        // Add to gem bag
        const updatedGemBag = [...gemBagComponent.items, gemId];
        
        EntityManager.updateComponent(collectionsId, 'GemBag', {
            items: Utils.shuffle(updatedGemBag)
        });
        
        // Show success message
        const gemName = Config.BASE_GEMS[randomGemKey].name;
        EventBus.emit('UI_MESSAGE', {
            message: `Bought ${gemName} and added to your Gem Bag!`
        });
        
        // Emit sound event
        EventBus.emit('PLAY_SOUND', { sound: 'BUTTON_CLICK' });
        
        // Update UI
        EventBus.emit('UI_UPDATE', { target: 'shop' });
    }
    
    /**
     * Get a random gem with weighting toward class-appropriate gems
     * @param {Array} gemKeys - Array of gem keys
     * @returns {String} Selected gem key
     */
    getRandomWeightedGem(gemKeys) {
        const playerId = this.getPlayerEntity();
        if (!playerId) return gemKeys[0];
        
        const classComponent = EntityManager.getComponent(playerId, 'Class');
        if (!classComponent) return gemKeys[0];
        
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
        const classColor = classColors[classComponent.type];
        
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
        
        if (weightedList.length === 0) return gemKeys[0];
        
        // Pick random entry from weighted list
        return weightedList[Math.floor(Math.random() * weightedList.length)];
    }
    
    /**
     * Handle discard gem action
     */
    handleDiscardGem() {
        if (!this.currentShopId) return;
        
        const shopState = EntityManager.getComponent(this.currentShopId, 'ShopState');
        if (!shopState) return;
        
        // Get the selected gem
        const selectedGems = Array.from(shopState.selectedGems);
        if (selectedGems.length === 0) {
            EventBus.emit('UI_MESSAGE', {
                message: 'Select a gem to discard!',
                type: 'error'
            });
            return;
        }
        
        const playerId = this.getPlayerEntity();
        if (!playerId) return;
        
        const statsComponent = EntityManager.getComponent(playerId, 'Stats');
        if (!statsComponent) return;
        
        // Check if player can afford it
        if (statsComponent.zenny < 3) {
            EventBus.emit('UI_MESSAGE', {
                message: 'Not enough $ZENNY to discard!',
                type: 'error'
            });
            return;
        }
        
        const collectionsId = this.getPlayerCollectionsEntity();
        if (!collectionsId) return;
        
        const handComponent = EntityManager.getComponent(collectionsId, 'Hand');
        if (!handComponent) return;
        
        // Get selected gem index
        const index = selectedGems[0];
        
        // Validate index is in range
        if (index < 0 || index >= handComponent.items.length) {
            EventBus.emit('UI_MESSAGE', {
                message: 'Invalid gem selection',
                type: 'error'
            });
            return;
        }
        
        // Get the gem entity ID
        const gemId = handComponent.items[index];
        
        // Get gem info for message
        const gemComponent = EntityManager.getComponent(gemId, 'Gem');
        const gemName = gemComponent ? gemComponent.name : 'Gem';
        
        // Remove gem from hand
        const newHand = [...handComponent.items];
        newHand.splice(index, 1);
        
        EntityManager.updateComponent(collectionsId, 'Hand', {
            items: newHand
        });
        
        // Deduct cost
        EntityManager.updateComponent(playerId, 'Stats', {
            zenny: statsComponent.zenny - 3
        });
        
        // Remove the gem entity
        EntityManager.removeEntity(gemId);
        
        // Show success message
        EventBus.emit('UI_MESSAGE', {
            message: `Discarded ${gemName} for 3 $ZENNY`
        });
        
        // Clear selection
        EntityManager.updateComponent(this.currentShopId, 'ShopState', {
            selectedGems: new Set()
        });
        
        // Update UI
        EventBus.emit('HAND_UPDATED');
        EventBus.emit('UI_UPDATE', { target: 'shop' });
    }
    
    /**
     * Handle healing in the shop
     */
    handleHealInShop() {
        const playerId = this.getPlayerEntity();
        if (!playerId) return;
        
        const statsComponent = EntityManager.getComponent(playerId, 'Stats');
        if (!statsComponent) return;
        
        // Check if player can afford it
        if (statsComponent.zenny < 3) {
            EventBus.emit('UI_MESSAGE', {
                message: 'Not enough $ZENNY!',
                type: 'error'
            });
            return;
        }
        
        // Check if player is already at full health
        if (statsComponent.health >= statsComponent.maxHealth) {
            EventBus.emit('UI_MESSAGE', {
                message: 'Already at full health!',
                type: 'error'
            });
            return;
        }
        
        // Calculate actual healing (considering max health cap)
        const startHealth = statsComponent.health;
        const newHealth = Math.min(startHealth + 10, statsComponent.maxHealth);
        const actualHealing = newHealth - startHealth;
        
        // Deduct cost
        EntityManager.updateComponent(playerId, 'Stats', {
            zenny: statsComponent.zenny - 3,
            health: newHealth
        });
        
        // Show success message
        EventBus.emit('UI_MESSAGE', {
            message: `Healed ${actualHealing} health!`
        });
        
        // Play healing sound
        EventBus.emit('PLAY_SOUND', { sound: 'HEAL' });
        
        // Update UI
        EventBus.emit('UI_UPDATE', { target: 'shop' });
    }
    
    /**
     * Handle initiating a gem upgrade
     */
    handleInitiateUpgrade() {
        if (!this.currentShopId) return;
        
        const shopState = EntityManager.getComponent(this.currentShopId, 'ShopState');
        if (!shopState) return;
        
        // Get selected gems
        const selectedGems = Array.from(shopState.selectedGems);
        if (selectedGems.length !== 1) {
            EventBus.emit('UI_MESSAGE', {
                message: 'Select a gem to upgrade',
                type: 'error'
            });
            return;
        }
        
        const playerId = this.getPlayerEntity();
        if (!playerId) return;
        
        const statsComponent = EntityManager.getComponent(playerId, 'Stats');
        if (!statsComponent) return;
        
        // Check if player can afford it
        if (statsComponent.zenny < 5) {
            EventBus.emit('UI_MESSAGE', {
                message: 'Not enough $ZENNY! Need 5.',
                type: 'error'
            });
            return;
        }
        
        const collectionsId = this.getPlayerCollectionsEntity();
        if (!collectionsId) return;
        
        const handComponent = EntityManager.getComponent(collectionsId, 'Hand');
        if (!handComponent) return;
        
        // Get selected gem index
        const selectedIndex = selectedGems[0];
        
        // Validate index is in range
        if (selectedIndex < 0 || selectedIndex >= handComponent.items.length) {
            EventBus.emit('UI_MESSAGE', {
                message: 'Invalid gem selection',
                type: 'error'
            });
            return;
        }
        
        // Get the gem entity
        const gemId = handComponent.items[selectedIndex];
        const gemComponent = EntityManager.getComponent(gemId, 'Gem');
        
        if (!gemComponent) {
            EventBus.emit('UI_MESSAGE', {
                message: 'Invalid gem selection',
                type: 'error'
            });
            return;
        }
        
        // Check if gem was freshly swapped
        if (gemComponent.freshlySwapped) {
            EventBus.emit('UI_MESSAGE', {
                message: 'Cannot upgrade a freshly swapped gem!',
                type: 'error'
            });
            return;
        }
        
        // Check if gem was already upgraded this shop visit
        if (shopState.upgradedGems.has(gemId)) {
            EventBus.emit('UI_MESSAGE', {
                message: 'This gem was already upgraded this shop visit!',
                type: 'error'
            });
            return;
        }
        
        // Deduct payment
        EntityManager.updateComponent(playerId, 'Stats', {
            zenny: statsComponent.zenny - 5
        });
        
        // Generate upgrade options
        const upgradeOptions = this.generateUpgradeOptions(gemComponent);
        
        // Set the upgrade options in shop state
        EntityManager.updateComponent(this.currentShopId, 'ShopState', {
            inUpgradeMode: true,
            upgradeOptions
        });
        
        // Emit sound
        EventBus.emit('PLAY_SOUND', { sound: 'BUTTON_CLICK' });
        
        // Update UI
        EventBus.emit('UI_UPDATE', { target: 'shop' });
    }
    
    /**
     * Generate upgrade options for a gem
     * @param {Object} selectedGem - The gem to upgrade
     * @returns {Array} Array of upgrade option objects
     */
    generateUpgradeOptions(selectedGem) {
        const gemColor = selectedGem.color;
        const playerId = this.getPlayerEntity();
        
        if (!playerId) return [];
        
        const classComponent = EntityManager.getComponent(playerId, 'Class');
        const gemCatalogComponent = EntityManager.getComponent(playerId, 'GemCatalog');
        
        if (!classComponent || !gemCatalogComponent) return [];
        
        const options = [];
        
        // Option 1: Direct upgrade (always available)
        options.push(this.createDirectUpgrade(selectedGem));
        
        // Option 2: Class-specific upgrade if applicable
        const classUpgrade = this.createClassUpgrade(selectedGem, classComponent.type);
        if (classUpgrade) {
            options.push(classUpgrade);
        }
        
        // Option 3-4: Alternative gems from unlocked catalog
        const alternativeCount = options.length > 1 ? 1 : 2; // Fewer alternatives if we have a class upgrade
        const alternatives = this.createAlternativeUpgrades(selectedGem, gemCatalogComponent, alternativeCount);
        options.push(...alternatives);
        
        return options;
    }
    
    /**
     * Create a direct upgrade for a gem
     * @param {Object} gem - The gem to upgrade
     * @returns {Object} Upgraded gem data
     */
    createDirectUpgrade(gem) {
        const directUpgrade = { 
            ...gem,
            id: `${gem.name}-upgraded-${Utils.generateId()}`,
            upgradeCount: (gem.upgradeCount || 0) + 1,
            freshlySwapped: false,
            isDirectUpgrade: true
        };
        
        // Calculate stat improvements based on rarity
        const upgradeMultiplier = this.getUpgradeMultiplier(gem.rarity);
        
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
     * @param {String} className - Class name
     * @returns {Object|null} Class-specific upgrade or null if not applicable
     */
    createClassUpgrade(gem, className) {
        const classSpecificUpgrades = {
            "redAttack": "redStrongAttack",
            "blueMagicAttack": "blueStrongHeal",
            "greenAttack": "greenQuickAttack"
        };
        
        const gemKey = `${gem.color}${gem.name.replace(/\s+/g, '')}`;
        
        if (!classSpecificUpgrades[gemKey]) return null;
        
        const upgradeKey = classSpecificUpgrades[gemKey];
        const upgradeBase = Config.BASE_GEMS[upgradeKey];
        
        if (!upgradeBase) return null;
        
        // Only provide class-specific upgrades for the player's class
        const classColors = {
            "Knight": "red",
            "Mage": "blue",
            "Rogue": "green"
        };
        
        if (upgradeBase.color !== classColors[className]) return null;
        
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
     * @param {Object} catalog - Gem catalog component
     * @param {Number} maxCount - Maximum number of alternatives
     * @returns {Array} Alternative upgrades
     */
    createAlternativeUpgrades(gem, catalog, maxCount) {
        const baseGemKeys = [
            "redAttack", "blueMagicAttack", "greenAttack", "greyHeal",
            "redStrongAttack", "blueStrongHeal", "greenQuickAttack"
        ];
        
        if (!catalog || !catalog.unlocked) return [];
        
        // Filter for explicitly unlocked (non-base) gems of the same color
        const explicitlyUnlockedGems = catalog.unlocked.filter(gemKey => {
            if (baseGemKeys.includes(gemKey)) return false;
            
            const gemDef = Config.BASE_GEMS[gemKey];
            return gemDef && gemDef.color === gem.color && gemDef.name !== gem.name;
        });
        
        if (explicitlyUnlockedGems.length === 0) return [];
        
        // Shuffle and take up to maxCount alternatives
        const shuffledGems = Utils.shuffle([...explicitlyUnlockedGems]);
        const alternatives = [];
        
        for (let i = 0; i < Math.min(maxCount, shuffledGems.length); i++) {
            const gemKey = shuffledGems[i];
            const baseGem = Config.BASE_GEMS[gemKey];
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
                const altUpgradeMultiplier = this.getUpgradeMultiplier(baseGem.rarity);
                
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
        
        // If we have no alternatives, create a fallback
        if (alternatives.length === 0) {
            alternatives.push(this.createFallbackAlternative(gem));
        }
        
        return alternatives;
    }
    
    /**
     * Create a fallback alternative when no suitable upgrades found
     * @param {Object} originalGem - Original gem
     * @returns {Object} Alternative gem
     */
    createFallbackAlternative(originalGem) {
        // Create a slightly different variant of the original
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
    
    /**
     * Get upgrade multiplier based on gem rarity
     * @param {String} rarity - Gem rarity
     * @returns {Number} Multiplier
     */
    getUpgradeMultiplier(rarity) {
        switch (rarity) {
            case "Common": return 1.25;
            case "Uncommon": return 1.3;
            case "Rare": return 1.35;
            default: return 1.4;
        }
    }
    
    /**
     * Handle selecting an upgrade option
     * @param {Object} data - Selection data
     */
    handleUpgradeOptionSelected(data) {
        if (!this.currentShopId) return;
        
        const shopState = EntityManager.getComponent(this.currentShopId, 'ShopState');
        if (!shopState || !shopState.inUpgradeMode) return;
        
        const { poolIndex } = data;
        
        // Validate pool index
        if (poolIndex < 0 || !shopState.upgradeOptions || poolIndex >= shopState.upgradeOptions.length) {
            EventBus.emit('UI_MESSAGE', {
                message: 'Invalid upgrade option',
                type: 'error'
            });
            return;
        }
        
        // Get selected gem index
        const selectedGemIndex = Array.from(shopState.selectedGems)[0];
        
        const collectionsId = this.getPlayerCollectionsEntity();
        if (!collectionsId) return;
        
        const handComponent = EntityManager.getComponent(collectionsId, 'Hand');
        if (!handComponent) return;
        
        // Validate hand index
        if (selectedGemIndex < 0 || selectedGemIndex >= handComponent.items.length) {
            EventBus.emit('UI_MESSAGE', {
                message: 'Invalid gem selection',
                type: 'error'
            });
            return;
        }
        
        // Get the existing gem entity
        const existingGemId = handComponent.items[selectedGemIndex];
        const existingGem = EntityManager.getComponent(existingGemId, 'Gem');
        
        if (!existingGem) {
            EventBus.emit('UI_MESSAGE', {
                message: 'Invalid gem',
                type: 'error'
            });
            return;
        }
        
        // Get the upgrade option
        const upgradeOption = shopState.upgradeOptions[poolIndex];
        
        // Create a new gem entity with the upgrade
        const newGemId = EntityManager.createEntity(['gem']);
        EntityManager.addComponent(newGemId, 'Gem', {
            ...upgradeOption,
            id: `${upgradeOption.name}-${Utils.generateId()}`
        });
        
        // Replace the gem in hand
        const updatedHand = [...handComponent.items];
        updatedHand[selectedGemIndex] = newGemId;
        
        EntityManager.updateComponent(collectionsId, 'Hand', {
            items: updatedHand
        });
        
        // Mark as upgraded in shop state
        const updatedUpgradedGems = new Set(shopState.upgradedGems);
        updatedUpgradedGems.add(newGemId);
        
        // Update shop state
        EntityManager.updateComponent(this.currentShopId, 'ShopState', {
            inUpgradeMode: false,
            selectedGems: new Set(),
            upgradeOptions: [],
            upgradedGems: updatedUpgradedGems
        });
        
        // If this is a class-specific upgrade, ensure proficiency
        if (upgradeOption.isClassUpgrade) {
            this.ensureGemProficiency(upgradeOption);
        }
        
        // Remove the old gem entity
        EntityManager.removeEntity(existingGemId);
        
        // Play sound
        EventBus.emit('PLAY_SOUND', { sound: 'BUTTON_CLICK' });
        
        // Show appropriate success message
        if (upgradeOption.isDirectUpgrade) {
            EventBus.emit('UI_MESSAGE', {
                message: `Upgraded ${existingGem.name} to +${upgradeOption.upgradeCount}!`
            });
        } else if (upgradeOption.isClassUpgrade) {
            EventBus.emit('UI_MESSAGE', {
                message: `Transformed ${existingGem.name} into ${upgradeOption.name} (fully mastered)!`
            });
        } else if (upgradeOption.isAlternateUpgrade) {
            EventBus.emit('UI_MESSAGE', {
                message: `Transformed ${existingGem.name} into ${upgradeOption.name}!`
            });
        }
        
        // Update UI
        EventBus.emit('HAND_UPDATED');
        EventBus.emit('UI_UPDATE', { target: 'shop' });
    }
    
    /**
     * Ensure a gem has full proficiency
     * @param {Object} gem - Gem data
     */
    ensureGemProficiency(gem) {
        const playerId = this.getPlayerEntity();
        if (!playerId) return;
        
        // Get proficiency component
        const proficiencyComponent = EntityManager.getComponent(playerId, 'Proficiency');
        if (!proficiencyComponent) return;
        
        // Create gem key
        const gemKey = `${gem.color}${gem.name.replace(/\s+/g, '')}`;
        
        // Set full proficiency
        const updatedProficiencies = { ...proficiencyComponent.proficiencies };
        updatedProficiencies[gemKey] = { successCount: 6, failureChance: 0 };
        
        // Update proficiency component
        EntityManager.updateComponent(playerId, 'Proficiency', {
            proficiencies: updatedProficiencies
        });
        
        // Emit proficiency update event
        EventBus.emit('GEM_PROFICIENCY_UPDATED', {
            gemKey,
            proficiency: { successCount: 6, failureChance: 0 }
        });
    }
    
    /**
     * Handle canceling an upgrade
     */
    handleCancelUpgrade() {
        if (!this.currentShopId) return;
        
        const shopState = EntityManager.getComponent(this.currentShopId, 'ShopState');
        if (!shopState || !shopState.inUpgradeMode) return;
        
        const playerId = this.getPlayerEntity();
        if (!playerId) return;
        
        const statsComponent = EntityManager.getComponent(playerId, 'Stats');
        if (!statsComponent) return;
        
        // Refund cost
        EntityManager.updateComponent(playerId, 'Stats', {
            zenny: statsComponent.zenny + 5
        });
        
        // Reset shop state
        EntityManager.updateComponent(this.currentShopId, 'ShopState', {
            inUpgradeMode: false,
            selectedGems: new Set(),
            upgradeOptions: []
        });
        
        // Show message
        EventBus.emit('UI_MESSAGE', {
            message: 'Upgrade canceled, 5 $ZENNY refunded'
        });
        
        // Update UI
        EventBus.emit('UI_UPDATE', { target: 'shop' });
    }
    
    /**
     * Handle continuing from shop to next battle
     */
    handleContinueFromShop() {
        // Save hand state for next battle
        this.saveHandState();
        
        // Get game entity to check if we need to advance to next day
        const gameEntity = this.getGameEntity();
        if (gameEntity) {
            const phaseComponent = EntityManager.getComponent(gameEntity, 'Phase');
            if (phaseComponent) {
                const { phase, day } = phaseComponent;
                
                // If we've completed all phases for the day, go to camp
                if (phase >= 2) {
                    EventBus.emit('SCREEN_CHANGE', 'camp');
                    return;
                }
            }
        }
        
        // Switch to battle screen
        EventBus.emit('SCREEN_CHANGE', 'battle');
        
        // Initialize next battle
        EventBus.emit('BATTLE_INIT');
    }
    
    /**
     * Save hand state for transition
     */
    saveHandState() {
        const collectionsId = this.getPlayerCollectionsEntity();
        if (!collectionsId) return;
        
        const handComponent = EntityManager.getComponent(collectionsId, 'Hand');
        if (!handComponent) return;
        
        // Save to localStorage as temporary backup
        try {
            localStorage.setItem('stw_temp_hand', JSON.stringify(handComponent.items));
            console.log('Hand state saved for transition', handComponent.items);
        } catch (e) {
            console.error('Error saving hand state:', e);
        }
    }
    
    /**
     * Update the shop UI
     */
    updateShopUI() {
        // This method is for legacy compatibility
        // Will be replaced by the RenderSystem in the future
        EventBus.emit('UI_UPDATE', { target: 'shop' });
    }
    
    /**
     * Initialize collections for new player
     * @param {String} playerId - Player entity ID
     * @param {String} className - Class name
     */
    initializePlayerCollections(playerId, className) {
        if (!playerId) return;
        
        // Create collections entity if it doesn't exist
        const existingCollections = this.getPlayerCollectionsEntity();
        if (existingCollections) {
            // Clear collections if they exist
            EntityManager.updateComponent(existingCollections, 'Hand', { items: [] });
            EntityManager.updateComponent(existingCollections, 'GemBag', { items: [] });
            EntityManager.updateComponent(existingCollections, 'Discard', { items: [] });
        } else {
            // Create new collections entity
            const collectionsId = EntityManager.createEntity(['collections']);
            
            // Add empty collections
            EntityManager.addComponent(collectionsId, 'Hand', ComponentFactory.createCollectionComponent(
                [], // Empty hand
                Config.MAX_HAND_SIZE
            ));
            
            EntityManager.addComponent(collectionsId, 'GemBag', ComponentFactory.createCollectionComponent(
                [], // Empty gem bag
                Config.MAX_GEM_BAG_SIZE
            ));
            
            EntityManager.addComponent(collectionsId, 'Discard', ComponentFactory.createCollectionComponent(
                [], // Empty discard
                null // No size limit
            ));
        }
        
        // Create initial gems for the class
        this.createInitialGems(playerId, className);
    }
    
    /**
     * Create initial gems for a player
     * @param {String} playerId - Player entity ID
     * @param {String} className - Class name
     */
    createInitialGems(playerId, className) {
        const collectionsId = this.getPlayerCollectionsEntity();
        if (!collectionsId) return;
        
        // Get starting gems for this class
        const startingGemKeys = Config.STARTING_GEMS[className] || [];
        const gemIds = [];
        
        // Create gems
        startingGemKeys.forEach(gemKey => {
            const baseGem = Config.BASE_GEMS[gemKey];
            if (!baseGem) return;
            
            // Create multiple copies of basic gems
            const count = (gemKey === "redAttack" || 
                          gemKey === "blueMagicAttack" || 
                          gemKey === "greenAttack" || 
                          gemKey === "greyHeal") ? 2 : 1;
            
            for (let i = 0; i < count; i++) {
                const gemId = EntityManager.createEntity(['gem']);
                
                // Add gem component
                EntityManager.addComponent(gemId, 'Gem', ComponentFactory.createGemComponent({
                    ...baseGem,
                    id: `${gemKey}-${i}-${Utils.generateId()}`
                }));
                
                gemIds.push(gemId);
            }
        });
        
        // Add class-specific extra gems
        if (className === "Knight") {
            // Knights get more attack gems
            for (let i = 0; i < 3; i++) {
                const gemId = EntityManager.createEntity(['gem']);
                EntityManager.addComponent(gemId, 'Gem', ComponentFactory.createGemComponent({
                    ...Config.BASE_GEMS.redAttack,
                    id: `redAttack-extra-${i}-${Utils.generateId()}`
                }));
                gemIds.push(gemId);
            }
        } 
        else if (className === "Mage") {
            // Mages get more magic attack gems
            for (let i = 0; i < 3; i++) {
                const gemId = EntityManager.createEntity(['gem']);
                EntityManager.addComponent(gemId, 'Gem', ComponentFactory.createGemComponent({
                    ...Config.BASE_GEMS.blueMagicAttack,
                    id: `blueMagicAttack-extra-${i}-${Utils.generateId()}`
                }));
                gemIds.push(gemId);
            }
        }
        else if (className === "Rogue") {
            // Rogues get more quick attack gems
            for (let i = 0; i < 3; i++) {
                const gemId = EntityManager.createEntity(['gem']);
                EntityManager.addComponent(gemId, 'Gem', ComponentFactory.createGemComponent({
                    ...Config.BASE_GEMS.greenAttack,
                    id: `greenAttack-extra-${i}-${Utils.generateId()}`
                }));
                gemIds.push(gemId);
            }
        }
        
        // Fill bag with basic gems to reach minimum size
        const minBagSize = 15; // Minimum total gems
        const gemsToAdd = Math.max(0, minBagSize - gemIds.length);
        const basicGemKeys = ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal"];
        
        for (let i = 0; i < gemsToAdd; i++) {
            const gemKey = basicGemKeys[i % basicGemKeys.length];
            const gemId = EntityManager.createEntity(['gem']);
            
            EntityManager.addComponent(gemId, 'Gem', ComponentFactory.createGemComponent({
                ...Config.BASE_GEMS[gemKey],
                id: `${gemKey}-filler-${i}-${Utils.generateId()}`
            }));
            
            gemIds.push(gemId);
        }
        
        // Shuffle and add to gem bag
        const shuffledGemIds = Utils.shuffle(gemIds);
        
        EntityManager.updateComponent(collectionsId, 'GemBag', {
            items: shuffledGemIds
        });
        
        console.log(`Created ${gemIds.length} initial gems for ${className}`);
    }
    
    /**
     * Register for character creation events
     */
    registerCharacterListener() {
        EventBus.on('CHARACTER_CREATED', ({ playerId, className }) => {
            this.initializePlayerCollections(playerId, className);
        });
    }
    
    /**
     * System update method - called each frame
     * @param {Number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Currently we don't need per-frame updates for the shop system
    }
    
    // ===================================================
    // Helper Methods
    // ===================================================
    
    /**
     * Get the player entity ID
     * @returns {String} Player entity ID
     */
    getPlayerEntity() {
        // Look for entity with player tag
        const playerEntities = EntityManager.getEntitiesWithTag('player');
        
        if (playerEntities.length === 0) {
            console.error('No player entity found');
            return null;
        }
        
        return playerEntities[0];
    }
    
    /**
     * Get the game entity ID
     * @returns {String} Game entity ID
     */
    getGameEntity() {
        // Look for entity with game tag
        const gameEntities = EntityManager.getEntitiesWithTag('game');
        
        if (gameEntities.length === 0) {
            console.error('No game entity found');
            return null;
        }
        
        return gameEntities[0];
    }
    
    /**
     * Get the player collections entity ID
     * @returns {String} Collections entity ID
     */
    getPlayerCollectionsEntity() {
        // Look for entity with collections tag
        const collectionsEntities = EntityManager.getEntitiesWithTag('collections');
        
        if (collectionsEntities.length === 0) {
            console.error('No collections entity found');
            return null;
        }
        
        return collectionsEntities[0];
    }
}

export default ShopSystem;