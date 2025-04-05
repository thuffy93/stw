// ui/ScreenManager.js - Integrates component-based screens with the renderer

import { EventBus } from '../core/eventbus.js';
import { GameState } from '../core/state.js';

// Import screens
import { CharacterSelectScreen } from './components/screens/CharacterSelectScreen.js';
import { GemCatalogScreen } from './components/screens/GemCatalogScreen.js';
import { BattleScreen } from './components/screens/BattleScreen.js';
import { ShopScreen } from './components/screens/ShopScreen.js';
import { CampScreen } from './components/screens/CampScreen.js';

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
        
        // Initialize screen components
        this.initializeScreens();
        
        // Set up event listeners
        this.setupEventListeners();
        
        this.initialized = true;
        return true;
    }
    
    /**
     * Initialize screen components
     */
    initializeScreens() {
        // Create screen instances
        this.screens = {
            characterSelect: new CharacterSelectScreen(),
            gemCatalog: new GemCatalogScreen(),
            battle: new BattleScreen(),
            shop: new ShopScreen(),
            camp: new CampScreen()
        };
        
        // Initialize each screen if it has an initialize method
        Object.values(this.screens).forEach(screen => {
            if (typeof screen.initialize === 'function') {
                screen.initialize();
            }
        });
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for screen change events
        EventBus.on('SCREEN_CHANGE', (screenName) => {
            this.changeScreen(screenName);
        });
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
            return false;
        }
        
        // Update game state
        GameState.set('currentScreen', screenName);
        this.activeScreen = screenName;
        
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Get screen element
        let screenElement;
        
        // Handle special case for gem catalog (different ID format)
        if (screenName === 'gemCatalog') {
            screenElement = document.getElementById('gemCatalog-screen') || 
                           document.getElementById('gem-catalog-screen');
        } else {
            screenElement = document.getElementById(`${screenName}-screen`);
        }
        
        if (!screenElement) {
            console.error(`Screen element for '${screenName}' not found`);
            return false;
        }
        
        // Show the screen
        screenElement.classList.add('active');
        
        // Render the screen if it has a render method
        if (typeof this.screens[screenName].render === 'function') {
            this.screens[screenName].render();
        }
        
        // Emit screen changed event
        EventBus.emit('SCREEN_CHANGED', { screen: screenName });
        
        return true;
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