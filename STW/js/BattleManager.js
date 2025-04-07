// BattleManager.js - Handles battle mechanics and enemy AI
export default class BattleManager {
    constructor(eventBus, stateManager, gemManager) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.gemManager = gemManager;
        
        // Enemy definitions by day and phase
        this.enemyPool = {
            // Day 1
            1: {
                DAWN: [
                    {
                        id: 'grunt1',
                        name: 'Small Grunt',
                        health: 20,
                        maxHealth: 20,
                        attack: 8,
                        image: '👹',
                        zenny: 3,
                        actions: ['attack']
                    }
                ],
                DUSK: [
                    {
                        id: 'bandit1',
                        name: 'Bandit',
                        health: 25,
                        maxHealth: 25,
                        attack: 10,
                        image: '💀',
                        zenny: 5,
                        actions: ['attack', 'defend']
                    }
                ],
                DARK: [
                    {
                        id: 'wolf1',
                        name: 'Shadow Wolf',
                        health: 35,
                        maxHealth: 35,
                        attack: 12,
                        image: '🐺',
                        zenny: 10,
                        actions: ['attack', 'howl'] // howl increases next attack
                    }
                ]
            },
            // Day 2
            2: {
                DAWN: [
                    {
                        id: 'grunt2',
                        name: 'Angry Grunt',
                        health: 30,
                        maxHealth: 30,
                        attack: 10,
                        image: '👹',
                        zenny: 5,
                        actions: ['attack', 'enrage'] // enrage increases attack permanently
                    }
                ],
                DUSK: [
                    {
                        id: 'bandit2',
                        name: 'Bandit Leader',
                        health: 35,
                        maxHealth: 35,
                        attack: 12,
                        image: '💀',
                        zenny: 8,
                        actions: ['attack', 'defend', 'steal'] // steal reduces player zenny
                    }
                ],
                DARK: [
                    {
                        id: 'goblin1',
                        name: 'Goblin King',
                        health: 45,
                        maxHealth: 45,
                        attack: 15,
                        image: '👿',
                        zenny: 15,
                        actions: ['attack', 'summon', 'poison'] // summon adds extra damage
                    }
                ]
            },
            // Day 3+ - add more days as needed
            3: {
                DAWN: [
                    {
                        id: 'witch1',
                        name: 'Forest Witch',
                        health: 40,
                        maxHealth: 40,
                        attack: 12,
                        image: '🧙‍♀️',
                        zenny: 8,
                        actions: ['attack', 'curse', 'heal'] // curse reduces player damage
                    }
                ],
                DUSK: [
                    {
                        id: 'golem1',
                        name: 'Stone Golem',
                        health: 50,
                        maxHealth: 50,
                        attack: 14,
                        image: '🗿',
                        zenny: 12,
                        actions: ['attack', 'harden'] // harden increases defense
                    }
                ],
                DARK: [
                    {
                        id: 'dragon1',
                        name: 'Young Dragon',
                        health: 60,
                        maxHealth: 60,
                        attack: 18,
                        image: '🐉',
                        zenny: 20,
                        actions: ['attack', 'breathe', 'tail'] // breathe is AOE damage
                    }
                ]
            }
        };
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for gem play events
        this.eventBus.on('gem:played', (gemData) => {
            this.processGemEffect(gemData);
        });
        
        // Listen for turn end events
        this.eventBus.on('turn:ended', () => {
            this.processEndOfTurn();
        });
        
