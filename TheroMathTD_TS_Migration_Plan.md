# TheroMathTD — JavaScript → TypeScript Migration Plan

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

- **Build tooling:** Plain `tsc` (no bundler). `tsconfig.json` is `strict: true`, `allowJs: true`,
  `checkJs: false`, target `ES2022`, module `ES2022`/`Bundler` resolution, `outDir: ./build/ts-out`,
  `rootDir: "."`. Compiled output is copied back next to each `.ts` source by
  `scripts/sync-ts-output.cjs` as part of `npm run build`, so `index.html` keeps working with plain
  `<script type="module">` imports and no dev server/bundler is required.
- **`package.json`:** `devDependencies` has `typescript@^5.7.0`, `eslint@^10.2.0`, `electron@^42.2.0`.
  No `@types/*` packages installed. `npm run typecheck` (`tsc --noEmit`) and `npm run build` both exist.
- **Files converted so far (8 `.ts` files, all under strict mode, zero `any`):**
  `assets/uiTabManager.ts`, `assets/spireFloatingMenu.ts`, `assets/tabLockManager.ts`,
  `assets/spireTabVisibility.ts`, `assets/autoSave.ts`, `assets/preferences.ts`,
  `scripts/core/formatting.ts`, `scripts/core/mathText.ts`.
- **Remaining plain JavaScript:** **358 `.js` files** outside `dist/` and `node_modules` (dist is
  build output and mirrors source 1:1 — it should never be migrated directly, only regenerated).
  Total size of `assets/` + `scripts/` JS is ~6.0 MB / ~155,000 lines.
- **Everything currently compiles/lints clean**: `npm run typecheck`, `npm run build`, `npm run lint`
  all pass. `npm test` (smoke test) fails on 4 pre-existing, unrelated missing-favicon errors (not a
  migration blocker).

**Progress so far:** 8 of ~366 JS/TS source files converted (~2%), concentrated in navigation,
persistence primitives, and user preferences — deliberately the lowest-risk, most widely-imported
utility tier, per the existing plan's own stated strategy.

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

