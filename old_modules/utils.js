            // ===================================================
            // UTILS MODULE - Utility functions
            // ===================================================
            const Utils = (() => {
                /**
                 * Shuffle an array using Fisher-Yates algorithm
                 * @param {Array} array - Array to shuffle
                 * @returns {Array} - Shuffled array
                 */
                function shuffle(array) {
                    if (!Array.isArray(array)) {
                        console.warn("Shuffle received non-array:", array);
                        return array;
                    }
                    
                    // Create a copy to avoid modifying the original
                    const arr = [...array];
                    
                    for (let i = arr.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [arr[i], arr[j]] = [arr[j], arr[i]];
                    }
                    
                    return arr;
                }
                
                /**
                 * Generate a unique ID
                 * @param {String} prefix - Optional prefix for the ID
                 * @returns {String} Unique ID
                 */
                function generateId(prefix = '') {
                    const timestamp = Date.now().toString(36);
                    const randomPart = Math.random().toString(36).substring(2, 10);
                    return `${prefix}${timestamp}${randomPart}`;
                }
                
                /**
                 * Safely parse JSON with error handling
                 * @param {String} jsonString - JSON string to parse
                 * @param {*} defaultValue - Default value if parsing fails
                 * @returns {*} Parsed object or default value
                 */
                function safeJsonParse(jsonString, defaultValue = null) {
                    if (!jsonString) return defaultValue;
                    
                    try {
                        return JSON.parse(jsonString);
                    } catch (error) {
                        console.error("Error parsing JSON:", error);
                        console.error("JSON string:", jsonString.substring(0, 100) + (jsonString.length > 100 ? '...' : ''));
                        return defaultValue;
                    }
                }
                
                /**
                 * Delay execution for a specified time
                 * @param {Number} ms - Time to delay in milliseconds
                 * @returns {Promise} Promise that resolves after the delay
                 */
                function delay(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }
                
                /**
                 * Create a debounced function
                 * @param {Function} func - Function to debounce
                 * @param {Number} wait - Time to wait in milliseconds
                 * @param {Boolean} immediate - Whether to call immediately
                 * @returns {Function} Debounced function
                 */
                function debounce(func, wait, immediate = false) {
                    let timeout;
                    
                    return function(...args) {
                        const context = this;
                        
                        const later = function() {
                            timeout = null;
                            if (!immediate) func.apply(context, args);
                        };
                        
                        const callNow = immediate && !timeout;
                        clearTimeout(timeout);
                        timeout = setTimeout(later, wait);
                        
                        if (callNow) func.apply(context, args);
                    };
                }
                
                /**
                 * Create a throttled function
                 * @param {Function} func - Function to throttle
                 * @param {Number} limit - Time limit in milliseconds
                 * @returns {Function} Throttled function
                 */
                function throttle(func, limit) {
                    let lastCall = 0;
                    
                    return function(...args) {
                        const now = Date.now();
                        
                        if (now - lastCall >= limit) {
                            lastCall = now;
                            func.apply(this, args);
                        }
                    };
                }
                
                /**
                 * Get a random weighted item from an array
                 * @param {Array} items - Array of items
                 * @param {Function} weightFn - Function to calculate weight for each item
                 * @returns {*} Randomly selected item
                 */
                function getRandomWeighted(items, weightFn) {
                    if (!Array.isArray(items) || items.length === 0) {
                        return null;
                    }
                    
                    if (typeof weightFn !== 'function') {
                        // Default to equal weights if no function provided
                        return items[Math.floor(Math.random() * items.length)];
                    }
                    
                    const weightedItems = [];
                    
                    items.forEach(item => {
                        const weight = Math.max(0, weightFn(item));
                        for (let i = 0; i < weight; i++) {
                            weightedItems.push(item);
                        }
                    });
                    
                    if (weightedItems.length === 0) {
                        // Fallback if all weights were <= 0
                        return items[Math.floor(Math.random() * items.length)];
                    }
                    
                    return weightedItems[Math.floor(Math.random() * weightedItems.length)];
                }
                
                /**
                 * Clamp a value between min and max
                 * @param {Number} value - Value to clamp
                 * @param {Number} min - Minimum value
                 * @param {Number} max - Maximum value
                 * @returns {Number} Clamped value
                 */
                function clamp(value, min, max) {
                    return Math.max(min, Math.min(max, value));
                }
                
                /**
                 * Deep clone an object
                 * @param {*} obj - Object to clone
                 * @returns {*} Cloned object
                 */
                function deepClone(obj) {
                    if (obj === null || typeof obj !== 'object') {
                        return obj;
                    }
                    
                    try {
                        // Use JSON for simple deep cloning
                        return JSON.parse(JSON.stringify(obj));
                    } catch (e) {
                        console.warn("Deep clone fallback for circular references");
                        
                        // Fallback for circular references or non-serializable values
                        const clone = Array.isArray(obj) ? [] : {};
                        
                        Object.keys(obj).forEach(key => {
                            clone[key] = deepClone(obj[key]);
                        });
                        
                        return clone;
                    }
                }
                
                /**
                 * Check if two objects are deeply equal
                 * @param {*} obj1 - First object
                 * @param {*} obj2 - Second object
                 * @returns {Boolean} Whether objects are equal
                 */
                function deepEqual(obj1, obj2) {
                    // Handle primitive types (including null)
                    if (obj1 === obj2) return true;
                    
                    // If either is not an object or null
                    if (typeof obj1 !== 'object' || obj1 === null ||
                        typeof obj2 !== 'object' || obj2 === null) {
                        return false;
                    }
                    
                    // Arrays
                    if (Array.isArray(obj1) && Array.isArray(obj2)) {
                        if (obj1.length !== obj2.length) return false;
                        
                        for (let i = 0; i < obj1.length; i++) {
                            if (!deepEqual(obj1[i], obj2[i])) return false;
                        }
                        
                        return true;
                    }
                    
                    // Objects (non-arrays)
                    if (Array.isArray(obj1) || Array.isArray(obj2)) return false;
                    
                    const keys1 = Object.keys(obj1);
                    const keys2 = Object.keys(obj2);
                    
                    if (keys1.length !== keys2.length) return false;
                    
                    return keys1.every(key => 
                        keys2.includes(key) && deepEqual(obj1[key], obj2[key])
                    );
                }
                
                /**
                 * Remove null and undefined values from an object
                 * @param {Object} obj - Object to clean
                 * @returns {Object} Cleaned object
                 */
                function cleanObject(obj) {
                    const result = {};
                    
                    Object.entries(obj).forEach(([key, value]) => {
                        if (value !== null && value !== undefined) {
                            result[key] = value;
                        }
                    });
                    
                    return result;
                }
                
                /**
                 * Format a number with commas for thousands
                 * @param {Number} number - Number to format
                 * @returns {String} Formatted number
                 */
                function formatNumber(number) {
                    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                }
                
                /**
                 * Capitalize first letter of a string
                 * @param {String} string - String to capitalize
                 * @returns {String} Capitalized string
                 */
                function capitalize(string) {
                    if (!string || typeof string !== 'string') return '';
                    return string.charAt(0).toUpperCase() + string.slice(1);
                }
                
                /**
                 * Get a random integer between min and max (inclusive)
                 * @param {Number} min - Minimum value
                 * @param {Number} max - Maximum value
                 * @returns {Number} Random integer
                 */
                function randomInt(min, max) {
                    min = Math.ceil(min);
                    max = Math.floor(max);
                    return Math.floor(Math.random() * (max - min + 1)) + min;
                }
                
                // Return public methods
                return {
                    shuffle,
                    generateId,
                    safeJsonParse,
                    delay,
                    debounce,
                    throttle,
                    getRandomWeighted,
                    clamp,
                    deepClone,
                    deepEqual,
                    cleanObject,
                    formatNumber,
                    capitalize,
                    randomInt
                };
            })();