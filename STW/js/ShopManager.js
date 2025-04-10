// ShopManager.js - Handles shop interactions and gem upgrades
export default class ShopManager {
    constructor(eventBus, stateManager, gemManager) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.gemManager = gemManager;
        
        // Costs for shop actions
        this.costs = {
            buyRandomGem: 4,   // Increased from 3 - buying gems should be a meaningful investment
            discardGem: 2,     // Decreased from 3 - encourage removal of unwanted gems
            upgradeGem: 6,     // Increased from 5 - upgrades are powerful
            swapGem: 3,        // Increased from 2 - swapping is valuable
            healPlayer: 4      // Increased from 3 - healing is now more valuable with increased player stats
        };
        
        // NEW: Shop inventory system
        this.shopInventory = [];
        this.inventorySize = 3; // Number of gems to offer in shop
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for shop action events
        this.eventBus.on('shop:buy-random-gem', () => {
            this.buyRandomGem();
        });
        
        this.eventBus.on('shop:discard-gem', (gemInstanceId) => {
            this.discardGem(gemInstanceId);
        });
        
        this.eventBus.on('shop:upgrade-gem', (data) => {
            this.upgradeGem(data.gemInstanceId, data.newGemId);
        });
        
        this.eventBus.on('shop:heal-player', () => {
            this.healPlayer();
        });
        
        this.eventBus.on('shop:continue', () => {
            this.continueJourney();
        });

        this.eventBus.on('shop:direct-upgrade-gem', (data) => {
            this.directUpgradeGem(data.gemInstanceId, data.originalGemId);
        });
        
        // NEW: Listen for shop inventory purchase
        this.eventBus.on('shop:purchase-inventory-gem', (gemIndex) => {
            this.purchaseGemFromInventory(gemIndex);
        });
        
