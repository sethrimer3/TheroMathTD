/**
 * Persist the surviving Well of Inspiration story state, mote gems, and tower upgrades.
 * Legacy snapshots may contain retired spire branches; those branches are intentionally ignored.
 */
export function createSpireResourcePersistence({
  spireResourceState,
  moteGemState,
  getTowerUpgradeStateSnapshot,
  applyTowerUpgradeStateSnapshot,
  getAlephChainUpgrades,
  applyAlephChainUpgradeSnapshot,
  getPlayfield,
}) {
  function getTowerUpgradeStateSnapshotWithAleph() {
    return {
      ...getTowerUpgradeStateSnapshot(),
      alephChainUpgrades: getAlephChainUpgrades(),
    };
  }

  function applyTowerUpgradeStateSnapshotWithAleph(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    applyTowerUpgradeStateSnapshot(snapshot);
    if (snapshot.alephChainUpgrades && typeof snapshot.alephChainUpgrades === 'object') {
      applyAlephChainUpgradeSnapshot(snapshot.alephChainUpgrades, { playfield: getPlayfield() });
    }
  }

  function getSpireResourceStateSnapshot() {
    const wellState = spireResourceState.wellOfInspiration || spireResourceState.powder || {};
    return {
      wellOfInspiration: {
        unlocked: true,
        storySeen: Boolean(wellState.storySeen),
      },
      achievements: {
        storySeen: Boolean(spireResourceState.achievements?.storySeen),
      },
      moteGems: {
        inventory: Array.from(moteGemState.inventory.entries()).map(([gemId, record = {}]) => ({
          gemId,
          label: typeof record.label === 'string' ? record.label : gemId,
          total: Number.isFinite(record.total) ? Math.max(0, record.total) : 0,
          count: Number.isFinite(record.count) ? Math.max(0, Math.floor(record.count)) : 0,
        })),
        autoCollectUnlocked: Boolean(moteGemState.autoCollectUnlocked),
        autoCollectDelayMs: Number.isFinite(moteGemState.autoCollectDelayMs)
          ? Math.max(0, Math.floor(moteGemState.autoCollectDelayMs))
          : 0,
      },
    };
  }

  function applySpireResourceStateSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    const legacyWell = snapshot.wellOfInspiration || snapshot.powder || snapshot.alephSpire || snapshot.aleph || {};
    spireResourceState.wellOfInspiration.storySeen = Boolean(
      legacyWell.storySeen || spireResourceState.wellOfInspiration.storySeen,
    );
    spireResourceState.achievements.storySeen = Boolean(
      snapshot.achievements?.storySeen || spireResourceState.achievements.storySeen,
    );

    const moteGemBranch = snapshot.moteGems || {};
    if (Array.isArray(moteGemBranch.inventory)) {
      moteGemState.inventory.clear();
      moteGemBranch.inventory.forEach((entry) => {
        const gemId = typeof entry?.gemId === 'string' ? entry.gemId.trim() : '';
        if (!gemId) return;
        moteGemState.inventory.set(gemId, {
          label: typeof entry.label === 'string' && entry.label.trim() ? entry.label.trim() : gemId,
          total: Number.isFinite(entry.total) ? Math.max(0, entry.total) : 0,
          count: Number.isFinite(entry.count) ? Math.max(0, Math.floor(entry.count)) : 0,
        });
      });
    }
    moteGemState.autoCollectUnlocked = Boolean(
      moteGemBranch.autoCollectUnlocked || moteGemState.autoCollectUnlocked,
    );
    if (Number.isFinite(moteGemBranch.autoCollectDelayMs)) {
      moteGemState.autoCollectDelayMs = Math.max(0, Math.floor(moteGemBranch.autoCollectDelayMs));
    }
  }

  return {
    getTowerUpgradeStateSnapshotWithAleph,
    applyTowerUpgradeStateSnapshotWithAleph,
    getSpireResourceStateSnapshot,
    applySpireResourceStateSnapshot,
  };
}
