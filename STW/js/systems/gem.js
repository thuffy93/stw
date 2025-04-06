// Updated gem.js with standardized EventBus patterns

import { GameState } from '../core/state.js';
import { EventBus } from '../core/eventbus.js';
import { Config } from '../core/config.js';
import { Utils } from '../core/utils.js';

import { GemGeneration } from './gem-generation.js';
import { GemProficiency } from './gem-proficiency.js';
import { GemUpgrades } from './gem-upgrades.js';

/**
 * Consolidated Gems Module
 * Provides a comprehensive interface for gem-related operations
 * with standardized event handling
 */
export class GemsManager {
    constructor() {
        // Reference to submodules
        this.Generation = GemGeneration;
        this.Proficiency = GemProficiency;
        this.Upgrades = GemUpgrades;
        
        // Track event subscriptions
        this.eventSubscriptions = [];
        
        // Initialize the gems system
        this.initialize();
    }
    
    /**
     * Initialize the gems system and submodules
     * @returns {Boolean} Initialization success
     */
    initialize() {
        console.log("Initializing Gems system");
        
        // Initialize submodules if they have initialize methods
        if (typeof this.Generation.initialize === 'function') {
            this.Generation.initialize();
        }
        
        if (typeof this.Proficiency.initialize === 'function') {
            this.Proficiency.initialize();
        }
        
        if (typeof this.Upgrades.initialize === 'function') {
            this.Upgrades.initialize();
        }
        
        // Register event handlers
        this.setupEventHandlers();
        
        return true;
    }
    
    /**
     * Helper method to subscribe to events and track subscriptions
     * @param {String} eventName - Event name
     * @param {Function} handler - Event handler
     * @returns {Object} Subscription object
     */
    subscribe(eventName, handler) {
        const subscription = EventBus.on(eventName, handler);
        this.eventSubscriptions.push(subscription);
        return subscription;
    }
    
    /**
     * Unsubscribe from all events (for cleanup)
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
     * Set up gem-related event handlers with standardized pattern
     */
    setupEventHandlers() {
        this.subscribe('GEM_UNLOCK_REQUEST', ({ gemKey }) => {
            this.addToGemCatalog(gemKey);
        });
        
        this.subscribe('GENERATE_GEM_POOL', ({ playerClass }) => {
            const gemPool = this.createClassAppropriateGemPool(playerClass);
            GameState.set('gemCatalog.gemPool', gemPool);
        });
        
        this.subscribe('DRAW_CARDS', ({ count }) => {
            this.drawCards(count);
        });
        
        this.subscribe('GEM_EXECUTE', ({ gemIndex }) => {
            this.executeGem(gemIndex);
        });
        
        this.subscribe('GEM_DISCARD', ({ gemIndex }) => {
            this.discardGem(gemIndex);
        });
    }
    
    /**
     * Create a class-appropriate gem pool
     * @param {String} playerClass - Player's class
     * @returns {Array} Gem keys for the pool
     */
    createClassAppropriateGemPool(playerClass) {
        let gemPool = [];
        const classColors = {
            "Knight": "red",
            "Mage": "blue",
            "Rogue": "green"
        };
        const classColor = classColors[playerClass];
        
        // Basic gems that should be available to all classes
        const basicGemKeys = ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal"];
        
        // First, ensure the basic gems are in the pool
        for (const basicKey of basicGemKeys) {
            gemPool.push(basicKey);
        }
        
        // Get current gem catalog
        const gemCatalog = GameState.get('gemCatalog');
        
        // Add other unlocked gems that match the class color or are grey
        gemCatalog.unlocked.forEach(key => {
            // Skip basic gems (already added)
            if (basicGemKeys.includes(key)) return;
            
            const gemColor = Config.BASE_GEMS[key]?.color;
            
            // Only add if it's class-appropriate (matches class color or is grey)
            if (gemColor === classColor || gemColor === "grey") {
                gemPool.push(key);
            }
        });
        
        return gemPool;
    }
    
