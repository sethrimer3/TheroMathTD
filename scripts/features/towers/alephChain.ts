/**
 * Aleph Null chain management utilities.
 *
 * This module centralizes the math for chaining Aleph Null towers so the
 * gameplay loop can scale to mobile-first inputs while remaining portable to
 * a desktop build. It exposes a tiny registry that tracks the order Aleph Null
 * lattices are placed, calculates their squared totals, and provides upgrade
 * hooks for range (x), attack speed (y), and chain length (z).
 */

/** Upgrade multipliers applied across every Aleph Null chain. */
export interface AlephChainUpgrades {
  /** Range multiplier applied to each Aleph Null chain hop. */
  x: number;
  /** Attack-speed multiplier applied to the base fire rate. */
  y: number;
  /** Number of enemies struck per firing sequence (minimum 1). */
  z: number;
}

/** Chain state computed for one registered Aleph Null tower. */
export interface AlephChainState {
  towerId: string;
  index: number;
  baseDamage: number;
  totalDamage: number;
  rangeMultiplier: number;
  speedMultiplier: number;
  linkCount: number;
}

/** Options accepted when constructing a chain registry. */
export interface AlephChainRegistryOptions {
  upgrades?: Partial<AlephChainUpgrades> | null;
}

interface AlephChainTowerEntry {
  id: string;
  baseDamage: number;
}

export const ALEPH_CHAIN_DEFAULT_UPGRADES: Readonly<AlephChainUpgrades> = Object.freeze({
  /** Range multiplier applied to each Aleph Null chain hop. */
  x: 1.0,
  /** Attack-speed multiplier applied to the base fire rate. */
  y: 1.0,
  /** Number of enemies struck per firing sequence (minimum 1). */
  z: 3,
});

/** Match `Number.isFinite` while narrowing optional upgrade fields to numbers. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function clampMultiplier(value: number | undefined, fallback: number): number {
  if (!isFiniteNumber(value) || value <= 0) {
    return fallback;
  }
  return value;
}

function normalizeUpgradeSet(upgrades: Partial<AlephChainUpgrades> | null = {}): AlephChainUpgrades {
  const source = upgrades || {};
  return {
    x: clampMultiplier(source.x, ALEPH_CHAIN_DEFAULT_UPGRADES.x),
    y: clampMultiplier(source.y, ALEPH_CHAIN_DEFAULT_UPGRADES.y),
    z: Math.max(1, Math.floor(isFiniteNumber(source.z) ? source.z : ALEPH_CHAIN_DEFAULT_UPGRADES.z)),
  };
}

function safeSquare(value: number): number {
  if (!Number.isFinite(value)) {
    return Number.MAX_VALUE;
  }
  const result = value * value;
  if (!Number.isFinite(result)) {
    return Number.MAX_VALUE;
  }
  return Math.min(result, Number.MAX_VALUE);
}

class AlephChainRegistry {
  upgrades: AlephChainUpgrades;
  towerOrder: AlephChainTowerEntry[];
  states: Map<string, AlephChainState>;

  constructor(options: AlephChainRegistryOptions = {}) {
    const { upgrades } = options;
    this.upgrades = normalizeUpgradeSet(upgrades);
    this.towerOrder = [];
    this.states = new Map();
  }

  reset(): void {
    this.towerOrder = [];
    this.states.clear();
  }

  registerTower(towerId: string | null | undefined, baseDamage: number): AlephChainState | null {
    if (!towerId) {
      return null;
    }
    const index = this.towerOrder.findIndex((entry) => entry.id === towerId);
    const normalizedDamage = Number.isFinite(baseDamage) ? baseDamage : 0;
    if (index >= 0) {
      this.towerOrder[index].baseDamage = normalizedDamage;
    } else {
      this.towerOrder.push({ id: towerId, baseDamage: normalizedDamage });
    }
    this.recomputeTotals();
    return this.states.get(towerId) || null;
  }

  unregisterTower(towerId: string | null | undefined): void {
    if (!towerId) {
      return;
    }
    const index = this.towerOrder.findIndex((entry) => entry.id === towerId);
    if (index >= 0) {
      this.towerOrder.splice(index, 1);
      this.recomputeTotals();
    }
  }

  setUpgrades(upgrades: Partial<AlephChainUpgrades> | null = {}): void {
    this.upgrades = normalizeUpgradeSet({ ...this.upgrades, ...(upgrades || {}) });
    this.recomputeTotals();
  }

  getState(towerId: string | null | undefined): AlephChainState | null {
    return towerId ? this.states.get(towerId) || null : null;
  }

  getAllStates(): Map<string, AlephChainState> {
    return new Map(this.states);
  }

  getRangeMultiplier(): number {
    return this.upgrades.x;
  }

  getSpeedMultiplier(): number {
    return this.upgrades.y;
  }

  getLinkCount(): number {
    return this.upgrades.z;
  }

  recomputeTotals(): void {
    const nextStates = new Map<string, AlephChainState>();
    let previousTotal: number | null = null;

    this.towerOrder.forEach((entry, index) => {
      const baseDamage = Number.isFinite(entry.baseDamage) ? entry.baseDamage : 0;
      const totalDamage = index === 0 ? baseDamage : safeSquare(previousTotal ?? baseDamage);
      const state: AlephChainState = {
        towerId: entry.id,
        index,
        baseDamage,
        totalDamage,
        rangeMultiplier: this.upgrades.x,
        speedMultiplier: this.upgrades.y,
        linkCount: this.upgrades.z,
      };
      nextStates.set(entry.id, state);
      previousTotal = totalDamage;
    });

    this.states = nextStates;
  }
}

export function createAlephChainRegistry(options: AlephChainRegistryOptions = {}): AlephChainRegistry {
  return new AlephChainRegistry(options);
}

export { AlephChainRegistry };
