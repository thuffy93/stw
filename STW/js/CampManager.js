// CampManager.js - Handles camp interactions and day transitions
export default class CampManager {
    constructor(eventBus, stateManager, battleManager) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.battleManager = battleManager;
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for camp action events
        this.eventBus.on('camp:withdraw', (amount) => {
            this.withdrawZenny(amount);
        });
        
        this.eventBus.on('camp:deposit', (amount) => {
            this.depositZenny(amount);
        });
        
        this.eventBus.on('camp:next-day', () => {
            this.startNextDay();
        });
    }
    
    // Transfer zenny from journey to meta wallet
    withdrawZenny(amount) {
        const state = this.stateManager.getState();
        const { player, meta } = state;
        
        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            this.eventBus.emit('message:show', {
                text: 'Please enter a valid amount!',
                type: 'error'
            });
            return false;
        }
        
        // Check if player has enough
        if (player.zenny < amount) {
            this.eventBus.emit('message:show', {
                text: 'Not enough $ZENNY in journey wallet!',
                type: 'error'
            });
            return false;
        }
        
        // Transfer zenny
        this.stateManager.updateState({
            player: {
                zenny: player.zenny - amount
            },
            meta: {
                zenny: meta.zenny + amount
            }
        });
        
        this.eventBus.emit('message:show', {
            text: `Transferred ${amount} $ZENNY to meta wallet!`,
            type: 'success'
        });
        
        return true;
    }
    
    // Transfer zenny from meta to journey wallet
    depositZenny(amount) {
        const state = this.stateManager.getState();
        const { player, meta } = state;
        
        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            this.eventBus.emit('message:show', {
                text: 'Please enter a valid amount!',
                type: 'error'
            });
            return false;
        }
        
        // Check if meta wallet has enough
        if (meta.zenny < amount) {
            this.eventBus.emit('message:show', {
                text: 'Not enough $ZENNY in meta wallet!',
                type: 'error'
            });
            return false;
        }
        
        // Transfer zenny
        this.stateManager.updateState({
            player: {
                zenny: player.zenny + amount
            },
            meta: {
                zenny: meta.zenny - amount
            }
        });
        
        this.eventBus.emit('message:show', {
            text: `Deposited ${amount} $ZENNY to journey wallet!`,
            type: 'success'
        });
        
        return true;
    }
    
    // Start the next day of the journey
    startNextDay() {
        const state = this.stateManager.getState();
        let { day } = state.journey;
        
        // Check if this was the last day (day 7)
        if (day >= 7) {
            // Game completed
            this.completeJourney();
            return;
        }
        
        // Heal player a bit at camp (25% of max health)
        const healAmount = Math.floor(state.player.maxHealth * 0.25);
        const newHealth = Math.min(state.player.maxHealth, state.player.health + healAmount);
        
        this.stateManager.updateState({
            player: {
                health: newHealth
            }
        });
        
        this.eventBus.emit('message:show', {
            text: `Rested and healed ${healAmount} HP. Ready for day ${day + 1}!`,
            type: 'success'
        });
        
        // Proceed to next battle
        this.stateManager.changeScreen('battle-screen');
        
        // Start next battle with a short delay
        setTimeout(() => {
            this.eventBus.emit('battle:start');
        }, 1000);
    }
    
    // Complete the 7-day journey
    completeJourney() {
        const state = this.stateManager.getState();
        
        // Mark journey as completed
        this.stateManager.updateState({
            journey: {
                completed: true
            }
        });
        
        // Award bonus meta zenny for completing journey
        const bonusZenny = 100;
        this.stateManager.updateState({
            meta: {
                zenny: state.meta.zenny + bonusZenny
            }
        });
        
        this.eventBus.emit('message:show', {
            text: `Journey completed! Earned ${bonusZenny} bonus Meta $ZENNY!`,
            type: 'success'
        });
        
        // Return to character select after a delay
        setTimeout(() => {
            this.stateManager.changeScreen('character-select-screen');
        }, 3000);
    }
}