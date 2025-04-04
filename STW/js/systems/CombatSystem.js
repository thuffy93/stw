// Combat System - Handles battle mechanics in the ECS architecture
import { System } from '../core/ecs/System.js';
import { EntityManager } from '../core/ecs/EntityManager.js';
import { ComponentFactory } from '../core/ecs/ComponentFactory.js';
import { EventBus } from '../core/eventbus.js';
import { Utils } from '../core/utils.js';
import { Config } from '../core/config.js';

/**
 * CombatSystem - Manages battle mechanics and interactions
 */
export class CombatSystem extends System {
    constructor() {
        super('CombatSystem');
        this.currentBattleId = null;
    }
    
    /**
     * Get event handlers for this system
     * @returns {Map} Map of event names to handler functions
     */
    getEventHandlers() {
        const handlers = new Map();
        
        handlers.set('BATTLE_INIT', this.handleBattleInit);
        handlers.set('GEM_PLAYED', this.handleGemPlayed);
        handlers.set('END_TURN', this.handleEndTurn);
        handlers.set('WAIT_TURN', this.handleWaitTurn);
        handlers.set('DISCARD_AND_END', this.handleDiscardAndEnd);
        handlers.set('FLEE_BATTLE', this.handleFleeBattle);
        
        return handlers;
    }
    
    /**
     * Initialize a new battle
     * @param {Object} data - Battle initialization data
     */
    handleBattleInit(data) {
        console.log('Initializing battle in ECS architecture');
        
        // Create a battle entity to track state
        const battleId = EntityManager.createEntity(['battle']);
        this.currentBattleId = battleId;
        
        // Add battle state component
        EntityManager.addComponent(battleId, 'BattleState', ComponentFactory.createBattleStateComponent());
        
        // Create enemy if not provided
        const enemyId = this.generateEnemy(data);
        
        // Reset player for battle
        this.resetPlayerForBattle();
        
        // Draw initial hand
        this.drawCards(Config.MAX_HAND_SIZE);
        
        // Emit battle ready event
        EventBus.emit('BATTLE_READY', { 
            battleId, 
            enemyId 
        });
    }
    
    /**
     * Generate an enemy for battle
     * @param {Object} data - Enemy generation data
     * @returns {String} Enemy entity ID
     */
    generateEnemy(data = {}) {
        // Get the current phase and day
        const gameEntity = this.getGameEntity();
        const phaseComponent = EntityManager.getComponent(gameEntity, 'Phase');
        
        if (!phaseComponent) {
            console.error('No Phase component found on game entity');
            return null;
        }
        
        const { day, phase, battleCount } = phaseComponent;
        
        // Determine enemy type based on current phase
        let enemyTemplate;
        
        if (phase === 2) { // Dark phase - boss
            enemyTemplate = this.getScaledBoss(day);
        } else {
            // Select from regular enemies based on battle count
            const enemies = Config.ENEMIES;
            enemyTemplate = enemies[battleCount % enemies.length];
        }
        
        // Create the enemy entity
        const enemyId = EntityManager.createEntity(['enemy']);
        
        // Add components to the enemy
        EntityManager.addComponent(enemyId, 'Info', ComponentFactory.createInfoComponent({
            name: enemyTemplate.name,
            description: enemyTemplate.description || ''
        }));
        
        EntityManager.addComponent(enemyId, 'Stats', ComponentFactory.createStatsComponent({
            health: enemyTemplate.maxHealth,
            maxHealth: enemyTemplate.maxHealth
        }));
        
        // Add shield component if applicable
        if (enemyTemplate.shield) {
            EntityManager.addComponent(enemyId, 'Shield', {
                active: true,
                color: enemyTemplate.shieldColor || 'red'
            });
        }
        
        // Shuffle actions and set up action queue
        const actionQueue = Utils.shuffle([...enemyTemplate.actions]);
        const currentAction = actionQueue.shift();
        
        EntityManager.addComponent(enemyId, 'Enemy', ComponentFactory.createEnemyComponent({
            actionQueue,
            currentAction
        }));
        
        // Add buff component
        EntityManager.addComponent(enemyId, 'Buff', ComponentFactory.createBuffComponent());
        
        // Link the enemy to the battle
        EntityManager.addComponent(this.currentBattleId, 'CurrentEnemy', { 
            enemyId 
        });
        
        // Emit enemy created event
        EventBus.emit('ENEMY_CREATED', { 
            enemyId,
            enemyType: enemyTemplate.name,
            phase,
            day
        });
        
        return enemyId;
    }
    
    /**
     * Get a scaled boss based on current day
     * @param {Number} day - Current day
     * @returns {Object} Scaled boss data
     */
    getScaledBoss(day) {
        const baseBoss = { ...Config.BOSS };
        
        // Scale boss health and damage with day progression
        baseBoss.maxHealth = baseBoss.maxHealth + (day - 1) * 5;
        
        // Scale boss actions
        baseBoss.actions = baseBoss.actions.map(action => {
            if (action.startsWith("Attack")) {
                const parts = action.split(" ");
                const baseDamage = parseInt(parts[1]);
                return `Attack ${baseDamage + (day - 1)}`;
            }
            return action;
        });
        
        return baseBoss;
    }
    
    /**
     * Reset player for battle
     */
    resetPlayerForBattle() {
        // Get player entity
        const playerId = this.getPlayerEntity();
        if (!playerId) {
            console.error('No player entity found');
            return;
        }
        
        // Reset buffs
        EntityManager.addComponent(playerId, 'Buff', ComponentFactory.createBuffComponent());
        
        // Reset stamina to base value
        const statsComponent = EntityManager.getComponent(playerId, 'Stats');
        if (statsComponent) {
            EntityManager.updateComponent(playerId, 'Stats', {
                stamina: statsComponent.baseStamina
            });
        }
        
        // Link player to current battle
        EntityManager.addComponent(this.currentBattleId, 'CurrentPlayer', {
            playerId
        });
    }
    
