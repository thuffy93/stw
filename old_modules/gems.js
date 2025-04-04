            // ===================================================
            // GEMS MODULE - Gem mechanics and management
            // ===================================================
            const Gems = (() => {
                /**
                 * Reset the gem bag
                 * @param {Boolean} fullReset - Whether to fully reset the bag
                 */
                function resetGemBag(fullReset = false) {
                    if (fullReset) {
                        // Clear all current gem collections
                        State.set('gemBag', []);
                        State.set('hand', []);
                        State.set('discard', []);
                        
                        const playerClass = State.get('player.class');
                        const baseGemBag = Config.BASE_GEMS;
                        const gemBag = [];
                        
                        // Add basic gems for all classes
                        gemBag.push(
                            // Healing
                            ...Array(2).fill().map((_, i) => ({ 
                                ...baseGemBag.greyHeal, 
                                id: `greyHeal-${i}-${Utils.generateId()}`, 
                                freshlySwapped: false 
                            })),
                            
                            // Base attacks
                            ...Array(2).fill().map((_, i) => ({ 
                                ...baseGemBag.redAttack, 
                                id: `redAttack-${i}-${Utils.generateId()}`, 
                                freshlySwapped: false 
                            })),
                            ...Array(2).fill().map((_, i) => ({ 
                                ...baseGemBag.blueMagicAttack, 
                                id: `blueMagicAttack-${i}-${Utils.generateId()}`, 
                                freshlySwapped: false 
                            })),
                            ...Array(2).fill().map((_, i) => ({ 
                                ...baseGemBag.greenAttack, 
                                id: `greenAttack-${i}-${Utils.generateId()}`, 
                                freshlySwapped: false 
                            }))
                        );
                        
                        // Add class-specific gems
                        if (playerClass === "Knight") {
                            gemBag.push(
                                ...Array(3).fill().map((_, i) => ({ 
                                    ...baseGemBag.redAttack, 
                                    id: `redAttack-special-${i}-${Utils.generateId()}`, 
                                    freshlySwapped: false 
                                })),
                                ...Array(3).fill().map((_, i) => ({ 
                                    ...baseGemBag.redStrongAttack, 
                                    id: `redStrongAttack-${i}-${Utils.generateId()}`, 
                                    freshlySwapped: false 
                                }))
                            );
                        } 
                        else if (playerClass === "Mage") {
                            gemBag.push(
                                ...Array(3).fill().map((_, i) => ({ 
                                    ...baseGemBag.blueMagicAttack, 
                                    id: `blueMagicAttack-special-${i}-${Utils.generateId()}`, 
                                    freshlySwapped: false 
                                })),
                                ...Array(3).fill().map((_, i) => ({ 
                                    ...baseGemBag.blueStrongHeal, 
                                    id: `blueStrongHeal-${i}-${Utils.generateId()}`, 
                                    freshlySwapped: false 
                                }))
                            );
                        } 
                        else if (playerClass === "Rogue") {
                            gemBag.push(
                                ...Array(3).fill().map((_, i) => ({ 
                                    ...baseGemBag.greenAttack, 
                                    id: `greenAttack-special-${i}-${Utils.generateId()}`, 
                                    freshlySwapped: false 
                                })),
                                ...Array(3).fill().map((_, i) => ({ 
                                    ...baseGemBag.greenQuickAttack, 
                                    id: `greenQuickAttack-${i}-${Utils.generateId()}`, 
                                    freshlySwapped: false 
                                }))
                            );
                        }
                        
                        // Fill remaining spots with basic gems only (not unlocked gems)
                        const gemsToAdd = Config.MAX_GEM_BAG_SIZE - gemBag.length;
                        
                        // Only use basic gems for filling the bag
                        const basicGemKeys = ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal"];
                        
                        for (let i = 0; i < gemsToAdd; i++) {
                            // Pick a random basic gem
                            const gemKey = basicGemKeys[Math.floor(Math.random() * basicGemKeys.length)];
                            
                            gemBag.push({ 
                                ...baseGemBag[gemKey], 
                                id: `${gemKey}-extra-${i}-${Utils.generateId()}`, 
                                freshlySwapped: false 
                            });
                        }
                        
                        State.set('gemBag', gemBag);
                    }
                    
                    // Shuffle the bag
                    const shuffledBag = Utils.shuffle(State.get('gemBag'));
                    State.set('gemBag', shuffledBag);
                }
                
                /**
                 * Draw cards from the gem bag to hand
                 * @param {Number} num - Number of cards to draw
                 */
                function drawCards(num) {
                    let hand = State.get('hand');
                    let gemBag = State.get('gemBag');
                    let discard = State.get('discard');
                    
                    // Calculate how many cards we need to draw
                    const maxHandSize = Config.MAX_HAND_SIZE;
                    const needed = Math.min(num, maxHandSize - hand.length);
                    if (needed <= 0) return;
                    
                    // If gem bag is empty, shuffle discard pile into it
                    if (gemBag.length < needed && discard.length > 0) {
                        recycleDiscardPile();
                        gemBag = State.get('gemBag'); // Get updated gem bag
                    }
                    
                    // Draw cards from bag to hand
                    const newHand = [...hand];
                    for (let i = 0; i < needed && gemBag.length > 0; i++) {
                        // Draw from the end for better performance than shift()
                        newHand.push(gemBag[gemBag.length - 1]);
                        gemBag = gemBag.slice(0, -1);
                    }
                    
                    // Update state
                    State.set('hand', newHand);
                    State.set('gemBag', gemBag);
                    
                    // Update UI
                    UI.renderHand();
                    UI.updateBattleScreen();
                }
                
                /**
                 * Recycle discard pile into gem bag
                 */
                function recycleDiscardPile() {
                    let gemBag = State.get('gemBag');
                    let discard = State.get('discard');
                    
                    // Move all cards from discard to gem bag
                    gemBag = [...gemBag, ...discard];
                    
                    // Clear discard pile and shuffle gem bag
                    State.set('discard', []);
                    State.set('gemBag', Utils.shuffle(gemBag));
                    
                    // Notify player
                    UI.showMessage("Discard pile reshuffled into gem bag!");
                }
                
                /**
                 * Standardize gem key format for consistency
                 * @param {String} gemKey - Gem key to standardize
                 * @returns {String} Standardized gem key
                 */
                function standardizeGemKey(gemKey) {
                    // Remove whitespace
                    let standardizedKey = gemKey.replace(/\s+/g, '');
                    
                    // Key mappings for consistency
                    const keyMappings = {
                        "redAttack": "redAttack",
                        "blueMagicAttack": "blueMagicAttack",
                        "greenQuickAttack": "greenQuickAttack",
                        "redStrongAttack": "redStrongAttack",
                        "greyHeal": "greyHeal",
                        "blueStrongHeal": "blueStrongHeal",
                        "greenPoison": "greenPoison",
                        "blueShield": "blueShield"
                    };
                    
                    // Apply mapping if available
                    return keyMappings[standardizedKey] || standardizedKey;
                }
                
                /**
                 * Get the type of a gem based on its properties
                 * @param {Object} gem - Gem object
                 * @returns {Object} Gem type definition
                 */
                function getGemType(gem) {
                    const definitions = Config.GEM_DEFINITIONS;
                    
                    // Check for special types first
                    if (gem.shield) return definitions.shield;
                    if (gem.poison) return definitions.poison;
                    
                    // Check for attack variants
                    if (gem.damage) {
                        if (gem.name.includes("Strong")) return definitions.strongAttack;
                        if (gem.name.includes("Quick")) return definitions.quickAttack;
                        if (gem.name.includes("Burst")) return definitions.burstAttack;
                        return definitions.attack;
                    }
                    
                    // Check for heal variants
                    if (gem.heal) {
                        if (gem.name.includes("Strong")) return definitions.strongHeal;
                        return definitions.heal;
                    }
                    
                    // Fallback
                    return { 
                        icon: "✨", 
                        label: "Special", 
                        property: null 
                    };
                }
                
                /**
                 * Get the appropriate symbol for a gem based on context
                 * @param {Object} gem - Gem object
                 * @param {String} context - Context ('battle', 'shop', or 'catalog')
                 * @returns {String} Gem symbol
                 */
                function getGemSymbol(gem, context = 'battle') {
                    const gemType = getGemType(gem);
                    
                    // Use emoji for battle/shop, text label for catalog
                    return (context === 'battle' || context === 'shop') 
                        ? gemType.icon 
                        : gemType.label;
                }
                
                /**
                 * Build tooltip text for a gem
                 * @param {Object} gem - Gem object
                 * @param {Boolean} hasBonus - Whether the gem has a class bonus
                 * @returns {String} Tooltip text
                 */
                function buildGemTooltip(gem, hasBonus) {
                    let tooltip = '';
                    
                    // Add primary effect and value
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
                    
                    // Add stamina cost at the end
                    tooltip += ` | (${gem.cost}⚡)`;
                    
                    return tooltip;
                }
                
                /**
                 * Get the proficiency for a gem
                 * @param {String} gemKey - Gem key
                 * @returns {Object} Proficiency data
                 */
                function getGemProficiency(gemKey) {
                    const gemProficiency = State.get('gemProficiency');
                    
                    // Standardize gem key format
                    const standardizedKey = standardizeGemKey(gemKey);
                    
                    // Special handling for class-specific gems
                    const classGems = ["redStrongAttack", "blueStrongHeal", "greenQuickAttack"];
                    
                    // If this is a class gem, return full proficiency regardless of whether it's in the state
                    if (classGems.includes(standardizedKey)) {
                        return { successCount: 6, failureChance: 0 };
                    }
                    
                    // If we don't have proficiency data yet, create default
                    if (!gemProficiency[standardizedKey]) {
                        // Check if the gemKey might be in color+name format
                        if (standardizedKey.length > 0) {
                            // Try to extract color and name
                            const colors = ['red', 'blue', 'green', 'grey'];
                            
                            for (const color of colors) {
                                if (standardizedKey.toLowerCase().startsWith(color)) {
                                    const alternateKey = standardizedKey.substring(color.length);
                                    if (gemProficiency[alternateKey]) {
                                        return gemProficiency[alternateKey];
                                    }
                                    break;
                                }
                            }
                        }
                        
                        // Still no match, return default values
                        // For base gems or class-specific gems, set them as already learned
                        const baseGems = ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal", 
                                        "redStrongAttack", "blueStrongHeal", "greenQuickAttack"];
                        
                        if (baseGems.includes(standardizedKey)) {
                            return { successCount: 6, failureChance: 0 };
                        } else {
                            return { successCount: 0, failureChance: 0.9 };
                        }
                    }
                    
                    return gemProficiency[standardizedKey];
                }
                
                /**
                 * Update proficiency for a gem based on success/failure
                 * @param {String} gemKey - Gem key
                 * @param {Boolean} success - Whether the gem use was successful
                 */
                function updateGemProficiency(gemKey, success) {
                    const gemProficiency = State.get('gemProficiency');
                    const playerClass = State.get('player.class');
                    
                    // Standardize the key using our helper function
                    const standardizedKey = standardizeGemKey(gemKey);
                    
                    // Get current proficiency
                    let proficiency = getGemProficiency(standardizedKey);
                    
                    // Update proficiency based on success
                    if (success) {
                        proficiency.successCount++;
                        proficiency.failureChance = Math.max(0, 0.9 - proficiency.successCount * 0.15);
                        
                        // Update proficiency in state for both gem-specific and class-specific proficiency
                        gemProficiency[standardizedKey] = proficiency;
                        State.set('gemProficiency', gemProficiency);
                        
                        // Also update in class-specific proficiency if we have a player class
                        if (playerClass) {
                            State.set(`classGemProficiency.${playerClass}.${standardizedKey}`, proficiency);
                        }
                        
                        // Save to localStorage
                        Storage.saveGemProficiency();
                        
                        console.log(`Updated proficiency for ${standardizedKey}`, proficiency);
                    }
                }
                
                /**
                 * Check if a gem will fail based on proficiency
                 * @param {Object} proficiency - Gem proficiency data
                 * @returns {Boolean} Whether the gem will fail
                 */
                function checkGemFails(proficiency) {
                    return proficiency.failureChance > 0 && Math.random() < proficiency.failureChance;
                }

                /**
                 * Calculate the damage/healing multiplier for a gem
                 * @param {Object} gem - Gem object
                 * @returns {Number} Multiplier value
                 */
                function calculateGemMultiplier(gem) {
                    const player = State.get('player');
                    let multiplier = 1;
                    
                    // Class bonus
                    if ((player.class === "Knight" && gem.color === "red") || 
                        (player.class === "Mage" && gem.color === "blue") || 
                        (player.class === "Rogue" && gem.color === "green")) {
                        multiplier *= 1.5;
                    }
                    
                    // Focus buff
                    if (player.buffs.some(b => b.type === "focused")) {
                        multiplier *= 1.2;
                    }
                    
                    return multiplier;
                }
                
                /**
                 * Process gem effect when played
                 * @param {Object} gem - Gem being played
                 * @param {Boolean} gemFails - Whether the gem fails
                 * @param {Number} multiplier - Damage/healing multiplier
                 */
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
                            
                            // Check for enemy defeat
                            if (enemy.health <= 0) {
                                if (Battle && typeof Battle.handleEnemyDefeated === 'function') {
                                    Battle.handleEnemyDefeated();
                                }
                                return; // Exit early
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
                
                /**
                 * Get upgrade multiplier based on gem rarity
                 * @param {String} rarity - Gem rarity
                 * @returns {Number} Multiplier
                 */
                function getUpgradeMultiplier(rarity) {
                    switch (rarity) {
                        case "Common": return 1.25;
                        case "Uncommon": return 1.3;
                        case "Rare": return 1.35;
                        default: return 1.4;
                    }
                }
                
                /**
                 * Generate upgrade options for a gem
                 * @param {Object} selectedGem - The gem to upgrade
                 * @returns {Array} Upgrade options
                 */
                function generateUpgradeOptions(selectedGem) {
                    const baseGemBag = Config.BASE_GEMS;
                    const gemColor = selectedGem.color;
                    const player = State.get('player');
                    const playerClass = player.class;
                    const gemCatalog = State.get('gemCatalog');
                    const options = [];
                    
                    // Option 1: Direct upgrade (always available)
                    options.push(createDirectUpgrade(selectedGem));
                    
                    // Option 2: Class-specific upgrade if applicable
                    const classUpgrade = createClassUpgrade(selectedGem);
                    if (classUpgrade) {
                        options.push(classUpgrade);
                    }
                    
                    // Option 3-4: Alternative gems from unlocked catalog
                    const alternativeCount = options.length > 1 ? 1 : 2; // Fewer alternatives if we have a class upgrade
                    const alternatives = createAlternativeUpgrades(selectedGem, gemCatalog, alternativeCount);
                    options.push(...alternatives);
                    
                    return options;
                    
                    // Helper function for direct upgrades
                    function createDirectUpgrade(gem) {
                        const directUpgrade = { 
                            ...gem,
                            id: `${gem.name}-upgraded-${Utils.generateId()}`,
                            upgradeCount: (gem.upgradeCount || 0) + 1,
                            freshlySwapped: false,
                            isDirectUpgrade: true
                        };
                        
                        // Calculate stat improvements based on rarity
                        const upgradeMultiplier = getUpgradeMultiplier(gem.rarity);
                        
                        // Apply stat improvements
                        if (directUpgrade.damage) {
                            directUpgrade.damage = Math.floor(directUpgrade.damage * upgradeMultiplier);
                        }
                        if (directUpgrade.heal) {
                            directUpgrade.heal = Math.floor(directUpgrade.heal * upgradeMultiplier);
                        }
                        if (directUpgrade.poison) {
                            directUpgrade.poison = Math.floor(directUpgrade.poison * upgradeMultiplier);
                        }
                        
                        return directUpgrade;
                    }
                    
                    // Helper function for class upgrades
                    function createClassUpgrade(gem) {
                        const classSpecificUpgrades = {
                            "redAttack": "redStrongAttack",
                            "blueMagicAttack": "blueStrongHeal",
                            "greenAttack": "greenQuickAttack"
                        };
                        
                        const gemKey = `${gem.color}${gem.name.replace(/\s+/g, '')}`;
                        
                        if (!classSpecificUpgrades[gemKey]) return null;
                        
                        const upgradeKey = classSpecificUpgrades[gemKey];
                        const upgradeBase = baseGemBag[upgradeKey];
                        
                        if (!upgradeBase) return null;
                        
                        return { 
                            ...upgradeBase,
                            id: `${upgradeKey}-class-upgrade-${Utils.generateId()}`,
                            upgradeCount: 0,
                            freshlySwapped: false,
                            isClassUpgrade: true
                        };
                    }
                    
                    // Helper function for alternative upgrades
                    function createAlternativeUpgrades(gem, catalog, maxCount) {
                        const baseGemKeys = [
                            "redAttack", "blueMagicAttack", "greenAttack", "greyHeal",
                            "redStrongAttack", "blueStrongHeal", "greenQuickAttack"
                        ];
                        
                        // Filter for explicitly unlocked (non-base) gems of the same color
                        const explicitlyUnlockedGems = catalog.unlocked.filter(gemKey => {
                            if (baseGemKeys.includes(gemKey)) return false;
                            
                            const gemDef = baseGemBag[gemKey];
                            return gemDef && gemDef.color === gem.color && gemDef.name !== gem.name;
                        });
                        
                        if (explicitlyUnlockedGems.length === 0) return [];
                        
                        // Shuffle and take up to maxCount alternatives
                        const shuffledGems = Utils.shuffle([...explicitlyUnlockedGems]);
                        const alternatives = [];
                        
                        for (let i = 0; i < Math.min(maxCount, shuffledGems.length); i++) {
                            const gemKey = shuffledGems[i];
                            const baseGem = baseGemBag[gemKey];
                            if (!baseGem) continue;
                            
                            const alternativeGem = { 
                                ...baseGem, 
                                id: `${gemKey}-alternative-${Utils.generateId()}`, 
                                freshlySwapped: false,
                                isAlternateUpgrade: true 
                            };
                            
                            // 50% chance to upgrade it
                            if (Math.random() < 0.5) {
                                alternativeGem.upgradeCount = 1;
                                const altUpgradeMultiplier = getUpgradeMultiplier(baseGem.rarity);
                                
                                if (alternativeGem.damage) {
                                    alternativeGem.damage = Math.floor(alternativeGem.damage * altUpgradeMultiplier);
                                }
                                if (alternativeGem.heal) {
                                    alternativeGem.heal = Math.floor(alternativeGem.heal * altUpgradeMultiplier);
                                }
                                if (alternativeGem.poison) {
                                    alternativeGem.poison = Math.floor(alternativeGem.poison * altUpgradeMultiplier);
                                }
                            }
                            
                            alternatives.push(alternativeGem);
                        }
                        
                        return alternatives;
                    }
                }
                
                /**
                 * Create an alternative gem when no suitable upgrades found
                 * @param {Object} originalGem - Original gem to create an alternative for
                 * @returns {Object} Alternative gem
                 */
                function createAlternativeGem(originalGem) {
                    const baseGemBag = Config.BASE_GEMS;
                    const gemColor = originalGem.color;
                    
                    // Find a different gem of the same color
                    const baseGemKeys = Object.keys(baseGemBag);
                    const sameColorGems = baseGemKeys.filter(key => {
                        const gem = baseGemBag[key];
                        return gem.color === gemColor && gem.name !== originalGem.name;
                    });
                    
                    if (sameColorGems.length === 0) {
                        // Fallback - create a slightly different variant of the original
                        return {
                            ...originalGem,
                            name: `${originalGem.name}+`,
                            id: `${originalGem.name}-variant-${Utils.generateId()}`,
                            damage: originalGem.damage ? Math.floor(originalGem.damage * 1.2) : null,
                            heal: originalGem.heal ? Math.floor(originalGem.heal * 1.2) : null,
                            poison: originalGem.poison ? Math.floor(originalGem.poison * 1.2) : null,
                            freshlySwapped: false,
                            isAlternateUpgrade: true
                        };
                    }
                    
                    // Select a random gem of the same color
                    const randomKey = sameColorGems[Math.floor(Math.random() * sameColorGems.length)];
                    const baseGem = baseGemBag[randomKey];
                    
                    const alternativeGem = { 
                        ...baseGem, 
                        id: `${randomKey}-alternative-${Utils.generateId()}`, 
                        freshlySwapped: false,
                        isAlternateUpgrade: true 
                    };
                    
                    // 50% chance to give it an upgrade too
                    if (Math.random() < 0.5) {
                        alternativeGem.upgradeCount = 1;
                        const altUpgradeMultiplier = getUpgradeMultiplier(baseGem.rarity);
                        
                        if (alternativeGem.damage) {
                            alternativeGem.damage = Math.floor(alternativeGem.damage * altUpgradeMultiplier);
                        }
                        if (alternativeGem.heal) {
                            alternativeGem.heal = Math.floor(alternativeGem.heal * altUpgradeMultiplier);
                        }
                        if (alternativeGem.poison) {
                            alternativeGem.poison = Math.floor(alternativeGem.poison * altUpgradeMultiplier);
                        }
                    }
                    
                    return alternativeGem;
                }
                
                /**
                 * Create a gem pool appropriate for a specific class
                 * @param {String} playerClass - Player class
                 * @returns {Array} Gem keys
                 */
                function createClassAppropriateGemPool(playerClass) {
                    let gemPool = [];
                    const baseGemBag = Config.BASE_GEMS;
                    const classColors = {
                        "Knight": "red",
                        "Mage": "blue",
                        "Rogue": "green"
                    };
                    const classColor = classColors[playerClass];
                    
                    // Basic gems that should be available to all classes
                    const basicGemKeys = ["redAttack", "blueMagicAttack", "greenAttack", "greyHeal"];
                    
                    // First, ensure the basic gems are in the pool
                    for (const basicKey of basicGemKeys) {
                        gemPool.push(basicKey);
                    }
                    
                    // Add other unlocked gems that match the class color or are grey
                    const gemCatalog = State.get('gemCatalog');
                    gemCatalog.unlocked.forEach(key => {
                        // Skip basic gems (already added)
                        if (basicGemKeys.includes(key)) return;
                        
                        const gemColor = baseGemBag[key]?.color;
                        
                        // Only add if it's class-appropriate (matches class color or is grey)
                        if (gemColor === classColor || gemColor === "grey") {
                            gemPool.push(key);
                        }
                    });
                    
                    return gemPool;
                }
                
                /**
                 * Get explicitly unlocked gems (not starting gems)
                 * @returns {Array} Explicitly unlocked gems
                 */
                function getExplicitlyUnlockedGems() {
                    const gemCatalog = State.get('gemCatalog');
                    const baseGemBag = Config.BASE_GEMS;
                    const player = State.get('player');
                    
                    // Define the starting gems for each class
                    const startingGemsByClass = Config.STARTING_GEMS;
                    
                    // Get starting gems for player's class
                    const startingGems = startingGemsByClass[player.class] || [];
                    
                    // Filter to get ONLY explicitly unlocked gems (not starting gems)
                    const explicitlyUnlocked = gemCatalog.unlocked.filter(key => !startingGems.includes(key));
                    
                    return explicitlyUnlocked.map(key => ({
                        key,
                        gem: baseGemBag[key]
                    }));
                }
                
                /**
                 * Create a gem element for the UI
                 * @param {Object} gem - Gem object
                 * @param {Number} index - Index of the gem
                 * @param {String} context - Context ('battle', 'shop', or 'catalog')
                 * @param {Object} options - Additional options
                 * @returns {HTMLElement} Gem element
                 */
                function createGemElement(gem, index, context = 'battle', options = {}) {
                    const isShop = context === 'shop';
                    const isCatalog = context === 'catalog';
                    const isUnlockable = options.isUnlockable || false;
                    const gemKey = options.gemKey;
                    
                    // Create base gem element
                    const gemElement = document.createElement("div");
                    gemElement.className = `gem ${gem.color}`;
                    
                    // For battle/shop: Check for class bonus
                    if (!isCatalog) {
                        const player = State.get('player');
                        const hasBonus = (player.class === "Knight" && gem.color === "red") ||
                                    (player.class === "Mage" && gem.color === "blue") ||
                                    (player.class === "Rogue" && gem.color === "green");
                        
                        if (hasBonus) {
                            gemElement.classList.add("class-bonus");
                        }
                        
                        // Check if gem is selected
                        try {
                            const selectedGems = State.get('selectedGems');
                            if (selectedGems && selectedGems.has(index)) {
                                gemElement.classList.add("selected");
                            }
                        } catch (e) {
                            console.warn("Error checking selected gems:", e);
                        }
                    }
                    
                    // Create the gem content structure
                    const gemContent = document.createElement("div");
                    gemContent.className = "gem-content";
                    
                    // Get appropriate symbol based on context
                    const gemSymbol = getGemSymbol(gem, context);
                    
                    // Add icon
                    const gemIcon = document.createElement("div");
                    gemIcon.className = "gem-icon";
                    gemIcon.textContent = gemSymbol;
                    
                    // Special styling for catalog
                    if (isCatalog) {
                        gemIcon.style.fontSize = "0.8em";
                    }
                    
                    gemContent.appendChild(gemIcon);
                    
                    // Add value if present (damage, heal, or poison amount)
                    if (gem.damage || gem.heal || gem.poison) {
                        const gemValue = document.createElement("div");
                        gemValue.className = "gem-value";
                        gemValue.textContent = gem.damage || gem.heal || gem.poison || "";
                        gemContent.appendChild(gemValue);
                    }
                    
                    // Add name
                    const gemName = document.createElement("div");
                    gemName.className = "gem-name";
                    gemName.textContent = gem.name;
                    gemContent.appendChild(gemName);
                    
                    // Append content to gem element
                    gemElement.appendChild(gemContent);
                    
                    // Add cost
                    const gemCost = document.createElement("div");
                    gemCost.className = "gem-cost";
                    gemCost.textContent = gem.cost;
                    
                    // Special styling for catalog
                    if (isCatalog) {
                        gemCost.style.position = "absolute";
                        gemCost.style.top = "-5px";
                        gemCost.style.right = "-5px";
                        gemCost.style.width = "18px";
                        gemCost.style.height = "18px";
                        gemCost.style.fontSize = "0.4em";
                        gemCost.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
                        gemCost.style.color = "white";
                        gemCost.style.borderRadius = "50%";
                        gemCost.style.display = "flex";
                        gemCost.style.alignItems = "center";
                        gemCost.style.justifyContent = "center";
                        gemCost.style.zIndex = "10";
                        gemCost.style.border = "1px solid rgba(255, 255, 255, 0.5)";
                    }
                    
                    gemElement.appendChild(gemCost);
                    
                    // Create tooltip
                    try {
                        // Get proficiency for battle/shop gems
                        let proficiency = null;
                        if (!isCatalog) {
                            const gemKey = `${gem.color}${gem.name}`;
                            proficiency = getGemProficiency(gemKey);
                        }
                        
                        // Build tooltip
                        const hasBonus = !isCatalog && gemElement.classList.contains("class-bonus");
                        let tooltip = buildGemTooltip(gem, hasBonus);
                        
                        // Add proficiency info if not fully learned
                        if (proficiency && proficiency.failureChance > 0) {
                            tooltip += `\n${Math.round((1 - proficiency.failureChance) * 100)}% success chance`;
                            gemElement.classList.add("unlearned");
                        }
                        
                        gemElement.setAttribute("data-tooltip", tooltip);
                    } catch (e) {
                        console.warn("Error creating gem tooltip:", e);
                    }
                    
                    // Special handling for unlockable gems
                    if (isUnlockable && gemKey) {
                        gemElement.style.cursor = 'pointer';
                        
                        gemElement.onclick = function() {
                            // Simply use browser's native confirm
                            if (confirm(`Would you like to unlock the ${gem.color} ${gem.name} gem for 50 $ZENNY?`)) {
                                if (EventHandler && typeof EventHandler.unlockGem === 'function') {
                                    EventHandler.unlockGem(gemKey, index);
                                } else {
                                    console.error("EventHandler.unlockGem is not available");
                                    UI.showMessage("Error unlocking gem", "error");
                                }
                            }
                        };
                    } else if (!isCatalog) {
                        // For battle/shop: selection behavior
                        gemElement.onclick = function() {
                            console.log(`Gem clicked: ${gem.name}, index=${index}, context=${context}`);
                            // Directly call EventHandler to ensure the connection
                            if (typeof EventHandler.toggleGemSelection === 'function') {
                                EventHandler.toggleGemSelection(index, isShop);
                            } else {
                                console.error("EventHandler.toggleGemSelection is not available!");
                            }
                        };
                    }
                    
                    return gemElement;
                }
                
                // Export the module's public interface
                return {
                    // Core gem mechanics
                    resetGemBag,
                    drawCards,
                    recycleDiscardPile,
                    getGemProficiency,
                    updateGemProficiency,
                    generateUpgradeOptions,
                    
                    // Gem catalog and management
                    getExplicitlyUnlockedGems,
                    createClassAppropriateGemPool,
                    
                    // Gameplay utility functions
                    checkGemFails,
                    calculateGemMultiplier,
                    processGemEffect,
                    
                    // UI helpers
                    createGemElement,
                    getGemType,
                    getGemSymbol,
                    buildGemTooltip,
                    
                    // Helper utilities
                    standardizeGemKey
                };
            })();

            // Add critical gem-related utility functions to window.GameUtils for cross-module access
            if (!window.GameUtils) {
                window.GameUtils = {};
            }

            window.GameUtils.checkGemFails = function(proficiency) {
                return proficiency.failureChance > 0 && Math.random() < proficiency.failureChance;
            };

            window.GameUtils.calculateGemMultiplier = function(gem) {
                const player = State.get('player');
                let multiplier = 1;
                
                // Class bonus
                if ((player.class === "Knight" && gem.color === "red") || 
                    (player.class === "Mage" && gem.color === "blue") || 
                    (player.class === "Rogue" && gem.color === "green")) {
                    multiplier *= 1.5;
                }
                
                // Focus buff
                if (player.buffs.some(b => b.type === "focused")) {
                    multiplier *= 1.2;
                }
                
                return multiplier;
            };

            window.GameUtils.processGemEffect = function(gem, gemFails, multiplier) {
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
                        
                        // IMPORTANT: Check for enemy defeat immediately after dealing damage
                        if (enemy.health <= 0) {
                            // Call handleEnemyDefeated through the Battle module
                            Battle.handleEnemyDefeated();
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
            };