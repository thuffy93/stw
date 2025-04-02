            // ===================================================
            // BATTLE MODULE - Battle mechanics and logic
            // ===================================================
            const Battle = (() => {
                /**
                 * Initialize a new battle
                 */
                function startBattle() {
                    // Get a new enemy
                    const enemy = generateEnemy();
                    State.set('enemy', enemy);
                    
                    // Reset battle state
                    State.set('battleOver', false);
                    State.set('hasActedThisTurn', false);
                    State.set('hasPlayedGemThisTurn', false);
                    State.set('isEnemyTurnPending', false);
                    State.set('selectedGems', new Set());
                    
                    // Clear player buffs
                    State.set('player.buffs', []);
                    
                    // Reset stamina
                    const player = State.get('player');
                    State.set('player.stamina', player.baseStamina);
                    
                    // IMPORTANT CHANGE: Draw additional cards to fill hand to MAX_HAND_SIZE
                    const currentHand = State.get('hand');
                    const handSize = currentHand.length;
                    const maxHandSize = Config.MAX_HAND_SIZE;
                    
                    if (handSize < maxHandSize) {
                        // Draw additional cards to fill the hand
                        console.log(`Drawing ${maxHandSize - handSize} additional cards to fill hand`);
                        Gems.drawCards(maxHandSize - handSize);
                    }
                    
                    // Update UI
                    UI.updateBattleScreen();
                }

                /**
                 * Generate an enemy for the current battle
                 * @returns {Object} Enemy data
                 */
                function generateEnemy() {
                    const currentPhaseIndex = State.get('currentPhaseIndex');
                    const battleCount = State.get('battleCount');
                    const enemies = Config.ENEMIES;
                    
                    // Use scaled boss for Dark phase (phase index 2)
                    let base = currentPhaseIndex === 2 ? getScaledBoss() : { ...enemies[battleCount % enemies.length] };
                    
                    base.health = base.maxHealth;
                    base.actionQueue = Utils.shuffle([...base.actions]);
                    base.currentAction = base.actionQueue.shift();
                    base.buffs = [];
                    
                    return base;
                }
                
                /**
                 * Get a scaled boss based on current day
                 * @returns {Object} Scaled boss data
                 */
                function getScaledBoss() {
                    const boss = Config.BOSS;
                    const currentDay = State.get('currentDay');
                    let scaledBoss = { ...boss };
                    
                    // Scale boss health and damage with day progression
                    scaledBoss.maxHealth = boss.maxHealth + (currentDay - 1) * 5;
                    scaledBoss.actions = boss.actions.map(action => {
                        if (action.startsWith("Attack")) {
                            const baseDamage = parseInt(action.split(" ")[1]);
                            return `Attack ${baseDamage + (currentDay - 1)}`;
                        }
                        return action;
                    });
                    
                    return scaledBoss;
                }
                
                /**
                 * Execute selected gems in battle
                 */
                function executeSelectedGems() {
                    console.log("executeSelectedGems called");
                    const battleOver = State.get('battleOver');
                    const selectedGems = State.get('selectedGems');
                    const currentScreen = State.get('currentScreen');
                    const hand = State.get('hand');
                    
                    // Enhanced logging for debugging
                    console.log("Battle state:", { 
                        battleOver, 
                        selectedGemsSize: selectedGems.size, 
                        currentScreen,
                        handLength: hand.length
                    });
                    
                    // Only allow execution in battle screen and when battle is active
                    if (currentScreen !== 'battle' || battleOver || !selectedGems.size) {
                        console.log("Cannot execute gems: Not in battle, battle is over, or no gems selected");
                        return;
                    }
                    
                    // Check if all selected indices are valid
                    const validSelection = Array.from(selectedGems).every(index => {
                        const isValid = index >= 0 && index < hand.length;
                        if (!isValid) {
                            console.warn(`Invalid gem index: ${index}, hand length: ${hand.length}`);
                        }
                        return isValid;
                    });
                    
                    if (!validSelection) {
                        console.warn("Invalid gem selection detected, clearing selection");
                        State.set('selectedGems', new Set()); // Clear invalid selections
                        UI.updateBattleScreen();
                        return;
                    }
                    
                    // Sort indices in descending order to avoid index shifting problems
                    const selectedIndices = Array.from(selectedGems).sort((a, b) => b - a);
                    console.log("Playing selected gems:", selectedIndices);
                    
                    let anyPlayed = false;
                    
                    // Try to play each selected gem
                    selectedIndices.forEach(index => {
                        const success = playGem(index);
                        anyPlayed = anyPlayed || success;
                        console.log(`Played gem at index ${index}: ${success ? "SUCCESS" : "FAILED"}`);
                    });
                    
                    // Clear selection after playing
                    State.set('selectedGems', new Set());
                    
                    // If any gems were played, update the UI
                    if (anyPlayed) {
                        UI.renderHand();
                        UI.updateBattleScreen();
                    }
                }

                /**
                 * Play a gem from the player's hand
                 * @param {Number} index - Index of the gem in the hand
                 * @returns {Boolean} Whether the gem was successfully played
                 */
                function playGem(index) {
                    console.log(`playGem called with index ${index}`);
                    
                    try {
                        const hand = State.get('hand');
                        const player = State.get('player');
                        const enemy = State.get('enemy');
                        const battleOver = State.get('battleOver');
                        
                        // Enhanced validation with better logging
                        if (battleOver) {
                            console.log("Cannot play gem: Battle is over");
                            return false;
                        }
                        
                        if (index < 0 || index >= hand.length) {
                            console.warn(`Invalid gem index: ${index}, hand length: ${hand.length}`);
                            return false;
                        }
                        
                        const gem = hand[index];
                        if (!gem) {
                            console.warn(`No gem found at index ${index}`);
                            return false;
                        }
                        
                        console.log(`Playing gem: ${gem.name}, color: ${gem.color}, cost: ${gem.cost}`);
                        
                        // Check stamina cost
                        if (player.stamina < gem.cost) {
                            UI.showMessage("Not enough stamina!", "error");
                            return false;
                        }
                        
                        // Deduct stamina
                        player.stamina -= gem.cost;
                        State.set('player.stamina', player.stamina);
                        
                        // Calculate damage multiplier and check proficiency
                        const multiplier = GameUtils.calculateGemMultiplier(gem);
                        const gemKey = `${gem.color}${gem.name}`;
                        const proficiency = Gems.getGemProficiency(gemKey);
                        const gemFails = GameUtils.checkGemFails(proficiency);
                        
                        console.log(`Gem execution: multiplier=${multiplier}, gemKey=${gemKey}, proficiency=`, proficiency, `fails=${gemFails}`);
                        
                        // Process gem effects using shared utility
                        GameUtils.processGemEffect(gem, gemFails, multiplier);
                        
                        // Update gem proficiency
                        Gems.updateGemProficiency(gemKey, !gemFails);
                        
                        // Remove gem from hand and add to discard
                        const newHand = [...hand];
                        newHand.splice(index, 1);
                        State.set('hand', newHand);
                        
                        const discard = State.get('discard');
                        State.set('discard', [...discard, gem]);
                        
                        // Update state and UI
                        State.set('hasPlayedGemThisTurn', true);
                        UI.renderHand();
                        UI.updateBattleScreen();
                        
                        // Play sound effect
                        if (gemFails) {
                            AudioManager.play('PLAYER_DAMAGE');
                        } else {
                            AudioManager.play('GEM_PLAY');
                            if (gem.damage) {
                                AudioManager.play('ENEMY_DAMAGE');
                            } else if (gem.heal) {
                                AudioManager.play('HEAL');
                            }
                        }
                        
                        return true;
                    } catch (error) {
                        console.error("Error playing gem:", error);
                        UI.showMessage("Error playing gem", "error");
                        return false;
                    }
                }

                /**
                 * End the current turn
                 */
                function endTurn() {
                    const battleOver = State.get('battleOver');
                    const player = State.get('player');
                    
                    // Defensive checks for player object
                    if (!player) {
                        console.error("Player object not found in endTurn");
                        return;
                    }
                    
                    // Don't allow ending turn if battle is over or enemy turn is already pending
                    if (battleOver || State.get('isEnemyTurnPending')) {
                        console.log("Turn cannot be ended: battle over or enemy turn pending");
                        return;
                    }
                        
                    // Check if player is stunned
                    const isStunned = player.buffs.some(b => b.type === "stunned");
                    if (isStunned) {
                        UI.showMessage("You are stunned and skip your turn!", "error");
                    }
                    
                    // Mark enemy turn as pending - do this regardless of stun status
                    State.set('isEnemyTurnPending', true);
                    
                    // Update UI to reflect the turn change
                    UI.updateBattleScreen();
                    
                    // Process enemy turn with a slight delay
                    setTimeout(() => {
                        processEnemyTurn();
                    }, 300);
                    
                    // Play turn end sound
                    AudioManager.play('BUTTON_CLICK');
                }
                
                /**
                 * Process enemy turn with improved error handling
                 */
                function processEnemyTurn() {
                    // Reset error counter
                    window.enemyTurnErrorCount = 0;
                    
                    // Get enemy and check for battle over state
                    const enemy = State.get('enemy');
                    const battleOver = State.get('battleOver');
                    
                    // Safety check - don't process if battle is over or enemy doesn't exist
                    if (battleOver || !enemy) {
                        console.log("Cannot process enemy turn: battle over or no enemy");
                        finishEnemyTurn();
                        return;
                    }
                    
                    // Define each phase with its function and delay
                    const phases = [
                        { fn: executeEnemyAction, delay: 500 },
                        { fn: applyEnemyPoisonEffects, delay: 800 },
                        { fn: prepareNextAction, delay: 800 },
                        { fn: finishEnemyTurn, delay: 800 }
                    ];
                    
                    // Execute first phase, which will chain to others
                    executePhase(0);
                    
                    // Helper function to execute phases sequentially
                    function executePhase(index) {
                        if (index >= phases.length) return;
                        
                        const phase = phases[index];
                        
                        setTimeout(() => {
                            try {
                                // Execute the phase
                                phase.fn();
                                
                                // Check if battle ended during phase
                                if (State.get('battleOver') && index < phases.length - 1) {
                                    console.log(`Battle ended during phase ${index}`);
                                    return;
                                }
                                
                                // Continue to next phase
                                executePhase(index + 1);
                            } catch (error) {
                                console.error(`Error in phase ${index}:`, error);
                                safeFinishEnemyTurn();
                            }
                        }, phase.delay);
                    }
                }

                /**
                 * Safe fallback for enemy turn completion on error
                 */
                function safeFinishEnemyTurn() {
                    window.enemyTurnErrorCount = (window.enemyTurnErrorCount || 0) + 1;
                    
                    // If we have multiple errors, perform emergency reset
                    if (window.enemyTurnErrorCount > 2) {
                        console.warn("Emergency: Resetting to player turn due to errors");
                        
                        // Reset all essential battle state
                        State.set('isEnemyTurnPending', false);
                        State.set('hasActedThisTurn', false);
                        State.set('hasPlayedGemThisTurn', false);
                        State.set('selectedGems', new Set());
                        
                        // Restore player stamina
                        const player = State.get('player');
                        if (player) {
                            State.set('player.stamina', player.baseStamina);
                        }
                        
                        // Ensure player has cards to play
                        const hand = State.get('hand');
                        if (hand && hand.length < Config.MAX_HAND_SIZE) {
                            Gems.drawCards(Config.MAX_HAND_SIZE - hand.length);
                        }
                        
                        // Update UI and show a message
                        UI.updateBattleScreen();
                        UI.showMessage("Turn reset due to technical issues", "error");
                        return;
                    }
                    
                    // For less severe errors, try to finish turn normally
                    setTimeout(() => {
                        try {
                            finishEnemyTurn();
                        } catch (error) {
                            console.error("Error in safeFinishEnemyTurn retry:", error);
                            // Increment counter and try the emergency reset approach
                            window.enemyTurnErrorCount++;
                            safeFinishEnemyTurn();
                        }
                    }, 800);
                }

                /**
                 * Emergency reset for player turn
                 */
                function emergencyResetPlayerTurn() {
                    // Reset error counter
                    window.enemyTurnErrorCount = 0;
                    
                    // Reset all the essential battle state
                    State.set({
                        'isEnemyTurnPending': false,
                        'hasActedThisTurn': false,
                        'hasPlayedGemThisTurn': false,
                        'selectedGems': new Set()
                    });
                    
                    // Restore player stamina
                    const player = State.get('player');
                    if (player) {
                        State.set('player.stamina', player.baseStamina);
                    }
                    
                    // Ensure player has cards to play
                    const hand = State.get('hand');
                    const maxHandSize = Config.MAX_HAND_SIZE;
                    if (hand && hand.length < maxHandSize) {
                        Gems.drawCards(maxHandSize - hand.length);
                    }
                    
                    // Update UI and show a message
                    UI.updateBattleScreen();
                    UI.showMessage("Turn reset due to technical issues", "error");
                }

                /**
                 * Force reset to player turn in case of severe errors
                 */
                function forceResetToPlayerTurn() {
                    console.warn("EMERGENCY: Forcing reset to player turn due to errors");
                    
                    // Reset turn flags
                    State.set('isEnemyTurnPending', false);
                    State.set('hasActedThisTurn', false);
                    State.set('hasPlayedGemThisTurn', false);
                    
                    // Ensure player has stamina
                    const player = State.get('player');
                    State.set('player.stamina', player.baseStamina);
                    
                    // Draw cards if needed
                    const hand = State.get('hand');
                    if (hand.length < Config.MAX_HAND_SIZE) {
                        Gems.drawCards(Config.MAX_HAND_SIZE - hand.length);
                    }
                    
                    // Update UI
                    UI.updateBattleScreen();
                    UI.showMessage("Turn reset due to error", "error");
                }

                /**
                 * Execute enemy action
                 */
                function executeEnemyAction() {
                    const enemy = State.get('enemy');
                    const player = State.get('player');
                    let message = "";
                    
                    // Skip if no action or enemy is dead
                    if (!enemy || !enemy.currentAction || enemy.health <= 0) {
                        console.log("No enemy action to execute");
                        return;
                    }
                    
                    // Process based on action type
                    if (enemy.currentAction.startsWith("Attack")) {
                        // Extract damage value safely
                        let damage = 0;
                        try {
                            const parts = enemy.currentAction.split(" ");
                            damage = parseInt(parts[1]) || 5; // Default to 5 if parsing fails
                        } catch (e) {
                            console.warn("Error parsing enemy attack damage, using default", e);
                            damage = 5;
                        }
                        
                        // Apply attack boost if present
                        if (enemy.nextAttackBoost) {
                            damage *= enemy.nextAttackBoost;
                            enemy.nextAttackBoost = null;
                        }
                        
                        // Apply player defense if present
                        if (player.buffs.some(b => b.type === "defense")) {
                            damage = Math.floor(damage / 2);
                        }
                        
                        // Apply damage to player
                        player.health = Math.max(0, player.health - damage);
                        State.set('player.health', player.health);
                        
                        message = `${enemy.name} attacks for ${damage} damage!`;
                        
                        // Show damage animation
                        UI.showDamageAnimation(damage, true);
                        AudioManager.play('PLAYER_DAMAGE');
                        
                        // Check if player defeated
                        if (player.health <= 0) {
                            UI.showMessage("You were defeated!", "error");
                            State.set('battleOver', true);
                            
                            // Show defeat animation
                            UI.showDefeatEffect();
                            AudioManager.play('DEFEAT');
                            
                            // Delay screen transition
                            setTimeout(() => UI.switchScreen("characterSelect"), 2000);
                            return;
                        }
                    } else if (enemy.currentAction === "Defend") {
                        message = `${enemy.name} defends, reducing next damage!`;
                        
                        // Initialize buffs array if it doesn't exist
                        if (!enemy.buffs) {
                            enemy.buffs = [];
                        }
                        
                        enemy.buffs.push({ type: "defense", turns: 2 });
                    } else if (enemy.currentAction === "Charge") {
                        message = `${enemy.name} charges for a stronger attack next turn!`;
                        enemy.nextAttackBoost = 2;
                    } else if (enemy.currentAction.startsWith("Steal")) {
                        // Extract zenny value safely
                        let zenny = 0;
                        try {
                            const parts = enemy.currentAction.split(" ");
                            zenny = parseInt(parts[1]) || 3; // Default to 3 if parsing fails
                        } catch (e) {
                            console.warn("Error parsing enemy steal amount, using default", e);
                            zenny = 3;
                        }
                        
                        player.zenny = Math.max(0, player.zenny - zenny);
                        State.set('player.zenny', player.zenny);
                        message = `${enemy.name} steals ${zenny} $ZENNY!`;
                    } else {
                        // Fallback for unknown actions
                        message = `${enemy.name} makes a mysterious move...`;
                    }
                    
                    // Update enemy state
                    State.set('enemy', enemy);
                    
                    // Log the action
                    UI.showMessage(message);
                    
                    // Update UI
                    UI.updateBattleScreen();
                }

                /**
                 * Apply poison effects to the enemy
                 */
                function applyEnemyPoisonEffects() {
                    const enemy = State.get('enemy');
                    
                    // Skip if enemy is dead
                    if (!enemy || enemy.health <= 0) return;
                    
                    const poisonBuff = enemy.buffs.find(b => b.type === "poison");
                    if (poisonBuff) {
                        enemy.health = Math.max(0, enemy.health - poisonBuff.damage);
                        State.set('enemy', enemy);
                        
                        UI.showMessage(`${enemy.name} takes ${poisonBuff.damage} poison damage!`);
                        UI.showDamageAnimation(poisonBuff.damage, false, true);
                        
                        // Update UI
                        UI.updateBattleScreen();
                        
                        // Check if enemy defeated
                        if (enemy.health <= 0) {
                            handleEnemyDefeated();
                            return;
                        }
                    }
                }
                
                /**
                 * Prepare the enemy's next action
                 */
                function prepareNextAction() {
                    const enemy = State.get('enemy');
                    
                    // Skip if enemy is dead
                    if (!enemy || enemy.health <= 0) return;
                    
                    // Get next action from queue
                    enemy.currentAction = enemy.actionQueue.shift();
                    
                    // Refill action queue if needed
                    if (enemy.actionQueue.length < 3) {
                        const shuffledActions = Utils.shuffle([...enemy.actions]);
                        enemy.actionQueue.push(...shuffledActions.slice(0, 3 - enemy.actionQueue.length));
                    }
                    
                    // Update enemy state
                    State.set('enemy', enemy);
                }
                
                /**
                 * Finish the enemy turn and prepare player turn
                 */
                function finishEnemyTurn() {
                    const player = State.get('player');
                    const enemy = State.get('enemy');
                    
                    // Skip if battle is over
                    if (State.get('battleOver')) return;
                    
                    // Reset turn state flags
                    State.set('hasActedThisTurn', false);
                    State.set('hasPlayedGemThisTurn', false);
                    State.set('isEnemyTurnPending', false);
                    
                    // IMPORTANT FIX: Clear any selected gems at the start of player turn
                    State.set('selectedGems', new Set());
                    
                    // Restore player stamina
                    State.set('player.stamina', player.baseStamina);
                    
                    // Reduce buff durations for player
                    if (player.buffs && player.buffs.length > 0) {
                        const updatedPlayerBuffs = player.buffs
                            .map(b => ({ ...b, turns: b.turns - 1 }))
                            .filter(b => b.turns > 0);
                        
                        State.set('player.buffs', updatedPlayerBuffs);
                    }
                    
                    // Reduce buff durations for enemy
                    if (enemy && enemy.buffs && enemy.buffs.length > 0) {
                        const updatedEnemyBuffs = enemy.buffs
                            .map(b => ({ ...b, turns: b.turns - 1 }))
                            .filter(b => b.turns > 0);
                        
                        enemy.buffs = updatedEnemyBuffs;
                        State.set('enemy', enemy);
                    }
                    
                    // Draw new cards - ensure we always have cards
                    Gems.drawCards(Config.MAX_HAND_SIZE);
                    
                    // Reset error counter
                    window.enemyTurnErrorCount = 0;
                    
                    // Update UI
                    UI.updateBattleScreen();
                    
                    // Check if battle is over
                    checkBattleStatus();
                }
                
                /**
                 * Check if the battle is over
                 */
                function checkBattleStatus() {
                    const enemy = State.get('enemy');
                    const player = State.get('player');
                    
                    // Skip if battle is already marked as over
                    if (State.get('battleOver')) return;
                    
                    // Check if enemy is defeated
                    if (enemy && enemy.health <= 0) {
                        handleEnemyDefeated();
                        return;
                    }
                    
                    // Check if player is defeated
                    if (player.health <= 0) {
                        handlePlayerDefeated();
                    }
                }
                
                /**
                 * Handle enemy defeat
                 */
                function handleEnemyDefeated() {
                    const enemy = State.get('enemy');
                    const player = State.get('player');
                    
                    // Mark battle as over
                    State.set('battleOver', true);
                    
                    // Calculate reward based on enemy type
                    const reward = enemy.name === "Dark Guardian" ? 30 : 10;
                    player.zenny += reward;
                    State.set('player.zenny', player.zenny);
                    
                    // Show success message
                    UI.showMessage(`${enemy.name} defeated! +${reward} $ZENNY`);
                    
                    // Show victory animation
                    UI.showVictoryEffect();
                    if (AudioManager && AudioManager.play) {
                        AudioManager.play('VICTORY');
                    }
                    
                    // Increment battle count
                    const battleCount = State.get('battleCount');
                    State.set('battleCount', battleCount + 1);
                    
                    // Important: DO NOT reset the hand here, as we need to keep it for the shop
                    // Also preserve discard and gem bag state
                    
                    // Delay before transitioning to next screen
                    setTimeout(() => {
                        progressGameState();
                    }, 1500);
                }

                /**
                 * Handle player defeat
                 */
                function handlePlayerDefeated() {
                    // Mark battle as over
                    State.set('battleOver', true);
                    
                    // Show defeat message
                    UI.showMessage("You were defeated!", "error");
                    
                    // Show defeat animation
                    UI.showDefeatEffect();
                    AudioManager.play('DEFEAT');
                    
                    // Delay before returning to character select
                    setTimeout(() => {
                        UI.switchScreen("characterSelect");
                    }, 2000);
                }
                
                /**
                 * Progress game state after battle victory
                 */
                function progressGameState() {
                    const battleCount = State.get('battleCount');
                    const battlesPerDay = Config.BATTLES_PER_DAY;
                    const currentPhaseIndex = State.get('currentPhaseIndex');
                    const currentDay = State.get('currentDay');
                    
                    // Log the hand state before transition
                    console.log("HAND BEFORE TRANSITION:", State.get('hand'));
                    
                    // Check if we need to move to the next phase
                    if (battleCount % battlesPerDay !== 0) {
                        // Move to next phase within the same day
                        State.set('currentPhaseIndex', currentPhaseIndex + 1);
                        
                        // IMPORTANT: Save hand state to localStorage before transition
                        localStorage.setItem('stw_temp_hand', JSON.stringify(State.get('hand')));
                        
                        // Prepare shop (this should NOT reset the hand)
                        Shop.prepareShop();
                        
                        // Switch to shop screen
                        UI.switchScreen("shop");
                    } else {
                        // Complete day - reset phase and increment day
                        State.set('currentPhaseIndex', 0);
                        State.set('currentDay', currentDay + 1);
                        
                        // Check if game is complete
                        if (currentDay + 1 > Config.MAX_DAYS) {
                            handleGameCompletion();
                        } else {
                            UI.switchScreen("camp");
                        }
                    }
                }
                
                /**
                 * Handle game completion
                 */
                function handleGameCompletion() {
                    // Award bonus meta zenny for completion
                    const metaZenny = State.get('metaZenny');
                    State.set('metaZenny', metaZenny + 100);
                    Storage.saveMetaZenny();
                    
                    // Show victory message
                    UI.showMessage("Journey complete! Victory!");
                    
                    // Return to character select
                    setTimeout(() => {
                        UI.switchScreen("characterSelect");
                    }, 2000);
                }
                
                /**
                 * Wait for a turn (gain focus)
                 */
                function waitTurn() {
                    const battleOver = State.get('battleOver');
                    const player = State.get('player');
                    
                    if (battleOver || State.get('hasActedThisTurn') || State.get('hasPlayedGemThisTurn')) return;
                    
                    State.set('hasActedThisTurn', true);
                    
                    // Add focus buff
                    const playerBuffs = [...player.buffs];
                    playerBuffs.push({ type: "focused", turns: 2 });
                    State.set('player.buffs', playerBuffs);
                    
                    UI.showMessage("Waited, gaining focus for next turn (+20% damage/heal)!");
                    UI.updateBattleScreen();
                    setTimeout(endTurn, 300);
                }
                
                /**
                 * Discard selected gems and end turn
                 */
                function discardAndEnd() {
                    const battleOver = State.get('battleOver');
                    const selectedGems = State.get('selectedGems');
                    const hand = State.get('hand');
                    const gemBag = State.get('gemBag');
                    
                    if (battleOver || !selectedGems.size || State.get('hasActedThisTurn')) return;
                    
                    const indices = Array.from(selectedGems).sort((a, b) => b - a);
                    const newHand = [...hand];
                    const newGemBag = [...gemBag];
                    
                    indices.forEach(index => {
                        const gem = newHand.splice(index, 1)[0];
                        newGemBag.push(gem);
                    });
                    
                    State.set('hand', newHand);
                    State.set('gemBag', Utils.shuffle(newGemBag));
                    State.set('selectedGems', new Set());
                    State.set('hasActedThisTurn', true);
                    
                    UI.showMessage("Discarded and recycled to Gem Bag, ending turn...");
                    UI.renderHand();
                    UI.updateBattleScreen();
                    setTimeout(endTurn, 300);
                }
                
                /**
                 * Flee from battle
                 */
                function fleeBattle() {
                    const battleOver = State.get('battleOver');
                    const currentPhaseIndex = State.get('currentPhaseIndex');
                    
                    // Only allow fleeing in first two phases
                    if (battleOver || currentPhaseIndex >= 2) return;
                    
                    State.set('battleOver', true);
                    State.set('player.buffs', []);
                    
                    const enemy = State.get('enemy');
                    if (enemy) enemy.buffs = [];
                    
                    UI.showMessage("You fled the battle, skipping rewards!");
                    UI.updateBattleScreen();
                    
                    // Increment battle count and phase
                    const battleCount = State.get('battleCount');
                    State.set('battleCount', battleCount + 1);
                    State.set('currentPhaseIndex', currentPhaseIndex + 1);
                    
                    // Transition to shop
                    setTimeout(() => {
                        UI.switchScreen("shop");
                    }, 1000);
                }
                
                // Make sure the processGemEffect function is exposed for gem interactions
                function processGemEffect(gem, gemFails, multiplier) {
                    if (gemFails) {
                        // Handle failure effects
                        const player = State.get('player');
                        
                        if (gem.damage) {
                            const damage = Math.floor((gem.damage) * multiplier * 0.5);
                            player.health = Math.max(0, player.health - damage);
                            State.set('player.health', player.health);
                            
                            if (Math.random() < 0.5) {
                                const playerBuffs = [...player.buffs];
                                playerBuffs.push({ type: "stunned", turns: 1 });
                                State.set('player.buffs', playerBuffs);
                            }
                            
                            UI.showMessage(`Failed ${gem.name}! Took ${damage} damage${player.buffs.some(b => b.type === "stunned") ? " and stunned!" : "!"}`, "error");
                            UI.showDamageAnimation(damage, true);
                        } else if (gem.heal) {
                            player.health = Math.max(0, player.health - 5);
                            State.set('player.health', player.health);
                            
                            UI.showMessage(`Failed ${gem.name}! Lost 5 HP!`, "error");
                            UI.showDamageAnimation(5, true);
                        } else if (gem.poison) {
                            const damage = Math.floor((gem.poison) * multiplier * 0.5);
                            player.health = Math.max(0, player.health - damage);
                            State.set('player.health', player.health);
                            
                            UI.showMessage(`Failed ${gem.name}! Took ${damage} self-poison damage!`, "error");
                            UI.showDamageAnimation(damage, true, true);
                        }
                    } else {
                        // Handle success effects
                        const player = State.get('player');
                        const enemy = State.get('enemy');
                        
                        if (gem.damage && enemy) {
                            let damage = Math.floor(gem.damage * multiplier);
                            
                            if (enemy.shield && gem.color !== enemy.shieldColor) {
                                damage = Math.floor(damage / 2);
                            }
                            
                            if (enemy.buffs && enemy.buffs.some(b => b.type === "defense")) {
                                damage = Math.floor(damage / 2);
                            }
                            
                            enemy.health = Math.max(0, enemy.health - damage);
                            State.set('enemy', enemy);
                            
                            UI.showMessage(`Played ${gem.name} for ${damage} damage!`);
                            UI.showDamageAnimation(damage, false);
                            
                            // Check for enemy defeat immediately after dealing damage
                            if (enemy.health <= 0) {
                                handleEnemyDefeated();
                                return; // Exit early to prevent further processing
                            }
                        }
                        
                        if (gem.heal) {
                            const heal = Math.floor(gem.heal * multiplier);
                            player.health = Math.min(player.health + heal, player.maxHealth);
                            State.set('player.health', player.health);
                            
                            if (gem.shield) {
                                const playerBuffs = [...player.buffs];
                                playerBuffs.push({ type: "defense", turns: 2 });
                                State.set('player.buffs', playerBuffs);
                            }
                            
                            UI.showMessage(`Played ${gem.name} for ${heal} healing${gem.shield ? " and defense" : ""}!`);
                            UI.showDamageAnimation(-heal, true);
                        }
                        
                        if (gem.poison && enemy) {
                            const poisonDamage = Math.floor(gem.poison * multiplier);
                            if (!enemy.buffs) enemy.buffs = [];
                            const enemyBuffs = [...enemy.buffs];
                            enemyBuffs.push({ type: "poison", turns: 2, damage: poisonDamage });
                            enemy.buffs = enemyBuffs;
                            State.set('enemy', enemy);
                            
                            UI.showMessage(`Played ${gem.name} for ${poisonDamage} poison damage/turn!`);
                        }
                    }
                }

                // Return public methods
                return {
                    startBattle,
                    generateEnemy,
                    getScaledBoss,
                    executeSelectedGems,
                    playGem,
                    processGemEffect,
                    endTurn,
                    processEnemyTurn,
                    safeFinishEnemyTurn,
                    emergencyResetPlayerTurn,
                    forceResetToPlayerTurn,
                    executeEnemyAction,
                    applyEnemyPoisonEffects,
                    prepareNextAction,
                    finishEnemyTurn,
                    checkBattleStatus,
                    handleEnemyDefeated,
                    handlePlayerDefeated,
                    progressGameState,
                    handleGameCompletion,
                    waitTurn,
                    discardAndEnd,
                    fleeBattle
                };
            })();