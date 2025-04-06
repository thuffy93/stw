import { EventBus } from '../core/eventbus.js';
import { GameState } from '../core/state.js';
import { Utils } from '../core/utils.js';
import { Config } from '../core/config.js';
import { Storage } from '../core/storage.js';

/**
 * EventHandler module - Handles user interactions and button events
 */
export class EventHandler {
    constructor() {
        this.initialized = false;
        this.eventSubscriptions = [];
    }

    /**
     * Initialize button handlers and event listeners
     */
    initialize() {
        if (this.initialized) {
            console.warn("EventHandler already initialized, skipping");
            return true;
        }

        console.log("Initializing EventHandler");
        this.setupButtonHandlers();
        this.setupKeyboardHandlers();
        this.setupAutoSave();
        this.setupUIEvents();
        
        this.initialized = true;
        return true;
    }

    /**
     * Helper method to subscribe to events and track subscriptions
     * @param {String} eventName - Event name
     * @param {Function} handler - Event handler
     */
    subscribe(eventName, handler) {
        const subscription = EventBus.on(eventName, handler);
        this.eventSubscriptions.push(subscription);
        return subscription;
    }

    /**
     * Set up UI event listeners for rendering updates
     */
    setupUIEvents() {
        // Listen for UI update events
        this.subscribe('UI_UPDATE', ({ target }) => {
            switch (target) {
                case 'battle':
                    this.updateBattleUI();
                    break;
                case 'shop':
                    this.updateShopUI();
                    break;
                case 'gemCatalog':
                    this.updateGemCatalogUI();
                    break;
                case 'camp':
                    this.updateCampUI();
                    break;
            }
        });
        
        // Hand updates
        this.subscribe('HAND_UPDATED', () => {
            this.renderHand();
        });
        
        // Gem selection
        this.subscribe('GEM_SELECTION_CHANGED', ({ selectedIndices }) => {
            this.updateGemSelection(selectedIndices);
        });
    }

    /**
     * Set up button event handlers for all screens
     */
    setupButtonHandlers() {
        console.log("Setting up button handlers");
        
        // For character selection screen
        this.bindButton('knight-btn', 'click', () => this.selectClass('Knight'));
        this.bindButton('mage-btn', 'click', () => this.selectClass('Mage'));
        this.bindButton('rogue-btn', 'click', () => this.selectClass('Rogue'));
        this.bindButton('reset-btn', 'click', () => this.resetMetaProgression());
        
        // For gem catalog screen
        this.bindButton('continue-journey-btn', 'click', () => this.startJourney());
        
        // For battle screen
        this.bindButton('execute-btn', 'click', () => EventBus.emit('EXECUTE_GEMS'));
        this.bindButton('wait-btn', 'click', () => EventBus.emit('WAIT_TURN'));
        this.bindButton('discard-end-btn', 'click', () => EventBus.emit('DISCARD_AND_END'));
        this.bindButton('end-turn-btn', 'click', () => EventBus.emit('END_TURN'));
        this.bindButton('flee-btn', 'click', () => EventBus.emit('FLEE_BATTLE'));
        
        // For shop screen
        this.bindButton('buy-random-gem', 'click', () => EventBus.emit('BUY_RANDOM_GEM'));
        this.bindButton('discard-gem', 'click', () => EventBus.emit('DISCARD_GEM'));
        this.bindButton('upgrade-gem', 'click', () => EventBus.emit('INITIATE_UPGRADE'));
        this.bindButton('cancel-upgrade', 'click', () => EventBus.emit('CANCEL_UPGRADE'));
        this.bindButton('heal-10', 'click', () => EventBus.emit('HEAL_IN_SHOP'));
        this.bindButton('continue-btn', 'click', () => EventBus.emit('CONTINUE_FROM_SHOP'));
        
        // For camp screen
        this.bindButton('withdraw-btn', 'click', () => this.withdrawZenny());
        this.bindButton('deposit-btn', 'click', () => this.depositZenny());
        this.bindButton('next-day-btn', 'click', () => this.startNextDay());
    }

    /**
     * Safely bind an event listener to a button
     * @param {String} buttonId - ID of the button element
     * @param {String} eventType - Type of event (e.g., 'click')
     * @param {Function} handler - Event handler function
     * @returns {Boolean} Whether binding was successful
     */
    bindButton(buttonId, eventType, handler) {
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
    setupKeyboardHandlers() {
        document.addEventListener('keydown', (event) => {
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
    setupAutoSave() {
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
    selectClass(className) {
        console.log(`Selecting class: ${className}`);
        
        // Emit class selection event
        EventBus.emit('CLASS_SELECTED', { className });
        
        // Navigate to gem catalog
        EventBus.emit('SCREEN_CHANGE', 'gemCatalog');
    }

    /**
     * Start the journey from gem catalog to battle
     */
    startJourney() {
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
     * Toggle gem selection
     * @param {Number} index - Index of the gem in the hand
     * @param {Boolean} isShop - Whether this is in the shop context
     */
    toggleGemSelection(index, isShop = false) {
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
     * Withdraw zenny to meta wallet
     */
    withdrawZenny() {
        const withdrawAmount = document.getElementById('withdraw-amount');
        if (!withdrawAmount) return;

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
        
        // Clear input
        withdrawAmount.value = '';
    }

    /**
     * Deposit zenny from meta wallet
     */
    depositZenny() {
        const depositAmount = document.getElementById('deposit-amount');
        if (!depositAmount) return;

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
        
        // Clear input
        depositAmount.value = '';
    }

    /**
     * Start the next day
     */
    startNextDay() {
        // Emit next day event
        EventBus.emit('START_NEXT_DAY');
    }

    /**
     * Reset meta progression
     */
    resetMetaProgression() {
        if (confirm("Are you sure you want to reset all meta-progression? This will clear Meta $ZENNY, unlocked gems, and proficiency.")) {
            EventBus.emit('META_PROGRESSION_RESET');
        }
    }

    /**
     * For compatibility with the renderer
     */
    updateBattleUI() {
        EventBus.emit('UI_UPDATE', { target: 'battle' });
    }

    updateShopUI() {
        EventBus.emit('UI_UPDATE', { target: 'shop' });
    }

    updateGemCatalogUI() {
        EventBus.emit('UI_UPDATE', { target: 'gemCatalog' });
    }

    updateCampUI() {
        EventBus.emit('UI_UPDATE', { target: 'camp' });
    }

    renderHand() {
        EventBus.emit('HAND_UPDATED');
    }

    updateGemSelection(selectedIndices) {
        EventBus.emit('GEM_SELECTION_CHANGED', { selectedIndices });
    }

    /**
     * Cleanup subscription when needed
     */
    cleanup() {
        this.eventSubscriptions.forEach(subscription => {
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        });
        this.eventSubscriptions = [];
        this.initialized = false;
    }
}

// Create a singleton instance
export const EventHandlerInstance = new EventHandler();

// For backwards compatibility
export default EventHandlerInstance;