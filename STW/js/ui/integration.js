import { EventBus } from '../core/eventbus.js';
import { GameState } from '../core/state.js';
import { Utils } from '../core/utils.js';
import { Config } from '../core/config.js';
import { Storage } from '../core/storage.js';

/**
 * Integration module - Handles interactions between different game systems
 * with standardized event handling
 */
export class Integration {
    constructor() {
        this.initialized = false;
        this.eventSubscriptions = [];
        
        // Initialize the module
        this.initialize();
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
     * Helper method to subscribe to events and track subscriptions
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
     * Set up event handlers for system integration with standardized pattern
     */
    setupEventHandlers() {
        // Character selection
        this.subscribe('CLASS_SELECTED', ({ className }) => {
            this.handleClassSelection(className);
        });

        // Journey start
        this.subscribe('JOURNEY_START', () => {
            this.startJourney();
        });

        // Gem unlocking
        this.subscribe('UNLOCK_GEM', ({ gemKey }) => {
            this.unlockGem(gemKey);
        });

        // Progression
        this.subscribe('META_PROGRESSION_RESET', () => {
            this.resetMetaProgression();
        });

        // Saving/loading
        this.subscribe('SAVE_GAME_STATE', () => {
            Storage.saveGameState();
        });

        this.subscribe('LOAD_GAME_STATE', () => {
            const result = Storage.loadGameState();
            EventBus.emit('LOAD_GAME_STATE_COMPLETE', {
                success: result,
                playerState: GameState.get('player'),
                timestamp: Date.now()
            });
        });

        // Battle transitions
        this.subscribe('BATTLE_WIN', () => {
            this.handleBattleWin();
        });

        this.subscribe('CONTINUE_FROM_SHOP', () => {
            this.continueFromShop();
        });

        this.subscribe('START_NEXT_DAY', () => {
            this.startNextDay();
        });
        
        // Show confirmation dialog with standardized pattern
        this.subscribe('SHOW_CONFIRMATION', ({ message, onConfirm, onCancel }) => {
            this.showConfirmationDialog(message, onConfirm, onCancel);
        });
    }

    /**
     * Show a confirmation dialog
     * @param {String} message - Message to display
     * @param {Function} onConfirm - Callback when confirmed
     * @param {Function} onCancel - Callback when canceled
     */
    showConfirmationDialog(message, onConfirm, onCancel) {
        // Use the browser's confirm dialog for simplicity
        // In a real implementation, you might want a custom dialog
        const confirmed = confirm(message);
        
        if (confirmed && typeof onConfirm === 'function') {
            onConfirm();
        } else if (!confirmed && typeof onCancel === 'function') {
            onCancel();
        }
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
        
        // Emit events with consistent pattern
        EventBus.emit('PLAYER_CLASS_SET', {
            className,
            timestamp: Date.now()
        });
        
        EventBus.emit('SCREEN_CHANGE', { screen: 'gemCatalog' });
        EventBus.emit('UI_UPDATE', { target: 'gemCatalog' });
    }

    /**
     * Fallback character creation if Character module not available
     * @param {String} className - Selected class name
     */
    createCharacterFallback(className) {
        const classConfig = Config.CLASSES[className];
        
        if (!classConfig) {
            console.error(`Invalid class name: ${className}`);
            
            // Emit error event with consistent pattern
            EventBus.emit('ERROR_SHOW', {
                message: `Invalid class name: ${className}`,
                isFatal: false
            });
            
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
        
        // Emit event with consistent pattern
        EventBus.emit('CHARACTER_CREATED', {
            character,
            className,
            creationMethod: 'fallback',
            timestamp: Date.now()
        });
        
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
        
        // Emit event with consistent pattern
        EventBus.emit('GEM_CATALOG_INITIALIZED', {
            className,
            catalog: newCatalog,
            timestamp: Date.now()
        });
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
        
        // Emit event with consistent pattern
        EventBus.emit('GEM_PROFICIENCY_INITIALIZED', {
            className,
            proficiency: initialProficiency,
            timestamp: Date.now()
        });
    }

    /**
     * Start the journey
     */
    startJourney() {
        console.log("Integration: Starting journey");
        
        // Show loading message with consistent pattern
        EventBus.emit('LOADING_START', {
            message: "Preparing your adventure..."
        });
        
        // Load existing game state if available
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
                EventBus.emit('UI_MESSAGE', { 
                    message: "Gems ready, starting battle!" 
                });
                
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
                
                // Hide loading indicator
                EventBus.emit('LOADING_END');
                
                // Emit events with consistent pattern
                EventBus.emit('JOURNEY_STARTED', {
                    player: GameState.get('player'),
                    initialHand,
                    gemBagSize: gemBag.length - initialHand.length,
                    timestamp: Date.now()
                });
                
                setTimeout(() => {
                    EventBus.emit('SCREEN_CHANGE', { screen: 'battle' });
                    EventBus.emit('BATTLE_INIT');
                    EventBus.emit('HAND_UPDATED', { hand: initialHand });
                }, 100);
            } else {
                console.error("Failed to load gems:", loadedAssets);
                
                // Emit error with consistent pattern
                EventBus.emit('ERROR_SHOW', {
                    message: "Failed to prepare gems. Please try again.",
                    isFatal: false
                });
                
                // Hide loading indicator
                EventBus.emit('LOADING_END');
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
        
        // Emit gem unlocked event with consistent format
        EventBus.emit('GEM_UNLOCKED', { 
            gemKey, 
            gem,
            cost: 50,
            playerClass,
            newMetaZenny: metaZenny - 50,
            timestamp: Date.now()
        });
        
        // Update UI
        EventBus.emit('UI_UPDATE', { target: 'gemCatalog' });
    }

    /**
     * Reset meta progression
     */
    resetMetaProgression() {
        // Show loading indicator
        EventBus.emit('LOADING_START', {
            message: "Resetting progression..."
        });
        
        try {
            if (Storage.resetMetaProgression()) {
                // Hide loading indicator
                EventBus.emit('LOADING_END');
                
                // Show success message
                EventBus.emit('UI_MESSAGE', {
                    message: "Meta progression reset successfully"
                });
                
                // Update UI with consistent events
                EventBus.emit('META_PROGRESSION_RESET_COMPLETE', {
                    timestamp: Date.now()
                });
                
                // Return to character select
                EventBus.emit('SCREEN_CHANGE', { screen: 'characterSelect' });
            } else {
                // Hide loading indicator
                EventBus.emit('LOADING_END');
                
                // Show error message
                EventBus.emit('UI_MESSAGE', {
                    message: "Failed to reset meta progression",
                    type: 'error'
                });
                
                // Emit error event
                EventBus.emit('ERROR_SHOW', {
                    message: "Failed to reset meta progression",
                    isFatal: false
                });
            }
        } catch (error) {
            // Hide loading indicator
            EventBus.emit('LOADING_END');
            
            // Emit error event with consistent pattern
            EventBus.emit('ERROR_SHOW', {
                message: "Error resetting progression: " + error.message,
                isFatal: false
            });
        }
    }

    /**
     * Handle battle win
     */
    handleBattleWin() {
        // Logic for progressing after battle win
        console.log("Integration: Handling battle win");
        
        // Save current game state with consistent events
        EventBus.emit('SAVE_GAME_STATE');
        
        // Emit win event with consistent format
        EventBus.emit('BATTLE_WIN_PROCESSED', {
            player: GameState.get('player'),
            battleCount: GameState.get('battleCount'),
            currentDay: GameState.get('currentDay'),
            timestamp: Date.now()
        });
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
            
            // Emit event with consistent pattern
            EventBus.emit('HAND_STATE_SAVED', {
                handSize: hand.length,
                timestamp: Date.now()
            });
        } catch (e) {
            console.error("Error saving hand state:", e);
            
            // Emit error event
            EventBus.emit('ERROR_SHOW', {
                message: "Could not save hand state: " + e.message,
                isFatal: false
            });
        }
        
        // Transition to next battle
        EventBus.emit('SCREEN_CHANGE', { screen: 'battle' });
    }

    /**
     * Start the next day
     */
    startNextDay() {
        console.log("Integration: Starting next day");
        
        // Show loading indicator
        EventBus.emit('LOADING_START', {
            message: "Preparing for the next day..."
        });
        
        try {
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
            
            // Hide loading indicator
            EventBus.emit('LOADING_END');
            
            // Emit event with consistent format
            EventBus.emit('DAY_STARTED', {
                player: GameState.get('player'),
                day: GameState.get('currentDay'),
                gemBagSize: allGems.length,
                timestamp: Date.now()
            });
            
            // Switch to battle screen
            EventBus.emit('SCREEN_CHANGE', { screen: 'battle' });
        } catch (error) {
            // Hide loading indicator
            EventBus.emit('LOADING_END');
            
            // Emit error event with consistent pattern
            EventBus.emit('ERROR_SHOW', {
                message: "Error starting next day: " + error.message,
                isFatal: false
            });
        }
    }
}

/**
 * Cleanup component UI before page unload
 * @returns {Boolean} Cleanup success
 */
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

// Create singleton instance
export const IntegrationInstance = new Integration();

// For backwards compatibility
export default IntegrationInstance;