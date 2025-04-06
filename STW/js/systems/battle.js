// Enhanced Battle module with proper initialization support
// For STW/js/systems/battle.js

import { GameState } from '../core/state.js';
import { EventBus } from '../core/eventbus.js';
import { Config } from '../core/config.js';
import { Utils } from '../core/utils.js';

import { BattleInitialization } from './battle-initialization.js';
import { BattleMechanics } from './battle-mechanics.js';
import { Gems } from './gem.js';

/**
 * Battle System Module - enhanced with proper initialization support
 * Comprehensive battle system management with standardized event handling
 */
export class Battle {
    constructor() {
        // Reference submodules
        this.Initialization = BattleInitialization;
        this.Mechanics = BattleMechanics;
        
        // Track subscriptions for cleanup
        this.eventSubscriptions = [];
        
        // Track initialization status
        this.initialized = false;
    }
    
    /**
     * Initialize the battle system
     * @returns {Boolean} Initialization success
     */
    initialize() {
        // Prevent multiple initializations
        if (this.initialized) {
            console.log("Battle system already initialized");
            return true;
        }
        
        console.log("Initializing Battle System");
        
        // Initialize submodules if they have initialize methods
        if (typeof this.Initialization.initialize === 'function') {
            this.Initialization.initialize();
        }
        
        if (typeof this.Mechanics.initialize === 'function') {
            this.Mechanics.initialize();
        }
        
        this.setupEventHandlers();
        
        // Mark as initialized
        this.initialized = true;
        
        return true;
    }
    
    /**
     * Helper method to subscribe to events and track subscriptions
     * @param {String} eventName - Event name
     * @param {Function} handler - Event handler function
     * @returns {Object} Subscription object
     */
    subscribe(eventName, handler) {
        const subscription = EventBus.on(eventName, handler);
        this.eventSubscriptions.push(subscription);
        return subscription;
    }
    
    /**
     * Unsubscribe from all events (useful for cleanup)
     */
    unsubscribeAll() {
        this.eventSubscriptions.forEach(subscription => {
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        });
        this.eventSubscriptions = [];
    }
    
    /**
     * Set up event handlers for battle-related events using standardized pattern
     */
    setupEventHandlers() {
        // Battle initialization events
        this.subscribe('START_BATTLE', () => {
            this.Initialization.initializeBattle();
        });
        
        // Gem-related events
        this.subscribe('EXECUTE_GEMS', () => {
            const selectedGems = GameState.get('selectedGems');
            this.Mechanics.executeSelectedGems(selectedGems);
        });
        
        // Turn management events
        this.subscribe('END_TURN', () => {
            this.Mechanics.endTurn();
        });
        
        this.subscribe('WAIT_TURN', () => {
            this.Mechanics.waitTurn();
        });
        
        this.subscribe('DISCARD_AND_END', () => {
            this.Mechanics.discardAndEndTurn();
        });
        
        // Enemy turn events
        this.subscribe('PROCESS_ENEMY_TURN', () => {
            this.Mechanics.processEnemyTurn();
        });
        
        // Battle progression events
        this.subscribe('BATTLE_WIN', (outcome) => {
            this.handleBattleVictory(outcome);
        });
        
        this.subscribe('BATTLE_LOSE', () => {
            this.handleBattleDefeat();
        });
        
        // Additional battle events
        this.subscribe('FLEE_BATTLE', () => {
            this.Mechanics.fleeBattle();
        });
        
        // Battle state tracking
        this.subscribe('BATTLE_STATE_UPDATE', () => {
            this.updateBattleState();
        });
    }
    
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
    }
    
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
    }
    
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
    }
    
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
}

// Create singleton instance
export const BattleInstance = new Battle();

// For backwards compatibility, export both the class and the instance
export { BattleInstance as default };