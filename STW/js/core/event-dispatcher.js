/**
 * Event Dispatcher - A debugging layer on top of EventBus
 * 
 * This module provides a way to monitor and debug events in the 
 * application by intercepting all EventBus communications.
 */
import { EventBus } from '..core/eventbus.js';

export const EventDispatcher = (() => {
    // Store original EventBus methods
    const originalEmit = EventBus.emit;
    const originalOn = EventBus.on;
    
    // Enable/disable verbose logging
    let verboseLogging = false;
    
    // Store event counts for statistics
    const eventStats = {
        emitted: {},
        handled: {}
    };
    
    // Store recent events for debugging
    const recentEvents = [];
    const MAX_RECENT_EVENTS = 100;
    
    /**
     * Initialize the event dispatcher
     */
    function initialize() {
        // Override EventBus methods with our own
        EventBus.emit = enhancedEmit;
        EventBus.on = enhancedOn;
        
        // Listen for debug commands
        EventBus.subscribe('DEBUG_TOGGLE_VERBOSE', ({ enabled }) => {
            verboseLogging = enabled;
            console.log(`[EventDispatcher] Verbose logging ${enabled ? 'enabled' : 'disabled'}`);
        });
        
        return true;
    }
    
    /**
     * Enhanced emit function with logging
     * @param {String} channel - Event channel
     * @param {*} data - Event data
     */
    function enhancedEmit(channel, data) {
        // Log event
        logEvent('emit', channel, data);
        
        // Update stats
        eventStats.emitted[channel] = (eventStats.emitted[channel] || 0) + 1;
        
        // Add to recent events
        addRecentEvent({
            type: 'emit',
            channel,
            data,
            timestamp: Date.now()
        });
        
        // Call original method
        return originalEmit.call(EventBus, channel, data);
    }
    
    /**
     * Enhanced on function with logging
     * @param {String} channel - Event channel
     * @param {Function} callback - Event handler
     */
    function enhancedOn(channel, callback) {
        // Create a wrapped callback that logs the event
        const wrappedCallback = (data) => {
            // Log handler execution
            logEvent('handle', channel, data);
            
            // Update stats
            eventStats.handled[channel] = (eventStats.handled[channel] || 0) + 1;
            
            // Call original callback
            return callback(data);
        };
        
        // Call original method with wrapped callback
        return originalOn.call(EventBus, channel, wrappedCallback);
    }
    
    /**
     * Log an event to console if verbose logging is enabled
     * @param {String} action - Action type ('emit' or 'handle')
     * @param {String} channel - Event channel
     * @param {*} data - Event data
     */
    function logEvent(action, channel, data) {
        if (!verboseLogging) return;
        
        const actionIcon = action === 'emit' ? '📣' : '👂';
        
        console.log(
            `${actionIcon} [${action.toUpperCase()}] ${channel}`, 
            data ? data : '[no data]'
        );
    }
    
    /**
     * Add event to recent events list
     * @param {Object} event - Event object
     */
    function addRecentEvent(event) {
        recentEvents.push(event);
        
        // Trim if exceeded max size
        if (recentEvents.length > MAX_RECENT_EVENTS) {
            recentEvents.shift();
        }
    }
    
    /**
     * Get event statistics
     * @returns {Object} Event statistics
     */
    function getStats() {
        return {
            emitted: { ...eventStats.emitted },
            handled: { ...eventStats.handled },
            channels: getChannels(),
            topEmitted: getTopEvents('emitted', 10),
            topHandled: getTopEvents('handled', 10)
        };
    }
    
    /**
     * Get list of all event channels
     * @returns {Array} List of channel names
     */
    function getChannels() {
        const channels = new Set([
            ...Object.keys(eventStats.emitted),
            ...Object.keys(eventStats.handled)
        ]);
        
        return Array.from(channels).sort();
    }
    
    /**
     * Get top events by count
     * @param {String} type - Type of events ('emitted' or 'handled')
     * @param {Number} limit - Maximum number of events to return
     * @returns {Array} Top events
     */
    function getTopEvents(type, limit) {
        const stats = eventStats[type];
        
        return Object.entries(stats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([channel, count]) => ({ channel, count }));
    }
    
    /**
     * Get recent events
     * @param {Number} limit - Maximum number of events to return
     * @returns {Array} Recent events
     */
    function getRecentEvents(limit = 20) {
        return recentEvents.slice(-limit).reverse();
    }
    
    /**
     * Enable verbose logging
     */
    function enableVerboseLogging() {
        verboseLogging = true;
        console.log('[EventDispatcher] Verbose logging enabled');
    }
    
    /**
     * Disable verbose logging
     */
    function disableVerboseLogging() {
        verboseLogging = false;
        console.log('[EventDispatcher] Verbose logging disabled');
    }
    
    /**
     * Reset statistics
     */
    function resetStats() {
        eventStats.emitted = {};
        eventStats.handled = {};
        recentEvents.length = 0;
        console.log('[EventDispatcher] Statistics reset');
    }
    
    /**
     * Monitor a specific event channel
     * @param {String} channel - Channel to monitor
     */
    function monitorChannel(channel) {
        EventBus.on(channel, (data) => {
            console.log(`🔍 [MONITOR] ${channel}`, data ? data : '[no data]');
        });
        
        console.log(`[EventDispatcher] Now monitoring channel: ${channel}`);
    }
    
    // Return public API
    return {
        initialize,
        getStats,
        getRecentEvents,
        enableVerboseLogging,
        disableVerboseLogging,
        resetStats,
        monitorChannel
    };
})();

export default EventDispatcher;