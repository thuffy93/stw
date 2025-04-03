import { GameState } from '../core/state.js';
import { EventBus } from '../core/eventbus.js';
import { Config } from '../core/config.js';
import { Utils } from '../core/utils.js';

/**
 * Character module - Handles player character creation and management
 */
export const Character = (() => {
    /**
     * Create a new character with the specified class
     * @param {String} className - Class name (Knight, Mage, Rogue)
     * @returns {Object} Created character data
     */
    function createCharacter(className) {
        if (!Config.CLASSES[className]) {
            console.error(`Invalid class name: ${className}`);
            return null;
        }
        
        const classConfig = Config.CLASSES[className];
        
        // Create base character
        const character = {
            class: className,
            maxHealth: classConfig.maxHealth,
            health: classConfig.maxHealth,
            stamina: classConfig.baseStamina,
            baseStamina: classConfig.baseStamina,
            zenny: classConfig.startingZenny || 0,
            buffs: []
        };
        
        // Set game state with the new character
        GameState.set('player', character);
        
        // Reset game progress
        GameState.set('currentDay', 1);
        GameState.set('currentPhaseIndex', 0);
        GameState.set('battleCount', 0);
        GameState.set('battleOver', false);
        GameState.set('selectedGems', new Set());
        
        // Set up gem catalog for this class
        setupGemCatalog(className);
        
        // Emit character created event
        EventBus.emit('CHARACTER_CREATED', { character, className });
        
        return character;
    }
    
    /**
     * Set up the gem catalog for a specific class
     * @param {String} className - Class name
     */
    function setupGemCatalog(className) {
        // Get class-specific catalog from the state if it exists
        const classGemCatalog = GameState.get(`classGemCatalogs.${className}`);
        
        if (classGemCatalog) {
            // Use existing class-specific catalog
            console.log(`Using existing gem catalog for ${className}`);
            GameState.set('gemCatalog', Utils.deepClone(classGemCatalog));
        } else {
            // Initialize from default configuration
            console.log(`Creating new gem catalog for ${className}`);
            const initialUnlocks = Config.INITIAL_GEM_UNLOCKS[className].unlocked || [];
            const initialAvailable = Config.INITIAL_GEM_UNLOCKS[className].available || [];
            
            const newCatalog = {
                unlocked: [...initialUnlocks],
                available: [...initialAvailable],
                maxCapacity: 15,
                gemPool: [],
                upgradedThisShop: new Set()
            };
            
            // Set up both the current catalog and class-specific catalog
            GameState.set('gemCatalog', newCatalog);
            GameState.set(`classGemCatalogs.${className}`, Utils.deepClone(newCatalog));
        }
        
        // Set up gem proficiency
        setupGemProficiency(className);
    }
    
    /**
     * Set up gem proficiency for a specific class
     * @param {String} className - Class name
     */
    function setupGemProficiency(className) {
        // Get class-specific proficiency from the state if it exists
        const classProficiency = GameState.get(`classGemProficiency.${className}`);
        
        if (classProficiency) {
            // Use existing class-specific proficiency
            console.log(`Using existing gem proficiency for ${className}`);
            GameState.set('gemProficiency', Utils.deepClone(classProficiency));
        } else {
            // Initialize from default configuration
            console.log(`Creating new gem proficiency for ${className}`);
            const initialProficiency = Config.INITIAL_GEM_PROFICIENCY[className] || {};
            
            // Set up both the current proficiency and class-specific proficiency
            GameState.set('gemProficiency', Utils.deepClone(initialProficiency));
            GameState.set(`classGemProficiency.${className}`, Utils.deepClone(initialProficiency));
        }
    }
    
    /**
     * Apply a buff to the player
     * @param {Object} buff - Buff to apply
     */
    function applyBuff(buff) {
        const player = GameState.get('player');
        const buffs = [...player.buffs];
        
        // Check if buff of same type already exists
        const existingIndex = buffs.findIndex(b => b.type === buff.type);
        
        if (existingIndex >= 0) {
            // Replace existing buff with new one (or extend duration)
            buffs[existingIndex] = {
                ...buffs[existingIndex],
                turns: Math.max(buffs[existingIndex].turns, buff.turns)
            };
        } else {
            // Add new buff
            buffs.push(buff);
        }
        
        // Update player state
        GameState.set('player.buffs', buffs);
        
        // Emit buff applied event
        EventBus.emit('BUFF_APPLIED', { target: 'player', buff });
    }
    
    /**
     * Remove all buffs from the player
     */
    function clearBuffs() {
        GameState.set('player.buffs', []);
    }
    
    /**
     * Take damage and handle effects
     * @param {Number} amount - Amount of damage
     * @param {Boolean} isPoison - Whether this is poison damage
     * @returns {Object} Result of damage application
     */
    function takeDamage(amount, isPoison = false) {
        const player = GameState.get('player');
        const startHealth = player.health;
        
        // Check for defense buff
        const hasDefense = player.buffs.some(b => b.type === "defense");
        if (hasDefense) {
            amount = Math.floor(amount * 0.5);
        }
        
        // Apply damage
        player.health = Math.max(0, player.health - amount);
        GameState.set('player.health', player.health);
        
        // Calculate actual damage dealt
        const damageDealt = startHealth - player.health;
        
        // Check if player defeated
        const defeated = player.health <= 0;
        
        // Emit damage event
        EventBus.emit('DAMAGE_TAKEN', { 
            target: 'player', 
            amount: damageDealt,
            isPoison, 
            hasDefense,
            defeated
        });
        
        return { 
            damageDealt, 
            hasDefense, 
            defeated 
        };
    }
    
    /**
     * Heal the player
     * @param {Number} amount - Amount to heal
     * @returns {Number} Actual amount healed
     */
    function heal(amount) {
        const player = GameState.get('player');
        const startHealth = player.health;
        
        // Check for focused buff
        const hasFocus = player.buffs.some(b => b.type === "focused");
        if (hasFocus) {
            amount = Math.floor(amount * 1.2);
        }
        
        // Apply healing up to max health
        player.health = Math.min(player.health + amount, player.maxHealth);
        GameState.set('player.health', player.health);
        
        // Calculate actual healing done
        const healingDone = player.health - startHealth;
        
        // Emit healing event
        EventBus.emit('PLAYER_HEALED', { amount: healingDone, hasFocus });
        
        return healingDone;
    }
    
    /**
     * Update player stamina
     * @param {Number} amount - Amount to add or subtract (negative for subtraction)
     * @returns {Number} New stamina value
     */
    function updateStamina(amount) {
        const player = GameState.get('player');
        const newStamina = Math.max(0, Math.min(player.baseStamina, player.stamina + amount));
        
        GameState.set('player.stamina', newStamina);
        
        // Emit stamina update event
        EventBus.emit('STAMINA_UPDATED', { 
            previous: player.stamina,
            current: newStamina,
            max: player.baseStamina
        });
        
        return newStamina;
    }
    
    /**
     * Update player's zenny
     * @param {Number} amount - Amount to add or subtract (negative for subtraction)
     * @returns {Number} New zenny value
     */
    function updateZenny(amount) {
        const player = GameState.get('player');
        const newZenny = Math.max(0, player.zenny + amount);
        
        GameState.set('player.zenny', newZenny);
        
        // Emit zenny update event
        EventBus.emit('ZENNY_UPDATED', {
            previous: player.zenny,
            current: newZenny,
            change: amount
        });
        
        return newZenny;
    }
    
    /**
     * Initialize the Character module
     */
    function initialize() {
        // Set up event listeners
        EventBus.on('CLASS_SELECTED', ({ className }) => {
            createCharacter(className);
        });
        
        EventBus.on('APPLY_BUFF', ({ buff }) => {
            applyBuff(buff);
        });
        
        EventBus.on('DAMAGE_PLAYER', ({ amount, isPoison }) => {
            takeDamage(amount, isPoison);
        });
        
        EventBus.on('HEAL_PLAYER', ({ amount }) => {
            heal(amount);
        });
        
        console.log("Character module initialized");
        return true;
    }
    
    // Public API
    return {
        initialize,
        createCharacter,
        applyBuff,
        clearBuffs,
        takeDamage,
        heal,
        updateStamina,
        updateZenny
    };
})();

export default Character;