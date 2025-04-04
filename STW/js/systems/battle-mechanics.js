import { GameState } from '../core/state.js';
import { EventBus } from '../core/eventbus.js';
import { Config } from '../core/config.js';
import { Utils } from '../core/utils.js';
import Gems from './gem.js';

/**
 * Battle Mechanics Module
 * Handles turn-based combat logic and gem interactions
 */
export const BattleMechanics = {
    /**
     * Execute selected gems in battle
     * @param {Array} selectedGems - Indices of selected gems
     * @returns {Object} Execution result
     */
    executeSelectedGems(selectedGems) {
        const hand = GameState.get('hand');
        const player = GameState.get('player');
        const enemy = GameState.get('battle.enemy');
        
        // Validate battle state
        if (this.isExecutionBlocked()) {
            return {
                success: false,
                reason: "Cannot execute gems right now"
            };
        }
        
        // Sort indices in descending order to avoid index shifting
        const sortedIndices = [...selectedGems].sort((a, b) => b - a);
        
        const results = sortedIndices.map(index => 
            this.playGemAtIndex(index, hand, player, enemy)
        );
        
        // Update game state
        GameState.set('selectedGems', new Set());
        
        // Emit events
        EventBus.emit('HAND_UPDATED');
        EventBus.emit('UI_UPDATE', { target: 'battle' });
        
        return {
            success: results.some(result => result.success),
            results
        };
    },
    
    /**
     * Check if gem execution is blocked
     * @returns {Boolean} Whether execution is blocked
     */
    isExecutionBlocked() {
        const battleOver = GameState.get('battleOver');
        const currentScreen = GameState.get('currentScreen');
        const selectedGems = GameState.get('selectedGems');
        const isEnemyTurn = GameState.get('isEnemyTurnPending');
        const isStunned = this.isPlayerStunned();
        
        return battleOver || 
               currentScreen !== 'battle' || 
               selectedGems.size === 0 || 
               isEnemyTurn || 
               isStunned;
    },
    
    /**
     * Play a gem from the hand
     * @param {Number} index - Index of the gem in hand
     * @param {Array} hand - Current hand of gems
     * @param {Object} player - Player object
     * @param {Object} enemy - Enemy object
     * @returns {Object} Gem play result
     */
    playGemAtIndex(index, hand, player, enemy) {
        // Validate index
        if (index < 0 || index >= hand.length) {
            return {
                success: false,
                reason: "Invalid gem index"
            };
        }
        
        const gem = hand[index];
        
        // Validate gem usage
        const usageValidation = Gems.validateGemUsage(gem, { 
            battleOver: GameState.get('battleOver') 
        });
        
        if (!usageValidation.usable) {
            return {
                success: false,
                reasons: usageValidation.reasons
            };
        }
        
        // Deduct stamina
        player.stamina -= gem.cost;
        GameState.set('player.stamina', player.stamina);
        
        // Calculate multiplier and proficiency
        const multiplier = Gems.calculateGemEffectiveness(gem);
        const gemKey = `${gem.color}${gem.name}`;
        const proficiency = Gems.Proficiency.getGemProficiency(gemKey);
        const gemFails = Gems.Proficiency.checkGemFails(proficiency);
        
        // Process gem effect
        const result = Gems.processGemEffect(gem, gemFails, multiplier);
        
        // Update gem proficiency
        Gems.Proficiency.updateGemProficiency(gemKey, !gemFails);
        
        // Remove gem from hand and add to discard
        const newHand = [...hand];
        newHand.splice(index, 1);
        GameState.set('hand', newHand);
        
        const discard = GameState.get('discard') || [];
        GameState.set('discard', [...discard, gem]);
        
        // Update state flags
        GameState.set('hasPlayedGemThisTurn', true);
        
        // Emit events
        this.emitGemPlayEvents(result, gem, gemFails);
        
        return {
            success: !gemFails,
            gem,
            result
        };
    },
    
    /**
     * Emit events related to gem play
     * @param {Object} result - Gem play result
     * @param {Object} gem - Played gem
     * @param {Boolean} gemFails - Whether the gem failed
     */
    emitGemPlayEvents(result, gem, gemFails) {
        // Emit gem execution event
        EventBus.emit('GEM_EXECUTED', { 
            gem,
            success: !gemFails,
            ...result
        });
    },
    
    /**
     * Check if the player is stunned
     * @returns {Boolean} Whether the player is stunned
     */
    isPlayerStunned() {
        const player = GameState.get('player');
        return player.buffs.some(b => b.type === "stunned");
    },
    
    /**
     * End the current turn
     * @returns {Object} Turn end result
     */
    endTurn() {
        const battleOver = GameState.get('battleOver');
        const player = GameState.get('player');
        
        // Validate turn end
        if (battleOver || this.isPlayerStunned()) {
            return {
                success: false,
                reason: "Cannot end turn"
            };
        }
        
        // Mark enemy turn as pending
        GameState.set('isEnemyTurnPending', true);
        
        // Emit events
        EventBus.emit('UI_UPDATE', { target: 'battle' });
        
        return {
            success: true
        };
    },
    
    /**
     * Wait for a turn (gain focus)
     * @returns {Object} Wait turn result
     */
    waitTurn() {
        const battleOver = GameState.get('battleOver');
        const player = GameState.get('player');
        
        // Validate waiting
        if (battleOver || 
            GameState.get('hasActedThisTurn') || 
            GameState.get('hasPlayedGemThisTurn')) {
            return {
                success: false,
                reason: "Cannot wait this turn"
            };
        }
        
        // Set acted flag
        GameState.set('hasActedThisTurn', true);
        
        // Add focus buff
        const playerBuffs = [...player.buffs];
        playerBuffs.push({ type: "focused", turns: 2 });
        GameState.set('player.buffs', playerBuffs);
        
        // Emit events
        EventBus.emit('UI_MESSAGE', {
            message: "Waited, gaining focus for next turn (+20% damage/heal)!"
        });
        EventBus.emit('UI_UPDATE', { target: 'battle' });
        
        // End turn after waiting
        return this.endTurn();
    },
    
    /**
     * Discard selected gems and end turn
     * @returns {Object} Discard and end turn result
     */
    discardAndEndTurn() {
        const battleOver = GameState.get('battleOver');
        const selectedGems = GameState.get('selectedGems');
        
        // Validate discard
        if (battleOver || 
            !selectedGems.size || 
            GameState.get('hasActedThisTurn')) {
            return {
                success: false,
                reason: "Cannot discard and end turn"
            };
        }
        
        const hand = GameState.get('hand');
        const gemBag = GameState.get('gemBag');
        
        // Sort indices in descending order to avoid index shifting
        const indices = Array.from(selectedGems).sort((a, b) => b - a);
        
        const newHand = [...hand];
        const newGemBag = [...gemBag];
        
        // Move selected gems to gem bag
        indices.forEach(index => {
            const gem = newHand.splice(index, 1)[0];
            newGemBag.push(gem);
        });
        
        // Update game state
        GameState.set('hand', newHand);
        GameState.set('gemBag', Utils.shuffle(newGemBag));
        GameState.set('selectedGems', new Set());
        GameState.set('hasActedThisTurn', true);
        
        // Emit events
        EventBus.emit('UI_MESSAGE', {
            message: "Discarded and recycled to Gem Bag, ending turn..."
        });
        EventBus.emit('HAND_UPDATED');
        EventBus.emit('UI_UPDATE', { target: 'battle' });
        
        // End turn
        return this.endTurn();
    },
    
    /**
     * Flee from battle
     * @returns {Object} Flee result
     */
    fleeBattle() {
        const battleOver = GameState.get('battleOver');
        const currentPhaseIndex = GameState.get('currentPhaseIndex');
        
        // Only allow fleeing in first two phases
        if (battleOver || currentPhaseIndex >= 2) {
            return {
                success: false,
                reason: "Cannot flee at this time"
            };
        }
        
        // Mark battle as over
        GameState.set('battleOver', true);
        
        // Clear player and enemy buffs
        GameState.set('player.buffs', []);
        const enemy = GameState.get('battle.enemy');
        if (enemy) enemy.buffs = [];
        
        // Emit events
        EventBus.emit('UI_MESSAGE', {
            message: "You fled the battle, skipping rewards!"
        });
        EventBus.emit('UI_UPDATE', { target: 'battle' });
        
        // Increment battle count and phase
        const battleCount = GameState.get('battleCount');
        GameState.set('battleCount', battleCount + 1);
        GameState.set('currentPhaseIndex', currentPhaseIndex + 1);
        
        // Emit flee event
        EventBus.emit('BATTLE_FLEE');
        
        return {
            success: true,
            nextScreen: 'shop'
        };
    },
    
    /**
     * Process enemy turn actions
     * @returns {Object} Enemy turn results
     */
    processEnemyTurn() {
        const enemy = GameState.get('battle.enemy');
        const battleOver = GameState.get('battleOver');
        
        // Safety check
        if (battleOver || !enemy) {
            return {
                success: false,
                reason: "Cannot process enemy turn"
            };
        }
        
        // Execute each phase of enemy turn
        const turnPhases = [
            this.executeEnemyAction,
            this.applyEnemyPoisonEffects,
            this.prepareNextEnemyAction,
            this.finalizeEnemyTurn
        ];
        
        const turnResults = turnPhases.map(phase => phase());
        
        return {
            success: true,
            phases: turnResults
        };
    },
    
    /**
     * Execute the enemy's current action
     * @returns {Object} Enemy action result
     */
    executeEnemyAction() {
        const enemy = GameState.get('battle.enemy');
        const player = GameState.get('player');
        
        // Skip if no action or enemy is dead
        if (!enemy || !enemy.currentAction || enemy.health <= 0) {
            return {
                success: false,
                reason: "No enemy action to execute"
            };
        }
        
        let result = { action: enemy.currentAction };
        
        // Process based on action type
        if (enemy.currentAction.startsWith("Attack")) {
            result = this.processEnemyAttack(enemy, player);
        } else if (enemy.currentAction === "Defend") {
            result = this.processEnemyDefend(enemy);
        } else if (enemy.currentAction === "Charge") {
            result = this.processEnemyCharge(enemy);
        } else if (enemy.currentAction.startsWith("Steal")) {
            result = this.processEnemySteal(enemy, player);
        } else {
            result = {
                success: true,
                message: `${enemy.name} makes a mysterious move...`
            };
        }
        
        // Update enemy state
        GameState.set('battle.enemy', enemy);
        
        return result;
    },
    
    /**
     * Process enemy attack action
     * @param {Object} enemy - Enemy object
     * @param {Object} player - Player object
     * @returns {Object} Attack result
     */
    processEnemyAttack(enemy, player) {
        // Extract damage value safely
        let damage = this.extractEnemyDamage(enemy.currentAction);
        
        // Apply attack boost if present
        if (enemy.nextAttackBoost) {
            damage *= enemy.nextAttackBoost;
            enemy.nextAttackBoost = null;
        }
        
        // Apply player defense if present
        if (player.buffs.some(b => b.type === "defense")) {
            damage = Math.floor(damage / 2);
        }
        
        // Apply damage to player
        const startHealth = player.health;
        player.health = Math.max(0, player.health - damage);
        GameState.set('player.health', player.health);
        
        // Check if player is defeated
        const playerDefeated = player.health <= 0;
        
        // Emit events
        EventBus.emit('SHOW_DAMAGE', {
            target: 'player',
            amount: damage
        });
        
        if (playerDefeated) {
            EventBus.emit('BATTLE_LOSE');
        }
        
        return {
            success: true,
            damage,
            playerDefeated,
            message: `${enemy.name} attacks for ${damage} damage!`
        };
    },
    
    /**
     * Extract damage value from enemy action
     * @param {String} action - Enemy action string
     * @returns {Number} Damage value
     */
    extractEnemyDamage(action) {
        try {
            const parts = action.split(" ");
            return parseInt(parts[1]) || 5; // Default to 5 if parsing fails
        } catch (e) {
            console.warn("Error parsing enemy attack damage, using default", e);
            return 5;
        }
    },
    
    /**
     * Process enemy defend action
     * @param {Object} enemy - Enemy object
     * @returns {Object} Defend result
     */
    processEnemyDefend(enemy) {
        // Initialize buffs array if it doesn't exist
        if (!enemy.buffs) {
            enemy.buffs = [];
        }
        
        enemy.buffs.push({ type: "defense", turns: 2 });
        
        return {
            success: true,
            message: `${enemy.name} defends, reducing next damage!`
        };
    },
    
    /**
     * Process enemy charge action
     * @param {Object} enemy - Enemy object
     * @returns {Object} Charge result
     */
    processEnemyCharge(enemy) {
        enemy.nextAttackBoost = 2;
        
        return {
            success: true,
            message: `${enemy.name} charges for a stronger attack next turn!`
        };
    },
    
    /**
     * Process enemy steal action
     * @param {Object} enemy - Enemy object
     * @param {Object} player - Player object
     * @returns {Object} Steal result
     */
    processEnemySteal(enemy, player) {
        // Extract zenny value safely
        const zenny = this.extractStealAmount(enemy.currentAction);
        
        // Reduce player zenny
        player.zenny = Math.max(0, player.zenny - zenny);
        GameState.set('player.zenny', player.zenny);
        
        return {
            success: true,
            zenny,
            message: `${enemy.name} steals ${zenny} $ZENNY!`
        };
    },
    
    /**
     * Extract steal amount from enemy action
     * @param {String} action - Enemy action string
     * @returns {Number} Zenny amount to steal
     */
    extractStealAmount(action) {
        try {
            const parts = action.split(" ");
            return parseInt(parts[1]) || 3; // Default to 3 if parsing fails
        } catch (e) {
            console.warn("Error parsing enemy steal amount, using default", e);
            return 3;
        }
    },
    
    /**
     * Apply poison effects to the enemy
     * @returns {Object} Poison effect result
     */
    applyEnemyPoisonEffects() {
        const enemy = GameState.get('battle.enemy');
        
        // Skip if enemy is dead
        if (!enemy || enemy.health <= 0) {
            return {
                success: false,
                reason: "No enemy to apply poison"
            };
        }
        
        const poisonBuff = enemy.buffs?.find(b => b.type === "poison");
        
        if (poisonBuff) {
            enemy.health = Math.max(0, enemy.health - poisonBuff.damage);
            GameState.set('battle.enemy', enemy);
            
            // Emit events
            EventBus.emit('UI_MESSAGE', {
                message: `${enemy.name} takes ${poisonBuff.damage} poison damage!`
            });
            
            EventBus.emit('SHOW_DAMAGE', {
                target: 'enemy',
                amount: poisonBuff.damage,
                isPoison: true
            });
            
            // Check if enemy is defeated
            if (enemy.health <= 0) {
                EventBus.emit('ENEMY_DEFEATED');
                return {
                    success: true,
                    enemyDefeated: true
                };
            }
        }
        
        return {
            success: true,
            poisonApplied: !!poisonBuff
        };
    },
    
    /**
     * Prepare next enemy action
     * @returns {Object} Next action preparation result
     */
    prepareNextEnemyAction() {
        const enemy = GameState.get('battle.enemy');
        
        // Skip if enemy is dead
        if (!enemy || enemy.health <= 0) {
            return {
                success: false,
                reason: "Cannot prepare next action"
            };
        }
        
        // Get next action from queue
        enemy.currentAction = enemy.actionQueue.shift();
        
        // Refill action queue if needed
        if (enemy.actionQueue.length < 3) {
            const shuffledActions = Utils.shuffle([...enemy.actions]);
            enemy.actionQueue.push(
                ...shuffledActions.slice(0, 3 - enemy.actionQueue.length)
            );
        }
        
        // Update enemy state
        GameState.set('battle.enemy', enemy);
        
        return {
            success: true,
            nextAction: enemy.currentAction
        };
    },
    
    /**
     * Finalize enemy turn
     * @returns {Object} Turn finalization result
     */
    finalizeEnemyTurn() {
        const player = GameState.get('player');
        const enemy = GameState.get('battle.enemy');
        
        // Skip if battle is over
        if (GameState.get('battleOver')) {
            return {
                success: false,
                reason: "Battle is over"
            };
        }
        
        // Reset turn state flags
        GameState.set('hasActedThisTurn', false);
        GameState.set('hasPlayedGemThisTurn', false);
        GameState.set('isEnemyTurnPending', false);
        
        // Clear any selected gems
        GameState.set('selectedGems', new Set());
        
        // Restore player stamina
        GameState.set('player.stamina', player.baseStamina);
        
        // Reduce buff durations
        this.reduceBufDurations(player, enemy);
        
        // Draw new cards to fill hand
        Gems.drawCards(Config.MAX_HAND_SIZE);
        
        // Update UI
        EventBus.emit('UI_UPDATE', { target: 'battle' });
        
        // Emit turn events
        EventBus.emit('TURN_END', { turn: 'enemy' });
        EventBus.emit('TURN_START', { turn: 'player' });
        
        return {
            success: true
        };
    },
    
    /**
     * Reduce buff durations for player and enemy
     * @param {Object} player - Player object
     * @param {Object} enemy - Enemy object
     */
    reduceBufDurations(player, enemy) {
        // Reduce player buff durations
        if (player.buffs && player.buffs.length > 0) {
            const updatedPlayerBuffs = player.buffs
                .map(b => ({ ...b, turns: b.turns - 1 }))
                .filter(b => b.turns > 0);
            
            GameState.set('player.buffs', updatedPlayerBuffs);
        }
        
        // Reduce enemy buff durations
        if (enemy && enemy.buffs && enemy.buffs.length > 0) {
            const updatedEnemyBuffs = enemy.buffs
                .map(b => ({ ...b, turns: b.turns - 1 }))
                .filter(b => b.turns > 0);
            
            enemy.buffs = updatedEnemyBuffs;
            GameState.set('battle.enemy', enemy);
        }
    }
};

export default BattleMechanics;