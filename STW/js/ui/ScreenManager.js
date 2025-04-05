// ui/ScreenManager.js - Integrates component-based screens with the renderer

import { EventBus } from '../core/eventbus.js';
import { GameState } from '../core/state.js';

/**
 * Screen Manager - Handles screen transitions and rendering
 */
export class ScreenManager {
    constructor() {
        this.screens = {};
        this.activeScreen = null;
        this.initialized = false;
    }
    
    /**
     * Initialize the screen manager
     */
    initialize() {
        if (this.initialized) return true;
        
        console.log("Initializing Screen Manager");
        
        try {
            // Set up event listeners first
            this.setupEventListeners();
            
            // Initialize screen components with fallbacks
            this.safeInitializeScreens();
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error("Error initializing ScreenManager:", error);
            // Try to provide more helpful error message based on the error
            if (error.message && error.message.includes("is not defined")) {
                const missingComponent = error.message.split("'")[1];
                console.error(`Missing component: ${missingComponent}. Make sure it's properly defined and imported.`);
            }
            return false;
        }
    }
    
    /**
     * Safely initialize screens with fallback for missing components
     */
    safeInitializeScreens() {
        // Try to safely load screen components
        try {
            // Only load CharacterSelectScreen initially as fallback
            const CharacterSelectScreen = this.safeRequireComponent('CharacterSelectScreen');
            this.screens.characterSelect = CharacterSelectScreen ? new CharacterSelectScreen() : this.createFallbackScreen('Character Select');
        } catch (error) {
            console.warn("Error creating initial screens:", error);
            // At minimum, we need a character select screen
            this.screens.characterSelect = this.createFallbackScreen('Character Select');
        }
        
        // Try to load other screens but don't fail if they're missing
        this.tryCreateScreen('gemCatalog', 'GemCatalogScreen', 'Gem Catalog');
        this.tryCreateScreen('battle', 'BattleScreen', 'Battle');
        this.tryCreateScreen('shop', 'ShopScreen', 'Shop');
        this.tryCreateScreen('camp', 'CampScreen', 'Camp');
        
        console.log("Screen initialization completed with available components");
    }
    
    /**
     * Try to safely create a screen component
     * @param {String} key - Screen key in the screens object
     * @param {String} componentName - Component class name
     * @param {String} fallbackTitle - Title for fallback screen
     */
    tryCreateScreen(key, componentName, fallbackTitle) {
        try {
            const ScreenComponent = this.safeRequireComponent(componentName);
            this.screens[key] = ScreenComponent ? new ScreenComponent() : this.createFallbackScreen(fallbackTitle);
        } catch (error) {
            console.warn(`Error creating ${componentName}:`, error);
            this.screens[key] = this.createFallbackScreen(fallbackTitle);
        }
    }
    
    /**
     * Safely try to get a component, return null if not available
     * @param {String} componentName - Name of the component class
     * @returns {Function|null} Component class or null if not available
     */
    safeRequireComponent(componentName) {
        // Try to get component based on naming conventions
        // This is a simplified version - in a real implementation we'd use dynamic imports
        switch (componentName) {
            case 'CharacterSelectScreen':
                try {
                    return window.CharacterSelectScreen || null;
                } catch (e) { return null; }
            case 'GemCatalogScreen':
                try {
                    return window.GemCatalogScreen || null;
                } catch (e) { return null; }
            case 'BattleScreen':
                try {
                    return window.BattleScreen || null;
                } catch (e) { return null; }
            case 'ShopScreen':
                try {
                    return window.ShopScreen || null;
                } catch (e) { return null; }
            case 'CampScreen':
                try {
                    return window.CampScreen || null;
                } catch (e) { return null; }
            default:
                return null;
        }
    }
    
    /**
     * Create a simple fallback screen when a component is missing
     * @param {String} title - Screen title
     * @returns {Object} Simple screen object
     */
    createFallbackScreen(title) {
        return {
            render: function() {
                const screenElement = document.createElement('div');
                screenElement.className = 'screen fallback';
                
                const titleElement = document.createElement('h1');
                titleElement.textContent = title;
                
                const messageElement = document.createElement('p');
                messageElement.textContent = 'Screen component could not be loaded. Please check the console for errors.';
                
                screenElement.appendChild(titleElement);
                screenElement.appendChild(messageElement);
                
                return screenElement;
            }
        };
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for screen change events
        try {
            EventBus.on('SCREEN_CHANGE', (screenName) => {
                this.changeScreen(screenName);
            });
            console.log("EventBus listeners registered successfully");
        } catch (error) {
            console.error("Error setting up event listeners:", error);
        }
    }
    
    /**
     * Change to a different screen
     * @param {String} screenName - Name of the screen to change to
     * @returns {Boolean} Success
     */
    changeScreen(screenName) {
        // If screenName is an object with a screen property, extract it
        if (typeof screenName === 'object' && screenName.screen) {
            screenName = screenName.screen;
        }
        
        console.log(`Changing screen to: ${screenName}`);
        
        // Check if the screen exists
        if (!this.screens[screenName]) {
            console.error(`Screen '${screenName}' not found`);
            // Fallback to character select if screen not found
            screenName = 'characterSelect';
            if (!this.screens[screenName]) {
                console.error("Character select screen also not found, cannot change screens");
                return false;
            }
        }
        
        // Update game state
        GameState.set('currentScreen', screenName);
        this.activeScreen = screenName;
        
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        try {
            // Get the screen element
            const screen = this.screens[screenName];
            
            // Check if the screen has a render method
            if (typeof screen.render !== 'function') {
                console.error(`Screen ${screenName} does not have a render method`);
                return false;
            }
            
            // Render the screen
            const screenElement = screen.render();
            
            // If the screen returned an element, add it to the container
            if (screenElement instanceof HTMLElement) {
                const container = document.getElementById('game-container') || document.body;
                
                // Remove any existing screen
                const existingScreen = document.getElementById(`${screenName}-screen`);
                if (existingScreen) {
                    existingScreen.remove();
                }
                
                // Add the new screen
                container.appendChild(screenElement);
                
                // Activate the screen
                screenElement.classList.add('active');
            } else {
                // Otherwise, try to find the screen element by its ID
                const screenElement = document.getElementById(`${screenName}-screen`);
                if (screenElement) {
                    screenElement.classList.add('active');
                } else {
                    console.error(`Screen element for '${screenName}' not found`);
                    return false;
                }
            }
            
            // Emit screen changed event
            EventBus.emit('SCREEN_CHANGED', { screen: screenName });
            
            return true;
        } catch (error) {
            console.error(`Error changing to screen ${screenName}:`, error);
            return false;
        }
    }
    
    /**
     * Get the active screen name
     * @returns {String} Active screen name
     */
    getActiveScreen() {
        return this.activeScreen;
    }
    
    /**
     * Get a screen instance by name
     * @param {String} screenName - Name of the screen
     * @returns {Object} Screen instance
     */
    getScreen(screenName) {
        return this.screens[screenName];
    }
}

export default ScreenManager;