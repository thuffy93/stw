import { GameState } from '../core/state.js';
import { EventBus } from '../core/eventbus.js';
import { Config } from '../core/config.js';
import { Utils } from '../core/utils.js';

/**
 * Battle Initialization Module
 * Responsible for creating and setting up battle scenarios
 */
export const BattleInitialization = {
    /**
     * Generate an enemy for the current battle
     * @returns {Object} Enemy data
     */
    generateEnemy() {
        const currentPhaseIndex = GameState.get('currentPhaseIndex') || 0;
        const currentDay = GameState.get('currentDay') || 1;
        const battleCount = GameState.get('battleCount') || 0;
        
        // Determine enemy type based on phase and day
        let enemyBase;
        
        // Use a boss for Dark phase (phase index 2)
        if (currentPhaseIndex === 2) {
            enemyBase = this.getScaledBoss(currentDay);
        } else {
            // Standard enemies
            const enemies = Config.ENEMIES;
            enemyBase = { ...enemies[battleCount % enemies.length] };
        }
        
        // Prepare enemy for battle
        const enemy = {
            ...enemyBase,
            health: enemyBase.maxHealth,
            actionQueue: Utils.shuffle([...enemyBase.actions]),
            buffs: []
        };
        
        // Set current action
        enemy.currentAction = enemy.actionQueue.shift();
        
        return enemy;
    },
    
    /**
     * Get a scaled boss based on current day
     * @param {Number} currentDay - Current day
     * @returns {Object} Scaled boss data
     */
    getScaledBoss(currentDay) {
        const boss = Config.BOSS;
        
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
    },
    
    /**
     * Initialize a new battle
     * @returns {Object} Battle initialization result
     */
    initializeBattle() {
        console.log("Initializing battle...");
        
        // Generate enemy
        const enemy = this.generateEnemy();
        
        // Prepare battle state
        const battleState = {
            enemy,
            phase: 'Dawn',
            turn: 'player',
            isEnemyTurnPending: false,
            battleOver: false
        };
        
        // Update game state
        GameState.set('battle', battleState);
        GameState.set('battleOver', false);
        GameState.set('hasActedThisTurn', false);
        GameState.set('hasPlayedGemThisTurn', false);
        GameState.set('isEnemyTurnPending', false);
        GameState.set('selectedGems', new Set());
        
        // Reset player stamina
        const player = GameState.get('player');
        GameState.set('player.stamina', player.baseStamina);
        
        // Emit initialization events
        EventBus.emit('BATTLE_INITIALIZED', { 
            enemy, 
            battleState 
        });
        
        return {
            success: true,
            enemy
        };
    },
    
    /**
     * Determine battle outcome
     * @returns {Object} Battle outcome details
     */
    determineBattleOutcome() {
        const player = GameState.get('player');
        const enemy = GameState.get('battle.enemy');
        
        if (player.health <= 0) {
            return {
                result: 'defeat',
                reason: 'Player defeated'
            };
        }
        
        if (enemy.health <= 0) {
            const reward = enemy.name === "Dark Guardian" ? 30 : 10;
            
            return {
                result: 'victory',
                reward,
                reason: `${enemy.name} defeated`
            };
        }
        
        return {
            result: 'ongoing',
            reason: 'Battle continues'
        };
    },
    
    /**
     * Progress game state after battle
     * @param {Object} outcome - Battle outcome
     * @returns {Object} Progression details
     */
    progressGameState(outcome) {
        const currentDay = GameState.get('currentDay');
        const battleCount = GameState.get('battleCount');
        const currentPhaseIndex = GameState.get('currentPhaseIndex');
        
        // Calculate progression
        const nextBattleCount = battleCount + 1;
        const nextPhaseIndex = currentPhaseIndex + 1;
        const nextDay = outcome.result === 'victory' && nextPhaseIndex % Config.BATTLES_PER_DAY === 0 
            ? currentDay + 1 
            : currentDay;
        
        // Prepare progression data
        const progression = {
            battleCount: nextBattleCount,
            phaseIndex: nextPhaseIndex % Config.PHASES.length,
            day: nextDay,
            screenTransition: this.determineNextScreen(outcome, nextPhaseIndex, nextDay)
        };
        
        // Update game state
        if (outcome.result === 'victory') {
            const player = GameState.get('player');
            player.zenny += outcome.reward || 0;
            GameState.set('player.zenny', player.zenny);
        }
        
        GameState.set('currentDay', progression.day);
        GameState.set('currentPhaseIndex', progression.phaseIndex);
        GameState.set('battleCount', progression.battleCount);
        
        return progression;
    },
    
    /**
     * Determine the next screen based on battle outcome
     * @param {Object} outcome - Battle outcome
     * @param {Number} nextPhaseIndex - Next phase index
     * @param {Number} nextDay - Next day
     * @returns {String} Next screen
     */
    determineNextScreen(outcome, nextPhaseIndex, nextDay) {
        if (outcome.result === 'defeat') {
            return 'characterSelect';
        }
        
        // If not the last day's final battle
        if (nextDay <= Config.MAX_DAYS) {
            return nextPhaseIndex % Config.BATTLES_PER_DAY !== 0 
                ? 'shop' 
                : 'camp';
        }
        
        // Game completed
        return 'characterSelect';
    }
};

export default BattleInitialization;