    /**
     * Draw cards from gem bag to hand with standardized event patterns
     * @param {Number} count - Number of cards to draw
     * @returns {Array} Cards drawn
     */
    drawCards(count = 1) {
        const hand = GameState.get('hand') || [];
        const gemBag = GameState.get('gemBag') || [];
        const maxHandSize = Config.MAX_HAND_SIZE;
        
        // Check if hand is already full
        if (hand.length >= maxHandSize) {
            EventBus.emit('UI_MESSAGE', {
                message: "Hand is full, cannot draw more gems",
                type: 'info'
            });
            return [];
        }
        
        // Calculate how many cards we can actually draw
        const drawCount = Math.min(count, maxHandSize - hand.length, gemBag.length);
        
        if (drawCount <= 0) {
            if (gemBag.length === 0) {
                EventBus.emit('UI_MESSAGE', {
                    message: "Gem bag is empty",
                    type: 'info'
                });
            }
            return [];
        }
        
        // Draw cards from gem bag
        const drawnCards = gemBag.slice(0, drawCount);
        const newGemBag = gemBag.slice(drawCount);
        
        // Update state
        GameState.set('hand', [...hand, ...drawnCards]);
        GameState.set('gemBag', newGemBag);
        
        // Emit hand updated event with consistent data format
        EventBus.emit('HAND_UPDATED', {
            hand: [...hand, ...drawnCards],
            cardsDrawn: drawnCards,
            drawCount
        });
        
        return drawnCards;
    }
    
    /**
     * Validate a gem's usability
     * @param {Object} gem - Gem to validate
     * @param {Object} context - Context for validation (battle state, etc.)
     * @returns {Object} Validation result
     */
    validateGemUsage(gem, context = {}) {
        const player = GameState.get('player');
        const validationResult = {
            usable: true,
            reasons: []
        };
        
        // Check stamina cost
        if (player.stamina < gem.cost) {
            validationResult.usable = false;
            validationResult.reasons.push("Not enough stamina");
        }
        
        // Check proficiency
        const gemKey = `${gem.color}${gem.name.replace(/\s+/g, '')}`;
        const proficiency = this.Proficiency.getGemProficiency(gemKey);
        const failsProficiencyCheck = this.Proficiency.checkGemFails(proficiency);
        
        if (failsProficiencyCheck) {
            validationResult.usable = false;
            validationResult.reasons.push("Low proficiency");
        }
        
        // Additional context-specific validations
        if (context.battleOver) {
            validationResult.usable = false;
            validationResult.reasons.push("Battle is over");
        }
        
        if (player.buffs && player.buffs.some(b => b.type === "stunned")) {
            validationResult.usable = false;
            validationResult.reasons.push("Player is stunned");
        }
        
        return validationResult;
    }
    
    /**
     * Calculate gem effectiveness multiplier
     * @param {Object} gem - Gem object
     * @returns {Number} Effectiveness multiplier
     */
    calculateGemEffectiveness(gem) {
        const player = GameState.get('player');
        let multiplier = 1;
        
        // Class bonus
        const classBonus = {
            "Knight": "red",
            "Mage": "blue", 
            "Rogue": "green"
        };
        
        if (player.class && classBonus[player.class] === gem.color) {
            multiplier *= 1.5;
        }
        
        // Focus buff
        if (player.buffs && player.buffs.some(b => b.type === "focused")) {
            multiplier *= 1.2;
        }
        
        return multiplier;
    }
    
