// Small, framework-free Node unit tests for the pure/dependency-light core
// utilities migrated to TypeScript in Phase 2 of JavaToTypeScriptConversionPlan.md:
// scripts/core/formatting.ts and the storage primitives in assets/autoSave.ts.
// Run against the *compiled* .js output (same files the browser loads), not the
// .ts sources, so this also acts as a lightweight regression check on the build.
//
// Usage: npm run test:unit  (requires `npm run build` to have produced the
// compiled .js siblings next to their .ts sources first).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const rootDir = path.resolve(__dirname, '..');

// The repo's package.json sets "type": "commonjs", so a plain dynamic
// import() of a compiled .js file (which uses `export`/`import` syntax) fails
// under Node's CJS-by-default resolution here, even though browsers load the
// same file fine via <script type="module">. Copying the compiled output to a
// scratch .mjs file sidesteps that without touching any tracked source file.
function importAsEsm(relativeJsPath) {
  const sourcePath = path.join(rootDir, relativeJsPath);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-unit-test-'));
  const tmpPath = path.join(tmpDir, path.basename(relativeJsPath).replace(/\.js$/, '.mjs'));
  fs.copyFileSync(sourcePath, tmpPath);
  return import(pathToFileURL(tmpPath).href);
}

// Like importAsEsm, but for a module (assets/preferences.js) whose relative
// './autoSave.js', './performanceMonitor.js', and '../scripts/core/formatting.js'
// imports must also resolve. Copies the whole small dependency tree into a
// scratch directory (preserving relative paths) with its own "type": "module"
// package.json, rather than the single-file .mjs-rename trick used above.
function importPreferencesModule() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-unit-test-preferences-'));
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
  const relativeFiles = [
    'assets/preferences.js',
    'assets/autoSave.js',
    'assets/performanceMonitor.js',
    'scripts/core/formatting.js',
  ];
  for (const relativeFile of relativeFiles) {
    const destPath = path.join(tmpDir, relativeFile);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(path.join(rootDir, relativeFile), destPath);
  }
  return import(pathToFileURL(path.join(tmpDir, 'assets/preferences.js')).href);
}

// Like importPreferencesModule, but for the tower-definition registry
// (assets/data/towers/index.js), which has ~33 sibling relative imports
// (./alpha.js, ./beta.js, ...). Copies the whole directory into a scratch
// ESM package rather than listing every file by hand.
function importTowerRegistry() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-unit-test-towers-'));
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
  const towersSourceDir = path.join(rootDir, 'assets', 'data', 'towers');
  const towersDestDir = path.join(tmpDir, 'assets', 'data', 'towers');
  fs.mkdirSync(towersDestDir, { recursive: true });
  for (const entry of fs.readdirSync(towersSourceDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.js')) {
      fs.copyFileSync(path.join(towersSourceDir, entry.name), path.join(towersDestDir, entry.name));
    }
  }
  return import(pathToFileURL(path.join(towersDestDir, 'index.js')).href);
}

// Minimal localStorage shim so assets/autoSave.js's readStorage/writeStorage
// helpers (which guard on `window?.localStorage`) can run outside a browser.
function createLocalStorageStub() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
}

