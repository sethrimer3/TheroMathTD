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
9. **Do not maintain two hand-authored implementations of the same module.** It is fine — and is this project's accepted build strategy — for a build-generated, browser-compatible `.js` sibling to sit next to its authored `.ts` source (see the Decision Log entries on `outDir`/`rootDir` and `scripts/sync-ts-output.cjs`): the runtime loads plain `<script type="module">` files with no bundler, so `tsc`'s compiled output is copied back next to each `.ts` source rather than left only in `build/ts-out/`. What is prohibited is a *hand-written* `.js` file and a `.ts` file independently implementing the same logic and drifting apart. In practice: once a module is migrated, its `.js` sibling must be build-generated only (regenerate it with `npm run build`, never hand-edit it), and `scripts/sync-ts-output.cjs`/`tsconfig.json`'s glob-based `include` must keep discovering it automatically rather than requiring a hand-maintained file list (see Phase 4's tsconfig/sync-script rework below).
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
| 3 | User Preferences Module (`assets/preferences.js`) | COMPLETE | Started 2026-07-13; see Phase 3 section below and Implementation Log entry 2026-07-13 (Phase 3 executed) |
| Doc/tooling repair | Recalculate migration counts, fix stale tower-file count, reconcile Principle 9, make TS-source discovery scale via globs | COMPLETE | See "Documentation and Tooling Repair" section and Implementation Log entry below |
| 4 | Static Tower Definition Data (`assets/data/towers/`) | COMPLETE | See Phase 4 section below and Implementation Log entry below |

---

## Documentation and Tooling Repair (COMPLETE, 2026-07-13)

Before Phase 4, this document and `TheroMathTD_TS_Migration_Plan.md` were audited and found to contain stale/incorrect facts, and the build tooling did not scale past an explicit file list. Corrected:

### Migration count methodology (used from here on)

- **Converted source module:** an authored `.ts` file, excluding `.d.ts`.
- **Remaining JS source module:** an authored `.js` file that does **not** have a same-path `.ts` sibling.
- **Excluded from both counts:** anything under `dist/`, `build/`, `node_modules/`, or other generated-output directories.
- **Not counted as "remaining unconverted":** a compiled `.js` file that is the build-generated sibling of an already-migrated `.ts` file (i.e. it has a same-path `.ts` sibling) — counting it would double-count the same module as both "converted" and "remaining."

Before this repair, `TheroMathTD_TS_Migration_Plan.md` reported "**358 `.js` files**" as the remaining-JS count and "8 of ~366 JS/TS source files converted." That 358 figure was the *raw* JS file count on disk, which already included the 8 compiled `.js` siblings of the 8 migrated `.ts` files — i.e. those 8 modules were being counted twice (once as "converted," once inside "remaining"). Recomputed via a full recursive scan (excluding `dist/`, `build/`, `node_modules/`) immediately before Phase 4 started:

