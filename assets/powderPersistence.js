import { mergeMotePalette as defaultMergeMotePalette } from '../scripts/features/towers/powderTower.js';
import { migrateWellOfInspirationSave } from './saveCompatibility.js';

const WELL_STATE_FIELDS = [
  'sandOffset', 'duneHeight', 'charges', 'simulatedDuneGain', 'wallGlyphsLit', 'glyphsAwarded',
  'idleMoteBank', 'idleDrainRate', 'pendingMoteDrops', 'motePalette', 'wallGapTarget', 'viewTransform',
  'alephWallTier', 'alephTierAlephValue', 'alephBaseIdleDrainRate', 'alephTierTransitionCheckpoint',
];

/** Persist only the surviving Well of Inspiration simulation. */
export function createPowderPersistence({
  powderState,
  powderConfig,
  mergeMotePalette = defaultMergeMotePalette,
  applyMindGatePaletteToDom,
  schedulePowderBasinSave,
  getPowderSimulation,
} = {}) {
  if (!powderState || !powderConfig) throw new Error('Well persistence requires state and configuration.');

  function getPowderBasinSnapshot() {
    const simulation = typeof getPowderSimulation === 'function' ? getPowderSimulation() : null;
    const wellOfInspiration = {};
    WELL_STATE_FIELDS.forEach((field) => {
      const value = powderState[field];
      if (field === 'motePalette') wellOfInspiration[field] = mergeMotePalette(value);
      else if (Array.isArray(value)) wellOfInspiration[field] = value.map((entry) => ({ ...entry }));
      else if (value && typeof value === 'object') wellOfInspiration[field] = structuredClone(value);
      else wellOfInspiration[field] = value;
    });
    wellOfInspiration.simulationMode = 'sand';
    return {
      wellOfInspiration,
      simulation: simulation?.exportState?.() || powderState.loadedSimulationState || null,
    };
  }

  function applyPowderBasinSnapshot(snapshot) {
    const migrated = migrateWellOfInspirationSave(snapshot);
    if (!migrated) return;
    const saved = migrated.wellOfInspiration;
    WELL_STATE_FIELDS.forEach((field) => {
      if (!Object.prototype.hasOwnProperty.call(saved, field)) return;
      const value = saved[field];
      if (field === 'motePalette' && value && typeof value === 'object') {
        powderState.motePalette = mergeMotePalette(value);
        applyMindGatePaletteToDom?.(powderState.motePalette);
      } else if (Array.isArray(value)) {
        powderState[field] = value.map((entry) => (entry && typeof entry === 'object' ? { ...entry } : entry));
      } else if (value && typeof value === 'object') {
        powderState[field] = structuredClone(value);
      } else if (Number.isFinite(value) || typeof value === 'string' || typeof value === 'boolean') {
        powderState[field] = value;
      }
    });
    powderState.simulationMode = 'sand';
    powderState.loadedSimulationState = migrated.simulation || null;
    schedulePowderBasinSave?.();
  }

  return { getPowderBasinSnapshot, applyPowderBasinSnapshot };
}
