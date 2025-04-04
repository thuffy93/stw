// Game Initializer - Sets up the ECS architecture for the game
import { EntityManager } from './EntityManager.js';
import { ComponentFactory } from './ComponentFactory.js';
import { SystemManager } from './SystemManager.js';
import { EventBus } from '../eventbus.js';
import { Utils } from '../utils.js';
import { Config } from '../config.js';

// Import systems
import { CombatSystem } from '../../systems/CombatSystem.js';

/**
 * GameInitializer - Manages game initialization for ECS architecture
 */
export const GameInitializer = (() => {
    /**
     * Initialize the core game structure
     * @returns {Boolean} Success status
     */
    function initializeGame() {
        console.log('Initializing game with ECS architecture');
        
        // Create core game entities
        createGameEntity();
        
        // Register systems
        registerSystems();
        
        // Initialize systems
        const success = SystemManager.initializeAllSystems();
        
        // Start update loop
        SystemManager.startUpdateLoop();
        
        console.log('Game initialization complete');
        return success;
    }
    
    /**
     * Create the game entity
     * @returns {String} Game entity ID
     */
    function createGameEntity() {
        const gameId = EntityManager.createEntity(['game']);
        
        // Add phase component to track game progress
        EntityManager.addComponent(gameId, 'Phase', ComponentFactory.createPhaseComponent({
            day: 1,
            phase: 0,
            battleCount: 0
        }));
        
        console.log('Game entity created:', gameId);
        return gameId;
    }
    
    /**
     * Create a player character
     * @param {String} className - Class name (Knight, Mage, Rogue)
     * @returns {String} Player entity ID
     */
    function createPlayerCharacter(className) {
        // Validate class
        if (!Config.CLASSES[className]) {
            console.error(`Invalid class name: ${className}`);
            return null;
        }
        
        const classConfig = Config.CLASSES[className];
        
        // Create player entity
        const playerId = EntityManager.createEntity(['player']);
        
        // Add components
        EntityManager.addComponent(playerId, 'Info', ComponentFactory.createInfoComponent({
            name: 'Player',
            description: `A ${className} on a journey to defeat the Dark Lord`
        }));
        
        EntityManager.addComponent(playerId, 'Class', ComponentFactory.createClassComponent(className));
        
        EntityManager.addComponent(playerId, 'Stats', ComponentFactory.createStatsComponent({
            health: classConfig.maxHealth,
            maxHealth: classConfig.maxHealth,
            stamina: classConfig.baseStamina,
            baseStamina: classConfig.baseStamina,
            zenny: classConfig.startingZenny || 0
        }));
        
        EntityManager.addComponent(playerId, 'Buff', ComponentFactory.createBuffComponent());
        
        EntityManager.addComponent(playerId, 'Wallet', ComponentFactory.createWalletComponent());
        
        // Add proficiency component
        const proficiencies = {};
        
        // Basic gems have full proficiency
        const basicGems = ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal"];
        basicGems.forEach(gemKey => {
            proficiencies[gemKey] = { successCount: 6, failureChance: 0 };
        });
        
        // Class specific gem has full proficiency
        const classGem = {
            "Knight": "redStrongAttack",
            "Mage": "blueStrongHeal",
            "Rogue": "greenQuickAttack"
        }[className];
        
        proficiencies[classGem] = { successCount: 6, failureChance: 0 };
        
        EntityManager.addComponent(playerId, 'Proficiency', {
            proficiencies
        });
        
        // Set up gem catalog
        EntityManager.addComponent(playerId, 'GemCatalog', ComponentFactory.createGemCatalogComponent({
            unlocked: [...basicGems, classGem],
            available: Config.INITIAL_GEM_UNLOCKS[className].available
        }));
        
        // Create player collections entity
        createPlayerCollections(className);
        
        console.log(`Player character created: ${className}`);
        
        // Emit character created event
        EventBus.emit('CHARACTER_CREATED', { playerId, className });
        
        return playerId;
    }
    
    /**
     * Create player collections (hand, gem bag, discard)
     * @param {String} className - Class name
     * @returns {String} Collections entity ID
     */
    function createPlayerCollections(className) {
        const collectionsId = EntityManager.createEntity(['collections']);
        
        // Create initial gems for this class
        const gemIds = createInitialGems(className);
        
        // Create collections
        EntityManager.addComponent(collectionsId, 'Hand', ComponentFactory.createCollectionComponent(
            [], // Empty hand to start
            Config.MAX_HAND_SIZE
        ));
        
        EntityManager.addComponent(collectionsId, 'GemBag', ComponentFactory.createCollectionComponent(
            gemIds, // All gems start in the bag
            Config.MAX_GEM_BAG_SIZE
        ));
        
        EntityManager.addComponent(collectionsId, 'Discard', ComponentFactory.createCollectionComponent(
            [], // Empty discard to start
            null // No size limit
        ));
        
        console.log('Player collections created');
        return collectionsId;
    }
    
    /**
     * Create initial gems for a class
     * @param {String} className - Class name
     * @returns {Array} Array of gem entity IDs
     */
    function createInitialGems(className) {
        const gemIds = [];
        
        // Get starting gems for this class
        const startingGemKeys = Config.STARTING_GEMS[className] || [];
        
        // Create gem entities
        startingGemKeys.forEach(gemKey => {
            const baseGem = Config.BASE_GEMS[gemKey];
            if (!baseGem) return;
            
            // Create multiple copies of basic gems
            const count = (gemKey === "redAttack" || 
                         gemKey === "blueMagicAttack" || 
                         gemKey === "greenAttack" || 
                         gemKey === "greyHeal") ? 2 : 1;
            
            for (let i = 0; i < count; i++) {
                const gemId = EntityManager.createEntity(['gem']);
                
                // Add gem component
                EntityManager.addComponent(gemId, 'Gem', ComponentFactory.createGemComponent({
                    ...baseGem,
                    id: `${gemKey}-${i}-${Utils.generateId()}`
                }));
                
                gemIds.push(gemId);
            }
        });
        
        // Additional gems for class balance
        if (className === "Knight") {
            // Knights get more attack gems
            for (let i = 0; i < 3; i++) {
                const gemId = EntityManager.createEntity(['gem']);
                EntityManager.addComponent(gemId, 'Gem', ComponentFactory.createGemComponent({
                    ...Config.BASE_GEMS.redAttack,
                    id: `redAttack-extra-${i}-${Utils.generateId()}`
                }));
                gemIds.push(gemId);
            }
        } 
        else if (className === "Mage") {
            // Mages get more magic attack gems
            for (let i = 0; i < 3; i++) {
                const gemId = EntityManager.createEntity(['gem']);
                EntityManager.addComponent(gemId, 'Gem', ComponentFactory.createGemComponent({
                    ...Config.BASE_GEMS.blueMagicAttack,
                    id: `blueMagicAttack-extra-${i}-${Utils.generateId()}`
                }));
                gemIds.push(gemId);
            }
        }
        else if (className === "Rogue") {
            // Rogues get more quick attack gems
            for (let i = 0; i < 3; i++) {
                const gemId = EntityManager.createEntity(['gem']);
                EntityManager.addComponent(gemId, 'Gem', ComponentFactory.createGemComponent({
                    ...Config.BASE_GEMS.greenAttack,
                    id: `greenAttack-extra-${i}-${Utils.generateId()}`
                }));
                gemIds.push(gemId);
            }
        }
        
        // Fill to minimum bag size with basic gems
        const gemsToAdd = Math.max(0, 12 - gemIds.length);
        const basicGemKeys = ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal"];
        
        for (let i = 0; i < gemsToAdd; i++) {
            const gemKey = basicGemKeys[i % basicGemKeys.length];
            const gemId = EntityManager.createEntity(['gem']);
            
            EntityManager.addComponent(gemId, 'Gem', ComponentFactory.createGemComponent({
                ...Config.BASE_GEMS[gemKey],
                id: `${gemKey}-filler-${i}-${Utils.generateId()}`
            }));
            
            gemIds.push(gemId);
        }
        
        // Shuffle the gems
        return Utils.shuffle(gemIds);
    }
    
    /**
     * Register all game systems
     */
    function registerSystems() {
        // Register combat system
        SystemManager.registerSystem(new CombatSystem());
        
        // Register other systems here
        // SystemManager.registerSystem(new ShopSystem());
        // SystemManager.registerSystem(new UIRenderSystem());
        // etc.
    }
    
    /**
     * Clean up the game state
     */
    function cleanupGame() {
        // Shut down all systems
        SystemManager.shutdownAllSystems();
        
        // Clear all entities
        EntityManager.clear();
        
        console.log('Game state cleaned up');
    }
    
    /**
     * Reset the game state
     */
    function resetGame() {
        // Clean up existing state
        cleanupGame();
        
        // Initialize fresh state
        initializeGame();
        
        console.log('Game state reset');
    }
    
    // Public API
    return {
        initializeGame,
        createPlayerCharacter,
        resetGame
    };
})();

export default GameInitializer;