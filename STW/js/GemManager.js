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
                cost: 1, // Stamina cost
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
                cost: 1,
                icon: '✨',
                baseSuccess: 100,
                tooltip: 'Deal 10 magic damage to the enemy. Mage class bonus: 50% extra damage.'
            },
            'green-quick': {
                id: 'green-quick',
                name: 'Green Quick',
                color: 'green',
                type: 'attack',
                value: 8,
                cost: 1,
                icon: '🏃',
                baseSuccess: 100,
                tooltip: 'Deal 8 damage to the enemy and draw a gem. Rogue class bonus: 50% extra damage.'
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
            'green-poison': {
                id: 'green-poison',
                name: 'Poison',
                color: 'green',
                type: 'poison',
                value: 4,
                cost: 2,
                icon: '☠️',
                duration: 3,
                baseSuccess: 100,
                tooltip: 'Apply 4 poison damage per turn for 3 turns. Rogue class bonus: 50% extra poison damage.'
            },
            
            // Advanced gems (unlockable)
            'red-burst': {
                id: 'red-burst',
                name: 'Burst Attack',
                color: 'red',
                type: 'attack',
                value: 20,
                cost: 3,
                icon: '💥',
                baseSuccess: 90,
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
                baseSuccess: 90,
                tooltip: 'Gain 15 defense for 2 turns. Mage class bonus: 50% more defense.'
            },
            'green-backstab': {
                id: 'green-backstab',
                name: 'Backstab',
                color: 'green',
                type: 'attack',
                value: 12,
                cost: 2,
                icon: '🗡️',
                baseSuccess: 90,
                tooltip: 'Deal 12 damage. If enemy has poison, deal double damage. Rogue class bonus: 50% extra damage.'
            }
        };
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Setup starter gems for each class
        this.classStarterGems = {
            'knight': ['red-attack', 'red-strong', 'grey-heal'],
            'mage': ['blue-magic', 'blue-strong-heal', 'grey-heal'],
            'rogue': ['green-quick', 'green-poison', 'grey-heal']
        };
        
        // Available unlockable gems by class
        this.availableGemsByClass = {
            'knight': ['red-burst'],
            'mage': ['blue-shield'],
            'rogue': ['green-backstab']
        };
    }
    
    setupEventListeners() {
        // Listen for class selection to initialize starter gems
        this.eventBus.on('class:selected', (classType) => {
            this.initializeClassGems(classType);
        });
        
        // Listen for gem play events to update proficiency
        this.eventBus.on('gem:played', (gemData) => {
            this.updateGemProficiency(gemData.id);
        });
    }
    
    // Initialize the player's gems based on class selection
    initializeClassGems(classType) {
        if (!this.classStarterGems[classType]) {
            console.error(`Unknown class type: ${classType}`);
            return;
        }
        
        // Create starter gems for the class
        const starterGems = this.classStarterGems[classType].map(gemId => 
            this.createGem(gemId)
        );
        
        // Update the state with the starter gems
        this.stateManager.updateState({
            gems: {
                bag: starterGems,
                hand: [],
                discarded: []
            }
        });
        
        // Initialize unlocked gems in meta progression if not already done
        const currentMeta = this.stateManager.getState('meta');
        if (!currentMeta.unlockedGems || currentMeta.unlockedGems.length === 0) {
            // Start with base gems always unlocked
            const baseUnlockedGems = [
                'red-attack', 'blue-magic', 'green-quick', 'grey-heal',
                'red-strong', 'blue-strong-heal', 'green-poison'
            ];
            
            this.stateManager.updateState({
                meta: {
                    unlockedGems: baseUnlockedGems
                }
            });
        }
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
    drawGems(count = 3) {
        const state = this.stateManager.getState();
        const { bag, hand } = state.gems;
        
        // Don't draw if hand is already full
        if (hand.length >= 3) {
            return;
        }
        
        // Calculate how many gems can be drawn
        const drawCount = Math.min(count, 3 - hand.length, bag.length);
        
        if (drawCount <= 0 || bag.length === 0) {
            return;
        }
        
        // Copy the bag and shuffle it
        const shuffledBag = [...bag].sort(() => Math.random() - 0.5);
        
        // Draw gems and update state
        const drawnGems = shuffledBag.slice(0, drawCount);
        const newBag = shuffledBag.slice(drawCount);
        const newHand = [...hand, ...drawnGems];
        
        // Fill the bag with random gems if it's not full
        const maxBagSize = 20;
        let finalBag = newBag;
        
        if (finalBag.length < maxBagSize) {
            // Determine how many gems to add
            const gemsToAdd = maxBagSize - finalBag.length;
            
            // Get list of unlocked gems
            const unlockedGems = state.meta.unlockedGems || [];
            const playerClass = state.player.class;
            
            // Add random gems to fill the bag
            for (let i = 0; i < gemsToAdd; i++) {
                // Similar logic to addRandomGem, but without state updates
                const availableGems = Object.values(this.gemDefinitions)
                    .filter(gem => unlockedGems.includes(gem.id));
                
                if (availableGems.length > 0) {
                    // Determine gem color probability based on class
                    let colorProbability = {
                        red: 0.25,
                        blue: 0.25,
                        green: 0.25,
                        grey: 0.25
                    };
                    
                    if (playerClass === 'knight') colorProbability.red = 0.55;
                    else if (playerClass === 'mage') colorProbability.blue = 0.55;
                    else if (playerClass === 'rogue') colorProbability.green = 0.55;
                    
                    // Select color based on probability
                    const rand = Math.random();
                    let selectedColor = 'grey'; // default
                    let cumulativeProbability = 0;
                    
                    for (const [color, probability] of Object.entries(colorProbability)) {
                        cumulativeProbability += probability;
                        if (rand <= cumulativeProbability) {
                            selectedColor = color;
                            break;
                        }
                    }
                    
                    // Filter gems by selected color
                    const gemsOfColor = availableGems.filter(gem => gem.color === selectedColor);
                    
                    if (gemsOfColor.length > 0) {
                        const randomGemDef = gemsOfColor[Math.floor(Math.random() * gemsOfColor.length)];
                        const newGem = this.createGem(randomGemDef.id);
                        finalBag.push(newGem);
                    }
                }
            }
        }
        
        // Update state
        this.stateManager.updateState({
            gems: {
                bag: finalBag,
                hand: newHand
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
        const { hand } = state.gems;
        const playerStamina = state.player.stamina;
        
        // Find the selected gems
        const selectedGems = hand.filter(gem => 
            selectedGemIds.includes(gem.instanceId)
        );
        
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
        
        // Remove played gems from hand
        const newHand = hand.filter(gem => 
            !selectedGemIds.includes(gem.instanceId)
        );
        
        // Update state
        this.stateManager.updateState({
            gems: {
                hand: newHand
            },
            player: {
                stamina: playerStamina - totalCost
            }
        });
        
        // Process each gem effect and emit events
        selectedGems.forEach(gem => {
            // Determine if gem succeeds based on proficiency
            const success = Math.random() * 100 < gem.proficiency;
            
            this.eventBus.emit('gem:played', {
                ...gem,
                success
            });
            
            // Update gem proficiency on successful use
            if (success) {
                this.updateGemProficiency(gem.id);
            }
        });
        
        return selectedGems;
    }
    
    // Update gem proficiency when successfully used
    updateGemProficiency(gemId) {
        const meta = this.stateManager.getState('meta');
        const currentProficiency = meta.gemProficiency[gemId] || 
            this.gemDefinitions[gemId]?.baseSuccess || 0;
        
        // Only update if not already mastered
        if (currentProficiency < 100) {
            // Increase proficiency by 15% (capped at 100%)
            const newProficiency = Math.min(100, currentProficiency + 15);
            
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
        
        // Remove from hand
        const newHand = hand.filter(gem => 
            !gemInstanceIds.includes(gem.instanceId)
        );
        
        // Add to discard pile
        const newDiscarded = [...discarded, ...gemsToDiscard];
        
        // Update state
        this.stateManager.updateState({
            gems: {
                hand: newHand,
                discarded: newDiscarded
            }
        });
        
        // Emit events
        gemsToDiscard.forEach(gem => {
            this.eventBus.emit('gem:discarded', gem);
        });
        
        return gemsToDiscard;
    }
    
    // Upgrade a gem (in shop)
    upgradeGem(gemInstanceId, newGemId) {
        const state = this.stateManager.getState();
        const { bag } = state.gems;
        
        // Find the gem to upgrade
        const gemIndex = bag.findIndex(gem => gem.instanceId === gemInstanceId);
        
        if (gemIndex === -1) {
            console.error(`Gem not found: ${gemInstanceId}`);
            return null;
        }
        
        // Create new gem
        const newGem = this.createGem(newGemId);
        
        if (!newGem) {
            return null;
        }
        
        // Replace old gem with upgraded version
        const newBag = [...bag];
        newBag[gemIndex] = newGem;
        
        // Update state
        this.stateManager.updateState({
            gems: {
                bag: newBag
            }
        });
        
        // Emit event
        this.eventBus.emit('gem:upgraded', {
            oldGem: bag[gemIndex],
            newGem
        });
        
        return newGem;
    }
    
    // Add a random gem to bag (shop purchase)
    addRandomGem() {
        const state = this.stateManager.getState();
        const { bag } = state.gems;
        const unlockedGems = state.meta.unlockedGems;
        const playerClass = state.player.class;
        
        if (bag.length >= 20) {
            this.eventBus.emit('message:show', {
                text: 'Gem bag is full!',
                type: 'error'
            });
            return null;
        }
        
        // Determine gem color probability based on class
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
        
        // Filter unlocked gems
        const availableGems = Object.values(this.gemDefinitions)
            .filter(gem => unlockedGems.includes(gem.id));
        
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
        
        if (!selectedColor) {
            console.error('No gems available to add');
            return null;
        }
        
        // Pick a random gem of the selected color
        const gemsOfColor = gemsByColor[selectedColor];
        const randomGemDef = gemsOfColor[Math.floor(Math.random() * gemsOfColor.length)];
        
        // Create and add the gem
        const newGem = this.createGem(randomGemDef.id);
        const newBag = [...bag, newGem];
        
        // Update state
        this.stateManager.updateState({
            gems: {
                bag: newBag
            }
        });
        
        // Emit event
        this.eventBus.emit('gem:added', newGem);
        
        return newGem;
    }
    
    // Get upgrade options for a gem
    getUpgradeOptions(gemInstanceId) {
        const state = this.stateManager.getState();
        const { bag } = state.gems;
        const unlockedGems = state.meta.unlockedGems;
        const playerClass = state.player.class;
        
        // Find the gem
        const gem = bag.find(g => g.instanceId === gemInstanceId);
        
        if (!gem) {
            console.error(`Gem not found: ${gemInstanceId}`);
            return [];
        }
        
        // Get all potential upgrade options of the same color
        const sameColorGems = Object.values(this.gemDefinitions)
            .filter(g => g.color === gem.color && g.id !== gem.id && unlockedGems.includes(g.id));
        
        // Prioritize upgrades based on class
        let upgrades = [...sameColorGems];
        
        // Move class-specific gems to the front of the list
        if (playerClass === 'knight' && gem.color === 'red') {
            upgrades.sort((a, b) => {
                if (a.id.includes('burst') || a.id.includes('strong')) return -1;
                if (b.id.includes('burst') || b.id.includes('strong')) return 1;
                return 0;
            });
        } else if (playerClass === 'mage' && gem.color === 'blue') {
            upgrades.sort((a, b) => {
                if (a.id.includes('shield') || a.id.includes('strong')) return -1;
                if (b.id.includes('shield') || b.id.includes('strong')) return 1;
                return 0;
            });
        } else if (playerClass === 'rogue' && gem.color === 'green') {
            upgrades.sort((a, b) => {
                if (a.id.includes('poison') || a.id.includes('backstab')) return -1;
                if (b.id.includes('poison') || b.id.includes('backstab')) return 1;
                return 0;
            });
        }
        
        return upgrades;
    }
    
    // Unlock a new gem in the meta progression
    unlockGem(gemId, cost = 50) {
        const state = this.stateManager.getState();
        const { meta } = state;
        
        // Check if already unlocked
        if (meta.unlockedGems.includes(gemId)) {
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
        
        // Add to unlocked gems and deduct cost
        const updatedUnlockedGems = [...meta.unlockedGems, gemId];
        const updatedZenny = meta.zenny - cost;
        
        // Update state
        this.stateManager.updateState({
            meta: {
                unlockedGems: updatedUnlockedGems,
                zenny: updatedZenny
            }
        });
        
        // Emit event
        this.eventBus.emit('gem:unlocked', {
            gemId,
            cost
        });
        
        return true;
    }
    
    // Reset gems at the end of a battle
    resetBattleGems() {
        const state = this.stateManager.getState();
        const { bag, hand, discarded } = state.gems;
        
        // Return all gems to the bag
        const newBag = [...bag, ...hand, ...discarded];
        
        // Update state
        this.stateManager.updateState({
            gems: {
                bag: newBag,
                hand: [],
                discarded: []
            }
        });
    }
}