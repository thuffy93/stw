// ===================================================
// UI MODULE - EventBus-powered DOM manipulation
// ===================================================
const UI = ((EventBus) => {
    const elements = {};
    let eventBus;

    // Initialize UI system
    function initialize(eb) {
        eventBus = eb;
        setupDOMCache();
        setupEventBusListeners();
        console.log("UI initialized with EventBus");
    }

    // Cache DOM elements
    function setupDOMCache() {
        const safeGetElement = (id) => {
            const element = document.getElementById(id);
            if (!element) console.warn(`Element ${id} not found`);
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

        // System Elements
        elements.system = {
            message: safeGetElement('message'),
            audioButton: safeGetElement('audio-button'),
            loadingOverlay: safeGetElement('loading-overlay'),
            errorOverlay: safeGetElement('error-overlay'),
            errorMessage: safeGetElement('error-overlay')?.querySelector('.error-message'),
            errorClose: safeGetElement('error-overlay')?.querySelector('.error-close')
        };
    }

    // EventBus listeners setup
    function setupEventBusListeners() {
        // Core UI Events
        eventBus.subscribe('UI_SHOW_MESSAGE', ({message, type = 'success', duration = 2000}) => 
            showMessage(message, type, duration));
        
        eventBus.subscribe('UI_SWITCH_SCREEN', (screenName) => 
            switchScreen(screenName));
        
        // State Update Events
        eventBus.subscribe('STATE_UPDATED', ({key, value}) => {
            if (key === 'currentScreen') updateScreenUI(value);
        });

        // Battle Events
        eventBus.subscribe('BATTLE_STATE_CHANGED', () => 
            updateBattleScreen());
        
        eventBus.subscribe('PLAYER_STATS_UPDATED', () => 
            updateBattleScreen());
        
        // Shop Events
        eventBus.subscribe('SHOP_STATE_CHANGED', () => 
            updateShopScreen());
    }

    // Screen management
    function switchScreen(screenName) {
        // Hide all screens
        Object.values(elements.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = elements.screens[screenName];
        if (targetScreen) {
            targetScreen.classList.add('active');
            eventBus.publish('STATE_UPDATE', {
                key: 'currentScreen',
                value: screenName
            });
            
            // Update screen-specific UI
            updateScreenUI(screenName);
            
            // Setup button handlers
            setTimeout(setupButtonHandlers, 50);
        }
    }

    function updateScreenUI(screenName) {
        switch (screenName) {
            case 'battle':
                updateBattleScreen();
                break;
            case 'shop':
                updateShopScreen();
                break;
            case 'gemCatalog':
                updateGemCatalogScreen();
                break;
            case 'camp':
                updateCampScreen();
                break;
        }
    }

    // Battle Screen Updates
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

        // Player Stats
        elements.battle.playerClass.textContent = player.class;
        elements.battle.playerHealth.textContent = player.health;
        elements.battle.playerMaxHealth.textContent = player.maxHealth;
        elements.battle.zenny.textContent = player.zenny;

        // Stamina Display
        updateStaminaDisplay(player.stamina, player.baseStamina);

        // Gem Bag Info
        elements.battle.gemBagCount.textContent = gemBag.length;
        elements.battle.gemBagTotal.textContent = Config.MAX_GEM_BAG_SIZE;

        // Phase Indicator
        const phaseNames = Config.PHASES;
        const phaseName = phaseNames[currentPhaseIndex];
        elements.screens.battle.className = `screen active ${phaseName.toLowerCase()}`;
        
        const phaseSymbols = ["☀️", "🌅", "🌙"];
        elements.battle.dayPhaseIndicator.textContent = `Day ${currentDay} ${phaseSymbols[currentPhaseIndex]}`;

        // Turn Indicator
        elements.battle.turnIndicator.textContent = isEnemyTurnPending ? "Enemy Turn" : "Your Turn";
        elements.battle.turnIndicator.className = isEnemyTurnPending ? "enemy" : "player";

        // Enemy Stats
        if (enemy) {
            elements.battle.enemyName.textContent = enemy.name;
            elements.battle.enemyHealth.textContent = Math.max(enemy.health, 0);
            elements.battle.enemyMaxHealth.textContent = enemy.maxHealth;
            elements.battle.enemyAttack.textContent = enemy.currentAction?.split(" ")[1] || "0";
            elements.battle.enemyCondition.textContent = enemy.shield ? "Shielded: Use Red Gems to bypass" : "";
            
            if (enemy.actionQueue) {
                elements.battle.enemyActionQueue.textContent = 
                    `Next: ${enemy.actionQueue.slice(0, 3).map(a => a.split(" ")[0]).join(", ")}`;
            }
        }

        // Buffs
        updateBuffs(player.buffs, enemy?.buffs || []);

        // Action Buttons
        const isStunned = player.buffs.some(b => b.type === "stunned");
        const canPlayGems = selectedGems.size > 0 && 
            Array.from(selectedGems).every(i => hand[i]) &&
            player.stamina >= Math.min(...Array.from(selectedGems).map(i => hand[i].cost));
        
        elements.battle.executeBtn.disabled = battleOver || !canPlayGems || isEnemyTurnPending || isStunned;
        elements.battle.waitBtn.disabled = battleOver || isEnemyTurnPending || State.get('hasActedThisTurn') || State.get('hasPlayedGemThisTurn') || isStunned;
        elements.battle.discardEndBtn.disabled = battleOver || !selectedGems.size || isEnemyTurnPending || State.get('hasActedThisTurn') || isStunned;
        elements.battle.endTurnBtn.disabled = battleOver || isEnemyTurnPending || isStunned;
        elements.battle.fleeBtn.style.display = (currentPhaseIndex < 2 && !battleOver && !isEnemyTurnPending && !isStunned) ? "block" : "none";

        // Hand Display
        renderHand();
        updateBattleUIPlacements();
    }

    // Button Handlers Setup
    function setupButtonHandlers() {
        // Clear existing handlers
        Object.values(elements).forEach(group => {
            if (group && typeof group === 'object') {
                Object.values(group).forEach(el => {
                    if (el && el instanceof HTMLElement) {
                        el.onclick = null;
                    }
                });
            }
        });

        // Character Select
        elements.characterSelect.knightBtn?.addEventListener('click', () => 
            eventBus.publish('CHARACTER_SELECTED', 'Knight'));
        elements.characterSelect.mageBtn?.addEventListener('click', () => 
            eventBus.publish('CHARACTER_SELECTED', 'Mage'));
        elements.characterSelect.rogueBtn?.addEventListener('click', () => 
            eventBus.publish('CHARACTER_SELECTED', 'Rogue'));
        elements.characterSelect.resetBtn?.addEventListener('click', () => 
            eventBus.publish('RESET_META_PROGRESSION'));

        // Gem Catalog
        elements.gemCatalog.continueJourneyBtn?.addEventListener('click', () => 
            eventBus.publish('START_JOURNEY'));

        // Battle Screen
        elements.battle.executeBtn?.addEventListener('click', () => 
            eventBus.publish('EXECUTE_GEMS'));
        elements.battle.waitBtn?.addEventListener('click', () => 
            eventBus.publish('WAIT_TURN'));
        elements.battle.discardEndBtn?.addEventListener('click', () => 
            eventBus.publish('DISCARD_AND_END'));
        elements.battle.endTurnBtn?.addEventListener('click', () => 
            eventBus.publish('END_TURN'));
        elements.battle.fleeBtn?.addEventListener('click', () => 
            eventBus.publish('FLEE_BATTLE'));

        // Shop Screen
        elements.shop.buyRandomGem?.addEventListener('click', () => 
            eventBus.publish('BUY_RANDOM_GEM'));
        elements.shop.discardGem?.addEventListener('click', () => 
            eventBus.publish('DISCARD_SELECTED_GEM'));
        elements.shop.upgradeGem?.addEventListener('click', () => 
            eventBus.publish('UPGRADE_SELECTED_GEM'));
        elements.shop.cancelUpgrade?.addEventListener('click', () => 
            eventBus.publish('CANCEL_UPGRADE'));
        elements.shop.heal10?.addEventListener('click', () => 
            eventBus.publish('HEAL_IN_SHOP'));
        elements.shop.continueBtn?.addEventListener('click', () => 
            eventBus.publish('CONTINUE_FROM_SHOP'));

        // Camp Screen
        elements.camp.withdrawBtn?.addEventListener('click', () => 
            eventBus.publish('WITHDRAW_ZENNY', 
                parseInt(elements.camp.withdrawAmount.value)));
        elements.camp.depositBtn?.addEventListener('click', () => 
            eventBus.publish('DEPOSIT_ZENNY', 
                parseInt(elements.camp.depositAmount.value)));
        elements.camp.nextDayBtn?.addEventListener('click', () => 
            eventBus.publish('START_NEXT_DAY'));
    }

    // ... (Keep all existing rendering functions like renderHand, renderShopHand, etc.) ...
    // ... (Keep all utility functions like updateStaminaDisplay, updateBuffs, etc.) ...

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
        showDefeatEffect
    };
})(EventBus);