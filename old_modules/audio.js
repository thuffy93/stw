            // ===================================================
            // AUDIO MODULE - Sound effects and music
            // ===================================================
            const AudioManager = (() => {
                // Audio state
                let enabled = true;
                let volume = 0.5;
                const sounds = {};
                let lastPlayedTime = {}; // Track when sounds were last played to prevent spam
                
                /**
                 * Initialize audio system
                 */
                function initialize() {
                    console.log("Initializing AudioManager");
                    
                    try {
                        // Load settings from localStorage
                        loadSettings();
                        
                        // Create placeholder sounds
                        preloadSounds();
                        
                        // Set up audio button
                        setupAudioButton();
                        
                        return true;
                    } catch (error) {
                        console.error("Error initializing AudioManager:", error);
                        return false;
                    }
                }
                
                /**
                 * Load audio settings from localStorage
                 */
                function loadSettings() {
                    try {
                        const enabledSetting = localStorage.getItem(Config.STORAGE_KEYS.AUDIO_ENABLED);
                        if (enabledSetting !== null) {
                            enabled = enabledSetting === 'true';
                        }
                        
                        const volumeSetting = localStorage.getItem(Config.STORAGE_KEYS.AUDIO_VOLUME);
                        if (volumeSetting !== null) {
                            volume = parseFloat(volumeSetting);
                        }
                        
                        updateAudioButtonUI();
                    } catch (error) {
                        console.warn("Error loading audio settings, using defaults:", error);
                    }
                }
                
                /**
                 * Save audio settings to localStorage
                 */
                function saveSettings() {
                    try {
                        localStorage.setItem(Config.STORAGE_KEYS.AUDIO_ENABLED, enabled.toString());
                        localStorage.setItem(Config.STORAGE_KEYS.AUDIO_VOLUME, volume.toString());
                    } catch (error) {
                        console.warn("Error saving audio settings:", error);
                    }
                }
                
                /**
                 * Preload all sounds
                 */
                function preloadSounds() {
                    for (const [name, src] of Object.entries(Config.SOUNDS)) {
                        try {
                            const audio = new window.Audio(src);  // Use window.Audio instead of Audio
                            audio.preload = 'auto';
                            sounds[name] = audio;
                        } catch (error) {
                            console.warn(`Error preloading sound "${name}":`, error);
                        }
                    }
                    
                    console.log(`Preloaded ${Object.keys(sounds).length} sounds`);
                }
                
                /**
                 * Setup audio button
                 */
                function setupAudioButton() {
                    const button = document.getElementById('audio-button');
                    if (!button) {
                        console.warn("Audio button not found in DOM");
                        return false;
                    }
                    
                    button.addEventListener('click', toggleAudio);
                    updateAudioButtonUI();
                    return true;
                }
                
                /**
                 * Update audio button UI
                 */
                function updateAudioButtonUI() {
                    const button = document.getElementById('audio-button');
                    if (!button) return;
                    
                    button.textContent = enabled ? '🔊' : '🔇';
                    button.title = enabled ? 'Sound On (Click to Mute)' : 'Sound Off (Click to Unmute)';
                }
                
                /**
                 * Toggle audio on/off
                 */
                function toggleAudio() {
                    enabled = !enabled;
                    saveSettings();
                    updateAudioButtonUI();
                    
                    // Show feedback
                    if (UI && UI.showMessage) {
                        UI.showMessage(`Sound ${enabled ? 'enabled' : 'disabled'}`);
                    }
                }
                
                /**
                 * Play a sound
                 * @param {String} name - Sound name
                 * @param {Number} volumeMultiplier - Volume multiplier
                 * @param {Number} minInterval - Minimum interval between plays (ms)
                 */
                function play(name, volumeMultiplier = 1, minInterval = 50) {
                    // Skip if audio is disabled
                    if (!enabled) return;
                    
                    // Skip if sound not found
                    const sound = sounds[name];
                    if (!sound) {
                        console.warn(`Sound "${name}" not found`);
                        return;
                    }
                    
                    // Prevent sound spam by checking last played time
                    const now = Date.now();
                    if (lastPlayedTime[name] && (now - lastPlayedTime[name] < minInterval)) {
                        return;
                    }
                    
                    // Update last played time
                    lastPlayedTime[name] = now;
                    
                    try {
                        // Clone the audio to allow overlapping sounds
                        const soundInstance = sound.cloneNode();
                        soundInstance.volume = Math.min(1, Math.max(0, volume * volumeMultiplier));
                        
                        // Play with error handling
                        soundInstance.play().catch(error => {
                            console.warn(`Error playing sound ${name}:`, error);
                        });
                    } catch (error) {
                        console.warn(`Error setting up sound ${name}:`, error);
                    }
                }
                
                /**
                 * Set volume
                 * @param {Number} newVolume - Volume from 0-1
                 */
                function setVolume(newVolume) {
                    volume = Math.min(1, Math.max(0, newVolume));
                    saveSettings();
                    return volume;
                }
                
                /**
                 * Check if a sound exists
                 * @param {String} name - Sound name
                 * @returns {Boolean} Whether sound exists
                 */
                function hasSound(name) {
                    return !!sounds[name];
                }
                
                // Return public methods
                return {
                    initialize,
                    play,
                    toggleAudio,
                    setVolume,
                    hasSound
                };
            })();