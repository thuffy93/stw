import { GameState } from '../core/state.js';
import { EventBus } from '../core/eventbus.js';
import { Utils } from '../core/utils.js';
import { Gems } from './gem.js';

// Constants
const MAX_HAND_SIZE = 3;
const BATTLES_PER_DAY = 3;

/**
 * Initialize a new battle
 */
export function initBattle() {
    console.log("Initializing battle...");
    
    // Generate enemy if not present
    const enemy = generateEnemy();
    GameState.set('battle.enemy', enemy);
    
    // Reset battle state
    GameState.set({
        'battleOver': false,
        'hasActedThisTurn': false,
        'hasPlayedGemThisTurn': false,
        'isEnemyTurnPending': false,
        'selectedGems': new Set()
    });
    
    // Clear player buffs
    GameState.set('player.buffs', []);
    
    // Reset stamina
    const player = GameState.get('player');
    GameState.set('player.stamina', player.baseStamina);
    
    // Draw initial hand
    Gems.drawCards(MAX_HAND_SIZE);
    
    // Update UI
    updateBattleUI();
    
    // Emit event for UI updates
    EventBus.emit('BATTLE_INIT', { enemy });
}

/**
 * Generate an enemy for the current battle
 * @returns {Object} Enemy data
 */
function generateEnemy() {
    const currentPhaseIndex = GameState.get('currentPhaseIndex') || 0;
    const currentDay = GameState.get('currentDay') || 1;
    const battleCount = GameState.get('battleCount') || 0;
    
    // Simple enemy types for demonstration
    const enemies = [
        { name: "Grunt", maxHealth: 20, actions: ["Attack 5", "Defend", "Attack 3"] },
        { name: "Bandit", maxHealth: 15, actions: ["Attack 7", "Steal 3", "Defend"] },
        { name: "Wolf", maxHealth: 25, actions: ["Attack 4", "Charge", "Attack 6"] }
    ];
    
    // Use a boss for Dark phase (phase index 2)
    let base;
    if (currentPhaseIndex === 2) {
        base = getScaledBoss(currentDay);
    } else {
        base = { ...enemies[battleCount % enemies.length] };
    }
    
    // Prepare enemy for battle
    const enemy = {
        ...base,
        health: base.maxHealth,
        actionQueue: Utils.shuffle([...base.actions]),
        buffs: []
    };
    
    // Set current action
    enemy.currentAction = enemy.actionQueue.shift();
    
    return enemy;
}

/**
 * Get a scaled boss based on current day
 * @param {Number} currentDay - Current day
 * @returns {Object} Scaled boss data
 */
function getScaledBoss(currentDay) {
    const boss = { 
        name: "Dark Guardian", 
        maxHealth: 30, 
        actions: ["Attack 6", "Charge", "Defend"],
        shield: true, 
        shieldColor: "red" 
    };
    
    let scaledBoss = { ...boss };
    
    // Scale boss health and damage with day progression
    scaledBoss.maxHealth = boss.maxHealth + (currentDay - 1) * 5;
    scaledBoss.actions = boss.actions.map(action => {
        if (action.startsWith("Attack")) {
            const baseDamage = parseInt(action.split(" ")[1]);
            return `Attack ${baseDamage + (currentDay - 1)}`;
        }
        return action;
    });
    
    return scaledBoss;
}

/**
 * Execute selected gems in battle
 */
