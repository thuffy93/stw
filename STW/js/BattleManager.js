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
        
        // New event listener to track stamina used
        this.eventBus.on('stamina:used', (amount) => {
            this.trackStaminaUsed(amount);
        });
    }
    
    // New method to track stamina used during player's turn
    trackStaminaUsed(amount) {
        const state = this.stateManager.getState();
        const currentStaminaUsed = state.battle.staminaUsed || 0;
        
        this.stateManager.updateState({
            battle: {
                staminaUsed: currentStaminaUsed + amount
            }
        });
        
        console.log(`Tracked ${amount} stamina used. Total this turn: ${currentStaminaUsed + amount}`);
    }
    
    // Start a new battle
    // Start a new battle
    startBattle() {
        const state = this.stateManager.getState();
        const { day, phase } = state.journey;
        
        // If this is first battle of first day, ensure player has no debuffs
        if (day === 1 && phase === 'DAWN') {
            if (state.player.buffs && state.player.buffs.length > 0) {
                console.log("First battle: Clearing any existing player buffs/debuffs");
                this.stateManager.updateState({
                    player: {
                        ...state.player,
                        buffs: []
                    }
                });
            }
        }
        
        // Get enemy for current day and phase
        const enemy = this.getRandomEnemy(day, phase);
        if (!enemy) {
            console.error(`No enemy found for day ${day}, phase ${phase}`);
            return;
        }
        
        // Initialize battle state with staminaUsed tracker
        this.stateManager.updateState({
            battle: {
                inProgress: true,
                currentTurn: 'PLAYER',
                enemy: enemy,
                selectedGems: [],
                staminaUsed: 0 // Initialize stamina tracking
            }
        });
        
        // Reset player stamina at start of battle
        this.stateManager.updateState({
            player: {
                stamina: state.player.maxStamina
            }
        });
        
        // MODIFIED: Do not automatically refill or recycle the bag
        // Only draw gems to fill hand if there are gems available
        const currentHandSize = state.gems.hand.length;
        const currentBagSize = state.gems.bag.length;
        
        if (currentHandSize < 3 && currentBagSize > 0) {
            const gemsToDraw = Math.min(3 - currentHandSize, currentBagSize);
            console.log(`Hand has ${currentHandSize} gems, drawing ${gemsToDraw} from bag of ${currentBagSize}`);
            this.gemManager.drawGems(gemsToDraw);
        } else {
            console.log(`Starting battle - Hand: ${currentHandSize}, Bag: ${currentBagSize}`);
        }
        
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
    
        // FIXED: Add safety check for null enemy
        if (!enemy) {
            console.error('No enemy found when processing gem effect');
            return;
        }
    
        // Prepare updates
        const playerUpdates = {};
        const enemyUpdates = {};
        
        // FIXED: Added safety checks for null buffs
        const newBuffs = player.buffs ? [...player.buffs] : [];
        const updatedEnemyBuffs = enemy.buffs ? [...enemy.buffs] : [];
    
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
                
                // Apply any active buffs - FIXED: Added safety check
                if (player.buffs && player.buffs.some(buff => buff.type === 'focus')) {
                    damageAmount = Math.floor(damageAmount * 1.2); // 20% bonus from focus
                }
                
                // Apply damage to enemy
                const newEnemyHealth = Math.max(0, enemy.health - damageAmount);
                enemyUpdates.health = newEnemyHealth;
                
                // Emit damage event
                this.eventBus.emit('enemy:damaged', {
                    amount: damageAmount,
                    gem: gem
                });
                
                // Check for victory
                if (newEnemyHealth <= 0) {
                    this.endBattle(true);
                    return;
                }
                
                // Special case for Quick Attack (now using specialEffect property)
                if (gem.specialEffect === 'draw') {
                    console.log("Quick Attack special effect: Drawing an extra gem");
                    this.gemManager.drawGems(1);
                }
                break;
                
            case 'heal':
                let healAmount = gem.value;
                
                // Apply class bonus if applicable
                if (playerClass === 'mage' && gem.color === 'blue') {
                    healAmount = Math.floor(healAmount * 1.5); // 50% bonus
                }
                
                // Apply any active buffs - FIXED: Added safety check
                if (player.buffs && player.buffs.some(buff => buff.type === 'focus')) {
                    healAmount = Math.floor(healAmount * 1.2); // 20% bonus from focus
                }
                
                // Apply healing (cap at max health)
                const updatedHealth = Math.min(player.maxHealth, player.health + healAmount);
                playerUpdates.health = updatedHealth;
                
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
                
                // Remove existing defense buff - FIXED: Added safety check
                const updatedBuffs = player.buffs ? player.buffs.filter(b => b.type !== 'defense') : [];
                
                // Add defense buff
                const defenseBuff = {
                    type: 'defense',
                    value: defenseAmount,
                    duration: gem.duration || 2
                };
                
                newBuffs.push(defenseBuff);
                
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
                const poisonBuff = {
                    type: 'poison',
                    value: poisonAmount,
                    duration: gem.duration || 3
                };
                
                updatedEnemyBuffs.push(poisonBuff);
                
                // Emit poison event
                this.eventBus.emit('enemy:poisoned', {
                    amount: poisonAmount,
                    duration: gem.duration || 3
                });
                break;
        }
        
        // Update state
        this.stateManager.updateState({
            player: {
                ...player,
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

    // Process gem failure - add this method if it doesn't exist
    processGemFailure(gem) {
        const state = this.stateManager.getState();
        const { player } = state;

        // Default failure effects based on gem type
        switch(gem.type) {
            case 'attack':
                // Deal half damage to self
                const selfDamage = Math.floor(gem.value / 2);
                const newHealth = Math.max(0, player.health - selfDamage);
                
                // Potentially become stunned
                const stunBuff = {
                    type: 'stunned',
                    duration: 1
                };
                
                this.stateManager.updateState({
                    player: {
                        health: newHealth,
                        buffs: [...player.buffs, stunBuff]
                    }
                });
                
                this.eventBus.emit('player:damaged', {
                    amount: selfDamage,
                    source: 'gem-failure'
                });
                break;
                
            case 'heal':
                // Lose HP instead of healing
                const healFailureDamage = 5;
                const failureHealth = Math.max(0, player.health - healFailureDamage);
                
                this.stateManager.updateState({
                    player: {
                        health: failureHealth
                    }
                });
                
                this.eventBus.emit('player:damaged', {
                    amount: healFailureDamage,
                    source: 'heal-failure'
                });
                break;
                
            case 'poison':
                // Deal half damage to self
                const poisonSelfDamage = Math.floor(gem.value / 2);
                const poisonHealth = Math.max(0, player.health - poisonSelfDamage);
                
                this.stateManager.updateState({
                    player: {
                        health: poisonHealth
                    }
                });
                
                this.eventBus.emit('player:damaged', {
                    amount: poisonSelfDamage,
                    source: 'poison-failure'
                });
                break;
                
            // For shield and other types, do nothing or minimal penalty
            default:
                break;
        }

        // Check for player defeat
        const updatedState = this.stateManager.getState();
        if (updatedState.player.health <= 0) {
            this.endBattle(false);
        }
    }
    
    // Process end of turn effects
    // Process end of turn effects
    processEndOfTurn() {
        const state = this.stateManager.getState();
        const { battle, player } = state;
        
        if (!battle.inProgress) {
            return;
        }
        
        if (battle.currentTurn === 'PLAYER') {
            // Switch to enemy turn
            this.stateManager.updateState({
                battle: {
                    currentTurn: 'ENEMY'
                }
            });
            
            // Enemy makes its move after a short delay
            setTimeout(() => {
                this.processEnemyTurn();
            }, 1000);
        } else {
            // Process buffs and debuffs at end of round
            this.processStatusEffects();
            
            // MODIFIED: Changed stamina recovery system
            // Instead of refilling to max, recover based on how much was used
            const staminaUsed = battle.staminaUsed || 0;
            
            // For waiting, discarding, or just ending turn (staminaUsed = 0),
            // provide maximum recovery of 3 stamina
            let staminaRecovery;
            if (staminaUsed === 0) {
                // If player waited, discarded, or just ended turn, recover 3 stamina
                staminaRecovery = 3;
            } else {
                // Otherwise, calculate recovery (75% of used stamina, rounded to nearest integer)
                staminaRecovery = Math.round(staminaUsed * 0.75);
                
                // Cap recovery at 3 stamina
                staminaRecovery = Math.min(staminaRecovery, 3);
            }
            
            // Calculate new stamina value (don't exceed max)
            const newStamina = Math.min(player.maxStamina, player.stamina + staminaRecovery);
            
            console.log(`Stamina recovery: ${staminaUsed} used, recovering ${staminaRecovery}. New stamina: ${newStamina}/${player.maxStamina}`);
            
            // Update player stamina
            this.stateManager.updateState({
                player: {
                    stamina: newStamina
                },
                battle: {
                    staminaUsed: 0 // Reset stamina used counter for next turn
                }
            });
            
            // Draw gems to fill hand
            const handSize = state.gems.hand.length;
            if (handSize < 3) {
                this.gemManager.drawGems(3 - handSize);
            }
            
            // Get updated player state after status effects processing
            const updatedState = this.stateManager.getState();
            const isPlayerStunned = updatedState.player.buffs.some(buff => buff.type === 'stunned');
            
            // Now switch to player turn (after drawing)
            this.stateManager.updateState({
                battle: {
                    currentTurn: 'PLAYER'
                }
            });
            
            // If player is stunned, immediately end their turn
            if (isPlayerStunned) {
                console.log("Player is stunned - automatically skipping their turn");
                this.eventBus.emit('message:show', {
                    text: 'Stunned! Turn skipped.',
                    type: 'error'
                });
                
                // Use setTimeout to give a visual indication that the turn is being skipped
                setTimeout(() => {
                    this.processEndOfTurn();
                }, 1500);
            }
        }
    }    
    
    // Process status effects at end of round
    processStatusEffects() {
        const state = this.stateManager.getState();
        const { battle, player } = state;
        const { enemy } = battle;
        
        // Process player buffs
        let updatedPlayerBuffs = [];
        let playerUpdates = {};
        
        player.buffs.forEach(buff => {
            // Reduce duration
            const newDuration = buff.duration - 1;
            
            if (newDuration <= 0) {
                // Buff expired
                this.eventBus.emit('player:buff-expired', {
                    type: buff.type
                });
            } else {
                // Keep buff with reduced duration
                updatedPlayerBuffs.push({
                    ...buff,
                    duration: newDuration
                });
            }
            
            // Process active poison damage
            if (buff.type === 'poison') {
                const poisonDamage = buff.value;
                const newHealth = Math.max(0, player.health - poisonDamage);
                
                playerUpdates.health = newHealth;
                
                this.eventBus.emit('player:poisoned-damage', {
                    amount: poisonDamage
                });
                
                // Check for defeat
                if (newHealth <= 0) {
                    this.endBattle(false);
                }
            }
        });
        
        // Process enemy buffs
        let updatedEnemyBuffs = [];
        let enemyUpdates = {};
        
        enemy.buffs.forEach(buff => {
            // Reduce duration
            const newDuration = buff.duration - 1;
            
            if (newDuration <= 0) {
                // Buff expired
                this.eventBus.emit('enemy:buff-expired', {
                    type: buff.type
                });
            } else {
                // Keep buff with reduced duration
                updatedEnemyBuffs.push({
                    ...buff,
                    duration: newDuration
                });
            }
            
            // Process active poison damage
            if (buff.type === 'poison') {
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
        });
        
        // Update state
        this.stateManager.updateState({
            player: {
                ...playerUpdates,
                buffs: updatedPlayerBuffs
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
    
    // Execute enemy's turn
    // Execute enemy's turn
    processEnemyTurn() {
        const state = this.stateManager.getState();
        const { battle, player } = state;
        const { enemy } = battle;
        
        if (!battle.inProgress) {
            return;
        }
        
        // Check if enemy is stunned
        if (enemy.buffs.some(buff => buff.type === 'stunned')) {
            // Skip turn
            this.eventBus.emit('enemy:stunned', { enemy });
            this.processEndOfTurn(); // End enemy turn
            return;
        }
        
        // Determine and execute enemy action
        const action = enemy.nextAction || 'attack';
        
        switch(action) {
            case 'attack':
                this.executeEnemyAttack(enemy, player);
                break;
                
            case 'defend':
                this.executeEnemyDefend(enemy);
                break;
                
            case 'howl':
                this.executeEnemyHowl(enemy);
                break;
                
            case 'enrage':
                this.executeEnemyEnrage(enemy);
                break;
                
            case 'steal':
                this.executeEnemySteal(enemy, player);
                break;
                
            case 'summon':
                this.executeEnemySummon(enemy);
                break;
                
            case 'poison':
                this.executeEnemyPoison(enemy, player);
                break;
                
            case 'curse':
                this.executeEnemyCurse(enemy, player);
                break;
                
            case 'heal':
                this.executeEnemyHeal(enemy);
                break;
                
            case 'harden':
                this.executeEnemyHarden(enemy);
                break;
                
            case 'breathe':
                this.executeEnemyBreathe(enemy, player);
                break;
                
            case 'tail':
                this.executeEnemyTail(enemy, player);
                break;
                
            default:
                console.warn(`Unknown enemy action: ${action}`);
                this.executeEnemyAttack(enemy, player); // Default to attack
        }
        
        // Determine next action
        const updatedEnemy = this.stateManager.getState().battle.enemy;
        const nextAction = this.determineEnemyAction(updatedEnemy);
        
        // Update enemy's next action
        this.stateManager.updateState({
            battle: {
                enemy: {
                    ...updatedEnemy,
                    nextAction
                }
            }
        });
        
        // End enemy turn after a short delay
        setTimeout(() => {
            this.processEndOfTurn();
        }, 1000);
    }
    
    // Enemy attack action
    executeEnemyAttack(enemy, player) {
        // Calculate damage, accounting for player defense
        let damage = enemy.attack;
        let actualDamage = damage;
        
        // Check for defense buff
        const defenseBuff = player.buffs.find(buff => buff.type === 'defense');
        if (defenseBuff) {
            actualDamage = Math.max(1, damage - defenseBuff.value);
        }
        
        // Apply damage to player
        const newHealth = Math.max(0, player.health - actualDamage);
        
        // Update state
        this.stateManager.updateState({
            player: {
                health: newHealth
            }
        });
        
        // Emit event
        this.eventBus.emit('player:damaged', {
            amount: actualDamage,
            blocked: damage - actualDamage,
            source: 'enemy-attack',
            enemy
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }
    
    // Enemy defend action
    executeEnemyDefend(enemy) {
        // Add defense buff to enemy
        const defenseBuff = {
            type: 'defense',
            value: Math.floor(enemy.attack * 0.8),
            duration: 2
        };
        
        const newBuffs = [...enemy.buffs.filter(b => b.type !== 'defense'), defenseBuff];
        
        // Update state
        this.stateManager.updateState({
            battle: {
                enemy: {
                    ...enemy,
                    buffs: newBuffs
                }
            }
        });
        
        // Emit event
        this.eventBus.emit('enemy:defended', {
            defense: defenseBuff.value,
            duration: defenseBuff.duration,
            enemy
        });
    }
    
    // Enemy howl action (wolf)
    executeEnemyHowl(enemy) {
        // Add attack buff for next turn
        const attackBuff = {
            type: 'attack-boost',
            value: Math.floor(enemy.attack * 0.5),
            duration: 1
        };
        
        const newBuffs = [...enemy.buffs.filter(b => b.type !== 'attack-boost'), attackBuff];
        
        // Update state
        this.stateManager.updateState({
            battle: {
                enemy: {
                    ...enemy,
                    buffs: newBuffs
                }
            }
        });
        
        // Emit event
        this.eventBus.emit('enemy:howled', {
            boost: attackBuff.value,
            enemy
        });
    }
    
    // Enemy enrage action
    executeEnemyEnrage(enemy) {
        // Permanently increase attack
        const attackIncrease = Math.floor(enemy.attack * 0.3);
        const newAttack = enemy.attack + attackIncrease;
        
        // Update state
        this.stateManager.updateState({
            battle: {
                enemy: {
                    ...enemy,
                    attack: newAttack
                }
            }
        });
        
        // Emit event
        this.eventBus.emit('enemy:enraged', {
            increase: attackIncrease,
            newAttack,
            enemy
        });
    }
    
    // Enemy steal action (bandit)
    executeEnemySteal(enemy, player) {
        // Steal some zenny
        const stealAmount = Math.min(player.zenny, Math.floor(Math.random() * 3) + 1);
        
        if (stealAmount <= 0) {
            // Nothing to steal, do a normal attack instead
            this.executeEnemyAttack(enemy, player);
            return;
        }
        
        // Update state
        this.stateManager.updateState({
            player: {
                zenny: player.zenny - stealAmount
            }
        });
        
        // Emit event
        this.eventBus.emit('enemy:stole', {
            amount: stealAmount,
            enemy
        });
    }
    
    // Enemy summon action (goblin)
    executeEnemySummon(enemy) {
        // Add minion buff which adds extra damage
        const minionBuff = {
            type: 'minion',
            value: Math.floor(enemy.attack * 0.3),
            duration: 3
        };
        
        const newBuffs = [...enemy.buffs.filter(b => b.type !== 'minion'), minionBuff];
        
        // Update state
        this.stateManager.updateState({
            battle: {
                enemy: {
                    ...enemy,
                    buffs: newBuffs
                }
            }
        });
        
        // Emit event
        this.eventBus.emit('enemy:summoned', {
            damage: minionBuff.value,
            duration: minionBuff.duration,
            enemy
        });
    }
    
    // Enemy poison action
    executeEnemyPoison(enemy, player) {
        // Apply poison to player
        const poisonDebuff = {
            type: 'poison',
            value: Math.floor(enemy.attack * 0.3),
            duration: 3
        };
        
        const newBuffs = [...player.buffs.filter(b => b.type !== 'poison'), poisonDebuff];
        
        // Update state
        this.stateManager.updateState({
            player: {
                buffs: newBuffs
            }
        });
        
        // Emit event
        this.eventBus.emit('player:poisoned', {
            poison: poisonDebuff.value,
            duration: poisonDebuff.duration,
            enemy
        });
    }
    
    // Enemy curse action (witch)
    executeEnemyCurse(enemy, player) {
        // Reduce player damage
        const curseBuff = {
            type: 'curse',
            value: 0.3, // 30% damage reduction
            duration: 2
        };
        
        const newBuffs = [...player.buffs.filter(b => b.type !== 'curse'), curseBuff];
        
        // Update state
        this.stateManager.updateState({
            player: {
                buffs: newBuffs
            }
        });
        
        // Emit event
        this.eventBus.emit('player:cursed', {
            reduction: curseBuff.value * 100,
            duration: curseBuff.duration,
            enemy
        });
    }
    
    // Enemy heal action (witch)
    executeEnemyHeal(enemy) {
        // Heal the enemy
        const healAmount = Math.floor(enemy.maxHealth * 0.2);
        const newHealth = Math.min(enemy.maxHealth, enemy.health + healAmount);
        
        // Update state
        this.stateManager.updateState({
            battle: {
                enemy: {
                    ...enemy,
                    health: newHealth
                }
            }
        });
        
        // Emit event
        this.eventBus.emit('enemy:healed', {
            amount: healAmount,
            enemy
        });
    }
    
    // Enemy harden action (golem)
    executeEnemyHarden(enemy) {
        // Increase defense significantly
        const defenseBuff = {
            type: 'defense',
            value: enemy.attack * 2,
            duration: 2
        };
        
        const newBuffs = [...enemy.buffs.filter(b => b.type !== 'defense'), defenseBuff];
        
        // Update state
        this.stateManager.updateState({
            battle: {
                enemy: {
                    ...enemy,
                    buffs: newBuffs
                }
            }
        });
        
        // Emit event
        this.eventBus.emit('enemy:hardened', {
            defense: defenseBuff.value,
            duration: defenseBuff.duration,
            enemy
        });
    }
    
    // Enemy breathe action (dragon)
    executeEnemyBreathe(enemy, player) {
        // Deal high damage
        const breathDamage = Math.floor(enemy.attack * 1.5);
        let actualDamage = breathDamage;
        
        // Check for defense buff
        const defenseBuff = player.buffs.find(buff => buff.type === 'defense');
        if (defenseBuff) {
            actualDamage = Math.max(1, breathDamage - defenseBuff.value);
        }
        
        // Apply damage to player
        const newHealth = Math.max(0, player.health - actualDamage);
        
        // Update state
        this.stateManager.updateState({
            player: {
                health: newHealth
            }
        });
        
        // Emit event
        this.eventBus.emit('player:damaged', {
            amount: actualDamage,
            blocked: breathDamage - actualDamage,
            source: 'enemy-breathe',
            enemy
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }
    
    // Enemy tail action (dragon)
    executeEnemyTail(enemy, player) {
        // Deal damage and apply stun
        const tailDamage = Math.floor(enemy.attack * 0.7);
        let actualDamage = tailDamage;
        
        // Check for defense buff
        const defenseBuff = player.buffs.find(buff => buff.type === 'defense');
        if (defenseBuff) {
            actualDamage = Math.max(1, tailDamage - defenseBuff.value);
        }
        
        // Apply damage to player
        const newHealth = Math.max(0, player.health - actualDamage);
        
        // Add stunned effect
        const stunnedBuff = {
            type: 'stunned',
            duration: 1
        };
        
        const newBuffs = [...player.buffs.filter(b => b.type !== 'stunned'), stunnedBuff];
        
        // Update state
        this.stateManager.updateState({
            player: {
                health: newHealth,
                buffs: newBuffs
            }
        });
        
        // Emit events
        this.eventBus.emit('player:damaged', {
            amount: actualDamage,
            blocked: tailDamage - actualDamage,
            source: 'enemy-tail',
            enemy
        });
        
        this.eventBus.emit('player:stunned', {
            duration: stunnedBuff.duration,
            enemy
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }
    
    // Process status effects at end of round
    processStatusEffects() {
        const state = this.stateManager.getState();
        const { battle, player } = state;
        const { enemy } = battle;
        
        // Process player buffs
        let updatedPlayerBuffs = [];
        let playerUpdates = {};
        
        player.buffs.forEach(buff => {
            // Reduce duration
            const newDuration = buff.duration - 1;
            
            if (newDuration <= 0) {
                // Buff expired
                this.eventBus.emit('player:buff-expired', {
                    type: buff.type
                });
            } else {
                // Keep buff with reduced duration
                updatedPlayerBuffs.push({
                    ...buff,
                    duration: newDuration
                });
            }
            
            // Process active poison damage
            if (buff.type === 'poison') {
                const poisonDamage = buff.value;
                const newHealth = Math.max(0, player.health - poisonDamage);
                
                playerUpdates.health = newHealth;
                
                this.eventBus.emit('player:poisoned-damage', {
                    amount: poisonDamage
                });
                
                // Check for defeat
                if (newHealth <= 0) {
                    this.endBattle(false);
                }
            }
        });
        
        // Process enemy buffs
        let updatedEnemyBuffs = [];
        let enemyUpdates = {};
        
        enemy.buffs.forEach(buff => {
            // Reduce duration
            const newDuration = buff.duration - 1;
            
            if (newDuration <= 0) {
                // Buff expired
                this.eventBus.emit('enemy:buff-expired', {
                    type: buff.type
                });
            } else {
                // Keep buff with reduced duration
                updatedEnemyBuffs.push({
                    ...buff,
                    duration: newDuration
                });
            }
            
            // Process active poison damage
            if (buff.type === 'poison') {
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
        });
        
        // Update state
        this.stateManager.updateState({
            player: {
                ...playerUpdates,
                buffs: updatedPlayerBuffs
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
            
            // Note: We DO NOT reset gems to allow persistence between battles
            // We keep the used gems in the "played" collection
            
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
            
            setTimeout(() => {
                this.eventBus.emit('game:over');
                
                // Return to character select screen
                this.stateManager.changeScreen('character-select-screen');
                
                // Show a message to the player
                this.eventBus.emit('message:show', {
                    text: 'Game over! Select a class to start a new run.',
                    type: 'error'
                });
            }, 2000);
        }
    }
    
    progressJourney() {
        const state = this.stateManager.getState();
        const { day, phase } = state.journey;
        
        console.log(`Progressing game state after battle: Day ${day}, Phase ${phase}`);
        
        // Check if the just completed battle was a Dark phase (boss) battle
        if (phase === 'DARK') {
            console.log("Completed boss battle, going directly to camp");
            
            // End of day, go directly to camp
            const nextDay = day + 1;
            const nextPhase = 'DAWN';
            
            // Update state
            this.stateManager.updateState({
                journey: {
                    day: nextDay,
                    phase: nextPhase
                }
            });
            
            // Emit day end event to trigger gem bag reset
            this.eventBus.emit('day:ended', {
                oldDay: day,
                newDay: nextDay
            });
            
            // Go directly to camp screen with a delay
            setTimeout(() => {
                this.stateManager.changeScreen('camp-screen');
            }, 1500);
            
            return;
        }
        
        // For Dawn and Dusk phases, go to shop as normal
        console.log("Going to shop after non-boss battle");
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
            // Should not happen - Dark phase should go directly to camp
            // But handle it gracefully as a fallback
            console.warn("Unexpected: continueJourney called after Dark phase");
            nextPhase = 'DAWN';
            nextDay = day + 1;
            
            // Update state
            this.stateManager.updateState({
                journey: {
                    day: nextDay,
                    phase: nextPhase
                }
            });
            
            // Emit day end event
            this.eventBus.emit('day:ended', {
                oldDay: day,
                newDay: nextDay
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
        
        // IMPORTANT: No recycling between battle phases
        // Gems should remain exactly as they are
        
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
        
        // Reset gems specifically for fleeing - don't recycle played gems
        this.gemManager.resetGemsAfterFleeing();
        
        // Emit flee event
        this.eventBus.emit('battle:fled', {
            phase
        });
        
        // Progress to next phase
        this.progressJourney();
        
        return true;
    }
    progressGameState() {
        const state = this.stateManager.getState();
        const { day, phase } = state.journey;
        
        console.log(`Progressing game state after battle: Day ${day}, Phase ${phase}`);
        
        // Check if the just completed battle was a Dark phase (boss) battle
        if (phase === 'DARK') {
            console.log("Completed boss battle, going directly to camp");
            
            // End of day, go directly to camp
            const nextDay = day + 1;
            const nextPhase = 'DAWN';
            
            // Update state
            this.stateManager.updateState({
                journey: {
                    day: nextDay,
                    phase: nextPhase
                }
            });
            
            // Emit day end event to trigger gem bag reset
            this.eventBus.emit('day:ended', {
                oldDay: day,
                newDay: nextDay
            });
            
            // Go directly to camp screen with a delay
            setTimeout(() => {
                this.stateManager.changeScreen('camp-screen');
            }, 1500);
            
            return;
        }
        
        // For Dawn and Dusk phases, go to shop as normal
        console.log("Going to shop after non-boss battle");
        setTimeout(() => {
            this.stateManager.changeScreen('shop-screen');
        }, 1500);
    }
}