// UIManager.js - Handles UI rendering and interactions (optimized)
import { generateGemTooltip, enemyActionIcons } from './utils.js';

export default class UIManager {
    constructor(eventBus, stateManager) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        
        // Store DOM element references - using a more efficient approach
        this.elements = {};
        
        // Selected gems in battle
        this.selectedGems = [];
        
        // Shop state tracking
        this.shopState = {
            selectedHandGem: null,
            upgradeMode: false,
            upgradeOptions: []
        };
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Cache DOM elements
        this.cacheElements();
    }
    
    // Cache DOM elements for better performance
    cacheElements() {
        // Store commonly used elements
        const elementIds = [
            // Character select screen
            'character-select-screen', 'knight-btn', 'mage-btn', 'rogue-btn', 'reset-btn',
            
            // Gem catalog screen
            'gem-catalog-screen', 'meta-zenny-display', 'unlocked-gems', 'available-gems', 'continue-journey-btn',
            
            // Battle screen
            'battle-screen', 'day-phase-indicator', 'turn-indicator', 
            'enemy-name', 'enemy-health-bar', 'enemy-health', 'enemy-max-health', 'enemy-buffs',
            'player-class', 'player-health-bar', 'player-health', 'player-max-health',
            'stamina-fill', 'stamina-text', 'player-buffs', 'zenny', 'hand',
            'gem-bag-count', 'gem-bag-count2', 'gem-bag-total', 'gem-bag-total2',
            'execute-btn', 'wait-btn', 'discard-end-btn', 'end-turn-btn', 'flee-btn',
            
            // Shop screen
            'shop-screen', 'shop-health', 'shop-max-health', 'shop-zenny',
            'shop-hand', 'gem-pool', 'upgrade-gem', 'discard-gem', 'buy-random-gem',
            'heal-10', 'continue-btn', 'shop-gem-bag-count', 'shop-gem-bag-total',
            
            // Camp screen
            'camp-screen', 'camp-day', 'camp-zenny', 'camp-meta-zenny',
            'withdraw-amount', 'withdraw-btn', 'deposit-amount', 'deposit-btn', 'next-day-btn',
            
            // Other UI elements
            'message', 'gem-bag-overlay'
        ];
        
        // Cache all elements
        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.elements[id] = element;
            }
        });
    }
    
    setupEventListeners() {
        // Basic event listeners (permanent ones)
        this.setupBasicEventListeners();
        
        // State change events
        this.eventBus.on('state:updated', () => this.updateUI());
        this.eventBus.on('screen:changed', (screenId) => this.onScreenChanged(screenId));
        this.eventBus.on('message:show', (data) => this.showMessage(data.text, data.type));
        
        // Battle events
        this.eventBus.on('battle:started', (data) => this.onBattleStarted(data));
        this.eventBus.on('battle:victory', (data) => this.onBattleVictory(data));
        this.eventBus.on('battle:defeat', (data) => this.onBattleDefeat(data));
        this.eventBus.on('gem:drawn', (gemData) => this.onGemDrawn(gemData));
        this.eventBus.on('player:damaged', (data) => this.onPlayerDamaged(data));
        this.eventBus.on('enemy:damaged', (data) => this.onEnemyDamaged(data));
        this.eventBus.on('player:healed', (data) => this.onPlayerHealed(data));
        
        // Shop events
        this.eventBus.on('shop:enter', () => this.setupShop());
        
        // Gem bag overlay events
        this.eventBus.on('overlay:open-gem-bag', () => this.openGemBagOverlay());
        this.eventBus.on('overlay:close-gem-bag', () => this.closeGemBagOverlay());
    }
    
    setupBasicEventListeners() {
        // Character selection buttons
        this.addClickListener('knight-btn', () => this.selectClass('knight'));
        this.addClickListener('mage-btn', () => this.selectClass('mage'));
        this.addClickListener('rogue-btn', () => this.selectClass('rogue'));
        this.addClickListener('reset-btn', () => this.resetGame());
        
        // Make gem bag containers clickable
        this.setupGemBagContainers();
    }
    
    // Helper method to add click listener with proper cleanup
    addClickListener(elementId, callback) {
        const element = document.getElementById(elementId);
        if (element) {
            // Remove previous event listeners by cloning the node
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            // Add new event listener
            newElement.addEventListener('click', callback);
            
            // Update cached element reference
            this.elements[elementId] = newElement;
        }
    }
    
    // Set up screen-specific event listeners
    setupScreenEventListeners(screenId) {
        console.log(`Setting up event listeners for screen: ${screenId}`);
        
        // Different listeners for different screens
        switch(screenId) {
            case 'gem-catalog-screen':
                this.addClickListener('continue-journey-btn', () => this.startJourney());
                break;
                
            case 'battle-screen':
                this.addClickListener('execute-btn', () => this.executeGems());
                this.addClickListener('wait-btn', () => this.waitAction());
                this.addClickListener('discard-end-btn', () => this.discardAndEndTurn());
                this.addClickListener('end-turn-btn', () => this.endTurn());
                this.addClickListener('flee-btn', () => this.fleeBattle());
                break;
                
            case 'shop-screen':
                this.addClickListener('upgrade-gem', () => this.upgradeGem());
                this.addClickListener('discard-gem', () => this.discardGem());
                this.addClickListener('buy-random-gem', () => this.buyRandomGem());
                this.addClickListener('heal-10', () => this.healPlayer());
                this.addClickListener('continue-btn', () => this.continueFromShop());
                break;
                
            case 'camp-screen':
                this.addClickListener('withdraw-btn', () => this.withdrawZenny());
                this.addClickListener('deposit-btn', () => this.depositZenny());
                this.addClickListener('next-day-btn', () => this.startNextDay());
                break;
        }
    }
    
    // Update UI based on current state
    updateUI() {
        const state = this.stateManager.getState();
        
        // Update UI based on current screen
        switch(state.currentScreen) {
            case 'battle-screen':
                this.updateBattleUI();
                break;
            case 'shop-screen':
                this.updateShopUI();
                break;
            case 'camp-screen':
                this.updateCampUI();
                break;
            case 'gem-catalog-screen':
                this.updateGemCatalogUI();
                break;
        }
    }
    
    // Handle screen changes
    onScreenChanged(screenId) {
        console.log(`Screen changed to: ${screenId}`);
        
        // Reset screen-specific state
        if (screenId === 'battle-screen') {
            this.selectedGems = [];
            this.updateBattleBackground();
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
        
        // Refresh gem bag containers and overlay references
        setTimeout(() => {
            this.setupGemBagContainers();
            this.updateOverlayElementReferences();
        }, 100);
    }
    
    // Update battle screen background based on phase
    updateBattleBackground() {
        const phase = this.stateManager.getState().journey.phase;
        const battleScreen = this.elements['battle-screen'];
        
        if (battleScreen) {
            battleScreen.className = 'screen active';
            battleScreen.classList.add(phase.toLowerCase());
        }
    }
    
    // Select character class
    selectClass(classType) {
        // Initialize player stats based on class
        let playerStats = {
            class: classType,
            buffs: []
        };
        
        // Set class-specific starting values
        switch(classType) {
            case 'knight':
                playerStats.health = 50;
                playerStats.maxHealth = 50;
                playerStats.stamina = 3;
                playerStats.maxStamina = 3;
                playerStats.zenny = 0;
                break;
                
            case 'mage':
                playerStats.health = 30;
                playerStats.maxHealth = 30;
                playerStats.stamina = 5;
                playerStats.maxStamina = 5;
                playerStats.zenny = 0;
                break;
                
            case 'rogue':
                playerStats.health = 40;
                playerStats.maxHealth = 40;
                playerStats.stamina = 4;
                playerStats.maxStamina = 4;
                playerStats.zenny = 0;
                break;
                
            default:
                console.error(`Unknown class type: ${classType}`);
                return;
        }
        
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
        
        // Start the first battle after a short delay
        setTimeout(() => {
            this.eventBus.emit('battle:start');
        }, 100);
    }
    
    // Update battle UI
    updateBattleUI() {
        const state = this.stateManager.getState();
        const { player, battle, journey, gems } = state;
        
        if (!battle || !player) return;
        
        // Update day/phase indicator
        this.updateDayPhaseIndicator(journey);
        
        // Update turn indicator
        this.updateTurnIndicator(battle.currentTurn);
        
        // Update enemy info if in battle
        if (battle.enemy) {
            this.updateEnemyDisplay(battle.enemy);
        }
        
        // Update player info
        this.updatePlayerDisplay(player);
        
        // Update zenny display
        this.updateElement('zenny', player.zenny);
        
        // Update hand
        this.renderHand();
        
        // Update gem bag count
        this.updateGemBagCount(gems, state.gemBagSize || 20);
        
        // Update button states
        this.updateBattleButtons();
    }
    
    // Update day/phase indicator
    updateDayPhaseIndicator(journey) {
        const phaseEmoji = journey.phase === 'DAWN' ? '☀️' : 
                           journey.phase === 'DUSK' ? '🌆' : '🌙';
                           
        this.updateElement('day-phase-indicator', `Day ${journey.day} ${phaseEmoji}`);
    }
    
    // Update turn indicator
    updateTurnIndicator(currentTurn) {
        const turnIndicator = this.elements['turn-indicator'];
        if (turnIndicator) {
            turnIndicator.textContent = currentTurn === 'PLAYER' ? 'Your Turn' : 'Enemy Turn';
            turnIndicator.classList.remove('player', 'enemy');
            turnIndicator.classList.add(currentTurn.toLowerCase());
        }
    }
    
    // Update enemy display
    updateEnemyDisplay(enemy) {
        // Update enemy name
        this.updateElement('enemy-name', enemy.name);
        
        // Update health bar
        const healthPercent = (enemy.health / enemy.maxHealth) * 100;
        const enemyHealthBar = this.elements['enemy-health-bar'];
        if (enemyHealthBar) {
            enemyHealthBar.style.width = `${healthPercent}%`;
        }
        
        // Update health text
        this.updateElement('enemy-health', enemy.health);
        this.updateElement('enemy-max-health', enemy.maxHealth);
        
        // Update enemy buffs
        this.updateBuffs('enemy-buffs', enemy.buffs);
        
        // Update next action if available
        const enemyCondition = document.getElementById('enemy-condition');
        if (enemyCondition) {
            if (enemy.nextAction) {
                const actionDisplay = enemy.nextAction.charAt(0).toUpperCase() + 
                                     enemy.nextAction.slice(1);
                enemyCondition.textContent = `Next: ${actionDisplay}`;
            } else {
                enemyCondition.textContent = '';
            }
        }
    }
    
    // Update player display
    updatePlayerDisplay(player) {
        // Update player class
        this.updateElement('player-class', `${player.class.charAt(0).toUpperCase() + player.class.slice(1)}`);
        
        // Update health bar
        const playerHealthPercent = (player.health / player.maxHealth) * 100;
        const playerHealthBar = this.elements['player-health-bar'];
        if (playerHealthBar) {
            playerHealthBar.style.width = `${playerHealthPercent}%`;
        }
        
        // Update health text
        this.updateElement('player-health', player.health);
        this.updateElement('player-max-health', player.maxHealth);
        
        // Update stamina
        this.updateStamina(player.stamina, player.maxStamina);
        
        // Update player buffs
        this.updateBuffs('player-buffs', player.buffs);
        
        // Update stunned visual state
        const playerStats = document.getElementById('player-stats');
        if (playerStats) {
            const isStunned = player.buffs.some(buff => buff.type === 'stunned');
            playerStats.classList.toggle('stunned', isStunned);
        }
    }
    
    // Update stamina display
    updateStamina(stamina, maxStamina) {
        const staminaFill = this.elements['stamina-fill'];
        const staminaText = this.elements['stamina-text'];
        
        if (staminaFill && staminaText) {
            const staminaPercent = (stamina / maxStamina) * 100;
            staminaFill.style.width = `${staminaPercent}%`;
            staminaText.textContent = `${stamina}/${maxStamina}`;
            
            // Update stamina color
            staminaFill.classList.remove('full', 'medium', 'low');
            if (stamina >= maxStamina) {
                staminaFill.classList.add('full');
            } else if (stamina >= maxStamina / 2) {
                staminaFill.classList.add('medium');
            } else {
                staminaFill.classList.add('low');
            }
        }
    }
    
    // Update buffs display
    updateBuffs(elementId, buffs) {
        const buffsElement = this.elements[elementId] || document.getElementById(elementId);
        
        if (buffsElement) {
            buffsElement.innerHTML = '';
            
            if (buffs && buffs.length > 0) {
                buffs.forEach(buff => {
                    // Create buff icon element
                    const buffIcon = document.createElement('span');
                    buffIcon.classList.add('buff-icon', buff.type);
                    
                    // Set icon based on buff type
                    const iconMap = {
                        'defense': '🛡️',
                        'focus': '🔍',
                        'attack-boost': '⚡',
                        'poison': '☠️',
                        'stunned': '💫',
                        'minion': '👺',
                        'curse': '👿'
                    };
                    
                    buffIcon.textContent = iconMap[buff.type] || '?';
                    
                    // Add turns remaining
                    const turnsSpan = document.createElement('span');
                    turnsSpan.classList.add('turns');
                    turnsSpan.textContent = buff.duration;
                    buffIcon.appendChild(turnsSpan);
                    
                    // Add tooltip
                    let tooltipText = this.getBuffTooltip(buff);
                    buffIcon.setAttribute('data-tooltip', tooltipText);
                    
                    buffsElement.appendChild(buffIcon);
                });
            }
        }
    }
    
    // Get tooltip text for a buff
    getBuffTooltip(buff) {
        const tooltipTexts = {
            'defense': `Defense: ${buff.value}\nTurns: ${buff.duration}`,
            'focus': `Focus: +20% damage/healing\nTurns: ${buff.duration}`,
            'attack-boost': `Attack +${buff.value}\nTurns: ${buff.duration}`,
            'poison': `Poison: ${buff.value} dmg/turn\nTurns: ${buff.duration}`,
            'stunned': `Stunned\nTurns: ${buff.duration}`,
            'minion': `Minion: +${buff.value} damage\nTurns: ${buff.duration}`,
            'curse': `Curse: -${buff.value * 100}% damage\nTurns: ${buff.duration}`
        };
        
        return tooltipTexts[buff.type] || `${buff.type.charAt(0).toUpperCase() + buff.type.slice(1)}\nTurns: ${buff.duration}`;
    }
    
    // Update gem bag count
    updateGemBagCount(gems, maxBagSize) {
        this.updateElement('gem-bag-count', gems.bag.length);
        this.updateElement('gem-bag-count2', gems.bag.length);
        this.updateElement('gem-bag-total', maxBagSize);
        this.updateElement('gem-bag-total2', maxBagSize);
    }
    
    // Helper method to update element text content
    updateElement(elementId, value) {
        const element = this.elements[elementId] || document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }
    
    // Render the player's hand of gems
    renderHand() {
        const state = this.stateManager.getState();
        const { gems, player } = state;
        const { hand } = gems;
        const handElement = this.elements['hand'];
        
        if (handElement) {
            handElement.innerHTML = '';
            
            hand.forEach(gem => {
                const gemElement = this.createGemElement(gem, 'battle');
                
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
                
                handElement.appendChild(gemElement);
            });
        }
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
        
        // Add unlearned indicator if not fully mastered
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
            badgeDiv.classList.add('gem-badge', `badge-${gem.augmentation}`);
            badgeDiv.textContent = gem.badgeIcon;
            gemElement.appendChild(badgeDiv);
        }
        
        // Add tooltip in non-battle contexts
        if (context === 'shop' || context === 'catalog') {
            gemElement.setAttribute('data-tooltip', generateGemTooltip(gem));
            gemElement.classList.add('tooltip-enabled');
        }
        
        return gemElement;
    }
    
    // Update battle action buttons
    updateBattleButtons() {
        const state = this.stateManager.getState();
        const { battle, player } = state;
        
        // Only enable buttons on player's turn
        const isPlayerTurn = battle.currentTurn === 'PLAYER';
        const isPlayerStunned = player.buffs.some(buff => buff.type === 'stunned');
        
        // Check if gems have been played this turn
        const hasPlayedGems = battle.staminaUsed > 0;
        
        // Set button states
        if (isPlayerStunned) {
            // If stunned, disable all buttons
            this.disableElement('execute-btn');
            this.disableElement('wait-btn');
            this.disableElement('discard-end-btn');
            this.disableElement('end-turn-btn');
            this.disableElement('flee-btn');
            
            // Add stunned visual indicator
            const playerStats = document.getElementById('player-stats');
            if (playerStats) {
                playerStats.classList.add('stunned');
            }
        } else {
            // Normal button state handling
            this.setElementDisabled('execute-btn', !isPlayerTurn || this.selectedGems.length === 0);
            this.setElementDisabled('wait-btn', !isPlayerTurn || hasPlayedGems);
            this.setElementDisabled('discard-end-btn', !isPlayerTurn || this.selectedGems.length === 0 || hasPlayedGems);
            this.setElementDisabled('end-turn-btn', !isPlayerTurn);
            
            // Only enable flee in Dawn/Dusk phases
            const canFlee = state.journey.phase !== 'DARK';
            this.setElementDisabled('flee-btn', !isPlayerTurn || !canFlee);
            
            // Remove stunned visual indicator
            const playerStats = document.getElementById('player-stats');
            if (playerStats) {
                playerStats.classList.remove('stunned');
            }
        }
    }
    
    // Helper to set element disabled state
    setElementDisabled(elementId, isDisabled) {
        const element = this.elements[elementId] || document.getElementById(elementId);
        if (element) {
            element.disabled = isDisabled;
        }
    }
    
    // Helper to disable an element
    disableElement(elementId) {
        this.setElementDisabled(elementId, true);
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
        const gemElements = this.elements['hand'].querySelectorAll('.gem');
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
        // When player waits, track with special value 0 to indicate waiting/skipping
        this.eventBus.emit('stamina:used', 0);
        this.eventBus.emit('player:wait');
    }
    
    // Discard selected gems and end turn
    discardAndEndTurn() {
        if (this.selectedGems.length === 0) {
            this.showMessage('No gems selected to discard!', 'error');
            return;
        }
        
        // Emit discard event
        this.eventBus.emit('gems:discard', this.selectedGems);
        
        // When discarding, track with special value 0 for standard recovery
        this.eventBus.emit('stamina:used', 0);
        
        // Clear selection and end turn
        this.selectedGems = [];
        this.endTurn();
    }
    
    // End player turn
    endTurn() {
        // If player directly ends turn without playing gems,
        // track with special value 0 to get the standard stamina recovery
        const state = this.stateManager.getState();
        const battle = state.battle;
        
        // Only emit if this is actually the player's turn
        if (battle && battle.currentTurn === 'PLAYER') {
            // Only emit if we haven't already tracked stamina usage this turn
            if (!battle.staminaUsed || battle.staminaUsed === 0) {
                this.eventBus.emit('stamina:used', 0);
            }
        }
        
        this.eventBus.emit('turn:ended');
    }
    
    // Flee from battle
    fleeBattle() {
        this.eventBus.emit('battle:flee');
    }
    
    // Shop setup and UI
    setupShop() {
        const state = this.stateManager.getState();
        const { player, gems } = state;
        
        // Update shop stats
        this.updateElement('shop-health', player.health);
        this.updateElement('shop-max-health', player.maxHealth);
        this.updateElement('shop-zenny', player.zenny);
        
        // Render gems in hand
        this.renderShopHand();
        
        // Clear gem pool
        const gemPool = this.elements['gem-pool'];
        if (gemPool) {
            gemPool.innerHTML = '';
        }
        
        // Update instructions
        this.updateElement('gem-pool-instructions', 'Select a gem from your hand');
        
        // Update button states
        this.updateShopButtons();
        
        // Update gem bag count
        const currentBagSize = state.gemBagSize || 20;
        this.updateElement('shop-gem-bag-count', gems.bag.length);
        this.updateElement('shop-gem-bag-total', currentBagSize);
        
        // Render shop inventory
        this.renderShopInventory();
    }
    
    // Update shop UI
    updateShopUI() {
        const state = this.stateManager.getState();
        const { player, gems } = state;
        
        // Update shop stats
        this.updateElement('shop-health', player.health);
        this.updateElement('shop-max-health', player.maxHealth);
        this.updateElement('shop-zenny', player.zenny);
        
        // Render gems in hand
        this.renderShopHand();
        
        // Update gem bag count
        const currentBagSize = state.gemBagSize || 20;
        this.updateElement('shop-gem-bag-count', gems.bag.length);
        this.updateElement('shop-gem-bag-total', currentBagSize);
        
        // Update button states
        this.updateShopButtons();
    }
    
    // Render shop inventory
    renderShopInventory() {
        // Request inventory from shop manager
        this.eventBus.emit('shop:get-inventory', inventory => {
            let shopInventorySection = document.getElementById('shop-inventory-section');
            
            // Create section if it doesn't exist
            if (!shopInventorySection) {
                shopInventorySection = document.createElement('div');
                shopInventorySection.id = 'shop-inventory-section';
                shopInventorySection.className = 'shop-section';
                shopInventorySection.style.marginTop = '20px';
                
                const header = document.createElement('h2');
                header.textContent = 'Gems For Sale';
                shopInventorySection.appendChild(header);
                
                const inventoryContainer = document.createElement('div');
                inventoryContainer.id = 'shop-inventory-container';
                inventoryContainer.className = 'gem-container';
                inventoryContainer.style.display = 'flex';
                inventoryContainer.style.flexWrap = 'wrap';
                inventoryContainer.style.justifyContent = 'center';
                inventoryContainer.style.gap = '15px';
                inventoryContainer.style.margin = '10px 0';
                
                shopInventorySection.appendChild(inventoryContainer);
                
                // Insert before continue button
                const shopSelections = document.getElementById('shop-selections');
                const continueBtn = document.getElementById('continue-btn');
                
                if (shopSelections && continueBtn) {
                    shopSelections.insertBefore(shopInventorySection, continueBtn);
                } else if (shopSelections) {
                    shopSelections.appendChild(shopInventorySection);
                }
            }
            
            // Update inventory items
            const inventoryContainer = document.getElementById('shop-inventory-container');
            if (inventoryContainer) {
                inventoryContainer.innerHTML = '';
                
                if (!inventory || inventory.length === 0) {
                    const emptyMsg = document.createElement('div');
                    emptyMsg.textContent = 'No gems available for purchase';
                    emptyMsg.style.padding = '10px';
                    emptyMsg.style.fontStyle = 'italic';
                    inventoryContainer.appendChild(emptyMsg);
                    return;
                }
                
                // Render each gem in the inventory
                inventory.forEach((gem, index) => {
                    const gemContainer = this.createShopInventoryItem(gem, index);
                    inventoryContainer.appendChild(gemContainer);
                });
            }
        });
    }
    
    // Create a shop inventory item
    createShopInventoryItem(gem, index) {
        const gemContainer = document.createElement('div');
        gemContainer.className = 'gem-purchase-container';
        gemContainer.style.display = 'flex';
        gemContainer.style.flexDirection = 'column';
        gemContainer.style.alignItems = 'center';
        gemContainer.style.margin = '10px';
        
        // Create gem element
        const gemElement = this.createGemElement(gem, 'shop');
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
        const playerZenny = parseInt(this.elements['shop-zenny']?.textContent || '0');
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
        
        return gemContainer;
    }
    
    // Render gems in shop hand
    renderShopHand() {
        const state = this.stateManager.getState();
        const { gems } = state;
        const { hand } = gems;
        const shopHand = this.elements['shop-hand'];
        
        if (shopHand) {
            shopHand.innerHTML = '';
            
            hand.forEach(gem => {
                const gemElement = this.createGemElement(gem, 'shop');
                
                // Add selection handler
                gemElement.addEventListener('click', () => {
                    this.selectShopGem(gem.instanceId);
                });
                
                // Mark as selected if it's the selected gem
                if (this.shopState.selectedHandGem === gem.instanceId) {
                    gemElement.classList.add('selected');
                }
                
                shopHand.appendChild(gemElement);
            });
        }
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
        
        // Get costs from shop manager
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
        this.setElementDisabled('upgrade-gem', !hasSelection || !enoughForUpgrade || this.shopState.upgradeMode);
        this.setElementDisabled('discard-gem', !hasSelection || !enoughForDiscard || this.shopState.upgradeMode);
        this.setElementDisabled('buy-random-gem', !enoughForRandom || this.shopState.upgradeMode);
        this.setElementDisabled('heal-10', !enoughForHeal || !needsHealing || this.shopState.upgradeMode);
        
        // Show/hide upgrade mode buttons
        const cancelUpgradeBtn = this.elements['cancel-upgrade'];
        if (cancelUpgradeBtn) {
            cancelUpgradeBtn.style.display = this.shopState.upgradeMode ? 'inline-block' : 'none';
        }
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
    
    // Show upgrade options for a gem
    showUpgradeOptions(gemInstanceId) {
        // Get upgrade options from gem manager
        this.eventBus.emit('gem:get-upgrade-options', {
            gemInstanceId,
            callback: options => {
                if (!options || options.length === 0) {
                    this.showMessage('No upgrade options available for this gem', 'error');
                    return;
                }
                
                // Enter upgrade mode
                this.shopState.upgradeMode = true;
                this.shopState.upgradeOptions = options;
                
                // Render upgrade options
                this.renderUpgradeOptions(gemInstanceId);
                
                // Update button states
                this.updateShopButtons();
            }
        });
    }
    
    // Render upgrade options
    renderUpgradeOptions(gemInstanceId) {
        const gemPool = this.elements['gem-pool'];
        if (!gemPool) return;
        
        // Clear gem pool
        gemPool.innerHTML = '';
        
        // Show instructions
        this.updateElement('gem-pool-instructions', 'Select an upgrade:');
        
        // Get the gem from state
        const state = this.stateManager.getState();
        const gem = state.gems.hand.find(g => g.instanceId === gemInstanceId);
        
        if (!gem) {
            console.error(`Gem not found: ${gemInstanceId}`);
            return;
        }
        
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
        
        gemPool.appendChild(originalGemContainer);

        // Add options header
        const optionsHeader = document.createElement('div');
        optionsHeader.textContent = 'Available Upgrades:';
        optionsHeader.style.textAlign = 'center';
        optionsHeader.style.fontWeight = 'bold';
        optionsHeader.style.padding = '5px';
        optionsHeader.style.marginBottom = '10px';
        gemPool.appendChild(optionsHeader);
        
        // Create a container for all upgrade options
        const upgradesContainer = document.createElement('div');
        upgradesContainer.classList.add('upgrade-options-container');
        upgradesContainer.style.display = 'flex';
        upgradesContainer.style.flexWrap = 'wrap';
        upgradesContainer.style.justifyContent = 'center';
        upgradesContainer.style.gap = '15px';
        
        // Add all options to the container
        this.shopState.upgradeOptions.forEach(upgradeGem => {
            const wrapper = this.createUpgradeOption(upgradeGem, gemInstanceId);
            upgradesContainer.appendChild(wrapper);
        });
        
        gemPool.appendChild(upgradesContainer);
        
        // If no options available, show message
        if (this.shopState.upgradeOptions.length === 0) {
            const noOptionsMsg = document.createElement('div');
            noOptionsMsg.textContent = 'No upgrade options available';
            noOptionsMsg.style.padding = '20px';
            noOptionsMsg.style.textAlign = 'center';
            gemPool.appendChild(noOptionsMsg);
        }
    }
    
    // Create an upgrade option element
    createUpgradeOption(upgradeGem, originalGemId) {
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
        
        // Store upgrade data
        wrapper.setAttribute('data-upgrade-id', upgradeGem.instanceId || upgradeGem.id);
        wrapper.setAttribute('data-augmentation', upgradeGem.augmentation || '');
        wrapper.setAttribute('data-upgrade-type', upgradeType);
        
        // Add click handler
        wrapper.addEventListener('click', () => {
            const selectedId = upgradeGem.instanceId || upgradeGem.id;
            this.selectUpgrade(originalGemId, selectedId);
        });
        
        return wrapper;
    }
    
    // Cancel upgrade mode
    cancelUpgrade() {
        this.shopState.upgradeMode = false;
        this.shopState.upgradeOptions = [];
        
        // Clear gem pool
        const gemPool = this.elements['gem-pool'];
        if (gemPool) {
            gemPool.innerHTML = '';
        }
        
        // Update instructions
        this.updateElement('gem-pool-instructions', 'Select a gem from your hand');
        
        // Update button states
        this.updateShopButtons();
    }
    
    // Select an upgrade option
    selectUpgrade(gemInstanceId, upgradeGemId) {
        // Get the upgrade option object
        const upgradeOption = this.shopState.upgradeOptions.find(u => 
            (u.instanceId === upgradeGemId) || (u.id === upgradeGemId)
        );
        
        if (upgradeOption && upgradeOption.upgradeType === 'augmentation') {
            // For augmentation upgrades, pass the whole object
            this.eventBus.emit('shop:upgrade-gem', {
                gemInstanceId,
                newGemId: upgradeOption
            });
        } else if (upgradeGemId.endsWith('-upgraded')) {
            // For direct upgrades
            this.eventBus.emit('shop:direct-upgrade-gem', {
                gemInstanceId,
                originalGemId: gemInstanceId.split('-')[0]
            });
        } else {
            // Standard upgrades
            this.eventBus.emit('shop:upgrade-gem', {
                gemInstanceId,
                newGemId: upgradeGemId
            });
        }
        
        // Exit upgrade mode
        this.cancelUpgrade();
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
        this.updateElement('camp-day', journey.day);
        
        // Update zenny displays
        this.updateElement('camp-zenny', player.zenny);
        this.updateElement('camp-meta-zenny', meta.zenny);
        
        // Clear input fields
        const withdrawAmount = this.elements['withdraw-amount'];
        const depositAmount = this.elements['deposit-amount'];
        
        if (withdrawAmount) withdrawAmount.value = '';
        if (depositAmount) depositAmount.value = '';
    }
    
    // Withdraw zenny from journey to meta wallet
    withdrawZenny() {
        const withdrawAmount = this.elements['withdraw-amount'];
        if (!withdrawAmount) return;
        
        const amount = parseInt(withdrawAmount.value, 10);
        
        if (isNaN(amount) || amount <= 0) {
            this.showMessage('Please enter a valid amount!', 'error');
            return;
        }
        
        // Emit withdraw event
        this.eventBus.emit('camp:withdraw', amount);
        
        // Clear input field
        withdrawAmount.value = '';
    }
    
    // Deposit zenny from meta to journey wallet
    depositZenny() {
        const depositAmount = this.elements['deposit-amount'];
        if (!depositAmount) return;
        
        const amount = parseInt(depositAmount.value, 10);
        
        if (isNaN(amount) || amount <= 0) {
            this.showMessage('Please enter a valid amount!', 'error');
            return;
        }
        
        // Emit deposit event
        this.eventBus.emit('camp:deposit', amount);
        
        // Clear input field
        depositAmount.value = '';
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
        this.updateElement('meta-zenny-display', meta.zenny);
        
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
        const unlockedGemsContainer = this.elements['unlocked-gems'];
        
        if (!unlockedGemsContainer) return;
        unlockedGemsContainer.innerHTML = '';
        
        // Get definitions from gem manager
        this.eventBus.emit('gem:get-definitions', {
            callback: (definitions) => {
                // Determine which gems to display
                let globalGems = [];
                let classGems = [];
                
                if (Array.isArray(meta.unlockedGems)) {
                    globalGems = meta.unlockedGems;
                } else if (meta.unlockedGems) {
                    globalGems = meta.unlockedGems.global || [];
                    classGems = meta.unlockedGems[playerClass] || [];
                }
                
                // Base gems to always display
                const baseGems = ['red-attack', 'blue-magic', 'green-attack', 'grey-heal'];
                
                // Display base gems first
                baseGems.forEach(gemId => {
                    if (definitions[gemId]) {
                        unlockedGemsContainer.appendChild(
                            this.createGemElement(definitions[gemId], 'catalog')
                        );
                    }
                });
                
                // Class-specific starter gems
                const classStarterGems = {
                    'knight': ['red-strong'],
                    'mage': ['blue-strong-heal'],
                    'rogue': ['green-quick']
                };
                
                (classStarterGems[playerClass] || []).forEach(gemId => {
                    if (definitions[gemId]) {
                        unlockedGemsContainer.appendChild(
                            this.createGemElement(definitions[gemId], 'catalog')
                        );
                    }
                });
                
                // Display additional unlocked gems
                classGems.forEach(gemId => {
                    // Skip if already displayed
                    if (baseGems.includes(gemId) || 
                        (classStarterGems[playerClass] && classStarterGems[playerClass].includes(gemId))) {
                        return;
                    }
                    
                    if (definitions[gemId]) {
                        unlockedGemsContainer.appendChild(
                            this.createGemElement(definitions[gemId], 'catalog')
                        );
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
        const availableGemsContainer = this.elements['available-gems'];
        
        if (!availableGemsContainer) return;
        availableGemsContainer.innerHTML = '';
        
        // Determine unlocked gems
        let unlockedGems = [];
        if (Array.isArray(meta.unlockedGems)) {
            unlockedGems = meta.unlockedGems;
        } else if (meta.unlockedGems) {
            unlockedGems = [
                ...(meta.unlockedGems.global || []),
                ...(meta.unlockedGems[playerClass] || [])
            ];
        }
        
        // Get unlockable gems
        this.eventBus.emit('gem:get-unlockable', {
            callback: (unlockables) => {
                // Get definitions
                this.eventBus.emit('gem:get-definitions', {
                    callback: (definitions) => {
                        // Filter out already unlocked gems
                        const notYetUnlocked = unlockables.filter(gemId => 
                            !unlockedGems.includes(gemId)
                        );
                        
                        if (notYetUnlocked.length > 0) {
                            // Create gem elements for each unlockable
                            notYetUnlocked.forEach(gemId => {
                                if (definitions[gemId]) {
                                    const container = document.createElement('div');
                                    container.classList.add('unlockable-gem-container');
                                    
                                    // Create gem element
                                    const gemElement = this.createGemElement(definitions[gemId], 'catalog');
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
                                    
                                    availableGemsContainer.appendChild(container);
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
    
    // Show message when no gems are available
    showNoGemsMessage() {
        const availableGemsContainer = this.elements['available-gems'];
        if (!availableGemsContainer) return;
        
        const noGemsMsg = document.createElement('div');
        noGemsMsg.textContent = 'No additional gems available to unlock';
        noGemsMsg.style.padding = '20px';
        noGemsMsg.style.textAlign = 'center';
        availableGemsContainer.appendChild(noGemsMsg);
    }
    
    // Unlock a gem
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
                    this.eventBus.emit('gem:unlock', gemId);
                }
            }
        });
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
        const handElement = this.elements['hand'];
        if (handElement) {
            const gemElements = handElement.querySelectorAll('.gem');
            gemElements.forEach(elem => {
                if (elem.getAttribute('data-gem-id') === gemData.instanceId) {
                    elem.classList.add('drawn');
                    setTimeout(() => {
                        elem.classList.remove('drawn');
                    }, 500);
                }
            });
        }
    }
    
    // Create damage text animation
    createDamageText(amount, isHeal, position) {
        const battleEffects = document.getElementById('battle-effects');
        if (!battleEffects) return;
        
        const textElement = document.createElement('div');
        textElement.classList.add(isHeal ? 'heal-text' : 'damage-text');
        textElement.textContent = `${isHeal ? '+' : '-'}${amount}`;
        
        // Position the text
        textElement.style.left = position.left || '50%';
        textElement.style.top = position.top || '50%';
        
        // Add to battle effects
        battleEffects.appendChild(textElement);
        
        // Remove after animation completes
        setTimeout(() => {
            textElement.remove();
        }, 1500);
    }
    
    onPlayerDamaged(data) {
        this.createDamageText(data.amount, false, { left: '30%', top: '80%' });
    }
    
    onEnemyDamaged(data) {
        this.createDamageText(data.amount, false, { left: '50%', top: '20%' });
    }
    
    onPlayerHealed(data) {
        this.createDamageText(data.amount, true, { left: '30%', top: '80%' });
    }
    
    // Show a message to the user
    showMessage(text, type = 'success') {
        const messageElement = this.elements['message'] || document.getElementById('message');
        
        if (messageElement) {
            messageElement.textContent = text;
            messageElement.className = ''; // Reset classes
            messageElement.classList.add('message', type, 'visible');
            
            // Hide after 3 seconds
            setTimeout(() => {
                messageElement.classList.remove('visible');
            }, 3000);
        }
    }
    
    // Setup gem bag containers
    setupGemBagContainers() {
        const battleGemBag = document.getElementById('gem-bag-container');
        const shopGemBag = document.getElementById('shop-gem-bag-container');
        
        // Add click handlers to emit events
        if (battleGemBag) {
            battleGemBag.style.cursor = 'pointer';
            battleGemBag.onclick = (e) => {
                this.eventBus.emit('overlay:open-gem-bag');
                e.stopPropagation(); // Prevent event bubbling
            };
        }
        
        if (shopGemBag) {
            shopGemBag.style.cursor = 'pointer';
            shopGemBag.onclick = (e) => {
                this.eventBus.emit('overlay:open-gem-bag');
                e.stopPropagation(); // Prevent event bubbling
            };
        }
    }
    
    // Update overlay element references
    updateOverlayElementReferences() {
        // Get overlay elements
        this.elements['gem-bag-overlay'] = document.getElementById('gem-bag-overlay');
        this.elements['gem-bag-close-button'] = document.querySelector('#gem-bag-overlay .close-button');
        this.elements['available-gems-container'] = document.getElementById('available-gems-container');
        this.elements['played-gems-container'] = document.getElementById('played-gems-container');
        this.elements['available-gems-count'] = document.getElementById('available-gems-count');
        this.elements['played-gems-count'] = document.getElementById('played-gems-count');
        
        // Add event handlers
        const closeButton = this.elements['gem-bag-close-button'];
        if (closeButton) {
            closeButton.onclick = () => this.eventBus.emit('overlay:close-gem-bag');
        }
        
        const overlay = this.elements['gem-bag-overlay'];
        if (overlay) {
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    this.eventBus.emit('overlay:close-gem-bag');
                }
            });
        }
        
        // Add keyboard event for Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && 
                overlay && 
                overlay.style.display === 'block') {
                this.eventBus.emit('overlay:close-gem-bag');
            }
        });
    }
    
    // Open gem bag overlay
    openGemBagOverlay() {
        // Make sure we have updated references
        this.updateOverlayElementReferences();
        
        const state = this.stateManager.getState();
        const { gems } = state;
        const overlay = this.elements['gem-bag-overlay'];
        const availableGemsContainer = this.elements['available-gems-container'];
        const playedGemsContainer = this.elements['played-gems-container'];
        const availableGemsCount = this.elements['available-gems-count'];
        const playedGemsCount = this.elements['played-gems-count'];
        
        // Check if overlay elements exist
        if (!overlay || !availableGemsContainer || !playedGemsContainer) {
            console.error('Gem bag overlay elements not found');
            return;
        }
        
        // Clear previous content
        availableGemsContainer.innerHTML = '';
        playedGemsContainer.innerHTML = '';
        
        // Update gem counts
        if (availableGemsCount) availableGemsCount.textContent = gems.bag.length;
        if (playedGemsCount) playedGemsCount.textContent = gems.played ? gems.played.length : 0;
        
        // Render available gems
        if (gems.bag.length > 0) {
            gems.bag.forEach(gem => {
                const gemElement = this.createGemElement(gem, 'catalog');
                availableGemsContainer.appendChild(gemElement);
            });
        } else {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'No gems available in bag';
            emptyMessage.style.padding = '20px';
            emptyMessage.style.fontStyle = 'italic';
            availableGemsContainer.appendChild(emptyMessage);
        }
        
        // Render played gems
        if (gems.played && gems.played.length > 0) {
            gems.played.forEach(gem => {
                const gemElement = this.createGemElement(gem, 'catalog');
                gemElement.classList.add('played');
                playedGemsContainer.appendChild(gemElement);
            });
        } else {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'No gems have been played yet';
            emptyMessage.style.padding = '20px';
            emptyMessage.style.fontStyle = 'italic';
            playedGemsContainer.appendChild(emptyMessage);
        }
        
        // Show the overlay
        overlay.style.display = 'block';
        
        // Emit event that overlay has been opened
        this.eventBus.emit('overlay:gem-bag-opened');
    }
    
    // Close gem bag overlay
    closeGemBagOverlay() {
        const overlay = this.elements['gem-bag-overlay'];
        
        if (overlay) {
            overlay.style.display = 'none';
            this.eventBus.emit('overlay:gem-bag-closed');
        }
    }
}