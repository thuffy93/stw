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
        
        // Listen for day end to reset the gem bag
        this.eventBus.on('day:ended', () => {
            this.resetBagForNewDay();
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
        const maxGemBagSize = 20;
        
        // Add basic gems for all classes
        gemBag.push(
            // Basic attacks for all classes - two of each
            ...Array(2).fill().map(() => this.createGem('red-attack')),
            ...Array(2).fill().map(() => this.createGem('blue-magic')),
            ...Array(2).fill().map(() => this.createGem('green-quick')),
            
            // Basic healing for all classes - two
            ...Array(2).fill().map(() => this.createGem('grey-heal'))
        );
        
        // Add class-specific gems
        if (classType === 'knight') {
            gemBag.push(
                // More red attacks for Knights
                ...Array(3).fill().map(() => this.createGem('red-attack')),
                ...Array(3).fill().map(() => this.createGem('red-strong'))
            );
        }
        else if (classType === 'mage') {
            gemBag.push(
                // More blue attacks/healing for Mages
                ...Array(3).fill().map(() => this.createGem('blue-magic')),
                ...Array(3).fill().map(() => this.createGem('blue-strong-heal'))
            );
        }
        else if (classType === 'rogue') {
            gemBag.push(
                // More green attacks/effects for Rogues
                ...Array(3).fill().map(() => this.createGem('green-quick')),
                ...Array(3).fill().map(() => this.createGem('green-poison'))
            );
        }
        
        // Fill remaining spots with basic gems to reach the max bag size
        const remainingSlots = maxGemBagSize - gemBag.length;
        const basicGemTypes = ['red-attack', 'blue-magic', 'green-quick', 'grey-heal'];
        
        for (let i = 0; i < remainingSlots; i++) {
            const randomType = basicGemTypes[Math.floor(Math.random() * basicGemTypes.length)];
            gemBag.push(this.createGem(randomType));
        }
        
        // Update state with shuffled gem bag
        this.stateManager.updateState({
            gems: {
                bag: this.shuffleArray(gemBag),
                hand: [],
                discarded: [],
                played: []
            }
        });
        
        console.log(`Created initial gem bag with ${gemBag.length} gems`);
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
        const { bag, hand } = state.gems;
        
        // Don't draw if hand is already full
        if (hand.length >= 3) {
            console.log("Hand is already full, not drawing gems");
            return;
        }
        
        // Calculate how many gems can be drawn
        const drawCount = Math.min(count, 3 - hand.length, bag.length);
        
        if (drawCount <= 0 || bag.length === 0) {
            console.log(`Cannot draw gems: drawCount=${drawCount}, bagSize=${bag.length}`);
            
            // If gem bag is empty but there are discarded gems, recycle them
            if (bag.length === 0 && state.gems.discarded.length > 0) {
                console.log("Recycling discarded gems into the bag");
                this.recycleDiscardPile();
                
                // Try to draw again after recycling
                setTimeout(() => this.drawGems(count), 100);
            }
            
            return;
        }
        
        console.log(`Drawing ${drawCount} gems from bag`);
        
        // Take gems from the beginning of the bag
        const drawnGems = bag.slice(0, drawCount);
        const newBag = bag.slice(drawCount);
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
        
        return gemsToDiscard;
    }
    
    // Recycle the discard pile back into the bag
    recycleDiscardPile() {
        const state = this.stateManager.getState();
        const { bag, discarded } = state.gems;
        
        if (discarded.length === 0) {
            console.log("No discarded gems to recycle");
            return;
        }
        
        console.log(`Recycling ${discarded.length} discarded gems into the bag`);
        
        // Add discarded gems to the bag and shuffle
        const newBag = this.shuffleArray([...bag, ...discarded]);
        
        // Update state with empty discard pile
        this.stateManager.updateState({
            gems: {
                bag: newBag,
                discarded: [],
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
        
        // Gather all gems from all locations
        const allGems = [...bag, ...hand, ...discarded, ...played];
        
        if (allGems.length === 0) {
            console.warn("No gems found when resetting for new day");
            return;
        }
        
        console.log(`Collected ${allGems.length} gems for next day`);
        
        // Shuffle all gems together and put back in the bag
        const shuffledGems = this.shuffleArray(allGems);
        
        // Update state with all gems back in the bag
        this.stateManager.updateState({
            gems: {
                bag: shuffledGems,
                hand: [],
                discarded: [],
                played: []
            }
        });
        
        return shuffledGems;
    }
    
    // Upgrade a gem (in shop)
    upgradeGem(gemInstanceId, newGemId) {
        const state = this.stateManager.getState();
        const allGems = [
            ...state.gems.bag,
            ...state.gems.hand,
            ...state.gems.discarded,
            ...state.gems.played
        ];
        
        // Find the gem to upgrade in any collection
        const gemIndex = allGems.findIndex(gem => gem.instanceId === gemInstanceId);
        
        if (gemIndex === -1) {
            console.error(`Gem not found for upgrade: ${gemInstanceId}`);
            return null;
        }
        
        // Create new gem
        const newGem = this.createGem(newGemId);
        
        if (!newGem) {
            console.error(`Failed to create new gem: ${newGemId}`);
            return null;
        }
        
        console.log(`Upgrading gem ${gemInstanceId} to ${newGemId}`);
        
        // Find which collection contains the gem
        let locationFound = false;
        
        // Check in bag
        let newBag = [...state.gems.bag];
        const bagIndex = newBag.findIndex(gem => gem.instanceId === gemInstanceId);
        if (bagIndex !== -1) {
            newBag[bagIndex] = newGem;
            locationFound = true;
            
            this.stateManager.updateState({
                gems: {
                    bag: newBag,
                    hand: state.gems.hand,
                    discarded: state.gems.discarded,
                    played: state.gems.played
                }
            });
        }
        
        // Check in hand
        if (!locationFound) {
            let newHand = [...state.gems.hand];
            const handIndex = newHand.findIndex(gem => gem.instanceId === gemInstanceId);
            if (handIndex !== -1) {
                newHand[handIndex] = newGem;
                locationFound = true;
                
                this.stateManager.updateState({
                    gems: {
                        bag: state.gems.bag,
                        hand: newHand,
                        discarded: state.gems.discarded,
                        played: state.gems.played
                    }
                });
            }
        }
        
        // Check in discarded
        if (!locationFound) {
            let newDiscarded = [...state.gems.discarded];
            const discardIndex = newDiscarded.findIndex(gem => gem.instanceId === gemInstanceId);
            if (discardIndex !== -1) {
                newDiscarded[discardIndex] = newGem;
                locationFound = true;
                
                this.stateManager.updateState({
                    gems: {
                        bag: state.gems.bag,
                        hand: state.gems.hand,
                        discarded: newDiscarded,
                        played: state.gems.played
                    }
                });
            }
        }
        
        // Check in played
        if (!locationFound) {
            let newPlayed = [...state.gems.played];
            const playedIndex = newPlayed.findIndex(gem => gem.instanceId === gemInstanceId);
            if (playedIndex !== -1) {
                newPlayed[playedIndex] = newGem;
                
                this.stateManager.updateState({
                    gems: {
                        bag: state.gems.bag,
                        hand: state.gems.hand,
                        discarded: state.gems.discarded,
                        played: newPlayed
                    }
                });
            }
        }
        
        // Emit event
        this.eventBus.emit('gem:upgraded', {
            oldGem: allGems[gemIndex],
            newGem
        });
        
        return newGem;
    }
    
    // Add a random gem to bag (shop purchase)
    addRandomGem() {
        const state = this.stateManager.getState();
        const allGemCount = 
            state.gems.bag.length + 
            state.gems.hand.length + 
            state.gems.discarded.length + 
            state.gems.played.length;
        
        const maxGemBagSize = 20;
        
        if (allGemCount >= maxGemBagSize) {
            this.eventBus.emit('message:show', {
                text: 'Gem collection is full!',
                type: 'error'
            });
            return null;
        }
        
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
        
        // Filter unlocked gems
        const unlockedGems = state.meta.unlockedGems;
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
        
        // Create the new gem
        const newGem = this.createGem(randomGemDef.id);
        
        // Add to gem bag
        const newBag = [...state.gems.bag, newGem];
        
        // Update state
        this.stateManager.updateState({
            gems: {
                bag: newBag,
                hand: state.gems.hand,
                discarded: state.gems.discarded,
                played: state.gems.played
            }
        });
        
        console.log(`Added new gem to bag: ${newGem.name} (${newGem.id})`);
        
        // Emit event
        this.eventBus.emit('gem:added', newGem);
        
        return newGem;
    }
    
    // Get upgrade options for a gem
    getUpgradeOptions(gemInstanceId) {
        const state = this.stateManager.getState();
        const allGems = [
            ...state.gems.bag,
            ...state.gems.hand,
            ...state.gems.discarded,
            ...state.gems.played
        ];
        
        const gem = allGems.find(g => g.instanceId === gemInstanceId);
        const unlockedGems = state.meta.unlockedGems;
        const playerClass = state.player.class;
        
        if (!gem) {
            console.error(`Gem not found for upgrade options: ${gemInstanceId}`);
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
        const playerClass = state.player.class;
        
        // Make sure we have a class selected
        if (!playerClass) {
            this.eventBus.emit('message:show', {
                text: 'No class selected!',
                type: 'error'
            });
            return false;
        }
        
        // Check if this gem is valid for the current class
        const classSpecificGems = {
            'knight': ['red-burst', 'red-strong', 'red-attack'],
            'mage': ['blue-shield', 'blue-strong-heal', 'blue-magic'],
            'rogue': ['green-backstab', 'green-poison', 'green-quick']
        };
        
        // Check if the gem is appropriate for the class (or is a grey gem which works for all)
        const gemDef = this.gemDefinitions[gemId];
        const isGrey = gemDef && gemDef.color === 'grey';
        const isClassAppropriate = classSpecificGems[playerClass] && classSpecificGems[playerClass].includes(gemId);
        
        if (!isGrey && !isClassAppropriate) {
            this.eventBus.emit('message:show', {
                text: `This gem cannot be unlocked by ${playerClass}!`,
                type: 'error'
            });
            return false;
        }
        
        // Load the class-specific gem catalog
        const classGemCatalog = state.classGemCatalogs[playerClass];
        
        // Check if already unlocked for this class
        if (classGemCatalog.unlocked.includes(gemId)) {
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
        
        // Add to unlocked gems for this class specifically and deduct cost
        const updatedClassUnlockedGems = [...classGemCatalog.unlocked, gemId];
        const updatedZenny = meta.zenny - cost;
        
        // Update class-specific gem catalog
        this.stateManager.updateState({
            classGemCatalogs: {
                ...state.classGemCatalogs,
                [playerClass]: {
                    ...classGemCatalog,
                    unlocked: updatedClassUnlockedGems
                }
            }
        });
        
        // Update current active gem catalog as well
        this.stateManager.updateState({
            gemCatalog: {
                ...state.gemCatalog,
                unlocked: updatedClassUnlockedGems
            }
        });
        
        // Update meta zenny
        this.stateManager.updateState({
            meta: {
                ...meta,
                zenny: updatedZenny
            }
        });
        
        // Remove from available gems list for this class
        const updatedAvailable = classGemCatalog.available.filter(g => g !== gemId);
        this.stateManager.updateState({
            classGemCatalogs: {
                ...state.classGemCatalogs,
                [playerClass]: {
                    ...classGemCatalog,
                    available: updatedAvailable
                }
            },
            gemCatalog: {
                ...state.gemCatalog,
                available: updatedAvailable
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
        
        // Return hand gems to discarded
        const handGems = [...state.gems.hand];
        const allDiscarded = [...state.gems.discarded, ...handGems];
        
        // Keep played gems separate
        this.stateManager.updateState({
            gems: {
                bag: state.gems.bag,
                hand: [],
                discarded: allDiscarded,
                played: state.gems.played
            }
        });
        
        // Draw new hand for next battle
        setTimeout(() => this.drawGems(3), 100);
    }
}