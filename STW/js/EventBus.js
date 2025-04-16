// EventBus.js - Enhanced version with improved event handling
export default class EventBus {
    constructor() {
        // Main event listeners storage
        this.listeners = {};
        
        // Track emitted events for debugging
        this.eventHistory = [];
        this.maxHistoryLength = 100;
        
        // Debug mode flag
        this.debug = false;
    }

    // Enable/disable debug mode
    setDebug(enabled) {
        this.debug = Boolean(enabled);
        return this;
    }
    
    // Subscribe to an event with enhanced tracking
    on(event, callback, context = null) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        
        // Store callback with additional metadata
        const listener = {
            callback,
            context,
            timestamp: Date.now(),
            id: this.generateListenerId()
        };
        
        this.listeners[event].push(listener);
        
        if (this.debug) {
            console.log(`[EventBus] Added listener for "${event}" (ID: ${listener.id})`);
        }
        
        // Return unsubscribe function with listener ID for easier removal
        return () => {
            this.off(event, listener.id);
        };
    }
    
    // Generate a unique ID for each listener
    generateListenerId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Emit an event with optional data and improved tracking
    emit(event, data) {
        if (this.debug) {
            console.log(`[EventBus] Emitting "${event}"`, data);
            this.trackEvent(event, data);
        }
        
        if (!this.listeners[event]) {
            return false; // No listeners for this event
        }
        
        // Create a copy of listeners array to avoid issues if listeners modify the array
        const currentListeners = [...this.listeners[event]];
        
        let errorCount = 0;
        currentListeners.forEach(listener => {
            try {
                if (listener.context) {
                    listener.callback.call(listener.context, data);
                } else {
                    listener.callback(data);
                }
            } catch (error) {
                errorCount++;
                console.error(`[EventBus] Error in listener for "${event}":`, error);
            }
        });
        
        return errorCount === 0; // Return success status
    }
    
    // Enhanced off method that can remove by ID or callback
    off(event, callbackOrId) {
        if (!this.listeners[event]) {
            return false;
        }
        
        // Case 1: No specific callback - remove all listeners for the event
        if (!callbackOrId) {
            if (this.debug) {
                console.log(`[EventBus] Removed all listeners for "${event}"`);
            }
            delete this.listeners[event];
            return true;
        }
        
        const initialCount = this.listeners[event].length;
        
        // Case 2: Remove by ID (string)
        if (typeof callbackOrId === 'string') {
            this.listeners[event] = this.listeners[event].filter(listener => 
                listener.id !== callbackOrId
            );
        } 
        // Case 3: Remove by callback function reference
        else if (typeof callbackOrId === 'function') {
            this.listeners[event] = this.listeners[event].filter(listener => 
                listener.callback !== callbackOrId
            );
        }
        
        const removedCount = initialCount - this.listeners[event].length;
        
        if (this.debug && removedCount > 0) {
            console.log(`[EventBus] Removed ${removedCount} listener(s) for "${event}"`);
        }
        
        // Clean up empty arrays
        if (this.listeners[event].length === 0) {
            delete this.listeners[event];
        }
        
        return removedCount > 0;
    }
    
    // Remove all event listeners
    clear() {
        if (this.debug) {
            console.log(`[EventBus] Cleared all event listeners`);
        }
        this.listeners = {};
        return this;
    }
    
    // Track emitted events for debugging
    trackEvent(event, data) {
        this.eventHistory.push({
            event,
            data,
            timestamp: Date.now()
        });
        
        // Limit history length
        if (this.eventHistory.length > this.maxHistoryLength) {
            this.eventHistory.shift();
        }
    }
    
    // Get event history (for debugging)
    getEventHistory() {
        return [...this.eventHistory];
    }
    
    // Get listener stats for debugging
    getListenerStats() {
        const stats = {
            eventCount: Object.keys(this.listeners).length,
            totalListeners: 0,
            eventBreakdown: {}
        };
        
        Object.entries(this.listeners).forEach(([event, listeners]) => {
            stats.totalListeners += listeners.length;
            stats.eventBreakdown[event] = listeners.length;
        });
        
        return stats;
    }
    
    // Create a namespaced event name
    static createEventName(category, action) {
        return `${category}:${action}`;
    }
}