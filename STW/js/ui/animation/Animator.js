// ui/animation/Animator.js - Refactored with ES6 patterns and enhanced functionality
import { EventBus } from '../../core/eventbus.js';

/**
 * Animation utility class with standardized promise-based methods
 */
export class Animator {
  /**
   * Apply a CSS animation to an element
   * @param {HTMLElement} element - Element to animate
   * @param {String} animationType - CSS class name for animation
   * @param {Number} duration - Animation duration in milliseconds
   * @param {Boolean} removeClassAfter - Whether to remove the class after animation completes
   * @returns {Promise} Promise that resolves when animation completes
   */
  static animate(element, animationType, duration = 500, removeClassAfter = true) {
    if (!element) {
      console.warn("Animator.animate: No element provided");
      return Promise.resolve();
    }
    
    return new Promise(resolve => {
      // Add animation class
      element.classList.add(animationType);
      
      // Emit animation start event
      EventBus.emit('ANIMATION_STARTED', {
        type: animationType,
        element: element,
        duration,
        timestamp: Date.now()
      });
      
      // Set timeout to clean up and resolve
      setTimeout(() => {
        if (removeClassAfter) {
          element.classList.remove(animationType);
        }
        
        // Emit animation complete event
        EventBus.emit('ANIMATION_COMPLETED', {
          type: animationType,
          element: element,
          duration,
          timestamp: Date.now()
        });
        
        resolve();
      }, duration);
    });
  }
  
  /**
   * Fade in an element
   * @param {HTMLElement} element - Element to fade in
   * @param {Number} duration - Animation duration in milliseconds
   * @returns {Promise} Promise that resolves when animation completes
   */
  static fadeIn(element, duration = 300) {
    if (!element) {
      console.warn("Animator.fadeIn: No element provided");
      return Promise.resolve();
    }
    
    // Reset initial state
    element.style.opacity = '0';
    element.style.display = 'block';
    
    // Emit animation start event
    EventBus.emit('ANIMATION_STARTED', {
      type: 'fadeIn',
      element: element,
      duration,
      timestamp: Date.now()
    });
    
    return new Promise(resolve => {
      // Need a small delay before setting transition for browser to recognize the starting state
      setTimeout(() => {
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '1';
        
        setTimeout(() => {
          // Emit animation complete event
          EventBus.emit('ANIMATION_COMPLETED', {
            type: 'fadeIn',
            element: element,
            duration,
            timestamp: Date.now()
          });
          
          resolve();
        }, duration);
      }, 10);
    });
  }
  
  /**
   * Fade out an element
   * @param {HTMLElement} element - Element to fade out
   * @param {Number} duration - Animation duration in milliseconds
   * @param {Boolean} hideAfter - Whether to set display:none after fade
   * @returns {Promise} Promise that resolves when animation completes
   */
  static fadeOut(element, duration = 300, hideAfter = true) {
    if (!element) {
      console.warn("Animator.fadeOut: No element provided");
      return Promise.resolve();
    }
    
    // Reset initial state
    element.style.opacity = '1';
    
    // Emit animation start event
    EventBus.emit('ANIMATION_STARTED', {
      type: 'fadeOut',
      element: element,
      duration,
      timestamp: Date.now()
    });
    
    return new Promise(resolve => {
      element.style.transition = `opacity ${duration}ms ease`;
      element.style.opacity = '0';
      
      setTimeout(() => {
        if (hideAfter) {
          element.style.display = 'none';
        }
        
        // Emit animation complete event
        EventBus.emit('ANIMATION_COMPLETED', {
          type: 'fadeOut',
          element: element,
          duration,
          timestamp: Date.now()
        });
        
        resolve();
      }, duration);
    });
  }
  
