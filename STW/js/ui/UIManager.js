import { EventBus } from '../core/eventbus.js';
import { GameState } from '../core/state.js';
import { Config } from '../core/config.js';  // Add Config import

// Import screens
import CharacterSelectScreen from './screens/CharacterSelectScreen.js';
import BattleScreen from './screens/BattleScreen.js';
import ShopScreen from './screens/ShopScreen.js';
import GemCatalogScreen from './screens/GemCatalogScreen.js';
import CampScreen from './screens/CampScreen.js';

/**
 * UIManager - Central manager for UI screens and transitions
 */
export class UIManager {
    constructor() {
        this.screens = {};
        this.activeScreen = null;
        this.elements = {};
        this.initialized = false;
    }

    /**
     * Initialize the UI Manager
     */
    initialize() {
        if (this.initialized) return true;

        console.log("Initializing UI Manager");

        // Cache system elements
        this.cacheSystemElements();

        // Initialize screens
        this.initializeScreens();

        // Set up event listeners
        this.setupEventListeners();

        this.initialized = true;
        console.log("UI Manager initialized");
        return true;
    }

    /**
     * Cache system UI elements
     */
    cacheSystemElements() {
        const safeGetElement = (id) => {
            const element = document.getElementById(id);
            if (!element) console.warn(`Element with ID '${id}' not found`);
            return element;
        };

        this.elements = {
            message: safeGetElement('message'),
            loadingOverlay: safeGetElement('loading-overlay'),
            errorOverlay: safeGetElement('error-overlay'),
            errorMessage: document.querySelector('#error-overlay .error-message'),
            errorClose: document.querySelector('#error-overlay .error-close'),
            audioButton: safeGetElement('audio-button')
        };
    }

    /**
     * Initialize all screen modules
     */
    initializeScreens() {
        // Create screen instances
        this.screens = {
            characterSelect: new CharacterSelectScreen(),
            battle: new BattleScreen(),
            shop: new ShopScreen(),
            gemCatalog: new GemCatalogScreen(),
            camp: new CampScreen()
        };

        // Initialize each screen
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
        // Screen changes
        EventBus.on('SCREEN_CHANGE', (screenName) => {
            // If screenName is an object with a screen property, extract it
            if (typeof screenName === 'object' && screenName.screen) {
                screenName = screenName.screen;
            }
            this.switchScreen(screenName);
        });

        // Messages
        EventBus.on('UI_MESSAGE', ({ message, type = 'success', duration = 2000 }) => {
            this.showMessage(message, type, duration);
        });

        // Loading indicator
        EventBus.on('LOADING_START', ({ message = 'Loading...' }) => {
            this.showLoading(message);
        });

        EventBus.on('LOADING_END', () => {
            this.hideLoading();
        });

        // Errors
        EventBus.on('ERROR_SHOW', ({ message, isFatal = false }) => {
            this.showError(message, isFatal);
        });

        EventBus.on('ERROR_HIDE', () => {
            this.hideError();
        });
    }

    /**
     * Show a notification message
     * @param {String} message - Message to display
     * @param {String} type - Message type ('success' or 'error')
     * @param {Number} duration - Time to display message in ms
     */
    showMessage(message, type = 'success', duration = 2000) {
        const messageEl = this.elements.message;

        if (!messageEl) {
            console.warn("Message element not found");
            return;
        }

        // Set message content and type
        messageEl.textContent = message;
        messageEl.className = '';
        messageEl.classList.add(type);
        messageEl.classList.add('visible');

        // Clear after duration
        setTimeout(() => {
            messageEl.classList.remove('visible');
        }, duration);
    }

    /**
     * Switch to a different screen
     * @param {String} screenName - Name of the screen to switch to
     */
    switchScreen(screenName) {
        console.log(`Switching to screen: ${screenName}`);

        // Validate screen name
        if (!this.screens[screenName]) {
            console.error(`Screen '${screenName}' not found`);
            return false;
        }

        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Update state
        GameState.set('currentScreen', screenName);
        this.activeScreen = screenName;

        // Show and render the target screen
        const screenElement = document.getElementById(`${screenName}-screen`);
        if (screenElement) {
            screenElement.classList.add('active');
        } else {
            console.error(`Screen element '${screenName}-screen' not found`);
        }

        // Render the screen content
        if (typeof this.screens[screenName].render === 'function') {
            this.screens[screenName].render();
        }

        return true;
    }

    /**
     * Show loading overlay
     * @param {String} message - Loading message
     */
    showLoading(message = 'Loading...') {
        const loadingEl = this.elements.loadingOverlay;
        if (!loadingEl) return;

        const messageEl = loadingEl.querySelector('.loading-message');
        if (messageEl) {
            messageEl.textContent = message;
        }

        loadingEl.style.display = 'flex';
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.display = 'none';
        }
    }

    /**
     * Show error message
     * @param {String} message - Error message
     * @param {Boolean} isFatal - Whether this is a fatal error
     */
    showError(message, isFatal = false) {
        console.error("Game error:", message);

        try {
            const errorEl = this.elements.errorOverlay;

            if (errorEl) {
                // Update error message
                if (this.elements.errorMessage) {
                    this.elements.errorMessage.textContent = message;
                }

                // Handle close button
                if (this.elements.errorClose) {
                    this.elements.errorClose.textContent = isFatal ? 'Restart Game' : 'Continue';
                    this.elements.errorClose.onclick = () => {
                        this.hideError();
                        if (isFatal) {
                            window.location.reload();
                        }
                    };
                }

                errorEl.style.display = 'flex';
            } else {
                // Fallback to alert
                alert(message + (isFatal ? " The game will now reload." : ""));
                if (isFatal) {
                    window.location.reload();
                }
            }
        } catch (e) {
            // Last resort fallback
            console.error("Error while showing error:", e);
            alert(message);
        }
    }

    /**
     * Hide error message
     */
    hideError() {
        if (this.elements.errorOverlay) {
            this.elements.errorOverlay.style.display = 'none';
        }
    }

    /**
     * Get the active screen
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

export default UIManager;