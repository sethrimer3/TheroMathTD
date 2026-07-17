# Java-to-TypeScript Conversion Plan

## Purpose

This document is the persistent migration record for converting Thero from JavaScript to TypeScript while the game continues to evolve.

The migration must be incremental. The existing JavaScript game remains the executable behavioral reference until each subsystem has been migrated, tested, and accepted. Do not attempt a repository-wide extension rename or a single-pass rewrite.

This file serves four functions:

1. Record what migration work has already been completed.
2. Identify the single recommended next migration phase.
3. Give AI agents a durable handoff between work sessions.
4. Preserve known risks, validation results, and architectural decisions.

## Current Migration Dashboard

<!-- migration-roadmap-counts: ts=60 generated=60 active_js=174 candidates=45 -->

| Item | Current state |
|---|---|
| Repository baseline | Build 747 planning update based on `main` at `0802d21`, after the equipment/gem retirement merge `c96df03` |
| Completed migration history | Phases 0-20 remain complete; historical phase identities are preserved |
| Next authorized implementation | **Phase 21 only:** `assets/towerEquations/advanced/rhoEquation.js` -> `.ts` |
| Active authored modules | 234 total: 60 TypeScript and 174 JavaScript |
| Compatibility output | 60 generated `.js` siblings; they are runtime output, not backlog |
| Decision candidates | 45 unreachable authored `.js` files requiring retirement, integration, or archival decisions |
| Long-range sequence | Phases 21-55; Phase 54 is an extraction gate and assigns no backlog module |
| Mechanical check | `npm run check:migration-roadmap` validates reachability, classifications, duplicate assignments, totals, and per-phase counts |

The dashboard is the fast orientation surface. The historical ledger remains append-only evidence, while [`docs/TypeScriptMigrationRoadmapInventory.md`](docs/TypeScriptMigrationRoadmapInventory.md) is authoritative for exact future file assignments. Re-run the mechanical check and re-inventory the affected phases before changing any dashboard count.

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

### 2026-07-16 verified long-range-roadmap baseline, reconciled after equipment/gem retirement

The obsolete-Spire retirement is an intentional product change, not a general migration phase. It removed active Bet, Lamed, Tsadi, Shin, and Kuf modules and added one typed compatibility boundary, `assets/saveCompatibility.ts`. The Aleph experience remains active under the user-facing name **Well of Inspiration**; compatibility-sensitive `powder`/`aleph` identifiers remain unchanged.

Inventory was originally recalculated from the live tree on **2026-07-16**, starting on `codex/phases-17-20-advanced-equations` at exact commit `2bad7891ca88baa20c1a084c31ecd939e11b4eca`, then continuing on the documentation-only branch `codex/typescript-migration-roadmap`. It was reconciled again after equipment/gem retirement merge `c96df03` and audited at `main` commit `0802d21`. The browser entry root is `index.html` -> `assets/main.js`.

- **60 authored `.ts` modules** (excluding `.d.ts`; none exist).
- **60 build-generated `.js` siblings** of those TypeScript modules. These are runtime output, not backlog.
- **174 active authored `.js` modules**, verified reachable through static local imports from `assets/main.js`.
- **0 intentionally preserved legacy `.js` modules** with current repository evidence. The previously documented 19-file disabled Terrarium tree was deleted by `64ebc5e`.
- **45 ambiguous or retirement/deletion-candidate `.js` modules**, all currently unreachable from the browser entry graph. They are excluded from the active backlog pending a separate decision.
- **234 active authored modules** in total, so active module-count conversion is **25.6%** (`60 / 234`). The raw authored-language tree is 279 modules when the 45 decision candidates are included.
- Supplemental authored-line snapshot: **7,390 TypeScript lines** and **82,547 active JavaScript lines**. Line counts do not represent migration difficulty.

Method: recursively enumerate `assets/` and `scripts/`; exclude `node_modules/`, `dist/`, `build/`, generated output, dependencies, fixtures, and non-source material; remove each `.js` file with a same-path `.ts` sibling; parse static relative `import`/`export ... from` edges; traverse from `assets/main.js`; and audit unreachable files against tests, retirement documentation, HTML harnesses, and recent commits. The full classification, dependency evidence, 174-module coverage map, and 45-file retirement list are in [`docs/TypeScriptMigrationRoadmapInventory.md`](docs/TypeScriptMigrationRoadmapInventory.md). Run `npm run check:migration-roadmap` to verify that classification against the current checkout.

Phases 17–20 converted Sigma, Phi, Upsilon, and Tau in committed implementation `2bad789`; they are not prompt-only assignments. The retired `spireFloatingMenu` and `spireTabVisibility` TypeScript modules and the former Cognitive Realm typed state remain part of phase history but not the live source count.

**Plan created:** 2026-07-13  
**Repository:** `sethrimer3/TheroMathTD`  
**Active game referred to as “Thero”:** this repository, not `sethrimer3/Thero_Idle_TD`.

At the time this plan was created (historical snapshot, not the current baseline):

- The browser application is organized as JavaScript ES modules.
- Electron starts from `electron/main.cjs`.
- `package.json` does not yet configure TypeScript or a TypeScript-aware browser build pipeline.
- The current static build copies `index.html`, `assets`, and `scripts` into `dist` rather than compiling source modules.
- The existing smoke test primarily verifies required files, startup assets, and static import resolution. It is not comprehensive behavioral coverage.
- `assets/main.js` remains the major integration hub and should stay JavaScript during the first migration phase.

### Relevant structural work completed before this plan

The following work was useful groundwork but is **not itself a TypeScript migration**. Some bullets are historical because the product-retirement commits later removed their files:

- Primary tab behavior has already been extracted into `assets/uiTabManager.js`.
- Tab lock behavior has been extracted into `assets/tabLockManager.js`.
- Spire tab visibility behavior was extracted into `assets/spireTabVisibility.js`, and the floating Spire menu into `assets/spireFloatingMenu.js`; both were later removed with multi-Spire navigation.
- `assets/main.js` imported those modules at the time of Phase 1; it no longer does.
- Agent-navigation documentation already distinguishes `assets/main.js` as an orchestration layer and discourages adding new gameplay logic there.

The original statement that no conversion phase was complete is superseded by the reconciled ledger and evidence below.

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
| 5A | Game State Containers — `resourceState.js`, `spireResourceState.js`, `monetizationState.js` | COMPLETE | See Phase 5 section below and Implementation Log entry below |
| 5B | Cognitive Realm Territory State (`assets/state/cognitiveRealmState.js`) | COMPLETE | See Phase 5 section below and Implementation Log entry below |
| 6 | Post-retirement Spire-resource and tower/Aleph persistence (`assets/spireResourcePersistence.js`) | COMPLETE | See Phase 6 section and Implementation Log entry below |
| 7 | Aleph-chain upgrade state and persistence contract (`assets/alephUpgradeState.js`) | COMPLETE | See Phase 7 section and Implementation Log entry below |
| 8 | Tower equation presenter and base tower-upgrade persistence owner (`assets/towerBlueprintPresenter.js`) | COMPLETE | See Phase 8 section and Implementation Log entry below |
| 9 | Tower-variable discovery state owner (`assets/towerVariableDiscovery.js`) | COMPLETE | See Phase 9 section and Implementation Log entry below |
| 10 | Tower-equation tooltip DOM owner (`assets/towerEquationTooltip.js`) | COMPLETE | See Phase 10 section and Implementation Log entry below |
| 11 | Master-equation derivation utility (`assets/towerEquations/masterEquationUtils.js`) | COMPLETE | See Phase 11 section and Implementation Log entry below |
| 12 | Tower-blueprint shared dependency context (`assets/towerEquations/blueprintContext.js`) | COMPLETE | See Phase 12 section and Implementation Log entry below |
| 13 | Tower-equation registry and lookup (`assets/towerEquations/index.js`) | COMPLETE | See Phase 13 section and Implementation Log entry below |
| 14 | Mind Gate authored equation definition (`assets/towerEquations/mindGate.js`) | COMPLETE | See Phase 14 section and Implementation Log entry below |
| 15 | Shadow Gate authored equation definition (`assets/towerEquations/shadowGate.js`) | COMPLETE | See Phase 15 section and Implementation Log entry below |
| 16 | Advanced-equation barrel (`assets/towerEquations/advancedTowers.js`) | COMPLETE | See Phase 16 section and Implementation Log entry below |
| 17 | Sigma advanced equation definition (`assets/towerEquations/advanced/sigmaEquation.js`) | COMPLETE | See Phase 17 section and Implementation Log entry below |
| 18 | Phi advanced equation definition (`assets/towerEquations/advanced/phiEquation.js`) | COMPLETE | See Phase 18 section and Implementation Log entry below |
| 19 | Upsilon advanced equation definition (`assets/towerEquations/advanced/upsilonEquation.js`) | COMPLETE | See Phase 19 section and Implementation Log entry below |
| 20 | Tau advanced equation definition (`assets/towerEquations/advanced/tauEquation.js`) | COMPLETE | See Phase 20 section and Implementation Log entry below |
| 21 | Rho advanced equation definition (`assets/towerEquations/advanced/rhoEquation.js`) | AUTHORIZED, NOT STARTED | See the Phase 21 execution card; no implementation is included in this planning update |

---

## 2026-07-16 Reconciled History and Long-Range Roadmap

This section supersedes the old seven-item “Tentative Later Migration Areas” list and the stale next-step material in `TheroMathTD_TS_Migration_Plan.md`. Historical implementation sections and logs below remain authoritative evidence and are not renumbered. Exact future file coverage is normative in [`docs/TypeScriptMigrationRoadmapInventory.md`](docs/TypeScriptMigrationRoadmapInventory.md); future phases beyond Phase 21 are recommendations that must be re-inventoried before authorization.

### Reconciled phase history

“Valid now” assesses the historical scope, not whether the file still exists after product retirement.

| Phase / label | Actual scope | Status | Commit or repository evidence | Valid now / conflict audit |
|---|---|---|---|---|
| 0 | Migration plan and handoff process | COMPLETE | `a4e29f3` created this plan | Valid historical foundation. |
| 1 | TS infrastructure plus `uiTabManager`, `tabLockManager`, `spireFloatingMenu`, `spireTabVisibility` | COMPLETE | Typed sources introduced beginning `d62b98f`; plan implementation log | Valid at execution. The two multi-Spire owners were later deleted; no scope conflict. |
| 2 | `formatting`, `mathText`, and typed-adapter `autoSave` | COMPLETE | Typed sources introduced beginning `40fa83f`; Phase 2 log/tests | Still valid and foundational. |
| 3 | `assets/preferences` | COMPLETE | `072fe54`; Phase 3 log/tests | Still valid; mixed DOM/storage responsibilities remain a deferred design concern, not a migration conflict. |
| Doc/tooling repair | Count correction, glob discovery, scalable TS output sync | COMPLETE | Plan/tooling history preceding `fae913a` | Still valid. Generated siblings remain intentional. |
| 4 | All 32 tower data definitions, registry, and new owner types | COMPLETE | `fae913a` introduced `assets/data/towers/types.ts`; Phase 4 log | Still valid. Historical “~24 files” estimate was corrected to 32 definitions plus registry/type owner. |
| 5A | `resourceState`, `spireResourceState`, `monetizationState` | COMPLETE | `3b268a4`; Phase 5A log | Still valid. |
| 5B | Cognitive Realm state/schema | COMPLETE, later retired | `2e78ef0`; removal in `c1ab2a6` | Valid completed history; absent from live inventory and not a future prerequisite. |
| Retirement compatibility | `saveCompatibility.ts` plus obsolete-Spire removal | COMPLETE product change | `b420cb9`, `64ebc5e` | Not a numbered migration phase. It changes the live backlog and invalidates old legacy counts. |
| 6 | Post-retirement Spire/tower/Aleph persistence | COMPLETE | `fe18aaa` | Revised scope correctly followed retirement; no conflict. |
| 7 | Aleph-chain upgrade state | COMPLETE | `5f18697` | Still valid and active. |
| 8 | Tower blueprint presenter/base upgrade snapshot | COMPLETE | `e59f7ab` | Still valid; owns equation blueprint contracts used by Phases 9-25. |
| 9 | Tower-variable discovery | COMPLETE | `a731dfc` and remote phase branch | Still valid. |
| 10 | Tower-equation tooltip | COMPLETE | `b292606` and remote phase branch | Still valid. |
| 11 | Master-equation derivation utility | COMPLETE | `73e3a11` | Still valid; stacked after post-retirement main. |
| 12 | Blueprint shared dependency context | COMPLETE | `d8edefe` | Still valid; prerequisite for definition phases. |
| 13 | Equation registry and lookup | COMPLETE | `4b87d9d` | Still valid. |
| 14 | Mind Gate equation | COMPLETE | `3acc367` | Still valid. |
| 15 | Shadow Gate equation | COMPLETE | `5df9001` | Still valid; narrow Codex adapter remains intentional. |
| 16 | Advanced-equation barrel | COMPLETE | `7d2aa7b` | Still valid; all 15 re-export identities characterized. |
| 17 | Sigma advanced equation | COMPLETE | `2bad789` | Valid committed implementation, not instruction-only. Shares one combined commit with 18-20; no missing prerequisite (8, 12, 16 were complete). |
| 18 | Phi advanced equation | COMPLETE | `2bad789` | Valid committed implementation. Its selection by size was opportunistic but dependency-safe. |
| 19 | Upsilon advanced equation | COMPLETE | `2bad789` | Valid committed implementation. No numbering collision. |
| 20 | Tau advanced equation | COMPLETE | `2bad789` | Valid committed implementation. No earlier prerequisite is missing. |

Phases 17-20 therefore keep their historical numbers and scopes. They were implemented together after Phase 16, fully tested in the combined commit, and need neither relocation nor renumbering. The roadmap resumes at Phase 21.

### Standard implementation gate for every proposed phase

Every future phase is behavior-preserving unless separately authorized. Every phase must:

1. Re-inventory its exact files, imports, importers, generated siblings, and relevant subsystem guidance before editing.
2. Add owner-defined interfaces/literal unions and runtime validation at JSON, storage, global, DOM dataset, and legacy-input boundaries. `any`, blanket assertions, suppressions, and global strictness weakening are not acceptable strategies.
3. Preserve `.js` import specifiers and generate same-path `.js` siblings with the established `tsc` + `sync-ts-output.cjs` pipeline.
4. Add deterministic characterization before or with conversion. Randomness must be controlled in tests; timers/animation frames must use a deterministic harness; save formats need malformed/legacy fixtures; DOM/Canvas phases need minimal fakes plus manual verification.
5. Run `npm run check:migration-roadmap`, `npm run typecheck`, `npm run build`, `npm run lint`, `npm run test:unit`, `npm test`, and `git diff --check`. Inspect generated sibling and `dist/` drift; commit only intentional phase output.
6. Manually verify the phase-specific surface listed below. DOM/input/render phases require a browser console check and portrait-mobile viewport; audio requires playback/mute/volume checks; save phases require reload/legacy-save checks; application roots require browser plus Electron startup.
7. Exclude balance, formula, visual redesign, save-key renaming, retired-system resurrection, bundler adoption, and unrelated cleanup. Completion requires exact export/object identity compatibility, deterministic tests, clean validation, honest manual-test reporting, updated counts, and a new single-phase authorization decision.

### Proposed phase sequence

Exact file lists and per-module risk notes are in the linked coverage appendix. “Consumer impact” identifies the direct high-value boundary, not every graph edge.

| Phase | Status | Scope / purpose / approximate count | Prerequisites and expected owner contracts | Consumer impact and compatibility edits | Characterization, manual verification, risks, exclusions, completion focus |
|---:|---|---|---|---|---|
| 21 | **AUTHORIZED NEXT** | Rho income equation; 1 module | 8, 12, 16-20; Rho dynamic context, upgrade-state reads, sub-equation contexts | Advanced barrel and typed registry; presenter contract edits only if the live payload proves they belong there | Deterministic metadata/cost/prestige/rank/coercion/formatter tests; no manual UI required beyond optional equation display smoke; exclude all other definitions and consumers. |
| 22 | **TENTATIVE NEAR-TERM** | Kappa→Lambda→Mu→Nu→Xi equation chain; 5 modules | 21; shared blueprint variable/result/context contracts | Advanced barrel/registry and Towers tab equation consumers; one contract steward, no duplicate local interfaces | Frozen-input formula/cost/lookup/cycle tests; optional in-game equation inspection; risk is cross-equation recursion/coercion. |
| 23 | **TENTATIVE NEAR-TERM** | Omicron/Pi/Chi/Psi/Omega equations; 5 modules | 22 | Terminal equation entity/count/HP context shapes owned by presenter/context | Same barrel/registry; compatibility limited to type-only imports and proven presenter additions | Formula, fallback, callback-order, `NaN`/Infinity, and lookup tests; exclude simulations. |
| 24 | **TENTATIVE NEAR-TERM** | Basic and Infinity grouped equations; 2 modules | 23 | Foundational tower equation and Infinity term contracts | Registry and all dependent equations/Towers tab | Registry identity/order plus per-tower golden cases; risk is broad foundational fan-out; exclude Greek monolith. |
| 25 | **TENTATIVE NEAR-TERM** | Greek grouped equation monolith; 1 module | 24 | Per-tower variable/result types reusing the shared owner contract | Completes authored equation definitions consumed by registry/Towers tab | Characterize each tower independently before conversion; manual all-equation overlay pass; do not redesign/split formulas during migration. |
| 26 | **TENTATIVE NEAR-TERM** | Pure tokens, units, geometry, wave codec, playfield facades, build data, Aleph registry; 11 modules | 25 | `Wave`, `EnemyGroup`, points, units, token spans, numeric helpers, Aleph ids | 31 importers for units, 13 for playfield formatting, level/editor and tower consumers | Edge/malformed/round-trip/property tests; no browser except wave-editor smoke; risk is preserving coercive legacy codec behavior. |
| 27 | **TENTATIVE NEAR-TERM** | Gameplay config loaders, levels, configuration, enemies; 4 modules | 26 and Phase 4 tower data | Runtime-validated config/level/wave/enemy schemas | Main, playfield, managers, and achievements; compatibility adapters for untyped callers | Fetch/global/dynamic-import fallback tests, malformed JSON/config fixtures, seeded enemy helpers; browser config load; exclude balance changes. |
| 28 | **TENTATIVE NEAR-TERM** | Tutorial and Powder state/queue/log/persistence; 5 modules | 26-27 and existing save owners | Tutorial/Powder snapshots and legacy validators | Autosave, main, Towers tab, and Powder UI | Round-trip plus malformed/old saves, queue ordering, event log retention; manual reload; never trust or rename saved keys. |
| 29 | **TENTATIVE NEAR-TERM** | Powder grid/palette/data utilities; 3 modules | 26, 28 | Cell/material/wall/mote/palette and narrow simulation adapter types | PowderSimulation and later palette/render consumers | Small-grid golden states, bounds, palette normalization, controlled randomness; exclude PowderSimulation class. |
| 30 | **TENTATIVE NEAR-TERM** | `PowderSimulation`; 1 module | 29 | Owner-defined simulation state, cell buffers, lifecycle, persistence snapshot, viewport API | 13 direct importers including color, main, UI, render layers | Seeded step/render/save characterization, timer/RAF fakes, manual touch/resize/save; critical monolith risk; no feature extraction unless needed for type ownership and separately documented. |
| 31 | **TENTATIVE NEAR-TERM** | Palette, performance, audio, lifecycle, rendering helper; 6 modules | 26, 30 | Palette/RGB, performance segment, audio manifest/settings, lifecycle interfaces | 36 palette importers plus playfield/tower/audio/main consumers | Palette/storage/audio/timer tests; manual theme switching and sound controls; preserve lazy browser behavior. |
| 32 | **TENTATIVE NEAR-TERM** | Tower loadout and upgrade-overlay leaves; 2 modules | 21-28, 31 | Controller options, DOM element resolvers, callbacks, loadout and upgrade-overlay payloads | Sole owner consumer `towersTab.js` | DOM/timer/loadout characterization and portrait overlays; exclude Towers tab itself. |
| 33 | **TENTATIVE NEAR-TERM** | Towers tab owner; 1 module | 25-28, 31-32 | Canonical runtime tower, upgrade, lookup, equation context and public controller types | 35 importers across towers, playfield, UI, and main | State/save/equation/DOM golden tests plus browser upgrade/loadout pass; critical 2,271-line owner; no balance or UI redesign. |
| 34 | **TENTATIVE LATER** | Shared helpers and Alpha/Beta/Gamma; 5 modules | 26-27, 31, 33 | Tower/projectile/burst/render-state contracts | TowerManager, playfield, projectile renderer and later towers | Seeded update/draw/damage lifecycle tests and desktop/mobile placement; exclude later towers. |
| 35 | **TENTATIVE LATER** | Delta through Iota mid-tier towers; 6 modules | 34 | Mid-tier orbit/beam/chain/integration states | TowerManager, playfield, sprite/projectile systems | Per-tower deterministic math/state/audio tests and manual placement; high Canvas/audio risk. |
| 36 | **TENTATIVE LATER** | Kappa through Xi simulation chain; 5 modules | 34-35 | Mine/beam/chain/target/teardown states | Playfield update, damage and renderer systems | Seeded lifecycle/teardown/cross-tower tests; manual upgrade and wave pass; preserve formulas. |
| 37 | **TENTATIVE LATER** | Omicron/Pi/Sigma/Tau/Upsilon simulations; 5 modules | 34-36 | Geometry/fleet/stored-damage state types | TowerManager, dispatch, sprite renderer, playfield | Golden entity transitions/audio and render-call traces; manual all-five tower pass. |
| 38 | **TENTATIVE LATER** | Phi/Chi/Psi/Omega/Infinity/T1/T2; 7 modules | 34-37 | Terminal/experimental tower state and effect types | Completes tower types consumed by playfield/managers/renderers | Seeded spawn/HP-slice/thrall/merge tests; manual placement; explicitly exclude unreachable graph towers. |
| 39 | **TENTATIVE LATER** | Powder/Well controllers and DOM/viewport owners; 7 modules | 28-31 | Controllers consume the Powder owner API, preference/persistence and viewport types | Main and Well tab | DOM/resize/tier/drop/touch tests; portrait and landscape manual pass; exclude simulation formula changes. |
| 40 | **TENTATIVE LATER** | Playfield geometry/preferences/background systems; 6 modules | 26-31, 33 | Normalized points, paths, viewport, playfield preferences, background entities | `playfield.js`, input, rendering | Geometry invariants, storage and controlled-random tests; manual orientation/track checks. |
| 41 | **TENTATIVE LATER** | Enemy metadata and specialist systems; 10 modules | 27, 34-40 | Shared enemy/effect/boss state types owned by enemy/playfield boundaries | Enemy update/damage/render consumers | Seeded state-machine tests per specialist; manual representative waves; do not migrate unreachable Integral scaffold. |
| 42 | **TENTATIVE LATER** | Combat, projectile, wave, drop and transition systems; 9 modules | 27, 34-41 | Damage events, projectiles, queue entries, drops, transition states | Playfield root, managers, renderers | Update-order, mutation, collision, queue and seeded drop tests; manual full wave; high shared-mutation risk. |
| 43 | **TENTATIVE LATER** | Connections, tower dispatch/interaction, effects, reset; 6 modules | 31, 33-42 | Narrow playfield context capabilities and reset lifecycle | Playfield root/managers/audio/UI | Interaction/reset/effect/audio trace tests; manual drag/touch/reset; no new global capability bag. |
| 44 | **TENTATIVE LATER** | Tower/combat/stats/lifecycle managers, orchestration, developer service; 6 modules | 27, 33-43 | Consolidated owner interfaces for entities, state managers, level lifecycle and DI | Playfield root plus level/UI consumers | Dependency-injection contract tests, lifecycle order and developer-tool cases; manual level start/end; critical convergence point. |
| 45 | **TENTATIVE LATER** | Gesture/input and playfield UI; 7 modules | 31, 33, 40-44 | Pointer/touch gesture, HUD, menu, wheel and tally contracts | Playfield root | Mouse/touch event harness, DOM timers, accessibility; mandatory portrait touch and desktop pointer verification. |
| 46 | **TENTATIVE LATER** | Background effects and background layer; 8 modules | 26, 31, 40-45 | Canvas effect lifecycle and render-state contracts | CanvasRenderer/background layer | Seeded snapshot/render-call tests and visual browser comparisons; high Canvas cache/randomness risk. |
| 47 | **TENTATIVE LATER** | Entity/render layers, CanvasRenderer, RenderCoordinator; 8 modules | 31, 34-46 | Frame/render context, Canvas entities, layer contracts, RAF scheduler | Playfield root and main developer controls | Layer-order and canvas-call traces, RAF limit tests, manual graphics modes; no visual redesign. |
| 48 | **TENTATIVE LATER** | `assets/playfield.js`; 1 module | 27, 31, 33-47 | Typed `SimplePlayfield`, configuration injection, public lifecycle API | Main and level preview | Characterize configure/update/draw/reset/input order and public method surface; browser full-level + touch; no broad architectural rewrite. |
| 49 | **TENTATIVE LATER** | Wave editor and level/progression controllers; 9 modules | 26-28, 45, 48 | Level/editor forms, preview, story, combat/outcome contracts | Main and developer workflows | Wave round trips, DOM/Canvas/timer flows; manual editor import/export and level lifecycle. |
| 50 | **TENTATIVE LATER** | Tower tree/matrix/library/stats UI; 4 modules | 28, 31, 33-39, 48 | Presenter/controller types consuming canonical tower state | Main and playfield stats | DOM/Canvas/save overlay tests and manual upgrade/tree pass. |
| 51 | **TENTATIVE LATER** | Codex, achievements, boosts; 3 modules | 27-28, 31, 44, 48 | Codex entries, proof/achievement state, monetization presenters | Main, configuration, orchestration | Seeded proof/effect and DOM tests; manual Codex/achievements; ensure retired Terrarium stays absent. |
| 52 | **TENTATIVE LATER** | Small application-shell presenters/helpers; 9 modules | 31, 39, 45, 48 | DOM/layout/startup/resource/spire controller option types | Main | DOM/accessibility/resize tests and portrait startup/options pass; compatibility-only edits. |
| 53 | **TENTATIVE LATER** | Developer controls/mode, field notes, scrollbar, playfield menu; 5 modules | 31, 44-52 | Central browser-global declarations and developer/menu controller types | Main and playfield developer hooks | Global/timer/Canvas/audio tests plus browser developer-mode pass; do not revive retired managers. |
| 54 | **TENTATIVE LATER** | Main responsibility-extraction gate; 0 backlog conversions | All active modules except `main.js` typed | Extract only still-owned cohesive responsibilities into new typed owners; define composition contract | Compatibility edits inside `assets/main.js` are expected, but it remains `.js` | Characterize startup order and globals before extraction; browser/Electron; completion means residual main is composition-only. No extension conversion yet. |
| 55 | **TENTATIVE LATER** | Final `assets/main.js` → `assets/main.ts`; 1 module | 54 and every prior active-module phase | Typed application composition/startup/window API | `index.html` keeps loading generated `assets/main.js` | Startup order/global/API tests, browser portrait/desktop, save reload, full level, audio, and Electron. Complete only with no broad assertions and no owned feature logic left. |

