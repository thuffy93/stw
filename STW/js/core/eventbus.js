// Proposed unified event-bus.js
export const EventBus = (() => {
    const channels = new Map();
    const eventLog = [];
    const MAX_LOG_SIZE = 100;

    function subscribe(channel, callback) {
        // Existing subscribe logic
    }

    function publish(channel, data) {
        // Add verbose logging from event-dispatcher
        logEvent(channel, data);
        
        const subscribers = channels.get(channel) || [];
        subscribers.forEach(({ callback }) => {
            try {
                callback(data);
            } catch (error) {
                console.error(`EventBus error in ${channel}:`, error);
            }
        });
    }

    function logEvent(channel, data) {
        // Implement detailed logging
        eventLog.push({
            timestamp: Date.now(),
            channel,
            data: JSON.stringify(data).substring(0, 200)
        });

        if (eventLog.length > MAX_LOG_SIZE) {
            eventLog.shift();
        }
    }

    // Add debugging methods from event-dispatcher
    function getStats() {
        return {
            channels: Array.from(channels.entries()).map(([channel, subs]) => ({
                channel,
                subscribers: subs.length
            })),
            recentEvents: eventLog.slice(-10)
        };
    }

    return {
        subscribe,
        publish,
        on: subscribe,
        emit: publish,
        debug: getStats
    };
})();