export function executeSelectedGems() {
    console.log("executeSelectedGems called");
    const battleOver = GameState.get('battleOver');
    const selectedGems = GameState.get('selectedGems');
    const currentScreen = GameState.get('currentScreen');
    const hand = GameState.get('hand');
    
    // Enhanced logging for debugging
    console.log("Battle state:", { 
        battleOver, 
        selectedGemsSize: selectedGems.size, 
        currentScreen,
        handLength: hand.length
    });
    
    // Only allow execution in battle screen and when battle is active
    if (currentScreen !== 'battle' || battleOver || !selectedGems.size) {
        console.log("Cannot execute gems: Not in battle, battle is over, or no gems selected");
        
        // Emit UI message event
        EventBus.emit('UI_MESSAGE', { 
            message: "Cannot execute gems right now",
            type: 'error'
        });
        
        return;
    }
    
    // Check if all selected indices are valid
    const validSelection = Array.from(selectedGems).every(index => {
        const isValid = index >= 0 && index < hand.length;
        if (!isValid) {
            console.warn(`Invalid gem index: ${index}, hand length: ${hand.length}`);
        }
        return isValid;
    });
    
    if (!validSelection) {
        console.warn("Invalid gem selection detected, clearing selection");
        GameState.set('selectedGems', new Set()); // Clear invalid selections
        
        // Emit UI update event
        EventBus.emit('UI_UPDATE', { target: 'battle' });
        return;
    }
    
    // Sort indices in descending order to avoid index shifting problems
    const selectedIndices = Array.from(selectedGems).sort((a, b) => b - a);
    console.log("Playing selected gems:", selectedIndices);
    
    let anyPlayed = false;
    
    // Try to play each selected gem
    for (const index of selectedIndices) {
        const success = playGem(index);
        anyPlayed = anyPlayed || success;
        console.log(`Played gem at index ${index}: ${success ? "SUCCESS" : "FAILED"}`);
    }
    
    // Clear selection after playing
    GameState.set('selectedGems', new Set());
    
    // If any gems were played, update the UI
    if (anyPlayed) {
        // Emit UI update events
        EventBus.emit('HAND_UPDATED');
        EventBus.emit('UI_UPDATE', { target: 'battle' });
    }
}

/**
 * Play a gem from the player's hand
 * @param {Number} index - Index of the gem in the hand
 * @returns {Boolean} Whether the gem was successfully played
 */
function playGem(index) {
    console.log(`playGem called with index ${index}`);
    
    try {
        const hand = GameState.get('hand');
        const player = GameState.get('player');
        const enemy = GameState.get('battle.enemy');
        const battleOver = GameState.get('battleOver');
        
        // Enhanced validation with better logging
        if (battleOver) {
            console.log("Cannot play gem: Battle is over");
            return false;
        }
        
        if (index < 0 || index >= hand.length) {
            console.warn(`Invalid gem index: ${index}, hand length: ${hand.length}`);
            return false;
        }
        
        const gem = hand[index];
        if (!gem) {
            console.warn(`No gem found at index ${index}`);
            return false;
        }
        
        console.log(`Playing gem: ${gem.name}, color: ${gem.color}, cost: ${gem.cost}`);
        
        // Check stamina cost
        if (player.stamina < gem.cost) {
            EventBus.emit('UI_MESSAGE', {
                message: "Not enough stamina!",
                type: 'error'
            });
            return false;
        }
        
        // Deduct stamina
        GameState.set('player.stamina', player.stamina - gem.cost);
        
        // Calculate damage multiplier and check proficiency
        const multiplier = Gems.calculateGemMultiplier(gem);
        const gemKey = `${gem.color}${gem.name}`;
        const proficiency = Gems.getGemProficiency(gemKey);
        const gemFails = Gems.checkGemFails(proficiency);
        
        console.log(`Gem execution: multiplier=${multiplier}, gemKey=${gemKey}, proficiency=`, proficiency, `fails=${gemFails}`);
        
        // Process gem effects
        const result = Gems.processGemEffect(gem, gemFails, multiplier);
        
        // Update gem proficiency
        Gems.updateGemProficiency(gemKey, !gemFails);
        
        // Remove gem from hand and add to discard
        const newHand = [...hand];
        newHand.splice(index, 1);
        GameState.set('hand', newHand);
        
        const discard = GameState.get('discard') || [];
        GameState.set('discard', [...discard, gem]);
        
        // Update state
        GameState.set('hasPlayedGemThisTurn', true);
        
        // Emit UI events
        EventBus.emit('HAND_UPDATED');
        EventBus.emit('UI_UPDATE', { target: 'battle' });
        
        // Emit sound events
        if (gemFails) {
            EventBus.emit('PLAY_SOUND', { sound: 'PLAYER_DAMAGE' });
        } else {
            EventBus.emit('PLAY_SOUND', { sound: 'GEM_PLAY' });
            if (gem.damage) {
                EventBus.emit('PLAY_SOUND', { sound: 'ENEMY_DAMAGE' });
            } else if (gem.heal) {
                EventBus.emit('PLAY_SOUND', { sound: 'HEAL' });
            }
        }
        
        // Emit gem execution event
        EventBus.emit('GEM_EXECUTED', { 
            gem,
            success: !gemFails,
            ...result
        });
        
        return true;
    } catch (error) {
        console.error("Error playing gem:", error);
        EventBus.emit('UI_MESSAGE', {
            message: "Error playing gem",
            type: 'error'
        });
        return false;
    }
}

