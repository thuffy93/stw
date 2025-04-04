import { EventBus } from '../core/eventbus.js';
import { GameState } from '../core/state.js';
import { Utils } from '../core/utils.js';
import { Config } from '../core/config.js';  // Add Config import
import { Storage } from '../core/storage.js';

/**
 * Integration module - Handles interactions between different game systems
 */
export class Integration {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the integration system
     */
    initialize() {
        if (this.initialized) return true;

        console.log("Initializing Integration module");

        // Set up event handlers
        this.setupEventHandlers();

        this.initialized = true;
        return true;
    }

    /**
     * Set up event handlers for system integration
     */
    setupEventHandlers() {
        // Character selection
        EventBus.on('CLASS_SELECTED', ({ className }) => {
            this.handleClassSelection(className);
        });

        // Journey start
        EventBus.on('JOURNEY_START', () => {
            this.startJourney();
        });

        // Gem unlocking
        EventBus.on('UNLOCK_GEM', ({ gemKey }) => {
            this.unlockGem(gemKey);
        });

        // Progression
        EventBus.on('META_PROGRESSION_RESET', () => {
            this.resetMetaProgression();
        });

        // Saving/loading
        EventBus.on('SAVE_GAME_STATE', () => {
            Storage.saveGameState();
        });

        EventBus.on('LOAD_GAME_STATE', () => {
            Storage.loadGameState();
        });

        // Battle transitions
        EventBus.on('BATTLE_WIN', () => {
            this.handleBattleWin();
        });

        EventBus.on('CONTINUE_FROM_SHOP', () => {
            this.continueFromShop();
        });

        EventBus.on('START_NEXT_DAY', () => {
            this.startNextDay();
        });
    }

    /**
     * Handle class selection
     * @param {String} className - Selected class name
     */
    handleClassSelection(className) {
        console.log(`Integration: Class selected - ${className}`);
        
        if (window.Character && typeof Character.createCharacter === 'function') {
            Character.createCharacter(className);
        } else {
            this.createCharacterFallback(className);
        }
        
        if (window.Gems && typeof Gems.resetGemBag === 'function') {
            Gems.resetGemBag(true);
        }
        
        EventBus.emit('SCREEN_CHANGE', 'gemCatalog');
        EventBus.emit('UI_UPDATE', { target: 'gemCatalog' }); // Ensure renderer.js updates
    }

    /**
     * Fallback character creation if Character module not available
     * @param {String} className - Selected class name
     */
    createCharacterFallback(className) {
        const classConfig = Config.CLASSES[className];
        
        if (!classConfig) {
            console.error(`Invalid class name: ${className}`);
            return null;
        }
        
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
        
        // Ensure gem catalog exists
        this.setupGemCatalog(className);
        
        console.log("Character created via fallback:", character);
        
        return character;
    }

    /**
     * Set up gem catalog for a character
     * @param {String} className - Class name
     */
    setupGemCatalog(className) {
        // Initialize from default configuration
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
        
        // Set up gem proficiency
        this.setupGemProficiency(className);
    }

    /**
     * Set up gem proficiency for a character
     * @param {String} className - Class name
     */
    setupGemProficiency(className) {
        const initialProficiency = Config.INITIAL_GEM_PROFICIENCY[className] || {};
        
        // Set up both the current proficiency and class-specific proficiency
        GameState.set('gemProficiency', Utils.deepClone(initialProficiency));
        GameState.set(`classGemProficiency.${className}`, Utils.deepClone(initialProficiency));
    }

    /**
     * Start the journey
     */
    startJourney() {
        console.log("Integration: Starting journey");
        
        Storage.loadGameState();
        
        if (!GameState.get('battleCount')) {
            GameState.set('currentDay', 1);
            GameState.set('currentPhaseIndex', 0);
            GameState.set('battleCount', 0);
        }
        
        GameState.set('battleOver', false);
        GameState.set('selectedGems', new Set());
        GameState.set('player.buffs', []);
        
        const player = GameState.get('player');
        GameState.set('player.stamina', player.baseStamina);
        
        // Simulate BasicUI.startJourney logic
        window.AssetManager.downloadAll((success, loadedAssets) => {
            if (success) {
                console.log("All gems loaded:", loadedAssets);
                EventBus.emit('UI_MESSAGE', { message: "Gems ready, starting battle!" });
                
                const gemBag = Object.values(loadedAssets).map(gem => ({
                    ...gem,
                    id: `${gem.name}-${Utils.generateId()}`
                }));
                GameState.set('gemBag', Utils.shuffle(gemBag));
                GameState.set('hand', []);
                GameState.set('discard', []);
                
                const initialHand = gemBag.slice(0, Config.MAX_HAND_SIZE);
                GameState.set('hand', initialHand);
                GameState.set('gemBag', gemBag.slice(Config.MAX_HAND_SIZE));
                
                console.log("Initial hand:", GameState.get('hand'));
                console.log("Remaining gemBag:", GameState.get('gemBag'));
                
                setTimeout(() => {
                    EventBus.emit('SCREEN_CHANGE', 'battle');
                    EventBus.emit('BATTLE_INIT');
                    EventBus.emit('HAND_UPDATED');
                }, 100);
            } else {
                console.error("Failed to load gems:", loadedAssets);
                EventBus.emit('UI_MESSAGE', { message: "Failed to prepare gems.", type: 'error', duration: 5000 });
            }
        });
    }

