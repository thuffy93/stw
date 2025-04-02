import { GameState } from '../core/state.js';
import { EventBus } from '../core/events.js';
import { GEM_TYPES } from '../core/config.js';

/**
 * Initialize a new battle
 */
export function initBattle() {
    console.log("Initializing battle with enhanced system...");
    
    // Generate enemy if not present
    if (!GameState.get('battle.enemy')) {
        const enemy = generateEnemy();
        GameState.set('battle.enemy', enemy);
    }
    
    // Reset battle state
    GameState.set({
        'battleOver': false,
        'hasActedThisTurn': false,
        'hasPlayedGemThisTurn': false,
        'isEnemyTurnPending': false,
        'selectedGems': new Set()
    });
    
    // Initialize player buffs if not present
    if (!GameState.get('player.buffs')) {
        GameState.set('player.buffs', []);
    }
    
    // Reset stamina
    const player = GameState.get('player');
    GameState.set('player.stamina', player.baseStamina);
    
    // Draw initial cards
    drawGems(3);
    
    // Update UI
    updateBattleUI();
    
    // Set up end turn button
    const endTurnBtn = document.getElementById('end-turn-btn');
    if (endTurnBtn) {
        endTurnBtn.onclick = null; // Clear any existing handlers
        endTurnBtn.addEventListener('click', endPlayerTurn);
    }
}

/**
 * Generate an enemy for the current battle
 * @returns {Object} Enemy data
 */
function generateEnemy() {
    const currentPhaseIndex = GameState.get('currentPhaseIndex') || 0;
    const battleCount = GameState.get('battleCount') || 0;
    
    // Simple enemy types
    const enemies = [
        { name: "Grunt", maxHealth: 20, attack: 5, actions: ["Attack 5", "Defend"] },
        { name: "Bandit", maxHealth: 15, attack: 7, actions: ["Attack 7", "Defend"] },
        { name: "Wolf", maxHealth: 25, attack: 4, actions: ["Attack 4", "Defend"] }
    ];
    
    // Use a boss for the last battle of each phase
    const isBossBattle = battleCount % 3 === 2;
    
    let enemyBase;
    
    if (isBossBattle) {
        enemyBase = {
            name: "Dark Guardian",
            maxHealth: 30 + (currentPhaseIndex * 5),
            attack: 6 + currentPhaseIndex,
            actions: ["Attack 6", "Defend", "Defend"],
            isBoss: true
        };
    } else {
        // Select a regular enemy based on battle count
        enemyBase = { ...enemies[battleCount % enemies.length] };
        
        // Scale up with phase
        enemyBase.maxHealth += currentPhaseIndex * 3;
        enemyBase.attack += currentPhaseIndex;
    }
    
    // Prepare enemy for battle
    const enemy = {
        ...enemyBase,
        health: enemyBase.maxHealth,
        actionQueue: shuffleArray([...enemyBase.actions]),
        currentAction: null,
        buffs: []
    };
    
    // Set initial action
    enemy.currentAction = enemy.actionQueue.shift();
    
    return enemy;
}

/**
 * Draw gems to fill the player's hand
 * @param {Number} count - Target number of gems in hand
 */
export function drawGems(count) {
    const hand = document.getElementById('hand');
    if (!hand) {
        console.error("Hand container not found!");
        return;
    }
    
    // Clear the hand display
    hand.innerHTML = '';
    
    // For now, create random gems since we don't have a full gem bag system yet
    for (let i = 0; i < count; i++) {
        // Get all gem type keys
        const gemTypeKeys = Object.keys(GEM_TYPES);
        
        // Select random gem type
        const randomTypeKey = gemTypeKeys[Math.floor(Math.random() * gemTypeKeys.length)];
        const gemType = GEM_TYPES[randomTypeKey];
        
        const gem = document.createElement('div');
        gem.className = `gem ${gemType.color || 'red'}`;
        gem.innerHTML = `
            <div class="gem-icon">${gemType.icon}</div>
            <div class="gem-cost">${gemType.staminaCost}</div>
        `;
        
        // Store gem data as a data attribute for access in click handler
        gem.dataset.gemType = JSON.stringify({
            name: gemType.name,
            color: gemType.color || 'red',
            cost: gemType.staminaCost,
            damage: gemType.colors ? gemType.colors.red || gemType.colors.blue || gemType.colors.green || 0 : 0,
            heal: gemType.effect || 0,
            shield: gemType.name === 'Shield'
        });
        
        gem.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleGemSelection(gem);
        });
        
        hand.appendChild(gem);
    }
}

