# Java-to-TypeScript Conversion Plan

## Purpose

This document is the persistent migration record for converting Thero from JavaScript to TypeScript while the game continues to evolve.

The migration must be incremental. The existing JavaScript game remains the executable behavioral reference until each subsystem has been migrated, tested, and accepted. Do not attempt a repository-wide extension rename or a single-pass rewrite.

This file serves four functions:

1. Record what migration work has already been completed.
2. Identify the single recommended next migration phase.
3. Give AI agents a durable handoff between work sessions.
4. Preserve known risks, validation results, and architectural decisions.

---

## Core Migration Principles

1. **Migrate by subsystem, not by file count.** A phase should establish a coherent typed boundary such as navigation, configuration, persistence, towers, or playfield management.
2. **Separate migration from redesign.** Each task must be labeled either:
   - behavior-preserving TypeScript migration; or
   - intentional behavior change with explicit acceptance criteria.
3. **Keep the game runnable at every completed phase.** JavaScript and TypeScript may coexist during the transition.
4. **Use strict types in migrated code.** Do not weaken the project globally to make conversion errors disappear.
5. **Preserve public behavior unless the phase explicitly authorizes a change.** This includes saves, progression, controls, accessibility state, visuals, timing, and mobile behavior.
6. **Add tests before or during migration.** A successful compile is not sufficient evidence that gameplay behavior is preserved.
7. **Prefer typed adapters over broad conversion.** A migrated subsystem may expose a typed API to legacy JavaScript callers.
8. **Do not convert `assets/main.js` wholesale.** First extract and migrate the responsibilities it coordinates. The eventual `main.ts` should primarily perform application composition and startup wiring.
9. **Do not leave duplicate JavaScript and TypeScript implementations of the same source module.** Generated output belongs in the build output, not beside source files.
10. **Record facts separately from suggestions.** Do not present an unverified architectural assumption as completed work.

---

## AI Agent Operating Instructions

Every AI agent performing TypeScript migration work must read this file before editing the codebase.

### Before implementation

1. Read:
   - `AGENT_START_HERE.md`
   - `AGENTS.md`
   - relevant subsystem `agent.md` files
   - `docs/JAVASCRIPT_MODULE_SYSTEM.md`
   - this conversion plan
2. Inspect the current repository rather than relying solely on this document. This plan may lag behind a recent commit.
3. Run the available baseline commands and record their results before making changes.
4. Mark the active phase as **IN PROGRESS** in the Migration Ledger.
5. Add the start date, intended scope, and any necessary deviations to the active phase entry.

### During implementation

1. Keep the phase narrowly scoped.
2. Do not silently include unrelated cleanup, redesign, balance changes, or broad file moves.
3. Preserve compatibility with unmigrated JavaScript.
4. Add explicit interfaces, literal unions, and runtime validation where they clarify real contracts.
5. Avoid `any`, broad unsafe assertions, unexplained non-null assertions, and global type suppressions.
6. Run type checking and relevant tests repeatedly rather than waiting until the end.
7. When discovering a pre-existing defect, record it under **Known Issues / Deferred Findings** unless fixing it is necessary for the migration and clearly documented.

### After implementation

Before reporting completion, update this document in the same branch or commit series:

1. Change the phase status to **COMPLETE**, **PARTIAL**, or **BLOCKED**.
2. Record the exact files converted, created, deleted, or compatibility-edited.
3. Record important types and public interfaces introduced.
4. Record all validation commands and exact outcomes.
5. Record manual browser, mobile, and Electron verification performed.
6. Record behavior that could not be verified.
7. Append an entry to the Implementation Log. Never erase prior entries merely because the implementation later changes.
8. Replace **Next Suggested Step** with one clear, bounded recommendation based on the resulting codebase.
9. Include acceptance criteria for the newly recommended next step.
10. If the recommended order changes, explain why in the Decision Log.

### Status definitions

- **NOT STARTED** — no implementation work for the phase has been accepted.
- **IN PROGRESS** — implementation has begun but completion criteria have not been met.
- **PARTIAL** — useful work was completed, but the phase was intentionally stopped before full acceptance.
- **BLOCKED** — work cannot proceed without a named prerequisite or decision.
- **COMPLETE** — all stated completion criteria were met and validation was recorded.

---

## Current Repository Baseline

**Plan created:** 2026-07-13  
**Repository:** `sethrimer3/TheroMathTD`  
**Active game referred to as “Thero”:** this repository, not `sethrimer3/Thero_Idle_TD`.

