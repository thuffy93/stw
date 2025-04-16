// Utils.js - Common utility functions for reuse across the application
export default class Utils {
    /**
     * Deep clones an object without circular references
     * @param {Object} obj - The object to clone
     * @return {Object} A deep clone of the object
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        try {
            // Fast path for most objects
            return JSON.parse(JSON.stringify(obj));
        } catch (error) {
            // Handle circular references or other JSON issues
            console.warn('Deep clone using JSON failed, falling back to manual clone', error);
            
            if (Array.isArray(obj)) {
                return obj.map(item => this.deepClone(item));
            }
            
            const clone = {};
            Object.keys(obj).forEach(key => {
                clone[key] = this.deepClone(obj[key]);
            });
            
            return clone;
        }
    }
    
    /**
     * Delay execution asynchronously
     * @param {number} ms - Milliseconds to delay
     * @return {Promise} A promise that resolves after the delay
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Shuffle an array using Fisher-Yates algorithm
     * @param {Array} array - The array to shuffle
     * @return {Array} A new shuffled array
     */
    static shuffleArray(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    
    /**
     * Generate a unique ID with optional prefix
     * @param {string} prefix - Optional prefix for the ID
     * @return {string} A unique ID
     */
    static generateId(prefix = '') {
        return `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    /**
     * Format a number with commas for thousands
     * @param {number} num - The number to format
     * @return {string} Formatted number
     */
    static formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    /**
     * Calculate percentage and ensure it's between 0-100
     * @param {number} current - Current value
     * @param {number} max - Maximum value
     * @return {number} Percentage between 0-100
     */
    static calculatePercentage(current, max) {
        if (max <= 0) return 0;
        return Math.min(100, Math.max(0, Math.round((current / max) * 100)));
    }
    
    /**
     * Get a random item from an array
     * @param {Array} array - The source array
     * @return {*} A random item from the array
     */
    static getRandomItem(array) {
        if (!array || array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
    }
    
    /**
     * Check if an object has all required properties
     * @param {Object} obj - The object to check
     * @param {Array} requiredProps - Array of required property names
     * @return {boolean} True if all required properties exist
     */
    static hasRequiredProperties(obj, requiredProps) {
        if (!obj || typeof obj !== 'object') return false;
        return requiredProps.every(prop => obj.hasOwnProperty(prop));
    }
    
    /**
     * Debounce a function call
     * @param {Function} func - The function to debounce
     * @param {number} wait - The debounce time in milliseconds
     * @return {Function} Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    /**
     * Create a throttled function that only invokes the provided function once per wait period
     * @param {Function} func - The function to throttle
     * @param {number} wait - The throttle time in milliseconds
     * @return {Function} Throttled function
     */
    static throttle(func, wait) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= wait) {
                lastCall = now;
                return func.apply(this, args);
            }
        };
    }
    
    /**
     * Safely get a nested property from an object using a dot-notation path
     * @param {Object} obj - The source object
     * @param {string} path - Dot-notation path to the property
     * @param {*} defaultValue - Default value if property doesn't exist
     * @return {*} The property value or default value
     */
    static getNestedProperty(obj, path, defaultValue = undefined) {
        if (!obj || !path) return defaultValue;
        
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current === null || current === undefined || typeof current !== 'object') {
                return defaultValue;
            }
            current = current[key];
        }
        
        return current !== undefined ? current : defaultValue;
    }
    
    /**
     * Group array items by a property value
     * @param {Array} array - The array to group
     * @param {string|Function} keyGetter - Property name or function to get the key
     * @return {Object} An object with items grouped by key
     */
    static groupBy(array, keyGetter) {
        return array.reduce((acc, item) => {
            const key = typeof keyGetter === 'function' 
                ? keyGetter(item) 
                : item[keyGetter];
                
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(item);
            return acc;
        }, {});
    }
    
    /**
     * Create a memoized version of a function
     * @param {Function} fn - The function to memoize
     * @return {Function} Memoized function
     */
    static memoize(fn) {
        const cache = new Map();
        return function(...args) {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = fn.apply(this, args);
            cache.set(key, result);
            return result;
        };
    }
}