- Converted `.ts` source modules (excl. `.d.ts`): **8**
- Raw `.js` files on disk: **358**
- Of those, compiled siblings of migrated `.ts` files (not counted as remaining): **8**
- **Correct remaining-unconverted-JS count: 350**
- Total authored source modules (8 + 350): **358** (coincidentally the same total the old doc reported, but the old doc's "358 remaining" and "8 converted" implied 366 total modules, which was wrong — the true total was 358, not 366)

After Phase 4 (this session), recomputed the same way:

- Converted `.ts` source modules (excl. `.d.ts`): **43** (8 pre-existing + 35 new: 33 migrated tower-definition files + `assets/data/towers/types.ts` + `assets/data/towers/index.ts`, one of which — `types.ts` — is a brand-new file with no prior `.js` counterpart)
- Correct remaining-unconverted-JS count: **316**
- Total authored source modules: **359** (358 + 1, accounting for the brand-new `types.ts`)

### `assets/data/towers/` re-inventory

`TheroMathTD_TS_Migration_Plan.md` described this folder as "~24 files." The registry (`assets/data/towers/index.js`, now `index.ts`) was read directly and its imports counted exactly: it imports **32** tower-definition modules (`t1`, `t2`, `mind-gate`, `shadow-gate`, `alpha` through `omega` — the 24 Greek-letter-tier towers plus 2 gates plus 2 experimental T-towers — plus `regression`, `density-collapse`, `orbital-collapse`, `polynomial-engine`, the 4-tower "graph-based test arsenal"). Including `index.js`/`index.ts` itself, the folder held **33 files** before this phase, not ~24. Both plan documents are corrected below.

### Core Migration Principle 9 reconciled with actual build architecture

Principle 9 previously read "Generated output belongs in the build output, not beside source files," which conflicts with the project's own Decision Log (this document, 2026-07-13 entries) and with `scripts/sync-ts-output.cjs`/`scripts/build-static.cjs`, both of which intentionally place compiled `.js` siblings next to their `.ts` sources so the no-bundler `<script type="module">` runtime keeps working. Principle 9 has been rewritten above (see the Core Migration Principles section) to prohibit *duplicate hand-authored* JS/TS implementations while explicitly permitting build-generated compatibility `.js` siblings — no change to the actual build strategy was made or needed; `sync-ts-output.cjs`'s copy-back behavior is correct and is preserved.

### TypeScript-source discovery made scalable

Previously `tsconfig.json`'s `include` array listed every migrated `.ts` file by explicit path (8 entries), and `scripts/sync-ts-output.cjs` iterated that same list to know what to copy back. This does not scale: each new migrated file required a manual `tsconfig.json` edit, and a forgotten entry would silently fail to sync.

**Changes made:**
- `tsconfig.json`'s `include` is now `["assets/**/*.ts", "scripts/**/*.ts"]` (glob patterns) instead of an explicit file list, with an added `exclude` for `build`/`dist`/`node_modules`.
- `scripts/sync-ts-output.cjs` no longer reads `tsconfig.json`'s `include` array at all. It now recursively walks the compiled `build/ts-out/` tree with Node's built-in `fs`/`path` APIs (no third-party glob package added), and for every compiled `.js` file found there, checks whether a same-relative-path `.ts` file still exists in the repository. If it does, that `.js` is copied back next to it (mirroring subdirectories as needed via `fs.mkdirSync(..., { recursive: true })`); if it doesn't (e.g. a plain `.js` file `allowJs` pulled in only for type inference, or a `.d.ts`/`.d.ts.map`), it is left alone. This is more robust than the old list-driven approach because it can never desync from `tsconfig.json`'s `include` — there is no longer a second list to keep in sync.
- The `outDir: ./build/ts-out` / `rootDir: "."` split, and the reason plain `tsc` (no bundler) was chosen, are unchanged from the original Decision Log entries — only the *discovery* mechanism changed, not the compile/copy architecture.
- Added focused validation for the new sync behavior: `scripts/unit-test-core.cjs` gained two build-output invariant tests ("every migrated tower `.ts` module has a compiled `.js` sibling on disk" and "no stray hand-authored-looking JS remains in `assets/data/towers` without a `.ts` source") plus a build-determinism check performed manually during this session (full `dist/` rebuilt twice from a clean `build/`, diffed recursively — zero differences).

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

## Phase 3 — User Preferences Module (`assets/preferences.js`) (COMPLETE)

**Status:** COMPLETE (2026-07-13)
**Implementation start date:** 2026-07-13
**Migration type:** Behavior-preserving migration

**Live-document re-verification performed before implementation:** re-read this plan at the start of this session; "Next Suggested Step" still named this exact phase with the same suggested scope. `assets/preferences.js` was inspected directly: it is a single 1627-line file mixing (a) storage-backed preference get/set/normalize logic and (b) DOM-binding functions (`bind*`) that wire settings-page controls and mutate the DOM directly, plus a few dependent-getter injection points (`setGraphicsModeContext`, `setNotationRefreshHandler`, `setLoadoutSlotChangeHandler`, `setFrameRateLimitChangeHandler`). Its importers were enumerated via grep: `assets/main.js`, `assets/kufSimulation.js`, `assets/playfield/playfieldPreferences.js`, `assets/playfield/render/CrystalBackgroundRenderer.js`, `assets/playfield/render/RenderCoordinator.js`, `assets/playfield/render/layers/BackgroundRenderer.js`, `assets/playfield/render/layers/EnemyRenderer.js`, `assets/playfield/render/layers/TrackRenderer.js`, `assets/playfield/systems/BackgroundSwimmerSystem.js`, `assets/playfield/systems/TrackRiverSystem.js`, `assets/playfield/systems/VisualEffectsSystem.js`, `assets/playfield/ui/TowerSelectionWheel.js`, `assets/playfield/ui/WaveTallyOverlays.js`. All of these only *read* getter functions (e.g. `isLowGraphicsModeActive`, `areGlyphEquationsVisible`) — per the task's scope boundary, they stay JS and are not touched; only `preferences.js` itself (the module that owns/persists/validates the preference state) is in scope.

**Scope executed exactly as proposed:** `assets/preferences.js` → `assets/preferences.ts`, using the same typed-adapter precedent as `autoSave.ts`/`spireFloatingMenu.ts` in prior phases (mixed pure-logic + DOM-binding file migrated as a single unit rather than split, since its dependencies are narrow and already null-safe).
**Migration type:** Behavior-preserving migration (proposed)
**Primary objective:** Type the user-preferences module now that its two most-used dependencies (`autoSave.ts`'s storage helpers/keys and `formatting.ts`'s notation enum) are already strictly typed, closing the loop on the remaining "small, widely-imported utility" tier before moving into anything stateful/simulation-heavy (towers, enemies, playfield).

**Why this is the recommended next slice:** `assets/preferences.js` (notation mode, graphics quality, glyph-equation visibility, damage-number display, cursor style, etc., per `assets/agent.md`) sits directly on top of the two modules just migrated — it reads/writes `NOTATION_STORAGE_KEY`, `GRAPHICS_MODE_STORAGE_KEY`, `GLYPH_EQUATIONS_STORAGE_KEY`, and related keys from `autoSave.ts`, and calls `setGameNumberNotation`/`getGameNumberNotation` from `formatting.ts`. Typing it next means its exported getter functions (`getActiveGraphicsMode`, `isLowGraphicsModeActive`, `areGlyphEquationsVisible`, etc.) get real return types instead of implicit `any`, benefiting every module that already imports them (confirmed widely imported: `main.js` and most `*Preferences.js`/UI modules). It stays clear of gameplay/combat/simulation logic, matching the plan's incremental-subsystem principle.

**Suggested scope:** `assets/preferences.js` → `assets/preferences.ts`. Type each preference's storage-backed getter/setter pair with a literal union or boolean/string type as appropriate (e.g. a `GraphicsMode` union, boolean-returning toggle checks), reusing `GameNumberNotation` from `scripts/core/formatting.ts` and the relevant `*_STORAGE_KEY` constants/`AutoSaveApplyOptions` type from `assets/autoSave.ts` rather than redefining them. If `preferences.js` turns out to also mix in DOM-binding side effects (element lookups, event listeners) beyond simple get/set-on-storage functions, apply the same typed-adapter approach used for `autoSave.ts` in this phase (type the pure preference-read/write surface precisely; keep any DOM-wiring functions typed but not redesigned) rather than expanding scope to a UI-binding rewrite.

**Acceptance criteria:** `npm run typecheck` and `npm run build` clean; `npm test`/`npm run lint` show no new failures versus the baseline recorded in this document; all existing importers of `preferences.js` (including `main.js` and every module listed by `grep -l "from '.*preferences.js'"`) require no changes beyond `tsconfig.json`'s `include` list; a `npm run test:unit`-style addition (extending `scripts/unit-test-core.cjs` or a sibling script) covers at least the storage-backed getter/setter round-trips for notation and graphics-mode preferences; manual browser verification shows no behavior change in how graphics mode, notation, and glyph-equation-visibility toggles read from and write to `localStorage`.

### Resolution (session resuming the crashed run, 2026-07-13)

This session resumed the phase exactly as scoped above — the crashed run had already re-read this plan, inspected `assets/preferences.js` (confirmed 1627 lines, mixed pure preference storage logic + `bind*` DOM-wiring functions), and enumerated its importers, but had not yet written `assets/preferences.ts`. That inspection was re-verified against the live repository at the start of this session (file still 1627 lines, untouched JS; the 13 importers listed in the "Scope executed" note above were re-confirmed via `grep -rl "from '.*preferences\.js'" assets scripts index.html`, which returned exactly the same 13 files plus `assets/agent.md` (a doc reference, not code) — no deviation from the crashed run's recorded scope was required.

**Migration performed:** `assets/preferences.js` → `assets/preferences.ts`, converted in full as a single typed-adapter unit (same precedent as `autoSave.ts`/`spireFloatingMenu.ts`), per the "Suggested scope" above. `assets/preferences.js` was deleted as a source file (its compiled `.js` output is regenerated by `npm run build` into the same path, so importers are unaffected).

**Types/interfaces introduced:**
- `GraphicsMode` ('low' | 'high'), `TrackRenderMode` ('gradient' | 'blur' | 'river'), `DamageNumberMode` ('damage' | 'remaining', re-exported via the existing `DAMAGE_NUMBER_MODES` object), `LoadoutToggleSide` ('left' | 'right'), `SpireOptionsPlacement` ('corner' | 'footer') — literal unions derived from each preference's existing `Object.freeze({...} as const)` constant object, mirroring the `GameNumberNotation` pattern already established in `scripts/core/formatting.ts`.
- `PersistOptions` (`{ persist?: boolean }`) — the shared shape of every preference setter's second options argument.
- `PlayfieldLike` and `PowderSimulationLike` — minimal structural interfaces declaring only the methods `preferences.ts` actually calls on the injected playfield/powder-simulation objects (`draw`, `clearDamageNumbers`, `clearWaveTallies`, `render`), matching the same "typed adapter, not a full schema" approach used for `AutoSaveSnapshot` in Phase 2. These are legacy JS-owned objects; no attempt was made to type their full public surface.
- Imported `GameNumberNotation` (type-only import) from the now-strictly-typed `scripts/core/formatting.ts`, reusing rather than redefining it, per the phase's suggested scope.

**Files receiving compatibility edits:** None. All 13 importers (`assets/main.js`, `assets/kufSimulation.js`, `assets/playfield/playfieldPreferences.js`, `assets/playfield/render/CrystalBackgroundRenderer.js`, `assets/playfield/render/RenderCoordinator.js`, `assets/playfield/render/layers/BackgroundRenderer.js`, `assets/playfield/render/layers/EnemyRenderer.js`, `assets/playfield/render/layers/TrackRenderer.js`, `assets/playfield/systems/BackgroundSwimmerSystem.js`, `assets/playfield/systems/TrackRiverSystem.js`, `assets/playfield/systems/VisualEffectsSystem.js`, `assets/playfield/ui/TowerSelectionWheel.js`, `assets/playfield/ui/WaveTallyOverlays.js`) keep their existing `./preferences.js`/`../preferences.js`-style specifiers unchanged; `tsc` emits the compiled `.js` back to `assets/preferences.js` via the existing sync script, so every call site resolves exactly as before. Every exported function name, parameter shape, and default-value behavior was preserved unchanged from the original `.js`.

**Infrastructure changes:** `tsconfig.json`'s `include` array gained one entry, `"assets/preferences.ts"`. No other build/tooling change was required — the file's only imports (`../scripts/core/formatting.js`, `./autoSave.js`, `./performanceMonitor.js`) were already resolvable (the first two are already-typed `.ts` sources; `performanceMonitor.js` remains plain JS and is consumed via `allowJs`, exactly as `autoSave.ts` already consumed other plain-JS neighbors in Phase 2).

**Tests added:** Extended `scripts/unit-test-core.cjs` (still the same framework-free `node:assert/strict` script, `npm run test:unit`) with 17 new test cases covering `assets/preferences.js`'s pure/storage-backed logic: `applyLoadoutSlotPreference`/`initializeLoadoutSlotPreference` clamping and persistence, `applyFrameRateLimitPreference` clamping (including non-finite fallback to 60), `applyGraphicsMode` round-trip + storage key + unrecognized-value fallback to `'high'`, `applyTrackRenderMode` invalid-value fallback to `'gradient'` and valid-mode persistence, `applyDamageNumberMode` invalid-value fallback to `'damage'` and the `'remaining'` case, `applyNotationPreference` storage persistence, boolean-toggle normalization (`applyEnemyParticlesPreference`, `applyEdgeCrystalsPreference` truthy/falsy/string-input handling), `initializeEdgeCrystalsPreference`'s empty-storage default-to-disabled behavior, `initializeInvertCarouselDragPreference`'s empty-storage default-to-enabled (inverted) behavior, and both `applyTowerLoadoutToggleSidePreference`/`applySpireOptionsPlacementPreference`'s unrecognized-value fallback branches. Total suite: 29/29 passing (12 pre-existing from Phase 2 + 17 new).
- Because `assets/preferences.js` has real relative imports (`../scripts/core/formatting.js`, `./autoSave.js`, `./performanceMonitor.js`) unlike the single-file leaf modules tested in Phase 2, a new `importPreferencesModule()` helper was added alongside the existing `importAsEsm()` helper: it copies the small compiled dependency tree into a scratch directory (preserving relative paths) with its own `{"type":"module"}` package.json, rather than renaming a single file to `.mjs`. This was necessary because Node's CJS-by-default resolution (from the repo's own `"type": "commonjs"` package.json) breaks relative `import` specifiers between copied files unless the scratch directory declares itself as an ES module tree.
- A minimal `global.document` stub (`getElementById` returning `null`; a `body` with a no-op `classList.toggle` and a plain `dataset` object) was added to the test file immediately before importing the preferences module. This is required because two code paths in `preferences.ts` — `updateNotationPreviewDamage()` (invoked indirectly through the notation-change listener) and `applySpireOptionsPlacementDom()` — call `document.getElementById`/`document.body` directly without a `typeof document !== 'undefined'` guard, exactly as the original `.js` did. Every other DOM read in the module is already guarded (either by a cached-element null check or an explicit `typeof document` check), so no additional stub surface was needed.

**Validation commands and results (before == after for every pre-existing check):**
- `npm install` — up to date, no new dependencies.
- `npm run lint` — clean (exit 0), before and after.
- `npm test` (`scripts/smoke-test.cjs`) — fails before and after with the same 4 pre-existing favicon errors (identical to the Phase 2 baseline re-confirmed at the start of this session). No new failures.
- `npm run typecheck` — clean against all 8 included `.ts` files (7 from Phases 1–2 plus `assets/preferences.ts`) on the first attempt after writing the file — no `any`, no unexplained non-null assertions, no `@ts-ignore`/`@ts-nocheck` anywhere in the new file.
- `npm run build` — succeeds; `tsc` compiles cleanly, `sync-ts-output.cjs` copies all 8 compiled files back to their source directories (confirmed `assets/preferences.js` is freshly regenerated), and `dist/` contains only compiled `.js` (no `.ts`).
- `npm run test:unit` — 29/29 passed (12 pre-existing + 17 new).

**Manual/browser verification performed:** Served the repository root over a local static Node HTTP server and drove the app via automated browser tooling:
- App loads with no console errors (`read_console_messages` with `onlyErrors: true` returned none, both immediately after load and after the interactions below).
- `localStorage.getItem('glyph-defense-idle:graphics-mode')` reads `'high'` on first load (the intended default), confirming `initializeGraphicsMode()` runs correctly through the compiled `preferences.js`.
- Clicked the Options tab into view via `document.querySelector('[data-tab="options"]').click()`, then clicked `#graphics-mode-button` via JS: button label changed from `"Graphics · High"` to `"Graphics · Low"` and `localStorage['glyph-defense-idle:graphics-mode']` updated to `'low'` — confirms `applyGraphicsMode`/`toggleGraphicsMode`'s persistence and UI-label update both work through the migrated module.
- Clicked `#notation-toggle-button`: label changed from `"Notation · Letters"` to `"Notation · Scientific"` and `localStorage['glyph-defense-idle:notation']` updated to `'scientific'`.
- Toggled `#glyph-equation-toggle` (checked = true, dispatched a `change` event): `localStorage['glyph-defense-idle:glyph-equations']` updated to `'1'` and `document.body` gained the `show-glyph-equations` class, confirming `applyGlyphEquationPreference`'s DOM side effect and persistence both survived the migration unchanged.
- (Browser-automation viewport limitation, same as Phases 1–2: `read_page`/`computer` screenshot reported a `0x0` viewport in this session, so verification used direct DOM/JS inspection via `javascript_tool` instead of visual screenshots or coordinate clicks — this exercised the same code paths and DOM state that a manual click would.)

**Behavior that could not be verified in this environment:** the frame-rate-limit slider, FPS counter overlay, auto-graphics switching (`performanceMonitor.js` integration), desktop-cursor media-query detection, and the remaining playfield-visual toggles (enemy particles, edge crystals, background particles, crystal background sprites, track tracer, wave tally overlays, track render mode, tower-loadout-toggle-side, spire-options-placement) were not individually clicked through in the browser this session — their pure logic (clamping, normalization, storage round-trips) is covered by the 17 new unit tests instead, and their code is otherwise byte-for-byte behavior-identical to the original `.js` aside from added type annotations. Electron startup and physical mobile/touch input remain unverified, consistent with every prior phase's recorded caveats.

**Suspected pre-existing defects left unchanged:** none newly discovered in this phase's own scope. See Known Issues / Deferred Findings below for one addition specific to this phase.

---

## Phase 4 — Static Tower Definition Data (`assets/data/towers/`) (COMPLETE)

**Status:** COMPLETE (2026-07-13)
**Implementation start date:** 2026-07-13
**Migration type:** Behavior-preserving migration

**Scope executed:** All 33 files in `assets/data/towers/` (32 individual tower-definition modules plus `index.js`) migrated to strict TypeScript, plus one new module, `assets/data/towers/types.ts`, introducing the shared `TowerDefinition` contract. Every file in this folder is purely declarative — a single `Object.freeze({...})` literal (or, for `index.js`, an import/re-export/array-assembly of those literals) with no functions, no DOM access, and no runtime computation — confirmed by reading every file's full contents before migrating (all 18-24 lines each) and by a grep for `function|=>|Math\.|for (|while (|Object.freeze` across the folder, which only matched `Object.freeze` (the intentional literal-freeze pattern already used pre-migration) and one `Math.E` constant in `infinity.js` (a compile-time literal, not runtime logic). No file in this folder was excluded from the migration.

**Inventory performed before designing the type:** Read all 33 original `.js` files in full (not just a sample) to enumerate every field actually used across all variants, rather than assuming any single tower's fields were exhaustive. Confirmed fields and which towers use them:
- `id`, `symbol`, `name`, `tier`, `baseCost`, `damage`, `rate`, `range`, `icon` — present on every tower (required).
- `diameterMeters` — present on `t1`, `t2`, `alpha`, `kappa`, `mind-gate`, `shadow-gate`, `regression`, `density_collapse`, `orbital_collapse`, `polynomial_engine`; absent elsewhere (optional).
- `rangeMeters` — present only on `lambda` (optional).
- `nextTierId` — present (string) on most towers to chain to the next tier; explicit `null` on `infinity` (end of chain); entirely absent on `t1`/`t2` (no successor). Modeled as `string | null` and optional.
- `tierLabel` — present only on the two gates (`'Origin'`); optional elsewhere.
- `placeable` — `false` on both gates, `true` on `nu` and `phi` (explicitly marking them placeable despite not being the "next" unlockable tier at the time they were authored), absent (implicitly placeable) on every other tower. Optional boolean.
- `description` — present on both gates and all four graph-based "test arsenal" towers (`regression`, `density_collapse`, `orbital_collapse`, `polynomial_engine`); absent elsewhere. Optional string.

Consumers were also inspected (not migrated) to confirm the contract matches real usage: `assets/configuration.js` (imports `towers` and does a single shallow `.map((tower) => ({ ...tower }))` clone — no field-specific access), `assets/towersTab.js` (reads/rewrites `diameterMeters`/`rangeMeters`/`range`/`radiusMeters` on a cloned object, reads `nextTierId`, `placeable`), `assets/towerLoadoutController.js` (`definition.placeable !== false`), `assets/towerUpgradeOverlayController.js` (`definition.tierLabel`), `assets/upgradeMatrixOverlay.js` (`definition.nextTierId`), and several `assets/towerEquations/**` files that read `rangeMeters` from *runtime tower state* (a different, unrelated object — not this static definition) rather than from the registry directly.

**Files converted to strict TypeScript:**
- `assets/data/towers/types.ts` (new) — introduces `export interface TowerDefinition` with 8 required fields (`id`, `symbol`, `name`, `tier`, `baseCost`, `damage`, `rate`, `range`, `icon` — 9 actually, see file) and 6 optional fields (`tierLabel?`, `placeable?`, `rangeMeters?`, `diameterMeters?`, `nextTierId?: string | null`, `description?`), each with an inline comment recording which towers use it and why.
- All 32 individual tower files (`alpha.ts` … `zeta.ts`, `t1.ts`, `t2.ts`, `mind-gate.ts`, `shadow-gate.ts`, `regression.ts`, `density-collapse.ts`, `orbital-collapse.ts`, `polynomial-engine.ts`, `infinity.ts`) — each still exports its `Object.freeze({...})` constant and a `default` export with the exact same name, values, and ordering as before; the object literal is now written as `Object.freeze({ ... } as const satisfies TowerDefinition)`, preserving every literal id/symbol/number and giving each object a precise literal type via `as const` while `satisfies` verifies it against the shared contract without widening or erasing the literal types (chosen over a plain `as TowerDefinition` assertion, which would have silently accepted a typo'd or missing field).
- `assets/data/towers/index.ts` — same imports, same `export { ... as fooTower }` re-export block (unchanged names), same `towers` array (same elements, same order), same `export default towers`. The array itself is now `as const satisfies readonly TowerDefinition[]`, and a new `export type TowerId = (typeof towers)[number]['id']` derives the literal union of every registered tower id directly from the completed registry (so a future consumer needing a tower-id type doesn't need to hand-list all 32 ids or risk them drifting from the registry). Also re-exports `type { TowerDefinition }` from `./types.js` for convenience.

**Files receiving compatibility edits:** None. `assets/configuration.js` (`import towers from './data/towers/index.js'`) required no change — the compiled `index.js` regenerated by `npm run build` keeps the same default export shape. No other file in the repository imports anything from `assets/data/towers/` directly (confirmed via `grep -rn "data/towers"` across `assets/` and `scripts/` — only `assets/configuration.js` imports the registry; nothing imports individual tower files directly).

**Types/interfaces introduced:** `TowerDefinition` (the shared per-tower contract, `assets/data/towers/types.ts`); `TowerId` (derived literal union of registered ids, `assets/data/towers/index.ts`).

**`Object.freeze` behavior:** Preserved exactly — every tower constant is still the direct return value of `Object.freeze(...)`, now wrapped with `as const satisfies TowerDefinition` *inside* the `Object.freeze()` call (i.e. `Object.freeze({...} as const satisfies TowerDefinition)`), so the runtime freeze happens on precisely the same object literal as before, just with compile-time-only type annotations added.

**Infrastructure changes:** See the "Documentation and Tooling Repair" section above — `tsconfig.json`'s `include` switched from an explicit file list to `assets/**/*.ts` / `scripts/**/*.ts` globs, and `scripts/sync-ts-output.cjs` was rewritten to recursively discover compiled output with a `.ts` sibling instead of reading `tsconfig.json`'s file list. This was necessary as a prerequisite for Phase 4 itself (34 new files would have meant 34 new manual `tsconfig.json` entries otherwise) and is general infrastructure, not tower-specific.

**Tests added:** Extended `scripts/unit-test-core.cjs` with a new `importTowerRegistry()` helper (copies the whole compiled `assets/data/towers/*.js` directory into a scratch ESM package, since the registry has ~33 sibling relative imports) and 9 new test cases:
- registry exports a non-empty `towers` array whose default export is the same reference;
- every tower id is unique;
- required numeric fields (`tier`, `baseCost`, `damage`, `rate`, `range`, and optional `rangeMeters`/`diameterMeters` when present) are finite and within valid (non-negative) domains;
- every `nextTierId` resolves to an existing tower id in the registry (or is `null`/absent);
- registry ordering (`t1`, `t2`, `mind-gate`, `shadow-gate` first; `polynomial_engine` last) and named per-tower exports (`alphaTower`, `omegaTower`, `infinityTower`) remain consistent;
- gate/non-placeable definitions retain their special properties (`placeable: false`, `tierLabel: 'Origin'`, non-empty `description` on both gates; `nextTierId: null` on `infinity`; `placeable: true` on `nu`/`phi`);
- every tower definition is still `Object.isFrozen`;
- build-output invariant: every migrated tower `.ts` file has a compiled `.js` sibling on disk (verifies `sync-ts-output.cjs`'s new recursive discovery actually restores all 33 modules);
- build-output invariant: no JS file remains in the folder without a `.ts` source (verifies no stray/duplicate hand-authored JS was left behind).

Total suite: **38/38 passing** (29 pre-existing from Phases 2–3 + 9 new).

**Validation commands and results (before == after for every pre-existing check):**
- `npm install` — was required this session because `node_modules/typescript` was absent on a fresh checkout despite being listed in `package.json` (`npm ls typescript` showed `(empty)` before install); `tsc`/`npm run typecheck`/`npm run build` all failed with `'tsc' is not recognized` until `npm install` was run. After `npm install`: 1 package added, typescript now resolves. This is an environment-setup step, not a migration change — `package.json` was not modified.
- `npm run typecheck` (`tsc --noEmit`) — clean, no errors, against the full glob-discovered `.ts` set (43 files: 8 pre-existing + 35 new).
- `npm run build` (`tsc && node scripts/sync-ts-output.cjs && node scripts/build-static.cjs`) — succeeds; all 43 compiled `.js` files (including all 33 tower modules + `types.js`, which compiles to an effectively-empty module since `types.ts` only exports a type) are synced back to their source directories; `dist/` contains the compiled `.js` output with no `.ts` files copied in (verified via `find dist/assets/data/towers -name "*.ts"`, zero results).
- **Build run twice, `dist/` diffed for determinism:** ran `rm -rf build && npm run build`, snapshotted `dist/` to a directory outside the repo, ran `rm -rf build && npm run build` again, then `diff -rq` between the two `dist/` snapshots — **zero differences reported**, confirming the sync process is deterministic (no spurious timestamp/order differences).
- `npm run lint` (`eslint .`) — clean (exit 0), before and after; `.ts` files remain excluded from ESLint's scope per the existing `eslint.config.mjs` configuration (unchanged from Phase 1).
- `npm test` (`scripts/smoke-test.cjs`) — fails with the same 4 pre-existing favicon-related errors as every prior phase's recorded baseline (`assets/favicon/favicon.ico`, `favicon-32x32.png`, `favicon-16x16.png`, `apple-touch-icon.png` all reported missing). Re-confirmed identical before and after this phase's changes by running the smoke test both immediately after the environment `npm install` (before any tower files were touched) and again after all migration/tooling changes — output byte-for-byte identical in both runs, so this is confirmed pre-existing and unrelated to this phase, not merely assumed.
- `npm run test:unit` — **38/38 passed** (29 pre-existing + 9 new, see above).

**Manual/browser verification performed:** None. A headless/automatable browser was not available in this session (no browser-automation tool call was attempted or claimed). Verification of this phase's correctness instead relies on: `npm run typecheck` passing under `strict: true` with no `any`/`@ts-ignore`/`@ts-nocheck`; the unchanged import specifier and default-export shape consumed by `assets/configuration.js`; the 9 new registry-invariant unit tests exercising the actual compiled output; and the two-pass deterministic-build diff. No manual playtesting of tower costs/stats/icons in the running game was performed.

**Behavior that could not be verified in this environment:** Whether `assets/configuration.js`'s `towers.map((tower) => ({ ...tower }))` clone and every downstream UI (tower shop cards, upgrade overlay, tower placement) render identically in a live browser session — not verified visually, only structurally (identical object shapes/values, confirmed by the unit tests and by the byte-level unchanged values in each migrated file). Electron startup and mobile/touch input remain unverified, consistent with every prior phase's recorded caveats.

**Suspected pre-existing defects left unchanged:** None newly discovered in this phase's scope.

**Acceptance criteria (met):**
- File scope re-derived by reading this plan and inspecting the live repository (found 33 files, corrected from the stale "~24" figure) rather than assumed.
- All migrated files compile under strict TypeScript with a literal-union/interface-backed shared contract; no `any`, no unexplained non-null assertions, no `@ts-ignore`/`@ts-nocheck` anywhere in the new code.
- `npm run typecheck` and `npm run build` clean; `npm run lint`/`npm test` show no new failures versus the Phase 3 baseline.
- The sole existing importer (`assets/configuration.js`) required no changes beyond the `tsconfig.json` glob-based `include` (verified via `grep -rn "data/towers"`).
- `scripts/unit-test-core.cjs` gained tests for the registry's real invariants (uniqueness, numeric domains, `nextTierId` resolution, ordering, gate/placeable special-casing, freeze behavior, build-output completeness) — not just static-data presence.
- Manual/browser verification was not performed; this is recorded above rather than claimed.

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
- `assets/preferences.ts` (Phase 3) mixes pure preference storage/normalization logic with ~25 `bind*` DOM-wiring functions, the same "mixed concerns migrated as one unit" pattern already accepted for `autoSave.ts` and `spireFloatingMenu.ts` in Phases 1–2, rather than being split into a pure-logic module plus a separate DOM-binding module. A future phase could split these if a pure-logic-only module becomes valuable for further testing, but doing so was out of scope here.
- Two functions in `assets/preferences.ts` (`updateNotationPreviewDamage`'s `document.getElementById` call and `applySpireOptionsPlacementDom`'s `document.body` access) call the DOM directly without a `typeof document !== 'undefined'` guard, unlike most of the rest of the file. This is inherited unchanged from the original `.js` (not a defect introduced by the migration) but means these two paths would throw if ever invoked in a non-browser environment without a `document` global — the new unit tests work around this with a minimal `document` stub rather than fixing the underlying inconsistency, per the instruction to record rather than silently fix pre-existing quirks outside the phase's explicit scope.

---

## Next Suggested Step

**Recommended Phase 4: Static Configuration and Tower Definition Data Schemas.**

With navigation (Phase 1), core formatting/persistence primitives (Phase 2), and the user-preferences module (Phase 3) now typed, the next highest-leverage, lowest-risk slice is typing the static/config-shaped data that many gameplay systems read but that itself contains no simulation logic — e.g. tower definition tables, upgrade-cost tables, or other declarative config objects (the exact file(s) must be re-derived by reading this plan and inspecting the current repository at the start of that phase, per the standing operating instructions, rather than assumed from this note). This continues the "small, widely-imported utility/config tier before anything stateful/simulation-heavy" progression explicitly called out in Phase 3's rationale, and stays well clear of towers/enemies/combat/playfield-rendering runtime logic, which should remain deferred to a later phase once more of their typed dependencies exist.

**Acceptance criteria for Phase 4:**
- The phase's actual file scope is re-derived by reading this plan plus a fresh inspection of the repository (do not assume the exact filename without checking; static config in this repo may be spread across several small files rather than one).
- Migrated file(s) compile under strict TypeScript with literal unions/interfaces for each config shape (tower id, stat fields, cost curves, etc. as applicable) — no `any`, no unexplained non-null assertions, no `@ts-ignore`/`@ts-nocheck`.
- `npm run typecheck` and `npm run build` clean; `npm run lint`/`npm test` show no new failures versus this document's Phase 3 baseline (the same 4 pre-existing favicon smoke-test errors are expected and not a regression).
- Every existing importer of the migrated file(s) requires no changes beyond `tsconfig.json`'s `include` list (verified via `grep -l` for each migrated module's old `.js` import specifier).
- `scripts/unit-test-core.cjs` (or a clearly-related sibling script, still framework-free `node:assert/strict`) gains tests for any non-trivial derived/computed values in the migrated config (e.g. a cost-scaling formula), not just static data presence.
- Manual/browser verification confirms no visible change in whatever UI reads the migrated config (e.g. tower costs/stats displayed unchanged).
- The plan document is updated in the same session per the standing "After implementation" instructions, including an Implementation Log entry that does not erase this or any prior entry.

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

### 2026-07-13 — Phase 3 executed (resumed after a mid-task crash)

**Status:** COMPLETE

A prior agent run on this same phase crashed mid-task after marking Phase 3 IN PROGRESS in this document but before writing `assets/preferences.ts`. This session resumed from that exact state: `assets/preferences.js` was still untouched JS, no `.ts` file existed, and the plan's Phase 3 section already recorded the scope decision and importer list from the crashed run's investigation. That recorded scope was re-verified against the live repository (file still 1627 lines; the same 13 importers found via a fresh `grep`) and required no correction.

See the "Phase 3 — User Preferences Module (`assets/preferences.js`) (COMPLETE)" section above, particularly its "Resolution" subsection, for the full file list, types introduced, tests added, and validation/browser-verification results. Summary:

- Converted `assets/preferences.js` → `assets/preferences.ts` (strict TypeScript, single typed-adapter unit, same precedent as `autoSave.ts`/`spireFloatingMenu.ts`). Deleted the old `.js` source; the compiled `.js` sibling is regenerated by `npm run build`.
- `tsconfig.json` gained one new `include` entry (`assets/preferences.ts`). No other build/tooling change.
- Introduced `GraphicsMode`, `TrackRenderMode`, `DamageNumberMode`, `LoadoutToggleSide`, `SpireOptionsPlacement` literal unions, a shared `PersistOptions` type, and minimal structural `PlayfieldLike`/`PowderSimulationLike` adapter interfaces; reused (rather than redefined) `GameNumberNotation` from `scripts/core/formatting.ts`.
- No importer required any edit — all 13 files listed above kept their existing `./preferences.js`/`../preferences.js` specifiers.
- Extended `scripts/unit-test-core.cjs` with 17 new tests (29/29 total passing) and a new `importPreferencesModule()` helper (copies the module's small relative-import dependency tree into a scratch ESM package) plus a minimal `document` stub needed by two DOM-touching code paths inherited unchanged from the original `.js`.
- `npm run typecheck`, `npm run build`, `npm run lint` all clean; `npm test` fails with the same 4 pre-existing favicon errors as every prior phase's baseline (no new failures); `npm run test:unit` 29/29.
- Manual browser verification: app loads with no console errors; toggling graphics mode, notation, and glyph-equation-visibility through their real UI controls (Options tab) correctly updated both the DOM (button labels, `body` class) and the corresponding `localStorage` keys.
- `assets/buildInfo.js#BUILD_NUMBER` incremented from 725 to 726.

**Next suggested step:** See the "Next Suggested Step" section below (recommending Phase 4: Static Configuration and Tower Definition Data Schemas, or an equivalent bounded next slice).