    /**
     * Draw cards from the gem bag to the hand
     * @param {Number} count - Number of cards to draw
     */
    drawCards(count) {
        // Get the player's collections
        const playerId = this.getPlayerEntity();
        if (!playerId) return;
        
        // Find or create collection holder entity
        const collectionsId = this.getPlayerCollectionsEntity();
        if (!collectionsId) return;
        
        // Get the collections
        const handCollection = EntityManager.getComponent(collectionsId, 'Hand');
        const gemBagCollection = EntityManager.getComponent(collectionsId, 'GemBag');
        const discardCollection = EntityManager.getComponent(collectionsId, 'Discard');
        
        if (!handCollection || !gemBagCollection) {
            console.error('Missing required collections');
            return;
        }
        
        // Calculate how many cards we need to draw
        const needed = Math.min(count, Config.MAX_HAND_SIZE - handCollection.items.length);
        if (needed <= 0) return;
        
        // Clone collections for modification
        const updatedHand = [...handCollection.items];
        let updatedGemBag = [...gemBagCollection.items];
        
        // If gem bag is low, recycle discard pile
        if (updatedGemBag.length < needed && discardCollection && discardCollection.items.length > 0) {
            // Recycle discard pile
            updatedGemBag = [...updatedGemBag, ...discardCollection.items];
            updatedGemBag = Utils.shuffle(updatedGemBag);
            
            // Clear discard pile
            EntityManager.updateComponent(collectionsId, 'Discard', {
                items: []
            });
            
            // Notify of discard recycling
            EventBus.emit('DISCARD_RECYCLED');
        }
        
        // Draw cards to hand
        const drawnGems = [];
        for (let i = 0; i < needed && updatedGemBag.length > 0; i++) {
            const gemId = updatedGemBag.pop();
            updatedHand.push(gemId);
            drawnGems.push(gemId);
        }
        
        // Update the collections
        EntityManager.updateComponent(collectionsId, 'Hand', {
            items: updatedHand
        });
        
        EntityManager.updateComponent(collectionsId, 'GemBag', {
            items: updatedGemBag
        });
        
        // Emit events
        EventBus.emit('GEMS_DRAWN', {
            gems: drawnGems,
            count: drawnGems.length
        });
        
        EventBus.emit('HAND_UPDATED');
    }
    
    /**
     * Handle playing a gem
     * @param {Object} data - Gem play data
     */
    handleGemPlayed(data) {
        // Validate battle is active
        if (!this.currentBattleId) {
            console.error('No active battle');
            return;
        }
        
        const battleState = EntityManager.getComponent(this.currentBattleId, 'BattleState');
        if (!battleState || battleState.battleOver) {
            console.log('Battle is over, cannot play gems');
            return;
        }
        
        // Get the gem and verify player has enough stamina
        const { gemIndex } = data;
        const playerId = this.getPlayerEntity();
        const collectionsId = this.getPlayerCollectionsEntity();
        
        // Get collections and stats
        const handCollection = EntityManager.getComponent(collectionsId, 'Hand');
        const statsComponent = EntityManager.getComponent(playerId, 'Stats');
        
        if (!handCollection || !statsComponent) {
            console.error('Missing required components');
            return;
        }
        
        // Validate gem index
        if (gemIndex < 0 || gemIndex >= handCollection.items.length) {
            console.error('Invalid gem index:', gemIndex);
            return;
        }
        
        // Get the gem entity ID and component
        const gemId = handCollection.items[gemIndex];
        const gemComponent = EntityManager.getComponent(gemId, 'Gem');
        
        if (!gemComponent) {
            console.error('Invalid gem component');
            return;
        }
        
        // Check if player has enough stamina
        if (statsComponent.stamina < gemComponent.cost) {
            EventBus.emit('UI_MESSAGE', {
                message: 'Not enough stamina!',
                type: 'error'
            });
            return;
        }
        
        // Process gem effect
        this.processGemEffect(gemId, gemIndex);
    }
    
    /**
     * Process a gem's effect when played
     * @param {String} gemId - Gem entity ID
     * @param {Number} handIndex - Index in hand
     */
    processGemEffect(gemId, handIndex) {
        const playerId = this.getPlayerEntity();
        const collectionsId = this.getPlayerCollectionsEntity();
        const enemyId = this.getCurrentEnemyEntity();
        
        // Get components
        const gemComponent = EntityManager.getComponent(gemId, 'Gem');
        const playerStats = EntityManager.getComponent(playerId, 'Stats');
        const playerBuffs = EntityManager.getComponent(playerId, 'Buff');
        const enemyStats = enemyId ? EntityManager.getComponent(enemyId, 'Stats') : null;
        const enemyBuffs = enemyId ? EntityManager.getComponent(enemyId, 'Buff') : null;
        const enemyShield = enemyId ? EntityManager.getComponent(enemyId, 'Shield') : null;
        
        if (!gemComponent || !playerStats || !playerBuffs) {
            console.error('Missing required components');
            return;
        }
        
        // Deduct stamina
        const newStamina = playerStats.stamina - gemComponent.cost;
        EntityManager.updateComponent(playerId, 'Stats', {
            stamina: newStamina
        });
        
        // Calculate gem effect multiplier based on class and buffs
        const multiplier = this.calculateGemMultiplier(gemId);
        
        // Check proficiency to see if the gem fails
        const proficiency = this.getGemProficiency(gemId);
        const gemFails = this.checkGemFails(proficiency);
        
        // If the gem fails, apply negative effects to player
        if (gemFails) {
            this.applyGemFailure(gemId, multiplier);
        } else {
            // Apply successful gem effects
            if (gemComponent.damage && enemyId) {
                // Apply damage to enemy
                this.applyDamageToEnemy(gemId, enemyId, multiplier);
            } else if (gemComponent.heal) {
                // Apply healing to player
                this.applyHealingToPlayer(gemId, multiplier);
            } else if (gemComponent.poison && enemyId) {
                // Apply poison to enemy
                this.applyPoisonToEnemy(gemId, enemyId, multiplier);
            } else if (gemComponent.shield) {
                // Apply shield to player
                this.applyShieldToPlayer(gemId);
            }
            
            // Update proficiency
            this.updateGemProficiency(gemId, true);
        }
        
        // Remove gem from hand and add to discard
        this.moveGemFromHandToDiscard(handIndex);
        
        // Update battle state
        const battleState = EntityManager.getComponent(this.currentBattleId, 'BattleState');
        if (battleState) {
            EntityManager.updateComponent(this.currentBattleId, 'BattleState', {
                hasPlayedGemThisTurn: true
            });
        }
        
        // Check if battle is over
        this.checkBattleStatus();
        
        // Emit UI update events
        EventBus.emit('HAND_UPDATED');
        EventBus.emit('UI_UPDATE', { target: 'battle' });
    }
    
