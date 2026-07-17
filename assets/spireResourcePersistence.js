/** Preserve the original truthy-object checks while giving property reads an honest boundary. */
function isObjectRecord(value) {
    return typeof value === 'object' && value !== null;
}
/** Read a property from untrusted legacy JSON without inventing validation it never had. */
function readLegacyProperty(value, key) {
    return isObjectRecord(value) ? value[key] : undefined;
}
/**
 * Persist the surviving Well of Inspiration story state and tower upgrades.
 * Legacy snapshots may contain retired spire branches; those branches are intentionally ignored.
 */
export function createSpireResourcePersistence({ spireResourceState, getTowerUpgradeStateSnapshot, applyTowerUpgradeStateSnapshot, getAlephChainUpgrades, applyAlephChainUpgradeSnapshot, getPlayfield, }) {
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
    /** Serialize the surviving story state. */
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
        };
    }
    /** Restore current and legacy story snapshots with the existing normalization rules. */
    function applySpireResourceStateSnapshot(snapshot) {
        if (!isObjectRecord(snapshot))
            return;
        const legacyWell = snapshot.wellOfInspiration || snapshot.powder || snapshot.alephSpire || snapshot.aleph || {};
        // The live state factory always creates this mutable branch. It is optional
        // in the dependency interface only so serialization can preserve its powder fallback.
        const liveWell = spireResourceState.wellOfInspiration;
        liveWell.storySeen = Boolean(readLegacyProperty(legacyWell, 'storySeen') || liveWell.storySeen);
        spireResourceState.achievements.storySeen = Boolean(readLegacyProperty(snapshot.achievements, 'storySeen') || spireResourceState.achievements.storySeen);
    }
    return {
        getTowerUpgradeStateSnapshotWithAleph,
        applyTowerUpgradeStateSnapshotWithAleph,
        getSpireResourceStateSnapshot,
        applySpireResourceStateSnapshot,
    };
}
