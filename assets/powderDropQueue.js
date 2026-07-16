'use strict';

/** Flush combat-earned mote drops that were queued before the Well simulation initialized. */
export function flushPendingMoteDrops({ powderState, powderSimulation, schedulePowderBasinSave }) {
  if (!powderSimulation || typeof powderSimulation.queueDrop !== 'function') {
    return;
  }

  const pendingDrops = Array.isArray(powderState.pendingMoteDrops) ? powderState.pendingMoteDrops : [];
  pendingDrops.forEach((drop) => {
    const sizeValue = Number.isFinite(drop?.size) ? drop.size : drop;
    if (!Number.isFinite(sizeValue)) {
      return;
    }
    const payload = { size: Math.max(1, Math.round(sizeValue)) };
    if (drop && typeof drop === 'object' && drop.color && typeof drop.color === 'object') {
      payload.color = { ...drop.color };
    }
    powderSimulation.queueDrop(payload);
  });
  pendingDrops.length = 0;
  schedulePowderBasinSave();
}
