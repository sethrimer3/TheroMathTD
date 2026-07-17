import { DEFAULT_MOTE_PALETTE, mergeMotePalette } from '../../scripts/features/towers/powderTower.js';

/** Static tuning constants for the Well of Inspiration simulation. */
export interface PowderConfig {
  sandOffsetInactive: number;
  sandOffsetActive: number;
  duneHeightBase: number;
  duneHeightMax: number;
  thetaBase: number;
  zetaBase: number;
  simulatedDuneGainMax: number;
  wallBaseGapMotes: number;
  wallGapPerGlyph: number;
  wallMaxGapMotes: number;
  alephTierAdvanceCount: number;
  alephWallTierMin: number;
  alephWallTierMax: number;
  wallGapViewportRatio: number;
}

/** Mutable Aleph tier transition bookkeeping. */
export interface AlephTierTransitionState {
  active: boolean;
  stage: string;
  triggerGlyphCount: number;
  lockedGlyphsLit: number | null;
  sourceTier: number;
  targetTier: number;
  timers: unknown[];
}

/**
 * Mutable Well runtime state. Persistence restores legacy payloads through a
 * string-indexed write path, so the index signature stays permissive while the
 * named fields describe the authored defaults.
 */
export interface PowderState {
  sandOffset: number;
  duneHeight: number;
  charges: number;
  simulatedDuneGain: number;
  wallGlyphsLit: number;
  alephWallTier: number;
  alephTierAlephValue: number;
  glyphsAwarded: number;
  pendingMoteDrops: unknown[];
  motePalette: unknown;
  simulationMode: string;
  wallGapTarget: number;
  modeSwitchPending: boolean;
  viewInteraction: unknown;
  viewTransform: unknown;
  alephCameraMode: boolean;
  loadedSimulationState: unknown;
  initialLoadRestored: boolean;
  alephTierTransition: AlephTierTransitionState;
  alephTierTransitionCheckpoint: number;
  [key: string]: unknown;
}

/** DOM element references registered by the Well UI once it mounts. */
export type PowderElements = Record<string, unknown>;

/** Runtime context returned to the bootstrap sequence. */
export interface PowderStateContext {
  powderConfig: PowderConfig;
  powderState: PowderState;
  powderGlyphColumns: unknown[];
  getPowderElements: () => PowderElements | null;
  setPowderElements: (elements: PowderElements | null) => void;
}

/** Build the runtime state for the sole surviving spire, the Well of Inspiration. */
export function createPowderStateContext(): PowderStateContext {
  const powderConfig: PowderConfig = {
    sandOffsetInactive: 0,
    sandOffsetActive: 1,
    duneHeightBase: 1,
    duneHeightMax: 6,
    thetaBase: 1.3,
    zetaBase: 1.6,
    simulatedDuneGainMax: 3.4,
    wallBaseGapMotes: 5,
    wallGapPerGlyph: 1,
    wallMaxGapMotes: 75,
    alephTierAdvanceCount: 30,
    alephWallTierMin: 1,
    alephWallTierMax: 15,
    wallGapViewportRatio: 0.15,
  };

  const powderState: PowderState = {
    sandOffset: powderConfig.sandOffsetActive,
    duneHeight: powderConfig.duneHeightBase,
    charges: 0,
    simulatedDuneGain: 0,
    wallGlyphsLit: 0,
    alephWallTier: 1,
    alephTierAlephValue: 0,
    glyphsAwarded: 0,
    pendingMoteDrops: [],
    motePalette: mergeMotePalette(DEFAULT_MOTE_PALETTE),
    simulationMode: 'sand',
    wallGapTarget: powderConfig.wallBaseGapMotes,
    modeSwitchPending: false,
    viewInteraction: null,
    viewTransform: null,
    alephCameraMode: false,
    loadedSimulationState: null,
    initialLoadRestored: false,
    alephTierTransition: {
      active: false,
      stage: 'idle',
      triggerGlyphCount: 0,
      lockedGlyphsLit: null,
      sourceTier: 1,
      targetTier: 1,
      timers: [],
    },
    alephTierTransitionCheckpoint: 0,
  };

  const powderGlyphColumns: unknown[] = [];
  let powderElementsRef: PowderElements | null = null;

  return {
    powderConfig,
    powderState,
    powderGlyphColumns,
    getPowderElements: () => powderElementsRef,
    setPowderElements: (elements) => {
      powderElementsRef = elements;
    },
  };
}
