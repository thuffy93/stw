import { GameState } from '../core/state.js';
import { EventBus } from '../core/eventbus.js';
import { Config } from '../core/config.js';
import { Utils } from '../core/utils.js';

import BattleInitialization from './battle-initialization.js';
import BattleMechanics from './battle-mechanics.js';
import Gems from './gem.js';

/**
 * Battle System Module
 * Comprehensive battle system management
 */
export const Battle = {
    Initialization: BattleInitialization,
    Mechanics: BattleMechanics,
    
    /**
     * Initialize the battle system
     * @returns {Boolean} Initialization success
     */
    initialize() {
        console.log("Initializing Battle System");
        this.setupEventHandlers();
        
        const gemBag = GameState.get('gemBag');
        const hand = GameState.get('hand');
        console.log("Battle starting with gemBag:", gemBag);
        console.log("Battle starting with hand:", hand);
        
        return true;
    },
    
    /**
     * Set up event handlers for battle-related events
     */
    setupEventHandlers() {
        // Battle initialization events
        EventBus.on('START_BATTLE', () => {
            this.Initialization.initializeBattle();
        });
        
        // Gem-related events
        EventBus.on('EXECUTE_GEMS', () => {
            const selectedGems = GameState.get('selectedGems');
            this.Mechanics.executeSelectedGems(selectedGems);
        });
        
        // Turn management events
        EventBus.on('END_TURN', () => {
            this.Mechanics.endTurn();
        });
        
        EventBus.on('WAIT_TURN', () => {
            this.Mechanics.waitTurn();
        });
        
        EventBus.on('DISCARD_AND_END', () => {
            this.Mechanics.discardAndEndTurn();
        });
        
        // Enemy turn events
        EventBus.on('PROCESS_ENEMY_TURN', () => {
            this.Mechanics.processEnemyTurn();
        });
        
        // Battle progression events
        EventBus.on('BATTLE_WIN', (outcome) => {
            this.handleBattleVictory(outcome);
        });
        
        EventBus.on('BATTLE_LOSE', () => {
            this.handleBattleDefeat();
        });
        
        // Additional battle events
        EventBus.on('FLEE_BATTLE', () => {
            this.Mechanics.fleeBattle();
        });
        
        // Battle state tracking
        EventBus.on('BATTLE_STATE_UPDATE', () => {
            this.updateBattleState();
        });
    },
    
    /**
     * Handle battle victory
     * @param {Object} outcome - Battle outcome details
     */
    handleBattleVictory(outcome) {
        // Mark battle as over
        GameState.set('battleOver', true);
        
        // Calculate and award rewards
        const player = GameState.get('player');
        const reward = outcome.reward || 10;
        player.zenny += reward;
        GameState.set('player.zenny', player.zenny);
        
        // Emit victory events
        EventBus.emit('UI_MESSAGE', {
            message: `Victory! Earned ${reward} $ZENNY`,
            type: 'success'
        });
        
        // Progress game state
        const progression = this.Initialization.progressGameState({
            result: 'victory',
            reward
        });
        
        // Transition to next screen
        EventBus.emit('SCREEN_CHANGE', progression.screenTransition);
    },
    
    /**
     * Handle battle defeat
     */
    handleBattleDefeat() {
        // Mark battle as over
        GameState.set('battleOver', true);
        
        // Emit defeat events
        EventBus.emit('UI_MESSAGE', {
            message: "Defeat! Your journey ends here.",
            type: 'error'
        });
        
        // Transition to character select
        EventBus.emit('SCREEN_CHANGE', 'characterSelect');
    },
    
    /**
     * Update overall battle state
     */
    updateBattleState() {
        const player = GameState.get('player');
        const enemy = GameState.get('battle.enemy');
        
        // Check for battle end conditions
        if (player.health <= 0) {
            EventBus.emit('BATTLE_LOSE');
        } else if (enemy && enemy.health <= 0) {
            EventBus.emit('BATTLE_WIN', { 
                enemy, 
                reward: enemy.name === "Dark Guardian" ? 30 : 10 
            });
        }
    },
    
    /**
     * Toggle gem selection
     * @param {Number} index - Index of the gem in hand
     * @param {Boolean} isShop - Whether selection is in shop context
     */
    toggleGemSelection(index, isShop = false) {
        const hand = GameState.get('hand');
        let selectedGems = GameState.get('selectedGems');
        
        // Validate the index
        if (index < 0 || index >= hand.length || !hand[index]) {
            console.warn("Invalid gem selection attempted:", index);
            GameState.set('selectedGems', new Set());
            return;
        }
        
        // Clone the set
        selectedGems = new Set(selectedGems);
        
        // In shop, only allow selecting one gem at a time
        if (isShop) {
            selectedGems = selectedGems.has(index) ? new Set() : new Set([index]);
        } else {
            // In battle, allow multiple selection
            if (selectedGems.has(index)) {
                selectedGems.delete(index);
            } else {
                selectedGems.add(index);
            }
        }
        
        // Update state
        GameState.set('selectedGems', selectedGems);
        
        // Emit selection change event
        EventBus.emit('GEM_SELECTION_CHANGED', { 
            index, 
            selected: selectedGems.has(index),
            selectedIndices: Array.from(selectedGems) 
        });
    }
};

export default Battle;