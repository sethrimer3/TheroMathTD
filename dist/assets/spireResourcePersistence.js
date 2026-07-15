/** Match `Number.isFinite`'s accepted numeric domain while narrowing unknown input. */
function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}
/** Preserve the original truthy-object checks while giving property reads an honest boundary. */
function isObjectRecord(value) {
    return typeof value === 'object' && value !== null;
}
/** Read a property from untrusted legacy JSON without inventing validation it never had. */
function readLegacyProperty(value, key) {
    return isObjectRecord(value) ? value[key] : undefined;
}
/**
 * Persist the surviving Well of Inspiration story state, mote gems, and tower upgrades.
 * Legacy snapshots may contain retired spire branches; those branches are intentionally ignored.
 */
export function createSpireResourcePersistence({ spireResourceState, moteGemState, getTowerUpgradeStateSnapshot, applyTowerUpgradeStateSnapshot, getAlephChainUpgrades, applyAlephChainUpgradeSnapshot, getPlayfield, }) {
    /** Preserve the base tower snapshot while adding the Aleph-chain branch. */
    function getTowerUpgradeStateSnapshotWithAleph() {
        return {
            ...getTowerUpgradeStateSnapshot(),
            alephChainUpgrades: getAlephChainUpgrades(),
        };
    }
    /** Restore base tower upgrades first, then restore a valid Aleph-chain branch. */
    function applyTowerUpgradeStateSnapshotWithAleph(snapshot) {
        if (!isObjectRecord(snapshot))
            return;
        applyTowerUpgradeStateSnapshot(snapshot);
        const alephChainUpgrades = snapshot.alephChainUpgrades;
        if (alephChainUpgrades && isObjectRecord(alephChainUpgrades)) {
            applyAlephChainUpgradeSnapshot(alephChainUpgrades, { playfield: getPlayfield() });
        }
    }
    /** Serialize the exact post-retirement story and mote-gem state. */
    function getSpireResourceStateSnapshot() {
        const wellState = spireResourceState.wellOfInspiration || spireResourceState.powder || {};
        return {
            wellOfInspiration: {
                unlocked: true,
                storySeen: Boolean(readLegacyProperty(wellState, 'storySeen')),
            },
            achievements: {
                storySeen: Boolean(spireResourceState.achievements?.storySeen),
            },
            moteGems: {
                inventory: Array.from(moteGemState.inventory.entries()).map(([gemId, record = {}]) => ({
                    gemId,
                    label: typeof record.label === 'string' ? record.label : gemId,
                    total: isFiniteNumber(record.total) ? Math.max(0, record.total) : 0,
                    count: isFiniteNumber(record.count) ? Math.max(0, Math.floor(record.count)) : 0,
                })),
                autoCollectUnlocked: Boolean(moteGemState.autoCollectUnlocked),
                autoCollectDelayMs: isFiniteNumber(moteGemState.autoCollectDelayMs)
                    ? Math.max(0, Math.floor(moteGemState.autoCollectDelayMs))
                    : 0,
            },
        };
    }
    /** Restore current and legacy story/mote-gem snapshots with the existing normalization rules. */
    function applySpireResourceStateSnapshot(snapshot) {
        if (!isObjectRecord(snapshot))
            return;
        const legacyWell = snapshot.wellOfInspiration || snapshot.powder || snapshot.alephSpire || snapshot.aleph || {};
        // The live state factory always creates this mutable branch. It is optional
        // in the dependency interface only so serialization can preserve its powder fallback.
        const liveWell = spireResourceState.wellOfInspiration;
        liveWell.storySeen = Boolean(readLegacyProperty(legacyWell, 'storySeen') || liveWell.storySeen);
        spireResourceState.achievements.storySeen = Boolean(readLegacyProperty(snapshot.achievements, 'storySeen') || spireResourceState.achievements.storySeen);
        const moteGemBranch = snapshot.moteGems || {};
        const inventory = readLegacyProperty(moteGemBranch, 'inventory');
        if (Array.isArray(inventory)) {
            moteGemState.inventory.clear();
            inventory.forEach((entry) => {
                const rawGemId = readLegacyProperty(entry, 'gemId');
                const gemId = typeof rawGemId === 'string' ? rawGemId.trim() : '';
                if (!gemId)
                    return;
                const rawLabel = readLegacyProperty(entry, 'label');
                const rawTotal = readLegacyProperty(entry, 'total');
                const rawCount = readLegacyProperty(entry, 'count');
                moteGemState.inventory.set(gemId, {
                    label: typeof rawLabel === 'string' && rawLabel.trim() ? rawLabel.trim() : gemId,
                    total: isFiniteNumber(rawTotal) ? Math.max(0, rawTotal) : 0,
                    count: isFiniteNumber(rawCount) ? Math.max(0, Math.floor(rawCount)) : 0,
                });
            });
        }
        const savedAutoCollectUnlocked = readLegacyProperty(moteGemBranch, 'autoCollectUnlocked');
        moteGemState.autoCollectUnlocked = Boolean(savedAutoCollectUnlocked || moteGemState.autoCollectUnlocked);
        const savedAutoCollectDelayMs = readLegacyProperty(moteGemBranch, 'autoCollectDelayMs');
        if (isFiniteNumber(savedAutoCollectDelayMs)) {
            moteGemState.autoCollectDelayMs = Math.max(0, Math.floor(savedAutoCollectDelayMs));
        }
    }
    return {
        getTowerUpgradeStateSnapshotWithAleph,
        applyTowerUpgradeStateSnapshotWithAleph,
        getSpireResourceStateSnapshot,
        applySpireResourceStateSnapshot,
    };
}
