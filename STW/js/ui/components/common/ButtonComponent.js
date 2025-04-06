// STW/js/ui/components/common/ButtonComponent.js
import { Component } from '../Component.js';
import { EventBus } from '../../../core/eventbus.js';

/**
 * Reusable button component with standardized event handling
 */
export class ButtonComponent extends Component {
  /**
   * Create a new button component
   * @param {String} id - Button ID
   * @param {String} text - Button text
   * @param {Object} options - Button options
   * @param {String} options.className - Additional CSS classes
   * @param {Boolean} options.disabled - Whether button is initially disabled
   * @param {String} options.type - Button type (default 'button')
   * @param {String} options.tooltip - Button tooltip text
   * @param {Function} options.onClick - Click handler function
   * @param {String} options.eventName - Event to emit on click (if no onClick provided)
   * @param {Object} options.eventData - Data to include with event
   */
  constructor(id, text, options = {}) {
    // Set default options
    const {
      className = '',
      disabled = false,
      type = 'button',
      tooltip = '',
      onClick = null,
      eventName = null,
      eventData = {}
    } = options;
    
    // Create button template
    const template = `
      <button id="${id}" 
              class="btn ${className}" 
              type="${type}"
              ${disabled ? 'disabled' : ''}
              ${tooltip ? `data-tooltip="${tooltip}"` : ''}>
        ${text}
      </button>
    `;
    
    // Initialize component
    super(id, template);
    
    // Store properties
    this.text = text;
    this.disabled = disabled;
    this.tooltip = tooltip;
    this.clickHandler = onClick;
    this.eventName = eventName;
    this.eventData = eventData;
    
    // Add click event handler
    this.addEventListener('.', 'click', this.handleClick);
  }
  
  /**
   * Handle button click with standardized event emission
   * @param {Event} event - Click event
   */
  handleClick(event) {
    // Prevent default action for type="submit" buttons
    event.preventDefault();
    
    // Skip if disabled
    if (this.disabled) return;
    
    // Play sound effect with consistent event format
    EventBus.emit('PLAY_SOUND', { sound: 'BUTTON_CLICK' });
    
    // Call custom handler if provided
    if (typeof this.clickHandler === 'function') {
      this.clickHandler(event);
    }
    
    // Emit event if specified
    if (this.eventName) {
      // Always use the consistent object pattern for event data
      if (typeof this.eventData === 'object' && this.eventData !== null) {
        EventBus.emit(this.eventName, this.eventData);
      } else {
        // Handle primitive event data by wrapping it in an object
        EventBus.emit(this.eventName, { value: this.eventData });
      }
    }
  }
  
  /**
   * Enable the button
   */
  enable() {
    this.disabled = false;
    if (this.element) {
      this.element.disabled = false;
    }
  }
  
  /**
   * Disable the button
   */
  disable() {
    this.disabled = true;
    if (this.element) {
      this.element.disabled = true;
    }
  }
  
  /**
   * Set button text
   * @param {String} text - New button text
   */
  setText(text) {
    this.text = text;
    if (this.element) {
      this.element.textContent = text;
    }
  }
  
  /**
   * Set tooltip text
   * @param {String} tooltip - New tooltip text
   */
  setTooltip(tooltip) {
    this.tooltip = tooltip;
    if (this.element) {
      if (tooltip) {
        this.element.setAttribute('data-tooltip', tooltip);
      } else {
        this.element.removeAttribute('data-tooltip');
      }
    }
  }
  
  /**
   * Set event data for emission
   * @param {Object} eventData - New event data
   */
  setEventData(eventData) {
    this.eventData = eventData;
  }
  
  /**
   * Set event name for emission
   * @param {String} eventName - New event name
   */
  setEventName(eventName) {
    this.eventName = eventName;
  }
  
  /**
   * Update button with new data using consistent pattern
   * @param {Object} data - Button update data
   */
  update(data) {
    // Update text if provided
    if (data.text !== undefined) {
      this.setText(data.text);
    }
    
    // Update disabled state if provided
    if (data.disabled !== undefined) {
      if (data.disabled) {
        this.disable();
      } else {
        this.enable();
      }
    }
    
    // Update tooltip if provided
    if (data.tooltip !== undefined) {
      this.setTooltip(data.tooltip);
    }
    
    // Update event data if provided
    if (data.eventData !== undefined) {
      this.setEventData(data.eventData);
    }
    
    // Update event name if provided
    if (data.eventName !== undefined) {
      this.setEventName(data.eventName);
    }
    
    // Update class name if provided
    if (data.className !== undefined && this.element) {
      // Remove existing btn class
      this.element.className = 'btn';
      // Add new classes
      data.className.split(' ').forEach(cls => {
        if (cls) this.element.classList.add(cls);
      });
    }
  }
}