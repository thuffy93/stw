// ui/components/Component.js

/**
 * Base Component class for UI elements
 * Provides core functionality for rendering, event handling, and component composition
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
      this.eventSubscriptions = [];
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
      // This assumes EventBus is imported in the file using this component
      // Alternatively, EventBus could be passed to the constructor
      if (typeof EventBus !== 'undefined') {
        const token = EventBus.subscribe(eventName, handler.bind(this));
        this.eventSubscriptions.push({ eventName, token });
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
     * Find a child component by ID
     * @param {String} id - ID of the child component
     * @returns {Component|null} The found component or null
     */
    findChild(id) {
      for (const child of this.children) {
        if (child.id === id) {
          return child;
        }
        
        // Recursively search in child's children
        const found = child.findChild(id);
        if (found) {
          return found;
        }
      }
      
      return null;
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
      
      // Remove event subscriptions
      if (typeof EventBus !== 'undefined') {
        this.eventSubscriptions.forEach(({ eventName, token }) => {
          EventBus.unsubscribe(eventName, token);
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
      this.eventSubscriptions = [];
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