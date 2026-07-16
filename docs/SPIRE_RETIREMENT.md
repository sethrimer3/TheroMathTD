# Spire Retirement Boundary

The active game has one surviving Spire experience: the **Well of Inspiration**, formerly presented as the Aleph Spire. Achievements and the Achievements tab remain active.

Bet, Lamed, Tsadi, Shin, and Kuf Spires are retired from navigation, progression, tutorials, resources, offline rewards, autosave scheduling, initialization, update/render/resize lifecycles, and developer controls. Their old save branches are ignored when loading. Retired storage-key constants remain available only so old data can be recognized or removed safely; the active autosave loop does not write Shin or Kuf snapshots.

The user-facing name is **Well of Inspiration**. Compatibility-sensitive internal names remain in place where renaming would create a broad migration: `powder`, `aleph`, `alephSpire`, `powderState`, `PowderSimulation`, Aleph wall/tier fields, Aleph glyph IDs, the `powder` tab and panel IDs, and existing `glyph-defense-idle:*` storage keys. `assets/saveCompatibility.ts` and `assets/state/spireResourceState.ts` normalize historical Well/Aleph shapes while ignoring retired branches.

## Achievements Terrarium

The Achievements system still initializes, evaluates proofs, and applies its powder-rate effects. Only the visual Achievements Terrarium is disabled. Its unconverted implementation is documented at `assets/legacy/achievementsTerrarium/README.md`; the legacy controller, shared `fluidTerrarium*.js` modules, preferences, and Terrarium artwork remain in the repository but are not imported by the active entry graph. There is no active Terrarium DOM, event listener, timer, resize hook, or animation-frame lifecycle.

## Explicitly out of scope

Tower, enemy, level, currency, and progression balance outside dependencies on the retired Spires is unchanged. The former Collective Unconscious/Cognitive Realm map was retired separately on 2026-07-15 and is no longer part of the active game or repository runtime.
