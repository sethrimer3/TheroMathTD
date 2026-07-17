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

// Import the compiled Aleph upgrade-state owner with its single relative
// alephChain.js dependency inside a scratch ESM package.
function importAlephUpgradeStateModule() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-unit-test-aleph-upgrades-'));
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
  const relativeFiles = [
    'assets/alephUpgradeState.js',
    'scripts/features/towers/alephChain.js',
  ];
  for (const relativeFile of relativeFiles) {
    const destPath = path.join(tmpDir, relativeFile);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(path.join(rootDir, relativeFile), destPath);
  }
  return import(pathToFileURL(path.join(tmpDir, 'assets/alephUpgradeState.js')).href);
}

// Import the compiled tower presenter against a deterministic authored-blueprint
// registry so tests exercise production logic without loading the full UI/codex graph.
function importTowerBlueprintPresenterModule() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-unit-test-tower-presenter-'));
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
  const presenterDest = path.join(tmpDir, 'assets', 'towerBlueprintPresenter.js');
  const registryDest = path.join(tmpDir, 'assets', 'towerEquations', 'index.js');
  fs.mkdirSync(path.dirname(presenterDest), { recursive: true });
  fs.mkdirSync(path.dirname(registryDest), { recursive: true });
  fs.copyFileSync(path.join(rootDir, 'assets', 'towerBlueprintPresenter.js'), presenterDest);
  fs.writeFileSync(
    registryDest,
    `export const TOWER_EQUATION_BLUEPRINTS = {
      authored: {
        mathSymbol: 'A',
        baseEquation: 'A = authored',
        variables: [{ key: 'power', baseValue: 3, step: 2, upgradable: true, cost: 2 }],
        computeResult(values) { return values.power; },
      },
      source: {
        variables: [{ key: 'value', baseValue: 4, upgradable: false }],
        computeResult(values) { return values.value; },
      },
      exponentReference: {
        variables: [{ key: 'linked', reference: 'source', exponent: 2 }],
        computeResult(values) { return values.linked; },
      },
      transformedReference: {
        variables: [{ key: 'linked', reference: 'source', transform(value) { return value + 5; } }],
        computeResult(values) { return values.linked; },
      },
      invalidSource: {
        variables: [],
        computeResult() { return Infinity; },
      },
      invalidReference: {
        variables: [{ key: 'linked', reference: 'invalidSource' }],
        computeResult(values) { return values.linked; },
      },
      recursiveA: {
        variables: [{ key: 'linked', reference: 'recursiveB' }],
        computeResult(values) { return values.linked; },
      },
      recursiveB: {
        variables: [{ key: 'linked', reference: 'recursiveA' }],
        computeResult(values) { return values.linked; },
      },
      aggregate: {
        variables: [
          { key: 'first', baseValue: 2, upgradable: false },
          { key: 'second', baseValue: 3, upgradable: false },
          { key: 'invalid', computeValue() { return NaN; }, baseValue: 0, upgradable: false },
        ],
      },
      nonFiniteResult: {
        variables: [],
        computeResult() { return NaN; },
      },
    };`,
  );
  return import(pathToFileURL(presenterDest).href);
}

// Import the compiled dependency-free tower discovery owner as the browser loads it.
function importTowerVariableDiscoveryModule() {
  return importAsEsm('assets/towerVariableDiscovery.js');
}

// Import the compiled tower tooltip owner; its Phase 8/9 imports are type-only and erase from output.
function importTowerEquationTooltipModule() {
  return importAsEsm('assets/towerEquationTooltip.js');
}

// Import the compiled dependency-free master-equation derivation utility.
function importMasterEquationUtilsModule() {
  return importAsEsm('assets/towerEquations/masterEquationUtils.js');
}

// Import the compiled Mind Gate blueprint with a recording formatting stub so
// its authored equations and callback timing can be characterized in Node.
async function importMindGateEquationModule() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-unit-test-mind-gate-'));
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
  const equationDest = path.join(tmpDir, 'assets', 'towerEquations', 'mindGate.js');
  const formattingDest = path.join(tmpDir, 'scripts', 'core', 'formatting.js');
  fs.mkdirSync(path.dirname(equationDest), { recursive: true });
  fs.mkdirSync(path.dirname(formattingDest), { recursive: true });
  fs.copyFileSync(path.join(rootDir, 'assets', 'towerEquations', 'mindGate.js'), equationDest);
  fs.writeFileSync(
    formattingDest,
    `export const formatCalls = [];
     export function formatWholeNumber(value) {
       formatCalls.push(value);
       return \`whole:\${String(value)}\`;
     }`,
  );
  const mindGateModule = await import(pathToFileURL(equationDest).href);
  const formattingModule = await import(pathToFileURL(formattingDest).href);
  return { mindGate: mindGateModule.mindGate, formatCalls: formattingModule.formatCalls };
}

// Import the compiled Shadow Gate blueprint with a mutable Codex stub so tests
// can observe dynamic getter timing, lookup order, and symbol filtering.
async function importShadowGateEquationModule() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-unit-test-shadow-gate-'));
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
  const equationDest = path.join(tmpDir, 'assets', 'towerEquations', 'shadowGate.js');
  const codexDest = path.join(tmpDir, 'assets', 'codex.js');
  fs.mkdirSync(path.dirname(equationDest), { recursive: true });
  fs.copyFileSync(path.join(rootDir, 'assets', 'towerEquations', 'shadowGate.js'), equationDest);
  fs.writeFileSync(
    codexDest,
    `export const codexState = { encounteredEnemies: new Set() };
     export const codexEntries = new Map();
     export const lookupCalls = [];
     export function getEnemyCodexEntry(id) {
       lookupCalls.push(id);
       return codexEntries.get(id);
     }`,
  );
  const shadowGateModule = await import(pathToFileURL(equationDest).href);
  const codexModule = await import(pathToFileURL(codexDest).href);
  return { shadowGate: shadowGateModule.shadowGate, ...codexModule };
}

// Import the compiled advanced-equation barrel against identity-marked stubs
// so every direct re-export can be checked without loading formula dependencies.
async function importAdvancedEquationBarrelModule() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-unit-test-advanced-barrel-'));
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
  const equationDir = path.join(tmpDir, 'assets', 'towerEquations');
  const advancedDir = path.join(equationDir, 'advanced');
  fs.mkdirSync(advancedDir, { recursive: true });
  fs.copyFileSync(
    path.join(rootDir, 'assets', 'towerEquations', 'advancedTowers.js'),
    path.join(equationDir, 'advancedTowers.js'),
  );
  const exportNames = [
    'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma',
    'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
  ];
  for (const exportName of exportNames) {
    fs.writeFileSync(
      path.join(advancedDir, `${exportName}Equation.js`),
      `export const ${exportName} = { sourceId: '${exportName}' };`,
    );
  }
  const barrelModule = await import(
    pathToFileURL(path.join(equationDir, 'advancedTowers.js')).href
  );
  return { barrelModule, exportNames, advancedDir };
}

// Import one compiled advanced equation against recording formatting/context stubs
// so formula behavior is exercised without loading the Towers-tab integration graph.
async function importAdvancedEquationModule(exportName) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `thero-unit-test-${exportName}-equation-`));
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
  const equationDest = path.join(
    tmpDir,
    'assets',
    'towerEquations',
    'advanced',
    `${exportName}Equation.js`,
  );
  const contextDest = path.join(tmpDir, 'assets', 'towerEquations', 'blueprintContext.js');
  const formattingDest = path.join(tmpDir, 'scripts', 'core', 'formatting.js');
  fs.mkdirSync(path.dirname(equationDest), { recursive: true });
  fs.mkdirSync(path.dirname(contextDest), { recursive: true });
  fs.mkdirSync(path.dirname(formattingDest), { recursive: true });
  fs.copyFileSync(
    path.join(rootDir, 'assets', 'towerEquations', 'advanced', `${exportName}Equation.js`),
    equationDest,
  );
  fs.writeFileSync(
    contextDest,
    `export const blueprintContext = { calculateTowerEquationResult: null };`,
  );
  fs.writeFileSync(
    formattingDest,
    `export const formatCalls = [];
     export function formatWholeNumber(value) {
       formatCalls.push(['whole', value]);
       return \`whole:\${String(value)}\`;
     }
     export function formatDecimal(value, digits) {
       formatCalls.push(['decimal', value, digits]);
       return \`decimal:\${String(value)}:\${String(digits)}\`;
     }
     export function formatGameNumber(value) {
       formatCalls.push(['game', value]);
       return \`game:\${String(value)}\`;
     }`,
  );
  const equationModule = await import(pathToFileURL(equationDest).href);
  const contextModule = await import(pathToFileURL(contextDest).href);
  const formattingModule = await import(pathToFileURL(formattingDest).href);
  return {
    equation: equationModule[exportName],
    blueprintContext: contextModule.blueprintContext,
    formatCalls: formattingModule.formatCalls,
  };
}

// Import a fresh compiled shared-context module for each state-sensitive test.
function importBlueprintContextModule() {
  return importAsEsm('assets/towerEquations/blueprintContext.js');
}

// Import the compiled equation registry with identity-marked stub definition groups.
async function importTowerEquationIndexModule() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-unit-test-equation-index-'));
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
  const equationDir = path.join(tmpDir, 'assets', 'towerEquations');
  fs.mkdirSync(equationDir, { recursive: true });
  fs.copyFileSync(
    path.join(rootDir, 'assets', 'towerEquations', 'index.js'),
    path.join(equationDir, 'index.js'),
  );
  const stubSources = {
    'mindGate.js': ['mindGate'],
    'shadowGate.js': ['shadowGate'],
    'basicTowers.js': ['alpha', 'beta', 'gamma'],
    'greekTowers.js': ['delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota'],
    'advancedTowers.js': [
      'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma',
      'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
    ],
    'infinityTower.js': ['infinity'],
  };
  for (const [fileName, exportNames] of Object.entries(stubSources)) {
    const source = exportNames
      .map((exportName) => `export const ${exportName} = { sourceId: '${exportName}' };`)
      .join('\n');
    fs.writeFileSync(path.join(equationDir, fileName), source);
  }
  const registryModule = await import(pathToFileURL(path.join(equationDir, 'index.js')).href);
  const sourceById = {};
  for (const [fileName, exportNames] of Object.entries(stubSources)) {
    const sourceModule = await import(pathToFileURL(path.join(equationDir, fileName)).href);
    for (const exportName of exportNames) {
      const registryId = exportName === 'mindGate'
        ? 'mind-gate'
        : exportName === 'shadowGate'
          ? 'shadow-gate'
          : exportName;
      sourceById[registryId] = sourceModule[exportName];
    }
  }
  return { registryModule, sourceById };
}

// Install a deterministic minimal DOM, timer, and animation-frame surface for tooltip tests.
function withFakeTooltipDom(callback) {
  const savedDescriptors = new Map(
    ['window', 'document', 'HTMLElement'].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(global, key),
    ]),
  );
  let nextTimerId = 1;
  const timers = new Map();
  const clearedTimerIds = [];
  const frameCallbacks = [];

  class FakeHTMLElement {
    constructor(rect = {}) {
      this.className = '';
      this.id = '';
      this.dataset = {};
      this.style = {};
      this.hidden = false;
      this.textContent = '';
      this.isConnected = false;
      this.children = [];
      this.attributes = new Map();
      this.rect = {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        right: (rect.left || 0) + (rect.width || 0),
        bottom: (rect.top || 0) + (rect.height || 0),
        ...rect,
      };
    }

    append(child) {
      child.isConnected = true;
      this.children.push(child);
    }

    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    }

    getAttribute(name) {
      return this.attributes.get(name) ?? null;
    }

    removeAttribute(name) {
      this.attributes.delete(name);
    }

    getBoundingClientRect() {
      return this.rect;
    }
  }

  const fakeWindow = {
    setTimeout(handler, delay) {
      const id = nextTimerId++;
      timers.set(id, { handler, delay });
      return id;
    },
    clearTimeout(id) {
      clearedTimerIds.push(id);
      timers.delete(id);
    },
    requestAnimationFrame(callback) {
      frameCallbacks.push(callback);
      callback(0);
      return 900 + frameCallbacks.length;
    },
  };
  const fakeDocument = {
    createElement: () => new FakeHTMLElement({ width: 80, height: 30 }),
  };

  Object.defineProperty(global, 'window', { configurable: true, writable: true, value: fakeWindow });
  Object.defineProperty(global, 'document', { configurable: true, writable: true, value: fakeDocument });
  Object.defineProperty(global, 'HTMLElement', { configurable: true, writable: true, value: FakeHTMLElement });

  const runTimer = (id) => {
    const timer = timers.get(id);
    if (!timer) {
      return false;
    }
    timers.delete(id);
    timer.handler();
    return true;
  };

  try {
    return callback({
      FakeHTMLElement,
      fakeWindow,
      fakeDocument,
      timers,
      clearedTimerIds,
      frameCallbacks,
      runTimer,
    });
  } finally {
    for (const [key, descriptor] of savedDescriptors) {
      if (descriptor) {
        Object.defineProperty(global, key, descriptor);
      } else {
        delete global[key];
      }
    }
  }
}

// Build a fresh dependency-injected persistence controller for each test so
// Mutable story flags and invocation logs never leak between cases.
function createSpirePersistenceHarness(spirePersistence, options = {}) {
  const callOrder = [];
  const towerApplyCalls = [];
  const alephApplyCalls = [];
  const spireResourceState = options.spireResourceState || {
    wellOfInspiration: { unlocked: true, storySeen: false },
    achievements: { storySeen: false },
  };
  const baseTowerSnapshot = options.baseTowerSnapshot || {
    alpha: { variables: { glyph1: { level: 2 } } },
    beta: { variables: { glyph2: { level: 3 } } },
  };
  const alephSnapshot = options.alephSnapshot || { x: 2, y: 3, z: 4 };
  const playfield = options.playfield || { id: 'active-playfield' };

  const controller = spirePersistence.createSpireResourcePersistence({
    spireResourceState,
    getTowerUpgradeStateSnapshot: () => baseTowerSnapshot,
    applyTowerUpgradeStateSnapshot: (snapshot) => {
      callOrder.push('tower');
      towerApplyCalls.push(snapshot);
    },
    getAlephChainUpgrades: () => alephSnapshot,
    applyAlephChainUpgradeSnapshot: (snapshot, applyOptions) => {
      callOrder.push('aleph');
      alephApplyCalls.push({ snapshot, options: applyOptions });
    },
    getPlayfield: () => playfield,
  });

  return {
    controller,
    spireResourceState,
    baseTowerSnapshot,
    alephSnapshot,
    playfield,
    callOrder,
    towerApplyCalls,
    alephApplyCalls,
  };
}

