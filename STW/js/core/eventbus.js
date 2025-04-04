export const EventBus = (() => {
    const listeners = new Map();
    const wildcardListeners = [];

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     * @returns {Function} Unsubscribe function
     */
    function on(event, callback) {
        if (event === '*') {
            wildcardListeners.push(callback);
            return () => {
                const index = wildcardListeners.indexOf(callback);
                if (index !== -1) wildcardListeners.splice(index, 1);
            };
        }

        if (!listeners.has(event)) {
            listeners.set(event, new Set());
        }
        
        listeners.get(event).add(callback);
        
        return () => {
            listeners.get(event).delete(callback);
        };
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} [data] - Event data
     */
    function emit(event, data) {
        // Handle specific event listeners
        const eventListeners = listeners.get(event) || new Set();
        eventListeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        });

        // Handle wildcard listeners
        wildcardListeners.forEach(listener => {
            try {
                listener({ event, data });
            } catch (error) {
                console.error('Error in wildcard listener:', error);
            }
        });
    }

    /**
     * Remove all listeners for a specific event or all events
     * @param {string} [event] - Optional event name
     */
    function clear(event) {
        if (event) {
            listeners.delete(event);
        } else {
            listeners.clear();
            wildcardListeners.length = 0;
        }
    }

    return {
        on,
        emit,
        clear
    };
})();

export default EventBus;