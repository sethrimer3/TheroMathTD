import { ALEPH_CHAIN_DEFAULT_UPGRADES } from '../scripts/features/towers/alephChain.js';

/** Exact Aleph-chain upgrade values shared by runtime, persistence, and developer hooks. */
export interface AlephChainUpgradeSnapshot {
  x: number;
  y: number;
  z: number;
}

/** Minimal chain-registry surface synchronized after an upgrade state change or reset. */
export interface AlephChainUpgradeTarget {
  setUpgrades(upgrades: AlephChainUpgradeSnapshot): unknown;
}

/** Optional live playfield surface used by this state owner. */
export interface AlephChainUpgradePlayfield {
  alephChain?: AlephChainUpgradeTarget | null;
  syncAlephChainStats?: unknown;
}

/** Options accepted by update, restore, and reset operations. */
export interface AlephChainUpgradeApplyOptions {
  playfield?: AlephChainUpgradePlayfield | null;
}

/** Narrow unknown external payloads only as far as the original runtime did. */
function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Match `Number.isFinite` while producing a numeric type for later comparisons. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

// Track the live Aleph chain upgrade state so multiple systems can reference updates in real time.
export const alephChainUpgradeState: AlephChainUpgradeSnapshot = {
  ...ALEPH_CHAIN_DEFAULT_UPGRADES,
};

// Provide a defensive copy of the current Aleph chain upgrade values for external consumers.
export function getAlephChainUpgrades(): AlephChainUpgradeSnapshot {
  return { ...alephChainUpgradeState };
}

// Apply partial Aleph chain upgrade updates and optionally synchronize the active playfield instance.
export function updateAlephChainUpgrades(
  updates: unknown = {},
  { playfield = null }: AlephChainUpgradeApplyOptions = {},
): AlephChainUpgradeSnapshot {
  if (!isObjectRecord(updates)) {
    return getAlephChainUpgrades();
  }

  const nextState = { ...alephChainUpgradeState };
  if (isFiniteNumber(updates.x) && updates.x > 0) {
    nextState.x = updates.x;
  }
  if (isFiniteNumber(updates.y) && updates.y > 0) {
    nextState.y = updates.y;
  }
  if (isFiniteNumber(updates.z)) {
    nextState.z = Math.max(1, Math.floor(updates.z));
  }

  const changed =
    nextState.x !== alephChainUpgradeState.x ||
    nextState.y !== alephChainUpgradeState.y ||
    nextState.z !== alephChainUpgradeState.z;

  if (!changed) {
    return getAlephChainUpgrades();
  }

  alephChainUpgradeState.x = nextState.x;
  alephChainUpgradeState.y = nextState.y;
  alephChainUpgradeState.z = nextState.z;

  if (playfield?.alephChain) {
    playfield.alephChain.setUpgrades(alephChainUpgradeState);
    if (typeof playfield.syncAlephChainStats === 'function') {
      playfield.syncAlephChainStats();
    }
  }

  return getAlephChainUpgrades();
}

// Restore Aleph chain upgrades from a persisted snapshot while keeping validation centralized.
export function applyAlephChainUpgradeSnapshot(
  snapshot: unknown = {},
  { playfield = null }: AlephChainUpgradeApplyOptions = {},
): AlephChainUpgradeSnapshot {
  if (!isObjectRecord(snapshot)) {
    return getAlephChainUpgrades();
  }

  const normalized = { ...alephChainUpgradeState };
  if (isFiniteNumber(snapshot.x) && snapshot.x > 0) {
    normalized.x = snapshot.x;
  }
  if (isFiniteNumber(snapshot.y) && snapshot.y > 0) {
    normalized.y = snapshot.y;
  }
  if (isFiniteNumber(snapshot.z)) {
    normalized.z = Math.max(1, Math.floor(snapshot.z));
  }

  return updateAlephChainUpgrades(normalized, { playfield });
}

// Reset Aleph chain upgrades back to their defaults, typically during profile wipes.
export function resetAlephChainUpgrades(
  { playfield = null }: AlephChainUpgradeApplyOptions = {},
): AlephChainUpgradeSnapshot {
  alephChainUpgradeState.x = ALEPH_CHAIN_DEFAULT_UPGRADES.x;
  alephChainUpgradeState.y = ALEPH_CHAIN_DEFAULT_UPGRADES.y;
  alephChainUpgradeState.z = ALEPH_CHAIN_DEFAULT_UPGRADES.z;

  if (playfield?.alephChain) {
    playfield.alephChain.setUpgrades(alephChainUpgradeState);
    if (typeof playfield.syncAlephChainStats === 'function') {
      playfield.syncAlephChainStats();
    }
  }

  return getAlephChainUpgrades();
}
