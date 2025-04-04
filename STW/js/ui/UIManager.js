// ui/UIManager.js
import { EventBus } from '../core/eventbus.js';
import { GameState } from '../core/state.js';

// Import screen components
import { BattleScreen } from './components/screens/BattleScreen.js';
import { ShopScreen } from './components/screens/ShopScreen.js';
import { CharacterSelectScreen } from './components/screens/CharacterSelectScreen.js';
import { GemCatalogScreen } from './components/screens/GemCatalogScreen.js';
import { CampScreen } from './components/screens/CampScreen.js';

/**
 * Central UI Manager for handling screen transitions and global UI elements
 */
export class UIManager {
  constructor() {
    // Initialize screen components
    this.screens = {
      'battle': new BattleScreen(),
      'shop': new ShopScreen(),
      'characterSelect': new CharacterSelectScreen(),
      'gemCatalog': new GemCatalogScreen(),
      'camp': new CampScreen()
    };
    
    this.currentScreen = null;
    this.messageElement = null;
    this.loadingOverlay = null;
    this.errorOverlay = null;
    
    // Track if we've been initialized
    this.initialized = false;
  }
  
  /**
   * Initialize the UI Manager
   * @returns {Boolean} Whether initialization was successful
   */
  initialize() {
    if (this.initialized) {
      console.warn("UI Manager already initialized");
      return true;
    }
    
    try {
      console.log("Initializing UI Manager");
      
      // Create message container for notifications
      this.createMessageElement();
      
      // Create loading overlay
      this.createLoadingOverlay();
      
      // Create error overlay
      this.createErrorOverlay();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize with default screen (usually character select)
      const initialScreen = GameState.get('currentScreen') || 'characterSelect';
      this.switchScreen(initialScreen);
      
      this.initialized = true;
      console.log("UI Manager initialized successfully");
      
      return true;
    } catch (error) {
      console.error("Error initializing UI Manager:", error);
      return false;
    }
  }
  
  /**
   * Create the message element for notifications
   */
  createMessageElement() {
    this.messageElement = document.createElement('div');
    this.messageElement.id = 'message';
    document.body.appendChild(this.messageElement);
  }
  