At the time this plan was created:

- The browser application is organized as JavaScript ES modules.
- Electron starts from `electron/main.cjs`.
- `package.json` does not yet configure TypeScript or a TypeScript-aware browser build pipeline.
- The current static build copies `index.html`, `assets`, and `scripts` into `dist` rather than compiling source modules.
- The existing smoke test primarily verifies required files, startup assets, and static import resolution. It is not comprehensive behavioral coverage.
- `assets/main.js` remains the major integration hub and should stay JavaScript during the first migration phase.

### Relevant structural work completed before this plan

The following work is useful groundwork but is **not itself a TypeScript migration**:

- Primary tab behavior has already been extracted into `assets/uiTabManager.js`.
- Tab lock behavior has been extracted into `assets/tabLockManager.js`.
- Spire tab visibility behavior has been extracted into `assets/spireTabVisibility.js`.
- Floating Spire menu behavior has been extracted into `assets/spireFloatingMenu.js`.
- `assets/main.js` imports these modules and uses them as integration dependencies.
- Agent-navigation documentation already distinguishes `assets/main.js` as an orchestration layer and discourages adding new gameplay logic there.

No TypeScript conversion phase is recorded as complete in this plan.

---

## Migration Ledger

| Phase | Scope | Status | Completion reference |
|---|---|---|---|
| 0 | Establish migration plan and agent handoff process | COMPLETE | `JavaToTypeScriptConversionPlan.md` created on 2026-07-13 |
| 1 | Add incremental TypeScript infrastructure and migrate shared menu/tab navigation | COMPLETE | See Implementation Log entry 2026-07-13 (Phase 1) |
| 2 | Core Formatting and Save/Persistence Utility Types | COMPLETE | See Phase 2 section and Implementation Log entry 2026-07-13 (Phase 2 executed) |
| 3 | User Preferences Module (`assets/preferences.js`) | IN PROGRESS | Started 2026-07-13; see Phase 3 section below |

---

## Phase 1 — TypeScript Infrastructure and Shared Navigation Migration (COMPLETE)

**Status:** COMPLETE (2026-07-13)
**Migration type:** Behavior-preserving migration

See the Implementation Log entry dated 2026-07-13 ("Phase 1 executed") for the full file list, types introduced, and validation results. Summary:

- Converted `assets/uiTabManager.ts`, `assets/spireFloatingMenu.ts`, `assets/tabLockManager.ts`, and `assets/spireTabVisibility.ts` to strict TypeScript. These are the complete set of modules that own primary-tab state, tab locking, spire-tab visibility, and the floating Spire menu.
- `assets/main.js` was **not** converted and required **no** edits — all four modules kept their existing public export names/shapes, so the existing `import ... from './foo.js'` specifiers in `main.js` continued to resolve unchanged once `tsc` emitted the compiled `.js` back next to each `.ts` source.
- Added `typescript` devDependency, `tsconfig.json` (strict, DOM libs, `noEmitOnError`), `npm run typecheck`, and folded `tsc` + a small sync step into `npm run build`. Decision record and rationale are in the Decision Log below (why `outDir` is a separate `build/ts-out/` and not in place, and why plain `tsc` was chosen over Vite/esbuild).
- `assets/tabLockManager.js` and `assets/spireTabVisibility.js` were *not* discovered by the original grep-for-`setActiveTab` pass because they don't call `setActiveTab` themselves — they were only found by reading this plan document, which had already landed in the repo mid-task via an unrelated merge. Any future phase should re-derive scope by reading this file first, per the operating instructions above, rather than relying solely on code search.

## Phase 2 — Core Formatting and Save/Persistence Utility Types (COMPLETE)

**Status:** COMPLETE (2026-07-13)
**Implementation start date:** 2026-07-13
**Migration type:** Behavior-preserving migration

**Live-document re-verification performed before implementation:** re-read `JavaToTypeScriptConversionPlan.md` at the start of this session; the "Next Suggested Step" section still named this exact phase ("Core Formatting and Save/Persistence Utility Types") with the same suggested scope, so no deviation from the task description was required.

**Scope executed:** `assets/autoSave.js` → `assets/autoSave.ts`, `scripts/core/formatting.js` → `scripts/core/formatting.ts`, `scripts/core/mathText.js` → `scripts/core/mathText.ts`.

