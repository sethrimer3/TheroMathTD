import type {
  AlephChainUpgradeApplyOptions,
  AlephChainUpgradePlayfield,
  AlephChainUpgradeSnapshot,
} from './alephUpgradeState.js';
import type {
  SerializedTowerUpgradeState,
  TowerUpgradeStateSnapshot,
  TowerUpgradeStateSnapshotInput,
} from './towerBlueprintPresenter.js';

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

/** Exact serialized Well story branch emitted by this module. */
export interface SerializedWellStoryState {
  unlocked: true;
  storySeen: boolean;
}

/** Exact serialized Achievements story branch emitted by this module. */
export interface SerializedAchievementStoryState {
  storySeen: boolean;
}

/** Complete Spire-resource snapshot currently owned by the post-retirement module. */
export interface SpireResourceStateSnapshot {
  wellOfInspiration: SerializedWellStoryState;
  achievements: SerializedAchievementStoryState;
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
  [key: string]: unknown;
}

/** Autosave input accepted by the current and legacy Spire-resource restore path. */
export type SpireResourceStateSnapshotInput =
  | SpireResourceStateSnapshot
  | LegacySpireResourceStateSnapshot;

/** Exact persistence-owned wrapper emitted after adding Aleph state to base tower entries. */
export interface TowerUpgradeSnapshotWithAleph {
  [towerId: string]: SerializedTowerUpgradeState | AlephChainUpgradeSnapshot;
  alephChainUpgrades: AlephChainUpgradeSnapshot;
}

/** Autosave tower-upgrade input, including historical snapshots without Aleph data. */
export type TowerUpgradeSnapshotInput = TowerUpgradeStateSnapshotInput;

/** Dependencies injected by `assets/main.js` into the persistence adapter. */
export interface SpireResourcePersistenceDependencies {
  spireResourceState: SpireResourcePersistenceState;
  getTowerUpgradeStateSnapshot: () => TowerUpgradeStateSnapshot;
  applyTowerUpgradeStateSnapshot: (snapshot: TowerUpgradeStateSnapshotInput) => void;
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

/** Preserve the original truthy-object checks while giving property reads an honest boundary. */
function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Read a property from untrusted legacy JSON without inventing validation it never had. */
function readLegacyProperty(value: unknown, key: string): unknown {
  return isObjectRecord(value) ? value[key] : undefined;
}

/**
 * Persist the surviving Well of Inspiration story state and tower upgrades.
 * Legacy snapshots may contain retired spire branches; those branches are intentionally ignored.
 */
export function createSpireResourcePersistence({
  spireResourceState,
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

  /** Serialize the surviving story state. */
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
    };
  }

  /** Restore current and legacy story snapshots with the existing normalization rules. */
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

  }

  return {
    getTowerUpgradeStateSnapshotWithAleph,
    applyTowerUpgradeStateSnapshotWithAleph,
    getSpireResourceStateSnapshot,
    applySpireResourceStateSnapshot,
  };
}
