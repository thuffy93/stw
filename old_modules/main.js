            // ===================================================
            // GAME MODULE - Integrated initialization and lifecycle management
            // ===================================================
            const Game = (() => {
                // Track initialization status
                let initialized = false;
                
                // Critical game components that must be verified
                const criticalComponents = [
                    { name: 'State', check: () => typeof State !== 'undefined' && State.get && State.set },
                    { name: 'UI', check: () => typeof UI !== 'undefined' && UI.initialize && UI.switchScreen },
                    { name: 'EventHandler', check: () => typeof EventHandler !== 'undefined' && EventHandler.initialize },
                    { name: 'Gems', check: () => typeof Gems !== 'undefined' && Gems.resetGemBag },
                    { name: 'Battle', check: () => typeof Battle !== 'undefined' && Battle.startBattle },
                    { name: 'Shop', check: () => typeof Shop !== 'undefined' && Shop.prepareShop }
                ];
                
                /**
                 * Check if all critical game components are available
                 * @returns {Boolean} Whether all components are ready
                 */
                function checkComponentsReady() {
                    const missingComponents = criticalComponents.filter(comp => !comp.check());
                    
                    if (missingComponents.length > 0) {
                        console.warn("Missing critical components:", 
                            missingComponents.map(comp => comp.name).join(', '));
                        return false;
                    }
                    
                    return true;
                }
                
                /**
                 * Register a custom button binding for the continue journey button
                 * This is integrated into the initialization process
                 */
                function registerJourneyButtonBinding() {
                    // Define the startJourney function globally
                    window.startJourney = function() {
                        console.log("Starting journey via integrated function");
                        
                        // Show a loading message
                        UI.showMessage("Starting your adventure...");
                        
                        // Use setTimeout to ensure UI updates properly
                        setTimeout(() => {
                            console.log("Preparing gem bag and battle");
                            
                            try {
                                // Reset gem bag and start battle
                                Gems.resetGemBag(true);
                                Battle.startBattle();
                                
                                // Switch to the battle screen
                                console.log("Transitioning to battle screen");
                                UI.switchScreen('battle');
                            } catch (error) {
                                console.error("Error starting journey:", error);
                                UI.showMessage("Error starting journey. Try again.", "error");
                            }
                        }, 100);
                    };
                    
                    // Extend the UI.switchScreen function to handle the button specially
                    const originalSwitchScreen = UI.switchScreen;
                    UI.switchScreen = function(screenName) {
                        // Call the original function first
                        originalSwitchScreen(screenName);
                        
                        // Add special handling for gem catalog screen
                        if (screenName === 'gemCatalog') {
                            console.log("Enhancing gem catalog screen with direct button binding");
                            
                            setTimeout(() => {
                                const continueBtn = document.getElementById('continue-journey-btn');
                                if (continueBtn) {
                                    console.log("Found continue-journey-btn, attaching integrated handler");
                                    
                                    // Clear existing handlers
                                    continueBtn.onclick = null;
                                    
                                    // Set the direct handler with a clear debug message
                                    continueBtn.onclick = function() {
                                        console.log("continue-journey-btn clicked (integrated handler)");
                                        startJourney();
                                    };
                                } else {
                                    console.warn("continue-journey-btn not found after switch to gemCatalog");
                                }
                            }, 50);
                        }
                    };
                    
                    // Also assign the function to EventHandler for module-level access
                    if (EventHandler) {
                        EventHandler.startJourney = window.startJourney;
                    }
                }
                
                /**
                 * Initialize the game with integrated initialization tracking
                 */
                function initialize() {
                    if (initialized) {
                        console.warn("Game already initialized, skipping");
                        return;
                    }
                    
                    console.log("Initializing Super Tiny World with integrated approach...");
                    
                    try {
                        // First verify all critical components are available
                        if (!checkComponentsReady()) {
                            console.error("Critical components missing, cannot initialize game");
                            return false;
                        }
                        
                        // Register the custom journey button handling
                        registerJourneyButtonBinding();
                        
                        // Initialize core systems in sequence
                        UI.initialize();
                        AudioManager.initialize();
                        Storage.loadAllSavedData();
                        
                        // Set up event handlers
                        EventHandler.initialize();
                        
                        // Start at character selection screen
                        UI.switchScreen('characterSelect');
                        
                        // Hide loading screen if present
                        if (UI.hideLoading) {
                            UI.hideLoading();
                        }
                        
                        // Mark initialization as complete
                        initialized = true;
                        console.log("Game initialized successfully with integrated approach");
                        
                        return true;
                    } catch (error) {
                        console.error("Error during game initialization:", error);
                        alert("Failed to initialize game. Please refresh the page.");
                        return false;
                    }
                }
                
                /**
                 * Reset the game state (for testing)
                 */
                function reset() {
                    if (!initialized) {
                        console.warn("Game not yet initialized, cannot reset");
                        return;
                    }
                    
                    // Reset state
                    State.set('currentScreen', 'characterSelect');
                    State.set('battleOver', false);
                    State.set('selectedGems', new Set());
                    
                    // Reset UI
                    UI.switchScreen('characterSelect');
                    
                    console.log("Game reset complete");
                }
                
                // Public interface
                return {
                    initialize,
                    reset
                };
            })();

            // Set up initialization to happen after DOM is loaded
            document.addEventListener('DOMContentLoaded', function() {
                console.log("DOM content loaded, initializing game");
                Game.initialize();
            });

            // Backup initialization for older browsers or if DOMContentLoaded already fired
            if (document.readyState === 'interactive' || document.readyState === 'complete') {
                console.log("Document already interactive/complete, initializing game");
                setTimeout(Game.initialize, 100);
            }