/**
 * End the current turn
 */
export function endTurn() {
    const battleOver = GameState.get('battleOver');
    const player = GameState.get('player');
    
    // Defensive checks for player object
    if (!player) {
        console.error("Player object not found in endTurn");
        return;
    }
    
    // Don't allow ending turn if battle is over or enemy turn is already pending
    if (battleOver || GameState.get('isEnemyTurnPending')) {
        console.log("Turn cannot be ended: battle over or enemy turn pending");
        return;
    }
        
    // Check if player is stunned
    const isStunned = player.buffs.some(b => b.type === "stunned");
    if (isStunned) {
        EventBus.emit('UI_MESSAGE', {
            message: "You are stunned and skip your turn!",
            type: 'error'
        });
    }
    
    // Mark enemy turn as pending
    GameState.set('isEnemyTurnPending', true);
    
    // Update UI to reflect the turn change
    EventBus.emit('UI_UPDATE', { target: 'battle' });
    
    // Process enemy turn with a slight delay
    setTimeout(() => {
        processEnemyTurn();
    }, 300);
    
    // Play turn end sound
    EventBus.emit('PLAY_SOUND', { sound: 'BUTTON_CLICK' });
}

/**
 * Process enemy turn with improved error handling
 */
function processEnemyTurn() {
    // Get enemy and check for battle over state
    const enemy = GameState.get('battle.enemy');
    const battleOver = GameState.get('battleOver');
    
    // Safety check - don't process if battle is over or enemy doesn't exist
    if (battleOver || !enemy) {
        console.log("Cannot process enemy turn: battle over or no enemy");
        finishEnemyTurn();
        return;
    }
    
    EventBus.emit('TURN_START', { turn: 'enemy' });
    
    // Define each phase with its function and delay
    const phases = [
        { fn: executeEnemyAction, delay: 500 },
        { fn: applyEnemyPoisonEffects, delay: 800 },
        { fn: prepareNextAction, delay: 800 },
        { fn: finishEnemyTurn, delay: 800 }
    ];
    
    // Execute first phase, which will chain to others
    executePhase(0);
    
    // Helper function to execute phases sequentially
    function executePhase(index) {
        if (index >= phases.length) return;
        
        const phase = phases[index];
        
        setTimeout(() => {
            try {
                // Execute the phase
                phase.fn();
                
                // Check if battle ended during phase
                if (GameState.get('battleOver') && index < phases.length - 1) {
                    console.log(`Battle ended during phase ${index}`);
                    return;
                }
                
                // Continue to next phase
                executePhase(index + 1);
            } catch (error) {
                console.error(`Error in phase ${index}:`, error);
                safeFinishEnemyTurn();
            }
        }, phase.delay);
    }
}

/**
 * Safe fallback for enemy turn completion on error
 */
function safeFinishEnemyTurn() {
    console.warn("Emergency: Resetting to player turn due to errors");
    
    // Reset all essential battle state
    GameState.set('isEnemyTurnPending', false);
    GameState.set('hasActedThisTurn', false);
    GameState.set('hasPlayedGemThisTurn', false);
    GameState.set('selectedGems', new Set());
    
    // Restore player stamina
    const player = GameState.get('player');
    if (player) {
        GameState.set('player.stamina', player.baseStamina);
    }
    
    // Ensure player has cards to play
    const hand = GameState.get('hand');
    if (hand && hand.length < MAX_HAND_SIZE) {
        Gems.drawCards(MAX_HAND_SIZE - hand.length);
    }
    
    // Update UI and show a message
    EventBus.emit('UI_UPDATE', { target: 'battle' });
    EventBus.emit('UI_MESSAGE', {
        message: "Turn reset due to technical issues",
        type: 'error'
    });
}

/**
 * Execute enemy action
 */
