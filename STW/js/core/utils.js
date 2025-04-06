// Enhanced utility functions for game mechanics with standardized ES6 patterns
export class Utils {
    /**
     * Shuffle an array using Fisher-Yates algorithm
     * @param {Array} array - Array to shuffle
     * @returns {Array} - Shuffled array
     */
    static shuffle(array) {
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
     * Generate a unique ID with optional prefix
     * @param {String} prefix - Optional prefix for the ID
     * @returns {String} Unique ID
     */
    static generateId(prefix = '') {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 10);
        return `${prefix}${timestamp}${randomPart}`;
    }
    
    /**
     * Safely parse JSON with error handling and logging
     * @param {String} jsonString - JSON string to parse
     * @param {*} defaultValue - Default value if parsing fails
     * @returns {*} Parsed object or default value
     */
    static safeJsonParse(jsonString, defaultValue = null) {
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
     * Create a Promise-based delay function
     * @param {Number} ms - Time to delay in milliseconds
     * @returns {Promise} Promise that resolves after the delay
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Create a debounced function
     * @param {Function} func - Function to debounce
     * @param {Number} wait - Time to wait in milliseconds
     * @param {Boolean} immediate - Whether to call immediately
     * @returns {Function} Debounced function
     */
    static debounce(func, wait, immediate = false) {
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
    static throttle(func, limit) {
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
    static getRandomWeighted(items, weightFn) {
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
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    /**
     * Deep clone an object
     * @param {*} obj - Object to clone
     * @returns {*} Cloned object
     */
    static deepClone(obj) {
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
                clone[key] = this.deepClone(obj[key]);
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
    static deepEqual(obj1, obj2) {
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
                if (!this.deepEqual(obj1[i], obj2[i])) return false;
            }
            
            return true;
        }
        
        // Objects (non-arrays)
        if (Array.isArray(obj1) || Array.isArray(obj2)) return false;
        
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        
        if (keys1.length !== keys2.length) return false;
        
        return keys1.every(key => 
            keys2.includes(key) && this.deepEqual(obj1[key], obj2[key])
        );
    }
    
    /**
     * Remove null and undefined values from an object
     * @param {Object} obj - Object to clean
     * @returns {Object} Cleaned object
     */
    static cleanObject(obj) {
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
    static formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    /**
     * Capitalize first letter of a string
     * @param {String} string - String to capitalize
     * @returns {String} Capitalized string
     */
    static capitalize(string) {
        if (!string || typeof string !== 'string') return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    /**
     * Get a random integer between min and max (inclusive)
     * @param {Number} min - Minimum value
     * @param {Number} max - Maximum value
     * @returns {Number} Random integer
     */
    static randomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * Generate a consistent hash code from a string
     * @param {String} str - String to hash
     * @returns {Number} Hash code
     */
    static hashCode(str) {
        if (!str || typeof str !== 'string') return 0;
        
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }
    
    /**
     * Validate and sanitize a numeric input
     * @param {*} value - Value to validate
     * @param {Number} defaultValue - Default value if invalid
     * @param {Number} min - Minimum allowed value
     * @param {Number} max - Maximum allowed value
     * @returns {Number} Validated and sanitized number
     */
    static validateNumber(value, defaultValue = 0, min = null, max = null) {
        // Parse value to number if it's a string
        const num = typeof value === 'string' ? parseFloat(value) : value;
        
        // Check if result is a valid number
        if (isNaN(num) || typeof num !== 'number') {
            return defaultValue;
        }
        
        // Apply min/max constraints if provided
        let result = num;
        if (min !== null) result = Math.max(min, result);
        if (max !== null) result = Math.min(max, result);
        
        return result;
    }
}

// For backwards compatibility, also export as an object
export const UtilsObject = {
    shuffle: Utils.shuffle,
    generateId: Utils.generateId,
    safeJsonParse: Utils.safeJsonParse,
    delay: Utils.delay,
    debounce: Utils.debounce,
    throttle: Utils.throttle,
    getRandomWeighted: Utils.getRandomWeighted,
    clamp: Utils.clamp,
    deepClone: Utils.deepClone,
    deepEqual: Utils.deepEqual,
    cleanObject: Utils.cleanObject,
    formatNumber: Utils.formatNumber,
    capitalize: Utils.capitalize,
    randomInt: Utils.randomInt,
    hashCode: Utils.hashCode,
    validateNumber: Utils.validateNumber
};

export default Utils;