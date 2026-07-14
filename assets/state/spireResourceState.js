/** Build only the surviving spire state while safely ignoring obsolete save branches. */
export function createSpireResourceState(overrides = {}) {
    const legacyWell = overrides.wellOfInspiration ?? overrides.powder ?? overrides.alephSpire ?? overrides.aleph ?? {};
    return {
        wellOfInspiration: {
            unlocked: true,
            storySeen: Boolean(legacyWell.storySeen),
        },
        achievements: {
            storySeen: Boolean(overrides.achievements?.storySeen),
        },
    };
}