function executeEnemyAction() {
    const enemy = GameState.get('battle.enemy');
    const player = GameState.get('player');
    let message = "";
    
    // Skip if no action or enemy is dead
    if (!enemy || !enemy.currentAction || enemy.health <= 0) {
        console.log("No enemy action to execute");
        return;
    }
    
    // Process based on action type
    if (enemy.currentAction.startsWith("Attack")) {
        // Extract damage value safely
        let damage = 0;
        try {
            const parts = enemy.currentAction.split(" ");
            damage = parseInt(parts[1]) || 5; // Default to 5 if parsing fails
        } catch (e) {
            console.warn("Error parsing enemy attack damage, using default", e);
            damage = 5;
        }
        
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
        player.health = Math.max(0, player.health - damage);
        GameState.set('player.health', player.health);
        
        message = `${enemy.name} attacks for ${damage} damage!`;
        
        // Show damage animation and play sound
        EventBus.emit('SHOW_DAMAGE', {
            target: 'player',
            amount: damage
        });
        EventBus.emit('PLAY_SOUND', { sound: 'PLAYER_DAMAGE' });
        
        // Check if player defeated
        if (player.health <= 0) {
            EventBus.emit('UI_MESSAGE', {
                message: "You were defeated!",
                type: 'error'
            });
            GameState.set('battleOver', true);
            
            // Show defeat animation and play sound
            EventBus.emit('SHOW_DEFEAT');
            EventBus.emit('PLAY_SOUND', { sound: 'DEFEAT' });
            
            // Emit battle lost event
            EventBus.emit('BATTLE_LOSE');
            
            // Delay screen transition
            setTimeout(() => EventBus.emit('SCREEN_CHANGE', { screen: 'characterSelect' }), 2000);
            return;
        }
    } else if (enemy.currentAction === "Defend") {
        message = `${enemy.name} defends, reducing next damage!`;
        
        // Initialize buffs array if it doesn't exist
        if (!enemy.buffs) {
            enemy.buffs = [];
        }
        
        enemy.buffs.push({ type: "defense", turns: 2 });
    } else if (enemy.currentAction === "Charge") {
        message = `${enemy.name} charges for a stronger attack next turn!`;
        enemy.nextAttackBoost = 2;
    } else if (enemy.currentAction.startsWith("Steal")) {
        // Extract zenny value safely
        let zenny = 0;
        try {
            const parts = enemy.currentAction.split(" ");
            zenny = parseInt(parts[1]) || 3; // Default to 3 if parsing fails
        } catch (e) {
            console.warn("Error parsing enemy steal amount, using default", e);
            zenny = 3;
        }
        
        player.zenny = Math.max(0, player.zenny - zenny);
        GameState.set('player.zenny', player.zenny);
        message = `${enemy.name} steals ${zenny} $ZENNY!`;
    } else {
        // Fallback for unknown actions
        message = `${enemy.name} makes a mysterious move...`;
    }
    
    // Update enemy state
    GameState.set('battle.enemy', enemy);
    
    // Log the action
    EventBus.emit('UI_MESSAGE', { message });
    
    // Update UI
    EventBus.emit('UI_UPDATE', { target: 'battle' });
}

/**
 * Apply poison effects to the enemy
 */
function applyEnemyPoisonEffects() {
    const enemy = GameState.get('battle.enemy');
    
    // Skip if enemy is dead
    if (!enemy || enemy.health <= 0) return;
    
    const poisonBuff = enemy.buffs.find(b => b.type === "poison");
    if (poisonBuff) {
        enemy.health = Math.max(0, enemy.health - poisonBuff.damage);
        GameState.set('battle.enemy', enemy);
        
        EventBus.emit('UI_MESSAGE', {
            message: `${enemy.name} takes ${poisonBuff.damage} poison damage!`
        });
        
        EventBus.emit('SHOW_DAMAGE', {
            target: 'enemy',
            amount: poisonBuff.damage,
            isPoison: true
        });
        
        // Update UI
        EventBus.emit('UI_UPDATE', { target: 'battle' });
        
        // Check if enemy defeated
        if (enemy.health <= 0) {
            handleEnemyDefeated();
            return;
        }
    }
}

/**
 * Prepare the enemy's next action
 */