    /**
     * Process a gem's effect using standardized event patterns
     * @param {Object} gem - Gem to process
     * @param {Boolean} fails - Whether the gem fails
     * @param {Number} multiplier - Effectiveness multiplier
     * @returns {Object} Effect result
     */
    processGemEffect(gem, fails, multiplier = 1) {
        if (fails) {
            // Emit failure event with consistent pattern
            EventBus.emit('GEM_EXECUTION_FAILED', {
                gem,
                reason: "Low proficiency"
            });
            
            return { success: false, reason: "Gem failed due to low proficiency" };
        }
        
        const result = { success: true, effects: [] };
        
        // Process damage
        if (gem.damage) {
            const damage = Math.floor(gem.damage * multiplier);
            result.effects.push({ type: 'damage', amount: damage });
            
            // Apply damage to enemy
            const enemy = GameState.get('battle.enemy');
            if (enemy) {
                enemy.health = Math.max(0, enemy.health - damage);
                GameState.set('battle.enemy', enemy);
                
                // Emit damage event with consistent pattern
                EventBus.emit('DAMAGE_DEALT', {
                    target: 'enemy',
                    source: 'gem',
                    amount: damage,
                    gem
                });
                
                result.damageDealt = damage;
            }
        }
        
        // Process healing
        if (gem.heal) {
            const player = GameState.get('player');
            const healAmount = Math.floor(gem.heal * multiplier);
            const startHealth = player.health;
            
            player.health = Math.min(player.health + healAmount, player.maxHealth);
            GameState.set('player.health', player.health);
            
            const actualHeal = player.health - startHealth;
            result.effects.push({ type: 'heal', amount: actualHeal });
            
            // Emit heal event with consistent pattern
            EventBus.emit('HEALING_APPLIED', {
                target: 'player',
                source: 'gem',
                amount: actualHeal,
                gem
            });
            
            result.healingDone = actualHeal;
        }
        
        // Process shield
        if (gem.shield) {
            const player = GameState.get('player');
            const buffs = [...player.buffs];
            
            // Add or refresh shield buff
            const existingShield = buffs.findIndex(b => b.type === "defense");
            
            if (existingShield >= 0) {
                buffs[existingShield].turns = Math.max(buffs[existingShield].turns, 2);
            } else {
                buffs.push({ type: "defense", turns: 2 });
            }
            
            GameState.set('player.buffs', buffs);
            
            // Emit buff event with consistent pattern
            EventBus.emit('BUFF_APPLIED', {
                target: 'player',
                buff: { type: "defense", turns: 2 },
                source: 'gem',
                gem
            });
            
            result.effects.push({ type: 'shield', duration: 2 });
        }
        
        // Process poison
        if (gem.poison) {
            const enemy = GameState.get('battle.enemy');
            if (enemy) {
                if (!enemy.buffs) enemy.buffs = [];
                
                // Add or refresh poison buff
                const existingPoison = enemy.buffs.findIndex(b => b.type === "poison");
                const poisonDamage = Math.floor(gem.poison * multiplier);
                
                if (existingPoison >= 0) {
                    enemy.buffs[existingPoison].turns = Math.max(enemy.buffs[existingPoison].turns, 3);
                    enemy.buffs[existingPoison].damage = Math.max(enemy.buffs[existingPoison].damage, poisonDamage);
                } else {
                    enemy.buffs.push({ type: "poison", turns: 3, damage: poisonDamage });
                }
                
                GameState.set('battle.enemy', enemy);
                
                // Emit buff event with consistent pattern
                EventBus.emit('BUFF_APPLIED', {
                    target: 'enemy',
                    buff: { type: "poison", turns: 3, damage: poisonDamage },
                    source: 'gem',
                    gem
                });
                
                result.effects.push({ type: 'poison', duration: 3, damage: poisonDamage });
            }
        }
        
        return result;
    }
    
    /**
     * Execute a specific gem from hand
     * @param {Number} gemIndex - Index of gem in hand
     * @returns {Object} Execution result
     */
    executeGem(gemIndex) {
        const hand = GameState.get('hand');
        const player = GameState.get('player');
        
        // Validate index
        if (gemIndex < 0 || gemIndex >= hand.length) {
            EventBus.emit('UI_MESSAGE', {
                message: "Invalid gem selection",
                type: 'error'
            });
            return { success: false, reason: "Invalid gem index" };
        }
        
        const gem = hand[gemIndex];
        
        // Validate gem usage
        const validationResult = this.validateGemUsage(gem, {
            battleOver: GameState.get('battleOver')
        });
        
        if (!validationResult.usable) {
            EventBus.emit('UI_MESSAGE', {
                message: validationResult.reasons[0] || "Cannot use this gem",
                type: 'error'
            });
            return { success: false, reasons: validationResult.reasons };
        }
        
        // Deduct stamina
        GameState.set('player.stamina', player.stamina - gem.cost);
        
        // Process gem effect
        const multiplier = this.calculateGemEffectiveness(gem);
        const gemKey = `${gem.color}${gem.name.replace(/\s+/g, '')}`;
        const proficiency = this.Proficiency.getGemProficiency(gemKey);
        const gemFails = this.Proficiency.checkGemFails(proficiency);
        
        const result = this.processGemEffect(gem, gemFails, multiplier);
        
        // Update proficiency
        this.Proficiency.updateGemProficiency(gemKey, !gemFails);
        
        // Remove gem from hand
        const newHand = [...hand];
        newHand.splice(gemIndex, 1);
        GameState.set('hand', newHand);
        
        // Add to discard
        const discard = GameState.get('discard') || [];
        GameState.set('discard', [...discard, gem]);
        
        // Update state flags
        GameState.set('hasPlayedGemThisTurn', true);
        
        // Emit gem played event
        EventBus.emit('GEM_EXECUTED', {
            gem,
            index: gemIndex,
            success: !gemFails,
            ...result
        });
        
        // Update hand display
        EventBus.emit('HAND_UPDATED', { hand: newHand });
        
        return result;
    }
    