    /**
     * Unlock a gem
     * @param {String} gemKey - Key of the gem to unlock
     */
    unlockGem(gemKey) {
        const metaZenny = GameState.get('metaZenny');
        const gemCatalog = GameState.get('gemCatalog');
        const playerClass = GameState.get('player.class');
        
        // Check if player can afford it
        if (metaZenny < 50) {
            EventBus.emit('UI_MESSAGE', {
                message: "Not enough Meta $ZENNY!",
                type: 'error'
            });
            return;
        }
        
        // Check if gem is valid
        const gem = Config.BASE_GEMS[gemKey];
        if (!gem) {
            EventBus.emit('UI_MESSAGE', {
                message: "Invalid gem!",
                type: 'error'
            });
            return;
        }
        
        // Deduct zenny
        GameState.set('metaZenny', metaZenny - 50);
        
        // Add to unlocked gems and remove from available
        const unlocked = [...gemCatalog.unlocked, gemKey];
        const available = gemCatalog.available.filter(key => key !== gemKey);
        
        // Update gem catalog
        GameState.set('gemCatalog.unlocked', unlocked);
        GameState.set('gemCatalog.available', available);
        
        // Update class-specific catalog
        GameState.set(`classGemCatalogs.${playerClass}.unlocked`, unlocked);
        GameState.set(`classGemCatalogs.${playerClass}.available`, available);
        
        // Save meta state
        Storage.saveMetaZenny();
        
        // Show success message
        EventBus.emit('UI_MESSAGE', {
            message: `Unlocked ${gem.name}! Available as upgrade in shop.`
        });
        
        // Emit gem unlocked event for UI updates
        EventBus.emit('GEM_UNLOCKED', { gemKey, gem });
    }

    /**
     * Reset meta progression
     */
    resetMetaProgression() {
        if (Storage.resetMetaProgression()) {
            EventBus.emit('UI_MESSAGE', {
                message: "Meta progression reset successfully"
            });
            
            // Update UI
            EventBus.emit('META_PROGRESSION_RESET_COMPLETE');
            
            // Return to character select
            EventBus.emit('SCREEN_CHANGE', 'characterSelect');
        } else {
            EventBus.emit('UI_MESSAGE', {
                message: "Failed to reset meta progression",
                type: 'error'
            });
        }
    }

    /**
     * Handle battle win
     */
    handleBattleWin() {
        // Logic for progressing after battle win
        console.log("Integration: Handling battle win");
        
        // Save current game state
        Storage.saveGameState();
    }

    /**
     * Continue from shop to next battle
     */
    continueFromShop() {
        // Save hand state to localStorage
        const hand = GameState.get('hand');
        
        try {
            localStorage.setItem(Config.STORAGE_KEYS.TEMP_HAND, JSON.stringify(hand));
            console.log("Saved hand state for next battle:", hand);
        } catch (e) {
            console.error("Error saving hand state:", e);
        }
        
        // Transition to next battle
        EventBus.emit('SCREEN_CHANGE', 'battle');
    }

    /**
     * Start the next day
     */
    startNextDay() {
        console.log("Integration: Starting next day");
        
        // Reset player buffs and stamina
        GameState.set('player.buffs', []);
        
        const player = GameState.get('player');
        GameState.set('player.stamina', player.baseStamina);
        GameState.set('player.health', player.maxHealth);
        
        // Combine all gems
        const currentGemBag = GameState.get('gemBag') || [];
        const currentHand = GameState.get('hand') || [];
        const currentDiscard = GameState.get('discard') || [];
        const allGems = [...currentHand, ...currentDiscard, ...currentGemBag];
        
        // Reset collections
        GameState.set('hand', []);
        GameState.set('discard', []);
        GameState.set('gemBag', Utils.shuffle(allGems));
        
        // Switch to battle screen
        EventBus.emit('SCREEN_CHANGE', 'battle');
    }
}

export function cleanupComponentUI() {
    console.log("Cleaning up component UI");
    
    // Save game state if applicable
    if (GameState.get('player.class')) {
        EventBus.emit('SAVE_GAME_STATE');
        
        // Optionally perform other cleanup operations
        try {
            // Clear any temporary storage
            localStorage.removeItem(Config.STORAGE_KEYS.TEMP_HAND);
        } catch (e) {
            console.error("Error during cleanup:", e);
        }
    }
    
    return true;
}
export default Integration;