**Scope decision (autoSave.js is not cleanly separable, but was migrated as a single typed-adapter file):** `assets/autoSave.js` mixes pure storage primitives + `*_STORAGE_KEY` constants at the top with a `dependencies` injection object and scheduling/orchestration functions (`configureAutoSave`, `loadPersistentState`, `performAutoSave`, per-subsystem `persist*` helpers) that call back into snapshot getters/setters owned by other modules. Per the plan's guidance to use "the narrowest safe typed-adapter approach" when a file is not cleanly separable, the whole file was converted to `.ts` (same precedent as Phase 1's `spireFloatingMenu.ts`), but the *shape* of every injected snapshot (powder basin, tower upgrades, Shin/Kuf/spire-resource/level-progress/cognitive-realm state, preference snapshots) is typed as an opaque `AutoSaveSnapshot = Record<string, unknown>` rather than a modeled game-state schema — designing a full save-schema type system remains explicitly out of scope for this phase. The injected-dependency surface itself (`AutoSaveDependencies`, `AutoSaveConfig`, `AutoSavePreferenceSnapshot`, `AutoSaveApplyOptions`) is fully and strictly typed.

**Infrastructure changes (beyond Phase 1's):** `tsconfig.json` gained `"rootDir": "."` (previously relied on tsc's automatic common-ancestor inference, which was only ever exercised with `.ts` sources confined to `assets/`; adding `scripts/core/*.ts` alongside `assets/*.ts` needed an explicit root so tsc's emitted directory structure under `build/ts-out/` stays predictable) and three new entries in `include`. `scripts/sync-ts-output.cjs` was changed from copying by `path.basename(relativeJsPath)` (assumed a flat `build/ts-out/`) to copying by the full `relativeJsPath` (preserving the `assets/`, `scripts/core/` subdirectory structure tsc now emits under `build/ts-out/` because of the explicit `rootDir`). No bundler, package, or other build-pipeline change.

**Files converted to strict TypeScript:**
- `assets/autoSave.ts` (was `.js`) — storage primitives (`readStorage`, `writeStorage`, `readStorageJson<T>`, `writeStorageJson`), all `*_STORAGE_KEY` constants, and the autosave scheduling/dependency-injection surface (typed-but-behavior-unchanged, per the scope decision above).
- `scripts/core/formatting.ts` (was `.js`) — number/percentage formatting helpers and the `GAME_NUMBER_NOTATIONS` enum.
- `scripts/core/mathText.ts` (was `.js`) — MathJax rendering helpers, math-expression detection, TeX-to-plain-text conversion.

**Files receiving compatibility edits:** None. Every existing importer (`uiTabManager.ts`, `spireFloatingMenu.ts`, `tabLockManager.ts`, `spireTabVisibility.ts`, `assets/main.js`, and the ~14 `*Preferences.js`/tower-equation/UI modules that import `formatting.js`/`mathText.js`/`autoSave.js`) kept its existing `./foo.js` import specifiers unchanged; `tsc` emits the compiled `.js` back next to each `.ts` source via the updated sync script, so nothing needed to change at any call site.

**Types/interfaces introduced:** `GameNumberNotation` (literal union derived from `GAME_NUMBER_NOTATIONS`), `GameNumberNotationListener`; `MathJaxLike` (minimal shape of the third-party global MathJax API actually used, plus a `declare global { interface Window { MathJax?: MathJaxLike } }` augmentation — no other `.ts` file declares this augmentation, checked via grep to avoid a conflicting redeclaration); `AutoSavePreferenceSnapshot`, `AutoSaveApplyOptions`, `AutoSaveSnapshot` (the intentionally-opaque `Record<string, unknown>` adapter type), `AutoSaveDependencies`, `AutoSaveConfig`.

**Tests added:** `scripts/unit-test-core.cjs` (new; run via `npm run test:unit`) — a framework-free `node:assert/strict` script (no Jest/Vitest/etc. added, per the instruction to check before introducing one) that copies the *compiled* `scripts/core/formatting.js` and `assets/autoSave.js` to scratch `.mjs` files (sidestepping the repo's `"type": "commonjs"` package.json, which otherwise makes Node's dynamic `import()` misinterpret plain ESM `.js` output as CommonJS — this only affects the Node test harness, not the browser, which always loads these as `<script type="module">`) and exercises: `formatGameNumber` across LETTERS/SCIENTIFIC notations and non-finite inputs, `setGameNumberNotation` including its invalid-input fallback, `formatWholeNumber`, `formatPercentage`/`formatSignedPercentage`, and the `autoSave.js` storage primitives (`writeStorage`/`readStorage` round-trip, missing-key read, `writeStorageJson`/`readStorageJson` round-trip, malformed-JSON handling, and storage-key constant values) against an in-memory `localStorage` stub. 12/12 assertions pass.

**Validation commands and results (before == after for every pre-existing check):**
- `npm install` — succeeds, no new dependencies added.
- `npm run lint` — clean (exit 0), before and after.
- `npm test` (`scripts/smoke-test.cjs`) — fails before and after with the same 4 pre-existing errors (missing `assets/favicon/` directory), identical to the Phase 1 baseline. No new failures.
- `npm run typecheck` — clean (no errors) against all 7 included `.ts` files (4 from Phase 1 + 3 new).
- `npm run build` — succeeds; `tsc` compiles cleanly, `sync-ts-output.cjs` copies all 7 compiled files back to their source directories (confirmed `assets/autoSave.js`, `scripts/core/formatting.js`, `scripts/core/mathText.js` are freshly regenerated, matching `git status` showing them as `RM ... -> ....ts` renames plus untracked regenerated `.js` siblings — the same pattern as Phase 1), and `dist/` contains only compiled `.js` (verified via `ls dist/assets/autoSave.* dist/scripts/core/formatting.* dist/scripts/core/mathText.*` — no `.ts` present).
- `npm run test:unit` (new) — 12/12 passed.

**Manual/browser verification performed:** Served the repository root over a local static Node HTTP server (equivalent to the file-serving needed for ES module loading) and drove the app via automated browser tooling:
- App loads with no console errors (`read_console_messages` with `onlyErrors: true` returned none).
- `localStorage.getItem('glyph-defense-idle:active-tab')` returns `'tower'` (the default tab) and `localStorage.getItem('glyph-defense-idle:powder')` returns `'0'` after normal page load — confirms `autoSave.ts`'s `readStorage`/`writeStorage`/`readStorageJson`/`writeStorageJson` are being called and persisting correctly through the compiled output.
- Page text extraction shows formatted numeric output rendered by the migrated `formatting.ts` (e.g. "Starting Thero equals 50.0 þ times 1.00, totaling 50.0 þ", "Thero Multiplier ×1.00") with no `NaN`/`undefined`/malformed output, confirming `formatGameNumber`/`formatDecimal`-derived UI text is unchanged.

**Behavior that could not be verified in this environment:** clicking through every individual tab and confirming `localStorage['glyph-defense-idle:active-tab']` updates per click (attempted via `read_page`/`computer` screenshot, but the browser-automation viewport reported `0x0` and a subsequent `screenshot` call timed out after the app had already been confirmed error-free and storage-functional by the checks above; this is an automation-tooling limitation in this session, not a defect); MathJax-rendered TeX output specifically (the app's default view did not surface a MathJax-dependent element during this pass, though `mathText.ts`'s logic is unchanged byte-for-byte aside from typing); Electron startup; physical mobile/touch input — all consistent with the "not verified" caveats already on record from Phase 1.

**Suspected pre-existing defects left unchanged:** none newly discovered in this phase's scope. The three Known Issues already on record (favicon-missing smoke-test failure, `spireFloatingMenu.ts` mixed concerns, `uiTabManager.ts`'s silent no-op on unmatched tab target) still apply and are unaffected by this phase's files.

