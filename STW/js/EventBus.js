// EventBus.js - Central event handling system (optimized)
export default class EventBus {
    constructor() {
        this.listeners = {};
    }

    // Subscribe to an event
    on(event, callback) {
        // Create array for this event if it doesn't exist
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        
        this.listeners[event].push(callback);
        
        // Return unsubscribe function for easy cleanup
        return () => {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        };
    }

    // Emit an event with optional data
    emit(event, data) {
        // Only process if we have listeners for this event
        const eventListeners = this.listeners[event];
        if (eventListeners) {
            // Create a copy of the listeners array before iterating
            // This prevents issues if a listener modifies the array
            const listeners = [...eventListeners];
            
            // Call each listener with the data
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for "${event}":`, error);
                }
            });
        }
    }

    // Remove all listeners for an event
    off(event) {
        if (this.listeners[event]) {
            delete this.listeners[event];
        }
    }

    // Clear all event listeners
    clear() {
        this.listeners = {};
    }
    
    // Get count of listeners for an event (useful for debugging)
    listenerCount(event) {
        return this.listeners[event]?.length || 0;
    }
    
    // Check if event has any listeners
    hasListeners(event) {
        return !!this.listeners[event]?.length;
    }
    
    // List all events that have listeners
    listEvents() {
        return Object.keys(this.listeners).filter(event => 
            this.listeners[event].length > 0
        );
    }
}