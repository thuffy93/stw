// eventbus.js
export const EventBus = (() => {
    const channels = new Map();
    
    return {
        subscribe(channel, callback) {
            if (!channels.has(channel)) channels.set(channel, []);
            const token = Symbol();
            channels.get(channel).push({ token, callback });
            return token;
        },
        
        unsubscribe(channel, token) {
            const subscribers = channels.get(channel) || [];
            channels.set(channel, subscribers.filter(sub => sub.token !== token));
        },
        
        publish(channel, data) {
            const subscribers = channels.get(channel) || [];
            subscribers.forEach(({ callback }) => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`EventBus error in ${channel}:`, error);
                }
            });
        },
        
        // Alias for publish for compatibility
        emit(channel, data) {
            this.publish(channel, data);
        },
        
        on(channel, callback) {
            return this.subscribe(channel, callback);
        },
        
        debug() {
            return Array.from(channels.entries()).map(([channel, subs]) => ({
                channel,
                subscribers: subs.length
            }));
        }
    };
  })();
  
  export default EventBus;