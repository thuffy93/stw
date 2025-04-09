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
            audioButton: document.getElementById('audio-button')
        };
        
        // Set up basic event listeners (non-screen specific)
        this.setupBasicEventListeners();
        
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
        else if (screenId === 'camp-screen') {
            this.updateCampUI();
        }
        else if (screenId === 'gem-catalog-screen') {
            this.updateGemCatalogUI();
        }
        
        // Set up event listeners for the current screen
        this.setupScreenEventListeners(screenId);
    }
    
    // Select character class
    selectClass(classType) {
        // Initialize player stats based on class
        let playerStats = {
            class: classType,
            buffs: [] // Explicitly initialize with empty buffs array
        };
        
        // Set class-specific starting values
        switch(classType) {
            case 'knight':
                playerStats.health = 40;
                playerStats.maxHealth = 40;
                playerStats.stamina = 3;
                playerStats.maxStamina = 3;
                playerStats.zenny = 5;
                break;
                
            case 'mage':
                playerStats.health = 30;
                playerStats.maxHealth = 30;
                playerStats.stamina = 4;
                playerStats.maxStamina = 4;
                playerStats.zenny = 5;
                break;
                
            case 'rogue':
                playerStats.health = 35;
                playerStats.maxHealth = 35;
                playerStats.stamina = 3;
                playerStats.maxStamina = 3;
                playerStats.zenny = 8; // Starts with extra currency
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
        console.log('Starting journey from gem catalog');
        
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
        
        if (!battle || !player) return;
        
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
    
    // Render the player's hand of gems
    renderHand() {
        const state = this.stateManager.getState();
        const { gems, player } = state;
        const { hand } = gems;
        
        this.elements.hand.innerHTML = '';
        
        hand.forEach(gem => {
            const gemElement = this.createGemElement(gem);
            
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
    
    // Generate tooltip for a gem
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

        // Only show duration for buffs/debuffs
        if (gem.duration) {
            tooltipParts.push(`Duration: ${gem.duration} turns`);
        }

        return tooltipParts.join('\n');
    }

    // Create a gem DOM element
    createGemElement(gem) {
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
        
        // Generate tooltip
        gemElement.setAttribute('data-tooltip', this.generateGemTooltip(gem));
        
        return gemElement;
    }
    
    // Update battle action buttons
    updateBattleButtons() {
        const state = this.stateManager.getState();
        const { battle, player } = state;
        
        // Only enable buttons on player's turn
        const isPlayerTurn = battle.currentTurn === 'PLAYER';
        const isPlayerStunned = player.buffs.some(buff => buff.type === 'stunned');
        
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
    
    
    // Toggle gem selection
    toggleGemSelection(gemInstanceId) {
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
        const state = this.stateManager.getState();
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
    }
    
    // Update shop UI
    updateShopUI() {
        const state = this.stateManager.getState();
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
    
    // Render gems in shop hand
    renderShopHand() {
        const state = this.stateManager.getState();
        const { gems } = state;
        const { hand } = gems; // Use 'hand' instead of 'bag'
        
        this.elements.shopHand.innerHTML = '';
        
        hand.forEach(gem => {
            const gemElement = this.createGemElement(gem);
            
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
    
    // Render upgrade options in the gem pool
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
                    const upgradeElement = this.createGemElement(upgradeGem);
                    
                    // Add upgrade type label
                    const typeLabel = document.createElement('div');
                    typeLabel.classList.add('upgrade-type-label');
                    typeLabel.style.fontSize = '0.8em';
                    typeLabel.style.textAlign = 'center';
                    typeLabel.style.padding = '2px';
                    typeLabel.style.marginTop = '5px';
                    
                    switch(upgradeGem.upgradeType) {
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
                    
                    // Add click handler to select this upgrade
                    wrapper.addEventListener('click', () => {
                        this.selectUpgrade(gemInstanceId, upgradeGem.id);
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
        console.log(`Selecting upgrade: ${gemInstanceId} -> ${upgradeGemId}`);
        
        // Handle direct upgrades specially (they have a custom ID format with "-upgraded")
        let finalGemId = upgradeGemId;
        if (upgradeGemId.endsWith('-upgraded')) {
            // For direct upgrades, we need to get the original gem's data and create an enhanced version
            const state = this.stateManager.getState();
            const originalGem = state.gems.hand.find(g => g.instanceId === gemInstanceId);
            
            if (originalGem) {
                // Instead of using the "-upgraded" ID, use the original gem's ID
                // The ShopManager will handle enhancing its values
                finalGemId = originalGem.id;
                
                console.log(`Direct upgrade of ${originalGem.name} (${originalGem.id})`);
                
                // Emit special direct upgrade event
                this.eventBus.emit('shop:direct-upgrade-gem', {
                    gemInstanceId,
                    originalGemId: originalGem.id
                });
                
                // Exit upgrade mode
                this.cancelUpgrade();
                return;
            }
        }
        
        // For regular upgrades, proceed normally
        this.eventBus.emit('shop:upgrade-gem', {
            gemInstanceId,
            newGemId: finalGemId
        });
        
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
    
    // Update gem catalog UI
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
    
    // Render unlocked gems in catalog
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
                        const gemElement = this.createGemElement(gemDef);
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
                        const gemElement = this.createGemElement(gemDef);
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
                        const gemElement = this.createGemElement(gemDef);
                        this.elements.unlockedGems.appendChild(gemElement);
                    }
                });
            }
        });
    }    
    
    // Render available gems to unlock
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
    
    // Unlock a gem in the catalog
    unlockGem(gemId) {
        // Make sure we call the correct unlock method on the gem manager
        // This fixes the issue where gems don't show up after purchase
        this.eventBus.emit('gem:unlock', gemId);
        
        // Re-render the gem catalog after unlocking
        setTimeout(() => {
            this.updateGemCatalogUI();
        }, 100);
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
    
    // Show a message to the user
    showMessage(text, type = 'success') {
        this.elements.messageElement.textContent = text;
        this.elements.messageElement.className = ''; // Reset classes
        this.elements.messageElement.classList.add('message', type, 'visible');
        
        // Hide after 3 seconds
        setTimeout(() => {
            this.elements.messageElement.classList.remove('visible');
        }, 3000);
    }
}