  /**
   * Slide an element in from a direction
   * @param {HTMLElement} element - Element to slide
   * @param {String} direction - Direction to slide from ('left', 'right', 'top', 'bottom')
   * @param {Number} duration - Animation duration in milliseconds
   * @param {Number} distance - Distance to slide in pixels
   * @returns {Promise} Promise that resolves when animation completes
   */
  static slideIn(element, direction = 'left', duration = 300, distance = 50) {
    if (!element) {
      console.warn("Animator.slideIn: No element provided");
      return Promise.resolve();
    }
    
    // Store original styles to restore later
    const originalTransition = element.style.transition;
    const originalTransform = element.style.transform;
    
    // Set initial position based on direction
    let transform;
    switch (direction) {
      case 'left':
        transform = `translateX(-${distance}px)`;
        break;
      case 'right':
        transform = `translateX(${distance}px)`;
        break;
      case 'top':
        transform = `translateY(-${distance}px)`;
        break;
      case 'bottom':
        transform = `translateY(${distance}px)`;
        break;
      default:
        transform = `translateX(-${distance}px)`;
    }
    
    // Set initial state
    element.style.opacity = '0';
    element.style.transform = transform;
    element.style.display = 'block';
    
    // Emit animation start event
    EventBus.emit('ANIMATION_STARTED', {
      type: 'slideIn',
      direction,
      element: element,
      duration,
      timestamp: Date.now()
    });
    
    return new Promise(resolve => {
      // Need a small delay for the browser to recognize the starting state
      setTimeout(() => {
        element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
        element.style.opacity = '1';
        element.style.transform = 'translate(0, 0)';
        
        setTimeout(() => {
          // Restore original transition (but keep the new transform)
          element.style.transition = originalTransition;
          
          // Emit animation complete event
          EventBus.emit('ANIMATION_COMPLETED', {
            type: 'slideIn',
            direction,
            element: element,
            duration,
            timestamp: Date.now()
          });
          
          resolve();
        }, duration);
      }, 10);
    });
  }
  
  /**
   * Slide an element out in a direction
   * @param {HTMLElement} element - Element to slide
   * @param {String} direction - Direction to slide to ('left', 'right', 'top', 'bottom')
   * @param {Number} duration - Animation duration in milliseconds
   * @param {Number} distance - Distance to slide in pixels
   * @param {Boolean} hideAfter - Whether to hide the element after animation
   * @returns {Promise} Promise that resolves when animation completes
   */
  static slideOut(element, direction = 'left', duration = 300, distance = 50, hideAfter = true) {
    if (!element) {
      console.warn("Animator.slideOut: No element provided");
      return Promise.resolve();
    }
    
    // Store original styles to potentially restore later
    const originalTransition = element.style.transition;
    const originalTransform = element.style.transform;
    
    // Set target position based on direction
    let transform;
    switch (direction) {
      case 'left':
        transform = `translateX(-${distance}px)`;
        break;
      case 'right':
        transform = `translateX(${distance}px)`;
        break;
      case 'top':
        transform = `translateY(-${distance}px)`;
        break;
      case 'bottom':
        transform = `translateY(${distance}px)`;
        break;
      default:
        transform = `translateX(-${distance}px)`;
    }
    
    // Emit animation start event
    EventBus.emit('ANIMATION_STARTED', {
      type: 'slideOut',
      direction,
      element: element,
      duration,
      timestamp: Date.now()
    });
    
    return new Promise(resolve => {
      element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
      element.style.opacity = '0';
      element.style.transform = transform;
      
      setTimeout(() => {
        if (hideAfter) {
          element.style.display = 'none';
        }
        
        // Restore original styles if not hiding
        if (!hideAfter) {
          element.style.transition = originalTransition;
          element.style.transform = originalTransform;
        }
        
        // Emit animation complete event
        EventBus.emit('ANIMATION_COMPLETED', {
          type: 'slideOut',
          direction,
          element: element,
          duration,
          timestamp: Date.now()
        });
        
        resolve();
      }, duration);
    });
  }
  
  /**
   * Create a floating text animation
   * @param {String} text - Text to display
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Animation options
   * @returns {Promise} Promise that resolves when animation completes
   */
  static floatingText(text, container, options = {}) {
    // Default options
    const {
      className = 'floating-text',
      duration = 1500,
      startPosition = { x: '50%', y: '50%' },
      endPosition = { x: '50%', y: '30%' },
      color = 'white',
      fontSize = '1.5em'
    } = options;
    
    // Create element
    const element = document.createElement('div');
    element.className = className;
    element.textContent = text;
    element.style.position = 'absolute';
    element.style.left = startPosition.x;
    element.style.top = startPosition.y;
    element.style.transform = 'translate(-50%, -50%)';
    element.style.color = color;
    element.style.fontSize = fontSize;
    element.style.pointerEvents = 'none';
    element.style.zIndex = '9999';
    element.style.textShadow = '0 0 3px rgba(0,0,0,0.5)';
    
    // Add to container
    container.appendChild(element);
    
    // Emit animation start event
    EventBus.emit('ANIMATION_STARTED', {
      type: 'floatingText',
      text,
      element,
      duration,
      timestamp: Date.now()
    });
    
    // Animate
    return new Promise(resolve => {
      element.style.transition = `opacity ${duration}ms ease, top ${duration}ms ease`;
      
      // Need a small delay for the browser to recognize the starting state
      setTimeout(() => {
        element.style.opacity = '0';
        element.style.top = endPosition.y;
        
        setTimeout(() => {
          // Remove element when done
          container.removeChild(element);
          
          // Emit animation complete event
          EventBus.emit('ANIMATION_COMPLETED', {
            type: 'floatingText',
            text,
            duration,
            timestamp: Date.now()
          });
          
          resolve();
        }, duration);
      }, 10);
    });
  }
  