        // Listen for battle start events
        this.eventBus.on('battle:start', () => {
            this.startBattle();
        });
    }
    
    // Start a new battle
    startBattle() {
        const state = this.stateManager.getState();
        const { day, phase } = state.journey;
        
        // Get enemy for current day and phase
        const enemy = this.getRandomEnemy(day, phase);
        if (!enemy) {
            console.error(`No enemy found for day ${day}, phase ${phase}`);
            return;
        }
        
        // Initialize battle state
        this.stateManager.updateState({
            battle: {
                inProgress: true,
                currentTurn: 'PLAYER',
                enemy: enemy,
                selectedGems: []
            }
        });
        
        // Reset player stamina at start of battle
        this.stateManager.updateState({
            player: {
                stamina: state.player.maxStamina
            }
        });
        
        // Draw initial hand
        this.gemManager.drawGems(3);
        
        // Emit battle started event
        this.eventBus.emit('battle:started', {
            enemy,
            day,
            phase
        });
    }
    
    // Get a random enemy for the current day and phase
    getRandomEnemy(day, phase) {
        // Get the enemy pool for the day/phase
        const dayPool = this.enemyPool[day] || this.enemyPool[1]; // Default to day 1 if not found
        const phasePool = dayPool[phase];
        
        if (!phasePool || phasePool.length === 0) {
            console.error(`No enemies found for day ${day}, phase ${phase}`);
            return null;
        }
        
        // Pick a random enemy from the pool
        const randomIndex = Math.floor(Math.random() * phasePool.length);
        const enemyTemplate = phasePool[randomIndex];
        
        // Clone the enemy to avoid modifying the template
        return {
            ...enemyTemplate,
            buffs: [],
            nextAction: this.determineEnemyAction(enemyTemplate)
        };
    }
    
    // Process gem effects when played
    processGemEffect(gem) {
        if (!gem.success) {
            this.processGemFailure(gem);
            return;
        }
        
        const state = this.stateManager.getState();
        const { enemy } = state.battle;
        const { player } = state;
        
        // Get player class for bonus calculation
        const playerClass = player.class;
        
        switch(gem.type) {
            case 'attack':
                let damageAmount = gem.value;
                
                // Apply class bonus if applicable
                if ((playerClass === 'knight' && gem.color === 'red') ||
                    (playerClass === 'mage' && gem.color === 'blue') ||
                    (playerClass === 'rogue' && gem.color === 'green')) {
                    damageAmount = Math.floor(damageAmount * 1.5); // 50% bonus
                }
                
                // Apply any active buffs
                if (player.buffs.some(buff => buff.type === 'focus')) {
                    damageAmount = Math.floor(damageAmount * 1.2); // 20% bonus from focus
                }
                
                // Check for special effects
                if (gem.id === 'green-backstab' && 
                    enemy.buffs.some(buff => buff.type === 'poison')) {
                    damageAmount *= 2; // Double damage if enemy is poisoned
                }
                
                // Apply damage to enemy
                const newEnemyHealth = Math.max(0, enemy.health - damageAmount);
                const updatedEnemy = {
                    ...enemy,
                    health: newEnemyHealth
                };
                
                // Update state
                this.stateManager.updateState({
                    battle: {
                        enemy: updatedEnemy
                    }
                });
                
                // Emit damage event
                this.eventBus.emit('enemy:damaged', {
                    amount: damageAmount,
                    gem: gem
                });
                
                // Check for victory
                if (newEnemyHealth <= 0) {
                    this.endBattle(true);
                }
                
                // Special case for green-quick
                if (gem.id === 'green-quick') {
                    this.gemManager.drawGems(1);
                }
                break;
                
            case 'heal':
                let healAmount = gem.value;
                
                // Apply class bonus if applicable
                if (playerClass === 'mage' && gem.color === 'blue') {
                    healAmount = Math.floor(healAmount * 1.5); // 50% bonus
                }
                
                // Apply any active buffs
                if (player.buffs.some(buff => buff.type === 'focus')) {
                    healAmount = Math.floor(healAmount * 1.2); // 20% bonus from focus
                }
                // Apply healing (cap at max health)
                const updatedHealth = Math.min(player.maxHealth, player.health + healAmount);
                
                // Update state
                this.stateManager.updateState({
                    player: {
                        health: updatedHealth
                    }
                });
                
                // Emit healing event
                this.eventBus.emit('player:healed', {
                    amount: healAmount,
                    gem: gem
                });
                break;
                
            case 'shield':
                let defenseAmount = gem.value;
                
                // Apply class bonus if applicable
                if (playerClass === 'mage' && gem.color === 'blue') {
                    defenseAmount = Math.floor(defenseAmount * 1.5); // 50% bonus
                }
                
                // Add defense buff
                const defenseBuff = {
                    type: 'defense',
                    value: defenseAmount,
                    duration: gem.duration || 2
                };
                
                const newBuffs = [...player.buffs.filter(b => b.type !== 'defense'), defenseBuff];
                
                // Update state
                this.stateManager.updateState({
                    player: {
                        buffs: newBuffs
                    }
                });
                
                // Emit shield event
                this.eventBus.emit('player:shielded', {
                    defense: defenseAmount,
                    duration: gem.duration || 2,
                    gem: gem
                });
                break;
                
            case 'poison':
                let poisonAmount = gem.value;
                
                // Apply class bonus if applicable
                if (playerClass === 'rogue' && gem.color === 'green') {
                    poisonAmount = Math.floor(poisonAmount * 1.5); // 50% bonus
                }
                
                // Add poison debuff to enemy
                const poisonDamage = buff.value;
                const newHealth = Math.max(0, enemy.health - poisonDamage);
                
                enemyUpdates.health = newHealth;
                
                this.eventBus.emit('enemy:poisoned-damage', {
                    amount: poisonDamage
                });
                
                // Check for victory
                if (newHealth <= 0) {
                    this.endBattle(true);
                }
            }
        }
        // Update state
        this.stateManager.updateState({
            player: {
                ...playerUpdates,
                buffs: newBuffs
            },
            battle: {
                enemy: {
                    ...enemy,
                    ...enemyUpdates,
                    buffs: updatedEnemyBuffs
                }
            }
        });
    }
    
    // Determine enemy's next action
    determineEnemyAction(enemy) {
        const availableActions = enemy.actions || ['attack'];
        
        // Simple AI logic
        if (enemy.health < enemy.maxHealth * 0.3) {
            // Low health - prioritize defense or healing
            if (availableActions.includes('heal')) {
                return 'heal';
            } else if (availableActions.includes('defend') || availableActions.includes('harden')) {
                return availableActions.includes('defend') ? 'defend' : 'harden';
            }
        }
        
        // Randomly choose action with weights
        const weights = {
            'attack': 0.6,  // Basic attack is most common
            'defend': 0.4,
            'howl': 0.3,
            'enrage': 0.3,
            'steal': 0.2,
            'summon': 0.3,
            'poison': 0.3,
            'curse': 0.3,
            'heal': 0.2,
            'harden': 0.3,
            'breathe': 0.4,
            'tail': 0.4
        };
        
        // Filter actions by what's available
        const weightedActions = availableActions.map(action => ({
            action,
            weight: weights[action] || 0.1
        }));
        
        // Sort by weight (higher first)
        weightedActions.sort((a, b) => b.weight - a.weight);
        
        // Apply a bit of randomness
        if (Math.random() < 0.7) {
            // 70% chance to pick highest weighted action
            return weightedActions[0].action;
        } else {
            // 30% chance to pick randomly from all available
            const randomIndex = Math.floor(Math.random() * availableActions.length);
            return availableActions[randomIndex];
        }
    }
    
    // End the battle (victory or defeat)
    endBattle(isVictory) {
        const state = this.stateManager.getState();
        const { enemy } = state.battle;
        const { day, phase } = state.journey;
        
        // Update battle state
        this.stateManager.updateState({
            battle: {
                inProgress: false,
                currentTurn: null,
                enemy: null,
                selectedGems: []
            }
        });
        
        if (isVictory) {
            // Award zenny based on enemy
            const rewardZenny = enemy.zenny || 0;
            
            this.stateManager.updateState({
                player: {
                    zenny: state.player.zenny + rewardZenny
                }
            });
            
            // Reset gems for next battle
            this.gemManager.resetBattleGems();
            
            // Emit victory event
            this.eventBus.emit('battle:victory', {
                enemy,
                reward: rewardZenny,
                day,
                phase
            });
            
            // Progress to next phase or shop
            this.progressJourney();
        } else {
            // Game over on defeat
            this.eventBus.emit('battle:defeat', {
                enemy,
                day,
                phase
            });
            
            // Wait briefly then show game over
            setTimeout(() => {
                this.eventBus.emit('game:over');
            }, 2000);
        }
    }
    
    // Progress to next phase or shop
    progressJourney() {
        const state = this.stateManager.getState();
        const { day, phase } = state.journey;
        
        // After victory, go to shop
        setTimeout(() => {
            this.stateManager.changeScreen('shop-screen');
        }, 1500);
    }
    
    // Continue journey after shop
    continueJourney() {
        const state = this.stateManager.getState();
        let { day, phase } = state.journey;
        
        // Determine next phase
        let nextPhase = phase;
        let nextDay = day;
        
        if (phase === 'DAWN') {
            nextPhase = 'DUSK';
        } else if (phase === 'DUSK') {
            nextPhase = 'DARK';
        } else if (phase === 'DARK') {
            // End of day, go to camp
            nextPhase = 'DAWN';
            nextDay = day + 1;
            
            // Update state
            this.stateManager.updateState({
                journey: {
                    day: nextDay,
                    phase: nextPhase
                }
            });
            
            // Go to camp screen
            this.stateManager.changeScreen('camp-screen');
            return;
        }
        
        // Update state for next phase
        this.stateManager.updateState({
            journey: {
                phase: nextPhase
            }
        });
        
        // Start next battle
        this.stateManager.changeScreen('battle-screen');
        this.startBattle();
    }
    
    // Flee from battle (only available in Dawn/Dusk phases)
    fleeBattle() {
        const state = this.stateManager.getState();
        const { phase } = state.journey;
        
        // Can't flee from DARK phase (boss battles)
        if (phase === 'DARK') {
            this.eventBus.emit('message:show', {
                text: 'Cannot flee from boss battles!',
                type: 'error'
            });
            return false;
        }
        
        // End battle without rewards
        this.stateManager.updateState({
            battle: {
                inProgress: false,
                currentTurn: null,
                enemy: null,
                selectedGems: []
            }
        });
        
        // Reset gems
        this.gemManager.resetBattleGems();
        
        // Emit flee event
        this.eventBus.emit('battle:fled', {
            phase
        });
        
        // Progress to next phase
        this.progressJourney();
        
        return true;
    }
}