    /**
     * Generate upgrade options for a gem
     * @param {Object} selectedGem - The gem to upgrade
     * @returns {Array} Upgrade options
     */
    generateUpgradeOptions(selectedGem) {
        return this.Upgrades.generateUpgradeOptions(selectedGem);
    }
    
    /**
     * Create a new gem bag for a player
     * @param {String} playerClass - Player's class
     * @param {Boolean} resetHand - Whether to also reset the hand
     * @returns {Array} Created gem bag
     */
    resetGemBag(playerClass, resetHand = true) {
        const gemBag = this.Generation.createInitialGemBag(playerClass);
        GameState.set('gemBag', gemBag);
        
        if (resetHand) {
            const initialHand = gemBag.slice(0, Config.MAX_HAND_SIZE);
            const remainingGemBag = gemBag.slice(Config.MAX_HAND_SIZE);
            
            GameState.set('hand', initialHand);
            GameState.set('gemBag', remainingGemBag);
            GameState.set('discard', []);
            
            // Emit hand updated event
            EventBus.emit('HAND_UPDATED', { 
                hand: initialHand,
                isInitialHand: true
            });
        }
        
        return gemBag;
    }
    
    /**
     * Add a new gem to the player's gem catalog
     * @param {String} gemKey - Key of the gem to add
     * @returns {Boolean} Whether the gem was successfully added
     */
    addToGemCatalog(gemKey) {
        const gemCatalog = GameState.get('gemCatalog');
        const player = GameState.get('player');
        
        // Validate gem key
        if (!Config.BASE_GEMS[gemKey]) {
            EventBus.emit('UI_MESSAGE', {
                message: "Invalid gem!",
                type: 'error'
            });
            return false;
        }
        
        // Check if already unlocked
        if (gemCatalog.unlocked.includes(gemKey)) {
            EventBus.emit('UI_MESSAGE', {
                message: "Gem already unlocked!",
                type: 'error'
            });
            return false;
        }
        
        // Add to unlocked gems
        const updatedUnlocked = [...gemCatalog.unlocked, gemKey];
        
        // Remove from available if present
        const updatedAvailable = gemCatalog.available.filter(key => key !== gemKey);
        
        // Update gem catalog
        GameState.set('gemCatalog', {
            ...gemCatalog,
            unlocked: updatedUnlocked,
            available: updatedAvailable
        });
        
        // Update class-specific catalog
        const classGemCatalogs = GameState.get('classGemCatalogs') || {};
        const currentClassCatalog = classGemCatalogs[player.class] || {};
        
        classGemCatalogs[player.class] = {
            ...currentClassCatalog,
            unlocked: [...(currentClassCatalog.unlocked || []), gemKey],
            available: (currentClassCatalog.available || []).filter(key => key !== gemKey)
        };
        
        GameState.set('classGemCatalogs', classGemCatalogs);
        
        // Emit events - use consistent event data format
        EventBus.emit('GEM_ADDED_TO_CATALOG', { 
            gemKey, 
            gem: Config.BASE_GEMS[gemKey],
            catalog: {
                unlocked: updatedUnlocked,
                available: updatedAvailable
            }
        });
        
        EventBus.emit('UI_MESSAGE', {
            message: `Unlocked ${Config.BASE_GEMS[gemKey].name} gem!`
        });
        
        return true;
    }
    
    /**
     * Discard a gem from hand to gem bag
     * @param {Number} gemIndex - Index of gem in hand
     * @returns {Boolean} Success
     */
    discardGem(gemIndex) {
        const hand = GameState.get('hand');
        const gemBag = GameState.get('gemBag');
        
        // Validate index
        if (gemIndex < 0 || gemIndex >= hand.length) {
            EventBus.emit('UI_MESSAGE', {
                message: "Invalid gem selection",
                type: 'error'
            });
            return false;
        }
        
        // Get the gem to discard
        const discardedGem = hand[gemIndex];
        
        // Remove from hand
        const newHand = [...hand];
        newHand.splice(gemIndex, 1);
        GameState.set('hand', newHand);
        
        // Add to gem bag
        const newGemBag = [...gemBag, discardedGem];
        
        // Shuffle gem bag
        const shuffledBag = Utils.shuffle(newGemBag);
        GameState.set('gemBag', shuffledBag);
        
        // Emit events
        EventBus.emit('GEM_DISCARDED', {
            gem: discardedGem,
            index: gemIndex
        });
        
        EventBus.emit('HAND_UPDATED', { hand: newHand });
        
        return true;
    }
}

// Create singleton instance
export const Gems = new GemsManager();

// For backwards compatibility
export default Gems;