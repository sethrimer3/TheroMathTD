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
| 1 | Add incremental TypeScript infrastructure and migrate shared menu/tab navigation | NOT STARTED | See **Next Suggested Step** |
| 2 | To be selected after Phase 1 based on dependency and risk findings | NOT STARTED | Do not begin until Phase 1 updates this plan |

---

## Next Suggested Step

### Phase 1 — TypeScript Infrastructure and Shared Navigation Migration

**Status:** NOT STARTED  
**Migration type:** Behavior-preserving migration  
**Primary objective:** Introduce the minimum sustainable TypeScript build and validation infrastructure, then migrate the shared menu and tab-navigation ownership modules to strict TypeScript without changing the game’s appearance or behavior.

### Why this is the recommended first slice

Navigation is already partly modularized and has relatively clear DOM and callback boundaries. It exercises several important TypeScript concerns—DOM element typing, finite tab identifiers, callback contracts, accessibility state, storage restoration, and JavaScript-to-TypeScript interoperation—without requiring the first phase to modify combat, simulations, save schemas, or balance logic.

This phase should establish the migration pattern that later systems follow.

### Required investigation

Before changing extensions, trace the complete shared navigation boundary, including:

- `assets/uiTabManager.js`
- `assets/tabLockManager.js`
- `assets/spireTabVisibility.js`
- navigation responsibilities inside `assets/spireFloatingMenu.js`
- relevant imports and callback wiring in `assets/main.js`
- tab and panel markup in `index.html`
- active-tab persistence in the current save/storage utilities
- keyboard, pointer, touch, focus, ARIA, lock, and visibility behavior

Do not assume every file containing “tab” or “menu” belongs in scope. Individual tab content, gameplay menus, overlays, tower systems, simulations, Codex content, achievements content, and settings internals remain JavaScript unless a minimal compatibility edit is required.

### Infrastructure requirements

Add the minimum maintainable infrastructure needed for JavaScript and TypeScript to coexist:

- TypeScript development dependency
- strict `tsconfig.json`
- DOM library support
- modern ES-module output or bundling
- JavaScript coexistence during migration
- `npm run typecheck`
- a browser build that correctly compiles and loads `.ts` modules
- preserved Electron startup
- preserved static assets and `dist` behavior

A standard tool such as Vite is acceptable if repository inspection shows it is the smallest reliable solution. Do not redesign the entire build system beyond what incremental TypeScript support requires.

### Intended TypeScript scope

Convert the modules that directly own shared navigation behavior. The final exact list must be determined from dependency tracing rather than blindly following filenames.

Strong candidates are:

- `assets/uiTabManager.js` → `assets/uiTabManager.ts`
- `assets/tabLockManager.js` → `assets/tabLockManager.ts`
- `assets/spireTabVisibility.js` → `assets/spireTabVisibility.ts`

`assets/spireFloatingMenu.js` combines navigation with live resource-counter updates. The agent must inspect this coupling and choose the smallest safe option:

1. migrate the complete controller if its dependency types can remain narrow and stable; or
2. extract only shared navigation ownership into a typed module while retaining a small JavaScript resource-display adapter.

Do not migrate unrelated resource, progression, or simulation systems merely to type this controller.

`assets/main.js` must remain JavaScript in this phase. Minimal import and integration edits are permitted.

### Types likely needed

Use the identifiers and structures actually present in the codebase. Likely useful contracts include:

- `TabId`
- `SpireTabId`
- `TabButtonElement`
- `TabPanelElement`
- `TabManagerOptions`
- `TabManagerCallbacks`
- `TabLockOptions`
- `SpireTabVisibilityOptions`
- `SpireFloatingMenuOptions`
- controller return interfaces

Prefer literal unions for finite identifiers, for example the actual current set derived from markup and code rather than a general `string`.

### Behavior that must remain unchanged

- default and restored active tab
- active classes and panel visibility
- `aria-pressed`, `aria-selected`, `aria-hidden`, `aria-disabled`, and `aria-expanded`
- focus and `tabindex` behavior
- left/right arrow navigation
- numeric tab hotkeys
- Enter and Space activation
- overlay and text-input shortcut guards
- tab-selection sound callbacks
- stage-tab hover/focus animation
- tutorial-based tab locks
- Spire unlock visibility
- floating Spire menu open/close behavior
- resource-counter display behavior if `spireFloatingMenu` is touched
- mouse, touch, and mobile portrait behavior
- Electron behavior
- active-tab storage compatibility
- CSS selectors, classes, visual timing, and user-facing labels

### Prohibited scope

Do not:

- convert `assets/main.js`
- convert the entire `assets` directory
- convert tower, enemy, combat, level, save, audio, simulation, or progression systems
- redesign the menu or tab layout
- alter unlock rules
- alter save keys or formats
- introduce React, Vue, Svelte, or another UI framework
- mass-rename `.js` files
- silence errors with widespread `any` or TypeScript suppression comments

### Validation requirements

Record a baseline and final result for all available commands, including at minimum:

```bash
npm install
npm run lint
npm test
npm run build
npm run typecheck
```

Add focused automated tests where practical for:

1. default tab initialization;
2. restoration of the stored active tab;
3. selection of each accessible primary tab;
4. safe rejection of unavailable or invalid tabs;
5. active/inactive class and ARIA synchronization;
6. keyboard navigation and direct hotkeys;
7. text-input and overlay guards;
8. tab lock and unlock state;
9. Spire tab visibility;
10. floating Spire menu navigation if included in the typed scope.

Also verify manually or through browser automation:

- startup without console errors;
- all currently accessible tabs;
- locked-tab behavior;
- floating Spire navigation;
- desktop viewport;
- mobile portrait viewport;
- Electron startup when the environment supports it.

### Phase 1 completion criteria

Phase 1 is complete only when:

- TypeScript-aware build and type-check commands are operational;
- JavaScript and TypeScript coexist without checking generated output into source folders;
- the agreed shared navigation-owner modules are strict `.ts` source files;
- `assets/main.js` remains the integration layer;
- the game builds and launches;
- existing smoke tests pass or are correctly adapted to the new build pipeline;
- focused navigation tests pass;
- no new browser console errors are observed;
- navigation behavior is unchanged on desktop and mobile;
- Electron startup is verified or the inability to test it is explicitly documented;
- this plan is updated with the completed work and one newly recommended next phase.

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

---

## Known Issues / Deferred Findings

- Existing automated coverage is not sufficient to prove full navigation behavior. Phase 1 should improve this before relying on later large migrations.
- `assets/spireFloatingMenu.js` combines navigation concerns with resource-counter rendering and unlock display. Phase 1 must avoid allowing that coupling to expand its scope into unrelated game-state migration.
- `assets/main.js` remains a large integration file. This is acknowledged but intentionally deferred; broad conversion of that file would undermine the staged migration strategy.

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