async function run() {
  let passed = 0;
  const failures = [];

  function test(name, fn) {
    try {
      fn();
      passed += 1;
    } catch (error) {
      failures.push({ name, error });
    }
  }

  // --- scripts/core/formatting.js -----------------------------------------
  const formatting = await importAsEsm('scripts/core/formatting.js');

  test('formatGameNumber: default LETTERS notation formats thousands', () => {
    assert.equal(formatting.formatGameNumber(12500), '12.5 K');
  });

  test('formatGameNumber: values below 1 keep two decimal places', () => {
    assert.equal(formatting.formatGameNumber(0.5), '0.50');
  });

  test('formatGameNumber: non-finite values fall back to "0"', () => {
    assert.equal(formatting.formatGameNumber(NaN), '0');
    assert.equal(formatting.formatGameNumber(Infinity), '0');
  });

  test('setGameNumberNotation: switches to SCIENTIFIC and affects formatting', () => {
    const resolved = formatting.setGameNumberNotation('scientific');
    assert.equal(resolved, 'scientific');
    assert.equal(formatting.formatGameNumber(12500), '1.25e4');
    // Restore default so subsequent tests are unaffected by ordering.
    formatting.setGameNumberNotation('letters');
  });

  test('setGameNumberNotation: unknown notation falls back to LETTERS', () => {
    const resolved = formatting.setGameNumberNotation('not-a-real-notation');
    assert.equal(resolved, 'letters');
  });

  test('formatWholeNumber: rounds, clamps negatives to 0, adds separators', () => {
    assert.equal(formatting.formatWholeNumber(1234.6), '1,235');
    assert.equal(formatting.formatWholeNumber(-5), '0');
  });

  test('formatPercentage / formatSignedPercentage: precision and sign', () => {
    assert.equal(formatting.formatPercentage(0.75), '75.0%');
    assert.equal(formatting.formatSignedPercentage(0.05), '+5.00%');
    assert.equal(formatting.formatSignedPercentage(-0.2), '-20.0%');
  });

  // --- assets/autoSave.js storage primitives ------------------------------
  global.window = { localStorage: createLocalStorageStub() };
  const autoSave = await importAsEsm('assets/autoSave.js');

  test('writeStorage/readStorage round-trip a primitive value', () => {
    autoSave.writeStorage(autoSave.ACTIVE_TAB_STORAGE_KEY, 'options');
    assert.equal(autoSave.readStorage(autoSave.ACTIVE_TAB_STORAGE_KEY), 'options');
  });

  test('readStorage returns null for a missing key', () => {
    assert.equal(autoSave.readStorage('glyph-defense-idle:does-not-exist'), null);
  });

  test('writeStorageJson/readStorageJson round-trip an object payload', () => {
    const payload = { alpha: 1, nested: { beta: 2 } };
    autoSave.writeStorageJson(autoSave.TOWER_UPGRADE_STORAGE_KEY, payload);
    assert.deepEqual(autoSave.readStorageJson(autoSave.TOWER_UPGRADE_STORAGE_KEY), payload);
  });

  test('readStorageJson returns null for malformed JSON', () => {
    global.window.localStorage.setItem(autoSave.KUF_STATE_STORAGE_KEY, '{not valid json');
    assert.equal(autoSave.readStorageJson(autoSave.KUF_STATE_STORAGE_KEY), null);
  });

  test('storage key constants are the expected literal strings', () => {
    assert.equal(autoSave.POWDER_STORAGE_KEY, 'glyph-defense-idle:powder');
    assert.equal(autoSave.ACTIVE_TAB_STORAGE_KEY, 'glyph-defense-idle:active-tab');
  });

  // --- assets/preferences.js (Phase 3) ------------------------------------
  // Minimal `document` stub: preferences.ts guards most DOM lookups behind
  // "if (element)"/"typeof document !== 'undefined'" checks (elements stay
  // null when never bound), but a couple of code paths (the notation preview
  // label and the spire-options-placement DOM sync) call document.getElementById
  // / document.body directly without a typeof guard, matching the original
  // .js behavior, so a stub is required for those functions to run under Node.
  global.document = {
    getElementById: () => null,
    body: {
      classList: { toggle: () => {} },
      dataset: {},
    },
  };
  const preferences = await importPreferencesModule();

  test('applyLoadoutSlotPreference: clamps to the supported 1-4 range', () => {
    assert.equal(preferences.applyLoadoutSlotPreference(0), 1);
    assert.equal(preferences.applyLoadoutSlotPreference(99), 4);
    assert.equal(preferences.applyLoadoutSlotPreference(3), 3);
    assert.equal(preferences.getPreferredLoadoutSlots(), 3);
  });

  test('initializeLoadoutSlotPreference: falls back to default when storage is empty', () => {
    global.window.localStorage.clear();
    assert.equal(preferences.initializeLoadoutSlotPreference({ defaultSlots: 2 }), 2);
  });

  test('applyLoadoutSlotPreference: persists to storage under the loadout-slots key', () => {
    preferences.applyLoadoutSlotPreference(4);
    assert.equal(global.window.localStorage.getItem(autoSave.TOWER_LOADOUT_SLOTS_STORAGE_KEY), '4');
  });

  test('applyFrameRateLimitPreference: clamps to the supported 30-120 range', () => {
    assert.equal(preferences.applyFrameRateLimitPreference(1), 30);
    assert.equal(preferences.applyFrameRateLimitPreference(1000), 120);
    assert.equal(preferences.applyFrameRateLimitPreference(90), 90);
    assert.equal(preferences.getFrameRateLimit(), 90);
  });

  test('applyFrameRateLimitPreference: non-finite input falls back to 60', () => {
    assert.equal(preferences.applyFrameRateLimitPreference(Number.NaN), 60);
  });

  test('applyGraphicsMode: round-trips through storage and getters', () => {
    preferences.applyGraphicsMode('low');
    assert.equal(preferences.isLowGraphicsModeActive(), true);
    assert.equal(preferences.getActiveGraphicsMode(), 'low');
    assert.equal(preferences.getPreferredGraphicsMode(), 'low');
    assert.equal(global.window.localStorage.getItem(autoSave.GRAPHICS_MODE_STORAGE_KEY), 'low');
    preferences.applyGraphicsMode('high');
    assert.equal(preferences.isLowGraphicsModeActive(), false);
  });

  test('applyGraphicsMode: unrecognized value normalizes to "high"', () => {
    assert.equal(preferences.applyGraphicsMode('not-a-real-mode'), 'high');
  });

  test('applyTrackRenderMode: invalid mode falls back to "gradient"', () => {
    assert.equal(preferences.applyTrackRenderMode('not-a-real-track-mode'), 'gradient');
    assert.equal(preferences.getTrackRenderMode(), 'gradient');
  });

  test('applyTrackRenderMode: accepts a valid mode and persists it', () => {
    assert.equal(preferences.applyTrackRenderMode('river'), 'river');
    assert.equal(global.window.localStorage.getItem(autoSave.TRACK_RENDER_MODE_STORAGE_KEY), 'river');
  });

  test('applyDamageNumberMode: invalid mode falls back to "damage"', () => {
    assert.equal(preferences.applyDamageNumberMode('not-a-real-mode'), 'damage');
    assert.equal(preferences.getDamageNumberMode(), 'damage');
  });

  test('applyDamageNumberMode: accepts "remaining"', () => {
    assert.equal(preferences.applyDamageNumberMode('remaining'), 'remaining');
    assert.equal(preferences.getDamageNumberMode(), 'remaining');
  });

  test('applyNotationPreference: persists the resolved notation under the notation key', () => {
    preferences.applyNotationPreference('scientific');
    assert.equal(global.window.localStorage.getItem(autoSave.NOTATION_STORAGE_KEY), 'scientific');
    preferences.applyNotationPreference('letters');
  });

  test('boolean toggle preferences: normalize truthy/falsy/string inputs consistently', () => {
    assert.equal(preferences.applyEnemyParticlesPreference('0'), false);
    assert.equal(preferences.applyEnemyParticlesPreference('on'), true);
    assert.equal(preferences.areEnemyParticlesEnabled(), true);
    assert.equal(preferences.applyEdgeCrystalsPreference(false), false);
    assert.equal(preferences.areEdgeCrystalsEnabled(), false);
  });

  test('initializeEdgeCrystalsPreference: defaults to disabled when storage is empty', () => {
    global.window.localStorage.clear();
    assert.equal(preferences.initializeEdgeCrystalsPreference(), false);
  });

  test('initializeInvertCarouselDragPreference: defaults to enabled (inverted) when storage is empty', () => {
    global.window.localStorage.clear();
    assert.equal(preferences.initializeInvertCarouselDragPreference(), true);
    assert.equal(preferences.isCarouselDragInverted(), true);
  });

  test('applyTowerLoadoutToggleSidePreference: unrecognized value normalizes to "left"', () => {
    assert.equal(preferences.applyTowerLoadoutToggleSidePreference('not-a-real-side'), 'left');
    assert.equal(preferences.applyTowerLoadoutToggleSidePreference('right'), 'right');
  });

  test('applySpireOptionsPlacementPreference: unrecognized value normalizes to "footer"', () => {
    assert.equal(preferences.applySpireOptionsPlacementPreference('not-a-real-placement'), 'footer');
    assert.equal(preferences.applySpireOptionsPlacementPreference('corner'), 'corner');
  });

  // --- assets/data/towers/index.js (Phase 4 tower-registry migration) -----
  const towerRegistry = await importTowerRegistry();
  const towers = towerRegistry.towers;

  test('tower registry: exports a non-empty `towers` array and default export matching it', () => {
    assert.ok(Array.isArray(towers));
    assert.ok(towers.length > 0);
    assert.equal(towerRegistry.default, towers);
  });

  test('tower registry: every tower id is unique', () => {
    const ids = towers.map((tower) => tower.id);
    const uniqueIds = new Set(ids);
    assert.equal(uniqueIds.size, ids.length, `duplicate tower ids found: ${ids.join(', ')}`);
  });

  test('tower registry: required numeric fields are finite and within valid domains', () => {
    for (const tower of towers) {
      assert.ok(Number.isFinite(tower.tier), `${tower.id}: tier must be finite`);
      assert.ok(tower.tier >= 0, `${tower.id}: tier must be >= 0`);
      assert.ok(Number.isFinite(tower.baseCost), `${tower.id}: baseCost must be finite`);
      assert.ok(tower.baseCost >= 0, `${tower.id}: baseCost must be >= 0`);
      assert.ok(Number.isFinite(tower.damage), `${tower.id}: damage must be finite`);
      assert.ok(tower.damage >= 0, `${tower.id}: damage must be >= 0`);
      assert.ok(Number.isFinite(tower.rate), `${tower.id}: rate must be finite`);
      assert.ok(tower.rate >= 0, `${tower.id}: rate must be >= 0`);
      assert.ok(Number.isFinite(tower.range), `${tower.id}: range must be finite`);
      assert.ok(tower.range >= 0, `${tower.id}: range must be >= 0`);
      if (tower.rangeMeters !== undefined) {
        assert.ok(Number.isFinite(tower.rangeMeters), `${tower.id}: rangeMeters must be finite when present`);
      }
      if (tower.diameterMeters !== undefined) {
        assert.ok(Number.isFinite(tower.diameterMeters), `${tower.id}: diameterMeters must be finite when present`);
      }
    }
  });

  test('tower registry: every nextTierId resolves to an existing tower id (or is null/absent)', () => {
    const idSet = new Set(towers.map((tower) => tower.id));
    for (const tower of towers) {
      if (tower.nextTierId === undefined || tower.nextTierId === null) continue;
      assert.ok(
        idSet.has(tower.nextTierId),
        `${tower.id}: nextTierId "${tower.nextTierId}" does not match any registered tower id`
      );
    }
  });

  test('tower registry: ordering and named per-tower exports remain consistent', () => {
    assert.equal(towers[0].id, 't1');
    assert.equal(towers[1].id, 't2');
    assert.equal(towers[2].id, 'mind-gate');
    assert.equal(towers[3].id, 'shadow-gate');
    assert.equal(towers[towers.length - 1].id, 'polynomial_engine');
    assert.equal(towerRegistry.alphaTower.id, 'alpha');
    assert.equal(towerRegistry.omegaTower.id, 'omega');
    assert.equal(towerRegistry.infinityTower.id, 'infinity');
  });

  test('tower registry: gate/non-placeable definitions retain their special properties', () => {
    const mindGate = towers.find((tower) => tower.id === 'mind-gate');
    const shadowGate = towers.find((tower) => tower.id === 'shadow-gate');
    for (const gate of [mindGate, shadowGate]) {
      assert.equal(gate.placeable, false);
      assert.equal(gate.tierLabel, 'Origin');
      assert.equal(typeof gate.description, 'string');
      assert.ok(gate.description.length > 0);
    }
    const infinity = towers.find((tower) => tower.id === 'infinity');
    assert.equal(infinity.nextTierId, null);
    const nu = towers.find((tower) => tower.id === 'nu');
    const phi = towers.find((tower) => tower.id === 'phi');
    assert.equal(nu.placeable, true);
    assert.equal(phi.placeable, true);
  });

  test('tower registry: definitions are frozen, matching pre-migration Object.freeze behavior', () => {
    for (const tower of towers) {
      assert.ok(Object.isFrozen(tower), `${tower.id} should be frozen`);
    }
  });

  // --- Build-output invariants for the migrated tower-data folder ---------
  // Verifies scripts/sync-ts-output.cjs's recursive discovery (Part 1, item 4
  // of the migration task) actually restores every migrated tower module's
  // compiled .js sibling, and does not leave stray/unexpected JS behind.
  test('build output: every migrated tower .ts module has a compiled .js sibling on disk', () => {
    const towersDir = path.join(rootDir, 'assets', 'data', 'towers');
    const tsFiles = fs.readdirSync(towersDir).filter((name) => name.endsWith('.ts'));
    assert.ok(tsFiles.length >= 33, `expected at least 33 .ts tower files, found ${tsFiles.length}`);
    for (const tsFile of tsFiles) {
      const jsFile = tsFile.replace(/\.ts$/, '.js');
      assert.ok(
        fs.existsSync(path.join(towersDir, jsFile)),
        `expected compiled sibling ${jsFile} for ${tsFile} (run \`npm run build\` first)`
      );
    }
  });

  test('build output: no stray hand-authored-looking JS remains in assets/data/towers without a .ts source', () => {
    const towersDir = path.join(rootDir, 'assets', 'data', 'towers');
    const jsFiles = fs.readdirSync(towersDir).filter((name) => name.endsWith('.js'));
    for (const jsFile of jsFiles) {
      const tsFile = jsFile.replace(/\.js$/, '.ts');
      assert.ok(
        fs.existsSync(path.join(towersDir, tsFile)),
        `${jsFile} has no corresponding .ts source; it should not exist as a hand-authored JS file in a fully migrated folder`
      );
    }
  });

  // --- assets/state/resourceState.js (Phase 5A) ---------------------------
  const resourceStateModule = await importAsEsm('assets/state/resourceState.js');

  test('createResourceStateContainers: uses calculateStartingThero for the initial score', () => {
    const { baseResources, resourceState } = resourceStateModule.createResourceStateContainers({
      calculateStartingThero: () => 42,
      baseScoreRate: 1,
      baseEnergyRate: 2,
      baseFluxRate: 3,
    });
    assert.equal(baseResources.score, 42);
    assert.equal(resourceState.score, 42);
  });

  test('createResourceStateContainers: falls back to a starting score of 0 when the callback is absent/invalid', () => {
    const withoutCallback = resourceStateModule.createResourceStateContainers({
      baseScoreRate: 1,
      baseEnergyRate: 2,
      baseFluxRate: 3,
    });
    assert.equal(withoutCallback.baseResources.score, 0);

    const withNonFunctionCallback = resourceStateModule.createResourceStateContainers({
      calculateStartingThero: 'not-a-function',
      baseScoreRate: 1,
      baseEnergyRate: 2,
      baseFluxRate: 3,
    });
    assert.equal(withNonFunctionCallback.baseResources.score, 0);
  });

  test('createResourceStateContainers: exact resource defaults are copied from the base rates, running starts false', () => {
    const { baseResources, resourceState } = resourceStateModule.createResourceStateContainers({
      calculateStartingThero: () => 10,
      baseScoreRate: 5,
      baseEnergyRate: 6,
      baseFluxRate: 7,
    });
    assert.deepEqual(baseResources, { score: 10, scoreRate: 5, energyRate: 6, fluxRate: 7 });
    assert.equal(resourceState.scoreRate, 5);
    assert.equal(resourceState.energyRate, 6);
    assert.equal(resourceState.fluxRate, 7);
    assert.equal(resourceState.running, false);
  });

  test('createResourceStateContainers: registration callback receives the exact same object references returned by the factory', () => {
    let received = null;
    const result = resourceStateModule.createResourceStateContainers({
      calculateStartingThero: () => 1,
      baseScoreRate: 1,
      baseEnergyRate: 1,
      baseFluxRate: 1,
      registerResourceContainers: (containers) => {
        received = containers;
      },
    });
    assert.equal(received.baseResources, result.baseResources);
    assert.equal(received.resourceState, result.resourceState);
  });

  test('createResourceStateContainers: missing registration callback is a safe no-op', () => {
    assert.doesNotThrow(() => {
      resourceStateModule.createResourceStateContainers({
        calculateStartingThero: () => 1,
        baseScoreRate: 1,
        baseEnergyRate: 1,
        baseFluxRate: 1,
      });
    });
  });

  // --- assets/state/spireResourceState.js (Phase 5A) ----------------------
  const spireResourceStateModule = await importAsEsm('assets/state/spireResourceState.js');

  test('createSpireResourceState: complete default state with no overrides', () => {
    const state = spireResourceStateModule.createSpireResourceState();
    assert.deepEqual(state.powder, { unlocked: false, storySeen: false });
    assert.deepEqual(state.shin, { unlocked: false, storySeen: false });
    assert.deepEqual(state.kuf, { unlocked: false, storySeen: false });
    assert.equal(state.fluid.particleFactorMilestone, 100);
    assert.equal(state.fluid.betGlyphsAwarded, 0);
    assert.equal(state.lamed.starMass, 10);
    assert.equal(state.lamed.dragLevel, 0);
    assert.equal(state.lamed.simulationSnapshot, null);
    assert.equal(state.tsadi.bindingAgents, 0);
    assert.deepEqual(state.tsadi.discoveredMolecules, []);
  });

  test('createSpireResourceState: branch-specific override merging (top-level fields)', () => {
    const state = spireResourceStateModule.createSpireResourceState({
      lamed: { unlocked: true, dragLevel: 3 },
      tsadi: { bindingAgents: 5 },
    });
    assert.equal(state.lamed.unlocked, true);
    assert.equal(state.lamed.dragLevel, 3);
    // Non-overridden top-level field on the same branch survives.
    assert.equal(state.lamed.starMass, 10);
    assert.equal(state.tsadi.bindingAgents, 5);
    assert.equal(state.tsadi.unlocked, false);
  });

  test('createSpireResourceState: nested upgrades/stats merge precedence (override wins, base fills gaps)', () => {
    const state = spireResourceStateModule.createSpireResourceState({
      lamed: { stats: { totalAbsorptions: 9 } },
    });
    assert.equal(state.lamed.stats.totalAbsorptions, 9);
    // Non-overridden nested stat fields survive from the base default.
    assert.equal(state.lamed.stats.totalMassGained, 0);
    assert.equal(state.lamed.stats.starMilestoneReached, 0);
    assert.equal(state.lamed.upgrades.starMass, 0);
  });

  test('createSpireResourceState: defaults are not mutated by a prior override call', () => {
    spireResourceStateModule.createSpireResourceState({
      lamed: { dragLevel: 99, stats: { totalAbsorptions: 500 } },
      fluid: { betGlyphsAwarded: 12345 },
    });
    const freshState = spireResourceStateModule.createSpireResourceState();
    assert.equal(freshState.lamed.dragLevel, 0);
    assert.equal(freshState.lamed.stats.totalAbsorptions, 0);
    assert.equal(freshState.fluid.betGlyphsAwarded, 0);
  });

  test('createSpireResourceState: each call returns fresh, independent nested objects (no shared references)', () => {
    const stateA = spireResourceStateModule.createSpireResourceState();
    const stateB = spireResourceStateModule.createSpireResourceState();
    assert.notEqual(stateA.lamed, stateB.lamed);
    assert.notEqual(stateA.lamed.stats, stateB.lamed.stats);
    stateA.lamed.stats.totalAbsorptions = 777;
    assert.equal(stateB.lamed.stats.totalAbsorptions, 0);
  });

  // --- assets/state/monetizationState.js (Phase 5A) ------------------------
  // Each test that touches module-level state re-imports a fresh copy (the
  // module keeps in-memory `currentState`/listeners at module scope with no
  // reset function), so a scratch copy per test avoids cross-test bleed.
  async function importFreshMonetizationState() {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-unit-test-monetization-'));
    const destPath = path.join(tmpDir, 'monetizationState.mjs');
    fs.copyFileSync(path.join(rootDir, 'assets/state/monetizationState.js'), destPath);
    return import(pathToFileURL(destPath).href);
  }

  // watchAdMock() uses a real setTimeout(1000ms); stub it globally for these
  // tests so triggerSpireBoost/triggerGemBoost resolve immediately instead of
  // making the suite wait a full second per call.
  const realSetTimeout = global.setTimeout;
  global.setTimeout = (fn) => {
    fn();
    return 0;
  };

  {
    global.window = { localStorage: createLocalStorageStub() };
    const monetization = await importFreshMonetizationState();

    test('monetizationState: default snapshot has premium locked and all cooldowns at 0', () => {
      const snapshot = monetization.getMonetizationState();
      assert.equal(snapshot.premiumUnlocked, false);
      assert.deepEqual(snapshot.boostCooldowns, {
        powder: 0, fluid: 0, lamed: 0, tsadi: 0, shin: 0, kuf: 0, gems: 0,
      });
    });

    test('monetizationState: getMonetizationState returns a clone, not the live cooldown object', () => {
      const snapshotA = monetization.getMonetizationState();
      snapshotA.boostCooldowns.lamed = 999999;
      const snapshotB = monetization.getMonetizationState();
      assert.equal(snapshotB.boostCooldowns.lamed, 0);
    });

    test('monetizationState: unlockPremium sets premiumUnlocked and persists to storage', () => {
      monetization.unlockPremium();
      assert.equal(monetization.getMonetizationState().premiumUnlocked, true);
      const stored = JSON.parse(global.window.localStorage.getItem(monetization.MONETIZATION_STORAGE_KEY));
      assert.equal(stored.premiumUnlocked, true);
    });

    test('monetizationState: addMonetizationListener invokes immediately with current state, and unsubscribe stops future notifications', () => {
      const seen = [];
      const unsubscribe = monetization.addMonetizationListener((snapshot) => seen.push(snapshot.premiumUnlocked));
      assert.equal(seen.length, 1);
      assert.equal(seen[0], true); // premium was unlocked by the previous test
      unsubscribe();
      monetization.unlockPremium();
      assert.equal(seen.length, 1, 'listener should not be called again after unsubscribe');
    });

    test('monetizationState: triggerSpireBoost rejects an invalid spire id', async () => {
      const result = await monetization.triggerSpireBoost('not-a-spire', () => {});
      assert.deepEqual(result, { success: false, error: 'Invalid spire ID' });
    });
  }

  {
    // Fresh module instance per remaining group so cooldown state starts at 0.
    global.window = { localStorage: createLocalStorageStub() };
    const monetization = await importFreshMonetizationState();

    test('monetizationState: getBoostCooldown reports no cooldown initially, using controlled Date.now', () => {
      const realNow = Date.now;
      Date.now = () => 1_000_000;
      try {
        const cooldown = monetization.getBoostCooldown('lamed');
        assert.equal(cooldown.onCooldown, false);
        assert.equal(cooldown.remainingMs, 0);
      } finally {
        Date.now = realNow;
      }
    });

    test('monetizationState: successful idle boost invokes applyIdleTime with (spireId, 7200) and starts a 1hr cooldown', async () => {
      const realNow = Date.now;
      Date.now = () => 1_000_000;
      try {
        let calledWith = null;
        const result = await monetization.triggerSpireBoost('tsadi', (spireId, idleTimeSeconds) => {
          calledWith = [spireId, idleTimeSeconds];
        });
        assert.deepEqual(result, { success: true, idleTimeSeconds: 2 * 60 * 60 });
        assert.deepEqual(calledWith, ['tsadi', 7200]);
        const cooldown = monetization.getBoostCooldown('tsadi');
        assert.equal(cooldown.onCooldown, true);
        assert.equal(cooldown.remainingMs, 60 * 60 * 1000);
      } finally {
        Date.now = realNow;
      }
    });

    test('monetizationState: a second boost attempt on the same spire while on cooldown is rejected', async () => {
      const result = await monetization.triggerSpireBoost('tsadi', () => {});
      assert.equal(result.success, false);
      assert.equal(result.error, 'Boost on cooldown');
      assert.ok(result.remainingMs > 0);
    });

    test('monetizationState: successful gem boost invokes grantGems(100) and returns its result', async () => {
      const result = await monetization.triggerGemBoost((amount) => {
        assert.equal(amount, 100);
        return 100;
      });
      assert.deepEqual(result, { success: true, gemsGranted: 100 });
    });
  }

  test('monetizationState: loadMonetizationState merges a persisted snapshot without a window/localStorage guard crash', async () => {
    const originalWindow = global.window;
    try {
      global.window = undefined;
      const monetization = await importFreshMonetizationState();
      assert.doesNotThrow(() => monetization.loadMonetizationState());
    } finally {
      global.window = originalWindow;
    }
  });

  global.setTimeout = realSetTimeout;

  // --- report --------------------------------------------------------------
  if (failures.length) {
    console.error(`\nUnit tests failed: ${failures.length}/${passed + failures.length}`);
    failures.forEach(({ name, error }) => {
      console.error(`\n- ${name}`);
      console.error(error);
    });
    process.exitCode = 1;
    return;
  }

  console.log(`Unit tests passed: ${passed}/${passed}`);
}

run().catch((error) => {
  console.error('Unit test runner crashed:', error);
  process.exitCode = 1;
});