function prepareNextAction() {
    const enemy = GameState.get('battle.enemy');
    
    // Skip if enemy is dead
    if (!enemy || enemy.health <= 0) return;
    
    // Get next action from queue
    enemy.currentAction = enemy.actionQueue.shift();
    
    // Refill action queue if needed
    if (enemy.actionQueue.length < 3) {
        const shuffledActions = Utils.shuffle([...enemy.actions]);
        enemy.actionQueue.push(...shuffledActions.slice(0, 3 - enemy.actionQueue.length));
    }
    
    // Update enemy state
    GameState.set('battle.enemy', enemy);
}

/**
 * Finish the enemy turn and prepare player turn
 */
function finishEnemyTurn() {
    const player = GameState.get('player');
    const enemy = GameState.get('battle.enemy');
    
    // Skip if battle is over
    if (GameState.get('battleOver')) return;
    
    // Reset turn state flags
    GameState.set('hasActedThisTurn', false);
    GameState.set('hasPlayedGemThisTurn', false);
    GameState.set('isEnemyTurnPending', false);
    
    // Clear any selected gems at the start of player turn
    GameState.set('selectedGems', new Set());
    
    // Restore player stamina
    GameState.set('player.stamina', player.baseStamina);
    
    // Reduce buff durations for player
    if (player.buffs && player.buffs.length > 0) {
        const updatedPlayerBuffs = player.buffs
            .map(b => ({ ...b, turns: b.turns - 1 }))
            .filter(b => b.turns > 0);
        
        GameState.set('player.buffs', updatedPlayerBuffs);
    }
    
    // Reduce buff durations for enemy
    if (enemy && enemy.buffs && enemy.buffs.length > 0) {
        const updatedEnemyBuffs = enemy.buffs
            .map(b => ({ ...b, turns: b.turns - 1 }))
            .filter(b => b.turns > 0);
        
        enemy.buffs = updatedEnemyBuffs;
        GameState.set('battle.enemy', enemy);
    }
    
    // Draw new cards to fill hand
    Gems.drawCards(MAX_HAND_SIZE);
    
    // Update UI
    EventBus.emit('UI_UPDATE', { target: 'battle' });
    
    // Emit turn end event
    EventBus.emit('TURN_END', { turn: 'enemy' });
    EventBus.emit('TURN_START', { turn: 'player' });
    
    // Check if battle is over
    checkBattleStatus();
}

/**
 * Check if the battle is over
 */
function checkBattleStatus() {
    const enemy = GameState.get('battle.enemy');
    const player = GameState.get('player');
    
    // Skip if battle is already marked as over
    if (GameState.get('battleOver')) return;
    
    // Check if enemy is defeated
    if (enemy && enemy.health <= 0) {
        handleEnemyDefeated();
        return;
    }
    
    // Check if player is defeated
    if (player.health <= 0) {
        handlePlayerDefeated();
    }
}

/**
 * Handle enemy defeat
 */
function handleEnemyDefeated() {
    const enemy = GameState.get('battle.enemy');
    const player = GameState.get('player');
    
    // Mark battle as over
    GameState.set('battleOver', true);
    
    // Calculate reward based on enemy type
    const reward = enemy.name === "Dark Guardian" ? 30 : 10;
    player.zenny += reward;
    GameState.set('player.zenny', player.zenny);
    
    // Show success message
    EventBus.emit('UI_MESSAGE', {
        message: `${enemy.name} defeated! +${reward} $ZENNY`
    });
    
    // Show victory animation
    EventBus.emit('SHOW_VICTORY');
    EventBus.emit('PLAY_SOUND', { sound: 'VICTORY' });
    
    // Emit battle win event
    EventBus.emit('BATTLE_WIN', { enemy, reward });
    
    // Increment battle count
    const battleCount = GameState.get('battleCount');
    GameState.set('battleCount', battleCount + 1);
    
    // Important: DO NOT reset the hand here, as we need to keep it for the shop
    
    // Delay before transitioning to next screen
    setTimeout(() => {
        progressGameState();
    }, 1500);
}

/**
 * Handle player defeat
 */
function handlePlayerDefeated() {
    // Mark battle as over
    GameState.set('battleOver', true);
    
    // Show defeat message
    EventBus.emit('UI_MESSAGE', {
        message: "You were defeated!",
        type: 'error'
    });
    
    // Show defeat animation
    EventBus.emit('SHOW_DEFEAT');
    EventBus.emit('PLAY_SOUND', { sound: 'DEFEAT' });
    
    // Emit battle lose event
    EventBus.emit('BATTLE_LOSE');
    
    // Delay before returning to character select
    setTimeout(() => {
        EventBus.emit('SCREEN_CHANGE', { screen: 'characterSelect' });
    }, 2000);
}

