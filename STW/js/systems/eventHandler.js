import { EventBus } from '../core/eventbus.js';
import { GameState } from '../core/state.js';
import { Utils } from '../core/utils.js';
import { Config } from '../core/config.js';
import { Renderer } from '../ui/renderer.js';

/**
 * EventHandler module - Handles user interactions and button events
 */
export const EventHandler = (() => {
    /**
     * Initialize button handlers and event listeners
     */
    function initialize() {
        console.log("Initializing EventHandler");
        setupButtonHandlers();
        setupKeyboardHandlers();
        setupAutoSave();
        setupUIEvents();
        return true;
    }

    /**
     * Set up button event handlers for all screens
     */
    /**
     * Set up UI event listeners for rendering updates
     */
    function setupUIEvents() {
        // Listen for UI update events
        EventBus.on('UI_UPDATE', ({ target }) => {
            switch (target) {
                case 'battle':
                    Renderer.updateBattleUI();
                    break;
                case 'shop':
                    Renderer.updateShopUI();
                    break;
                case 'gemCatalog':
                    Renderer.updateGemCatalogUI();
                    break;
                case 'camp':
                    Renderer.updateCampUI();
                    break;
            }
        });
        
        // Hand updates
        EventBus.on('HAND_UPDATED', () => {
            Renderer.renderHand();
        });
        
        // Gem selection
        EventBus.on('GEM_SELECTION_CHANGED', ({ selectedIndices }) => {
            Renderer.updateGemSelection(selectedIndices);
        });
    }

    function setupButtonHandlers() {
        console.log("Setting up button handlers");
        
        // For character selection screen
        bindButton('knight-btn', 'click', () => selectClass('Knight'));
        bindButton('mage-btn', 'click', () => selectClass('Mage'));
        bindButton('rogue-btn', 'click', () => selectClass('Rogue'));
        bindButton('reset-btn', 'click', resetMetaProgression);
        
        // For gem catalog screen
        bindButton('continue-journey-btn', 'click', startJourney);
        
        // For battle screen
        bindButton('execute-btn', 'click', () => EventBus.emit('EXECUTE_GEMS'));
        bindButton('wait-btn', 'click', () => EventBus.emit('WAIT_TURN'));
        bindButton('discard-end-btn', 'click', () => EventBus.emit('DISCARD_AND_END'));
        bindButton('end-turn-btn', 'click', () => EventBus.emit('END_TURN'));
        bindButton('flee-btn', 'click', () => EventBus.emit('FLEE_BATTLE'));
        
        // For shop screen
        bindButton('buy-random-gem', 'click', () => EventBus.emit('BUY_RANDOM_GEM'));
        bindButton('discard-gem', 'click', () => EventBus.emit('DISCARD_GEM'));
        bindButton('upgrade-gem', 'click', () => EventBus.emit('INITIATE_UPGRADE'));
        bindButton('cancel-upgrade', 'click', () => EventBus.emit('CANCEL_UPGRADE'));
        bindButton('heal-10', 'click', () => EventBus.emit('HEAL_IN_SHOP'));
        bindButton('continue-btn', 'click', () => EventBus.emit('CONTINUE_FROM_SHOP'));
        
        // For camp screen
        bindButton('withdraw-btn', 'click', withdrawZenny);
        bindButton('deposit-btn', 'click', depositZenny);
        bindButton('next-day-btn', 'click', startNextDay);
    }

    /**
     * Safely bind an event listener to a button
     * @param {String} buttonId - ID of the button element
     * @param {String} eventType - Type of event (e.g., 'click')
     * @param {Function} handler - Event handler function
     * @returns {Boolean} Whether binding was successful
     */
    function bindButton(buttonId, eventType, handler) {
        const button = document.getElementById(buttonId);
        if (!button) {
            console.warn(`Button ${buttonId} not found`);
            return false;
        }
        
        // Remove any existing handlers first
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add the new handler
        newButton.addEventListener(eventType, handler);
        return true;
    }

    /**
     * Set up keyboard event handlers
     */
    function setupKeyboardHandlers() {
        document.addEventListener('keydown', function(event) {
            const currentScreen = GameState.get('currentScreen');
            
            if (currentScreen === 'battle') {
                // Battle screen shortcuts
                switch (event.key) {
                    case ' ': // Space key
                        EventBus.emit('EXECUTE_GEMS');
                        break;
                    case 'e':
                        EventBus.emit('END_TURN');
                        break;
                    case 'w':
                        EventBus.emit('WAIT_TURN');
                        break;
                    case 'd':
                        EventBus.emit('DISCARD_AND_END');
                        break;
                    case 'f':
                        EventBus.emit('FLEE_BATTLE');
                        break;
                }
            } else if (currentScreen === 'shop') {
                // Shop screen shortcuts
                switch (event.key) {
                    case 'c':
                        EventBus.emit('CONTINUE_FROM_SHOP');
                        break;
                    case 'h':
                        EventBus.emit('HEAL_IN_SHOP');
                        break;
                }
            }
        });
    }

    /**
     * Set up auto-save functionality
     */
    function setupAutoSave() {
        // Save every 30 seconds
        setInterval(() => {
            // Only auto-save if player has a class set
            if (GameState.get('player.class')) {
                EventBus.emit('SAVE_GAME_STATE');
            }
        }, 30000);
        
        // Save when page is unloaded
        window.addEventListener('beforeunload', () => {
            // Only save if player has a class set
            if (GameState.get('player.class')) {
                EventBus.emit('SAVE_GAME_STATE');
            }
        });
    }

    /**
     * Handle class selection
     * @param {String} className - Name of the selected class
     */
    function selectClass(className) {
        console.log(`Selecting class: ${className}`);
        
        // Emit class selection event
        EventBus.emit('CLASS_SELECTED', { className });
        
        // Navigate to gem catalog
        EventBus.emit('SCREEN_CHANGE', 'gemCatalog');
    }

    /**
     * Start the journey from gem catalog to battle
     */
    function startJourney() {
        console.log("Starting journey");
        
        // Show loading message
        EventBus.emit('UI_MESSAGE', {
            message: "Starting your adventure..."
        });
        
        // Emit journey start event
        EventBus.emit('JOURNEY_START');
        
        // Use setTimeout to ensure UI updates properly
        setTimeout(() => {
            // Switch to battle screen
            EventBus.emit('SCREEN_CHANGE', 'battle');
        }, 100);
    }

    /**
     * Handle gem selection toggle
     * @param {Number} index - Index of the gem in the hand
     * @param {Boolean} isShop - Whether this is in the shop context
     */
    function toggleGemSelection(index, isShop = false) {
        const hand = GameState.get('hand');
        let selectedGems = GameState.get('selectedGems');
        
        // Validate the index
        if (index < 0 || index >= hand.length || !hand[index]) {
            console.warn("Invalid gem selection attempted:", index);
            GameState.set('selectedGems', new Set());
            return;
        }
        
        // Clone the set
        selectedGems = new Set(selectedGems);
        
        // In shop, only allow selecting one gem at a time
        if (isShop) {
            selectedGems = selectedGems.has(index) ? new Set() : new Set([index]);
        } else {
            // In battle, allow multiple selection
            if (selectedGems.has(index)) {
                selectedGems.delete(index);
            } else {
                selectedGems.add(index);
            }
        }
        
        // Update state
        GameState.set('selectedGems', selectedGems);
        
        // Emit selection change event
        EventBus.emit('GEM_SELECTION_CHANGED', { 
            index, 
            selected: selectedGems.has(index),
            selectedIndices: Array.from(selectedGems) 
        });
    }

    /**
     * Unlock a gem in the catalog
     * @param {String} gemKey - Key of the gem to unlock
     */
    function unlockGem(gemKey) {
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
        
        // Emit unlock event
        EventBus.emit('GEM_UNLOCKED', { gemKey, gem });
        
        // Show success message
        EventBus.emit('UI_MESSAGE', {
            message: `Unlocked ${gem.name}! Available as upgrade in shop.`
        });
        
        // Update UI
        EventBus.emit('UI_UPDATE', { target: 'gemCatalog' });
    }

    /**
     * Withdraw zenny to meta wallet
     */
    function withdrawZenny() {
        const withdrawAmount = document.getElementById('withdraw-amount');
        const amount = parseInt(withdrawAmount.value);
        const player = GameState.get('player');
        
        if (isNaN(amount) || amount <= 0) {
            EventBus.emit('UI_MESSAGE', {
                message: "Enter a valid amount to withdraw!",
                type: 'error'
            });
            return;
        }
        
        if (amount > player.zenny) {
            EventBus.emit('UI_MESSAGE', {
                message: "Not enough $ZENNY in Journey Wallet!",
                type: 'error'
            });
            return;
        }
        
        // Transfer zenny
        GameState.set('player.zenny', player.zenny - amount);
        const metaZenny = GameState.get('metaZenny');
        GameState.set('metaZenny', metaZenny + amount);
        
        // Emit zenny withdraw event
        EventBus.emit('ZENNY_WITHDRAWN', { amount });
        
        // Show success message
        EventBus.emit('UI_MESSAGE', {
            message: `Withdrew ${amount} $ZENNY to Meta Wallet!`
        });
        
        // Update UI
        EventBus.emit('UI_UPDATE', { target: 'camp' });
    }

    /**
     * Deposit zenny from meta wallet
     */
    function depositZenny() {
        const depositAmount = document.getElementById('deposit-amount');
        const amount = parseInt(depositAmount.value);
        const metaZenny = GameState.get('metaZenny');
        
        if (isNaN(amount) || amount <= 0) {
            EventBus.emit('UI_MESSAGE', {
                message: "Enter a valid amount to deposit!",
                type: 'error'
            });
            return;
        }
        
        if (amount > metaZenny) {
            EventBus.emit('UI_MESSAGE', {
                message: "Not enough $ZENNY in Meta Wallet!",
                type: 'error'
            });
            return;
        }
        
        // Transfer zenny
        GameState.set('metaZenny', metaZenny - amount);
        const player = GameState.get('player');
        GameState.set('player.zenny', player.zenny + amount);
        
        // Emit zenny deposit event
        EventBus.emit('ZENNY_DEPOSITED', { amount });
        
        // Show success message
        EventBus.emit('UI_MESSAGE', {
            message: `Deposited ${amount} $ZENNY to Journey Wallet!`
        });
        
        // Update UI
        EventBus.emit('UI_UPDATE', { target: 'camp' });
    }

    /**
     * Start the next day
     */
    function startNextDay() {
        // Emit next day event
        EventBus.emit('START_NEXT_DAY');
        
        // Reset player buffs and stamina
        GameState.set('player.buffs', []);
        GameState.set('player.stamina', GameState.get('player.baseStamina'));
        GameState.set('player.health', GameState.get('player.maxHealth'));
        
        // Combine all gems
        const currentGemBag = GameState.get('gemBag');
        const currentHand = GameState.get('hand');
        const currentDiscard = GameState.get('discard');
        const allGems = [...currentHand, ...currentDiscard, ...currentGemBag];
        
        // Reset hand and discard
        GameState.set('hand', []);
        GameState.set('discard', []);
        GameState.set('gemBag', Utils.shuffle(allGems));
        
        // Start battle
        EventBus.emit('JOURNEY_START');
        
        // Switch to battle screen
        EventBus.emit('SCREEN_CHANGE', 'battle');
    }

    /**
     * Reset meta progression
     */
    function resetMetaProgression() {
        if (confirm("Are you sure you want to reset all meta-progression? This will clear Meta $ZENNY, unlocked gems, and proficiency.")) {
            EventBus.emit('RESET_META_PROGRESSION');
        }
    }

    // Public API
    return {
        initialize,
        setupButtonHandlers,
        selectClass,
        startJourney,
        toggleGemSelection,
        unlockGem,
        withdrawZenny,
        depositZenny,
        startNextDay,
        resetMetaProgression
    };
})();

export default EventHandler;