- **`assets/data/towers/*.js`** (~24 files) — static tower definition tables. Declarative, no
  simulation logic, no DOM. Excellent typing target: define one `TowerDefinition` schema and apply
  it everywhere.
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
6. **Save-data schema is currently intentionally left untyped.** `AutoSaveSnapshot` was typed as
   `Record<string, unknown>` by design in Phase 2 to avoid conflating "migrate the storage helpers"
   with "design a full save schema." A full save-schema type is valuable but is its own project-sized
   effort — do not fold it into a generic file-by-file phase; it should be a deliberately scoped
   phase of its own once enough state-owning modules (Section 2's `assets/state/*.js` group) are typed.
7. **No automated test suite beyond a smoke test and a small hand-written unit-test script.**
   `scripts/smoke-test.cjs` checks file/asset presence; `scripts/unit-test-core.cjs` (framework-free,
   `node:assert/strict`) currently covers only the 3 Phase 2/3 modules. Every future phase needs to
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

### Phase 4 — Static Configuration & Data Schemas *(next, already recommended by the existing plan)*
**Scope:** `assets/data/towers/*.js` (~24 files, including `index.js`) and, if cleanly separable,
`assets/towerEquations/**` static definition tables (as opposed to their render/compute logic).
**Why first:** Purely declarative, minimal cross-file coupling, no DOM, no animation-frame loops.
Defining one `TowerDefinition`/`TowerEquationDefinition` interface here pays for itself immediately
in every later tower-related phase (5, 6, 8 below) by giving them a typed contract to consume instead
of `any`.
**Risk:** Low. Main risk is under-modeling optional/variant fields across the ~24 tower files — read
several before committing to one shared interface shape.

### Phase 5 — Game State Containers
**Scope:** `assets/state/cognitiveRealmState.js`, `assets/state/monetizationState.js`,
`assets/state/resourceState.js`, `assets/state/spireResourceState.js`.
**Why now:** Small, focused files; typing them turns `AutoSaveSnapshot`'s currently-opaque
`Record<string, unknown>` fields into named types incrementally (still without committing to the
"full save schema" project called out as Risk #6) and unblocks every consumer that reads/writes game
state instead of just storage bytes.
**Risk:** Medium — these are likely read by many playfield/tower/UI files; verify no wide blast radius
via `grep -l` before starting, same discipline as prior phases.

### Phase 6 — Tower Math & Equation Rendering
**Scope:** `assets/towerEquations/**` (compute/render logic not already covered in Phase 4),
`assets/towerEquationTooltip.js`, `assets/towerVariableDiscovery.js`.
**Why now:** Depends on Phase 4's typed tower-definition schema and already-typed `mathText.ts`.
Mostly pure functions (equation formatting/evaluation), low DOM coupling relative to file count.
**Risk:** Low-medium.

### Phase 7 — UI Tab Controllers, Menus, Overlays (root-level `assets/*.js`)
**Scope:** The ~40 root-level `assets/*Tab.js` / `*Menu.js` / `*Controller.js` / `*Overlay.js` files
not already migrated (e.g. `towersTab.js`, `achievementsTab.js`, `boostsSection.js`,
`towerUpgradeOverlayController.js`, `variableLibraryController.js`, `waveEditorUI.js`, etc.).
**Why now:** These are consumers of `preferences.ts`/`autoSave.ts`/`formatting.ts` (already typed)
and, after Phases 4–6, of typed tower data. Individually medium-sized and mostly independent of each
other — a good phase to parallelize across multiple sequential sub-slices (e.g. "achievements +
boosts", "towers tab + upgrade overlay", "level editor + wave editor") rather than one monolithic pass.
**Risk:** Medium — heavier DOM binding than Phases 4–6; expect the same "typed adapter, migrate mixed
concerns as one unit" pattern used for `preferences.ts` to keep recurring here.

### Phase 8 — Tower Simulations (`scripts/features/towers/**`)
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

### Phase 9 — Playfield Runtime (`assets/playfield/**`)
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

### Phase 10 — `assets/main.js` Decomposition and Final Conversion
**Scope:** Extract remaining coordination-only responsibilities out of `assets/main.js` (4,569 lines)
into owned modules (continuing the pattern already used for tab/navigation logic pre-Phase-1), type
each extracted piece as part of whichever subsystem phase it belongs to, and only convert the
residual `main.ts` once it is primarily composition/startup wiring.
**Why last:** Explicitly deferred by the existing plan's Core Migration Principle #8. Attempting this
early would either force a mass-migration of everything `main.js` touches, or produce a shallow `.ts`
file full of `any`-typed imports — both against the plan's non-goals.
**Risk:** Low once Phases 4–9 are done (mechanical); high if attempted early (see above).

### Phase 11 — Strictness Hardening & Save-Schema Project (optional, post-completion)
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
navigation → core formatting/persistence → preferences → **tower data schemas (`assets/data/towers/*.js`)** → game-state containers → tower equation math.

**Middle:** UI tab/menu/overlay controllers (parallelizable in small batches).

**Last (highest risk, highest coupling):**
tower simulations (`scripts/features/towers/**`, especially `cardinalWarden/*` and `graphTowers/*`) →
playfield runtime (`assets/playfield/**`) → `assets/playfield.js` and `assets/main.js` themselves.

**Deliberately out of scope for file-by-file phases:** a full save-data schema project (Risk #6) and
enabling `checkJs`/bundler adoption — both flagged as candidate Phase 11 work, not to be folded into
earlier phases.

---

## 6. Blockers / Dependencies Needing Action

- **No blockers currently prevent starting Phase 4.** Tooling, strict mode, and the build pipeline are
  already working end-to-end for 8 files.
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
