import { DEFAULT_MOTE_PALETTE, mergeMotePalette } from '../../scripts/features/towers/powderTower.js';

/** Build the runtime state for the sole surviving spire, the Well of Inspiration. */
export function createPowderStateContext() {
  const powderConfig = {
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

  const powderState = {
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

  const powderGlyphColumns = [];
  let powderElementsRef = null;

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