    /**
     * Move a gem from hand to discard
     * @param {Number} handIndex - Index in hand
     */
    moveGemFromHandToDiscard(handIndex) {
        const collectionsId = this.getPlayerCollectionsEntity();
        if (!collectionsId) return;
        
        // Get collections
        const handCollection = EntityManager.getComponent(collectionsId, 'Hand');
        const discardCollection = EntityManager.getComponent(collectionsId, 'Discard');
        
        if (!handCollection || !discardCollection) return;
        
        // Clone the collections
        const hand = [...handCollection.items];
        const discard = [...discardCollection.items];
        
        // Move the gem
        if (handIndex >= 0 && handIndex < hand.length) {
            const gemId = hand[handIndex];
            hand.splice(handIndex, 1);
            discard.push(gemId);
            
            // Update collections
            EntityManager.updateComponent(collectionsId, 'Hand', { items: hand });
            EntityManager.updateComponent(collectionsId, 'Discard', { items: discard });
        }
    }
    
    /**
     * Apply damage to enemy from a gem
     * @param {String} gemId - Gem entity ID
     * @param {String} enemyId - Enemy entity ID
     * @param {Number} multiplier - Damage multiplier
     */
    applyDamageToEnemy(gemId, enemyId, multiplier) {
        const gemComponent = EntityManager.getComponent(gemId, 'Gem');
        const enemyStats = EntityManager.getComponent(enemyId, 'Stats');
        const enemyBuffs = EntityManager.getComponent(enemyId, 'Buff');
        const enemyShield = EntityManager.getComponent(enemyId, 'Shield');
        
        if (!gemComponent || !enemyStats) return;
        
        // Calculate base damage
        let damage = Math.floor(gemComponent.damage * multiplier);
        
        // Apply shield reduction if applicable
        if (enemyShield && enemyShield.active && gemComponent.color !== enemyShield.color) {
            damage = Math.floor(damage / 2);
            EventBus.emit('UI_MESSAGE', {
                message: 'Shield reduced damage!'
            });
        }
        
        // Apply defense buff reduction if applicable
        if (enemyBuffs && enemyBuffs.buffs.some(b => b.type === 'defense')) {
            damage = Math.floor(damage / 2);
            EventBus.emit('UI_MESSAGE', {
                message: 'Enemy defense reduced damage!'
            });
        }
        
        // Apply damage
        const newHealth = Math.max(0, enemyStats.health - damage);
        EntityManager.updateComponent(enemyId, 'Stats', {
            health: newHealth
        });
        
        // Show damage animation and message
        EventBus.emit('SHOW_DAMAGE', {
            target: 'enemy',
            amount: damage
        });
        
        EventBus.emit('UI_MESSAGE', {
            message: `Dealt ${damage} damage to enemy!`
        });
        
        // Check if enemy defeated
        if (newHealth <= 0) {
            this.handleEnemyDefeated();
        }
    }
    
    /**
     * Apply healing to player from a gem
     * @param {String} gemId - Gem entity ID
     * @param {Number} multiplier - Healing multiplier
     */
    applyHealingToPlayer(gemId, multiplier) {
        const gemComponent = EntityManager.getComponent(gemId, 'Gem');
        const playerId = this.getPlayerEntity();
        const playerStats = EntityManager.getComponent(playerId, 'Stats');
        
        if (!gemComponent || !playerStats) return;
        
        // Calculate healing amount
        const healAmount = Math.floor(gemComponent.heal * multiplier);
        
        // Apply healing
        const newHealth = Math.min(playerStats.maxHealth, playerStats.health + healAmount);
        EntityManager.updateComponent(playerId, 'Stats', {
            health: newHealth
        });
        
        // Apply shield if gem has shield property
        if (gemComponent.shield) {
            this.applyShieldToPlayer(gemId);
        }
        
        // Show healing animation and message
        EventBus.emit('SHOW_DAMAGE', {
            target: 'player',
            amount: -healAmount
        });
        
        EventBus.emit('UI_MESSAGE', {
            message: `Healed for ${healAmount} health!`
        });
    }
    
    /**
     * Apply poison to enemy from a gem
     * @param {String} gemId - Gem entity ID
     * @param {String} enemyId - Enemy entity ID
     * @param {Number} multiplier - Poison multiplier
     */
    applyPoisonToEnemy(gemId, enemyId, multiplier) {
        const gemComponent = EntityManager.getComponent(gemId, 'Gem');
        const enemyBuffs = EntityManager.getComponent(enemyId, 'Buff');
        
        if (!gemComponent || !enemyBuffs) return;
        
        // Calculate poison damage
        const poisonDamage = Math.floor(gemComponent.poison * multiplier);
        
        // Add poison buff to enemy
        const updatedBuffs = [...enemyBuffs.buffs];
        updatedBuffs.push({
            type: 'poison',
            turns: 2,
            damage: poisonDamage
        });
        
        EntityManager.updateComponent(enemyId, 'Buff', {
            buffs: updatedBuffs
        });
        
        // Show message
        EventBus.emit('UI_MESSAGE', {
            message: `Applied poison for ${poisonDamage} damage per turn!`
        });
    }
    
    /**
     * Apply shield buff to player
     * @param {String} gemId - Gem entity ID
     */
    applyShieldToPlayer(gemId) {
        const playerId = this.getPlayerEntity();
        const playerBuffs = EntityManager.getComponent(playerId, 'Buff');
        
        if (!playerBuffs) return;
        
        // Add defense buff
        const updatedBuffs = [...playerBuffs.buffs];
        updatedBuffs.push({
            type: 'defense',
            turns: 2
        });
        
        EntityManager.updateComponent(playerId, 'Buff', {
            buffs: updatedBuffs
        });
        
        // Show message
        EventBus.emit('UI_MESSAGE', {
            message: 'Applied defense shield!'
        });
    }
    
