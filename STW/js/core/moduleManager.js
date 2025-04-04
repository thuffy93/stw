// Lightweight Module Management System
export const ModuleManager = (() => {
    // Track module initialization status
    const modules = {
        EventBus: { initialized: false },
        Config: { initialized: false },
        GameState: { initialized: false },
        Utils: { initialized: false },
        Storage: { initialized: false },
        Character: { initialized: false },
        Gems: { initialized: false },
        Battle: { initialized: false },
        Shop: { initialized: false },
        EventHandler: { initialized: false },
        UI: { initialized: false }
    };

    // Initialization sequence
    const initializationOrder = [
        'EventBus',
        'Config',
        'GameState',
        'Utils',
        'Storage',
        'UI',
        'Character',
        'Gems',
        'Battle',
        'Shop',
        'EventHandler'
    ];

    /**
     * Initialize a specific module
     * @param {string} moduleName - Name of the module to initialize
     * @returns {boolean} Whether initialization was successful
     */
    function initializeModule(moduleName) {
        // Validate module exists
        if (!modules[moduleName]) {
            console.error(`Unknown module: ${moduleName}`);
            return false;
        }

        // Skip if already initialized
        if (modules[moduleName].initialized) {
            console.log(`Module already initialized: ${moduleName}`);
            return true;
        }

        try {
            // Dynamically import and initialize the module
            const moduleImport = getModuleImport(moduleName);
            
            if (typeof moduleImport.initialize === 'function') {
                const result = moduleImport.initialize();
                
                // Mark as initialized if result is not explicitly false
                modules[moduleName].initialized = result !== false;
                
                if (result === false) {
                    console.error(`Failed to initialize module: ${moduleName}`);
                }
                
                return modules[moduleName].initialized;
            } else {
                // If no initialize method, mark as initialized
                modules[moduleName].initialized = true;
                return true;
            }
        } catch (error) {
            console.error(`Initialization error in ${moduleName}:`, error);
            return false;
        }
    }

    /**
     * Dynamically import a module based on its name
     * @param {string} moduleName - Name of the module to import
     * @returns {Object} Imported module
     */
    function getModuleImport(moduleName) {
        const moduleImports = {
            'EventBus': () => import('./eventbus.js'),
            'Config': () => import('./config.js'),
            'GameState': () => import('./state.js'),
            'Utils': () => import('./utils.js'),
            'Storage': () => import('./storage.js'),
            'Character': () => import('../systems/character.js'),
            'Gems': () => import('../systems/gem.js'),
            'Battle': () => import('../systems/battle.js'),
            'Shop': () => import('../systems/shop.js'),
            'EventHandler': () => import('../systems/eventHandler.js'),
            'UI': () => import('../ui/renderer.js')
        };

        const importFn = moduleImports[moduleName];
        if (!importFn) {
            throw new Error(`No import defined for module: ${moduleName}`);
        }

        // Synchronous import
        const module = importFn();
        return module.default || module;
    }

    /**
     * Initialize all modules in the correct order
     * @returns {boolean} Whether all modules were successfully initialized
     */
    function initializeAllModules() {
        console.log("Initializing all game modules");
        
        let allInitialized = true;
        
        for (const moduleName of initializationOrder) {
            const success = initializeModule(moduleName);
            
            if (!success) {
                console.error(`Failed to initialize module: ${moduleName}`);
                allInitialized = false;
                break;
            }
        }
        
        if (allInitialized) {
            console.log("All modules initialized successfully");
        } else {
            console.error("Some modules failed to initialize");
        }
        
        return allInitialized;
    }

    /**
     * Check if a specific module is initialized
     * @param {string} moduleName - Name of the module to check
     * @returns {boolean} Whether the module is initialized
     */
    function isModuleInitialized(moduleName) {
        return modules[moduleName]?.initialized || false;
    }

    /**
     * Get status of all modules
     * @returns {Object} Module initialization status
     */
    function getModuleStatus() {
        const status = {};
        Object.entries(modules).forEach(([name, module]) => {
            status[name] = module.initialized;
        });
        return status;
    }

    // Public API
    return {
        initializeModule,
        initializeAllModules,
        isModuleInitialized,
        getModuleStatus
    };
})();

export default ModuleManager;