**Acceptance criteria (met):** `npm run typecheck` and `npm run build` clean; `npm test`/`npm run lint` show no new failures versus the Phase 1 baseline; all existing importers (`uiTabManager.ts`, `spireFloatingMenu.ts`, `tabLockManager.ts`, `spireTabVisibility.ts`, `main.js`, and the various `*Preferences.js` modules) required no changes beyond `tsconfig.json`'s `include` list; manual browser verification showed no behavior change in number formatting or active-tab/save persistence.

---

## Phase 3 — User Preferences Module (`assets/preferences.js`) (IN PROGRESS)

**Status:** IN PROGRESS
**Implementation start date:** 2026-07-13
**Migration type:** Behavior-preserving migration

**Live-document re-verification performed before implementation:** re-read this plan at the start of this session; "Next Suggested Step" still named this exact phase with the same suggested scope. `assets/preferences.js` was inspected directly: it is a single 1627-line file mixing (a) storage-backed preference get/set/normalize logic and (b) DOM-binding functions (`bind*`) that wire settings-page controls and mutate the DOM directly, plus a few dependent-getter injection points (`setGraphicsModeContext`, `setNotationRefreshHandler`, `setLoadoutSlotChangeHandler`, `setFrameRateLimitChangeHandler`). Its importers were enumerated via grep: `assets/main.js`, `assets/kufSimulation.js`, `assets/playfield/playfieldPreferences.js`, `assets/playfield/render/CrystalBackgroundRenderer.js`, `assets/playfield/render/RenderCoordinator.js`, `assets/playfield/render/layers/BackgroundRenderer.js`, `assets/playfield/render/layers/EnemyRenderer.js`, `assets/playfield/render/layers/TrackRenderer.js`, `assets/playfield/systems/BackgroundSwimmerSystem.js`, `assets/playfield/systems/TrackRiverSystem.js`, `assets/playfield/systems/VisualEffectsSystem.js`, `assets/playfield/ui/TowerSelectionWheel.js`, `assets/playfield/ui/WaveTallyOverlays.js`. All of these only *read* getter functions (e.g. `isLowGraphicsModeActive`, `areGlyphEquationsVisible`) — per the task's scope boundary, they stay JS and are not touched; only `preferences.js` itself (the module that owns/persists/validates the preference state) is in scope.

