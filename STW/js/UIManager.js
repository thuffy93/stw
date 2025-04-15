// UIManager.js - Handles UI rendering and interactions
export default class UIManager {
    constructor(eventBus, stateManager) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        
        // Store DOM element references
        this.elements = {
            // Character select screen
            characterSelectScreen: document.getElementById('character-select-screen'),
            knightButton: document.getElementById('knight-btn'),
            mageButton: document.getElementById('mage-btn'),
            rogueButton: document.getElementById('rogue-btn'),
            resetButton: document.getElementById('reset-btn'),
            
            // Gem catalog screen
            gemCatalogScreen: document.getElementById('gem-catalog-screen'),
            metaZennyDisplay: document.getElementById('meta-zenny-display'),
            unlockedGems: document.getElementById('unlocked-gems'),
            availableGemsSection: document.getElementById('available-gems-section'),
            availableGems: document.getElementById('available-gems'),
            continueJourneyButton: document.getElementById('continue-journey-btn'),
            
            // Battle screen
            battleScreen: document.getElementById('battle-screen'),
            dayPhaseIndicator: document.getElementById('day-phase-indicator'),
            turnIndicator: document.getElementById('turn-indicator'),
            enemyName: document.getElementById('enemy-name'),
            enemyHealthBar: document.getElementById('enemy-health-bar'),
            enemyHealth: document.getElementById('enemy-health'),
            enemyMaxHealth: document.getElementById('enemy-max-health'),
            enemyBuffs: document.getElementById('enemy-buffs'),
            enemyCondition: document.getElementById('enemy-condition'),
            playerClass: document.getElementById('player-class'),
            playerHealthBar: document.getElementById('player-health-bar'),
            playerHealth: document.getElementById('player-health'),
            playerMaxHealth: document.getElementById('player-max-health'),
            staminaFill: document.getElementById('stamina-fill'),
            staminaText: document.getElementById('stamina-text'),
            playerBuffs: document.getElementById('player-buffs'),
            zennyDisplay: document.getElementById('zenny'),
            hand: document.getElementById('hand'),
            gemBagCount: document.getElementById('gem-bag-count'),
            gemBagCount2: document.getElementById('gem-bag-count2'),
            gemBagTotal: document.getElementById('gem-bag-total'),
            gemBagTotal2: document.getElementById('gem-bag-total2'),
            executeButton: document.getElementById('execute-btn'),
            waitButton: document.getElementById('wait-btn'),
            discardEndButton: document.getElementById('discard-end-btn'),
            endTurnButton: document.getElementById('end-turn-btn'),
            fleeButton: document.getElementById('flee-btn'),
            
            // Shop screen
            shopScreen: document.getElementById('shop-screen'),
            shopHealth: document.getElementById('shop-health'),
            shopMaxHealth: document.getElementById('shop-max-health'),
            shopZenny: document.getElementById('shop-zenny'),
            shopHand: document.getElementById('shop-hand'),
            gemPool: document.getElementById('gem-pool'),
            gemPoolInstructions: document.getElementById('gem-pool-instructions'),
            upgradeGemButton: document.getElementById('upgrade-gem'),
            discardGemButton: document.getElementById('discard-gem'),
            buyRandomGemButton: document.getElementById('buy-random-gem'),
            cancelUpgradeButton: document.getElementById('cancel-upgrade'),
            swapGemButton: document.getElementById('swap-gem'),
            healButton: document.getElementById('heal-10'),
            shopContinueButton: document.getElementById('continue-btn'),
            shopGemBagCount: document.getElementById('shop-gem-bag-count'),
            shopGemBagTotal: document.getElementById('shop-gem-bag-total'),
            
            // Camp screen
            campScreen: document.getElementById('camp-screen'),
            campDay: document.getElementById('camp-day'),
            campZenny: document.getElementById('camp-zenny'),
            campMetaZenny: document.getElementById('camp-meta-zenny'),
            withdrawAmount: document.getElementById('withdraw-amount'),
            withdrawButton: document.getElementById('withdraw-btn'),
            depositAmount: document.getElementById('deposit-amount'),
            depositButton: document.getElementById('deposit-btn'),
            nextDayButton: document.getElementById('next-day-btn'),
            
            // Message display
            messageElement: document.getElementById('message'),
            
            // Overlays
            loadingOverlay: document.getElementById('loading-overlay'),
            errorOverlay: document.getElementById('error-overlay'),
            
            // Audio button
            audioButton: document.getElementById('audio-button'),
 
            gemBagOverlay: null,
            gemBagCloseButton: null,
            availableGemsContainer: null,
            playedGemsContainer: null,
            availableGemsCount: null,
            playedGemsCount: null
        };

        // Set up core event listeners once
        this.setupBasicEventListeners();
        
        // Track overlay state to prevent duplicate handling
        this.overlayEventsBound = false;
        
        // Track selected gems in hand
        this.selectedGems = [];
        
