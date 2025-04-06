// STW/js/ui/components/common/MessageComponent.js
import { Component } from '../Component.js';
import { EventBus } from '../../../core/eventbus.js';
import { Utils } from '../../../core/utils.js';

/**
 * Message component for displaying temporary notifications
 * Follows standardized ES6 event patterns
 */
export class MessageComponent extends Component {
  /**
   * Create a new message component
   * @param {Object} options - Component options
   * @param {String} options.id - Component ID (defaults to 'message')
   * @param {Number} options.defaultDuration - Default message duration in milliseconds
   */
  constructor(options = {}) {
    const {
      id = 'message',
      defaultDuration = 2000
    } = options;
    
    // Create component with appropriate template
    super(id, `
      <div id="${id}" class="message">
        <div class="message-content"></div>
      </div>
    `);
    
    // Store properties
    this.defaultDuration = defaultDuration;
    this.currentTimeoutId = null;
    
    // Subscribe to message events with standardized pattern
    this.subscribeToEvent('UI_MESSAGE', this.showMessage.bind(this));
    this.subscribeToEvent('UI_MESSAGE_HIDE', this.hideMessage.bind(this));
  }
  
  /**
   * Show a message with animation and optional auto-hide
   * @param {Object} data - Message data
   * @param {String} data.message - Message text
   * @param {String} data.type - Message type ('success', 'error', 'info', 'warning')
   * @param {Number} data.duration - Display duration in ms (0 for no auto-hide)
   */
  showMessage(data) {
    // Extract data with defaults
    const { 
      message, 
      type = 'success', 
      duration = this.defaultDuration 
    } = data;
    
    // Skip if no message
    if (!message) return;
    
    // Get the message content element
    const contentElement = this.element.querySelector('.message-content');
    if (!contentElement) return;
    
    // Clear any existing timeout
    if (this.currentTimeoutId) {
      clearTimeout(this.currentTimeoutId);
      this.currentTimeoutId = null;
    }
    
    // Set message content
    contentElement.textContent = message;
    
    // Update class for styling
    this.element.className = 'message';
    this.element.classList.add(type);
    this.element.classList.add('visible');
    
    // Set auto-hide timeout if duration is provided
    if (duration > 0) {
      this.currentTimeoutId = setTimeout(() => {
        this.hideMessage();
      }, duration);
    }
    
    // Emit message shown event with consistent format
    EventBus.emit('UI_MESSAGE_SHOWN', {
      message,
      type,
      duration,
      timestamp: Date.now()
    });
  }
  
  /**
   * Hide the message with animation
   */
  hideMessage() {
    // Clear any existing timeout
    if (this.currentTimeoutId) {
      clearTimeout(this.currentTimeoutId);
      this.currentTimeoutId = null;
    }
    
    // Hide the message
    this.element.classList.remove('visible');
    
    // Emit message hidden event with consistent format
    EventBus.emit('UI_MESSAGE_HIDDEN', {
      timestamp: Date.now()
    });
  }
  
  /**
   * Create and show a success message
   * @static
   * @param {String} message - Message text
   * @param {Number} duration - Duration in ms
   */
  static success(message, duration) {
    EventBus.emit('UI_MESSAGE', {
      message,
      type: 'success',
      duration
    });
  }
  
  /**
   * Create and show an error message
   * @static
   * @param {String} message - Message text
   * @param {Number} duration - Duration in ms
   */
  static error(message, duration) {
    EventBus.emit('UI_MESSAGE', {
      message,
      type: 'error',
      duration
    });
  }
  
  /**
   * Create and show an info message
   * @static
   * @param {String} message - Message text
   * @param {Number} duration - Duration in ms
   */
  static info(message, duration) {
    EventBus.emit('UI_MESSAGE', {
      message,
      type: 'info',
      duration
    });
  }
  
  /**
   * Create and show a warning message
   * @static
   * @param {String} message - Message text
   * @param {Number} duration - Duration in ms
   */
  static warning(message, duration) {
    EventBus.emit('UI_MESSAGE', {
      message,
      type: 'warning',
      duration
    });
  }
}

export default MessageComponent;