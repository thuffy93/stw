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
                        health: 25, // Increased from 20 to match player power
                        maxHealth: 25,
                        attack: 8, // Same
                        image: '👹',
                        zenny: 4, // Increased from 3 - better rewards
                        actions: ['attack'],
                        difficulty: 1
                    },
                    {
                        id: 'rat1',
                        name: 'Giant Rat',
                        health: 20, // Increased from 16
                        maxHealth: 20,
                        attack: 7, // Increased from 6
                        image: '🐀',
                        zenny: 3, // Increased from 2
                        actions: ['attack', 'gnaw'], // gnaw causes bleeding (DoT)
                        difficulty: 1
                    }
                ],
                DUSK: [
                    {
                        id: 'bandit1',
                        name: 'Bandit',
                        health: 30, // Increased from 25
                        maxHealth: 30,
                        attack: 10, // Same
                        image: '💀',
                        zenny: 6, // Increased from 5
                        actions: ['attack', 'defend', 'steal'],
                        difficulty: 2
                    },
                    {
                        id: 'spider1',
                        name: 'Cave Spider',
                        health: 28, // Increased from 22
                        maxHealth: 28,
                        attack: 9, // Same
                        image: '🕷️',
                        zenny: 5, // Increased from 4
                        actions: ['attack', 'web'], // web reduces player stamina recovery
                        difficulty: 2
                    }
                ],
                DARK: [
                    {
                        id: 'wolf1',
                        name: 'Shadow Wolf',
                        health: 40, // Increased from 35
                        maxHealth: 40,
                        attack: 12, // Same - first boss should be challenging but fair
                        image: '🐺',
                        zenny: 12, // Increased from 10
                        actions: ['attack', 'howl', 'bite'], // bite is a stronger attack with a chance to stun
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
                        health: 35, // Increased from 30
                        maxHealth: 35,
                        attack: 11, // Increased from 10
                        image: '👹',
                        zenny: 6, // Increased from 5
                        actions: ['attack', 'enrage'], // enrage increases attack permanently
                        difficulty: 3
                    },
                    {
                        id: 'slime1',
                        name: 'Toxic Slime',
                        health: 32, // Increased from 28
                        maxHealth: 32,
                        attack: 10, // Increased from 9
                        image: '🟢',
                        zenny: 7, // Increased from 6
                        actions: ['attack', 'split', 'toxic'], // split: spawns a mini-slime, toxic: applies poison
                        difficulty: 3
                    }
                ],
                DUSK: [
                    {
                        id: 'bandit2',
                        name: 'Bandit Leader',
                        health: 40, // Increased from 35
                        maxHealth: 40,
                        attack: 13, // Increased from 12
                        image: '💀',
                        zenny: 9, // Increased from 8
                        actions: ['attack', 'defend', 'steal', 'rally'], // rally summons a weak bandit ally
                        difficulty: 4
                    },
                    {
                        id: 'phantom1',
                        name: 'Cave Phantom',
                        health: 38, // Increased from 32
                        maxHealth: 38,
                        attack: 14, // Same - already high
                        image: '👻',
                        zenny: 10, // Increased from 9
                        actions: ['attack', 'phase', 'haunt'], // phase: gains temporary invulnerability, haunt: reduces player damage
                        difficulty: 4
                    }
                ],
                DARK: [
                    {
                        id: 'goblin1',
                        name: 'Goblin King',
                        health: 55, // Increased from 45
                        maxHealth: 55,
                        attack: 16, // Increased from 15
                        image: '👿',
                        zenny: 18, // Increased from 15
                        actions: ['attack', 'summon', 'poison', 'steal'], // summon adds extra damage
                        specialLoot: true, // chance to drop special gem
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
                        health: 48, // Increased from 40
                        maxHealth: 48,
                        attack: 14, // Increased from 12
                        image: '🧙‍♀️',
                        zenny: 10, // Increased from 8
                        actions: ['attack', 'curse', 'heal', 'hex'], // hex adds random debuff
                        difficulty: 5
                    },
                    {
                        id: 'troll1',
                        name: 'Moss Troll',
                        health: 60, // Increased from 50
                        maxHealth: 60,
                        attack: 15, // Increased from 14
                        image: '👹',
                        zenny: 12, // Increased from 10
                        actions: ['attack', 'crush', 'regenerate'], // crush: high damage attack, regenerate: heal over time
                        difficulty: 5
                    }
                ],
                DUSK: [
                    {
                        id: 'golem1',
                        name: 'Stone Golem',
                        health: 65, // Increased from 55
                        maxHealth: 65,
                        attack: 16, // Increased from 14
                        image: '🗿',
                        zenny: 14, // Increased from 12
                        actions: ['attack', 'harden', 'earthquake'], // earthquake damages and has chance to stun
                        difficulty: 6
                    },
                    {
                        id: 'enchanter1',
                        name: 'Dark Enchanter',
                        health: 55, // Increased from 45
                        maxHealth: 55,
                        attack: 18, // Increased from 16
                        image: '🧙‍♂️',
                        zenny: 16, // Increased from 14
                        actions: ['attack', 'drain', 'enchant', 'teleport'], // drain steals health, enchant buffs golem if present, teleport skips turn but gains defense
                        difficulty: 6
                    }
                ],
                DARK: [
                    {
                        id: 'dragon1',
                        name: 'Young Dragon',
                        health: 80, // Increased from 65 - major boss
                        maxHealth: 80,
                        attack: 20, // Increased from 18
                        image: '🐉',
                        zenny: 25, // Increased from 20
                        actions: ['attack', 'breathe', 'tail', 'wing'], // wing is AOE with stamina reduction
                        specialLoot: true,
                        difficulty: 7
                    }
                ]
            },
            // Day 4+ - add more days for extended gameplay
            4: {
                DAWN: [
                    {
                        id: 'elemental1',
                        name: 'Fire Elemental',
                        health: 70, // Increased from 60
                        maxHealth: 70,
                        attack: 18, // Increased from 16
                        image: '🔥',
                        zenny: 18, // Increased from 15
                        actions: ['attack', 'ignite', 'heatwave'], // ignite: DoT, heatwave: AOE
                        difficulty: 7
                    },
                    {
                        id: 'knight1',
                        name: 'Fallen Knight',
                        health: 75, // Increased from 65
                        maxHealth: 75,
                        attack: 20, // Increased from 18
                        image: '🗡️',
                        zenny: 20, // Increased from 18
                        actions: ['attack', 'parry', 'charge'], // parry: reflects damage, charge: high damage after delay
                        difficulty: 7
                    }
                ],
                DUSK: [
                    {
                        id: 'lich1',
                        name: 'Undead Lich',
                        health: 85, // Increased from 70
                        maxHealth: 85,
                        attack: 22, // Increased from 20
                        image: '💀',
                        zenny: 22, // Increased from 20
                        actions: ['attack', 'drain', 'revive', 'curse'], // revive once from death
                        difficulty: 8
                    },
                    {
                        id: 'demon1',
                        name: 'Lesser Demon',
                        health: 90, // Increased from 75
                        maxHealth: 90,
                        attack: 24, // Increased from 22
                        image: '😈',
                        zenny: 25, // Increased from 22
                        actions: ['attack', 'fireball', 'tempt', 'consume'], // tempt: steal gems, consume: restore health based on stolen gems
                        difficulty: 8
                    }
                ],
                DARK: [
                    {
                        id: 'darkness1',
                        name: 'Avatar of Darkness',
                        health: 105, // Increased from 85
                        maxHealth: 105,
                        attack: 26, // Increased from 24
                        image: '🌑',
                        zenny: 35, // Increased from 30
                        actions: ['attack', 'eclipse', 'void', 'consume'],
                        specialLoot: true,
                        difficulty: 9
                    }
                ]
            },
            // Day 5-7
            5: {
                DAWN: [
                    {
                        id: 'hunter1',
                        name: 'Shadow Hunter',
                        health: 95, // Increased from 75
                        maxHealth: 95,
                        attack: 24, // Increased from 22
                        image: '🏹',
                        zenny: 28, // Increased from 25
                        actions: ['attack', 'snipe', 'trap', 'track'], // snipe: targeted attack at weakness, trap: reduces player stamina, track: increases future hit chance
                        difficulty: 9
                    }
                ],
                DUSK: [
                    {
                        id: 'sorcerer1',
                        name: 'Astral Sorcerer',
                        health: 100, // Increased from 80
                        maxHealth: 100,
                        attack: 26, // Increased from 25
                        image: '✨',
                        zenny: 32, // Increased from 28
                        actions: ['attack', 'meteor', 'banish', 'warp'], // meteor: high damage AOE, banish: removes random gem from hand, warp: skips turn but gains strong buff
                        difficulty: 10
                    }
                ],
                DARK: [
                    {
                        id: 'titan1',
                        name: 'Ancient Titan',
                        health: 125, // Increased from 100
                        maxHealth: 125,
                        attack: 30, // Increased from 28
                        image: '🗿',
                        zenny: 40, // Increased from 35
                        actions: ['attack', 'smash', 'earthquake', 'roar'], // High damage attacks with various side effects
                        specialLoot: true,
                        difficulty: 11
                    }
                ]
            },
            6: {
                DAWN: [
                    {
                        id: 'vampire1',
                        name: 'Vampire Lord',
                        health: 110, // Increased from 90
                        maxHealth: 110,
                        attack: 28, // Increased from 26
                        image: '🧛',
                        zenny: 35, // Increased from 30
                        actions: ['attack', 'drain', 'charm', 'mist'], // charm: take control of player for one turn, mist: becomes untargetable
                        difficulty: 11
                    }
                ],
                DUSK: [
                    {
                        id: 'wraith1',
                        name: 'Elder Wraith',
                        health: 120, // Increased from 95
                        maxHealth: 120,
                        attack: 30, // Increased from 28
                        image: '👻',
                        zenny: 40, // Increased from 35
                        actions: ['attack', 'possess', 'haunt', 'drain'], // possess: use player's gems against them
                        difficulty: 12
                    }
                ],
                DARK: [
                    {
                        id: 'guardian1',
                        name: 'Castle Guardian',
                        health: 140, // Increased from 120
                        maxHealth: 140,
                        attack: 32, // Increased from 30
                        image: '🛡️',
                        zenny: 45, // Increased from 40
                        actions: ['attack', 'shield', 'bash', 'judgment'], // judgment: damage based on player's gems
                        specialLoot: true,
                        difficulty: 13
                    }
                ]
            },
            7: {
                DAWN: [
                    {
                        id: 'general1',
                        name: 'Dark General',
                        health: 130, // Increased from 110
                        maxHealth: 130,
                        attack: 34, // Increased from 32
                        image: '⚔️',
                        zenny: 45, // Increased from 40
                        actions: ['attack', 'command', 'execute', 'rally'], // command: summons minions, execute: high damage to low health player
                        difficulty: 13
                    }
                ],
                DUSK: [
                    {
                        id: 'mage1',
                        name: 'Royal Dark Mage',
                        health: 140, // Increased from 115
                        maxHealth: 140,
                        attack: 38, // Increased from 35
                        image: '🔮',
                        zenny: 50, // Increased from 45
                        actions: ['attack', 'ritual', 'arcane', 'bind'], // ritual: buffs the Dark Lord if fought after, arcane: high magic damage, bind: disables a random gem color
                        difficulty: 14
                    }
                ],
                DARK: [
                    {
                        id: 'darkLord',
                        name: 'The Dark Lord',
                        health: 180, // Increased from 150 - epic final boss
                        maxHealth: 180,
                        attack: 42, // Increased from 40
                        image: '👑',
                        zenny: 120, // Increased from 100
                        actions: ['attack', 'darkness', 'summon', 'drain', 'execute', 'ultimate'],
                        phases: true, // Has multiple phases with different behavior
                        specialLoot: true,
                        difficulty: 15
                    }
                ]
            }
        };
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Existing event listeners...
        // No changes needed here
        this.eventBus.on('gem:played', (gemData) => {
            this.processGemEffect(gemData);
        });
        
        this.eventBus.on('turn:ended', () => {
            this.processEndOfTurn();
        });
        
        this.eventBus.on('battle:start', () => {
            this.startBattle();
        });
        
        this.eventBus.on('stamina:used', (amount) => {
            this.trackStaminaUsed(amount);
        });
    }
    
    // Clean version of trackStaminaUsed without debugging code
    trackStaminaUsed(amount) {
        const state = this.stateManager.getState();
        const currentStaminaUsed = state.battle.staminaUsed || 0;
        
        // Simple debounce mechanism to prevent double-tracking
        const now = Date.now();
        const lastTrackedTime = this._lastStaminaTrackedTime || 0;
        const lastTrackedAmount = this._lastStaminaAmount || 0;
        
        // If the same amount is being tracked within 100ms, it's likely a duplicate
        if (amount === lastTrackedAmount && (now - lastTrackedTime) < 100) {
            return; // Skip duplicate tracking
        }
        
        // Store tracking information for debounce checking
        this._lastStaminaTrackedTime = now;
        this._lastStaminaAmount = amount;
        
        // Update the state
        this.stateManager.updateState({
            battle: {
                staminaUsed: currentStaminaUsed + amount
            }
        });
        
        console.log(`Tracked ${amount} stamina used. Total this turn: ${currentStaminaUsed + amount}`);
    }
    
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
                staminaUsed: 0, // Initialize stamina tracking
                actionHistory: [] // Track past actions for more complex enemy behavior
            }
        });
        
        // Reset player stamina at start of battle
        this.stateManager.updateState({
            player: {
                stamina: state.player.maxStamina
            }
        });
        
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
    
    // Get a random enemy for the current day and phase with improved difficulty scaling
    getRandomEnemy(day, phase) {
        // Handle days beyond what's defined
        let effectiveDay = day;
        // If day is beyond what we've defined, use the last day with modifications for scaling
        if (effectiveDay > Object.keys(this.enemyPool).length) {
            effectiveDay = Object.keys(this.enemyPool).length;
        }
        
        // Get the enemy pool for the day/phase
        const dayPool = this.enemyPool[effectiveDay] || this.enemyPool[1]; // Default to day 1 if not found
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
            console.log(`Scaled enemy for day ${day}: HP ${enemyTemplate.health} -> ${scaledTemplate.health}, ATK ${enemyTemplate.attack} -> ${scaledTemplate.attack}`);
        }
        
        // Clone the enemy to avoid modifying the template
        return {
            ...scaledTemplate,
            buffs: [],
            nextAction: this.determineEnemyAction(scaledTemplate),
            turnCount: 0, // Track turns for more complex behavior patterns
            actionHistory: [] // Keep a history of actions for pattern-based behavior
        };
    }
    
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
                
                // Apply any active player buffs - FIXED: Added safety check
                if (player.buffs && player.buffs.some(buff => buff.type === 'focus')) {
                    damageAmount = Math.floor(damageAmount * 1.2); // 20% bonus from focus
                }
                
                // Check for player debuffs that reduce damage output
                if (player.buffs) {
                    // Various debuff checks...
                }
                
                // FIXED: Check if enemy is phased (invulnerable)
                if (enemy.buffs && enemy.buffs.some(buff => buff.type === 'phased')) {
                    // Enemy is invulnerable - no damage
                    this.eventBus.emit('message:show', {
                        text: `${enemy.name} is phased out of reality! Your attack passes through harmlessly!`,
                        type: 'error'
                    });
                    
                    // No damage applied - enemy health stays the same
                    enemyUpdates.health = enemy.health;
                    break;
                }
                
                // FIXED: Check for enemy defense buff
                let actualDamage = damageAmount;
                let blockedDamage = 0;
                
                const enemyDefenseBuff = enemy.buffs && enemy.buffs.find(buff => buff.type === 'defense');
                if (enemyDefenseBuff) {
                    // NEW: Check for piercing augmentation
                    let defenseToBePierced = 0;
                    if (gem.augmentation === 'piercing' && gem.defenseBypass) {
                        defenseToBePierced = Math.floor(enemyDefenseBuff.value * gem.defenseBypass);
                        
                        // Show piercing message
                        this.eventBus.emit('message:show', {
                            text: `Piercing gem bypasses ${defenseToBePierced} of enemy defense!`,
                            type: 'success'
                        });
                    }
                    
                    // Reduce damage by defense value (minus pierced amount), minimum 1
                    actualDamage = Math.max(1, damageAmount - (enemyDefenseBuff.value - defenseToBePierced));
                    blockedDamage = damageAmount - actualDamage;
                    
                    // Show damage reduction message
                    if (blockedDamage > 0) {
                        this.eventBus.emit('message:show', {
                            text: `${enemy.name}'s defense blocked ${blockedDamage} damage!`,
                            type: 'info'
                        });
                    }
                }
                
                // Check for parrying buff and other enemy effects...
                
                // Apply damage to enemy
                const newEnemyHealth = Math.max(0, enemy.health - actualDamage);
                enemyUpdates.health = newEnemyHealth;
                
                // Emit damage event with blocked amount
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
                    
                    this.endBattle(true);
                    return;
                }
                
                // NEW: Handle swift augmentation effect (draw an extra gem)
                if (gem.augmentation === 'swift' || gem.specialEffect === 'draw') {
                    console.log("Swift gem effect: Drawing an extra gem");
                    this.gemManager.drawGems(1);
                    
                    this.eventBus.emit('message:show', {
                        text: `Swift gem allows you to draw an extra gem!`,
                        type: 'success'
                    });
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
                
                // NEW: Apply powerful augmentation bonus to healing
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
                
                // NEW: Handle swift augmentation effect for healing gems too
                if (gem.augmentation === 'swift' || gem.specialEffect === 'draw') {
                    console.log("Swift healing gem: Drawing an extra gem");
                    this.gemManager.drawGems(1);
                    
                    this.eventBus.emit('message:show', {
                        text: `Swift healing allows you to draw an extra gem!`,
                        type: 'success'
                    });
                }
                break;
                
            case 'shield':
                let defenseAmount = gem.value;
                
                // Apply class bonus if applicable
                if (playerClass === 'mage' && gem.color === 'blue') {
                    defenseAmount = Math.floor(defenseAmount * 1.5); // 50% bonus
                }
                
                // NEW: Apply powerful augmentation to defense
                if (gem.augmentation === 'powerful') {
                    const powerfulBonus = Math.floor(defenseAmount * 0.3); // 30% extra defense
                    defenseAmount += powerfulBonus;
                    
                    this.eventBus.emit('message:show', {
                        text: `Powerful shield provides ${powerfulBonus} extra defense!`,
                        type: 'success'
                    });
                }
                
                // Remove existing defense buff - FIXED: Added safety check
                const updatedBuffs = player.buffs ? player.buffs.filter(b => b.type !== 'defense') : [];
                
                // NEW: Handle lasting augmentation by extending duration
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
                
                newBuffs.push(defenseBuff);
                
                // Emit shield event
                this.eventBus.emit('player:shielded', {
                    defense: defenseAmount,
                    duration: defenseDuration,
                    gem: gem
                });
                
                // Handle swift augmentation effect
                if (gem.augmentation === 'swift' || gem.specialEffect === 'draw') {
                    console.log("Swift shield gem: Drawing an extra gem");
                    this.gemManager.drawGems(1);
                    
                    this.eventBus.emit('message:show', {
                        text: `Swift shield allows you to draw an extra gem!`,
                        type: 'success'
                    });
                }
                break;
                
            case 'poison':
                let poisonAmount = gem.value;
                
                // Apply class bonus if applicable
                if (playerClass === 'rogue' && gem.color === 'green') {
                    poisonAmount = Math.floor(poisonAmount * 1.5); // 50% bonus
                }
                
                // NEW: Apply powerful augmentation to poison
                if (gem.augmentation === 'powerful') {
                    const powerfulBonus = Math.floor(poisonAmount * 0.3); // 30% extra poison
                    poisonAmount += powerfulBonus;
                    
                    this.eventBus.emit('message:show', {
                        text: `Powerful poison causes ${powerfulBonus} extra damage per turn!`,
                        type: 'success'
                    });
                }
                
                // NEW: Handle lasting augmentation for DoT effects
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
                
                // Handle swift augmentation effect
                if (gem.augmentation === 'swift' || gem.specialEffect === 'draw') {
                    console.log("Swift poison gem: Drawing an extra gem");
                    this.gemManager.drawGems(1);
                    
                    this.eventBus.emit('message:show', {
                        text: `Swift poison allows you to draw an extra gem!`,
                        type: 'success'
                    });
                }
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
        
        // Handle gem draw effect after state update
        if (gem.specialEffect === 'draw') {
            setTimeout(() => {
                this.gemManager.drawGems(1);
            }, 300);
        }
        const parryingBuff = enemy.buffs && enemy.buffs.find(buff => buff.type === 'parrying');
        if (parryingBuff) {
            // Calculate reflected damage
            const reflectDamage = Math.floor(actualDamage * parryingBuff.value);
            
            // Apply reflected damage to player
            const newPlayerHealth = Math.max(0, player.health - reflectDamage);
            playerUpdates.health = newPlayerHealth;
            
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
                // Update state before ending battle
                this.stateManager.updateState({
                    player: {
                        ...player,
                        ...playerUpdates
                    }
                });
                
                this.endBattle(false);
                return;
            }
        }
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
    // This is the updated processEndOfTurn method for BattleManager.js
    // with the new consistent stamina recovery system

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
            // FIXED: Process active status effects only, don't reduce durations yet
            this.processStatusEffects();
            
            const staminaUsed = battle.staminaUsed || 0;

            // New formula with specific handling for case of 2 stamina used
            let staminaRecovery;
            if (staminaUsed === 2) {
                // Explicit handling for 2 stamina used to ensure it recovers 2
                staminaRecovery = 2;
            } else {
                // Normal formula for other cases
                staminaRecovery = Math.max(1, 3 - Math.ceil(staminaUsed / 2));
                
            }

            // Apply web debuff effect (if present)
            if (player.buffs && player.buffs.some(buff => buff.type === 'webbed')) {
                const oldRecovery = staminaRecovery;
                staminaRecovery = Math.max(1, Math.floor(staminaRecovery / 2));
            }

            // Calculate new stamina value (don't exceed max)
            const newStamina = Math.min(player.maxStamina, player.stamina + staminaRecovery);

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
            
            // FIXED: NOW we process buff durations at the end of a full round
            // This ensures buffs last for a proper turn cycle
            this.processTurnEnd();
            
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
    // Process status effects at end of round - Updated to handle all buff types
    processStatusEffects() {
        const state = this.stateManager.getState();
        const { battle, player } = state;
        const { enemy } = battle;
        
        // Safety checks
        if (!player || !player.buffs || !enemy || !enemy.buffs) {
            console.warn('Missing player or enemy data in processStatusEffects');
            return;
        }
        
        // Process player buffs - ONLY apply active effects, don't reduce durations
        let updatedPlayerBuffs = [...player.buffs]; // Keep all buffs with current durations
        let playerUpdates = {};
        
        // Process active effects only
        player.buffs.forEach(buff => {
            // Process active status effects (damage over time)
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
                        this.endBattle(false);
                        return; // Exit early to prevent further processing
                    }
                    break;
                    
                case 'bleeding':
                    // Process bleeding DoT
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
                        this.endBattle(false);
                        return; // Exit early to prevent further processing
                    }
                    break;
                    
                case 'burning':
                    // Process burning DoT
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
                        this.endBattle(false);
                        return; // Exit early to prevent further processing
                    }
                    break;
                
                case 'regeneration':
                    // NEW: Process regeneration healing
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
        
        // Process enemy buffs - ONLY apply active effects, don't reduce durations
        let updatedEnemyBuffs = [...enemy.buffs]; // Keep all buffs with current durations
        let enemyUpdates = {};
        
        // Process active effects only
        enemy.buffs.forEach(buff => {
            // Process active status effects
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
                        this.endBattle(true);
                        return; // Exit early to prevent further processing
                    }
                    break;
                    
                case 'regenerating':
                    // Process regeneration healing
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
        
        // Update state with all the changes but keep buff durations intact
        this.stateManager.updateState({
            player: {
                ...player,
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
    // Execute enemy's turn with enhanced AI
    processEnemyTurn() {
        const state = this.stateManager.getState();
        const { battle, player } = state;
        
        if (!battle.inProgress) {
            return;
        }
        
        // FIXED: Add null check for enemy
        const { enemy } = battle;
        if (!enemy) {
            console.warn('Cannot process enemy turn: enemy is null');
            this.processEndOfTurn(); // Skip to end of turn
            return;
        }
        
        // Update enemy turn counter
        enemy.turnCount = (enemy.turnCount || 0) + 1;
        
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
        
        // Some enemies have turn-based patterns or special behaviors
        // Check for phase-based bosses (mainly for final boss)
        if (enemy.phases) {
            const phaseThreshold = 0.5; // 50% health marks phase transition
            const healthPercent = enemy.health / enemy.maxHealth;
            
            if (healthPercent <= phaseThreshold && !enemy.phaseTransitioned) {
                // Transition to next phase
                enemy.phaseTransitioned = true;
                
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
                
                enemy.attack += 5;
                enemy.buffs.push(phaseBuff);
                
                // Special phase transition attack
                this.executeEnemyUltimate(enemy, player);
                return;
            }
        }
        
        // Determine and execute enemy action
        const action = enemy.nextAction || 'attack';
        
        // Add action to history for pattern-based behavior
        enemy.actionHistory = enemy.actionHistory || [];
        enemy.actionHistory.push(action);
        if (enemy.actionHistory.length > 5) {
            enemy.actionHistory.shift(); // Keep only last 5 actions
        }
        
        // Display enemy's action to player
        this.eventBus.emit('message:show', {
            text: `${enemy.name} uses ${action.toUpperCase()}!`,
            type: 'error'
        });
        
        // Execute the chosen action
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
                
            case 'split':
                this.executeEnemySplit(enemy);
                break;
                
            case 'toxic':
                this.executeEnemyToxic(enemy, player);
                break;
                
            case 'rally':
                this.executeEnemyRally(enemy);
                break;
                
            case 'phase':
                this.executeEnemyPhase(enemy);
                break;
                
            case 'haunt':
                this.executeEnemyHaunt(enemy, player);
                break;
                
            case 'hex':
                this.executeEnemyHex(enemy, player);
                break;
                
            case 'crush':
                this.executeEnemyCrush(enemy, player);
                break;
                
            case 'regenerate':
                this.executeEnemyRegenerate(enemy);
                break;
                
            case 'earthquake':
                this.executeEnemyEarthquake(enemy, player);
                break;
                
            case 'drain':
                this.executeEnemyDrain(enemy, player);
                break;
                
            case 'enchant':
                this.executeEnemyEnchant(enemy);
                break;
                
            case 'teleport':
                this.executeEnemyTeleport(enemy);
                break;
                
            case 'ignite':
                this.executeEnemyIgnite(enemy, player);
                break;
                
            case 'heatwave':
                this.executeEnemyHeatwave(enemy, player);
                break;
                
            case 'parry':
                this.executeEnemyParry(enemy);
                break;
                
            case 'charge':
                this.executeEnemyCharge(enemy, player);
                break;
                
            case 'revive':
                this.executeEnemyRevive(enemy);
                break;
                
            case 'fireball':
                this.executeEnemyFireball(enemy, player);
                break;
                
            case 'tempt':
                this.executeEnemyTempt(enemy, player);
                break;
                
            case 'consume':
                this.executeEnemyConsume(enemy);
                break;
                
            case 'eclipse':
                this.executeEnemyEclipse(enemy, player);
                break;
                
            case 'void':
                this.executeEnemyVoid(enemy, player);
                break;
                
            case 'snipe':
                this.executeEnemySnipe(enemy, player);
                break;
                
            case 'trap':
                this.executeEnemyTrap(enemy, player);
                break;
                
            case 'track':
                this.executeEnemyTrack(enemy, player);
                break;
                
            case 'meteor':
                this.executeEnemyMeteor(enemy, player);
                break;
                
            case 'banish':
                this.executeEnemyBanish(enemy, player);
                break;
                
            case 'warp':
                this.executeEnemyWarp(enemy);
                break;
                
            case 'smash':
                this.executeEnemySmash(enemy, player);
                break;
                
            case 'roar':
                this.executeEnemyRoar(enemy, player);
                break;
                
            case 'charm':
                this.executeEnemyCharm(enemy, player);
                break;
                
            case 'mist':
                this.executeEnemyMist(enemy);
                break;
                
            case 'possess':
                this.executeEnemyPossess(enemy, player);
                break;
                
            case 'shield':
                this.executeEnemyShield(enemy);
                break;
                
            case 'bash':
                this.executeEnemyBash(enemy, player);
                break;
                
            case 'judgment':
                this.executeEnemyJudgment(enemy, player);
                break;
                
            case 'command':
                this.executeEnemyCommand(enemy);
                break;
                
            case 'execute':
                this.executeEnemyExecute(enemy, player);
                break;
                
            case 'ritual':
                this.executeEnemyRitual(enemy);
                break;
                
            case 'arcane':
                this.executeEnemyArcane(enemy, player);
                break;
                
            case 'bind':
                this.executeEnemyBind(enemy, player);
                break;
                
            case 'darkness':
                this.executeEnemyDarkness(enemy, player);
                break;
                
            case 'ultimate':
                this.executeEnemyUltimate(enemy, player);
                break;
                
            default:
                console.warn(`Unknown enemy action: ${action}`);
                this.executeEnemyAttack(enemy, player); // Default to attack
        }
        
        // Determine next action
        const updatedEnemy = this.stateManager.getState().battle.enemy;
        
        // FIXED: Add null check before determining next action
        if (updatedEnemy) {
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
        }
        
        // End enemy turn after a short delay
        setTimeout(() => {
            this.processEndOfTurn();
        }, 1000);
    }
    
    // Updated enemy attack to apply buffs correctly
    executeEnemyAttack(enemy, player) {
        // Start with base damage
        let damage = enemy.attack;
        
        // Apply damage modifiers from buffs
        if (enemy.buffs) {
            // Check for ritual buff - increases damage
            const ritualBuff = enemy.buffs.find(buff => buff.type === 'ritual');
            if (ritualBuff) {
                const bonusDamage = Math.floor(damage * ritualBuff.value);
                damage += bonusDamage;
                
                // Show a message about the increased damage
                this.eventBus.emit('message:show', {
                    text: `${enemy.name}'s ritual enhances its attack by ${bonusDamage}!`,
                    type: 'error'
                });
            }
            
            // Check for empowered buff - increases damage
            const empoweredBuff = enemy.buffs.find(buff => buff.type === 'empowered');
            if (empoweredBuff) {
                const bonusDamage = empoweredBuff.value;
                damage += bonusDamage;
                
                // Show a message
                this.eventBus.emit('message:show', {
                    text: `${enemy.name}'s empowered state adds ${bonusDamage} damage!`,
                    type: 'error'
                });
            }
            
            // Check for minion buff - adds extra damage from minions
            const minionBuff = enemy.buffs.find(buff => buff.type === 'minion');
            if (minionBuff) {
                const minionDamage = minionBuff.value;
                damage += minionDamage;
                
                // Show a message
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
            
            // Show defense message
            this.eventBus.emit('message:show', {
                text: `Your defense blocked ${blocked} damage!`,
                type: 'info'
            });
            
            // NEW: Handle reflective shield
            if (defenseBuff.reflect) {
                const reflectDamage = Math.floor(actualDamage * defenseBuff.reflect);
                
                // Apply reflected damage to enemy
                const newEnemyHealth = Math.max(0, enemy.health - reflectDamage);
                
                // Update enemy health
                this.stateManager.updateState({
                    battle: {
                        enemy: {
                            ...enemy,
                            health: newEnemyHealth
                        }
                    }
                });
                
                // Show reflect message
                this.eventBus.emit('message:show', {
                    text: `Your reflective shield returns ${reflectDamage} damage to ${enemy.name}!`,
                    type: 'success'
                });
                
                // Emit damage event
                this.eventBus.emit('enemy:damaged', {
                    amount: reflectDamage,
                    source: 'reflect',
                    player
                });
                
                // Check if enemy was defeated by reflection
                if (newEnemyHealth <= 0) {
                    this.endBattle(true);
                    return; // Exit early to prevent further processing
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
    processTurnEnd() {
        const state = this.stateManager.getState();
        const { battle, player } = state;
        const { enemy } = battle;
        
        // Safety checks
        if (!player || !player.buffs || !enemy || !enemy.buffs) {
            console.warn('Missing player or enemy data in processTurnEnd');
            return;
        }
        
        // Process player buffs - ONLY reduce durations
        let updatedPlayerBuffs = [];
        
        player.buffs.forEach(buff => {
            // Reduce duration
            const newDuration = buff.duration - 1;
            
            if (newDuration <= 0) {
                // Buff expired
                this.eventBus.emit('player:buff-expired', {
                    type: buff.type
                });
                
                // If it was a significant buff, show a message
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
        
        // Process enemy buffs - ONLY reduce durations
        let updatedEnemyBuffs = [];
        
        enemy.buffs.forEach(buff => {
            // Reduce duration
            const newDuration = buff.duration - 1;
            
            if (newDuration <= 0) {
                // Buff expired
                this.eventBus.emit('enemy:buff-expired', {
                    type: buff.type
                });
                
                // If it was a significant buff, show a message
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
                buffs: updatedPlayerBuffs
            },
            battle: {
                enemy: {
                    ...enemy,
                    buffs: updatedEnemyBuffs
                }
            }
        });
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
    
    // Determine enemy's next action
    determineEnemyAction(enemy) {
        // FIXED: Add null check to prevent errors when enemy is null
        if (!enemy) {
            console.warn('Cannot determine action: enemy is null');
            return 'attack'; // Default fallback action
        }

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
    // Enemy bite action (wolf - stronger attack with chance to stun)
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

    // Enemy charm action (vampire - take control of player for one turn)
    executeEnemyCharm(enemy, player) {
        // Apply charmed debuff
        const charmedBuff = {
            type: 'charmed',
            duration: 1
        };
        
        // Remove any existing charmed buff before adding new one
        let newBuffs = player.buffs.filter(b => b.type !== 'charmed');
        newBuffs.push(charmedBuff);
        
        // Update state
        this.stateManager.updateState({
            player: {
                buffs: newBuffs
            }
        });
        
        // Emit event
        this.eventBus.emit('message:show', {
            text: `${enemy.name} charms you! You'll be under their control next turn!`,
            type: 'error'
        });
        
        // NOTE: The actual control effect would be implemented in player turn processing
        // This would cause the player to attack themselves or use a gem against themselves
    }

    // Enemy mist action (vampire - becomes untargetable)
    executeEnemyMist(enemy) {
        // Apply mist buff (untargetable)
        const mistBuff = {
            type: 'mist',
            duration: 1
        };
        
        // Remove any existing mist buff before adding new one
        const newBuffs = enemy.buffs.filter(b => b.type !== 'mist');
        newBuffs.push(mistBuff);
        
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
        this.eventBus.emit('message:show', {
            text: `${enemy.name} transforms into mist and becomes untargetable for 1 turn!`,
            type: 'error'
        });
    }

    // Enemy possess action (wraith - use player's gems against them)
    executeEnemyPossess(enemy, player) {
        const state = this.stateManager.getState();
        const { hand } = state.gems;
        
        if (hand.length === 0) {
            // No gems to possess
            this.eventBus.emit('message:show', {
                text: `${enemy.name} attempts to possess a gem, but you have none!`,
                type: 'success'
            });
            return;
        }
        
        // Find an attack gem if possible
        const attackGem = hand.find(gem => gem.type === 'attack');
        
        if (attackGem) {
            // Use the attack gem against the player
            let damage = attackGem.value;
            
            // Apply class bonus if applicable (assuming the player's class)
            const playerClass = player.class;
            if ((playerClass === 'knight' && attackGem.color === 'red') ||
                (playerClass === 'mage' && attackGem.color === 'blue') ||
                (playerClass === 'rogue' && attackGem.color === 'green')) {
                damage = Math.floor(damage * 1.5); // 50% bonus
            }
            
            // Apply damage to player
            const newHealth = Math.max(0, player.health - damage);
            
            // Update state
            this.stateManager.updateState({
                player: {
                    health: newHealth
                }
            });
            
            // Emit events
            this.eventBus.emit('player:damaged', {
                amount: damage,
                source: 'enemy-possess',
                enemy
            });
            
            this.eventBus.emit('message:show', {
                text: `${enemy.name} possesses your ${attackGem.name} gem and uses it against you for ${damage} damage!`,
                type: 'error'
            });
            
            // Check for defeat
            if (newHealth <= 0) {
                this.endBattle(false);
            }
        } else {
            // No attack gem, just possess a random gem
            const randomIndex = Math.floor(Math.random() * hand.length);
            const randomGem = hand[randomIndex];
            
            // Apply possessed debuff to a random gem
            const newHand = [...hand];
            newHand[randomIndex] = {
                ...randomGem,
                possessed: true // Mark as possessed so it fails when used
            };
            
            // Update state
            this.stateManager.updateState({
                gems: {
                    ...state.gems,
                    hand: newHand
                }
            });
            
            // Emit event
            this.eventBus.emit('message:show', {
                text: `${enemy.name} possesses your ${randomGem.name} gem! It will fail when used!`,
                type: 'error'
            });
        }
    }

    // Enemy shield action (castle guardian - strong defense)
    executeEnemyShield(enemy) {
        // Apply very strong defense buff
        const defenseValue = Math.floor(enemy.attack * 2);
        const defenseBuff = {
            type: 'defense',
            value: defenseValue,
            duration: 2
        };
        
        // Remove any existing defense buff before adding new one
        const newBuffs = enemy.buffs.filter(b => b.type !== 'defense');
        newBuffs.push(defenseBuff);
        
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
        this.eventBus.emit('message:show', {
            text: `${enemy.name} raises its magical shield, gaining ${defenseValue} defense for 2 turns!`,
            type: 'error'
        });
    }

    // Enemy bash action (castle guardian - damage + stun)
    executeEnemyBash(enemy, player) {
        // Deal moderate damage with high stun chance
        let damage = Math.floor(enemy.attack * 1.2);
        let actualDamage = damage;
        
        // Check for defense buff
        const defenseBuff = player.buffs.find(buff => buff.type === 'defense');
        if (defenseBuff) {
            actualDamage = Math.max(1, damage - defenseBuff.value);
        }
        
        // Apply damage to player
        const newHealth = Math.max(0, player.health - actualDamage);
        
        // 60% chance to stun
        const willStun = Math.random() < 0.6;
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
                text: `${enemy.name}'s shield bash stuns you!`,
                type: 'error'
            });
        }
        
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
            blocked: damage - actualDamage,
            source: 'enemy-bash',
            enemy
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }

    // Enemy judgment action (castle guardian - damage based on player's gems)
    executeEnemyJudgment(enemy, player) {
        const state = this.stateManager.getState();
        const { hand } = state.gems;
        
        // Base damage
        let damage = Math.floor(enemy.attack * 1.0);
        
        // Additional damage based on gems in hand
        damage += hand.length * Math.floor(enemy.attack * 0.3);
        
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
        
        // Emit events
        this.eventBus.emit('player:damaged', {
            amount: actualDamage,
            blocked: damage - actualDamage,
            source: 'enemy-judgment',
            enemy
        });
        
        this.eventBus.emit('message:show', {
            text: `${enemy.name}'s judgment strikes you for ${actualDamage} damage, amplified by your ${hand.length} gems!`,
            type: 'error'
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }

    // Enemy command action (dark general - summons minions)
    executeEnemyCommand(enemy) {
        // Summon stronger minions
        const minionBuff = {
            type: 'minion',
            value: Math.floor(enemy.attack * 0.6),
            duration: 3
        };
        
        // Remove any existing minion buff before adding new one
        const newBuffs = enemy.buffs.filter(b => b.type !== 'minion');
        newBuffs.push(minionBuff);
        
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
        this.eventBus.emit('message:show', {
            text: `${enemy.name} commands their troops! Powerful minions appear!`,
            type: 'error'
        });
    }

    // Enemy execute action (dark general/dark lord - high damage to low health player)
    executeEnemyExecute(enemy, player) {
        // Calculate health percentage
        const healthPercent = player.health / player.maxHealth;
        
        // Base damage
        let damage = Math.floor(enemy.attack * 1.5);
        
        // Bonus damage if player is below 30% health
        if (healthPercent < 0.3) {
            damage = Math.floor(damage * 2.0); // Double damage
            this.eventBus.emit('message:show', {
                text: `${enemy.name} senses your weakness! Execution damage doubled!`,
                type: 'error'
            });
        }
        
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
        
        // Emit events
        this.eventBus.emit('player:damaged', {
            amount: actualDamage,
            blocked: damage - actualDamage,
            source: 'enemy-execute',
            enemy
        });
        
        this.eventBus.emit('message:show', {
            text: `${enemy.name} attempts to execute you, dealing ${actualDamage} damage!`,
            type: 'error'
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }

    // Enemy ritual action (royal dark mage - buffs the Dark Lord)
    executeEnemyRitual(enemy) {
        // This would normally prepare a buff for the Dark Lord
        // Since we don't have multi-enemy battles, we'll just buff the mage
        
        // Apply ritual buff
        const ritualBuff = {
            type: 'ritual',
            value: Math.floor(enemy.attack * 0.2), // 20% bonus to damage
            duration: 3
        };
        
        // Remove any existing ritual buff before adding new one
        const newBuffs = enemy.buffs.filter(b => b.type !== 'ritual');
        newBuffs.push(ritualBuff);
        
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
        this.eventBus.emit('message:show', {
            text: `${enemy.name} performs a dark ritual, increasing their power for 3 turns!`,
            type: 'error'
        });
    }

    // Enemy arcane action (royal dark mage - high magic damage)
    executeEnemyArcane(enemy, player) {
        // Deal very high magic damage
        let damage = Math.floor(enemy.attack * 1.8);
        let actualDamage = damage;
        
        // Check for defense buff (arcane partially ignores defense)
        const defenseBuff = player.buffs.find(buff => buff.type === 'defense');
        if (defenseBuff) {
            const reducedDefense = Math.floor(defenseBuff.value * 0.7); // 30% defense penetration
            actualDamage = Math.max(1, damage - reducedDefense);
        }
        
        // Apply damage to player
        const newHealth = Math.max(0, player.health - actualDamage);
        
        // Update state
        this.stateManager.updateState({
            player: {
                health: newHealth
            }
        });
        
        // Emit events
        this.eventBus.emit('player:damaged', {
            amount: actualDamage,
            blocked: damage - actualDamage,
            source: 'enemy-arcane',
            enemy
        });
        
        this.eventBus.emit('message:show', {
            text: `${enemy.name} unleashes arcane energy, dealing ${actualDamage} damage with partial defense penetration!`,
            type: 'error'
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }

    // Enemy bind action (royal dark mage - disables a random gem color)
    executeEnemyBind(enemy, player) {
        const state = this.stateManager.getState();
        const { hand } = state.gems;
        
        // Get all unique colors in the player's hand
        const colors = [...new Set(hand.map(gem => gem.color))];
        
        if (colors.length === 0) {
            // No gems to bind
            this.eventBus.emit('message:show', {
                text: `${enemy.name} attempts to bind your gems, but you have none!`,
                type: 'success'
            });
            return;
        }
        
        // Select a random color to bind
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Apply binding debuff to enemy (store which color is bound)
        const bindBuff = {
            type: 'binding',
            value: randomColor,
            duration: 2
        };
        
        // Remove any existing binding buff before adding new one
        const newBuffs = enemy.buffs.filter(b => b.type !== 'binding');
        newBuffs.push(bindBuff);
        
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
        this.eventBus.emit('message:show', {
            text: `${enemy.name} binds your ${randomColor} gems! They cannot be used for 2 turns!`,
            type: 'error'
        });
        
        // NOTE: The actual implementation of the bind effect would be in the gem playing logic
    }

    // Enemy eclipse action (avatar of darkness - AoE damage + debuff)
    executeEnemyEclipse(enemy, player) {
        // Deal high AoE damage
        let damage = Math.floor(enemy.attack * 1.4);
        let actualDamage = damage;
        
        // Check for defense buff
        const defenseBuff = player.buffs.find(buff => buff.type === 'defense');
        if (defenseBuff) {
            actualDamage = Math.max(1, damage - defenseBuff.value);
        }
        
        // Apply damage to player
        const newHealth = Math.max(0, player.health - actualDamage);
        
        // Apply darkened debuff (reduced vision/accuracy)
        const darkenedBuff = {
            type: 'darkened',
            value: 0.3, // 30% chance to miss
            duration: 2
        };
        
        // Remove any existing darkened buff before adding new one
        let newBuffs = player.buffs.filter(b => b.type !== 'darkened');
        newBuffs.push(darkenedBuff);
        
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
            blocked: damage - actualDamage,
            source: 'enemy-eclipse',
            enemy
        });
        
        this.eventBus.emit('message:show', {
            text: `${enemy.name} creates a dark eclipse, dealing ${actualDamage} damage and reducing your accuracy for 2 turns!`,
            type: 'error'
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }

    // Enemy void action (avatar of darkness - reduce player stamina)
    executeEnemyVoid(enemy, player) {
        // Reduce player's stamina
        const staminaLoss = Math.min(player.stamina, 2);
        const newStamina = player.stamina - staminaLoss;
        
        // Apply void debuff (reduced stamina recovery)
        const voidBuff = {
            type: 'void',
            value: 0.5, // 50% reduced stamina recovery
            duration: 2
        };
        
        // Remove any existing void buff before adding new one
        let newBuffs = player.buffs.filter(b => b.type !== 'void');
        newBuffs.push(voidBuff);
        
        // Update state
        this.stateManager.updateState({
            player: {
                stamina: newStamina,
                buffs: newBuffs
            }
        });
        
        // Emit event
        this.eventBus.emit('message:show', {
            text: `${enemy.name} draws you into the void, draining ${staminaLoss} stamina and reducing recovery for 2 turns!`,
            type: 'error'
        });
    }

    // Enemy snipe action (shadow hunter - targeted attack at weakness)
    executeEnemySnipe(enemy, player) {
        // Calculate damage - ignores some defense
        let damage = Math.floor(enemy.attack * 1.3);
        let actualDamage = damage;
        
        // Check for defense buff - snipe ignores 50% of defense
        const defenseBuff = player.buffs.find(buff => buff.type === 'defense');
        if (defenseBuff) {
            const reducedDefense = Math.floor(defenseBuff.value * 0.5);
            actualDamage = Math.max(1, damage - reducedDefense);
        }
        
        // Apply damage to player
        const newHealth = Math.max(0, player.health - actualDamage);
        
        // Update state
        this.stateManager.updateState({
            player: {
                health: newHealth
            }
        });
        
        // Emit events
        this.eventBus.emit('player:damaged', {
            amount: actualDamage,
            blocked: damage - actualDamage,
            source: 'enemy-snipe',
            enemy
        });
        
        this.eventBus.emit('message:show', {
            text: `${enemy.name} finds your weak spot and snipes for ${actualDamage} damage, bypassing some of your defense!`,
            type: 'error'
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }

    // Enemy trap action (shadow hunter - reduces player stamina)
    executeEnemyTrap(enemy, player) {
        // Apply trapped debuff
        const trappedBuff = {
            type: 'trapped',
            value: 1, // Increases stamina cost by 1
            duration: 2
        };
        
        // Remove any existing trapped buff before adding new one
        let newBuffs = player.buffs.filter(b => b.type !== 'trapped');
        newBuffs.push(trappedBuff);
        
        // Update state
        this.stateManager.updateState({
            player: {
                buffs: newBuffs
            }
        });
        
        // Emit event
        this.eventBus.emit('message:show', {
            text: `${enemy.name} sets a trap! Your gems will cost +1 stamina for 2 turns!`,
            type: 'error'
        });
    }

    // Enemy track action (shadow hunter - increases future hit chance)
    executeEnemyTrack(enemy, player) {
        // Apply tracked debuff
        const trackedBuff = {
            type: 'tracked',
            value: 0.2, // Enemy has 20% increased chance to hit
            duration: 3
        };
        
        // Add a buff to the enemy that increases accuracy
        const trackingBuff = {
            type: 'tracking',
            value: 0.2, // 20% increased hit chance
            duration: 3
        };
        
        // Remove any existing tracking buff before adding new one
        const newEnemyBuffs = enemy.buffs.filter(b => b.type !== 'tracking');
        newEnemyBuffs.push(trackingBuff);
        
        // Update state
        this.stateManager.updateState({
            battle: {
                enemy: {
                    ...enemy,
                    buffs: newEnemyBuffs
                }
            }
        });
        
        // Emit event
        this.eventBus.emit('message:show', {
            text: `${enemy.name} tracks your movements, increasing its accuracy for the next 3 turns!`,
            type: 'error'
        });
    }

    // Enemy meteor action (astral sorcerer - high damage AoE)
    executeEnemyMeteor(enemy, player) {
        // Deal very high AoE damage
        let damage = Math.floor(enemy.attack * 1.8);
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
        
        // Emit events
        this.eventBus.emit('player:damaged', {
            amount: actualDamage,
            blocked: damage - actualDamage,
            source: 'enemy-meteor',
            enemy
        });
        
        this.eventBus.emit('message:show', {
            text: `${enemy.name} summons a meteor shower, dealing ${actualDamage} massive damage!`,
            type: 'error'
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }

    // Enemy banish action (astral sorcerer - removes a random gem)
    executeEnemyBanish(enemy, player) {
        const state = this.stateManager.getState();
        const { hand } = state.gems;
        
        if (hand.length === 0) {
            // No gems to banish
            this.eventBus.emit('message:show', {
                text: `${enemy.name} attempts to banish a gem, but you have none!`,
                type: 'success'
            });
            return;
        }
        
        // Select a random gem to banish
        const randomIndex = Math.floor(Math.random() * hand.length);
        const banishedGem = hand[randomIndex];
        
        // Remove the gem from hand
        const newHand = [...hand.slice(0, randomIndex), ...hand.slice(randomIndex + 1)];
        
        // Move the gem to discarded pile
        const newDiscarded = [...state.gems.discarded, banishedGem];
        
        // Update state
        this.stateManager.updateState({
            gems: {
                ...state.gems,
                hand: newHand,
                discarded: newDiscarded
            }
        });
        
        // Emit event
        this.eventBus.emit('message:show', {
            text: `${enemy.name} banishes your ${banishedGem.name} gem to another dimension!`,
            type: 'error'
        });
    }

    // Enemy warp action (astral sorcerer - skips turn but gains buff)
    executeEnemyWarp(enemy) {
        // Apply several buffs
        const attackBuff = {
            type: 'empowered',
            value: Math.floor(enemy.attack * 0.4),
            duration: 2
        };
        
        const defenseBuff = {
            type: 'defense',
            value: Math.floor(enemy.attack * 0.8),
            duration: 2
        };
        
        // Remove any existing buffs of these types before adding new ones
        let newBuffs = enemy.buffs.filter(b => b.type !== 'empowered' && b.type !== 'defense');
        newBuffs.push(attackBuff, defenseBuff);
        
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
        this.eventBus.emit('message:show', {
            text: `${enemy.name} warps reality, gaining enhanced attack and defense for 2 turns!`,
            type: 'error'
        });
    }

    // Enemy smash action (ancient titan - high damage)
    executeEnemySmash(enemy, player) {
        // Deal extremely high damage
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
                health: newHealth
            }
        });
        
        // Emit events
        this.eventBus.emit('player:damaged', {
            amount: actualDamage,
            blocked: damage - actualDamage,
            source: 'enemy-smash',
            enemy
        });
        
        this.eventBus.emit('message:show', {
            text: `${enemy.name} smashes down with tremendous force, dealing ${actualDamage} devastating damage!`,
            type: 'error'
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }

    // Enemy roar action (ancient titan - reduces stats and damages)
    executeEnemyRoar(enemy, player) {
        // Deal some damage
        let damage = Math.floor(enemy.attack * 0.7);
        let actualDamage = damage;
        
        // Check for defense buff
        const defenseBuff = player.buffs.find(buff => buff.type === 'defense');
        if (defenseBuff) {
            actualDamage = Math.max(1, damage - defenseBuff.value);
        }
        
        // Apply damage to player
        const newHealth = Math.max(0, player.health - actualDamage);
        
        // Apply weakened debuff
        const weakenedBuff = {
            type: 'weakened',
            value: 0.3, // 30% reduced damage
            duration: 2
        };
        
        // Remove any existing weakened buff before adding new one
        let newBuffs = player.buffs.filter(b => b.type !== 'weakened');
        newBuffs.push(weakenedBuff);
        
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
            blocked: damage - actualDamage,
            source: 'enemy-roar',
            enemy
        });
        
        this.eventBus.emit('message:show', {
            text: `${enemy.name}'s deafening roar deals ${actualDamage} damage and weakens you for 2 turns!`,
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
        let newBuffs = player.buffs.filter(b => b.type !== 'bleeding');
        newBuffs.push(bleedingBuff);
        
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
        let newBuffs = player.buffs.filter(b => b.type !== 'webbed');
        newBuffs.push(webbedBuff);
        
        // Update state
        this.stateManager.updateState({
            player: {
                buffs: newBuffs
            }
        });
        
        // Emit event
        this.eventBus.emit('message:show', {
            text: `${enemy.name}'s web reduces your stamina recovery for 2 turns!`,
            type: 'error'
        });
    }

    // Enemy split action (slime - creates a weaker copy)
    executeEnemySplit(enemy) {
        // Add minion buff which adds extra damage
        const minionBuff = {
            type: 'minion',
            value: Math.floor(enemy.attack * 0.4),
            duration: 3
        };
        
        // Remove any existing minion before adding new one
        const newBuffs = enemy.buffs.filter(b => b.type !== 'minion');
        newBuffs.push(minionBuff);
        
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
        this.eventBus.emit('message:show', {
            text: `${enemy.name} splits into two! A mini-slime appears!`,
            type: 'error'
        });
    }

    // Enemy toxic action (slime - stronger poison)
    executeEnemyToxic(enemy, player) {
        // Apply toxic debuff to player (stronger poison)
        const poisonValue = Math.floor(enemy.attack * 0.4);
        const poisonBuff = {
            type: 'poison',
            value: poisonValue,
            duration: 4
        };
        
        // Remove any existing poison before adding new one
        let newBuffs = player.buffs.filter(b => b.type !== 'poison');
        newBuffs.push(poisonBuff);
        
        // Update state
        this.stateManager.updateState({
            player: {
                buffs: newBuffs
            }
        });
        
        // Emit event
        this.eventBus.emit('message:show', {
            text: `${enemy.name}'s toxic sludge poisons you (${poisonValue} damage/turn for 4 turns)!`,
            type: 'error'
        });
    }

    // Enemy rally action (bandit leader - summons help)
    executeEnemyRally(enemy) {
        // Add stronger minion buff that lasts longer
        const minionBuff = {
            type: 'minion',
            value: Math.floor(enemy.attack * 0.5),
            duration: 4
        };
        
        // Remove any existing minion before adding new one
        const newBuffs = enemy.buffs.filter(b => b.type !== 'minion');
        newBuffs.push(minionBuff);
        
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
        this.eventBus.emit('message:show', {
            text: `${enemy.name} rallies its allies! A bandit appears to help!`,
            type: 'error'
        });
    }

    // Enemy phase action (phantom - temporary invulnerability)
    executeEnemyPhase(enemy) {
        // Add phase buff (temporary invulnerability)
        const phaseBuff = {
            type: 'phased',
            duration: 1 // Lasts until enemy's next turn
        };
        
        // Remove any existing phase buff before adding new one
        const newBuffs = enemy.buffs.filter(b => b.type !== 'phased');
        newBuffs.push(phaseBuff);
        
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
        this.eventBus.emit('message:show', {
            text: `${enemy.name} phases out of reality! It's temporarily invulnerable!`,
            type: 'error'
        });
    }

    // Enemy haunt action (phantom - reduces player damage)
    executeEnemyHaunt(enemy, player) {
        // Apply haunted debuff to player (reduces damage dealt)
        const hauntedBuff = {
            type: 'haunted',
            value: 0.5, // 50% damage reduction
            duration: 2
        };
        
        // Remove any existing haunted buff before adding new one
        let newBuffs = player.buffs.filter(b => b.type !== 'haunted');
        newBuffs.push(hauntedBuff);
        
        // Update state
        this.stateManager.updateState({
            player: {
                buffs: newBuffs
            }
        });
        
        // Emit event
        this.eventBus.emit('message:show', {
            text: `${enemy.name}'s haunt reduces your damage by 50% for 2 turns!`,
            type: 'error'
        });
    }

    // Enemy hex action (witch - random debuff)
    executeEnemyHex(enemy, player) {
        // Choose a random debuff type
        const hexTypes = [
            { type: 'weakened', value: 0.3, duration: 2, text: 'weakened (30% less damage)' },
            { type: 'slowed', value: 0.5, duration: 2, text: 'slowed (50% less stamina recovery)' },
            { type: 'confused', value: 0.3, duration: 2, text: 'confused (30% chance to fail gem use)' }
        ];
        
        const randomHex = hexTypes[Math.floor(Math.random() * hexTypes.length)];
        
        // Apply hex debuff
        let newBuffs = player.buffs.filter(b => b.type !== randomHex.type);
        newBuffs.push({
            type: randomHex.type,
            value: randomHex.value,
            duration: randomHex.duration
        });
        
        // Update state
        this.stateManager.updateState({
            player: {
                buffs: newBuffs
            }
        });
        
        // Emit event
        this.eventBus.emit('message:show', {
            text: `${enemy.name}'s hex makes you ${randomHex.text} for ${randomHex.duration} turns!`,
            type: 'error'
        });
    }

    // Enemy crush action (troll - high damage attack)
    executeEnemyCrush(enemy, player) {
        // Deal high damage
        let damage = Math.floor(enemy.attack * 1.7);
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
        
        // Emit events
        this.eventBus.emit('player:damaged', {
            amount: actualDamage,
            blocked: damage - actualDamage,
            source: 'enemy-crush',
            enemy
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }

    // Enemy regenerate action (troll - healing over time)
    executeEnemyRegenerate(enemy) {
        // Apply regeneration buff
        const regenValue = Math.floor(enemy.maxHealth * 0.1);
        const regenBuff = {
            type: 'regenerating',
            value: regenValue,
            duration: 3
        };
        
        // Remove any existing regen buff before adding new one
        const newBuffs = enemy.buffs.filter(b => b.type !== 'regenerating');
        newBuffs.push(regenBuff);
        
        // Heal a bit immediately
        const immediateHeal = Math.floor(enemy.maxHealth * 0.05);
        const newHealth = Math.min(enemy.maxHealth, enemy.health + immediateHeal);
        
        // Update state
        this.stateManager.updateState({
            battle: {
                enemy: {
                    ...enemy,
                    health: newHealth,
                    buffs: newBuffs
                }
            }
        });
        
        // Emit events
        this.eventBus.emit('enemy:healed', {
            amount: immediateHeal,
            enemy
        });
        
        this.eventBus.emit('message:show', {
            text: `${enemy.name} begins regenerating (${regenValue} health/turn for 3 turns)!`,
            type: 'error'
        });
    }

    // Enemy earthquake action (golem - AoE damage with chance to stun)
    executeEnemyEarthquake(enemy, player) {
        // Deal moderate damage
        let damage = Math.floor(enemy.attack * 1.2);
        let actualDamage = damage;
        
        // Check for defense buff
        const defenseBuff = player.buffs.find(buff => buff.type === 'defense');
        if (defenseBuff) {
            actualDamage = Math.max(1, damage - defenseBuff.value);
        }
        
        // Apply damage to player
        const newHealth = Math.max(0, player.health - actualDamage);
        
        // 25% chance to stun
        const willStun = Math.random() < 0.25;
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
                text: `${enemy.name}'s earthquake stuns you!`,
                type: 'error'
            });
        }
        
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
            blocked: damage - actualDamage,
            source: 'enemy-earthquake',
            enemy
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }

    // Enemy drain action (enchanter/vampire/lich - steals health)
    executeEnemyDrain(enemy, player) {
        // Calculate drain amount
        let drainAmount = Math.floor(enemy.attack * 0.8);
        let actualDamage = drainAmount;
        
        // Check for defense buff
        const defenseBuff = player.buffs.find(buff => buff.type === 'defense');
        if (defenseBuff) {
            actualDamage = Math.max(1, drainAmount - defenseBuff.value);
        }
        
        // Apply damage to player
        const newPlayerHealth = Math.max(0, player.health - actualDamage);
        
        // Heal enemy for the damage dealt
        const newEnemyHealth = Math.min(enemy.maxHealth, enemy.health + actualDamage);
        
        // Update state
        this.stateManager.updateState({
            player: {
                health: newPlayerHealth
            },
            battle: {
                enemy: {
                    ...enemy,
                    health: newEnemyHealth
                }
            }
        });
        
        // Emit events
        this.eventBus.emit('player:damaged', {
            amount: actualDamage,
            blocked: drainAmount - actualDamage,
            source: 'enemy-drain',
            enemy
        });
        
        this.eventBus.emit('enemy:healed', {
            amount: actualDamage,
            enemy
        });
        
        this.eventBus.emit('message:show', {
            text: `${enemy.name} drains ${actualDamage} health from you!`,
            type: 'error'
        });
        
        // Check for defeat
        if (newPlayerHealth <= 0) {
            this.endBattle(false);
        }
    }

    // Enemy enchant action (enchanter - buffs golem if present)
    executeEnemyEnchant(enemy) {
        // This is a specialized skill that would normally check for a golem
        // in a multi-enemy battle system. For our single enemy system, just self-buff
        
        // Apply enchanted buff
        const enchantedBuff = {
            type: 'enchanted',
            value: Math.floor(enemy.attack * 0.3),
            duration: 3
        };
        
        // Remove any existing enchanted buff before adding new one
        const newBuffs = enemy.buffs.filter(b => b.type !== 'enchanted');
        newBuffs.push(enchantedBuff);
        
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
        this.eventBus.emit('message:show', {
            text: `${enemy.name} casts a spell of enhancement, increasing damage by 30% for 3 turns!`,
            type: 'error'
        });
    }

    // Enemy teleport action (enchanter - skips turn but gains defense)
    executeEnemyTeleport(enemy) {
        // Apply defense buff
        const defenseValue = Math.floor(enemy.attack * 1.5);
        const defenseBuff = {
            type: 'defense',
            value: defenseValue,
            duration: 2
        };
        
        // Remove any existing defense buff before adding new one
        const newBuffs = enemy.buffs.filter(b => b.type !== 'defense');
        newBuffs.push(defenseBuff);
        
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
        this.eventBus.emit('message:show', {
            text: `${enemy.name} teleports to safety, gaining ${defenseValue} defense for 2 turns!`,
            type: 'error'
        });
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

    // Enemy ignite action (fire elemental - DoT)
    executeEnemyIgnite(enemy, player) {
        // Apply burning debuff to player
        const burnValue = Math.floor(enemy.attack * 0.3);
        const burnBuff = {
            type: 'burning',
            value: burnValue,
            duration: 3
        };
        
        // Remove any existing burning buff before adding new one
        let newBuffs = player.buffs.filter(b => b.type !== 'burning');
        newBuffs.push(burnBuff);
        
        // Also deal some immediate damage
        let damage = Math.floor(enemy.attack * 0.7);
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
                health: newHealth,
                buffs: newBuffs
            }
        });
        
        // Emit events
        this.eventBus.emit('player:damaged', {
            amount: actualDamage,
            blocked: damage - actualDamage,
            source: 'enemy-ignite',
            enemy
        });
        
        this.eventBus.emit('message:show', {
            text: `${enemy.name} ignites you, dealing ${actualDamage} damage and causing burning (${burnValue} damage/turn for 3 turns)!`,
            type: 'error'
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }

    // Enemy heatwave action (fire elemental - AoE damage)
    executeEnemyHeatwave(enemy, player) {
        // Deal high AoE damage
        let damage = Math.floor(enemy.attack * 1.5);
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
        
        // Emit events
        this.eventBus.emit('player:damaged', {
            amount: actualDamage,
            blocked: damage - actualDamage,
            source: 'enemy-heatwave',
            enemy
        });
        
        this.eventBus.emit('message:show', {
            text: `${enemy.name} unleashes a scorching heatwave, dealing ${actualDamage} damage!`,
            type: 'error'
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }

    // Enemy parry action (fallen knight - reflects damage)
    executeEnemyParry(enemy) {
        // Apply parry buff
        const parryBuff = {
            type: 'parrying',
            value: Math.floor(enemy.attack * 0.5), // Reflect 50% of incoming damage
            duration: 1
        };
        
        // Remove any existing parry buff before adding new one
        const newBuffs = enemy.buffs.filter(b => b.type !== 'parrying');
        newBuffs.push(parryBuff);
        
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
        this.eventBus.emit('message:show', {
            text: `${enemy.name} takes a defensive stance, ready to parry your next attack!`,
            type: 'error'
        });
    }

    // Enemy charge action (fallen knight - high damage after delay)
    executeEnemyCharge(enemy, player) {
        // This would normally set up a delayed attack, but since our system doesn't
        // have an elegant way to do that, we'll just have it do a strong attack with a "tell"
        
        this.eventBus.emit('message:show', {
            text: `${enemy.name} begins charging a powerful attack!`,
            type: 'error'
        });
        
        // Small delay for effect
        setTimeout(() => {
            // Deal massive damage
            let damage = Math.floor(enemy.attack * 2);
            let actualDamage = damage;
            
            // Get updated player state for proper defense calculation
            const state = this.stateManager.getState();
            const currentPlayer = state.player;
            
            // Check for defense buff
            const defenseBuff = currentPlayer.buffs.find(buff => buff.type === 'defense');
            if (defenseBuff) {
                actualDamage = Math.max(1, damage - defenseBuff.value);
            }
            
            // Apply damage to player
            const newHealth = Math.max(0, currentPlayer.health - actualDamage);
            
            // Update state
            this.stateManager.updateState({
                player: {
                    health: newHealth
                }
            });
            
            // Emit events
            this.eventBus.emit('player:damaged', {
                amount: actualDamage,
                blocked: damage - actualDamage,
                source: 'enemy-charge',
                enemy
            });
            
            this.eventBus.emit('message:show', {
                text: `${enemy.name}'s charge attack hits you for ${actualDamage} damage!`,
                type: 'error'
            });
            
            // Check for defeat
            if (newHealth <= 0) {
                this.endBattle(false);
            }
        }, 1000);
    }

    // Enemy revive action (lich - resurrect once from death)
    executeEnemyRevive(enemy) {
        // Apply revive buff
        const reviveBuff = {
            type: 'revival',
            value: 0.5, // Revive with 50% health
            duration: 99 // Effectively permanent until used
        };
        
        // Remove any existing revival buff before adding new one
        const newBuffs = enemy.buffs.filter(b => b.type !== 'revival');
        newBuffs.push(reviveBuff);
        
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
        this.eventBus.emit('message:show', {
            text: `${enemy.name} casts a spell of undeath. It will resurrect once if defeated!`,
            type: 'error'
        });
    }

    // Enemy fireball action (demon - high damage)
    executeEnemyFireball(enemy, player) {
        // Deal high damage
        let damage = Math.floor(enemy.attack * 1.6);
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
        
        // Emit events
        this.eventBus.emit('player:damaged', {
            amount: actualDamage,
            blocked: damage - actualDamage,
            source: 'enemy-fireball',
            enemy
        });
        
        this.eventBus.emit('message:show', {
            text: `${enemy.name} launches a massive fireball, dealing ${actualDamage} damage!`,
            type: 'error'
        });
        
        // Check for defeat
        if (newHealth <= 0) {
            this.endBattle(false);
        }
    }

    // Enemy tempt action (demon - steal gems)
    executeEnemyTempt(enemy, player) {
        // In our system, we can't actually steal gems permanently
        // so we'll simulate by making the player discard a gem randomly
        
        const state = this.stateManager.getState();
        const { hand } = state.gems;
        
        if (hand.length === 0) {
            // No gems to steal
            this.eventBus.emit('message:show', {
                text: `${enemy.name} attempts to steal a gem, but you have none!`,
                type: 'success'
            });
            return;
        }
        
        // Store the number of stolen gems for consume ability
        enemy.stolenGems = (enemy.stolenGems || 0) + 1;
        
        // Flag a random gem as "corrupted" - it will fail when used
        const randomIndex = Math.floor(Math.random() * hand.length);
        const corruptedGem = hand[randomIndex];
        
        // Apply a corruption effect to the gem
        const updatedHand = [...hand];
        updatedHand[randomIndex] = {
            ...corruptedGem,
            corrupted: true
        };
        
        // Update state
        this.stateManager.updateState({
            gems: {
                ...state.gems,
                hand: updatedHand
            },
            battle: {
                enemy: {
                    ...enemy,
                    stolenGems: enemy.stolenGems
                }
            }
        });
        
        // Emit event
        this.eventBus.emit('message:show', {
            text: `${enemy.name} corrupts your ${corruptedGem.name} gem! It will fail when used!`,
            type: 'error'
        });
    }

    // Enemy consume action (demon - restore health based on stolen gems)
    executeEnemyConsume(enemy) {
        // Heal based on the number of gems stolen
        const stolenCount = enemy.stolenGems || 0;
        
        if (stolenCount === 0) {
            this.eventBus.emit('message:show', {
                text: `${enemy.name} tries to consume energy but has none stored!`,
                type: 'success'
            });
            return;
        }
        
        // Heal amount based on attack and number of stolen gems
        const healAmount = Math.floor(enemy.attack * 0.5 * stolenCount);
        const newHealth = Math.min(enemy.maxHealth, enemy.health + healAmount);
        
        // Reset the stolen gems counter
        enemy.stolenGems = 0;
        
        // Update state
        this.stateManager.updateState({
            battle: {
                enemy: {
                    ...enemy,
                    health: newHealth,
                    stolenGems: 0
                }
            }
        });
        
        // Emit event
        this.eventBus.emit('enemy:healed', {
            amount: healAmount,
            enemy
        });
        
        this.eventBus.emit('message:show', {
            text: `${enemy.name} consumes the stolen energy and heals for ${healAmount} health!`,
            type: 'error'
        });
    }
}