        // Track shop state
        this.shopState = {
            selectedHandGem: null,
            upgradeMode: false,
            upgradeOptions: []
        };
    }
    
    // Setup permanent event listeners (those that don't change with screens)
    setupBasicEventListeners() {
        // Character selection - these buttons are always in the DOM
        this.elements.knightButton.addEventListener('click', () => this.selectClass('knight'));
        this.elements.mageButton.addEventListener('click', () => this.selectClass('mage'));
        this.elements.rogueButton.addEventListener('click', () => this.selectClass('rogue'));
        this.elements.resetButton.addEventListener('click', () => this.resetGame());
        
        // Event listeners for state changes
        this.eventBus.on('state:updated', () => this.updateUI());
        this.eventBus.on('screen:changed', (screenId) => this.onScreenChanged(screenId));
        this.eventBus.on('message:show', (data) => this.showMessage(data.text, data.type));
        
        // Listen for battle events
        this.eventBus.on('battle:started', (data) => this.onBattleStarted(data));
        this.eventBus.on('battle:victory', (data) => this.onBattleVictory(data));
        this.eventBus.on('battle:defeat', (data) => this.onBattleDefeat(data));
        this.eventBus.on('gem:drawn', (gemData) => this.onGemDrawn(gemData));
        this.eventBus.on('player:damaged', (data) => this.onPlayerDamaged(data));
        this.eventBus.on('enemy:damaged', (data) => this.onEnemyDamaged(data));
        this.eventBus.on('player:healed', (data) => this.onPlayerHealed(data));
        
        // Listen for shop events
        this.eventBus.on('shop:enter', () => this.setupShop());

        // Add these new event listeners for overlay handling
        this.eventBus.on('overlay:open-gem-bag', () => {
            console.log('EventBus received overlay:open-gem-bag event');
            this.openGemBagOverlay();
        });
        
        this.eventBus.on('overlay:close-gem-bag', () => {
            console.log('EventBus received overlay:close-gem-bag event');
            this.closeGemBagOverlay();
        });
        
        // Add Escape key listener at the global level (just once)
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && 
                this.elements.gemBagOverlay && 
                this.elements.gemBagOverlay.style.display === 'block') {
                console.log('Escape key pressed, closing overlay');
                this.eventBus.emit('overlay:close-gem-bag');
            }
        });
    }
    
    // Setup screen-specific event listeners
    setupScreenEventListeners(screenId) {
        console.log(`Setting up event listeners for screen: ${screenId}`);
        
        // Clear any existing listeners for screen-specific elements
        // (this is a preventive measure, though modern browsers typically clean these up
        // when elements are removed from the DOM)
        
        switch(screenId) {
            case 'gem-catalog-screen':
                // Refresh the reference to the continue button
                this.elements.continueJourneyButton = document.getElementById('continue-journey-btn');
                
                if (this.elements.continueJourneyButton) {
                    console.log('Found continue journey button, attaching listener');
                    
                    // Remove any existing listeners (cloned node approach)
                    const newButton = this.elements.continueJourneyButton.cloneNode(true);
                    this.elements.continueJourneyButton.parentNode.replaceChild(newButton, this.elements.continueJourneyButton);
                    this.elements.continueJourneyButton = newButton;
                    
                    // Add the click listener
                    this.elements.continueJourneyButton.addEventListener('click', () => {
                        console.log('Continue journey button clicked!');
                        this.startJourney();
                    });
                } else {
                    console.error('Continue journey button not found in the DOM!');
                }
                break;

            case 'battle-screen':
                // Refresh the references to buttons 
                this.elements.executeButton = document.getElementById('execute-btn');
                this.elements.waitButton = document.getElementById('wait-btn');
                this.elements.discardEndButton = document.getElementById('discard-end-btn');
                this.elements.endTurnButton = document.getElementById('end-turn-btn');
                this.elements.fleeButton = document.getElementById('flee-btn');
                
                // Set up battle action event listeners
                if (this.elements.executeButton) {
                    const newExecuteBtn = this.elements.executeButton.cloneNode(true);
                    this.elements.executeButton.parentNode.replaceChild(newExecuteBtn, this.elements.executeButton);
                    this.elements.executeButton = newExecuteBtn;
                    this.elements.executeButton.addEventListener('click', () => this.executeGems());
                }
                
                if (this.elements.waitButton) {
                    const newWaitBtn = this.elements.waitButton.cloneNode(true);
                    this.elements.waitButton.parentNode.replaceChild(newWaitBtn, this.elements.waitButton);
                    this.elements.waitButton = newWaitBtn;
                    this.elements.waitButton.addEventListener('click', () => this.waitAction());
                }
                
                if (this.elements.discardEndButton) {
                    const newDiscardBtn = this.elements.discardEndButton.cloneNode(true);
                    this.elements.discardEndButton.parentNode.replaceChild(newDiscardBtn, this.elements.discardEndButton);
                    this.elements.discardEndButton = newDiscardBtn;
                    this.elements.discardEndButton.addEventListener('click', () => this.discardAndEndTurn());
                }
                
                if (this.elements.endTurnButton) {
                    const newEndTurnBtn = this.elements.endTurnButton.cloneNode(true);
                    this.elements.endTurnButton.parentNode.replaceChild(newEndTurnBtn, this.elements.endTurnButton);
                    this.elements.endTurnButton = newEndTurnBtn;
                    this.elements.endTurnButton.addEventListener('click', () => this.endTurn());
                }
                
                if (this.elements.fleeButton) {
                    const newFleeBtn = this.elements.fleeButton.cloneNode(true);
                    this.elements.fleeButton.parentNode.replaceChild(newFleeBtn, this.elements.fleeButton);
                    this.elements.fleeButton = newFleeBtn;
                    this.elements.fleeButton.addEventListener('click', () => this.fleeBattle());
                }
                break;
                
            case 'shop-screen':
                // Refresh shop button references
                this.elements.upgradeGemButton = document.getElementById('upgrade-gem');
                this.elements.discardGemButton = document.getElementById('discard-gem');
                this.elements.buyRandomGemButton = document.getElementById('buy-random-gem');
                this.elements.cancelUpgradeButton = document.getElementById('cancel-upgrade');
                this.elements.healButton = document.getElementById('heal-10');
                this.elements.shopContinueButton = document.getElementById('continue-btn');
                
                // Set up shop action event listeners
                if (this.elements.upgradeGemButton) {
                    const newUpgradeBtn = this.elements.upgradeGemButton.cloneNode(true);
                    this.elements.upgradeGemButton.parentNode.replaceChild(newUpgradeBtn, this.elements.upgradeGemButton);
                    this.elements.upgradeGemButton = newUpgradeBtn;
                    this.elements.upgradeGemButton.addEventListener('click', () => this.upgradeGem());
                }
                
                if (this.elements.discardGemButton) {
                    const newDiscardBtn = this.elements.discardGemButton.cloneNode(true);
                    this.elements.discardGemButton.parentNode.replaceChild(newDiscardBtn, this.elements.discardGemButton);
                    this.elements.discardGemButton = newDiscardBtn;
                    this.elements.discardGemButton.addEventListener('click', () => this.discardGem());
                }
                
                if (this.elements.buyRandomGemButton) {
                    const newBuyBtn = this.elements.buyRandomGemButton.cloneNode(true);
                    this.elements.buyRandomGemButton.parentNode.replaceChild(newBuyBtn, this.elements.buyRandomGemButton);
                    this.elements.buyRandomGemButton = newBuyBtn;
                    this.elements.buyRandomGemButton.addEventListener('click', () => this.buyRandomGem());
                }
                
                if (this.elements.cancelUpgradeButton) {
                    const newCancelBtn = this.elements.cancelUpgradeButton.cloneNode(true);
                    this.elements.cancelUpgradeButton.parentNode.replaceChild(newCancelBtn, this.elements.cancelUpgradeButton);
                    this.elements.cancelUpgradeButton = newCancelBtn;
                    this.elements.cancelUpgradeButton.addEventListener('click', () => this.cancelUpgrade());
                }
                
                if (this.elements.healButton) {
                    const newHealBtn = this.elements.healButton.cloneNode(true);
                    this.elements.healButton.parentNode.replaceChild(newHealBtn, this.elements.healButton);
                    this.elements.healButton = newHealBtn;
                    this.elements.healButton.addEventListener('click', () => this.healPlayer());
                }
                
                if (this.elements.shopContinueButton) {
                    const newContinueBtn = this.elements.shopContinueButton.cloneNode(true);
                    this.elements.shopContinueButton.parentNode.replaceChild(newContinueBtn, this.elements.shopContinueButton);
                    this.elements.shopContinueButton = newContinueBtn;
                    this.elements.shopContinueButton.addEventListener('click', () => this.continueFromShop());
                }
                break;
                
            case 'camp-screen':
                // Refresh camp button references
                this.elements.withdrawButton = document.getElementById('withdraw-btn');
                this.elements.depositButton = document.getElementById('deposit-btn');
                this.elements.nextDayButton = document.getElementById('next-day-btn');
                
                // Set up camp action event listeners
                if (this.elements.withdrawButton) {
                    const newWithdrawBtn = this.elements.withdrawButton.cloneNode(true);
                    this.elements.withdrawButton.parentNode.replaceChild(newWithdrawBtn, this.elements.withdrawButton);
                    this.elements.withdrawButton = newWithdrawBtn;
                    this.elements.withdrawButton.addEventListener('click', () => this.withdrawZenny());
                }
                
                if (this.elements.depositButton) {
                    const newDepositBtn = this.elements.depositButton.cloneNode(true);
                    this.elements.depositButton.parentNode.replaceChild(newDepositBtn, this.elements.depositButton);
                    this.elements.depositButton = newDepositBtn;
                    this.elements.depositButton.addEventListener('click', () => this.depositZenny());
                }
                
                if (this.elements.nextDayButton) {
                    const newNextDayBtn = this.elements.nextDayButton.cloneNode(true);
                    this.elements.nextDayButton.parentNode.replaceChild(newNextDayBtn, this.elements.nextDayButton);
                    this.elements.nextDayButton = newNextDayBtn;
                    this.elements.nextDayButton.addEventListener('click', () => this.startNextDay());
                }
                break;
        }
    }
    
    // Update the entire UI based on current state
    updateUI() {
        const state = this.stateManager.getState();
        
        // Update battle UI if on battle screen
        if (state.currentScreen === 'battle-screen') {
            this.updateBattleUI();
        }
        
        // Update shop UI if on shop screen
        else if (state.currentScreen === 'shop-screen') {
            this.updateShopUI();
        }
        
        // Update camp UI if on camp screen
        else if (state.currentScreen === 'camp-screen') {
            this.updateCampUI();
        }
        
        // Update gem catalog if on that screen
        else if (state.currentScreen === 'gem-catalog-screen') {
            this.updateGemCatalogUI();
        }
    }
    
    // Handle screen changes
    onScreenChanged(screenId) {
        console.log(`Screen changed to: ${screenId}`);
        
        // Clear previous screen-specific state
        if (screenId === 'battle-screen') {
            this.selectedGems = [];
            
            // Set background based on phase
            const phase = this.stateManager.getState().journey.phase;
            this.elements.battleScreen.className = 'screen active';
            this.elements.battleScreen.classList.add(phase.toLowerCase());
            
            this.updateBattleUI();
        } 
        else if (screenId === 'shop-screen') {
            this.shopState = {
                selectedHandGem: null,
                upgradeMode: false,
                upgradeOptions: []
            };
            this.setupShop();
        }
        
        // Get fresh state
        const state = this.stateManager.getState();
        
        // Update UI for screens
        this.updateUI();
        
        // Set up event listeners for the current screen
        this.setupScreenEventListeners(screenId);
    
        // Important: Set up gem bag containers after screen change
        // Reset overlay event binding flag to ensure proper setup
        this.overlayEventsBound = false;
        
        // Use a single timeout to prevent race conditions
        setTimeout(() => {
            console.log('Setting up gem bag containers after screen change');
            this.setupGemBagContainers();
            this.updateOverlayElementReferences();
        }, 200);
    }

    
    // Select character class
    selectClass(classType) {
        // Initialize player stats based on class
        const playerStats = {
            class: classType,
            buffs: [] // Explicitly initialize with empty buffs array
        };
        
        // Set class-specific starting values
        switch(classType) {
            case 'knight':
                playerStats.health = 50;             // Increased from 40
                playerStats.maxHealth = 50;          // Increased from 40
                playerStats.stamina = 3;             // Same
                playerStats.maxStamina = 3;          // Same
                playerStats.zenny = 0;               // Same
                break;
                
            case 'mage':
                playerStats.health = 30;             // Same
                playerStats.maxHealth = 30;          // Same
                playerStats.stamina = 5;             // Increased from 4
                playerStats.maxStamina = 5;          // Increased from 4
                playerStats.zenny = 0;               // Same
                break;
                
            case 'rogue':
                playerStats.health = 40;             // Increased from 35
                playerStats.maxHealth = 40;          // Increased from 35
                playerStats.stamina = 4;             // Increased from 3
                playerStats.maxStamina = 4;          // Increased from 3
                playerStats.zenny = 0;               // Same, already higher than others
                break;
                
            default:
                console.error(`Unknown class type: ${classType}`);
                return;
        }
        
        console.log("Initializing player with clean state, no buffs or debuffs");
        
        // Update state with player stats
        this.stateManager.updateState({
            player: playerStats,
            journey: {
                day: 1,
                phase: 'DAWN',
                completed: false
            }
        });
        
        // Emit class selection event
        this.eventBus.emit('class:selected', classType);
        
        // Navigate to gem catalog screen
        this.stateManager.changeScreen('gem-catalog-screen');
    }
    
    // Reset game progress
    resetGame() {
        // Confirm before resetting
        if (confirm('Reset all game progress? This cannot be undone!')) {
            this.stateManager.resetGame();
        }
    }
    
    // Start the journey from gem catalog
    startJourney() {
        // Navigate to battle screen
        this.stateManager.changeScreen('battle-screen');
        
        // Start the first battle after a short delay to ensure UI is ready
        setTimeout(() => {
            this.eventBus.emit('battle:start');
        }, 100);
    }
    
    // Update battle UI with current state
    updateBattleUI() {
        const state = this.stateManager.getState();
        const { player, battle, journey, gems } = state;
        
        if (!battle) return;
        
        // Update day/phase indicator
        let phaseEmoji = '☀️';
        if (journey.phase === 'DUSK') phaseEmoji = '🌆';
        if (journey.phase === 'DARK') phaseEmoji = '🌙';
        
        this.elements.dayPhaseIndicator.textContent = `Day ${journey.day} ${phaseEmoji}`;
        
        // Update turn indicator
        this.elements.turnIndicator.textContent = battle.currentTurn === 'PLAYER' ? 'Your Turn' : 'Enemy Turn';
        this.elements.turnIndicator.classList.remove('player', 'enemy');
        this.elements.turnIndicator.classList.add(battle.currentTurn === 'PLAYER' ? 'player' : 'enemy');
        
        // Update enemy info if in battle
        if (battle.enemy) {
            this.elements.enemyName.textContent = battle.enemy.name;
            
            const healthPercent = (battle.enemy.health / battle.enemy.maxHealth) * 100;
            this.elements.enemyHealthBar.style.width = `${healthPercent}%`;
            this.elements.enemyHealth.textContent = battle.enemy.health;
            this.elements.enemyMaxHealth.textContent = battle.enemy.maxHealth;
            
            // Update enemy buffs
            this.elements.enemyBuffs.innerHTML = '';
            if (battle.enemy.buffs && battle.enemy.buffs.length > 0) {
                battle.enemy.buffs.forEach(buff => {
                    const buffIcon = document.createElement('span');
                    buffIcon.classList.add('buff-icon', buff.type);
                    
                    // Set icon based on buff type
                    let icon = '?';
                    switch(buff.type) {
                        case 'defense': icon = '🛡️'; break;
                        case 'attack-boost': icon = '⚡'; break;
                        case 'poison': icon = '☠️'; break;
                        case 'stunned': icon = '💫'; break;
                        case 'minion': icon = '👺'; break;
                    }
                    
                    buffIcon.textContent = icon;
                    
                    // Add turns remaining
                    const turnsSpan = document.createElement('span');
                    turnsSpan.classList.add('turns');
                    turnsSpan.textContent = buff.duration;
                    buffIcon.appendChild(turnsSpan);
                    
                    // Add tooltip
                    let tooltipText = '';
                    switch(buff.type) {
                        case 'defense': 
                            tooltipText = `Defense: ${buff.value}\nTurns: ${buff.duration}`; 
                            break;
                        case 'attack-boost': 
                            tooltipText = `Attack +${buff.value}\nTurns: ${buff.duration}`; 
                            break;
                        case 'poison': 
                            tooltipText = `Poison: ${buff.value} dmg/turn\nTurns: ${buff.duration}`; 
                            break;
                        case 'stunned': 
                            tooltipText = `Stunned\nTurns: ${buff.duration}`; 
                            break;
                        case 'minion': 
                            tooltipText = `Minion: +${buff.value} damage\nTurns: ${buff.duration}`; 
                            break;
                    }
                    
                    buffIcon.setAttribute('data-tooltip', tooltipText);
                    this.elements.enemyBuffs.appendChild(buffIcon);
                });
            }
            
            // Update next action if available
            if (battle.enemy.nextAction) {
                let actionDisplay = battle.enemy.nextAction.charAt(0).toUpperCase() + 
                                     battle.enemy.nextAction.slice(1);
                this.elements.enemyCondition.textContent = `Next: ${actionDisplay}`;
            } else {
                this.elements.enemyCondition.textContent = '';
            }
        }
        
        // Update player info
        this.elements.playerClass.textContent = `${player.class.charAt(0).toUpperCase() + player.class.slice(1)}`;
        
        const playerHealthPercent = (player.health / player.maxHealth) * 100;
        this.elements.playerHealthBar.style.width = `${playerHealthPercent}%`;
        this.elements.playerHealth.textContent = player.health;
        this.elements.playerMaxHealth.textContent = player.maxHealth;
        
        const staminaPercent = (player.stamina / player.maxStamina) * 100;
        this.elements.staminaFill.style.width = `${staminaPercent}%`;
        this.elements.staminaText.textContent = `${player.stamina}/${player.maxStamina}`;
        
        // Update stamina color
        this.elements.staminaFill.classList.remove('full', 'medium', 'low');
        if (player.stamina >= player.maxStamina) {
            this.elements.staminaFill.classList.add('full');
        } else if (player.stamina >= player.maxStamina / 2) {
            this.elements.staminaFill.classList.add('medium');
        } else {
            this.elements.staminaFill.classList.add('low');
        }
        
        // Update player buffs
        this.elements.playerBuffs.innerHTML = '';
        if (player.buffs && player.buffs.length > 0) {
            player.buffs.forEach(buff => {
                const buffIcon = document.createElement('span');
                buffIcon.classList.add('buff-icon', buff.type);
                
                // Set icon based on buff type
                let icon = '?';
                switch(buff.type) {
                    case 'defense': icon = '🛡️'; break;
                    case 'focus': icon = '🔍'; break;
                    case 'poison': icon = '☠️'; break;
                    case 'stunned': icon = '💫'; break;
                    case 'curse': icon = '👿'; break;
                }
                
                buffIcon.textContent = icon;
                
                // Add turns remaining
                const turnsSpan = document.createElement('span');
                turnsSpan.classList.add('turns');
                turnsSpan.textContent = buff.duration;
                buffIcon.appendChild(turnsSpan);
                
                // Add tooltip
                let tooltipText = '';
                switch(buff.type) {
                    case 'defense': 
                        tooltipText = `Defense: ${buff.value}\nTurns: ${buff.duration}`; 
                        break;
                    case 'focus': 
                        tooltipText = `Focus: +20% damage/healing\nTurns: ${buff.duration}`; 
                        break;
                    case 'poison': 
                        tooltipText = `Poison: ${buff.value} dmg/turn\nTurns: ${buff.duration}`; 
                        break;
                    case 'stunned': 
                        tooltipText = `Stunned\nTurns: ${buff.duration}`; 
                        break;
                    case 'curse': 
                        tooltipText = `Curse: -${buff.value * 100}% damage\nTurns: ${buff.duration}`; 
                        break;
                }
                
                buffIcon.setAttribute('data-tooltip', tooltipText);
                this.elements.playerBuffs.appendChild(buffIcon);
            });
        }
        
        // Update zenny display
        this.elements.zennyDisplay.textContent = player.zenny;
        
        // Update hand
        this.renderHand();
        
        // MODIFIED: Get current gem bag size from state
        const currentBagSize = state.gemBagSize || 20;
        
        // Update gem bag count
        this.elements.gemBagCount.textContent = gems.bag.length;
        this.elements.gemBagCount2.textContent = gems.bag.length;
        this.elements.gemBagTotal.textContent = currentBagSize;
        this.elements.gemBagTotal2.textContent = currentBagSize;
        
        // Update button states
        this.updateBattleButtons();
    }
    
    // Render the player's hand of gems - more efficient DOM updates
    renderHand() {
        const state = this.stateManager.getState();
        if (!state || !state.gems || !state.gems.hand) {
            console.warn('Cannot render hand: missing gems data');
            return;
        }
        
        const { gems, player } = state;
        const { hand } = gems;
        
        // Ensure selectedGems is initialized
        if (!this.selectedGems) {
            this.selectedGems = [];
        }
        
        this.elements.hand.innerHTML = '';
        
        hand.forEach(gem => {
            const gemElement = this.createGemElement(gem, 'battle'); // Specify battle context
            
            // Add selection handler
            gemElement.addEventListener('click', () => {
                this.toggleGemSelection(gem.instanceId);
            });
            
            // Mark as selected if in selectedGems array
            if (this.selectedGems.includes(gem.instanceId)) {
                gemElement.classList.add('selected');
            }
            
            // Mark as unaffordable if not enough stamina
            if (gem.cost > player.stamina) {
                gemElement.classList.add('unaffordable');
            }
            
            this.elements.hand.appendChild(gemElement);
        });
    }
    
    
    // Generate tooltip for a gem - updated to include augmentation info
    generateGemTooltip(gem) {
        // Basic info always shown
        const tooltipParts = [`${gem.name}: ${gem.value} ${gem.type}`];

        // Proficiency info for not fully mastered gems
        if (gem.proficiency < 70) {
            tooltipParts.push(`Mastery: ${Math.floor(gem.proficiency)}%`);
        }

        // Special effects
        if (gem.specialEffect) {
            tooltipParts.push(`Special: ${
                {
                    'draw': 'Draw an extra gem',
                    // Add more special effects as needed
                }[gem.specialEffect] || gem.specialEffect
            }`);
        }

        // Defense bypass for piercing gems
        if (gem.defenseBypass) {
            tooltipParts.push(`Piercing: Bypasses ${gem.defenseBypass * 100}% of enemy defense`);
        }

        // Only show duration for buffs/debuffs
        if (gem.duration) {
            tooltipParts.push(`Duration: ${gem.duration} turns`);
        }

        // Augmentation info
        if (gem.augmentation) {
            tooltipParts.push(`Augmentation: ${gem.augmentation}`);
        }

        return tooltipParts.join('\n');
    }


    // Create a gem DOM element
    createGemElement(gem, context = 'battle') {
        const gemElement = document.createElement('div');
        gemElement.classList.add('gem', gem.color);
        gemElement.setAttribute('data-gem-id', gem.instanceId);
        
        // Add class bonus indicator if applicable
        const playerClass = this.stateManager.getState().player.class;
        if ((playerClass === 'knight' && gem.color === 'red') ||
            (playerClass === 'mage' && gem.color === 'blue') ||
            (playerClass === 'rogue' && gem.color === 'green')) {
            gemElement.classList.add('class-bonus');
        }
        
        // Add unlearned indicator if not fully mastered (now 70% instead of 100%)
        if (gem.proficiency < 70) {
            gemElement.classList.add('unlearned');
        }
        
        // Create gem inner content
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('gem-content');
        
        // Gem icon
        const iconSpan = document.createElement('span');
        iconSpan.classList.add('gem-icon');
        iconSpan.textContent = gem.icon;
        contentDiv.appendChild(iconSpan);
        
        // Gem value
        const valueSpan = document.createElement('span');
        valueSpan.classList.add('gem-value');
        valueSpan.textContent = gem.value;
        contentDiv.appendChild(valueSpan);
        
        gemElement.appendChild(contentDiv);
        
        // Gem stamina cost
        const costDiv = document.createElement('div');
        costDiv.classList.add('gem-cost');
        costDiv.textContent = gem.cost;
        gemElement.appendChild(costDiv);
        
        // Add augmentation badge if gem is augmented
        if (gem.augmentation && gem.badgeIcon) {
            const badgeDiv = document.createElement('div');
            badgeDiv.classList.add('gem-badge');
            badgeDiv.textContent = gem.badgeIcon;
            
            // Position the badge in the top-left corner
            badgeDiv.style.position = 'absolute';
            badgeDiv.style.top = '5px';
            badgeDiv.style.left = '5px';
            badgeDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
            badgeDiv.style.borderRadius = '50%';
            badgeDiv.style.width = '24px';
            badgeDiv.style.height = '24px';
            badgeDiv.style.display = 'flex';
            badgeDiv.style.alignItems = 'center';
            badgeDiv.style.justifyContent = 'center';
            badgeDiv.style.fontSize = '14px';
            badgeDiv.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
            
            // Add a class for the specific augmentation type
            badgeDiv.classList.add(`badge-${gem.augmentation}`);
            
            gemElement.appendChild(badgeDiv);
        }
        
        // MODIFIED: Only add tooltips in non-battle contexts
        if (context === 'shop' || context === 'catalog') {
            // Generate tooltip
            gemElement.setAttribute('data-tooltip', this.generateGemTooltip(gem));
            
            // Add tooltip-enabled class to apply hover styles
            gemElement.classList.add('tooltip-enabled');
        }
        
        return gemElement;
    }    
    
    // Update battle action buttons - check if we need to update
    updateBattleButtons() {
        const state = this.stateManager.getState();
        const { battle, player } = state;
        
        // Ensure selectedGems is initialized
        if (!this.selectedGems) {
            this.selectedGems = [];
        }
        
        // Only enable buttons on player's turn
        const isPlayerTurn = battle.currentTurn === 'PLAYER';
        const isPlayerStunned = player.buffs && player.buffs.some(buff => buff.type === 'stunned');
        
        // Check if gems have been played this turn (checking for played gems this turn)
        const hasPlayedGems = battle.staminaUsed > 0;
        
        if (isPlayerStunned) {
            // If stunned, disable all buttons regardless of other conditions
            this.elements.executeButton.disabled = true;
            this.elements.waitButton.disabled = true;
            this.elements.discardEndButton.disabled = true;
            this.elements.endTurnButton.disabled = true;
            this.elements.fleeButton.disabled = true;
            
            // Add a visual indicator for the stunned state
            document.getElementById('player-stats').classList.add('stunned');
        } else {
            // Normal button state handling
            this.elements.executeButton.disabled = !isPlayerTurn || this.selectedGems.length === 0;
            
            // Disable Wait and Discard & End if gems have been played this turn
            this.elements.waitButton.disabled = !isPlayerTurn || hasPlayedGems;
            this.elements.discardEndButton.disabled = !isPlayerTurn || this.selectedGems.length === 0 || hasPlayedGems;
            
            this.elements.endTurnButton.disabled = !isPlayerTurn;
            
            // Only enable flee in Dawn/Dusk phases
            const canFlee = state.journey.phase !== 'DARK';
            this.elements.fleeButton.disabled = !isPlayerTurn || !canFlee;
            
            // Remove stunned visual indicator
            document.getElementById('player-stats').classList.remove('stunned');
        }
    }
    
    unlockGem(gemId) {
        // Get gem definition to show its name in the confirmation
        this.eventBus.emit('gem:get-definitions', {
            callback: (definitions) => {
                const gemDef = definitions[gemId];
                
                if (!gemDef) {
                    console.error(`Unknown gem ID for confirmation: ${gemId}`);
                    return;
                }
                
                // Show confirmation dialog
                if (confirm(`Are you sure you want to unlock ${gemDef.name} for 50 Meta $ZENNY?`)) {
                    // Make sure we call the correct unlock method on the gem manager
                    this.eventBus.emit('gem:unlock', gemId);
                }
            }
        });
    }
    
    // Toggle gem selection
    toggleGemSelection(gemInstanceId) {
        // Ensure selectedGems is initialized
        if (!this.selectedGems) {
            this.selectedGems = [];
        }
        
        const index = this.selectedGems.indexOf(gemInstanceId);
        
        if (index === -1) {
            // Add to selection
            this.selectedGems.push(gemInstanceId);
        } else {
            // Remove from selection
            this.selectedGems.splice(index, 1);
        }
        
        // Update UI
        const gemElements = this.elements.hand.querySelectorAll('.gem');
        gemElements.forEach(elem => {
            if (elem.getAttribute('data-gem-id') === gemInstanceId) {
                elem.classList.toggle('selected', this.selectedGems.includes(gemInstanceId));
            }
        });
        
        // Update button states
        this.updateBattleButtons();
    }
    
    // Execute selected gems
    executeGems() {
        // Ensure selectedGems is initialized
        if (!this.selectedGems) {
            this.selectedGems = [];
        }
        
        if (this.selectedGems.length === 0) {
            this.showMessage('No gems selected!', 'error');
            return;
        }
        
        // Emit gems play event
        this.eventBus.emit('gems:play', this.selectedGems);
        
        // Clear selection
        this.selectedGems = [];
        
        // Update button states immediately after executing gems
        this.updateBattleButtons();
    }
    
    // Wait action (gains focus)
    waitAction() {
        // When player waits, they should get 3 stamina recovery
        // Track with special value 0 to indicate waiting/skipping
        this.eventBus.emit('stamina:used', 0);
        this.eventBus.emit('player:wait');
        
        console.log("Player chose to wait (focus) - will recover 3 stamina");
    }
    
    // Discard selected gems and end turn
    discardAndEndTurn() {
        // Ensure selectedGems is initialized
        if (!this.selectedGems) {
            this.selectedGems = [];
        }
        
        if (this.selectedGems.length === 0) {
            this.showMessage('No gems selected to discard!', 'error');
            return;
        }
        
        // Emit discard event
        this.eventBus.emit('gems:discard', this.selectedGems);
        
        // When discarding, player should get 3 stamina recovery
        // Track with special value 0 to indicate waiting/skipping
        this.eventBus.emit('stamina:used', 0);
        
        console.log("Player discarded gems and ended turn - will recover 3 stamina");
        
        // Clear selection and end turn
        this.selectedGems = [];
        this.endTurn();
    }
    
    // End player turn
    endTurn() {
        // If player directly ends turn without playing gems,
        // track with special value 0 to get the 3 stamina recovery
        const state = this.stateManager.getState();
        const battle = state.battle;
        
        // Only emit if this is actually the player's turn
        if (battle && battle.currentTurn === 'PLAYER') {
            // Only emit if we haven't already tracked stamina usage this turn
            // This prevents double-counting when called from discardAndEndTurn or waitAction
            if (!battle.staminaUsed || battle.staminaUsed === 0) {
                this.eventBus.emit('stamina:used', 0);
                console.log("Player directly ended turn - will recover 3 stamina");
            }
        }
        
        this.eventBus.emit('turn:ended');
    }
    
    // Flee from battle
    fleeBattle() {
        this.eventBus.emit('battle:flee');
    }
    
    // Show shop and setup UI
    setupShop() {
        // Get a fresh state directly to ensure we have the latest data
        const state = this.stateManager.getState();
        
        if (!state || !state.player) {
            console.error("Cannot setup shop: missing player state");
            return;
        }
        
        const { player, gems } = state;
        
        // Update shop stats
        this.elements.shopHealth.textContent = player.health;
        this.elements.shopMaxHealth.textContent = player.maxHealth;
        this.elements.shopZenny.textContent = player.zenny;
        
        // Render gems in hand
        this.renderShopHand();
        
        // Clear gem pool
        this.elements.gemPool.innerHTML = '';
        this.elements.gemPoolInstructions.textContent = 'Select a gem from your hand';
        
        // Update button states
        this.updateShopButtons();
        
        // Update gem bag count
        this.elements.shopGemBagCount.textContent = gems.bag.length;
        const currentBagSize = state.gemBagSize || 30;
        this.elements.shopGemBagTotal.textContent = currentBagSize;
        
        // NEW: Get and render shop inventory
        this.renderShopInventory();
    }
    
    // Update shop UI
    updateShopUI() {
        // Get a fresh state reference
        const state = this.stateManager.getState();
        if (!state || !state.player) {
            console.warn("Cannot update shop UI: missing player state");
            return;
        }
        
        const { player, gems } = state;
        
        // Update shop stats
        this.elements.shopHealth.textContent = player.health;
        this.elements.shopMaxHealth.textContent = player.maxHealth;
        this.elements.shopZenny.textContent = player.zenny;
        
        // Render gems in hand if needed
        this.renderShopHand();
        
        // MODIFIED: Get current gem bag size from state
        const currentBagSize = state.gemBagSize || 20;
        
        // Update gem bag count
        this.elements.shopGemBagCount.textContent = gems.bag.length;
        this.elements.shopGemBagTotal.textContent = currentBagSize;
        
        // Update button states
        this.updateShopButtons();
    }
    // Render shop inventory
    renderShopInventory() {
        // First, check if the shop inventory section exists
        let shopInventorySection = document.getElementById('shop-inventory-section');
        
        // If it doesn't exist, create it
        if (!shopInventorySection) {
            // Create a new section for shop inventory
            shopInventorySection = document.createElement('div');
            shopInventorySection.id = 'shop-inventory-section';
            shopInventorySection.className = 'shop-section';
            shopInventorySection.style.marginTop = '20px';
            
            // Add a header
            const header = document.createElement('h2');
            header.textContent = 'Gems For Sale';
            shopInventorySection.appendChild(header);
            
            // Create container for inventory items
            const inventoryContainer = document.createElement('div');
            inventoryContainer.id = 'shop-inventory-container';
            inventoryContainer.className = 'gem-container';
            inventoryContainer.style.display = 'flex';
            inventoryContainer.style.flexWrap = 'wrap';
            inventoryContainer.style.justifyContent = 'center';
            inventoryContainer.style.gap = '15px';
            inventoryContainer.style.margin = '10px 0';
            
            shopInventorySection.appendChild(inventoryContainer);
            
            // Insert the new section before the continue button
            const shopSelections = document.getElementById('shop-selections');
            const continueBtn = document.getElementById('continue-btn');
            
            if (shopSelections && continueBtn) {
                shopSelections.insertBefore(shopInventorySection, continueBtn);
            } else {
                // Fallback
                if (shopSelections) {
                    shopSelections.appendChild(shopInventorySection);
                }
            }
        }
        
        // Now get the inventory container
        const inventoryContainer = document.getElementById('shop-inventory-container');
        
        if (!inventoryContainer) {
            console.error('Shop inventory container not found');
            return;
        }
        
        // Clear existing content
        inventoryContainer.innerHTML = '';
        
        // Get inventory from shop manager
        this.eventBus.emit('shop:get-inventory', (inventory) => {
            if (!inventory || inventory.length === 0) {
                // Show a message if inventory is empty
                const emptyMsg = document.createElement('div');
                emptyMsg.textContent = 'No gems available for purchase';
                emptyMsg.style.padding = '10px';
                emptyMsg.style.fontStyle = 'italic';
                inventoryContainer.appendChild(emptyMsg);
                return;
            }
            
            // Render each gem in the inventory
            inventory.forEach((gem, index) => {
                const gemContainer = document.createElement('div');
                gemContainer.className = 'gem-purchase-container';
                gemContainer.style.display = 'flex';
                gemContainer.style.flexDirection = 'column';
                gemContainer.style.alignItems = 'center';
                gemContainer.style.margin = '10px';
                
                // Create gem element
                const gemElement = this.createGemElement(gem);
                gemContainer.appendChild(gemElement);
                
                // Add price label
                const priceLabel = document.createElement('div');
                priceLabel.className = 'gem-price-label';
                priceLabel.textContent = `${gem.price} $ZENNY`;
                priceLabel.style.marginTop = '5px';
                priceLabel.style.padding = '2px 8px';
                priceLabel.style.backgroundColor = '#333';
                priceLabel.style.color = 'white';
                priceLabel.style.borderRadius = '10px';
                priceLabel.style.fontSize = '0.8em';
                gemContainer.appendChild(priceLabel);
                
                // Add buy button
                const buyButton = document.createElement('button');
                buyButton.textContent = 'Buy';
                buyButton.style.marginTop = '5px';
                buyButton.className = 'btn-buy';
                buyButton.style.padding = '4px 12px';
                
                // Disable if not enough zenny
                const playerZenny = parseInt(this.elements.shopZenny.textContent);
                if (playerZenny < gem.price) {
                    buyButton.disabled = true;
                }
                
                // Add click handler
                buyButton.addEventListener('click', () => {
                    this.eventBus.emit('shop:purchase-inventory-gem', index);
                    // Refresh the UI after purchase
                    setTimeout(() => this.updateShopUI(), 100);
                });
                
                gemContainer.appendChild(buyButton);
                
                // Add to the container
                inventoryContainer.appendChild(gemContainer);
            });
        });
    }
    // Render gems in shop hand
    renderShopHand() {
        const state = this.stateManager.getState();
        const { gems } = state;
        const { hand } = gems;
        
        this.elements.shopHand.innerHTML = '';
        
        hand.forEach(gem => {
            const gemElement = this.createGemElement(gem, 'shop'); // Specify shop context
            
            // Add selection handler
            gemElement.addEventListener('click', () => {
                this.selectShopGem(gem.instanceId);
            });
            
            // Mark as selected if it's the selected gem
            if (this.shopState.selectedHandGem === gem.instanceId) {
                gemElement.classList.add('selected');
            }
            
            this.elements.shopHand.appendChild(gemElement);
        });
    }
    
    // Select a gem in the shop
    selectShopGem(gemInstanceId) {
        // If in upgrade mode, cancel it first
        if (this.shopState.upgradeMode) {
            this.cancelUpgrade();
        }
        
        // Toggle selection
        if (this.shopState.selectedHandGem === gemInstanceId) {
            this.shopState.selectedHandGem = null;
        } else {
            this.shopState.selectedHandGem = gemInstanceId;
        }
        
        // Update UI
        this.renderShopHand();
        this.updateShopButtons();
    }
    
    // Update shop button states
    updateShopButtons() {
        const state = this.stateManager.getState();
        const { player } = state;
        
        // Get costs from shop manager via event
        const costs = {
            buyRandomGem: 3,
            discardGem: 3,
            upgradeGem: 5,
            healPlayer: 3
        };
        
        // Enable/disable based on selection and zenny
        const hasSelection = this.shopState.selectedHandGem !== null;
        const enoughForUpgrade = player.zenny >= costs.upgradeGem;
        const enoughForDiscard = player.zenny >= costs.discardGem;
        const enoughForRandom = player.zenny >= costs.buyRandomGem;
        const enoughForHeal = player.zenny >= costs.healPlayer;
        const needsHealing = player.health < player.maxHealth;
        
        // Set button states
        this.elements.upgradeGemButton.disabled = !hasSelection || !enoughForUpgrade || this.shopState.upgradeMode;
        this.elements.discardGemButton.disabled = !hasSelection || !enoughForDiscard || this.shopState.upgradeMode;
        this.elements.buyRandomGemButton.disabled = !enoughForRandom || this.shopState.upgradeMode;
        this.elements.healButton.disabled = !enoughForHeal || !needsHealing || this.shopState.upgradeMode;
        
        // Show/hide upgrade mode buttons
        this.elements.cancelUpgradeButton.style.display = this.shopState.upgradeMode ? 'inline-block' : 'none';
        this.elements.swapGemButton.style.display = 'none'; // Not implemented in this version
    }
    
    // Show upgrade options for a gem
    showUpgradeOptions(gemInstanceId) {
        // Enter upgrade mode
        this.shopState.upgradeMode = true;
        
        // Get upgrade options from gem manager via event
        this.eventBus.emit('shop:get-upgrade-options', gemInstanceId);
        
        // This should be set by the event handler
        this.shopState.upgradeOptions = [];
        
        // For now, mock some upgrade options
        this.renderUpgradeOptions(gemInstanceId);
        
        // Update button states
        this.updateShopButtons();
    }
    
    // Render upgrade options in the gem pool - modified to show rotation notice
    renderUpgradeOptions(gemInstanceId) {
        // Clear gem pool
        this.elements.gemPool.innerHTML = '';
        
        // Show instructions
        this.elements.gemPoolInstructions.textContent = 'Select an upgrade:';
        
        // Get the gem from state
        const state = this.stateManager.getState();
        const gem = state.gems.hand.find(g => g.instanceId === gemInstanceId);
        
        if (!gem) {
            console.error(`Gem not found: ${gemInstanceId}`);
            return;
        }
        
        // Request upgrade options from the gem manager
        this.eventBus.emit('gem:get-upgrade-options', {
            gemInstanceId,
            callback: (options) => {
                // Store the options
                this.shopState.upgradeOptions = options;
                
                // Show the original gem being upgraded at the top
                const originalGemContainer = document.createElement('div');
                originalGemContainer.classList.add('original-gem-container');
                originalGemContainer.style.textAlign = 'center';
                originalGemContainer.style.padding = '10px';
                originalGemContainer.style.marginBottom = '15px';
                
                const originalGemElement = this.createGemElement(gem);
                originalGemContainer.appendChild(originalGemElement);
                
                const upgradeArrow = document.createElement('div');
                upgradeArrow.textContent = '↓';
                upgradeArrow.style.fontSize = '24px';
                upgradeArrow.style.margin = '5px 0';
                originalGemContainer.appendChild(upgradeArrow);
                
                this.elements.gemPool.appendChild(originalGemContainer);
        
                // Add options header
                const optionsHeader = document.createElement('div');
                optionsHeader.textContent = 'Available Upgrades:';
                optionsHeader.style.textAlign = 'center';
                optionsHeader.style.fontWeight = 'bold';
                optionsHeader.style.padding = '5px';
                optionsHeader.style.marginBottom = '10px';
                this.elements.gemPool.appendChild(optionsHeader);
                
                // Create a container for all upgrade options
                const upgradesContainer = document.createElement('div');
                upgradesContainer.classList.add('upgrade-options-container');
                upgradesContainer.style.display = 'flex';
                upgradesContainer.style.flexWrap = 'wrap';
                upgradesContainer.style.justifyContent = 'center';
                upgradesContainer.style.gap = '15px';
                
                // Add all options to the container
                options.forEach(upgradeGem => {
                    const upgradeElement = this.createGemElement(upgradeGem, 'shop');
                    
                    // Add upgrade type label
                    const typeLabel = document.createElement('div');
                    typeLabel.classList.add('upgrade-type-label');
                    typeLabel.style.fontSize = '0.8em';
                    typeLabel.style.textAlign = 'center';
                    typeLabel.style.padding = '2px';
                    typeLabel.style.marginTop = '5px';
                    
                    // Determine label and color based on upgrade type
                    let upgradeType = upgradeGem.upgradeType || 'unknown';
                    
                    switch(upgradeType) {
                        case 'augmentation':
                            // For augmented gems, show the augmentation type
                            const augType = upgradeGem.augmentation || 'unknown';
                            typeLabel.textContent = augType.charAt(0).toUpperCase() + augType.slice(1);
                            typeLabel.style.color = '#f39c12'; // Orange for augmentations
                            break;
                        case 'direct':
                            typeLabel.textContent = 'Enhanced';
                            typeLabel.style.color = '#f39c12'; // Orange
                            break;
                        case 'class':
                            typeLabel.textContent = 'Class Specific';
                            typeLabel.style.color = '#2ecc71'; // Green
                            break;
                        case 'unlocked':
                            typeLabel.textContent = 'Unlocked Gem';
                            typeLabel.style.color = '#3498db'; // Blue
                            break;
                        default:
                            typeLabel.textContent = 'Upgrade';
                    }
                    
                    // Create a wrapper to hold both the gem and its label
                    const wrapper = document.createElement('div');
                    wrapper.classList.add('gem-upgrade-wrapper');
                    wrapper.style.display = 'flex';
                    wrapper.style.flexDirection = 'column';
                    wrapper.style.alignItems = 'center';
                    
                    wrapper.appendChild(upgradeElement);
                    wrapper.appendChild(typeLabel);
                    
                    // *** CRITICAL FIX: Store the FULL upgrade gem object in a data attribute ***
                    wrapper.setAttribute('data-upgrade-id', upgradeGem.instanceId || upgradeGem.id);
                    wrapper.setAttribute('data-augmentation', upgradeGem.augmentation || '');
                    wrapper.setAttribute('data-upgrade-type', upgradeType);
                    
                    // Add click handler to select this upgrade
                    wrapper.addEventListener('click', () => {
                        // *** CRITICAL FIX: Pass the full instance ID, not just the base ID ***
                        const selectedId = upgradeGem.instanceId || upgradeGem.id;
                        console.log(`Selected upgrade option: ${selectedId} (${upgradeType}${upgradeGem.augmentation ? ', ' + upgradeGem.augmentation : ''})`);
                        this.selectUpgrade(gemInstanceId, selectedId);
                    });
                    
                    upgradesContainer.appendChild(wrapper);
                });
                
                this.elements.gemPool.appendChild(upgradesContainer);
                
                // If no options available, show message
                if (options.length === 0) {
                    const noOptionsMsg = document.createElement('div');
                    noOptionsMsg.textContent = 'No upgrade options available';
                    noOptionsMsg.style.padding = '20px';
                    noOptionsMsg.style.textAlign = 'center';
                    this.elements.gemPool.appendChild(noOptionsMsg);
                }
            }
        });
    }
    
    // Cancel upgrade mode
    cancelUpgrade() {
        this.shopState.upgradeMode = false;
        this.shopState.upgradeOptions = [];
        
        // Clear gem pool
        this.elements.gemPool.innerHTML = '';
        this.elements.gemPoolInstructions.textContent = 'Select a gem from your hand';
        
        // Update button states
        this.updateShopButtons();
    }
    
    // Select an upgrade option
    selectUpgrade(gemInstanceId, upgradeGemId) {
        // Get the selected gem from state
        const state = this.stateManager.getState();
        const handGems = state.gems.hand;
        const originalGem = handGems.find(g => g.instanceId === gemInstanceId);
        
        if (!originalGem) {
            console.error(`Original gem not found: ${gemInstanceId}`);
            return;
        }
        
        // Get the upgrade options array we stored earlier
        const upgrades = this.shopState.upgradeOptions || [];
        
        // CRITICAL FIX: Find the EXACT upgrade object that matches the selected ID
        const selectedUpgrade = upgrades.find(u => {
            return (u.instanceId === upgradeGemId) || (u.id === upgradeGemId);
        });
        
        console.log("Found selected upgrade:", selectedUpgrade); // Debugging
        
        // If we found the matching upgrade object, use its properties to determine the type
        if (selectedUpgrade) {
            // Process augmented gem upgrade
            if (selectedUpgrade.upgradeType === 'augmentation' && selectedUpgrade.augmentation) {
                console.log(`Processing augmentation upgrade: ${selectedUpgrade.augmentation}`);
                
                // Pass the complete upgrade object to ensure all augmentation info is included
                this.eventBus.emit('shop:upgrade-gem', {
                    gemInstanceId,
                    newGemId: selectedUpgrade // Pass the whole object, not just ID
                });
            }
            // Process direct upgrade (enhanced version of the same gem)
            else if (selectedUpgrade.upgradeType === 'direct' || upgradeGemId.endsWith('-upgraded')) {
                console.log("Processing direct enhancement upgrade");
                
                this.eventBus.emit('shop:direct-upgrade-gem', {
                    gemInstanceId,
                    originalGemId: originalGem.id
                });
            }
            // Process class-specific or unlocked gem upgrade
            else if (selectedUpgrade.upgradeType === 'class' || selectedUpgrade.upgradeType === 'unlocked') {
                console.log(`Processing gem replacement upgrade: ${selectedUpgrade.id}`);
                
                this.eventBus.emit('shop:upgrade-gem', {
                    gemInstanceId,
                    newGemId: selectedUpgrade.id // Use the gem definition ID
                });
            }
            // Fallback - just use the ID
            else {
                console.log(`Processing standard upgrade with ID: ${upgradeGemId}`);
                
                this.eventBus.emit('shop:upgrade-gem', {
                    gemInstanceId,
                    newGemId: upgradeGemId
                });
            }
        }
        // If we couldn't find the upgrade in our options, use fallback
        else {
            console.warn(`Upgrade not found in options array, using ID directly: ${upgradeGemId}`);
            
            this.eventBus.emit('shop:upgrade-gem', {
                gemInstanceId,
                newGemId: upgradeGemId
            });
        }
        
        // Exit upgrade mode
        this.cancelUpgrade();
    }
    
    // Upgrade gem button clicked
    upgradeGem() {
        if (!this.shopState.selectedHandGem) {
            this.showMessage('No gem selected!', 'error');
            return;
        }
        
        // Show upgrade options
        this.showUpgradeOptions(this.shopState.selectedHandGem);
    }
    
    // Discard gem button clicked
    discardGem() {
        if (!this.shopState.selectedHandGem) {
            this.showMessage('No gem selected!', 'error');
            return;
        }
        
        // Confirm discard
        if (confirm('Are you sure you want to discard this gem?')) {
            this.eventBus.emit('shop:discard-gem', this.shopState.selectedHandGem);
            this.shopState.selectedHandGem = null;
        }
    }
    
    // Buy random gem button clicked
    buyRandomGem() {
        this.eventBus.emit('shop:buy-random-gem');
    }
    
    // Heal player button clicked
    healPlayer() {
        this.eventBus.emit('shop:heal-player');
    }
    
    // Continue from shop button clicked
    continueFromShop() {
        this.eventBus.emit('shop:continue');
    }
    
    // Update camp UI
    updateCampUI() {
        const state = this.stateManager.getState();
        const { player, meta, journey } = state;
        
        // Update day display
        this.elements.campDay.textContent = journey.day;
        
        // Update zenny displays
        this.elements.campZenny.textContent = player.zenny;
        this.elements.campMetaZenny.textContent = meta.zenny;
        
        // Clear input fields
        this.elements.withdrawAmount.value = '';
        this.elements.depositAmount.value = '';
    }
    
    // Withdraw zenny from journey to meta wallet
    withdrawZenny() {
        const amount = parseInt(this.elements.withdrawAmount.value, 10);
        
        if (isNaN(amount) || amount <= 0) {
            this.showMessage('Please enter a valid amount!', 'error');
            return;
        }
        
        // Emit withdraw event
        this.eventBus.emit('camp:withdraw', amount);
        
        // Clear input field
        this.elements.withdrawAmount.value = '';
    }
    
    // Deposit zenny from meta to journey wallet
    depositZenny() {
        const amount = parseInt(this.elements.depositAmount.value, 10);
        
        if (isNaN(amount) || amount <= 0) {
            this.showMessage('Please enter a valid amount!', 'error');
            return;
        }
        
        // Emit deposit event
        this.eventBus.emit('camp:deposit', amount);
        
        // Clear input field
        this.elements.depositAmount.value = '';
    }
    
    // Start next day button clicked
    startNextDay() {
        this.eventBus.emit('camp:next-day');
    }
    
    // Update gem catalog UI with optimized rendering
    updateGemCatalogUI() {
        const state = this.stateManager.getState();
        const { meta } = state;
        
        // Update meta zenny display
        this.elements.metaZennyDisplay.textContent = meta.zenny;
        
        // Render unlocked gems
        this.renderUnlockedGems();
        
        // Render available gems to unlock
        this.renderAvailableGems();
    }
    
    // Render unlocked gems in catalog with better DOM batching
    renderUnlockedGems() {
        const state = this.stateManager.getState();
        const { meta } = state;
        const playerClass = state.player.class;
        
        this.elements.unlockedGems.innerHTML = '';
        
        // Check if meta.unlockedGems exists and has the correct structure
        if (!meta.unlockedGems) {
            console.error("Unlocked gems not found in meta state");
            return;
        }
        
        // Handle both old (array) and new (object) structures
        let globalGems = [];
        let classGems = [];
        
        if (Array.isArray(meta.unlockedGems)) {
            // Old structure - treat all as global
            globalGems = meta.unlockedGems;
        } else {
            // New structure
            globalGems = meta.unlockedGems.global || [];
            classGems = meta.unlockedGems[playerClass] || [];
        }
        
        // Get definitions from gem manager
        this.eventBus.emit('gem:get-definitions', {
            callback: (definitions) => {
                // IMPORTANT: Display base gems first regardless of class
                // These should always be available to all classes
                const baseGems = ['red-attack', 'blue-magic', 'green-attack', 'grey-heal'];
                
                // Display base gems first
                baseGems.forEach(gemId => {
                    const gemDef = definitions[gemId];
                    if (gemDef) {
                        const gemElement = this.createGemElement(gemDef, 'catalog');
                        this.elements.unlockedGems.appendChild(gemElement);
                    }
                });
                
                // Class-specific starter gems
                const classStarterGems = {
                    'knight': ['red-strong'],
                    'mage': ['blue-strong-heal'],
                    'rogue': ['green-quick']
                };
                
                const starterGems = classStarterGems[playerClass] || [];
                starterGems.forEach(gemId => {
                    const gemDef = definitions[gemId];
                    if (gemDef) {
                        const gemElement = this.createGemElement(gemDef, 'catalog');
                        this.elements.unlockedGems.appendChild(gemElement);
                    }
                });
                
                // Then display additional unlocked gems specific to this class
                // (that aren't base or starter gems)
                classGems.forEach(gemId => {
                    // Skip if it's a base gem or starter gem (already displayed)
                    if (baseGems.includes(gemId) || starterGems.includes(gemId)) {
                        return;
                    }
                    
                    const gemDef = definitions[gemId];
                    if (gemDef) {
                        const gemElement = this.createGemElement(gemDef, 'catalog');
                        this.elements.unlockedGems.appendChild(gemElement);
                    }
                });
                
                // REMOVE THIS LINE - unlockedGemsContainer is not defined
                // Append all gems at once
                // unlockedGemsContainer.appendChild(fragment);
            }
        });
    }    
    
    // Render available gems to unlock with better DOM performance
    renderAvailableGems() {
        const state = this.stateManager.getState();
        const { meta } = state;
        const playerClass = state.player.class;
        
        // Clear current contents
        this.elements.availableGems.innerHTML = '';
        
        // Check if meta.unlockedGems has the right structure
        if (!meta.unlockedGems) {
            console.error("Unlocked gems not found in meta state");
            return;
        }
        
        // Handle both old (array) and new (object) structures
        let unlockedGems = [];
        
        if (Array.isArray(meta.unlockedGems)) {
            // Old structure
            unlockedGems = meta.unlockedGems;
        } else {
            // New structure - combine global and class-specific gems
            unlockedGems = [
                ...(meta.unlockedGems.global || []),
                ...(meta.unlockedGems[playerClass] || [])
            ];
        }
        
        // Use the event bus to get unlockable gems
        this.eventBus.emit('gem:get-unlockable', {
            callback: (unlockables) => {
                // Get definitions
                this.eventBus.emit('gem:get-definitions', {
                    callback: (definitions) => {
                        // Filter out gems that are already unlocked
                        const notYetUnlocked = unlockables.filter(gemId => 
                            !unlockedGems.includes(gemId)
                        );
                        
                        if (notYetUnlocked.length > 0) {
                            // Create gem elements for each unlockable
                            notYetUnlocked.forEach(gemId => {
                                const gemDef = definitions[gemId];
                                if (gemDef) {
                                    // Create container
                                    const container = document.createElement('div');
                                    container.classList.add('unlockable-gem-container');
                                    
                                    // Create gem element
                                    const gemElement = this.createGemElement(gemDef);
                                    container.appendChild(gemElement);
                                    
                                    // Add cost label
                                    const costLabel = document.createElement('div');
                                    costLabel.classList.add('gem-cost-label');
                                    costLabel.textContent = '50 $ZENNY';
                                    container.appendChild(costLabel);
                                    
                                    // Add click handler to unlock
                                    container.addEventListener('click', () => {
                                        this.unlockGem(gemId);
                                    });
                                    
                                    this.elements.availableGems.appendChild(container);
                                }
                            });
                        } else {
                            this.showNoGemsMessage();
                        }
                        
                        // REMOVE THIS LINE - availableGemsContainer is not defined
                        // Append all elements at once
                        // availableGemsContainer.appendChild(fragment);
                    }
                });
            }
        });
    }
    
    
    showNoGemsMessage() {
        // Make sure element exists
        if (!this.elements.availableGems) return;
        
        // Display message if no unlockable gems
        const noGemsMsg = document.createElement('div');
        noGemsMsg.textContent = 'No additional gems available to unlock';
        noGemsMsg.style.padding = '20px';
        noGemsMsg.style.textAlign = 'center';
        this.elements.availableGems.appendChild(noGemsMsg);
    }
    
    // Event handlers for battle events
    onBattleStarted(data) {
        this.showMessage(`Battle against ${data.enemy.name} begins!`, 'success');
    }
    
    onBattleVictory(data) {
        this.showMessage(`Victory! Earned ${data.reward} $ZENNY`, 'success');
    }
    
    onBattleDefeat(data) {
        this.showMessage(`Defeated by ${data.enemy.name}!`, 'error');
    }
    
    onGemDrawn(gemData) {
        // Add draw animation to the gem
        const gemElements = this.elements.hand.querySelectorAll('.gem');
        gemElements.forEach(elem => {
            if (elem.getAttribute('data-gem-id') === gemData.instanceId) {
                elem.classList.add('drawn');
                setTimeout(() => {
                    elem.classList.remove('drawn');
                }, 500);
            }
        });
    }
    
    onPlayerDamaged(data) {
        // Create damage text animation
        const damageText = document.createElement('div');
        damageText.classList.add('damage-text');
        damageText.textContent = `-${data.amount}`;
        
        // Position near player
        damageText.style.left = '30%';
        damageText.style.top = '80%';
        
        // Add to battle effects
        const battleEffects = document.getElementById('battle-effects');
        battleEffects.appendChild(damageText);
        
        // Remove after animation completes
        setTimeout(() => {
            damageText.remove();
        }, 1500);
    }
    
    onEnemyDamaged(data) {
        // Create damage text animation
        const damageText = document.createElement('div');
        damageText.classList.add('damage-text');
        damageText.textContent = `-${data.amount}`;
        
        // Position near enemy
        damageText.style.left = '50%';
        damageText.style.top = '20%';
        
        // Add to battle effects
        const battleEffects = document.getElementById('battle-effects');
        battleEffects.appendChild(damageText);
        
        // Remove after animation completes
        setTimeout(() => {
            damageText.remove();
        }, 1500);
    }
    
    onPlayerHealed(data) {
        // Create heal text animation
        const healText = document.createElement('div');
        healText.classList.add('heal-text');
        healText.textContent = `+${data.amount}`;
        
        // Position near player
        healText.style.left = '30%';
        healText.style.top = '80%';
        
        // Add to battle effects
        const battleEffects = document.getElementById('battle-effects');
        battleEffects.appendChild(healText);
        
        // Remove after animation completes
        setTimeout(() => {
            healText.remove();
        }, 1500);
    }
    
    // Show a message to the user with debouncing
    showMessage(text, type = 'success') {
        this.elements.messageElement.textContent = text;
        this.elements.messageElement.className = ''; // Reset classes
        this.elements.messageElement.classList.add('message', type, 'visible');
        
        // Hide after 3 seconds
        setTimeout(() => {
            this.elements.messageElement.classList.remove('visible');
        }, 3000);
    }
    // This gets called during setup and when screens change
    setupGemBagContainers() {
        // Find both gem bag containers
        const battleGemBag = document.getElementById('gem-bag-container');
        const shopGemBag = document.getElementById('shop-gem-bag-container');
        
        // Store references in the elements object
        if (battleGemBag) {
            this.elements.gemBagContainer = battleGemBag;
            
            // Remove old event listeners (if any)
            const newBattleGemBag = battleGemBag.cloneNode(true);
            battleGemBag.parentNode.replaceChild(newBattleGemBag, battleGemBag);
            
            // Add event listener using EventBus
            newBattleGemBag.addEventListener('click', (e) => {
                console.log('Battle gem bag clicked, emitting open event');
                this.eventBus.emit('overlay:open-gem-bag');
                e.stopPropagation();
            });
            
            // Update reference
            this.elements.gemBagContainer = newBattleGemBag;
            
            // Add visual cue
            newBattleGemBag.style.cursor = 'pointer';
            newBattleGemBag.title = 'Click to view gem bag contents';
        }
        
        if (shopGemBag) {
            this.elements.shopGemBagContainer = shopGemBag;
            
            // Remove old event listeners (if any)
            const newShopGemBag = shopGemBag.cloneNode(true);
            shopGemBag.parentNode.replaceChild(newShopGemBag, shopGemBag);
            
            // Add event listener using EventBus
            newShopGemBag.addEventListener('click', (e) => {
                console.log('Shop gem bag clicked, emitting open event');
                this.eventBus.emit('overlay:open-gem-bag');
                e.stopPropagation();
            });
            
            // Update reference
            this.elements.shopGemBagContainer = newShopGemBag;
            
            // Add visual cue
            newShopGemBag.style.cursor = 'pointer';
            newShopGemBag.title = 'Click to view gem bag contents';
        }
        
        console.log('Gem bag containers set up with EventBus event handlers');
    }
    // This updates references to overlay elements after they're added to the DOM
    updateOverlayElementReferences() {
        // Get fresh references to overlay elements
        this.elements.gemBagOverlay = document.getElementById('gem-bag-overlay');
        this.elements.gemBagCloseButton = document.querySelector('#gem-bag-overlay .close-button');
        this.elements.availableGemsContainer = document.getElementById('available-gems-container');
        this.elements.playedGemsContainer = document.getElementById('played-gems-container');
        this.elements.availableGemsCount = document.getElementById('available-gems-count');
        this.elements.playedGemsCount = document.getElementById('played-gems-count');
        
        // Only set up event handlers if not already bound
        if (!this.overlayEventsBound && this.elements.gemBagOverlay) {
            console.log('Setting up overlay event handlers');
            
            // Handle close button click
            if (this.elements.gemBagCloseButton) {
                // Remove existing listeners by cloning
                const newCloseButton = this.elements.gemBagCloseButton.cloneNode(true);
                this.elements.gemBagCloseButton.parentNode.replaceChild(newCloseButton, this.elements.gemBagCloseButton);
                this.elements.gemBagCloseButton = newCloseButton;
                
                // Add single event listener that emits to EventBus
                this.elements.gemBagCloseButton.addEventListener('click', (e) => {
                    console.log('Close button clicked, emitting close event');
                    this.eventBus.emit('overlay:close-gem-bag');
                    e.stopPropagation(); // Prevent event from bubbling to overlay background
                });
            }
            
            // Handle clicking outside the content area (overlay background)
            // Clone to remove existing listeners
            const newOverlay = this.elements.gemBagOverlay.cloneNode(true);
            this.elements.gemBagOverlay.parentNode.replaceChild(newOverlay, this.elements.gemBagOverlay);
            this.elements.gemBagOverlay = newOverlay;
            
            // Re-establish references after cloning
            this.elements.gemBagCloseButton = this.elements.gemBagOverlay.querySelector('.close-button');
            this.elements.availableGemsContainer = this.elements.gemBagOverlay.querySelector('#available-gems-container');
            this.elements.playedGemsContainer = this.elements.gemBagOverlay.querySelector('#played-gems-container');
            this.elements.availableGemsCount = this.elements.gemBagOverlay.querySelector('#available-gems-count');
            this.elements.playedGemsCount = this.elements.gemBagOverlay.querySelector('#played-gems-count');
            
            // Add event listener to close button after cloning overlay
            if (this.elements.gemBagCloseButton) {
                this.elements.gemBagCloseButton.addEventListener('click', (e) => {
                    console.log('Close button (after overlay clone) clicked, emitting close event');
                    this.eventBus.emit('overlay:close-gem-bag');
                    e.stopPropagation();
                });
            }
            
            // Add click handler for overlay background
            this.elements.gemBagOverlay.addEventListener('click', (event) => {
                if (event.target === this.elements.gemBagOverlay) {
                    console.log('Overlay background clicked, emitting close event');
                    this.eventBus.emit('overlay:close-gem-bag');
                }
            });
            
            // Mark that we've bound these events to prevent duplicates
            this.overlayEventsBound = true;
            console.log('Overlay event handlers bound');
        }
    }

    // This handles the overlay:open-gem-bag event
    openGemBagOverlay() {
        console.log('Opening gem bag overlay');
        
        // Always update references first (but doesn't rebind events if already bound)
        this.updateOverlayElementReferences();
        
        // Get the current state
        const state = this.stateManager.getState();
        const { gems } = state;
        
        // Check if overlay elements exist
        if (!this.elements.gemBagOverlay || 
            !this.elements.availableGemsContainer || 
            !this.elements.playedGemsContainer) {
            console.error('Gem bag overlay elements not found in DOM');
            return;
        }
        
        // Clear previous content
        this.elements.availableGemsContainer.innerHTML = '';
        this.elements.playedGemsContainer.innerHTML = '';
        
        // Update the count displays
        if (this.elements.availableGemsCount) {
            this.elements.availableGemsCount.textContent = gems.bag ? gems.bag.length : 0;
        }
        
        if (this.elements.playedGemsCount) {
            this.elements.playedGemsCount.textContent = gems.played ? gems.played.length : 0;
        }
        
        // Render available gems (gems in bag)
        if (gems.bag && gems.bag.length > 0) {
            gems.bag.forEach(gem => {
                const gemElement = this.createGemElement(gem, 'catalog');
                this.elements.availableGemsContainer.appendChild(gemElement);
            });
        } else {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'No gems available in bag';
            emptyMessage.style.padding = '20px';
            emptyMessage.style.fontStyle = 'italic';
            this.elements.availableGemsContainer.appendChild(emptyMessage);
        }
        
        // Render played gems
        if (gems.played && gems.played.length > 0) {
            gems.played.forEach(gem => {
                const gemElement = this.createGemElement(gem, 'catalog');
                gemElement.classList.add('played');
                this.elements.playedGemsContainer.appendChild(gemElement);
            });
        } else {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'No gems have been played yet';
            emptyMessage.style.padding = '20px';
            emptyMessage.style.fontStyle = 'italic';
            this.elements.playedGemsContainer.appendChild(emptyMessage);
        }
        
        // Show the overlay
        this.elements.gemBagOverlay.style.display = 'block';
    }

    // This handles the overlay:close-gem-bag event
    closeGemBagOverlay() {
        console.log('Closing gem bag overlay');
        
        if (this.elements.gemBagOverlay) {
            this.elements.gemBagOverlay.style.display = 'none';
        }
    }
    
    // Memory management - remove event listeners when component is destroyed
    destroy() {
        // Remove global event listeners
        document.removeEventListener('keydown', this._escapeKeyHandler);
        
        // Clear any pending timeouts
        if (this._messageTimeout) {
            clearTimeout(this._messageTimeout);
        }
        
        if (this._shopRefreshTimeout) {
            clearTimeout(this._shopRefreshTimeout);
        }
        
        // Unsubscribe from EventBus events - only if EventBus provides an 'off' method
        // Check if the off method exists to avoid errors
        if (this.eventBus && typeof this.eventBus.off === 'function') {
            this.eventBus.off('overlay:open-gem-bag');
            this.eventBus.off('overlay:close-gem-bag');
        }
        
        console.log('UIManager destroyed, event listeners cleaned up');
    }
}