// Monetization state for in-app purchases and ad-based boosts.
// Tracks premium unlock status and cooldowns for boost actions.

export const MONETIZATION_STORAGE_KEY = 'glyph-defense-idle:monetization';

// Spire identifiers matching the spire system
const SPIRE_IDS = ['powder', 'fluid', 'lamed', 'tsadi', 'shin', 'kuf'] as const;

/** Literal union of spire ids that can be idle-boosted, derived from the canonical list. */
export type SpireId = (typeof SPIRE_IDS)[number];

/** The boost-cooldown keys: every spire id plus the standalone gem-boost cooldown. */
export type BoostType = SpireId | 'gems';

// Cooldown duration for ad-based boosts (in milliseconds)
const AD_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown

export type BoostCooldownState = Record<BoostType, number>;

export interface MonetizationState {
  premiumUnlocked: boolean;
  boostCooldowns: BoostCooldownState;
}

/** Snapshot returned by {@link getMonetizationState} (a clone, not a live reference). */
export type MonetizationStateSnapshot = MonetizationState;

export type MonetizationStateListener = (snapshot: MonetizationStateSnapshot) => void;
export type UnsubscribeFn = () => void;

export interface BoostCooldownResult {
  onCooldown: boolean;
  remainingMs: number;
}

export type BoostCooldownErrorReason = 'Invalid spire ID' | 'Boost on cooldown' | 'Ad watch failed' | 'Grant function not provided';

export interface BoostErrorResult {
  success: false;
  error: BoostCooldownErrorReason;
  remainingMs?: number;
}

export type SpireBoostResult =
  | ({ success: true; idleTimeSeconds: number })
  | BoostErrorResult;

export type GemBoostResult =
  | ({ success: true; gemsGranted: number })
  | BoostErrorResult;

export type ApplyIdleTimeFn = ((spireId: SpireId, idleTimeSeconds: number) => void) | null | undefined;
export type GrantGemsFn = ((amount: number) => number) | null | undefined;

// Default state structure
const DEFAULT_STATE: MonetizationState = {
  premiumUnlocked: false,
  boostCooldowns: {
    powder: 0,
    fluid: 0,
    lamed: 0,
    tsadi: 0,
    shin: 0,
    kuf: 0,
    gems: 0,
  },
};

// In-memory state
let currentState: MonetizationState = {
  ...DEFAULT_STATE,
  boostCooldowns: { ...DEFAULT_STATE.boostCooldowns },
};
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
      const parsedCooldowns = parsedRecord.boostCooldowns;
      if (parsedCooldowns && typeof parsedCooldowns === 'object') {
        Object.assign(currentState.boostCooldowns, parsedCooldowns as Partial<BoostCooldownState>);
      }
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
    boostCooldowns: { ...currentState.boostCooldowns },
  };
}

/**
 * Check if a specific boost is on cooldown.
 */
export function getBoostCooldown(boostType: BoostType): BoostCooldownResult {
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
export function unlockPremium(): boolean {
  currentState.premiumUnlocked = true;
  saveMonetizationState();
  notifyListeners();
  return true;
}

/**
 * Start a cooldown for a specific boost type.
 */
function startBoostCooldown(boostType: BoostType): void {
  currentState.boostCooldowns[boostType] = Date.now() + AD_COOLDOWN_MS;
  saveMonetizationState();
  notifyListeners();
}

/**
 * Mock watching an ad (simulates ad completion after a short delay).
 */
function watchAdMock(): Promise<boolean> {
  return new Promise((resolve) => {
    // Simulate ad watching with a 1 second delay
    setTimeout(() => {
      resolve(true);
    }, 1000);
  });
}

/**
 * Trigger a spire idle boost (watch ad for 2 hours of idle time).
 */
export async function triggerSpireBoost(
  spireId: string,
  applyIdleTime: ApplyIdleTimeFn,
): Promise<SpireBoostResult> {
  if (!(SPIRE_IDS as readonly string[]).includes(spireId)) {
    return { success: false, error: 'Invalid spire ID' };
  }

  const cooldown = getBoostCooldown(spireId as SpireId);
  if (cooldown.onCooldown) {
    return { success: false, error: 'Boost on cooldown', remainingMs: cooldown.remainingMs };
  }

  // Mock ad watching
  const adWatched = await watchAdMock();
  if (!adWatched) {
    return { success: false, error: 'Ad watch failed' };
  }

  // Apply 2 hours of idle time (in seconds)
  const idleTimeSeconds = 2 * 60 * 60;
  if (typeof applyIdleTime === 'function') {
    applyIdleTime(spireId as SpireId, idleTimeSeconds);
  }

  // Start cooldown
  startBoostCooldown(spireId as SpireId);

  return { success: true, idleTimeSeconds };
}

/**
 * Trigger gem boost (watch ad for 100 random gems).
 */
export async function triggerGemBoost(grantGems: GrantGemsFn): Promise<GemBoostResult> {
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
