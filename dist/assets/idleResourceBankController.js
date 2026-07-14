'use strict';

/** Manage the Well of Inspiration's idle mote bank. */
export function createIdleResourceBankController({
  powderState,
  getSandSimulation,
  getPowderSimulation,
  schedulePowderBasinSave,
  updateStatusDisplays,
}) {
  function getCurrentIdleMoteBank() {
    const sandSimulation = getSandSimulation();
    const powderSimulation = getPowderSimulation();
    if (powderSimulation === sandSimulation && sandSimulation && Number.isFinite(sandSimulation.idleBank)) {
      const bank = Math.max(0, sandSimulation.idleBank);
      powderState.idleMoteBank = bank;
      powderState.idleBankHydrated = true;
      return bank;
    }
    return Math.max(0, powderState.idleMoteBank || 0);
  }

  function getCurrentMoteDispenseRate() {
    const sandSimulation = getSandSimulation();
    const powderSimulation = getPowderSimulation();
    if (powderSimulation === sandSimulation && sandSimulation && Number.isFinite(sandSimulation.idleDrainRate)) {
      if (sandSimulation.spawnEnabled === false) {
        return 0;
      }
      const idleRate = Math.max(0, sandSimulation.idleDrainRate);
      powderState.idleDrainRate = idleRate;
      let ambientRate = 0;
      const ambientCanFlow =
        Number.isFinite(sandSimulation.idleBank) &&
        sandSimulation.idleBank > 1e-6 &&
        Number.isFinite(sandSimulation.flowOffset) &&
        sandSimulation.flowOffset > 0 &&
        idleRate > 0;
      if (ambientCanFlow) {
        const interval = typeof sandSimulation.getSpawnInterval === 'function'
          ? sandSimulation.getSpawnInterval()
          : sandSimulation.baseSpawnInterval;
        if (Number.isFinite(interval) && interval > 0) {
          ambientRate = 1000 / Math.max(16, interval);
        }
      }
      return idleRate + ambientRate;
    }
    return Math.max(0, powderState.idleDrainRate || 0);
  }

  function addIdleMoteBank(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    const sandSimulation = getSandSimulation();
    const powderSimulation = getPowderSimulation();
    if (sandSimulation && typeof sandSimulation.addIdleMotes === 'function') {
      sandSimulation.addIdleMotes(amount);
      powderState.idleMoteBank = Math.max(0, sandSimulation.idleBank);
      powderState.idleBankHydrated = sandSimulation === powderSimulation;
    } else {
      const current = Number.isFinite(powderState.idleMoteBank) ? powderState.idleMoteBank : 0;
      powderState.idleMoteBank = Math.max(0, current + amount);
      powderState.idleBankHydrated = false;
    }
    schedulePowderBasinSave();
    updateStatusDisplays();
  }

  function flushPendingMoteDrops() {
    const powderSimulation = getPowderSimulation();
    if (!powderSimulation || typeof powderSimulation.queueDrop !== 'function') {
      return;
    }
    const pendingDrops = powderState.pendingMoteDrops;
    if (pendingDrops.length) {
      pendingDrops.forEach((drop) => {
        const sizeValue = Number.isFinite(drop?.size) ? drop.size : drop;
        if (!Number.isFinite(sizeValue)) {
          return;
        }
        const normalized = Math.max(1, Math.round(sizeValue));
        const payload = drop && typeof drop === 'object' && drop.color && typeof drop.color === 'object'
          ? { size: normalized, color: { ...drop.color } }
          : { size: normalized };
        powderSimulation.queueDrop(payload);
      });
      pendingDrops.length = 0;
    }
    const pendingBank = Math.max(0, Number.isFinite(powderState.idleMoteBank) ? powderState.idleMoteBank : 0);
    if (pendingBank > 0) {
      const simulationBank = Number.isFinite(powderSimulation.idleBank)
        ? Math.max(0, powderSimulation.idleBank)
        : 0;
      const shouldInject = !powderState.idleBankHydrated || Math.abs(simulationBank - pendingBank) > 0.5;
      if (shouldInject) {
        powderSimulation.addIdleMotes(pendingBank);
        powderState.idleMoteBank = 0;
      } else {
        powderState.idleMoteBank = simulationBank;
      }
      powderState.idleBankHydrated = true;
    }
    schedulePowderBasinSave();
    updateStatusDisplays();
  }

  return {
    getCurrentIdleMoteBank,
    getCurrentMoteDispenseRate,
    addIdleMoteBank,
    flushPendingMoteDrops,
  };
}
