// main.js - Main application entry point
import EventBus from './EventBus.js';
import StateManager from './StateManager.js';
import GemManager from './GemManager.js';
import BattleManager from './BattleManager.js';
import ShopManager from './ShopManager.js';
import UIManager from './UIManager.js';
import CampManager from './CampManager.js';

// Audio system - simple wrapper for sound effects
class AudioManager {
    constructor() {
        this.enabled = false;
        this.sounds = {};
        this.backgroundMusic = null;
    }
    
    init() {
        // Create sound effects
        this.sounds = {
            gemPlay: new Audio('sounds/gem_play.mp3'),
            gemFail: new Audio('sounds/gem_fail.mp3'),
            playerDamage: new Audio('sounds/player_damage.mp3'),
            enemyDamage: new Audio('sounds/enemy_damage.mp3'),
            heal: new Audio('sounds/heal.mp3'),
            victory: new Audio('sounds/victory.mp3'),
            defeat: new Audio('sounds/defeat.mp3'),
            buttonClick: new Audio('sounds/button_click.mp3'),
            // Add more sounds as needed
        };
        
        // Set up background music
        this.backgroundMusic = new Audio('sounds/background_music.mp3');
        this.backgroundMusic.loop = true;
        
        // Handle missing sound files gracefully
        Object.values(this.sounds).forEach(sound => {
            sound.addEventListener('error', (e) => {
                console.log('Sound file not found, disabling sound');
                this.enabled = false;
            });
        });
        
        this.backgroundMusic.addEventListener('error', (e) => {
            console.log('Background music file not found');
        });
    }
    
    toggleSound() {
        this.enabled = !this.enabled;
        
        if (this.enabled) {
            this.backgroundMusic.play().catch(e => console.log('Failed to play background music'));
        } else {
            this.backgroundMusic.pause();
        }
    }
    
    play(soundName) {
        if (!this.enabled || !this.sounds[soundName]) return;
        
        // Stop and reset the sound before playing
        const sound = this.sounds[soundName];
        sound.currentTime = 0;
        sound.play().catch(e => console.log(`Failed to play sound: ${soundName}`));
    }
}

// Initialize the game
class Game {
    constructor() {
        // Create the event bus (central messaging system)
        this.eventBus = new EventBus();
        
        // Create the state manager
        this.stateManager = new StateManager(this.eventBus);
        
        // Create the gem manager
        this.gemManager = new GemManager(this.eventBus, this.stateManager);
        
        // Create the battle manager
        this.battleManager = new BattleManager(this.eventBus, this.stateManager, this.gemManager);
        
        // Create the shop manager
        this.shopManager = new ShopManager(this.eventBus, this.stateManager, this.gemManager);
        
        // Create the UI manager
        this.uiManager = new UIManager(this.eventBus, this.stateManager);
        
        // Create the camp manager
        this.campManager = new CampManager(this.eventBus, this.stateManager, this.battleManager);
        
        // Create audio manager
        this.audioManager = new AudioManager();
    }
    
    init() {
        // Initialize audio system
        this.audioManager.init();
        
        // Listen for audio toggle
        document.getElementById('audio-button').addEventListener('click', () => {
            this.audioManager.toggleSound();
            document.getElementById('audio-button').textContent = 
                this.audioManager.enabled ? '🔊' : '🔇';
        });
        
        // Set up additional event listeners
        this.setupEventListeners();
        
        // Initial UI update
        this.eventBus.emit('state:updated');
        
        console.log('Game initialized!');
    }
    
    setupEventListeners() {
        // Connect various events across managers
        
        // Forward gem-related events to gem manager
        this.eventBus.on('gems:play', (selectedGems) => {
            this.gemManager.playGems(selectedGems);
        });
        
        this.eventBus.on('gems:discard', (selectedGems) => {
            this.gemManager.discardGems(selectedGems);
        });
        
        // Handle player wait action (get focus)
        this.eventBus.on('player:wait', () => {
            // Add focus buff
            const state = this.stateManager.getState();
            const playerBuffs = state.player.buffs;
            
            const focusBuff = {
                type: 'focus',
                duration: 1
            };
            
            const newBuffs = [...playerBuffs.filter(b => b.type !== 'focus'), focusBuff];
            
            this.stateManager.updateState({
                player: {
                    buffs: newBuffs
                }
            });
            
            this.eventBus.emit('message:show', {
                text: 'Focused! +20% damage/healing next turn.',
                type: 'success'
            });
            
            // End turn
            this.eventBus.emit('turn:ended');
        });
        
        // Connect stamina:used event to battleManager
        this.eventBus.on('stamina:used', (amount) => {
            this.battleManager.trackStaminaUsed(amount);
        });
        
        // Handle battle flee
        this.eventBus.on('battle:flee', () => {
            this.battleManager.fleeBattle();
        });
        
        // Handle journey continuation after shop
        this.eventBus.on('journey:continue', () => {
            this.battleManager.continueJourney();
        });
        
        // Handle gem upgrade options request
        this.eventBus.on('gem:get-upgrade-options', (data) => {
            const options = this.gemManager.getUpgradeOptions(data.gemInstanceId);
            data.callback(options);
        });
        
        // Handle gem definitions request
        this.eventBus.on('gem:get-definitions', (data) => {
            data.callback(this.gemManager.gemDefinitions);
        });
        
        // Handle unlockable gems request
        this.eventBus.on('gem:get-unlockable', (data) => {
            const playerClass = this.stateManager.getState().player.class;
            const unlockables = this.gemManager.availableGemsByClass[playerClass] || [];
            data.callback(unlockables);
        });
        
        // Handle gem unlock request
        this.eventBus.on('gem:unlock', (gemId) => {
            this.shopManager.unlockGem(gemId);
        });
        
        // Audio events
        this.eventBus.on('player:damaged', () => this.audioManager.play('playerDamage'));
        this.eventBus.on('enemy:damaged', () => this.audioManager.play('enemyDamage'));
        this.eventBus.on('player:healed', () => this.audioManager.play('heal'));
        this.eventBus.on('battle:victory', () => this.audioManager.play('victory'));
        this.eventBus.on('battle:defeat', () => this.audioManager.play('defeat'));
        this.eventBus.on('gem:played', (gem) => {
            this.audioManager.play(gem.success ? 'gemPlay' : 'gemFail');
        });

        this.eventBus.on('gems:recycle', () => {
            this.gemManager.recycleAllGems();
        });
        
        this.eventBus.on('gem:expand-bag', (amount) => {
            this.gemManager.increaseGemBagSize(amount || 1);
        });
    }
    
    // Start the game
    start() {
        console.log('Game starting!');
        
        // Show initial screen (character select)
        this.stateManager.changeScreen('character-select-screen');
        
        // Expose addMetaZenny to global window for console access
        window.addMetaZenny = (amount) => {
            return this.stateManager.addMetaZenny(amount);
        };
    }
}


// Wait for DOM to load then initialize the game
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
    game.start();
});