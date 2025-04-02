            // ===================================================
            // GAME DIAGNOSTICS - Tools for troubleshooting game issues
            // ===================================================
            const GameDiagnostics = (() => {
                // Log history for debugging
                const logHistory = [];
                const MAX_LOG_ENTRIES = 100;
                
                // Keep track of event bindings
                const eventBindings = new Map();
                
                // Error tracking
                const errorHistory = [];
                
                // Performance tracking
                const performanceMarks = {};
                
                /**
                * Initialize diagnostic tools
                */
                function initialize() {
                    // Set up global error handler
                    window.addEventListener('error', captureError);
                    
                    // Override console.log
                    const originalConsoleLog = console.log;
                    console.log = function(...args) {
                        captureLog('log', ...args);
                        originalConsoleLog.apply(console, args);
                    };
                    
                    // Override console.error
                    const originalConsoleError = console.error;
                    console.error = function(...args) {
                        captureLog('error', ...args);
                        originalConsoleError.apply(console, args);
                    };
                    
                    // Override console.warn
                    const originalConsoleWarn = console.warn;
                    console.warn = function(...args) {
                        captureLog('warn', ...args);
                        originalConsoleWarn.apply(console, args);
                    };
                    
                    // Add diagnostic commands to window
                    window.gameDiagnostics = {
                        viewLogs: viewLogs,
                        checkButtonBindings: checkButtonBindings,
                        testJourneyButton: testJourneyButton,
                        checkGameState: checkGameState,
                        fixJourneyButton: fixJourneyButton,
                        emergencyContinueJourney: emergencyContinueJourney
                    };
                    
                    log("Game diagnostics initialized");
                }
                
                /**
                * Capture a log entry
                * @param {String} level - Log level
                * @param {...any} args - Log arguments
                */
                function captureLog(level, ...args) {
                    // Format the log entry
                    let logEntry = {
                        timestamp: new Date(),
                        level: level,
                        message: args.map(arg => {
                            if (typeof arg === 'object') {
                                try {
                                    return JSON.stringify(arg);
                                } catch (e) {
                                    return String(arg);
                                }
                            }
                            return String(arg);
                        }).join(' ')
                    };
                    
                    // Add to log history with limit
                    logHistory.push(logEntry);
                    if (logHistory.length > MAX_LOG_ENTRIES) {
                        logHistory.shift();
                    }
                }
                
                /**
                * Capture an error
                * @param {Event} event - Error event
                */
                function captureError(event) {
                    const errorEntry = {
                        timestamp: new Date(),
                        message: event.message,
                        filename: event.filename,
                        lineno: event.lineno,
                        colno: event.colno,
                        stack: event.error ? event.error.stack : null
                    };
                    
                    errorHistory.push(errorEntry);
                    captureLog('error', `ERROR: ${event.message} at ${event.filename}:${event.lineno}`);
                }
                
                /**
                * Simple logging function
                * @param {String} message - Log message
                */
                function log(message) {
                    console.log(`[GameDiagnostics] ${message}`);
                }
                
                /**
                * View recent logs
                * @param {Number} count - Number of logs to view
                * @param {String} level - Log level to filter by
                * @returns {Array} Log entries
                */
                function viewLogs(count = 20, level = null) {
                    let filteredLogs = level ? 
                        logHistory.filter(entry => entry.level === level) : 
                        logHistory;
                    
                    // Get the most recent logs
                    const recentLogs = filteredLogs.slice(-count);
                    
                    // Format for console display
                    recentLogs.forEach(entry => {
                        const timestamp = entry.timestamp.toISOString().slice(11, 23);
                        const levelFormatted = entry.level.toUpperCase().padEnd(5);
                        console.log(`${timestamp} [${levelFormatted}] ${entry.message}`);
                    });
                    
                    return recentLogs;
                }
                
                /**
                * Check all button bindings in the DOM
                */
                function checkButtonBindings() {
                    const buttons = document.querySelectorAll('button');
                    log(`Found ${buttons.length} buttons in DOM`);
                    
                    const results = [];
                    
                    buttons.forEach(btn => {
                        const id = btn.id || "(no id)";
                        const hasClick = typeof btn.onclick === 'function';
                        const text = btn.textContent || "(no text)";
                        const isVisible = btn.offsetParent !== null;
                        const isDisabled = btn.disabled;
                        
                        const result = {
                            id,
                            text: text.trim(),
                            hasClickHandler: hasClick,
                            isVisible,
                            isDisabled,
                            isClickable: isVisible && !isDisabled
                        };
                        
                        results.push(result);
                        
                        log(`Button ${id} "${text.trim()}": ${hasClick ? 'has' : 'NO'} click handler, clickable: ${isVisible && !isDisabled}`);
                    });
                    
                    // Specifically check the journey button
                    const journeyButton = document.getElementById('continue-journey-btn');
                    if (journeyButton) {
                        log("Journey button found:");
                        log(`  onClick: ${typeof journeyButton.onclick === 'function' ? 'YES' : 'NO'}`);
                        log(`  visible: ${journeyButton.offsetParent !== null ? 'YES' : 'NO'}`);
                        log(`  disabled: ${journeyButton.disabled ? 'YES' : 'NO'}`);
                        log(`  style.display: ${journeyButton.style.display}`);
                        
                        // Try to verify the handler
                        if (typeof journeyButton.onclick === 'function') {
                            log("Journey button has onclick handler");
                        } else {
                            log("NO ONCLICK HANDLER FOR JOURNEY BUTTON - CRITICAL ISSUE");
                        }
                    } else {
                        log("Journey button NOT FOUND in DOM");
                    }
                    
                    return results;
                }
                
                /**
                * Test the journey button functionality
                */
                function testJourneyButton() {
                    const journeyButton = document.getElementById('continue-journey-btn');
                    
                    if (!journeyButton) {
                        log("Journey button not found - are you on the gem catalog screen?");
                        return false;
                    }
                    
                    log("Testing journey button");
                    
                    // Check if startJourney is defined
                    if (typeof window.startJourney === 'function') {
                        log("startJourney function exists globally");
                    } else if (EventHandler && typeof EventHandler.startJourney === 'function') {
                        log("startJourney function exists in EventHandler");
                    } else {
                        log("No startJourney function found - creating emergency version");
                        window.startJourney = emergencyContinueJourney;
                    }
                    
                    // Check onclick
                    if (typeof journeyButton.onclick === 'function') {
                        log("Button has onclick handler");
                        // We don't actually click it automatically
                    } else {
                        log("Button is missing onclick handler - applying emergency fix");
                        fixJourneyButton();
                    }
                    
                    return true;
                }
                
                /**
                * Check the current game state
                */
                function checkGameState() {
                    const currentState = {
                        screen: State.get('currentScreen'),
                        player: {
                            class: State.get('player.class'),
                            health: State.get('player.health'),
                            maxHealth: State.get('player.maxHealth'),
                            stamina: State.get('player.stamina'),
                            zenny: State.get('player.zenny')
                        },
                        handSize: State.get('hand')?.length || 0,
                        gemBagSize: State.get('gemBag')?.length || 0,
                        day: State.get('currentDay'),
                        phase: State.get('currentPhaseIndex'),
                        battleCount: State.get('battleCount'),
                        battleOver: State.get('battleOver'),
                        isEnemyTurnPending: State.get('isEnemyTurnPending')
                    };
                    
                    console.log("Current Game State:", currentState);
                    
                    // Perform sanity checks
                    const issues = [];
                    
                    if (!currentState.player.class) {
                        issues.push("No player class selected");
                    }
                    
                    if (currentState.screen === 'battle' && !State.get('enemy')) {
                        issues.push("In battle screen but no enemy present");
                    }
                    
                    if (currentState.handSize === 0 && 
                        (currentState.screen === 'battle' || currentState.screen === 'shop')) {
                        issues.push("Hand is empty in battle/shop screen");
                    }
                    
                    if (issues.length > 0) {
                        log("ISSUES DETECTED:");
                        issues.forEach(issue => log(`- ${issue}`));
                    } else {
                        log("Game state looks valid");
                    }
                    
                    return { state: currentState, issues };
                }
                
                /**
                * Emergency fix for journey button
                */
                function fixJourneyButton() {
                    const continueBtn = document.getElementById('continue-journey-btn');
                    if (!continueBtn) {
                        log("Cannot fix journey button - not found in DOM");
                        return false;
                    }
                    
                    log("Applying emergency fix to journey button");
                    
                    // Clear any existing onclick handler
                    continueBtn.onclick = null;
                    
                    // Set the function if it doesn't exist
                    if (typeof window.startJourney !== 'function') {
                        window.startJourney = emergencyContinueJourney;
                    }
                    
                    // Set new onclick handler
                    continueBtn.onclick = function() {
                        log("Journey button clicked (emergency handler)");
                        window.startJourney();
                    };
                    
                    return true;
                }
                
                /**
                * Emergency continue journey function
                */
                function emergencyContinueJourney() {
                    log("Emergency continue journey function called");
                    
                    try {
                        // Show loading message if UI is available
                        if (UI && UI.showMessage) {
                            UI.showMessage("Starting your adventure...");
                        }
                        
                        setTimeout(() => {
                            log("Preparing gem bag and battle");
                            
                            // Reset gem bag and start battle
                            if (Gems && Gems.resetGemBag) {
                                Gems.resetGemBag(true);
                            }
                            
                            if (Battle && Battle.startBattle) {
                                Battle.startBattle();
                            }
                            
                            // Switch to battle screen
                            if (UI && UI.switchScreen) {
                                log("Transitioning to battle screen");
                                UI.switchScreen('battle');
                            } else {
                                log("UI.switchScreen not available - attempting fallback");
                                // Try direct DOM manipulation as last resort
                                document.querySelectorAll('.screen').forEach(screen => {
                                    screen.classList.remove('active');
                                });
                                const battleScreen = document.getElementById('battle-screen');
                                if (battleScreen) {
                                    battleScreen.classList.add('active');
                                }
                            }
                        }, 100);
                    } catch (error) {
                        log(`Error in emergency continue journey: ${error.message}`);
                        console.error("Error starting journey:", error);
                        
                        if (UI && UI.showMessage) {
                            UI.showMessage("Error starting journey. Try again.", "error");
                        } else {
                            alert("Error starting journey. Please try again.");
                        }
                    }
                }
                
                /**
                * Track performance of a function
                * @param {String} label - Performance label
                * @param {Function} fn - Function to measure
                * @param {...any} args - Arguments to pass to function
                * @returns {*} Result of the function
                */
                function trackPerformance(label, fn, ...args) {
                    const start = performance.now();
                    try {
                        const result = fn(...args);
                        const end = performance.now();
                        const duration = end - start;
                        
                        // Record the performance mark
                        if (!performanceMarks[label]) {
                            performanceMarks[label] = [];
                        }
                        performanceMarks[label].push(duration);
                        
                        // Log performance info
                        log(`Performance [${label}]: ${duration.toFixed(2)}ms`);
                        
                        return result;
                    } catch (error) {
                        const end = performance.now();
                        log(`Error in ${label}: ${error.message} (after ${(end - start).toFixed(2)}ms)`);
                        throw error;
                    }
                }
                
                /**
                * Get performance statistics for a label
                * @param {String} label - Performance label
                * @returns {Object} Performance statistics
                */
                function getPerformanceStats(label) {
                    const marks = performanceMarks[label];
                    if (!marks || marks.length === 0) {
                        return { label, count: 0 };
                    }
                    
                    const count = marks.length;
                    const total = marks.reduce((sum, time) => sum + time, 0);
                    const average = total / count;
                    const min = Math.min(...marks);
                    const max = Math.max(...marks);
                    
                    return {
                        label,
                        count,
                        total,
                        average,
                        min,
                        max
                    };
                }
                
                /**
                * Print all performance statistics
                */
                function printPerformanceStats() {
                    log("Performance Statistics:");
                    
                    Object.keys(performanceMarks).forEach(label => {
                        const stats = getPerformanceStats(label);
                        log(`  ${label}: ${stats.count} calls, avg: ${stats.average.toFixed(2)}ms, min: ${stats.min.toFixed(2)}ms, max: ${stats.max.toFixed(2)}ms`);
                    });
                }
                
                /**
                * Monitor a specific DOM element for changes
                * @param {String} elementId - Element ID to monitor
                * @param {Function} callback - Callback when element changes
                */
                function monitorElement(elementId, callback) {
                    // Set up mutation observer
                    const observer = new MutationObserver((mutations) => {
                        callback(mutations);
                    });
                    
                    // Try to find the element
                    const element = document.getElementById(elementId);
                    if (element) {
                        log(`Monitoring element: ${elementId}`);
                        
                        // Start observing
                        observer.observe(element, {
                            attributes: true,
                            childList: true,
                            subtree: true
                        });
                        
                        return observer;
                    } else {
                        log(`Cannot monitor element ${elementId} - not found in DOM`);
                        return null;
                    }
                }
                
                /**
                * Monitor all screen transitions
                */
                function monitorScreenTransitions() {
                    const screens = document.querySelectorAll('.screen');
                    
                    screens.forEach(screen => {
                        const observer = new MutationObserver((mutations) => {
                            mutations.forEach(mutation => {
                                if (mutation.type === 'attributes' && 
                                    mutation.attributeName === 'class' && 
                                    screen.classList.contains('active')) {
                                    
                                    log(`Screen transition detected: ${screen.id}`);
                                }
                            });
                        });
                        
                        observer.observe(screen, { attributes: true });
                    });
                    
                    log(`Monitoring ${screens.length} screens for transitions`);
                }
                
                /**
                * Create a snapshot of the current game state
                * @returns {Object} Game state snapshot
                */
                function createStateSnapshot() {
                    const snapshot = {
                        timestamp: new Date(),
                        screen: State.get('currentScreen'),
                        player: State.get('player'),
                        hand: State.get('hand'),
                        gemBag: State.get('gemBag'),
                        discard: State.get('discard'),
                        enemy: State.get('enemy'),
                        currentDay: State.get('currentDay'),
                        currentPhaseIndex: State.get('currentPhaseIndex'),
                        battleCount: State.get('battleCount'),
                        battleOver: State.get('battleOver'),
                        isEnemyTurnPending: State.get('isEnemyTurnPending'),
                        hasActedThisTurn: State.get('hasActedThisTurn'),
                        hasPlayedGemThisTurn: State.get('hasPlayedGemThisTurn'),
                        domSnapshot: {
                            activeScreen: document.querySelector('.screen.active')?.id || null,
                            journeyButtonExists: !!document.getElementById('continue-journey-btn'),
                            visibleButtons: Array.from(document.querySelectorAll('button:not([style*="display: none"])')).map(b => b.id || b.textContent.trim())
                        }
                    };
                    
                    log(`Created state snapshot at ${snapshot.timestamp.toISOString()}`);
                    return snapshot;
                }
                
                /**
                * Compare two state snapshots and show differences
                * @param {Object} snapshot1 - First snapshot
                * @param {Object} snapshot2 - Second snapshot
                */
                function compareSnapshots(snapshot1, snapshot2) {
                    const differences = [];
                    
                    // Compare simple properties
                    ['screen', 'currentDay', 'currentPhaseIndex', 'battleCount', 'battleOver', 
                    'isEnemyTurnPending', 'hasActedThisTurn', 'hasPlayedGemThisTurn'].forEach(prop => {
                        if (snapshot1[prop] !== snapshot2[prop]) {
                            differences.push({
                                property: prop,
                                before: snapshot1[prop],
                                after: snapshot2[prop]
                            });
                        }
                    });
                    
                    // Compare hand size
                    if (snapshot1.hand?.length !== snapshot2.hand?.length) {
                        differences.push({
                            property: 'hand.length',
                            before: snapshot1.hand?.length,
                            after: snapshot2.hand?.length
                        });
                    }
                    
                    // Compare gem bag size
                    if (snapshot1.gemBag?.length !== snapshot2.gemBag?.length) {
                        differences.push({
                            property: 'gemBag.length',
                            before: snapshot1.gemBag?.length,
                            after: snapshot2.gemBag?.length
                        });
                    }
                    
                    // Compare player health
                    if (snapshot1.player?.health !== snapshot2.player?.health) {
                        differences.push({
                            property: 'player.health',
                            before: snapshot1.player?.health,
                            after: snapshot2.player?.health
                        });
                    }
                    
                    // Compare DOM state
                    if (snapshot1.domSnapshot.activeScreen !== snapshot2.domSnapshot.activeScreen) {
                        differences.push({
                            property: 'activeScreen',
                            before: snapshot1.domSnapshot.activeScreen,
                            after: snapshot2.domSnapshot.activeScreen
                        });
                    }
                    
                    // Compare journey button existence
                    if (snapshot1.domSnapshot.journeyButtonExists !== snapshot2.domSnapshot.journeyButtonExists) {
                        differences.push({
                            property: 'journeyButtonExists',
                            before: snapshot1.domSnapshot.journeyButtonExists,
                            after: snapshot2.domSnapshot.journeyButtonExists
                        });
                    }
                    
                    log(`Found ${differences.length} differences between snapshots`);
                    differences.forEach(diff => {
                        log(`  ${diff.property}: ${diff.before} → ${diff.after}`);
                    });
                    
                    return differences;
                }
                
                // Return public methods
                return {
                    initialize,
                    log,
                    viewLogs,
                    checkButtonBindings,
                    testJourneyButton,
                    checkGameState,
                    fixJourneyButton,
                    emergencyContinueJourney,
                    trackPerformance,
                    getPerformanceStats,
                    printPerformanceStats,
                    monitorElement,
                    monitorScreenTransitions,
                    createStateSnapshot,
                    compareSnapshots
                };
            })();