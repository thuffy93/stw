// ui/components/Component.js - Enhanced base component class with ES6 standards
import { EventBus } from '../../core/eventbus.js';
import { Utils } from '../../core/utils.js';

/**
 * Enhanced base Component class for UI elements
 * Standardized with ES6 patterns and improved lifecycle management
 */
export class Component {
  /**
   * Create a new component
   * @param {String} id - Unique ID for the component
   * @param {String} template - HTML template string
   * @param {Object} options - Component options
   */
  constructor(id, template, options = {}) {
    this.id = id;
    this.template = template;
    this.element = null;
    this.children = [];
    this.eventHandlers = [];
    this._eventSubscriptions = [];
    this._mutationObserver = null;
    this._isDestroyed = false;
    this._isRendered = false;
    this._parentComponent = null;
    
    // Extract options with defaults
    this.options = {
      autoRender: options.autoRender || false,
      mountPoint: options.mountPoint || null,
      data: options.data || {},
      events: options.events || {},
      classes: options.classes || [],
      attributes: options.attributes || {}
    };
    
    // Setup event handlers from options
    if (this.options.events) {
      Object.entries(this.options.events).forEach(([eventDef, handler]) => {
        // Parse event definition (format: "eventName@selector")
        const [eventName, selector = '.'] = eventDef.split('@');
        this.addEventListener(selector, eventName, handler);
      });
    }
    
    // Auto-render if specified
    if (this.options.autoRender && this.options.mountPoint) {
      this.renderTo(this.options.mountPoint);
    }
    
    // Emit component created event with consistent pattern
    this._emit('COMPONENT_CREATED', {
      componentId: this.id,
      componentType: this.constructor.name
    });
  }
  
  /**
   * Helper method to emit events with standardized format
   * @private
   * @param {String} eventName - Event name
   * @param {Object} data - Event data
   */
  _emit(eventName, data = {}) {
    EventBus.emit(eventName, {
      ...data,
      componentId: this.id,
      componentType: this.constructor.name,
      timestamp: Date.now()
    });
  }
  
