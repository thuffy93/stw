// Central event system for game actions
export const EventBus = {
    // Emit custom events with data
    emit(event, detail = {}) {
      document.dispatchEvent(new CustomEvent(event, { detail }));
    },
  
    // Subscribe to events
    on(event, callback) {
      document.addEventListener(event, (e) => callback(e.detail));
    },
  
    // Unsubscribe
    off(event, callback) {
      document.removeEventListener(event, callback);
    }
  };