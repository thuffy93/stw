// Import core modules only
import { EventBus } from './core/eventbus.js';
import { GameState } from './core/state.js';
import { Config } from './core/config.js';
import { Storage } from './core/storage.js';
import { Utils } from './core/utils.js';

// Basic UI management without importing missing files
const BasicUI = {
    initialize() {
        console.log("Initializing Basic UI");
        this.setupEventListeners();
        this.initializeScreens();
        return true;
    },
    
    setupEventListeners() {
        // Set up button event listeners
        this.setupButtons();
        
        // Listen for screen changes
        EventBus.on('SCREEN_CHANGE', (screenName) => {
            this.switchScreen(screenName);
        });
        
        // Listen for messages
        EventBus.on('UI_MESSAGE', ({ message, type = 'success', duration = 2000 }) => {
            this.showMessage(message, type, duration);
        });
        
        // Listen for journey start
        EventBus.on('JOURNEY_START', () => {
            this.startJourney();
        });
    },
    
    setupButtons() {
        // Character selection buttons
        const knightBtn = document.getElementById('knight-btn');
        const mageBtn = document.getElementById('mage-btn');
        const rogueBtn = document.getElementById('rogue-btn');
        
        if (knightBtn) {
            knightBtn.addEventListener('click', () => this.selectClass('Knight'));
            console.log("Knight button bound");
        } else {
            console.warn("Knight button not found");
        }
        
        if (mageBtn) {
            mageBtn.addEventListener('click', () => this.selectClass('Mage'));
            console.log("Mage button bound");
        } else {
            console.warn("Mage button not found");
        }
        
        if (rogueBtn) {
            rogueBtn.addEventListener('click', () => this.selectClass('Rogue'));
            console.log("Rogue button bound");
        } else {
            console.warn("Rogue button not found");
        }
        
        // Continue button in gem catalog
        const continueBtn = document.getElementById('continue-journey-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                console.log("Continue journey clicked");
                // Call startJourney directly rather than emitting an event
                this.startJourney();
            });
            console.log("Continue journey button bound");
        } else {
            console.warn("Continue journey button not found");
        }
    },
    
    /**
     * Start the journey
     */
    startJourney() {
        console.log("Starting journey");
        
        this.showMessage("Starting your adventure...");
        
        // Load saved game state if available
        if (typeof Storage !== 'undefined' && Storage.loadGameState) {
            Storage.loadGameState();
        }
        
        // Reset for a new run if needed
        if (!GameState.get('battleCount')) {
            GameState.set('currentDay', 1);
            GameState.set('currentPhaseIndex', 0);
            GameState.set('battleCount', 0);
        }
        
        // Reset battle-related state
        GameState.set('battleOver', false);
        GameState.set('selectedGems', new Set());
        
        // Reset player buffs
        const player = GameState.get('player');
        if (player) {
            player.buffs = [];
            GameState.set('player.buffs', []);
            
            // Ensure player has full stamina
            GameState.set('player.stamina', player.baseStamina);
        }
        
        // Switch to battle screen after a short delay
        setTimeout(() => {
            this.switchScreen('battle');
        }, 100);
    },
    
    initializeScreens() {
        // Verify screens exist and log their presence
        const screens = [
            'character-select-screen',
            'gemCatalog-screen',
            'battle-screen',
            'shop-screen',
            'camp-screen'
        ];
        
        screens.forEach(id => {
            const screen = document.getElementById(id);
            if (screen) {
                console.log(`Screen found: ${id}`);
            } else {
                console.warn(`Screen not found: ${id}`);
            }
        });
        
        // Hide all screens initially
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show character select screen by default
        const characterSelectScreen = document.getElementById('character-select-screen');
        if (characterSelectScreen) {
            characterSelectScreen.classList.add('active');
            console.log("Character select screen activated");
        } else {
            console.error("Character select screen not found!");
        }
    },
    
    switchScreen(screenName) {
        console.log(`Switching to screen: ${screenName}`);
        
        // Map screen names to IDs
        const screenIdMap = {
            'characterSelect': 'character-select-screen',
            'gemCatalog': 'gemCatalog-screen',
            'battle': 'battle-screen',
            'shop': 'shop-screen',
            'camp': 'camp-screen'
        };
        
        const screenId = screenIdMap[screenName];
        
        if (!screenId) {
            console.error(`Invalid screen name: ${screenName}`);
            return;
        }
        
        // Update state
        GameState.set('currentScreen', screenName);
        
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show the target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            console.log(`Screen ${screenId} activated`);
        } else {
            console.error(`Screen element '${screenId}' not found`);
        }
        
        // Update specific screen content based on screen type
        if (screenName === 'gemCatalog') {
            this.updateGemCatalog();
        }
    },
    
    selectClass(className) {
        console.log(`Class selected: ${className}`);
        
        // Validate class
        if (!Config.CLASSES[className]) {
            this.showMessage(`Invalid class: ${className}`, 'error');
            return;
        }
        
        // Create base character
        const classConfig = Config.CLASSES[className];
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
        
        // Initialize gem catalog
        this.setupGemCatalog(className);
        
        // Move to gem catalog screen
        this.switchScreen('gemCatalog');
    },
    
    setupGemCatalog(className) {
        // Initialize gem catalog from default configuration
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
        
        // Initialize gem proficiency
        const initialProficiency = Config.INITIAL_GEM_PROFICIENCY[className] || {};
        GameState.set('gemProficiency', Utils.deepClone(initialProficiency));
        GameState.set(`classGemProficiency.${className}`, Utils.deepClone(initialProficiency));
    },
    
    updateGemCatalog() {
        const gemCatalog = GameState.get('gemCatalog');
        const metaZenny = GameState.get('metaZenny');
        
        // Update meta zenny display
        const metaZennyDisplay = document.getElementById('meta-zenny-display');
        if (metaZennyDisplay) {
            metaZennyDisplay.textContent = metaZenny || 0;
        }
        
        console.log("Gem catalog updated");
    },
    
    showMessage(message, type = 'success', duration = 2000) {
        console.log(`Message (${type}): ${message}`);
        
        const messageEl = document.getElementById('message');
        if (!messageEl) {
            // Create message element if it doesn't exist
            const newMessageEl = document.createElement('div');
            newMessageEl.id = 'message';
            newMessageEl.style.position = 'fixed';
            newMessageEl.style.bottom = '20px';
            newMessageEl.style.left = '50%';
            newMessageEl.style.transform = 'translateX(-50%)';
            newMessageEl.style.padding = '10px 20px';
            newMessageEl.style.borderRadius = '5px';
            newMessageEl.style.zIndex = '9999';
            newMessageEl.style.opacity = '0';
            newMessageEl.style.transition = 'opacity 0.3s ease';
            document.body.appendChild(newMessageEl);
            
            setTimeout(() => this.showMessage(message, type, duration), 100);
            return;
        }
        
        // Set message content and type
        messageEl.textContent = message;
        messageEl.className = '';
        messageEl.classList.add(type);
        
        // Set colors based on type
        if (type === 'success') {
            messageEl.style.backgroundColor = '#55cc55';
            messageEl.style.color = 'white';
        } else if (type === 'error') {
            messageEl.style.backgroundColor = '#ff5555';
            messageEl.style.color = 'white';
        }
        
        // Show message
        messageEl.style.opacity = '1';
        messageEl.classList.add('visible');
        
        // Clear after duration
        setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.classList.remove('visible');
        }, duration);
    }
};

// Component initialization 
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM content loaded, initializing component UI");
    try {
        BasicUI.initialize();
        console.log("Basic UI initialized");
        
        // Start at character selection screen
        setTimeout(() => {
            EventBus.emit('SCREEN_CHANGE', 'characterSelect');
        }, 100);
    } catch (error) {
        console.error("Failed to initialize:", error);
        alert("Failed to initialize game components. Check console for details.");
    }
});

// Cleanup function
function cleanup() {
    console.log("Cleaning up");
    
    try {
        // Save game state if applicable
        if (GameState.get('player.class')) {
            Storage.saveGameState();
        }
    } catch (e) {
        console.error("Error during cleanup:", e);
    }
}

// Export cleanup function for external use
export function cleanupComponentUI() {
    cleanup();
    return true;
}

// Set up cleanup on unload
window.addEventListener('beforeunload', cleanup);