/**
 * Progress game state after battle victory
 */
function progressGameState() {
    const battleCount = GameState.get('battleCount');
    const currentPhaseIndex = GameState.get('currentPhaseIndex');
    const currentDay = GameState.get('currentDay');
    
    // Log the hand state before transition
    console.log("HAND BEFORE TRANSITION:", GameState.get('hand'));
    
    // Save hand state to localStorage before transition
    localStorage.setItem('stw_temp_hand', JSON.stringify(GameState.get('hand')));
    
    // Check if we need to move to the next phase
    if (battleCount % BATTLES_PER_DAY !== 0) {
        // Move to next phase within the same day
        GameState.set('currentPhaseIndex', currentPhaseIndex + 1);
        
        // Prepare shop
        EventBus.emit('SHOP_PREPARE');
        
        // Switch to shop screen
        EventBus.emit('SCREEN_CHANGE', { screen: 'shop' });
    } else {
        // Complete day - reset phase and increment day
        GameState.set('currentPhaseIndex', 0);
        GameState.set('currentDay', currentDay + 1);
        
        // Check if game is complete
        if (currentDay + 1 > 7) { // MAX_DAYS = 7
            handleGameCompletion();
        } else {
            EventBus.emit('SCREEN_CHANGE', { screen: 'camp' });
        }
    }
}

/**
 * Handle game completion
 */
function handleGameCompletion() {
    // Award bonus meta zenny for completion
    const metaZenny = GameState.get('metaZenny');
    GameState.set('metaZenny', metaZenny + 100);
    
    // Save meta zenny
    EventBus.emit('SAVE_META_ZENNY');
    
    // Show victory message
    EventBus.emit('UI_MESSAGE', {
        message: "Journey complete! Victory!"
    });
    
    // Return to character select
    setTimeout(() => {
        EventBus.emit('SCREEN_CHANGE', { screen: 'characterSelect' });
    }, 2000);
}

/**
 * Wait for a turn (gain focus)
 */
export function waitTurn() {
    const battleOver = GameState.get('battleOver');
    const player = GameState.get('player');
    
    if (battleOver || GameState.get('hasActedThisTurn') || GameState.get('hasPlayedGemThisTurn')) return;
    
    GameState.set('hasActedThisTurn', true);
    
    // Add focus buff
    const playerBuffs = [...player.buffs];
    playerBuffs.push({ type: "focused", turns: 2 });
    GameState.set('player.buffs', playerBuffs);
    
    EventBus.emit('UI_MESSAGE', {
        message: "Waited, gaining focus for next turn (+20% damage/heal)!"
    });
    EventBus.emit('UI_UPDATE', { target: 'battle' });
    
    setTimeout(endTurn, 300);
}

/**
 * Discard selected gems and end turn
 */
export function discardAndEnd() {
    const battleOver = GameState.get('battleOver');
    const selectedGems = GameState.get('selectedGems');
    
    if (battleOver || !selectedGems.size || GameState.get('hasActedThisTurn')) return;
    
    const hand = GameState.get('hand');
    const gemBag = GameState.get('gemBag');
    
    const indices = Array.from(selectedGems).sort((a, b) => b - a);
    const newHand = [...hand];
    const newGemBag = [...gemBag];
    
    indices.forEach(index => {
        const gem = newHand.splice(index, 1)[0];
        newGemBag.push(gem);
    });
    
    GameState.set('hand', newHand);
    GameState.set('gemBag', Utils.shuffle(newGemBag));
    GameState.set('selectedGems', new Set());
    GameState.set('hasActedThisTurn', true);
    
    EventBus.emit('UI_MESSAGE', {
        message: "Discarded and recycled to Gem Bag, ending turn..."
    });
    EventBus.emit('HAND_UPDATED');
    EventBus.emit('UI_UPDATE', { target: 'battle' });
    
    setTimeout(endTurn, 300);
}

/**
 * Flee from battle
 */
