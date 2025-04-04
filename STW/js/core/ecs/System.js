// Base System class for ECS architecture
import { EventBus } from '../../core/eventbus.js';

/**
 * System - Base class for all ECS systems
 */
export class System {
    constructor(name) {
        this.name = name;
        this.enabled = true;
        this.eventHandlers = new Map();
        this.listeners = [];
    }
    
    /**
     * Initialize the system
     * @returns {Boolean} Success status
     */
    initialize() {
        // Register all event handlers
        this.registerEventHandlers();
        console.log(`System initialized: ${this.name}`);
        return true;
    }
    
    /**
     * Shutdown the system
     */
    shutdown() {
        // Unregister all event handlers
        this.unregisterEventHandlers();
        console.log(`System shut down: ${this.name}`);
    }
    
    /**
     * Register event handlers defined in the getEventHandlers method
     */
    registerEventHandlers() {
        const handlers = this.getEventHandlers();
        
        handlers.forEach((handlerFn, eventName) => {
            // Bind the handler to this system instance
            const boundHandler = handlerFn.bind(this);
            
            // Store both the original and bound handler for cleanup
            this.eventHandlers.set(eventName, {
                original: handlerFn,
                bound: boundHandler
            });
            
            // Register with EventBus
            const token = EventBus.subscribe(eventName, boundHandler);
            this.listeners.push({ eventName, token });
        });
    }
    
    /**
     * Unregister all event handlers
     */
    unregisterEventHandlers() {
        this.listeners.forEach(({ eventName, token }) => {
            EventBus.unsubscribe(eventName, token);
        });
        
        this.listeners = [];
    }
    
    /**
     * Get event handlers - override in derived classes
     * @returns {Map} Map of event names to handler functions
     */
    getEventHandlers() {
        // Base implementation returns empty map
        // Override in derived classes
        return new Map();
    }
    
    /**
     * Enable this system
     */
    enable() {
        if (!this.enabled) {
            this.enabled = true;
            this.registerEventHandlers();
            console.log(`System enabled: ${this.name}`);
        }
    }
    
    /**
     * Disable this system
     */
    disable() {
        if (this.enabled) {
            this.enabled = false;
            this.unregisterEventHandlers();
            console.log(`System disabled: ${this.name}`);
        }
    }
    
    /**
     * Update method called on each frame - override in derived classes
     * @param {Number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        // Base implementation does nothing
        // Override in derived classes that need per-frame updates
    }
}

export default System;