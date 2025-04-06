import { GameState } from '../core/state.js';
import { EventBus } from '../core/eventbus.js';

/**
 * Gem Proficiency Module with standardized event handling
 * Manages gem learning, failure chances, and proficiency tracking
 */
export class GemProficiency {
    constructor() {
        // Store event subscriptions for potential cleanup
        this.eventSubscriptions = [];
        
        // Initialize the module
        this.initialize();
    }
    
    /**
     * Initialize the module and set up event listeners
     */
    initialize() {
        console.log("Initializing GemProficiency module");
        
        // Set up event listeners using standardized pattern
        this.setupEventHandlers();
        
        return true;
    }
    
    /**
     * Helper method to subscribe to events with tracking
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
     * Clear all subscriptions
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
     * Set up event handlers with standardized pattern
     */
    setupEventHandlers() {
        this.subscribe('GEM_EXECUTION_ATTEMPT', ({ gemKey }) => {
            const proficiency = this.getGemProficiency(gemKey);
            const willFail = this.checkGemFails(proficiency);
            
            EventBus.emit('GEM_PROFICIENCY_CHECK', {
                gemKey,
                proficiency,
                willFail
            });
        });
        
        this.subscribe('GEM_EXECUTED', ({ gem, success }) => {
            if (gem) {
                const gemKey = `${gem.color}${gem.name.replace(/\s+/g, '')}`;
                this.updateGemProficiency(gemKey, success);
            }
        });
        
        this.subscribe('GEM_PROFICIENCY_REQUEST', ({ gemKey }) => {
            const proficiency = this.getGemProficiency(gemKey);
            
            EventBus.emit('GEM_PROFICIENCY_RESPONSE', {
                gemKey,
                proficiency
            });
        });
    }
    
    /**
     * Standardize gem key format
     * @param {String} gemKey - Gem key to standardize
     * @returns {String} Standardized gem key
     */
    standardizeGemKey(gemKey) {
        // Remove whitespace
        let standardizedKey = gemKey.replace(/\s+/g, '');
        
        // Key mappings for consistency
        const keyMappings = {
            "redAttack": "redAttack",
            "blueMagicAttack": "blueMagicAttack",
            "greenQuickAttack": "greenQuickAttack",
            "redStrongAttack": "redStrongAttack",
            "greyHeal": "greyHeal",
            "blueStrongHeal": "blueStrongHeal",
            "greenPoison": "greenPoison",
            "blueShield": "blueShield"
        };
        
        return keyMappings[standardizedKey] || standardizedKey;
    }
    
    /**
     * Get proficiency for a specific gem
     * @param {String} gemKey - Gem key
     * @returns {Object} Proficiency data
     */
    getGemProficiency(gemKey) {
        const gemProficiency = GameState.get('gemProficiency') || {};
        const playerClass = GameState.get('player.class');
        
        // Standardize the key
        const standardizedKey = this.standardizeGemKey(gemKey);
        
        // Special handling for class-specific gems
        const classGems = ["redStrongAttack", "blueStrongHeal", "greenQuickAttack"];
        
        // If this is a class gem, return full proficiency
        if (classGems.includes(standardizedKey)) {
            return { successCount: 6, failureChance: 0 };
        }
        
        // Check for proficiency data
        if (!gemProficiency[standardizedKey]) {
            // Default values for base and class-specific gems
            const baseGems = [
                "redAttack", "blueMagicAttack", "greenAttack", "greyHeal", 
                "redStrongAttack", "blueStrongHeal", "greenQuickAttack"
            ];
            
            return baseGems.includes(standardizedKey)
                ? { successCount: 6, failureChance: 0 }
                : { successCount: 0, failureChance: 0.9 };
        }
        
        return gemProficiency[standardizedKey];
    }
    
    /**
     * Update gem proficiency based on success/failure with standardized events
     * @param {String} gemKey - Gem key
     * @param {Boolean} success - Whether the gem use was successful
     */
    updateGemProficiency(gemKey, success) {
        const gemProficiency = GameState.get('gemProficiency') || {};
        const playerClass = GameState.get('player.class');
        
        // Standardize the key
        const standardizedKey = this.standardizeGemKey(gemKey);
        
        // Get current proficiency
        let proficiency = this.getGemProficiency(standardizedKey);
        
        // Update only on success
        if (success) {
            const oldSuccessCount = proficiency.successCount;
            const oldFailureChance = proficiency.failureChance;
            
            proficiency.successCount++;
            proficiency.failureChance = Math.max(0, 0.9 - proficiency.successCount * 0.15);
            
            // Update state
            const updatedGemProficiency = { 
                ...gemProficiency, 
                [standardizedKey]: proficiency 
            };
            
            GameState.set('gemProficiency', updatedGemProficiency);
            
            // Update class-specific proficiency if player class exists
            if (playerClass) {
                const classGemProficiency = GameState.get(`classGemProficiency.${playerClass}`) || {};
                classGemProficiency[standardizedKey] = proficiency;
                GameState.set(`classGemProficiency.${playerClass}`, classGemProficiency);
            }
            
            // Emit proficiency update event with consistent data format
            EventBus.emit('GEM_PROFICIENCY_UPDATED', { 
                gemKey: standardizedKey, 
                proficiency,
                changes: {
                    successCount: {
                        old: oldSuccessCount,
                        new: proficiency.successCount
                    },
                    failureChance: {
                        old: oldFailureChance,
                        new: proficiency.failureChance
                    }
                },
                success: true
            });
            
            // Check for mastery achievement
            if (oldFailureChance > 0 && proficiency.failureChance === 0) {
                EventBus.emit('GEM_MASTERY_ACHIEVED', {
                    gemKey: standardizedKey,
                    playerClass
                });
            }
        }
    }
    
    /**
     * Check if a gem fails based on its proficiency
     * @param {Object} proficiency - Gem proficiency data
     * @returns {Boolean} Whether the gem will fail
     */
    checkGemFails(proficiency) {
        return proficiency.failureChance > 0 && Math.random() < proficiency.failureChance;
    }
    
    /**
     * Get formatted proficiency text for display
     * @param {String} gemKey - Gem key
     * @returns {String} Formatted proficiency text
     */
    getFormattedProficiencyText(gemKey) {
        const proficiency = this.getGemProficiency(gemKey);
        const failurePercent = Math.round(proficiency.failureChance * 100);
        
        if (failurePercent === 0) {
            return "Mastered";
        } else if (failurePercent <= 30) {
            return "Practiced";
        } else if (failurePercent <= 60) {
            return "Learning";
        } else {
            return "Novice";
        }
    }
}

// Create singleton instance
export const GemProficiencyInstance = new GemProficiency();

// For backwards compatibility
export default GemProficiencyInstance;