    /**
     * Apply failure effects when a gem fails
     * @param {String} gemId - Gem entity ID
     * @param {Number} multiplier - Effect multiplier
     */
    applyGemFailure(gemId, multiplier) {
        const gemComponent = EntityManager.getComponent(gemId, 'Gem');
        const playerId = this.getPlayerEntity();
        const playerStats = EntityManager.getComponent(playerId, 'Stats');
        const playerBuffs = EntityManager.getComponent(playerId, 'Buff');
        
        if (!gemComponent || !playerStats || !playerBuffs) return;
        
        let damage = 0;
        let message = '';
        
        // Different failure effects based on gem type
        if (gemComponent.damage) {
            // Damage gem backfires with reduced damage
            damage = Math.floor(gemComponent.damage * multiplier * 0.5);
            
            // Apply random stun on 50% chance
            if (Math.random() < 0.5) {
                const updatedBuffs = [...playerBuffs.buffs];
                updatedBuffs.push({
                    type: 'stunned',
                    turns: 1
                });
                
                EntityManager.updateComponent(playerId, 'Buff', {
                    buffs: updatedBuffs
                });
                
                message = `Failed ${gemComponent.name}! Took ${damage} damage and stunned!`;
            } else {
                message = `Failed ${gemComponent.name}! Took ${damage} damage!`;
            }
        } else if (gemComponent.heal) {
            // Healing gem fails with fixed damage
            damage = 5;
            message = `Failed ${gemComponent.name}! Lost ${damage} HP!`;
        } else if (gemComponent.poison) {
            // Poison gem fails with reduced poison damage
            damage = Math.floor(gemComponent.poison * multiplier * 0.5);
            message = `Failed ${gemComponent.name}! Took ${damage} self-poison damage!`;
        }
        
        // Apply damage
        if (damage > 0) {
            const newHealth = Math.max(0, playerStats.health - damage);
            EntityManager.updateComponent(playerId, 'Stats', {
                health: newHealth
            });
            
            // Show damage animation
            EventBus.emit('SHOW_DAMAGE', {
                target: 'player',
                amount: damage,
                isPoison: gemComponent.poison !== undefined
            });
        }
        
        // Show message
        EventBus.emit('UI_MESSAGE', {
            message,
            type: 'error'
        });
        
        // Update proficiency (counts as a failure)
        this.updateGemProficiency(gemId, false);
        
        // Check if player defeated
        if (playerStats.health - damage <= 0) {
            this.handlePlayerDefeated();
        }
    }
    
    /**
     * Get proficiency for a gem
     * @param {String} gemId - Gem entity ID
     * @returns {Object} Proficiency data
     */
    getGemProficiency(gemId) {
        const playerId = this.getPlayerEntity();
        const gemComponent = EntityManager.getComponent(gemId, 'Gem');
        
        if (!gemComponent) return { successCount: 0, failureChance: 0.9 };
        
        // Get the key for this gem type
        const gemKey = `${gemComponent.color}${gemComponent.name.replace(/\s+/g, '')}`;
        
        // Get proficiency component
        const proficiencyComponent = EntityManager.getComponent(playerId, 'Proficiency');
        if (!proficiencyComponent) return { successCount: 0, failureChance: 0.9 };
        
        // Check if this gem has proficiency data
        if (!proficiencyComponent.proficiencies[gemKey]) {
            // For basic gems, assume full proficiency
            const basicGems = ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal"];
            const classGems = ["redStrongAttack", "blueStrongHeal", "greenQuickAttack"];
            
            if (basicGems.includes(gemKey) || classGems.includes(gemKey)) {
                return { successCount: 6, failureChance: 0 };
            }
            
            // Otherwise, start with low proficiency
            return { successCount: 0, failureChance: 0.9 };
        }
        
        return proficiencyComponent.proficiencies[gemKey];
    }
    
    /**
     * Check if a gem will fail based on proficiency
     * @param {Object} proficiency - Gem proficiency data
     * @returns {Boolean} Whether the gem will fail
     */
    checkGemFails(proficiency) {
        return proficiency.failureChance > 0 && Math.random() < proficiency.failureChance;
    }
    
    /**
     * Update proficiency for a gem based on success/failure
     * @param {String} gemId - Gem entity ID
     * @param {Boolean} success - Whether the gem was used successfully
     */
    updateGemProficiency(gemId, success) {
        const playerId = this.getPlayerEntity();
        const gemComponent = EntityManager.getComponent(gemId, 'Gem');
        
        if (!gemComponent) return;
        
        // Get the key for this gem type
        const gemKey = `${gemComponent.color}${gemComponent.name.replace(/\s+/g, '')}`;
        
        // Get proficiency component
        const proficiencyComponent = EntityManager.getComponent(playerId, 'Proficiency');
        if (!proficiencyComponent) return;
        
        // Get current proficiency
        const currentProficiency = proficiencyComponent.proficiencies[gemKey] || { 
            successCount: 0, 
            failureChance: 0.9 
        };
        
        // Update proficiency based on success/failure
        const updatedProficiency = { ...currentProficiency };
        
        if (success) {
            updatedProficiency.successCount++;
            updatedProficiency.failureChance = Math.max(0, 0.9 - updatedProficiency.successCount * 0.15);
        }
        
        // Update proficiency component
        const updatedProficiencies = { ...proficiencyComponent.proficiencies };
        updatedProficiencies[gemKey] = updatedProficiency;
        
        EntityManager.updateComponent(playerId, 'Proficiency', {
            proficiencies: updatedProficiencies
        });
        
        // Emit proficiency update event
        EventBus.emit('GEM_PROFICIENCY_UPDATED', {
            gemKey,
            proficiency: updatedProficiency,
            success
        });
    }
    
    /**
     * Calculate gem multiplier based on class and buffs
     * @param {String} gemId - Gem entity ID
     * @returns {Number} Effect multiplier
     */
    calculateGemMultiplier(gemId) {
        const playerId = this.getPlayerEntity();
        const gemComponent = EntityManager.getComponent(gemId, 'Gem');
        const classComponent = EntityManager.getComponent(playerId, 'Class');
        const buffComponent = EntityManager.getComponent(playerId, 'Buff');
        
        if (!gemComponent || !classComponent) return 1;
        
        let multiplier = 1;
        
        // Apply class bonus (50% for matching color)
        if ((classComponent.type === 'Knight' && gemComponent.color === 'red') ||
            (classComponent.type === 'Mage' && gemComponent.color === 'blue') ||
            (classComponent.type === 'Rogue' && gemComponent.color === 'green')) {
            multiplier *= 1.5;
        }
        
        // Apply focus buff (20% boost)
        if (buffComponent && buffComponent.buffs.some(b => b.type === 'focused')) {
            multiplier *= 1.2;
        }
        
        return multiplier;
    }
    
    /**
     * Handle end turn action
     */
    handleEndTurn() {
        // Validate battle is active
        if (!this.currentBattleId) return;
        
        const battleState = EntityManager.getComponent(this.currentBattleId, 'BattleState');
        if (!battleState || battleState.battleOver || battleState.isEnemyTurnPending) return;
        
        // Check if player is stunned
        const playerId = this.getPlayerEntity();
        const playerBuffs = EntityManager.getComponent(playerId, 'Buff');
        
        if (playerBuffs && playerBuffs.buffs.some(b => b.type === 'stunned')) {
            EventBus.emit('UI_MESSAGE', {
                message: 'You are stunned and skip your turn!',
                type: 'error'
            });
        }
        
        // Mark enemy turn as pending
        EntityManager.updateComponent(this.currentBattleId, 'BattleState', {
            isEnemyTurnPending: true
        });
        
        // Update UI
        EventBus.emit('UI_UPDATE', { target: 'battle' });
        
        // Process enemy turn with delay
        setTimeout(() => {
            this.processEnemyTurn();
        }, 300);
        
        // Play sound
        EventBus.emit('PLAY_SOUND', { sound: 'BUTTON_CLICK' });
    }
    