  /**
   * Create a shake animation
   * @param {HTMLElement} element - Element to shake
   * @param {Number} duration - Animation duration in milliseconds
   * @param {Number} intensity - Shake intensity in pixels
   * @returns {Promise} Promise that resolves when animation completes
   */
  static shake(element, duration = 500, intensity = 5) {
    if (!element) {
      console.warn("Animator.shake: No element provided");
      return Promise.resolve();
    }
    
    // Store original styles
    const originalTransition = element.style.transition;
    const originalTransform = element.style.transform;
    
    // Create keyframes for shake animation
    const keyframes = [
      { transform: `translateX(0)` },
      { transform: `translateX(-${intensity}px)` },
      { transform: `translateX(${intensity}px)` },
      { transform: `translateX(-${intensity}px)` },
      { transform: `translateX(${intensity}px)` },
      { transform: `translateX(-${intensity}px)` },
      { transform: `translateX(0)` }
    ];
    
    // Emit animation start event
    EventBus.emit('ANIMATION_STARTED', {
      type: 'shake',
      element,
      duration,
      intensity,
      timestamp: Date.now()
    });
    
    return new Promise(resolve => {
      // Use Web Animations API if available
      if (typeof element.animate === 'function') {
        const animation = element.animate(keyframes, {
          duration,
          easing: 'ease-in-out'
        });
        
        animation.onfinish = () => {
          // Restore original transform
          element.style.transform = originalTransform;
          
          // Emit animation complete event
          EventBus.emit('ANIMATION_COMPLETED', {
            type: 'shake',
            element,
            duration,
            timestamp: Date.now()
          });
          
          resolve();
        };
      } else {
        // Fallback using CSS transitions
        let step = 0;
        const steps = keyframes.length;
        const stepDuration = duration / steps;
        
        const executeStep = () => {
          if (step >= steps) {
            // Animation complete
            element.style.transition = originalTransition;
            element.style.transform = originalTransform;
            
            // Emit animation complete event
            EventBus.emit('ANIMATION_COMPLETED', {
              type: 'shake',
              element,
              duration,
              timestamp: Date.now()
            });
            
            resolve();
            return;
          }
          
          // Apply current step
          element.style.transition = `transform ${stepDuration}ms ease-in-out`;
          element.style.transform = keyframes[step].transform;
          
          // Schedule next step
          step++;
          setTimeout(executeStep, stepDuration);
        };
        
        // Start the animation
        executeStep();
      }
    });
  }
  
  /**
   * Create a pulse animation
   * @param {HTMLElement} element - Element to pulse
   * @param {Number} duration - Animation duration in milliseconds
   * @param {Number} scale - Maximum scale factor
   * @returns {Promise} Promise that resolves when animation completes
   */
  static pulse(element, duration = 500, scale = 1.1) {
    if (!element) {
      console.warn("Animator.pulse: No element provided");
      return Promise.resolve();
    }
    
    // Store original styles
    const originalTransition = element.style.transition;
    const originalTransform = element.style.transform;
    
    // Emit animation start event
    EventBus.emit('ANIMATION_STARTED', {
      type: 'pulse',
      element,
      duration,
      scale,
      timestamp: Date.now()
    });
    
    return new Promise(resolve => {
      // Set up transition
      element.style.transition = `transform ${duration/2}ms ease-in-out`;
      
      // Scale up
      element.style.transform = `${originalTransform} scale(${scale})`;
      
      // Scale back down after half the duration
      setTimeout(() => {
        element.style.transform = originalTransform;
        
        // Animation complete after full duration
        setTimeout(() => {
          // Restore original transition
          element.style.transition = originalTransition;
          
          // Emit animation complete event
          EventBus.emit('ANIMATION_COMPLETED', {
            type: 'pulse',
            element,
            duration,
            timestamp: Date.now()
          });
          
          resolve();
        }, duration/2);
      }, duration/2);
    });
  }
}

export default Animator;