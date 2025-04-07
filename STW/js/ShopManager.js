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