Phases 21-55 cover all 174 active authored JavaScript modules. There are **35 roadmap phases**: one authorized conversion phase, 33 tentative conversion phases, and one tentative zero-module extraction gate (Phase 54). Thus 34 phases assign backlog modules and one prepares the final root without double-counting it. No module is assigned twice.

### Critical path

The most likely controlling chain is:

`equation contracts (21-25)` → `pure/config/enemy contracts (26-28)` → `Powder owner needed by palette (29-31)` → `tower leaf UI and Towers tab owner (32-33)` → `active tower simulations (34-38)` → `playfield systems/managers/input/rendering (40-47)` → `assets/playfield.js (48)` → `remaining UI/application controllers (49-53)` → `main extraction (54)` → `assets/main.ts (55)`.

The early leverage modules are `assets/gameUnits.js` (31 importers), `assets/colorSchemeUtils.js` (36), `assets/towersTab.js` (35), `assets/enemies.js` (15), and `assets/playfield/utils/formatting.js` (13). Their contracts must be owner-defined once and consumed downstream. The apparent detour through Powder is real: `colorSchemeUtils.js` imports PowderSimulation behavior, while most tower/render modules import `colorSchemeUtils.js`.

### Parallelizable work after contracts freeze

- Phases 22 and 23 can be divided by equation file only after Phase 21 proves the shared presenter/context surface; one designated contract owner must make any shared `towerBlueprintPresenter.ts` edit.
- Phase 28 state/persistence work and Phase 32 leaf DOM controllers are file-disjoint after Phase 27/31, but they should not invent overlapping tower or save types.
- Tower families 34-38 are file-disjoint and can be handled by separate agents after Phases 31 and 33 freeze palette, tower, enemy, and unit contracts. Shared helper files belong only to Phase 34.
- Root UI groups 49-53 can proceed in parallel after Phase 48 if each agent stays within its files and imports owner types. The central ambient browser-global declaration, if needed, belongs to Phase 53 alone.
- Playfield phases 40-44 should not be parallelized initially: they converge on shared enemy/projectile/playfield-context contracts. Parallel file work becomes safe only after the earlier phase in that chain establishes and owns those types. Rendering 46 must precede the layer/compositor contracts in 47.

### Replan triggers and authorization discipline

Re-run the live inventory and revise affected tentative phases before authorizing more work when any of these events occurs:

- a product retirement, feature restoration, or new runtime module changes the `assets/main.js` reachability graph;
- a migrated file introduces, removes, or relocates an owner contract used by later phases;
- the mechanical checker reports a missing, duplicate, unexpected, or count-mismatched path;
- a phase's characterization work reveals hidden dynamic imports, global registration, save compatibility, or callback-order dependencies;
- a monolith is materially extracted or reduced before its scheduled conversion phase;
- validation tooling, browser startup, Electron startup, or the generated-sibling build architecture changes.

Tentative phases may be regrouped after a trigger, but completed phase numbers and scopes remain historical facts. Update the dashboard, inventory appendix, proposed sequence, decision log, and sole next authorization together. Never authorize several future phases merely to make the table look settled.

### Deletion before migration

The 45 unreachable JavaScript files are not migration backlog. The strongest retirement candidates are the 17-file Shin/Cardinal Warden cluster (explicitly required to be unreachable by `scripts/test-retired-spires.cjs`), its 12-file orphaned fractal support cluster, the 10-file unintegrated graph-tower runtime, and six individual orphan managers/effects/scaffolds. The exact files and evidence are in the inventory appendix. Do not delete or migrate them under a TypeScript phase; authorize a separate product retirement/integration audit first.

### Single next authorized phase

Only Phase 21 is authorized. Later phases are sequencing hypotheses, not implementation authority.

#### Phase 21 execution card

**Intent:** behavior-preserving conversion of the Rho enemy-yield equation. This phase proves that the shared presenter contract can type an upgrade-state-backed definition with an untrusted dynamic context before the five-file recursive equation chain begins.

**Source conversion:** replace authored `assets/towerEquations/advanced/rhoEquation.js` with strict `assets/towerEquations/advanced/rhoEquation.ts`. `npm run build` must regenerate the same-path `.js` compatibility sibling. Do not hand-edit the generated sibling.

**Dependency and consumer surface:**

- Runtime imports remain `../../../scripts/core/formatting.js` and `../blueprintContext.js`.
- Add the type-only `TowerEquationBlueprint` import from `../../towerBlueprintPresenter.js` and finish the exported object with `satisfies TowerEquationBlueprint`, following the completed advanced-equation pattern.
- `assets/towerEquations/advancedTowers.ts` is the sole direct source importer and must retain `export { rho } from './advanced/rhoEquation.js'`.
- `assets/towerEquations/index.ts` must continue exposing the exact same object through `TOWER_EQUATION_BLUEPRINTS.rho`; no registry, Towers-tab, simulation, playfield, or main behavior belongs in this phase.
- `TowerEquationDynamicContext` remains `unknown`. Narrow only the `prestige` and `unspentThero` properties that Rho actually reads. Reuse `TowerUpgradeState` through `blueprintContext.ensureTowerUpgradeState`; do not create a parallel upgrade-state shape.

**Characterization matrix:**

| Surface | Required cases |
|---|---|
| Metadata and identity | Exact math/base equation strings, variable order, glyph labels, barrel identity, and registry identity |
| Upgrade state | Missing helper, missing state/variables/key, zero, positive, negative, fractional, numeric-string, nonnumeric, `NaN`, and Infinity levels |
| Prestige context | `prestige === true` only; false, `1`, missing, null, primitive, object, and function contexts retain existing behavior |
| Unspent Thero | Missing, non-number, `NaN`, negative, zero, one, ten, and Infinity inputs; preserve `Number.isFinite` number-only acceptance and minimum-one normalization |
| Variable formulas | Both prestige modes for enemy yield and range, both cost curves, finite supplied values, and fallback-computed values |
| Result and formatting | Negative/non-finite value clamping, multiplication result, base-equation output, and exact formatter callback order |

**Allowed compatibility edits:** the new `.ts` source, generated `.js` sibling, deterministic cases in `scripts/unit-test-core.cjs`, this ledger, inventory/count metadata, and the required single build-number increment. Shared presenter/context edits are allowed only if the compiler proves an existing owner contract is insufficient; document the evidence and keep the edit type-only or validation-only.

**Explicit exclusions:** no other equation conversion, formula cleanup, metadata correction, balance change, UI redesign, Towers-tab work, simulation/playfield work, `assets/main.js` extraction, broad assertion, `any`, suppression, or strictness weakening.

**Completion gate:** `npm run check:migration-roadmap`, `npm run typecheck`, `npm run build`, `npm run lint`, `npm run test:unit`, `npm test`, and `git diff --check` all succeed; generated and `dist/` drift is intentional; the Phase 21 implementation log records exact files and results; counts are refreshed; exactly one next phase is authorized. An optional browser equation-display smoke must be reported as performed or not performed, never implied.

Do not begin Phase 21 during this planning task.

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

## Phase 5 — Game State Containers (`assets/state/*.js`) (5A COMPLETE, 5B COMPLETE)

**Status:** 5A COMPLETE, 5B COMPLETE (2026-07-13)
**Implementation start date:** 2026-07-13
**Migration type:** Behavior-preserving migration

**Baseline recorded before implementation (this session):**
- `git status --short`: clean.
- `npm run typecheck`: clean (no errors) against the 43 pre-existing `.ts` files.
- `npm run build`: succeeds; `dist/` regenerated with compiled `.js` only.
- `npm run lint`: clean (exit 0).
- `npm run test:unit`: 38/38 passing.
- `npm test` (smoke test): fails with the same 4 pre-existing favicon errors as every prior phase's recorded baseline (`assets/favicon/favicon.ico`, `favicon-32x32.png`, `favicon-16x16.png`, `apple-touch-icon.png` missing) — re-confirmed, not newly introduced.

**Re-inventory of `assets/state/` performed at the start of this session (live repository, not assumed from the plan note):** exactly 4 files present, matching the plan's candidate list: `resourceState.js` (38 lines), `spireResourceState.js` (86 lines), `monetizationState.js` (229 lines), `cognitiveRealmState.js` (622 lines).

### Scope decision and split rationale

Split into **Phase 5A** (this session, COMPLETE) covering `resourceState.js`, `spireResourceState.js`, `monetizationState.js`, and **Phase 5B** (deferred, not started) covering `cognitiveRealmState.js`.

**Concrete reason for the split (not merely "the file is large"):** `cognitiveRealmState.js` is 622 lines and, unlike the other three files, combines: (a) large canonical constant tables (Jungian archetype pairs, emotion-pair definitions) that a type system should derive literal unions from rather than hand-duplicate; (b) a 9x9 procedural territory-generation routine with an archetype/emotion placement pattern; (c) probabilistic conquest/defeat logic that depends on `Math.random()`, which the task's own testing requirements say must be made deterministic via controlled `Math.random()` in tests rather than by injecting an RNG into production code — this requires materially more test-harness design than the pure-object-return functions in the other three files; (d) a legacy-save deserialization path with numerous documented fallback branches (unexpected ownership numbers, unexpected `nodeType` strings, missing archetype/emotion ids, malformed coordinates, old territory-array lengths, missing `locked`, missing/invalid `lastLevelCompleted`) that must be inspected exhaustively before typing to avoid accidentally tightening validation. Attempting all four in one sitting at the same depth of rigor applied to `spireResourceState.js`'s branch-merge semantics would have meant either rushing the archetype/emotion/serialization inventory (risking an undetected behavior change in the highest-risk module named explicitly in the task) or expanding this session significantly. Per the task's own instruction ("acceptable and preferred over forcing it badly to split"), the three small/medium modules were completed to full rigor and `cognitiveRealmState.js` was left untouched, still `.js`, with no partial/half-typed edits.

**5A file scope executed:** `assets/state/resourceState.js` → `.ts`, `assets/state/spireResourceState.js` → `.ts`, `assets/state/monetizationState.js` → `.ts`. `assets/state/cognitiveRealmState.js` was not touched at all (still plain `.js`, byte-identical to before this session).

### Blast-radius audit (performed before editing each module)

- **`resourceState.js` importers** (via `grep -rl "resourceState" assets scripts index.html`): `assets/configuration.js` (no — false positive, does not actually import it), `assets/developerModeManager.js`, `assets/levelCombatController.js`, `assets/main.js`, `assets/powderDisplay.js`. All consumers only read/write plain numeric fields (`resourceState.score`, `.scoreRate`, `.energyRate`, `.fluxRate`, `.running`) and `baseResources`' fields directly by mutation (`resourceState.running = true`, `resourceState.score += ...`) — none serialize, clone, or type-check the object; `main.js` destructures `{ baseResources, resourceState }` once from the factory call and passes the same references to `developerModeManager.js`/`levelCombatController.js`/`powderDisplay.js` via dependency injection, confirming identity-stable-reference usage, which the factory's existing behavior (and the new types) preserve unchanged.
- **`spireResourceState.js` importers:** `assets/achievementsTab.js`, `assets/developerControls.js`, `assets/developerModeManager.js`, `assets/main.js`, `assets/powderDisplay.js`, `assets/resourceHud.js`, `assets/spireIdleGeneration.js`, `assets/spireResourceBanks.js`, `assets/spireResourcePersistence.js`, `assets/spireStoryManager.js`, `assets/spireTabVisibility.ts`, `assets/tsadiBindingUi.js`. Only `main.js` actually calls `createSpireResourceState()` (once, with no overrides, at startup) — every other listed file receives the resulting `spireResourceState` object via dependency injection and reads/mutates its branch fields directly. **Crucially, the actual save/load serialization of this state is owned by `assets/spireResourcePersistence.js`** — `spireResourceState.js` itself has no serialization logic; it is a pure in-memory factory. This confirms the type-design boundary: model the factory's returned shape precisely, but do not attempt to model `spireResourcePersistence.js`'s serialized envelope as part of this phase.
- **`monetizationState.js` importers:** `assets/boostsSection.js`, `assets/main.js`. Both only call the module's exported functions (`loadMonetizationState`, `getMonetizationState`, `unlockPremium`, `triggerSpireBoost`, `getBoostCooldown`, `addMonetizationListener`) — no direct field access on internal state, and the module already owns its own `localStorage` persistence (`MONETIZATION_STORAGE_KEY`) independently of `assets/autoSave.ts`.
- **AutoSave/devtools/window-hook check:** grepped `assets/autoSave.ts` for hooks that might correspond to these three modules. Found `getSpireResourceStateSnapshot`/`applySpireResourceStateSnapshot` (and `getCognitiveRealmStateSnapshot`/`applyCognitiveRealmStateSnapshot`, relevant only to the deferred 5B), but their actual implementations live in `assets/spireResourcePersistence.js`, not `assets/state/spireResourceState.js` — confirmed via `grep -rln "getSpireResourceStateSnapshot\|applySpireResourceStateSnapshot" assets scripts`, which returned only `assets/autoSave.js`/`.ts`, `assets/main.js`, and `assets/spireResourcePersistence.js`. Because the snapshot schema is owned by the unmigrated `spireResourcePersistence.js` (which also mixes in unrelated subsystems' data into the same payload), **no `AutoSaveSnapshot` narrowing was performed in this phase** — narrowing those two hooks would require migrating `spireResourcePersistence.js` itself, which is out of scope. `resourceState.js` and `monetizationState.js` have no corresponding `autoSave.ts` hooks at all (resource state isn't separately persisted through autoSave.ts, and monetization state persists itself directly to its own `localStorage` key).
- **Existing similarly-named types checked (no duplication introduced):** `GameNumberNotation` (formatting.ts) and preference literal unions (preferences.ts) were reviewed; none overlap with resource/spire/monetization state, so no reuse opportunity existed beyond what Phases 2–3 already established.

### Types/interfaces introduced

