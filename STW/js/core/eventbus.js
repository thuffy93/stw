/**
 * Simplified EventBus implementation with a more focused API
 * Provides a central event system for communication between modules
 */
export const EventBus = (() => {
    // Store subscribers by channel
    const channels = new Map();
    
    // For debugging purposes
    let eventLog = [];
    const MAX_LOG_SIZE = 100;
    
    /**
     * Subscribe to an event channel
     * @param {String} channel - Event channel name
     * @param {Function} callback - Callback function
     * @returns {Object} Subscription object with unsubscribe method
     */
    function on(channel, callback) {
      if (!channels.has(channel)) {
        channels.set(channel, []);
      }
      
      const id = generateId();
      channels.get(channel).push({ id, callback });
      
      // Return subscription object with unsubscribe method
      return {
        unsubscribe: () => off(channel, id),
        id
      };
    }
    
    /**
     * Unsubscribe from an event channel
     * @param {String} channel - Event channel name
     * @param {String} id - Subscription ID
     * @returns {Boolean} Whether unsubscribe was successful
     */
    function off(channel, id) {
      if (!channels.has(channel)) return false;
      
      const subs = channels.get(channel);
      const initialLength = subs.length;
      
      channels.set(channel, subs.filter(sub => sub.id !== id));
      
      return initialLength !== channels.get(channel).length;
    }
    
    /**
     * Emit an event to a channel
     * @param {String} channel - Event channel name
     * @param {*} data - Event data
     */
    function emit(channel, data) {
      // Log the event for debugging
      logEvent(channel, data);
      
      // Call subscribers
      const subscribers = channels.get(channel) || [];
      subscribers.forEach(({ callback }) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`EventBus error in ${channel}:`, error);
        }
      });
      
      // Also notify wildcard subscribers
      const wildcardSubs = channels.get('*') || [];
      wildcardSubs.forEach(({ callback }) => {
        try {
          callback({ channel, data });
        } catch (error) {
          console.error(`EventBus wildcard error for ${channel}:`, error);
        }
      });
    }
    
    /**
     * Clear all subscriptions for a channel or all channels
     * @param {String} channel - Channel to clear (omit to clear all)
     */
    function clear(channel) {
      if (channel) {
        channels.delete(channel);
      } else {
        channels.clear();
        eventLog = [];
      }
    }
    
    /**
     * Get debugging information about current event state
     * @returns {Object} Debug information including channels and recent events
     */
    function debug() {
      return {
        channels: Array.from(channels.entries()).map(([channel, subs]) => ({
          channel,
          subscribers: subs.length
        })),
        recentEvents: eventLog.slice(-10)
      };
    }
    
    /**
     * Log an event for debugging purposes
     * @param {String} channel - Event channel
     * @param {*} data - Event data
     */
    function logEvent(channel, data) {
      try {
        const safeData = typeof data === 'object' 
          ? JSON.stringify(data).substring(0, 200) 
          : String(data);
          
        eventLog.push({
          timestamp: Date.now(),
          channel,
          data: safeData
        });
        
        // Limit log size
        if (eventLog.length > MAX_LOG_SIZE) {
          eventLog = eventLog.slice(-MAX_LOG_SIZE);
        }
      } catch (error) {
        console.warn("Error logging event:", error);
      }
    }
    
    /**
     * Generate a unique ID for subscriptions
     * @returns {String} Unique ID
     */
    function generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }
    
    // Public API
    return {
      on,       // Subscribe to events
      off,      // Unsubscribe from events
      emit,     // Emit events
      clear,    // Clear subscriptions
      debug     // Get debug information
    };
  })();
  
  export default EventBus;