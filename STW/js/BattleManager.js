// BattleManager.js - Handles battle mechanics and enemy AI
export default class BattleManager {
    constructor(eventBus, stateManager, gemManager) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.gemManager = gemManager;
        
        // Enemy definitions by day and phase
        this.enemyPool = this.initializeEnemyPool();
        
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
        
        // Listen for stamina usage events
        this.eventBus.on('stamina:used', (amount) => {
            this.trackStaminaUsed(amount);
        });
    }
    
    // Initialize enemy pool with all enemies organized by day and phase
    initializeEnemyPool() {
        return {
            // Day 1
            1: {
                DAWN: [
                    {
                        id: 'grunt1',
                        name: 'Small Grunt',
                        health: 25,
                        maxHealth: 25,
                        attack: 8,
                        image: '👹',
                        zenny: 4,
                        actions: ['attack'],
                        difficulty: 1
                    },
                    {
                        id: 'rat1',
                        name: 'Giant Rat',
                        health: 20,
                        maxHealth: 20,
                        attack: 7,
                        image: '🐀',
                        zenny: 3,
                        actions: ['attack', 'gnaw'],
                        difficulty: 1
                    }
                ],
                DUSK: [
                    {
                        id: 'bandit1',
                        name: 'Bandit',
                        health: 30,
                        maxHealth: 30,
                        attack: 10,
                        image: '💀',
                        zenny: 6,
                        actions: ['attack', 'defend', 'steal'],
                        difficulty: 2
                    },
                    {
                        id: 'spider1',
                        name: 'Cave Spider',
                        health: 28,
                        maxHealth: 28,
                        attack: 9,
                        image: '🕷️',
                        zenny: 5,
                        actions: ['attack', 'web'],
                        difficulty: 2
                    }
                ],
                DARK: [
                    {
                        id: 'wolf1',
                        name: 'Shadow Wolf',
                        health: 40,
                        maxHealth: 40,
                        attack: 12,
                        image: '🐺',
                        zenny: 12,
                        actions: ['attack', 'howl', 'bite'],
                        difficulty: 3
                    }
                ]
            },
            // Day 2
            2: {
                DAWN: [
                    {
                        id: 'grunt2',
                        name: 'Angry Grunt',
                        health: 35,
                        maxHealth: 35,
                        attack: 11,
                        image: '👹',
                        zenny: 6,
                        actions: ['attack', 'enrage'],
                        difficulty: 3
                    },
                    {
                        id: 'slime1',
                        name: 'Toxic Slime',
                        health: 32,
                        maxHealth: 32,
                        attack: 10,
                        image: '🟢',
                        zenny: 7,
                        actions: ['attack', 'split', 'toxic'],
                        difficulty: 3
                    }
                ],
                DUSK: [
                    {
                        id: 'bandit2',
                        name: 'Bandit Leader',
                        health: 40,
                        maxHealth: 40,
                        attack: 13,
                        image: '💀',
                        zenny: 9,
                        actions: ['attack', 'defend', 'steal', 'rally'],
                        difficulty: 4
                    },
                    {
                        id: 'phantom1',
                        name: 'Cave Phantom',
                        health: 38,
                        maxHealth: 38,
                        attack: 14,
                        image: '👻',
                        zenny: 10,
                        actions: ['attack', 'phase', 'haunt'],
                        difficulty: 4
                    }
                ],
                DARK: [
                    {
                        id: 'goblin1',
                        name: 'Goblin King',
                        health: 55,
                        maxHealth: 55,
                        attack: 16,
                        image: '👿',
                        zenny: 18,
                        actions: ['attack', 'summon', 'poison', 'steal'],
                        specialLoot: true,
                        difficulty: 5
                    }
                ]
            },
            // Day 3
            3: {
                DAWN: [
                    {
                        id: 'witch1',
                        name: 'Forest Witch',
                        health: 48,
                        maxHealth: 48,
                        attack: 14,
                        image: '🧙‍♀️',
                        zenny: 10,
                        actions: ['attack', 'curse', 'heal', 'hex'],
                        difficulty: 5
                    },
                    {
                        id: 'troll1',
                        name: 'Moss Troll',
                        health: 60,
                        maxHealth: 60,
                        attack: 15,
                        image: '👹',
                        zenny: 12,
                        actions: ['attack', 'crush', 'regenerate'],
                        difficulty: 5
                    }
                ],
                DUSK: [
                    {
                        id: 'golem1',
                        name: 'Stone Golem',
                        health: 65,
                        maxHealth: 65,
                        attack: 16,
                        image: '🗿',
                        zenny: 14,
                        actions: ['attack', 'harden', 'earthquake'],
                        difficulty: 6
                    },
                    {
                        id: 'enchanter1',
                        name: 'Dark Enchanter',
                        health: 55,
                        maxHealth: 55,
                        attack: 18,
                        image: '🧙‍♂️',
                        zenny: 16,
                        actions: ['attack', 'drain', 'enchant', 'teleport'],
                        difficulty: 6
                    }
                ],
                DARK: [
                    {
                        id: 'dragon1',
                        name: 'Young Dragon',
                        health: 80,
                        maxHealth: 80,
                        attack: 20,
                        image: '🐉',
                        zenny: 25,
                        actions: ['attack', 'breathe', 'tail', 'wing'],
                        specialLoot: true,
                        difficulty: 7
                    }
                ]
            },
            // Day 4
            4: {
                DAWN: [
                    {
                        id: 'elemental1',
                        name: 'Fire Elemental',
                        health: 70,
                        maxHealth: 70,
                        attack: 18,
                        image: '🔥',
                        zenny: 18,
                        actions: ['attack', 'ignite', 'heatwave'],
                        difficulty: 7
                    },
                    {
                        id: 'knight1',
                        name: 'Fallen Knight',
                        health: 75,
                        maxHealth: 75,
                        attack: 20,
                        image: '🗡️',
                        zenny: 20,
                        actions: ['attack', 'parry', 'charge'],
                        difficulty: 7
                    }
                ],
                DUSK: [
                    {
                        id: 'lich1',
                        name: 'Undead Lich',
                        health: 85,
                        maxHealth: 85,
                        attack: 22,
                        image: '💀',
                        zenny: 22,
                        actions: ['attack', 'drain', 'revive', 'curse'],
                        difficulty: 8
                    },
                    {
                        id: 'demon1',
                        name: 'Lesser Demon',
                        health: 90,
                        maxHealth: 90,
                        attack: 24,
                        image: '😈',
                        zenny: 25,
                        actions: ['attack', 'fireball', 'tempt', 'consume'],
                        difficulty: 8
                    }
                ],
                DARK: [
                    {
                        id: 'darkness1',
                        name: 'Avatar of Darkness',
                        health: 105,
                        maxHealth: 105,
                        attack: 26,
                        image: '🌑',
                        zenny: 35,
                        actions: ['attack', 'eclipse', 'void', 'consume'],
                        specialLoot: true,
                        difficulty: 9
                    }
                ]
            },
            // Days 5-7 (shortened for brevity, but kept for scaling)
            5: {
                DAWN: [{ id: 'hunter1', name: 'Shadow Hunter', health: 95, maxHealth: 95, attack: 24, image: '🏹', zenny: 28, actions: ['attack', 'snipe', 'trap', 'track'], difficulty: 9 }],
                DUSK: [{ id: 'sorcerer1', name: 'Astral Sorcerer', health: 100, maxHealth: 100, attack: 26, image: '✨', zenny: 32, actions: ['attack', 'meteor', 'banish', 'warp'], difficulty: 10 }],
                DARK: [{ id: 'titan1', name: 'Ancient Titan', health: 125, maxHealth: 125, attack: 30, image: '🗿', zenny: 40, actions: ['attack', 'smash', 'earthquake', 'roar'], specialLoot: true, difficulty: 11 }]
            },
            6: {
                DAWN: [{ id: 'vampire1', name: 'Vampire Lord', health: 110, maxHealth: 110, attack: 28, image: '🧛', zenny: 35, actions: ['attack', 'drain', 'charm', 'mist'], difficulty: 11 }],
                DUSK: [{ id: 'wraith1', name: 'Elder Wraith', health: 120, maxHealth: 120, attack: 30, image: '👻', zenny: 40, actions: ['attack', 'possess', 'haunt', 'drain'], difficulty: 12 }],
                DARK: [{ id: 'guardian1', name: 'Castle Guardian', health: 140, maxHealth: 140, attack: 32, image: '🛡️', zenny: 45, actions: ['attack', 'shield', 'bash', 'judgment'], specialLoot: true, difficulty: 13 }]
            },
            7: {
                DAWN: [{ id: 'general1', name: 'Dark General', health: 130, maxHealth: 130, attack: 34, image: '⚔️', zenny: 45, actions: ['attack', 'command', 'execute', 'rally'], difficulty: 13 }],
                DUSK: [{ id: 'mage1', name: 'Royal Dark Mage', health: 140, maxHealth: 140, attack: 38, image: '🔮', zenny: 50, actions: ['attack', 'ritual', 'arcane', 'bind'], difficulty: 14 }],
                DARK: [{ id: 'darkLord', name: 'The Dark Lord', health: 180, maxHealth: 180, attack: 42, image: '👑', zenny: 120, actions: ['attack', 'darkness', 'summon', 'drain', 'execute', 'ultimate'], phases: true, specialLoot: true, difficulty: 15 }]
            }
        };
    }
    
    // Track stamina used in a turn with debounce to prevent duplicates
    trackStaminaUsed(amount) {
        const state = this.stateManager.getState();
        const currentStaminaUsed = state.battle.staminaUsed || 0;
        
        // Simple debounce mechanism to prevent double-tracking
        const now = Date.now();
        const lastTrackedTime = this._lastStaminaTrackedTime || 0;
        const lastTrackedAmount = this._lastStaminaAmount || 0;
        
        // Skip duplicate tracking (same amount within 100ms)
        if (amount === lastTrackedAmount && (now - lastTrackedTime) < 100) {
            return;
        }
        
        // Store tracking information for debounce checking
        this._lastStaminaTrackedTime = now;
        this._lastStaminaAmount = amount;
        
        // Update the state
        this.stateManager.updateState({
            battle: {
                ...state.battle,
                staminaUsed: currentStaminaUsed + amount
            }
        });
    }
    
    // Start a new battle
    startBattle() {
        const state = this.stateManager.getState();
        const { day, phase } = state.journey;
        
        // If this is first battle of first day, ensure player has no debuffs
        if (day === 1 && phase === 'DAWN') {
            if (state.player.buffs && state.player.buffs.length > 0) {
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
        
        // Initialize battle state
        this.stateManager.updateState({
            battle: {
                inProgress: true,
                currentTurn: 'PLAYER',
                enemy: enemy,
                selectedGems: [],
                staminaUsed: 0,
                actionHistory: []
            }
        });
        
        // Reset player stamina at start of battle
        this.stateManager.updateState({
            player: {
                ...state.player,
                stamina: state.player.maxStamina
            }
        });
        
        // Draw gems to fill hand if needed
        const currentHandSize = state.gems.hand.length;
        const currentBagSize = state.gems.bag.length;
        
        if (currentHandSize < 3 && currentBagSize > 0) {
            const gemsToDraw = Math.min(3 - currentHandSize, currentBagSize);
            this.gemManager.drawGems(gemsToDraw);
        }
        
        // Emit battle started event
        this.eventBus.emit('battle:started', {
            enemy,
            day,
            phase
        });
    }
    
    // Get a random enemy for the current day and phase with difficulty scaling
    getRandomEnemy(day, phase) {
        // Handle days beyond what's defined
        let effectiveDay = Math.min(day, Object.keys(this.enemyPool).length);
        
        // Get the enemy pool for the day/phase
        const dayPool = this.enemyPool[effectiveDay] || this.enemyPool[1]; // Default to day 1
        const phasePool = dayPool[phase];
        
        if (!phasePool || phasePool.length === 0) {
            console.error(`No enemies found for day ${day}, phase ${phase}`);
            return null;
        }
        
        // Pick a random enemy from the pool
        const randomIndex = Math.floor(Math.random() * phasePool.length);
        const enemyTemplate = phasePool[randomIndex];
        
        // Scale enemy stats if day is beyond our defined pools
        let scaledTemplate = {...enemyTemplate};
        if (day > Object.keys(this.enemyPool).length) {
            const scaleFactor = 1 + ((day - Object.keys(this.enemyPool).length) * 0.15);
            scaledTemplate.health = Math.floor(enemyTemplate.health * scaleFactor);
            scaledTemplate.maxHealth = scaledTemplate.health;
            scaledTemplate.attack = Math.floor(enemyTemplate.attack * scaleFactor);
            scaledTemplate.zenny = Math.floor(enemyTemplate.zenny * scaleFactor);
        }
        
        // Initialize enemy instance with starting properties
        return {
            ...scaledTemplate,
            buffs: [],
            nextAction: this.determineEnemyAction(scaledTemplate),
            turnCount: 0,
            actionHistory: []
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
    
        // Safety check for null enemy
        if (!enemy) {
            console.error('No enemy found when processing gem effect');
            return;
        }
    
        // Prepare updates
        const playerUpdates = {};
        const enemyUpdates = {};
        
        // Safety checks for buffs
        const newPlayerBuffs = player.buffs ? [...player.buffs] : [];
        const updatedEnemyBuffs = enemy.buffs ? [...enemy.buffs] : [];
    
        // Get player class for bonus calculation
        const playerClass = player.class;
    
        switch(gem.type) {
            case 'attack':
                this.processAttackGem(gem, player, enemy, playerUpdates, enemyUpdates, newPlayerBuffs, updatedEnemyBuffs);
                break;
                
            case 'heal':
                this.processHealGem(gem, player, playerUpdates);
                break;
                
            case 'shield':
                this.processShieldGem(gem, player, newPlayerBuffs);
                break;
                
            case 'poison':
                this.processPoisonGem(gem, player, enemy, updatedEnemyBuffs);
                break;
        }
        
        // Update state
        this.stateManager.updateState({
            player: {
                ...player,
                ...playerUpdates,
                buffs: newPlayerBuffs
            },
            battle: {
                ...state.battle,
                enemy: {
                    ...enemy,
                    ...enemyUpdates,
                    buffs: updatedEnemyBuffs
                }
            }
        });
        
        // Handle post-effect processing (parrying, gem drawing, etc.)
        this.processPostGemEffects(gem, player, enemy);
    }
    
    // Process attack gem effects
    processAttackGem(gem, player, enemy, playerUpdates, enemyUpdates, newPlayerBuffs, updatedEnemyBuffs) {
        let damageAmount = gem.value;
        
        // Apply class bonus if applicable
        if ((player.class === 'knight' && gem.color === 'red') ||
            (player.class === 'mage' && gem.color === 'blue') ||
            (player.class === 'rogue' && gem.color === 'green')) {
            damageAmount = Math.floor(damageAmount * 1.5); // 50% bonus
        }
        
        // Apply focus bonus if active
        if (player.buffs && player.buffs.some(buff => buff.type === 'focus')) {
            damageAmount = Math.floor(damageAmount * 1.2); // 20% bonus from focus
        }
        
        // Check if enemy is phased (invulnerable)
        if (enemy.buffs && enemy.buffs.some(buff => buff.type === 'phased')) {
            this.eventBus.emit('message:show', {
                text: `${enemy.name} is phased out of reality! Your attack passes through harmlessly!`,
                type: 'error'
            });
            
            // No damage applied
            enemyUpdates.health = enemy.health;
            return;
        }
        
        // Check for enemy defense buff
        let actualDamage = damageAmount;
        let blockedDamage = 0;
        
        const enemyDefenseBuff = enemy.buffs && enemy.buffs.find(buff => buff.type === 'defense');
        if (enemyDefenseBuff) {
            // Check for piercing augmentation
            let defenseToBePierced = 0;
            if (gem.augmentation === 'piercing' && gem.defenseBypass) {
                defenseToBePierced = Math.floor(enemyDefenseBuff.value * gem.defenseBypass);
                
                this.eventBus.emit('message:show', {
                    text: `Piercing gem bypasses ${defenseToBePierced} of enemy defense!`,
                    type: 'success'
                });
            }
            
            // Reduce damage by defense value (minus pierced amount), minimum 1
            actualDamage = Math.max(1, damageAmount - (enemyDefenseBuff.value - defenseToBePierced));
            blockedDamage = damageAmount - actualDamage;
            
            if (blockedDamage > 0) {
                this.eventBus.emit('message:show', {
                    text: `${enemy.name}'s defense blocked ${blockedDamage} damage!`,
                    type: 'info'
                });
            }
        }
        
        // Apply damage to enemy
        const newEnemyHealth = Math.max(0, enemy.health - actualDamage);
        enemyUpdates.health = newEnemyHealth;
        
        // Emit damage event
        this.eventBus.emit('enemy:damaged', {
            amount: actualDamage,
            blocked: blockedDamage,
            gem: gem
        });
        
        // Check for victory
        if (newEnemyHealth <= 0) {
            // Update state before ending battle
            this.stateManager.updateState({
                player: {
                    ...player,
                    ...playerUpdates,
                    buffs: newPlayerBuffs
                },
                battle: {
                    ...this.stateManager.getState().battle,
                    enemy: {
                        ...enemy,
                        ...enemyUpdates,
                        buffs: updatedEnemyBuffs
                    }
                }
            });
            
            this.endBattle(true);
            return;
        }
        
        // Handle swift augmentation effect (draw an extra gem)
        if (gem.augmentation === 'swift' || gem.specialEffect === 'draw') {
            this.eventBus.emit('message:show', {
                text: `Swift gem allows you to draw an extra gem!`,
                type: 'success'
            });
        }
    }
    
    // Process healing gem effects
    processHealGem(gem, player, playerUpdates) {
        let healAmount = gem.value;
        
        // Apply class bonus if applicable
        if (player.class === 'mage' && gem.color === 'blue') {
            healAmount = Math.floor(healAmount * 1.5); // 50% bonus
        }
        
        // Apply focus bonus if active
        if (player.buffs && player.buffs.some(buff => buff.type === 'focus')) {
            healAmount = Math.floor(healAmount * 1.2); // 20% bonus from focus
        }
        
        // Apply powerful augmentation bonus
        if (gem.augmentation === 'powerful') {
            const powerfulBonus = Math.floor(healAmount * 0.3); // 30% extra healing
            healAmount += powerfulBonus;
            
            this.eventBus.emit('message:show', {
                text: `Powerful healing provides ${powerfulBonus} extra health!`,
                type: 'success'
            });
        }
        
        // Apply healing (cap at max health)
        const updatedHealth = Math.min(player.maxHealth, player.health + healAmount);
        playerUpdates.health = updatedHealth;
        
        // Emit healing event
        this.eventBus.emit('player:healed', {
            amount: healAmount,
            gem: gem
        });
    }
    
    // Process shield gem effects
    processShieldGem(gem, player, newPlayerBuffs) {
        let defenseAmount = gem.value;
        
        // Apply class bonus if applicable
        if (player.class === 'mage' && gem.color === 'blue') {
            defenseAmount = Math.floor(defenseAmount * 1.5); // 50% bonus
        }
        
        // Apply powerful augmentation
        if (gem.augmentation === 'powerful') {
            const powerfulBonus = Math.floor(defenseAmount * 0.3); // 30% extra defense
            defenseAmount += powerfulBonus;
            
            this.eventBus.emit('message:show', {
                text: `Powerful shield provides ${powerfulBonus} extra defense!`,
                type: 'success'
            });
        }
        
        // Remove existing defense buff
        const updatedBuffs = player.buffs ? player.buffs.filter(b => b.type !== 'defense') : [];
        
        // Handle lasting augmentation by extending duration
        let defenseDuration = gem.duration || 2;
        if (gem.augmentation === 'lasting') {
            defenseDuration += 2; // Add 2 more turns of duration
            
            this.eventBus.emit('message:show', {
                text: `Lasting shield will remain for ${defenseDuration} turns!`,
                type: 'success'
            });
        }
        
        // Add defense buff
        const defenseBuff = {
            type: 'defense',
            value: defenseAmount,
            duration: defenseDuration
        };
        
        newPlayerBuffs.push(defenseBuff);
        
        // Emit shield event
        this.eventBus.emit('player:shielded', {
            defense: defenseAmount,
            duration: defenseDuration,
            gem: gem
        });
    }
    
    // Process poison gem effects
    processPoisonGem(gem, player, enemy, updatedEnemyBuffs) {
        let poisonAmount = gem.value;
        
        // Apply class bonus if applicable
        if (player.class === 'rogue' && gem.color === 'green') {
            poisonAmount = Math.floor(poisonAmount * 1.5); // 50% bonus
        }
        
        // Apply powerful augmentation
        if (gem.augmentation === 'powerful') {
            const powerfulBonus = Math.floor(poisonAmount * 0.3); // 30% extra poison
            poisonAmount += powerfulBonus;
            
            this.eventBus.emit('message:show', {
                text: `Powerful poison causes ${powerfulBonus} extra damage per turn!`,
                type: 'success'
            });
        }
        
        // Handle lasting augmentation
        let poisonDuration = gem.duration || 3;
        if (gem.augmentation === 'lasting') {
            poisonDuration += 2; // Add 2 more turns of duration
            
            this.eventBus.emit('message:show', {
                text: `Lasting poison will remain for ${poisonDuration} turns!`,
                type: 'success'
            });
        }
        
        // Add poison debuff to enemy
        const poisonBuff = {
            type: 'poison',
            value: poisonAmount,
            duration: poisonDuration
        };
        
        updatedEnemyBuffs.push(poisonBuff);
        
        // Emit poison event
        this.eventBus.emit('enemy:poisoned', {
            amount: poisonAmount,
            duration: poisonDuration
        });
    }
    
    // Handle post-gem effects like parrying and drawing
    processPostGemEffects(gem, player, enemy) {
        // Check for parrying buff on enemy
        const parryingBuff = enemy.buffs && enemy.buffs.find(buff => buff.type === 'parrying');
        if (gem.type === 'attack' && parryingBuff) {
            // Calculate and apply reflected damage
            const state = this.stateManager.getState();
            const reflectDamage = Math.floor(parseInt(gem.value) * parryingBuff.value);
            const newPlayerHealth = Math.max(0, player.health - reflectDamage);
            
            // Update player health
            this.stateManager.updateState({
                player: {
                    ...player,
                    health: newPlayerHealth
                }
            });
            
            // Show parry message
            this.eventBus.emit('message:show', {
                text: `${enemy.name} parried your attack and reflected ${reflectDamage} damage back to you!`,
                type: 'error'
            });
            
            // Emit damage event for player
            this.eventBus.emit('player:damaged', {
                amount: reflectDamage,
                source: 'enemy-parry',
                enemy
            });
            
            // Check for player defeat from parry
            if (newPlayerHealth <= 0) {
                this.endBattle(false);
                return;
            }
        }
        
        // Handle gem draw effect (swift augmentation or special effect)
        if (gem.augmentation === 'swift' || gem.specialEffect === 'draw') {
            setTimeout(() => {
                this.gemManager.drawGems(1);
            }, 300);
        }
    }
    
    // Process gem failure effects
    processGemFailure(gem) {
        const state = this.stateManager.getState();
        const { player } = state;
    
        switch(gem.type) {
            case 'attack':
                // Deal half damage to self
                const selfDamage = Math.floor(gem.value / 2);
                const newHealth = Math.max(0, player.health - selfDamage);
                
                // Add stun debuff
                const stunBuff = {
                    type: 'stunned',
                    duration: 1
                };
                
                this.stateManager.updateState({
                    player: {
                        ...player,
                        health: newHealth,
                        buffs: [...player.buffs, stunBuff]
                    }
                });
                
                this.eventBus.emit('player:damaged', {
                    amount: selfDamage,
                    source: 'gem-failure'
                });
                
                // Display stun message
                this.eventBus.emit('message:show', {
                    text: 'Stunned! Turn skipped.',
                    type: 'error'
                });
                
                // Automatically end the turn after a short delay
                setTimeout(() => {
                    this.processEndOfTurn();
                }, 1000);
                
                break;
                
            case 'heal':
                // Lose HP instead of healing
                const healFailureDamage = 5;
                const failureHealth = Math.max(0, player.health - healFailureDamage);
                
                this.stateManager.updateState({
                    player: {
                        ...player,
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
                        ...player,
                        health: poisonHealth
                    }
                });
                
                this.eventBus.emit('player:damaged', {
                    amount: poisonSelfDamage,
                    source: 'poison-failure'
                });
                break;
        }
    
        // Check for player defeat
        const updatedState = this.stateManager.getState();
        if (updatedState.player.health <= 0) {
            this.endBattle(false);
        }
    }
    
    // Process end of turn for player or enemy
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
                    ...battle,
                    currentTurn: 'ENEMY'
                }
            });
            
            // Enemy makes its move after a short delay
            setTimeout(() => {
                this.processEnemyTurn();
            }, 1000);
        } else {
            // Process active status effects only, don't reduce durations yet
            this.processStatusEffects();
            
            const staminaUsed = battle.staminaUsed || 0;

            // Calculate stamina recovery
            let staminaRecovery;
            if (staminaUsed === 2) {
                // Explicit handling for 2 stamina used to ensure it recovers 2
                staminaRecovery = 2;
            } else {
                // Normal formula for other cases
                staminaRecovery = Math.max(1, 3 - Math.ceil(staminaUsed / 2));
            }

            // Apply web debuff effect if present
            if (player.buffs && player.buffs.some(buff => buff.type === 'webbed')) {
                staminaRecovery = Math.max(1, Math.floor(staminaRecovery / 2));
            }

            // Calculate new stamina value (don't exceed max)
            const newStamina = Math.min(player.maxStamina, player.stamina + staminaRecovery);

            // Update player stamina
            this.stateManager.updateState({
                player: {
                    ...player,
                    stamina: newStamina
                },
                battle: {
                    ...battle,
                    staminaUsed: 0 // Reset stamina used counter for next turn
                }
            });
            
            // Draw gems to fill hand
            const handSize = state.gems.hand.length;
            if (handSize < 3) {
                this.gemManager.drawGems(3 - handSize);
            }
            
            // Process buff durations at the end of a full round
            this.processTurnEnd();
            
            // Get updated player state after status effects processing
            const updatedState = this.stateManager.getState();
            const isPlayerStunned = updatedState.player.buffs.some(buff => buff.type === 'stunned');
            
            // Now switch to player turn
            this.stateManager.updateState({
                battle: {
                    ...this.stateManager.getState().battle,
                    currentTurn: 'PLAYER'
                }
            });
            
            // If player is stunned, immediately end their turn
            if (isPlayerStunned) {
                this.eventBus.emit('message:show', {
                    text: 'Stunned! Turn skipped.',
                    type: 'error'
                });
                
                // Skip player's turn with a delay
                setTimeout(() => {
                    this.processEndOfTurn();
                }, 1500);
            }
        }
    }
    
    // Process active status effects (DoT, HoT, etc.)
    processStatusEffects() {
        const state = this.stateManager.getState();
        const { battle, player } = state;
        const { enemy } = battle;
        
        // Safety checks
        if (!player || !player.buffs || !enemy || !enemy.buffs) {
            console.warn('Missing player or enemy data in processStatusEffects');
            return;
        }
        
        // Process player active effects
        let updatedPlayerBuffs = [...player.buffs];
        let playerUpdates = {};
        
        // Process active player effects (DoT, etc.)
        player.buffs.forEach(buff => {
            switch (buff.type) {
                case 'poison':
                    const poisonDamage = buff.value;
                    const newHealth = Math.max(0, player.health - poisonDamage);
                    
                    playerUpdates.health = newHealth;
                    
                    this.eventBus.emit('player:poisoned-damage', {
                        amount: poisonDamage
                    });
                    
                    this.eventBus.emit('message:show', {
                        text: `You take ${poisonDamage} poison damage!`,
                        type: 'error'
                    });
                    
                    // Check for defeat
                    if (newHealth <= 0) {
                        this.stateManager.updateState({
                            player: {
                                ...player,
                                health: newHealth
                            }
                        });
                        this.endBattle(false);
                        return;
                    }
                    break;
                    
                case 'bleeding':
                    const bleedDamage = buff.value;
                    const newHealthAfterBleed = Math.max(0, (playerUpdates.health !== undefined ? playerUpdates.health : player.health) - bleedDamage);
                    
                    playerUpdates.health = newHealthAfterBleed;
                    
                    this.eventBus.emit('player:damaged', {
                        amount: bleedDamage,
                        source: 'bleeding'
                    });
                    
                    this.eventBus.emit('message:show', {
                        text: `You take ${bleedDamage} bleeding damage!`,
                        type: 'error'
                    });
                    
                    // Check for defeat
                    if (newHealthAfterBleed <= 0) {
                        this.stateManager.updateState({
                            player: {
                                ...player,
                                health: newHealthAfterBleed
                            }
                        });
                        this.endBattle(false);
                        return;
                    }
                    break;
                    
                case 'burning':
                    const burnDamage = buff.value;
                    const newHealthAfterBurn = Math.max(0, (playerUpdates.health !== undefined ? playerUpdates.health : player.health) - burnDamage);
                    
                    playerUpdates.health = newHealthAfterBurn;
                    
                    this.eventBus.emit('player:damaged', {
                        amount: burnDamage,
                        source: 'burning'
                    });
                    
                    this.eventBus.emit('message:show', {
                        text: `You take ${burnDamage} burning damage!`,
                        type: 'error'
                    });
                    
                    // Check for defeat
                    if (newHealthAfterBurn <= 0) {
                        this.stateManager.updateState({
                            player: {
                                ...player,
                                health: newHealthAfterBurn
                            }
                        });
                        this.endBattle(false);
                        return;
                    }
                    break;
                
                case 'regeneration':
                    const regenAmount = buff.value;
                    const newHealthAfterRegen = Math.min(
                        player.maxHealth, 
                        (playerUpdates.health !== undefined ? playerUpdates.health : player.health) + regenAmount
                    );
                    
                    playerUpdates.health = newHealthAfterRegen;
                    
                    this.eventBus.emit('player:healed', {
                        amount: regenAmount,
                        source: 'regeneration'
                    });
                    
                    this.eventBus.emit('message:show', {
                        text: `Regeneration heals you for ${regenAmount} health!`,
                        type: 'success'
                    });
                    break;
            }
        });
        
        // Process enemy active effects
        let updatedEnemyBuffs = [...enemy.buffs];
        let enemyUpdates = {};
        
        enemy.buffs.forEach(buff => {
            switch (buff.type) {
                case 'poison':
                    const poisonDamage = buff.value;
                    const newHealth = Math.max(0, enemy.health - poisonDamage);
                    
                    enemyUpdates.health = newHealth;
                    
                    this.eventBus.emit('enemy:poisoned-damage', {
                        amount: poisonDamage
                    });
                    
                    this.eventBus.emit('message:show', {
                        text: `${enemy.name} takes ${poisonDamage} poison damage!`,
                        type: 'success'
                    });
                    
                    // Check for victory
                    if (newHealth <= 0) {
                        this.stateManager.updateState({
                            battle: {
                                ...battle,
                                enemy: {
                                    ...enemy,
                                    health: newHealth
                                }
                            }
                        });
                        this.endBattle(true);
                        return;
                    }
                    break;
                    
                case 'regenerating':
                    const regenAmount = buff.value;
                    const newHealthAfterRegen = Math.min(
                        enemy.maxHealth, 
                        (enemyUpdates.health !== undefined ? enemyUpdates.health : enemy.health) + regenAmount
                    );
                    
                    enemyUpdates.health = newHealthAfterRegen;
                    
                    this.eventBus.emit('enemy:healed', {
                        amount: regenAmount,
                        enemy
                    });
                    
                    this.eventBus.emit('message:show', {
                        text: `${enemy.name} regenerates ${regenAmount} health!`,
                        type: 'error'
                    });
                    break;
            }
        });
        
        // Update state with all changes if needed
        if (Object.keys(playerUpdates).length > 0 || Object.keys(enemyUpdates).length > 0) {
            this.stateManager.updateState({
                player: {
                    ...player,
                    ...playerUpdates
                },
                battle: {
                    ...battle,
                    enemy: {
                        ...enemy,
                        ...enemyUpdates
                    }
                }
            });
        }
    }
    
    // Process turn end effects (reduce buff durations)
    processTurnEnd() {
        const state = this.stateManager.getState();
        const { battle, player } = state;
        const { enemy } = battle;
        
        // Safety checks
        if (!player || !player.buffs || !enemy || !enemy.buffs) {
            console.warn('Missing player or enemy data in processTurnEnd');
            return;
        }
        
        // Process player buffs - reduce durations
        let updatedPlayerBuffs = [];
        
        player.buffs.forEach(buff => {
            // Reduce duration
            const newDuration = buff.duration - 1;
            
            if (newDuration <= 0) {
                // Buff expired
                this.eventBus.emit('player:buff-expired', {
                    type: buff.type
                });
                
                // Show message for significant buffs
                if (['defense', 'focus', 'charmed', 'stunned', 'webbed', 'bleeding', 'burning'].includes(buff.type)) {
                    this.eventBus.emit('message:show', {
                        text: `Your ${buff.type} effect has worn off.`,
                        type: 'info'
                    });
                }
            } else {
                // Keep buff with reduced duration
                updatedPlayerBuffs.push({
                    ...buff,
                    duration: newDuration
                });
            }
        });
        
        // Process enemy buffs - reduce durations
        let updatedEnemyBuffs = [];
        
        enemy.buffs.forEach(buff => {
            // Reduce duration
            const newDuration = buff.duration - 1;
            
            if (newDuration <= 0) {
                // Buff expired
                this.eventBus.emit('enemy:buff-expired', {
                    type: buff.type
                });
                
                // Show message for significant buffs
                if (['defense', 'phased', 'parrying', 'regenerating', 'ritual', 'empowered', 'minion'].includes(buff.type)) {
                    this.eventBus.emit('message:show', {
                        text: `${enemy.name}'s ${buff.type} effect has worn off.`,
                        type: 'info'
                    });
                }
            } else {
                // Keep buff with reduced duration
                updatedEnemyBuffs.push({
                    ...buff,
                    duration: newDuration
                });
            }
        });
        
        // Update state with reduced durations
        this.stateManager.updateState({
            player: {
                ...player,
                buffs: updatedPlayerBuffs
            },
            battle: {
                ...battle,
                enemy: {
                    ...enemy,
                    buffs: updatedEnemyBuffs
                }
            }
        });
    }
    
    // Process enemy's turn
    processEnemyTurn() {
        const state = this.stateManager.getState();
        const { battle, player } = state;
        
        if (!battle.inProgress) {
            return;
        }
        
        // Add null check for enemy
        const { enemy } = battle;
        if (!enemy) {
            console.warn('Cannot process enemy turn: enemy is null');
            this.processEndOfTurn(); // Skip to end of turn
            return;
        }
        
        // Update enemy turn counter
        const enemyWithCounter = {
            ...enemy,
            turnCount: (enemy.turnCount || 0) + 1
        };
        
        // Check if enemy is stunned
        if (enemy.buffs && enemy.buffs.some(buff => buff.type === 'stunned')) {
            // Skip turn
            this.eventBus.emit('enemy:stunned', { enemy });
            this.eventBus.emit('message:show', {
                text: `${enemy.name} is stunned and skips its turn!`,
                type: 'success'
            });
            this.processEndOfTurn(); // End enemy turn
            return;
        }
        
        // Check for phase-based bosses (mainly for final boss)
        if (enemy.phases) {
            const phaseThreshold = 0.5; // 50% health marks phase transition
            const healthPercent = enemy.health / enemy.maxHealth;
            
            if (healthPercent <= phaseThreshold && !enemy.phaseTransitioned) {
                // Transition to next phase
                this.stateManager.updateState({
                    battle: {
                        ...battle,
                        enemy: {
                            ...enemyWithCounter,
                            phaseTransitioned: true
                        }
                    }
                });
                
                // Special behavior for phase transition
                this.eventBus.emit('message:show', {
                    text: `${enemy.name} enters a new phase! Power increases!`,
                    type: 'error'
                });
                
                // Buff the enemy for phase 2
                const phaseBuff = {
                    type: 'empowered',
                    value: 5, // Increased attack
                    duration: 99 // Effectively permanent
                };
                
                // Update enemy attack and add buff
                this.stateManager.updateState({
                    battle: {
                        ...battle,
                        enemy: {
                            ...this.stateManager.getState().battle.enemy,
                            attack: enemy.attack + 5,
                            buffs: [...enemy.buffs, phaseBuff]
                        }
                    }
                });
                
                // Special phase transition attack
                this.executeEnemyUltimate(enemy, player);
                return;
            }
        }
        
        // Determine and execute enemy action
        const action = enemy.nextAction || 'attack';
        
        // Add action to history for pattern-based behavior
        const actionHistory = enemy.actionHistory || [];
        actionHistory.push(action);
        if (actionHistory.length > 5) {
            actionHistory.shift(); // Keep only last 5 actions
        }
        
        // Update action history
        this.stateManager.updateState({
            battle: {
                ...battle,
                enemy: {
                    ...enemyWithCounter,
                    actionHistory
                }
            }
        });
        
        // Display enemy's action to player
        this.eventBus.emit('message:show', {
            text: `${enemy.name} uses ${action.toUpperCase()}!`,
            type: 'error'
        });
        
        // Execute the chosen action
        this.executeEnemyAction(action, enemy, player);
        
        // Determine next action
        const updatedEnemy = this.stateManager.getState().battle.enemy;
        
        // Add null check before determining next action
        if (updatedEnemy) {
            const nextAction = this.determineEnemyAction(updatedEnemy);
            
            // Update enemy's next action
            this.stateManager.updateState({
                battle: {
                    ...this.stateManager.getState().battle,
                    enemy: {
                        ...updatedEnemy,
                        nextAction
                    }
                }
            });
        }
        
        // End enemy turn after a short delay
        setTimeout(() => {
            this.processEndOfTurn();
        }, 1000);
    }
    
    // Execute the chosen enemy action
    executeEnemyAction(action, enemy, player) {
        // Execute appropriate action based on type
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
                
            case 'bite':
                this.executeEnemyBite(enemy, player);
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
                
            case 'wing':
                this.executeEnemyWing(enemy, player);
                break;
                
            case 'gnaw':
                this.executeEnemyGnaw(enemy, player);
                break;
                
            case 'web':
                this.executeEnemyWeb(enemy, player);
                break;
                
            case 'ultimate':
                this.executeEnemyUltimate(enemy, player);
                break;
                
            default:
                console.warn(`Unknown enemy action: ${action}, defaulting to attack`);
                this.executeEnemyAttack(enemy, player);
        }
    }
    
    // Basic enemy attack
    executeEnemyAttack(enemy, player) {
        // Start with base damage
        let damage = enemy.attack;
        
        // Apply damage modifiers from buffs
        if (enemy.buffs) {
            // Check for ritual buff
            const ritualBuff = enemy.buffs.find(buff => buff.type === 'ritual');
            if (ritualBuff) {
                const bonusDamage = Math.floor(damage * ritualBuff.value);
                damage += bonusDamage;
                
                this.eventBus.emit('message:show', {
                    text: `${enemy.name}'s ritual enhances its attack by ${bonusDamage}!`,
                    type: 'error'
                });
            }
            
            // Check for empowered buff
            const empoweredBuff = enemy.buffs.find(buff => buff.type === 'empowered');
            if (empoweredBuff) {
                const bonusDamage = empoweredBuff.value;
                damage += bonusDamage;
                
                this.eventBus.emit('message:show', {
                    text: `${enemy.name}'s empowered state adds ${bonusDamage} damage!`,
                    type: 'error'
                });
            }
            
            // Check for minion buff
            const minionBuff = enemy.buffs.find(buff => buff.type === 'minion');
            if (minionBuff) {
                const minionDamage = minionBuff.value;
                damage += minionDamage;
                
                this.eventBus.emit('message:show', {
                    text: `${enemy.name}'s minion adds ${minionDamage} extra damage!`,
                    type: 'error'
                });
            }
        }
        
        // Calculate actual damage after player defense
        let actualDamage = damage;
        
        // Check for player defense buff
        const defenseBuff = player.buffs && player.buffs.find(buff => buff.type === 'defense');
        if (defenseBuff) {
            const blocked = Math.min(damage, defenseBuff.value);
            actualDamage = Math.max(1, damage - defenseBuff.value);
            
            this.eventBus.emit('message:show', {
                text: `Your defense blocked ${blocked} damage!`,
                type: 'info'
            });
            
            // Handle reflective shield
            if (defenseBuff.reflect) {
                const reflectDamage = Math.floor(actualDamage * defenseBuff.reflect);
                
                // Apply reflected damage to enemy
                const newEnemyHealth = Math.max(0, enemy.health - reflectDamage);
                
                // Update enemy health
                this.stateManager.updateState({
                    battle: {
                        ...this.stateManager.getState().battle,
                        enemy: {
                            ...enemy,
                            health: newEnemyHealth
                        }
                    }
                });
                
                this.eventBus.emit('message:show', {
                    text: `Your reflective shield returns ${reflectDamage} damage to ${enemy.name}!`,
                    type: 'success'
                });
                
                this.eventBus.emit('enemy:damaged', {
                    amount: reflectDamage,
                    source: 'reflect',
                    player
                });
                
                // Check if enemy was defeated by reflection
                if (newEnemyHealth <= 0) {
                    this.endBattle(true);
                    return;
                }
                
                // Get updated enemy after reflect damage
                enemy = this.stateManager.getState().battle.enemy;
            }
        }
        
        // Apply damage to player
        const newHealth = Math.max(0, player.health - actualDamage);
        
        // Update state
        this.stateManager.updateState({
            player: {
                ...player,
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
    
    // Determine enemy's next action
    determineEnemyAction(enemy) {
        // Handle null enemy
        if (!enemy) {
            console.warn('Cannot determine action: enemy is null');
            return 'attack'; // Default fallback
        }

        const availableActions = enemy.actions || ['attack'];
        
        // Strategic decision making
        if (enemy.health < enemy.maxHealth * 0.3) {
            // Low health - prioritize defense or healing
            if (availableActions.includes('heal')) {
                return 'heal';
            } else if (availableActions.includes('defend') || availableActions.includes('harden')) {
                return availableActions.includes('defend') ? 'defend' : 'harden';
            }
        }
        
        // Action weights (higher = more likely)
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
        
        // Apply some randomness
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
                ...state.battle,
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
                    ...state.player,
                    zenny: state.player.zenny + rewardZenny
                }
            });
            
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
    
    // Progress to next phase or camp
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
                    ...state.journey,
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
        
        // For Dawn and Dusk phases, go to shop
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
                    ...state.journey,
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
                ...state.journey,
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
                ...state.battle,
                inProgress: false,
                currentTurn: null,
                enemy: null,
                selectedGems: []
            }
        });
        
        // Reset gems specifically for fleeing
        this.gemManager.resetGemsAfterFleeing();
        
        // Emit flee event
        this.eventBus.emit('battle:fled', {
            phase
        });
        
        // Progress to next phase
        this.progressJourney();
        
        return true;
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
                ...this.stateManager.getState().battle,
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
                ...this.stateManager.getState().battle,
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
    
    // Enemy bite action (wolf)
    executeEnemyBite(enemy, player) {
        // Deal higher damage than normal attack
        let damage = Math.floor(enemy.attack * 1.3);
        let actualDamage = damage;
        
        // Check for defense buff
        const defenseBuff = player.buffs.find(buff => buff.type === 'defense');
        if (defenseBuff) {
            actualDamage = Math.max(1, damage - defenseBuff.value);
        }
        
        // Apply damage to player
        const newHealth = Math.max(0, player.health - actualDamage);
        
        // 30% chance to stun
        const willStun = Math.random() < 0.3;
        let newBuffs = [...player.buffs];
        
        if (willStun) {
            // Add stunned effect
            const stunnedBuff = {
                type: 'stunned',
                duration: 1
            };
            
            // Remove any existing stun before adding new one
            newBuffs = newBuffs.filter(b => b.type !== 'stunned');
            newBuffs.push(stunnedBuff);
            
            this.eventBus.emit('message:show', {
                text: `${enemy.name}'s bite stuns you!`,
                type: 'error'
            });
        }
        
        // Update state
        this.stateManager.updateState({
            player: {
                ...player,
                health: newHealth,
                buffs: newBuffs
            }
        });
        
        // Emit events
        this.eventBus.emit('player:damaged', {
            amount: actualDamage,
            blocked: damage - actualDamage,
            source: 'enemy-bite',
            enemy
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }
    
    // Enemy enrage action
    executeEnemyEnrage(enemy) {
        // Permanently increase attack
        const attackIncrease = Math.floor(enemy.attack * 0.3);
        const newAttack = enemy.attack + attackIncrease;
        
        // Update state
        this.stateManager.updateState({
            battle: {
                ...this.stateManager.getState().battle,
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
                ...player,
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
                ...this.stateManager.getState().battle,
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
                ...player,
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
                ...player,
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
                ...this.stateManager.getState().battle,
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
                ...this.stateManager.getState().battle,
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
                ...player,
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
                ...player,
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
    
    // Enemy wing action (dragon - AoE with stamina reduction)
    executeEnemyWing(enemy, player) {
        // Deal moderate damage
        let damage = Math.floor(enemy.attack * 1.1);
        let actualDamage = damage;
        
        // Check for defense buff
        const defenseBuff = player.buffs.find(buff => buff.type === 'defense');
        if (defenseBuff) {
            actualDamage = Math.max(1, damage - defenseBuff.value);
        }
        
        // Apply damage to player
        const newHealth = Math.max(0, player.health - actualDamage);
        
        // Apply stamina reduction
        const newStamina = Math.max(0, player.stamina - 1);
        
        // Update state
        this.stateManager.updateState({
            player: {
                ...player,
                health: newHealth,
                stamina: newStamina
            }
        });
        
        // Emit events
        this.eventBus.emit('player:damaged', {
            amount: actualDamage,
            blocked: damage - actualDamage,
            source: 'enemy-wing',
            enemy
        });
        
        this.eventBus.emit('message:show', {
            text: `${enemy.name}'s wings create a powerful gust, dealing ${actualDamage} damage and reducing your stamina!`,
            type: 'error'
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }
    
    // Enemy gnaw action (rat - causes bleeding DoT)
    executeEnemyGnaw(enemy, player) {
        // Deal less damage than normal attack but apply bleeding
        let damage = Math.floor(enemy.attack * 0.8);
        let actualDamage = damage;
        
        // Check for defense buff
        const defenseBuff = player.buffs.find(buff => buff.type === 'defense');
        if (defenseBuff) {
            actualDamage = Math.max(1, damage - defenseBuff.value);
        }
        
        // Apply damage to player
        const newHealth = Math.max(0, player.health - actualDamage);
        
        // Apply bleeding effect (DoT)
        const bleedingValue = Math.floor(enemy.attack * 0.2);
        const bleedingBuff = {
            type: 'bleeding',
            value: bleedingValue,
            duration: 3
        };
        
        // Remove any existing bleeding before adding new one
        const newBuffs = [...player.buffs.filter(b => b.type !== 'bleeding'), bleedingBuff];
        
        // Update state
        this.stateManager.updateState({
            player: {
                ...player,
                health: newHealth,
                buffs: newBuffs
            }
        });
        
        // Emit events
        this.eventBus.emit('player:damaged', {
            amount: actualDamage,
            blocked: damage - actualDamage,
            source: 'enemy-gnaw',
            enemy
        });
        
        this.eventBus.emit('message:show', {
            text: `${enemy.name}'s gnaw causes bleeding (${bleedingValue} damage/turn for 3 turns)!`,
            type: 'error'
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }
    
    // Enemy web action (spider - reduces player stamina recovery)
    executeEnemyWeb(enemy, player) {
        // Apply webbed debuff to player
        const webbedBuff = {
            type: 'webbed',
            duration: 2
        };
        
        // Remove any existing webbed before adding new one
        const newBuffs = [...player.buffs.filter(b => b.type !== 'webbed'), webbedBuff];
        
        // Update state
        this.stateManager.updateState({
            player: {
                ...player,
                buffs: newBuffs
            }
        });
        
        // Emit event
        this.eventBus.emit('message:show', {
            text: `${enemy.name}'s web reduces your stamina recovery for 2 turns!`,
            type: 'error'
        });
    }
    
    // Enemy ultimate action (dark lord, boss phase transition)
    executeEnemyUltimate(enemy, player) {
        // Deal massive damage
        let damage = Math.floor(enemy.attack * 2.0);
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
                ...player,
                health: newHealth
            }
        });
        
        // Emit events
        this.eventBus.emit('player:damaged', {
            amount: actualDamage,
            blocked: damage - actualDamage,
            source: 'enemy-ultimate',
            enemy
        });
        
        this.eventBus.emit('message:show', {
            text: `${enemy.name} unleashes a devastating ultimate attack for ${actualDamage} damage!`,
            type: 'error'
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }
}