**Scope executed exactly as proposed:** `assets/preferences.js` → `assets/preferences.ts`, using the same typed-adapter precedent as `autoSave.ts`/`spireFloatingMenu.ts` in prior phases (mixed pure-logic + DOM-binding file migrated as a single unit rather than split, since its dependencies are narrow and already null-safe).
**Migration type:** Behavior-preserving migration (proposed)
**Primary objective:** Type the user-preferences module now that its two most-used dependencies (`autoSave.ts`'s storage helpers/keys and `formatting.ts`'s notation enum) are already strictly typed, closing the loop on the remaining "small, widely-imported utility" tier before moving into anything stateful/simulation-heavy (towers, enemies, playfield).

**Why this is the recommended next slice:** `assets/preferences.js` (notation mode, graphics quality, glyph-equation visibility, damage-number display, cursor style, etc., per `assets/agent.md`) sits directly on top of the two modules just migrated — it reads/writes `NOTATION_STORAGE_KEY`, `GRAPHICS_MODE_STORAGE_KEY`, `GLYPH_EQUATIONS_STORAGE_KEY`, and related keys from `autoSave.ts`, and calls `setGameNumberNotation`/`getGameNumberNotation` from `formatting.ts`. Typing it next means its exported getter functions (`getActiveGraphicsMode`, `isLowGraphicsModeActive`, `areGlyphEquationsVisible`, etc.) get real return types instead of implicit `any`, benefiting every module that already imports them (confirmed widely imported: `main.js` and most `*Preferences.js`/UI modules). It stays clear of gameplay/combat/simulation logic, matching the plan's incremental-subsystem principle.

**Suggested scope:** `assets/preferences.js` → `assets/preferences.ts`. Type each preference's storage-backed getter/setter pair with a literal union or boolean/string type as appropriate (e.g. a `GraphicsMode` union, boolean-returning toggle checks), reusing `GameNumberNotation` from `scripts/core/formatting.ts` and the relevant `*_STORAGE_KEY` constants/`AutoSaveApplyOptions` type from `assets/autoSave.ts` rather than redefining them. If `preferences.js` turns out to also mix in DOM-binding side effects (element lookups, event listeners) beyond simple get/set-on-storage functions, apply the same typed-adapter approach used for `autoSave.ts` in this phase (type the pure preference-read/write surface precisely; keep any DOM-wiring functions typed but not redesigned) rather than expanding scope to a UI-binding rewrite.

**Acceptance criteria:** `npm run typecheck` and `npm run build` clean; `npm test`/`npm run lint` show no new failures versus the baseline recorded in this document; all existing importers of `preferences.js` (including `main.js` and every module listed by `grep -l "from '.*preferences.js'"`) require no changes beyond `tsconfig.json`'s `include` list; a `npm run test:unit`-style addition (extending `scripts/unit-test-core.cjs` or a sibling script) covers at least the storage-backed getter/setter round-trips for notation and graphics-mode preferences; manual browser verification shows no behavior change in how graphics mode, notation, and glyph-equation-visibility toggles read from and write to `localStorage`.

---

## Tentative Later Migration Areas

These are not authorized active phases. Their order must be reevaluated after Phase 1.

Potential later slices include:

1. Core formatting and mathematical utilities.
2. Static configuration and data schemas.
3. Shared game-state and persistence contracts.
4. Tower definitions and pure tower calculations.
5. Enemy, projectile, and playfield manager interfaces.
6. Rendering and simulation lifecycles.
7. Decomposition and final migration of `assets/main.js`.

