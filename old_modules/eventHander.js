            // ===================================================
            // EVENT HANDLER MODULE - Standardized button handling
            // ===================================================
            const EventHandler = (() => {
                /**
                 * Initialize all event handlers
                 */
                function initialize() {
                    console.log("Initializing EventHandler with improved binding strategy");
                    setupButtonHandlers();
                    setupKeyboardHandlers();
                    setupAutoSave();
                }

                /**
                 * Safely attach an event handler to an element
                 * @param {string} elementId - ID of the element to attach handler to
                 * @param {string} eventName - Name of the event (e.g., 'click')
                 * @param {Function} handler - Event handler function
                 * @param {boolean} debug - Whether to log debug information
                 * @returns {boolean} Success or failure of binding
                 */
                function bindEvent(elementId, eventName, handler, debug = true) {
                    try {
                        const element = document.getElementById(elementId);
                        if (!element) {
                            if (debug) console.warn(`Element with ID '${elementId}' not found for binding`);
                            return false;
                        }
                        
                        // Clear previous handlers by setting to null first
                        if (eventName === 'click') {
                            element.onclick = null;
                        }
                        
                        // Set new handler
                        if (eventName === 'click') {
                            element.onclick = function(event) {
                                if (debug) console.log(`Click event on ${elementId}`);
                                return handler(event);
                            };
                        } else {
                            // For other event types, use standard event listener
                            element.addEventListener(eventName, function(event) {
                                if (debug) console.log(`${eventName} event on ${elementId}`);
                                return handler(event);
                            });
                        }
                        
                        if (debug) console.log(`Successfully bound ${eventName} handler to ${elementId}`);
                        return true;
                    } catch (error) {
                        console.error(`Error binding ${eventName} to ${elementId}:`, error);
                        return false;
                    }
                }

                /**
                 * Set up all button handlers with consistent binding
                 */
                function setupButtonHandlers() {
                    console.log("Setting up button handlers with standardized binding strategy");
                    
                    // Character selection
                    bindEvent('knight-btn', 'click', () => selectClass('Knight'));
                    bindEvent('mage-btn', 'click', () => selectClass('Mage'));
                    bindEvent('rogue-btn', 'click', () => selectClass('Rogue'));
                    bindEvent('reset-btn', 'click', resetMetaProgression);
                    
                    // Gem catalog - critical for game progression
                    const journeyResult = bindEvent('continue-journey-btn', 'click', startJourney, true);
                    if (!journeyResult) {
                        console.error("CRITICAL: Failed to bind handler to continue-journey-btn");
                        
                        // Additional diagnostics
                        const btn = document.getElementById('continue-journey-btn');
                        if (btn) {
                            console.log("continue-journey-btn exists but binding failed. Current state:", btn);
                            
                            // Force direct binding as fallback
                            console.log("Applying emergency direct binding to continue-journey-btn");
                            btn.onclick = function() {
                                console.log("Emergency continue-journey-btn handler triggered");
                                startJourney();
                            };
                        }
                    }
                    
                    // Battle screen
                    bindEvent('execute-btn', 'click', executeGems);
                    bindEvent('wait-btn', 'click', waitTurn);
                    bindEvent('discard-end-btn', 'click', discardAndEndTurn);
                    bindEvent('end-turn-btn', 'click', endTurn);
                    bindEvent('flee-btn', 'click', fleeBattle);
                    
                    // Shop screen
                    bindEvent('buy-random-gem', 'click', buyRandomGem);
                    bindEvent('discard-gem', 'click', discardSelectedGem); 
                    bindEvent('upgrade-gem', 'click', upgradeSelectedGem);
                    bindEvent('cancel-upgrade', 'click', cancelUpgrade);
                    bindEvent('heal-10', 'click', healInShop);
                    bindEvent('continue-btn', 'click', continueFromShop);
                    
                    // Camp screen
                    bindEvent('withdraw-btn', 'click', withdrawZenny);
                    bindEvent('deposit-btn', 'click', depositZenny);
                    bindEvent('next-day-btn', 'click', startNextDay);
                    
                    console.log("Button handler setup complete");
                    
                    // Debug tool to check button bindings
                    if (typeof window !== 'undefined') {
                        window.checkButtonBindings = function() {
                            const buttons = document.querySelectorAll('button');
                            console.log(`Found ${buttons.length} buttons in DOM:`);
                            
                            buttons.forEach(btn => {
                                const id = btn.id || "(no id)";
                                const hasClick = typeof btn.onclick === 'function';
                                const text = btn.textContent || "(no text)";
                                
                                console.log(`Button ${id} "${text.trim()}": ${hasClick ? 'has' : 'NO'} click handler`);
                                
                                // Test if the button is really clickable
                                const isVisible = btn.offsetParent !== null;
                                const isDisabled = btn.disabled;
                                console.log(`  Clickable: ${isVisible && !isDisabled}`);
                            });
                        };
                    }
                }

                /**
                 * Setup keyboard event handlers
                 */
                function setupKeyboardHandlers() {
                    document.addEventListener('keydown', function(event) {
                        const currentScreen = State.get('currentScreen');
                        
                        if (currentScreen === 'battle') {
                            // Battle screen shortcuts
                            switch (event.key) {
                                case ' ': // Space key
                                    executeGems();
                                    break;
                                case 'e':
                                    endTurn();
                                    break;
                                case 'w':
                                    waitTurn();
                                    break;
                                case 'd':
                                    discardAndEndTurn();
                                    break;
                                case 'f':
                                    fleeBattle();
                                    break;
                            }
                        } else if (currentScreen === 'shop') {
                            // Shop screen shortcuts
                            switch (event.key) {
                                case 'c':
                                    continueFromShop();
                                    break;
                                case 'h':
                                    healInShop();
                                    break;
                            }
                        }
                    });
                }

                /**
                 * Setup auto-save functionality
                 */
                function setupAutoSave() {
                    // Save every 30 seconds
                    setInterval(() => {
                        // Only auto-save if player has a class set
                        if (State.get('player.class')) {
                            Storage.saveGameState();
                        }
                    }, 30000);
                    
                    // Save when page is unloaded
                    window.addEventListener('beforeunload', () => {
                        // Only save if player has a class set
                        if (State.get('player.class')) {
                            Storage.saveGameState();
                        }
                    });
                }

                /**
                 * Select a character class
                 */
                function selectClass(className) {
                    console.log(`Selecting class: ${className}`);
                    // Reset player stats
                    State.resetPlayerStats(className);
                    Gems.resetGemBag(true);
                    
                    // Save class selection
                    Storage.saveGameState();
                    
                    // Navigate to gem catalog
                    UI.switchScreen('gemCatalog');
                }
                
                /**
                 * Start the journey (from gem catalog to battle)
                 */
                function startJourney() {
                    console.log("Starting journey - EventHandler.startJourney called");
                    
                    try {
                        // Show loading message
                        UI.showMessage("Starting your adventure...");
                        
                        // Log current game state for debugging
                        console.log("Current player class:", State.get('player.class'));
                        console.log("Current screen before journey:", State.get('currentScreen'));
                        
                        // Use setTimeout to ensure UI updates properly
                        setTimeout(() => {
                            console.log("Preparing gem bag and battle");
                            // Reset gem bag and start battle
                            Gems.resetGemBag(true);
                            Battle.startBattle();
                            
                            // Explicitly switch to the battle screen
                            console.log("Transitioning to battle screen");
                            UI.switchScreen('battle');
                        }, 100);
                    } catch (error) {
                        console.error("Error starting journey:", error);
                        UI.showMessage("Error starting journey. Try again.", "error");
                    }
                }
                
                /**
                 * Execute selected gems in battle
                 */
                function executeGems() {
                    Battle.executeSelectedGems();
                }
                
                /**
                 * Wait for a turn (gain focus)
                 */
                function waitTurn() {
                    Battle.waitTurn();
                }
                
                /**
                 * Discard selected gems and end turn
                 */
                function discardAndEndTurn() {
                    Battle.discardAndEnd();
                }
                
                /**
                 * End the current turn
                 */
                function endTurn() {
                    Battle.endTurn();
                }
                
                /**
                 * Flee from battle
                 */
                function fleeBattle() {
                    Battle.fleeBattle();
                }
                
                /**
                 * Toggle gem selection
                 * @param {Number} index - Index of the gem in the hand
                 * @param {Boolean} isShop - Whether this is in the shop context
                 */
                function toggleGemSelection(index, isShop = false) {
                    console.log(`Toggling gem selection: index=${index}, isShop=${isShop}`);
                    const hand = State.get('hand');
                    let selectedGems = State.get('selectedGems');
                    
                    // Validate the index
                    if (index < 0 || index >= hand.length || !hand[index]) {
                        console.warn("Invalid gem selection attempted:", index);
                        State.set('selectedGems', new Set());
                        if (isShop) {
                            UI.renderShopHand();
                            UI.updateShopScreen();
                        } else {
                            UI.renderHand();
                            UI.updateBattleScreen();
                        }
                        return;
                    }
                    
                    // In shop, only allow selecting one gem at a time
                    if (isShop) {
                        selectedGems = selectedGems.has(index) ? new Set() : new Set([index]);
                    } else {
                        // In battle, allow multiple selection
                        if (selectedGems.has(index)) {
                            selectedGems.delete(index);
                        } else {
                            selectedGems.add(index);
                        }
                    }
                    
                    // Update state
                    State.set('selectedGems', selectedGems);
                    
                    // Update UI
                    if (isShop) {
                        UI.renderShopHand();
                        UI.updateShopScreen();
                    } else {
                        UI.renderHand();
                        UI.updateBattleScreen();
                    }
                }
                
                /**
                 * Unlock a gem in the catalog
                 * @param {String} gemKey - Key of the gem to unlock
                 * @param {Number} index - Index in available gems
                 */
                function unlockGem(gemKey, index) {
                    const metaZenny = State.get('metaZenny');
                    const gemCatalog = State.get('gemCatalog');
                    const playerClass = State.get('player.class');
                    
                    // Check if player can afford it
                    if (metaZenny < 50) {
                        UI.showMessage("Not enough Meta $ZENNY!", "error");
                        return;
                    }
                    
                    // Check if gem is valid
                    const gem = Config.BASE_GEMS[gemKey];
                    if (!gem) {
                        UI.showMessage("Invalid gem!", "error");
                        return;
                    }
                    
                    // Deduct zenny
                    State.set('metaZenny', metaZenny - 50);
                    
                    // Add to unlocked gems and remove from available
                    const unlocked = [...gemCatalog.unlocked, gemKey];
                    const available = gemCatalog.available.filter(key => key !== gemKey);
                    
                    // Update gem catalog
                    State.set('gemCatalog.unlocked', unlocked);
                    State.set('gemCatalog.available', available);
                    
                    // Update class-specific catalog
                    State.set(`classGemCatalogs.${playerClass}.unlocked`, unlocked);
                    State.set(`classGemCatalogs.${playerClass}.available`, available);
                    
                    // Save changes
                    Storage.saveMetaZenny();
                    Storage.saveGemUnlocks();
                    
                    // Show success message
                    UI.showMessage(`Unlocked ${gem.name}! Available as upgrade in shop.`);
                    
                    // Update UI
                    UI.updateGemCatalogScreen();
                }
                
                /**
                 * Buy a random gem in the shop
                 */
                function buyRandomGem() {
                    Shop.buyRandomGem();
                }
                
                /**
                 * Discard a selected gem in the shop
                 */
                function discardSelectedGem() {
                    Shop.discardSelectedGem();
                }
                
                /**
                 * Upgrade a selected gem in the shop
                 */
                function upgradeSelectedGem() {
                    Shop.initiateGemUpgrade();
                }
                
                /**
                 * Select an upgrade option in the shop
                 * @param {Number} poolIndex - Index of the upgrade option
                 */
                function selectUpgradeOption(poolIndex) {
                    Shop.selectUpgradeOption(poolIndex);
                }
                
                /**
                 * Cancel a gem upgrade in the shop
                 */
                function cancelUpgrade() {
                    Shop.cancelUpgrade();
                }
                
                /**
                 * Heal in the shop
                 */
                function healInShop() {
                    Shop.healTen();
                }
                
                /**
                 * Continue from shop to next battle
                 */
                function continueFromShop() {
                    Battle.startBattle();
                    UI.switchScreen('battle');
                }
                
                /**
                 * Withdraw zenny to meta wallet
                 */
                function withdrawZenny() {
                    const withdrawAmount = document.getElementById('withdraw-amount');
                    const amount = parseInt(withdrawAmount.value);
                    const player = State.get('player');
                    
                    if (isNaN(amount) || amount <= 0) {
                        UI.showMessage("Enter a valid amount to withdraw!", "error");
                        return;
                    }
                    
                    if (amount > player.zenny) {
                        UI.showMessage("Not enough $ZENNY in Journey Wallet!", "error");
                        return;
                    }
                    
                    // Transfer zenny
                    State.set('player.zenny', player.zenny - amount);
                    const metaZenny = State.get('metaZenny');
                    State.set('metaZenny', metaZenny + amount);
                    
                    // Save changes
                    Storage.saveMetaZenny();
                    Storage.saveGameState();
                    
                    // Show success message
                    UI.showMessage(`Withdrew ${amount} $ZENNY to Meta Wallet!`);
                    
                    // Update UI
                    UI.updateCampScreen();
                }
                
                /**
                 * Deposit zenny from meta wallet
                 */
                function depositZenny() {
                    const depositAmount = document.getElementById('deposit-amount');
                    const amount = parseInt(depositAmount.value);
                    const metaZenny = State.get('metaZenny');
                    
                    if (isNaN(amount) || amount <= 0) {
                        UI.showMessage("Enter a valid amount to deposit!", "error");
                        return;
                    }
                    
                    if (amount > metaZenny) {
                        UI.showMessage("Not enough $ZENNY in Meta Wallet!", "error");
                        return;
                    }
                    
                    // Transfer zenny
                    State.set('metaZenny', metaZenny - amount);
                    const player = State.get('player');
                    State.set('player.zenny', player.zenny + amount);
                    
                    // Save changes
                    Storage.saveMetaZenny();
                    Storage.saveGameState();
                    
                    // Show success message
                    UI.showMessage(`Deposited ${amount} $ZENNY to Journey Wallet!`);
                    
                    // Update UI
                    UI.updateCampScreen();
                }
                
                /**
                 * Start the next day
                 */
                function startNextDay() {
                    const currentGemBag = State.get('gemBag');
                    const currentHand = State.get('hand');
                    const currentDiscard = State.get('discard');
                    
                    // Reset player buffs and stamina
                    State.set('player.buffs', []);
                    State.set('player.stamina', State.get('player.baseStamina'));
                    State.set('player.health', State.get('player.maxHealth'));
                    
                    // Combine all gems
                    const allGems = [...currentHand, ...currentDiscard, ...currentGemBag];
                    
                    // Reset hand and discard
                    State.set('hand', []);
                    State.set('discard', []);
                    State.set('gemBag', Utils.shuffle(allGems));
                    
                    // Start battle
                    Battle.startBattle();
                    UI.switchScreen('battle');
                }
                
                /**
                 * Reset meta progression
                 */
                function resetMetaProgression() {
                    if (confirm("Are you sure you want to reset all meta-progression? This will clear Meta $ZENNY, unlocked gems, and proficiency.")) {
                        Storage.resetMetaProgression();
                    }
                }

                // Return public methods
                return {
                    initialize,
                    setupButtonHandlers,
                    selectClass,
                    startJourney,
                    executeGems,
                    waitTurn,
                    discardAndEndTurn,
                    endTurn,
                    fleeBattle,
                    toggleGemSelection,
                    unlockGem,
                    selectUpgradeOption,
                    buyRandomGem,
                    discardSelectedGem,
                    upgradeSelectedGem,
                    cancelUpgrade,
                    healInShop,
                    continueFromShop,
                    withdrawZenny,
                    depositZenny,
                    startNextDay,
                    resetMetaProgression
                };
            })();