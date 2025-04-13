// ShopManager.js - Handles shop interactions and gem upgrades
export default class ShopManager {
    constructor(eventBus, stateManager, gemManager) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.gemManager = gemManager;
        
        // Costs for shop actions
        this.costs = {
            buyRandomGem: 4,   // Cost to buy a random gem
            discardGem: 2,     // Cost to discard a gem
            upgradeGem: 6,     // Cost to upgrade a gem
            swapGem: 3,        // Cost to swap a gem
            healPlayer: 4      // Cost to heal the player
        };
        
        // Shop inventory system
        this.shopInventory = [];
        this.inventorySize = 3; // Number of gems to offer in shop
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Shop action event handlers
        this.eventBus.on('shop:buy-random-gem', () => {
            this.buyRandomGem();
        });
        
        this.eventBus.on('shop:discard-gem', (gemInstanceId) => {
            this.discardGem(gemInstanceId);
        });
        
        // Handle gem upgrades
        this.eventBus.on('shop:upgrade-gem', (data) => {
            if (typeof data.newGemId === 'object' && data.newGemId.augmentation) {
                // Augmentation upgrade
                this.upgradeGem(data.gemInstanceId, data.newGemId);
            } else {
                // Standard upgrade
                this.upgradeGem(data.gemInstanceId, data.newGemId);
            }
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
        
        // Shop inventory request handler
        this.eventBus.on('shop:get-inventory', (callback) => {
            callback(this.shopInventory);
        });
        
        // Shop purchase event handler
        this.eventBus.on('shop:purchase-inventory-gem', (index) => {
            this.purchaseGemFromInventory(index);
        });
    }
    
    // Initialize shop when entering
    prepareShop() {
        console.log("Preparing shop");
        
        // Get current state
        const state = this.stateManager.getState();
        
        // Reset the rotation counter and gem options
        if (state.gemUpgradeRotation) {
            this.stateManager.updateState({
                gemUpgradeRotation: {
                    currentOptions: {}, // Clear all current options
                    visitCount: (state.gemUpgradeRotation.visitCount || 0) + 1
                }
            });
        }
        
        // Reset shop-specific state
        this.stateManager.updateState({
            inUpgradeMode: false,
            selectedGems: new Set(),
            gemCatalog: {
                ...(state.gemCatalog || {}),
                upgradedThisShop: new Set(),
                gemPool: []
            }
        });
        
        // Generate new shop inventory
        this.generateShopInventory();
    }
    
    // Buy a random gem
    buyRandomGem() {
        // Get current state
        let state = this.stateManager.getState();
        let { player, gems } = state;
        
        // Check if we need to recycle gems first
        if ((gems.played && gems.played.length > 0) || 
            (gems.discarded && gems.discarded.length > 0)) {
            // Recycle gems
            this.gemManager.recycleAllGems();
            
            // Re-fetch the state after recycling
            state = this.stateManager.getState();
            gems = state.gems;
            player = state.player;
        }
        
        // Calculate total gems and check bag capacity
        const totalGems = gems.bag.length + gems.hand.length;
        const maxGemBagSize = state.gemBagSize || 30;
        
        // Check if bag would be full even after recycling
        if (totalGems >= maxGemBagSize) {
            // Auto-expand the bag
            this.gemManager.increaseGemBagSize(1);
            
            // Re-fetch the state after expanding
            state = this.stateManager.getState();
            gems = state.gems;
            player = state.player;
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
                ...player,
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
            // Refund if failed
            state = this.stateManager.getState();
            player = state.player;
            
            this.stateManager.updateState({
                player: {
                    ...player,
                    zenny: player.zenny + this.costs.buyRandomGem
                }
            });
            return false;
        }
    }
    
    // Discard a gem from the hand
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
        
        // Find the gem in the hand
        const gemIndex = gems.hand.findIndex(gem => gem.instanceId === gemInstanceId);
        
        if (gemIndex === -1) {
            this.eventBus.emit('message:show', {
                text: 'Gem not found!',
                type: 'error'
            });
            return false;
        }
        
        // Get the gem to discard
        const discardedGem = gems.hand[gemIndex];
        
        // Create new hand and discarded arrays
        const newHand = [...gems.hand.slice(0, gemIndex), ...gems.hand.slice(gemIndex + 1)];
        const newDiscarded = [...gems.discarded, discardedGem];
        
        // Deduct cost and update state
        this.stateManager.updateState({
            player: {
                ...player,
                zenny: player.zenny - this.costs.discardGem
            },
            gems: {
                ...gems,
                hand: newHand,
                discarded: newDiscarded
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
                ...player,
                zenny: player.zenny - this.costs.upgradeGem
            }
        });
        
        return true;
    }
    