    /**
     * Process the enemy's turn
     */
    processEnemyTurn() {
        // Validate battle state
        if (!this.currentBattleId) return;
        
        const battleState = EntityManager.getComponent(this.currentBattleId, 'BattleState');
        const enemyId = this.getCurrentEnemyEntity();
        
        if (!battleState || battleState.battleOver || !enemyId) {
            console.log('Cannot process enemy turn: battle over or no enemy');
            this.finishEnemyTurn();
            return;
        }
        
        // Emit turn start event
        EventBus.emit('TURN_START', { turn: 'enemy' });
        
        // Define turn phases with timing
        const phases = [
            { fn: this.executeEnemyAction.bind(this), delay: 500 },
            { fn: this.applyEnemyPoisonEffects.bind(this), delay: 800 },
            { fn: this.prepareNextEnemyAction.bind(this), delay: 800 },
            { fn: this.finishEnemyTurn.bind(this), delay: 800 }
        ];
        
        // Execute phases sequentially
        this.executePhases(phases);
    }
    
    /**
     * Execute a sequence of phases with delays
     * @param {Array} phases - Array of phase objects with fn and delay properties
     * @param {Number} index - Current phase index (for recursion)
     */
    executePhases(phases, index = 0) {
        if (index >= phases.length) return;
        
        const phase = phases[index];
        
        setTimeout(() => {
            try {
                // Execute the phase
                phase.fn();
                
                // Check if battle ended during phase
                const battleState = EntityManager.getComponent(this.currentBattleId, 'BattleState');
                if (battleState && battleState.battleOver && index < phases.length - 1) {
                    console.log(`Battle ended during phase ${index}`);
                    return;
                }
                
                // Continue to next phase
                this.executePhases(phases, index + 1);
            } catch (error) {
                console.error(`Error in phase ${index}:`, error);
                this.safeFinishEnemyTurn();
            }
        }, phase.delay);
    }
    
    /**
     * Execute enemy action
     */
    executeEnemyAction() {
        const enemyId = this.getCurrentEnemyEntity();
        if (!enemyId) return;
        
        const enemyComponent = EntityManager.getComponent(enemyId, 'Enemy');
        const enemyInfo = EntityManager.getComponent(enemyId, 'Info');
        const playerId = this.getPlayerEntity();
        
        if (!enemyComponent || !playerId) return;
        
        // Skip if no action or enemy is dead
        if (!enemyComponent.currentAction) return;
        
        const enemyName = enemyInfo ? enemyInfo.name : 'Enemy';
        let message = '';
        
        // Process based on action type
        if (enemyComponent.currentAction.startsWith('Attack')) {
            // Extract damage value
            let damage = 0;
            try {
                const parts = enemyComponent.currentAction.split(' ');
                damage = parseInt(parts[1]) || 5; // Default to 5 if parsing fails
            } catch (e) {
                console.warn('Error parsing enemy attack damage, using default', e);
                damage = 5;
            }
            
            // Apply attack boost if present
            if (enemyComponent.nextAttackBoost) {
                damage *= enemyComponent.nextAttackBoost;
                
                // Reset the boost
                EntityManager.updateComponent(enemyId, 'Enemy', {
                    nextAttackBoost: null
                });
            }
            
            // Apply damage to player
            this.applyDamageToPlayer(damage);
            message = `${enemyName} attacks for ${damage} damage!`;
        } 
        else if (enemyComponent.currentAction === 'Defend') {
            message = `${enemyName} defends, reducing next damage!`;
            
            // Add defense buff
            const buffComponent = EntityManager.getComponent(enemyId, 'Buff');
            if (buffComponent) {
                const updatedBuffs = [...buffComponent.buffs];
                updatedBuffs.push({ type: 'defense', turns: 2 });
                
                EntityManager.updateComponent(enemyId, 'Buff', {
                    buffs: updatedBuffs
                });
            }
        } 
        else if (enemyComponent.currentAction === 'Charge') {
            message = `${enemyName} charges for a stronger attack next turn!`;
            
            EntityManager.updateComponent(enemyId, 'Enemy', {
                nextAttackBoost: 2
            });
        } 
        else if (enemyComponent.currentAction.startsWith('Steal')) {
            // Extract zenny value
            let zenny = 0;
            try {
                const parts = enemyComponent.currentAction.split(' ');
                zenny = parseInt(parts[1]) || 3; // Default to 3 if parsing fails
            } catch (e) {
                console.warn('Error parsing enemy steal amount, using default', e);
                zenny = 3;
            }
            
            // Steal zenny from player
            const playerStats = EntityManager.getComponent(playerId, 'Stats');
            if (playerStats) {
                const newZenny = Math.max(0, playerStats.zenny - zenny);
                EntityManager.updateComponent(playerId, 'Stats', {
                    zenny: newZenny
                });
            }
            
            message = `${enemyName} steals ${zenny} $ZENNY!`;
        } 
        else {
            // Fallback for unknown actions
            message = `${enemyName} makes a mysterious move...`;
        }
        
        // Display message
        EventBus.emit('UI_MESSAGE', { message });
        
        // Update UI
        EventBus.emit('UI_UPDATE', { target: 'battle' });
    }
    
    /**
     * Apply damage to player
     * @param {Number} amount - Amount of damage to apply
     * @param {Boolean} isPoison - Whether this is poison damage
     */
    applyDamageToPlayer(amount, isPoison = false) {
        const playerId = this.getPlayerEntity();
        if (!playerId) return;
        
        const statsComponent = EntityManager.getComponent(playerId, 'Stats');
        const buffComponent = EntityManager.getComponent(playerId, 'Buff');
        
        if (!statsComponent) return;
        
        const startHealth = statsComponent.health;
        
        // Apply defense reduction if applicable
        if (buffComponent && buffComponent.buffs.some(b => b.type === 'defense')) {
            amount = Math.floor(amount * 0.5);
        }
        
        // Apply damage
        const newHealth = Math.max(0, statsComponent.health - amount);
        EntityManager.updateComponent(playerId, 'Stats', {
            health: newHealth
        });
        
        // Show damage animation
        EventBus.emit('SHOW_DAMAGE', {
            target: 'player',
            amount,
            isPoison
        });
        
        // Check if player defeated
        if (newHealth <= 0) {
            this.handlePlayerDefeated();
        }
    }
    
