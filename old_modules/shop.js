            // ===================================================
            // SHOP MODULE - Shop mechanics and logic
            // ===================================================
            const Shop = (() => {
                /**
                 * Prepare the shop for a visit
                 */
                function prepareShop() {
                    console.log("PREPARING SHOP - HAND BEFORE:", State.get('hand'));
                    
                    // Reset shop-specific state only
                    State.set('inUpgradeMode', false);
                    State.set('selectedGems', new Set());
                    State.set('gemCatalog.upgradedThisShop', new Set());
                    State.set('gemCatalog.gemPool', []);
                    
                    // Load hand from localStorage if it exists (backup mechanism)
                    const savedHand = localStorage.getItem('stw_temp_hand');
                    if (savedHand && (!State.get('hand') || State.get('hand').length === 0)) {
                        try {
                            const parsedHand = JSON.parse(savedHand);
                            if (Array.isArray(parsedHand) && parsedHand.length > 0) {
                                console.log("RESTORING HAND FROM BACKUP:", parsedHand);
                                State.set('hand', parsedHand);
                            }
                        } catch (e) {
                            console.error("Failed to parse saved hand:", e);
                        }
                    }
                    
                    console.log("PREPARING SHOP - HAND AFTER:", State.get('hand'));
                    
                    // Update shop UI
                    UI.updateShopScreen();
                }
                
                /**
                 * Handle buying a random gem
                 */
                function buyRandomGem() {
                    const player = State.get('player');
                    const gemBag = State.get('gemBag');
                    const maxGemBagSize = Config.MAX_GEM_BAG_SIZE;
                    
                    // Check if player can afford it
                    if (player.zenny < 3) {
                        UI.showMessage("Not enough $ZENNY!", "error");
                        return;
                    }
                    
                    // Check if gem bag is full
                    if (gemBag.length >= maxGemBagSize) {
                        UI.showMessage("Gem bag is full!", "error");
                        return;
                    }
                    
                    // Get a list of unlocked gems
                    const gemCatalog = State.get('gemCatalog');
                    const unlockedGemKeys = gemCatalog.unlocked;
                    
                    if (unlockedGemKeys.length === 0) {
                        UI.showMessage("No unlocked gems available!", "error");
                        return;
                    }
                    
                    // Deduct cost
                    player.zenny -= 3;
                    State.set('player.zenny', player.zenny);
                    
                    // Get a random gem from unlocked ones, weighted toward class-appropriate
                    const randomGemKey = getRandomWeightedGem(unlockedGemKeys);
                    
                    // Create the new gem
                    const newGem = { 
                        ...Config.BASE_GEMS[randomGemKey], 
                        id: `${randomGemKey}-${Utils.generateId()}`, 
                        freshlySwapped: false
                    };
                    
                    // Add to gem bag
                    State.set('gemBag', [...gemBag, newGem]);
                    
                    // Shuffle the gem bag
                    const shuffledBag = Utils.shuffle(State.get('gemBag'));
                    State.set('gemBag', shuffledBag);
                    
                    // Show success message
                    UI.showMessage(`Bought ${newGem.name} and added to your Gem Bag!`);
                    AudioManager.play('BUTTON_CLICK');
                    
                    // Update shop UI
                    UI.updateShopScreen();
                }
                
                /**
                 * Get a random gem with weighting toward class-appropriate gems
                 * @param {Array} gemKeys - Array of gem keys
                 * @returns {String} Selected gem key
                 */
                function getRandomWeightedGem(gemKeys) {
                    const playerClass = State.get('player.class');
                    
                    // Define weights for different gem types
                    const weights = {
                        classMatched: 3,  // Higher chance for class-matching gems
                        grey: 2,         // Medium chance for grey (universal) gems
                        other: 1         // Lower chance for non-matching gems
                    };
                    
                    // Get player's class color
                    const classColors = {
                        "Knight": "red",
                        "Mage": "blue",
                        "Rogue": "green"
                    };
                    const classColor = classColors[playerClass];
                    
                    // Build weighted list
                    const weightedList = [];
                    
                    gemKeys.forEach(key => {
                        const gem = Config.BASE_GEMS[key];
                        if (!gem) return;
                        
                        let weight = weights.other;
                        
                        if (gem.color === classColor) {
                            weight = weights.classMatched;
                        } else if (gem.color === "grey") {
                            weight = weights.grey;
                        }
                        
                        // Add gem to list multiple times based on weight
                        for (let i = 0; i < weight; i++) {
                            weightedList.push(key);
                        }
                    });
                    
                    // Pick random entry from weighted list
                    return weightedList[Math.floor(Math.random() * weightedList.length)];
                }
                
                /**
                 * Handle discarding a selected gem
                 */
                function discardSelectedGem() {
                    const selectedGems = State.get('selectedGems');
                    const hand = State.get('hand');
                    const player = State.get('player');
                    
                    // Validation
                    if (!selectedGems.size) {
                        UI.showMessage("Select a gem to discard!", "error");
                        return;
                    }
                    
                    if (player.zenny < 3) {
                        UI.showMessage("Not enough $ZENNY to discard!", "error");
                        return;
                    }
                    
                    // Get selected gem
                    const index = Array.from(selectedGems)[0];
                    
                    // Validate index is in range
                    if (index < 0 || index >= hand.length) {
                        UI.showMessage("Invalid gem selection", "error");
                        return;
                    }
                    
                    const gem = hand[index];
                    
                    // Remove gem from hand
                    const newHand = [...hand];
                    newHand.splice(index, 1);
                    State.set('hand', newHand);
                    
                    // Deduct cost
                    player.zenny -= 3;
                    State.set('player.zenny', player.zenny);
                    
                    // Show success message
                    UI.showMessage(`Discarded ${gem.name} for 3 $ZENNY`);
                    AudioManager.play('BUTTON_CLICK');
                    
                    // Clear selection and update UI
                    State.set('selectedGems', new Set());
                    UI.renderShopHand();
                    UI.updateShopScreen();
                }
                
                /**
                 * Handle healing in the shop
                 */
                function healTen() {
                    const player = State.get('player');
                    
                    // Validation
                    if (player.zenny < 3) {
                        UI.showMessage("Not enough $ZENNY!", "error");
                        return;
                    }
                    
                    if (player.health >= player.maxHealth) {
                        UI.showMessage("Already at full health!", "error");
                        return;
                    }
                    
                    // Deduct cost
                    player.zenny -= 3;
                    
                    // Calculate actual healing (considering max health cap)
                    const startHealth = player.health;
                    player.health = Math.min(player.health + 10, player.maxHealth);
                    const actualHealing = player.health - startHealth;
                    
                    // Update player health
                    State.set('player.health', player.health);
                    State.set('player.zenny', player.zenny);
                    
                    // Show success message with actual amount healed
                    UI.showMessage(`Healed ${actualHealing} health!`);
                    AudioManager.play('HEAL');
                    
                    // Update shop UI
                    UI.updateShopScreen();
                }
                
                /**
                 * Initiate gem upgrade process
                 */
                function initiateGemUpgrade() {
                    const selectedGems = State.get('selectedGems');
                    const player = State.get('player');
                    const hand = State.get('hand');
                    const gemCatalog = State.get('gemCatalog');
                    
                    // Validate selection and cost
                    if (selectedGems.size !== 1) {
                        UI.showMessage("Select a gem to upgrade", "error");
                        return;
                    }
                    
                    if (player.zenny < 5) {
                        UI.showMessage("Not enough $ZENNY! Need 5.", "error");
                        return;
                    }
                    
                    const selectedIndex = Array.from(selectedGems)[0];
                    
                    // Validate index is in range
                    if (selectedIndex < 0 || selectedIndex >= hand.length) {
                        UI.showMessage("Invalid gem selection", "error");
                        return;
                    }
                    
                    const selectedGem = hand[selectedIndex];
                    
                    // Validate the selected gem exists
                    if (!selectedGem) {
                        UI.showMessage("Invalid gem selection", "error");
                        return;
                    }
                    
                    if (selectedGem.freshlySwapped) {
                        UI.showMessage("Cannot upgrade a freshly swapped gem!", "error");
                        return;
                    }
                    
                    if (gemCatalog.upgradedThisShop && gemCatalog.upgradedThisShop.has(selectedGem.id)) {
                        UI.showMessage("This gem was already upgraded this shop visit!", "error");
                        return;
                    }
                    
                    // Log debug info
                    console.log("Initiating upgrade for gem:", selectedGem);
                    console.log("Player zenny before deduction:", player.zenny);
                    
                    // Deduct payment
                    player.zenny -= 5;
                    State.set('player.zenny', player.zenny);
                    
                    console.log("Player zenny after deduction:", player.zenny);
                    
                    // Generate upgrade options using the Gems.generateUpgradeOptions function
                    const options = Gems.generateUpgradeOptions(selectedGem);
                    console.log("Generated upgrade options:", options);
                    
                    // Ensure we have at least one upgrade option
                    if (!options || options.length === 0) {
                        console.error("No upgrade options generated");
                        player.zenny += 5; // Refund
                        State.set('player.zenny', player.zenny);
                        UI.showMessage("Unable to generate upgrade options", "error");
                        return;
                    }
                    
                    // Set the upgrade options in state
                    State.set('gemCatalog.gemPool', options);
                    
                    // Set upgrade mode flag
                    State.set('inUpgradeMode', true);
                    
                    // Play sound
                    if (AudioManager && AudioManager.play) {
                        AudioManager.play('BUTTON_CLICK');
                    }
                    
                    // Update shop UI
                    UI.updateShopScreen();
                }
                
                /**
                 * Select an upgrade option
                 * @param {Number} poolIndex - Index of the selected option in the pool
                 */
                function selectUpgradeOption(poolIndex) {
                    const selectedGems = State.get('selectedGems');
                    const gemCatalog = State.get('gemCatalog');
                    const hand = State.get('hand');
                    
                    console.log("Selecting upgrade option:", poolIndex);
                    
                    // Validation
                    if (!State.get('inUpgradeMode') || selectedGems.size !== 1) {
                        UI.showMessage("Please select a gem first", "error");
                        return;
                    }
                    
                    if (poolIndex < 0 || !gemCatalog.gemPool || poolIndex >= gemCatalog.gemPool.length) {
                        UI.showMessage("Invalid upgrade option", "error");
                        return;
                    }
                    
                    // Get the selected gem and upgrade option
                    const selectedIndex = Array.from(selectedGems)[0];
                    
                    // Validate index is in range
                    if (selectedIndex < 0 || selectedIndex >= hand.length) {
                        UI.showMessage("Invalid gem selection", "error");
                        return;
                    }
                    
                    const selectedGem = hand[selectedIndex];
                    const upgradeOption = gemCatalog.gemPool[poolIndex];
                    
                    if (!upgradeOption) {
                        UI.showMessage("Upgrade option not available", "error");
                        return;
                    }
                    
                    // Check if this is a class-specific upgrade
                    const isClassUpgrade = upgradeOption.isClassUpgrade;
                    
                    // Replace the selected gem with the upgrade
                    const newHand = [...hand];
                    newHand[selectedIndex] = {
                        ...upgradeOption,
                        id: `${upgradeOption.name}-${Utils.generateId()}`,
                        freshlySwapped: false
                    };
                    
                    State.set('hand', newHand);
                    
                    // Ensure upgradedThisShop is initialized as a Set
                    if (!gemCatalog.upgradedThisShop || !(gemCatalog.upgradedThisShop instanceof Set)) {
                        gemCatalog.upgradedThisShop = new Set();
                    }
                    
                    // Mark as upgraded this shop visit
                    gemCatalog.upgradedThisShop.add(newHand[selectedIndex].id);
                    State.set('gemCatalog.upgradedThisShop', gemCatalog.upgradedThisShop);
                    
                    // IMPORTANT: If this is a class-specific upgrade, ensure proficiency
                    if (isClassUpgrade) {
                        const gemName = upgradeOption.name;
                        const gemColor = upgradeOption.color;
                        const gemKey = `${gemColor}${gemName.replace(/\s+/g, '')}`;
                        
                        console.log(`Ensuring proficiency for class-specific upgrade: ${gemKey}`);
                        
                        // Update proficiency in active state
                        const gemProficiency = State.get('gemProficiency');
                        gemProficiency[gemKey] = { successCount: 6, failureChance: 0 };
                        State.set('gemProficiency', gemProficiency);
                        
                        // Also update in class-specific proficiency
                        const playerClass = State.get('player.class');
                        if (playerClass) {
                            State.set(`classGemProficiency.${playerClass}.${gemKey}`, { successCount: 6, failureChance: 0 });
                        }
                        
                        // Save proficiency to storage
                        if (typeof Storage !== 'undefined' && Storage.saveGemProficiency) {
                            Storage.saveGemProficiency();
                        }
                    }
                    
                    // Play sound
                    if (AudioManager && AudioManager.play) {
                        AudioManager.play('BUTTON_CLICK');
                    }
                    
                    // Reset upgrade mode state
                    State.set('selectedGems', new Set());
                    State.set('inUpgradeMode', false);
                    State.set('gemCatalog.gemPool', []);
                    
                    // Show appropriate success message
                    if (upgradeOption.isDirectUpgrade) {
                        UI.showMessage(`Upgraded ${selectedGem.name} to +${upgradeOption.upgradeCount}!`);
                    } else if (isClassUpgrade) {
                        UI.showMessage(`Transformed ${selectedGem.name} into ${upgradeOption.name} (fully mastered)!`);
                    } else if (upgradeOption.isAlternateUpgrade) {
                        UI.showMessage(`Transformed ${selectedGem.name} into ${upgradeOption.name}!`);
                    }
                    
                    // Update shop UI
                    UI.updateShopScreen();
                }
                
                /**
                 * Cancel gem upgrade in the shop
                 */
                function cancelUpgrade() {
                    // Refund the cost
                    const player = State.get('player');
                    State.set('player.zenny', player.zenny + 5);
                    
                    // Reset upgrade mode state
                    State.set('inUpgradeMode', false);
                    State.set('gemCatalog.gemPool', []);
                    State.set('selectedGems', new Set());
                    
                    // Show success message
                    UI.showMessage("Upgrade canceled, 5 $ZENNY refunded");
                    
                    // Update shop UI
                    UI.updateShopScreen();
                }

                // Return public methods
                return {
                    prepareShop,
                    buyRandomGem,
                    discardSelectedGem,
                    healTen,
                    initiateGemUpgrade,
                    selectUpgradeOption,
                    cancelUpgrade
                };
            })();