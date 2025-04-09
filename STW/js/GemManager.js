// GemManager.js - Handles gem creation, upgrades, and interactions
export default class GemManager {
    constructor(eventBus, stateManager) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        
        // Initialize with base gem definitions
        this.gemDefinitions = {
            // Base gems (always available)
            'red-attack': {
                id: 'red-attack',
                name: 'Red Attack',
                color: 'red',
                type: 'attack',
                value: 10, // Damage amount
                cost: 2, // Stamina cost updated to 2
                icon: '🗡️',
                baseSuccess: 100, // Base gems start fully mastered
                tooltip: 'Deal 10 damage to the enemy. Knight class bonus: 50% extra damage.'
            },
            'blue-magic': {
                id: 'blue-magic',
                name: 'Blue Magic',
                color: 'blue',
                type: 'attack',
                value: 10,
                cost: 2, // Stamina cost updated to 2
                icon: '✨',
                baseSuccess: 100,
                tooltip: 'Deal 10 magic damage to the enemy. Mage class bonus: 50% extra damage.'
            },
            'green-attack': {
                id: 'green-attack',
                name: 'Green Attack',
                color: 'green',
                type: 'attack',
                value: 8,
                cost: 1,
                icon: '🗡️',
                baseSuccess: 100,
                tooltip: 'Deal 8 damage to the enemy. Rogue class bonus: 50% extra damage.'
            },
            'grey-heal': {
                id: 'grey-heal',
                name: 'Heal',
                color: 'grey',
                type: 'heal',
                value: 8,
                cost: 1,
                icon: '💚',
                baseSuccess: 100,
                tooltip: 'Heal 8 health points.'
            },
            
            // Class-specific starting gems
            'red-strong': {
                id: 'red-strong',
                name: 'Strong Attack',
                color: 'red',
                type: 'attack',
                value: 15,
                cost: 2,
                icon: '⚔️',
                baseSuccess: 100,
                tooltip: 'Deal 15 damage to the enemy. Knight class bonus: 50% extra damage.'
            },
            'blue-strong-heal': {
                id: 'blue-strong-heal',
                name: 'Strong Heal',
                color: 'blue',
                type: 'heal',
                value: 12,
                cost: 2,
                icon: '❤️',
                baseSuccess: 100,
                tooltip: 'Heal 12 health points. Mage class bonus: 50% more healing.'
            },
            'green-quick': {
                id: 'green-quick',
                name: 'Quick Attack',
                color: 'green',
                type: 'attack',
                value: 8,
                cost: 1,
                icon: '🏃',
                baseSuccess: 100,
                specialEffect: 'draw',
                tooltip: 'Deal 8 damage and draw a gem. Rogue class bonus: 50% extra damage.'
            },
            
            // Advanced gems (unlockable) - UPDATED SUCCESS RATES
            'red-burst': {
                id: 'red-burst',
                name: 'Burst Attack',
                color: 'red',
                type: 'attack',
                value: 20,
                cost: 3,
                icon: '💥',
                baseSuccess: 15, // Changed from 90% to 15%
                tooltip: 'Deal 20 damage to the enemy. Knight class bonus: 50% extra damage.'
            },
            'blue-shield': {
                id: 'blue-shield',
                name: 'Shield',
                color: 'blue',
                type: 'shield',
                value: 15,
                cost: 2,
                duration: 2,
                icon: '🛡️',
                baseSuccess: 15, // Changed from 90% to 15%
                tooltip: 'Gain 15 defense for 2 turns. Mage class bonus: 50% more defense.'
            },
            'green-poison': { // Changed to be an unlockable gem for rogue
                id: 'green-poison',
                name: 'Poison',
                color: 'green',
                type: 'poison',
                value: 4,
                cost: 2,
                icon: '☠️',
                duration: 3,
                baseSuccess: 15, // Changed from 90% to 15%
                tooltip: 'Apply 4 poison damage per turn for 3 turns. Rogue class bonus: 50% extra poison damage.'
            },
        };
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Setup shared base gems that all classes have access to
        this.baseStarterGems = ['red-attack', 'blue-magic', 'green-attack', 'grey-heal'];
    
        // Setup class-specific starter gems (in addition to base gems)
        this.classStarterGems = {
            'knight': ['red-strong'],
            'mage': ['blue-strong-heal'],
            'rogue': ['green-quick']
        };
    