  /**
   * Create loading overlay element
   */
  createLoadingOverlay() {
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.id = 'loading-overlay';
    this.loadingOverlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-message">Loading...</div>
    `;
    this.loadingOverlay.style.display = 'none';
    document.body.appendChild(this.loadingOverlay);
  }
  
  /**
   * Create error overlay element
   */
  createErrorOverlay() {
    this.errorOverlay = document.createElement('div');
    this.errorOverlay.id = 'error-overlay';
    this.errorOverlay.innerHTML = `
      <div class="error-container">
        <h2>An Error Occurred</h2>
        <div class="error-message">Something went wrong.</div>
        <button class="error-close">Continue</button>
      </div>
    `;
    this.errorOverlay.style.display = 'none';
    
    // Add close button handler
    const closeButton = this.errorOverlay.querySelector('.error-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hideError());
    }
    
    document.body.appendChild(this.errorOverlay);
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for screen change events
    EventBus.on('SCREEN_CHANGE', (screenName) => this.switchScreen(screenName));
    
    // Listen for message events
    EventBus.on('UI_MESSAGE', (data) => this.showMessage(data));
    
    // Listen for loading events
    EventBus.on('LOADING_START', (data) => this.showLoading(data.message));
    EventBus.on('LOADING_END', () => this.hideLoading());
    
    // Listen for error events
    EventBus.on('ERROR_SHOW', (data) => this.showError(data.message, data.isFatal));
    EventBus.on('ERROR_HIDE', () => this.hideError());
  }
  
  /**
   * Switch to a different screen
   * @param {String} screenName - Name of the screen to switch to
   */
  switchScreen(screenName) {
    console.log(`Switching to screen: ${screenName}`);
    
    if (!this.screens[screenName]) {
      console.error(`Screen ${screenName} not found`);
      return;
    }
    
    // Update game state
    GameState.set('currentScreen', screenName);
    
    // Hide current screen if exists
    if (this.currentScreen) {
      const currentElement = document.getElementById(this.currentScreen.id);
      if (currentElement) {
        currentElement.classList.remove('active');
      }
    }
    
    // Get the new screen
    const screen = this.screens[screenName];
    let screenElement = document.getElementById(screen.id);
    
    if (!screenElement) {
      // First time rendering this screen
      console.log(`Rendering ${screenName} screen for the first time`);
      screenElement = screen.render();
      document.body.appendChild(screenElement);
    } else {
      console.log(`Using existing ${screenName} screen element`);
    }
    
    // Show the screen
    screenElement.classList.add('active');
    this.currentScreen = screen;
    
    // Emit event that screen has changed
    EventBus.emit('SCREEN_CHANGED', screenName);
  }
  
  /**
   * Show a notification message
   * @param {Object} options - Message options
   * @param {String} options.message - Message text to display
   * @param {String} options.type - Message type (success/error/warning)
   * @param {Number} options.duration - Duration to show message in ms
   */
  showMessage({message, type = 'success', duration = 2000}) {
    if (!this.messageElement) return;
    
    this.messageElement.textContent = message;
    this.messageElement.className = '';
    this.messageElement.classList.add(type);
    this.messageElement.classList.add('visible');
    
    // Clear after duration
    setTimeout(() => {
      this.messageElement.classList.remove('visible');
    }, duration);
  }
  
  /**
   * Show loading overlay
   * @param {String} message - Loading message to display
   */
  showLoading(message = 'Loading...') {
    if (!this.loadingOverlay) return;
    
    const messageElement = this.loadingOverlay.querySelector('.loading-message');
    if (messageElement) {
      messageElement.textContent = message;
    }
    
    this.loadingOverlay.style.display = 'flex';
  }
  
  /**
   * Hide loading overlay
   */
  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = 'none';
    }
  }
  
  /**
   * Show error overlay
   * @param {String} message - Error message
   * @param {Boolean} isFatal - Whether this is a fatal error
   */
  showError(message, isFatal = false) {
    if (!this.errorOverlay) return;
    
    const messageElement = this.errorOverlay.querySelector('.error-message');
    if (messageElement) {
      messageElement.textContent = message;
    }
    
    const closeButton = this.errorOverlay.querySelector('.error-close');
    if (closeButton) {
      closeButton.textContent = isFatal ? 'Restart Game' : 'Continue';
      
      // Update click handler for fatal errors
      closeButton.onclick = () => {
        this.hideError();
        if (isFatal) {
          window.location.reload();
        }
      };
    }
    
    this.errorOverlay.style.display = 'flex';
  }
  
  /**
   * Hide error overlay
   */
  hideError() {
    if (this.errorOverlay) {
      this.errorOverlay.style.display = 'none';
    }
  }
  
  /**
   * Update a specific screen component
   * @param {String} screenName - Name of the screen to update
   * @param {Object} data - Data to update with
   */
  updateScreen(screenName, data) {
    const screen = this.screens[screenName];
    if (screen) {
      screen.update(data);
    }
  }
  
  /**
   * Clean up resources and prepare for shutdown
   */
  cleanup() {
    // Remove all event listeners
    if (typeof EventBus !== 'undefined') {
      EventBus.unsubscribe('SCREEN_CHANGE');
      EventBus.unsubscribe('UI_MESSAGE');
      EventBus.unsubscribe('LOADING_START');
      EventBus.unsubscribe('LOADING_END');
      EventBus.unsubscribe('ERROR_SHOW');
      EventBus.unsubscribe('ERROR_HIDE');
    }
    
    // Remove DOM elements
    if (this.messageElement && this.messageElement.parentNode) {
      this.messageElement.parentNode.removeChild(this.messageElement);
    }
    
    if (this.loadingOverlay && this.loadingOverlay.parentNode) {
      this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
    }
    
    if (this.errorOverlay && this.errorOverlay.parentNode) {
      this.errorOverlay.parentNode.removeChild(this.errorOverlay);
    }
    
    // Clean up all screens
    Object.values(this.screens).forEach(screen => {
      if (screen && typeof screen.remove === 'function') {
        screen.remove();
      }
    });
    
    this.screens = {};
    this.currentScreen = null;
    this.initialized = false;
  }
}