  /**
   * Render the component and its children
   * @returns {HTMLElement} The rendered DOM element
   */
  render() {
    // Skip if already destroyed
    if (this._isDestroyed) {
      console.warn(`Cannot render destroyed component: ${this.id}`);
      return document.createElement('div');
    }
    
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
    
    // Apply classes from options
    this.options.classes.forEach(className => {
      this.element.classList.add(className);
    });
    
    // Apply attributes from options
    Object.entries(this.options.attributes).forEach(([attr, value]) => {
      this.element.setAttribute(attr, value);
    });
    
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
      
      // Set parent reference
      child._parentComponent = this;
    });
    
    // Attach event handlers
    this.attachEventHandlers();
    
    // Mark as rendered
    this._isRendered = true;
    
    // Setup mutation observer to track DOM changes if needed
    this.setupMutationObserver();
    
    // Emit render event
    this._emit('COMPONENT_RENDERED');
    
    return this.element;
  }
  
  /**
   * Render this component to a specific container
   * @param {String|HTMLElement} container - Container selector or element
   * @returns {Component} This component for chaining
   */
  renderTo(container) {
    // Get container element
    const containerEl = typeof container === 'string' 
      ? document.querySelector(container)
      : container;
      
    if (!containerEl) {
      console.error(`Cannot render component ${this.id} to non-existent container:`, container);
      return this;
    }
    
    // Render component if not already rendered
    if (!this._isRendered || !this.element) {
      this.render();
    }
    
    // Append to container
    containerEl.appendChild(this.element);
    
    // Emit mount event
    this._emit('COMPONENT_MOUNTED', {
      container: containerEl
    });
    
    return this;
  }
  
  /**
   * Set up a mutation observer to watch for DOM changes
   * @private
   */
  setupMutationObserver() {
    // Skip if already set up or no element
    if (this._mutationObserver || !this.element) return;
    
    // Create mutation observer if the component needs it (defined by subclasses)
    if (this.options.observeDomChanges || this.handleDomMutation) {
      this._mutationObserver = new MutationObserver(mutations => {
        if (typeof this.handleDomMutation === 'function') {
          this.handleDomMutation(mutations);
        }
        
        // Emit event
        this._emit('COMPONENT_DOM_MUTATED', {
          mutations
        });
      });
      
      // Start observing
      this._mutationObserver.observe(this.element, {
        childList: true,
        attributes: true,
        subtree: true
      });
    }
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
    if (component instanceof Component) {
      this.children.push(component);
      
      // If already rendered, render the child now
      if (this._isRendered && this.element) {
        const childElement = component.render();
        const container = this.element.querySelector(`#${component.id}-container`);
        
        if (container) {
          container.appendChild(childElement);
        } else {
          // Fallback to appending to this element
          this.element.appendChild(childElement);
        }
        
        // Set parent reference
        component._parentComponent = this;
      }
    } else {
      console.warn(`Attempted to add non-Component child to ${this.id}:`, component);
    }
    
    return this;
  }
  
  /**
   * Remove a child component
   * @param {Component|String} component - Child component or ID to remove
   * @returns {Component} This component for chaining
   */
  removeChild(component) {
    const componentId = typeof component === 'string' ? component : component.id;
    const index = this.children.findIndex(child => child.id === componentId);
    
    if (index !== -1) {
      const child = this.children[index];
      
      // Remove from DOM and clean up
      child.remove();
      
      // Remove from children array
      this.children.splice(index, 1);
    }
    
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
    
    // If already rendered, attach handler now
    if (this._isRendered && this.element) {
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
    }
    
    return this;
  }
  
  /**
   * Subscribe to an event on the EventBus
   * @param {String} eventName - Name of the event
   * @param {Function} handler - Event handler function
   * @returns {Object} Subscription object with unsubscribe method
   */
  subscribeToEvent(eventName, handler) {
    // Bind the handler to this component instance
    const boundHandler = handler.bind(this);
    
    // Create subscription
    const subscription = EventBus.on(eventName, boundHandler);
    
    // Store the subscription for cleanup
    if (!this._eventSubscriptions) {
      this._eventSubscriptions = [];
    }
    this._eventSubscriptions.push(subscription);
    
    return subscription;
  }
  
  /**
   * Subscribe to an event, but only once
   * @param {String} eventName - Name of the event
   * @param {Function} handler - Event handler function
   * @returns {Object} Subscription object with unsubscribe method
   */
  subscribeToEventOnce(eventName, handler) {
    // Bind the handler to this component instance
    const boundHandler = handler.bind(this);
    
    // Create subscription
    const subscription = EventBus.once(eventName, boundHandler);
    
    // Store the subscription for cleanup
    if (!this._eventSubscriptions) {
      this._eventSubscriptions = [];
    }
    this._eventSubscriptions.push(subscription);
    
    return subscription;
  }
  
  /**
   * Find a descendant component by ID
   * @param {String} componentId - ID of the component to find
   * @returns {Component|null} Found component or null
   */
  findComponentById(componentId) {
    // Check direct children first
    for (const child of this.children) {
      if (child.id === componentId) {
        return child;
      }
      
      // Recursively check grandchildren
      const found = child.findComponentById(componentId);
      if (found) {
        return found;
      }
    }
    
    return null;
  }
  
  /**
   * Get the root component in the tree
   * @returns {Component} Root component
   */
  getRootComponent() {
    let current = this;
    
    while (current._parentComponent) {
      current = current._parentComponent;
    }
    
    return current;
  }
  
  /**
   * Update the component with new data
   * @param {Object} data - Data to update the component with
   * @returns {Component} This component for chaining
   */
  update(data) {
    // Merge data
    this.options.data = {
      ...this.options.data,
      ...data
    };
    
    // Emit update event
    this._emit('COMPONENT_UPDATED', {
      data
    });
    
    return this;
  }
  
  /**
   * Remove this component from the DOM
   */
  remove() {
    // Skip if already destroyed
    if (this._isDestroyed) return;
    
    // Emit before removal event
    this._emit('COMPONENT_BEFORE_REMOVE');
    
    // Stop mutation observer if active
    if (this._mutationObserver) {
      this._mutationObserver.disconnect();
      this._mutationObserver = null;
    }
    
    // Remove event handlers
    if (this._eventBindings) {
      this._eventBindings.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this._eventBindings = [];
    }
    
    // Unsubscribe from all EventBus events
    if (this._eventSubscriptions) {
      this._eventSubscriptions.forEach(subscription => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      });
      this._eventSubscriptions = [];
    }
    
    // Remove children first
    this.children.forEach(child => child.remove());
    this.children = [];
    
    // Remove from DOM
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    // Clean up references
    this.element = null;
    this._isRendered = false;
    this._isDestroyed = true;
    
    // Emit removal event
    this._emit('COMPONENT_REMOVED');
  }
  
  /**
   * Completely destroy the component and all references
   */
  destroy() {
    // Remove from DOM first
    this.remove();
    
    // Clear parent reference
    this._parentComponent = null;
    
    // Emit destruction event
    this._emit('COMPONENT_DESTROYED');
    
    // Clear all properties
    Object.keys(this).forEach(key => {
      this[key] = null;
    });
  }
  
  /**
   * Hide the component (but keep in DOM)
   * @returns {Component} This component for chaining
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
      
      // Emit hide event
      this._emit('COMPONENT_HIDDEN');
    }
    
    return this;
  }
  
  /**
   * Show the component
   * @returns {Component} This component for chaining
   */
  show() {
    if (this.element) {
      this.element.style.display = '';
      
      // Emit show event
      this._emit('COMPONENT_SHOWN');
    }
    
    return this;
  }
  
  /**
   * Toggle component visibility
   * @returns {Component} This component for chaining
   */
  toggle() {
    if (this.element) {
      if (this.element.style.display === 'none') {
        this.show();
      } else {
        this.hide();
      }
    }
    
    return this;
  }
  
  /**
   * Generate a unique ID for components
   * @static
   * @param {String} prefix - ID prefix
   * @returns {String} Unique component ID
   */
  static generateId(prefix = 'component') {
    return `${prefix}-${Utils.generateId()}`;
  }
  
  /**
   * Create a component from a template string
   * @static
   * @param {String} template - HTML template string
   * @param {Object} options - Component options
   * @returns {Component} Created component
   */
  static fromTemplate(template, options = {}) {
    const id = options.id || Component.generateId(options.prefix || 'component');
    return new Component(id, template, options);
  }
}

export default Component;