/**
 * Toggle selection for a gem
 * @param {HTMLElement} gemElement - The gem element to toggle
 */
function toggleGemSelection(gemElement) {
    // Toggle selected class
    gemElement.classList.toggle('selected');
    
    // Update selected gems in state
    const selectedGems = document.querySelectorAll('.gem.selected');
    
    // For now, we'll just track selection visually
    // In a more complete implementation, we'd track selection in state
    console.log(`${selectedGems.length} gems selected`);
}

/**
 * Execute selected gems
 */
export function executeGems() {
    const selectedGems = document.querySelectorAll('.gem.selected');
    if (selectedGems.length === 0) return;
    
    const player = GameState.get('player');
    const enemy = GameState.get('battle.enemy');
    
    // Process each selected gem
    selectedGems.forEach(gemElement => {
        try {
            const gemData = JSON.parse(gemElement.dataset.gemType);
            
            // Check stamina cost
            if (player.stamina < gemData.cost) {
                gemElement.classList.add('disabled');
                setTimeout(() => gemElement.classList.remove('disabled'), 500);
                return;
            }
            
            // Deduct stamina
            GameState.set('player.stamina', player.stamina - gemData.cost);
            
            // Apply effects
            processGemEffect(gemData);
            
            // Remove gem from hand
            gemElement.remove();
            
        } catch (error) {
            console.error("Error processing gem:", error);
        }
    });
    
    // Update battle UI
    updateBattleUI();
}

/**
 * Process the effect of a gem
 * @param {Object} gem - The gem data
 */
function processGemEffect(gem) {
    const player = GameState.get('player');
    const enemy = GameState.get('battle.enemy');
    
    // Calculate multiplier based on class
    let multiplier = 1;
    if ((player.class === "Knight" && gem.color === "red") || 
        (player.class === "Mage" && gem.color === "blue") || 
        (player.class === "Rogue" && gem.color === "green")) {
        multiplier = 1.5;
    }
    
    // Process damage
    if (gem.damage && enemy) {
        const damage = Math.floor(gem.damage * multiplier);
        
        // Apply damage to enemy
        const newHealth = Math.max(0, enemy.health - damage);
        GameState.set('battle.enemy.health', newHealth);
        
        showDamageEffect(damage, 'enemy');
        
        // Check for enemy defeat
        if (newHealth <= 0) {
            handleEnemyDefeated();
        }
    }
    
    // Process healing
    if (gem.heal) {
        const healAmount = Math.floor(gem.heal * multiplier);
        const newHealth = Math.min(player.maxHealth, player.health + healAmount);
        
        GameState.set('player.health', newHealth);
        showHealEffect(healAmount);
    }
    
    // Process shield
    if (gem.shield) {
        const buffs = [...(player.buffs || [])];
        buffs.push({
            type: "defense",
            turns: 2
        });
        
        GameState.set('player.buffs', buffs);
        showShieldEffect();
    }
    
    // Mark that player has played a gem
    GameState.set('hasPlayedGemThisTurn', true);
}

/**
 * Show damage effect on a target
 * @param {Number} amount - Amount of damage
 * @param {String} target - Target ('player' or 'enemy')
 */
function showDamageEffect(amount, target) {
    // Update health display immediately
    const healthElem = document.getElementById(`${target}-health`);
    if (healthElem) {
        const current = parseInt(healthElem.textContent);
        healthElem.textContent = Math.max(0, current - amount);
    }
    
    // Create damage text effect
    const element = document.createElement('div');
    element.className = `damage-text ${target}-damage`;
    element.textContent = `-${amount}`;
    document.getElementById(`${target}-section`).appendChild(element);
    
    setTimeout(() => element.remove(), 1000);
}

/**
 * Show healing effect
 * @param {Number} amount - Healing amount
 */
