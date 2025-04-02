            // ===================================================
            // UI MODULE - DOM manipulation and rendering
            // ===================================================
            const UI = (() => {
                // Cache DOM elements
                const elements = {};
                
                /**
                 * Initialize all UI elements
                 */
                function initialize() {
                    // Create a helper function to safely get elements
                    const safeGetElement = (id) => {
                        const element = document.getElementById(id);
                        if (!element) {
                            console.warn(`Element with ID '${id}' not found`);
                        }
                        return element;
                    };

                    // Cache screen elements
                    elements.screens = {
                        characterSelect: safeGetElement('character-select-screen'),
                        gemCatalog: safeGetElement('gem-catalog-screen'),
                        battle: safeGetElement('battle-screen'),
                        shop: safeGetElement('shop-screen'),
                        camp: safeGetElement('camp-screen')
                    };
                    
                    // Cache character select elements
                    elements.characterSelect = {
                        knightBtn: safeGetElement('knight-btn'),
                        mageBtn: safeGetElement('mage-btn'),
                        rogueBtn: safeGetElement('rogue-btn'),
                        resetBtn: safeGetElement('reset-btn')
                    };
                    
                    // Cache gem catalog elements
                    elements.gemCatalog = {
                        metaZennyDisplay: safeGetElement('meta-zenny-display'),
                        unlockedGems: safeGetElement('unlocked-gems'),
                        availableGems: safeGetElement('available-gems'),
                        continueJourneyBtn: safeGetElement('continue-journey-btn')
                    };
                    
                    // Cache battle elements
                    elements.battle = {
                        dayPhaseIndicator: safeGetElement('day-phase-indicator'),
                        turnIndicator: safeGetElement('turn-indicator'),
                        playerClass: safeGetElement('player-class'),
                        playerHealth: safeGetElement('player-health'),
                        playerMaxHealth: safeGetElement('player-max-health'),
                        playerBuffs: safeGetElement('player-buffs'),
                        staminaFill: safeGetElement('stamina-fill'),
                        staminaText: safeGetElement('stamina-text'),
                        zenny: safeGetElement('zenny'),
                        hand: safeGetElement('hand'),
                        enemyName: safeGetElement('enemy-name'),
                        enemyHealth: safeGetElement('enemy-health'),
                        enemyMaxHealth: safeGetElement('enemy-max-health'),
                        enemyAttack: safeGetElement('enemy-attack'),
                        enemyCondition: safeGetElement('enemy-condition'),
                        enemyBuffs: safeGetElement('enemy-buffs'),
                        enemyActionQueue: safeGetElement('enemy-action-queue'),
                        gemBagCount: safeGetElement('gem-bag-count'),
                        gemBagTotal: safeGetElement('gem-bag-total'),
                        gemBagCount2: safeGetElement('gem-bag-count2'),
                        gemBagTotal2: safeGetElement('gem-bag-total2'),
                        executeBtn: safeGetElement('execute-btn'),
                        waitBtn: safeGetElement('wait-btn'),
                        discardEndBtn: safeGetElement('discard-end-btn'),
                        endTurnBtn: safeGetElement('end-turn-btn'),
                        fleeBtn: safeGetElement('flee-btn'),
                        battleEffects: safeGetElement('battle-effects')
                    };
                    
                    // Cache shop elements
                    elements.shop = {
                        shopHand: safeGetElement('shop-hand'),
                        gemPool: safeGetElement('gem-pool'),
                        gemPoolInstructions: safeGetElement('gem-pool-instructions'),
                        buyRandomGem: safeGetElement('buy-random-gem'),
                        discardGem: safeGetElement('discard-gem'),
                        upgradeGem: safeGetElement('upgrade-gem'),
                        swapGem: safeGetElement('swap-gem'),
                        heal10: safeGetElement('heal-10'),
                        continueBtn: safeGetElement('continue-btn'),
                        shopHealth: safeGetElement('shop-health'),
                        shopMaxHealth: safeGetElement('shop-max-health'),
                        shopZenny: safeGetElement('shop-zenny'),
                        shopGemBagCount: safeGetElement('shop-gem-bag-count'),
                        shopGemBagTotal: safeGetElement('shop-gem-bag-total'),
                        cancelUpgrade: safeGetElement('cancel-upgrade')
                    };
                    
                    // Cache camp elements
                    elements.camp = {
                        campDay: safeGetElement('camp-day'),
                        campZenny: safeGetElement('camp-zenny'),
                        campMetaZenny: safeGetElement('camp-meta-zenny'),
                        withdrawAmount: safeGetElement('withdraw-amount'),
                        withdrawBtn: safeGetElement('withdraw-btn'),
                        depositAmount: safeGetElement('deposit-amount'),
                        depositBtn: safeGetElement('deposit-btn'),
                        nextDayBtn: safeGetElement('next-day-btn')
                    };
                    
                    // Initialize system elements last
                    elements.system = {};
                    
                    // Cache system elements one by one with safety checks
                    const messageEl = safeGetElement('message');
                    if (messageEl) elements.system.message = messageEl;
                    
                    const audioButton = safeGetElement('audio-button');
                    if (audioButton) elements.system.audioButton = audioButton;
                    
                    const loadingOverlay = safeGetElement('loading-overlay');
                    if (loadingOverlay) elements.system.loadingOverlay = loadingOverlay;
                    
                    const errorOverlay = safeGetElement('error-overlay');
                    if (errorOverlay) {
                        elements.system.errorOverlay = errorOverlay;
                        
                        const errorMessage = errorOverlay.querySelector('.error-message');
                        if (errorMessage) elements.system.errorMessage = errorMessage;
                        
                        const errorClose = errorOverlay.querySelector('.error-close');
                        if (errorClose) elements.system.errorClose = errorClose;
                    }
                }

                /**
                 * Switch between game screens with improved button handling
                 */
                function switchScreen(screenName) {
                    console.log(`Switching to screen: ${screenName}`);
                    
                    // Hide all screens
                    Object.values(elements.screens).forEach(screen => {
                        if (screen) screen.classList.remove('active');
                    });
                    
                    // Show the target screen
                    const targetScreen = elements.screens[screenName];
                    if (targetScreen) {
                        targetScreen.classList.add('active');
                        
                        // Update state
                        State.set('currentScreen', screenName);
                        
                        // Perform screen-specific updates based on the target screen
                        switch (screenName) {
                            case 'characterSelect':
                                updateCharacterSelectScreen();
                                break;
                            case 'gemCatalog':
                                updateGemCatalogScreen();
                                break;
                            case 'battle':
                                updateBattleScreen();
                                break;
                            case 'shop':
                                updateShopScreen();
                                break;
                            case 'camp':
                                updateCampScreen();
                                break;
                        }
                        
                        // Special handling for gem catalog screen - critical for progression
                        if (screenName === 'gemCatalog') {
                            console.log("Applying special binding for gem catalog screen");
                            const continueBtn = document.getElementById('continue-journey-btn');
                            if (continueBtn) {
                                console.log("Direct binding to continue-journey-btn");
                                // Clear any existing handler
                                continueBtn.onclick = null;
                                // Set new handler with debug
                                continueBtn.onclick = function() {
                                    console.log("continue-journey-btn clicked");
                                    if (typeof startJourney === 'function') {
                                        startJourney();
                                    } else if (typeof EventHandler.startJourney === 'function') {
                                        console.log("Using EventHandler.startJourney");
                                        EventHandler.startJourney();
                                    } else {
                                        console.error("startJourney function not found!");
                                        // Emergency fallback
                                        try {
                                            console.log("Attempting emergency battle start");
                                            Gems.resetGemBag(true);
                                            Battle.startBattle();
                                            UI.switchScreen('battle');
                                        } catch (e) {
                                            console.error("Emergency battle start failed:", e);
                                        }
                                    }
                                };
                                console.log("Handler attached to continue-journey-btn");
                            } else {
                                console.error("continue-journey-btn not found when switching to gemCatalog!");
                            }
                        }
                        
                        // Setup event handlers for the new screen
                        setTimeout(() => {
                            if (EventHandler && typeof EventHandler.setupButtonHandlers === 'function') {
                                console.log(`Setting up button handlers for ${screenName} screen`);
                                EventHandler.setupButtonHandlers();
                            }
                        }, 50);
                    } else {
                        console.error(`Target screen "${screenName}" not found`);
                    }
                }

                /**
                 * Show a notification message
                 * @param {String} message - Message to display
                 * @param {String} type - Message type ('success' or 'error')
                 * @param {Number} duration - Time to display message in ms
                 */
                function showMessage(message, type = 'success', duration = 2000) {
                    const messageEl = elements.system.message;
                    
                    if (!messageEl) {
                        console.warn("Message element not found");
                        return;
                    }
                    
                    // Set message content and type
                    messageEl.textContent = message;
                    messageEl.className = '';
                    messageEl.classList.add(type);
                    messageEl.classList.add('visible');
                    
                    // Clear after duration
                    setTimeout(() => {
                        messageEl.classList.remove('visible');
                    }, duration);
                }
                
                /**
                 * Show loading indicator
                 * @param {String} message - Loading message
                 */
                function showLoading(message = 'Loading...') {
                    const loadingEl = elements.system.loadingOverlay;
                    if (!loadingEl) return;
                    
                    const messageEl = loadingEl.querySelector('.loading-message');
                    if (messageEl) {
                        messageEl.textContent = message;
                    }
                    
                    loadingEl.style.display = 'flex';
                }
                
                /**
                 * Hide loading indicator
                 */
                function hideLoading() {
                    if (elements.system.loadingOverlay) {
                        elements.system.loadingOverlay.style.display = 'none';
                    }
                }
                
                /**
                 * Show error message
                 * @param {String} message - Error message
                 * @param {Boolean} isFatal - Whether this is a fatal error
                 */
                function showError(message, isFatal = false) {
                    console.error("Game error:", message);
                    
                    // First try to use the UI error overlay
                    try {
                        const errorEl = elements.system.errorOverlay;
                        
                        if (errorEl) {
                            // Check if we have access to the error message element
                            if (elements.system.errorMessage) {
                                elements.system.errorMessage.textContent = message;
                            } else {
                                // Try to find it directly
                                const messageEl = errorEl.querySelector('.error-message');
                                if (messageEl) {
                                    messageEl.textContent = message;
                                }
                            }
                            
                            // Handle close button
                            const closeBtn = elements.system.errorClose || errorEl.querySelector('.error-close');
                            if (closeBtn) {
                                closeBtn.textContent = isFatal ? 'Restart Game' : 'Continue';
                                
                                // Set up close button
                                closeBtn.onclick = () => {
                                    hideError();
                                    if (isFatal) {
                                        window.location.reload();
                                    }
                                };
                            }
                            
                            errorEl.style.display = 'flex';
                        } else {
                            // Fallback to alert if we don't have error overlay
                            alert(message + (isFatal ? " The game will now reload." : ""));
                            if (isFatal) {
                                window.location.reload();
                            }
                        }
                    } catch (errorHandlingError) {
                        // Last resort fallback
                        console.error("Error while showing error:", errorHandlingError);
                        alert(message);
                    }
                }
                
                /**
                 * Hide error message
                 */
                function hideError() {
                    if (elements.system.errorOverlay) {
                        elements.system.errorOverlay.style.display = 'none';
                    }
                }
                
                /**
                 * Update the character select screen
                 */
                function updateCharacterSelectScreen() {
                    // Implement character select screen updates if needed
                }
                
                /**
                 * Update the gem catalog screen
                 */
                function updateGemCatalogScreen() {
                    const metaZenny = State.get('metaZenny');

                    // Update meta zenny display
                    if (elements.gemCatalog.metaZennyDisplay) {
                        elements.gemCatalog.metaZennyDisplay.textContent = metaZenny;
                    }
                    
                    // Update unlocked gems
                    renderUnlockedGems();
                    
                    // Update available gems
                    renderAvailableGems();
                }
                
                /**
                 * Update the battle screen
                 */
                function updateBattleScreen() {
                    const player = State.get('player');
                    const enemy = State.get('enemy');
                    const currentPhaseIndex = State.get('currentPhaseIndex');
                    const currentDay = State.get('currentDay');
                    const isEnemyTurnPending = State.get('isEnemyTurnPending');
                    const battleOver = State.get('battleOver');
                    const selectedGems = State.get('selectedGems');
                    const hand = State.get('hand');
                    const gemBag = State.get('gemBag');
                    
                    // Update player stats
                    elements.battle.playerClass.textContent = player.class || 'None';
                    elements.battle.playerHealth.textContent = player.health;
                    elements.battle.playerMaxHealth.textContent = player.maxHealth;
                    elements.battle.zenny.textContent = player.zenny;
                    
                    // Update stamina display
                    updateStaminaDisplay(player.stamina, player.baseStamina);
                    
                    // Update gem bag info
                    elements.battle.gemBagCount.textContent = gemBag.length;
                    elements.battle.gemBagTotal.textContent = Config.MAX_GEM_BAG_SIZE;
                    elements.battle.gemBagCount2.textContent = gemBag.length;
                    elements.battle.gemBagTotal2.textContent = Config.MAX_GEM_BAG_SIZE;
                    
                    // Update phase indicator
                    const phaseNames = Config.PHASES;
                    const phaseName = phaseNames[currentPhaseIndex];
                    
                    // Set phase class
                    elements.screens.battle.className = 'screen active ' + phaseName.toLowerCase();
                    
                    // Update day/phase indicator
                    const phaseSymbols = ["☀️", "🌅", "🌙"];
                    elements.battle.dayPhaseIndicator.textContent = `Day ${currentDay} ${phaseSymbols[currentPhaseIndex]}`;
                    
                    // Update turn indicator
                    elements.battle.turnIndicator.textContent = isEnemyTurnPending ? "Enemy Turn" : "Your Turn";
                    elements.battle.turnIndicator.classList.toggle("player", !isEnemyTurnPending);
                    elements.battle.turnIndicator.classList.toggle("enemy", isEnemyTurnPending);
                    
                    // Update enemy stats if enemy exists
                    if (enemy) {
                        elements.battle.enemyName.textContent = enemy.name || "None";
                        elements.battle.enemyHealth.textContent = Math.max(enemy.health || 0, 0);
                        elements.battle.enemyMaxHealth.textContent = enemy.maxHealth || 0;
                        elements.battle.enemyAttack.textContent = enemy.currentAction?.split(" ")[1] || "0";
                        elements.battle.enemyCondition.textContent = enemy.shield ? "Shielded: Use Red Gems to bypass" : "";
                        
                        if (enemy.actionQueue && elements.battle.enemyActionQueue) {
                            elements.battle.enemyActionQueue.textContent = `Next: ${enemy.actionQueue.slice(0, 3).map(action => action.split(" ")[0]).join(", ")}`;
                        }
                    }
                    
                    // Update buffs
                    updateBuffs(player.buffs, enemy ? enemy.buffs : []);
                    
                    // Check if player is stunned
                    const isStunned = player.buffs.some(b => b.type === "stunned");
                    
                    // Update action buttons
                    const canPlayGems = selectedGems.size > 0 && 
                                    Array.from(selectedGems).every(i => hand[i]) &&
                                    player.stamina >= Math.min(...Array.from(selectedGems).map(i => hand[i].cost));
                    elements.battle.executeBtn.disabled = battleOver || !canPlayGems || isEnemyTurnPending || isStunned;
                    elements.battle.waitBtn.disabled = battleOver || isEnemyTurnPending || State.get('hasActedThisTurn') || State.get('hasPlayedGemThisTurn') || isStunned;
                    elements.battle.discardEndBtn.disabled = battleOver || !selectedGems.size || isEnemyTurnPending || State.get('hasActedThisTurn') || isStunned;
                    elements.battle.endTurnBtn.disabled = battleOver || isEnemyTurnPending || isStunned;
                    
                    // Show/hide flee button
                    if (elements.battle.fleeBtn) {
                        elements.battle.fleeBtn.style.display = (currentPhaseIndex < 2 && !battleOver && !isEnemyTurnPending && !isStunned) ? "block" : "none";
                    }
                    
                    // Update hand display
                    renderHand();
                    
                    // Fix UI element placements
                    updateBattleUIPlacements();
                }
                
                /**
                 * Update battle UI element placements
                 */
                function updateBattleUIPlacements() {
                    // Fix Flee button position
                    const fleeBtn = document.getElementById('flee-btn');
                    if (fleeBtn) {
                        fleeBtn.style.position = 'absolute';
                        fleeBtn.style.left = 'calc(310px + 15px)'; // Positioned right after player stats
                        fleeBtn.style.bottom = '40px';
                        fleeBtn.style.zIndex = '95';
                    }
                    
                    // Fix Turn Indicator position
                    const turnIndicator = document.getElementById('turn-indicator');
                    if (turnIndicator) {
                        turnIndicator.style.top = '110px'; // Move it down to avoid overlapping
                    }
                    
                    // Fix Gem Bag position
                    const gemBagContainer = document.getElementById('gem-bag-container');
                    if (gemBagContainer) {
                        gemBagContainer.style.position = 'absolute';
                        gemBagContainer.style.bottom = '20px';
                        gemBagContainer.style.right = '20px';
                        gemBagContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                        gemBagContainer.style.padding = '8px 12px';
                        gemBagContainer.style.borderRadius = '5px';
                        gemBagContainer.style.color = 'white';
                        gemBagContainer.style.fontWeight = 'bold';
                        gemBagContainer.style.zIndex = '90';
                    }
                    
                    // Hide gem bag info under the hand since we have it in the corner now
                    const gemBagInfo = document.getElementById('gem-bag-info');
                    if (gemBagInfo) {
                        gemBagInfo.style.display = 'none';
                    }
                }
                
                /**
                 * Update the shop screen
                 */
                function updateShopScreen() {
                    const player = State.get('player');
                    const inUpgradeMode = State.get('inUpgradeMode');
                    const selectedGems = State.get('selectedGems');
                    const gemBag = State.get('gemBag');
                    const hand = State.get('hand');
                    
                    console.log("UPDATE SHOP SCREEN - CURRENT HAND:", hand);
                    
                    // Update shop stats
                    elements.shop.shopHealth.textContent = player.health;
                    elements.shop.shopMaxHealth.textContent = player.maxHealth;
                    elements.shop.shopZenny.textContent = player.zenny;
                    
                    // Update gem bag info
                    elements.shop.shopGemBagCount.textContent = gemBag.length;
                    elements.shop.shopGemBagTotal.textContent = Config.MAX_GEM_BAG_SIZE;
                    
                    // Handle different shop modes
                    if (inUpgradeMode) {
                        updateShopUpgradeMode();
                    } else {
                        updateShopNormalMode();
                    }
                    
                    // Update healing button state
                    elements.shop.heal10.disabled = player.zenny < 3 || player.health >= player.maxHealth;
                    elements.shop.heal10.title = player.health >= player.maxHealth ? "Already at full health" : 
                                        player.zenny < 3 ? "Not enough $ZENNY (need 3)" : 
                                        "Heal 10 health";
                    
                    // Render shop hand - important to show current hand
                    renderShopHand();
                }
                
                /**
                 * Update shop UI for upgrade mode
                 */
                function updateShopUpgradeMode() {
                    const gemCatalog = State.get('gemCatalog');
                    const hand = State.get('hand');
                    const selectedGems = State.get('selectedGems');
                    
                    // Show gem pool, hide other options
                    elements.shop.gemPool.style.display = 'flex';
                    
                    // Update instructions
                    if (selectedGems.size === 1) {
                        const selectedGem = hand[Array.from(selectedGems)[0]];
                        elements.shop.gemPoolInstructions.textContent = `Choose an upgrade option for your ${selectedGem.color} ${selectedGem.name}:`;
                        elements.shop.gemPoolInstructions.style.fontWeight = 'bold';
                    }
                    
                    // Show cancel button, hide all other buttons
                    elements.shop.cancelUpgrade.style.display = 'block';
                    elements.shop.upgradeGem.style.display = 'none';
                    elements.shop.discardGem.style.display = 'none';
                    elements.shop.buyRandomGem.style.display = 'none';
                    elements.shop.swapGem.style.display = 'none';
                    
                    // Render all upgrade options
                    elements.shop.gemPool.innerHTML = '';
                    gemCatalog.gemPool.forEach((gem, index) => {
                        const gemElement = Gems.createGemElement(gem, index, true);
                        gemElement.onclick = () => EventHandler.selectUpgradeOption(index);
                        elements.shop.gemPool.appendChild(gemElement);
                    });
                }
                
                /**
                 * Update shop UI for normal mode
                 */
                function updateShopNormalMode() {
                    const selectedGems = State.get('selectedGems');
                    const hand = State.get('hand');
                    
                    // Hide gem pool, show normal options
                    elements.shop.gemPool.style.display = 'none';
                    elements.shop.gemPool.innerHTML = '';
                    
                    // Show/hide appropriate buttons
                    elements.shop.cancelUpgrade.style.display = 'none';
                    elements.shop.buyRandomGem.style.display = 'block';
                    elements.shop.upgradeGem.style.display = 'block';
                    elements.shop.discardGem.style.display = 'block';
                    elements.shop.swapGem.style.display = 'none';
                    
                    // Update instructions based on selection
                    if (selectedGems.size === 1) {
                        const selectedGem = hand[Array.from(selectedGems)[0]];
                        elements.shop.gemPoolInstructions.textContent = `Selected: ${selectedGem.color} ${selectedGem.name}`;
                        elements.shop.gemPoolInstructions.style.fontWeight = 'normal';
                    } else {
                        elements.shop.gemPoolInstructions.textContent = 'Select a gem from your hand';
                        elements.shop.gemPoolInstructions.style.fontWeight = 'normal';
                    }
                    
                    updateShopButtonStates();
                }
                
                /**
                 * Update shop button states
                 */
                function updateShopButtonStates() {
                    const player = State.get('player');
                    const selectedGems = State.get('selectedGems');
                    const hand = State.get('hand');
                    const gemCatalog = State.get('gemCatalog');
                    const inUpgradeMode = State.get('inUpgradeMode');
                    
                    // Skip if in upgrade mode
                    if (inUpgradeMode) return;
                    
                    const hasSelection = selectedGems.size > 0;
                    
                    // Update button states
                    elements.shop.upgradeGem.disabled = !hasSelection || player.zenny < 5;
                    elements.shop.discardGem.disabled = !hasSelection || player.zenny < 3;
                    
                    if (hasSelection) {
                        // Additional checks for upgrade eligibility
                        const selectedIndex = Array.from(selectedGems)[0];
                        const selectedGem = hand[selectedIndex];
                        const canUpgrade = selectedGem && 
                                        !selectedGem.freshlySwapped && 
                                        !gemCatalog.upgradedThisShop.has(selectedGem.id);
                        
                        elements.shop.upgradeGem.disabled = !canUpgrade || player.zenny < 5;
                        elements.shop.upgradeGem.title = !canUpgrade ? "Cannot upgrade this gem now" :
                                                player.zenny < 5 ? "Not enough $ZENNY (need 5)" :
                                                "Upgrade selected gem (5 $ZENNY)";
                    }
                    
                    // Update buy random gem button
                    elements.shop.buyRandomGem.disabled = player.zenny < 3;
                    elements.shop.buyRandomGem.title = player.zenny < 3 ? "Not enough $ZENNY" : "Buy random gem for Gem Bag";
                }
                
                /**
                 * Update the camp screen
                 */
                function updateCampScreen() {
                    const currentDay = State.get('currentDay');
                    const player = State.get('player');
                    const metaZenny = State.get('metaZenny');
                    
                    // Update day display
                    elements.camp.campDay.textContent = currentDay;
                    
                    // Update zenny displays
                    elements.camp.campZenny.textContent = player.zenny;
                    elements.camp.campMetaZenny.textContent = metaZenny;
                    
                    // Clear input fields
                    elements.camp.withdrawAmount.value = "";
                    elements.camp.depositAmount.value = "";
                    
                    // Disable buttons if no zenny available
                    elements.camp.withdrawBtn.disabled = player.zenny <= 0;
                    elements.camp.depositBtn.disabled = metaZenny <= 0;
                }
                
                /**
                 * Render unlocked gems in the gem catalog
                 */
                function renderUnlockedGems() {
                    const gemCatalog = State.get('gemCatalog');
                    const playerClass = State.get('player.class');
                    elements.gemCatalog.unlockedGems.innerHTML = '';
                    
                    // Filter gems by class color appropriateness
                    gemCatalog.unlocked
                        .filter(gemKey => {
                            const gem = Config.BASE_GEMS[gemKey];
                            if (!gem) return false;
                            
                            // Grey gems are universal
                            if (gem.color === "grey") return true;
                            
                            // Class-specific color filtering
                            const classColors = {
                                "Knight": "red",
                                "Mage": "blue",
                                "Rogue": "green"
                            };
                            
                            // The base gems should be available to all classes
                            const baseGems = ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal"];
                            if (baseGems.includes(gemKey)) return true;
                            
                            return gem.color === classColors[playerClass];
                        })
                        .forEach(gemKey => {
                            const gem = Config.BASE_GEMS[gemKey];
                            if (!gem) return;
                            
                            // Use our unified gem creation function
                            const gemElement = Gems.createGemElement(gem, null, 'catalog');
                            elements.gemCatalog.unlockedGems.appendChild(gemElement);
                        });
                }
                
                /**
                 * Render available gems to unlock in the gem catalog
                 */
                function renderAvailableGems() {
                    const gemCatalog = State.get('gemCatalog');
                    const playerClass = State.get('player.class');
                    const metaZenny = State.get('metaZenny');
                    
                    // Add debugging to see what's happening
                    console.log("Rendering available gems with:", 
                        {available: gemCatalog.available, unlocked: gemCatalog.unlocked});
                    
                    elements.gemCatalog.availableGems.innerHTML = '';
                    
                    // Create a Set of unlocked gem keys for faster lookups
                    const unlockedGemKeys = new Set(gemCatalog.unlocked);
                    
                    // Make sure we're working with arrays
                    const availableGems = Array.isArray(gemCatalog.available) ? gemCatalog.available : [];
                    
                    // Filter out gems that are already unlocked
                    const filteredGems = availableGems
                        .filter(gemKey => !unlockedGemKeys.has(gemKey)) // Only show gems that are not already unlocked
                        .filter(gemKey => {
                            const gem = Config.BASE_GEMS[gemKey];
                            if (!gem) {
                                console.warn(`Gem not found in BASE_GEMS: ${gemKey}`);
                                return false;
                            }
                            
                            // Grey gems are universal
                            if (gem.color === "grey") return true;
                            
                            // Class-specific color filtering
                            const classColors = {
                                "Knight": "red",
                                "Mage": "blue",
                                "Rogue": "green"
                            };
                            
                            return gem.color === classColors[playerClass];
                        });
                    
                    console.log("Filtered available gems:", filteredGems);
                    
                    // Add each available gem
                    filteredGems.forEach((gemKey, index) => {
                        const gem = Config.BASE_GEMS[gemKey];
                        if (!gem) return;
                        
                        // Create a container for the unlockable gem
                        const gemContainer = document.createElement("div");
                        gemContainer.className = "unlockable-gem-container";
                        
                        // Create gem element
                        const gemElement = Gems.createGemElement(gem, null, 'catalog');
                        gemElement.style.cursor = 'pointer';
                        
                        gemElement.onclick = function() {
                            if (metaZenny < 50) {
                                UI.showMessage("Not enough Meta $ZENNY!", "error");
                                return;
                            }
                            
                            if (confirm(`Would you like to unlock the ${gem.color} ${gem.name} gem for 50 $ZENNY?`)) {
                                EventHandler.unlockGem(gemKey, index);
                            }
                        };
                        
                        // Create cost label
                        const costLabel = document.createElement("div");
                        costLabel.className = "gem-cost-label";
                        costLabel.textContent = "50 $ZENNY";
                        
                        // Add to container
                        gemContainer.appendChild(gemElement);
                        gemContainer.appendChild(costLabel);
                        
                        // Add to available gems section
                        elements.gemCatalog.availableGems.appendChild(gemContainer);
                    });
                }
                
                /**
                 * Show confirmation dialog for unlocking a gem
                 * @param {String} gemKey - Gem key
                 * @param {Number} index - Index in available gems
                 * @param {Number} metaZenny - Current meta zenny amount
                 */
                function showGemUnlockConfirmation(gemKey, index, metaZenny) {
                    // Check if player can afford it
                    if (metaZenny < 50) {
                        UI.showMessage("Not enough Meta $ZENNY!", "error");
                        return;
                    }
                    
                    // Get gem details for better user feedback
                    let gemName = "this gem";
                    try {
                        const gem = Config.BASE_GEMS[gemKey];
                        if (gem && gem.name) {
                            gemName = `${gem.color} ${gem.name}`;
                        }
                    } catch (e) {
                        console.warn("Error getting gem details:", e);
                    }
                    
                    // Use native browser confirm dialog
                    if (confirm(`Are you sure you want to unlock ${gemName} for 50 $ZENNY?`)) {
                        if (EventHandler && typeof EventHandler.unlockGem === 'function') {
                            EventHandler.unlockGem(gemKey, index);
                        } else {
                            console.error("EventHandler.unlockGem is not a function");
                            UI.showMessage("Error unlocking gem", "error");
                        }
                    }
                }
                
                /**
                 * Render the hand of gems
                 * @param {Boolean} isShop - Whether to render in the shop
                 */
                function renderHand(isShop = false) {
                    const hand = State.get('hand');
                    const target = isShop ? elements.shop.shopHand : elements.battle.hand;
                    
                    if (!target) return;
                    
                    // Clear the hand area
                    target.innerHTML = '';
                    
                    // Add gems to the display
                    hand.forEach((gem, index) => {
                        const context = isShop ? 'shop' : 'battle';
                        const gemElement = Gems.createGemElement(gem, index, context);
                        target.appendChild(gemElement);
                    });
                }
                
                /**
                 * Render the shop hand
                 */
                function renderShopHand() {
                    console.log("RENDERING SHOP HAND:", State.get('hand'));
                    renderHand(true);
                }
                
                /**
                 * Update stamina display
                 * @param {Number} stamina - Current stamina
                 * @param {Number} baseStamina - Maximum stamina
                 */
                function updateStaminaDisplay(stamina, baseStamina) {
                    const staminaFill = elements.battle.staminaFill;
                    const staminaText = elements.battle.staminaText;
                    
                    if (!staminaFill || !staminaText) return;
                    
                    // Update stamina bar
                    const staminaPercent = (stamina / baseStamina) * 100;
                    staminaFill.style.width = `${staminaPercent}%`;
                    
                    // Update stamina classes based on level
                    staminaFill.classList.remove("full", "medium", "low");
                    if (stamina === baseStamina) staminaFill.classList.add("full");
                    else if (stamina === 2) staminaFill.classList.add("medium");
                    else if (stamina <= 1) staminaFill.classList.add("low");
                    
                    // Update stamina text
                    staminaText.textContent = `${stamina}/${baseStamina}`;
                }
                
                /**
                 * Update buff displays
                 * @param {Array} playerBuffs - Player buffs
                 * @param {Array} enemyBuffs - Enemy buffs
                 */
                function updateBuffs(playerBuffs, enemyBuffs) {
                    // Update player buffs
                    if (elements.battle.playerBuffs) {
                        elements.battle.playerBuffs.innerHTML = "";
                        playerBuffs.forEach(buff => {
                            const buffIcon = createBuffIcon(buff, false);
                            elements.battle.playerBuffs.appendChild(buffIcon);
                        });
                    }
                    
                    // Update enemy buffs
                    if (elements.battle.enemyBuffs) {
                        elements.battle.enemyBuffs.innerHTML = "";
                        enemyBuffs.forEach(buff => {
                            const buffIcon = createBuffIcon(buff, true);
                            elements.battle.enemyBuffs.appendChild(buffIcon);
                        });
                    }
                }
                
                /**
                 * Create a buff icon
                 * @param {Object} buff - Buff object
                 * @param {Boolean} isEnemy - Whether this is an enemy buff
                 * @returns {HTMLElement} Buff icon element
                 */
                function createBuffIcon(buff, isEnemy = false) {
                    const icon = document.createElement("div");
                    icon.className = `buff-icon ${buff.type}`;
                    
                    // Set appropriate icon based on buff type
                    icon.innerHTML = getBuffIcon(buff.type);
                    
                    // Add turns indicator
                    const turns = document.createElement("span");
                    turns.className = "turns";
                    turns.textContent = buff.turns;
                    icon.appendChild(turns);
                    
                    // Add tooltip with description
                    const description = getBuffDescription(buff, isEnemy);
                    icon.setAttribute("data-tooltip", description);
                    
                    return icon;
                }
                
                /**
                 * Get an icon for a buff
                 * @param {String} buffType - Buff type
                 * @returns {String} Icon character
                 */
                function getBuffIcon(buffType) {
                    switch (buffType) {
                        case "focused": return "✦";
                        case "defense": return "🛡️";
                        case "stunned": return "💫";
                        case "poison": return "☠️";
                        default: return "⚡";
                    }
                }
                
                /**
                 * Get a description for a buff
                 * @param {Object} buff - Buff object
                 * @param {Boolean} isEnemy - Whether this is an enemy buff
                 * @returns {String} Buff description
                 */
                function getBuffDescription(buff, isEnemy) {
                    const turns = buff.turns > 1 ? 's' : '';
                    
                    switch (buff.type) {
                        case "focused":
                            return `Focused\nIncreases damage and healing by 20%\nRemaining: ${buff.turns} turn${turns}`;
                        case "defense":
                            return `Defense\nReduces incoming damage by 50%\nRemaining: ${buff.turns} turn${turns}`;
                        case "stunned":
                            return `Stunned\nCannot take actions this turn\nRemaining: ${buff.turns} turn${turns}`;
                        case "poison":
                            return `Poison\nTaking ${buff.damage} damage per turn\nRemaining: ${buff.turns} turn${turns}`;
                        default:
                            return `${buff.type}\nRemaining: ${buff.turns} turn${turns}`;
                    }
                }
                
                /**
                 * Show a damage/healing animation
                 * @param {Number} amount - Amount of damage or healing
                 * @param {Boolean} isPlayer - Whether the player is the target
                 * @param {Boolean} isPoison - Whether it's poison damage
                 */
                function showDamageAnimation(amount, isPlayer, isPoison = false) {
                    const battleEffects = elements.battle.battleEffects;
                    if (!battleEffects) return;
                    
                    // Create effect element
                    const effect = document.createElement('div');
                    
                    // Set class based on effect type
                    if (amount > 0) {
                        effect.className = isPoison ? 'poison-text' : 'damage-text';
                        effect.textContent = `-${amount}`;
                    } else {
                        effect.className = 'heal-text';
                        effect.textContent = `+${Math.abs(amount)}`;
                    }
                    
                    // Position based on target
                    if (isPlayer) {
                        effect.style.bottom = '40%';
                        effect.style.left = '20%';
                    } else {
                        effect.style.top = '30%';
                        effect.style.right = '40%';
                    }
                    
                    // Add to battle effects container
                    battleEffects.appendChild(effect);
                    
                    // Remove after animation completes
                    setTimeout(() => {
                        effect.remove();
                    }, 1500);
                }
                
                /**
                 * Show victory effect animation
                 */
                function showVictoryEffect() {
                    const battleScreen = elements.screens.battle;
                    if (!battleScreen) return;
                    
                    // Create victory text
                    const victoryText = document.createElement('div');
                    victoryText.className = 'victory-text';
                    victoryText.textContent = 'VICTORY!';
                    
                    // Add to battle screen
                    battleScreen.appendChild(victoryText);
                    
                    // Remove after transition
                    setTimeout(() => {
                        victoryText.remove();
                    }, 1500);
                }
                
                /**
                 * Show defeat effect animation
                 */
                function showDefeatEffect() {
                    const battleScreen = elements.screens.battle;
                    if (!battleScreen) return;
                    
                    // Create defeat text
                    const defeatText = document.createElement('div');
                    defeatText.className = 'defeat-text';
                    defeatText.textContent = 'DEFEAT';
                    
                    // Add to battle screen
                    battleScreen.appendChild(defeatText);
                    
                    // Remove after transition
                    setTimeout(() => {
                        defeatText.remove();
                    }, 1500);
                }
                
                // Return all UI methods
                return {
                    initialize,
                    switchScreen,
                    showMessage,
                    showLoading,
                    hideLoading,
                    showError,
                    hideError,
                    updateBattleScreen,
                    updateShopScreen,
                    updateCampScreen,
                    updateGemCatalogScreen,
                    renderHand,
                    renderShopHand,
                    showDamageAnimation,
                    showVictoryEffect,
                    showDefeatEffect,
                    showGemUnlockConfirmation,
                };
            })();