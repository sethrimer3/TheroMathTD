'use strict';
/** Narrow arbitrary queued payloads to inspectable objects. */
function isObjectLike(value) {
    return typeof value === 'object' && value !== null;
}
/** Match `Number.isFinite` while narrowing queued sizes to numbers. */
function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}
/** Flush combat-earned mote drops that were queued before the Well simulation initialized. */
export function flushPendingMoteDrops({ powderState, powderSimulation, schedulePowderBasinSave, }) {
    if (!powderSimulation || typeof powderSimulation.queueDrop !== 'function') {
        return;
    }
    const pendingDrops = Array.isArray(powderState.pendingMoteDrops)
        ? powderState.pendingMoteDrops
        : [];
    pendingDrops.forEach((drop) => {
        const sizeCandidate = isObjectLike(drop) ? drop.size : undefined;
        const sizeValue = isFiniteNumber(sizeCandidate) ? sizeCandidate : drop;
        if (!isFiniteNumber(sizeValue)) {
            return;
        }
        const payload = { size: Math.max(1, Math.round(sizeValue)) };
        if (drop && isObjectLike(drop) && drop.color && isObjectLike(drop.color)) {
            payload.color = { ...drop.color };
        }
        powderSimulation.queueDrop?.(payload);
    });
    pendingDrops.length = 0;
    schedulePowderBasinSave();
}
