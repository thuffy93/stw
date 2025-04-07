// ShopManager.js - Handles shop interactions and gem upgrades
export default class ShopManager {
    constructor(eventBus, stateManager, gemManager) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.gemManager = gemManager;
        
        // Costs for shop actions
        this.costs = {
            buyRandomGem: 3,
            discardGem: 3,
            upgradeGem: 5,
            swapGem: 2,
            healPlayer: 3
        };
        
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
        
        // Update shop UI
        if (this.uiManager && this.uiManager.updateShopScreen) {
            this.uiManager.updateShopScreen();
        }
    }
    
    
    // Buy a random gem
    buyRandomGem() {
        const state = this.stateManager.getState();
        const { player, gems } = state;
        
        // Check if bag is full
        if (gems.bag.length >= 20) {
            this.eventBus.emit('message:show', {
                text: 'Gem bag is full!',
                type: 'error'
            });
            return false;
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
            // Refund if failed
            this.stateManager.updateState({
                player: {
                    zenny: player.zenny
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
        
        // Find the gem
        const gemIndex = gems.bag.findIndex(gem => gem.instanceId === gemInstanceId);
        
        if (gemIndex === -1) {
            this.eventBus.emit('message:show', {
                text: 'Gem not found!',
                type: 'error'
            });
            return false;
        }
        
        // Remove the gem
        const discardedGem = gems.bag[gemIndex];
        const newBag = [...gems.bag.slice(0, gemIndex), ...gems.bag.slice(gemIndex + 1)];
        
        // Deduct cost and update state
        this.stateManager.updateState({
            player: {
                zenny: player.zenny - this.costs.discardGem
            },
            gems: {
                bag: newBag
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
        if (!state.inUpgradeMode || selectedGems.size !== 1) {
            this.eventBus.emit('message:show', {
                text: 'Please select a gem first',
                type: 'error'
            });
            return;
        }
        
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
        if (selectedIndex < 0 || selectedIndex >= hand.length) {
            this.eventBus.emit('message:show', {
                text: 'Invalid gem selection',
                type: 'error'
            });
            return;
        }
        
        const selectedGem = hand[selectedIndex];
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
    
    // Display gem upgrade options
    getUpgradeOptions(gemInstanceId) {
        return this.gemManager.getUpgradeOptions(gemInstanceId);
    }
    
    // Handle gem catalog unlocking
    unlockGem(gemId) {
        const state = this.stateManager.getState();
        const { meta } = state;
        const cost = 50; // Fixed cost for unlocking gems
        
        // Check if already unlocked
        if (meta.unlockedGems.includes(gemId)) {
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
        
        // Unlock the gem via gem manager
        return this.gemManager.unlockGem(gemId, cost);
    }
}