async function run() {
  let passed = 0;
  const failures = [];

  async function test(name, fn) {
    try {
      await fn();
      passed += 1;
    } catch (error) {
      failures.push({ name, error });
    }
  }

  // --- scripts/core/formatting.js -----------------------------------------
  const formatting = await importAsEsm('scripts/core/formatting.js');

  await test('formatGameNumber: default LETTERS notation formats thousands', () => {
    assert.equal(formatting.formatGameNumber(12500), '12.5 K');
  });

  await test('formatGameNumber: values below 1 keep two decimal places', () => {
    assert.equal(formatting.formatGameNumber(0.5), '0.50');
  });

  await test('formatGameNumber: non-finite values fall back to "0"', () => {
    assert.equal(formatting.formatGameNumber(NaN), '0');
    assert.equal(formatting.formatGameNumber(Infinity), '0');
  });

  await test('setGameNumberNotation: switches to SCIENTIFIC and affects formatting', () => {
    const resolved = formatting.setGameNumberNotation('scientific');
    assert.equal(resolved, 'scientific');
    assert.equal(formatting.formatGameNumber(12500), '1.25e4');
    // Restore default so subsequent tests are unaffected by ordering.
    formatting.setGameNumberNotation('letters');
  });

  await test('setGameNumberNotation: unknown notation falls back to LETTERS', () => {
    const resolved = formatting.setGameNumberNotation('not-a-real-notation');
    assert.equal(resolved, 'letters');
  });

  await test('formatWholeNumber: rounds, clamps negatives to 0, adds separators', () => {
    assert.equal(formatting.formatWholeNumber(1234.6), '1,235');
    assert.equal(formatting.formatWholeNumber(-5), '0');
  });

  await test('formatPercentage / formatSignedPercentage: precision and sign', () => {
    assert.equal(formatting.formatPercentage(0.75), '75.0%');
    assert.equal(formatting.formatSignedPercentage(0.05), '+5.00%');
    assert.equal(formatting.formatSignedPercentage(-0.2), '-20.0%');
  });

  // --- assets/autoSave.js storage primitives ------------------------------
  global.window = { localStorage: createLocalStorageStub() };
  const autoSave = await importAsEsm('assets/autoSave.js');

  await test('writeStorage/readStorage round-trip a primitive value', () => {
    autoSave.writeStorage(autoSave.ACTIVE_TAB_STORAGE_KEY, 'options');
    assert.equal(autoSave.readStorage(autoSave.ACTIVE_TAB_STORAGE_KEY), 'options');
  });

  await test('readStorage returns null for a missing key', () => {
    assert.equal(autoSave.readStorage('glyph-defense-idle:does-not-exist'), null);
  });

  await test('writeStorageJson/readStorageJson round-trip an object payload', () => {
    const payload = { alpha: 1, nested: { beta: 2 } };
    autoSave.writeStorageJson(autoSave.TOWER_UPGRADE_STORAGE_KEY, payload);
    assert.deepEqual(autoSave.readStorageJson(autoSave.TOWER_UPGRADE_STORAGE_KEY), payload);
  });

  await test('readStorageJson returns null for malformed JSON', () => {
    global.window.localStorage.setItem(autoSave.KUF_STATE_STORAGE_KEY, '{not valid json');
    assert.equal(autoSave.readStorageJson(autoSave.KUF_STATE_STORAGE_KEY), null);
  });

  await test('storage key constants are the expected literal strings', () => {
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

  await test('applyLoadoutSlotPreference: clamps to the supported 1-4 range', () => {
    assert.equal(preferences.applyLoadoutSlotPreference(0), 1);
    assert.equal(preferences.applyLoadoutSlotPreference(99), 4);
    assert.equal(preferences.applyLoadoutSlotPreference(3), 3);
    assert.equal(preferences.getPreferredLoadoutSlots(), 3);
  });

  await test('initializeLoadoutSlotPreference: falls back to default when storage is empty', () => {
    global.window.localStorage.clear();
    assert.equal(preferences.initializeLoadoutSlotPreference({ defaultSlots: 2 }), 2);
  });

  await test('applyLoadoutSlotPreference: persists to storage under the loadout-slots key', () => {
    preferences.applyLoadoutSlotPreference(4);
    assert.equal(global.window.localStorage.getItem(autoSave.TOWER_LOADOUT_SLOTS_STORAGE_KEY), '4');
  });

  await test('applyFrameRateLimitPreference: clamps to the supported 30-120 range', () => {
    assert.equal(preferences.applyFrameRateLimitPreference(1), 30);
    assert.equal(preferences.applyFrameRateLimitPreference(1000), 120);
    assert.equal(preferences.applyFrameRateLimitPreference(90), 90);
    assert.equal(preferences.getFrameRateLimit(), 90);
  });

  await test('applyFrameRateLimitPreference: non-finite input falls back to 60', () => {
    assert.equal(preferences.applyFrameRateLimitPreference(Number.NaN), 60);
  });

  await test('applyGraphicsMode: round-trips through storage and getters', () => {
    preferences.applyGraphicsMode('low');
    assert.equal(preferences.isLowGraphicsModeActive(), true);
    assert.equal(preferences.getActiveGraphicsMode(), 'low');
    assert.equal(preferences.getPreferredGraphicsMode(), 'low');
    assert.equal(global.window.localStorage.getItem(autoSave.GRAPHICS_MODE_STORAGE_KEY), 'low');
    preferences.applyGraphicsMode('high');
    assert.equal(preferences.isLowGraphicsModeActive(), false);
  });

  await test('applyGraphicsMode: unrecognized value normalizes to "high"', () => {
    assert.equal(preferences.applyGraphicsMode('not-a-real-mode'), 'high');
  });

  await test('applyTrackRenderMode: invalid mode falls back to "gradient"', () => {
    assert.equal(preferences.applyTrackRenderMode('not-a-real-track-mode'), 'gradient');
    assert.equal(preferences.getTrackRenderMode(), 'gradient');
  });

  await test('applyTrackRenderMode: accepts a valid mode and persists it', () => {
    assert.equal(preferences.applyTrackRenderMode('river'), 'river');
    assert.equal(global.window.localStorage.getItem(autoSave.TRACK_RENDER_MODE_STORAGE_KEY), 'river');
  });

  await test('applyDamageNumberMode: invalid mode falls back to "damage"', () => {
    assert.equal(preferences.applyDamageNumberMode('not-a-real-mode'), 'damage');
    assert.equal(preferences.getDamageNumberMode(), 'damage');
  });

  await test('applyDamageNumberMode: accepts "remaining"', () => {
    assert.equal(preferences.applyDamageNumberMode('remaining'), 'remaining');
    assert.equal(preferences.getDamageNumberMode(), 'remaining');
  });

  await test('applyNotationPreference: persists the resolved notation under the notation key', () => {
    preferences.applyNotationPreference('scientific');
    assert.equal(global.window.localStorage.getItem(autoSave.NOTATION_STORAGE_KEY), 'scientific');
    preferences.applyNotationPreference('letters');
  });

  await test('boolean toggle preferences: normalize truthy/falsy/string inputs consistently', () => {
    assert.equal(preferences.applyEnemyParticlesPreference('0'), false);
    assert.equal(preferences.applyEnemyParticlesPreference('on'), true);
    assert.equal(preferences.areEnemyParticlesEnabled(), true);
    assert.equal(preferences.applyEdgeCrystalsPreference(false), false);
    assert.equal(preferences.areEdgeCrystalsEnabled(), false);
  });

  await test('initializeEdgeCrystalsPreference: defaults to disabled when storage is empty', () => {
    global.window.localStorage.clear();
    assert.equal(preferences.initializeEdgeCrystalsPreference(), false);
  });

  await test('initializeInvertCarouselDragPreference: defaults to enabled (inverted) when storage is empty', () => {
    global.window.localStorage.clear();
    assert.equal(preferences.initializeInvertCarouselDragPreference(), true);
    assert.equal(preferences.isCarouselDragInverted(), true);
  });

  await test('applyTowerLoadoutToggleSidePreference: unrecognized value normalizes to "left"', () => {
    assert.equal(preferences.applyTowerLoadoutToggleSidePreference('not-a-real-side'), 'left');
    assert.equal(preferences.applyTowerLoadoutToggleSidePreference('right'), 'right');
  });

  await test('applySpireOptionsPlacementPreference: unrecognized value normalizes to "footer"', () => {
    assert.equal(preferences.applySpireOptionsPlacementPreference('not-a-real-placement'), 'footer');
    assert.equal(preferences.applySpireOptionsPlacementPreference('corner'), 'corner');
  });

  // --- assets/data/towers/index.js (Phase 4 tower-registry migration) -----
  const towerRegistry = await importTowerRegistry();
  const towers = towerRegistry.towers;

  await test('tower registry: exports a non-empty `towers` array and default export matching it', () => {
    assert.ok(Array.isArray(towers));
    assert.ok(towers.length > 0);
    assert.equal(towerRegistry.default, towers);
  });

  await test('tower registry: every tower id is unique', () => {
    const ids = towers.map((tower) => tower.id);
    const uniqueIds = new Set(ids);
    assert.equal(uniqueIds.size, ids.length, `duplicate tower ids found: ${ids.join(', ')}`);
  });

  await test('tower registry: required numeric fields are finite and within valid domains', () => {
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

  await test('tower registry: every nextTierId resolves to an existing tower id (or is null/absent)', () => {
    const idSet = new Set(towers.map((tower) => tower.id));
    for (const tower of towers) {
      if (tower.nextTierId === undefined || tower.nextTierId === null) continue;
      assert.ok(
        idSet.has(tower.nextTierId),
        `${tower.id}: nextTierId "${tower.nextTierId}" does not match any registered tower id`
      );
    }
  });

  await test('tower registry: ordering and named per-tower exports remain consistent', () => {
    assert.equal(towers[0].id, 't1');
    assert.equal(towers[1].id, 't2');
    assert.equal(towers[2].id, 'mind-gate');
    assert.equal(towers[3].id, 'shadow-gate');
    assert.equal(towers[towers.length - 1].id, 'polynomial_engine');
    assert.equal(towerRegistry.alphaTower.id, 'alpha');
    assert.equal(towerRegistry.omegaTower.id, 'omega');
    assert.equal(towerRegistry.infinityTower.id, 'infinity');
  });

  await test('tower registry: gate/non-placeable definitions retain their special properties', () => {
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

  await test('tower registry: definitions are frozen, matching pre-migration Object.freeze behavior', () => {
    for (const tower of towers) {
      assert.ok(Object.isFrozen(tower), `${tower.id} should be frozen`);
    }
  });

  // --- Build-output invariants for the migrated tower-data folder ---------
  // Verifies scripts/sync-ts-output.cjs's recursive discovery (Part 1, item 4
  // of the migration task) actually restores every migrated tower module's
  // compiled .js sibling, and does not leave stray/unexpected JS behind.
  await test('build output: every migrated tower .ts module has a compiled .js sibling on disk', () => {
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

  await test('build output: no stray hand-authored-looking JS remains in assets/data/towers without a .ts source', () => {
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

  await test('createResourceStateContainers: uses calculateStartingThero for the initial score', () => {
    const { baseResources, resourceState } = resourceStateModule.createResourceStateContainers({
      calculateStartingThero: () => 42,
      baseScoreRate: 1,
      baseEnergyRate: 2,
      baseFluxRate: 3,
    });
    assert.equal(baseResources.score, 42);
    assert.equal(resourceState.score, 42);
  });

  await test('createResourceStateContainers: falls back to a starting score of 0 when the callback is absent/invalid', () => {
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

  await test('createResourceStateContainers: exact resource defaults are copied from the base rates, running starts false', () => {
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

  await test('createResourceStateContainers: registration callback receives the exact same object references returned by the factory', () => {
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

  await test('createResourceStateContainers: missing registration callback is a safe no-op', () => {
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

  await test('createSpireResourceState: complete default state with no overrides', () => {
    const state = spireResourceStateModule.createSpireResourceState();
    assert.deepEqual(state, {
      wellOfInspiration: { unlocked: true, storySeen: false },
      achievements: { storySeen: false },
    });
  });

  await test('createSpireResourceState: accepts the current Well override', () => {
    const state = spireResourceStateModule.createSpireResourceState({
      wellOfInspiration: { storySeen: true },
      achievements: { storySeen: true },
    });
    assert.deepEqual(state.wellOfInspiration, { unlocked: true, storySeen: true });
    assert.deepEqual(state.achievements, { storySeen: true });
  });

  await test('createSpireResourceState: migrates legacy Aleph aliases without renaming save keys', () => {
    const state = spireResourceStateModule.createSpireResourceState({
      powder: { unlocked: false, storySeen: true },
    });
    assert.deepEqual(state.wellOfInspiration, { unlocked: true, storySeen: true });
  });

  await test('createSpireResourceState: ignores retired branches from old saves', () => {
    const state = spireResourceStateModule.createSpireResourceState({
      fluid: { betGlyphsAwarded: 12345 },
      lamed: { dragLevel: 99 },
      tsadi: { bindingAgents: 500 },
      shin: { unlocked: true },
      kuf: { unlocked: true },
    });
    assert.deepEqual(Object.keys(state).sort(), ['achievements', 'wellOfInspiration']);
  });

  await test('createSpireResourceState: each call returns fresh, independent nested objects (no shared references)', () => {
    const stateA = spireResourceStateModule.createSpireResourceState();
    const stateB = spireResourceStateModule.createSpireResourceState();
    assert.notEqual(stateA.wellOfInspiration, stateB.wellOfInspiration);
    stateA.wellOfInspiration.storySeen = true;
    assert.equal(stateB.wellOfInspiration.storySeen, false);
  });

  const saveCompatibility = await importAsEsm('assets/saveCompatibility.js');

  await test('migrateWellOfInspirationSave: old retired branches are ignored without blocking startup data', () => {
    const migrated = saveCompatibility.migrateWellOfInspirationSave({
      powder: { storySeen: true },
      fluid: { grainCount: 999 },
      lamed: { unlocked: true },
      tsadi: { bindingAgents: 7 },
      shin: { iterons: 8 },
      kuf: { shards: 9 },
    });
    assert.deepEqual(migrated, {
      wellOfInspiration: { storySeen: true },
    });
  });

  await test('migrateWellOfInspirationSave: preserves a valid legacy simulation snapshot', () => {
    const migrated = saveCompatibility.migrateWellOfInspirationSave({
      alephSpire: { storySeen: true },
      loadedSimulationState: { grains: [] },
    });
    assert.deepEqual(migrated, {
      wellOfInspiration: { storySeen: true },
      simulation: { grains: [] },
    });
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

  await test('monetizationState: loadMonetizationState merges a persisted snapshot without a window/localStorage guard crash', async () => {
    const originalWindow = global.window;
    try {
      global.window = undefined;
      const monetization = await importFreshMonetizationState();
      assert.doesNotThrow(() => monetization.loadMonetizationState());
    } finally {
      global.window = originalWindow;
    }
  });

  // --- assets/alephUpgradeState.js -----------------------------------------
  const alephUpgrades = await importAlephUpgradeStateModule();

  await test('Aleph upgrades: defaults, export names, and defensive getter cloning are preserved', () => {
    const liveState = alephUpgrades.alephChainUpgradeState;
    assert.deepEqual(alephUpgrades.resetAlephChainUpgrades(), { x: 1, y: 1, z: 3 });
    const first = alephUpgrades.getAlephChainUpgrades();
    const second = alephUpgrades.getAlephChainUpgrades();
    assert.deepEqual(first, { x: 1, y: 1, z: 3 });
    assert.notEqual(first, liveState);
    assert.notEqual(first, second);
    first.x = 99;
    assert.equal(alephUpgrades.getAlephChainUpgrades().x, 1);
  });

  await test('Aleph updates: positive x/y values survive exactly while z clamps and floors', () => {
    const liveState = alephUpgrades.alephChainUpgradeState;
    alephUpgrades.resetAlephChainUpgrades();
    const result = alephUpgrades.updateAlephChainUpgrades({ x: 2.75, y: 4.5, z: 8.9 });
    assert.deepEqual(result, { x: 2.75, y: 4.5, z: 8 });
    assert.deepEqual(liveState, result);
    assert.equal(alephUpgrades.alephChainUpgradeState, liveState);
    assert.notEqual(result, liveState);

    assert.deepEqual(alephUpgrades.updateAlephChainUpgrades({ z: -4.2 }), {
      x: 2.75,
      y: 4.5,
      z: 1,
    });
  });

  await test('Aleph updates: null and primitive payloads are complete no-ops', () => {
    alephUpgrades.resetAlephChainUpgrades();
    alephUpgrades.updateAlephChainUpgrades({ x: 2, y: 3, z: 4 });
    const before = alephUpgrades.getAlephChainUpgrades();
    [null, undefined, false, 0, 'invalid', () => ({ x: 9 })].forEach((payload) => {
      assert.deepEqual(alephUpgrades.updateAlephChainUpgrades(payload), before);
    });
    assert.deepEqual(alephUpgrades.getAlephChainUpgrades(), before);
  });

  await test('Aleph updates: invalid numeric branches retain current values and do not synchronize', () => {
    alephUpgrades.resetAlephChainUpgrades();
    alephUpgrades.updateAlephChainUpgrades({ x: 2, y: 3, z: 4 });
    const calls = [];
    const playfield = {
      alephChain: { setUpgrades: () => calls.push('set') },
      syncAlephChainStats: () => calls.push('sync'),
    };
    const result = alephUpgrades.updateAlephChainUpgrades(
      { x: 0, y: -2, z: Infinity, extra: 99 },
      { playfield },
    );
    assert.deepEqual(result, { x: 2, y: 3, z: 4 });
    assert.deepEqual(calls, []);
  });

  await test('Aleph updates: unchanged valid state is a no-op with no playfield synchronization', () => {
    alephUpgrades.resetAlephChainUpgrades();
    const calls = [];
    const playfield = {
      alephChain: { setUpgrades: () => calls.push('set') },
      syncAlephChainStats: () => calls.push('sync'),
    };
    const result = alephUpgrades.updateAlephChainUpgrades({ x: 1, y: 1, z: 3 }, { playfield });
    assert.deepEqual(result, { x: 1, y: 1, z: 3 });
    assert.notEqual(result, alephUpgrades.alephChainUpgradeState);
    assert.deepEqual(calls, []);
  });

  await test('Aleph updates: changed state synchronizes the live object before refreshing stats', () => {
    alephUpgrades.resetAlephChainUpgrades();
    const calls = [];
    const receivedStates = [];
    const playfield = {
      alephChain: {
        setUpgrades: (state) => {
          calls.push('set');
          receivedStates.push(state);
        },
      },
      syncAlephChainStats: () => calls.push('sync'),
    };
    const result = alephUpgrades.updateAlephChainUpgrades({ x: 5 }, { playfield });
    assert.deepEqual(calls, ['set', 'sync']);
    assert.equal(receivedStates[0], alephUpgrades.alephChainUpgradeState);
    assert.deepEqual(result, { x: 5, y: 1, z: 3 });
    assert.notEqual(result, receivedStates[0]);
  });

  await test('Aleph updates: stats synchronization is nested under a present chain target', () => {
    alephUpgrades.resetAlephChainUpgrades();
    const calls = [];
    const result = alephUpgrades.updateAlephChainUpgrades(
      { y: 6 },
      { playfield: { syncAlephChainStats: () => calls.push('sync') } },
    );
    assert.deepEqual(result, { x: 1, y: 6, z: 3 });
    assert.deepEqual(calls, []);
  });

  await test('Aleph updates: non-function stats hooks are skipped after setUpgrades', () => {
    alephUpgrades.resetAlephChainUpgrades();
    const receivedStates = [];
    const result = alephUpgrades.updateAlephChainUpgrades(
      { x: 7 },
      {
        playfield: {
          alephChain: { setUpgrades: (state) => receivedStates.push(state) },
          syncAlephChainStats: true,
        },
      },
    );
    assert.equal(receivedStates.length, 1);
    assert.deepEqual(result, { x: 7, y: 1, z: 3 });
  });

  await test('Aleph restore: invalid top-level snapshots are no-ops', () => {
    alephUpgrades.resetAlephChainUpgrades();
    alephUpgrades.updateAlephChainUpgrades({ x: 2, y: 3, z: 4 });
    const before = alephUpgrades.getAlephChainUpgrades();
    [null, false, 12, 'invalid'].forEach((snapshot) => {
      assert.deepEqual(alephUpgrades.applyAlephChainUpgradeSnapshot(snapshot), before);
    });
  });

  await test('Aleph restore: partial and legacy-invalid fields retain current normalized values', () => {
    alephUpgrades.resetAlephChainUpgrades();
    alephUpgrades.updateAlephChainUpgrades({ x: 2, y: 3, z: 4 });
    assert.deepEqual(
      alephUpgrades.applyAlephChainUpgradeSnapshot({ x: -1, y: 8.25, z: 2.9 }),
      { x: 2, y: 8.25, z: 2 },
    );
    assert.deepEqual(
      alephUpgrades.applyAlephChainUpgradeSnapshot({ x: NaN, y: Infinity, z: '7' }),
      { x: 2, y: 8.25, z: 2 },
    );
  });

  await test('Aleph restore: object-like arrays retain the original property-normalization behavior', () => {
    alephUpgrades.resetAlephChainUpgrades();
    const legacyArray = [];
    legacyArray.x = 3.5;
    legacyArray.y = 4.5;
    legacyArray.z = 5.9;
    assert.deepEqual(alephUpgrades.applyAlephChainUpgradeSnapshot(legacyArray), {
      x: 3.5,
      y: 4.5,
      z: 5,
    });
  });

  await test('Aleph reset: defaults are restored and playfield synchronization always runs', () => {
    alephUpgrades.updateAlephChainUpgrades({ x: 8, y: 9, z: 10 });
    const calls = [];
    const receivedStates = [];
    const playfield = {
      alephChain: {
        setUpgrades: (state) => {
          calls.push('set');
          receivedStates.push(state);
        },
      },
      syncAlephChainStats: () => calls.push('sync'),
    };
    const first = alephUpgrades.resetAlephChainUpgrades({ playfield });
    const second = alephUpgrades.resetAlephChainUpgrades({ playfield });
    assert.deepEqual(first, { x: 1, y: 1, z: 3 });
    assert.deepEqual(second, { x: 1, y: 1, z: 3 });
    assert.deepEqual(calls, ['set', 'sync', 'set', 'sync']);
    assert.equal(receivedStates[0], alephUpgrades.alephChainUpgradeState);
    assert.equal(receivedStates[1], alephUpgrades.alephChainUpgradeState);
    assert.notEqual(first, alephUpgrades.alephChainUpgradeState);
  });

  // --- assets/towerBlueprintPresenter.js ----------------------------------
  const towerPresenter = await importTowerBlueprintPresenterModule();

  function createTowerPresenterHarness(overrides = {}) {
    const definitions = {
      authored: { symbol: 'definition-symbol', damage: 99, rate: 99 },
      fallback: { symbol: 'F', damage: 6, rate: 1.5 },
      cached: { symbol: 'C', damage: 2, rate: 3 },
      secondary: { symbol: 'S', damage: 4, rate: 2 },
      ...overrides.definitions,
    };
    const dynamicContext = overrides.dynamicContext ?? { marker: 'dynamic-context' };
    const controller = towerPresenter.createTowerBlueprintPresenter({
      getTowerDefinition: (towerId) => definitions[towerId] || null,
      getDynamicContext: overrides.getDynamicContext || (() => dynamicContext),
      formatters: overrides.formatters,
    });
    return { controller, definitions, dynamicContext };
  }

  await test('tower presenter: missing resolver throws the exact construction error', () => {
    assert.throws(
      () => towerPresenter.createTowerBlueprintPresenter(),
      { message: 'createTowerBlueprintPresenter requires getTowerDefinition.' },
    );
    assert.throws(
      () => towerPresenter.createTowerBlueprintPresenter({ getTowerDefinition: true }),
      { message: 'createTowerBlueprintPresenter requires getTowerDefinition.' },
    );
  });

  await test('tower presenter: optional dependencies fall back and missing IDs stay null', () => {
    const controller = towerPresenter.createTowerBlueprintPresenter({
      getTowerDefinition: (towerId) =>
        towerId === 'fallback' ? { symbol: 'F', damage: 4, rate: 2 } : null,
      getDynamicContext: 'invalid',
      formatters: { formatWholeNumber: false, formatDecimal: null },
    });
    assert.equal(controller.getTowerEquationBlueprint(null), null);
    assert.equal(controller.getTowerEquationBlueprint('missing'), null);
    const fallback = controller.getTowerEquationBlueprint('fallback');
    assert.equal(fallback.variables[0].format(null), '0');
    assert.equal(fallback.variables[1].format(undefined), '0');
  });

  await test('tower presenter: authored blueprints take precedence and retain stable identity', () => {
    const { controller } = createTowerPresenterHarness();
    const first = controller.getTowerEquationBlueprint('authored');
    const second = controller.getTowerEquationBlueprint('authored');
    assert.equal(first, second);
    assert.equal(first.mathSymbol, 'A');
    assert.equal(first.baseEquation, 'A = authored');
  });

  await test('tower presenter: fallback blueprints preserve exact fields, math, formatting, and cache identity', () => {
    const formatCalls = [];
    const { controller } = createTowerPresenterHarness({
      formatters: {
        formatWholeNumber: (value) => {
          formatCalls.push(['whole', value]);
          return `whole:${value}`;
        },
        formatDecimal: (value, digits) => {
          formatCalls.push(['decimal', value, digits]);
          return `decimal:${value}:${digits}`;
        },
      },
    });
    const first = controller.getTowerEquationBlueprint('fallback');
    const second = controller.getTowerEquationBlueprint('fallback');
    assert.equal(first, second);
    assert.equal(first.mathSymbol, 'F');
    assert.equal(first.baseEquation, '\\( F = X \\times Y \\)');
    assert.deepEqual(first.variables.map(({ key, symbol, stat, upgradable }) => ({ key, symbol, stat, upgradable })), [
      { key: 'damage', symbol: 'X', stat: 'damage', upgradable: false },
      { key: 'rate', symbol: 'Y', stat: 'rate', upgradable: false },
    ]);
    assert.equal(first.variables[0].format(6), 'whole:6');
    assert.equal(first.variables[1].format(1.5), 'decimal:1.5:2');
    assert.deepEqual(formatCalls, [['whole', 6], ['decimal', 1.5, 2]]);
    assert.equal(first.computeResult({ damage: 6, rate: 1.5 }), 9);
    assert.equal(first.computeResult({ damage: Infinity, rate: 2 }), 0);
    assert.equal(
      first.formatGoldenEquation({ formatResult: () => '9', formatVariable: (key) => key }),
      '\\( 9 = damage \\times rate \\)',
    );
  });

  await test('tower presenter: state initialization is lazy, stable, and preserves legacy variables', () => {
    const { controller } = createTowerPresenterHarness();
    const empty = controller.ensureTowerUpgradeState('');
    assert.deepEqual(empty, { variables: {} });
    assert.deepEqual(controller.getTowerUpgradeStateSnapshot(), {});
    const first = controller.ensureTowerUpgradeState('authored');
    first.variables.legacy = { level: 7 };
    const second = controller.ensureTowerUpgradeState('authored');
    assert.equal(first, second);
    assert.deepEqual(second.variables, { power: { level: 0 }, legacy: { level: 7 } });
  });

  await test('tower presenter: snapshots preserve inclusion, clamping, fractional, and omission behavior', () => {
    const { controller } = createTowerPresenterHarness();
    const authored = controller.ensureTowerUpgradeState('authored');
    authored.variables.power.level = -2.5;
    authored.variables.fractional = { level: 2.75 };
    authored.variables.invalid = { level: NaN };
    controller.ensureTowerUpgradeState('missing');
    assert.deepEqual(controller.getTowerUpgradeStateSnapshot(), {
      authored: {
        variables: {
          power: { level: 0 },
          fractional: { level: 2.75 },
        },
      },
    });
  });

  await test('tower presenter: invalid restore payloads and invalid tower branches are no-ops', () => {
    const { controller } = createTowerPresenterHarness();
    [null, undefined, false, 12, 'invalid'].forEach((snapshot) => {
      controller.applyTowerUpgradeStateSnapshot(snapshot);
    });
    controller.applyTowerUpgradeStateSnapshot({ authored: null, fallback: { variables: 3 } });
    assert.deepEqual(controller.getTowerUpgradeStateSnapshot(), {});
  });

  await test('tower presenter: restore merges positive levels and retains zero, negative, and existing state', () => {
    const { controller } = createTowerPresenterHarness();
    const state = controller.ensureTowerUpgradeState('authored');
    state.variables.power.level = 4;
    state.variables.retained = { level: 6 };
    controller.applyTowerUpgradeStateSnapshot({
      authored: {
        variables: {
          power: { level: 0 },
          negative: { level: -3 },
          fractional: { level: 2.5 },
          unknown: { level: 8 },
          invalid: { level: '9' },
        },
      },
    });
    assert.deepEqual(controller.getTowerUpgradeStateSnapshot().authored.variables, {
      power: { level: 4 },
      retained: { level: 6 },
      fractional: { level: 2.5 },
      unknown: { level: 8 },
    });
  });

  await test('tower presenter: upgrade costs preserve function, numeric, invalid, floor, and minimum branches', () => {
    const { controller } = createTowerPresenterHarness();
    assert.equal(controller.calculateTowerVariableUpgradeCost(null, 4), 1);
    assert.equal(controller.calculateTowerVariableUpgradeCost({ key: 'a', cost: () => 4.9 }, 0), 4);
    assert.equal(controller.calculateTowerVariableUpgradeCost({ key: 'a', cost: () => 0.2 }, 3), 1);
    assert.equal(controller.calculateTowerVariableUpgradeCost({ key: 'a', cost: () => NaN }, 2), 3);
    assert.equal(controller.calculateTowerVariableUpgradeCost({ key: 'a', cost: 3.8 }, 0), 3);
    assert.equal(controller.calculateTowerVariableUpgradeCost({ key: 'a', cost: -5 }, 2), 1);
  });

  await test('tower presenter: invested glyph totals preserve multi-variable and fractional iteration behavior', () => {
    const { controller } = createTowerPresenterHarness();
    const authored = controller.ensureTowerUpgradeState('authored');
    authored.variables.power.level = 2.5;
    const fallback = controller.ensureTowerUpgradeState('fallback');
    fallback.variables.legacy = { level: 2 };
    assert.equal(controller.calculateInvestedGlyphs(), 8);
  });

  await test('tower presenter: references preserve direct, transform, exponent, and normalized non-finite behavior', () => {
    const { controller } = createTowerPresenterHarness();
    assert.equal(controller.computeTowerVariableValue('exponentReference', 'linked'), 16);
    assert.equal(controller.computeTowerVariableValue('transformedReference', 'linked'), 9);
    assert.equal(controller.computeTowerVariableValue('invalidReference', 'linked'), 0);
  });

  await test('tower presenter: custom computeValue receives context and takes precedence over base branches', () => {
    const { controller, dynamicContext } = createTowerPresenterHarness();
    let received = null;
    const blueprint = {
      variables: [{
        key: 'custom',
        stat: 'damage',
        baseValue: 2,
        computeValue: (context) => {
          received = context;
          return 11;
        },
      }],
    };
    assert.equal(controller.computeTowerVariableValue('fallback', 'custom', blueprint), 11);
    assert.equal(received.dynamicContext, dynamicContext);
    assert.equal(received.definition.damage, 6);
    assert.equal(received.blueprint, blueprint);
  });

  await test('tower presenter: thrown computeValue warns and falls through to base evaluation', () => {
    const { controller } = createTowerPresenterHarness();
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (...args) => warnings.push(args);
    try {
      const blueprint = {
        variables: [{ key: 'custom', baseValue: 7, computeValue: () => { throw new Error('boom'); } }],
      };
      assert.equal(controller.computeTowerVariableValue('fallback', 'custom', blueprint), 7);
    } finally {
      console.warn = originalWarn;
    }
    assert.equal(warnings.length, 1);
    assert.equal(warnings[0][0], 'Failed to evaluate custom tower variable computeValue');
  });

  await test('tower presenter: getBase, definition stat, static base, and invalid base precedence are preserved', () => {
    const { controller } = createTowerPresenterHarness();
    assert.equal(controller.computeTowerVariableValue('fallback', 'v', {
      variables: [{ key: 'v', getBase: () => 7, stat: 'damage', baseValue: 2, upgradable: false }],
    }), 7);
    assert.equal(controller.computeTowerVariableValue('fallback', 'v', {
      variables: [{ key: 'v', stat: 'damage', baseValue: 2, upgradable: false }],
    }), 6);
    assert.equal(controller.computeTowerVariableValue('fallback', 'v', {
      variables: [{ key: 'v', baseValue: 2, upgradable: false }],
    }), 2);
    assert.equal(controller.computeTowerVariableValue('fallback', 'v', {
      variables: [{ key: 'v', getBase: () => NaN, stat: 'damage', baseValue: 2, upgradable: false }],
    }), 0);
  });

  await test('tower presenter: non-upgradable, function step, static step, and missing step behavior is preserved', () => {
    const { controller } = createTowerPresenterHarness();
    const blueprint = {
      variables: [
        { key: 'locked', baseValue: 3, step: 100, upgradable: false },
        { key: 'function', baseValue: 1, getStep: (level) => level + 1 },
        { key: 'static', baseValue: 2, step: 1.5 },
        { key: 'missing', baseValue: 4 },
      ],
    };
    const state = controller.ensureTowerUpgradeState('custom', blueprint);
    Object.values(state.variables).forEach((variableState) => { variableState.level = 2; });
    assert.equal(controller.computeTowerVariableValue('custom', 'locked', blueprint), 3);
    assert.equal(controller.computeTowerVariableValue('custom', 'function', blueprint), 7);
    assert.equal(controller.computeTowerVariableValue('custom', 'static', blueprint), 5);
    assert.equal(controller.computeTowerVariableValue('custom', 'missing', blueprint), 4);
  });

  await test('tower presenter: custom, fallback aggregate, and non-finite equation results normalize exactly', () => {
    const { controller } = createTowerPresenterHarness();
    assert.equal(controller.calculateTowerEquationResult('authored'), 3);
    assert.equal(controller.calculateTowerEquationResult('aggregate'), 0);
    assert.equal(controller.calculateTowerEquationResult('nonFiniteResult'), 0);
    assert.equal(controller.calculateTowerEquationResult('missing'), 0);
  });

  await test('tower presenter: recursive references return zero without poisoning future cache results', () => {
    const { controller } = createTowerPresenterHarness();
    assert.equal(controller.calculateTowerEquationResult('recursiveA'), 0);
    controller.invalidateTowerEquationCache();
    assert.equal(controller.calculateTowerEquationResult('source'), 4);
  });

  await test('tower presenter: cache reuse and explicit invalidation preserve their timing', () => {
    const { controller, definitions } = createTowerPresenterHarness();
    assert.equal(controller.calculateTowerEquationResult('cached'), 6);
    definitions.cached.damage = 10;
    assert.equal(controller.calculateTowerEquationResult('cached'), 6);
    controller.invalidateTowerEquationCache();
    assert.equal(controller.calculateTowerEquationResult('cached'), 30);
  });

  await test('tower presenter: targeted clear trims the id, preserves other state, and invalidates all cached math', () => {
    const { controller, definitions } = createTowerPresenterHarness();
    controller.ensureTowerUpgradeState('authored').variables.power.level = 2;
    controller.ensureTowerUpgradeState('secondary').variables.legacy = { level: 3 };
    assert.equal(controller.calculateTowerEquationResult('cached'), 6);
    definitions.cached.rate = 5;
    controller.clearTowerUpgradeState(' authored ');
    assert.equal(controller.getTowerUpgradeStateSnapshot().authored, undefined);
    assert.deepEqual(controller.getTowerUpgradeStateSnapshot().secondary, {
      variables: {
        damage: { level: 0 },
        rate: { level: 0 },
        legacy: { level: 3 },
      },
    });
    assert.equal(controller.calculateTowerEquationResult('cached'), 10);
  });

  await test('tower presenter: blank or omitted clear targets reset every state entry and cache', () => {
    const { controller } = createTowerPresenterHarness();
    controller.ensureTowerUpgradeState('authored').variables.power.level = 2;
    controller.ensureTowerUpgradeState('fallback').variables.damage.level = 1;
    controller.clearTowerUpgradeState('   ');
    assert.deepEqual(controller.getTowerUpgradeStateSnapshot(), {});
    controller.ensureTowerUpgradeState('authored').variables.power.level = 1;
    controller.clearTowerUpgradeState();
    assert.deepEqual(controller.getTowerUpgradeStateSnapshot(), {});
  });

  // --- assets/towerEquations/mindGate.js ---------------------------------
  await test('Mind Gate equation: authored metadata and variable order remain exact', async () => {
    const { mindGate } = await importMindGateEquationModule();
    assert.equal(mindGate.mathSymbol, String.raw`\mathfrak{G}`);
    assert.equal(
      mindGate.baseEquation,
      String.raw`\( \mathfrak{G} = \text{Life} \times \text{Regeneration} \)`,
    );
    assert.deepEqual(
      mindGate.variables.map(({ key, symbol, name, masterEquationSymbol, description, baseValue, step, upgradable }) => ({
        key, symbol, name, masterEquationSymbol, description, baseValue, step, upgradable,
      })),
      [
        {
          key: 'life', symbol: 'Life', name: 'Life', masterEquationSymbol: 'Life',
          description: 'Glyph lifeforce braided into the Mind Gate core.',
          baseValue: 1, step: 1, upgradable: true,
        },
        {
          key: 'recovery', symbol: 'Reg', name: 'Regeneration', masterEquationSymbol: 'Reg',
          description: 'Restorative glyph cadence that rethreads the gate between waves.',
          baseValue: 2, step: 1, upgradable: true,
        },
      ],
    );
  });

  await test('Mind Gate equation: formatting and upgrade costs preserve input behavior', async () => {
    const { mindGate, formatCalls } = await importMindGateEquationModule();
    const [life, recovery] = mindGate.variables;
    assert.equal(life.format(2.5), 'whole:2.5 ℵ₁');
    assert.equal(recovery.format(-3), 'whole:-3 ℵ₂');
    assert.deepEqual(formatCalls, [2.5, -3]);
    assert.deepEqual([-4, 0, 2.5].map(life.cost), [1, 1, 3.5]);
    assert.deepEqual([-4, 0, 2.5].map(recovery.cost), [1, 2, 4.5]);
  });

  await test('Mind Gate equation: life sub-equations preserve clamping, defaults, and formatting order', async () => {
    const { mindGate, formatCalls } = await importMindGateEquationModule();
    const life = mindGate.variables[0];
    assert.deepEqual(life.getSubEquations({ level: -2.5, value: 3.75 }), [
      { expression: String.raw`\( \text{Life} = 100^{\aleph_{1} / \aleph_{2}} \)` },
      {
        values: String.raw`\( whole:3.75 = 1 + whole:0 \)`,
        variant: 'values',
        glyphEquation: true,
      },
    ]);
    assert.deepEqual(formatCalls, [3.75, 0]);
    formatCalls.length = 0;
    life.getSubEquations({ level: NaN, value: Infinity });
    assert.deepEqual(formatCalls, [1, 0]);
  });

  await test('Mind Gate equation: recovery sub-equations preserve clamping, defaults, and formatting order', async () => {
    const { mindGate, formatCalls } = await importMindGateEquationModule();
    const recovery = mindGate.variables[1];
    assert.deepEqual(recovery.getSubEquations({ level: 1.25, value: -7 }), [
      { expression: String.raw`\( \text{Reg} = \frac{100 \times \aleph_{2}}{\aleph_{1}} \)` },
      {
        values: String.raw`\( whole:1 = 2 + whole:1.25 \)`,
        variant: 'values',
        glyphEquation: true,
      },
    ]);
    assert.deepEqual(formatCalls, [1, 1.25]);
    formatCalls.length = 0;
    recovery.getSubEquations({ level: Infinity, value: NaN });
    assert.deepEqual(formatCalls, [2, 0]);
  });

  await test('Mind Gate equation: result fallbacks and golden callback order remain exact', async () => {
    const { mindGate } = await importMindGateEquationModule();
    assert.equal(mindGate.computeResult({ life: 2.5, recovery: 4 }), 10);
    assert.equal(mindGate.computeResult({ life: -2, recovery: 0 }), 1);
    assert.equal(mindGate.computeResult({ life: '3', recovery: Infinity }), 1);
    const calls = [];
    const golden = mindGate.formatGoldenEquation({
      formatResult() { calls.push('result'); return 'R'; },
      formatVariable(key) { calls.push(key); return key.toUpperCase(); },
    });
    assert.equal(golden, String.raw`\( R = LIFE \times RECOVERY \)`);
    assert.deepEqual(calls, ['result', 'life', 'recovery']);
  });

  // --- assets/towerEquations/shadowGate.js -------------------------------
  await test('Shadow Gate equation: authored metadata and passive outputs remain exact', async () => {
    const { shadowGate } = await importShadowGateEquationModule();
    assert.equal(shadowGate.mathSymbol, String.raw`\wp`);
    assert.equal(shadowGate.baseEquation, String.raw`\( \wp = x \)`);
    assert.equal(shadowGate.variables.length, 1);
    assert.equal(shadowGate.variables[0].key, 'enemies');
    assert.equal(shadowGate.variables[0].symbol, 'x');
    assert.equal(shadowGate.variables[0].upgradable, false);
    assert.equal(shadowGate.computeResult(), 0);
    assert.equal(shadowGate.formatGoldenEquation(), String.raw`\( \wp = x \)`);
  });

  await test('Shadow Gate equation: dynamic name preserves Set and Codex lookup order', async () => {
    const { shadowGate, codexState, codexEntries, lookupCalls } =
      await importShadowGateEquationModule();
    codexState.encounteredEnemies.add('prime');
    codexState.encounteredEnemies.add('divisor');
    codexState.encounteredEnemies.add('prime');
    codexEntries.set('prime', { symbol: 'ℙ' });
    codexEntries.set('divisor', { symbol: '𝔻' });
    assert.equal(shadowGate.variables[0].name, 'ℙ, 𝔻');
    assert.deepEqual(lookupCalls, ['prime', 'divisor']);
  });

  await test('Shadow Gate equation: every name read uses current entries and filters falsey symbols', async () => {
    const { shadowGate, codexState, codexEntries, lookupCalls } =
      await importShadowGateEquationModule();
    for (const id of ['missing', 'blank', 'zero', 'valid']) {
      codexState.encounteredEnemies.add(id);
    }
    codexEntries.set('blank', { symbol: '' });
    codexEntries.set('zero', { symbol: 0 });
    codexEntries.set('valid', { symbol: 'V' });
    assert.equal(shadowGate.variables[0].name, 'V');
    codexEntries.set('missing', { symbol: 'M' });
    codexEntries.set('valid', { symbol: 'V2' });
    assert.equal(shadowGate.variables[0].name, 'M, V2');
    assert.deepEqual(lookupCalls, [
      'missing', 'blank', 'zero', 'valid',
      'missing', 'blank', 'zero', 'valid',
    ]);
  });

  // --- assets/towerEquations/advancedTowers.js ---------------------------
  await test('advanced equation barrel: exact exports preserve every source identity', async () => {
    const { barrelModule, exportNames, advancedDir } =
      await importAdvancedEquationBarrelModule();
    assert.deepEqual(Object.keys(barrelModule).sort(), [...exportNames].sort());
    for (const exportName of exportNames) {
      const sourceModule = await import(
        pathToFileURL(path.join(advancedDir, `${exportName}Equation.js`)).href
      );
      assert.equal(barrelModule[exportName], sourceModule[exportName]);
    }
  });

  // --- assets/towerEquations/advanced/sigmaEquation.js ------------------
  await test('Sigma equation: metadata, variable order, and dynamic stat precedence remain exact', async () => {
    const { equation: sigma } = await importAdvancedEquationModule('sigma');
    assert.equal(sigma.mathSymbol, String.raw`\sigma`);
    assert.equal(sigma.baseEquation, String.raw`\( \sigma = \text{stored} \)`);
    assert.deepEqual(sigma.variables.map((variable) => variable.key), [
      'storedDamage',
      'totalAbsorbed',
    ]);
    const [stored, absorbed] = sigma.variables;
    assert.equal(stored.computeValue({ dynamicContext: {
      stats: { storedDamage: '12.5', sigmaStoredDamage: 99 },
    } }), 12.5);
    assert.equal(stored.computeValue({ dynamicContext: {
      stats: { storedDamage: null, sigmaStoredDamage: '8' },
    } }), 8);
    assert.equal(stored.computeValue({ dynamicContext: {
      stats: { storedDamage: 0, sigmaStoredDamage: 9 },
    } }), 0);
    assert.equal(absorbed.computeValue({ dynamicContext: {
      stats: { sigmaTotalAbsorbed: '21' },
    } }), 21);
    for (const rawValue of [-1, Infinity, 'invalid', undefined]) {
      assert.equal(stored.computeValue({ dynamicContext: {
        stats: { storedDamage: rawValue },
      } }), 0);
    }
  });

  await test('Sigma equation: stored sub-equations preserve prestige and optional release branches', async () => {
    const { equation: sigma } = await importAdvancedEquationModule('sigma');
    const calls = [];
    const formatGame = (value) => {
      calls.push(value);
      return `fmt:${value}`;
    };
    assert.deepEqual(sigma.variables[0].getSubEquations({
      value: NaN,
      dynamicContext: { prestige: true, stats: { lastRelease: '4.5' } },
      formatGameNumber: formatGame,
    }), [
      { expression: String.raw`\( \text{stored} = \sum \text{ally dmg} \)` },
      { expression: String.raw`\( \text{stored} \le 10^{120} \)` },
      { values: String.raw`\( fmt:0\,\text{dmg} \)`, variant: 'values' },
      { expression: String.raw`\( \text{shot}_{\sigma} = \text{stored} \)` },
      { expression: String.raw`\( \text{stored}_{\text{next}} = \text{stored} \)` },
      { values: String.raw`\( \text{last shot} = fmt:4.5\,\text{dmg} \)`, variant: 'values' },
    ]);
    assert.deepEqual(calls, [0, 4.5]);
    calls.length = 0;
    const nonPrestige = sigma.variables[0].getSubEquations({
      value: -3,
      dynamicContext: { prestige: 1, stats: { lastRelease: 0 } },
      formatGameNumber: formatGame,
    });
    assert.equal(nonPrestige.length, 5);
    assert.deepEqual(nonPrestige[4], {
      expression: String.raw`\( \text{stored}_{\text{next}} = 0 \)`,
    });
    assert.deepEqual(calls, [0]);
  });

  await test('Sigma equation: absorption lines and imported value formatting preserve fallbacks', async () => {
    const { equation: sigma, formatCalls } = await importAdvancedEquationModule('sigma');
    assert.equal(sigma.variables[0].format(-2), 'game:0 dmg');
    assert.equal(sigma.variables[1].format(7), 'game:7 dmg');
    assert.deepEqual(formatCalls, [['game', 0], ['game', 7]]);
    const calls = [];
    const lines = sigma.variables[1].getSubEquations({
      value: Infinity,
      formatGameNumber(value) {
        calls.push(value);
        return `fmt:${value}`;
      },
    });
    assert.deepEqual(lines, [
      { expression: String.raw`\( \text{absorbed} = \sum \text{ally dmg} \)` },
      { values: String.raw`\( fmt:0\,\text{dmg} \)`, variant: 'values' },
      { expression: String.raw`\( \text{absorbed} \ge \text{stored} \)` },
    ]);
    assert.deepEqual(calls, [0]);
  });

  await test('Sigma equation: result and base-value formatting retain number-only finite acceptance', async () => {
    const { equation: sigma } = await importAdvancedEquationModule('sigma');
    assert.equal(sigma.computeResult({ storedDamage: 9 }), 9);
    assert.equal(sigma.computeResult({ storedDamage: -4 }), 0);
    assert.equal(sigma.computeResult({ storedDamage: '9' }), 0);
    assert.equal(sigma.computeResult({ storedDamage: Infinity }), 0);
    const calls = [];
    const output = sigma.formatBaseEquationValues({
      values: { storedDamage: 6 },
      result: 6,
      formatComponent(value) {
        calls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output, 'component:6 = component:6');
    assert.deepEqual(calls, [6, 6]);
  });

  // --- assets/towerEquations/advanced/phiEquation.js --------------------
  await test('Phi equation: exact Fibonacci metadata and constants remain exposed', async () => {
    const { equation: phi } = await importAdvancedEquationModule('phi');
    assert.equal(phi.mathSymbol, String.raw`\phi`);
    assert.equal(
      phi.baseEquation,
      String.raw`\( \phi = \text{seeds} \times \text{dmg}_{\text{seed}} \times \text{pierce} \)`,
    );
    assert.deepEqual(phi.variables.map(({ key, baseValue, upgradable, includeInMasterEquation }) => ({
      key, baseValue, upgradable, includeInMasterEquation,
    })), [
      { key: 'seeds', baseValue: 32, upgradable: false, includeInMasterEquation: true },
      { key: 'seedDamage', baseValue: 10, upgradable: false, includeInMasterEquation: true },
      { key: 'pierce', baseValue: 2, upgradable: false, includeInMasterEquation: true },
      { key: 'goldenAngle', baseValue: 137.5, upgradable: false, includeInMasterEquation: false },
    ]);
  });

  await test('Phi equation: four variable equation builders preserve defaults and formatter order', async () => {
    const { equation: phi, formatCalls } = await importAdvancedEquationModule('phi');
    const [seeds, seedDamage, pierce, goldenAngle] = phi.variables;
    assert.deepEqual(seeds.getSubEquations(), [
      { expression: String.raw`\( \text{seeds} = 1 + 2 + 3 + 5 + 8 + 13 \)` },
      { values: String.raw`\( whole:32 = \sum_{k=1}^{6} F_k \)`, variant: 'values' },
    ]);
    seedDamage.getSubEquations({ value: NaN });
    pierce.getSubEquations({ value: NaN });
    goldenAngle.getSubEquations({ value: NaN });
    assert.deepEqual(formatCalls, [
      ['whole', 32],
      ['game', 10], ['game', 10],
      ['whole', 2], ['whole', 2],
      ['decimal', 137.5, 2], ['decimal', 1.61803398875, 3],
    ]);
  });

  await test('Phi equation: coercive result math and base-equation callback order remain exact', async () => {
    const { equation: phi } = await importAdvancedEquationModule('phi');
    assert.equal(phi.computeResult({ seeds: '32', seedDamage: '10', pierce: '2' }), 640);
    assert.equal(Number.isNaN(
      phi.computeResult({ seeds: -1, seedDamage: Infinity, pierce: 0 }),
    ), true);
    const calls = [];
    const output = phi.formatBaseEquationValues({
      values: { seeds: '3', seedDamage: '4', pierce: '2' },
      result: 24,
      formatComponent(value) {
        calls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output, 'component:24 = component:3 × component:4 × component:2');
    assert.deepEqual(calls, [24, 3, 4, 2]);
  });

  // --- assets/towerEquations/advanced/upsilonEquation.js ----------------
  await test('Upsilon equation: metadata, upgrade order, and rounded cost curves remain exact', async () => {
    const { equation: upsilon } = await importAdvancedEquationModule('upsilon');
    assert.equal(upsilon.mathSymbol, String.raw`\upsilon`);
    assert.deepEqual(upsilon.variables.map(({ key, baseValue, step, glyphLabel }) => ({
      key, baseValue, step, glyphLabel,
    })), [
      { key: 'attack', baseValue: 1200, step: 260, glyphLabel: 'ℵ₁' },
      { key: 'production', baseValue: 0.4, step: 0.08, glyphLabel: 'ℵ₂' },
      { key: 'fleet', baseValue: 4, step: 1, glyphLabel: 'ℵ₃' },
      { key: 'velocity', baseValue: 1.6, step: 0.18, glyphLabel: 'ℵ₄' },
    ]);
    assert.deepEqual(upsilon.variables.map((variable) => variable.cost(2.9)), [
      457, 314, 344, 274,
    ]);
    assert.deepEqual(upsilon.variables.map((variable) => variable.cost(-5)), [
      240, 180, 210, 170,
    ]);
  });

  await test('Upsilon equation: variable formulas preserve finite defaults, clamping, and formatting', async () => {
    const { equation: upsilon, formatCalls } = await importAdvancedEquationModule('upsilon');
    const [attack, production, fleet, velocity] = upsilon.variables;
    assert.deepEqual(attack.getSubEquations({ value: 1720 }), [
      { expression: String.raw`\( atk = 1200 + 260 \times \aleph_{1} \)` },
      { values: String.raw`\( game:1720 = 1200 + 260 \times whole:2 \)` },
    ]);
    production.getSubEquations({ value: NaN });
    fleet.getSubEquations({ value: NaN });
    velocity.getSubEquations({ value: NaN });
    assert.deepEqual(formatCalls, [
      ['game', 1720], ['whole', 2],
      ['decimal', 0.4, 2], ['whole', 0],
      ['whole', 4], ['whole', 0],
      ['decimal', 1.6, 2], ['whole', 0],
    ]);
  });

  await test('Upsilon equation: fleet result coercion and mixed base formatting remain exact', async () => {
    const { equation: upsilon, formatCalls } = await importAdvancedEquationModule('upsilon');
    assert.equal(upsilon.computeResult({ attack: '100', production: '0.5', fleet: '4' }), 200);
    assert.equal(Number.isNaN(
      upsilon.computeResult({ attack: -2, production: Infinity, fleet: 0 }),
    ), true);
    const calls = [];
    const output = upsilon.formatBaseEquationValues({
      values: { attack: '100', production: '0.5', fleet: '4' },
      result: 200,
      formatComponent(value) {
        calls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output, 'component:200 = component:100 × decimal:0.5:2 × whole:4');
    assert.deepEqual(calls, [200, 100]);
    assert.deepEqual(formatCalls, [['decimal', 0.5, 2], ['whole', 4]]);
  });

  // --- assets/towerEquations/advanced/tauEquation.js --------------------
  await test('Tau equation: Gamma context lookup preserves callback count and finite fallback', async () => {
    const { equation: tau, blueprintContext, formatCalls } =
      await importAdvancedEquationModule('tau');
    const calls = [];
    blueprintContext.calculateTowerEquationResult = (towerId) => {
      calls.push(towerId);
      return 9;
    };
    assert.deepEqual(tau.variables[0].getSubEquations(), [
      { expression: String.raw`\( \text{atk} = \gamma \)` },
      { values: String.raw`\( game:9 = \gamma \)` },
    ]);
    assert.deepEqual(calls, ['gamma', 'gamma']);
    assert.equal(tau.variables[0].computeValue(), 9);
    assert.deepEqual(calls, ['gamma', 'gamma', 'gamma']);
    blueprintContext.calculateTowerEquationResult = () => NaN;
    assert.equal(tau.variables[0].computeValue(), 0);
    assert.deepEqual(formatCalls, [['game', 9]]);
  });

  await test('Tau equation: exact metadata and fixed-turn behavior remain exposed', async () => {
    const { equation: tau } = await importAdvancedEquationModule('tau');
    assert.equal(tau.mathSymbol, String.raw`\tau`);
    assert.equal(tau.baseEquation, String.raw`\( \tau = \text{atk} \times p \)`);
    assert.deepEqual(tau.variables.map((variable) => variable.key), [
      'attack', 'aleph1', 'aleph2', 'aleph3', 'turns',
    ]);
    assert.equal(tau.variables[4].computeValue(), 2);
    assert.deepEqual(tau.variables[4].getSubEquations(), [
      { expression: String.raw`\( \theta(u) = 2\pi \times \text{turns} \times u \)` },
    ]);
  });

  await test('Tau equation: three Aleph sub-equations preserve clamping and formatter order', async () => {
    const { equation: tau, formatCalls } = await importAdvancedEquationModule('tau');
    const [, radius, speed, particles] = tau.variables;
    radius.getSubEquations({ value: -2 });
    speed.getSubEquations({ value: 3 });
    particles.getSubEquations({ value: 2.9 });
    assert.deepEqual(formatCalls, [
      ['decimal', 1, 2], ['decimal', 0, 2],
      ['decimal', 1.3, 2], ['whole', 3],
      ['whole', 3], ['whole', 2.9],
    ]);
  });

  await test('Tau equation: particle result coercion and base formatting remain exact', async () => {
    const { equation: tau, formatCalls } = await importAdvancedEquationModule('tau');
    assert.equal(tau.computeResult({ attack: '4', aleph3: '2.9' }), 12);
    assert.equal(tau.computeResult({ attack: -4, aleph3: -9 }), 0);
    const calls = [];
    const output = tau.formatBaseEquationValues({
      values: { attack: '4', aleph3: '2.9' },
      result: 12,
      formatComponent(value) {
        calls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output, 'component:12 = component:4 × whole:3');
    assert.deepEqual(calls, [12, 4]);
    assert.deepEqual(formatCalls, [['whole', 3]]);
  });

  // --- assets/towerEquations/index.js ------------------------------------
  await test('tower equation index: registry preserves all 27 keys, order, and imported identities', async () => {
    const { registryModule, sourceById } = await importTowerEquationIndexModule();
    const expectedIds = [
      'mind-gate', 'shadow-gate', 'alpha', 'beta', 'gamma', 'delta', 'epsilon',
      'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'zeta', 'nu', 'xi',
      'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi',
      'omega', 'infinity',
    ];
    assert.deepEqual(Object.keys(registryModule.TOWER_EQUATION_BLUEPRINTS), expectedIds);
    for (const towerId of expectedIds) {
      assert.equal(registryModule.TOWER_EQUATION_BLUEPRINTS[towerId], sourceById[towerId]);
    }
    assert.equal(Object.isFrozen(registryModule.TOWER_EQUATION_BLUEPRINTS), false);
    assert.equal(Object.isSealed(registryModule.TOWER_EQUATION_BLUEPRINTS), false);
  });

  await test('tower equation index: canonical and mutable own-key lookups preserve identity', async () => {
    const { registryModule, sourceById } = await importTowerEquationIndexModule();
    for (const [towerId, blueprint] of Object.entries(sourceById)) {
      assert.equal(registryModule.getTowerEquationBlueprint(towerId), blueprint);
    }
    const added = { added: true };
    registryModule.TOWER_EQUATION_BLUEPRINTS.custom = added;
    assert.equal(registryModule.getTowerEquationBlueprint('custom'), added);
    registryModule.TOWER_EQUATION_BLUEPRINTS.alpha = null;
    assert.equal(registryModule.getTowerEquationBlueprint('alpha'), null);
  });

  await test('tower equation index: falsy and unknown primitive lookups retain exact fallbacks', async () => {
    const { registryModule } = await importTowerEquationIndexModule();
    for (const towerId of [undefined, null, '', 0, -0, false, NaN]) {
      assert.equal(registryModule.getTowerEquationBlueprint(towerId), null);
    }
    for (const towerId of ['missing', 1, 1n, true, Symbol('missing')]) {
      assert.equal(registryModule.getTowerEquationBlueprint(towerId), null);
    }
    const symbolId = Symbol('custom');
    const symbolBlueprint = { symbol: true };
    registryModule.TOWER_EQUATION_BLUEPRINTS[symbolId] = symbolBlueprint;
    assert.equal(registryModule.getTowerEquationBlueprint(symbolId), symbolBlueprint);
  });

  await test('tower equation index: inherited and coercible keys preserve bracket-access behavior', async () => {
    const { registryModule, sourceById } = await importTowerEquationIndexModule();
    assert.equal(
      registryModule.getTowerEquationBlueprint('toString'),
      Object.prototype.toString,
    );
    assert.equal(registryModule.getTowerEquationBlueprint(['beta']), sourceById.beta);
    assert.equal(
      registryModule.getTowerEquationBlueprint({ toString: () => 'alpha' }),
      sourceById.alpha,
    );
    const expectedError = new Error('property coercion failed');
    const throwingKey = {
      [Symbol.toPrimitive]() {
        throw expectedError;
      },
    };
    assert.throws(
      () => registryModule.getTowerEquationBlueprint(throwingKey),
      (error) => error === expectedError,
    );
  });

  // --- assets/towerEquations/blueprintContext.js -------------------------
  await test('blueprint context: initial export owns seven mutable null helper slots', async () => {
    const { blueprintContext } = await importBlueprintContextModule();
    const expectedKeys = [
      'deriveGlyphRankFromLevel',
      'getTowerEquationBlueprint',
      'ensureTowerUpgradeState',
      'calculateTowerEquationResult',
      'getDynamicConnectionCount',
      'getTowerDefinition',
      'computeTowerVariableValue',
    ].sort();
    assert.deepEqual(Object.keys(blueprintContext).sort(), expectedKeys);
    for (const key of expectedKeys) {
      assert.equal(blueprintContext[key], null);
      assert.equal(Object.hasOwn(blueprintContext, key), true);
    }
    assert.equal(Object.isFrozen(blueprintContext), false);
    assert.equal(Object.isSealed(blueprintContext), false);
    blueprintContext.mutableProbe = true;
    assert.equal(blueprintContext.mutableProbe, true);
  });

  await test('blueprint context: partial and repeated initialization retain object and value identity', async () => {
    const module = await importBlueprintContextModule();
    const retained = module.blueprintContext;
    const firstHelper = () => 1;
    const secondHelper = () => 2;
    const marker = { live: true };
    const source = Object.freeze({ deriveGlyphRankFromLevel: firstHelper, marker });
    assert.equal(module.initializeBlueprintContext(source), undefined);
    assert.equal(module.blueprintContext, retained);
    assert.equal(retained.deriveGlyphRankFromLevel, firstHelper);
    assert.equal(retained.marker, marker);
    assert.equal(retained.getTowerEquationBlueprint, null);
    assert.equal(module.initializeBlueprintContext({ deriveGlyphRankFromLevel: secondHelper }), undefined);
    assert.equal(module.blueprintContext, retained);
    assert.equal(retained.deriveGlyphRankFromLevel, secondHelper);
    assert.deepEqual(source, { deriveGlyphRankFromLevel: firstHelper, marker });
  });

  await test('blueprint context: omitted, null, undefined, and empty sources are no-ops', async () => {
    const module = await importBlueprintContextModule();
    const before = { ...module.blueprintContext };
    assert.equal(module.initializeBlueprintContext(), undefined);
    assert.equal(module.initializeBlueprintContext(undefined), undefined);
    assert.equal(module.initializeBlueprintContext(null), undefined);
    assert.equal(module.initializeBlueprintContext({}), undefined);
    assert.deepEqual(module.blueprintContext, before);
  });

  await test('blueprint context: primitive and array sources keep native Object.assign behavior', async () => {
    const module = await importBlueprintContextModule();
    assert.equal(module.initializeBlueprintContext(42), undefined);
    assert.equal(module.initializeBlueprintContext(true), undefined);
    assert.equal(Object.hasOwn(module.blueprintContext, '0'), false);
    assert.equal(module.initializeBlueprintContext('ab'), undefined);
    assert.equal(module.blueprintContext[0], 'a');
    assert.equal(module.blueprintContext[1], 'b');
    const source = Object.freeze(['array-value']);
    assert.equal(module.initializeBlueprintContext(source), undefined);
    assert.equal(module.blueprintContext[0], 'array-value');
    assert.deepEqual(source, ['array-value']);
  });

  await test('blueprint context: enumerable own and symbol keys copy while inherited and hidden keys do not', async () => {
    const module = await importBlueprintContextModule();
    const symbolKey = Symbol('context');
    const source = Object.create({ inherited: 'ignored' });
    source.own = { assignedByReference: true };
    source[symbolKey] = 'symbol-value';
    Object.defineProperty(source, 'hidden', { value: 'ignored', enumerable: false });
    module.initializeBlueprintContext(source);
    assert.equal(module.blueprintContext.own, source.own);
    assert.equal(module.blueprintContext[symbolKey], 'symbol-value');
    assert.equal(Object.hasOwn(module.blueprintContext, 'inherited'), false);
    assert.equal(Object.hasOwn(module.blueprintContext, 'hidden'), false);
  });

  await test('blueprint context: enumerable source getters run once and assign their result', async () => {
    const module = await importBlueprintContextModule();
    let reads = 0;
    const source = Object.defineProperty({}, 'derived', {
      enumerable: true,
      get() {
        reads += 1;
        return { reads };
      },
    });
    module.initializeBlueprintContext(source);
    assert.equal(reads, 1);
    assert.deepEqual(module.blueprintContext.derived, { reads: 1 });
  });

  await test('blueprint context: throwing getters propagate after earlier assignments only', async () => {
    const module = await importBlueprintContextModule();
    const expectedError = new Error('context getter failed');
    const source = { before: 'assigned' };
    Object.defineProperty(source, 'boom', {
      enumerable: true,
      get() {
        throw expectedError;
      },
    });
    source.after = 'not-assigned';
    assert.throws(() => module.initializeBlueprintContext(source), (error) => error === expectedError);
    assert.equal(module.blueprintContext.before, 'assigned');
    assert.equal(Object.hasOwn(module.blueprintContext, 'boom'), false);
    assert.equal(Object.hasOwn(module.blueprintContext, 'after'), false);
    assert.equal(source.before, 'assigned');
    assert.equal(source.after, 'not-assigned');
  });

  // --- assets/towerEquations/masterEquationUtils.js ----------------------
  const masterEquationUtils = await importMasterEquationUtilsModule();

  await test('master equation utils: omitted calls preserve empty structure and fallback output', () => {
    const emptyStructure = { symbol: { plain: '', latex: '' }, terms: [] };
    assert.deepEqual(masterEquationUtils.deriveMasterEquationStructure(), emptyStructure);
    assert.deepEqual(masterEquationUtils.deriveMasterEquationStructure(undefined), emptyStructure);
    assert.equal(masterEquationUtils.generateMasterEquationText(), '');
    assert.equal(masterEquationUtils.generateMasterEquationText(undefined), '');
  });

  await test('master equation utils: null keeps the inherited destructuring error', () => {
    assert.throws(() => masterEquationUtils.deriveMasterEquationStructure(null), TypeError);
    assert.throws(() => masterEquationUtils.generateMasterEquationText(null), TypeError);
  });

  await test('master equation utils: primitive, array, and malformed inputs retain safe defaults', () => {
    for (const input of [0, 1, 1n, true, false, 'tower', Symbol('tower'), [], () => 'tower']) {
      assert.deepEqual(masterEquationUtils.deriveMasterEquationStructure(input), {
        symbol: { plain: '', latex: '' },
        terms: [],
      });
      assert.equal(masterEquationUtils.generateMasterEquationText(input), '');
    }
    assert.deepEqual(masterEquationUtils.deriveMasterEquationStructure({
      blueprint: { variables: [null, 0, 'bad', [], {}, () => 'bad'] },
      definition: 3,
      towerId: 4,
    }), { symbol: { plain: '', latex: '' }, terms: [] });
  });

  await test('master equation utils: plain variable candidates preserve precedence and order', () => {
    const structure = masterEquationUtils.deriveMasterEquationStructure({
      blueprint: {
        masterEquationSymbol: 'M',
        variables: [
          {
            masterEquationSymbol: ' master ', masterEquationLabel: 'label',
            equationSymbol: 'equation', symbol: 'symbol', name: 'name', key: 'key',
          },
          { masterEquationSymbol: '   ', masterEquationLabel: ' label ' },
          { equationSymbol: ' equation ' },
          { symbol: ' symbol ' },
          { name: ' name ' },
          { key: ' key ' },
        ],
      },
    });
    assert.deepEqual(structure.terms.map((term) => term.plain), [
      'master', 'label', 'equation', 'symbol', 'name', 'key',
    ]);
  });

  await test('master equation utils: plain labels preserve trimming and wrapper normalization', () => {
    const structure = masterEquationUtils.deriveMasterEquationStructure({
      blueprint: {
        masterEquationSymbol: 'M',
        variables: [
          { masterEquationSymbol: '  \\text{ Alpha }  ' },
          { masterEquationLabel: '  \\( beta \\)  ' },
          { masterEquationSymbol: 3, masterEquationLabel: '   ', name: ' Gamma ' },
          { masterEquationSymbol: '', masterEquationLabel: null, key: ' Delta ' },
          { masterEquationSymbol: '   ', masterEquationLabel: '\t', key: ' Epsilon ' },
        ],
      },
    });
    assert.deepEqual(structure.terms.map((term) => term.plain), [
      'Alpha', 'beta', 'Gamma', 'Delta', 'Epsilon',
    ]);
  });

  await test('master equation utils: LaTeX variable candidates and fallbacks preserve quirks', () => {
    const structure = masterEquationUtils.deriveMasterEquationStructure({
      blueprint: {
        masterEquationSymbol: 'M',
        variables: [
          { masterEquationLatex: ' \\alpha ', equationSymbol: '\\ignored' },
          { masterEquationLatex: 'plain-is-ignored', equationSymbol: ' \\beta ' },
          { symbol: ' \\gamma ' },
          { name: ' Delta ' },
          { masterEquationLatex: ' \\(epsilon\\) ', key: 'epsilon' },
          { equationSymbol: ' q ' },
        ],
      },
    });
    assert.deepEqual(structure.terms.map((term) => term.latex), [
      '\\alpha', '\\beta', '\\gamma', '\\text{Delta}', '\\(epsilon\\)', '\\text{q}',
    ]);
  });

  await test('master equation utils: attachments and explicit false are excluded exactly', () => {
    const structure = masterEquationUtils.deriveMasterEquationStructure({
      blueprint: {
        masterEquationSymbol: 'M',
        variables: [
          { key: 'attached-string', attachedToVariable: ' parent ' },
          { key: 'attached-category', category: 'attachment' },
          { key: 'excluded', includeInMasterEquation: false },
          { key: 'whitespace-attachment', attachedToVariable: '   ' },
          { key: 'numeric-attachment', attachedToVariable: 1 },
          { key: 'zero', includeInMasterEquation: 0 },
          { key: 'empty', includeInMasterEquation: '' },
          { key: 'null', includeInMasterEquation: null },
          { key: 'true', includeInMasterEquation: true },
        ],
      },
    });
    assert.deepEqual(structure.terms.map((term) => term.plain), [
      'whitespace-attachment', 'numeric-attachment', 'zero', 'empty', 'null', 'true',
    ]);
  });

  await test('master equation utils: plain master-symbol precedence and fallbacks are exact', () => {
    const derivePlain = (params) => masterEquationUtils.deriveMasterEquationStructure(params).symbol.plain;
    assert.equal(derivePlain({
      blueprint: { masterEquationSymbol: ' Master ', mathSymbol: '\\Math' },
      definition: { symbol: 'Definition', name: 'Name' },
      towerId: 'id',
    }), 'Master');
    assert.equal(derivePlain({ blueprint: {}, definition: { symbol: ' Definition ' }, towerId: 'id' }), 'Definition');
    assert.equal(derivePlain({ blueprint: { mathSymbol: ' \\Theta ' }, definition: { name: 'Name' }, towerId: 'id' }), 'Theta');
    assert.equal(derivePlain({ blueprint: { mathSymbol: 'Theta' }, definition: { name: ' Name ' }, towerId: 'id' }), 'Name');
    assert.equal(derivePlain({ blueprint: {}, definition: {}, towerId: ' id ' }), 'id');
  });

  await test('master equation utils: LaTeX master-symbol precedence and derived fallback are exact', () => {
    const deriveSymbols = (params) => masterEquationUtils.deriveMasterEquationStructure(params).symbol;
    assert.deepEqual(deriveSymbols({
      blueprint: { masterEquationSymbol: 'Plain', masterEquationLatex: ' L ', mathSymbol: '\\Math' },
      definition: { symbol: 'Definition' },
    }), { plain: 'Plain', latex: 'L' });
    assert.deepEqual(deriveSymbols({ blueprint: { mathSymbol: ' \\Phi ' } }), { plain: 'Phi', latex: '\\Phi' });
    assert.deepEqual(deriveSymbols({ blueprint: { masterEquationSymbol: ' S ' } }), { plain: 'S', latex: '\\text{S}' });
    assert.deepEqual(deriveSymbols({ blueprint: { masterEquationSymbol: ' \\Psi ' } }), { plain: '\\Psi', latex: '\\Psi' });
  });

  await test('master equation utils: missing symbols return fallback without coercion', () => {
    assert.equal(masterEquationUtils.generateMasterEquationText({ fallback: 'unavailable' }), 'unavailable');
    assert.equal(masterEquationUtils.generateMasterEquationText({ fallback: 7 }), 7);
    assert.equal(masterEquationUtils.generateMasterEquationText({
      blueprint: { variables: [{ key: 'term' }] }, fallback: 'missing-left',
    }), 'missing-left');
  });

  await test('master equation utils: zero-term equations preserve exact plain and LaTeX spacing', () => {
    const params = { blueprint: { masterEquationSymbol: 'M', variables: [] } };
    assert.equal(masterEquationUtils.generateMasterEquationText(params), 'M = 0');
    assert.equal(masterEquationUtils.generateMasterEquationText({ ...params, format: 'latex' }),
      '\\( \\text{M} = 0 \\)');
  });

  await test('master equation utils: multiple terms preserve exact multiplication output', () => {
    const params = {
      blueprint: {
        masterEquationSymbol: 'M',
        variables: [{ name: 'Alpha' }, { equationSymbol: '\\beta' }, { key: 'Gamma' }],
      },
    };
    assert.equal(masterEquationUtils.generateMasterEquationText(params), 'M = Alpha × \\beta × Gamma');
    assert.equal(masterEquationUtils.generateMasterEquationText({ ...params, format: 'latex' }),
      '\\( \\text{M} = \\text{Alpha} \\times \\beta \\times \\text{Gamma} \\)');
  });

  await test('master equation utils: symbol and term representations retain cross-format fallbacks', () => {
    const latexOnlySymbol = {
      blueprint: { masterEquationLatex: '\\Lambda', variables: [{ name: 'Rate' }] },
    };
    assert.equal(masterEquationUtils.generateMasterEquationText(latexOnlySymbol), '\\Lambda = Rate');
    assert.equal(masterEquationUtils.generateMasterEquationText({ ...latexOnlySymbol, format: 'latex' }),
      '\\( \\Lambda = \\text{Rate} \\)');
  });

  await test('master equation utils: only exact lowercase latex selects LaTeX formatting', () => {
    const base = {
      blueprint: { masterEquationSymbol: 'M', variables: [{ key: 'A' }, { key: 'B' }] },
    };
    for (const format of ['plain', 'LATEX', 'Latex', '', null, false, 0, {}]) {
      assert.equal(masterEquationUtils.generateMasterEquationText({ ...base, format }), 'M = A × B');
    }
    assert.equal(masterEquationUtils.generateMasterEquationText({ ...base, format: 'latex' }),
      '\\( \\text{M} = \\text{A} \\times \\text{B} \\)');
  });

  await test('master equation utils: derivation preserves variable order without mutation', () => {
    const deepFreeze = (value) => {
      if (value && typeof value === 'object' && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const child of Object.values(value)) {
          deepFreeze(child);
        }
      }
      return value;
    };
    const params = deepFreeze({
      blueprint: {
        masterEquationSymbol: 'M',
        variables: [
          { key: 'first' },
          { key: 'excluded', includeInMasterEquation: false },
          { key: 'second' },
        ],
      },
      definition: { symbol: 'D', name: 'Definition' },
      towerId: 'tower',
    });
    const before = JSON.stringify(params);
    assert.deepEqual(masterEquationUtils.deriveMasterEquationStructure(params).terms, [
      { plain: 'first', latex: '\\text{first}' },
      { plain: 'second', latex: '\\text{second}' },
    ]);
    assert.equal(masterEquationUtils.generateMasterEquationText(params), 'M = first × second');
    assert.equal(JSON.stringify(params), before);
  });

  // --- assets/towerEquationTooltip.js ------------------------------------
  const towerTooltip = await importTowerEquationTooltipModule();

  await test('tower tooltip: missing state throws the exact construction error', () => {
    assert.throws(
      () => towerTooltip.createTowerEquationTooltipSystem(),
      { message: 'createTowerEquationTooltipSystem requires a tooltipState object.' },
    );
    assert.throws(
      () => towerTooltip.createTowerEquationTooltipSystem({ tooltipState: null }),
      { message: 'createTowerEquationTooltipSystem requires a tooltipState object.' },
    );
  });

  await test('tower tooltip: no-document and no-panel element creation paths are safe no-ops', () => {
    const state = { element: null, currentTarget: null, hideTimeoutId: null };
    const withoutDocument = towerTooltip.createTowerEquationTooltipSystem({ tooltipState: state });
    assert.equal(withoutDocument.ensureTooltipElement(), null);
    withFakeTooltipDom(() => {
      const withoutPanel = towerTooltip.createTowerEquationTooltipSystem({
        tooltipState: state,
        getPanelElement: () => null,
      });
      assert.equal(withoutPanel.ensureTooltipElement(), null);
      withoutPanel.handlePointerEnter({ currentTarget: {} });
      assert.equal(state.element, null);
    });
  });

  await test('tower tooltip: connected tooltip elements are created once with exact defaults', () => {
    withFakeTooltipDom(({ FakeHTMLElement }) => {
      const panel = new FakeHTMLElement({ left: 0, top: 0, width: 300, height: 200, right: 300, bottom: 200 });
      const state = { element: null, currentTarget: null, hideTimeoutId: null };
      const controller = towerTooltip.createTowerEquationTooltipSystem({
        tooltipState: state,
        getPanelElement: () => panel,
        tooltipId: 'custom-tooltip',
      });
      const first = controller.ensureTooltipElement();
      const second = controller.ensureTooltipElement();
      assert.equal(first, second);
      assert.equal(panel.children.length, 1);
      assert.equal(first.className, 'tower-upgrade-formula-tooltip');
      assert.equal(first.id, 'custom-tooltip');
      assert.equal(first.getAttribute('role'), 'tooltip');
      assert.equal(first.getAttribute('aria-hidden'), 'true');
      assert.equal(first.hidden, true);
    });
  });

  await test('tower tooltip: variable text preserves authored, universal, key, and fallback precedence', () => {
    const controller = towerTooltip.createTowerEquationTooltipSystem({
      tooltipState: { element: null, currentTarget: null, hideTimeoutId: null },
      getUniversalVariableMetadata: (variable) => variable.libraryKey === 'atk'
        ? { symbol: 'Atk', name: 'Attack', units: 'damage', description: 'Universal description.' }
        : null,
    });
    assert.equal(controller.buildVariableTooltip(null, ' F '), 'F');
    assert.equal(controller.buildVariableTooltip(null, 3), '');
    assert.equal(controller.buildVariableTooltip({
      libraryKey: 'atk', equationSymbol: ' E ', symbol: 'S', tooltipName: ' Direct ',
      name: 'Ignored', units: ' hits ', tooltipDescription: ' Own description. ',
    }), 'E: Direct (hits) Own description.');
    assert.equal(controller.buildVariableTooltip({ libraryKey: 'atk' }), 'Atk: Attack (damage) Universal description.');
    assert.equal(controller.buildVariableTooltip({ key: ' power ' }), 'POWER');
    assert.equal(controller.buildVariableTooltip({ description: 'Description only.' }), 'Description only.');
    assert.equal(controller.buildVariableTooltip({ units: 'meters' }), '(meters)');
    assert.equal(controller.buildVariableTooltip({}, ' Z '), 'Z');
    assert.equal(controller.buildVariableTooltip({}), '');
  });

  await test('tower tooltip: focus shows content, ARIA state, and below-target positioning', () => {
    withFakeTooltipDom(({ FakeHTMLElement, frameCallbacks }) => {
      const panel = new FakeHTMLElement({ left: 0, top: 0, width: 300, height: 200, right: 300, bottom: 200 });
      const target = new FakeHTMLElement({ left: 100, top: 50, width: 20, height: 20, right: 120, bottom: 70 });
      target.dataset.tooltip = 'Attack details';
      const state = { element: null, currentTarget: null, hideTimeoutId: null };
      const controller = towerTooltip.createTowerEquationTooltipSystem({
        tooltipState: state,
        getPanelElement: () => panel,
      });
      controller.handleFocus({ currentTarget: target });
      assert.equal(frameCallbacks.length, 1);
      assert.equal(state.element.textContent, 'Attack details');
      assert.equal(state.element.hidden, false);
      assert.equal(state.element.dataset.visible, 'true');
      assert.equal(state.element.getAttribute('aria-hidden'), 'false');
      assert.equal(target.getAttribute('aria-describedby'), 'tower-upgrade-equation-tooltip');
      assert.equal(state.element.style.maxWidth, '276px');
      assert.equal(state.element.style.left, '70px');
      assert.equal(state.element.style.top, '82px');
    });
  });

  await test('tower tooltip: positioning clamps right and chooses above when it has more space', () => {
    withFakeTooltipDom(({ FakeHTMLElement }) => {
      const panel = new FakeHTMLElement({ left: 0, top: 0, width: 300, height: 200, right: 300, bottom: 200 });
      const target = new FakeHTMLElement({ left: 290, top: 170, width: 10, height: 20, right: 300, bottom: 190 });
      target.dataset.tooltip = 'Edge details';
      const state = { element: null, currentTarget: null, hideTimeoutId: null };
      const controller = towerTooltip.createTowerEquationTooltipSystem({
        tooltipState: state,
        getPanelElement: () => panel,
        tooltipMarginPx: 12,
        requestAnimationFrame: (callback) => { callback(0); return 77; },
      });
      controller.handlePointerEnter({ currentTarget: target });
      assert.equal(state.element.style.left, '208px');
      assert.equal(state.element.style.top, '128px');
    });
  });

  await test('tower tooltip: switching targets removes stale ARIA and ignores invalid or blank targets', () => {
    withFakeTooltipDom(({ FakeHTMLElement }) => {
      const panel = new FakeHTMLElement({ width: 300, height: 200, right: 300, bottom: 200 });
      const first = new FakeHTMLElement({ left: 30, top: 30, width: 10, height: 10, right: 40, bottom: 40 });
      const second = new FakeHTMLElement({ left: 60, top: 30, width: 10, height: 10, right: 70, bottom: 40 });
      const blank = new FakeHTMLElement();
      first.dataset.tooltip = 'First';
      second.dataset.tooltip = 'Second';
      const state = { element: null, currentTarget: null, hideTimeoutId: null };
      const controller = towerTooltip.createTowerEquationTooltipSystem({
        tooltipState: state,
        getPanelElement: () => panel,
      });
      controller.handlePointerEnter({ currentTarget: first });
      controller.handlePointerEnter({ currentTarget: second });
      assert.equal(first.getAttribute('aria-describedby'), null);
      assert.equal(second.getAttribute('aria-describedby'), 'tower-upgrade-equation-tooltip');
      assert.equal(state.element.textContent, 'Second');
      controller.handlePointerEnter({ currentTarget: {} });
      controller.handleFocus(null);
      controller.handleFocus({ currentTarget: blank });
      assert.equal(state.currentTarget, second);
    });
  });

  await test('tower tooltip: pointer leave schedules the exact delayed cleanup', () => {
    withFakeTooltipDom(({ FakeHTMLElement, timers, runTimer }) => {
      const panel = new FakeHTMLElement({ width: 300, height: 200, right: 300, bottom: 200 });
      const target = new FakeHTMLElement({ left: 20, top: 20, width: 10, height: 10, right: 30, bottom: 30 });
      target.dataset.tooltip = 'Delayed';
      const state = { element: null, currentTarget: null, hideTimeoutId: null };
      const controller = towerTooltip.createTowerEquationTooltipSystem({
        tooltipState: state,
        getPanelElement: () => panel,
        requestAnimationFrame: (callback) => { callback(0); return 1; },
      });
      controller.handlePointerEnter({ currentTarget: target });
      controller.handlePointerLeave();
      const timeoutId = state.hideTimeoutId;
      assert.equal(timers.get(timeoutId).delay, 160);
      assert.equal(state.element.dataset.visible, 'false');
      assert.equal(state.element.getAttribute('aria-hidden'), 'true');
      assert.equal(state.element.hidden, false);
      assert.equal(state.element.textContent, 'Delayed');
      assert.equal(runTimer(timeoutId), true);
      assert.equal(state.element.hidden, true);
      assert.equal(state.element.textContent, '');
      assert.equal(target.getAttribute('aria-describedby'), null);
      assert.equal(state.currentTarget, null);
      assert.equal(state.hideTimeoutId, null);
    });
  });

  await test('tower tooltip: blur cancels a pending delay and hides immediately', () => {
    withFakeTooltipDom(({ FakeHTMLElement, timers, clearedTimerIds }) => {
      const panel = new FakeHTMLElement({ width: 300, height: 200, right: 300, bottom: 200 });
      const target = new FakeHTMLElement({ left: 20, top: 20, width: 10, height: 10, right: 30, bottom: 30 });
      target.dataset.tooltip = 'Immediate';
      const state = { element: null, currentTarget: null, hideTimeoutId: null };
      const controller = towerTooltip.createTowerEquationTooltipSystem({
        tooltipState: state,
        getPanelElement: () => panel,
        requestAnimationFrame: (callback) => { callback(0); return 1; },
      });
      controller.handleFocus({ currentTarget: target });
      controller.handlePointerLeave();
      const timeoutId = state.hideTimeoutId;
      controller.handleBlur();
      assert.deepEqual(clearedTimerIds, [timeoutId]);
      assert.equal(timers.has(timeoutId), false);
      assert.equal(state.element.hidden, true);
      assert.equal(state.currentTarget, null);
    });
  });

  await test('tower tooltip: showing again cancels pending hide and custom frames take precedence', () => {
    withFakeTooltipDom(({ FakeHTMLElement, timers, clearedTimerIds, frameCallbacks }) => {
      const panel = new FakeHTMLElement({ width: 300, height: 200, right: 300, bottom: 200 });
      const first = new FakeHTMLElement({ left: 20, top: 20, width: 10, height: 10, right: 30, bottom: 30 });
      const second = new FakeHTMLElement({ left: 50, top: 20, width: 10, height: 10, right: 60, bottom: 30 });
      first.dataset.tooltip = 'First';
      second.dataset.tooltip = 'Second';
      let customFrames = 0;
      const state = { element: null, currentTarget: null, hideTimeoutId: null };
      const controller = towerTooltip.createTowerEquationTooltipSystem({
        tooltipState: state,
        getPanelElement: () => panel,
        requestAnimationFrame: (callback) => { customFrames += 1; callback(0); return customFrames; },
      });
      controller.handlePointerEnter({ currentTarget: first });
      controller.handlePointerLeave();
      const timeoutId = state.hideTimeoutId;
      controller.handlePointerEnter({ currentTarget: second });
      assert.equal(timers.has(timeoutId), false);
      assert.deepEqual(clearedTimerIds, [timeoutId]);
      assert.equal(customFrames, 2);
      assert.equal(frameCallbacks.length, 0);
      assert.equal(state.element.textContent, 'Second');
      assert.equal(state.element.hidden, false);
    });
  });

  // --- assets/towerVariableDiscovery.js -----------------------------------
  const towerDiscovery = await importTowerVariableDiscoveryModule();

  function createTowerDiscoveryHarness(overrides = {}) {
    const discoveredVariables = Object.prototype.hasOwnProperty.call(overrides, 'discoveredVariables')
      ? overrides.discoveredVariables
      : new Map();
    const discoveredVariableListeners = Object.prototype.hasOwnProperty.call(overrides, 'discoveredVariableListeners')
      ? overrides.discoveredVariableListeners
      : new Set();
    const definitions = overrides.definitions || {
      alpha: { id: 'alpha', name: ' Alpha ', symbol: ' α ', tier: 1 },
      beta: { id: 'beta', name: 'Beta', symbol: 'β', tier: 2 },
      gamma: { id: 'gamma', name: 'Gamma', symbol: 'γ', tier: 3 },
    };
    const blueprints = overrides.blueprints || {
      alpha: { variables: [{ key: ' attack ', libraryKey: 'atk' }] },
      beta: { variables: [{ libraryKey: ' M ' }] },
      gamma: { variables: [{ key: 'rate', tooltipName: 'Cadence' }] },
    };
    const orderedDefinitions = overrides.orderedDefinitions ?? [
      definitions.beta,
      definitions.alpha,
      definitions.gamma,
    ];
    const towerOrderIndex = overrides.towerOrderIndex || new Map([
      ['beta', 0],
      ['alpha', 1],
      ['gamma', 2],
    ]);
    const manager = towerDiscovery.createTowerVariableDiscoveryManager({
      universalVariableLibrary: overrides.universalVariableLibrary || new Map([
        ['atk', { symbol: 'Atk', name: 'Attack', description: 'Base damage.', units: 'damage' }],
        ['m', { symbol: 'm', name: 'Range', description: 'Reach.', units: 'meters' }],
      ]),
      discoveredVariables,
      discoveredVariableListeners,
      getTowerDefinition: (towerId) => definitions[towerId] || null,
      getOrderedTowerDefinitions: () => orderedDefinitions,
      getTowerOrderIndex: () => towerOrderIndex,
      getTowerEquationBlueprint: (towerId) => blueprints[towerId] || null,
      getDefaultUnlockCollection: overrides.getDefaultUnlockCollection || (() => null),
    });
    return { manager, discoveredVariables, discoveredVariableListeners };
  }

  await test('tower discovery: invalid injected stores throw the exact construction errors', () => {
    assert.throws(
      () => towerDiscovery.createTowerVariableDiscoveryManager({ discoveredVariables: null }),
      { message: 'createTowerVariableDiscoveryManager requires a Map for discoveredVariables.' },
    );
    assert.throws(
      () => towerDiscovery.createTowerVariableDiscoveryManager({
        discoveredVariables: new Map(),
        discoveredVariableListeners: {},
      }),
      { message: 'createTowerVariableDiscoveryManager requires a Set for discoveredVariableListeners.' },
    );
  });

  await test('tower discovery: lookup aliases normalize in libraryKey, key, symbol, equationSymbol order', () => {
    const { manager } = createTowerDiscoveryHarness();
    assert.equal(manager.getUniversalVariableMetadata(' ATK ').name, 'Attack');
    assert.equal(manager.getUniversalVariableMetadata({ libraryKey: ' M ', key: 'atk' }).name, 'Range');
    assert.equal(manager.getUniversalVariableMetadata({ key: ' ATK ', symbol: 'm' }).name, 'Attack');
    assert.equal(manager.getUniversalVariableMetadata({ symbol: ' M ' }).name, 'Range');
    assert.equal(manager.getUniversalVariableMetadata({ equationSymbol: ' ATK ' }).name, 'Attack');
    assert.equal(manager.getUniversalVariableMetadata({}), null);
  });

  await test('tower discovery: compound ids prefer authored key, then normalized aliases, and reject blanks', () => {
    const { manager } = createTowerDiscoveryHarness();
    assert.equal(manager.buildDiscoveredVariableId('alpha', { key: ' Power ', libraryKey: 'atk' }), 'alpha::Power');
    assert.equal(manager.buildDiscoveredVariableId('alpha', { libraryKey: ' ATK ' }), 'alpha::atk');
    assert.equal(manager.buildDiscoveredVariableId('alpha', { equationSymbol: ' M ' }), 'alpha::m');
    assert.equal(manager.buildDiscoveredVariableId('', { key: 'power' }), null);
    assert.equal(manager.buildDiscoveredVariableId('alpha', {}), null);
  });

  await test('tower discovery: record fields preserve authored precedence and universal/tower fallbacks', () => {
    const { manager } = createTowerDiscoveryHarness({
      blueprints: {
        alpha: {
          variables: [
            { key: 'first', libraryKey: 'atk', symbol: ' X ', name: 'Direct', description: 'Own', units: 'hits', glyphLabel: ' G1 ' },
            { key: 'second', libraryKey: 'm' },
          ],
        },
      },
    });
    assert.equal(manager.discoverTowerVariables('alpha'), true);
    const [first, second] = manager.getDiscoveredVariables();
    assert.deepEqual(first, {
      id: 'alpha::first', towerId: 'alpha', towerName: 'Alpha', towerSymbol: 'α', towerTier: 1,
      towerOrder: 1, key: 'first', libraryKey: 'atk', symbol: 'X', name: 'Direct',
      description: 'Own', units: 'hits', glyphLabel: 'G1',
    });
    assert.equal(second.symbol, 'm');
    assert.equal(second.name, 'Range');
    assert.equal(second.description, 'Reach.');
    assert.equal(second.units, 'meters');
  });

  await test('tower discovery: invalid blueprints and duplicate discoveries are no-ops', () => {
    const { manager } = createTowerDiscoveryHarness({
      blueprints: { alpha: { variables: [{ key: 'attack' }] }, invalid: { variables: null } },
    });
    assert.equal(manager.discoverTowerVariables(null), false);
    assert.equal(manager.discoverTowerVariables('missing'), false);
    assert.equal(manager.discoverTowerVariables('invalid'), false);
    assert.equal(manager.discoverTowerVariables('alpha', { notify: false }), true);
    assert.equal(manager.discoverTowerVariables('alpha'), false);
    assert.equal(manager.getDiscoveredVariables().length, 1);
  });

  await test('tower discovery: snapshots sort by tower order/id/name and clone owned records', () => {
    const { manager, discoveredVariables } = createTowerDiscoveryHarness();
    manager.discoverTowerVariables('gamma', { notify: false });
    manager.discoverTowerVariables('alpha', { notify: false });
    manager.discoverTowerVariables('beta', { notify: false });
    const snapshot = manager.getDiscoveredVariables();
    assert.deepEqual(snapshot.map((entry) => entry.towerId), ['beta', 'alpha', 'gamma']);
    snapshot[0].name = 'mutated';
    assert.equal(discoveredVariables.get('beta::m').name, 'Range');
    assert.notEqual(manager.getDiscoveredVariables()[0], snapshot[0]);
  });

  await test('tower discovery: listeners receive an immediate snapshot, notify on change, and unsubscribe', () => {
    const { manager } = createTowerDiscoveryHarness();
    const seen = [];
    const unsubscribe = manager.addDiscoveredVariablesListener((snapshot) => seen.push(snapshot.map(({ id }) => id)));
    assert.deepEqual(seen, [[]]);
    manager.discoverTowerVariables('alpha');
    assert.deepEqual(seen, [[], ['alpha::attack']]);
    unsubscribe();
    manager.discoverTowerVariables('beta');
    assert.equal(seen.length, 2);
    assert.equal(typeof manager.addDiscoveredVariablesListener(false), 'function');
  });

  await test('tower discovery: subscription and notification listener failures are isolated and warned', () => {
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (...args) => warnings.push(args);
    try {
      const { manager } = createTowerDiscoveryHarness();
      manager.addDiscoveredVariablesListener(() => { throw new Error('subscription'); });
      manager.discoverTowerVariables('alpha');
    } finally {
      console.warn = originalWarn;
    }
    assert.deepEqual(warnings.map(([message]) => message), [
      'Discovered variable listener failed during subscription.',
      'Discovered variable listener failed.',
    ]);
  });

  await test('tower discovery: Set, array, iterable, and object-key unlocks normalize identically', () => {
    const inputs = [
      new Set([' alpha ', 'beta']),
      [' alpha ', 'beta', 3],
      new Map([['alpha', true], ['beta', true]]).keys(),
      { alpha: false, beta: true },
    ];
    for (const input of inputs) {
      const { manager } = createTowerDiscoveryHarness();
      manager.initializeDiscoveredVariablesFromUnlocks(input);
      assert.deepEqual(manager.getDiscoveredVariables().map(({ towerId }) => towerId), ['beta', 'alpha']);
    }
  });

  await test('tower discovery: initialization follows ordered definitions and emits one rebuilt snapshot', () => {
    const { manager } = createTowerDiscoveryHarness();
    const seen = [];
    manager.addDiscoveredVariablesListener((snapshot) => seen.push(snapshot.map(({ towerId }) => towerId)));
    manager.initializeDiscoveredVariablesFromUnlocks(['gamma', 'alpha', 'beta']);
    assert.deepEqual(seen, [[], ['beta', 'alpha', 'gamma']]);
  });

  await test('tower discovery: empty input uses only a Set fallback and unordered mode follows unlock iteration', () => {
    const withSetFallback = createTowerDiscoveryHarness({
      orderedDefinitions: [],
      getDefaultUnlockCollection: () => new Set(['gamma', ' alpha ']),
    }).manager;
    withSetFallback.initializeDiscoveredVariablesFromUnlocks(null);
    assert.deepEqual(withSetFallback.getDiscoveredVariables().map(({ towerId }) => towerId), ['alpha', 'gamma']);

    const withArrayFallback = createTowerDiscoveryHarness({
      getDefaultUnlockCollection: () => ['alpha'],
    }).manager;
    withArrayFallback.initializeDiscoveredVariablesFromUnlocks([]);
    assert.deepEqual(withArrayFallback.getDiscoveredVariables(), []);
  });

  // --- assets/spireResourcePersistence.js ----------------------------------
  const spirePersistence = await importAsEsm('assets/spireResourcePersistence.js');

  await test('spire serialization: emits the exact post-retirement keys and current story flags', () => {
    const harness = createSpirePersistenceHarness(spirePersistence);
    harness.spireResourceState.wellOfInspiration.storySeen = 1;
    harness.spireResourceState.achievements.storySeen = 'seen';
    const snapshot = harness.controller.getSpireResourceStateSnapshot();

    assert.deepEqual(Object.keys(snapshot), ['wellOfInspiration', 'achievements']);
    assert.deepEqual(Object.keys(snapshot.wellOfInspiration), ['unlocked', 'storySeen']);
    assert.deepEqual(snapshot.wellOfInspiration, { unlocked: true, storySeen: true });
    assert.deepEqual(snapshot.achievements, { storySeen: true });
  });

  await test('spire serialization: falls back from a missing Well branch to compatibility `powder`', () => {
    const harness = createSpirePersistenceHarness(spirePersistence, {
      spireResourceState: {
        wellOfInspiration: null,
        powder: { storySeen: true },
        achievements: { storySeen: false },
      },
    });
    assert.equal(harness.controller.getSpireResourceStateSnapshot().wellOfInspiration.storySeen, true);
  });

  await test('tower/Aleph getter: preserves base properties and adds exactly the current Aleph snapshot', () => {
    const harness = createSpirePersistenceHarness(spirePersistence);
    const snapshot = harness.controller.getTowerUpgradeStateSnapshotWithAleph();
    assert.deepEqual(snapshot, {
      ...harness.baseTowerSnapshot,
      alephChainUpgrades: harness.alephSnapshot,
    });
    assert.equal(snapshot.alpha, harness.baseTowerSnapshot.alpha);
    assert.equal(snapshot.alephChainUpgrades, harness.alephSnapshot);
  });

  await test('tower/Aleph restore: null and primitive snapshots are no-ops', () => {
    const harness = createSpirePersistenceHarness(spirePersistence);
    [null, undefined, false, 0, 'invalid'].forEach((snapshot) => {
      harness.controller.applyTowerUpgradeStateSnapshotWithAleph(snapshot);
    });
    assert.deepEqual(harness.towerApplyCalls, []);
    assert.deepEqual(harness.alephApplyCalls, []);
  });

  await test('tower/Aleph restore: valid snapshots always reach base apply and invalid Aleph branches are skipped', () => {
    const harness = createSpirePersistenceHarness(spirePersistence);
    const snapshots = [
      { alpha: { variables: {} } },
      { alephChainUpgrades: null },
      { alephChainUpgrades: false },
      { alephChainUpgrades: 7 },
      { alephChainUpgrades: 'invalid' },
    ];
    snapshots.forEach((snapshot) => harness.controller.applyTowerUpgradeStateSnapshotWithAleph(snapshot));
    assert.deepEqual(harness.towerApplyCalls, snapshots);
    assert.deepEqual(harness.alephApplyCalls, []);
  });

  await test('tower/Aleph restore: applies Aleph after base upgrades with the current playfield wrapper', () => {
    const harness = createSpirePersistenceHarness(spirePersistence);
    const alephChainUpgrades = { x: 5, y: 6, z: 7 };
    const snapshot = { alpha: { variables: {} }, alephChainUpgrades };
    harness.controller.applyTowerUpgradeStateSnapshotWithAleph(snapshot);

    assert.deepEqual(harness.callOrder, ['tower', 'aleph']);
    assert.equal(harness.towerApplyCalls[0], snapshot);
    assert.deepEqual(harness.alephApplyCalls, [
      { snapshot: alephChainUpgrades, options: { playfield: harness.playfield } },
    ]);
  });

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