    /**
     * Apply poison effects to the enemy
     */
    applyEnemyPoisonEffects() {
        const enemyId = this.getCurrentEnemyEntity();
        if (!enemyId) return;
        
        const enemyStats = EntityManager.getComponent(enemyId, 'Stats');
        const enemyBuffs = EntityManager.getComponent(enemyId, 'Buff');
        const enemyInfo = EntityManager.getComponent(enemyId, 'Info');
        
        if (!enemyStats || !enemyBuffs) return;
        
        // Check for poison buff
        const poisonBuff = enemyBuffs.buffs.find(b => b.type === 'poison');
        if (!poisonBuff) return;
        
        // Apply poison damage
        const newHealth = Math.max(0, enemyStats.health - poisonBuff.damage);
        EntityManager.updateComponent(enemyId, 'Stats', {
            health: newHealth
        });
        
        const enemyName = enemyInfo ? enemyInfo.name : 'Enemy';
        
        // Show message and animation
        EventBus.emit('UI_MESSAGE', {
            message: `${enemyName} takes ${poisonBuff.damage} poison damage!`
        });
        
        EventBus.emit('SHOW_DAMAGE', {
            target: 'enemy',
            amount: poisonBuff.damage,
            isPoison: true
        });
        
        // Update UI
        EventBus.emit('UI_UPDATE', { target: 'battle' });
        
        // Check if enemy defeated
        if (newHealth <= 0) {
            this.handleEnemyDefeated();
        }
    }
    
    /**
     * Prepare the next action for the enemy
     */
    prepareNextEnemyAction() {
        const enemyId = this.getCurrentEnemyEntity();
        if (!enemyId) return;
        
        const enemyComponent = EntityManager.getComponent(enemyId, 'Enemy');
        if (!enemyComponent) return;
        
        // Get next action from queue
        const nextAction = enemyComponent.actionQueue.shift();
        
        // Build updated queue
        let updatedQueue = [...enemyComponent.actionQueue];
        
        // Refill queue if needed
        if (updatedQueue.length < 3) {
            // Get enemy info for actions
            const enemyInfo = EntityManager.getComponent(enemyId, 'Info');
            if (enemyInfo && enemyInfo.name) {
                // Look up enemy template in Config
                const enemyTemplate = Config.ENEMIES.find(e => e.name === enemyInfo.name) || Config.BOSS;
                
                if (enemyTemplate && enemyTemplate.actions) {
                    const shuffledActions = Utils.shuffle([...enemyTemplate.actions]);
                    updatedQueue = [...updatedQueue, ...shuffledActions.slice(0, 3 - updatedQueue.length)];
                }
            }
        }
        
        // Update enemy component
        EntityManager.updateComponent(enemyId, 'Enemy', {
            currentAction: nextAction,
            actionQueue: updatedQueue
        });
    }
    
    /**
     * Finish the enemy turn and prepare the player's turn
     */
    finishEnemyTurn() {
        const playerId = this.getPlayerEntity();
        if (!playerId) return;
        
        // Skip if battle is over
        const battleState = EntityManager.getComponent(this.currentBattleId, 'BattleState');
        if (!battleState || battleState.battleOver) return;
        
        // Reset turn state flags
        EntityManager.updateComponent(this.currentBattleId, 'BattleState', {
            hasActedThisTurn: false,
            hasPlayedGemThisTurn: false,
            isEnemyTurnPending: false,
            selectedGems: new Set()
        });
        
        // Restore player stamina
        const statsComponent = EntityManager.getComponent(playerId, 'Stats');
        if (statsComponent) {
            EntityManager.updateComponent(playerId, 'Stats', {
                stamina: statsComponent.baseStamina
            });
        }
        
        // Reduce buff durations for player and enemy
        this.updateBuffDurations(playerId);
        this.updateBuffDurations(this.getCurrentEnemyEntity());
        
        // Draw new cards to fill hand
        this.drawCards(Config.MAX_HAND_SIZE);
        
        // Update UI
        EventBus.emit('UI_UPDATE', { target: 'battle' });
        
        // Emit turn events
        EventBus.emit('TURN_END', { turn: 'enemy' });
        EventBus.emit('TURN_START', { turn: 'player' });
        
        // Check if battle is over
        this.checkBattleStatus();
    }
    
    /**
     * Update buff durations for an entity
     * @param {String} entityId - Entity ID
     */
    updateBuffDurations(entityId) {
        if (!entityId) return;
        
        const buffComponent = EntityManager.getComponent(entityId, 'Buff');
        if (!buffComponent) return;
        
        // Reduce all buff durations and filter out expired ones
        const updatedBuffs = buffComponent.buffs
            .map(buff => ({ ...buff, turns: buff.turns - 1 }))
            .filter(buff => buff.turns > 0);
        
        // Update component
        EntityManager.updateComponent(entityId, 'Buff', {
            buffs: updatedBuffs
        });
    }
    
    /**
     * Emergency fallback for enemy turn completion on error
     */
    safeFinishEnemyTurn() {
        console.warn('Emergency: Resetting to player turn due to errors');
        
        // Reset battle state
        if (this.currentBattleId) {
            EntityManager.updateComponent(this.currentBattleId, 'BattleState', {
                isEnemyTurnPending: false,
                hasActedThisTurn: false,
                hasPlayedGemThisTurn: false,
                selectedGems: new Set()
            });
        }
        
        // Restore player stamina
        const playerId = this.getPlayerEntity();
        if (playerId) {
            const statsComponent = EntityManager.getComponent(playerId, 'Stats');
            if (statsComponent) {
                EntityManager.updateComponent(playerId, 'Stats', {
                    stamina: statsComponent.baseStamina
                });
            }
        }
        
        // Ensure player has cards
        this.drawCards(Config.MAX_HAND_SIZE);
        
        // Update UI and show message
        EventBus.emit('UI_UPDATE', { target: 'battle' });
        EventBus.emit('UI_MESSAGE', {
            message: 'Turn reset due to technical issues',
            type: 'error'
        });
    }
    
