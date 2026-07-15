import type {
  AlephChainUpgradeApplyOptions,
  AlephChainUpgradePlayfield,
  AlephChainUpgradeSnapshot,
} from './alephUpgradeState.js';

/** Mutable story flag owned by the surviving Well and Achievements state branches. */
export interface MutableStoryState {
  storySeen: boolean;
}

/** Story-state shape read from compatibility aliases during serialization or restoration. */
export interface StoryStateSource {
  storySeen?: unknown;
}

/** Minimal live state surface this persistence adapter reads and mutates. */
export interface SpireResourcePersistenceState {
  wellOfInspiration?: MutableStoryState | null;
  powder?: StoryStateSource | null;
  achievements: MutableStoryState;
}

/** Unvalidated mote-gem record supplied by the enemy/inventory subsystem. */
export interface MoteGemRecordSource {
  label?: unknown;
  total?: unknown;
  count?: unknown;
}

/** Minimal mutable mote-gem state surface owned by `assets/enemies.js`. */
export interface MoteGemPersistenceState {
  inventory: Map<string, MoteGemRecordSource>;
  autoCollectUnlocked: unknown;
  autoCollectDelayMs: unknown;
}

/** Exact serialized Well story branch emitted by this module. */
export interface SerializedWellStoryState {
  unlocked: true;
  storySeen: boolean;
}

/** Exact serialized Achievements story branch emitted by this module. */
export interface SerializedAchievementStoryState {
  storySeen: boolean;
}

/** Exact serialized inventory record emitted for one mote-gem id. */
export interface SerializedMoteGemRecord {
  gemId: string;
  label: string;
  total: number;
  count: number;
}

/** Exact serialized mote-gem branch emitted by this module. */
export interface SerializedMoteGemState {
  inventory: SerializedMoteGemRecord[];
  autoCollectUnlocked: boolean;
  autoCollectDelayMs: number;
}

/** Complete Spire-resource snapshot currently owned by the post-retirement module. */
export interface SpireResourceStateSnapshot {
  wellOfInspiration: SerializedWellStoryState;
  achievements: SerializedAchievementStoryState;
  moteGems: SerializedMoteGemState;
}

/**
 * Legacy/untrusted save envelope accepted by restoration. Retired branches are
 * intentionally not modeled because this module ignores them; the named fields
 * below are the only compatibility aliases it still reads.
 */
export interface LegacySpireResourceStateSnapshot {
  wellOfInspiration?: unknown;
  powder?: unknown;
  alephSpire?: unknown;
  aleph?: unknown;
  achievements?: unknown;
  moteGems?: unknown;
  [key: string]: unknown;
}

/** Autosave input accepted by the current and legacy Spire-resource restore path. */
export type SpireResourceStateSnapshotInput =
  | SpireResourceStateSnapshot
  | LegacySpireResourceStateSnapshot;

/** Opaque base tower snapshot owned by `assets/towerBlueprintPresenter.js`. */
export type ExternalTowerUpgradeSnapshot = Record<string, unknown>;

/** Exact wrapper emitted after adding Aleph-chain state to the base tower snapshot. */
export type TowerUpgradeSnapshotWithAleph = ExternalTowerUpgradeSnapshot & {
  alephChainUpgrades: AlephChainUpgradeSnapshot;
};

/** Autosave tower-upgrade input, including historical snapshots without Aleph data. */
export type TowerUpgradeSnapshotInput = ExternalTowerUpgradeSnapshot & {
  alephChainUpgrades?: unknown;
};

/** Dependencies injected by `assets/main.js` into the persistence adapter. */
export interface SpireResourcePersistenceDependencies {
  spireResourceState: SpireResourcePersistenceState;
  moteGemState: MoteGemPersistenceState;
  getTowerUpgradeStateSnapshot: () => ExternalTowerUpgradeSnapshot;
  applyTowerUpgradeStateSnapshot: (snapshot: ExternalTowerUpgradeSnapshot) => void;
  getAlephChainUpgrades: () => AlephChainUpgradeSnapshot;
  applyAlephChainUpgradeSnapshot: (
    snapshot: unknown,
    options: AlephChainUpgradeApplyOptions,
  ) => AlephChainUpgradeSnapshot;
  getPlayfield: () => AlephChainUpgradePlayfield | null;
}

/** Public controller returned to the bootstrap and then wired into autosave. */
export interface SpireResourcePersistenceController {
  getTowerUpgradeStateSnapshotWithAleph: () => TowerUpgradeSnapshotWithAleph;
  applyTowerUpgradeStateSnapshotWithAleph: (snapshot: unknown) => void;
  getSpireResourceStateSnapshot: () => SpireResourceStateSnapshot;
  applySpireResourceStateSnapshot: (snapshot: unknown) => void;
}

/** Match `Number.isFinite`'s accepted numeric domain while narrowing unknown input. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Preserve the original truthy-object checks while giving property reads an honest boundary. */
function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Read a property from untrusted legacy JSON without inventing validation it never had. */
function readLegacyProperty(value: unknown, key: string): unknown {
  return isObjectRecord(value) ? value[key] : undefined;
}

/**
 * Persist the surviving Well of Inspiration story state, mote gems, and tower upgrades.
 * Legacy snapshots may contain retired spire branches; those branches are intentionally ignored.
 */
