// Updated Module Loader with Enhanced EventBus Support
import { EventBus } from './events.js';

export const ModuleLoader = (() => {
    // Module configuration tracking
    const modules = {
        EventBus: { 
            required: true, 
            loaded: false, 
            initialized: false, 
            dependencies: [],
            module: EventBus 
        },
        Config: { 
            required: true, 
            loaded: false, 
            initialized: false, 
            dependencies: ['EventBus'] 
        },
        Utils: { 
            required: true, 
            loaded: false, 
            initialized: false, 
            dependencies: ['Config', 'EventBus'] 
        },
        State: { 
            required: true, 
            loaded: false, 
            initialized: false, 
            dependencies: ['Config', 'Utils', 'EventBus'] 
        },
        Storage: { 
            required: true, 
            loaded: false, 
            initialized: false, 
            dependencies: ['Config', 'State', 'Utils', 'EventBus'] 
        },
        UI: { 
            required: true, 
            loaded: false, 
            initialized: false, 
            dependencies: ['Config', 'State', 'Utils', 'EventBus'] 
        },
        AudioManager: { 
            required: false, 
            loaded: false, 
            initialized: false, 
            dependencies: ['Config', 'EventBus'] 
        },
        Gems: { 
            required: true, 
            loaded: false, 
            initialized: false, 
            dependencies: ['Config', 'State', 'Utils', 'EventBus'] 
        },
        Battle: { 
            required: true, 
            loaded: false, 
            initialized: false, 
            dependencies: ['Config', 'State', 'Gems', 'UI', 'Utils', 'EventBus'] 
        },
        Shop: { 
            required: true, 
            loaded: false, 
            initialized: false, 
            dependencies: ['Config', 'State', 'Gems', 'UI', 'Utils', 'EventBus'] 
        },
        ScreenTransitions: { 
            required: false, 
            loaded: false, 
            initialized: false, 
            dependencies: ['UI', 'State', 'Storage', 'EventBus'] 
        },
        GameDiagnostics: { 
            required: false, 
            loaded: false, 
            initialized: false, 
            dependencies: ['EventBus'] 
        },
        Game: { 
            required: true, 
            loaded: false, 
            initialized: false, 
            dependencies: ['Config', 'State', 'UI', 'AudioManager', 'Gems', 'Battle', 'Shop', 'Storage', 'EventBus'] 
        }
    };
    
    // Tracking initialization errors
    const errors = [];
    
    /**
     * Check if a module is loaded
     * @param {String} moduleName - Name of the module
     * @returns {Boolean} Whether module is loaded
     */
    function isModuleLoaded(moduleName) {
        if (!modules[moduleName]) return false;
        
        // Special handling for EventBus
        if (moduleName === 'EventBus') return typeof EventBus !== 'undefined';
        
        return typeof window[moduleName] !== 'undefined';
    }
    
    /**
     * Mark a module as loaded
     * @param {String} moduleName - Name of the module
     */
    function markModuleLoaded(moduleName) {
        if (!modules[moduleName]) return;
        
        // Special handling for EventBus
        if (moduleName === 'EventBus') {
            modules[moduleName].loaded = typeof EventBus !== 'undefined';
            return;
        }
        
        modules[moduleName].loaded = true;
        EventBus.publish('MODULE_LOADED', { moduleName });
        console.log(`Module loaded: ${moduleName}`);
    }
    
    /**
     * Check if all dependencies of a module are loaded
     * @param {String} moduleName - Name of the module
     * @returns {Boolean} Whether all dependencies are loaded
     */
    function areDependenciesLoaded(moduleName) {
        if (!modules[moduleName]) return false;
        
        const dependencies = modules[moduleName].dependencies;
        if (!dependencies || dependencies.length === 0) return true;
        
        return dependencies.every(dep => modules[dep] && modules[dep].loaded);
    }
    
    /**
     * Initialize a module
     * @param {String} moduleName - Name of the module
     * @returns {Boolean} Success or failure
     */
    function initializeModule(moduleName) {
        try {
            // Special handling for EventBus
            if (moduleName === 'EventBus') {
                modules[moduleName].initialized = true;
                return true;
            }
            
            // Check if module exists
            if (!modules[moduleName]) {
                console.warn(`Unknown module: ${moduleName}`);
                return false;
            }
            
            // Check if already initialized
            if (modules[moduleName].initialized) {
                return true;
            }
            
            // Check if module is loaded
            if (!isModuleLoaded(moduleName)) {
                console.warn(`Module not loaded: ${moduleName}`);
                return false;
            }
            
            // Check dependencies
            if (!areDependenciesLoaded(moduleName)) {
                console.warn(`Dependencies not loaded for: ${moduleName}`);
                return false;
            }
            
            // Get the module
            const module = window[moduleName];
            
            // Initialize the module if it has an initialize method
            if (module && typeof module.initialize === 'function') {
                console.log(`Initializing module: ${moduleName}`);
                const result = module.initialize();
                
                // If initialization returns explicitly false, consider it failed
                if (result === false) {
                    console.error(`Module initialization failed: ${moduleName}`);
                    errors.push({ module: moduleName, error: 'Initialization returned false' });
                    return false;
                }
                
                modules[moduleName].initialized = true;
                EventBus.publish('MODULE_INITIALIZED', { moduleName });
                console.log(`Module initialized: ${moduleName}`);
                return true;
            } else {
                // No initialize method, just mark as initialized
                modules[moduleName].initialized = true;
                EventBus.publish('MODULE_INITIALIZED', { moduleName });
                console.log(`Module marked as initialized (no initialize method): ${moduleName}`);
                return true;
            }
        } catch (error) {
            console.error(`Error initializing module ${moduleName}:`, error);
            errors.push({ module: moduleName, error: error.message });
            EventBus.publish('MODULE_INITIALIZATION_ERROR', { 
                moduleName, 
                error: error.message 
            });
            return false;
        }
    }
    
    /**
     * Initialize all modules in the correct order
     */
    function initializeAllModules() {
        console.log("Initializing all modules in dependency order");
        
        // First, ensure EventBus is loaded and initialized
        if (!modules.EventBus.loaded || !modules.EventBus.initialized) {
            modules.EventBus.loaded = true;
            modules.EventBus.initialized = true;
        }
        
        // First check if all required modules are loaded
        const missingModules = [];
        Object.entries(modules).forEach(([name, info]) => {
            if (info.required && !isModuleLoaded(name)) {
                missingModules.push(name);
                markModuleLoaded(name); // Mark as loaded as a fallback
            } else if (isModuleLoaded(name)) {
                markModuleLoaded(name);
            }
        });
        
        if (missingModules.length > 0) {
            console.error("Required modules missing:", missingModules.join(', '));
            
            // Add to errors
            missingModules.forEach(module => {
                errors.push({ module, error: 'Module missing' });
            });
            
            // Publish error event via EventBus
            EventBus.publish('MODULES_MISSING', { 
                missingModules,
                errorDetails: errors 
            });
            
            return false;
        }
        
        // Sort modules by dependency order
        const initOrder = calculateInitializationOrder();
        
        // Initialize modules in order
        let success = true;
        initOrder.forEach(moduleName => {
            if (!initializeModule(moduleName)) {
                success = false;
            }
        });
        
        if (!success) {
            console.error("Some modules failed to initialize:", errors);
            
            // Publish detailed error event
            EventBus.publish('MODULE_INITIALIZATION_FAILED', { 
                errors,
                initializationSuccess: success 
            });
        } else {
            // Publish successful initialization event
            EventBus.publish('ALL_MODULES_INITIALIZED', { 
                initializedModules: initOrder 
            });
        }
        
        return success;
    }
    
    /**
     * Calculate the order in which modules should be initialized
     * based on their dependencies
     * @returns {Array} Ordered list of module names
     */
    function calculateInitializationOrder() {
        const visited = new Set();
        const result = [];
        
        function visit(moduleName) {
            if (visited.has(moduleName)) return;
            
            visited.add(moduleName);
            
            const module = modules[moduleName];
            if (module && module.dependencies) {
                module.dependencies.forEach(dep => visit(dep));
            }
            
            result.push(moduleName);
        }
        
        // Prioritize EventBus first
        visit('EventBus');
        
        // Visit all modules
        Object.keys(modules).forEach(moduleName => {
            if (moduleName !== 'EventBus') {
                visit(moduleName);
            }
        });
        
        return result;
    }
    
    /**
     * Get the initialization status of all modules
     * @returns {Object} Module status
     */
    function getModuleStatus() {
        const status = {};
        
        Object.entries(modules).forEach(([name, info]) => {
            status[name] = {
                required: info.required,
                loaded: isModuleLoaded(name),
                initialized: info.initialized,
                dependencies: info.dependencies
            };
        });
        
        return status;
    }
    
    /**
     * Get initialization errors
     * @returns {Array} Initialization errors
     */
    function getErrors() {
        return [...errors];
    }
    
    /**
     * Check if critical modules are initialized
     * @returns {Boolean} Whether critical modules are initialized
     */
    function areCriticalModulesInitialized() {
        const criticalModules = ['EventBus', 'Config', 'State', 'UI', 'Game'];
        
        return criticalModules.every(module => {
            return modules[module] && modules[module].initialized;
        });
    }
    
    // Public interface
    return {
        initializeAllModules,
        initializeModule,
        isModuleLoaded,
        getModuleStatus,
        getErrors,
        areCriticalModulesInitialized
    };
})();

export default ModuleLoader;