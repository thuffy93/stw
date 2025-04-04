import { EventBus } from '../core/eventbus.js';
import { GameState } from '../core/state.js';
import { Config } from '../core/config.js';  // Add Config import

/**
 * CharacterSelectScreen - Handles character selection UI and interactions
 */
export class CharacterSelectScreen {
    constructor() {
        this.elements = {};
        this.initialized = false;
    }

    /**
     * Initialize the screen
     */
    initialize() {
        if (this.initialized) return true;
        
        console.log("Initializing Character Select Screen");
        
        // Cache DOM elements
        this.elements = {
            screen: document.getElementById('character-select-screen'),
            knightBtn: document.getElementById('knight-btn'),
            mageBtn: document.getElementById('mage-btn'),
            rogueBtn: document.getElementById('rogue-btn'),
            resetBtn: document.getElementById('reset-btn')
        };
        
        // Add event listeners
        this.setupEventListeners();
        
        this.initialized = true;
        return true;
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Character class buttons
        if (this.elements.knightBtn) {
            this.elements.knightBtn.addEventListener('click', () => this.selectClass('Knight'));
        }
        
        if (this.elements.mageBtn) {
            this.elements.mageBtn.addEventListener('click', () => this.selectClass('Mage'));
        }
        
        if (this.elements.rogueBtn) {
            this.elements.rogueBtn.addEventListener('click', () => this.selectClass('Rogue'));
        }
        
        // Reset button
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => this.resetMetaProgression());
        }
    }
    
    /**
     * Render the screen
     */
    render() {
        if (!this.initialized) this.initialize();
        
        console.log("Rendering character select screen");
        
        // No specific rendering needed for this simple screen
        return true;
    }
    
    /**
     * Handle class selection
     * @param {String} className - Selected class name
     */
    selectClass(className) {
        console.log(`Character class selected: ${className}`);
        
        // Validate class
        if (!Config.CLASSES[className]) {
            EventBus.emit('UI_MESSAGE', {
                message: `Invalid class: ${className}`,
                type: 'error'
            });
            return;
        }
        
        // Emit class selection event
        EventBus.emit('CLASS_SELECTED', { className });
    }
    
    /**
     * Reset meta progression
     */
    resetMetaProgression() {
        if (confirm("Are you sure you want to reset all meta-progression? This will clear Meta $ZENNY, unlocked gems, and proficiency.")) {
            EventBus.emit('META_PROGRESSION_RESET');
        }
    }
}

export default CharacterSelectScreen;