// core/events.js - Enhanced version based on the scrapped code
export const EventBus = {
    // Emit custom events with data
    emit(event, detail = {}) {
      console.log(`Event emitted: ${event}`, detail);
      document.dispatchEvent(new CustomEvent(event, { detail }));
    },
  
    // Subscribe to events
    on(event, callback) {
      document.addEventListener(event, (e) => callback(e.detail));
      return () => this.off(event, callback); // Return unsubscribe function
    },
  
    // Unsubscribe
    off(event, callback) {
      document.removeEventListener(event, callback);
    }
};