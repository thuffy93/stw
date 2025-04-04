import { GameState } from '../core/state.js';
import { EventBus } from '../core/eventbus.js';
import { Utils } from '../core/utils.js';
import { Config } from '../core/config.js';
import GemProficiency from './gem-proficiency.js';

/**
 * Gem Upgrades Module
 * Handles gem upgrade mechanics, including option generation and application
 */
export const GemUpgrades = {
    /**
     * Get upgrade multiplier based on gem rarity
     * @param {String} rarity - Gem rarity
     * @returns {Number} Multiplier
     */
    getUpgradeMultiplier(rarity) {
        const multipliers = {
            "Common": 1.25,
            "Uncommon": 1.3,
            "Rare": 1.35,
            "Epic": 1.4
        };
        return multipliers[rarity] || 1.4;
    },
    
    /**
     * Generate upgrade options for a gem
     * @param {Object} selectedGem - The gem to upgrade
     * @returns {Array} Upgrade options
     */
    generateUpgradeOptions(selectedGem) {
        const options = [];
        
        // Direct upgrade option
        options.push(this.createDirectUpgrade(selectedGem));
        
        // Class-specific upgrade
        const classUpgrade = this.createClassUpgrade(selectedGem);
        if (classUpgrade) {
            options.push(classUpgrade);
        }
        
        // Alternative upgrades
        const alternativeCount = options.length > 1 ? 1 : 2;
        const alternatives = this.createAlternativeUpgrades(selectedGem, alternativeCount);
        options.push(...alternatives);
        
        return options;
    },
    
    /**
     * Create a direct upgrade for a gem
     * @param {Object} gem - The gem to upgrade
     * @returns {Object} Upgraded gem
     */
    createDirectUpgrade(gem) {
        const directUpgrade = { 
            ...gem,
            id: `${gem.name}-upgraded-${Utils.generateId()}`,
            upgradeCount: (gem.upgradeCount || 0) + 1,
            freshlySwapped: false,
            isDirectUpgrade: true
        };
        
        // Calculate stat improvements based on rarity
        const upgradeMultiplier = this.getUpgradeMultiplier(gem.rarity);
        
        // Apply stat improvements
        ['damage', 'heal', 'poison'].forEach(prop => {
            if (directUpgrade[prop]) {
                directUpgrade[prop] = Math.floor(directUpgrade[prop] * upgradeMultiplier);
            }
        });
        
        return directUpgrade;
    },
    
    /**
     * Create a class-specific upgrade for a gem
     * @param {Object} gem - The gem to upgrade
     * @returns {Object|null} Class-specific upgrade or null if not applicable
     */
    createClassUpgrade(gem) {
        const classSpecificUpgrades = {
            "redAttack": "redStrongAttack",
            "blueMagicAttack": "blueStrongHeal",
            "greenAttack": "greenQuickAttack"
        };
        
        const gemKey = `${gem.color}${gem.name.replace(/\s+/g, '')}`;
        const upgradeKey = classSpecificUpgrades[gemKey];
        
        if (!upgradeKey) return null;
        
        const upgradeBase = Config.BASE_GEMS[upgradeKey];
        
        if (!upgradeBase) return null;
        
        return { 
            ...upgradeBase,
            id: `${upgradeKey}-class-upgrade-${Utils.generateId()}`,
            upgradeCount: 0,
            freshlySwapped: false,
            isClassUpgrade: true
        };
    },
    
    /**
     * Create alternative upgrade options
     * @param {Object} gem - Original gem to create alternatives for
     * @param {Number} maxCount - Maximum number of alternatives
     * @returns {Array} Alternative upgrades
     */
    createAlternativeUpgrades(gem, maxCount) {
        const gemCatalog = GameState.get('gemCatalog');
        const baseGemKeys = [
            "redAttack", "blueMagicAttack", "greenAttack", "greyHeal",
            "redStrongAttack", "blueStrongHeal", "greenQuickAttack"
        ];
        
        // Filter for explicitly unlocked gems of the same color
        const explicitlyUnlockedGems = gemCatalog.unlocked.filter(gemKey => {
            if (baseGemKeys.includes(gemKey)) return false;
            
            const gemDef = Config.BASE_GEMS[gemKey];
            return gemDef && 
                   gemDef.color === gem.color && 
                   gemDef.name !== gem.name;
        });
        
        if (explicitlyUnlockedGems.length === 0) return [];
        
        const shuffledGems = Utils.shuffle([...explicitlyUnlockedGems]);
        const alternatives = [];
        
        for (let i = 0; i < Math.min(maxCount, shuffledGems.length); i++) {
            const gemKey = shuffledGems[i];
            const baseGem = Config.BASE_GEMS[gemKey];
            if (!baseGem) continue;
            
            const alternativeGem = { 
                ...baseGem, 
                id: `${gemKey}-alternative-${Utils.generateId()}`, 
                freshlySwapped: false,
                isAlternateUpgrade: true 
            };
            
            // 50% chance to upgrade
            if (Math.random() < 0.5) {
                alternativeGem.upgradeCount = 1;
                const altUpgradeMultiplier = this.getUpgradeMultiplier(baseGem.rarity);
                
                ['damage', 'heal', 'poison'].forEach(prop => {
                    if (alternativeGem[prop]) {
                        alternativeGem[prop] = Math.floor(alternativeGem[prop] * altUpgradeMultiplier);
                    }
                });
            }
            
            alternatives.push(alternativeGem);
        }
        
        return alternatives;
    },
    
    /**
     * Create an alternative gem when no suitable upgrades found
     * @param {Object} originalGem - Original gem to create an alternative for
     * @returns {Object} Alternative gem
     */
    createAlternativeGem(originalGem) {
        const gemColor = originalGem.color;
        
        // Find a different gem of the same color
        const baseGemKeys = Object.keys(Config.BASE_GEMS);
        const sameColorGems = baseGemKeys.filter(key => {
            const gem = Config.BASE_GEMS[key];
            return gem.color === gemColor && gem.name !== originalGem.name;
        });
        
        if (sameColorGems.length === 0) {
            // Fallback - create a slightly different variant of the original
            return this.createVariantGem(originalGem);
        }
        
        // Select a random gem of the same color
        const randomKey = sameColorGems[Math.floor(Math.random() * sameColorGems.length)];
        return this.createAlternativeFromKey(randomKey);
    },
    
    /**
     * Create a variant of the original gem
     * @param {Object} originalGem - Original gem
     * @returns {Object} Variant gem
     */
    createVariantGem(originalGem) {
        return {
            ...originalGem,
            name: `${originalGem.name}+`,
            id: `${originalGem.name}-variant-${Utils.generateId()}`,
            damage: originalGem.damage ? Math.floor(originalGem.damage * 1.2) : null,
            heal: originalGem.heal ? Math.floor(originalGem.heal * 1.2) : null,
            poison: originalGem.poison ? Math.floor(originalGem.poison * 1.2) : null,
            freshlySwapped: false,
            isAlternateUpgrade: true
        };
    },
    
    /**
     * Create an alternative gem from a specific key
     * @param {String} gemKey - Key of the gem to create
     * @returns {Object} Created alternative gem
     */
    createAlternativeFromKey(gemKey) {
        const baseGem = Config.BASE_GEMS[gemKey];
        
        const alternativeGem = { 
            ...baseGem, 
            id: `${gemKey}-alternative-${Utils.generateId()}`, 
            freshlySwapped: false,
            isAlternateUpgrade: true 
        };
        
        // 50% chance to give it an upgrade
        if (Math.random() < 0.5) {
            alternativeGem.upgradeCount = 1;
            const altUpgradeMultiplier = this.getUpgradeMultiplier(baseGem.rarity);
            
            ['damage', 'heal', 'poison'].forEach(prop => {
                if (alternativeGem[prop]) {
                    alternativeGem[prop] = Math.floor(alternativeGem[prop] * altUpgradeMultiplier);
                }
            });
        }
        
        return alternativeGem;
    },
    
    /**
     * Apply an upgrade to a gem
     * @param {Object} originalGem - Original gem
     * @param {Object} upgradeOption - Chosen upgrade option
     * @returns {Object} Upgraded gem
     */
    applyUpgrade(originalGem, upgradeOption) {
        // Ensure the upgrade option has a unique ID
        const upgradedGem = {
            ...upgradeOption,
            id: `${upgradeOption.name}-${Utils.generateId()}`,
            freshlySwapped: false
        };
        
        // If it's a class-specific upgrade, ensure full proficiency
        if (upgradeOption.isClassUpgrade) {
            this.ensureFullProficiency(upgradedGem);
        }
        
        return upgradedGem;
    },
    
    /**
     * Ensure full proficiency for a class-specific gem
     * @param {Object} gem - Gem to ensure proficiency for
     */
    ensureFullProficiency(gem) {
        const gemKey = `${gem.color}${gem.name.replace(/\s+/g, '')}`;
        const gemProficiency = GameState.get('gemProficiency') || {};
        const playerClass = GameState.get('player.class');
        
        // Set full proficiency
        gemProficiency[gemKey] = { 
            successCount: 6, 
            failureChance: 0 
        };
        
        GameState.set('gemProficiency', gemProficiency);
        
        // Update class-specific proficiency if player class exists
        if (playerClass) {
            const classGemProficiency = GameState.get(`classGemProficiency.${playerClass}`) || {};
            classGemProficiency[gemKey] = { 
                successCount: 6, 
                failureChance: 0 
            };
            GameState.set(`classGemProficiency.${playerClass}`, classGemProficiency);
        }
    }
};

export default GemUpgrades;