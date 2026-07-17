import { mergeMotePalette as defaultMergeMotePalette } from '../scripts/features/towers/powderTower.js';
import { migrateWellOfInspirationSave } from './saveCompatibility.js';
/** Call the JavaScript-owned default merger without narrowing its loose input. */
const defaultPaletteMerger = (palette) => Reflect.apply(defaultMergeMotePalette, undefined, [palette]);
const WELL_STATE_FIELDS = [
    'sandOffset', 'duneHeight', 'charges', 'simulatedDuneGain', 'wallGlyphsLit', 'glyphsAwarded',
    'pendingMoteDrops', 'motePalette', 'wallGapTarget', 'viewTransform',
    'alephWallTier', 'alephTierAlephValue', 'alephTierTransitionCheckpoint',
];
/** Persist only the surviving Well of Inspiration simulation. */
export function createPowderPersistence({ powderState, powderConfig, mergeMotePalette = defaultPaletteMerger, applyMindGatePaletteToDom, schedulePowderBasinSave, getPowderSimulation, } = {}) {
    if (!powderState || !powderConfig)
        throw new Error('Well persistence requires state and configuration.');
    const state = powderState;
    function getPowderBasinSnapshot() {
        const simulation = typeof getPowderSimulation === 'function' ? getPowderSimulation() : null;
        const wellOfInspiration = {};
        WELL_STATE_FIELDS.forEach((field) => {
            const value = state[field];
            if (field === 'motePalette')
                wellOfInspiration[field] = mergeMotePalette(value);
            else if (Array.isArray(value))
                wellOfInspiration[field] = value.map((entry) => Object.assign({}, entry));
            else if (value && typeof value === 'object')
                wellOfInspiration[field] = structuredClone(value);
            else
                wellOfInspiration[field] = value;
        });
        wellOfInspiration.simulationMode = 'sand';
        return {
            wellOfInspiration,
            simulation: simulation?.exportState?.() || state.loadedSimulationState || null,
        };
    }
    function applyPowderBasinSnapshot(snapshot) {
        const migrated = migrateWellOfInspirationSave(snapshot);
        if (!migrated)
            return;
        const saved = migrated.wellOfInspiration;
        WELL_STATE_FIELDS.forEach((field) => {
            if (!Object.prototype.hasOwnProperty.call(saved, field))
                return;
            const value = saved[field];
            if (field === 'motePalette' && value && typeof value === 'object') {
                state.motePalette = mergeMotePalette(value);
                applyMindGatePaletteToDom?.(state.motePalette);
            }
            else if (Array.isArray(value)) {
                state[field] = value.map((entry) => (entry && typeof entry === 'object' ? Object.assign({}, entry) : entry));
            }
            else if (value && typeof value === 'object') {
                state[field] = structuredClone(value);
            }
            else if (Number.isFinite(value) || typeof value === 'string' || typeof value === 'boolean') {
                state[field] = value;
            }
        });
        state.simulationMode = 'sand';
        state.loadedSimulationState = migrated.simulation || null;
        schedulePowderBasinSave?.();
    }
    return { getPowderBasinSnapshot, applyPowderBasinSnapshot };
}
