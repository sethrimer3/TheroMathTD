import { mergeMotePalette as defaultMergeMotePalette } from '../scripts/features/towers/powderTower.js';
import { migrateWellOfInspirationSave } from './saveCompatibility.js';
import type { LegacySpireSaveSnapshot } from './saveCompatibility.js';

/** Call the JavaScript-owned default merger without narrowing its loose input. */
const defaultPaletteMerger = (palette: unknown): unknown =>
  Reflect.apply(defaultMergeMotePalette, undefined, [palette]);

const WELL_STATE_FIELDS = [
  'sandOffset', 'duneHeight', 'charges', 'simulatedDuneGain', 'wallGlyphsLit', 'glyphsAwarded',
  'pendingMoteDrops', 'motePalette', 'wallGapTarget', 'viewTransform',
  'alephWallTier', 'alephTierAlephValue', 'alephTierTransitionCheckpoint',
];

/** Live Well simulation surface consulted while exporting a snapshot. */
export interface PowderSimulationLike {
  exportState?: () => unknown;
  [key: string]: unknown;
}

/** Serialized Well payload produced by the snapshot getter. */
export interface PowderBasinSnapshot {
  wellOfInspiration: Record<string, unknown>;
  simulation: unknown;
}

/** Dependencies accepted from the still-JavaScript bootstrap sequence. */
export interface PowderPersistenceOptions {
  powderState?: Record<string, unknown> | null;
  powderConfig?: Record<string, unknown> | null;
  mergeMotePalette?: (palette: unknown) => unknown;
  applyMindGatePaletteToDom?: (palette: unknown) => void;
  schedulePowderBasinSave?: () => void;
  getPowderSimulation?: () => PowderSimulationLike | null;
}

/** Controller returned to autosave and the Well UI. */
export interface PowderPersistenceController {
  getPowderBasinSnapshot: () => PowderBasinSnapshot;
  applyPowderBasinSnapshot: (snapshot: LegacySpireSaveSnapshot | null | undefined) => void;
}

/** Persist only the surviving Well of Inspiration simulation. */
export function createPowderPersistence({
  powderState,
  powderConfig,
  mergeMotePalette = defaultPaletteMerger,
  applyMindGatePaletteToDom,
  schedulePowderBasinSave,
  getPowderSimulation,
}: PowderPersistenceOptions = {}): PowderPersistenceController {
  if (!powderState || !powderConfig) throw new Error('Well persistence requires state and configuration.');
  const state = powderState;

  function getPowderBasinSnapshot(): PowderBasinSnapshot {
    const simulation = typeof getPowderSimulation === 'function' ? getPowderSimulation() : null;
    const wellOfInspiration: Record<string, unknown> = {};
    WELL_STATE_FIELDS.forEach((field) => {
      const value = state[field];
      if (field === 'motePalette') wellOfInspiration[field] = mergeMotePalette(value);
      else if (Array.isArray(value)) wellOfInspiration[field] = value.map((entry: unknown) => Object.assign({}, entry));
      else if (value && typeof value === 'object') wellOfInspiration[field] = structuredClone(value);
      else wellOfInspiration[field] = value;
    });
    wellOfInspiration.simulationMode = 'sand';
    return {
      wellOfInspiration,
      simulation: simulation?.exportState?.() || state.loadedSimulationState || null,
    };
  }

  function applyPowderBasinSnapshot(snapshot: LegacySpireSaveSnapshot | null | undefined): void {
    const migrated = migrateWellOfInspirationSave(snapshot);
    if (!migrated) return;
    const saved = migrated.wellOfInspiration;
    WELL_STATE_FIELDS.forEach((field) => {
      if (!Object.prototype.hasOwnProperty.call(saved, field)) return;
      const value = saved[field];
      if (field === 'motePalette' && value && typeof value === 'object') {
        state.motePalette = mergeMotePalette(value);
        applyMindGatePaletteToDom?.(state.motePalette);
      } else if (Array.isArray(value)) {
        state[field] = value.map((entry: unknown) => (entry && typeof entry === 'object' ? Object.assign({}, entry) : entry));
      } else if (value && typeof value === 'object') {
        state[field] = structuredClone(value);
      } else if (Number.isFinite(value) || typeof value === 'string' || typeof value === 'boolean') {
        state[field] = value;
      }
    });
    state.simulationMode = 'sand';
    state.loadedSimulationState = migrated.simulation || null;
    schedulePowderBasinSave?.();
  }

  return { getPowderBasinSnapshot, applyPowderBasinSnapshot };
}
