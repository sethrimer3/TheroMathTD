// Monetization state for in-app purchases and ad-based boosts.
// Tracks premium unlock status.

export const MONETIZATION_STORAGE_KEY = 'glyph-defense-idle:monetization';

export interface MonetizationState {
  premiumUnlocked: boolean;
}

/** Snapshot returned by {@link getMonetizationState} (a clone, not a live reference). */
export type MonetizationStateSnapshot = MonetizationState;

export type MonetizationStateListener = (snapshot: MonetizationStateSnapshot) => void;
export type UnsubscribeFn = () => void;

// Default state structure
const DEFAULT_STATE: MonetizationState = {
  premiumUnlocked: false,
};

// In-memory state
let currentState: MonetizationState = { ...DEFAULT_STATE };
const stateListeners = new Set<MonetizationStateListener>();

/**
 * Load persisted monetization state from localStorage.
 *
 * Deliberately permissive, matching the original JS: `JSON.parse` output is
 * treated as `unknown` and only loosely validated (object-shaped, then
 * `Boolean(...)`/`Object.assign` coercion) rather than strictly narrowed.
 * This preserves the original's tolerance of malformed/partial persisted
 * data rather than tightening validation as part of this migration.
 */
export function loadMonetizationState(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const stored = window.localStorage.getItem(MONETIZATION_STORAGE_KEY);
    if (!stored) {
      return;
    }

    const parsed: unknown = JSON.parse(stored);
    if (parsed && typeof parsed === 'object') {
      const parsedRecord = parsed as Record<string, unknown>;
      currentState.premiumUnlocked = Boolean(parsedRecord.premiumUnlocked);
    }
  } catch (error) {
    console.warn('Failed to load monetization state:', error);
  }
}

/**
 * Persist current monetization state to localStorage.
 */
function saveMonetizationState(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(MONETIZATION_STORAGE_KEY, JSON.stringify(currentState));
  } catch (error) {
    console.warn('Failed to save monetization state:', error);
  }
}

/**
 * Notify all listeners of state changes.
 */
function notifyListeners(): void {
  const snapshot = getMonetizationState();
  stateListeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (error) {
      console.warn('Monetization listener error:', error);
    }
  });
}

/**
 * Get a snapshot of the current monetization state.
 */
export function getMonetizationState(): MonetizationStateSnapshot {
  return {
    premiumUnlocked: currentState.premiumUnlocked,
  };
}

/**
 * Unlock premium features (mock in-app purchase).
 */
export function unlockPremium(): boolean {
  currentState.premiumUnlocked = true;
  saveMonetizationState();
  notifyListeners();
  return true;
}

/**
 * Subscribe to monetization state changes.
 */
export function addMonetizationListener(listener: MonetizationStateListener): UnsubscribeFn {
  if (typeof listener !== 'function') {
    return () => {};
  }

  stateListeners.add(listener);

  // Call immediately with current state
  try {
    listener(getMonetizationState());
  } catch (error) {
    console.warn('Monetization listener error:', error);
  }

  return () => {
    stateListeners.delete(listener);
  };
}
