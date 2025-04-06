/**
 * Enhanced EventBus implementation with ES6 standards and additional features
 * Maintains backward compatibility with the existing API
 */
export class EventBusSystem {
  constructor() {
    // Store subscribers by channel
    this.channels = new Map();
    
    // For debugging purposes
    this.eventLog = [];
    this.MAX_LOG_SIZE = 100;
    
    // For event batching
    this.batchedEvents = new Map();
    this.batchTimeouts = new Map();
    
    // For delayed event emission
    this.delayedEventTimeouts = new Map();
    
    // For logging control
    this.loggingEnabled = false;
    
    // Keep track of event frequency
    this.eventFrequency = new Map();
    this.lastReportTime = Date.now();
    this.reportInterval = 60000; // 1 minute
  }
  
  /**
   * Enable or disable event logging
   * @param {Boolean} enabled - Whether to enable logging
   */
  setLoggingEnabled(enabled) {
    this.loggingEnabled = enabled;
  }
  
  /**
   * Subscribe to an event channel
   * @param {String} channel - Event channel name
   * @param {Function} callback - Callback function
   * @returns {Object} Subscription object with unsubscribe method
   */
  on(channel, callback) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, []);
    }
    
    const id = this._generateId();
    this.channels.get(channel).push({ id, callback });
    
    // Return subscription object with unsubscribe method
    return {
      unsubscribe: () => this.off(channel, id),
      id
    };
  }
  
  /**
   * Subscribe to an event channel, automatically unsubscribing after first trigger
   * @param {String} channel - Event channel name
   * @param {Function} callback - Callback function
   * @returns {Object} Subscription object with unsubscribe method
   */
  once(channel, callback) {
    const subscription = this.on(channel, data => {
      // Run the callback
      callback(data);
      
      // Then unsubscribe
      subscription.unsubscribe();
    });
    
    return subscription;
  }
  
  /**
   * Unsubscribe from an event channel
   * @param {String} channel - Event channel name
   * @param {String} id - Subscription ID
   * @returns {Boolean} Whether unsubscribe was successful
   */
  off(channel, id) {
    if (!this.channels.has(channel)) return false;
    
    const subs = this.channels.get(channel);
    const initialLength = subs.length;
    
    this.channels.set(channel, subs.filter(sub => sub.id !== id));
    
    return initialLength !== this.channels.get(channel).length;
  }
  
  /**
   * Emit an event to a channel
   * @param {String} channel - Event channel name
   * @param {*} data - Event data
   */
  emit(channel, data) {
    // Track event frequency
    this._trackEventFrequency(channel);
    
    // Log the event for debugging if enabled
    if (this.loggingEnabled) {
      this._logEvent(channel, data);
    }
    
    // Add standardized timestamp if not present
    const eventData = data && typeof data === 'object' 
      ? { ...data, _timestamp: data.timestamp || Date.now() }
      : data;
    
    // Call subscribers
    const subscribers = this.channels.get(channel) || [];
    subscribers.forEach(({ callback }) => {
      try {
        callback(eventData);
      } catch (error) {
        console.error(`EventBus error in ${channel}:`, error);
      }
    });
    
    // Also notify wildcard subscribers
    const wildcardSubs = this.channels.get('*') || [];
    wildcardSubs.forEach(({ callback }) => {
      try {
        callback({ channel, data: eventData });
      } catch (error) {
        console.error(`EventBus wildcard error for ${channel}:`, error);
      }
    });
  }
  
  /**
   * Emit an event after a delay
   * @param {String} channel - Event channel name
   * @param {*} data - Event data
   * @param {Number} delay - Delay in milliseconds
   * @returns {String} Timeout ID for potential cancellation
   */
  emitDelayed(channel, data, delay) {
    const timeoutId = this._generateId();
    
    const timeout = setTimeout(() => {
      this.emit(channel, data);
      this.delayedEventTimeouts.delete(timeoutId);
    }, delay);
    
    this.delayedEventTimeouts.set(timeoutId, timeout);
    
    return timeoutId;
  }
  
  /**
   * Cancel a delayed event
   * @param {String} timeoutId - Timeout ID from emitDelayed
   * @returns {Boolean} Whether cancellation was successful
   */
  cancelDelayedEvent(timeoutId) {
    if (this.delayedEventTimeouts.has(timeoutId)) {
      clearTimeout(this.delayedEventTimeouts.get(timeoutId));
      this.delayedEventTimeouts.delete(timeoutId);
      return true;
    }
    return false;
  }
  
  /**
   * Add an event to a batch that will be emitted together
   * @param {String} batchId - Batch identifier
   * @param {String} channel - Event channel
   * @param {*} data - Event data
   * @param {Number} delay - Delay before emitting batch (ms)
   */
  addToBatch(batchId, channel, data, delay = 100) {
    // Initialize batch if it doesn't exist
    if (!this.batchedEvents.has(batchId)) {
      this.batchedEvents.set(batchId, []);
    }
    
    // Add event to batch
    this.batchedEvents.get(batchId).push({ channel, data });
    
    // Clear existing timeout if any
    if (this.batchTimeouts.has(batchId)) {
      clearTimeout(this.batchTimeouts.get(batchId));
    }
    
    // Set timeout to emit batch
    const timeout = setTimeout(() => this._emitBatch(batchId), delay);
    this.batchTimeouts.set(batchId, timeout);
  }
  
  /**
   * Emit a batch immediately
   * @param {String} batchId - Batch identifier
   */
  emitBatchNow(batchId) {
    // Clear any pending timeout
    if (this.batchTimeouts.has(batchId)) {
      clearTimeout(this.batchTimeouts.get(batchId));
      this.batchTimeouts.delete(batchId);
    }
    
    // Emit the batch
    this._emitBatch(batchId);
  }
  
  /**
   * Internal method to emit a batch of events
   * @private
   * @param {String} batchId - Batch identifier
   */
  _emitBatch(batchId) {
    if (!this.batchedEvents.has(batchId)) return;
    
    const events = this.batchedEvents.get(batchId);
    
    // Emit batch start event
    this.emit('BATCH_START', { 
      batchId, 
      eventCount: events.length 
    });
    
    // Emit all events in the batch
    events.forEach(({ channel, data }) => {
      this.emit(channel, data);
    });
    
    // Emit batch end event
    this.emit('BATCH_END', { 
      batchId, 
      eventCount: events.length 
    });
    
    // Clean up
    this.batchedEvents.delete(batchId);
    this.batchTimeouts.delete(batchId);
  }
  
  /**
   * Clear all subscriptions for a channel or all channels
   * @param {String} channel - Channel to clear (omit to clear all)
   */
  clear(channel) {
    if (channel) {
      this.channels.delete(channel);
    } else {
      this.channels.clear();
      this.eventLog = [];
      this.batchedEvents.clear();
      
      // Clear any pending timeouts
      for (const timeout of this.batchTimeouts.values()) {
        clearTimeout(timeout);
      }
      this.batchTimeouts.clear();
      
      for (const timeout of this.delayedEventTimeouts.values()) {
        clearTimeout(timeout);
      }
      this.delayedEventTimeouts.clear();
    }
  }
  
  /**
   * Get debugging information about current event state
   * @returns {Object} Debug information including channels and recent events
   */
  debug() {
    return {
      channels: Array.from(this.channels.entries()).map(([channel, subs]) => ({
        channel,
        subscribers: subs.length
      })),
      recentEvents: this.eventLog.slice(-10),
      batchedEvents: Array.from(this.batchedEvents.entries()).map(([batchId, events]) => ({
        batchId,
        eventCount: events.length
      })),
      pendingDelayedEvents: this.delayedEventTimeouts.size,
      eventFrequency: Array.from(this.eventFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    };
  }
  
  /**
   * Log an event for debugging purposes
   * @private
   * @param {String} channel - Event channel
   * @param {*} data - Event data
   */
  _logEvent(channel, data) {
    try {
      let safeData;
      
      if (typeof data === 'object' && data !== null) {
        // Try to make a safe copy for logging
        try {
          safeData = JSON.stringify(data).substring(0, 200);
          if (safeData.length >= 199) {
            safeData += '...';
          }
        } catch (e) {
          safeData = '[Object - could not stringify]';
        }
      } else {
        safeData = String(data);
      }
      
      this.eventLog.push({
        timestamp: Date.now(),
        channel,
        data: safeData
      });
      
      // Limit log size
      if (this.eventLog.length > this.MAX_LOG_SIZE) {
        this.eventLog = this.eventLog.slice(-this.MAX_LOG_SIZE);
      }
    } catch (error) {
      console.warn("Error logging event:", error);
    }
  }
  
  /**
   * Track event frequency for diagnostics
   * @private
   * @param {String} channel - Event channel
   */
  _trackEventFrequency(channel) {
    // Increment frequency counter
    const currentCount = this.eventFrequency.get(channel) || 0;
    this.eventFrequency.set(channel, currentCount + 1);
    
    // Periodically report high-frequency events
    const now = Date.now();
    if (now - this.lastReportTime > this.reportInterval) {
      const highFrequencyEvents = Array.from(this.eventFrequency.entries())
        .filter(([_, count]) => count > 100)
        .sort((a, b) => b[1] - a[1]);
      
      if (highFrequencyEvents.length > 0 && this.loggingEnabled) {
        console.log('High frequency events:', highFrequencyEvents);
      }
      
      // Reset counters
      this.eventFrequency.clear();
      this.lastReportTime = now;
    }
  }
  
  /**
   * Generate a unique ID for subscriptions
   * @private
   * @returns {String} Unique ID
   */
  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
}

// Create a singleton instance
const EventBusInstance = new EventBusSystem();

// For backwards compatibility with existing codebase
export const EventBus = {
  on: EventBusInstance.on.bind(EventBusInstance),
  off: EventBusInstance.off.bind(EventBusInstance),
  emit: EventBusInstance.emit.bind(EventBusInstance),
  clear: EventBusInstance.clear.bind(EventBusInstance),
  debug: EventBusInstance.debug.bind(EventBusInstance),
  
  // Add new methods to the public API
  once: EventBusInstance.once.bind(EventBusInstance),
  emitDelayed: EventBusInstance.emitDelayed.bind(EventBusInstance),
  cancelDelayedEvent: EventBusInstance.cancelDelayedEvent.bind(EventBusInstance),
  addToBatch: EventBusInstance.addToBatch.bind(EventBusInstance),
  emitBatchNow: EventBusInstance.emitBatchNow.bind(EventBusInstance),
  setLoggingEnabled: EventBusInstance.setLoggingEnabled.bind(EventBusInstance)
};

// Export the default EventBus for compatibility
export default EventBus;