# TheroMathTD — Archived JavaScript → TypeScript Migration Orientation

> **Archived orientation notice (2026-07-16):** This document preserves the original higher-altitude audit for historical context. Its counts, largest-file snapshot, references to deleted systems, and next-phase recommendations are intentionally stale. The authoritative dashboard, reconciled history, dependency-aware Phases 21-55, single authorized Phase 22 card, and exact 173-module coverage are in [`JavaToTypeScriptConversionPlan.md`](JavaToTypeScriptConversionPlan.md) and [`docs/TypeScriptMigrationRoadmapInventory.md`](docs/TypeScriptMigrationRoadmapInventory.md). Run `npm run check:migration-roadmap` against those documents. Do not authorize or schedule work from this archived file.

**Audit date:** 2026-07-13
**Auditor:** Claude Code (planning only — no code changes made)

> Note: This repo already contains an in-progress, more granular migration log at
> [`JavaToTypeScriptConversionPlan.md`](JavaToTypeScriptConversionPlan.md). That document is the
> authoritative session-by-session ledger and should keep being updated by whichever agent executes
> each phase. This document is a higher-altitude audit/plan: it restates where the migration
> currently stands, sizes the remaining work, and lays out phase boundaries and risk areas for
> planning purposes. Treat the two as complementary, not competing — `JavaToTypeScriptConversionPlan.md`
> wins on any factual conflict about what has actually landed.

---

## 1. Current State

> **2026-07-13 retirement update, refreshed after Phase 10 on 2026-07-15:** The obsolete-Spire feature removal deleted active Bet, Lamed,
> Tsadi, Shin, and Kuf modules and added `assets/saveCompatibility.ts`. The later Collective Unconscious/Cognitive Realm retirement removed its state, map, and preference modules. Current inventory is 50
> authored `.ts` modules and 254 authored `.js` modules without a `.ts` sibling. Nineteen of those
> JavaScript modules form the disabled legacy Achievements Terrarium/Bet Terrarium stack documented
> at `assets/legacy/achievementsTerrarium/README.md`; they are preserved JavaScript, excluded from
> the active application graph, and are not an active migration target. The active remaining backlog
> is therefore 235 JavaScript modules. The obsolete typed `spireFloatingMenu` and
> `spireTabVisibility` managers were removed with the multi-Spire navigation. The surviving Aleph system is presented as the Well of
> Inspiration, while compatibility-sensitive internal names remain unchanged.

- **Build tooling:** Plain `tsc` (no bundler). `tsconfig.json` is `strict: true`, `allowJs: true`,
  `checkJs: false`, target `ES2022`, module `ES2022`/`Bundler` resolution, `outDir: ./build/ts-out`,
  `rootDir: "."`. Compiled output is copied back next to each `.ts` source by
  `scripts/sync-ts-output.cjs` as part of `npm run build`, so `index.html` keeps working with plain
  `<script type="module">` imports and no dev server/bundler is required.
- **`package.json`:** `devDependencies` has `typescript@^5.7.0`, `eslint@^10.2.0`, `electron@^42.2.0`.
  No `@types/*` packages installed. `npm run typecheck` (`tsc --noEmit`) and `npm run build` both exist.
- **Files converted or authored so far (50 `.ts` files, all under strict mode, zero `any`):**
  `assets/uiTabManager.ts`, `assets/tabLockManager.ts`, `assets/autoSave.ts`, `assets/preferences.ts`,
  `scripts/core/formatting.ts`, `scripts/core/mathText.ts` (Phases 1–3), plus all 33 files under
  `assets/data/towers/` (32 tower-definition modules + `index.ts`) and the new
  `assets/data/towers/types.ts` (Phase 4), plus `assets/state/resourceState.ts`,
  `assets/state/spireResourceState.ts`, `assets/state/monetizationState.ts` (Phase 5A), and the product-retirement compatibility
  boundary `assets/saveCompatibility.ts`, the revised Phase 6 persistence owner
  `assets/spireResourcePersistence.ts`, and the Phase 7 Aleph-chain state owner
  `assets/alephUpgradeState.ts`, and the Phase 8 base tower-upgrade owner
  `assets/towerBlueprintPresenter.ts`, the Phase 9 tower-variable discovery owner
  `assets/towerVariableDiscovery.ts`, and the Phase 10 tooltip owner
  `assets/towerEquationTooltip.ts`. The former Phase 5B Cognitive Realm module was later removed with that retired feature.