export function fleeBattle() {
    const battleOver = GameState.get('battleOver');
    const currentPhaseIndex = GameState.get('currentPhaseIndex');
    
    // Only allow fleeing in first two phases
    if (battleOver || currentPhaseIndex >= 2) return;
    
    GameState.set('battleOver', true);
    GameState.set('player.buffs', []);
    
    const enemy = GameState.get('battle.enemy');
    if (enemy) enemy.buffs = [];
    
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
    
    // Transition to shop
    setTimeout(() => {
        EventBus.emit('SCREEN_CHANGE', { screen: 'shop' });
    }, 1000);
}

/**
 * Update the battle UI
 */
function updateBattleUI() {
    const player = GameState.get('player');
    const enemy = GameState.get('battle.enemy');
    const currentPhaseIndex = GameState.get('currentPhaseIndex');
    const currentDay = GameState.get('currentDay');
    const isEnemyTurnPending = GameState.get('isEnemyTurnPending');
    
    // Emit a comprehensive UI update event
    EventBus.emit('BATTLE_UI_UPDATE', {
        player: {
            health: player.health,
            maxHealth: player.maxHealth,
            stamina: player.stamina,
            baseStamina: player.baseStamina,
            zenny: player.zenny,
            buffs: player.buffs
        },
        enemy: enemy ? {
            name: enemy.name,
            health: enemy.health,
            maxHealth: enemy.maxHealth,
            currentAction: enemy.currentAction,
            actionQueue: enemy.actionQueue,
            buffs: enemy.buffs,
            shield: enemy.shield,
            shieldColor: enemy.shieldColor
        } : null,
        battle: {
            day: currentDay,
            phase: currentPhaseIndex,
            isEnemyTurn: isEnemyTurnPending,
            battleOver: GameState.get('battleOver'),
            selectedGems: GameState.get('selectedGems')
        },
        gems: {
            hand: GameState.get('hand'),
            gemBag: GameState.get('gemBag'),
            discard: GameState.get('discard')
        }
    });
}

/**
 * Toggle gem selection in battle
 * @param {Number} index - Index of the gem in the hand
 */
export function toggleGemSelection(index) {
    console.log(`Toggling gem selection: index=${index}`);
    
    const hand = GameState.get('hand');
    let selectedGems = GameState.get('selectedGems');
    
    // Clone selected gems set
    selectedGems = new Set(selectedGems);
    
    // Validate the index
    if (index < 0 || index >= hand.length || !hand[index]) {
        console.warn("Invalid gem selection attempted:", index);
        GameState.set('selectedGems', new Set());
        EventBus.emit('UI_UPDATE', { target: 'battle' });
        return;
    }
    
    // Toggle selection
    if (selectedGems.has(index)) {
        selectedGems.delete(index);
    } else {
        selectedGems.add(index);
    }
    
    // Update state
    GameState.set('selectedGems', selectedGems);
    
    // Emit selection event for UI
    EventBus.emit('GEM_SELECTION_CHANGED', { 
        index, 
        selected: selectedGems.has(index),
        selectedIndices: Array.from(selectedGems) 
    });
    EventBus.emit('UI_UPDATE', { target: 'battle' });
}

/**
 * Initialize the battle system
 * @param {Object} initializer - Optional initialization parameters
 */
export function initialize(initializer = {}) {
    // Register event handlers
    EventBus.on('SCREEN_CHANGE', ({ screen }) => {
        if (screen === 'battle') {
            // Start a new battle when entering battle screen
            initBattle();
        }
    });
    
    EventBus.on('GEM_SELECT', ({ index }) => {
        toggleGemSelection(index);
    });
    
    EventBus.on('EXECUTE_GEMS', () => {
        executeSelectedGems();
    });
    
    EventBus.on('END_TURN', () => {
        endTurn();
    });
    
    EventBus.on('WAIT_TURN', () => {
        waitTurn();
    });
    
    EventBus.on('DISCARD_AND_END', () => {
        discardAndEnd();
    });
    
    EventBus.on('FLEE_BATTLE', () => {
        fleeBattle();
    });
    
    // Log initialization
    console.log("Battle system initialized with EventBus");
    
    return true;
}

// Export both named functions and a default object for flexibility
export default {
    initialize,
    initBattle,
    executeSelectedGems,
    endTurn,
    waitTurn,
    discardAndEnd,
    fleeBattle,
    toggleGemSelection
};