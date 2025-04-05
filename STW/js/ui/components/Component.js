// ui/components/Component.js - Simplified Component base class

/**
 * Base Component class for UI elements
 * Provides core functionality for rendering and event handling
 */
export class Component {
  /**
   * Create a new component
   * @param {String} id - Unique ID for the component
   * @param {String} template - HTML template string
   */
  constructor(id, template) {
    this.id = id;
    this.template = template;
    this.element = null;
    this.children = [];
    this.eventHandlers = [];
  }
  
  /**
   * Render the component and its children
   * @returns {HTMLElement} The rendered DOM element
   */
  render() {
    // Create element from template
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = this.template.trim();
    this.element = tempContainer.firstElementChild;
    
    if (!this.element) {
      console.error(`Failed to render component ${this.id}. Check template:`, this.template);
      return document.createElement('div');
    }
    
    // Set ID if not already set in template
    if (!this.element.id) {
      this.element.id = this.id;
    }
    
    // Render children
    this.children.forEach(child => {
      const childElement = child.render();
      const container = this.element.querySelector(`#${child.id}-container`);
      
      if (container) {
        container.appendChild(childElement);
      } else {
        console.warn(`Container #${child.id}-container not found in parent component ${this.id}`);
        // Fallback to appending to this element
        this.element.appendChild(childElement);
      }
    });
    
    // Attach event handlers
    this.attachEventHandlers();
    
    return this.element;
  }
  
  /**
   * Attach event handlers to elements within this component
   */
  attachEventHandlers() {
    this.eventHandlers.forEach(({selector, event, handler}) => {
      const elements = selector === '.' ? 
        [this.element] : 
        this.element.querySelectorAll(selector);
      
      elements.forEach(el => {
        // Store reference to bound handler for potential removal
        const boundHandler = handler.bind(this);
        el.addEventListener(event, boundHandler);
        
        // Store information for cleanup
        this._storeEventBinding(el, event, boundHandler);
      });
    });
  }
  
  /**
   * Store information about event bindings for cleanup
   * @private
   */
  _storeEventBinding(element, event, handler) {
    if (!this._eventBindings) {
      this._eventBindings = [];
    }
    
    this._eventBindings.push({ element, event, handler });
  }
  
  /**
   * Add a child component
   * @param {Component} component - Child component to add
   * @returns {Component} This component for chaining
   */
  addChild(component) {
    this.children.push(component);
    return this;
  }
  
  /**
   * Add an event listener to elements within this component
   * @param {String} selector - CSS selector for target elements, or '.' for component root
   * @param {String} event - Event name (e.g., 'click')
   * @param {Function} handler - Event handler function
   * @returns {Component} This component for chaining
   */
  addEventListener(selector, event, handler) {
    this.eventHandlers.push({selector, event, handler});
    return this;
  }
  
  /**
   * Subscribe to an event on the EventBus
   * @param {String} eventName - Name of the event
   * @param {Function} handler - Event handler function
   * @returns {Component} This component for chaining
   */
  subscribeToEvent(eventName, handler) {
    // Must be imported in the component implementation
    if (typeof EventBus !== 'undefined') {
      EventBus.on(eventName, handler.bind(this));
    } else {
      console.warn('EventBus not available for subscription in component:', this.id);
    }
    
    return this;
  }
  
  /**
   * Update the component with new data
   * @param {Object} data - Data to update the component with
   * To be implemented by child classes
   */
  update(data) {
    // Default implementation does nothing
    // Child classes should override this
  }
  
  /**
   * Remove this component from the DOM
   */
  remove() {
    // Remove event handlers
    if (this._eventBindings) {
      this._eventBindings.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
    }
    
    // Remove children
    this.children.forEach(child => child.remove());
    
    // Remove from DOM
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    // Clean up references
    this.element = null;
    this.children = [];
    this._eventBindings = [];
  }
  
  /**
   * Hide the component (but keep in DOM)
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }
  
  /**
   * Show the component
   */
  show() {
    if (this.element) {
      this.element.style.display = '';
    }
  }
}