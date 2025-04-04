import { EventBus } from '../core/events.js';
import { GameState } from '../core/state.js';
import { Utils } from '../core/utils.js';
import { Config } from '../core/config.js';

/**
 * UI module - Handles user interface management and DOM manipulation
 */
export const UI = (() => {
    // Cache for DOM elements
    const elements = {};
    
    /**
     * Initialize UI system
     */
    function initialize() {
        console.log("Initializing UI module");
        setupDOMCache();
        setupEventBusListeners();
        
        // Show loading screen during initialization
        showLoading("Loading game...");
        
        // Hide loading screen after a delay
        setTimeout(hideLoading, 500);
        
        return true;
    }
    
    /**
     * Cache DOM elements
     */
    function setupDOMCache() {
        const safeGetElement = (id) => {
            const element = document.getElementById(id);
            if (!element) console.warn(`Element with ID '${id}' not found`);
            return element;
        };
        
        // Screens
        elements.screens = {
            characterSelect: safeGetElement('character-select-screen'),
            gemCatalog: safeGetElement('gem-catalog-screen'),
            battle: safeGetElement('battle-screen'),
            shop: safeGetElement('shop-screen'),
            camp: safeGetElement('camp-screen')
        };
        
        // Character Select
        elements.characterSelect = {
            knightBtn: safeGetElement('knight-btn'),
            mageBtn: safeGetElement('mage-btn'),
            rogueBtn: safeGetElement('rogue-btn'),
            resetBtn: safeGetElement('reset-btn')
        };
        
        // Gem Catalog
        elements.gemCatalog = {
            metaZennyDisplay: safeGetElement('meta-zenny-display'),
            unlockedGems: safeGetElement('unlocked-gems'),
            availableGems: safeGetElement('available-gems'),
            continueJourneyBtn: safeGetElement('continue-journey-btn')
        };
        
        // Battle Screen
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
        
        // Shop Screen
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
        
        // Camp Screen
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
        
        // System elements
        elements.system = {};
        
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
     * Set up EventBus listeners
     */
    function setupEventBusListeners() {
        EventBus.on('UI_MESSAGE', ({ message, type = 'success', duration = 2000 }) => {
            showMessage(message, type, duration);
        });
        
        EventBus.on('SCREEN_CHANGE', (screenName) => {
            switchScreen(screenName);
        });
        
        EventBus.on('BATTLE_UPDATE', () => {
            updateBattleScreen();
        });
        
        EventBus.on('SHOP_UPDATE', () => {
            updateShopScreen();
        });
        
        EventBus.on('HAND_UPDATED', () => {
            renderHand();
        });
        
        EventBus.on('SHOP_HAND_UPDATED', () => {
            renderShopHand();
        });
        
        EventBus.on('SHOW_DAMAGE', ({ target, amount, isPoison }) => {
            showDamageAnimation(amount, target === 'player', isPoison);
        });
        
        EventBus.on('SHOW_VICTORY', () => {
            showVictoryEffect();
        });
        
        EventBus.on('SHOW_DEFEAT', () => {
            showDefeatEffect();
        });
        
        EventBus.on('GEM_SELECTION_CHANGED', ({ selectedIndices }) => {
            // Update gem selection in UI
            updateGemSelection(selectedIndices);
        });
        
        EventBus.on('LOADING_START', ({ message = 'Loading...' }) => {
            showLoading(message);
        });
        
        EventBus.on('LOADING_END', () => {
            hideLoading();
        });
        
        EventBus.on('ERROR_SHOW', ({ message, isFatal = false }) => {
            showError(message, isFatal);
        });
        
        EventBus.on('ERROR_HIDE', () => {
            hideError();
        });
        
        // Listen for specific game events that should update UI
        EventBus.on('PLAYER_STATS_UPDATED', () => {
            if (GameState.get('currentScreen') === 'battle') {
                updateBattleScreen();
            } else if (GameState.get('currentScreen') === 'shop') {
                updateShopScreen();
            }
        });
        
        EventBus.on('ENEMY_UPDATED', () => {
            if (GameState.get('currentScreen') === 'battle') {
                updateBattleScreen();
            }
        });
        
        EventBus.on('META_ZENNY_UPDATED', () => {
            if (GameState.get('currentScreen') === 'gemCatalog') {
                updateGemCatalogScreen();
            } else if (GameState.get('currentScreen') === 'camp') {
                updateCampScreen();
            }
        });
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
     * Switch between game screens
     * @param {String} screenName - Name of the screen to switch to
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
            GameState.set('currentScreen', screenName);
            
            // Perform screen-specific updates
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
            
            // Special handling for gem catalog screen
            if (screenName === 'gemCatalog') {
                console.log("Applying special binding for gem catalog screen");
                const continueBtn = document.getElementById('continue-journey-btn');
                if (continueBtn) {
                    console.log("Direct binding to continue-journey-btn");
                    continueBtn.onclick = function() {
                        console.log("continue-journey-btn clicked");
                        if (typeof EventHandler !== 'undefined' && EventHandler.startJourney) {
                            EventHandler.startJourney();
                        } else {
                            // Emergency fallback
                            console.log("Using EventBus for journey start");
                            EventBus.emit('JOURNEY_START');
                            
                            setTimeout(() => {
                                EventBus.emit('SCREEN_CHANGE', 'battle');
                            }, 100);
                        }
                    };
                    console.log("Handler attached to continue-journey-btn");
                }
            }
            
            // Setup event handlers for the new screen
            setTimeout(() => {
                if (typeof EventHandler !== 'undefined' && typeof EventHandler.setupButtonHandlers === 'function') {
                    console.log(`Setting up button handlers for ${screenName} screen`);
                    EventHandler.setupButtonHandlers();
                }
            }, 50);
        } else {
            console.error(`Target screen "${screenName}" not found`);
        }
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
                // Update error message
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
                // Fallback to alert
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
        // No specific updates needed for character select screen yet
    }
    
    /**
     * Update the gem catalog screen
     */
    function updateGemCatalogScreen() {
        const metaZenny = GameState.get('metaZenny');

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
     * Render unlocked gems in the gem catalog
     */
    function renderUnlockedGems() {
        const gemCatalog = GameState.get('gemCatalog');
        const playerClass = GameState.get('player.class');
        const unlockedGemsContainer = elements.gemCatalog.unlockedGems;
        
        if (!unlockedGemsContainer) return;
        
        unlockedGemsContainer.innerHTML = '';
        
        // Filter gems by class color appropriateness
        const filteredGems = gemCatalog.unlocked.filter(gemKey => {
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
        });
        
        // Create gem elements
        filteredGems.forEach(gemKey => {
            const gem = Config.BASE_GEMS[gemKey];
            if (!gem) return;
            
            // Create gem element - simplified version
            const gemElement = document.createElement("div");
            gemElement.className = `gem ${gem.color}`;
            gemElement.innerHTML = `
                <div class="gem-content">
                    <div class="gem-icon">${getGemSymbol(gem, 'catalog')}</div>
                    <div class="gem-name" style="display: block;">${gem.name}</div>
                </div>
                <div class="gem-cost">${gem.cost}</div>
            `;
            
            // Add tooltip
            const hasBonus = (playerClass === "Knight" && gem.color === "red") ||
                           (playerClass === "Mage" && gem.color === "blue") ||
                           (playerClass === "Rogue" && gem.color === "green");
                           
            gemElement.setAttribute("data-tooltip", buildGemTooltip(gem, hasBonus));
            
            unlockedGemsContainer.appendChild(gemElement);
        });
    }
    
    /**
     * Render available gems to unlock in the gem catalog
     */
    function renderAvailableGems() {
        const gemCatalog = GameState.get('gemCatalog');
        const playerClass = GameState.get('player.class');
        const metaZenny = GameState.get('metaZenny');
        const availableGemsContainer = elements.gemCatalog.availableGems;
        
        if (!availableGemsContainer) return;
        
        availableGemsContainer.innerHTML = '';
        
        // Create a Set of unlocked gem keys for faster lookups
        const unlockedGemKeys = new Set(gemCatalog.unlocked);
        
        // Filter available gems by class and unlock status
        const availableGems = gemCatalog.available.filter(gemKey => {
            // Skip already unlocked gems
            if (unlockedGemKeys.has(gemKey)) return false;
            
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
            
            return gem.color === classColors[playerClass];
        });
        
        // Create gem elements
        availableGems.forEach((gemKey) => {
            const gem = Config.BASE_GEMS[gemKey];
            if (!gem) return;
            
            // Create container
            const gemContainer = document.createElement("div");
            gemContainer.className = "unlockable-gem-container";
            
            // Create gem element
            const gemElement = document.createElement("div");
            gemElement.className = `gem ${gem.color}`;
            gemElement.style.cursor = 'pointer';
            gemElement.innerHTML = `
                <div class="gem-content">
                    <div class="gem-icon">${getGemSymbol(gem, 'catalog')}</div>
                    <div class="gem-name" style="display: block;">${gem.name}</div>
                </div>
                <div class="gem-cost">${gem.cost}</div>
            `;
            
            // Add click handler
            gemElement.onclick = function() {
                if (metaZenny < 50) {
                    EventBus.emit('UI_MESSAGE', {
                        message: "Not enough Meta $ZENNY!",
                        type: 'error'
                    });
                    return;
                }
                
                if (confirm(`Would you like to unlock the ${gem.color} ${gem.name} gem for 50 $ZENNY?`)) {
                    EventBus.emit('UNLOCK_GEM', { gemKey });
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
            availableGemsContainer.appendChild(gemContainer);
        });
    }
    
    /**
     * Update the battle screen
     */
    function updateBattleScreen() {
        const player = GameState.get('player');
        const enemy = GameState.get('battle.enemy');
        const currentPhaseIndex = GameState.get('currentPhaseIndex');
        const currentDay = GameState.get('currentDay');
        const isEnemyTurnPending = GameState.get('isEnemyTurnPending');
        const battleOver = GameState.get('battleOver');
        const selectedGems = GameState.get('selectedGems');
        const hand = GameState.get('hand');
        const gemBag = GameState.get('gemBag');
        
        // Update player stats
        if (elements.battle.playerClass) elements.battle.playerClass.textContent = player.class || 'None';
        if (elements.battle.playerHealth) elements.battle.playerHealth.textContent = player.health;
        if (elements.battle.playerMaxHealth) elements.battle.playerMaxHealth.textContent = player.maxHealth;
        if (elements.battle.zenny) elements.battle.zenny.textContent = player.zenny;
        
        // Update stamina display
        updateStaminaDisplay(player.stamina, player.baseStamina);
        
        // Update gem bag info
        if (elements.battle.gemBagCount) elements.battle.gemBagCount.textContent = gemBag.length;
        if (elements.battle.gemBagTotal) elements.battle.gemBagTotal.textContent = Config.MAX_GEM_BAG_SIZE;
        if (elements.battle.gemBagCount2) elements.battle.gemBagCount2.textContent = gemBag.length;
        if (elements.battle.gemBagTotal2) elements.battle.gemBagTotal2.textContent = Config.MAX_GEM_BAG_SIZE;
        
        // Update phase indicator
        const phaseNames = Config.PHASES;
        const phaseName = phaseNames[currentPhaseIndex];
        
        // Set phase class
        if (elements.screens.battle) elements.screens.battle.className = 'screen active ' + phaseName.toLowerCase();
        
        // Update day/phase indicator
        const phaseSymbols = ["☀️", "🌅", "🌙"];
        if (elements.battle.dayPhaseIndicator) {
            elements.battle.dayPhaseIndicator.textContent = `Day ${currentDay} ${phaseSymbols[currentPhaseIndex]}`;
        }
        
        // Update turn indicator
        if (elements.battle.turnIndicator) {
            elements.battle.turnIndicator.textContent = isEnemyTurnPending ? "Enemy Turn" : "Your Turn";
            elements.battle.turnIndicator.classList.toggle("player", !isEnemyTurnPending);
            elements.battle.turnIndicator.classList.toggle("enemy", isEnemyTurnPending);
        }
        
        // Update enemy stats if enemy exists
        if (enemy) {
            if (elements.battle.enemyName) elements.battle.enemyName.textContent = enemy.name || "None";
            if (elements.battle.enemyHealth) elements.battle.enemyHealth.textContent = Math.max(enemy.health || 0, 0);
            if (elements.battle.enemyMaxHealth) elements.battle.enemyMaxHealth.textContent = enemy.maxHealth || 0;
            if (elements.battle.enemyAttack) {
                elements.battle.enemyAttack.textContent = enemy.currentAction?.split(" ")[1] || "0";
            }
            if (elements.battle.enemyCondition) {
                elements.battle.enemyCondition.textContent = enemy.shield ? 
                    "Shielded: Use Red Gems to bypass" : "";
            }
            
            if (enemy.actionQueue && elements.battle.enemyActionQueue) {
                elements.battle.enemyActionQueue.textContent = 
                    `Next: ${enemy.actionQueue.slice(0, 3).map(action => action.split(" ")[0]).join(", ")}`;
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
        
        if (elements.battle.executeBtn) {
            elements.battle.executeBtn.disabled = battleOver || !canPlayGems || isEnemyTurnPending || isStunned;
        }
        if (elements.battle.waitBtn) {
            elements.battle.waitBtn.disabled = battleOver || isEnemyTurnPending || 
                                           GameState.get('hasActedThisTurn') || 
                                           GameState.get('hasPlayedGemThisTurn') || 
                                           isStunned;
        }
        if (elements.battle.discardEndBtn) {
            elements.battle.discardEndBtn.disabled = battleOver || !selectedGems.size || 
                                                isEnemyTurnPending || 
                                                GameState.get('hasActedThisTurn') || 
                                                isStunned;
        }
        if (elements.battle.endTurnBtn) {
            elements.battle.endTurnBtn.disabled = battleOver || isEnemyTurnPending || isStunned;
        }
        
        // Show/hide flee button
        if (elements.battle.fleeBtn) {
            elements.battle.fleeBtn.style.display = (currentPhaseIndex < 2 && !battleOver && 
                                                 !isEnemyTurnPending && !isStunned) ? "block" : "none";
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
            fleeBtn.style.left = 'calc(310px + 15px)';
            fleeBtn.style.bottom = '40px';
            fleeBtn.style.zIndex = '95';
        }
        
        // Fix Turn Indicator position
        const turnIndicator = document.getElementById('turn-indicator');
        if (turnIndicator) {
            turnIndicator.style.top = '110px';
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
        const player = GameState.get('player');
        const inUpgradeMode = GameState.get('inUpgradeMode');
        const selectedGems = GameState.get('selectedGems');
        const gemBag = GameState.get('gemBag');
        
        // Update shop stats
        if (elements.shop.shopHealth) elements.shop.shopHealth.textContent = player.health;
        if (elements.shop.shopMaxHealth) elements.shop.shopMaxHealth.textContent = player.maxHealth;
        if (elements.shop.shopZenny) elements.shop.shopZenny.textContent = player.zenny;
        
        // Update gem bag info
        if (elements.shop.shopGemBagCount) elements.shop.shopGemBagCount.textContent = gemBag.length;
        if (elements.shop.shopGemBagTotal) elements.shop.shopGemBagTotal.textContent = Config.MAX_GEM_BAG_SIZE;
        
        // Handle different shop modes
        if (inUpgradeMode) {
            updateShopUpgradeMode();
        } else {
            updateShopNormalMode();
        }
        
        // Update healing button state
        if (elements.shop.heal10) {
            elements.shop.heal10.disabled = player.zenny < 3 || player.health >= player.maxHealth;
            elements.shop.heal10.title = player.health >= player.maxHealth ? "Already at full health" : 
                                    player.zenny < 3 ? "Not enough $ZENNY (need 3)" : 
                                    "Heal 10 health";
        }
        
        // Render shop hand - important to show current hand
        renderShopHand();
    }
    
    /**
     * Update shop UI for upgrade mode
     */
    function updateShopUpgradeMode() {
        const gemCatalog = GameState.get('gemCatalog');
        const hand = GameState.get('hand');
        const selectedGems = GameState.get('selectedGems');
        
        // Show gem pool, hide other options
        if (elements.shop.gemPool) elements.shop.gemPool.style.display = 'flex';
        
        // Update instructions
        if (selectedGems.size === 1 && elements.shop.gemPoolInstructions) {
            const selectedGem = hand[Array.from(selectedGems)[0]];
            elements.shop.gemPoolInstructions.textContent = `Choose an upgrade option for your ${selectedGem.color} ${selectedGem.name}:`;
            elements.shop.gemPoolInstructions.style.fontWeight = 'bold';
        }
        
        // Show cancel button, hide all other buttons
        if (elements.shop.cancelUpgrade) elements.shop.cancelUpgrade.style.display = 'block';
        if (elements.shop.upgradeGem) elements.shop.upgradeGem.style.display = 'none';
        if (elements.shop.discardGem) elements.shop.discardGem.style.display = 'none';
        if (elements.shop.buyRandomGem) elements.shop.buyRandomGem.style.display = 'none';
        if (elements.shop.swapGem) elements.shop.swapGem.style.display = 'none';
        
        // Render all upgrade options
        if (elements.shop.gemPool) {
            elements.shop.gemPool.innerHTML = '';
            gemCatalog.gemPool.forEach((gem, index) => {
                const gemElement = createGemElement(gem, index, false);
                gemElement.addEventListener('click', () => EventBus.emit('UPGRADE_OPTION_SELECTED', { poolIndex: index }));
                elements.shop.gemPool.appendChild(gemElement);
            });
        }
    }

    /**
     * Update shop UI for normal mode
     */
    function updateShopNormalMode() {
        const selectedGems = GameState.get('selectedGems');
        const hand = GameState.get('hand');
        
        // Hide gem pool, show normal options
        if (elements.shop.gemPool) {
            elements.shop.gemPool.style.display = 'none';
            elements.shop.gemPool.innerHTML = '';
        }
        
        // Show/hide appropriate buttons
        if (elements.shop.cancelUpgrade) elements.shop.cancelUpgrade.style.display = 'none';
        if (elements.shop.buyRandomGem) elements.shop.buyRandomGem.style.display = 'block';
        if (elements.shop.upgradeGem) elements.shop.upgradeGem.style.display = 'block';
        if (elements.shop.discardGem) elements.shop.discardGem.style.display = 'block';
        if (elements.shop.swapGem) elements.shop.swapGem.style.display = 'none';
        
        // Update instructions based on selection
        if (elements.shop.gemPoolInstructions) {
            if (selectedGems.size === 1) {
                const selectedGem = hand[Array.from(selectedGems)[0]];
                elements.shop.gemPoolInstructions.textContent = `Selected: ${selectedGem.color} ${selectedGem.name}`;
                elements.shop.gemPoolInstructions.style.fontWeight = 'normal';
            } else {
                elements.shop.gemPoolInstructions.textContent = 'Select a gem from your hand';
                elements.shop.gemPoolInstructions.style.fontWeight = 'normal';
            }
        }
        
        updateShopButtonStates();
    }
    
    /**
     * Update shop button states
     */
    function updateShopButtonStates() {
        const player = GameState.get('player');
        const selectedGems = GameState.get('selectedGems');
        const hand = GameState.get('hand');
        const gemCatalog = GameState.get('gemCatalog');
        
        const hasSelection = selectedGems.size > 0;
        
        // Update button states
        if (elements.shop.upgradeGem) {
            elements.shop.upgradeGem.disabled = !hasSelection || player.zenny < 5;
        }
        
        if (elements.shop.discardGem) {
            elements.shop.discardGem.disabled = !hasSelection || player.zenny < 3;
        }
        
        if (hasSelection) {
            // Additional checks for upgrade eligibility
            const selectedIndex = Array.from(selectedGems)[0];
            const selectedGem = hand[selectedIndex];
            const canUpgrade = selectedGem && 
                            !selectedGem.freshlySwapped && 
                            !gemCatalog.upgradedThisShop.has(selectedGem.id);
            
            if (elements.shop.upgradeGem) {
                elements.shop.upgradeGem.disabled = !canUpgrade || player.zenny < 5;
                elements.shop.upgradeGem.title = !canUpgrade ? "Cannot upgrade this gem now" :
                                            player.zenny < 5 ? "Not enough $ZENNY (need 5)" :
                                            "Upgrade selected gem (5 $ZENNY)";
            }
        }
        
        // Update buy random gem button
        if (elements.shop.buyRandomGem) {
            elements.shop.buyRandomGem.disabled = player.zenny < 3;
            elements.shop.buyRandomGem.title = player.zenny < 3 ? "Not enough $ZENNY" : "Buy random gem for Gem Bag";
        }
    }
    
    // CAMP SCREEN
    /**
     * Update the camp screen
     */
    function updateCampScreen() {
        const currentDay = GameState.get('currentDay');
        const player = GameState.get('player');
        const metaZenny = GameState.get('metaZenny');
        
        // Update day display
        if (elements.camp.campDay) elements.camp.campDay.textContent = currentDay;
        
        // Update zenny displays
        if (elements.camp.campZenny) elements.camp.campZenny.textContent = player.zenny;
        if (elements.camp.campMetaZenny) elements.camp.campMetaZenny.textContent = metaZenny;
        
        // Clear input fields
        if (elements.camp.withdrawAmount) elements.camp.withdrawAmount.value = "";
        if (elements.camp.depositAmount) elements.camp.depositAmount.value = "";
        
        // Disable buttons if no zenny available
        if (elements.camp.withdrawBtn) elements.camp.withdrawBtn.disabled = player.zenny <= 0;
        if (elements.camp.depositBtn) elements.camp.depositBtn.disabled = metaZenny <= 0;
    }

    // ===================================================
    // RENDERING FUNCTIONS
    // ===================================================
    /**
     * Render the hand of gems
     * @param {Boolean} isShop - Whether we're rendering in the shop
     */
    function renderHand(isShop = false) {
        const hand = GameState.get('hand');
        const selectedGems = GameState.get('selectedGems');
        const handContainer = isShop ? elements.shop.shopHand : elements.battle.hand;
        
        if (!handContainer) return;
        
        // Clear the current hand
        handContainer.innerHTML = '';
        
        // Add each gem
        hand.forEach((gem, index) => {
            const isSelected = selectedGems.has(index);
            const gemElement = createGemElement(gem, index, isSelected);
            
            // Add click handler
            gemElement.addEventListener('click', () => {
                EventBus.emit('GEM_SELECT', { index, context: isShop ? 'shop' : 'battle' });
            });
            
            handContainer.appendChild(gemElement);
        });
    }
    
    /**
     * Render gems in shop hand
     */
    function renderShopHand() {
        renderHand(true);
    }
    
    /**
     * Create a gem element for the UI
     * @param {Object} gem - Gem data
     * @param {Number} index - Index in hand or pool
     * @param {Boolean} isSelected - Whether gem is selected
     * @returns {HTMLElement} Gem element
     */
    function createGemElement(gem, index, isSelected = false) {
        const gemElement = document.createElement("div");
        gemElement.className = `gem ${gem.color}`;
        
        // Check for class bonus
        const playerClass = GameState.get('player.class');
        const hasBonus = (playerClass === "Knight" && gem.color === "red") ||
                       (playerClass === "Mage" && gem.color === "blue") ||
                       (playerClass === "Rogue" && gem.color === "green");
        
        if (hasBonus) {
            gemElement.classList.add("class-bonus");
        }
        
        // Check for selected state
        if (isSelected) {
            gemElement.classList.add("selected");
        }
        
        // Check for proficiency
        const gemKey = `${gem.color}${gem.name}`;
        const proficiency = GameState.get('gemProficiency');
        
        // Very simplified proficiency check - should be implemented more thoroughly
        const isUnlearned = proficiency && 
                          proficiency[gemKey] && 
                          proficiency[gemKey].failureChance > 0;
        
        if (isUnlearned) {
            gemElement.classList.add("unlearned");
        }
        
        // Create gem content
        const gemContent = document.createElement("div");
        gemContent.className = "gem-content";
        
        // Add icon
        const gemIcon = document.createElement("div");
        gemIcon.className = "gem-icon";
        gemIcon.textContent = getGemSymbol(gem);
        gemContent.appendChild(gemIcon);
        
        // Add value if it exists
        if (gem.damage || gem.heal || gem.poison) {
            const gemValue = document.createElement("div");
            gemValue.className = "gem-value";
            gemValue.textContent = gem.damage || gem.heal || gem.poison || "";
            gemContent.appendChild(gemValue);
        }
        
        // Add name (hidden in battle/shop)
        const gemName = document.createElement("div");
        gemName.className = "gem-name";
        gemName.textContent = gem.name;
        gemContent.appendChild(gemName);
        
        gemElement.appendChild(gemContent);
        
        // Add cost indicator
        const gemCost = document.createElement("div");
        gemCost.className = "gem-cost";
        gemCost.textContent = gem.cost;
        gemElement.appendChild(gemCost);
        
        // Add tooltip
        gemElement.setAttribute("data-tooltip", buildGemTooltip(gem, hasBonus));
        
        return gemElement;
    }
    
    /**
     * Create a buff icon element
     * @param {Object} buff - Buff data
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

    // ===================================================
    // UTILITY FUNCTIONS
    // ===================================================
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
            
            if (playerBuffs && playerBuffs.length > 0) {
                playerBuffs.forEach(buff => {
                    const buffIcon = createBuffIcon(buff, false);
                    elements.battle.playerBuffs.appendChild(buffIcon);
                });
            }
        }
        
        // Update enemy buffs
        if (elements.battle.enemyBuffs) {
            elements.battle.enemyBuffs.innerHTML = "";
            
            if (enemyBuffs && enemyBuffs.length > 0) {
                enemyBuffs.forEach(buff => {
                    const buffIcon = createBuffIcon(buff, true);
                    elements.battle.enemyBuffs.appendChild(buffIcon);
                });
            }
        }
    }
    
    /**
     * Get a symbol for a gem
     * @param {Object} gem - Gem data
     * @param {String} context - 'battle', 'shop', or 'catalog'
     * @returns {String} Symbol to display
     */
    function getGemSymbol(gem, context = 'battle') {
        if (gem.shield) return "🛡️";
        if (gem.poison) return "☠️";
        
        if (gem.damage) {
            if (gem.name.includes("Strong")) return "⚔️";
            if (gem.name.includes("Quick")) return "⚡";
            if (gem.name.includes("Burst")) return "💥";
            return "🗡️";
        }
        
        if (gem.heal) {
            if (gem.name.includes("Strong")) return "❤️";
            return "💚";
        }
        
        return "✨"; // Generic fallback
    }
    
    /**
     * Build tooltip text for a gem
     * @param {Object} gem - Gem data
     * @param {Boolean} hasBonus - Whether gem has class bonus
     * @returns {String} Tooltip text
     */
    function buildGemTooltip(gem, hasBonus) {
        let tooltip = '';
        
        if (gem.damage) {
            tooltip += `DMG: ${gem.damage}`;
            if (hasBonus) tooltip += ' (+50%)';
        }
        
        if (gem.heal) {
            if (tooltip) tooltip += ' | ';
            tooltip += `HEAL: ${gem.heal}`;
            if (hasBonus) tooltip += ' (+50%)';
        }
        
        if (gem.shield) {
            if (tooltip) tooltip += ' | ';
            tooltip += 'SHIELD';
        }
        
        if (gem.poison) {
            if (tooltip) tooltip += ' | ';
            tooltip += `PSN: ${gem.poison}`;
            if (hasBonus) tooltip += ' (+50%)';
        }
        
        tooltip += ` | (${gem.cost}⚡)`;
        
        return tooltip;
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
     * Update gem selection in UI
     * @param {Array} selectedIndices - Array of selected indices 
     */
    function updateGemSelection(selectedIndices) {
        const allGems = document.querySelectorAll('#hand .gem, #shop-hand .gem');
        
        // Remove selection from all gems
        allGems.forEach((gemEl, index) => {
            gemEl.classList.remove('selected');
        });
        
        // Add selection to selected gems
        selectedIndices.forEach(index => {
            const handGem = document.querySelector(`#hand .gem:nth-child(${index + 1})`);
            const shopGem = document.querySelector(`#shop-hand .gem:nth-child(${index + 1})`);
            
            if (handGem) handGem.classList.add('selected');
            if (shopGem) shopGem.classList.add('selected');
        });
    }
    
    /**
     * Binds a keyboard shortcut handler
     * @param {String} key - Key to bind to
     * @param {Function} callback - Function to call on key press
     * @param {String} screenScope - Screen to limit this binding to (optional)
     */
    function bindKeyboardShortcut(key, callback, screenScope = null) {
        document.addEventListener('keydown', (event) => {
            if (event.key === key) {
                // If screen scope is provided, only trigger if we're on that screen
                if (screenScope && GameState.get('currentScreen') !== screenScope) {
                    return;
                }
                
                callback();
            }
        });
    }

    // ===================================================
    // VISUAL EFFECTS
    // ===================================================
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
    
    // ===================================================
    // PUBLIC API
    // ===================================================
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
        setupKeyboardShortcuts
    };
})();

export default UI;