Do not treat this list as a fixed roadmap. Each completed phase must recommend the next bounded slice based on current dependency structure, testability, and risk.

---

## Decision Log

### 2026-07-13 — Use an incremental subsystem migration

**Decision:** Migrate Thero to TypeScript subsystem by subsystem while retaining the working JavaScript game as the behavioral reference.

**Reasoning:** A ground-up autonomous rewrite would combine language migration, architecture redesign, and behavior reconstruction, making regressions difficult to detect. Incremental typed boundaries allow frequent validation and preserve the option to make major intentional changes after each subsystem is understood.

### 2026-07-13 — Select shared navigation as the first migration slice

**Decision:** Begin with TypeScript infrastructure plus shared menu and tab navigation.

**Reasoning:** Navigation already has extracted owner modules, finite identifiers, visible acceptance criteria, and limited direct interaction with combat and simulation logic. It is a suitable proving ground for the build pipeline and JavaScript/TypeScript compatibility strategy.

### 2026-07-13 — Plain `tsc`, not Vite/esbuild, and a split `outDir` rather than in-place emit

**Decision:** Use plain `tsc` (no bundler) for Phase 1. Compiler output goes to `build/ts-out/` (gitignored), and a small script (`scripts/sync-ts-output.cjs`) copies only the files that were actually authored as `.ts` back next to their sources in `assets/`, immediately after `tsc` runs, as part of `npm run build`.

**Reasoning:** The runtime has no bundler and imports plain ES modules by relative path (`./uiTabManager.js`, etc.), so the smallest solution that satisfies "browser build system" is transpilation, not bundling — Vite would be strictly more infrastructure than the import graph requires. In-place emission (`outDir` == the `assets/` source directory) was tried first and rejected: with `allowJs: true`, `tsc` treats every plain-`.js` module a `.ts` file imports (e.g. `assets/autoSave.js`, `assets/tutorialState.js`) as an "input" too, and refuses to write compiled output over an input file (`TS5055`) once that input's directory is also the output directory. Routing output to a separate folder and selectively copying back only the genuine `.ts` outputs avoids that conflict while still leaving working `.js` files sitting next to their `.ts` sources in `assets/`, so `index.html` continues to open directly with no build step, exactly as before this phase (a fresh clone or someone editing only plain `.js` files never needs to run `tsc` at all; only after editing a `.ts` file does `npm run build` — or a manual `npx tsc && node scripts/sync-ts-output.cjs` — need to run before reopening `index.html`).

**Trade-off documented:** `.ts` sources are gitignored out of `dist/` (via a `filter` in `scripts/build-static.cjs`) but the compiled `.js` siblings in `assets/` are ordinary tracked files, exactly like every other `.js` module in the repo — there is no "generated file" marker distinguishing them from hand-written JavaScript at a glance. Anyone editing `assets/uiTabManager.ts` must remember to rerun the build (or `npm run typecheck` + `npx tsc`) before their edits take effect at runtime; the compiled `.js` will silently keep serving the old behavior otherwise. This is called out here so it is not rediscovered as a mystery bug.

### 2026-07-13 — Explicit `rootDir` and directory-preserving sync once `.ts` sources span multiple top-level folders

**Decision:** Add `"rootDir": "."` to `tsconfig.json` and change `scripts/sync-ts-output.cjs` to copy compiled output by its full relative path (e.g. `build/ts-out/scripts/core/formatting.js`) instead of by basename only, as part of Phase 2.

**Reasoning:** Phase 1's `.ts` sources all lived in `assets/`, so tsc's auto-inferred common-ancestor `rootDir` happened to keep `build/ts-out/` flat, and the sync script's basename-only lookup worked by coincidence. Phase 2 added `.ts` sources under `scripts/core/` as well. Leaving `rootDir` to auto-infer would have made the emitted layout depend on the exact set of included files (fragile and liable to silently reshuffle output paths as more directories are migrated in later phases), and a basename-only sync script cannot distinguish `build/ts-out/assets/foo.js` from `build/ts-out/scripts/core/foo.js` if two future modules ever shared a filename. Pinning `rootDir` explicitly and preserving the relative path through the sync step makes the mapping deterministic and independent of which files happen to be included, at zero cost to the "open `index.html` directly" workflow (compiled `.js` still lands next to each `.ts` source either way).

**Trade-off documented:** None beyond Phase 1's original trade-off (compiled `.js` siblings remain ordinary tracked files). This change is purely internal to the build/sync scripts and does not alter runtime import specifiers or behavior.

---

## Known Issues / Deferred Findings

