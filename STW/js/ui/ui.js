import { EventBus } from '../core/events.js';
import { GameState } from '../core/state.js';

export const UI = (() => {
    // Simplified element cache with essential, universally used elements
    const elements = {
        screens: {},
        system: {
            message: null,
            loadingOverlay: null,
            errorOverlay: null
        }
    };

    function setupDOMCache() {
        // Define screens
        const screenNames = [
            'characterSelect', 
            'gemCatalog', 
            'battle', 
            'shop', 
            'camp'
        ];

        screenNames.forEach(name => {
            const screen = document.getElementById(`${name}-screen`);
            if (screen) {
                elements.screens[name] = screen;
            }
        });

        // Cache system-wide elements
        elements.system.message = document.getElementById('message');
        elements.system.loadingOverlay = document.getElementById('loading-overlay');
        elements.system.errorOverlay = document.getElementById('error-overlay');
    }

    function getElement(selector) {
        // Fallback method for dynamic element retrieval
        return document.querySelector(selector);
    }

    function $(id) {
        // Quick element retrieval method
        return document.getElementById(id);
    }

    function initialize() {
        console.log("Initializing UI module");
        setupDOMCache();
        bindSystemEvents();
        return true;
    }

    function bindSystemEvents() {
        // Centralized event binding for core UI interactions
        EventBus.on('UI_MESSAGE', handleMessage);
        EventBus.on('SCREEN_CHANGE', switchScreen);
        EventBus.on('LOADING_START', showLoading);
        EventBus.on('LOADING_END', hideLoading);
        EventBus.on('ERROR_SHOW', showError);
    }

    function switchScreen(screenName) {
        // Hide all screens
        Object.values(elements.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = elements.screens[screenName];
        if (targetScreen) {
            targetScreen.classList.add('active');
            GameState.set('currentScreen', screenName);
        } else {
            console.warn(`Screen not found: ${screenName}`);
        }
    }

    function handleMessage({ message, type = 'success', duration = 2000 }) {
        const messageEl = elements.system.message;
        if (!messageEl) return;

        messageEl.textContent = message;
        messageEl.className = `message ${type} visible`;

        setTimeout(() => {
            messageEl.classList.remove('visible');
        }, duration);
    }

    function showLoading(message = 'Loading...') {
        const overlay = elements.system.loadingOverlay;
        if (!overlay) return;

        const messageEl = overlay.querySelector('.loading-message');
        if (messageEl) messageEl.textContent = message;
        
        overlay.style.display = 'flex';
    }

    function hideLoading() {
        const overlay = elements.system.loadingOverlay;
        if (overlay) overlay.style.display = 'none';
    }

    function showError(message, isFatal = false) {
        const overlay = elements.system.errorOverlay;
        if (!overlay) {
            console.error(message);
            return;
        }

        const messageEl = overlay.querySelector('.error-message');
        const closeBtn = overlay.querySelector('.error-close');

        if (messageEl) messageEl.textContent = message;
        
        if (closeBtn) {
            closeBtn.textContent = isFatal ? 'Restart' : 'Close';
            closeBtn.onclick = () => {
                overlay.style.display = 'none';
                if (isFatal) window.location.reload();
            };
        }

        overlay.style.display = 'flex';
    }

    function hideError() {
        const overlay = elements.system.errorOverlay;
        if (overlay) overlay.style.display = 'none';
    }

    return {
        initialize,
        switchScreen,
        getElement,
        $,
        showLoading,
        hideLoading,
        showError,
        hideError
    };
})();