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

        // Prepare updates
        const playerUpdates = {};
        const enemyUpdates = {};
        const newBuffs = [...player.buffs];
        const updatedEnemyBuffs = [...enemy.buffs];

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
                
                // Remove existing defense buff
                const updatedBuffs = player.buffs.filter(b => b.type !== 'defense');
                
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
            // Switch to player turn
            this.stateManager.updateState({
                battle: {
                    currentTurn: 'PLAYER'
                }
            });
            
            // Process buffs and debuffs at end of round
            this.processStatusEffects();
            
            // Refill player stamina
            this.stateManager.updateState({
                player: {
                    stamina: player.maxStamina
                }
            });
            
            // Draw gems to fill hand
            const handSize = state.gems.hand.length;
            if (handSize < 3) {
                this.gemManager.drawGems(3 - handSize);
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