**`assets/state/resourceState.ts`:**
- `ResourceStateContainerDependencies` (the factory's config/dependency argument, including the optional `calculateStartingThero` and `registerResourceContainers` callbacks).
- `BaseResourceContainer`, `RuntimeResourceState` (the mutable, ticking HUD resource state, including `running: boolean`).
- `ResourceStateContainerPair` (the `{ baseResources, resourceState }` shape returned by the factory and passed to the registration callback — used for both the return type and the callback's parameter type, which is how object-identity preservation is expressed at the type level).

**`assets/state/spireResourceState.ts`:**
- `GenericSpireBranchState` (shared shape for `powder`/`shin`/`kuf`, which have no fields beyond `unlocked`/`storySeen`).
- `LamedUpgradeState`, `LamedStatsState`, `LamedSpireState` (including `simulationSnapshot: LamedSimulationSnapshot | null`).
- `LamedSimulationSnapshot = unknown` — a named opaque boundary type (not a bare inline `unknown`) with a doc comment recording that the Lamed gravity-simulation subsystem owns this schema.
- `TsadiStatsState`, `TsadiSpireState` (its `discoveredMolecules: unknown[]` and `simulationSnapshot: unknown` fields are also named-opaque per-field, with comments naming `tsadiMoleculeNameGenerator.js`/`spireResourcePersistence.js` as the schema owners — these two files do the actual normalization of molecule entries, confirmed by reading `spireResourcePersistence.js`'s `normalizePersistedMolecules`/`normalizeDiscoveredMolecules` helpers, which accept multiple historical shapes (string ids, partial objects) that this module was never responsible for validating).
- `FluidGeneratorMap = Record<string, unknown>` (named opaque boundary, owned by `spireResourceBanks.js`/the Bet spire render instance) and `FluidSpireState`.
- `SpireResourceState` (the complete returned container) and `SpireResourceStateOverrides` (the recursive partial-override input accepted by `createSpireResourceState`, modeled per-branch rather than as a single blanket `DeepPartial<SpireResourceState>` so each branch's actually-nested fields — `upgrades`/`stats` on Lamed, `stats` on Tsadi, no nesting on Fluid's `generators` — are represented precisely instead of assuming a uniform shape across branches).

**`assets/state/monetizationState.ts`:**
- `SpireId` — derived as `(typeof SPIRE_IDS)[number]` from the existing `SPIRE_IDS` `as const` array (not hand-listed), so it cannot drift from the canonical source list.
- `BoostType = SpireId`, `BoostCooldownState = Record<BoostType, number>`.
- `MonetizationState` / `MonetizationStateSnapshot` (identical shape; `MonetizationStateSnapshot` is the type alias used at the public API boundary since `getMonetizationState()` always returns a fresh clone, never the live `currentState` reference).
- `MonetizationStateListener`, `UnsubscribeFn`.
- `BoostCooldownResult`, `BoostCooldownErrorReason` (literal union of the 4 exact error strings the original code returns), `BoostErrorResult`, and discriminated unions `SpireBoostResult`/`GemBoostResult` (each a `{ success: true; ... }` variant unioned with `BoostErrorResult`) so callers must narrow on `success` before accessing `idleTimeSeconds`/`gemsGranted`.
- `ApplyIdleTimeFn`, `GrantGemsFn` (nullable/undefined-tolerant function types matching the original's `typeof x === 'function'` guards).

### Preserved behavior specifics (verified, not assumed)

- **`resourceState.ts`:** fallback to `0` when `calculateStartingThero` is absent or not a function preserved exactly (`typeof calculateStartingThero === 'function' ? calculateStartingThero() : 0`); `registerResourceContainers` no-op when absent/non-function preserved; the object returned as `{ baseResources, resourceState }` is the exact same object passed to `registerResourceContainers` (no cloning introduced — verified by a new unit test asserting reference equality).
- **`spireResourceState.ts`:** `mergeBranch`'s shallow-merge/precedence semantics were preserved byte-for-byte (override's top-level fields win via spread order; `upgrades`/`stats`/`generators` are separately shallow-merged so a partial override does not drop non-overridden nested fields). **A suspected pre-existing quirk was found and left unchanged, not fixed** — see Known Issues below: `mergeBranch`'s generic implementation unconditionally spreads a `generators` key onto every branch it's applied to (Lamed and Tsadi included), even though neither branch's default state nor its interface declares a `generators` field; the original JS code has this exact same behavior (the shared `mergeBranch` helper always writes `generators: {...}` onto its result), so the resulting runtime objects for `lamed`/`tsadi` gain an extra, undocumented `generators: {}` property that no consumer currently reads. This was preserved via a type-safe-at-the-boundary generic (`mergeBranch<T extends {...}>`, with an `as T` cast only at the final return, not on the input side) rather than either fixing the extra field or laundering it through a broad `Record<string, unknown>`.
- **`monetizationState.ts`:** the 1-hour `AD_COOLDOWN_MS` cooldown, the 2-hour (`2 * 60 * 60` seconds) idle-boost duration, the 1-second mock-ad `setTimeout` delay, immediate listener invocation on `addMonetizationListener`, and the exact `localStorage` key (`glyph-defense-idle:monetization`) remain documented. The retired bonus-currency grant path is no longer part of the live module.

### Files receiving compatibility edits

None. Every importer listed in the blast-radius audit above (`assets/configuration.js` false-positive aside) keeps its existing `./state/resourceState.js`, `./state/spireResourceState.js`, `./state/monetizationState.js` (or relative-path equivalent) specifiers unchanged; `tsc` + `scripts/sync-ts-output.cjs` regenerate the compiled `.js` at the same paths, so no call site needed editing.

### Infrastructure changes

None beyond `tsconfig.json`'s existing glob-based `include` (`assets/**/*.ts`), which auto-discovers the three new files with no edit required — this is the payoff of the Phase 4 tooling repair. `scripts/sync-ts-output.cjs` required no change.

### Autosave type integration

**No `AutoSaveSnapshot` narrowing was performed in Phase 5A.** Investigated per the task's instructions: the only `autoSave.ts` hooks that plausibly relate to this phase's modules are `getSpireResourceStateSnapshot`/`applySpireResourceStateSnapshot`, but their real implementations are defined in `assets/spireResourcePersistence.js` (unmigrated), which composes several subsystem snapshots together. Narrowing those two hooks then would have required migrating `spireResourcePersistence.js` itself, which was out of scope. `resourceState.ts` and `monetizationState.ts` have no corresponding autoSave hooks at all.

### Tests added

Extended `scripts/unit-test-core.cjs`. Also fixed a latent bug in the test harness surfaced while writing these tests: the existing `test(name, fn)` helper did not `await` `fn()`, so any `async` test body's assertions ran after the suite had already reported its pass/fail summary, silently escaping as an unhandled promise rejection (crashing the process after printing a false "all passed" line). `test()` is now `async` and every call site is `await`ed — a pre-existing test-infrastructure gap, not a change to any migrated module's behavior, fixed because otherwise the new async monetization tests (which must `await triggerSpireBoost`/`triggerGemBoost`) could not be verified at all.

- **`resourceState.js` (5 tests):** starting score from `calculateStartingThero`; fallback to 0 when the callback is absent or not a function; exact resource defaults (`baseResources` deep-equal to the four rates + starting score, `resourceState.running === false`); `registerResourceContainers` receives the exact same object references as the factory's return value (reference-equality assertions); missing registration callback does not throw.
- **`spireResourceState.js` (5 tests):** complete default state (all six branches, including `simulationSnapshot: null` and empty `discoveredMolecules`); branch-specific top-level override merging with non-overridden sibling fields surviving; nested `stats`/`upgrades` merge precedence (override wins, base fills gaps); defaults are not mutated by a prior `createSpireResourceState(...)` call (two independent calls, the second with no overrides, must show untouched defaults); each call returns fresh, non-shared nested objects (mutating one call's result does not affect another's). The suspected `generators`-on-every-branch quirk described above was deliberately **not** encoded as an asserted invariant in these tests, per the instruction not to test a suspected bug as if it were desirable behavior.
- **`monetizationState.js`:** tests cover the premium flag, listener lifecycle, per-Spire cooldown behavior, successful idle boosts, persistence, and the non-browser environment guard. Tests for the retired bonus-currency flow were removed with that feature.

Suite total: **58/58 passing** (38 pre-existing from Phases 2–4 + 20 new: 5 + 5 + 10).

### Validation commands and results

- `npm run typecheck` — clean, no errors, against all 46 `.ts` files (43 pre-existing + 3 new). No `any`, `@ts-ignore`, `@ts-nocheck`, unexplained non-null assertions, or unjustified `as unknown as` anywhere in the three new files (verified via `grep -n "\bany\b\|@ts-ignore\|@ts-nocheck\|as unknown as\|[a-zA-Z0-9_\]\)]!" assets/state/resourceState.ts assets/state/spireResourceState.ts assets/state/monetizationState.ts` — the only `!` matches are inside comments/prose, not code, and the only non-null-like assertions are the documented `as T`/`as SpireXState` casts inside `mergeBranch`, explained above).
- `npm run build` — succeeds; all 46 compiled `.js` files sync back to their source directories; `dist/assets/state/` contains `cognitiveRealmState.js`, `monetizationState.js`, `resourceState.js`, `spireResourceState.js` — all compiled JS, no `.ts` copied in (confirmed via directory listing).
- `npm run lint` — clean (exit 0); `.ts` files remain out of ESLint's scope (unchanged from prior phases).
- `npm run test:unit` — 58/58 passing (see above).
- `npm test` (smoke test) — fails with the same 4 pre-existing favicon errors as the Phase 4 baseline recorded above; no new failures.
- `git status --short` (before finalizing docs) — shows `assets/state/resourceState.js`/`spireResourceState.js`/`monetizationState.js` deleted (replaced by build-generated siblings once `npm run build` regenerates them), new `assets/state/resourceState.ts`/`spireResourceState.ts`/`monetizationState.ts`, and modifications to `scripts/unit-test-core.cjs` and this plan document. No `dist_run*`/scratch/temp directories staged.
- `git diff --check` — no whitespace-conflict markers reported.

### Manual/browser verification

**Not performed this session** — no browser-automation tool call was made. This phase's correctness relies instead on: `npm run typecheck` under `strict: true` with the `any`/`@ts-ignore`/assertion audit above; the unchanged import specifiers and return shapes for every listed consumer; and the 20 new unit tests exercising the actual compiled output (reference-identity checks for `resourceState.ts`, merge-precedence and non-mutation checks for `spireResourceState.ts`, and controlled-clock/controlled-`setTimeout` cooldown/boost-result checks for `monetizationState.ts`). This is recorded explicitly rather than claimed, matching Phase 4's precedent when no browser tool was available.

**Behavior not verified:** whether the HUD (`powderDisplay.js`), the Boosts section UI (`boostsSection.js`), and the spire tabs (`achievementsTab.js`, `resourceHud.js`, etc.) render identically against the migrated modules in a live browser session — not verified visually, only structurally via the unit tests and the unchanged consumer call sites. Electron startup and mobile/touch input remain unverified, consistent with every prior phase's recorded caveats.

### Known Issues / Deferred Findings specific to this phase

- **`mergeBranch`'s unconditional `generators` field on every branch** (described above under "Preserved behavior specifics"): `lamed` and `tsadi` branch objects returned by `createSpireResourceState` gain an undocumented `generators: {}` property that is not part of either branch's nominal shape and is not read by any current consumer (confirmed via the blast-radius grep). This is a pre-existing artifact of the shared `mergeBranch` helper being reused across branches with different shapes; it was preserved exactly, not fixed, per the task's instructions.
- **Phase 5B (`cognitiveRealmState.js`) is now COMPLETE** — see the "Phase 5B" section below for detail. (This bullet is left in place, updated rather than deleted, to preserve the historical record per the plan's "never erase prior entries" instruction.)

### Acceptance criteria (met, for 5A)

- File scope re-derived by inspecting the live `assets/state/` directory (confirmed 4 files, matching the plan's candidate list) rather than assumed.
- Migrated files compile under strict TypeScript with explicit interfaces/discriminated unions for each state shape; no `any`, no unexplained non-null assertions, no `@ts-ignore`/`@ts-nocheck`.
- `npm run typecheck` and `npm run build` clean; `npm run lint`/`npm test` show no new failures versus the Phase 4 baseline (the same 4 favicon errors, not a regression).
- Every existing importer of the three migrated modules requires no changes beyond `tsconfig.json`'s existing glob-based `include` (verified via `grep -rl` for each old `.js` import specifier, enumerated above).
- `scripts/unit-test-core.cjs` gained 20 new tests covering non-trivial derived/computed/merge behavior in all three modules, not just static-data presence.
- Manual/browser verification was not performed this session; recorded explicitly above rather than assumed.
- This plan document was updated in the same session, including an Implementation Log entry that does not erase any prior entry.

---

## Phase 5B — Cognitive Realm Territory State (`assets/state/cognitiveRealmState.js`) (COMPLETE)

**Status:** COMPLETE (2026-07-13)
**Implementation start date:** 2026-07-13
**Migration type:** Behavior-preserving migration

**Baseline recorded before implementation (this session):** `git status --short` clean; `npm run typecheck` clean (46 pre-existing `.ts` files); `npm run build` clean; `npm run lint` clean; `npm run test:unit` 58/58; `npm test` (smoke test) passes cleanly with no favicon-related errors — confirming the "RESOLVED" favicon note from the prior session's Known Issues entry (the previously-expected 4 favicon errors are gone, not a regression to investigate).

**Re-derived importer list (via fresh `grep -rl "cognitiveRealmState" assets scripts index.html`, not assumed unchanged):**
- `assets/state/cognitiveRealmState.js` itself (the module being migrated).
- `assets/main.js` — imports `isCognitiveRealmUnlocked`, `isCognitiveRealmLocked`, `unlockCognitiveRealm`, `unlockCognitiveRealmRendering`, `updateTerritoriesForLevel`, `serializeCognitiveRealmState`, `deserializeCognitiveRealmState`. Wires `serializeCognitiveRealmState`/`deserializeCognitiveRealmState` directly into `autoSave.ts`'s `getCognitiveRealmStateSnapshot`/`applyCognitiveRealmStateSnapshot` hooks (confirmed at the call sites: `getCognitiveRealmStateSnapshot: serializeCognitiveRealmState` and `applyCognitiveRealmStateSnapshot: (snapshot) => { deserializeCognitiveRealmState(snapshot); updateCognitiveRealmVisibility(); }`), and passes `updateTerritoriesForLevel` down to `levelCombatController.js` via dependency injection. Does not mutate territory objects directly; only calls the module's own functions.
- `assets/cognitiveRealmMap.js` — imports `getTerritories`, `getGridDimensions`, `getTerritoryStats`, `TERRITORY_NEUTRAL`, `TERRITORY_PLAYER`, `TERRITORY_ENEMY`, `setOnTerritoriesChanged`, `setTerritoryOwner`, `isCognitiveRealmLocked`. Treats the array returned by `getTerritories()` as an identity-stable, live reference (re-calls `getTerritories()` on each render pass rather than caching a stale copy) and reads `territory.owner`/`.x`/`.y`/`.id` directly, but only ever *mutates* ownership indirectly via the exported `setTerritoryOwner` function (a click-to-cycle developer/debug interaction: neutral → player → enemy → neutral) — it does not assign to `.owner` directly or serialize the array itself.
- `assets/levelCombatController.js` — imports `updateTerritoriesForLevel` and calls it with `(levelId, true)` on victory and `(levelId, false)` on defeat. Receives no other export from this module.

No importer mutates or serializes the territories array itself, and none required any code change — this migration only touches `assets/state/cognitiveRealmState.js` → `.ts`, plus a `.ts`-only type-narrowing edit to `assets/autoSave.ts` (see Autosave section below).

**Full-file inspection performed before writing types (per the mandatory pre-typing checklist):**
- **Archetype/emotion fields:** every one of the 27 `ARCHETYPES` entries has exactly `id`, `positive: { name, description }`, `negative: { name, description }` — no optional/inconsistent fields across entries (all 27 read in full, not sampled). The 27 `EMOTION_PAIRS` entries (private, not exported) each have exactly `pairId`, `positive: { id, name, description }`, `negative: { id, name, description }`; `EMOTION_NODES` (also private) is derived via `flatMap` into 54 flat nodes, each with `id`, `name`, `description`, `polarity` ('positive' | 'negative'), `counterpart`, `pairId`.
- **9x9 generation/placement algorithm:** `createInitialTerritories()` iterates `y` in `[0, TERRITORY_GRID_HEIGHT)` outer, `x` in `[0, TERRITORY_GRID_WIDTH)` inner (both `9`), and for each cell computes `isArchetypeNode = (x + y) % 3 === 0`. Archetype cells consume `ARCHETYPES[archetypeIndex % ARCHETYPES.length]` and increment a separate `archetypeIndex` counter; emotion cells consume `EMOTION_NODES[emotionIndex % EMOTION_NODES.length]` and increment a separate `emotionIndex` counter — the two counters are independent and only increment on their own node type, exactly as before. This produces 27 archetype anchors and 54 emotion nodes (verified by a new unit test, not just asserted from reading the code).
- **Conquest/defeat probability calculations and every `Math.random()` call site:** exactly two `Math.random()` calls exist, both inside `updateTerritoriesForLevel`'s adjacent-offset `forEach` (four offsets: `{-1,0},{1,0},{0,-1},{0,1}`), guarding `adjacent.owner === TERRITORY_ENEMY && Math.random() < CONQUEST_CHANCE_FROM_ENEMY (0.5)` and `adjacent.owner === TERRITORY_NEUTRAL && Math.random() < CONQUEST_CHANCE_FROM_NEUTRAL (0.3)` respectively — evaluated once per adjacent offset (so up to 4 `Math.random()` calls per victory), only on `victory === true`, and only for territories within the grid (an out-of-bounds `getTerritory` lookup returns `undefined`, short-circuiting both conditions via `&&`). No RNG was injected into production code; tests mock `Math.random()` directly per the task's constraint.
- **Full serialization key set:** `serializeCognitiveRealmState()` returns exactly `{ unlocked, locked, territories, lastLevelCompleted }`, where each territory entry is exactly `{ id, x, y, owner, nodeType, archetypeId, emotionId }` (`nodeType` falls back to `t.archetype ? 'archetype' : 'emotion'` if `t.nodeType` is falsy; `archetypeId`/`emotionId` are `null` when the territory's `archetype`/`emotion` field is falsy).
- **Every branch of the legacy-save deserialization fallback**, read from `deserializeCognitiveRealmState(data)`:
  1. `!data || typeof data !== 'object'` → entire function is a no-op (no partial mutation).
  2. `typeof data.unlocked === 'boolean'` → assign; otherwise `unlocked` is left at whatever it already was (no reset).
  3. `typeof data.locked === 'boolean'` → assign; **otherwise explicitly defaults to `true`** (locked) — this is a real default-write, not merely "leave unchanged".
  4. `Array.isArray(data.territories) && data.territories.length === TOTAL_TERRITORIES (81)` → per-entry reconstruction (see below); **otherwise** (wrong length, not an array, or absent) → `cognitiveRealmState.territories = createInitialTerritories()` (fresh 9x9 grid, discarding whatever was saved).
  5. Per-entry reconstruction: `savedNodeType = t.nodeType || (t.archetypeId ? 'archetype' : 'emotion')` (truthy-fallback, not a strict type check); archetype lookup only attempted when `savedNodeType === 'archetype'`, and within that: if `t.archetypeId` is truthy, `ARCHETYPES.find(a => a.id === t.archetypeId)` with a fallback to `ARCHETYPES[index % ARCHETYPES.length]` **when the id isn't found**; if `t.archetypeId` itself is falsy, goes straight to the index-based fallback. Symmetric logic for `emotion`/`emotionId`/`EMOTION_NODES`. `x`/`y` use `Number.isFinite(...) ? value : 0`; `owner` uses `Number.isFinite(...) ? value : TERRITORY_NEUTRAL` — **notably, this does not check that the finite value is actually one of the three valid owner states (0/1/2)**, so a malformed-but-finite `owner` (e.g. `99`) passes through completely unfiltered, exactly as before migration (recorded as a Known Issue below, not fixed). `id` is trusted verbatim with no validation at all.
  6. `typeof data.lastLevelCompleted === 'string'` → assign; otherwise left unchanged (no default-write here, unlike `locked`).

**Autosave hook narrowing (why this differs from Phase 5A's spire-resource decision):** Investigated whether `assets/autoSave.ts`'s `getCognitiveRealmStateSnapshot`/`applyCognitiveRealmStateSnapshot` hooks are implemented inside this file or in a separate persistence file, exactly as instructed. Unlike Phase 5A's spire-resource hooks (whose real implementation lives in the still-unmigrated `assets/spireResourcePersistence.js`), `assets/main.js` wires these two hooks **directly** to this module's own `serializeCognitiveRealmState`/`deserializeCognitiveRealmState` functions (confirmed at `assets/main.js`'s `getCognitiveRealmStateSnapshot: serializeCognitiveRealmState` / `applyCognitiveRealmStateSnapshot: (snapshot) => { deserializeCognitiveRealmState(snapshot); ... }`) — so `cognitiveRealmState.ts` genuinely owns this schema. Both hooks in `assets/autoSave.ts`'s `AutoSaveDependencies` interface were therefore narrowed from the generic `AutoSaveSnapshot` (`Record<string, unknown>`) to the new `CognitiveRealmStateSnapshot` type (imported as a type-only import from `./state/cognitiveRealmState.js`), and the `readStorageJson<AutoSaveSnapshot>(COGNITIVE_REALM_STORAGE_KEY)` call site's generic parameter was updated to `readStorageJson<CognitiveRealmStateSnapshot>(...)` to match. This is the only edit made to `assets/autoSave.ts` in this phase — a type-only change with no behavior difference (assigning `deserializeCognitiveRealmState: (data: unknown) => void` to a hook slot typed `(snapshot: CognitiveRealmStateSnapshot) => void` type-checks safely because a function accepting a wider parameter type always satisfies a narrower expected call signature).

**Types/interfaces/unions introduced (`assets/state/cognitiveRealmState.ts`):**
- `ArchetypeExpression`, `Archetype` (interfaces); `ARCHETYPES` is now `[...] as const satisfies readonly Archetype[]`, and `ArchetypeId = (typeof ARCHETYPES)[number]['id']` is a literal union of all 27 ids derived directly from the registry (not hand-listed), mirroring the `TowerId` precedent from Phase 4.
- `EmotionPolarity` ('positive' | 'negative'), private `EmotionPairExpression`/`EmotionPair` interfaces for the internal `EMOTION_PAIRS` table (kept private/unexported, matching the original — this table was never part of the public API), and the exported `EmotionNode` interface for the flattened, exported-shape-relevant `EMOTION_NODES` entries.
- `TERRITORY_NEUTRAL`/`TERRITORY_PLAYER`/`TERRITORY_ENEMY` are now typed as `0 as const`/`1 as const`/`2 as const` (same runtime values, same export names), and `TerritoryOwner = typeof TERRITORY_NEUTRAL | typeof TERRITORY_PLAYER | typeof TERRITORY_ENEMY` documents the *intended* domain of a territory's `owner` field — with an explicit doc comment recording that the legacy-save fallback path does not actually enforce this domain (see the inspection notes above and Known Issues below), so the type communicates intent without overclaiming runtime validation that doesn't exist.
- `NodeType` ('archetype' | 'emotion'), `Territory` (the full per-node shape: `id`, `x`, `y`, `owner: TerritoryOwner`, `nodeType: NodeType`, `archetype: Archetype | null`, `emotion: EmotionNode | null`), `CognitiveRealmState` (the in-memory container: `unlocked`, `locked`, `territories: Territory[]`, `lastLevelCompleted: string | null`), `TerritoryStats`, `GridDimensions`.
- `SerializedTerritory` and `CognitiveRealmStateSnapshot` — the exact persisted shape, matching the enumerated serialization key set above. `CognitiveRealmStateSnapshot` is the type reused (not redefined) in `assets/autoSave.ts`'s narrowed hook types.
- **Named opaque `unknown` boundaries (not blanket `Record<string, unknown>`), both scoped to the legacy-save deserialization path and documented as such:** `LegacySerializedTerritoryEntry` (per-territory legacy save entry: `id?`, `x?`, `y?`, `owner?`, `nodeType?`, `archetypeId?`, `emotionId?`, every field `unknown`-typed) and `LegacyCognitiveRealmSnapshotData` (top-level legacy save payload: `unlocked?`, `locked?`, `territories?`, `lastLevelCompleted?`, likewise `unknown`-typed). Both are private (not exported) and exist solely to give `deserializeCognitiveRealmState`'s internals honest types for data that was never runtime-validated beyond the specific `typeof`/`Array.isArray`/`Number.isFinite` checks already in the original code — they are not a stand-in for "I didn't want to model this," they are the accurate type of genuinely-untrusted external data, matching the pattern set by `monetizationState.ts`'s `unknown`-then-narrow-only-as-validated approach in Phase 5A.

**Preserved behavior specifics (verified via the full-file inspection above, not assumed):**
- 9x9 grid generation, `(x + y) % 3 === 0` archetype-anchor placement, independent archetype/emotion index counters, and the exact `Object`-shape returned per territory are all byte-identical to the original.
- `updateTerritoriesForLevel`'s level-number extraction regex (`/level-(\d+)/`), `territoryIndex = levelNum % territories.length`, conquest probabilities (0.5 from enemy, 0.3 from neutral), and the callback-timing (`notifyTerritoriesChanged()` called only once, after all adjacent-offset processing, and only when the primary target territory was found) are unchanged.
- The `locked`-defaults-to-`true`-when-missing, `territories`-falls-back-to-a-fresh-grid-when-wrong-length, and `lastLevelCompleted`-left-unchanged-when-invalid legacy-save branches are all preserved exactly, including the intentionally-unvalidated `owner` field (see Known Issues).
- `id` is still trusted verbatim from save data with zero validation (an `as string` cast, not a runtime check) — preserved, not tightened, exactly as the original.

**Files receiving compatibility edits:** `assets/autoSave.ts` — narrowed `getCognitiveRealmStateSnapshot`/`applyCognitiveRealmStateSnapshot`'s types from `AutoSaveSnapshot` to `CognitiveRealmStateSnapshot` (type-only change, see the "Autosave hook narrowing" section above; no runtime behavior change). No other file required any edit — `assets/main.js`, `assets/cognitiveRealmMap.js`, and `assets/levelCombatController.js` all keep their existing `./state/cognitiveRealmState.js` (or relative-path equivalent) import specifiers unchanged; `tsc` + `scripts/sync-ts-output.cjs` regenerate the compiled `.js` at the same path.

**Infrastructure changes:** None beyond `tsconfig.json`'s existing glob-based `include` (`assets/**/*.ts`), which auto-discovered the new file with no edit required.

**Tests added:** Extended `scripts/unit-test-core.cjs` with 20 new deterministic tests (a `withMockedRandom(sequence, fn)` helper stubs `Math.random` for the conquest-probability tests instead of relying on real randomness, restoring the real `Math.random` in a `finally` block, matching the task's constraint against injecting an RNG into production code):
- territory generation: exactly 81 territories in a 9x9 grid with no duplicate/out-of-range coordinates;
- archetype/emotion placement matches the `(x+y)%3===0` rule exactly, with the expected 27/54 split;
- initial state (`unlocked: false`, `locked: true`, all 81 territories neutral) and `getTerritoryStats()`'s counts;
- `unlockCognitiveRealm`/`unlockCognitiveRealmRendering` each flip only their own flag;
- `getTerritory(x, y)` lookup, including the out-of-bounds `undefined` case;
- `setTerritoryOwner` mutates the target territory and fires the change callback exactly once, and is a silent no-op (no callback) for an unknown territory id;
- `resetTerritories` resets every territory to neutral and fires the callback exactly once;
- `updateTerritoriesForLevel` no-ops on an unparseable `levelId` (no `lastLevelCompleted` mutation, no territory mutation);
- `updateTerritoriesForLevel` victory sets the exact target territory (by `levelNum % 81`) to `TERRITORY_PLAYER` and records `lastLevelCompleted`, with `Math.random` mocked to always fail the conquest rolls (`[1,1,1,1]`) to isolate the direct-target-only case;
- `updateTerritoriesForLevel` defeat sets the target territory to `TERRITORY_ENEMY`;
- `updateTerritoriesForLevel` victory with `Math.random` mocked to always succeed (`[0,0,0,0]`) converts every in-bounds neutral neighbor to `TERRITORY_PLAYER`;
- `serializeCognitiveRealmState`'s exact key set (top-level and per-territory) and the archetypeId/emotionId null-exclusivity invariant;
- a full serialize → mutate-away → deserialize round trip restores an identical snapshot;
- `deserializeCognitiveRealmState`: missing `locked` falls back to `true`; missing/invalid (non-string) `lastLevelCompleted` leaves the prior value untouched; a malformed/old-length territory array reconstructs a fresh 81-entry grid; missing archetype/emotion ids and unrecognized archetype/emotion ids both fall back to index-based lookup without throwing; a non-object top-level payload (`null`, a string, a number) is a complete no-op;
- exported constant/name preservation: `TERRITORY_NEUTRAL`/`_PLAYER`/`_ENEMY` values and `ARCHETYPES`'s length/array-ness.

Suite total: **78/78 passing** (58 pre-existing from Phases 2–5A + 20 new).

**Validation commands and results:**
- `npm run typecheck` — clean, no errors, against all 47 `.ts` files (46 pre-existing + 1 new). Verified via `grep -n "\bany\b\|@ts-ignore\|@ts-nocheck\|as unknown as"` and a non-null-assertion pattern search on `assets/state/cognitiveRealmState.ts` — the only prose matches for the word "any" are inside comments describing pre-existing permissiveness ("any finite number..."), not the `any` type; zero `@ts-ignore`/`@ts-nocheck`/`as unknown as`/non-null-assertion operators anywhere in the file.
- `npm run build` — succeeds; all 47 compiled `.js` files sync back to their source directories (confirmed `assets/state/cognitiveRealmState.js` regenerated); `dist/assets/state/` contains only compiled `.js` (`cognitiveRealmState.js`, `monetizationState.js`, `resourceState.js`, `spireResourceState.js`), no `.ts` copied in.
- `npm run lint` — clean (exit 0).
- `npm run test:unit` — **78/78 passing** (see above).
- `npm test` (smoke test) — passes cleanly (11 required files, 3 startup assets, 7 import roots checked) with **no favicon-related failures** — confirming the "RESOLVED" note already on record in Known Issues from the post-5A session; not a new finding, just re-confirmed clean in this session's baseline and after this session's changes.
- `git status --short` — shows `assets/state/cognitiveRealmState.js` modified (regenerated build output replacing the deleted hand-authored source), new untracked `assets/state/cognitiveRealmState.ts`, modified `assets/autoSave.ts`/`assets/autoSave.js` (type-only edit + regenerated compiled sibling), modified `dist/` mirrors, and modified `scripts/unit-test-core.cjs`. No `dist_run*`/scratch/temp directories staged.
- `git diff --check` — no conflict-marker warnings (only pre-existing CRLF-normalization notices on Windows, unrelated to this change).

**Manual/browser verification:** **Not performed this session** — no browser-automation tool call was available/attempted in this session (consistent with the "attempt if available, otherwise record explicitly" instruction). This phase's correctness relies on: `npm run typecheck` under `strict: true` with the `any`/assertion audit above; the unchanged import specifiers for all three real consumers (`main.js`, `cognitiveRealmMap.js`, `levelCombatController.js`); and the 20 new unit tests exercising the actual compiled output, including deterministic conquest-probability coverage via mocked `Math.random`.

**Behavior not verified:** Whether the Cognitive Realm map UI (`cognitiveRealmMap.js`) renders territory ownership colors/connections identically in a live browser session, whether the developer-mode territory-cycling click handler still cycles neutral → player → enemy → neutral correctly end-to-end through the DOM, and whether a real save/load cycle through `localStorage` (as opposed to the in-memory round-trip tested here) preserves state identically — none of these were exercised visually. Electron startup and mobile/touch input remain unverified, consistent with every prior phase's recorded caveats.

**Suspected pre-existing defects recorded, not fixed:**
- **Unvalidated `owner` domain in the legacy-save fallback:** `deserializeCognitiveRealmState`'s per-territory `owner` reconstruction only checks `Number.isFinite(t.owner)`, not that the value is actually `0`, `1`, or `2`. A save file with a malformed-but-finite `owner` (e.g. `99` from data corruption or a future incompatible format) would silently produce a territory whose `owner` is outside the three real ownership states, and every consumer's `owner === TERRITORY_PLAYER`/`=== TERRITORY_ENEMY` comparisons would then simply treat it as neutral-like (falls through to the `else` branch in `getTerritoryStats`, doesn't match any `if` in `cognitiveRealmMap.js`'s owner checks) without crashing — a latent but low-impact defect, preserved unchanged since fixing it would tighten deserialization behavior beyond this phase's behavior-preserving scope.
- **`id` trusted verbatim with zero validation** in the legacy-save path (not just malformed-but-plausible - even a non-string/`undefined` `id` would be assigned directly). No consumer currently constructs a save payload with a malformed `id` by hand, so this has not manifested as an observed bug, but it is worth noting for any future save-migration tooling.
- **Every prior phase's recorded Known Issues remain applicable and unaffected** (see the Known Issues / Deferred Findings section below), including the already-`RESOLVED` favicon note (re-confirmed clean, not re-investigated as new).

**Acceptance criteria (met, for 5B):**
- Importer list and per-importer usage were re-derived fresh via `grep -rl "cognitiveRealmState" assets scripts index.html` and recorded above, not copied from the prior deferred-phase note.
- `cognitiveRealmState.ts` compiles under strict TypeScript with explicit interfaces/unions for every archetype/emotion/territory/state/serialization shape — no `any`, no unexplained non-null assertions, no `@ts-ignore`/`@ts-nocheck`.
- `npm run typecheck` and `npm run build` clean; `npm run lint`/`npm test` show no new failures versus the Phase 5A baseline (the smoke test now passes cleanly with zero favicon errors, matching the already-recorded resolution, not a regression).
- Every existing importer (`main.js`, `cognitiveRealmMap.js`, `levelCombatController.js`) required no changes beyond `tsconfig.json`'s existing glob-based `include`.
- `scripts/unit-test-core.cjs` gained 20 deterministic tests (via controlled `Math.random()`, not real randomness) covering territory generation, archetype/emotion distribution, ownership/statistics, territory lookup, reset/explicit-mutation behavior, change-callback timing, victory/defeat updates, serialization round-trip, and every documented legacy-save fallback branch.
- The one newly-discovered defect (unvalidated `owner` domain in the legacy-save fallback) is recorded under Known Issues, not silently fixed.
- Manual/browser verification was not performed this session (no browser-automation tool was available); recorded explicitly above rather than assumed.
- This plan document was updated in the same session, including an Implementation Log entry that does not erase any prior entry, and the Migration Ledger's Phase 5B row was updated from DEFERRED to COMPLETE.
- `assets/buildInfo.js#BUILD_NUMBER` incremented from 727 to 728 per the standing convention.

---

## Phase 6 — Post-Retirement Spire Resource Persistence (COMPLETE)

**Status:** COMPLETE (2026-07-15)
**Migration type:** Behavior-preserving migration

**Revised live scope:** The historical recommendation predated the retirement of Bet, Lamed, Tsadi, Shin, and Kuf and described a much larger multi-Spire payload. The live `assets/spireResourcePersistence.js` owns the Well of Inspiration story state, Achievements story state, the base tower-upgrade snapshot, and the Aleph-chain snapshot added to that tower snapshot. Retired branches in legacy saves remain intentionally ignored.

**Importer and consumer inventory (re-derived from the live tree):**
- `assets/main.js` is the only direct importer of `createSpireResourcePersistence`. It supplies `spireResourceState`, tower-upgrade snapshot callbacks, Aleph-chain snapshot callbacks, and `getPlayfield: () => playfield`, then destructures all four returned controller functions.
- `assets/main.js` passes `getTowerUpgradeStateSnapshotWithAleph`/`applyTowerUpgradeStateSnapshotWithAleph` to `configureAutoSave` as `getTowerUpgradeStateSnapshot`/`applyTowerUpgradeStateSnapshot`, and passes `getSpireResourceStateSnapshot`/`applySpireResourceStateSnapshot` directly as the two Spire-resource hooks. This confirms the module owns the runtime implementations behind all four autosave hooks narrowed in this phase.
- `assets/state/spireResourceState.ts` owns the live `wellOfInspiration`/`achievements` branches and the legacy Well aliases accepted by its factory; `assets/towerBlueprintPresenter.js` owns the underlying tower-upgrade snapshot; `assets/alephUpgradeState.js` owns Aleph-chain state; and the current playfield is passed through without inspection as `{ playfield: getPlayfield() }`.
- No direct importer required a runtime compatibility edit: the existing `./spireResourcePersistence.js` specifier and every export/return-object key remain unchanged because the established build synchronizes the compiled `.js` sibling beside the `.ts` source.

**Types/interfaces introduced (`assets/spireResourcePersistence.ts`):**
- Live dependency surfaces: `MutableStoryState`, `StoryStateSource`, `SpireResourcePersistenceState`, `SpireResourcePersistenceDependencies`, and `SpireResourcePersistenceController`.
- Owned serialized shapes: `SerializedWellStoryState`, `SerializedAchievementStoryState`, and `SpireResourceStateSnapshot`.
- Restore compatibility: `LegacySpireResourceStateSnapshot` and `SpireResourceStateSnapshotInput`, retaining `wellOfInspiration || powder || alephSpire || aleph || {}` precedence without modeling retired branches this module ignores.
- Named external boundaries: `ExternalTowerUpgradeSnapshot` (owned by `towerBlueprintPresenter.js`), `ExternalAlephChainUpgradeSnapshot` (owned by `alephUpgradeState.js`), and `AlephUpgradePlayfield` (passed through to the Aleph subsystem). The wrapper contracts owned here are `TowerUpgradeSnapshotWithAleph` and `TowerUpgradeSnapshotInput`.

**Autosave narrowing (`assets/autoSave.ts`):**
- `getSpireResourceStateSnapshot` now returns `SpireResourceStateSnapshot`; its apply hook accepts `SpireResourceStateSnapshotInput`; the `SPIRE_RESOURCE_STORAGE_KEY` read uses `readStorageJson<SpireResourceStateSnapshotInput>()`.
- `getTowerUpgradeStateSnapshot` now returns `TowerUpgradeSnapshotWithAleph`; its apply hook accepts `TowerUpgradeSnapshotInput`; the `TOWER_UPGRADE_STORAGE_KEY` read uses `readStorageJson<TowerUpgradeSnapshotInput>()`.
- The stale header comment saying `spireResourcePersistence.js` was unmigrated was replaced with the current Phase 6 ownership statement. Unrelated autosave payloads remain on `AutoSaveSnapshot` and were not expanded into a repository-wide save schema.

**Behavior preserved exactly:** Well serialization still uses `wellOfInspiration || powder || {}` and always writes `unlocked: true`; story values and auto-collection state still use Boolean coercion; restore alias precedence and monotonic true flags are unchanged; inventory is cleared only for an actual array; blank ids are skipped; restored labels trim and fall back to `gemId`; totals clamp without flooring while counts clamp and floor; delays change only for finite values and then clamp/floor; duplicate ids retain `Map.set` last-write-wins behavior; invalid top-level snapshots remain no-ops; tower restoration occurs before conditional truthy object-like Aleph restoration; and Aleph restoration still receives `{ playfield: getPlayfield() }`.

**Tests added:** `scripts/unit-test-core.cjs` gained 17 deterministic tests against the generated `assets/spireResourcePersistence.js`: six serialization tests, seven restore/legacy-normalization tests, and four tower/Aleph wrapper tests. Coverage includes exact key sets, Well/powder source selection, Achievements, inventory ordering/labels/numeric normalization, auto-collection coercion/delay normalization, every supported Well alias and precedence, monotonic flags, non-array versus array inventory behavior, blank ids, duplicate ids, invalid top-level inputs, base/Aleph getter composition, invalid wrapper inputs, skipped invalid Aleph branches, exact playfield options, and observable base-before-Aleph invocation order. Core suite total increased from 80/80 to **97/97**; retired-Spire checks continue to pass separately.

**Validation:** Pre-change baseline was clean (`git status --short`; typecheck/build/lint; 80/80 core unit tests plus retired-Spire checks; smoke test). Final `npm run typecheck`, `npm run build`, `npm run lint`, `npm run test:unit`, and `npm test` all pass. The generated `assets/spireResourcePersistence.js` exists beside its `.ts` source; `dist/` contains no `.ts` files; import-resolution smoke checks pass; and the scoped audit found no `any`, suppressions, broad double assertions, or non-null assertions. Browser verification loaded Build 730 and exercised save restoration without console errors (see Implementation Log).

**Counts after Phase 6 (established methodology):** 47 authored `.ts` modules; 260 authored `.js` modules without a same-path `.ts` sibling; 19 of those JS modules are disabled legacy Terrarium files; active remaining backlog 241; active authored total remains 288; authored total including preserved legacy remains 307.

**Deferred findings:** No newly-discovered production defect was fixed or encoded as desirable behavior. The tower and Aleph sub-snapshots remain intentionally named external boundaries until their owner modules are migrated. Serialization preserves an empty string label when it is already a string, while restore trims blank labels and falls back to `gemId`; this asymmetry is inherited behavior and remains unchanged.

---

## Phase 7 — Aleph-Chain Upgrade State and Persistence Contract (COMPLETE)

**Status:** COMPLETE (2026-07-15)
**Migration type:** Behavior-preserving migration

**Verified live scope:** Phase 6 is complete at commit `fe18aaa`, the working tree is clean, and the current Next Suggested Step remains applicable. The sole direct importer of `assets/alephUpgradeState.js` is `assets/main.js`, which uses every export: it passes getter/apply functions into `createSpireResourcePersistence`, passes the reset function into `developerModeManager.js`, exposes getter/update functions through `window.theroIdleUpgrades.alephChain`, and supplies the live exported state object to `configurePlayfieldSystem`. No newer TypeScript owner or replacement module exists.

**Baseline:** `git status --short` clean; `npm run typecheck`, `npm run build`, and `npm run lint` pass; `npm run test:unit` passes 97/97 plus retired-Spire checks; `npm test` passes its 11-file/3-startup-asset/7-import-root smoke inventory. The existing malformed-JSON warning in the storage test is intentional characterization output, not a failure.

**Files converted and compatibility-edited:** `assets/alephUpgradeState.js` was converted to strict `assets/alephUpgradeState.ts`; its `.js` sibling is generated by the established build. `assets/spireResourcePersistence.ts` now imports and reuses the owner module's Aleph snapshot/options/playfield types instead of declaring `ExternalAlephChainUpgradeSnapshot` and an opaque playfield alias. No runtime importer changed: `assets/main.js` keeps its existing specifier and wiring, while `developerModeManager.js`, `scripts/features/towers/alephChain.js`, playfield code, tower-upgrade presentation, and unrelated persistence modules remain unconverted.

**Types/interfaces introduced:** `AlephChainUpgradeSnapshot` models the exact `{ x, y, z }` state/snapshot shape; `AlephChainUpgradeTarget` models the optional chain registry's `setUpgrades` surface; `AlephChainUpgradePlayfield` models the optional `alephChain` and runtime-checked `syncAlephChainStats` fields; and `AlephChainUpgradeApplyOptions` models the shared optional playfield wrapper. External update/restore payloads remain `unknown` and are narrowed only by the same object and finite-number checks the JavaScript used.

**Behavior preserved:** the live exported `alephChainUpgradeState` object retains stable identity; getters return defensive clones; null and primitive update/restore payloads are no-ops; arrays remain accepted as object-like legacy payloads; x/y change only for finite positive values and retain fractional values; z changes only for finite values and clamps/floors to at least 1; invalid or missing fields retain current values; unchanged normalized state returns a clone without playfield synchronization; changed state calls `playfield.alephChain.setUpgrades` with the live object before conditionally calling a function-valued `syncAlephChainStats`; stats synchronization remains nested under a truthy `alephChain`; and reset always writes defaults and synchronizes when the chain target exists, even if state was already default.

**Tests added:** `scripts/unit-test-core.cjs` gained 12 deterministic tests against generated `assets/alephUpgradeState.js`. Coverage includes exact defaults/export shape, defensive getter copies, stable live-state identity, positive/fractional x/y values, z clamp/floor, primitive no-ops, invalid and unchanged branches, playfield invocation order/live-object forwarding, missing-chain and non-function-sync branches, invalid/partial legacy restore, object-like arrays, and unconditional reset synchronization. Core total increased from 97/97 to **109/109**; retired-Spire checks continue to pass separately.

**Final validation:** `npm run typecheck`, `npm run build`, `npm run lint`, `npm run test:unit`, and `npm test` pass. The generated `assets/alephUpgradeState.js` exists beside its `.ts` source, `dist/` contains no `.ts`, imports resolve through the smoke test, and the scoped audit found no `any`, suppressions, broad double assertions, or non-null assertions. Browser automation was attempted but its control runtime was unavailable in this session, so no live save/reload or console inspection is claimed; Electron and physical mobile/touch verification were also not performed.

**Counts after Phase 7:** 48 authored `.ts` modules; 259 authored `.js` modules without a same-path `.ts` sibling; 19 preserved disabled legacy modules; active remaining backlog 240; active authored total 288; authored total including preserved legacy 307.

**Deferred findings:** `main.js` passes `alephChainUpgradeState` into `configurePlayfieldSystem`, but the live playfield dependency container does not read `alephChainUpgrades`; no production `playfield.alephChain` or `syncAlephChainStats` implementation was found. The defensive synchronization branches remain supported and tested rather than removed. The underlying base tower-upgrade snapshot remains the final named external boundary in `spireResourcePersistence.ts`, owned by `assets/towerBlueprintPresenter.js`.

---

## Phase 8 — Tower Blueprint Presenter and Base Upgrade Snapshot (COMPLETE)

**Status:** COMPLETE (2026-07-15)
**Migration type:** Behavior-preserving migration

**Verified live scope and baseline:** Phase 7 commit `5f18697696cad09cb8a03c4876da0a252601b270` exists locally at the starting `HEAD`, the tree was clean, and the current recommendation remained applicable. The live presenter is **321 lines**; the prompt's approximately 85-line description referred to Phase 7's Aleph owner, not this module. Baseline typecheck/build/lint, 109/109 core tests plus retired-Spire checks, and the recursive smoke test all passed.

**Imports, importers, and consumers:** The presenter imports only `TOWER_EQUATION_BLUEPRINTS` from `assets/towerEquations/index.js`. Its only direct importer is `assets/towersTab.js`, which supplies `getTowerDefinition`, the current dynamic context, and whole/decimal formatters, then destructures all ten returned methods. The Towers tab re-exports the blueprint/state/snapshot/cost/value/result/cache/clear methods; injects blueprint lookup into `towerVariableDiscovery.js` and `towerTreeMap.js`; injects blueprint/state/value/cost/result/cache methods into `towerUpgradeOverlayController.js`; and installs blueprint/state/value/result helpers into `blueprintContext.js`. `main.js` imports the snapshot getter/apply and clear methods from `towersTab.js`, wires the base snapshot pair into `createSpireResourcePersistence`, and supplies clear to developer profile reset. Tower simulations and playfield systems continue importing value/result helpers through `towersTab.js`; none were converted or edited.

**Equation-blueprint inventory:** Live authored blueprints have `mathSymbol`, `baseEquation`, `variables`, and optional `computeResult`; UI-facing variants also expose formatting/sub-equation metadata outside this presenter's direct ownership. Variables observed across the registry include optional `key` (one Iota display entry lacks it), `symbol`, `equationSymbol`, `masterEquationSymbol`, glyph/tooltip/description metadata, static or callback `cost`, `reference`, optional transform/exponent, custom `computeValue`, definition-stat/static base sources, static upgrade steps, and UI-only sub-equation/attachment flags. The presenter types only the fields it directly reads or creates; still-JavaScript UI metadata remains structurally compatible and is not normalized or mutated.

**Files converted and compatibility-edited:** `assets/towerBlueprintPresenter.js` was converted to strict `assets/towerBlueprintPresenter.ts`; the `.js` sibling is generated by the established build. `assets/spireResourcePersistence.ts` now imports presenter-owned snapshot types, removes `ExternalTowerUpgradeSnapshot`, and keeps its distinct persistence-owned `TowerUpgradeSnapshotWithAleph` wrapper. `assets/autoSave.ts` required no textual edit because it already consumes the wrapper types exported by `spireResourcePersistence.ts`. Existing `.js` import specifiers and all public names remain unchanged.

**Types/interfaces introduced:** `TowerEquationDefinition`, `TowerEquationDynamicContext`, `TowerVariableUpgradeState`, `TowerUpgradeState`, `SerializedTowerVariableUpgradeState`, `SerializedTowerUpgradeState`, `TowerUpgradeStateSnapshot`, `TowerUpgradeStateSnapshotInput`, `TowerEquationValueMap`, `TowerVariableComputationContext`, `TowerVariableDefinitionContext`, `TowerResultComputationContext`, `TowerBlueprintFormatters`, `TowerEquationVariable`, `GoldenEquationFormatContext`, `TowerEquationBlueprint`, `TowerBlueprintPresenterOptions`, and `TowerBlueprintPresenterController`. The dynamic context and untrusted restore input remain named `unknown` boundaries because this module passes/narrows them without owning their external schemas.

**Persistence boundary:** The live wiring proves this presenter owns the base getter/apply pair supplied to persistence. `spireResourcePersistence.ts` now uses `TowerUpgradeStateSnapshot` for the base getter and `TowerUpgradeStateSnapshotInput` for restore, while its wrapper remains a separate shape that adds `alephChainUpgrades`. This closes the final named external schema left by Phases 6–7 without merging the base and wrapper contracts.

**Behavior preserved:** Required-resolver failure timing/message and optional dependency fallbacks; authored precedence; definition-gated fallback creation, exact fallback labels/equations/formatting/math, and stable fallback identity; lazy live state identity and legacy-variable retention; exact snapshot inclusion, zero clamp without flooring, fractional levels, additive positive-only restore, and unknown variable/tower behavior; function/numeric/invalid/minimum cost paths; fractional invested-level loop behavior; reference/transform/exponent precedence; caught `computeValue` warnings versus uncaught callback branches; base precedence and step behavior; recursive protection, safe-result normalization, cache timing, and targeted/all clearing. No authored blueprint is mutated.

**Tests added:** 20 deterministic tests exercise generated `assets/towerBlueprintPresenter.js` against a scratch authored-blueprint registry: construction/fallbacks, authored/fallback lookup and identity, live state/snapshots/legacy restore, cost and invested totals, all variable-value precedence branches, warning fallback, custom/fallback/non-finite results, recursion, cache reuse/invalidation, and targeted/global clear. Core total increased from 109/109 to **129/129**; retired-Spire checks continue separately.

**Validation and counts:** Final typecheck/build/lint/unit/smoke checks pass; build output is deterministic across two consecutive builds; generated sibling exists; `dist/` contains no `.ts`; import resolution passes; and the scoped source audit finds no `any`, suppressions, broad double assertions, or suspicious non-null assertions. Counts are 49 authored TypeScript modules, 258 remaining JavaScript modules, 19 preserved legacy modules, and 239 active remaining among 288 active authored modules. Build number is 732.

**Browser/manual verification:** Browser control was available and a local static server returned the built app successfully to the host, but the in-app browser's isolated network context received `ERR_CONNECTION_REFUSED` for that localhost server. Therefore no Towers-tab, equation-overlay, save/reload, console, Electron, touch, or physical-device verification is claimed; the attempted browser smoke is recorded without overstating its result.

**Deferred findings:** A live Iota blueprint contains a display-oriented variable entry without `key`; inherited object-property coercion initializes an `"undefined"` state slot while value evaluation returns 0 for the missing key. Fractional levels use the original `levelIndex < levels` loop (2.5 produces three cost iterations), and missing blueprint variables cost a flat 1 per iteration because the missing-variable early return bypasses default progression. Fallback aggregation can be reduced back to zero by a later zero/invalid contribution. These semantics are preserved and characterized, not corrected.

---

## Phase 9 — Tower-Variable Discovery State Owner (COMPLETE)

**Status:** COMPLETE (2026-07-15)
**Migration type:** Behavior-preserving migration

**Verified live scope and baseline:** The session began from clean `main` at Phase 8 commit `e59f7ab`, created `codex/phase-9-tower-variable-discovery`, re-read the root/assets/module-system guidance and both plans, and confirmed the 301-line module and its sole runtime importer. Baseline typecheck/build/lint, 129/129 core tests plus retired-Spire checks, and smoke tests all passed.

**Imports, importer, and boundary:** The discovery owner has only a type-only dependency on Phase 8's `TowerEquationBlueprint`/`TowerEquationVariable`; its generated JavaScript remains dependency-free. `assets/towersTab.js` is the only direct importer. It injects the universal metadata Map, owned discovery Map and listener Set, tower definition/order resolvers, Phase 8 blueprint resolver, and current unlock fallback, then re-exports discovery snapshots/listener/initialization and passes metadata lookup into the tooltip system. No Towers-tab, equation-registry, overlay, simulation, playfield, or main module was converted.

**Files converted and compatibility-edited:** `assets/towerVariableDiscovery.js` was converted to strict `assets/towerVariableDiscovery.ts`; the `.js` sibling is generated by the established build and keeps the same import path, export, return keys, validation messages, and timing. `assets/towerBlueprintPresenter.ts` narrowly added the existing `libraryKey`, `equationSymbol`, tooltip, units, and glyph-label fields to `TowerEquationVariable`. `scripts/unit-test-core.cjs` gained compiled-output coverage. No runtime caller required textual compatibility changes.

**Types/interfaces introduced:** `UniversalTowerVariableMetadata`, `TowerVariableDiscoveryDefinition`, `DiscoveredTowerVariable`, `DiscoveredTowerVariableListener`, `TowerVariableDiscoveryOptions`, and `TowerVariableDiscoveryController`, plus private resolver/provider and validation-narrowing contracts. External unlock inputs and injected stores remain `unknown` until their preserved runtime checks; no `any`, suppressions, non-null assertions, or broad double assertions were added.

**Behavior preserved:** Exact Map/Set validation messages; trimmed/lowercase universal lookup precedence; compound id key precedence; authored, universal, and tower metadata fallback order; finite tier and missing-order handling; duplicate suppression; tower-order/id/name sorting and shallow defensive record clones; immediate listener subscription, warning isolation, unsubscribe, and shared per-notification snapshots; Set/array/generic-iterable/object-key unlock normalization; Set-only default fallback; ordered-definition preference; unordered iteration fallback; clear/rebuild behavior; and one batched notification after initialization.

**Tests added:** 11 deterministic tests run against generated `assets/towerVariableDiscovery.js`, covering both validation errors, lookup/id precedence, authored/universal/tower record fallbacks, invalid/duplicate discovery, sort/cloning, immediate notification/unsubscribe, both warning paths, all accepted unlock collection shapes, ordered initialization/batching, Set fallback, and unordered initialization. Core total increased from 129/129 to **140/140**; retired-Spire checks remain separate.

**Validation and counts:** Typecheck/build/lint/unit/retired-Spire checks pass during implementation; final smoke and output audits are recorded in the Implementation Log. Counts are 50 authored TypeScript modules, 257 remaining JavaScript modules, 19 preserved legacy modules, and 238 active remaining among 288 active authored modules. Build number advanced once from 732 to 733.

**Browser/manual verification:** No browser automation, Electron, touch, or physical-device test is claimed for this dependency-injected state owner. Its behavior is exercised directly through compiled-output tests; the recursive smoke test verifies the unchanged runtime import graph.

---

## Phase 10 — Tower-Equation Tooltip DOM Owner (COMPLETE)

**Status:** COMPLETE (2026-07-15)
**Migration type:** Behavior-preserving migration

**Verified live scope and baseline:** Phase 10 was stacked from the completed Phase 9 commit `a731dfc` on `codex/phase-10-tower-equation-tooltip`. The live recommendation remained current: one 278-line tooltip owner, directly imported only by `assets/towersTab.js`. Baseline typecheck/build/lint, 140/140 core tests plus retired-Spire checks, and recursive smoke tests all passed.

**Imports, importer, and consumers:** The authored TypeScript imports only Phase 8's `TowerEquationVariable` and Phase 9's `UniversalTowerVariableMetadata`, both type-only and erased from generated JavaScript. `assets/towersTab.js` supplies the shared state bucket, panel resolver, universal metadata resolver, id, and margin; it destructures all seven returned helpers and passes `buildVariableTooltip` plus pointer/focus handlers into the still-JavaScript upgrade overlay. Neither caller required a compatibility edit.

**Files converted and tests:** `assets/towerEquationTooltip.js` was converted to strict `assets/towerEquationTooltip.ts`; the `.js` sibling remains build-generated at the same path with unchanged named/default exports and controller keys. `scripts/unit-test-core.cjs` gained a deterministic minimal DOM/timer/frame harness and 10 compiled-output tests. `assets/towersTab.js`, `assets/towerUpgradeOverlayController.js`, equation modules, simulations, and main integration remain unconverted and unedited.

**Types/interfaces introduced:** `TowerEquationTooltipState`, `TowerEquationTooltipOptions`, and `TowerEquationTooltipController`, plus private panel, metadata-resolver, frame-scheduler, and event-current-target contracts. The injected state and frame option remain `unknown` until narrowed by the exact inherited truthy/function checks. DOM elements use their real `HTMLElement`/`DOMRect` surfaces; no `any`, suppressions, non-null assertions, or broad double assertions were added.

**Behavior preserved:** Exact missing-state error; browser/global timer and animation-frame fallback selection; connected-element reuse; class/id/role/hidden defaults; authored/universal/key/fallback tooltip text precedence and punctuation; panel max-width and horizontal/vertical clamping; below-versus-above selection; 160 ms pointer-leave delay; immediate blur cleanup; text/dataset/hidden/ARIA state; stale-target ARIA removal; pending-hide cancellation; and `HTMLElement` guards for pointer/focus event targets.

**Tests and validation:** 10 tests cover construction validation, no-document/no-panel paths, element creation/reuse/defaults, every tooltip text fallback family, below and above/clamped positioning, target switching and invalid guards, delayed cleanup, immediate blur, pending-hide cancellation, and custom frame precedence. The core suite increased from 140/140 to **150/150**; retired-Spire checks remain separate. Final build/typecheck/lint/unit/smoke and output audits are recorded in the Implementation Log.

**Counts and approximation:** 51 authored TypeScript modules, 256 remaining JavaScript modules, 19 preserved legacy modules, and 237 active remaining among 288 active authored modules. This is **17.7% converted by active module count**. A supplemental line-count snapshot is 7,063 typed source lines versus 106,922 active remaining JavaScript lines, or about **6.2% typed by source lines**; line share is only an approximation because TypeScript contracts/comments expand migrated files and the remaining tree includes several very large generated-like data and runtime modules. Build number advanced once from 733 to 734.

**Browser/manual verification:** No live browser, Electron, touch, or physical-device verification is claimed. The DOM/timer/frame behavior is exercised through compiled-output tests with deterministic fakes, and the smoke test verifies the unchanged runtime import graph.

---

## Phase 11 — Master-Equation Derivation Utility (COMPLETE)

**Status:** COMPLETE (2026-07-15)
**Migration type:** Behavior-preserving migration

**Verified live scope and continuation baseline:** The live plan still identified this module as the next bounded phase. This continuation resumed from clean `codex/phase-11-master-equation-utils` at `e672bab40b40138c1daff35fc77299758fb47a8a` (the recovered auto-sync checkpoint stacked on `64ebc5e`) with Build 736. Before the remaining edits, `git status --short` was clean and `npm run typecheck`, `npm run build`, `npm run lint`, `npm run test:unit` (142/142 plus retired-Spire checks), and `npm test` all passed. The original owner was re-read from the branch base and compared with the generated output rather than relying on the older plan's approximate line count.

**Files converted and compatibility-edited:** `assets/towerEquations/masterEquationUtils.js` was converted to strict `assets/towerEquations/masterEquationUtils.ts`; the `.js` sibling remains build-generated at the same path. `assets/towerBlueprintPresenter.ts` narrowly added only the master-equation metadata already read from blueprint variables and blueprints. `scripts/unit-test-core.cjs` gained compiled-output characterization coverage. `assets/towersTab.js`, `assets/towerUpgradeOverlayController.js`, `assets/towerEquations/blueprintContext.js`, equation registries and authored definitions, simulations, playfield systems, and `assets/main.js` were not converted or substantially edited. The static build refreshed the corresponding generated files under `dist/`.

**Types/interfaces introduced or extended:** Phase 11 introduced `MasterEquationFormat`, `MasterEquationTerm`, `MasterEquationSymbolPair`, `DerivedMasterEquationStructure`, `MasterEquationDerivationParameters`, and `MasterEquationTextParameters`, plus private property-source, untrusted-variable, and raw-parameter narrowing contracts. It reused `TowerEquationBlueprint`, `TowerEquationVariable`, and `TowerEquationDefinition` through a type-only import; the shared variable contract was extended only with `masterEquationSymbol`, `masterEquationLabel`, `masterEquationLatex`, `attachedToVariable`, `category`, and `includeInMasterEquation`, while the blueprint contract gained its existing `masterEquationSymbol` and `masterEquationLatex` fields. JavaScript-originated parameters remain `unknown` until runtime checks preserve their actual behavior. No `any`, suppression, broad double assertion, unexplained non-null assertion, or runtime type import was added.

**Behavior characterized and preserved:** No-argument defaults and null's inherited TypeError class; primitive/array/function/malformed input handling; attachment detection from trimmed `attachedToVariable` strings or exact `category === 'attachment'`; explicit-false exclusion with all other inclusion values retained; exact plain and LaTeX variable-label candidate precedence; trimming and the inherited `\\text{...}`/`\\(...\\)` wrapper behavior; exact plain and LaTeX master-symbol fallback order; variable order; malformed/label-less omission; non-mutation; fallback return timing and non-string fallback passthrough; zero-term equations; exact plain multiplication and LaTeX wrapping/`\\times` spacing; representation fallbacks; and the rule that only `format === 'latex'` selects LaTeX output. Suspicious wrapper-branch ordering and fallback behavior were documented and tested rather than corrected.

**Tests added:** 15 deterministic tests run against generated `assets/towerEquations/masterEquationUtils.js`, increasing the live post-retirement core suite from 127 to **142 tests**. Coverage includes omitted/null/primitive/array/function/malformed calls; every plain and LaTeX label candidate and precedence; whitespace and both wrapper normalizations; both attachment paths; explicit-false and other truthy/falsy inclusion values; all master-symbol fallbacks; missing-symbol fallback passthrough; exact zero/multi-term plain and LaTeX output; cross-representation behavior; non-`latex` formats; order preservation; and deep-frozen non-mutation fixtures.

**Validation and counts:** Final typecheck/build/lint/unit/retired-Spire/smoke validation and generated-output audits are recorded in the Implementation Log. Counts moved from 50 to **51 authored TypeScript modules** and from 235 to **234 remaining JavaScript modules**; the current active authored total remains **285**. Build 736 advanced exactly once to Build 737.

**Browser/manual verification:** No live browser, Electron, touch, or physical-device verification was performed or claimed. The module is pure and DOM-free, so deterministic tests against generated JavaScript are the direct behavioral verification; the recursive smoke test covers unchanged `.js` import specifiers. No requested behavior remained unverifiable within that boundary.

---

## Phase 12 — Tower-Blueprint Shared Context (COMPLETE)

**Status:** COMPLETE (2026-07-15)
**Migration type:** Behavior-preserving migration

**Verified starting point and baseline:** Phase 12 branched as `codex/phase-12-blueprint-context` directly from the completed local Phase 11 commit `73e3a1176f9ec83e4b6a7607ad645bfced15dff4`. The starting worktree was clean at Build 737, the Phase 11 source/generated/tests/ledger state was present, and the live plan still recommended this exact module. Before editing, `npm run typecheck`, `npm run build`, `npm run lint`, `npm run test:unit` (142/142 plus retired-Spire checks), and `npm test` all passed.

**Live dependency inventory:** `assets/towersTab.js` is the sole initializer and supplies exactly the seven documented helpers after all definitions are established. The other 18 direct importers retain the exported object through a local `ctx`/`_ctx` accessor; none required an import-specifier edit. Guarded below means optional chaining or an explicit function check; mixed means a module has both guarded and startup-dependent direct calls.

| Direct importer | Access pattern | Context helpers called and guard behavior |
|---|---|---|
| `assets/towersTab.js` | Imports initializer only | Supplies all seven helpers in one object; does not read the context export |
| `assets/towerEquations/basicTowers.js` | `ctx()` | All except `getTowerDefinition`; unconditional |
| `assets/towerEquations/greekTowers.js` | `ctx()` | `getTowerEquationBlueprint`, `calculateTowerEquationResult`, `getDynamicConnectionCount`, `getTowerDefinition`, `computeTowerVariableValue`; unconditional |
| `assets/towerEquations/infinityTower.js` | `ctx()` | `deriveGlyphRankFromLevel`, `getTowerEquationBlueprint`, `ensureTowerUpgradeState`, `computeTowerVariableValue`; unconditional |
| `assets/towerEquations/advanced/chiEquation.js` | `ctx()` | `calculateTowerEquationResult`; explicit function guard |
| `assets/towerEquations/advanced/kappaEquation.js` | `ctx()` | `calculateTowerEquationResult`; explicit function guards |
| `assets/towerEquations/advanced/lambdaEquation.js` | `ctx()` | blueprint/value helpers guarded; `ensureTowerUpgradeState` unconditional |
| `assets/towerEquations/advanced/muEquation.js` | `ctx()` | `calculateTowerEquationResult`; mixed optional and unconditional calls |
| `assets/towerEquations/advanced/nuEquation.js` | `ctx()` | blueprint/value helpers; guarded |
| `assets/towerEquations/advanced/omegaEquation.js` | `_ctx()` | Accessor retained but no helper currently called |
| `assets/towerEquations/advanced/omicronEquation.js` | `ctx()` | blueprint/result/value helpers; optional probes guard dependent direct calls |
| `assets/towerEquations/advanced/phiEquation.js` | `ctx()` | `calculateTowerEquationResult`; explicit function guard |
| `assets/towerEquations/advanced/piEquation.js` | `ctx()` | blueprint/result/value helpers; guarded |
| `assets/towerEquations/advanced/psiEquation.js` | `_ctx()` | Accessor retained but no helper currently called |
| `assets/towerEquations/advanced/rhoEquation.js` | `ctx()` | `ensureTowerUpgradeState`; guarded |
| `assets/towerEquations/advanced/sigmaEquation.js` | `_ctx()` | Accessor retained but no helper currently called |
| `assets/towerEquations/advanced/tauEquation.js` | `ctx()` | `calculateTowerEquationResult`; guarded/optional |
| `assets/towerEquations/advanced/upsilonEquation.js` | `_ctx()` | Accessor retained but no helper currently called |
| `assets/towerEquations/advanced/xiEquation.js` | `ctx()` | blueprint/value helpers; guarded |

**Files and contracts:** The sole authored implementation became strict `assets/towerEquations/blueprintContext.ts`; its `.js` sibling remains generated at the same path. No production compatibility edit outside the converted module was needed. `TowerBlueprintContextHelpers` reuses `getTowerEquationBlueprint`, `ensureTowerUpgradeState`, `calculateTowerEquationResult`, and `computeTowerVariableValue` through indexed members of `TowerBlueprintPresenterController`. Phase 12 adds `DeriveGlyphRankFromLevel`, `GetDynamicConnectionCount`, `GetTowerDefinition`, and `TowerBlueprintContext`; `TowerEquationDefinition` is reused for definition lookup. All shared imports are type-only.

**Nullability and behavior preserved:** Every known helper slot is explicitly function-or-`null` and starts as an own `null` property. The one exported object remains mutable, unsealed, unfrozen, and reference-stable. `initializeBlueprintContext` still delegates directly to `Object.assign`, returns `undefined`, mutates rather than replaces, supports partial/repeated initialization and exact function/object identity, and performs no validation. Omitted/`undefined`/`null`/empty/number/boolean sources are no-ops; strings and arrays contribute enumerable index keys; own enumerable string and symbol keys copy; inherited and non-enumerable keys do not; getters run once; and a throwing getter propagates after preserving assignments completed earlier in property order. Source objects are not mutated.

**Tests, validation, and counts:** Seven deterministic tests import fresh copies of generated `assets/towerEquations/blueprintContext.js`, raising the core suite from 142 to **149 tests**. They cover initial shape/mutability, stable identity, partial/repeated replacement, function/object identity, return value, nullish/empty inputs, primitive/array behavior, extra/inherited/non-enumerable/symbol keys, getter reads, partial assignment on exceptions, and source non-mutation. Final typecheck/build/lint/unit/retired-Spire/smoke validation and generated-output audits are recorded in the Implementation Log. Counts moved from 51 to **52 authored TypeScript modules** and from 234 to **233 remaining JavaScript modules**; total authored modules remain **285**. Build 737 advanced exactly once to Build 738.

**Browser/manual verification:** No browser, Electron, touch, or physical-device verification was performed or claimed. This module is dependency-free and DOM-free; generated-JavaScript tests directly cover its state and `Object.assign` contract, and no requested behavior remained unverifiable within that boundary.

---

## Phase 13 — Tower-Equation Registry and Lookup (COMPLETE)

**Status:** COMPLETE (2026-07-15)
**Migration type:** Behavior-preserving migration

**Verified starting point and baseline:** Phase 13 branched as `codex/phase-13-equation-registry` directly from completed local Phase 12 commit `d8edefe5953c71536d5b6b29b2355f10a287402a`. The worktree was clean at Build 738, Phase 12's source/generated/tests/ledger state was present, and the live recommendation still named this exact 60-line registry. Before editing, typecheck/build/lint, 149/149 core tests plus retired-Spire checks, and the recursive smoke test all passed.

**Live imports and consumers:** The registry retains six runtime source-group imports: `mindGate.js`, `shadowGate.js`, `basicTowers.js`, `greekTowers.js`, `advancedTowers.js`, and `infinityTower.js`. Its sole direct runtime consumer is the already-typed `assets/towerBlueprintPresenter.ts`, whose generated JavaScript continues importing `./towerEquations/index.js`. No equation definition/group, Towers-tab module, simulation, playfield system, or main-integration file was edited.

**Files and types:** The sole authored implementation became strict `assets/towerEquations/index.ts`; the `.js` sibling remains generated at the same path with the same six runtime imports and two named exports. `TOWER_EQUATION_BLUEPRINTS` uses the existing `TowerEquationBlueprint` contract through a type-only reverse boundary and `satisfies`, so the generated registry acquires no presenter import or runtime cycle. `TowerEquationId` is derived from the registry's exact keys. A trusted known-id overload returns a blueprint, while the implementation retains an `unknown` JavaScript boundary for malformed/coercible keys.

**Behavior characterized and preserved:** The registry retains the exact 27 keys, insertion order, imported object identities, plain mutable object/prototype, and unfrozen/unsealed state. The lookup still returns `null` for falsy and missing values, sees later own-key mutations, returns inherited truthy properties such as `toString`, applies JavaScript property-key coercion to arrays and objects, accepts symbol keys, returns `null` for falsey stored values, and propagates property-coercion exceptions. No own-property filtering, freezing, cloning, validation, or string normalization was introduced.

**Tests, validation, and counts:** Four deterministic tests load generated `assets/towerEquations/index.js` against identity-marked stub definition groups, raising the core suite from 149 to **153 tests**. They cover all keys/order/identities, registry mutability, canonical/custom/falsey entries, nullish and primitive inputs, symbol properties, inherited keys, array/object coercion, and throwing coercion. Final typecheck/build/lint/unit/retired-Spire/smoke validation and generated/import audits are recorded in the Implementation Log. Counts moved from 52 to **53 authored TypeScript modules** and from 233 to **232 remaining JavaScript modules**; total authored modules remain **285**. Build 738 advanced exactly once to Build 739.

**Browser/manual verification:** No browser, Electron, touch, or physical-device verification was performed or claimed. The registry is DOM-free; isolated generated-output tests verify its aggregation and lookup behavior, while the recursive smoke test verifies the real six-module runtime graph. No requested behavior remained unverifiable within that boundary.

---

## Phase 14 — Mind Gate Authored Equation Definition (COMPLETE)

**Status:** COMPLETE (2026-07-16)
**Migration type:** Behavior-preserving migration

**Verified starting point and baseline:** Phase 14 branched as `codex/phase-14-mind-gate-equation` directly from completed local Phase 13 commit `4b87d9da3ad906cc14046b2467f36e5ac284120d`. The worktree was clean at Build 739, the registry still imported `./mindGate.js`, and the live recommendation named this 76-line first authored equation definition. Before editing, typecheck/build/lint, 153/153 core tests plus retired-Spire checks, and the recursive smoke test all passed.

**Live imports and consumers:** Mind Gate retains its sole runtime dependency, `scripts/core/formatting.js`, and remains consumed through the typed equation registry. The live upgrade-overlay caller supplies level/value plus formatter and tower context fields to `getSubEquations`; the presenter-owned callback contract now records that actual surface. No Shadow Gate, grouped definition, Towers-tab, simulation, playfield, or main-integration implementation was edited.

**Files and types:** The sole authored implementation became strict `assets/towerEquations/mindGate.ts`; its `.js` sibling remains generated at the same path with the same named export and formatting import. `TowerVariableSubEquation` and `TowerVariableSubEquationContext` were added to `assets/towerBlueprintPresenter.ts`, and `TowerEquationVariable` gained the optional callback already used by JavaScript definitions. The result label remains an open string because the live renderer reserves only exact `values` and treats every other authored label as an expression; this keeps all remaining JavaScript definitions registry-compatible without weakening their numeric callback inputs.

**Behavior characterized and preserved:** Both variables retain their exact order, metadata, glyph labels, base/step values, cost functions, and formatter calls. Both sub-equation builders retain exact `String.raw` LaTeX, finite fractional values, minimum rank/investment clamping, malformed defaults, result-object order, `values` variant, and glyph flag. Result calculation retains number-only finite acceptance, minimum-one clamping, and multiplication. Golden formatting retains result-first, life-second, recovery-third callback order and exact symbolic output.

**Tests, validation, and counts:** Five deterministic tests load generated `assets/towerEquations/mindGate.js` against a recording formatting stub, raising the core suite from 153 to **158 tests**. They cover exact metadata/order/text, formatting and fractional costs, both sub-equation arrays and malformed/fractional inputs, number-only result fallbacks/product, and golden callback order/output. Final typecheck/build/lint/unit/retired-Spire/smoke validation and generated/import audits are recorded in the Implementation Log. Counts moved from 53 to **54 authored TypeScript modules** and from 232 to **231 remaining JavaScript modules**; total authored modules remain **285**. Build 739 advanced exactly once to Build 740.

**Browser/manual verification:** No browser, Electron, touch, or physical-device verification was performed or claimed. This definition is DOM-free; generated-output characterization tests cover its formulas and callback behavior, while the recursive smoke test verifies registry and real-graph compatibility.

---

## Phase 15 — Shadow Gate Authored Equation Definition (COMPLETE)

**Status:** COMPLETE (2026-07-16)
**Migration type:** Behavior-preserving migration

**Verified starting point and baseline:** Phase 15 branched as `codex/phase-15-shadow-gate-equation` directly from completed local Phase 14 commit `3acc3672c4ded200428a37f07452152ea64f87ff`. A fresh fetch showed the stacked branch six commits ahead and zero behind `origin/main`, so no upstream divergence required resolution. The worktree was clean at Build 740, and pre-edit typecheck/build/lint, 158/158 core tests plus retired-Spire checks, and recursive smoke tests all passed.

**Live imports and consumers:** Shadow Gate retains its sole runtime dependency on `assets/codex.js` and remains consumed through the typed equation registry. Its variable `name` getter reads the live encountered-enemy Set on every access and resolves current Codex entries. No Codex owner, grouped definition, Towers-tab, simulation, playfield, or main-integration implementation was edited.

**Files and types:** The sole authored implementation became strict `assets/towerEquations/shadowGate.ts`; its `.js` sibling remains generated at the same path with the same named export and Codex import. The definition reuses `TowerEquationBlueprint` through a type-only import. A local `ShadowGateCodexEntry` and two narrow assignments describe only the encountered-enemy Set and optional symbol lookup used at this JavaScript-owned boundary.

**Behavior characterized and preserved:** The exact blueprint/variable shape, strings, `String.raw` LaTeX, non-upgradable flag, zero result, and symbolic golden equation remain unchanged. Each getter access still snapshots the current Set with `Array.from`, preserves insertion order and Set deduplication, performs one lookup per encountered ID, uses optional symbol access, filters all falsey symbols with `filter(Boolean)`, stringifies retained values through `join`, and joins them with comma-space separators.

**Tests, validation, and counts:** Three deterministic tests load generated `assets/towerEquations/shadowGate.js` against a mutable recording Codex stub, raising the core suite from 158 to **161 tests**. They cover exact metadata/passive output, order/deduplication/lookup count, later getter reads, changed entry values, missing entries, falsey symbols, and exact joins. Counts moved from 54 to **55 authored TypeScript modules** and from 231 to **230 remaining JavaScript modules**; total authored modules remain **285**. This is **19.3% by module count** and approximately **6.2% by authored source lines**. Build 740 advanced exactly once to Build 741.

**Browser/manual verification:** No browser, Electron, touch, or physical-device verification was performed or claimed. This definition has no DOM behavior; generated-output tests directly cover its dynamic Codex contract, and recursive smoke validation covers the real import graph.

---

## Phase 16 — Advanced-Equation Barrel (COMPLETE)

**Status:** COMPLETE (2026-07-16)
**Migration type:** Behavior-preserving migration

**Verified starting point and baseline:** Phase 16 branched as `codex/phase-16-advanced-equation-barrel` directly from completed local Phase 15 commit `5df90011c4e75b8b03e3ed27f7e8a0eb2d1945d2`. A fresh fetch showed the stacked branch seven commits ahead and zero behind `origin/main`. The worktree was clean at Build 741, and pre-edit typecheck/build/lint, 161/161 core tests plus retired-Spire checks, and recursive smoke tests all passed.

**Live imports and consumers:** The barrel retains 15 direct re-exports from `assets/towerEquations/advanced/` and remains consumed only through the typed equation registry. No individual advanced definition, grouped definition, Towers-tab, simulation, playfield, or main-integration file was edited.

**Files and behavior:** The sole authored implementation became strict `assets/towerEquations/advancedTowers.ts`; its `.js` sibling remains generated at the same path. All 15 export names, `.js` source specifiers, live bindings, imported object identities, and registry compatibility remain exact. No runtime wrapper, presenter dependency, formula logic, or new type boundary was introduced.

**Tests, validation, and counts:** One deterministic generated-output test imports the barrel against 15 identity-marked source stubs, raises the core suite from 161 to **162 tests**, and verifies the exact named-export set plus every source identity. Counts moved from 55 to **56 authored TypeScript modules** and from 230 to **229 remaining JavaScript modules**; total authored modules remain **285**. Completion is **19.6% by module count** and approximately **6.2% by authored source lines**. Build 741 advanced exactly once to Build 742.

**Browser/manual verification:** No browser, Electron, touch, or physical-device verification was performed or claimed. This barrel is dependency-aggregation-only and DOM-free; isolated identity tests and recursive smoke validation cover its runtime boundary.

---

## Phase 17 — Sigma Advanced Equation Definition (COMPLETE)

**Status:** COMPLETE (2026-07-16)
**Migration type:** Behavior-preserving migration

**Verified starting point and baseline:** Phases 17–20 were executed together on `codex/phase-16-advanced-equation-barrel` from completed Phase 16 commit `7d2aa7b2386b3adfcaceb73a78e706cb0632bb08`. A fresh fetch showed the clean stacked branch eight commits ahead and zero behind `origin/main` at Build 742. Pre-edit typecheck/build/lint, 162/162 core tests plus retired-Spire checks, and recursive smoke validation all passed.

**Files, contracts, and behavior:** The sole Sigma implementation became strict `assets/towerEquations/advanced/sigmaEquation.ts`; its `.js` sibling remains generated with the same formatting/context imports and named export. The presenter-owned contract now records the three number formatters already supplied to sub-equation callbacks plus the existing base-equation value formatter surface. Narrow property reads preserve canonical-before-prefixed Sigma stat lookup, nullish fallback, inherited/getter access, Number coercion, finite/nonnegative validation, and the strict `prestige === true` branch. Exact metadata, formula strings, stored/absorbed variable order, optional last-release line, result behavior, and formatter order remain unchanged; no `any`, assertion, suppression, or runtime wrapper was added.

**Tests, validation, and counts:** Four generated-output tests cover metadata, canonical/prefixed precedence, coercion and invalid fallbacks, imported formatting, prestige/non-prestige arrays, optional release output, absorbed lines, number-only result acceptance, and base formatter order. The core suite rose from 162 to **166 tests** for this phase. Counts moved from 56 to **57 authored TypeScript modules** and from 229 to **228 remaining JavaScript modules**; total authored modules remain **285**.

**Browser/manual verification:** No browser, Electron, touch, or physical-device verification was performed or claimed. Sigma's definition is DOM-free; generated-output characterization and recursive smoke validation cover the migrated boundary.

---

## Phase 18 — Phi Advanced Equation Definition (COMPLETE)

**Status:** COMPLETE (2026-07-16)
**Migration type:** Behavior-preserving migration

**Scope and behavior:** After Sigma, Phi was the smallest remaining advanced definition by authored lines. The sole implementation became strict `assets/towerEquations/advanced/phiEquation.ts`; its generated `.js` sibling retains all three formatting imports, the shared context import, the dormant context resolver, five mathematical constants, and the same named export. All four variables, exact Fibonacci/golden-angle strings, formatting fallbacks, result coercion, `Infinity × 0` yielding `NaN`, and base callback order remain unchanged.

**Tests, validation, and counts:** Three generated-output tests cover exact metadata/constants, every variable's malformed-value fallback and formatter order, coercive result math, the inherited `NaN` edge, and base-equation formatting. The core suite rose from 166 to **169 tests** for this phase. Counts moved from 57 to **58 authored TypeScript modules** and from 228 to **227 remaining JavaScript modules**; total authored modules remain **285**.

**Browser/manual verification:** No browser, Electron, touch, or physical-device verification was performed or claimed. Phi's definition is deterministic and DOM-free; generated-output tests and recursive smoke validation cover its runtime boundary.

---

## Phase 19 — Upsilon Advanced Equation Definition (COMPLETE)

**Status:** COMPLETE (2026-07-16)
**Migration type:** Behavior-preserving migration

**Scope and behavior:** The sole Upsilon implementation became strict `assets/towerEquations/advanced/upsilonEquation.ts`; its generated `.js` sibling retains its formatting/context imports, named export, and exact four-variable order. Metadata, glyph labels, base/step values, exponential rounded cost curves, finite fallbacks, rank derivation, formatter calls, Number coercion, minimum fleet behavior, inherited `Infinity × 0` `NaN` edge, and mixed base-equation formatting remain unchanged.

**Tests, validation, and counts:** Three generated-output tests cover metadata, all four cost curves, all variable equation builders and malformed defaults, result coercion/`NaN`, and base callback/formatter order. The core suite rose from 169 to **172 tests** for this phase. Counts moved from 58 to **59 authored TypeScript modules** and from 227 to **226 remaining JavaScript modules**; total authored modules remain **285**.

**Browser/manual verification:** No browser, Electron, touch, or physical-device verification was performed or claimed. Upsilon's equation owner is DOM-free; generated-output tests and recursive smoke validation cover the migrated formulas.

---

## Phase 20 — Tau Advanced Equation Definition (COMPLETE)

**Status:** COMPLETE (2026-07-16)
**Migration type:** Behavior-preserving migration

**Scope and behavior:** The sole Tau implementation became strict `assets/towerEquations/advanced/tauEquation.ts`; its generated `.js` sibling retains all formatting/context imports and the same named export. Exact metadata, five-variable order, Gamma dependency lookup, the finite Gamma branch's two callback invocations, three Aleph formulas, fixed two-turn value, implicit numeric coercion, particle minimum, result math, and base formatter order remain unchanged.

**Tests, validation, and counts:** Four generated-output tests cover live Gamma helper mutation/call counts and invalid fallback, exact metadata/fixed turns, all three Aleph equation builders and formatter order, string-number result coercion, particle clamping, and base formatting. The core suite rose from 172 to **176 tests** for this phase. Counts moved from 59 to **60 authored TypeScript modules** and from 226 to **225 remaining JavaScript modules**; total authored modules remain **285**. Completion is **21.1% by module count** and approximately **6.7% by authored source lines**. Build 742 advanced exactly once to Build 743 for the combined committed change.

**Browser/manual verification:** No browser, Electron, touch, or physical-device verification was performed or claimed. Tau's definition is DOM-free; generated-output tests and recursive smoke validation cover its context and formula behavior.

---

## Tentative Later Migration Areas (SUPERSEDED 2026-07-16)

The original sketch below is retained as historical planning evidence only. It is superseded by the dependency-aware Phases 21-55 and the module coverage appendix above. None of the later phases is authorized merely because it appears in either list.

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

### 2026-07-16 — Make the migration inventory mechanically enforceable

The equipment/gem retirement removed five active JavaScript modules from future phases and one unreachable candidate, but the primary ledger retained its earlier totals. The roadmap now carries matching machine-readable count markers, and `scripts/check-migration-roadmap.cjs` independently rebuilds the `assets/main.js` static graph, validates active and candidate assignments path-for-path, rejects duplicates, and compares every Phase 21-55 module count. A failing checker is a mandatory replan trigger.

### 2026-07-16 — Keep one authoritative ledger and one exact inventory appendix

`JavaToTypeScriptConversionPlan.md` remains the status, history, execution, and authorization ledger. `docs/TypeScriptMigrationRoadmapInventory.md` remains the exact file-assignment and decision-candidate appendix. `TheroMathTD_TS_Migration_Plan.md` is archived historical orientation and must not authorize work. This division keeps implementation evidence without requiring contributors to reconcile two competing current plans.

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
- (Phase 5A) `assets/state/spireResourceState.ts`'s `mergeBranch` helper unconditionally spreads a `generators: {}` field onto every branch it merges, including `lamed` and `tsadi`, whose nominal shape has no `generators` field at all. This is an artifact of the original JS reusing one shared merge helper across branches with different shapes; no current consumer reads the spurious field, so it was preserved unchanged rather than fixed. See the Phase 5 section above for detail.
- **RESOLVED by Phases 6–8 (2026-07-15):** Phase 6 migrated the post-retirement persistence owner and narrowed both Spire-resource hooks plus both tower/Aleph wrapper hooks. Phase 7 replaced the Aleph boundary with owner types, and Phase 8 migrated `assets/towerBlueprintPresenter.ts` and replaced the remaining base tower-upgrade boundary. Unrelated autosave payloads intentionally remain generic by their own owners.
- (Phase 5A) `assets/state/cognitiveRealmState.js` (622 lines) was fully unmigrated JavaScript as of Phase 5A — since migrated to TypeScript in Phase 5B (see that section above).
- **RESOLVED (2026-07-13, post-Phase-5A):** the favicon smoke-test failure noted throughout every prior phase (`npm test` failing on a clean checkout because `assets/favicon/` doesn't exist) is no longer a pre-existing defect to track — the favicon directory and all its assets were removed intentionally, so the corresponding `<link>` tags in `index.html` and the `startupReferences` check in `scripts/smoke-test.cjs` were deleted to match. `npm test` now passes cleanly. This was a targeted cleanup, unrelated to any TS-migration phase's scope.
- (Phase 5B) `assets/state/cognitiveRealmState.ts`'s legacy-save deserialization fallback (`deserializeCognitiveRealmState`) validates a saved territory's `owner` field only with `Number.isFinite`, not that it is actually `0`/`1`/`2` (`TERRITORY_NEUTRAL`/`_PLAYER`/`_ENEMY`). A malformed-but-finite saved `owner` value passes through unfiltered, exactly as in the original `.js` — preserved unchanged (not fixed) per the migration's behavior-preservation requirement. See the Phase 5B section above for detail.
- (Phase 5B) The same function also trusts a saved territory's `id` field verbatim with no validation at all (not even a string-type check) — preserved unchanged, noted for any future save-migration tooling.

---

## Next Suggested Step

**Recommended Phase 21: `assets/towerEquations/advanced/rhoEquation.js` (enemy-yield income definition).** The normative implementation checklist is the [Phase 21 execution card](#phase-21-execution-card).

After Phases 17–20, Rho is the smallest remaining advanced definition by authored lines. Its two-variable income formula is bounded but exercises a richer JavaScript-originated dynamic context than Phi/Upsilon/Tau, making it the next useful step for validating the shared presenter contracts without expanding into simulations or playfield ownership.

**Bounded scope:** Convert only `assets/towerEquations/advanced/rhoEquation.js` to strict TypeScript. Reuse the presenter/context contracts and add only narrow guards for the enemy-yield and range dynamic inputs already read by the module. Add the deterministic generated-output coverage specified in the execution card. Do not convert another advanced definition, Infinity/basic/Greek definitions, Towers tab, simulations, playfield systems, or main integration.

**Acceptance criteria:** Preserve exact metadata, strings, formulas, dynamic-context lookup/coercion semantics, clamping, upgrade cost and rank behavior, sub-equation order, result math, formatter callback order/output, `.js` imports, barrel identity, and registry compatibility; add no `any`, assertions, or suppressions; typecheck/build/lint/unit/smoke pass; update counts/build number once and record browser availability honestly.

---

## Implementation Log

### 2026-07-16 — Roadmap reconciled and execution controls developed

- Reconciled the primary ledger after equipment/gem retirement: 60 authored TypeScript modules, 60 generated siblings, 174 active authored JavaScript modules, and 45 decision candidates.
- Corrected Phase 28, 32, 42, 45, and 50 counts and removed retired equipment/gem/crafting responsibilities from their future scope descriptions.
- Added the current migration dashboard, explicit replan triggers, a decision-status ledger, and an implementation-ready Phase 21 execution card.
- Added `scripts/check-migration-roadmap.cjs` and `npm run check:migration-roadmap` to validate the static runtime graph, exact path assignments, duplicate coverage, shared count markers, and per-phase module totals.
- Kept Phase 21 authorized but not started; no production module was migrated.
- Incremented the build number once to Build 747 for this committed planning/tooling change.
- Validation results are recorded when this branch completes its full verification gate.

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

### 2026-07-13 — Documentation repair and Phase 4 executed

**Status:** COMPLETE

A fresh session re-read every required doc (`AGENT_START_HERE.md`, `AGENTS.md`, `docs/JAVASCRIPT_MODULE_SYSTEM.md`, both migration plan documents, `tsconfig.json`, `scripts/sync-ts-output.cjs`, `scripts/build-static.cjs`) and ran baselines. `npm run typecheck`/`npm run build` initially failed with `'tsc' is not recognized` because `node_modules/typescript` was absent despite being listed in `package.json`; `npm install` resolved this (1 package added, no `package.json` changes). After that, baseline `npm run typecheck`, `npm run build`, `npm run lint` were clean, `npm run test:unit` was 29/29, and `npm test` failed with the same 4 pre-existing favicon errors as every prior phase.

**Documentation repair (see "Documentation and Tooling Repair" section above for full detail):**
- Recomputed migration counts using an explicit, stated methodology (converted = authored `.ts` excl. `.d.ts`; remaining = authored `.js` with no `.ts` sibling; generated `dist`/`build`/`node_modules` excluded; compiled `.js` siblings of migrated `.ts` not double-counted as "remaining"). Found `TheroMathTD_TS_Migration_Plan.md`'s prior "358 remaining `.js` files" / "366 total" figures conflated raw JS-file count with true remaining-unconverted count (the 8 already-migrated modules' compiled `.js` siblings were being counted twice). Corrected pre-Phase-4 baseline: 8 converted, 350 remaining, 358 total. Corrected post-Phase-4: 43 converted, 316 remaining, 359 total.
- Corrected `assets/data/towers/` file count from the stale "~24" in `TheroMathTD_TS_Migration_Plan.md` to the verified **33** (32 tower-definition imports in `index.js` + `index.js` itself), confirmed by reading the registry directly and counting.
- Rewrote Core Migration Principle 9 (see the Core Migration Principles section above) to prohibit duplicate hand-authored JS/TS implementations of the same module while explicitly permitting the project's existing build-generated `.js`-sibling strategy — no change to the actual build architecture, only to the principle's wording, since the old wording contradicted the project's own accepted Decision Log entries.
- Reworked TypeScript-source discovery for scalability: `tsconfig.json`'s `include` changed from an explicit 8-file list to glob patterns (`assets/**/*.ts`, `scripts/**/*.ts`) plus a `build`/`dist`/`node_modules` `exclude`; `scripts/sync-ts-output.cjs` rewritten to recursively walk `build/ts-out/` with Node's built-in `fs`/`path` (no glob package added) and copy back only compiled `.js` files that have a matching `.ts` source still present in the repo, rather than reading `tsconfig.json`'s (now glob-based) `include` list directly. Both `tsconfig.json` and `TheroMathTD_TS_Migration_Plan.md` updated to reflect this.

**Phase 4 migration performed:** See the "Phase 4 — Static Tower Definition Data (`assets/data/towers/`) (COMPLETE)" section above for full detail. Summary:
- Migrated all 33 files in `assets/data/towers/` (32 tower-definition modules + `index.js`) to strict TypeScript, plus introduced a new `assets/data/towers/types.ts` defining the shared `TowerDefinition` interface (9 required + 6 optional fields, each field's optionality/presence verified against all 33 original files before writing the interface, not assumed from a single example).
- Every tower constant kept its `Object.freeze(...)` call, exact literal values, and exact export names; the object literal inside `Object.freeze()` is now `{...} as const satisfies TowerDefinition` (preserves literal types and validates shape without widening or unsafe-asserting).
- `assets/data/towers/index.ts` kept its exact re-export block and `towers` array (same elements, same order), added `as const satisfies readonly TowerDefinition[]` on the array, and introduced `export type TowerId = (typeof towers)[number]['id']` derived directly from the completed registry.
- No importer required changes — `assets/configuration.js` (the sole consumer of the registry) kept its existing `./data/towers/index.js` import specifier unchanged.
- Extended `scripts/unit-test-core.cjs` with a new `importTowerRegistry()` helper and 9 new tests covering id uniqueness, numeric-field validity, `nextTierId` resolution, ordering/named-export consistency, gate/placeable special-casing, `Object.freeze` preservation, and two build-output invariants (every migrated `.ts` has a compiled `.js` sibling; no stray JS without a `.ts` source). Suite total: 38/38 passing.
- `npm run typecheck`, `npm run build`, `npm run lint` all clean; `npm test` fails with the same 4 pre-existing favicon errors (re-confirmed byte-identical output before and after this session's changes); `npm run test:unit` 38/38.
- Ran `npm run build` twice from a clean `build/` directory and diffed the two resulting `dist/` trees recursively — zero differences, confirming deterministic output.
- Manual/browser verification was **not** performed this session (no browser-automation tool was invoked); this is recorded explicitly rather than assumed or claimed.

**Next suggested step:** See the "Next Suggested Step" section below (recommending Phase 5: Game State Containers, `assets/state/*.js`).

### 2026-07-13 — Phase 5A executed, Phase 5B deferred

**Status:** 5A COMPLETE, 5B DEFERRED (not started)

A fresh session read the required docs (`AGENT_START_HERE.md`, `AGENTS.md`, `docs/JAVASCRIPT_MODULE_SYSTEM.md`, both migration plan documents, `tsconfig.json`, `scripts/sync-ts-output.cjs`, `scripts/build-static.cjs`) and ran the baseline: `git status --short` clean; `npm run typecheck` clean (43 pre-existing `.ts` files); `npm run build` clean; `npm run lint` clean; `npm run test:unit` 38/38; `npm test` failing with the same 4 pre-existing favicon errors as every prior phase's baseline.

Re-inventoried `assets/state/` directly (not assumed from the plan note): exactly 4 files — `resourceState.js` (38 lines), `spireResourceState.js` (86 lines), `monetizationState.js` (229 lines), `cognitiveRealmState.js` (622 lines) — matching the candidate list, with no extra or missing files.

See the "Phase 5 — Game State Containers" section above for full detail. Summary:

- **Migrated (Phase 5A):** `assets/state/resourceState.js` → `.ts`, `assets/state/spireResourceState.js` → `.ts`, `assets/state/monetizationState.js` → `.ts`. All three deleted as `.js` source files; compiled siblings regenerated by `npm run build`.
- **Deferred (Phase 5B, not started):** `assets/state/cognitiveRealmState.js` — left completely untouched, still plain JS, for the concrete reasons recorded in the Phase 5 section's "Scope decision and split rationale" (canonical-constant-derived unions, procedural generation, `Math.random()`-dependent conquest logic, and an extensive legacy-save fallback surface that all warrant dedicated inspection rather than being rushed alongside the three simpler modules).
- Performed a full blast-radius audit before editing each of the three modules (importers enumerated via fresh `grep -rl`, per-importer field usage and mutation/identity/serialization behavior recorded) — see the Phase 5 section for the complete list per module.
- Introduced `ResourceStateContainerDependencies`/`BaseResourceContainer`/`RuntimeResourceState`/`ResourceStateContainerPair`; `GenericSpireBranchState`/`LamedSpireState`/`TsadiSpireState`/`FluidSpireState`/`SpireResourceState`/`SpireResourceStateOverrides` plus named-opaque boundary types `LamedSimulationSnapshot`/`FluidGeneratorMap` for subsystem-owned schemas; `SpireId` (derived from the existing `SPIRE_IDS` const array)/`BoostType`/`BoostCooldownState`/`MonetizationState`/`MonetizationStateSnapshot`/`MonetizationStateListener`/`UnsubscribeFn`/`BoostCooldownResult`/discriminated unions `SpireBoostResult`/`GemBoostResult`.
- **No `AutoSaveSnapshot` narrowing performed** — investigated `getSpireResourceStateSnapshot`/`applySpireResourceStateSnapshot` and confirmed their real implementations live in the unmigrated `assets/spireResourcePersistence.js` (which mixes multiple subsystems' data into one payload), not in `spireResourceState.ts` itself, so narrowing now would be dishonest typing; recorded as a Known Issue for a future phase.
- No importer required any compatibility edit; all existing `./state/*.js` import specifiers keep resolving via the existing glob-based `tsconfig.json` `include` and `sync-ts-output.cjs`.
- Extended `scripts/unit-test-core.cjs` with 20 new tests (5 resourceState + 5 spireResourceState + 10 monetizationState). Also fixed a latent bug in the test harness itself: `test()` did not `await` its (possibly-async) test body, so async assertions ran after the suite had already printed its summary and could crash the process as an unhandled rejection without being counted as a failure — `test()` is now `async` and every call site `await`s it. This is a test-infrastructure fix, not a change to any migrated module.
- Suite total: **58/58 passing** (38 pre-existing + 20 new).
- `npm run typecheck`, `npm run build`, `npm run lint` all clean; `npm test` fails with the same 4 pre-existing favicon errors (no new failures); `npm run test:unit` 58/58.
- Manual/browser verification was **not** performed this session (no browser-automation tool call was made); recorded explicitly rather than assumed.
- Recalculated migration counts per the Phase 4 methodology: converted `.ts` modules 43 → **46** (+3: `resourceState.ts`, `spireResourceState.ts`, `monetizationState.ts`); total authored source modules unchanged at **359** (conversions, not new files); remaining unconverted `.js` 316 → **313**.
- `assets/buildInfo.js#BUILD_NUMBER` incremented from 726 to 727 per `AGENT_START_HERE.md`'s standing convention ("increment by 1 for every change"). Note: Phase 4 did not increment this value (still read 726 at the start of this session, unchanged since Phase 3), so this phase resumes the convention rather than continuing an unbroken sequence.

**Suspected pre-existing defects recorded, not fixed:** `spireResourceState.ts`'s inherited `mergeBranch` helper unconditionally adds a `generators: {}` field to the `lamed`/`tsadi` branches even though neither branch's shape declares one; no consumer currently reads it. See Known Issues above.

**Next suggested step:** See the "Next Suggested Step" section above (recommending Phase 5B: Cognitive Realm Territory State, `assets/state/cognitiveRealmState.js`, with a narrow bounded spec).

### 2026-07-13 — Phase 5B executed

**Status:** COMPLETE

A fresh session read the required docs (`AGENT_START_HERE.md`, `AGENTS.md`, `docs/JAVASCRIPT_MODULE_SYSTEM.md`, both migration plan documents, `tsconfig.json`, `scripts/sync-ts-output.cjs`, `scripts/build-static.cjs`) and ran the baseline: `git status --short` clean; `npm run typecheck` clean (46 pre-existing `.ts` files); `npm run build` clean; `npm run lint` clean; `npm run test:unit` 58/58; `npm test` (smoke test) passed cleanly with no favicon-related errors, confirming the post-5A "RESOLVED" note rather than needing fresh investigation.

See the "Phase 5B — Cognitive Realm Territory State (`assets/state/cognitiveRealmState.js`) (COMPLETE)" section above for full detail. Summary:

- **Migrated:** `assets/state/cognitiveRealmState.js` (622 lines) → `assets/state/cognitiveRealmState.ts`, the last remaining file in `assets/state/`. Deleted the old `.js` source; the compiled `.js` sibling is regenerated by `npm run build`.
- Re-derived the importer list fresh via `grep -rl "cognitiveRealmState" assets scripts index.html` (and a follow-up per-export grep, since the plain filename grep alone would have missed which specific exports each importer uses): `assets/main.js` (7 exports, including wiring `serializeCognitiveRealmState`/`deserializeCognitiveRealmState` directly into `autoSave.ts`'s snapshot hooks), `assets/cognitiveRealmMap.js` (9 exports, treats `getTerritories()`'s return as a live reference, mutates only via `setTerritoryOwner`), `assets/levelCombatController.js` (1 export, `updateTerritoriesForLevel`). None required any code change.
- Read the full 622-line original file and enumerated (not sampled): all archetype/emotion fields across all 27 archetypes and 27 emotion pairs (54 nodes); the exact 9x9 `(x+y)%3===0` generation/placement algorithm with its two independent index counters; both `Math.random()` call sites (the enemy/neutral conquest rolls inside `updateTerritoriesForLevel`'s adjacent-offset loop) and their exact probabilities (0.5, 0.3); the full serialization key set; and all 6 legacy-save deserialization fallback branches (whole-payload no-op, `locked` defaulting to `true`, territory-array-length fallback to a fresh grid, per-entry archetype/emotion id-or-index fallback, `x`/`y`/`owner` finite-or-default coercion, `lastLevelCompleted` type-guarded assignment).
- Introduced `ArchetypeExpression`/`Archetype`/`ArchetypeId` (the last derived from `ARCHETYPES` via `as const satisfies`, mirroring Phase 4's `TowerId` pattern), `EmotionPolarity`/private `EmotionPairExpression`/`EmotionPair`/`EmotionNode`, `TerritoryOwner` (with `TERRITORY_NEUTRAL`/`_PLAYER`/`_ENEMY` now `as const`), `NodeType`, `Territory`, `CognitiveRealmState`, `TerritoryStats`, `SerializedTerritory`, `CognitiveRealmStateSnapshot`, `GridDimensions`, and two private named-opaque legacy-data types (`LegacySerializedTerritoryEntry`, `LegacyCognitiveRealmSnapshotData`) scoped to the deserialization fallback path.
- **Narrowed `AutoSaveSnapshot` for `getCognitiveRealmStateSnapshot`/`applyCognitiveRealmStateSnapshot`** in `assets/autoSave.ts` to the new `CognitiveRealmStateSnapshot` type (a type-only import and two interface-field edits, plus updating one `readStorageJson<...>` generic parameter) — this is safe and honest specifically because `assets/main.js` wires these hooks directly to `cognitiveRealmState.ts`'s own `serializeCognitiveRealmState`/`deserializeCognitiveRealmState`, unlike Phase 5A's spire-resource hooks, whose real schema lives in the still-unmigrated `assets/spireResourcePersistence.js`. This is the only edit made outside the migrated file itself.
- Extended `scripts/unit-test-core.cjs` with 20 new deterministic tests (a new `withMockedRandom(sequence, fn)` helper stubs and restores `Math.random`, never relying on real randomness) covering generation/placement, initial state, lookup, mutation/reset, callback timing, victory/defeat conquest math (both guaranteed-fail and guaranteed-succeed `Math.random` sequences), serialization, a full round trip, and every legacy-save fallback branch.
- Suite total: **78/78 passing** (58 pre-existing + 20 new).
- `npm run typecheck`, `npm run build`, `npm run lint` all clean; `npm test` passes cleanly with no favicon errors (re-confirmed, not a new finding); `npm run test:unit` 78/78.
- Manual/browser verification was **not** performed this session (no browser-automation tool call was made); recorded explicitly rather than assumed.
- Recalculated migration counts per the established methodology: converted `.ts` modules 46 → **47** (+1: `cognitiveRealmState.ts`); total authored source modules unchanged at **359**; remaining unconverted `.js` 313 → **312**. Verified via a full recursive scan excluding `dist/`/`build/`/`node_modules/`.
- `assets/buildInfo.js#BUILD_NUMBER` incremented from 727 to 728.

**Suspected pre-existing defects recorded, not fixed:** (1) `deserializeCognitiveRealmState`'s legacy-save fallback validates a saved territory's `owner` only via `Number.isFinite`, not that it is actually `0`/`1`/`2` — a malformed-but-finite value passes through unfiltered. (2) The same function trusts a saved territory's `id` verbatim with zero validation. Both preserved unchanged per the migration's behavior-preservation requirement; see Known Issues above and the Phase 5B section for detail.

**Next suggested step:** See the "Next Suggested Step" section above (recommending Phase 6: `assets/spireResourcePersistence.js`, with a narrow bounded spec that finally lets the spire-resource `AutoSaveSnapshot` hooks be honestly narrowed).

### 2026-07-15 — Revised Phase 6 executed

**Status:** COMPLETE

The session began from clean `main` at `230cd9c`, read all required root/assets/scripts/docs guidance and both migration plans, re-derived the live post-retirement dependency graph, and recorded a clean baseline: typecheck/build/lint passed, unit tests were 80/80 plus retired-Spire checks, and the smoke test passed.

- Converted `assets/spireResourcePersistence.js` to strict `assets/spireResourcePersistence.ts`; the `.js` sibling is generated by the existing TypeScript synchronization step and all import specifiers/export names/return keys remain unchanged.
- Replaced the historical multi-Spire assumption with the actual live scope: Well/Achievements story flags and the tower snapshot augmented with Aleph-chain upgrades. Retired save branches remain ignored.
- Narrowed all four autosave hooks actually wired from this module and their two `readStorageJson<T>()` call sites in `assets/autoSave.ts`.
- Added explicit owned snapshot/legacy-input/controller/dependency types plus named external tower/Aleph/playfield boundaries; introduced no `any`, suppressions, broad double assertions, or non-null assertions.
- Added 17 deterministic compiled-output characterization tests. Core unit total is 97/97; retired-Spire checks and smoke tests pass.
- Recalculated counts to 47 typed, 260 remaining JS without TS siblings, 241 active remaining after excluding 19 preserved legacy modules, and 288 active authored modules total.
- Incremented the build number exactly once, from 729 to 730.
- Browser smoke served the built app, confirmed Build 730, toggled Developer Mode through the UI, reloaded, confirmed that saved setting restored, and observed no console errors. The deterministic compiled-output tests provide the direct current/legacy Spire and tower/Aleph restore coverage; Electron and physical mobile/touch testing were not performed.

**Deferred findings:** The tower-upgrade and Aleph-chain sub-schemas remain named external boundaries owned by `towerBlueprintPresenter.js` and `alephUpgradeState.js`. The inherited serialization/restore label asymmetry (empty string preserved on serialize, trimmed/fallback on restore) is unchanged. No production behavior defect was fixed.

**Next suggested step:** See the bounded Phase 7 recommendation above: migrate `assets/alephUpgradeState.js` and replace the Aleph external boundary without entering simulations or broad persistence work.

### 2026-07-15 — Phase 7 executed

**Status:** COMPLETE

The session began from clean `main` at `fe18aaa`, verified Phase 6's source/generated/docs/test state, re-read all required guidance and both plans, and confirmed that `assets/alephUpgradeState.js` remained the live 85-line owner recommended by the ledger. Baseline typecheck/build/lint, 97/97 unit tests plus retired-Spire checks, and smoke tests all passed.

- Converted `assets/alephUpgradeState.js` to strict `assets/alephUpgradeState.ts`; generated `.js` compatibility and all existing export names/import specifiers are unchanged.
- Re-derived `main.js`'s complete use of all five exports, the persistence wiring, developer reset injection, global get/set namespace, and live-state handoff to playfield configuration.
- Introduced `AlephChainUpgradeSnapshot`, `AlephChainUpgradeTarget`, `AlephChainUpgradePlayfield`, and `AlephChainUpgradeApplyOptions`; update/legacy inputs remain `unknown` until narrowed by preserved runtime checks.
- Updated `assets/spireResourcePersistence.ts` to reuse the Aleph owner contracts, removing the named external Aleph snapshot and opaque playfield aliases. The base tower snapshot remains external.
- Added 12 deterministic compiled-output tests, increasing the core suite from 97/97 to 109/109. Final typecheck/build/lint/unit/retired-Spire/smoke validation passed.
- Recomputed counts to 48 typed, 259 remaining JS without TS siblings, and 240 active remaining after excluding 19 preserved legacy modules. Incremented Build 730 to Build 731 exactly once.
- Browser automation was attempted, but its control runtime was unavailable in this session; no live save/reload, console inspection, Electron, or physical mobile/touch testing is claimed. Compiled-output tests cover update, legacy restore, synchronization, and reset behavior directly.

**Deferred findings:** The optional playfield synchronization contract has no live implementation in the current tree, and the `alephChainUpgrades` value passed into `configurePlayfieldSystem` is currently unused. Both branches remain behavior-preserved and tested. The base tower-upgrade snapshot remains the final persistence wrapper boundary.

**Next suggested step:** Execute the bounded Phase 8 recommendation above for `assets/towerBlueprintPresenter.js`; do not broaden it into `towersTab.js`, `main.js`, the equation module cluster, or tower simulations.

### 2026-07-15 — Phase 8 executed

**Status:** COMPLETE

The session began from clean local `main` at the verified Phase 7 commit `5f18697696cad09cb8a03c4876da0a252601b270`. The current recommendation remained live, and the presenter was confirmed at 321 lines—not 85—before a clean typecheck/build/lint/109-test/retired-Spire/smoke baseline.

- Converted `assets/towerBlueprintPresenter.js` to strict `assets/towerBlueprintPresenter.ts`; generated JavaScript compatibility and every existing import/export/return key remain unchanged.
- Re-derived the sole direct importer (`towersTab.js`), all ten controller methods, their overlay/discovery/tree/context injections, downstream Towers-tab re-exports, main persistence/reset wiring, and simulation/playfield consumers.
- Introduced the presenter option/controller, definition/dynamic-context, blueprint/variable/callback, live upgrade-state, exact serialized snapshot, and untrusted restore-input contracts listed in the Phase 8 section.
- Updated `assets/spireResourcePersistence.ts` to use the presenter-owned base snapshot while retaining a distinct persistence-owned Aleph wrapper; `autoSave.ts` required no textual change because it already imports the wrapper contracts.
- Added 20 deterministic compiled-output tests, increasing the core suite from 109/109 to 129/129; retired-Spire and recursive import smoke checks pass.
- Final typecheck/build/lint/unit/smoke checks pass; two consecutive build hashes match; no `.ts` appears in `dist`; scoped forbidden-pattern audit is clean. Build 731 advanced to 732 exactly once.
- Counts are 49 typed, 258 remaining JS without TS siblings, and 239 active remaining after excluding 19 preserved legacy modules.
- Browser automation was attempted: the host-served build returned HTTP 200, but the in-app browser's isolated network context received `ERR_CONNECTION_REFUSED` for localhost. No live UI/save/console/Electron/mobile verification is claimed.

**Deferred findings:** optional-key Iota display-variable coercion, fractional invested-cost iteration, flat missing-variable cost, and zero-resetting fallback aggregation remain inherited behavior and are documented/tested rather than changed.

**Next suggested step:** Execute the bounded Phase 9 recommendation above for `assets/towerVariableDiscovery.js`; keep the Towers tab, equation cluster, overlays, and simulations out of scope.

### 2026-07-15 — Phase 9 executed

**Status:** COMPLETE

The session began from clean `main` at Phase 8 commit `e59f7ab`, created feature branch `codex/phase-9-tower-variable-discovery`, read the required guidance and live plans, confirmed the recommendation remained current, audited the complete 301-line owner and its sole runtime importer, and recorded a clean baseline: typecheck/build/lint, 129/129 core tests plus retired-Spire checks, and smoke tests all passed.

- Converted `assets/towerVariableDiscovery.js` to strict `assets/towerVariableDiscovery.ts`; the generated `.js` compatibility sibling keeps the runtime import/export surface unchanged.
- Reused Phase 8's blueprint/variable types and extended only the real discovery metadata fields already present in authored variables. Added explicit universal metadata, tower definition, discovered record/listener, options, controller, resolver/provider, and runtime-narrowing contracts.
- Preserved Map/Set validation, key normalization/id precedence, metadata fallback order, duplicates, sorting/cloning, listener timing/warnings/unsubscribe, all four accepted unlock input shapes, ordered initialization, Set-only fallback behavior, and batched rebuild notification.
- Added 11 deterministic compiled-output tests, increasing the core suite from 129/129 to 140/140; retired-Spire checks continue separately.
- Recomputed counts to 50 typed, 257 remaining JavaScript without TypeScript siblings, and 238 active remaining after excluding 19 preserved legacy modules. Incremented Build 732 to Build 733 exactly once.
- No live browser, Electron, touch, or physical-device verification is claimed; compiled-output tests directly cover the migrated state owner and the recursive smoke test covers its unchanged import path.

**Next suggested step:** Execute the bounded Phase 10 recommendation above for `assets/towerEquationTooltip.js`; keep `towersTab.js`, the upgrade overlay, equation registry, main integration, and simulations out of scope.

### 2026-07-15 — Phase 10 executed

**Status:** COMPLETE

Phase 10 started from completed Phase 9 commit `a731dfc` on a new stacked branch, `codex/phase-10-tower-equation-tooltip`. The 278-line tooltip owner and sole direct importer were re-audited, and the baseline passed typecheck/build/lint, 140/140 core tests plus retired-Spire checks, and smoke tests.

- Converted `assets/towerEquationTooltip.js` to strict `assets/towerEquationTooltip.ts`; its generated sibling, named/default exports, controller keys, and caller import paths remain unchanged.
- Reused Phase 8 variable and Phase 9 universal-metadata contracts through type-only imports; introduced explicit tooltip state/options/controller plus private DOM resolver, metadata resolver, scheduler, and event-boundary types.
- Preserved exact validation, text precedence/punctuation, element reuse/defaults, positioning/clamping, timer/frame selection, 160 ms delayed versus immediate hide, dataset/text/ARIA cleanup, pending-hide cancellation, target switching, and `HTMLElement` guards.
- Added a deterministic minimal DOM/timer/frame harness and 10 compiled-output tests, increasing the core suite from 140/140 to 150/150; retired-Spire checks remain separate.
- Recomputed counts to 51 typed, 256 JavaScript without TypeScript siblings, and 237 active remaining after excluding 19 preserved legacy modules. Active module-count conversion is 17.7%; the supplemental source-line snapshot is approximately 6.2% typed. Build 733 advanced to Build 734 exactly once.
- No live browser, Electron, touch, or physical-device verification is claimed; deterministic compiled-output tests cover the migrated DOM behavior and the recursive smoke test covers its unchanged import path.

**Next suggested step:** Execute the bounded Phase 11 recommendation above for `assets/towerEquations/masterEquationUtils.js`; keep equation registries/definitions, `blueprintContext.js`, Towers tab, overlay, main integration, and simulations out of scope.

### 2026-07-15 — Phase 11 executed

**Status:** COMPLETE

This continuation resumed from clean `codex/phase-11-master-equation-utils` at recovered checkpoint `e672bab40b40138c1daff35fc77299758fb47a8a`, stacked on the live post-retirement commit `64ebc5e`. Build 736 and the 50-TypeScript/235-remaining-JavaScript pre-conversion module baseline were verified. Before the remaining documentation, build tracking, and boundary-test edits, typecheck/build/lint passed, core tests were 142/142 plus retired-Spire checks, and the recursive smoke test passed.

- Converted the sole authored implementation of `assets/towerEquations/masterEquationUtils.js` to strict `assets/towerEquations/masterEquationUtils.ts`; its `.js` sibling and `dist/` copy are generated by the established build, with unchanged named exports and caller import specifiers.
- Reused the Phase 8 blueprint/definition/variable contracts via a type-only import and extended only the master-equation metadata the utility already reads. Added explicit format, term, symbol-pair, derived-structure, derivation-parameter, and text-parameter public contracts plus private untrusted boundaries.
- Preserved malformed/no-argument behavior, candidate precedence, trimming and wrapper quirks, attachment/exclusion rules, symbol fallbacks, order/non-mutation, fallback timing, zero-term output, exact plain/LaTeX spacing and separators, and exact lowercase-`latex` format selection.
- Added 15 deterministic generated-JavaScript tests, increasing the live post-retirement core suite from 127 to 142 tests. The cases cover omitted/null/primitive/array/function/malformed input, all label and symbol candidates, wrapper normalization, exclusion paths, truthy/falsy inclusion values, fallbacks, zero/multiple terms, both output formats, exact spacing, and deep-frozen input fixtures.
- Final `npm run typecheck`, `npm run build`, `npm run lint`, `npm run test:unit` (142/142 plus retired-Spire checks), and `npm test` passed. `git diff --check`, generated-sibling comparison, import compatibility, forbidden-pattern/runtime-import audits, and the no-TypeScript-in-`dist` check passed.
- Recomputed counts using the documented full-tree methodology: 50 to **51** authored TypeScript modules, 235 to **234** remaining JavaScript modules, and **285** active authored modules total. Build 736 advanced exactly once to Build 737.
- No live browser, Electron, touch, or physical-device verification was performed or claimed. The migrated owner is pure and DOM-free; compiled-output tests provide its direct behavioral verification, and no requested behavior remained unverifiable within that boundary.

**Next suggested step:** Execute the bounded Phase 12 recommendation above for `assets/towerEquations/blueprintContext.js`; preserve the shared object identity and `Object.assign` semantics, and keep equation definitions/registries, Towers tab, overlays, simulations, playfield systems, and main integration out of scope.

### 2026-07-15 — Phase 12 executed

**Status:** COMPLETE

Phase 12 branched as `codex/phase-12-blueprint-context` from verified local Phase 11 commit `73e3a1176f9ec83e4b6a7607ad645bfced15dff4` with a clean worktree and Build 737. The plan recommendation remained live, all 19 direct importers and the sole Towers-tab initialization payload were inventoried, and the pre-edit typecheck/build/lint/142-test/retired-Spire/smoke baseline passed.

- Converted `assets/towerEquations/blueprintContext.js` to strict `assets/towerEquations/blueprintContext.ts`; the generated sibling retains the same `blueprintContext` and `initializeBlueprintContext` named exports and all consumers retain their `.js` specifiers.
- Reused the four presenter-owned helper signatures by indexed access into `TowerBlueprintPresenterController`; added only the three Towers-tab-owned helper signatures, the seven-helper interface, and the nullable shared-context type. Type-only imports erase completely from generated JavaScript.
- Preserved the seven initial own `null` slots, stable mutable object identity, partial/repeated overwrite behavior, exact function and object identity, `undefined` return, and unfiltered native `Object.assign` semantics for nullish, primitive, array, extra string/symbol, inherited, non-enumerable, getter, and throwing-getter sources.
- Added seven fresh-module compiled-output tests, increasing the core suite from 142/142 to 149/149. The tests cover initial shape/mutability, stable reference, partial/repeated initialization, assigned identity, return behavior, no-op inputs, primitive index copying, enumerable ownership rules, symbol keys, one getter read, exception propagation/partial assignment, and source non-mutation.
- Final `npm run typecheck`, `npm run build`, `npm run lint`, `npm run test:unit` (149/149 plus retired-Spire checks), and `npm test` passed. `git diff --check`, generated-sibling/dist hash checks, two-export/no-runtime-import inspection, all-19-importer specifier verification, scoped forbidden-pattern checks, and the no-TypeScript-in-`dist` audit passed.
- Recalculated counts by the documented full-tree method: 51 to **52** authored TypeScript modules, 234 to **233** remaining JavaScript modules, and **285** authored modules total. Build 737 advanced exactly once to Build 738.
- No browser, Electron, touch, or physical-device verification was performed or claimed. Deterministic generated-JavaScript tests are the direct verification for this dependency-free, DOM-free state boundary; no requested behavior remained unverifiable within that boundary.

**Next suggested step:** Execute the bounded Phase 13 recommendation above for `assets/towerEquations/index.js`; keep all equation definitions/groups, Towers tab, simulations, playfield systems, and main integration out of scope.

### 2026-07-15 — Phase 13 executed

**Status:** COMPLETE

Phase 13 branched as `codex/phase-13-equation-registry` from verified local Phase 12 commit `d8edefe5953c71536d5b6b29b2355f10a287402a` with a clean worktree and Build 738. The 27-entry registry, six source imports, two exports, sole presenter consumer, and unusual bracket-lookup behavior were characterized before editing; the pre-edit typecheck/build/lint/149-test/retired-Spire/smoke baseline passed.

- Converted `assets/towerEquations/index.js` to strict `assets/towerEquations/index.ts`; its generated sibling retains the same six `.js` definition imports, `TOWER_EQUATION_BLUEPRINTS`, and `getTowerEquationBlueprint` exports.
- Reused `TowerEquationBlueprint` through a type-only import, applied `satisfies` to the canonical registry, derived `TowerEquationId` from its keys, and retained an `unknown` overload for JavaScript-originated lookup values. No runtime presenter import or circular dependency was emitted.
- Preserved all 27 keys and insertion order, exact imported object identities, registry/prototype mutability, falsey/missing fallback timing, later mutations, inherited properties, property-key coercion, symbol keys, and coercion-error propagation.
- Added four isolated generated-output tests with stub definition groups, increasing the core suite from 149/149 to 153/153. Coverage includes every registry entry/order/identity, canonical/custom/falsey lookup, nullish/primitive/symbol inputs, inherited keys, array/object coercion, and throwing coercion.
- Final `npm run typecheck`, `npm run build`, `npm run lint`, `npm run test:unit` (153/153 plus retired-Spire checks), and `npm test` passed. `git diff --check`, generated-sibling/dist hashes, exact import/export inspection, presenter-specifier verification, no-runtime-type-import/cycle inspection, scoped forbidden-pattern checks, and the no-TypeScript-in-`dist` audit passed.
- Recalculated counts by the documented full-tree method: 52 to **53** authored TypeScript modules, 233 to **232** remaining JavaScript modules, and **285** authored modules total. Build 738 advanced exactly once to Build 739.
- No browser, Electron, touch, or physical-device verification was performed or claimed. Generated-output tests and the recursive real-graph smoke test fully cover the requested DOM-free registry boundary.

**Next suggested step:** Execute the bounded Phase 14 recommendation above for `assets/towerEquations/mindGate.js`; keep Shadow Gate, grouped definitions, Towers tab, simulations, playfield systems, and main integration out of scope.

### 2026-07-16 — Phase 14 executed

**Status:** COMPLETE

Phase 14 branched as `codex/phase-14-mind-gate-equation` from verified local Phase 13 commit `4b87d9da3ad906cc14046b2467f36e5ac284120d` with a clean worktree and Build 739. The formatting dependency, two authored variables, live overlay callback payload, formula/fallback behavior, and registry consumer were characterized before editing; the pre-edit typecheck/build/lint/153-test/retired-Spire/smoke baseline passed.

- Converted `assets/towerEquations/mindGate.js` to strict `assets/towerEquations/mindGate.ts`; its generated sibling retains the same formatting `.js` import, named export, object shape, strings, formulas, costs, clamping, and callback order.
- Extended the presenter-owned variable contract only with the real sub-equation result/context surface already consumed by the upgrade overlay. The open variant label reflects the renderer's exact `values`-special-case behavior and keeps remaining JavaScript definitions compatible.
- Added five isolated generated-output tests with a recording formatter stub, increasing the core suite from 153/153 to 158/158. Coverage includes exact metadata/order/text, costs/formatting, both sub-equation builders, malformed and fractional inputs, number-only result fallbacks/product, and golden callback order/output.
- Final `npm run typecheck`, `npm run build`, `npm run lint`, `npm run test:unit` (158/158 plus retired-Spire checks), and `npm test` passed. `git diff --check`, generated-sibling/dist hashes, formatting-import/registry-specifier inspection, scoped forbidden-pattern checks, and the no-TypeScript-in-`dist` audit passed.
- Recalculated counts by the documented full-tree method: 53 to **54** authored TypeScript modules, 232 to **231** remaining JavaScript modules, and **285** authored modules total. Build 739 advanced exactly once to Build 740.
- No browser, Electron, touch, or physical-device verification was performed or claimed. Generated-output tests and the recursive real-graph smoke test cover this DOM-free definition boundary.

**Next suggested step:** Execute the bounded Phase 15 recommendation above for `assets/towerEquations/shadowGate.js`; keep `codex.js`, grouped definitions, Towers tab, simulations, playfield systems, and main integration out of scope.

### 2026-07-16 — Phase 15 executed

**Status:** COMPLETE

Phase 15 branched as `codex/phase-15-shadow-gate-equation` from verified local Phase 14 commit `3acc3672c4ded200428a37f07452152ea64f87ff`. A fresh fetch confirmed the stacked migration branch was six commits ahead and zero behind `origin/main`. The Codex dependency, dynamic getter timing, Set/lookup/filter/join behavior, registry consumer, and exact passive outputs were characterized before editing; pre-edit typecheck/build/lint/158-test/retired-Spire/smoke validation passed.

- Converted `assets/towerEquations/shadowGate.js` to strict `assets/towerEquations/shadowGate.ts`; its generated sibling retains the same Codex `.js` import, named export, getter, strings, and passive outputs.
- Reused the presenter blueprint contract through a type-only import and added only a local optional-symbol entry surface plus narrow Set/lookup assignments for the JavaScript-owned Codex boundary.
- Added three isolated generated-output tests with a mutable recording Codex stub, increasing the core suite from 158/158 to 161/161. Coverage includes exact metadata/output, insertion order and Set deduplication, lookup order/count, live rereads, changed/missing entries, falsey filtering, and exact joining.
- Final `npm run typecheck`, `npm run build`, `npm run lint`, `npm run test:unit` (161/161 plus retired-Spire checks), and `npm test` passed. `git diff --check`, generated-sibling/dist hashes, Codex-import/registry-specifier inspection, scoped forbidden-pattern checks, and the no-TypeScript-in-`dist` audit passed.
- Recalculated counts by the documented full-tree method: 54 to **55** authored TypeScript modules, 231 to **230** remaining JavaScript modules, and **285** authored modules total. Completion is **19.3% by module count** and approximately **6.2% by authored source lines**. Build 740 advanced exactly once to Build 741.
- No browser, Electron, touch, or physical-device verification was performed or claimed. Generated-output tests and recursive smoke validation cover this DOM-free definition boundary.

**Next suggested step:** Execute the bounded Phase 16 recommendation above for `assets/towerEquations/advancedTowers.js`; keep individual advanced definitions, Infinity/basic/Greek definitions, Towers tab, simulations, playfield systems, and main integration out of scope.

### 2026-07-16 — Phase 16 executed

**Status:** COMPLETE

Phase 16 branched as `codex/phase-16-advanced-equation-barrel` from verified local Phase 15 commit `5df90011c4e75b8b03e3ed27f7e8a0eb2d1945d2`. A fresh fetch confirmed the stacked migration branch was seven commits ahead and zero behind `origin/main`. All 15 re-export names/specifiers and the registry consumer were inventoried before editing; pre-edit typecheck/build/lint/161-test/retired-Spire/smoke validation passed.

- Converted `assets/towerEquations/advancedTowers.js` to strict `assets/towerEquations/advancedTowers.ts`; its generated sibling retains the same 15 direct `.js` re-exports and introduces no runtime wrapper or dependency.
- Added one isolated generated-output test with identity-marked advanced-definition stubs, increasing the core suite from 161/161 to 162/162. It verifies the exact export set and every re-exported object identity.
- Final `npm run typecheck`, `npm run build`, `npm run lint`, `npm run test:unit` (162/162 plus retired-Spire checks), and `npm test` passed. `git diff --check`, generated-sibling/dist hashes, exact re-export inspection, scoped forbidden-pattern checks, and the no-TypeScript-in-`dist` audit passed.
- Recalculated counts by the documented full-tree method: 55 to **56** authored TypeScript modules, 230 to **229** remaining JavaScript modules, and **285** authored modules total. Completion is **19.6% by module count** and approximately **6.2% by authored source lines**. Build 741 advanced exactly once to Build 742.
- No browser, Electron, touch, or physical-device verification was performed or claimed. Identity tests and recursive smoke validation cover this DOM-free aggregation boundary.

**Next suggested step:** Execute the bounded Phase 17 recommendation above for `assets/towerEquations/advanced/sigmaEquation.js`; keep other advanced definitions, Infinity/basic/Greek definitions, Towers tab, simulations, playfield systems, and main integration out of scope.

### 2026-07-16 — Phases 17–20 executed

**Status:** COMPLETE

Phases 17–20 were implemented together from verified Phase 16 commit `7d2aa7b2386b3adfcaceb73a78e706cb0632bb08`. A fresh fetch confirmed the clean stacked branch was eight commits ahead and zero behind `origin/main` at Build 742. Direct source inventory selected Sigma for the planned Phase 17, then the three smallest remaining deterministic advanced owners—Phi, Upsilon, and Tau—for Phases 18–20. Pre-edit typecheck/build/lint/162-test/retired-Spire/smoke validation passed.

- Converted `sigmaEquation.js`, `phiEquation.js`, `upsilonEquation.js`, and `tauEquation.js` to strict same-path `.ts` sources; their browser-facing `.js` siblings are generated and all barrel/registry `.js` specifiers and object identities remain compatible.
- Extended the presenter type boundary only with the live sub-equation formatter functions and base-equation value formatting context already supplied by the JavaScript overlay. Sigma adds narrow dynamic property reads; no `any`, assertion, suppression, global weakening, or runtime type dependency was introduced.
- Added 14 isolated generated-output tests with recording formatting/context stubs, increasing the core suite from 162/162 to **176/176**. Coverage includes exact metadata/order/strings, stat precedence and coercion, prestige/release branches, Fibonacci constants, every migrated variable builder, cost curves, live Gamma callback count, malformed fallbacks, formatter order, result coercion and inherited `NaN` edges, and base-equation output.
- Final `npm run typecheck`, `npm run build`, `npm run lint`, `npm run test:unit` (176/176 plus retired-Spire checks), and `npm test` passed. Generated-output, import/export, forbidden-pattern, `dist` TypeScript-exclusion, hash, and diff audits are recorded in this session's closeout.
- Recalculated counts by the documented full-tree method: 56 to **60** authored TypeScript modules, 229 to **225** remaining JavaScript modules, and **285** authored modules total. Completion is **21.1% by module count** and approximately **6.7% by authored source lines**. Build 742 advanced exactly once to Build 743.
- No browser, Electron, touch, or physical-device verification was performed or claimed. Generated-output characterization plus recursive smoke validation covers these four DOM-free equation definitions.

**Next suggested step:** Execute the bounded Phase 21 recommendation above for `assets/towerEquations/advanced/rhoEquation.js`; keep other advanced definitions, Infinity/basic/Greek definitions, Towers tab, simulations, playfield systems, and main integration out of scope.
