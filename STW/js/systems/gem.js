import { GameState } from '../core/state.js';
import { EventBus } from '../core/eventbus.js';
import { Config } from '../core/config.js';
import { Utils } from '../core/utils.js';

import GemGeneration from './gem-generation.js';
import GemProficiency from './gem-proficiency.js';
import GemUpgrades from './gem-upgrades.js';

/**
 * Consolidated Gems Module
 * Provides a comprehensive interface for gem-related operations
 */
export const Gems = {
    // Delegation to specialized modules
    Generation: GemGeneration,
    Proficiency: GemProficiency,
    Upgrades: GemUpgrades,
    
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
    },
    
    /**
     * Get explicitly unlocked gems (not starting gems)
     * @returns {Array} Explicitly unlocked gems
     */
    getExplicitlyUnlockedGems() {
        const gemCatalog = GameState.get('gemCatalog');
        const player = GameState.get('player');
        
        // Define the starting gems for each class
        const startingGemsByClass = {
            Knight: ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal", "redStrongAttack"],
            Mage: ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal", "blueStrongHeal"],
            Rogue: ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal", "greenQuickAttack"]
        };
        
        // Get starting gems for player's class
        const startingGems = startingGemsByClass[player.class] || [];
        
        // Filter to get ONLY explicitly unlocked gems (not starting gems)
        const explicitlyUnlocked = gemCatalog.unlocked.filter(key => 
            !startingGems.includes(key)
        );
        
        return explicitlyUnlocked.map(key => ({
            key,
            gem: Config.BASE_GEMS[key]
        }));
    },
    
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
        
        // Emit events
        EventBus.emit('GEM_ADDED_TO_CATALOG', { 
            gemKey, 
            gem: Config.BASE_GEMS[gemKey] 
        });
        
        EventBus.emit('UI_MESSAGE', {
            message: `Unlocked ${Config.BASE_GEMS[gemKey].name} gem!`
        });
        
        return true;
    },
    
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
        if (player.buffs.some(b => b.type === "focused")) {
            multiplier *= 1.2;
        }
        
        return multiplier;
    },
    
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
        const gemKey = `${gem.color}${gem.name}`;
        const proficiency = this.Proficiency.getGemProficiency(gemKey);
        const failsProficiencyCheck = this.Proficiency.checkGemFails(proficiency);
        
        if (failsProficiencyCheck) {
            validationResult.usable = false;
            validationResult.reasons.push("Low proficiency");
        }
        
        // Additional context-specific validations can be added here
        if (context.battleOver) {
            validationResult.usable = false;
            validationResult.reasons.push("Battle is over");
        }
        
        if (player.buffs.some(b => b.type === "stunned")) {
            validationResult.usable = false;
            validationResult.reasons.push("Player is stunned");
        }
        
        return validationResult;
    },
    
    /**
     * Initialize the gems system
     * @returns {Boolean} Initialization success
     */
    initialize() {
        console.log("Initializing Gems system");
        
        // Register event handlers
        EventBus.on('BATTLE_INIT', () => {
            // Prepare gem collections if needed
        });
        
        EventBus.on('SHOP_PREPARE', () => {
            // Prepare gem pool for shop
        });
        
        EventBus.on('GEM_UNLOCK_REQUEST', ({ gemKey }) => {
            this.addToGemCatalog(gemKey);
        });
        
        return true;
    }
};

export default Gems;