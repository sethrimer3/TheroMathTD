'use strict';

/** One normalized mote drop forwarded to the Well simulation. */
export interface PowderMoteDropPayload {
  size: number;
  color?: Record<string, unknown>;
}

/** Dependencies supplied by the bootstrap sequence when flushing queued drops. */
export interface FlushPendingMoteDropsOptions {
  powderState: { pendingMoteDrops?: unknown; [key: string]: unknown };
  powderSimulation:
    | { queueDrop?: (payload: PowderMoteDropPayload) => void; [key: string]: unknown }
    | null
    | undefined;
  schedulePowderBasinSave: () => void;
}

/** Narrow arbitrary queued payloads to inspectable objects. */
function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Match `Number.isFinite` while narrowing queued sizes to numbers. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Flush combat-earned mote drops that were queued before the Well simulation initialized. */
export function flushPendingMoteDrops({
  powderState,
  powderSimulation,
  schedulePowderBasinSave,
}: FlushPendingMoteDropsOptions): void {
  if (!powderSimulation || typeof powderSimulation.queueDrop !== 'function') {
    return;
  }

  const pendingDrops: unknown[] = Array.isArray(powderState.pendingMoteDrops)
    ? powderState.pendingMoteDrops
    : [];
  pendingDrops.forEach((drop: unknown) => {
    const sizeCandidate = isObjectLike(drop) ? drop.size : undefined;
    const sizeValue = isFiniteNumber(sizeCandidate) ? sizeCandidate : drop;
    if (!isFiniteNumber(sizeValue)) {
      return;
    }
    const payload: PowderMoteDropPayload = { size: Math.max(1, Math.round(sizeValue)) };
    if (drop && isObjectLike(drop) && drop.color && isObjectLike(drop.color)) {
      payload.color = { ...drop.color };
    }
    powderSimulation.queueDrop?.(payload);
  });
  pendingDrops.length = 0;
  schedulePowderBasinSave();
}
