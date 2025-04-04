// Standardized EventBus implementation that supports both patterns
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
     * @returns {Symbol} Subscription token for unsubscribing
     */
    function subscribe(channel, callback) {
      if (!channels.has(channel)) channels.set(channel, []);
      const token = Symbol();
      channels.get(channel).push({ token, callback });
      return token;
    }
    
    /**
     * Unsubscribe from an event channel
     * @param {String} channel - Event channel name
     * @param {Symbol} token - Subscription token
     */
    function unsubscribe(channel, token) {
      const subscribers = channels.get(channel) || [];
      channels.set(channel, subscribers.filter(sub => sub.token !== token));
    }
    
    /**
     * Publish an event to a channel
     * @param {String} channel - Event channel name
     * @param {*} data - Event data
     */
    function publish(channel, data) {
      // Log the event
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
    }
    
    /**
     * Subscribe to an event (alias for subscribe)
     * @param {String} channel - Event channel name
     * @param {Function} callback - Callback function
     * @returns {Symbol} Subscription token
     */
    function on(channel, callback) {
      return subscribe(channel, callback);
    }
    
    /**
     * Emit an event (alias for publish)
     * @param {String} channel - Event channel name
     * @param {*} data - Event data
     */
    function emit(channel, data) {
      publish(channel, data);
    }
    
    /**
     * Log an event for debugging
     * @param {String} channel - Event channel name
     * @param {*} data - Event data
     */
    function logEvent(channel, data) {
      eventLog.push({
        timestamp: Date.now(),
        channel,
        data: JSON.stringify(data).substring(0, 200) // Limit data size
      });
      
      // Limit log size
      if (eventLog.length > MAX_LOG_SIZE) {
        eventLog = eventLog.slice(-MAX_LOG_SIZE);
      }
    }
    
    /**
     * Get event debug information
     * @returns {Object} Debug information
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
     * Clear all event subscriptions
     */
    function clear() {
      channels.clear();
      eventLog = [];
    }
    
    // Public API
    return {
      subscribe,
      unsubscribe,
      publish,
      on,         // Alias for subscribe
      emit,       // Alias for publish
      debug,
      clear
    };
  })();
  
  export default EventBus;