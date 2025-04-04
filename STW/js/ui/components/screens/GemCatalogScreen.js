// Add Config import
import { GameState } from '../core/state.js';
import { EventBus } from '../core/eventbus.js';
import { Utils } from '../core/utils.js';
import { Config } from '../core/config.js';

/**
 * GemCatalogScreen - Handles the gem catalog UI
 */
export class GemCatalogScreen {
    constructor() {
        this.elements = {};
        this.initialized = false;
    }

    /**
     * Initialize the screen
     */
    initialize() {
        if (this.initialized) return true;

        // Cache DOM elements
        this.elements = {
            screen: document.getElementById('gem-catalog-screen'),
            metaZennyDisplay: document.getElementById('meta-zenny-display'),
            unlockedGems: document.getElementById('unlocked-gems'),
            availableGems: document.getElementById('available-gems'),
            continueJourneyBtn: document.getElementById('continue-journey-btn')
        };

        // Set up event listeners
        if (this.elements.continueJourneyBtn) {
            this.elements.continueJourneyBtn.addEventListener('click', () => {
                this.startJourney();
            });
        }

        EventBus.on('GEM_UNLOCKED', () => {
            this.updateGemCatalog();
        });

        EventBus.on('META_ZENNY_UPDATED', () => {
            this.updateGemCatalog();
        });

        this.initialized = true;
        return true;
    }

    /**
     * Start the journey
     */
    startJourney() {
        console.log("Starting journey");
        
        // Show loading message
        EventBus.emit('UI_MESSAGE', {
            message: "Starting your adventure..."
        });
        
        // Emit journey start event
        EventBus.emit('JOURNEY_START');
        
        // Switch to battle screen
        setTimeout(() => {
            EventBus.emit('SCREEN_CHANGE', 'battle');
        }, 100);
    }

    /**
     * Render the screen
     */
    render() {
        if (!this.initialized) this.initialize();
        
        console.log("Rendering gem catalog screen");
        
        // Update gem catalog
        this.updateGemCatalog();
        
        return true;
    }

    /**
     * Update gem catalog display
     */
    updateGemCatalog() {
        const metaZenny = GameState.get('metaZenny');

        // Update meta zenny display
        if (this.elements.metaZennyDisplay) {
            this.elements.metaZennyDisplay.textContent = metaZenny;
        }
        
        // Update unlocked gems
        this.renderUnlockedGems();
        
        // Update available gems
        this.renderAvailableGems();
    }

    /**
     * Render unlocked gems
     */
    renderUnlockedGems() {
        const gemCatalog = GameState.get('gemCatalog');
        const playerClass = GameState.get('player.class');
        const unlockedGemsContainer = this.elements.unlockedGems;
        
        if (!unlockedGemsContainer) return;
        
        unlockedGemsContainer.innerHTML = '';
        
        // Make sure gemCatalog exists and has unlocked property
        if (!gemCatalog || !gemCatalog.unlocked) {
            console.warn("Gem catalog or unlocked gems not found");
            return;
        }
        
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
        
        // Add gem elements
        filteredGems.forEach(gemKey => {
            const gem = Config.BASE_GEMS[gemKey];
            if (!gem) return;
            
            const gemElement = this.createGemElement(gem, playerClass);
            unlockedGemsContainer.appendChild(gemElement);
        });
    }

    /**
     * Render available gems
     */
    renderAvailableGems() {
        const gemCatalog = GameState.get('gemCatalog');
        const playerClass = GameState.get('player.class');
        const metaZenny = GameState.get('metaZenny');
        const availableGemsContainer = this.elements.availableGems;
        
        if (!availableGemsContainer) return;
        
        availableGemsContainer.innerHTML = '';
        
        // Make sure gemCatalog exists and has available property
        if (!gemCatalog || !gemCatalog.available) {
            console.warn("Gem catalog or available gems not found");
            return;
        }
        
        // Create a Set of unlocked gem keys for faster lookups
        const unlockedGemKeys = new Set(gemCatalog.unlocked || []);
        
        // Filter for gems that are not unlocked and match the class
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
        
        // Add gem elements
        availableGems.forEach(gemKey => {
            const gem = Config.BASE_GEMS[gemKey];
            if (!gem) return;
            
            const gemContainer = this.createUnlockableGemContainer(gem, gemKey, playerClass, metaZenny);
            availableGemsContainer.appendChild(gemContainer);
        });
    }

    /**
     * Create a gem element
     * @param {Object} gem - Gem data
     * @param {String} playerClass - Player class
     * @returns {HTMLElement} Gem element
     */
    createGemElement(gem, playerClass) {
        const gemElement = document.createElement("div");
        gemElement.className = `gem ${gem.color}`;
        
        // Check for class bonus
        const hasBonus = (playerClass === "Knight" && gem.color === "red") ||
                      (playerClass === "Mage" && gem.color === "blue") ||
                      (playerClass === "Rogue" && gem.color === "green");
        
        if (hasBonus) {
            gemElement.classList.add("class-bonus");
        }
        
        // Create content structure
        const gemContent = document.createElement("div");
        gemContent.className = "gem-content";
        
        // Add icon
        const gemIcon = document.createElement("div");
        gemIcon.className = "gem-icon";
        gemIcon.textContent = this.getGemSymbol(gem);
        gemContent.appendChild(gemIcon);
        
        // Add name (visible in catalog)
        const gemName = document.createElement("div");
        gemName.className = "gem-name";
        gemName.style.display = "block";
        gemName.textContent = gem.name;
        gemContent.appendChild(gemName);
        
        // Add value if it exists
        if (gem.damage || gem.heal || gem.poison) {
            const gemValue = document.createElement("div");
            gemValue.className = "gem-value";
            gemValue.textContent = gem.damage || gem.heal || gem.poison || "";
            gemContent.appendChild(gemValue);
        }
        
        gemElement.appendChild(gemContent);
        
        // Add cost
        const gemCost = document.createElement("div");
        gemCost.className = "gem-cost";
        gemCost.textContent = gem.cost;
        gemElement.appendChild(gemCost);
        
        // Add tooltip
        gemElement.setAttribute("data-tooltip", this.buildGemTooltip(gem, hasBonus));
        
        return gemElement;
    }

    /**
     * Create an unlockable gem container
     * @param {Object} gem - Gem data
     * @param {String} gemKey - Gem key
     * @param {String} playerClass - Player class
     * @param {Number} metaZenny - Available meta zenny
     * @returns {HTMLElement} Gem container element
     */
    createUnlockableGemContainer(gem, gemKey, playerClass, metaZenny) {
        // Create container
        const gemContainer = document.createElement("div");
        gemContainer.className = "unlockable-gem-container";
        
        // Create gem element
        const gemElement = this.createGemElement(gem, playerClass);
        gemElement.style.cursor = 'pointer';
        
        // Add click handler for unlocking
        gemElement.onclick = () => {
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
        
        return gemContainer;
    }

    /**
     * Get a symbol for a gem
     * @param {Object} gem - Gem data
     * @returns {String} Gem symbol
     */
    getGemSymbol(gem) {
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
        
        return "✨";
    }

    /**
     * Build tooltip text for a gem
     * @param {Object} gem - Gem data
     * @param {Boolean} hasBonus - Whether the gem has a class bonus
     * @returns {String} Tooltip text
     */
    buildGemTooltip(gem, hasBonus) {
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
}

export default GemCatalogScreen;