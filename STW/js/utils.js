// utils.js - Shared utility functions for the game

// Shuffle array using Fisher-Yates algorithm
export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Generate a unique ID with optional prefix
export function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Calculate success probability based on proficiency
export function calculateSuccess(proficiency) {
    const successRoll = Math.random() * 100;
    return successRoll < proficiency;
}

// Deep merge two objects
export function deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
        if (source[key] === null) {
            result[key] = null;
        } else if (
            typeof source[key] === 'object' && 
            !Array.isArray(source[key]) && 
            typeof result[key] === 'object' && 
            result[key] !== null
        ) {
            result[key] = deepMerge(result[key], source[key]);
        } else {
            result[key] = source[key];
        }
    }
    
    return result;
}

// Safely parse JSON with error handling
export function safeJsonParse(jsonString, defaultValue = {}) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return defaultValue;
    }
}

// Debounce function to limit how often a function can be called
export function debounce(func, wait = 300) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Throttle function to ensure a function is called at most once per specified period
export function throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Format a message for display
export function formatMessage(text, type = 'info') {
    return {
        text,
        type
    };
}

// Create gem tooltip text from gem data
export function generateGemTooltip(gem) {
    // Basic info always shown
    const tooltipParts = [`${gem.name}: ${gem.value} ${gem.type}`];

    // Proficiency info for not fully mastered gems
    if (gem.proficiency < 70) {
        tooltipParts.push(`Mastery: ${Math.floor(gem.proficiency)}%`);
    }

    // Special effects
    if (gem.specialEffect) {
        tooltipParts.push(`Special: ${
            {
                'draw': 'Draw an extra gem',
                // Add more special effects as needed
            }[gem.specialEffect] || gem.specialEffect
        }`);
    }

    // Defense bypass for piercing gems
    if (gem.defenseBypass) {
        tooltipParts.push(`Piercing: Bypasses ${gem.defenseBypass * 100}% of enemy defense`);
    }

    // Only show duration for buffs/debuffs
    if (gem.duration) {
        tooltipParts.push(`Duration: ${gem.duration} turns`);
    }

    // Augmentation info
    if (gem.augmentation) {
        tooltipParts.push(`Augmentation: ${gem.augmentation}`);
    }

    return tooltipParts.join('\n');
}

// Get class-specific bonus multiplier for a gem
export function getClassBonus(playerClass, gemColor) {
    if ((playerClass === 'knight' && gemColor === 'red') ||
        (playerClass === 'mage' && gemColor === 'blue') ||
        (playerClass === 'rogue' && gemColor === 'green')) {
        return 1.5; // 50% bonus for class-aligned gems
    }
    return 1.0; // No bonus
}

// Apply focus bonus if player has focus buff
export function getFocusBonus(playerBuffs) {
    if (playerBuffs && playerBuffs.some(buff => buff.type === 'focus')) {
        return 1.2; // 20% bonus from focus
    }
    return 1.0; // No bonus
}

// Calculate number of gems to draw
export function calculateDrawCount(currentHandSize, bagSize, maxHandSize = 3) {
    const neededGems = Math.min(maxHandSize - currentHandSize, bagSize);
    return Math.max(0, neededGems);
}

// Create a reference chart for enemy actions with corresponding icons
export const enemyActionIcons = {
    'attack': '⚔️',
    'defend': '🛡️',
    'heal': '❤️',
    'poison': '☠️',
    'stun': '💫',
    'howl': '🐺',
    'bite': '🦷',
    'enrage': '😡',
    'steal': '💰',
    'summon': '👺'
};

// Color constants
export const colors = {
    red: '#cc3333',
    blue: '#3366cc',
    green: '#33cc33',
    grey: '#999999',
    success: '#55cc55',
    error: '#ff5555',
    warning: '#ffaa33'
};