            // ===================================================
            // MODULE LOADER - Manages module loading and initialization
            // ===================================================
            const ModuleLoader = (() => {
                // Track module status
                const modules = {
                    Config: { required: true, loaded: false, initialized: false, dependencies: [] },
                    Utils: { required: true, loaded: false, initialized: false, dependencies: ['Config'] },
                    State: { required: true, loaded: false, initialized: false, dependencies: ['Config', 'Utils'] },
                    Storage: { required: true, loaded: false, initialized: false, dependencies: ['Config', 'State', 'Utils'] },
                    UI: { required: true, loaded: false, initialized: false, dependencies: ['Config', 'State', 'Utils'] },
                    AudioManager: { required: false, loaded: false, initialized: false, dependencies: ['Config'] },
                    Gems: { required: true, loaded: false, initialized: false, dependencies: ['Config', 'State', 'Utils'] },
                    Battle: { required: true, loaded: false, initialized: false, dependencies: ['Config', 'State', 'Gems', 'UI', 'Utils'] },
                    Shop: { required: true, loaded: false, initialized: false, dependencies: ['Config', 'State', 'Gems', 'UI', 'Utils'] },
                    EventHandler: { required: true, loaded: false, initialized: false, dependencies: ['Config', 'State', 'UI', 'Battle', 'Shop', 'Utils'] },
                    ScreenTransitions: { required: false, loaded: false, initialized: false, dependencies: ['UI', 'State', 'Storage'] },
                    GameDiagnostics: { required: false, loaded: false, initialized: false, dependencies: [] },
                    Game: { required: true, loaded: false, initialized: false, dependencies: ['Config', 'State', 'UI', 'AudioManager', 'Gems', 'Battle', 'Shop', 'EventHandler', 'Storage'] }
                };
                
                // Track initialization errors
                const errors = [];
                
                /**
                 * Check if a module is loaded
                 * @param {String} moduleName - Name of the module
                 * @returns {Boolean} Whether module is loaded
                 */
                function isModuleLoaded(moduleName) {
                    if (!modules[moduleName]) return false;
                    
                    return typeof window[moduleName] !== 'undefined';
                }
                
                /**
                 * Mark a module as loaded
                 * @param {String} moduleName - Name of the module
                 */
                function markModuleLoaded(moduleName) {
                    if (!modules[moduleName]) return;
                    
                    modules[moduleName].loaded = true;
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
                            console.log(`Module initialized: ${moduleName}`);
                            return true;
                        } else {
                            // No initialize method, just mark as initialized
                            modules[moduleName].initialized = true;
                            console.log(`Module marked as initialized (no initialize method): ${moduleName}`);
                            return true;
                        }
                    } catch (error) {
                        console.error(`Error initializing module ${moduleName}:`, error);
                        errors.push({ module: moduleName, error: error.message });
                        return false;
                    }
                }
                
                /**
                 * Initialize all modules in the correct order
                 */
                function initializeAllModules() {
                    console.log("Initializing all modules in dependency order");
                    
                    // First check if all required modules are loaded
                    const missingModules = [];
                    Object.entries(modules).forEach(([name, info]) => {
                        if (info.required && !isModuleLoaded(name)) {
                            missingModules.push(name);
                            markModuleLoaded(name); // Mark as loaded as a fallback (it will still show in errors)
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
                        
                        // Show error if UI is available
                        if (typeof UI !== 'undefined' && UI.showError) {
                            UI.showError(`Required modules missing: ${missingModules.join(', ')}`, true);
                        } else {
                            // Fallback to alert
                            alert(`Error: Required modules missing (${missingModules.join(', ')}). Please refresh the page.`);
                        }
                        
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
                        
                        // Show error if UI is available
                        if (typeof UI !== 'undefined' && UI.showError) {
                            UI.showError("Some modules failed to initialize. Check the console for details.", true);
                        }
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
                    
                    // Visit all modules
                    Object.keys(modules).forEach(moduleName => visit(moduleName));
                    
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
                    const criticalModules = ['Config', 'State', 'UI', 'EventHandler', 'Game'];
                    
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

            // When the DOM is ready, use the ModuleLoader to initialize all modules
            document.addEventListener('DOMContentLoaded', function() {
                console.log("DOM Content Loaded - Initializing modules");
                ModuleLoader.initializeAllModules();
            });

            // Fallback initialization for older browsers or if DOMContentLoaded already fired
            if (document.readyState === 'interactive' || document.readyState === 'complete') {
                console.log("Document already interactive/complete - Initializing modules");
                setTimeout(ModuleLoader.initializeAllModules, 100);
            }