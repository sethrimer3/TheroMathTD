/**
 * Shared contract for every static tower-definition module under
 * `assets/data/towers/`. Inventoried from all ~33 tower files plus their
 * consumers (`assets/configuration.js`, `assets/towersTab.js`,
 * `assets/towerLoadoutController.js`, `assets/towerUpgradeOverlayController.js`,
 * `assets/upgradeMatrixOverlay.js`) before authoring this interface, so every
 * field below is a field some tower or consumer actually reads/writes today.
 */
export interface TowerDefinition {
  /** Stable identifier used as the tower's key everywhere (menus, saves, upgrade chains). */
  readonly id: string;
  /** Greek-letter/glyph symbol shown in UI. */
  readonly symbol: string;
  /** Display name shown in UI. */
  readonly name: string;
  /** Numeric progression tier; 0 is used by the gates and the two experimental T-towers. */
  readonly tier: number;
  /** Optional display override for the tier badge (e.g. "Origin" for the gates). */
  readonly tierLabel?: string;
  /** Whether the player can place this tower directly. Gates default this to `false`; most towers omit it (implicitly placeable). */
  readonly placeable?: boolean;
  readonly baseCost: number;
  readonly damage: number;
  readonly rate: number;
  /** Range expressed as a fraction of the playfield (canvas-relative unit used by most towers). */
  readonly range: number;
  /** Absolute range in meters, only present on towers whose range is authored in real-world units (e.g. Lambda). */
  readonly rangeMeters?: number;
  /** Footprint diameter in meters, only present when it differs from the implicit default. */
  readonly diameterMeters?: number;
  readonly icon: string;
  /** Id of the tower this one upgrades into. `null` marks the end of a chain (e.g. Infinity); omitted entirely on towers with no successor (T1/T2). */
  readonly nextTierId?: string | null;
  /** Flavor/mechanic description shown in tooltips for towers that have one (gates, graph-based test arsenal). */
  readonly description?: string;
}
