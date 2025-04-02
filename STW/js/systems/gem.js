// Add to js/systems/gems.js

/**
 * Get proficiency data for a gem
 * @param {String} gemKey - Key identifying the gem
 * @returns {Object} Proficiency data with successCount and failureChance
 */
export function getGemProficiency(gemKey) {
    const gemProficiency = GameState.data.gemProficiency || {};
    
    // Standardize key format
    const standardizedKey = standardizeGemKey(gemKey);
    
    // Special handling for class-specific gems - always mastered
    const classGems = ["redStrongAttack", "blueStrongHeal", "greenQuickAttack"];
    if (classGems.includes(standardizedKey)) {
      return { successCount: 6, failureChance: 0 };
    }
    
    // Check if we have proficiency data
    if (!gemProficiency[standardizedKey]) {
      // Basic gems are already mastered
      const baseGems = ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal"];
      if (baseGems.includes(standardizedKey)) {
        return { successCount: 6, failureChance: 0 };
      }
      
      // New gems start with high failure chance
      return { successCount: 0, failureChance: 0.9 };
    }
    
    return gemProficiency[standardizedKey];
}
  
  /**
   * Update proficiency for a gem based on success/failure
   * @param {String} gemKey - Key identifying the gem
   * @param {Boolean} success - Whether the gem use was successful
   */
export function updateGemProficiency(gemKey, success) {
    // Get current proficiency
    const proficiency = getGemProficiency(gemKey);
    
    // Only update on success
    if (success) {
      // Increment success count
      proficiency.successCount++;
      
      // Calculate new failure chance (reduce by 15% per success, minimum 0)
      proficiency.failureChance = Math.max(0, 0.9 - proficiency.successCount * 0.15);
      
      // Update proficiency in state
      const standardizedKey = standardizeGemKey(gemKey);
      GameState.setState(`gemProficiency.${standardizedKey}`, proficiency);
      
      // Also update in class-specific proficiency
      const playerClass = GameState.data.player.class;
      if (playerClass) {
        GameState.setState(`classGemProficiency.${playerClass}.${standardizedKey}`, proficiency);
      }
      
      // Emit event for tracking
      EventBus.emit('GEM_PROFICIENCY_UPDATED', { 
        gemKey: standardizedKey, 
        proficiency 
      });
    }
}
  
  /**
   * Check if a gem will fail based on proficiency
   * @param {Object} proficiency - Gem proficiency data
   * @returns {Boolean} Whether the gem will fail
   */
export function checkGemFails(proficiency) {
    return proficiency.failureChance > 0 && Math.random() < proficiency.failureChance;
}
  
  /**
   * Standardize gem key format
   * @param {String} gemKey - Gem key to standardize
   * @returns {String} Standardized key
   */
function standardizeGemKey(gemKey) {
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
    
    // Apply mapping if available
    return keyMappings[standardizedKey] || standardizedKey;
}