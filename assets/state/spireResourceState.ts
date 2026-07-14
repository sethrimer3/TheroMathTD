export interface SpireStoryState {
  unlocked: boolean;
  storySeen: boolean;
}

export interface SpireResourceState {
  wellOfInspiration: SpireStoryState;
  achievements: { storySeen: boolean };
}

export interface SpireResourceStateOverrides {
  wellOfInspiration?: Partial<SpireStoryState>;
  powder?: Partial<SpireStoryState>;
  aleph?: Partial<SpireStoryState>;
  alephSpire?: Partial<SpireStoryState>;
  achievements?: { storySeen?: boolean };
  [key: string]: unknown;
}

/** Build only the surviving spire state while safely ignoring obsolete save branches. */
export function createSpireResourceState(overrides: SpireResourceStateOverrides = {}): SpireResourceState {
  const legacyWell =
    overrides.wellOfInspiration ?? overrides.powder ?? overrides.alephSpire ?? overrides.aleph ?? {};
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
