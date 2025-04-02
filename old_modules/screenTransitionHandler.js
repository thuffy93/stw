            // ===================================================
            // SCREEN TRANSITION HANDLER - Manages screen transitions and critical button bindings
            // ===================================================
            const ScreenTransitions = (() => {
                // Keep track of which screens have been initialized
                const initializedScreens = new Set();
                
                /**
                 * Initialize screen transition handlers
                 */
                function initialize() {
                    // Set up the transition hook on the UI module
                    if (UI && UI.switchScreen) {
                        const originalSwitchScreen = UI.switchScreen;
                        
                        // Override the switchScreen function with our enhanced version
                        UI.switchScreen = function(screenName) {
                            console.log(`Enhanced screen transition to: ${screenName}`);
                            
                            // Handle pre-transition logic
                            handlePreTransition(screenName);
                            
                            // Call the original function
                            originalSwitchScreen(screenName);
                            
                            // Handle post-transition logic
                            handlePostTransition(screenName);
                        };
                        
                        console.log("Enhanced screen transition handlers installed");
                    } else {
                        console.error("UI.switchScreen not available, transition enhancement failed");
                    }
                }
                
                /**
                 * Handle logic before transitioning to a new screen
                 * @param {String} targetScreen - Screen we're transitioning to
                 */
                function handlePreTransition(targetScreen) {
                    const currentScreen = State.get('currentScreen');
                    console.log(`Pre-transition from ${currentScreen} to ${targetScreen}`);
                    
                    // Save hand state when leaving battle or shop
                    if (currentScreen === 'battle' || currentScreen === 'shop') {
                        console.log("Saving hand state during transition");
                        if (Storage && Storage.saveHandState) {
                            Storage.saveHandState();
                        } else {
                            // Fallback direct localStorage save
                            try {
                                const hand = State.get('hand');
                                localStorage.setItem('stw_temp_hand', JSON.stringify(hand));
                            } catch (e) {
                                console.error("Error in fallback hand save:", e);
                            }
                        }
                    }
                }
                
                /**
                 * Handle logic after transitioning to a new screen
                 * @param {String} screenName - Screen we've transitioned to
                 */
                function handlePostTransition(screenName) {
                    console.log(`Post-transition to ${screenName}`);
                    
                    // Bind the Continue to Journey button when we enter the gem catalog
                    if (screenName === 'gemCatalog') {
                        setTimeout(bindContinueJourneyButton, 50);
                        
                        // Mark as initialized
                        initializedScreens.add(screenName);
                    }
                    
                    // Load hand state when entering battle or shop
                    if ((screenName === 'battle' || screenName === 'shop') && !initializedScreens.has(screenName)) {
                        console.log(`First transition to ${screenName}, checking for saved hand`);
                        
                        if (Storage && Storage.loadHandState) {
                            Storage.loadHandState();
                        } else {
                            // Fallback direct localStorage load
                            try {
                                const savedHand = localStorage.getItem('stw_temp_hand');
                                if (savedHand) {
                                    const hand = JSON.parse(savedHand);
                                    if (Array.isArray(hand) && hand.length > 0) {
                                        State.set('hand', hand);
                                    }
                                }
                            } catch (e) {
                                console.error("Error in fallback hand load:", e);
                            }
                        }
                        
                        // Mark as initialized
                        initializedScreens.add(screenName);
                    }
                    
                    // Update UI based on the screen
                    updateScreenUI(screenName);
                }
                
                /**
                 * Bind the Continue to Journey button in the gem catalog
                 */
                function bindContinueJourneyButton() {
                    const continueBtn = document.getElementById('continue-journey-btn');
                    if (!continueBtn) {
                        console.warn("Continue to Journey button not found");
                        return false;
                    }
                    
                    console.log("Found continue-journey-btn, attaching handler");
                    
                    // Clear existing onclick handler
                    continueBtn.onclick = null;
                    
                    // Explicitly define startJourney if it doesn't exist
                    if (typeof window.startJourney !== 'function') {
                        window.startJourney = function() {
                            console.log("Starting journey (defined by ScreenTransitions)");
                            
                            try {
                                // Show loading message
                                UI.showMessage("Starting your adventure...");
                                
                                setTimeout(() => {
                                    console.log("Preparing gem bag and battle");
                                    // Reset gem bag and start battle
                                    Gems.resetGemBag(true);
                                    Battle.startBattle();
                                    
                                    // Switch to battle screen
                                    console.log("Transitioning to battle screen");
                                    UI.switchScreen('battle');
                                }, 100);
                            } catch (error) {
                                console.error("Error starting journey:", error);
                                UI.showMessage("Error starting journey. Try again.", "error");
                            }
                        };
                        
                        // Add to EventHandler for consistency
                        if (EventHandler) {
                            EventHandler.startJourney = window.startJourney;
                        }
                    }
                    
                    // Set new handler with explicit binding
                    continueBtn.onclick = function() {
                        console.log("continue-journey-btn clicked (ScreenTransitions handler)");
                        window.startJourney();
                    };
                    
                    // Verify handler attachment
                    if (typeof continueBtn.onclick !== 'function') {
                        console.error("Failed to attach onclick handler, trying addEventListener");
                        continueBtn.addEventListener('click', function() {
                            console.log("continue-journey-btn click listener (fallback)");
                            window.startJourney();
                        });
                    }
                    
                    return true;
                }
                
                /**
                 * Update UI for the specified screen
                 * @param {String} screenName - Screen name
                 */
                function updateScreenUI(screenName) {
                    if (screenName === 'battle') {
                        if (UI && UI.updateBattleScreen) {
                            UI.updateBattleScreen();
                        }
                    } else if (screenName === 'shop') {
                        if (UI && UI.updateShopScreen) {
                            UI.updateShopScreen();
                        }
                    } else if (screenName === 'gemCatalog') {
                        if (UI && UI.updateGemCatalogScreen) {
                            UI.updateGemCatalogScreen();
                        }
                    } else if (screenName === 'camp') {
                        if (UI && UI.updateCampScreen) {
                            UI.updateCampScreen();
                        }
                    }
                }
                
                /**
                 * Reset initialization status (for testing)
                 */
                function resetInitialization() {
                    initializedScreens.clear();
                }
                
                // Return public methods
                return {
                    initialize,
                    bindContinueJourneyButton,
                    resetInitialization
                };
            })();