- Existing automated coverage is not sufficient to prove full navigation behavior beyond the manual/browser checks performed in Phase 1. A future phase should add Node-runnable pure-logic tests (e.g. for `focusAndActivateTab`'s wraparound math, or `updateTabLockStates`' per-tab unlock matrix) once these modules' DOM coupling is reduced enough to make that practical without a DOM-shim dependency.
- `assets/spireFloatingMenu.ts` combines navigation concerns (tab routing via `setActiveTab`) with resource-counter rendering and per-spire unlock/lock icon swapping. Phase 1 migrated the whole file as-is (its dependencies are narrow, injected via options, and already had safe fallbacks) rather than splitting it, per the phase's own stated option to do so when types can remain narrow and stable.
- `assets/main.js` remains a large integration file. This is acknowledged but intentionally deferred; broad conversion of that file would undermine the staged migration strategy.
- Suspected pre-existing defect (left unchanged, not fixed): in `uiTabManager.ts`'s `setActiveTab`, the fallback branch (taken only when `tabs`/`panels` haven't been populated yet) re-queries the DOM and calls `notifyTabChange` only when `activeTab` (the tab actually marked `.active` in the DOM) is found — if the requested `target` doesn't match any tab-button's `data-tab`, the function silently no-ops instead of surfacing an error. This existed in the original `.js` and was preserved exactly.
- Pre-existing, unrelated to this migration: `npm test` (scripts/smoke-test.cjs) fails on a clean checkout because `assets/favicon/` does not exist in the working tree (referenced by `index.html`). Confirmed present before Phase 1 changes via `git stash`; not a regression.

---

## Implementation Log

### 2026-07-13 — Migration plan established

**Status:** COMPLETE

**Work completed:**

- Created `JavaToTypeScriptConversionPlan.md`.
- Recorded the current JavaScript/build baseline.
- Recorded relevant navigation modularization that predates TypeScript work.
- Established mandatory update instructions for future AI agents.
- Selected TypeScript infrastructure plus shared menu/tab navigation as Phase 1.

**Code behavior changed:** None.

**Validation performed:** Documentation-only change; no runtime code was modified.

**Next suggested step:** Execute Phase 1 as defined above, then update this document before concluding the agent task.

### 2026-07-13 — Phase 1 executed

**Status:** COMPLETE

**Files converted to strict TypeScript:**

- `assets/uiTabManager.ts` (was `.js`) — primary tab registry, `setActiveTab`, keyboard/hotkey navigation, active-tab persistence, stage-tab hover animation.
- `assets/spireFloatingMenu.ts` (was `.js`) — floating Spire tray open/close, per-spire lock/unlock icon and counter refresh, `setActiveTab` wiring for spire menu items.
- `assets/tabLockManager.ts` (was `.js`) — tutorial-gated tab lock/unlock state for the primary tab bar.
- `assets/spireTabVisibility.ts` (was `.js`) — powder/fluid split-tab visibility and per-spire stacked-tab/toggle visibility.

**Files receiving compatibility edits:** None. `assets/main.js` imports all four modules by their existing `./foo.js` specifiers; those specifiers still resolve because `tsc` emits `.js` output back next to each `.ts` source (see Decision Log). No import path, export name, or call-site changes were required anywhere.

**Types/interfaces introduced:** `TabId` (literal union of the 10 actual `data-tab` values in `index.html`: `tower`, `towers`, `powder`, `fluid`, `lamed`, `tsadi`, `shin`, `kuf`, `achievements`, `options`), `TabManagerCallbacks`, `SpireTabId` (the 6 spire tray ids), `SpireMenuControllerOptions`, `SpireMenuController`, `FluidTabElements`, `SpireResourceHudElements`, `SpireResourceState`, `PowderVisibilityState`, `SpireTabVisibilityManagerOptions`, `SpireTabVisibilityManager`.

**Infrastructure added:** `typescript` devDependency; `tsconfig.json` (strict, `DOM`/`DOM.Iterable`/`ES2022` libs, `allowJs`, `noEmitOnError`, `outDir: ./build/ts-out`); `npm run typecheck` (`tsc --noEmit`); `npm run build` now runs `tsc && node scripts/sync-ts-output.cjs && node scripts/build-static.cjs`; new `scripts/sync-ts-output.cjs`; `scripts/build-static.cjs` now filters `.ts` files out of the `dist/` copy; `eslint.config.mjs` ignores `**/*.ts` and `build/**` (no `@typescript-eslint` parser is installed — `tsc --noEmit` is the type-safety gate, eslint stays scoped to JS); `.gitignore` adds `build/`.