    /**
     * Check if the battle is over
     */
    checkBattleStatus() {
        if (!this.currentBattleId) return;
        
        const battleState = EntityManager.getComponent(this.currentBattleId, 'BattleState');
        if (!battleState || battleState.battleOver) return;
        
        const enemyId = this.getCurrentEnemyEntity();
        const playerId = this.getPlayerEntity();
        
        if (!enemyId || !playerId) return;
        
        const enemyStats = EntityManager.getComponent(enemyId, 'Stats');
        const playerStats = EntityManager.getComponent(playerId, 'Stats');
        
        if (!enemyStats || !playerStats) return;
        
        // Check if enemy is defeated
        if (enemyStats.health <= 0) {
            this.handleEnemyDefeated();
            return;
        }
        
        // Check if player is defeated
        if (playerStats.health <= 0) {
            this.handlePlayerDefeated();
        }
    }
    
    /**
     * Handle enemy defeat
     */
    handleEnemyDefeated() {
        if (!this.currentBattleId) return;
        
        // Mark battle as over
        EntityManager.updateComponent(this.currentBattleId, 'BattleState', {
            battleOver: true
        });
        
        const enemyId = this.getCurrentEnemyEntity();
        const playerId = this.getPlayerEntity();
        const gameEntity = this.getGameEntity();
        
        if (!enemyId || !playerId || !gameEntity) return;
        
        const enemyInfo = EntityManager.getComponent(enemyId, 'Info');
        const playerStats = EntityManager.getComponent(playerId, 'Stats');
        const phaseComponent = EntityManager.getComponent(gameEntity, 'Phase');
        
        if (!enemyInfo || !playerStats || !phaseComponent) return;
        
        // Calculate reward based on enemy type
        const isBoss = enemyInfo.name === 'Dark Guardian';
        const reward = isBoss ? 30 : 10;
        
        // Award zenny
        EntityManager.updateComponent(playerId, 'Stats', {
            zenny: playerStats.zenny + reward
        });
        
        // Show success message
        EventBus.emit('UI_MESSAGE', {
            message: `${enemyInfo.name} defeated! +${reward} $ZENNY`
        });
        
        // Show victory animation and play sound
        EventBus.emit('SHOW_VICTORY');
        EventBus.emit('PLAY_SOUND', { sound: 'VICTORY' });
        
        // Emit battle win event
        EventBus.emit('BATTLE_WIN', { 
            enemyId, 
            enemyType: enemyInfo.name, 
            reward 
        });
        
        // Increment battle count
        EntityManager.updateComponent(gameEntity, 'Phase', {
            battleCount: phaseComponent.battleCount + 1
        });
        
        // Delay before continuing
        setTimeout(() => {
            this.progressGameState();
        }, 1500);
    }
    
    /**
     * Handle player defeat
     */
    handlePlayerDefeated() {
        if (!this.currentBattleId) return;
        
        // Mark battle as over
        EntityManager.updateComponent(this.currentBattleId, 'BattleState', {
            battleOver: true
        });
        
        // Show defeat message
        EventBus.emit('UI_MESSAGE', {
            message: 'You were defeated!',
            type: 'error'
        });
        
        // Show defeat animation
        EventBus.emit('SHOW_DEFEAT');
        EventBus.emit('PLAY_SOUND', { sound: 'DEFEAT' });
        
        // Emit battle lose event
        EventBus.emit('BATTLE_LOSE');
        
        // Delay before returning to character select
        setTimeout(() => {
            EventBus.emit('SCREEN_CHANGE', 'characterSelect');
        }, 2000);
    }
    
    /**
     * Progress game state after battle victory
     */
    progressGameState() {
        const gameEntity = this.getGameEntity();
        if (!gameEntity) return;
        
        const phaseComponent = EntityManager.getComponent(gameEntity, 'Phase');
        if (!phaseComponent) return;
        
        const { day, phase, battleCount } = phaseComponent;
        
        // Save hand state before transition
        this.saveHandState();
        
        // Check if we need to advance to next phase or day
        if (battleCount % Config.BATTLES_PER_DAY !== 0) {
            // Move to next phase within the same day
            EntityManager.updateComponent(gameEntity, 'Phase', {
                phase: phase + 1
            });
            
            // Prepare shop
            EventBus.emit('SHOP_PREPARE');
            
            // Switch to shop screen
            EventBus.emit('SCREEN_CHANGE', 'shop');
        } else {
            // Complete day - reset phase and increment day
            EntityManager.updateComponent(gameEntity, 'Phase', {
                phase: 0,
                day: day + 1
            });
            
            // Check if game is complete
            if (day + 1 > Config.MAX_DAYS) {
                this.handleGameCompletion();
            } else {
                EventBus.emit('SCREEN_CHANGE', 'camp');
            }
        }
    }
    
    /**
     * Save hand state for transition
     */
    saveHandState() {
        const collectionsId = this.getPlayerCollectionsEntity();
        if (!collectionsId) return;
        
        const handCollection = EntityManager.getComponent(collectionsId, 'Hand');
        if (!handCollection) return;
        
        // Save to localStorage as temporary backup
        try {
            localStorage.setItem('stw_temp_hand', JSON.stringify(handCollection.items));
            console.log('Hand state saved for transition', handCollection.items);
        } catch (e) {
            console.error('Error saving hand state:', e);
        }
    }
    
    /**
     * Handle game completion
     */
    handleGameCompletion() {
        const playerId = this.getPlayerEntity();
        if (!playerId) return;
        
        // Award bonus meta zenny
        const walletComponent = EntityManager.getComponent(playerId, 'Wallet');
        if (walletComponent) {
            EntityManager.updateComponent(playerId, 'Wallet', {
                metaZenny: walletComponent.metaZenny + 100
            });
            
            // Save wallet state
            EventBus.emit('SAVE_META_ZENNY');
        }
        
        // Show victory message
        EventBus.emit('UI_MESSAGE', {
            message: 'Journey complete! Victory!'
        });
        
        // Return to character select
        setTimeout(() => {
            EventBus.emit('SCREEN_CHANGE', 'characterSelect');
        }, 2000);
    }
    
    /**
     * Handle waiting for a turn (gain focus)
     */
    handleWaitTurn() {
        if (!this.currentBattleId) return;
        
        const battleState = EntityManager.getComponent(this.currentBattleId, 'BattleState');
        if (!battleState || battleState.battleOver || battleState.hasActedThisTurn || 
            battleState.hasPlayedGemThisTurn || battleState.isEnemyTurnPending) return;
        
        // Update battle state
        EntityManager.updateComponent(this.currentBattleId, 'BattleState', {
            hasActedThisTurn: true
        });
        
        // Add focus buff to player
        const playerId = this.getPlayerEntity();
        if (!playerId) return;
        
        const buffComponent = EntityManager.getComponent(playerId, 'Buff');
        if (buffComponent) {
            const updatedBuffs = [...buffComponent.buffs];
            updatedBuffs.push({ type: 'focused', turns: 2 });
            
            EntityManager.updateComponent(playerId, 'Buff', {
                buffs: updatedBuffs
            });
        }
        
        // Show message
        EventBus.emit('UI_MESSAGE', {
            message: 'Waited, gaining focus for next turn (+20% damage/heal)!'
        });
        
        // Update UI
        EventBus.emit('UI_UPDATE', { target: 'battle' });
        
        // End turn after delay
        setTimeout(() => this.handleEndTurn(), 300);
    }
    
