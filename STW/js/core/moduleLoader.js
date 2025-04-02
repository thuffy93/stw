// Updated MODULE LOADER with EventBus support
const ModuleLoader = (() => {
    const modules = {
        EventBus: { required: true, loaded: false, initialized: false, dependencies: [] },
        Config: { required: true, loaded: false, initialized: false, dependencies: [] },
        Utils: { required: true, loaded: false, initialized: false, dependencies: ['Config'] },
        State: { required: true, loaded: false, initialized: false, dependencies: ['Config', 'Utils'] },
        Storage: { required: true, loaded: false, initialized: false, dependencies: ['Config', 'State', 'Utils'] },
        UI: { required: true, loaded: false, initialized: false, dependencies: ['Config', 'State', 'Utils', 'EventBus'] },
        AudioManager: { required: false, loaded: false, initialized: false, dependencies: ['Config', 'EventBus'] },
        Gems: { required: true, loaded: false, initialized: false, dependencies: ['Config', 'State', 'Utils', 'EventBus'] },
        Battle: { required: true, loaded: false, initialized: false, dependencies: ['Config', 'State', 'Gems', 'UI', 'Utils', 'EventBus'] },
        Shop: { required: true, loaded: false, initialized: false, dependencies: ['Config', 'State', 'Gems', 'UI', 'Utils', 'EventBus'] },
        ScreenTransitions: { required: false, loaded: false, initialized: false, dependencies: ['UI', 'State', 'Storage', 'EventBus'] },
        GameDiagnostics: { required: false, loaded: false, initialized: false, dependencies: ['EventBus'] },
        Game: { required: true, loaded: false, initialized: false, dependencies: ['Config', 'State', 'UI', 'AudioManager', 'Gems', 'Battle', 'Shop', 'Storage', 'EventBus'] }
    };

    // ... (keep existing loader functions) ...

    // Add this new method for EventBus initialization
    function initializeEventBusFirst() {
        if (typeof EventBus !== 'undefined') {
            modules.EventBus.loaded = true;
            modules.EventBus.initialized = true;
            console.log("EventBus pre-initialized successfully");
            return true;
        }
        return false;
    }

    // Modify initializeAllModules to handle EventBus first
    function initializeAllModules() {
        console.log("Initializing with EventBus architecture");
        
        // Special initialization for EventBus
        if (!initializeEventBusFirst()) {
            console.error("CRITICAL: EventBus not found");
            return false;
        }

        // Proceed with normal initialization
        const initOrder = calculateInitializationOrder();
        let success = true;
        
        initOrder.forEach(moduleName => {
            if (moduleName !== 'EventBus') { // Skip EventBus as it's already initialized
                if (!initializeModule(moduleName)) {
                    success = false;
                }
            }
        });
        
        return success;
    }

    return {
        initializeAllModules,
        initializeModule,
        isModuleLoaded,
        getModuleStatus,
        getErrors,
        areCriticalModulesInitialized
    };
})();