        // Available unlockable gems by class
        this.availableGemsByClass = {
            'knight': ['red-burst'],
            'mage': ['blue-shield'],
            'rogue': ['green-poison']
        };
        
        // NEW: Initialize starting bag size
        this.initializeGemBagSize();
    }    
    
    setupEventListeners() {
        // Listen for class selection to initialize starter gems
        this.eventBus.on('class:selected', (classType) => {
            this.initializeClassGems(classType);
        });
        
        // Listen for gem play events to update proficiency
        this.eventBus.on('gem:played', (gemData) => {
            // IMPROVED FIX: Add more detailed debug logging to track success state
            console.log(`Gem played: ${gemData.name} (${gemData.id}), Success: ${gemData.success}, Proficiency: ${gemData.proficiency}`);
            
            // Only update proficiency if:
            // 1. Gem was successful
            // 2. Gem is not fully mastered (proficiency < 70%)
            // 3. Gem is not a base starter gem (these start with 100% proficiency)
            if (gemData.success === true && gemData.proficiency < 70) {
                console.log(`  → Updating proficiency for successful unmastered gem: ${gemData.id}`);
                this.updateGemProficiency(gemData.id);
            } else {
                const skipReason = !gemData.success ? "failed gem" : 
                                   gemData.proficiency >= 70 ? "already mastered gem" : 
                                   "base gem";
                console.log(`  → NOT updating proficiency for ${skipReason}: ${gemData.id}`);
            }
        });
        
        // Listen for day end to reset the gem bag
        this.eventBus.on('day:ended', () => {
            this.resetBagForNewDay();
        });

        this.eventBus.on('gem:get-class-gems', (data) => {
            const classGems = this.getClassGems(data.playerClass);
            data.callback(classGems);
        });

        this.eventBus.on('gems:recycle', () => {
            this.recycleAllGems();
        });
        
        this.eventBus.on('gem:expand-bag', (amount) => {
            this.increaseGemBagSize(amount || 1);
        });
        
    }
    
    // Initialize the player's gems based on class selection
    initializeClassGems(classType) {
        if (!this.classStarterGems[classType]) {
            console.error(`Unknown class type: ${classType}`);
            return false;
        }
        
        console.log(`Initializing gems for ${classType}`);
        
        // Initialize unlocked gems in meta progression if not already done
        const currentMeta = this.stateManager.getState('meta');
        
        // Initialize the unlockedGems object with class-specific arrays if it doesn't exist
        // or if it's still using the old array structure
        if (!currentMeta.unlockedGems || Array.isArray(currentMeta.unlockedGems)) {
            console.log("Creating new class-specific gem unlock structure");
            
            // Base gems that are always available to all classes
            const globalGems = [
                'red-attack', 'blue-magic', 'green-attack', 'grey-heal'
            ];
            
            // Class-specific starter gems
            const knightGems = ['red-strong'];
            const mageGems = ['blue-strong-heal'];
            const rogueGems = ['green-quick'];
            
            // Create the new structure
            this.stateManager.updateState({
                meta: {
                    ...currentMeta,
                    unlockedGems: {
                        global: globalGems,
                        knight: knightGems,
                        mage: mageGems,
                        rogue: rogueGems
                    }
                }
            });
                       
        }

         // Reset gem bag size to exactly 20 for new run
        this.stateManager.updateState({
            gemBagSize: 20
        });
        console.log("Reset gem bag size to exactly 20 for new run");
        
        // Ensure player has clean buffs state before starting
        const state = this.stateManager.getState();
        if (!state.player.buffs || state.player.buffs.some(buff => buff.type === 'stunned')) {
            console.log("Clearing any existing player buffs/debuffs at game start");
            this.stateManager.updateState({
                player: {
                    ...state.player,
                    buffs: []
                }
            });
        }
        
        // Generate a fresh gem bag for the new run
        this.initializeNewGemBag(classType);
        
        return true;
    }
    
    // Create a new gem bag at the beginning of a run
    initializeNewGemBag(classType) {
        console.log(`Creating initial gem bag for ${classType}`);
        
        // Always start with an empty collection
        this.stateManager.updateState({
            gems: {
                bag: [],
                hand: [],
                discarded: [],
                played: [] // Track played gems separately
            }
        });
        
        const gemBag = [];
        const maxGemBagSize = this.getGemBagSize();
        
        // Base starter gems for all classes
        this.baseStarterGems.forEach(gemId => {
            // Add 2 copies of each base gem
            gemBag.push(this.createGem(gemId));
            gemBag.push(this.createGem(gemId));
        });
        
        // Class-specific starter gems (but NOT unlockable gems)
        if (this.classStarterGems[classType]) {
            this.classStarterGems[classType].forEach(gemId => {
                // Add 3 copies of class-specific gems
                gemBag.push(this.createGem(gemId));
                gemBag.push(this.createGem(gemId));
                gemBag.push(this.createGem(gemId));
            });
        }
        
        // Note: We are NOT adding unlockable gems to the initial bag
        // They should only be obtained through upgrades
        
        // Fill remaining slots with basic gems to reach the max bag size
        const remainingSlots = maxGemBagSize - gemBag.length;
        
        // Get class-appropriate basic gem types - include all base types plus class-specific ones
        let basicGemTypes = [...this.baseStarterGems];
        
        // Add class-specific starter gems to the basic types (but NOT unlockables)
        if (classType === 'knight' && this.classStarterGems['knight']) {
            basicGemTypes = [...basicGemTypes, ...this.classStarterGems['knight']];
        } else if (classType === 'mage' && this.classStarterGems['mage']) {
            basicGemTypes = [...basicGemTypes, ...this.classStarterGems['mage']];
        } else if (classType === 'rogue' && this.classStarterGems['rogue']) {
            basicGemTypes = [...basicGemTypes, ...this.classStarterGems['rogue']];
        }
        
        for (let i = 0; i < remainingSlots; i++) {
            const randomType = basicGemTypes[Math.floor(Math.random() * basicGemTypes.length)];
            gemBag.push(this.createGem(randomType));
        }
        
        console.log(`Created gem bag with ${gemBag.length} gems before shuffling`);
        console.log(`Gem types in bag: ${gemBag.map(g => g.id).join(', ')}`);
        
        // Shuffle the gem bag
        const shuffledBag = this.shuffleArray(gemBag);
        
        // Update state with shuffled gem bag
        this.stateManager.updateState({
            gems: {
                bag: shuffledBag,
                hand: [],
                discarded: [],
                played: []
            }
        });
        
        console.log(`Initialized gem bag with ${shuffledBag.length} shuffled gems`);
        
        return true;
    }

    initializeGemBagSize() {
        const state = this.stateManager.getState();
        
        // Get current max bag size or set default
        let maxBagSize = 30; // Default bag size increased to 30
        
        // Check if we need to update the state
        if (!state.gemBagSize) {
            console.log(`Initializing gem bag size to ${maxBagSize}`);
            
            // Update state with gem bag size - need to use proper merge
            this.stateManager.updateState({
                gemBagSize: maxBagSize
            });
        } else {
            console.log(`Gem bag size already set to ${state.gemBagSize}`);
        }
    }
    
    // NEW: Method to increase gem bag size
    increaseGemBagSize(amount = 1) {
        const state = this.stateManager.getState();
        const currentSize = state.gemBagSize || 20;
        const newSize = currentSize + amount;
        
        this.stateManager.updateState({
            gemBagSize: newSize
        });
        
        console.log(`Increased gem bag size from ${currentSize} to ${newSize}`);
        
        return newSize;
    } 


    getGemBagSize() {
        const state = this.stateManager.getState();
        return state.gemBagSize || 30; // Default to 30 if not set
    }
    
    // Shuffle array using Fisher-Yates algorithm
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    getClassGems(playerClass) {
        // Base gems are available to all classes
        const baseGems = [
            'grey-heal',
            'red-attack',     // Basic red attack available to all
            'blue-magic',     // Basic blue magic available to all
            'green-attack'    // Basic green attack available to all
        ];
        
        // Class-specific gems
        const classBaseGems = {
            'knight': ['red-strong'],
            'mage': ['blue-strong-heal'],
            'rogue': ['green-quick']
        };
        
        // Unlockable gems
        const unlockableGems = {
            'knight': ['red-burst'],
            'mage': ['blue-shield'],
            'rogue': ['green-poison']
        };
        
        // Combine base gems with class-specific gems
        let result = [...baseGems];
        
        // Add class-specific starter gems
        if (classBaseGems[playerClass]) {
            result = [...result, ...classBaseGems[playerClass]];
        }
        
        // Also add unlockable gems for the class
        if (unlockableGems[playerClass]) {
            result = [...result, ...unlockableGems[playerClass]];
        }
        
        return result;
    }    

    // Create a gem instance based on its definition
    createGem(gemId) {
        const definition = this.gemDefinitions[gemId];
        if (!definition) {
            console.error(`Unknown gem ID: ${gemId}`);
            return null;
        }
        
        // Get current proficiency from state or use base value
        const meta = this.stateManager.getState('meta');
        const proficiency = meta.gemProficiency[gemId] || definition.baseSuccess;
        
        return {
            ...definition,
            instanceId: `${gemId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            proficiency
        };
    }
    
    // Draw gems from the bag to the hand
    drawGems(count = 1) {
        const state = this.stateManager.getState();
        const { bag, hand, discarded } = state.gems;
        
        // Don't draw if hand is already full
        if (hand.length >= 3) {
            console.log("Hand is already full, not drawing gems");
            return;
        }
        
        // Explicitly recycle discarded pile if bag is empty
        if (bag.length === 0 && discarded.length > 0) {
            this.recycleDiscardPile();
        }
        
        // Recheck bag length after potential recycling
        const updatedState = this.stateManager.getState();
        const updatedBag = updatedState.gems.bag;
        
        // Calculate how many gems can be drawn
        const neededGems = Math.min(count, 3 - hand.length);
        const drawCount = Math.min(neededGems, updatedBag.length);
        
        if (drawCount <= 0) {
            console.log(`Cannot draw gems: bagSize=${updatedBag.length}`);
            return;
        }
        
        console.log(`Drawing ${drawCount} gems from bag`);
        
        // Take gems from the beginning of the bag
        const drawnGems = updatedBag.slice(0, drawCount);
        const newBag = updatedBag.slice(drawCount);
        const newHand = [...hand, ...drawnGems];
        
        // Update state
        this.stateManager.updateState({
            gems: {
                bag: newBag,
                hand: newHand,
                discarded: state.gems.discarded,
                played: state.gems.played
            }
        });
        
        // Emit event for each drawn gem
        drawnGems.forEach(gem => {
            this.eventBus.emit('gem:drawn', gem);
        });
        
        return drawnGems;
    }
    
    // Play selected gems from the hand
    playGems(selectedGemIds) {
        const state = this.stateManager.getState();
        const { hand, played, discarded } = state.gems;
        const playerStamina = state.player.stamina;
        
        // Find the selected gems
        const selectedGems = hand.filter(gem => 
            selectedGemIds.includes(gem.instanceId)
        );
        
        if (selectedGems.length === 0) {
            console.log("No gems selected to play");
            return;
        }
        
        // Calculate total stamina cost
        const totalCost = selectedGems.reduce((sum, gem) => sum + gem.cost, 0);
        
        // Check if enough stamina
        if (totalCost > playerStamina) {
            this.eventBus.emit('message:show', {
                text: 'Not enough stamina to play these gems!',
                type: 'error'
            });
            return;
        }
        
        console.log(`Playing ${selectedGems.length} gems with stamina cost ${totalCost}`);
        
        // Remove played gems from hand
        const newHand = hand.filter(gem => 
            !selectedGemIds.includes(gem.instanceId)
        );
        
        // Add to played gems collection - NOT back to the bag
        const newPlayed = [...played, ...selectedGems];
        
        // Update state
        this.stateManager.updateState({
            gems: {
                hand: newHand,
                played: newPlayed,
                bag: state.gems.bag,
                discarded: state.gems.discarded
            },
            player: {
                stamina: playerStamina - totalCost
            }
        });
        
        // Emit event to track stamina used
        this.eventBus.emit('stamina:used', totalCost);
        
        // Process each gem effect and emit events
        selectedGems.forEach(gem => {
            // IMPROVED: Ensure the success calculation is explicit and correctly logged
            const successRoll = Math.random() * 100;
            const success = successRoll < gem.proficiency;
            
            console.log(`Gem ${gem.name} (${gem.id}) - Proficiency: ${gem.proficiency}, Roll: ${successRoll.toFixed(2)}, Success: ${success}`);
            
            // FIXED: Only emit gem:played event, don't update proficiency here
            // Let the event handler in setupEventListeners handle the proficiency update
            this.eventBus.emit('gem:played', {
                ...gem,
                success: success  // Explicitly set the success property
            });
        });
        
        // Check if the gem bag is empty after playing gems
        if (state.gems.bag.length === 0 && state.gems.discarded.length > 0) {
            // Recycle discarded gems if bag is empty
            this.recycleDiscardPile();
        }
        
        return selectedGems;
    }
    
    // Update gem proficiency when successfully used
    updateGemProficiency(gemId) {
        const meta = this.stateManager.getState('meta');
        const currentProficiency = meta.gemProficiency[gemId] || 
            this.gemDefinitions[gemId]?.baseSuccess || 0;
        
        // Only update if not already at max proficiency (now 70% instead of 100%)
        if (currentProficiency < 70) {
            // Increase proficiency by 15% (capped at 70%)
            const newProficiency = Math.min(70, currentProficiency + 15);
            
            const updatedProficiency = {
                ...meta.gemProficiency,
                [gemId]: newProficiency
            };
            
            this.stateManager.updateState({
                meta: {
                    gemProficiency: updatedProficiency
                }
            });
            
            this.eventBus.emit('gem:proficiency-updated', {
                gemId,
                oldValue: currentProficiency,
                newValue: newProficiency
            });
            
            console.log(`Updated proficiency for ${gemId}: ${currentProficiency} -> ${newProficiency}`);
        }
    }
    
    // Discard specific gems from hand
    discardGems(gemInstanceIds) {
        const state = this.stateManager.getState();
        const { hand, discarded } = state.gems;
        
        // Find gems to discard
        const gemsToDiscard = hand.filter(gem => 
            gemInstanceIds.includes(gem.instanceId)
        );
        
        if (gemsToDiscard.length === 0) {
            console.log("No gems selected to discard");
            return [];
        }
        
        console.log(`Discarding ${gemsToDiscard.length} gems`);
        
        // Remove from hand
        const newHand = hand.filter(gem => 
            !gemInstanceIds.includes(gem.instanceId)
        );
        
        // Add to discard pile (these will be recycled into the bag)
        const newDiscarded = [...discarded, ...gemsToDiscard];
        
        // Update state
        this.stateManager.updateState({
            gems: {
                hand: newHand,
                discarded: newDiscarded,
                bag: state.gems.bag,
                played: state.gems.played
            }
        });
        
        // Emit events
        gemsToDiscard.forEach(gem => {
            this.eventBus.emit('gem:discarded', gem);
        });
        
        // Automatically recycle the discard pile when discarding
        this.recycleDiscardPile();
        
        return gemsToDiscard;
    }
    
    // Recycle the discard pile back into the bag
    recycleDiscardPile() {
        const state = this.stateManager.getState();
        const { bag, discarded } = state.gems;
        
        if (discarded.length === 0) {
            console.log("No discarded gems to recycle");
            return bag;
        }
        
        console.log(`Recycling ${discarded.length} discarded gems into the bag`);
        
        // Add discarded gems to the bag and shuffle
        const newBag = this.shuffleArray([...bag, ...discarded]);
        
        // Update state with empty discard pile
        this.stateManager.updateState({
            gems: {
                bag: newBag,
                discarded: [], // Always clear discarded pile when recycling
                hand: state.gems.hand,
                played: state.gems.played
            }
        });
        
        this.eventBus.emit('message:show', {
            text: 'Discarded gems shuffled back into the bag',
            type: 'success'
        });
        
        return newBag;
    }
    
    // Reset the gem bag for a new day, maintaining all gems
    resetBagForNewDay() {
        const state = this.stateManager.getState();
        const { bag, hand, discarded, played } = state.gems;
        
        console.log("Resetting gem bag for new day");
        
        // Gather all gems that are not in the hand, including played and discarded
        const bankedGems = [...bag, ...discarded, ...played];
        
        if (bankedGems.length === 0) {
            console.warn("No gems found when resetting for new day");
            return;
        }
        
        console.log(`Collected ${bankedGems.length} banked gems for next day`);
        
        // Shuffle banked gems
        const shuffledGems = this.shuffleArray(bankedGems);
        
        // Update state with shuffled banked gems
        this.stateManager.updateState({
            gems: {
                bag: shuffledGems,
                hand: hand, // Keep current hand intact
                discarded: [], // Clear discarded pile
                played: [] // Clear played gems at start of new day
            }
        });
        
        return shuffledGems;
    }
    
    recycleAllGems() {
        const state = this.stateManager.getState();
        
        // Only recycle discarded gems
        const discardedGems = [...state.gems.discarded];
        const bagGems = [...state.gems.bag];
        const handGems = [...state.gems.hand];
        const playedGems = [...state.gems.played];
        
        // If no discarded gems, just return current state
        if (discardedGems.length === 0) {
            console.log("No gems to recycle");
            return state.gems.bag;
        }
        
        // Shuffle discarded gems into the bag
        const shuffledBag = this.shuffleArray([...bagGems, ...discardedGems]);
        
        console.log(`Recycling ${discardedGems.length} discarded gems back into the bag`);
        
        // Update state with recycled gems
        this.stateManager.updateState({
            gems: {
                bag: shuffledBag,
                hand: handGems,
                discarded: [],
                played: playedGems  // Keep played gems intact
            }
        });
        
        return shuffledBag;
    }
    // Upgrade a gem (in shop)
    upgradeGem(gemInstanceId, newGemId) {
        const state = this.stateManager.getState();
        
        // Since we're only upgrading from the hand in the shop, only look in hand
        const handGems = state.gems.hand;
        
        // Find the gem to upgrade in hand
        const gemIndex = handGems.findIndex(gem => gem.instanceId === gemInstanceId);
        
        if (gemIndex === -1) {
            console.error(`Gem not found in hand for upgrade: ${gemInstanceId}`);
            return null;
        }
        
        // Get the original gem for reference
        const originalGem = handGems[gemIndex];
        
        // Create new gem
        const newGem = this.createGem(newGemId);
        
        if (!newGem) {
            console.error(`Failed to create new gem: ${newGemId}`);
            return null;
        }
        
        console.log(`Upgrading gem ${originalGem.name} (${gemInstanceId}) to ${newGem.name} (${newGemId})`);
        
        // Replace in hand
        const newHand = [...handGems];
        newHand[gemIndex] = newGem;
        
        // Update state, only changing the hand
        this.stateManager.updateState({
            gems: {
                hand: newHand,
                bag: state.gems.bag,
                discarded: state.gems.discarded,
                played: state.gems.played
            }
        });
        
        // Fixed: Don't deduct cost here - let ShopManager handle it
        // ShopManager already deducts the cost after calling this method
        
        // Emit event
        this.eventBus.emit('gem:upgraded', {
            oldGem: originalGem,
            newGem
        });
        
        // Show success message
        this.eventBus.emit('message:show', {
            text: `Upgraded ${originalGem.name} to ${newGem.name}!`,
            type: 'success'
        });
        
        return newGem;
    }
    
    // Add a random gem to bag (shop purchase)
    addRandomGem() {
        let state = this.stateManager.getState();
        
        // Ensure that state.gems.played exists before trying to use it
        if (!state.gems.played) {
            this.stateManager.updateState({
                gems: {
                    ...state.gems,
                    played: []
                }
            });
            state = this.stateManager.getState();
        }
        
        // Create the new gem
        const newGem = this.createRandomGem(state);
        
        if (!newGem) {
            console.error('Failed to create random gem');
            return null;
        }
        
        // Add to gem bag
        const newBag = [...state.gems.bag, newGem];
        
        // Calculate new max bag size
        const currentBagSize = state.gemBagSize || 20;
        const newBagSize = currentBagSize + 1;
        
        // Update state with new gem and increased bag size
        this.stateManager.updateState({
            gems: {
                bag: newBag,
                hand: state.gems.hand,
                discarded: state.gems.discarded,
                played: state.gems.played
            },
            gemBagSize: newBagSize
        });
        
        console.log(`Added new gem to bag: ${newGem.name} (${newGem.id}), New bag size: ${newBagSize}`);
        
        // Emit event
        this.eventBus.emit('gem:added', newGem);
        
        return newGem;
    }
    // Helper method to create a random gem (extracted from existing method)
    createRandomGem(state) {
        // Determine gem color probability based on class
        const playerClass = state.player.class;
        let colorProbability = {
            red: 0.25,
            blue: 0.25,
            green: 0.25,
            grey: 0.25
        };
        
        // Adjust probability based on class
        if (playerClass === 'knight') {
            colorProbability.red = 0.55;
        } else if (playerClass === 'mage') {
            colorProbability.blue = 0.55;
        } else if (playerClass === 'rogue') {
            colorProbability.green = 0.55;
        }
        
        // Prepare available gems
        let availableGems = [];
        
        // Always include base gems
        this.baseStarterGems.forEach(gemId => {
            if (this.gemDefinitions[gemId]) {
                availableGems.push(this.gemDefinitions[gemId]);
            }
        });
        
        // Add class-specific starter gems
        if (this.classStarterGems[playerClass]) {
            this.classStarterGems[playerClass].forEach(gemId => {
                if (this.gemDefinitions[gemId]) {
                    availableGems.push(this.gemDefinitions[gemId]);
                }
            });
        }
        
        if (availableGems.length === 0) {
            console.error('No available gems to add');
            return null;
        }
        
        // Group gems by color
        const gemsByColor = {
            red: availableGems.filter(gem => gem.color === 'red'),
            blue: availableGems.filter(gem => gem.color === 'blue'),
            green: availableGems.filter(gem => gem.color === 'green'),
            grey: availableGems.filter(gem => gem.color === 'grey')
        };
        
        // Select a color based on probability
        let selectedColor;
        const rand = Math.random();
        let cumulativeProbability = 0;
        
        for (const [color, probability] of Object.entries(colorProbability)) {
            cumulativeProbability += probability;
            if (rand <= cumulativeProbability) {
                selectedColor = color;
                break;
            }
        }
        
        // If no gems of selected color, pick any color
        if (!gemsByColor[selectedColor] || gemsByColor[selectedColor].length === 0) {
            selectedColor = Object.keys(gemsByColor).find(color => 
                gemsByColor[color] && gemsByColor[color].length > 0
            );
        }
        
        if (!selectedColor || !gemsByColor[selectedColor] || gemsByColor[selectedColor].length === 0) {
            console.error('No gems available to add');
            return null;
        }
        
        // Pick a random gem of the selected color
        const gemsOfColor = gemsByColor[selectedColor];
        const randomGemDef = gemsOfColor[Math.floor(Math.random() * gemsOfColor.length)];
        
        if (!randomGemDef || !randomGemDef.id) {
            console.error('Selected gem definition is invalid');
            return null;
        }
        
        // Create the new gem
        return this.createGem(randomGemDef.id);
    }
    // Get upgrade options for a gem
    getUpgradeOptions(gemInstanceId) {
        const state = this.stateManager.getState();
        const handGems = state.gems.hand;
        
        const gem = handGems.find(g => g.instanceId === gemInstanceId);
        const playerClass = state.player.class;
        
        if (!gem) {
            console.error(`Gem not found in hand for upgrade options: ${gemInstanceId}`);
            return [];
        }
        
        const upgrades = [];
        
        // 1. Add direct stat upgrade option for the same gem type
        const directUpgrade = {
            ...this.gemDefinitions[gem.id],
            id: `${gem.id}-upgraded`,
            name: `Upgraded ${gem.name}`,
            value: Math.floor(gem.value * 1.5), // 50% power increase
            cost: gem.cost, // Keep the same cost
            upgradeType: 'direct'
        };
        upgrades.push(directUpgrade);
        
        // 2. Only offer class-specific upgrades for base gems
        // For example, red-attack can upgrade to red-strong for Knights
        const baseToClassUpgradeMap = {
            'knight': {
                'red-attack': 'red-strong'
            },
            'mage': {
                'blue-magic': 'blue-strong-heal'
            },
            'rogue': {
                'green-attack': 'green-quick'
            }
        };
        
        const classUpgradeId = baseToClassUpgradeMap[playerClass]?.[gem.id];
        if (classUpgradeId && this.gemDefinitions[classUpgradeId]) {
            const classUpgrade = {
                ...this.gemDefinitions[classUpgradeId],
                upgradeType: 'class'
            };
            upgrades.push(classUpgrade);
        }
        
        // 3. Add unlocked gems of the same color (but only if they're actually unlocked)
        // Fix for the error: Handle both array and object structure of unlockedGems
        let unlockedGemsList = [];
        const { meta } = state;
        
        if (Array.isArray(meta.unlockedGems)) {
            // Old structure - simple array
            unlockedGemsList = meta.unlockedGems;
        } else if (meta.unlockedGems && typeof meta.unlockedGems === 'object') {
            // New structure - combine global and class-specific unlocks
            const globalGems = meta.unlockedGems.global || [];
            const classGems = meta.unlockedGems[playerClass] || [];
            unlockedGemsList = [...globalGems, ...classGems];
        }
        
        // Now we have unlockedGemsList as an array, we can safely use includes()
        if (gem.color === 'red' && playerClass === 'knight' && unlockedGemsList.includes('red-burst')) {
            const burstUpgrade = {
                ...this.gemDefinitions['red-burst'],
                upgradeType: 'unlocked'
            };
            upgrades.push(burstUpgrade);
        }
        else if (gem.color === 'blue' && playerClass === 'mage' && unlockedGemsList.includes('blue-shield')) {
            const shieldUpgrade = {
                ...this.gemDefinitions['blue-shield'],
                upgradeType: 'unlocked'
            };
            upgrades.push(shieldUpgrade);
        }
        else if (gem.color === 'green' && playerClass === 'rogue' && unlockedGemsList.includes('green-poison')) {
            const poisonUpgrade = {
                ...this.gemDefinitions['green-poison'],
                upgradeType: 'unlocked'
            };
            upgrades.push(poisonUpgrade);
        }
        
        console.log(`Generated ${upgrades.length} upgrade options for ${gem.name}`);
        return upgrades;
    }
    
    // Unlock a new gem in the meta progression
    unlockGem(gemId, cost = 50) {
        const state = this.stateManager.getState();
        const { meta } = state;
        const playerClass = state.player.class;
        
        // Make sure we have a class selected
        if (!playerClass) {
            this.eventBus.emit('message:show', {
                text: 'No class selected!',
                type: 'error'
            });
            return false;
        }
        
        // Validate the gem is appropriate for the class
        const gemDef = this.gemDefinitions[gemId];
        if (!gemDef) {
            console.error(`Unknown gem ID: ${gemId}`);
            return false;
        }
        
        // Check if this gem is valid for the current class
        const classSpecificGems = {
            'knight': ['red-burst', 'red-strong', 'red-attack'],
            'mage': ['blue-shield', 'blue-strong-heal', 'blue-magic'],
            'rogue': ['green-poison', 'green-quick', 'green-attack']
        };
        
        // Check if the gem is appropriate for the class (or is a grey gem which works for all)
        const isGrey = gemDef && gemDef.color === 'grey';
        const isClassAppropriate = classSpecificGems[playerClass] && classSpecificGems[playerClass].includes(gemId);
        
        if (!isGrey && !isClassAppropriate) {
            this.eventBus.emit('message:show', {
                text: `This gem cannot be unlocked by ${playerClass}!`,
                type: 'error'
            });
            return false;
        }
        
        // Make sure meta.unlockedGems is using the new structure
        if (Array.isArray(meta.unlockedGems)) {
            console.error("Unlocked gems is still using old array structure");
            return false;
        }
        
        // Check if already unlocked for this class
        const classGems = meta.unlockedGems[playerClass] || [];
        const globalGems = meta.unlockedGems.global || [];
        
        if (classGems.includes(gemId) || globalGems.includes(gemId)) {
            this.eventBus.emit('message:show', {
                text: 'Gem already unlocked!',
                type: 'error'
            });
            return false;
        }
        
        // Check if we have enough meta zenny
        if (meta.zenny < cost) {
            this.eventBus.emit('message:show', {
                text: 'Not enough Meta $ZENNY!',
                type: 'error'
            });
            return false;
        }
        
        // Add to unlocked gems for this specific class and deduct cost
        const updatedClassGems = [...classGems, gemId];
        const updatedZenny = meta.zenny - cost;
        
        // Update state with new unlocked gems and zenny
        this.stateManager.updateState({
            meta: {
                ...meta,
                unlockedGems: {
                    ...meta.unlockedGems,
                    [playerClass]: updatedClassGems
                },
                zenny: updatedZenny
            }
        });
        
        // Emit event
        this.eventBus.emit('gem:unlocked', {
            gemId,
            cost,
            playerClass
        });
        
        // Show success message
        this.eventBus.emit('message:show', {
            text: `Unlocked ${gemDef.name} for your ${playerClass}!`,
            type: 'success'
        });
        
        return true;
    }
    
    // Get a list of all gems (across all collections)
    getAllGems() {
        const state = this.stateManager.getState();
        return [
            ...state.gems.bag,
            ...state.gems.hand,
            ...state.gems.discarded,
            ...state.gems.played
        ];
    }
    
    // Reset gems for a fleeing scenario
    resetGemsAfterFleeing() {
        const state = this.stateManager.getState();
        
        // FIXED: Don't discard the hand gems, keep them for the next battle
        console.log("Preserving hand when fleeing");
        
        // No changes to state - keep hand as is
        // If needed, draw more gems to fill the hand up to 3
        const currentHandSize = state.gems.hand.length;
        if (currentHandSize < 3) {
            const gemsToDraw = 3 - currentHandSize;
            console.log(`Hand has ${currentHandSize} gems, drawing ${gemsToDraw} more to fill it`);
            this.drawGems(gemsToDraw);
        }
    }
}