- **Migration count methodology (see `JavaToTypeScriptConversionPlan.md`'s "Documentation and Tooling
  Repair" section for full detail):** a *converted* module is an authored `.ts` file excluding
  `.d.ts`; a *remaining* module is an authored `.js` file with no same-path `.ts` sibling; `dist/`,
  `build/`, and `node_modules/` are excluded from both counts; a compiled `.js` sibling of an
  already-migrated `.ts` file is **not** double-counted as "remaining." (A prior version of this
  document reported "358 remaining `.js` files" / "~366 total," which conflated the raw on-disk `.js`
  count with the true remaining count — the 8 Phase 1–3 modules' compiled `.js` siblings were being
  counted twice. That has been corrected below.)
- **Remaining plain JavaScript:** **256 `.js` files** with no `.ts` sibling, outside `dist/`, `build/`,
  and `node_modules/`. This includes 19 explicitly disabled legacy Terrarium modules; the active
  migration backlog is **237**. Dist is build output and should only be regenerated.
- **Everything currently compiles/lints clean**: `npm run typecheck`, `npm run build`, `npm run lint`
  all pass. `npm test` (smoke test) passes cleanly (the favicon-related failures noted in every prior
  revision of this document were resolved by removing the stale favicon references, not a migration
  change). `npm run test:unit` is 150/150 plus the separate retired-Spire checks.

**Progress so far:** 51 typed modules among 288 active authored JS/TS source modules (**17.7%**), plus 19
disabled legacy Terrarium modules that are intentionally not migration targets. Typed work remains concentrated in
navigation, persistence primitives, user preferences (Phases 1–3), static tower-definition data
(Phase 4), and all four `assets/state/*.js` game-state containers (Phase 5A + 5B, both COMPLETE) —
deliberately the lowest-risk, most widely-imported utility/config tier, per the existing plan's own
stated strategy. Revised Phase 6 migrated `assets/spireResourcePersistence.ts` and narrowed all four
autosave hooks it actually supplies (Spire-resource plus tower/Aleph wrapper hooks); Phase 7 migrated
`assets/alephUpgradeState.ts` and supplied the real Aleph snapshot/playfield contracts; Phase 8
migrated `assets/towerBlueprintPresenter.ts` and closed the base tower snapshot boundary; Phase 9
migrated `assets/towerVariableDiscovery.ts` and typed its discovery/listener/unlock boundary; Phase 10
migrated `assets/towerEquationTooltip.ts` and typed its DOM/timer/frame boundary. A supplemental
active-source-line snapshot is approximately **6.2% typed** (7,063 typed versus 106,922 remaining JS
lines), though line counts understate typed-contract work and do not measure difficulty. The next
recommended slice is the 250-line `assets/towerEquations/masterEquationUtils.js`; see the authoritative
ledger's "Next Suggested Step" for its bounded Phase 11 acceptance criteria.

---

## 2. Inventory Highlights

### Largest files (highest risk / highest payoff once typed, also highest effort per file)

| File | Lines |
|---|---|
| `assets/main.js` | 4,569 |
| `assets/playfield.js` | 4,118 |
| `scripts/features/towers/powderTower.js` | 2,548 |
| `assets/towersTab.js` | 2,319 |
| `assets/cardinalWardenUI.js` | 1,958 |
| `assets/playfield/render/layers/TrackRenderer.js` | 1,696 |
| `assets/towerEquations/greekTowers.js` | 1,684 |
| `assets/achievementsTab.js` | 1,684 |
| `scripts/features/towers/cardinalWarden/CardinalWardenRenderer.js` | 1,624 |
| `scripts/features/towers/cardinalWardenSimulation.js` | 1,495 |
| `scripts/features/towers/lamedTower.js` | 1,488 |
| `assets/towerUpgradeOverlayController.js` | 1,480 |
| `assets/cognitiveRealmMap.js` | 1,478 |
| `scripts/features/towers/tsadiTower.js` | 1,441 |
| `scripts/features/towers/fluidTower.js` | 1,398 |
| `assets/towerTreeMap.js` | 1,306 |
| `assets/levelEditor.js` | 1,287 |

### Structural groupings (for phase planning)

- **`assets/data/towers/*.ts`** (33 files — corrected from a prior "~24" estimate by reading the
  registry's imports directly: 32 tower-definition modules + `index.ts`) — static tower definition
  tables. Declarative, no simulation logic, no DOM. **Migrated in full in Phase 4** (2026-07-13),
  including a new shared `TowerDefinition` interface in `assets/data/towers/types.ts` and a derived
  `TowerId` union exported from `index.ts`. See `JavaToTypeScriptConversionPlan.md`'s Phase 4 section
  for the full file list, type design, and validation results.
- **`assets/towerEquations/**`** (~25 files) — pure math/equation-rendering helpers per tower "letter."
  Mostly pure functions once `mathText.ts`/`formatting.ts` (already typed) are the only shared deps.
- **`scripts/features/towers/**`** (~70 files) — the actual tower simulations (fractal generators,
  cellular automata, `cardinalWarden/*` subsystem, `graphTowers/*`). This is the largest and riskiest
  single cluster: heavy `<canvas>` usage, animation-frame loops, physics/particle state, and mutable
  shared objects.
- **`assets/playfield/**`** (~55 files) — combat runtime: managers, systems (ECS-flavored:
  `*System.js`), renderers, input controllers. High fan-in/fan-out; `assets/playfield.js` (4,118
  lines) and `assets/main.js` (4,569 lines) are the two integration hubs everything else plugs into.
- **`assets/state/*.js`** — game-state containers (cognitive realm, monetization, resources, spire
  resources). Good mid-priority target: typing these produces a single canonical save/state shape
  that many other modules can then consume instead of `Record<string, unknown>`.
- **UI tab controllers / overlays** (`*Tab.js`, `*Menu.js`, `*Controller.js`, `*Overlay.js` at the
  `assets/` root, ~40 files) — DOM-heavy, individually small-to-medium, mostly leaf consumers of
  already-typed `preferences.ts`/`formatting.ts`.
- **Simulation/visual "terrarium" and "spire" decorative systems** (`fluidTerrarium*.js`,
  `betSpire*.js`, `shin*.js`, `powder*.js`, `kuf*.js`, `tsadi*.js`, `lamed*.js`) — self-contained
  per-spire visual/idle subsystems. Good parallelizable phase candidates since they don't share much
  state with each other.

### Existing `.js`/`.ts` duplicates to watch

`assets/autoSave.js`, `assets/preferences.js`, and the other already-migrated modules still show up
in a raw `find *.js` because the compiled output is written back next to the `.ts` source by design
(see Decision Log in `JavaToTypeScriptConversionPlan.md`). This is intentional, not drift — but it
means **file count alone cannot be used to check migration progress**; always cross-reference against
`tsconfig.json`'s `include` list or search for the `.ts` sibling.

---

## 3. Risk Areas

1. **`assets/main.js` (4,569 lines) and `assets/playfield.js` (4,118 lines) — integration hubs.**
   Both are named explicitly in the existing plan as "do not convert wholesale." They coordinate
   nearly every other subsystem, so a naive top-down conversion would force half the codebase to be
   migrated in one pass. Correct approach: keep extracting cohesive responsibilities out of these
   files into owned modules (the way tab/navigation logic was already extracted before Phase 1), type
   each extracted module, and only convert the residual coordination shell to `main.ts`/`playfield.ts`
   once nearly everything it calls is already typed.
2. **Canvas/animation-frame heavy simulation code** (`scripts/features/towers/**`,
   `assets/playfield/render/**`, `assets/fluidTerrarium*.js`, `assets/powder*.js`). These modules do
   per-frame mutation of large typed-array/particle buffers and rely on implicit numeric shapes
   (`{x, y, vx, vy, ...}` objects created ad hoc). Getting real value from strict typing here requires
   modeling particle/entity shapes as interfaces up front — a half-typed version (interfaces with
   `any` fields) would provide false confidence. Budget more time per line here than elsewhere.
3. **`window.*` globals (61 files reference `window.` directly).** Several modules likely attach
   ad-hoc properties to `window` for cross-module communication or debugging hooks
   (`developerControls.js`, `developerModeManager.js`, `developerSpamController.js` are visible
   candidates). Each such usage needs either a `declare global { interface Window { ... } }`
   augmentation (one central `.d.ts` to avoid duplicate/conflicting declarations across files — the
   existing plan already flagged this exact hazard for the `MathJax` global) or should be refactored
   to an explicit module export before typing.
4. **No `@types` packages currently installed**, and no third-party runtime dependencies appear to be
   imported into `assets/`/`scripts/` (Electron and ESLint are dev-only). If MathJax, or any CDN-
   loaded script referenced from `index.html`, is used as an implicit global (already true for
   MathJax per Phase 2's `MathJaxLike` shim), each such library needs either an installed `@types/*`
   package or another hand-written minimal ambient interface — confirm this per-phase rather than
   assuming `npm install @types/x` will exist for lesser-known bundled libraries.
5. **Dynamic/implicit patterns:** no `eval`/`new Function`/`with` usage was found (0 hits) — good, this
   removes one common TS-migration blocker. However, expect duck-typed option-bag parameters,
   `Object.freeze({...})`-as-enum patterns (already the established typing convention used for
   `GraphicsMode`, `GameNumberNotation`, etc. — continue reusing this pattern rather than switching to
   TS `enum`), and possibly some prototype-based or dynamically-keyed object construction inside the
   older tower/enemy files that predate the current module structure. These will surface per-file
   during conversion, not detectable from a static grep pass.
6. **Save-data typing is incremental by owner, not repository-wide.** `AutoSaveSnapshot` remains the
   intentional opaque adapter for unrelated subsystem payloads. Phase 5B narrowed Cognitive Realm,
   revised Phase 6 narrowed the Spire-resource plus tower/Aleph wrapper hooks, Phase 7 replaced the
   Aleph boundary, and Phase 8 replaced the base tower-upgrade boundary with its owner's contracts.
   Unrelated payloads remain generic by their own owners; do not turn this into a project-wide
   save-schema redesign.
7. **No automated test suite beyond a smoke test and a small hand-written unit-test script.**
   `scripts/smoke-test.cjs` checks file/asset presence; `scripts/unit-test-core.cjs` (framework-free,
   `node:assert/strict`) now contains 129 compiled-output tests spanning Phases 2–8. Every future phase needs to
   grow this file (or a sibling) rather than relying on manual browser verification alone — manual
   verification has already hit tooling limitations in-session (0×0 viewport) in every phase so far.

---

## 4. Phased Migration Plan

The existing `JavaToTypeScriptConversionPlan.md` already encodes the operating model (incremental,
subsystem-scoped, behavior-preserving, ledger-tracked) — this section maps that model onto the
remaining ~358 files and gives a recommended phase order. Continue executing one phase at a time,
updating that ledger document after each phase, per its own operating instructions.

### Phase 0 — Infrastructure (COMPLETE)
`tsconfig.json`, `npm run typecheck`/`build`, sync script, ESLint carve-out for `.ts`. Nothing to do.

### Phases 1–3 — Navigation, core utilities, preferences (COMPLETE)
8 files converted; see Section 1. No action needed.

### Phase 4 — Static Configuration & Data Schemas (COMPLETE, 2026-07-13)
**Scope executed:** `assets/data/towers/*.js` → `.ts` (33 files: 32 tower-definition modules +
`index.ts`, corrected from the original "~24" estimate), plus a new `assets/data/towers/types.ts`.
`assets/towerEquations/**` was **not** included in this phase — that cluster contains real
compute/render logic (per the original Phase 6 scope below) rather than purely static tables, so it
remains deferred.
**Outcome:** All 33 files migrated (none excluded — every file in the folder is a single
`Object.freeze({...})` literal or the registry's import/re-export, confirmed by reading every file in
full). See `JavaToTypeScriptConversionPlan.md`'s Phase 4 section for the full type design, file list,
and validation results (typecheck/build/lint clean, 38/38 unit tests, deterministic two-pass build
diff).
**Risk realized:** Low, as predicted. The one deviation from the original estimate was file count
(33, not ~24) and required build-tooling work (tsconfig glob-based `include` +
`scripts/sync-ts-output.cjs` rewritten for recursive discovery) as a prerequisite, which was not
anticipated in the original phase description but did not change the risk profile.

### Phase 5A — Game State Containers, small/medium modules (COMPLETE, 2026-07-13)
**Scope executed:** `assets/state/resourceState.js`, `assets/state/spireResourceState.js`,
`assets/state/monetizationState.js` → `.ts`. `assets/state/cognitiveRealmState.js` (622 lines) was
split out as Phase 5B (deferred, not started) — see `JavaToTypeScriptConversionPlan.md`'s Phase 5
section for the concrete split rationale (canonical-constant-derived unions, procedural generation,
`Math.random()`-dependent conquest logic, and an extensive legacy-save fallback surface all warranting
dedicated inspection rather than being rushed alongside the three simpler modules).
**Outcome:** All three files migrated with explicit interfaces/discriminated unions; no importer
required changes; 20 new unit tests added (58/58 total); no `AutoSaveSnapshot` narrowing performed
(the spire-resource save schema is actually owned by the unmigrated `assets/spireResourcePersistence.js`,
not `spireResourceState.ts`). See `JavaToTypeScriptConversionPlan.md`'s Phase 5 section for full detail.
**Risk realized:** Low, as the blast-radius audit (fresh `grep -rl` per module) confirmed every
consumer only reads/mutates plain fields via dependency injection with no serialization of its own
(monetization state persists itself independently; spire-resource persistence is owned elsewhere).

### Phase 5B — Cognitive Realm Territory State (COMPLETE, 2026-07-13)
**Scope executed:** `assets/state/cognitiveRealmState.js` (622 lines) → `.ts` only; no consumer file
touched except a type-only narrowing edit to `assets/autoSave.ts` (see below).
**Outcome:** Migrated with explicit interfaces/unions for every archetype/emotion/territory/state/
serialization shape (`Archetype`/`ArchetypeId` derived from the canonical `ARCHETYPES` table via
`as const satisfies`, `EmotionNode`, `TerritoryOwner`, `Territory`, `CognitiveRealmState`,
`SerializedTerritory`, `CognitiveRealmStateSnapshot`, plus two named-opaque legacy-save types scoped
to the deserialization fallback path). Unlike Phase 5A's spire-resource hooks, this module directly
owns and implements `getCognitiveRealmStateSnapshot`/`applyCognitiveRealmStateSnapshot`'s real logic
(`serializeCognitiveRealmState`/`deserializeCognitiveRealmState`), so those two `AutoSaveSnapshot`
hooks in `assets/autoSave.ts` **were** narrowed to `CognitiveRealmStateSnapshot` in this phase. 20 new
deterministic unit tests added (78/78 total), all conquest-probability randomness mocked via a
`withMockedRandom` helper rather than relying on real `Math.random()`. No importer required any
change beyond `tsconfig.json`'s existing glob-based `include`. See
`JavaToTypeScriptConversionPlan.md`'s Phase 5B section for full detail, including two newly-recorded
(not fixed) pre-existing defects in the legacy-save fallback's `owner`/`id` validation.
**Risk realized:** Low. The dedicated full-file inspection (archetype/emotion field enumeration,
exact 9x9 algorithm trace, every `Math.random()` call site, full serialization key set, all 6
legacy-save fallback branches) proceeded without surfacing any behavior ambiguity requiring a design
decision beyond what was already anticipated in the Phase 5A split rationale.
**Risk:** Medium-high — highest-risk file in `assets/state/`, per the standing task's own designation;
requires exhaustive inspection of serialization/deserialization fallback branches before typing.

### Revised Phase 6 — Post-Retirement Spire Resource Persistence (COMPLETE, 2026-07-15)
**Scope executed:** `assets/spireResourcePersistence.js` → `.ts`; compatibility-only type narrowing
in `assets/autoSave.ts`; 17 deterministic compiled-output tests in `scripts/unit-test-core.cjs`.
**Actual live ownership:** Well of Inspiration and Achievements story flags, and the base
tower-upgrade snapshot augmented with Aleph-chain upgrades. The
historical multi-Spire recommendation was superseded because retired Bet/Lamed/Tsadi/Shin/Kuf save
branches are intentionally ignored by the current 93-line module.
**Outcome:** All four hooks supplied by the returned controller are honestly narrowed in autosave;
97/97 core unit tests pass; typecheck/build/lint/smoke checks pass; Build 730 browser smoke and save
restoration produced no console errors. Counts are 47 typed, 260 remaining JS, and 241 active remaining.

### Phase 7 — Aleph-Chain Upgrade State (COMPLETE, 2026-07-15)
**Scope executed:** `assets/alephUpgradeState.js` → `.ts`; 12 deterministic compiled-output tests in
`scripts/unit-test-core.cjs`; compatibility-only reuse of the owner contracts in
`assets/spireResourcePersistence.ts`.
**Actual live ownership:** the stable mutable `{ x, y, z }` upgrade state, defensive snapshot getter,
finite-value normalization, partial/legacy restore, defaults reset, and optional playfield chain/stat
synchronization. The sole direct importer remains `assets/main.js`, which uses all five exports.
**Outcome:** Phase 6's Aleph snapshot/playfield boundary now uses exported owner types; 109/109 core
unit tests pass; typecheck/build/lint/smoke checks pass. Browser automation was attempted but its
control runtime was unavailable, so no live save/reload or console inspection is claimed. Counts are
48 typed, 259 remaining JS, and 240 active remaining.
**Deferred finding:** no production `playfield.alephChain` or `syncAlephChainStats` implementation was
found, but the inherited defensive synchronization branches remain supported and tested.

### Phase 8 — Base Tower-Upgrade Snapshot Owner (COMPLETE, 2026-07-15)
**Scope executed:** `assets/towerBlueprintPresenter.js` (verified 321 lines) → `.ts`; 20 deterministic
compiled-output tests; compatibility-only presenter snapshot types in `assets/spireResourcePersistence.ts`.
**Actual live ownership:** authored/fallback blueprint lookup, lazy upgrade maps, base snapshot getter
and additive restore, glyph-cost aggregation, variable/result calculation, recursion/cache handling,
and targeted/global reset. The sole direct importer remains `assets/towersTab.js`, which re-exports or
injects all ten controller methods.
**Outcome:** the final external base tower snapshot boundary now uses owner types while the
persistence-owned Aleph wrapper remains distinct; 129/129 core tests and all automated validation
pass; Build 732; counts are 49 typed, 258 remaining JS, and 239 active remaining. Browser control was
available, but its isolated network context could not reach the host-served local build
(`ERR_CONNECTION_REFUSED`), so no live UI/save/console check is claimed.
**Deferred findings:** optional-key Iota variable coercion, fractional invested-cost iteration, flat
missing-variable cost, and zero-resetting fallback aggregation remain inherited and characterized.

### Phase 9 — Tower Variable Discovery Manager (RECOMMENDED NEXT)
**Scope:** `assets/towerVariableDiscovery.js` (301 lines) → `.ts`, reusing Phase 8 blueprint/variable
contracts and adding deterministic compiled-output tests. Keep `assets/towersTab.js`, equation modules,
overlays, simulations, and unrelated discovery/UI code out of scope.
**Why now:** It is directly imported only by the Towers tab and is the next bounded state owner that
consumes Phase 8's newly typed blueprint surface.
**Risk:** Low-medium; Map/Set validation, metadata precedence, iterable unlock normalization, sorting,
defensive clones, and listener warning/timing behavior require characterization.

### Later candidate — Tower Math & Equation Rendering
**Scope:** `assets/towerEquations/**` and `assets/towerEquationTooltip.js`; reassess the broader
equation/tooltip cluster after Phase 9 rather than treating the old Phase 6 order as fixed.

### Later candidate — UI Tab Controllers, Menus, Overlays (root-level `assets/*.js`)
**Scope:** The ~40 root-level `assets/*Tab.js` / `*Menu.js` / `*Controller.js` / `*Overlay.js` files
not already migrated (e.g. `towersTab.js`, `achievementsTab.js`, `boostsSection.js`,
`towerUpgradeOverlayController.js`, `variableLibraryController.js`, `waveEditorUI.js`, etc.).
**Why now:** These are consumers of `preferences.ts`/`autoSave.ts`/`formatting.ts` (already typed)
and, after Phases 4–6, of typed tower data. Individually medium-sized and mostly independent of each
other — a good phase to parallelize across multiple sequential sub-slices (e.g. "achievements +
boosts", "towers tab + upgrade overlay", "level editor + wave editor") rather than one monolithic pass.
**Risk:** Medium — heavier DOM binding than Phases 4–6; expect the same "typed adapter, migrate mixed
concerns as one unit" pattern used for `preferences.ts` to keep recurring here.

### Later candidate — Tower Simulations (`scripts/features/towers/**`)
**Scope:** The ~70 files under `scripts/features/towers/`, including the `cardinalWarden/` and
`graphTowers/` subdirectories. This is the largest cluster in the codebase.
**Why now:** By this point tower definitions (4), state (5), and equation math (6) are typed, so
simulation code has real interfaces to consume instead of `any`. Still — this is large enough that it
should be split into multiple ledger phases (e.g. by tower family: fractal-generator towers, the
`cardinalWarden/*` subsystem alone, `graphTowers/*` alone, remaining individual letter-towers), not
attempted as a single phase.
**Risk:** High — this is Risk Area #2 above (canvas/animation-frame, particle-buffer-heavy code).
Budget the most time-per-file here and insist on real particle/entity interfaces rather than
type-erasing to `any[]`/`Record<string, unknown>[]`.

### Later candidate — Playfield Runtime (`assets/playfield/**`)
**Scope:** ~55 files: managers, `*System.js` (ECS-style), renderers, input controllers, and finally
`assets/playfield.js` itself (4,118 lines) once everything it composes is typed.
**Why last among subsystems:** Highest fan-in — nearly every other migrated subsystem (towers,
enemies, state, UI) is a dependency of the playfield runtime. Migrating it before its dependencies
would force premature `any` boundaries that later phases would have to unwind.
**Risk:** High, same profile as Phase 8 (Risk Area #2), plus Risk Area #3 (`window.*` globals are
concentrated in developer-tools files that live alongside this cluster:
`developerControls.js`, `developerModeManager.js`, `developerSpamController.js`,
`assets/playfield/managers/DeveloperCrystalManager.js`,
`assets/playfield/managers/DeveloperTowerManager.js`,
`assets/playfield/services/DeveloperToolsService.js`). Establish the central `Window` augmentation
`.d.ts` file during this phase, not per-file.

### Later candidate — `assets/main.js` Decomposition and Final Conversion
**Scope:** Extract remaining coordination-only responsibilities out of `assets/main.js` (4,569 lines)
into owned modules (continuing the pattern already used for tab/navigation logic pre-Phase-1), type
each extracted piece as part of whichever subsystem phase it belongs to, and only convert the
residual `main.ts` once it is primarily composition/startup wiring.
**Why last:** Explicitly deferred by the existing plan's Core Migration Principle #8. Attempting this
early would either force a mass-migration of everything `main.js` touches, or produce a shallow `.ts`
file full of `any`-typed imports — both against the plan's non-goals.
**Risk:** Low once Phases 4–9 are done (mechanical); high if attempted early (see above).

### Post-completion candidate — Strictness Hardening & Save-Schema Project
Once file-by-file conversion is complete:
- Consider replacing the remaining `AutoSaveSnapshot = Record<string, unknown>` opaque adapter (Risk
  #6) with a fully modeled save schema now that every state-owning module has real types.
- Consider enabling `checkJs: true` for any JS that still remains (should be near-zero at this point)
  to catch drift before the final rename.
- Consider adding `@typescript-eslint` (not installed today) once `.ts` is the majority of the
  codebase, to get lint coverage on TS-specific issues instead of only `tsc --noEmit`.
- Re-evaluate whether a bundler (Vite/esbuild) is still unnecessary once the full import graph is
  typed — the current "plain `tsc` + copy-back" approach was explicitly chosen as the smallest
  solution for the current unbundled `<script type="module">` runtime (see Decision Log in
  `JavaToTypeScriptConversionPlan.md`); if that runtime assumption changes, revisit.

---

## 5. Files/Modules To Tackle First vs. Last (Summary)

**First (lowest risk, highest leverage, already largely done or next up):**
navigation → core formatting/persistence → preferences → **tower data schemas
(`assets/data/towers/*.ts`, COMPLETE)** → **game-state containers
(`resourceState.ts`/`spireResourceState.ts`/`monetizationState.ts`/`cognitiveRealmState.ts`, Phases
5A + 5B, both COMPLETE — all four `assets/state/*.ts` files now migrated)** → **post-retirement
Spire-resource persistence (`assets/spireResourcePersistence.ts`, revised Phase 6 COMPLETE)** →
**Aleph-chain upgrade state (`assets/alephUpgradeState.ts`, Phase 7 COMPLETE)** → **base tower-upgrade
snapshot owner (`assets/towerBlueprintPresenter.ts`, Phase 8 COMPLETE)** → **tower-variable discovery
manager (`assets/towerVariableDiscovery.ts`, Phase 9 COMPLETE)** → **tower equation tooltip
(`assets/towerEquationTooltip.ts`, Phase 10 COMPLETE)** → **master-equation derivation
(`assets/towerEquations/masterEquationUtils.js`, recommended Phase 11)** → tower equation math.

**Middle:** UI tab/menu/overlay controllers (parallelizable in small batches).

**Last (highest risk, highest coupling):**
tower simulations (`scripts/features/towers/**`, especially `cardinalWarden/*` and `graphTowers/*`) →
playfield runtime (`assets/playfield/**`) → `assets/playfield.js` and `assets/main.js` themselves.

**Deliberately out of scope for file-by-file phases:** a full save-data schema project (Risk #6) and
enabling `checkJs`/bundler adoption — both flagged as candidate Phase 11 work, not to be folded into
earlier phases.

---

## 6. Blockers / Dependencies Needing Action

- **No blockers currently prevent starting Phase 11.** Tooling, strict mode, and the build pipeline are
  already working end-to-end for 50 authored TypeScript modules, and
  `tsconfig.json`/`scripts/sync-ts-output.cjs` now
  discover new `.ts` sources automatically via glob patterns rather than requiring a manual file-list
  edit per phase.
- **No `@types` packages need installing today** — no typed third-party npm runtime dependency was
  found imported into `assets/`/`scripts/`. If MathJax or another CDN-script global is encountered
  again in a new file, reuse/extend the existing `Window.MathJax` augmentation from
  `scripts/core/mathText.ts` rather than redeclaring it (already flagged as a hazard in the existing
  plan).
- **Establish a central ambient `.d.ts` for `window.*` globals before or during Phase 9** (developer
  tools cluster) rather than letting each file declare its own `Window` augmentation ad hoc — this is
  the one piece of shared infrastructure not yet created that a later phase will need.
- **Test coverage is the real gating dependency, not tooling.** Per Risk #7, each phase should keep
  extending `scripts/unit-test-core.cjs` (or a clearly-related sibling) — treat "no test added for
  non-trivial derived logic" as a phase-blocking gap, consistent with the acceptance criteria already
  established for Phase 4 in the existing plan.

---

## 7. How This Plan Relates to the Existing Ledger

Execute future phases by following `JavaToTypeScriptConversionPlan.md`'s own operating instructions
(re-read it and the current repo state before each phase, mark phases IN PROGRESS/COMPLETE, log
validation results, propose the next bounded step). Use this document only to re-orient at a higher
level — e.g. when deciding which subsystem cluster to schedule next, or when onboarding a new
contributor/agent who needs the "why does the order look like this" narrative rather than the
ledger's session-by-session detail.