        // NEW: Get shop inventory
        this.eventBus.on('shop:get-inventory', (callback) => {
            callback(this.shopInventory);
        });
    }

    prepareShop() {
        console.log("Preparing shop");
        
        // Reset shop-specific state only
        this.stateManager.updateState({
            inUpgradeMode: false,
            selectedGems: new Set(),
            gemCatalog: {
                ...this.stateManager.getState().gemCatalog,
                upgradedThisShop: new Set(),
                gemPool: []
            }
        });
        
        // Generate new shop inventory
        this.generateShopInventory();
        
        // Update shop UI
        if (this.uiManager && this.uiManager.updateShopScreen) {
            this.uiManager.updateShopScreen();
        }
    }
    
    
    // Buy a random gem
    buyRandomGem() {
        // Declare state with 'let' instead of 'const' so it can be reassigned
        let state = this.stateManager.getState();
        let { player, gems } = state;
        
        // Check if we need to recycle played/discarded gems first
        if (gems.played && gems.played.length > 0 || gems.discarded && gems.discarded.length > 0) {
            // Recycle gems
            this.gemManager.recycleAllGems();
            
            // Re-fetch the state after recycling
            state = this.stateManager.getState();
            gems = state.gems;
            player = state.player; // Also update player reference
        }
        
        // Calculate total gems
        const totalGems = gems.bag.length + gems.hand.length;
        const maxGemBagSize = state.gemBagSize || 30;
        
        // Check if bag would be full even after recycling
        if (totalGems >= maxGemBagSize) {
            // Auto-expand the bag
            this.gemManager.increaseGemBagSize(1);
            
            // Re-fetch the state after expanding
            state = this.stateManager.getState();
            gems = state.gems;
            player = state.player; // Also update player reference
        }
        
        // Check if player has enough zenny
        if (player.zenny < this.costs.buyRandomGem) {
            this.eventBus.emit('message:show', {
                text: 'Not enough $ZENNY!',
                type: 'error'
            });
            return false;
        }
        
        // Deduct cost
        this.stateManager.updateState({
            player: {
                zenny: player.zenny - this.costs.buyRandomGem
            }
        });
        
        // Add random gem
        const newGem = this.gemManager.addRandomGem();
        
        if (newGem) {
            this.eventBus.emit('message:show', {
                text: `Purchased ${newGem.name}!`,
                type: 'success'
            });
            return true;
        } else {
            // Get updated state for correct refund
            state = this.stateManager.getState();
            player = state.player;
            
            // Refund if failed
            this.stateManager.updateState({
                player: {
                    zenny: player.zenny + this.costs.buyRandomGem
                }
            });
            return false;
        }
    }
    
    // Discard a gem from the bag
    discardGem(gemInstanceId) {
        const state = this.stateManager.getState();
        const { player, gems } = state;
        
        // Check if player has enough zenny
        if (player.zenny < this.costs.discardGem) {
            this.eventBus.emit('message:show', {
                text: 'Not enough $ZENNY!',
                type: 'error'
            });
            return false;
        }
        
        // Fix: Look for the gem in the hand instead of the bag
        // Since we're discarding from the shop, we should be looking at the hand
        const gemIndex = gems.hand.findIndex(gem => gem.instanceId === gemInstanceId);
        
        if (gemIndex === -1) {
            this.eventBus.emit('message:show', {
                text: 'Gem not found!',
                type: 'error'
            });
            return false;
        }
        
        // Remove the gem from hand
        const discardedGem = gems.hand[gemIndex];
        const newHand = [...gems.hand.slice(0, gemIndex), ...gems.hand.slice(gemIndex + 1)];
        
        // Move the discarded gem to the discarded pile
        const newDiscarded = [...gems.discarded, discardedGem];
        
        // Deduct cost and update state
        this.stateManager.updateState({
            player: {
                zenny: player.zenny - this.costs.discardGem
            },
            gems: {
                hand: newHand,
                discarded: newDiscarded,
                bag: gems.bag,
                played: gems.played
            }
        });
        
        this.eventBus.emit('message:show', {
            text: `Discarded ${discardedGem.name}!`,
            type: 'success'
        });
        
        this.eventBus.emit('gem:discarded', discardedGem);
        
        return true;
    }
    
    // Upgrade a gem in the shop
    upgradeGem(gemInstanceId, newGemId) {
        const state = this.stateManager.getState();
        const { player } = state;
        
        // Add validation for missing parameters
        if (!gemInstanceId || !newGemId) {
            console.error(`Invalid upgrade parameters: gemInstanceId=${gemInstanceId}, newGemId=${newGemId}`);
            this.eventBus.emit('message:show', {
                text: 'Cannot process upgrade: Missing gem information',
                type: 'error'
            });
            return false;
        }
        
        // Check if player has enough zenny
        if (player.zenny < this.costs.upgradeGem) {
            this.eventBus.emit('message:show', {
                text: 'Not enough $ZENNY!',
                type: 'error'
            });
            return false;
        }
        
        // Try to upgrade the gem
        const newGem = this.gemManager.upgradeGem(gemInstanceId, newGemId);
        
        if (!newGem) {
            this.eventBus.emit('message:show', {
                text: 'Unable to upgrade gem!',
                type: 'error'
            });
            return false;
        }
        
        // Deduct cost
        this.stateManager.updateState({
            player: {
                zenny: player.zenny - this.costs.upgradeGem
            }
        });
        
        this.eventBus.emit('message:show', {
            text: `Upgraded to ${newGem.name}!`,
            type: 'success'
        });
        
        return true;
    }    
    
    // Heal the player
    healPlayer() {
        const state = this.stateManager.getState();
        const { player } = state;
        
        // Check if already at full health
        if (player.health >= player.maxHealth) {
            this.eventBus.emit('message:show', {
                text: 'Already at full health!',
                type: 'error'
            });
            return false;
        }
        
        // Check if player has enough zenny
        if (player.zenny < this.costs.healPlayer) {
            this.eventBus.emit('message:show', {
                text: 'Not enough $ZENNY!',
                type: 'error'
            });
            return false;
        }
        
        // Calculate heal amount (10 health)
        const healAmount = 10;
        const newHealth = Math.min(player.maxHealth, player.health + healAmount);
        
        // Deduct cost and update health
        this.stateManager.updateState({
            player: {
                zenny: player.zenny - this.costs.healPlayer,
                health: newHealth
            }
        });
        
        this.eventBus.emit('message:show', {
            text: `Healed ${healAmount} HP!`,
            type: 'success'
        });
        
        this.eventBus.emit('player:healed', {
            amount: healAmount,
            source: 'shop'
        });
        
        return true;
    }
    
    selectUpgradeOption(poolIndex) {
        const state = this.stateManager.getState();
        const selectedGems = state.selectedGems;
        const gemCatalog = state.gemCatalog;
        const hand = state.gems.hand;
        
        // Validation
        if (!state.inUpgradeMode || !selectedGems || selectedGems.size !== 1) {
            this.eventBus.emit('message:show', {
                text: 'Please select a gem first',
                type: 'error'
            });
            return;
        }
        
        if (poolIndex < 0 || !gemCatalog || !gemCatalog.gemPool || poolIndex >= gemCatalog.gemPool.length) {
            this.eventBus.emit('message:show', {
                text: 'Invalid upgrade option',
                type: 'error'
            });
            return;
        }
        
        // Get the selected gem and upgrade option
        const selectedIndex = Array.from(selectedGems)[0];
        
        // Validate index is in range of hand
        if (selectedIndex < 0 || !hand || selectedIndex >= hand.length) {
            this.eventBus.emit('message:show', {
                text: 'Invalid gem selection',
                type: 'error'
            });
            return;
        }
        
        const selectedGem = hand[selectedIndex];
        if (!selectedGem) {
            this.eventBus.emit('message:show', {
                text: 'Selected gem not found',
                type: 'error'
            });
            return;
        }
        
        const upgradeOption = gemCatalog.gemPool[poolIndex];
        if (!upgradeOption) {
            this.eventBus.emit('message:show', {
                text: 'Upgrade option not available',
                type: 'error'
            });
            return;
        }
        
        // Perform the upgrade - specifically on the hand gem
        const newGem = {
            ...upgradeOption,
            instanceId: `${upgradeOption.id}-upgraded-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            freshlySwapped: false
        };
        
        // Update the hand directly
        const newHand = [...hand];
        newHand[selectedIndex] = newGem;
        
        this.stateManager.updateState({
            gems: {
                ...state.gems,
                hand: newHand
            }
        });
        
        // Mark as upgraded this shop visit
        if (!gemCatalog.upgradedThisShop) {
            gemCatalog.upgradedThisShop = new Set();
        }
        gemCatalog.upgradedThisShop.add(newGem.id);
        
        this.stateManager.updateState({
            gemCatalog: {
                ...gemCatalog,
                upgradedThisShop: gemCatalog.upgradedThisShop
            }
        });
        
        // Reset upgrade mode state
        this.stateManager.updateState({
            selectedGems: new Set(),
            inUpgradeMode: false,
            gemCatalog: {
                ...gemCatalog,
                gemPool: []
            }
        });
        
        // Show appropriate success message
        this.eventBus.emit('message:show', {
            text: `Upgraded ${selectedGem.name} to ${newGem.name}!`,
            type: 'success'
        });
        
        // Play sound if available
        if (this.audioManager && this.audioManager.play) {
            this.audioManager.play('BUTTON_CLICK');
        }
        
        // Update shop UI
        if (this.uiManager && this.uiManager.updateShopScreen) {
            this.uiManager.updateShopScreen();
        }
    }

    upgradeSelectedGem() {
        const state = this.stateManager.getState();
        const selectedGems = state.selectedGems;
        const player = state.player;
        const hand = state.gems.hand;
        
        // Validate selection and cost
        if (selectedGems.size !== 1) {
            this.eventBus.emit('message:show', {
                text: 'Select a gem to upgrade',
                type: 'error'
            });
            return;
        }
        
        if (player.zenny < 5) {
            this.eventBus.emit('message:show', {
                text: 'Not enough $ZENNY! Need 5.',
                type: 'error'
            });
            return;
        }
        
        const selectedIndex = Array.from(selectedGems)[0];
        
        // Validate index is in range of hand
        if (selectedIndex < 0 || selectedIndex >= hand.length) {
            this.eventBus.emit('message:show', {
                text: 'Invalid gem selection',
                type: 'error'
            });
            return;
        }
        
        const selectedGem = hand[selectedIndex];
        
        // Validate the selected gem exists
        if (!selectedGem) {
            this.eventBus.emit('message:show', {
                text: 'Invalid gem selection',
                type: 'error'
            });
            return;
        }
        
        if (selectedGem.freshlySwapped) {
            this.eventBus.emit('message:show', {
                text: 'Cannot upgrade a freshly swapped gem!',
                type: 'error'
            });
            return;
        }
        
        const gemCatalog = state.gemCatalog;
        if (gemCatalog.upgradedThisShop && gemCatalog.upgradedThisShop.has(selectedGem.id)) {
            this.eventBus.emit('message:show', {
                text: 'This gem was already upgraded this shop visit!',
                type: 'error'
            });
            return;
        }
        
        // Deduct payment
        player.zenny -= 5;
        this.stateManager.updateState({
            player: {
                ...player,
                zenny: player.zenny
            }
        });
        
        // Generate upgrade options
        const options = this.gemManager.getUpgradeOptions(selectedGem.instanceId);
        
        // Ensure we have at least one upgrade option
        if (!options || options.length === 0) {
            console.error("No upgrade options generated");
            player.zenny += 5; // Refund
            this.stateManager.updateState({
                player: {
                    ...player,
                    zenny: player.zenny
                }
            });
            this.eventBus.emit('message:show', {
                text: 'No upgrade options available for this gem',
                type: 'error'
            });
            return;
        }
        
        // Set the upgrade options in state
        this.stateManager.updateState({
            gemCatalog: {
                ...gemCatalog,
                gemPool: options
            },
            inUpgradeMode: true
        });
        
        // Play sound if available
        if (this.audioManager && this.audioManager.play) {
            this.audioManager.play('BUTTON_CLICK');
        }
        
        // Update shop UI
        if (this.uiManager && this.uiManager.updateShopScreen) {
            this.uiManager.updateShopScreen();
        }
    }
    
    // Continue the journey after shopping
    continueJourney() {
        this.eventBus.emit('shop:completed');
        
        // Get the battle manager to handle progression
        this.eventBus.emit('journey:continue');
    }
    
    directUpgradeGem(gemInstanceId, originalGemId) {
        const state = this.stateManager.getState();
        const handGems = state.gems.hand;
        
        // Find the gem to upgrade in hand
        const gemIndex = handGems.findIndex(gem => gem.instanceId === gemInstanceId);
        
        if (gemIndex === -1) {
            console.error(`Gem not found in hand for direct upgrade: ${gemInstanceId}`);
            return null;
        }
        
        // Get the original gem for reference
        const originalGem = handGems[gemIndex];
        
        // Create an enhanced version of the same gem
        // Unlike regular upgrades, we're not changing the gem type, just its values
        const enhancedGem = {
            ...originalGem,
            instanceId: `${originalGemId}-${Date.now()}-enhanced`,
            name: `Enhanced ${originalGem.name}`,
            value: Math.floor(originalGem.value * 1.5), // 50% power increase
            // Keep the same cost and other properties
        };
        
        console.log(`Directly upgrading ${originalGem.name} (${gemInstanceId}) to Enhanced version`);
        
        // Replace in hand
        const newHand = [...handGems];
        newHand[gemIndex] = enhancedGem;
        
        // Update state, only changing the hand
        this.stateManager.updateState({
            gems: {
                hand: newHand,
                bag: state.gems.bag,
                discarded: state.gems.discarded,
                played: state.gems.played
            }
        });
        
        // Deduct the cost from player's zenny
        this.stateManager.updateState({
            player: {
                zenny: state.player.zenny - this.costs.upgradeGem
            }
        });
        
        // Emit event
        this.eventBus.emit('gem:upgraded', {
            oldGem: originalGem,
            newGem: enhancedGem
        });
        
        // Show success message
        this.eventBus.emit('message:show', {
            text: `Enhanced ${originalGem.name} to be 50% more powerful!`,
            type: 'success'
        });
        
        return enhancedGem;
    }
    

    // Display gem upgrade options
    getUpgradeOptions(gemInstanceId) {
        return this.gemManager.getUpgradeOptions(gemInstanceId);
    }
    
    // Handle gem catalog unlocking
    unlockGem(gemId) {
        const state = this.stateManager.getState();
        const { meta } = state;
        const cost = 50; // Fixed cost for unlocking gems
        
        // Check if already unlocked - handle both array and object structure
        let alreadyUnlocked = false;
        
        if (Array.isArray(meta.unlockedGems)) {
            // Old structure - simple array check
            alreadyUnlocked = meta.unlockedGems.includes(gemId);
        } else {
            // New structure - check both global and class-specific unlocks
            const playerClass = state.player.class;
            const globalGems = meta.unlockedGems.global || [];
            const classGems = meta.unlockedGems[playerClass] || [];
            
            alreadyUnlocked = globalGems.includes(gemId) || classGems.includes(gemId);
        }
        
        if (alreadyUnlocked) {
            this.eventBus.emit('message:show', {
                text: 'Gem already unlocked!',
                type: 'error'
            });
            return false;
        }
        
        // Check if player has enough meta zenny
        if (meta.zenny < cost) {
            this.eventBus.emit('message:show', {
                text: 'Not enough Meta $ZENNY!',
                type: 'error'
            });
            return false;
        }
        
        // Unlock the gem via gem manager - this handles updating the specific class's unlocks
        return this.gemManager.unlockGem(gemId, cost);
    }
    // Generate shop inventory when entering shop
    generateShopInventory() {
        const state = this.stateManager.getState();
        const playerClass = state.player.class;
        const day = state.journey.day || 1;
        
        // Clear existing inventory
        this.shopInventory = [];
        
        // Get all available gems
        const allGemDefinitions = this.gemManager.gemDefinitions;
        
        // Filter gems based on player class and unlocked gems
        const availableGems = [];
        const { meta } = state;
        
        // Get unlocked gems list (handling both array and object structure)
        let unlockedGemsList = [];
        if (Array.isArray(meta.unlockedGems)) {
            // Old structure - simple array
            unlockedGemsList = meta.unlockedGems;
        } else if (meta.unlockedGems && typeof meta.unlockedGems === 'object') {
            // New structure - combine global and class-specific unlocks
            const globalGems = meta.unlockedGems.global || [];
            const classGems = meta.unlockedGems[playerClass] || [];
            unlockedGemsList = [...globalGems, ...classGems];
        }
        
        // Base gems that are always available to all classes
        const baseGems = [
            'red-attack', 'blue-magic', 'green-attack', 'grey-heal'
        ];
        
        // Class-specific starter gems
        const classStarterGems = {
            'knight': ['red-strong'],
            'mage': ['blue-strong-heal'],
            'rogue': ['green-quick']
        };
        
        // Combine all available gems
        let possibleGems = [...baseGems];
        if (classStarterGems[playerClass]) {
            possibleGems = [...possibleGems, ...classStarterGems[playerClass]];
        }
        
        // Add unlocked gems the player has specifically unlocked
        possibleGems = [...possibleGems, ...unlockedGemsList];
        
        // Filter to only include gems that have definitions
        possibleGems = possibleGems.filter(gemId => allGemDefinitions[gemId]);
        
        // Create the available gems list from definitions
        possibleGems.forEach(gemId => {
            if (allGemDefinitions[gemId]) {
                availableGems.push({
                    ...allGemDefinitions[gemId],
                    price: this.calculateGemPrice(allGemDefinitions[gemId], day)
                });
            }
        });
        
        // Rare chance (20%) to include an advanced gem even if not unlocked
        if (Math.random() < 0.2) {
            const advancedGems = {
                'knight': ['red-burst'],
                'mage': ['blue-shield'],
                'rogue': ['green-poison']
            };
            
            // Add a class-appropriate advanced gem if available
            if (advancedGems[playerClass]) {
                const randomAdvancedGemId = advancedGems[playerClass][Math.floor(Math.random() * advancedGems[playerClass].length)];
                if (allGemDefinitions[randomAdvancedGemId] && !availableGems.some(g => g.id === randomAdvancedGemId)) {
                    // Higher price for advanced gems
                    availableGems.push({
                        ...allGemDefinitions[randomAdvancedGemId],
                        price: this.calculateGemPrice(allGemDefinitions[randomAdvancedGemId], day) + 2
                    });
                }
            }
        }
        
        // Randomly select gems for inventory
        const selectedGems = [];
        const inventorySize = Math.min(this.inventorySize, availableGems.length);
        
        for (let i = 0; i < inventorySize; i++) {
            // Randomly select a gem that's not already in the inventory
            const availableForSelection = availableGems.filter(gem => !selectedGems.some(g => g.id === gem.id));
            if (availableForSelection.length === 0) break;
            
            const randomIndex = Math.floor(Math.random() * availableForSelection.length);
            selectedGems.push(availableForSelection[randomIndex]);
        }
        
        // Set the shop inventory
        this.shopInventory = selectedGems;
        
        console.log(`Generated shop inventory with ${this.shopInventory.length} gems`);
        
        return this.shopInventory;
    }
    
    // Calculate gem price based on its stats and the current day
    calculateGemPrice(gemDef, day) {
        if (!gemDef) return 0;
        
        // Base price calculation
        let price = 0;
        
        // Value-based pricing
        if (gemDef.type === 'attack' || gemDef.type === 'heal') {
            price += Math.ceil(gemDef.value / 4); // Every 4 points of value = 1 zenny
        } else if (gemDef.type === 'shield') {
            price += Math.ceil(gemDef.value / 3); // Defense is slightly more valuable
        } else if (gemDef.type === 'poison') {
            price += Math.ceil((gemDef.value * gemDef.duration) / 3); // Total damage potential
        }
        
        // Special effects are valuable
        if (gemDef.specialEffect) {
            price += 2;
        }
        
        // Adjust for stamina cost (cheaper gems cost less)
        price += gemDef.cost - 1;
        
        // Scale price based on day (later days = slightly more expensive)
        price = Math.max(1, Math.floor(price * (1 + (day - 1) * 0.1)));
        
        return price;
    }
    
    // Purchase a specific gem from the shop inventory
    purchaseGemFromInventory(gemIndex) {
        if (gemIndex < 0 || gemIndex >= this.shopInventory.length) {
            this.eventBus.emit('message:show', {
                text: 'Invalid gem selection!',
                type: 'error'
            });
            return false;
        }
        
        const selectedGem = this.shopInventory[gemIndex];
        const state = this.stateManager.getState();
        const { player, gems } = state;
        
        // Check if player has enough zenny
        if (player.zenny < selectedGem.price) {
            this.eventBus.emit('message:show', {
                text: `Not enough $ZENNY! Need ${selectedGem.price}.`,
                type: 'error'
            });
            return false;
        }
        
        // Check gem bag capacity
        const totalGems = gems.bag.length + gems.hand.length;
        const maxGemBagSize = state.gemBagSize || 30;
        
        if (totalGems >= maxGemBagSize) {
            // Auto-expand the bag
            this.gemManager.increaseGemBagSize(1);
        }
        
        // Create the gem
        const newGem = this.gemManager.createGem(selectedGem.id);
        
        if (!newGem) {
            this.eventBus.emit('message:show', {
                text: 'Failed to create gem!',
                type: 'error'
            });
            return false;
        }
        
        // Add to gem bag
        const newBag = [...gems.bag, newGem];
        
        // Deduct cost and update state
        this.stateManager.updateState({
            player: {
                zenny: player.zenny - selectedGem.price
            },
            gems: {
                bag: newBag,
                hand: gems.hand,
                discarded: gems.discarded,
                played: gems.played
            }
        });
        
        // Remove gem from inventory
        this.shopInventory.splice(gemIndex, 1);
        
        // Show success message
        this.eventBus.emit('message:show', {
            text: `Purchased ${newGem.name} for ${selectedGem.price} $ZENNY!`,
            type: 'success'
        });
        
        // Emit event
        this.eventBus.emit('gem:purchased', newGem);
        
        return newGem;
    }
}