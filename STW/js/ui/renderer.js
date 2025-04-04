import { GameState } from '../core/state.js';
import { EventBus } from '../core/eventbus.js';
import { Config } from '../core/config.js';
import { Utils } from '../core/utils.js';
import { Gems } from '../systems/gem.js';

/**
 * Unified Renderer Module
 * Combines rendering logic from previous renderer and UI modules
 */
export const Renderer = (() => {
    // DOM element cache
    const elements = {
        screens: {},
        battle: {},
        shop: {},
        camp: {},
        gemCatalog: {},
        system: {}
    };

    /**
     * Initialize the renderer
     * @returns {Boolean} Initialization success
     */
    function initialize() {
        console.log("Initializing Unified Renderer");
        
        // Cache DOM elements
        cacheElements();
        
        // Setup event listeners
        setupEventListeners();
        
        return true;
    }

    /**
     * Cache all necessary DOM elements
     */
    function cacheElements() {
        const safeGetElement = (id) => {
            const element = document.getElementById(id);
            if (!element) console.warn(`Element with ID '${id}' not found`);
            return element;
        };

        // Screen elements
        elements.screens = {
            characterSelect: safeGetElement('character-select-screen'),
            battle: safeGetElement('battle-screen'),
            shop: safeGetElement('shop-screen'),
            camp: safeGetElement('camp-screen'),
            gemCatalog: safeGetElement('gem-catalog-screen')
        };

        // Battle screen elements
        elements.battle = {
            dayPhaseIndicator: safeGetElement('day-phase-indicator'),
            turnIndicator: safeGetElement('turn-indicator'),
            playerHealth: safeGetElement('player-health'),
            playerMaxHealth: safeGetElement('player-max-health'),
            playerStaminaFill: safeGetElement('stamina-fill'),
            playerStaminaText: safeGetElement('stamina-text'),
            playerBuffs: safeGetElement('player-buffs'),
            playerZenny: safeGetElement('zenny'),
            hand: safeGetElement('hand'),
            enemyName: safeGetElement('enemy-name'),
            enemyHealth: safeGetElement('enemy-health'),
            enemyMaxHealth: safeGetElement('enemy-max-health'),
            battleEffects: safeGetElement('battle-effects'),
            gemBagCount: safeGetElement('gem-bag-count'),
            gemBagTotal: safeGetElement('gem-bag-total')
        };

        // Shop screen elements
        elements.shop = {
            shopHand: safeGetElement('shop-hand'),
            gemPool: safeGetElement('gem-pool'),
            buyRandomGem: safeGetElement('buy-random-gem'),
            discardGem: safeGetElement('discard-gem'),
            upgradeGem: safeGetElement('upgrade-gem'),
            heal10: safeGetElement('heal-10'),
            shopHealth: safeGetElement('shop-health'),
            shopMaxHealth: safeGetElement('shop-max-health'),
            shopZenny: safeGetElement('shop-zenny')
        };

        // System elements
        elements.system = {
            message: safeGetElement('message'),
            loadingOverlay: safeGetElement('loading-overlay'),
            errorOverlay: safeGetElement('error-overlay')
        };
    }

    /**
     * Setup event listeners for renderer
     */
    function setupEventListeners() {
        EventBus.on('SCREEN_CHANGE', (screenName) => {
            switchScreen(screenName);
        });

        EventBus.on('UI_MESSAGE', ({ message, type = 'success', duration = 2000 }) => {
            showMessage(message, type, duration);
        });

        EventBus.on('BATTLE_UI_UPDATE', (battleData) => {
            updateBattleScreen(battleData);
        });

        EventBus.on('SHOP_UI_UPDATE', () => {
            updateShopScreen();
        });

        // Add more event listeners as needed
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
        } else {
            console.error(`Target screen "${screenName}" not found`);
        }
    }

    /**
     * Update battle screen UI
     * @param {Object} [battleData] - Optional battle data
     */
    function updateBattleScreen(battleData) {
        if (!battleData) {
            battleData = {
                player: GameState.get('player'),
                enemy: GameState.get('battle.enemy'),
                battle: {
                    currentDay: GameState.get('currentDay'),
                    currentPhaseIndex: GameState.get('currentPhaseIndex'),
                    isEnemyTurnPending: GameState.get('isEnemyTurnPending')
                }
            };
        }

        const { player, enemy, battle } = battleData;

        // Update player stats
        if (elements.battle.playerHealth) 
            elements.battle.playerHealth.textContent = player.health;
        if (elements.battle.playerMaxHealth) 
            elements.battle.playerMaxHealth.textContent = player.maxHealth;
        if (elements.battle.playerZenny) 
            elements.battle.playerZenny.textContent = player.zenny;

        // Update stamina display
        updateStaminaDisplay(player.stamina, player.baseStamina);

        // Update phase indicator
        updatePhaseIndicator(battle.currentDay, battle.currentPhaseIndex);

        // Update turn indicator
        updateTurnIndicator(battle.isEnemyTurnPending);

        // Update enemy stats
        if (enemy) {
            if (elements.battle.enemyName) 
                elements.battle.enemyName.textContent = enemy.name || "Enemy";
            if (elements.battle.enemyHealth) 
                elements.battle.enemyHealth.textContent = Math.max(enemy.health || 0, 0);
            if (elements.battle.enemyMaxHealth) 
                elements.battle.enemyMaxHealth.textContent = enemy.maxHealth || 0;
        }

        // Render hand
        renderHand();
    }

    /**
     * Update shop screen UI
     */
    function updateShopScreen() {
        const player = GameState.get('player');
        const inUpgradeMode = GameState.get('inUpgradeMode');
        const selectedGems = GameState.get('selectedGems');
        const hand = GameState.get('hand');

        // Update player stats
        if (elements.shop.shopHealth) 
            elements.shop.shopHealth.textContent = player.health;
        if (elements.shop.shopMaxHealth) 
            elements.shop.shopMaxHealth.textContent = player.maxHealth;
        if (elements.shop.shopZenny) 
            elements.shop.shopZenny.textContent = player.zenny;

        // Update shop mode
        if (inUpgradeMode) {
            updateShopUpgradeMode(selectedGems, hand);
        } else {
            updateShopNormalMode(selectedGems, hand);
        }

        // Render shop hand
        renderShopHand();
    }

    /**
     * Update shop in upgrade mode
     * @param {Set} selectedGems - Currently selected gems
     * @param {Array} hand - Current hand of gems
     */
    function updateShopUpgradeMode(selectedGems, hand) {
        const gemCatalog = GameState.get('gemCatalog');
        
        if (elements.shop.gemPool) {
            elements.shop.gemPool.style.display = 'flex';
            elements.shop.gemPool.innerHTML = '';
            
            // Render upgrade options
            gemCatalog.gemPool.forEach((gem, index) => {
                const gemElement = createGemElement(gem, index);
                gemElement.addEventListener('click', () => {
                    EventBus.emit('UPGRADE_OPTION_SELECTED', { poolIndex: index });
                });
                elements.shop.gemPool.appendChild(gemElement);
            });
        }
    }

    /**
     * Update shop in normal mode
     * @param {Set} selectedGems - Currently selected gems
     * @param {Array} hand - Current hand of gems
     */
    function updateShopNormalMode(selectedGems, hand) {
        const player = GameState.get('player');
        
        // Update button states
        if (elements.shop.upgradeGem) {
            elements.shop.upgradeGem.disabled = selectedGems.size === 0 || player.zenny < 5;
        }
        
        if (elements.shop.discardGem) {
            elements.shop.discardGem.disabled = selectedGems.size === 0 || player.zenny < 3;
        }
        
        if (elements.shop.buyRandomGem) {
            elements.shop.buyRandomGem.disabled = player.zenny < 3;
        }
    }

    /**
     * Update gem catalog screen
     */
    function updateGemCatalogScreen() {
        const metaZenny = GameState.get('metaZenny');
        const gemCatalog = GameState.get('gemCatalog');
        const playerClass = GameState.get('player.class');

        // Render unlocked and available gems
        renderUnlockedGems(gemCatalog, playerClass);
        renderAvailableGems(gemCatalog, playerClass, metaZenny);
    }

    /**
     * Update camp screen
     */
    function updateCampScreen() {
        const currentDay = GameState.get('currentDay');
        const player = GameState.get('player');
        const metaZenny = GameState.get('metaZenny');

        // Update day and zenny displays
        const campDay = document.getElementById('camp-day');
        const campZenny = document.getElementById('camp-zenny');
        const campMetaZenny = document.getElementById('camp-meta-zenny');

        if (campDay) campDay.textContent = currentDay;
        if (campZenny) campZenny.textContent = player.zenny;
        if (campMetaZenny) campMetaZenny.textContent = metaZenny;
    }

    /**
     * Render gems in hand
     * @param {Boolean} [isShop=false] - Whether rendering in shop context
     */
    function renderHand(isShop = false) {
        const hand = GameState.get('hand');
        const selectedGems = GameState.get('selectedGems');
        const handContainer = isShop ? elements.shop.shopHand : elements.battle.hand;

        if (!handContainer) return;

        // Clear current hand
        handContainer.innerHTML = '';

        // Render each gem
        hand.forEach((gem, index) => {
            const isSelected = selectedGems.has(index);
            const gemElement = createGemElement(gem, index, isSelected);
            
            // Add click handler
            gemElement.addEventListener('click', () => {
                EventBus.emit('GEM_SELECT', { 
                    index, 
                    context: isShop ? 'shop' : 'battle' 
                });
            });

            handContainer.appendChild(gemElement);
        });
    }

    /**
     * Render shop hand (alias for renderHand with shop context)
     */
    function renderShopHand() {
        renderHand(true);
    }

    /**
     * Show a notification message
     * @param {String} message - Message to display
     * @param {String} type - Message type
     * @param {Number} duration - Display duration
     */
    function showMessage(message, type = 'success', duration = 2000) {
        const messageEl = elements.system.message;
        
        if (!messageEl) {
            console.warn("Message element not found");
            return;
        }
        
        messageEl.textContent = message;
        messageEl.className = '';
        messageEl.classList.add(type, 'visible');
        
        setTimeout(() => {
            messageEl.classList.remove('visible');
        }, duration);
    }

    // Helper rendering and utility functions would be added here...
    // (createGemElement, renderUnlockedGems, renderAvailableGems, etc.)

    // Public API
    return {
        initialize,
        switchScreen,
        updateBattleScreen,
        updateShopScreen,
        updateGemCatalogScreen,
        updateCampScreen,
        renderHand,
        renderShopHand,
        showMessage
    };
})();

export default Renderer;