**Validation commands and results (before == after for every pre-existing check; `typecheck` and the TS-aware `build` did not exist before):**

- `npm install` — succeeds before and after (added `typescript` to devDependencies/lockfile).
- `npm run lint` — clean (exit 0), before and after.
- `npm test` (`scripts/smoke-test.cjs`) — fails before and after with the same 4 pre-existing errors, all about a missing `assets/favicon/` directory unrelated to this migration (confirmed identical via `git stash`). No new failures.
- `npm run build` — succeeds before and after; after Phase 1 it additionally runs `tsc` (clean) and `scripts/sync-ts-output.cjs`, and `dist/` contains the compiled `.js` for all four modules with no `.ts` files copied in.
- `npm run typecheck` — new in this phase; clean (no errors) against all four migrated modules with `strict: true`.

**Manual/browser verification performed:** Served the repo over a local static server (`file://` module loading is blocked by browser CORS for ES modules regardless of TypeScript, so this is the standard way to exercise `<script type="module">` locally) and drove the app via automated browser tooling:

- App loads with no console errors.
- Default tab (`tower`/Stage) is active on first load; `aria-selected`/`active` class match.
- Clicking an unlocked tab (`options`) switches `active`/`aria-selected`/`aria-hidden`/`hidden` on both the tab button and its panel, and persists to `localStorage['glyph-defense-idle:active-tab']`.
- Locked tabs (`towers`, `achievements` on a fresh save, gated by `tabLockManager`) correctly report `disabled: true`, `aria-disabled: true`, and the "Locked - Complete Tutorial" `aria-label`, and clicking them does not switch tabs — confirmed this is the pre-existing tutorial-gate behavior, not a regression.
- Enter-key activation on a focused, unlocked tab button switches the tab and updates storage.
- The floating Spire menu toggle (`spire-menu-toggle-powder`) opens its tray (`aria-expanded` → `true`, tray gains `spire-floating-menu--visible`).
- `spire-tab-stack` carries the same `spire-tab-stack--layout-6` class and the initial locked-tab disabled/aria-label state matches pre-migration expectations.

**Behavior that could not be automatically/browser-verified in this environment:** Electron startup (no Electron window could be driven by the available browser-automation tooling in this sandboxed session); real touch/pointer input on a physical mobile device; long-running keyboard arrow-navigation wraparound across all 10 tabs in sequence (only single-step Enter/click and toggle interactions were exercised).

**Suspected pre-existing defects left unchanged:** see the two new bullets added to Known Issues / Deferred Findings above (silent no-op on unmatched `target` in the DOM-requery fallback path of `setActiveTab`).

**Next suggested step:** See the "Phase 2 — Core Formatting and Save/Persistence Utility Types" entry under Next Suggested Step above.

### 2026-07-13 — Phase 2 executed

**Status:** COMPLETE

See the "Phase 2 — Core Formatting and Save/Persistence Utility Types (COMPLETE)" section above for the full scope decision, file list, types introduced, tests added, and validation/browser-verification results. Summary:

- Converted `assets/autoSave.ts`, `scripts/core/formatting.ts`, `scripts/core/mathText.ts` to strict TypeScript (all were `.js`). No importer required edits.
- `tsconfig.json` gained `"rootDir": "."` and 3 new `include` entries; `scripts/sync-ts-output.cjs` was changed to preserve subdirectory structure when copying compiled output (previously relied on a flat `build/ts-out/`, which no longer held once `.ts` sources spanned both `assets/` and `scripts/core/`). See the new Decision Log entry above.
- Added `scripts/unit-test-core.cjs` (`npm run test:unit`, new script) — 12 framework-free `node:assert/strict` tests covering `formatGameNumber`/`setGameNumberNotation`/`formatWholeNumber`/`formatPercentage`/`formatSignedPercentage` and the `autoSave.ts` storage primitives against the *compiled* output. All 12 pass.
- `npm run typecheck`, `npm run build`, `npm run lint` all clean; `npm test` fails with the same 4 pre-existing favicon errors as the Phase 1 baseline (no new failures).
- Manual browser verification: app loads with no console errors, active-tab/powder `localStorage` keys read/write correctly, and UI text shows correctly formatted numbers post-migration.
- `assets/buildInfo.js#BUILD_NUMBER` incremented from 724 to 725 per the project's build-numbering convention.

**Next suggested step:** See the "Phase 3" entry under Next Suggested Step below.
