// Monetization state for in-app purchases and ad-based boosts.
// Tracks premium unlock status and cooldowns for boost actions.
export const MONETIZATION_STORAGE_KEY = 'glyph-defense-idle:monetization';
// Cooldown duration for ad-based boosts (in milliseconds)
const AD_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown
// Default state structure
const DEFAULT_STATE = {
    premiumUnlocked: false,
    boostCooldowns: {
        gems: 0,
    },
};
// In-memory state
let currentState = {
    ...DEFAULT_STATE,
    boostCooldowns: { ...DEFAULT_STATE.boostCooldowns },
};
const stateListeners = new Set();
/**
 * Load persisted monetization state from localStorage.
 *
 * Deliberately permissive, matching the original JS: `JSON.parse` output is
 * treated as `unknown` and only loosely validated (object-shaped, then
 * `Boolean(...)`/`Object.assign` coercion) rather than strictly narrowed.
 * This preserves the original's tolerance of malformed/partial persisted
 * data rather than tightening validation as part of this migration.
 */
export function loadMonetizationState() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }
    try {
        const stored = window.localStorage.getItem(MONETIZATION_STORAGE_KEY);
        if (!stored) {
            return;
        }
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
            const parsedRecord = parsed;
            currentState.premiumUnlocked = Boolean(parsedRecord.premiumUnlocked);
            const parsedCooldowns = parsedRecord.boostCooldowns;
            if (parsedCooldowns && typeof parsedCooldowns === 'object') {
                Object.assign(currentState.boostCooldowns, parsedCooldowns);
            }
        }
    }
    catch (error) {
        console.warn('Failed to load monetization state:', error);
    }
}
/**
 * Persist current monetization state to localStorage.
 */
function saveMonetizationState() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }
    try {
        window.localStorage.setItem(MONETIZATION_STORAGE_KEY, JSON.stringify(currentState));
    }
    catch (error) {
        console.warn('Failed to save monetization state:', error);
    }
}
/**
 * Notify all listeners of state changes.
 */
function notifyListeners() {
    const snapshot = getMonetizationState();
    stateListeners.forEach((listener) => {
        try {
            listener(snapshot);
        }
        catch (error) {
            console.warn('Monetization listener error:', error);
        }
    });
}
/**
 * Get a snapshot of the current monetization state.
 */
export function getMonetizationState() {
    return {
        premiumUnlocked: currentState.premiumUnlocked,
        boostCooldowns: { ...currentState.boostCooldowns },
    };
}
/**
 * Check if a specific boost is on cooldown.
 */
export function getBoostCooldown(boostType) {
    const cooldownEnd = currentState.boostCooldowns[boostType] || 0;
    const now = Date.now();
    const remainingMs = Math.max(0, cooldownEnd - now);
    return {
        onCooldown: remainingMs > 0,
        remainingMs,
    };
}
/**
 * Unlock premium features (mock in-app purchase).
 */
export function unlockPremium() {
    currentState.premiumUnlocked = true;
    saveMonetizationState();
    notifyListeners();
    return true;
}
/**
 * Start a cooldown for a specific boost type.
 */
function startBoostCooldown(boostType) {
    currentState.boostCooldowns[boostType] = Date.now() + AD_COOLDOWN_MS;
    saveMonetizationState();
    notifyListeners();
}
/**
 * Mock watching an ad (simulates ad completion after a short delay).
 */
function watchAdMock() {
    return new Promise((resolve) => {
        // Simulate ad watching with a 1 second delay
        setTimeout(() => {
            resolve(true);
        }, 1000);
    });
}
/**
 * Trigger gem boost (watch ad for 100 random gems).
 */
export async function triggerGemBoost(grantGems) {
    const cooldown = getBoostCooldown('gems');
    if (cooldown.onCooldown) {
        return { success: false, error: 'Boost on cooldown', remainingMs: cooldown.remainingMs };
    }
    // Mock ad watching
    const adWatched = await watchAdMock();
    if (!adWatched) {
        return { success: false, error: 'Ad watch failed' };
    }
    // Grant 100 random gems
    if (typeof grantGems === 'function') {
        const gemsGranted = grantGems(100);
        startBoostCooldown('gems');
        return { success: true, gemsGranted };
    }
    return { success: false, error: 'Grant function not provided' };
}
/**
 * Subscribe to monetization state changes.
 */
export function addMonetizationListener(listener) {
    if (typeof listener !== 'function') {
        return () => { };
    }
    stateListeners.add(listener);
    // Call immediately with current state
    try {
        listener(getMonetizationState());
    }
    catch (error) {
        console.warn('Monetization listener error:', error);
    }
    return () => {
        stateListeners.delete(listener);
    };
}