    /**
     * Handle discarding selected gems and ending turn
     */
    handleDiscardAndEnd(data) {
        if (!this.currentBattleId) return;
        
        const battleState = EntityManager.getComponent(this.currentBattleId, 'BattleState');
        if (!battleState || battleState.battleOver || battleState.hasActedThisTurn ||
            battleState.isEnemyTurnPending) return;
        
        // Get selected gems from battle state
        const selectedGems = Array.from(battleState.selectedGems);
        if (selectedGems.length === 0) {
            EventBus.emit('UI_MESSAGE', {
                message: 'Select gems to discard first!',
                type: 'error'
            });
            return;
        }
        
        // Get collections
        const collectionsId = this.getPlayerCollectionsEntity();
        if (!collectionsId) return;
        
        const handCollection = EntityManager.getComponent(collectionsId, 'Hand');
        const gemBagCollection = EntityManager.getComponent(collectionsId, 'GemBag');
        
        if (!handCollection || !gemBagCollection) return;
        
        // Clone collections for modification
        const hand = [...handCollection.items];
        let gemBag = [...gemBagCollection.items];
        
        // Sort indices in descending order to avoid shifting problems
        selectedGems.sort((a, b) => b - a);
        
        // Move gems from hand to bag
        for (const index of selectedGems) {
            if (index >= 0 && index < hand.length) {
                const gemId = hand.splice(index, 1)[0];
                gemBag.push(gemId);
            }
        }
        
        // Shuffle gem bag
        gemBag = Utils.shuffle(gemBag);
        
        // Update collections
        EntityManager.updateComponent(collectionsId, 'Hand', {
            items: hand
        });
        
        EntityManager.updateComponent(collectionsId, 'GemBag', {
            items: gemBag
        });
        
        // Update battle state
        EntityManager.updateComponent(this.currentBattleId, 'BattleState', {
            hasActedThisTurn: true,
            selectedGems: new Set()
        });
        
        // Show message
        EventBus.emit('UI_MESSAGE', {
            message: 'Discarded and recycled to Gem Bag, ending turn...'
        });
        
        // Update UI
        EventBus.emit('HAND_UPDATED');
        EventBus.emit('UI_UPDATE', { target: 'battle' });
        
        // End turn after delay
        setTimeout(() => this.handleEndTurn(), 300);
    }
    
    /**
     * Handle fleeing from battle
     */
    handleFleeBattle() {
        if (!this.currentBattleId) return;
        
        const battleState = EntityManager.getComponent(this.currentBattleId, 'BattleState');
        if (!battleState || battleState.battleOver || battleState.isEnemyTurnPending) return;
        
        // Get current phase
        const gameEntity = this.getGameEntity();
        if (!gameEntity) return;
        
        const phaseComponent = EntityManager.getComponent(gameEntity, 'Phase');
        if (!phaseComponent) return;
        
        // Only allow fleeing in first two phases
        if (phaseComponent.phase >= 2) {
            EventBus.emit('UI_MESSAGE', {
                message: 'Cannot flee from the final battle!',
                type: 'error'
            });
            return;
        }
        
        // Mark battle as over
        EntityManager.updateComponent(this.currentBattleId, 'BattleState', {
            battleOver: true
        });
        
        // Reset player and enemy buffs
        const playerId = this.getPlayerEntity();
        const enemyId = this.getCurrentEnemyEntity();
        
        if (playerId) {
            EntityManager.updateComponent(playerId, 'Buff', {
                buffs: []
            });
        }
        
        if (enemyId) {
            EntityManager.updateComponent(enemyId, 'Buff', {
                buffs: []
            });
        }
        
        // Show message
        EventBus.emit('UI_MESSAGE', {
            message: 'You fled the battle, skipping rewards!'
        });
        
        // Update UI
        EventBus.emit('UI_UPDATE', { target: 'battle' });
        
        // Increment battle count and advance phase
        EntityManager.updateComponent(gameEntity, 'Phase', {
            battleCount: phaseComponent.battleCount + 1,
            phase: phaseComponent.phase + 1
        });
        
        // Emit flee event
        EventBus.emit('BATTLE_FLEE');
        
        // Transition to shop
        setTimeout(() => {
            EventBus.emit('SCREEN_CHANGE', 'shop');
        }, 1000);
    }
    
    // ===================================================
    // Helper Methods
    // ===================================================
    
    /**
     * Get the player entity ID
     * @returns {String} Player entity ID
     */
    getPlayerEntity() {
        // Look for entity with player tag
        const playerEntities = EntityManager.getEntitiesWithTag('player');
        
        if (playerEntities.length === 0) {
            console.error('No player entity found');
            return null;
        }
        
        return playerEntities[0];
    }
    
    /**
     * Get the game entity ID
     * @returns {String} Game entity ID
     */
    getGameEntity() {
        // Look for entity with game tag
        const gameEntities = EntityManager.getEntitiesWithTag('game');
        
        if (gameEntities.length === 0) {
            console.error('No game entity found');
            return null;
        }
        
        return gameEntities[0];
    }
    
    /**
     * Get the current enemy entity ID
     * @returns {String} Enemy entity ID
     */
    getCurrentEnemyEntity() {
        if (!this.currentBattleId) return null;
        
        // Get current enemy component from battle entity
        const currentEnemyComponent = EntityManager.getComponent(this.currentBattleId, 'CurrentEnemy');
        
        if (!currentEnemyComponent) {
            return null;
        }
        
        return currentEnemyComponent.enemyId;
    }
    
    /**
     * Get the player collections entity ID
     * @returns {String} Collections entity ID
     */
    getPlayerCollectionsEntity() {
        // Look for entity with collections tag
        const collectionsEntities = EntityManager.getEntitiesWithTag('collections');
        
        if (collectionsEntities.length === 0) {
            console.error('No collections entity found');
            return null;
        }
        
        return collectionsEntities[0];
    }
}

export default CombatSystem;