function showHealEffect(amount) {
    const element = document.createElement('div');
    element.className = 'heal-text';
    element.textContent = `+${amount}`;
    document.getElementById('player-section').appendChild(element);
    setTimeout(() => element.remove(), 1000);
}

/**
 * Show shield effect
 */
function showShieldEffect() {
    const shieldIcon = document.createElement('div');
    shieldIcon.className = 'buff-icon shield';
    shieldIcon.textContent = '🛡️';
    
    const playerBuffs = GameState.get('player.buffs');
    const shieldBuff = playerBuffs.find(b => b.type === "defense");
    
    if (shieldBuff) {
        shieldIcon.title = `Shield: Defense (${shieldBuff.turns} turns)`;
    }
    
    document.getElementById('player-buffs').appendChild(shieldIcon);
}

/**
 * End the player's turn
 */
export function endPlayerTurn() {
    GameState.set('battle.turn', 'enemy');
    GameState.set('isEnemyTurnPending', true);
    
    // Notify UI
    updateBattleUI();
    
    // Trigger enemy turn event
    EventBus.emit('TURN_END', { turn: 'enemy' });
}

/**
 * Process the enemy's turn
 */
export function startEnemyTurn() {
    console.log("Enemy turn started");
    
    const enemy = GameState.get('battle.enemy') || { 
        name: "Grunt", 
        health: 20, 
        attack: 5 
    };
    
    // Simple enemy AI
    if (Math.random() > 0.5) {
        const damage = enemy.attack;
        const player = GameState.get('player');
        
        // Check for defense buff
        let finalDamage = damage;
        if (player.buffs && player.buffs.some(b => b.type === "defense")) {
            finalDamage = Math.floor(damage / 2);
        }
        
        GameState.set('player.health', Math.max(0, player.health - finalDamage));
        showDamageEffect(finalDamage, 'player');
        
        // Check if player defeated
        if (player.health <= 0) {
            handlePlayerDefeated();
            return;
        }
    } else {
        console.log(`${enemy.name} defends!`);
        
        // Add defense buff to enemy
        const buffs = [...(enemy.buffs || [])];
        buffs.push({ type: "defense", turns: 2 });
        
        GameState.set('battle.enemy.buffs', buffs);
    }
    
    // Process buffs
    processBuffEffects();
    
    // End enemy turn after delay
    setTimeout(() => {
        finishEnemyTurn();
    }, 1500);
}

/**
 * Process buff effects for both player and enemy
 */
function processBuffEffects() {
    // Reduce buff durations for player
    const player = GameState.get('player');
    if (player.buffs && player.buffs.length > 0) {
        const updatedPlayerBuffs = player.buffs
            .map(buff => ({ ...buff, turns: buff.turns - 1 }))
            .filter(buff => buff.turns > 0);
        
        GameState.set('player.buffs', updatedPlayerBuffs);
    }
    
    // Reduce buff durations for enemy
    const enemy = GameState.get('battle.enemy');
    if (enemy && enemy.buffs && enemy.buffs.length > 0) {
        const updatedEnemyBuffs = enemy.buffs
            .map(buff => ({ ...buff, turns: buff.turns - 1 }))
            .filter(buff => buff.turns > 0);
        
        enemy.buffs = updatedEnemyBuffs;
        GameState.set('battle.enemy', enemy);
    }
}

/**
 * Finish the enemy turn and prepare for player turn
 */
function finishEnemyTurn() {
    // Reset turn state flags
    GameState.set('hasActedThisTurn', false);
    GameState.set('hasPlayedGemThisTurn', false);
    GameState.set('isEnemyTurnPending', false);
    GameState.set('battle.turn', 'player');
    
    // Restore player stamina
    const baseStamina = GameState.get('player.baseStamina');
    GameState.set('player.stamina', baseStamina);
    
    // Draw new gems
    drawGems(3);
    
    // Update UI
    updateBattleUI();
    
    // Emit event
    EventBus.emit('TURN_END', { turn: 'player' });
}

/**
 * Handle enemy defeat
 */
