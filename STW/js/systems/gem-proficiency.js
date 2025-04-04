import { GameState } from '../core/state.js';
import { EventBus } from '../core/eventbus.js';

/**
 * Gem Proficiency Module
 * Manages gem learning, failure chances, and proficiency tracking
 */
export const GemProficiency = {
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
    },
    
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
    },
    
    /**
     * Update gem proficiency based on success/failure
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
            
            // Emit proficiency update event
            EventBus.emit('GEM_PROFICIENCY_UPDATED', { 
                gemKey: standardizedKey, 
                proficiency,
                success: true
            });
        }
    },
    
    /**
     * Check if a gem fails based on its proficiency
     * @param {Object} proficiency - Gem proficiency data
     * @returns {Boolean} Whether the gem will fail
     */
    checkGemFails(proficiency) {
        return proficiency.failureChance > 0 && Math.random() < proficiency.failureChance;
    }
};

export default GemProficiency;