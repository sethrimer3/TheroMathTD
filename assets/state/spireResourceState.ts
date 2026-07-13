// Centralized builder for advanced spire resource banks.

/**
 * Opaque, subsystem-owned snapshot of a running Lamed gravity simulation.
 * The Lamed playfield (assets/lamedGravitySim.js and related simulation code)
 * owns this schema; it is serialized verbatim here only so tab switches can
 * resume seamlessly. Shape is intentionally not modeled from this module.
 */
export type LamedSimulationSnapshot = unknown;

/** Generic unlock/story state shared by branches with no additional fields (powder, shin, kuf). */
export interface GenericSpireBranchState {
  unlocked: boolean;
  storySeen: boolean;
}

export interface LamedUpgradeState {
  starMass: number;
}

export interface LamedStatsState {
  totalAbsorptions: number;
  totalMassGained: number;
  starMilestoneReached: number;
}

export interface LamedSpireState {
  unlocked: boolean;
  storySeen: boolean;
  dragLevel: number;
  starMass: number;
  upgrades: LamedUpgradeState;
  stats: LamedStatsState;
  /** Serialized snapshot of the active gravity simulation so tab switches can resume seamlessly. */
  simulationSnapshot: LamedSimulationSnapshot | null;
}

export interface TsadiStatsState {
  totalParticles: number;
  totalGlyphs: number;
  highestTier: number;
}

export interface TsadiSpireState {
  unlocked: boolean;
  storySeen: boolean;
  bindingAgents: number;
  /**
   * Opaque, subsystem-owned list of discovered molecule descriptors. Owned by
   * assets/tsadiMoleculeNameGenerator.js / assets/spireResourcePersistence.js,
   * which normalize/serialize the actual entry shape; not modeled here.
   */
  discoveredMolecules: unknown[];
  stats: TsadiStatsState;
  /** Serialized snapshot of the particle fusion sandbox for pause/resume flows. */
  simulationSnapshot: unknown;
}

/**
 * Opaque, subsystem-owned map of Fluid/Bet particle generators. Owned by
 * assets/spireResourceBanks.js / the Bet spire render instance; not modeled here.
 */
export type FluidGeneratorMap = Record<string, unknown>;

export interface FluidSpireState {
  unlocked: boolean;
  storySeen: boolean;
  /** Particle generators for BET spire upgrade menu. */
  generators: FluidGeneratorMap;
  /** Next milestone for BET glyph awards. */
  particleFactorMilestone: number;
  /** Total BET glyphs awarded from particle factor. */
  betGlyphsAwarded: number;
  /** Nullstone crunches increase the particle factor exponent by tiny increments. */
  particleFactorExponentBonus: number;
}

/** Complete spire resource state returned by {@link createSpireResourceState}. */
export interface SpireResourceState {
  powder: GenericSpireBranchState;
  fluid: FluidSpireState;
  lamed: LamedSpireState;
  tsadi: TsadiSpireState;
  shin: GenericSpireBranchState;
  kuf: GenericSpireBranchState;
}

/**
 * Recursive partial-override input accepted by {@link createSpireResourceState},
 * e.g. previously-saved state used to hydrate defaults without mutating them.
 */
export interface SpireResourceStateOverrides {
  powder?: Partial<GenericSpireBranchState>;
  fluid?: Partial<Omit<FluidSpireState, 'generators'>> & { generators?: FluidGeneratorMap };
  lamed?: Partial<Omit<LamedSpireState, 'upgrades' | 'stats'>> & {
    upgrades?: Partial<LamedUpgradeState>;
    stats?: Partial<LamedStatsState>;
  };
  tsadi?: Partial<Omit<TsadiSpireState, 'stats'>> & { stats?: Partial<TsadiStatsState> };
  shin?: Partial<GenericSpireBranchState>;
  kuf?: Partial<GenericSpireBranchState>;
}

const DEFAULT_LAMED_STATE: LamedSpireState = {
  unlocked: false,
  storySeen: false,
  dragLevel: 0,
  starMass: 10,
  upgrades: { starMass: 0 },
  stats: {
    totalAbsorptions: 0,
    totalMassGained: 0,
    starMilestoneReached: 0,
  },
  // Serialized snapshot of the active gravity simulation so tab switches can resume seamlessly.
  simulationSnapshot: null,
};

const DEFAULT_TSADI_STATE: TsadiSpireState = {
  unlocked: false,
  storySeen: false,
  bindingAgents: 0,
  discoveredMolecules: [],
  stats: {
    totalParticles: 0,
    totalGlyphs: 0,
    highestTier: 0,
  },
  // Serialized snapshot of the particle fusion sandbox for pause/resume flows.
  simulationSnapshot: null,
};

const DEFAULT_GENERIC_STATE: GenericSpireBranchState = {
  unlocked: false,
  storySeen: false,
};

const DEFAULT_FLUID_STATE: FluidSpireState = {
  unlocked: false,
  storySeen: false,
  generators: {}, // Particle generators for BET spire upgrade menu
  particleFactorMilestone: 100, // Next milestone for BET glyph awards
  betGlyphsAwarded: 0, // Total BET glyphs awarded from particle factor
  particleFactorExponentBonus: 0, // Nullstone crunches increase the particle factor exponent by tiny increments.
};

/**
 * Merge a branch's default state with a partial override, preserving the
 * original's shallow-copy/precedence semantics exactly:
 *  - top-level fields: override wins over base (shallow spread).
 *  - `upgrades`/`stats`/`generators`: separately shallow-merged (override's
 *    nested fields win over base's, base's non-overridden nested fields survive).
 *    This means a partially-specified nested object (e.g. only `stats.highestTier`)
 *    does NOT drop the other nested fields — this is existing, preserved behavior,
 *    not a designed invariant to rely on elsewhere.
 */
function mergeBranch<T extends { upgrades?: object; stats?: object; generators?: object }>(
  base: T,
  overrides: Partial<T> = {},
): T {
  return {
    ...base,
    ...overrides,
    upgrades: {
      ...((base as { upgrades?: object }).upgrades || {}),
      ...((overrides as { upgrades?: object }).upgrades || {}),
    },
    stats: {
      ...((base as { stats?: object }).stats || {}),
      ...((overrides as { stats?: object }).stats || {}),
    },
    generators: {
      ...((base as { generators?: object }).generators || {}),
      ...((overrides as { generators?: object }).generators || {}),
    },
  } as T;
}

/**
 * Produces the shared spire resource container with optional overrides so the
 * playfield can hydrate previously saved state without mutating defaults.
 */
export function createSpireResourceState(
  overrides: SpireResourceStateOverrides = {},
): SpireResourceState {
  return {
    powder: {
      ...DEFAULT_GENERIC_STATE,
      ...(overrides.powder || {}),
    },
    fluid: mergeBranch(DEFAULT_FLUID_STATE, overrides.fluid as Partial<FluidSpireState>),
    lamed: mergeBranch(DEFAULT_LAMED_STATE, overrides.lamed as Partial<LamedSpireState>),
    tsadi: mergeBranch(DEFAULT_TSADI_STATE, overrides.tsadi as Partial<TsadiSpireState>),
    shin: {
      ...DEFAULT_GENERIC_STATE,
      ...(overrides.shin || {}),
    },
    kuf: {
      ...DEFAULT_GENERIC_STATE,
      ...(overrides.kuf || {}),
    },
  };
}
