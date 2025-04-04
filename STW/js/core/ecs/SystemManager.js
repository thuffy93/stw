// System Manager - Manages and coordinates ECS systems
import { EventBus } from '../../core/eventbus.js';
import { System } from './System.js';

/**
 * SystemManager - Manages and coordinates ECS systems
 */
export const SystemManager = (() => {
    // Map of system instances by name
    const systems = new Map();
    
    // Systems to update each frame
    const updateableSystems = [];
    
    // Last timestamp for delta time calculation
    let lastUpdateTime = 0;
    
    /**
     * Register a system with the manager
     * @param {System} system - System instance to register
     * @returns {Boolean} Success status
     */
    function registerSystem(system) {
        // Validate system object
        if (!(system instanceof System)) {
            console.error('Invalid system object:', system);
            return false;
        }
        
        // Check for name collision
        if (systems.has(system.name)) {
            console.error(`System name collision: ${system.name}`);
            return false;
        }
        
        // Register the system
        systems.set(system.name, system);
        
        // Add to updateable systems if it has an update method
        if (typeof system.update === 'function' && 
            system.update !== System.prototype.update) {
            updateableSystems.push(system);
        }
        
        console.log(`System registered: ${system.name}`);
        return true;
    }
    
    /**
     * Initialize all registered systems
     * @returns {Boolean} Success status
     */
    function initializeAllSystems() {
        let allSuccess = true;
        
        // Create an array to track initialization order
        const initOrder = [];
        
        // Initialize all systems
        for (const [name, system] of systems) {
            try {
                const success = system.initialize();
                if (!success) {
                    console.error(`Failed to initialize system: ${name}`);
                    allSuccess = false;
                } else {
                    initOrder.push(name);
                }
            } catch (err) {
                console.error(`Error initializing system ${name}:`, err);
                allSuccess = false;
            }
        }
        
        console.log(`Systems initialized in order: ${initOrder.join(', ')}`);
        
        // Emit initialization complete event
        EventBus.emit('SYSTEMS_INITIALIZED', {
            success: allSuccess,
            systems: Array.from(systems.keys())
        });
        
        return allSuccess;
    }
    
    /**
     * Shut down all systems
     */
    function shutdownAllSystems() {
        for (const [name, system] of systems) {
            try {
                system.shutdown();
            } catch (err) {
                console.error(`Error shutting down system ${name}:`, err);
            }
        }
        
        console.log('All systems shut down');
    }
    
    /**
     * Get a system by name
     * @param {String} systemName - Name of the system
     * @returns {System|null} System instance or null if not found
     */
    function getSystem(systemName) {
        return systems.get(systemName) || null;
    }
    
    /**
     * Enable a system
     * @param {String} systemName - Name of the system
     * @returns {Boolean} Success status
     */
    function enableSystem(systemName) {
        const system = systems.get(systemName);
        if (!system) {
            console.error(`System not found: ${systemName}`);
            return false;
        }
        
        system.enable();
        return true;
    }
    
    /**
     * Disable a system
     * @param {String} systemName - Name of the system
     * @returns {Boolean} Success status
     */
    function disableSystem(systemName) {
        const system = systems.get(systemName);
        if (!system) {
            console.error(`System not found: ${systemName}`);
            return false;
        }
        
        system.disable();
        return true;
    }
    
    /**
     * Start the update loop
     */
    function startUpdateLoop() {
        // Initialize the last update time
        lastUpdateTime = performance.now();
        
        // Start the update loop
        requestAnimationFrame(updateLoop);
        
        console.log('System update loop started');
    }
    
    /**
     * The update loop function
     * @param {Number} timestamp - Current timestamp from requestAnimationFrame
     */
    function updateLoop(timestamp) {
        // Calculate delta time in seconds
        const deltaTime = (timestamp - lastUpdateTime) / 1000;
        lastUpdateTime = timestamp;
        
        // Update all systems
        for (const system of updateableSystems) {
            if (system.enabled) {
                try {
                    system.update(deltaTime);
                } catch (err) {
                    console.error(`Error updating system ${system.name}:`, err);
                }
            }
        }
        
        // Continue the loop
        requestAnimationFrame(updateLoop);
    }
    
    /**
     * Get all registered systems
     * @returns {Object} Map of system names to enabled status
     */
    function getAllSystems() {
        const result = {};
        
        for (const [name, system] of systems) {
            result[name] = {
                enabled: system.enabled
            };
        }
        
        return result;
    }
    
    // Public API
    return {
        registerSystem,
        initializeAllSystems,
        shutdownAllSystems,
        getSystem,
        enableSystem,
        disableSystem,
        startUpdateLoop,
        getAllSystems
    };
})();

export default SystemManager;