export function createSpireResourcePersistence({
  spireResourceState,
  moteGemState,
  getTowerUpgradeStateSnapshot,
  applyTowerUpgradeStateSnapshot,
  getAlephChainUpgrades,
  applyAlephChainUpgradeSnapshot,
  getPlayfield,
}: SpireResourcePersistenceDependencies): SpireResourcePersistenceController {
  /** Preserve the base tower snapshot while adding the Aleph-chain branch. */
  function getTowerUpgradeStateSnapshotWithAleph(): TowerUpgradeSnapshotWithAleph {
    return {
      ...getTowerUpgradeStateSnapshot(),
      alephChainUpgrades: getAlephChainUpgrades(),
    };
  }

  /** Restore base tower upgrades first, then restore a valid Aleph-chain branch. */
  function applyTowerUpgradeStateSnapshotWithAleph(snapshot: unknown): void {
    if (!isObjectRecord(snapshot)) return;
    applyTowerUpgradeStateSnapshot(snapshot);
    const alephChainUpgrades = snapshot.alephChainUpgrades;
    if (alephChainUpgrades && isObjectRecord(alephChainUpgrades)) {
      applyAlephChainUpgradeSnapshot(alephChainUpgrades, { playfield: getPlayfield() });
    }
  }

  /** Serialize the exact post-retirement story and mote-gem state. */
  function getSpireResourceStateSnapshot(): SpireResourceStateSnapshot {
    const wellState = spireResourceState.wellOfInspiration || spireResourceState.powder || {};
    return {
      wellOfInspiration: {
        unlocked: true,
        storySeen: Boolean(readLegacyProperty(wellState, 'storySeen')),
      },
      achievements: {
        storySeen: Boolean(spireResourceState.achievements?.storySeen),
      },
      moteGems: {
        inventory: Array.from(moteGemState.inventory.entries()).map(([gemId, record = {}]) => ({
          gemId,
          label: typeof record.label === 'string' ? record.label : gemId,
          total: isFiniteNumber(record.total) ? Math.max(0, record.total) : 0,
          count: isFiniteNumber(record.count) ? Math.max(0, Math.floor(record.count)) : 0,
        })),
        autoCollectUnlocked: Boolean(moteGemState.autoCollectUnlocked),
        autoCollectDelayMs: isFiniteNumber(moteGemState.autoCollectDelayMs)
          ? Math.max(0, Math.floor(moteGemState.autoCollectDelayMs))
          : 0,
      },
    };
  }

  /** Restore current and legacy story/mote-gem snapshots with the existing normalization rules. */
  function applySpireResourceStateSnapshot(snapshot: unknown): void {
    if (!isObjectRecord(snapshot)) return;
    const legacyWell =
      snapshot.wellOfInspiration || snapshot.powder || snapshot.alephSpire || snapshot.aleph || {};

    // The live state factory always creates this mutable branch. It is optional
    // in the dependency interface only so serialization can preserve its powder fallback.
    const liveWell = spireResourceState.wellOfInspiration as MutableStoryState;
    liveWell.storySeen = Boolean(readLegacyProperty(legacyWell, 'storySeen') || liveWell.storySeen);
    spireResourceState.achievements.storySeen = Boolean(
      readLegacyProperty(snapshot.achievements, 'storySeen') || spireResourceState.achievements.storySeen,
    );

    const moteGemBranch = snapshot.moteGems || {};
    const inventory = readLegacyProperty(moteGemBranch, 'inventory');
    if (Array.isArray(inventory)) {
      moteGemState.inventory.clear();
      inventory.forEach((entry) => {
        const rawGemId = readLegacyProperty(entry, 'gemId');
        const gemId = typeof rawGemId === 'string' ? rawGemId.trim() : '';
        if (!gemId) return;

        const rawLabel = readLegacyProperty(entry, 'label');
        const rawTotal = readLegacyProperty(entry, 'total');
        const rawCount = readLegacyProperty(entry, 'count');
        moteGemState.inventory.set(gemId, {
          label: typeof rawLabel === 'string' && rawLabel.trim() ? rawLabel.trim() : gemId,
          total: isFiniteNumber(rawTotal) ? Math.max(0, rawTotal) : 0,
          count: isFiniteNumber(rawCount) ? Math.max(0, Math.floor(rawCount)) : 0,
        });
      });
    }

    const savedAutoCollectUnlocked = readLegacyProperty(moteGemBranch, 'autoCollectUnlocked');
    moteGemState.autoCollectUnlocked = Boolean(
      savedAutoCollectUnlocked || moteGemState.autoCollectUnlocked,
    );
    const savedAutoCollectDelayMs = readLegacyProperty(moteGemBranch, 'autoCollectDelayMs');
    if (isFiniteNumber(savedAutoCollectDelayMs)) {
      moteGemState.autoCollectDelayMs = Math.max(0, Math.floor(savedAutoCollectDelayMs));
    }
  }

  return {
    getTowerUpgradeStateSnapshotWithAleph,
    applyTowerUpgradeStateSnapshotWithAleph,
    getSpireResourceStateSnapshot,
    applySpireResourceStateSnapshot,
  };
}
