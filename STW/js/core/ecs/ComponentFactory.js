// Component Factory - Creates standardized components for entities
import { Utils } from '../../core/utils.js';

/**
 * ComponentFactory - Factory functions for creating standardized components
 */
export const ComponentFactory = {
    /**
     * Create a basic info component
     * @param {Object} data - Component data
     * @returns {Object} Info component
     */
    createInfoComponent(data = {}) {
        return {
            name: data.name || 'Unnamed',
            description: data.description || '',
            icon: data.icon || null,
            createdAt: data.createdAt || Date.now()
        };
    },
    
    /**
     * Create a stats component for player or enemy
     * @param {Object} stats - Stats configuration
     * @returns {Object} Stats component
     */
    createStatsComponent(stats = {}) {
        return {
            health: stats.health || 0,
            maxHealth: stats.maxHealth || 0,
            stamina: stats.stamina || 0,
            baseStamina: stats.baseStamina || 0,
            zenny: stats.zenny || 0,
            modified: Date.now()
        };
    },
    
    /**
     * Create a buff component to track active buffs
     * @param {Array} initialBuffs - Initial buffs
     * @returns {Object} Buff component
     */
    createBuffComponent(initialBuffs = []) {
        return {
            buffs: [...initialBuffs],
            modified: Date.now()
        };
    },
    
    /**
     * Create a class component for player class
     * @param {String} className - Class name
     * @returns {Object} Class component
     */
    createClassComponent(className) {
        return {
            type: className, // Knight, Mage, Rogue
            level: 1,
            experience: 0
        };
    },
    
    /**
     * Create a gem component
     * @param {Object} gemData - Gem data
     * @returns {Object} Gem component
     */
    createGemComponent(gemData) {
        return {
            id: gemData.id || `gem_${Utils.generateId()}`,
            color: gemData.color,
            name: gemData.name,
            cost: gemData.cost,
            damage: gemData.damage || 0,
            heal: gemData.heal || 0,
            poison: gemData.poison || 0,
            shield: gemData.shield || false,
            upgradeCount: gemData.upgradeCount || 0,
            rarity: gemData.rarity || 'Common',
            freshlySwapped: gemData.freshlySwapped || false
        };
    },
    
    /**
     * Create a collection component for managing groups of entities
     * @param {Array} initialItems - Initial item IDs
     * @param {Number} maxSize - Maximum collection size
     * @returns {Object} Collection component
     */
    createCollectionComponent(initialItems = [], maxSize = null) {
        return {
            items: [...initialItems],
            maxSize: maxSize,
            modified: Date.now()
        };
    },
    
    /**
     * Create an enemy component
     * @param {Object} data - Enemy data
     * @returns {Object} Enemy component
     */
    createEnemyComponent(data = {}) {
        return {
            actionQueue: data.actionQueue || [],
            currentAction: data.currentAction || null,
            shield: data.shield || false,
            shieldColor: data.shieldColor || null,
            nextAttackBoost: data.nextAttackBoost || null
        };
    },
    
    /**
     * Create a position component for entity placement
     * @param {Object} position - Position data
     * @returns {Object} Position component
     */
    createPositionComponent(position = {}) {
        return {
            x: position.x || 0,
            y: position.y || 0,
            z: position.z || 0,
            rotation: position.rotation || 0
        };
    },
    
    /**
     * Create a render component for visual representation
     * @param {Object} renderData - Render data
     * @returns {Object} Render component
     */
    createRenderComponent(renderData = {}) {
        return {
            visible: renderData.visible !== false,
            spriteId: renderData.spriteId || null,
            color: renderData.color || null,
            scale: renderData.scale || 1,
            opacity: renderData.opacity || 1,
            zIndex: renderData.zIndex || 0,
            animation: renderData.animation || null
        };
    },
    
    /**
     * Create a proficiency component for gem mastery
     * @param {Object} data - Proficiency data
     * @returns {Object} Proficiency component
     */
    createProficiencyComponent(data = {}) {
        const proficiencies = {};
        
        if (data.gemKeys) {
            data.gemKeys.forEach(key => {
                proficiencies[key] = {
                    successCount: data.defaultSuccessCount || 0,
                    failureChance: data.defaultFailureChance || 0.9
                };
            });
        }
        
        return {
            proficiencies: { ...proficiencies, ...data.proficiencies }
        };
    },
    
    /**
     * Create a phase component for day/phase tracking
     * @param {Object} data - Phase data
     * @returns {Object} Phase component
     */
    createPhaseComponent(data = {}) {
        return {
            day: data.day || 1,
            phase: data.phase || 0, // 0: Dawn, 1: Dusk, 2: Dark
            battleCount: data.battleCount || 0
        };
    },
    
    /**
     * Create a wallet component for tracking meta currencies
     * @param {Object} data - Wallet data
     * @returns {Object} Wallet component
     */
    createWalletComponent(data = {}) {
        return {
            metaZenny: data.metaZenny || 0,
            modified: Date.now()
        };
    },
    
    /**
     * Create a gem catalog component
     * @param {Object} data - Gem catalog data
     * @returns {Object} Gem catalog component
     */
    createGemCatalogComponent(data = {}) {
        return {
            unlocked: [...(data.unlocked || [])],
            available: [...(data.available || [])],
            maxCapacity: data.maxCapacity || 15,
            upgradedThisShop: new Set(data.upgradedThisShop || [])
        };
    },
    
    /**
     * Create a battle state component
     * @param {Object} data - Battle state data
     * @returns {Object} Battle state component
     */
    createBattleStateComponent(data = {}) {
        return {
            battleOver: data.battleOver || false,
            hasActedThisTurn: data.hasActedThisTurn || false,
            hasPlayedGemThisTurn: data.hasPlayedGemThisTurn || false,
            isEnemyTurnPending: data.isEnemyTurnPending || false,
            selectedGems: new Set(data.selectedGems || [])
        };
    }
};

export default ComponentFactory;