function handleEnemyDefeated() {
    const enemy = GameState.get('battle.enemy');
    
    // Mark battle as over
    GameState.set('battleOver', true);
    
    // Calculate reward
    const reward = enemy.isBoss ? 30 : 10;
    
    // Add reward to player
    const player = GameState.get('player');
    GameState.set('player.zenny', player.zenny + reward);
    
    // Show victory message
    alert(`${enemy.name} defeated! +${reward} $ZENNY`);
    
    // Increment battle count
    const battleCount = GameState.get('battleCount');
    GameState.set('battleCount', battleCount + 1);
    
    // For now, just end the battle
    // In a fuller implementation, this would progress to next battle or shop
}

/**
 * Handle player defeat
 */
function handlePlayerDefeated() {
    // Mark battle as over
    GameState.set('battleOver', true);
    
    // Show defeat message
    alert("You were defeated!");
    
    // Return to character select
    EventBus.emit('SCREEN_CHANGE', { screen: 'character-select' });
}

/**
 * Update the enemy display
 */
export function updateEnemyDisplay() {
    const enemy = GameState.get('battle.enemy');
    if (!enemy) return;
    
    // Update name and health
    const enemyNameElem = document.getElementById('enemy-name');
    const enemyHealthElem = document.getElementById('enemy-health');
    const enemyMaxHealthElem = document.getElementById('enemy-max-health');
    
    if (enemyNameElem) enemyNameElem.textContent = enemy.name;
    if (enemyHealthElem) enemyHealthElem.textContent = enemy.health;
    if (enemyMaxHealthElem) enemyMaxHealthElem.textContent = enemy.maxHealth;
}

/**
 * Update the entire battle UI
 */
function updateBattleUI() {
    // Update enemy display
    updateEnemyDisplay();
    
    // Update player stats
    const player = GameState.get('player');
    
    // Update health
    const playerHealthElem = document.getElementById('player-health');
    const playerMaxHealthElem = document.getElementById('player-max-health');
    
    if (playerHealthElem) playerHealthElem.textContent = player.health;
    if (playerMaxHealthElem) playerMaxHealthElem.textContent = player.maxHealth;
    
    // Update stamina (if element exists in your HTML)
    const staminaFill = document.getElementById('stamina-fill');
    const staminaText = document.getElementById('stamina-text');
    
    if (staminaFill && staminaText) {
        const staminaPercent = (player.stamina / player.baseStamina) * 100;
        staminaFill.style.width = `${staminaPercent}%`;
        staminaText.textContent = `${player.stamina}/${player.baseStamina}`;
    }
    
    // Update buffs display
    updateBuffsDisplay();
}

/**
 * Update the buffs display for player and enemy
 */
function updateBuffsDisplay() {
    const player = GameState.get('player');
    const enemy = GameState.get('battle.enemy');
    
    // Update player buffs
    const playerBuffsElem = document.getElementById('player-buffs');
    if (playerBuffsElem) {
        playerBuffsElem.innerHTML = '';
        
        if (player.buffs && player.buffs.length > 0) {
            player.buffs.forEach(buff => {
                const buffIcon = document.createElement('div');
                buffIcon.className = `buff-icon ${buff.type}`;
                
                // Set icon based on buff type
                let icon = '⚡';
                if (buff.type === 'defense') icon = '🛡️';
                
                buffIcon.innerHTML = icon;
                buffIcon.title = `${buff.type} (${buff.turns} turns)`;
                
                playerBuffsElem.appendChild(buffIcon);
            });
        }
    }
    
    // Update enemy buffs if they exist in your HTML
    const enemyBuffsElem = document.getElementById('enemy-buffs');
    if (enemyBuffsElem && enemy && enemy.buffs) {
        enemyBuffsElem.innerHTML = '';
        
        enemy.buffs.forEach(buff => {
            const buffIcon = document.createElement('div');
            buffIcon.className = `buff-icon ${buff.type}`;
            
            // Set icon based on buff type
            let icon = '⚡';
            if (buff.type === 'defense') icon = '🛡️';
            
            buffIcon.innerHTML = icon;
            buffIcon.title = `${buff.type} (${buff.turns} turns)`;
            
            enemyBuffsElem.appendChild(buffIcon);
        });
    }
}

/**
 * Utility function to shuffle an array
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
    const result = [...array];
    
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    
    return result;
}