import { GameState } from '../core/state.js';
import { Utils } from '../core/utils.js';
import { Config } from '../core/config.js';

/**
 * Gem Generation Module
 * Responsible for creating initial gem sets and managing gem bag population
 */
export const GemGeneration = {
    /**
     * Create initial gem bag for a player
     * @param {String} playerClass - Player's chosen class
     * @returns {Array} Initial gem bag
     */
    createInitialGemBag(playerClass) {
        const gemBag = [];
        
        // Add base gems for all classes
        const baseGems = [
            { key: 'greyHeal', count: 2 },
            { key: 'redAttack', count: 2 },
            { key: 'blueMagicAttack', count: 2 },
            { key: 'greenAttack', count: 2 }
        ];
        
        baseGems.forEach(({ key, count }) => {
            gemBag.push(...this.createMultipleGems(key, count));
        });
        
        // Add class-specific gems
        const classSpecificGems = this.getClassSpecificGems(playerClass);
        gemBag.push(...classSpecificGems);
        
        // Fill remaining spots with basic gems
        const remainingSpots = Config.MAX_GEM_BAG_SIZE - gemBag.length;
        const basicGemKeys = ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal"];
        
        for (let i = 0; i < remainingSpots; i++) {
            const randomGemKey = basicGemKeys[Math.floor(Math.random() * basicGemKeys.length)];
            gemBag.push(this.createGem(randomGemKey));
        }
        
        return Utils.shuffle(gemBag);
    },
    
    /**
     * Get class-specific gems
     * @param {String} playerClass - Player's chosen class
     * @returns {Array} Class-specific gems
     */
    getClassSpecificGems(playerClass) {
        const classGemConfig = {
            "Knight": [
                { key: "redAttack", count: 3 },
                { key: "redStrongAttack", count: 3 }
            ],
            "Mage": [
                { key: "blueMagicAttack", count: 3 },
                { key: "blueStrongHeal", count: 3 }
            ],
            "Rogue": [
                { key: "greenAttack", count: 3 },
                { key: "greenQuickAttack", count: 3 }
            ]
        };
        
        const gemsToAdd = classGemConfig[playerClass] || [];
        
        return gemsToAdd.flatMap(({ key, count }) => 
            this.createMultipleGems(key, count)
        );
    },
    
    /**
     * Create multiple gems of the same type
     * @param {String} gemKey - Key of the gem to create
     * @param {Number} count - Number of gems to create
     * @returns {Array} Array of created gems
     */
    createMultipleGems(gemKey, count) {
        return Array.from({ length: count }, () => this.createGem(gemKey));
    },
    
    /**
     * Create a single gem
     * @param {String} gemKey - Key of the gem to create
     * @returns {Object} Created gem
     */
    createGem(gemKey) {
        const baseGem = Config.BASE_GEMS[gemKey];
        
        if (!baseGem) {
            throw new Error(`Invalid gem key: ${gemKey}`);
        }
        
        return {
            ...baseGem,
            id: `${gemKey}-${Utils.generateId()}`,
            freshlySwapped: false
        };
    },
    
    /**
     * Shuffle the gem bag
     * @param {Array} gemBag - Current gem bag
     * @returns {Array} Shuffled gem bag
     */
    shuffleGemBag(gemBag) {
        return Utils.shuffle(gemBag);
    },
    
    /**
     * Reset the gem bag completely
     * @param {String} playerClass - Player's chosen class
     * @returns {Array} New, fully reset gem bag
     */
    resetGemBag(playerClass) {
        const newGemBag = this.createInitialGemBag(playerClass);
        GameState.set('gemBag', newGemBag);
        return newGemBag;
    }
};

export default GemGeneration;