    // Apply a direct upgrade to a gem (enhanced version)
    directUpgradeGem(gemInstanceId, originalGemId) {
        const state = this.stateManager.getState();
        const handGems = state.gems.hand;
        
        // Find the gem to upgrade
        const gemIndex = handGems.findIndex(gem => gem.instanceId === gemInstanceId);
        
        if (gemIndex === -1) {
            console.error(`Gem not found in hand for direct upgrade: ${gemInstanceId}`);
            return null;
        }
        
        // Get the original gem
        const originalGem = handGems[gemIndex];
        
        // Create an enhanced version of the gem
        const enhancedGem = {
            ...originalGem,
            instanceId: `${originalGemId}-${Date.now()}-enhanced`,
            name: `Enhanced ${originalGem.name}`,
            value: Math.floor(originalGem.value * 1.5) // 50% power increase
        };
        
        // Replace in hand
        const newHand = [...handGems];
        newHand[gemIndex] = enhancedGem;
        
        // Update state
        this.stateManager.updateState({
            gems: {
                ...state.gems,
                hand: newHand
            },
            player: {
                ...state.player,
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
                ...player,
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
    
    // Select an upgrade option from the gem pool
    selectUpgradeOption(poolIndex) {
        const state = this.stateManager.getState();
        const selectedGems = state.selectedGems;
        const gemCatalog = state.gemCatalog || {};
        const hand = state.gems.hand;
        
        // Validate selection
        if (!state.inUpgradeMode || !selectedGems || selectedGems.size !== 1) {
            this.eventBus.emit('message:show', {
                text: 'Please select a gem first',
                type: 'error'
            });
            return;
        }
        
        // Validate pool index
        if (poolIndex < 0 || !gemCatalog.gemPool || poolIndex >= gemCatalog.gemPool.length) {
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
        
        // Create new gem from the upgrade option
        const newGem = {
            ...upgradeOption,
            instanceId: `${upgradeOption.id}-upgraded-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            freshlySwapped: false
        };
        
        // Update the hand
        const newHand = [...hand];
        newHand[selectedIndex] = newGem;
        
        // Track upgraded gems
        const upgradedThisShop = new Set(gemCatalog.upgradedThisShop || []);
        upgradedThisShop.add(newGem.id);
        
        // Update state
        this.stateManager.updateState({
            gems: {
                ...state.gems,
                hand: newHand
            },
            gemCatalog: {
                ...gemCatalog,
                upgradedThisShop,
                gemPool: [] // Clear pool after upgrade
            },
            selectedGems: new Set(),
            inUpgradeMode: false
        });
        
        // Show success message
        this.eventBus.emit('message:show', {
            text: `Upgraded ${selectedGem.name} to ${newGem.name}!`,
            type: 'success'
        });
    }
    
    // Initiate the upgrade process for a selected gem
    upgradeSelectedGem() {
        const state = this.stateManager.getState();
        const selectedGems = state.selectedGems || new Set();
        const player = state.player;
        const hand = state.gems.hand;
        const gemCatalog = state.gemCatalog || {};
        
        // Validate selection and cost
        if (selectedGems.size !== 1) {
            this.eventBus.emit('message:show', {
                text: 'Select a gem to upgrade',
                type: 'error'
            });
            return;
        }
        
        if (player.zenny < this.costs.upgradeGem) {
            this.eventBus.emit('message:show', {
                text: `Not enough $ZENNY! Need ${this.costs.upgradeGem}.`,
                type: 'error'
            });
            return;
        }
        
        const selectedIndex = Array.from(selectedGems)[0];
        
        // Validate index is in range
        if (selectedIndex < 0 || selectedIndex >= hand.length) {
            this.eventBus.emit('message:show', {
                text: 'Invalid gem selection',
                type: 'error'
            });
            return;
        }
        
        const selectedGem = hand[selectedIndex];
        
        // Validate the gem
        if (!selectedGem) {
            this.eventBus.emit('message:show', {
                text: 'Invalid gem selection',
                type: 'error'
            });
            return;
        }
        
        // Check for freshly swapped
        if (selectedGem.freshlySwapped) {
            this.eventBus.emit('message:show', {
                text: 'Cannot upgrade a freshly swapped gem!',
                type: 'error'
            });
            return;
        }
        
        // Check if already upgraded this shop
        if (gemCatalog.upgradedThisShop && gemCatalog.upgradedThisShop.has(selectedGem.id)) {
            this.eventBus.emit('message:show', {
                text: 'This gem was already upgraded this shop visit!',
                type: 'error'
            });
            return;
        }
        
        // Deduct payment
        this.stateManager.updateState({
            player: {
                ...player,
                zenny: player.zenny - this.costs.upgradeGem
            }
        });
        
        // Get upgrade options
        this.getUpgradeOptions(selectedGem.instanceId, (options) => {
            // Ensure we have options
            if (!options || options.length === 0) {
                console.error("No upgrade options generated");
                
                // Refund payment
                this.stateManager.updateState({
                    player: {
                        ...this.stateManager.getState().player,
                        zenny: this.stateManager.getState().player.zenny + this.costs.upgradeGem
                    }
                });
                
                this.eventBus.emit('message:show', {
                    text: 'No upgrade options available for this gem',
                    type: 'error'
                });
                return;
            }
            
            // Set upgrade mode
            this.stateManager.updateState({
                gemCatalog: {
                    ...gemCatalog,
                    gemPool: options
                },
                inUpgradeMode: true
            });
        });
    }
    
    // Get upgrade options for a gem
    getUpgradeOptions(gemInstanceId, callback) {
        // Use the GemManager to get options
        this.eventBus.emit('gem:get-upgrade-options', {
            gemInstanceId,
            callback
        });
    }
    
    // Continue the journey after shopping
    continueJourney() {
        this.eventBus.emit('shop:completed');
        this.eventBus.emit('journey:continue');
    }
    
    // Generate shop inventory when entering shop
    generateShopInventory() {
        const state = this.stateManager.getState();
        const playerClass = state.player.class;
        const day = state.journey.day || 1;
        
        // Clear existing inventory
        this.shopInventory = [];
        
        // Get definitions from GemManager
        this.eventBus.emit('gem:get-definitions', {
            callback: (gemDefinitions) => {
                // Get unlocked gems
                const { meta } = state;
                let unlockedGemsList = [];
                
                if (Array.isArray(meta.unlockedGems)) {
                    unlockedGemsList = meta.unlockedGems;
                } else if (meta.unlockedGems && typeof meta.unlockedGems === 'object') {
                    const globalGems = meta.unlockedGems.global || [];
                    const classGems = meta.unlockedGems[playerClass] || [];
                    unlockedGemsList = [...globalGems, ...classGems];
                }
                
                // Base gems always available
                const baseGems = [
                    'red-attack', 'blue-magic', 'green-attack', 'grey-heal'
                ];
                
                // Class-specific starter gems
                const classStarterGems = {
                    'knight': ['red-strong'],
                    'mage': ['blue-strong-heal'],
                    'rogue': ['green-quick']
                };
                
                // Create list of available gems
                let possibleGems = [
                    ...baseGems,
                    ...(classStarterGems[playerClass] || []),
                    ...unlockedGemsList
                ];
                
                // Filter to gems with definitions
                possibleGems = possibleGems.filter(gemId => gemDefinitions[gemId]);
                
                // Create shop items
                const availableGems = possibleGems.map(gemId => ({
                    ...gemDefinitions[gemId],
                    price: this.calculateGemPrice(gemDefinitions[gemId], day)
                }));
                
                // Add rare chance for advanced gem
                if (Math.random() < 0.2) {
                    const advancedGems = {
                        'knight': ['red-burst'],
                        'mage': ['blue-shield'],
                        'rogue': ['green-poison']
                    };
                    
                    const classAdvancedGems = advancedGems[playerClass] || [];
                    if (classAdvancedGems.length > 0) {
                        const randomAdvancedGemId = classAdvancedGems[Math.floor(Math.random() * classAdvancedGems.length)];
                        
                        // Add if it exists and isn't already included
                        if (gemDefinitions[randomAdvancedGemId] && 
                            !availableGems.some(g => g.id === randomAdvancedGemId)) {
                            availableGems.push({
                                ...gemDefinitions[randomAdvancedGemId],
                                price: this.calculateGemPrice(gemDefinitions[randomAdvancedGemId], day) + 2 // Premium price
                            });
                        }
                    }
                }
                
                // Randomly select gems for inventory
                const selectedGems = [];
                const inventorySize = Math.min(this.inventorySize, availableGems.length);
                
                for (let i = 0; i < inventorySize; i++) {
                    // Filter out already selected gems
                    const availableForSelection = availableGems.filter(gem => 
                        !selectedGems.some(g => g.id === gem.id)
                    );
                    
                    if (availableForSelection.length === 0) break;
                    
                    // Select random gem
                    const randomIndex = Math.floor(Math.random() * availableForSelection.length);
                    selectedGems.push(availableForSelection[randomIndex]);
                }
                
                // Set shop inventory
                this.shopInventory = selectedGems;
            }
        });
        
        return this.shopInventory;
    }
    
    // Calculate gem price based on stats and day
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
        
        // Adjust for stamina cost
        price += gemDef.cost - 1;
        
        // Scale price based on day
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
                ...player,
                zenny: player.zenny - selectedGem.price
            },
            gems: {
                ...gems,
                bag: newBag
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
    
    // Handle gem catalog unlocking
    unlockGem(gemId) {
        const cost = 50; // Fixed cost for unlocking gems
        
        // Delegate to gem manager with proper cost
        return this.gemManager.unlockGem(gemId, cost);
    }
}