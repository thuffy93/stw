// EventBus.js - Central event handling system
export default class EventBus {
    constructor() {
        this.listeners = {};
    }

    // Subscribe to an event
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        
        // Return unsubscribe function
        return () => {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        };
    }

    // Emit an event with optional data
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                callback(data);
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
}