/** Save branches owned by spires that have been permanently retired. */
export const RETIRED_SPIRE_SAVE_KEYS = ['fluid', 'bet', 'betSpire', 'lamed', 'tsadi', 'shin', 'kuf'];
/**
 * Convert every historical Aleph/Well snapshot shape into the active schema.
 * The operation is idempotent and intentionally ignores retired-spire fields.
 */
export function migrateWellOfInspirationSave(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
        return null;
    }
    const source = snapshot.wellOfInspiration
        ?? snapshot.powder
        ?? snapshot.alephSpire
        ?? snapshot.aleph
        ?? snapshot.state;
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
        return null;
    }
    const simulation = snapshot.simulation ?? snapshot.loadedSimulationState;
    return {
        wellOfInspiration: { ...source },
        ...(simulation && typeof simulation === 'object' && !Array.isArray(simulation)
            ? { simulation: { ...simulation } }
            : {}),
    };
}
/** Confirm that a runtime save payload cannot reactivate any retired spire. */
export function containsRetiredSpireState(snapshot) {
    return RETIRED_SPIRE_SAVE_KEYS.some((key) => Object.prototype.hasOwnProperty.call(snapshot, key));
}
