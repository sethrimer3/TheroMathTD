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
     }
     export function formatPercentage(value) {
       formatCalls.push(['percent', value]);
       return \`percent:\${String(value)}\`;
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

// Import one compiled grouped equation module (towerEquations root) against
// recording formatting/context stubs, mirroring the advanced-equation harness.
async function importGroupedEquationModule(fileName) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `thero-unit-test-${fileName}-`));
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
  const equationDest = path.join(tmpDir, 'assets', 'towerEquations', `${fileName}.js`);
  const contextDest = path.join(tmpDir, 'assets', 'towerEquations', 'blueprintContext.js');
  const formattingDest = path.join(tmpDir, 'scripts', 'core', 'formatting.js');
  fs.mkdirSync(path.dirname(equationDest), { recursive: true });
  fs.mkdirSync(path.dirname(formattingDest), { recursive: true });
  fs.copyFileSync(
    path.join(rootDir, 'assets', 'towerEquations', `${fileName}.js`),
    equationDest,
  );
  fs.writeFileSync(
    contextDest,
    `export const blueprintContext = {
       deriveGlyphRankFromLevel: null,
       getTowerEquationBlueprint: null,
       ensureTowerUpgradeState: null,
       calculateTowerEquationResult: null,
       getDynamicConnectionCount: null,
       getTowerDefinition: null,
       computeTowerVariableValue: null,
     };`,
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
     }
     export function formatPercentage(value) {
       formatCalls.push(['percent', value]);
       return \`percent:\${String(value)}\`;
     }`,
  );
  const equationModule = await import(pathToFileURL(equationDest).href);
  const contextModule = await import(pathToFileURL(contextDest).href);
  const formattingModule = await import(pathToFileURL(formattingDest).href);
  return {
    module: equationModule,
    blueprintContext: contextModule.blueprintContext,
    formatCalls: formattingModule.formatCalls,
  };
}

// Import the compiled levels module with the real generated wave codec so
// compact-string parsing and developer-range synthesis stay authentic.
async function importLevelsModule() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-unit-test-levels-'));
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
  const assetsDir = path.join(tmpDir, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });
  for (const fileName of ['levels.js', 'waveEncoder.js']) {
    fs.copyFileSync(path.join(rootDir, 'assets', fileName), path.join(assetsDir, fileName));
  }
  return import(pathToFileURL(path.join(assetsDir, 'levels.js')).href);
}

// Import the compiled configuration orchestrator against recording stubs for
// its five JavaScript dependencies and the typed tower-data registry.
async function importConfigurationModule() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-unit-test-configuration-'));
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
  const assetsDir = path.join(tmpDir, 'assets');
  const towersDataDir = path.join(assetsDir, 'data', 'towers');
  fs.mkdirSync(towersDataDir, { recursive: true });
  fs.copyFileSync(
    path.join(rootDir, 'assets', 'configuration.js'),
    path.join(assetsDir, 'configuration.js'),
  );
  fs.writeFileSync(
    path.join(towersDataDir, 'index.js'),
    `export default [{ id: 'alpha' }, { id: 'beta' }, { id: 'gamma' }];`,
  );
  fs.writeFileSync(
    path.join(assetsDir, 'towersTab.js'),
    `export const calls = [];
     export const loadoutState = { selected: [] };
     export const unlockState = { unlocked: new Set() };
     export function setTowerDefinitions(defs) {
       calls.push(['setTowerDefinitions', defs.map((def) => def.id)]);
     }
     export function setTowerLoadoutLimit(limit) {
       calls.push(['setTowerLoadoutLimit', limit]);
     }
     export function getTowerLoadoutState() { return loadoutState; }
     export function getTowerUnlockState() { return unlockState; }
     export function getTowerDefinition(id) {
       return ['alpha', 'beta', 'gamma'].includes(id) ? { id } : null;
     }
     export function setMergingLogicUnlocked(value) {
       calls.push(['setMergingLogicUnlocked', value]);
     }
     export function initializeDiscoveredVariablesFromUnlocks(unlocked) {
       calls.push(['initializeDiscoveredVariablesFromUnlocks', Array.from(unlocked).sort()]);
     }`,
  );
  fs.writeFileSync(
    path.join(assetsDir, 'codex.js'),
    `export const codexCalls = [];
     export function setEnemyCodexEntries(entries) { codexCalls.push(entries); }`,
  );
  fs.writeFileSync(
    path.join(assetsDir, 'levels.js'),
    `export const levelCalls = [];
     export const multiplierBox = { value: 4 };
     export function setLevelBlueprints(maps) { levelCalls.push(['setLevelBlueprints', maps]); }
     export function setLevelConfigs(levels) { levelCalls.push(['setLevelConfigs', levels]); }
     export function initializeInteractiveLevelProgression() { levelCalls.push(['initializeInteractiveLevelProgression']); }
     export function pruneLevelState() { levelCalls.push(['pruneLevelState']); }
     export function getStartingTheroMultiplier() { return multiplierBox.value; }`,
  );
  fs.writeFileSync(
    path.join(assetsDir, 'achievementsTab.js'),
    `export const achievementCalls = [];
     export async function generateLevelAchievements() { achievementCalls.push('generateLevelAchievements'); }`,
  );
  fs.writeFileSync(
    path.join(assetsDir, 'gameplayConfigLoaders.js'),
    `export const loaderBehavior = {
       fetchResult: null,
       fetchError: null,
       embedded: null,
       moduleResult: null,
       calls: [],
     };
     export function getEmbeddedGameplayConfig() {
       loaderBehavior.calls.push('embedded');
       return loaderBehavior.embedded;
     }
     export async function loadGameplayConfigViaFetch() {
       loaderBehavior.calls.push('fetch');
       if (loaderBehavior.fetchError) {
         throw loaderBehavior.fetchError;
       }
       return loaderBehavior.fetchResult;
     }
     export async function loadGameplayConfigViaModule() {
       loaderBehavior.calls.push('module');
       return loaderBehavior.moduleResult;
     }`,
  );
  const configurationModule = await import(pathToFileURL(path.join(assetsDir, 'configuration.js')).href);
  const towersTabModule = await import(pathToFileURL(path.join(assetsDir, 'towersTab.js')).href);
  const codexModule = await import(pathToFileURL(path.join(assetsDir, 'codex.js')).href);
  const levelsModule = await import(pathToFileURL(path.join(assetsDir, 'levels.js')).href);
  const loadersModule = await import(pathToFileURL(path.join(assetsDir, 'gameplayConfigLoaders.js')).href);
  const achievementsModule = await import(pathToFileURL(path.join(assetsDir, 'achievementsTab.js')).href);
  return {
    configuration: configurationModule,
    towersTab: towersTabModule,
    codex: codexModule,
    levels: levelsModule,
    loaders: loadersModule,
    achievements: achievementsModule,
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

  // --- assets/towerEquations/advanced/rhoEquation.js --------------------
  await test('Rho equation: metadata, costs, variable order, and imported formatting remain exact', async () => {
    const { equation: rho, formatCalls } = await importAdvancedEquationModule('rho');
    assert.equal(rho.mathSymbol, String.raw`\rho`);
    assert.equal(
      rho.baseEquation,
      String.raw`\( \rho = \text{enemy}_{\text{þ}} \times \text{rng} \)`,
    );
    assert.deepEqual(rho.variables.map(({ key, glyphLabel, upgradable }) => ({
      key, glyphLabel, upgradable,
    })), [
      { key: 'enemyThero', glyphLabel: 'ℵ₁', upgradable: true },
      { key: 'rangeMeters', glyphLabel: 'ℵ₂', upgradable: true },
    ]);
    const [enemyThero, rangeMeters] = rho.variables;
    assert.deepEqual([
      enemyThero.cost(-3), enemyThero.cost(0), enemyThero.cost(2.5),
      rangeMeters.cost(-3), rangeMeters.cost(0), rangeMeters.cost(2.5),
    ], [2, 4, 9, 2, 3, 8]);
    assert.equal(enemyThero.format(-2), 'decimal:0:3×');
    assert.equal(rangeMeters.format(4.5), 'decimal:4.5:2 m');
    assert.deepEqual(formatCalls, [
      ['decimal', 0, 3],
      ['decimal', 4.5, 2],
    ]);
  });

  await test('Rho equation: upgrade-state reads and prestige formulas preserve coercion and helper timing', async () => {
    const { equation: rho, blueprintContext } = await importAdvancedEquationModule('rho');
    const [enemyThero, rangeMeters] = rho.variables;
    const blueprint = { id: 'rho-blueprint' };
    const helperCalls = [];
    blueprintContext.ensureTowerUpgradeState = (towerId, receivedBlueprint) => {
      helperCalls.push([towerId, receivedBlueprint]);
      return {
        variables: {
          enemyThero: { level: '2.5' },
          rangeMeters: { level: 4 },
        },
      };
    };
    assert.equal(enemyThero.computeValue({
      towerId: 'rho', blueprint, dynamicContext: { prestige: false, unspentThero: 100 },
    }), 3.5);
    assert.equal(enemyThero.computeValue({
      towerId: 'rho', blueprint, dynamicContext: { prestige: true, unspentThero: 100 },
    }), 7);
    assert.equal(enemyThero.computeValue({
      towerId: 'rho', blueprint, dynamicContext: { prestige: 1, unspentThero: 100 },
    }), 3.5);
    assert.equal(rangeMeters.computeValue({
      towerId: 'rho', blueprint, dynamicContext: { prestige: false },
    }), 3.8);
    assert.equal(rangeMeters.computeValue({
      towerId: 'rho', blueprint, dynamicContext: { prestige: true },
    }), 5);
    assert.equal(helperCalls.length, 5);
    assert.deepEqual(helperCalls[0], ['rho', blueprint]);

    let prestigeReads = 0;
    let unspentReads = 0;
    const changingContext = {
      get prestige() {
        prestigeReads += 1;
        return true;
      },
      get unspentThero() {
        unspentReads += 1;
        return unspentReads === 1 ? 100 : '1000';
      },
    };
    assert.equal(enemyThero.computeValue({
      towerId: 'rho', blueprint, dynamicContext: changingContext,
    }), 10.5);
    assert.equal(prestigeReads, 1);
    assert.equal(unspentReads, 2);

    blueprintContext.ensureTowerUpgradeState = null;
    assert.equal(enemyThero.computeValue({
      towerId: 'rho', blueprint, dynamicContext: { prestige: true, unspentThero: 10 },
    }), 1);
    assert.equal(rangeMeters.computeValue({
      towerId: 'rho', blueprint, dynamicContext: null,
    }), 3);
  });

  await test('Rho equation: malformed levels and unspent-Thero boundaries retain exact fallbacks', async () => {
    const { equation: rho, blueprintContext } = await importAdvancedEquationModule('rho');
    const [enemyThero] = rho.variables;
    const compute = (dynamicContext) => enemyThero.computeValue({
      towerId: 'rho', blueprint: {}, dynamicContext,
    });
    for (const state of [
      null,
      {},
      { variables: null },
      { variables: {} },
      { variables: { enemyThero: null } },
      { variables: { enemyThero: { level: -2 } } },
      { variables: { enemyThero: { level: Infinity } } },
      { variables: { enemyThero: { level: 'invalid' } } },
    ]) {
      blueprintContext.ensureTowerUpgradeState = () => state;
      assert.equal(compute({ prestige: false }), 1);
    }
    blueprintContext.ensureTowerUpgradeState = () => ({
      variables: { enemyThero: { level: 2 } },
    });
    for (const unspentThero of [undefined, null, '100', NaN, -10, 0, 1, Infinity]) {
      assert.equal(compute({ prestige: true, unspentThero }), 0);
    }
    assert.equal(compute({ prestige: true, unspentThero: 10 }), 3);
    assert.equal(compute({ prestige: true, unspentThero: 1000 }), 9);
    assert.equal(compute(null), 3);
    assert.equal(compute(7), 3);
  });

  await test('Rho equation: enemy-yield sub-equations preserve branches and formatter order', async () => {
    const { equation: rho, formatCalls } = await importAdvancedEquationModule('rho');
    const [enemyThero] = rho.variables;
    assert.deepEqual(enemyThero.getSubEquations({
      level: 2,
      value: NaN,
      dynamicContext: { prestige: false, unspentThero: 100 },
    }), [
      { expression: String.raw`\( \text{enemy}_{\text{þ}} = 1 + \aleph_{1} \)` },
      {
        values: String.raw`\( decimal:3:3 = 1 + whole:2 \)`,
        variant: 'values',
      },
    ]);
    assert.deepEqual(formatCalls, [
      ['decimal', 3, 3],
      ['whole', 2],
    ]);
    formatCalls.length = 0;
    assert.deepEqual(enemyThero.getSubEquations({
      level: 2,
      value: NaN,
      dynamicContext: { prestige: true, unspentThero: 100 },
    }), [
      { expression: String.raw`\( \text{enemy}_{\text{þ}} = (1 + \aleph_{1}) \times \log_{10}(\text{unspent}_{\text{þ}}) \)` },
      {
        values: String.raw`\( decimal:6:3 = decimal:3:3 \times \log_{10}(game:100) \)`,
        variant: 'values',
      },
    ]);
    assert.deepEqual(formatCalls, [
      ['decimal', 6, 3],
      ['decimal', 3, 3],
      ['game', 100],
    ]);
  });

  await test('Rho equation: range sub-equations retain prestige coefficients and finite fallbacks', async () => {
    const { equation: rho, formatCalls } = await importAdvancedEquationModule('rho');
    const [, rangeMeters] = rho.variables;
    assert.deepEqual(rangeMeters.getSubEquations({
      level: 4,
      value: Infinity,
      dynamicContext: { prestige: true },
    }), [
      { expression: String.raw`\( \text{rng} = 3 + decimal:0.5:1 \times \aleph_{2} \)` },
      {
        values: String.raw`\( decimal:5:2 = 3 + decimal:0.5:1 \times whole:4 \)`,
        variant: 'values',
      },
    ]);
    assert.deepEqual(formatCalls, [
      ['decimal', 0.5, 1],
      ['decimal', 5, 2],
      ['whole', 4],
    ]);
    formatCalls.length = 0;
    const standard = rangeMeters.getSubEquations({
      level: Infinity,
      value: -7,
      dynamicContext: { prestige: 1 },
    });
    assert.equal(standard[0].expression, String.raw`\( \text{rng} = 3 + decimal:0.2:1 \times \aleph_{2} \)`);
    assert.equal(standard[1].values, String.raw`\( decimal:-7:2 = 3 + decimal:0.2:1 \times whole:0 \)`);
    assert.deepEqual(formatCalls, [
      ['decimal', 0.2, 1],
      ['decimal', -7, 2],
      ['whole', 0],
    ]);
  });

  await test('Rho equation: result and base-value formatting preserve number-only finite acceptance', async () => {
    const { equation: rho } = await importAdvancedEquationModule('rho');
    assert.equal(rho.computeResult({ enemyThero: 4, rangeMeters: 5 }), 20);
    assert.equal(rho.computeResult({ enemyThero: -4, rangeMeters: 5 }), 0);
    assert.equal(rho.computeResult({ enemyThero: '4', rangeMeters: 5 }), 0);
    assert.equal(rho.computeResult({ enemyThero: 4, rangeMeters: Infinity }), 0);
    const calls = [];
    const output = rho.formatBaseEquationValues({
      values: { enemyThero: 4, rangeMeters: -5 },
      result: -20,
      formatComponent(value) {
        calls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output, 'component:-20 = component:4 × component:0');
    assert.deepEqual(calls, [-20, 4, 0]);
  });

  // --- assets/towerEquations/advanced/kappaEquation.js -----------------
  await test('Kappa equation: metadata, references, and all cost curves remain exact', async () => {
    const { equation: kappa } = await importAdvancedEquationModule('kappa');
    assert.equal(kappa.mathSymbol, String.raw`\kappa`);
    assert.equal(kappa.baseEquation, String.raw`\( \kappa = \gamma \times \beta \times \alpha \)`);
    assert.deepEqual(kappa.variables.map((variable) => variable.key), [
      'gamma', 'beta', 'alpha', 'chargeRate', 'rangeMeters', 'amplitudeMultiplier',
    ]);
    assert.deepEqual(kappa.variables.slice(0, 3).map((variable) => variable.reference), [
      'gamma', 'beta', 'alpha',
    ]);
    const [chargeRate, rangeMeters, amplitudeMultiplier] = kappa.variables.slice(3);
    assert.deepEqual([chargeRate.baseValue, chargeRate.step], [0.16, 0.025]);
    assert.deepEqual([rangeMeters.baseValue, rangeMeters.step], [2, 0.4]);
    assert.deepEqual([amplitudeMultiplier.baseValue, amplitudeMultiplier.step], [5, 0.75]);
    assert.deepEqual([
      chargeRate.cost(2.9), rangeMeters.cost(2.9), amplitudeMultiplier.cost(2.9),
    ], [144, 405, 231]);
    assert.deepEqual([
      chargeRate.cost(-4), rangeMeters.cost(-4), amplitudeMultiplier.cost(-4),
    ], [60, 45, 80]);
    assert.deepEqual([
      chargeRate.cost(Infinity), rangeMeters.cost(Infinity), amplitudeMultiplier.cost(Infinity),
    ], [60, 45, 80]);
  });

  await test('Kappa equation: upstream lookup order and non-finite harmonic fallbacks remain exact', async () => {
    const { equation: kappa, blueprintContext, formatCalls } =
      await importAdvancedEquationModule('kappa');
    const lookupCalls = [];
    const results = { gamma: Infinity, beta: -3, alpha: 2 };
    blueprintContext.calculateTowerEquationResult = (towerId) => {
      lookupCalls.push(towerId);
      return results[towerId];
    };
    assert.deepEqual(kappa.variables[0].getSubEquations(), [
      { expression: String.raw`\( atk = \gamma \times \beta \times \alpha \)` },
      {
        values: String.raw`\( game:0 = game:0 \times game:0 \times game:2 \)`,
        variant: 'values',
      },
    ]);
    assert.deepEqual(lookupCalls, ['gamma', 'beta', 'alpha']);
    assert.deepEqual(formatCalls, [
      ['game', 0], ['game', 0], ['game', 0], ['game', 2],
    ]);
    blueprintContext.calculateTowerEquationResult = null;
    assert.equal(kappa.variables[0].getSubEquations()[1].values,
      String.raw`\( game:0 = game:0 \times game:0 \times game:0 \)`);
  });

  await test('Kappa equation: upgrade sub-equations preserve flooring, fallbacks, and formatter order', async () => {
    const { equation: kappa, formatCalls } = await importAdvancedEquationModule('kappa');
    const [chargeRate, rangeMeters, amplitudeMultiplier] = kappa.variables.slice(3);
    const chargeLines = chargeRate.getSubEquations({ level: 2.9, value: NaN });
    assert.equal(chargeLines[1].values,
      String.raw`\( decimal:0.21000000000000002:3 = 0.16 + 0.025 \times whole:2 \)`);
    assert.equal(chargeLines[3].values,
      String.raw`\( decimal:4.761904761904762:2\,\text{s} = 1 / decimal:0.21000000000000002:3 \)`);
    rangeMeters.getSubEquations({ level: Infinity, value: -5 });
    amplitudeMultiplier.getSubEquations({ level: -2, value: Infinity });
    assert.deepEqual(formatCalls, [
      ['decimal', 0.21000000000000002, 3], ['whole', 2],
      ['decimal', 4.761904761904762, 2], ['decimal', 0.21000000000000002, 3],
      ['decimal', 0, 2], ['whole', 0],
      ['decimal', 5, 2], ['whole', 0],
    ]);
  });

  await test('Kappa equation: result and base formatting retain number-only finite acceptance', async () => {
    const { equation: kappa } = await importAdvancedEquationModule('kappa');
    assert.equal(kappa.computeResult({ gamma: 2, beta: 3, alpha: 4 }), 24);
    assert.equal(kappa.computeResult({ gamma: '2', beta: 3, alpha: 4 }), 0);
    assert.equal(kappa.computeResult({ gamma: Infinity, beta: 3, alpha: 4 }), 0);
    const calls = [];
    const output = kappa.formatBaseEquationValues({
      values: { gamma: 2, beta: '3', alpha: 4 },
      result: 999,
      formatComponent(value) {
        calls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output, 'component:0 = component:2 × component:0 × component:4');
    assert.deepEqual(calls, [0, 2, 0, 4]);
  });

  // --- assets/towerEquations/advanced/lambdaEquation.js ----------------
  await test('Lambda equation: metadata and every upgrade cost curve remain exact', async () => {
    const { equation: lambda } = await importAdvancedEquationModule('lambda');
    assert.equal(lambda.mathSymbol, String.raw`\lambda`);
    assert.deepEqual(lambda.variables.map((variable) => variable.key), [
      'kappa', 'enemyWeight', 'rangeMeters', 'rate',
    ]);
    const [, enemyWeight, rangeMeters, rate] = lambda.variables;
    assert.deepEqual([enemyWeight.cost(2.9), rangeMeters.cost(2.9), rate.cost(2.9)], [
      8, 252, 384,
    ]);
    assert.deepEqual([enemyWeight.cost(-3), rangeMeters.cost(-3), rate.cost(-3)], [
      2, 120, 150,
    ]);
    assert.deepEqual([enemyWeight.cost(Infinity), rangeMeters.cost(Infinity), rate.cost(Infinity)], [
      2, 120, 150,
    ]);
  });

  await test('Lambda equation: presenter-owned upgrade state drives weight and logarithmic rate', async () => {
    const { equation: lambda, blueprintContext } = await importAdvancedEquationModule('lambda');
    const calls = [];
    blueprintContext.ensureTowerUpgradeState = (towerId, blueprint) => {
      calls.push([towerId, blueprint]);
      return { variables: { enemyWeight: { level: 4 }, rate: { level: 3 } } };
    };
    assert.equal(lambda.variables[1].computeValue({ blueprint: lambda, towerId: 'lambda' }), 5);
    const expectedRate = 0.2 + 0.3 * (1 - 1 / (1 + Math.log1p(3)));
    assert.equal(lambda.variables[3].computeValue({ blueprint: lambda, towerId: 'lambda' }), expectedRate);
    assert.deepEqual(calls, [['lambda', lambda], ['lambda', lambda]]);
    blueprintContext.ensureTowerUpgradeState = () => ({ variables: {
      enemyWeight: { level: -4 }, rate: { level: -4 },
    } });
    assert.equal(lambda.variables[1].computeValue({ blueprint: lambda, towerId: 'lambda' }), 1);
    assert.equal(lambda.variables[3].computeValue({ blueprint: lambda, towerId: 'lambda' }), 0.2);
  });

  await test('Lambda equation: Kappa sub-equation preserves helper order and finite fallbacks', async () => {
    const { equation: lambda, blueprintContext, formatCalls } =
      await importAdvancedEquationModule('lambda');
    const calls = [];
    const fallbackBlueprint = { fallback: true };
    blueprintContext.getTowerEquationBlueprint = (towerId) => {
      calls.push(['blueprint', towerId]);
      return fallbackBlueprint;
    };
    blueprintContext.computeTowerVariableValue = (towerId, variableKey, blueprint) => {
      calls.push(['variable', towerId, variableKey, blueprint]);
      return Infinity;
    };
    assert.deepEqual(lambda.variables[0].getSubEquations({
      blueprint: null, towerId: 'lambda', value: -7,
    }), [
      { expression: String.raw`\( atk = \kappa \times N_{\text{eff}} \)` },
      {
        values: String.raw`\( game:0 = game:0 \times decimal:1:2 \)`,
        variant: 'values',
      },
    ]);
    assert.deepEqual(calls, [
      ['blueprint', 'lambda'],
      ['variable', 'lambda', 'enemyWeight', fallbackBlueprint],
    ]);
    assert.deepEqual(formatCalls, [['game', 0], ['game', 0], ['decimal', 1, 2]]);
  });

  await test('Lambda equation: result and base formatting preserve default enemy weight', async () => {
    const { equation: lambda } = await importAdvancedEquationModule('lambda');
    assert.equal(lambda.computeResult({ kappa: 7, enemyWeight: 3 }), 21);
    assert.equal(lambda.computeResult({ kappa: 7, enemyWeight: '3' }), 7);
    assert.equal(lambda.computeResult({ kappa: '7', enemyWeight: 3 }), 0);
    const calls = [];
    const output = lambda.formatBaseEquationValues({
      values: { kappa: 7, enemyWeight: Infinity },
      result: 999,
      formatComponent(value) {
        calls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output, 'component:7 = component:7 × component:1');
    assert.deepEqual(calls, [7, 7, 1]);
  });

  // --- assets/towerEquations/advanced/muEquation.js --------------------
  await test('Mu equation: metadata and all Aleph cost curves preserve native numeric behavior', async () => {
    const { equation: mu } = await importAdvancedEquationModule('mu');
    assert.equal(mu.mathSymbol, String.raw`\mu`);
    assert.deepEqual(mu.variables.map((variable) => variable.key), [
      'aleph1', 'range', 'aleph2', 'aleph3',
    ]);
    assert.deepEqual([mu.variables[0].cost(3), mu.variables[2].cost(3), mu.variables[3].cost(3)], [
      8, 14, 9,
    ]);
    assert.deepEqual([mu.variables[0].cost(-2), mu.variables[2].cost(-2), mu.variables[3].cost(-2)], [
      1, 1, 1,
    ]);
    assert.equal(mu.variables[0].cost(Infinity), Infinity);
  });

  await test('Mu equation: tier sub-equations retain Lambda lookup, rounding, and formatter order', async () => {
    const { equation: mu, blueprintContext, formatCalls } = await importAdvancedEquationModule('mu');
    const calls = [];
    blueprintContext.calculateTowerEquationResult = (towerId) => {
      calls.push(towerId);
      return towerId === 'lambda' ? 5 : 0;
    };
    const lines = mu.variables[0].getSubEquations({ level: 2.4, value: 3.6 });
    assert.equal(lines[1].values, String.raw`\( game:200 = game:5 \times (whole:4 \times 10) \)`);
    assert.equal(lines[3].values, String.raw`\( whole:4 = \max(1, whole:4) \)`);
    assert.deepEqual(calls, ['lambda']);
    assert.deepEqual(formatCalls, [
      ['game', 200], ['game', 5], ['whole', 4], ['whole', 4], ['whole', 4],
    ]);
  });

  await test('Mu equation: capacity, generation, result, and base formatting retain exact fallbacks', async () => {
    const { equation: mu, blueprintContext, formatCalls } = await importAdvancedEquationModule('mu');
    mu.variables[1].getSubEquations({ value: Infinity });
    mu.variables[2].getSubEquations({ level: 2.6, value: NaN });
    mu.variables[3].getSubEquations({ level: 2.6, value: -3 });
    assert.deepEqual(formatCalls, [
      ['decimal', 3, 2],
      ['whole', 8], ['whole', 3],
      ['decimal', 0.5, 2], ['whole', 0],
    ]);
    const lookupCalls = [];
    blueprintContext.calculateTowerEquationResult = (towerId) => {
      lookupCalls.push(towerId);
      return 7;
    };
    assert.equal(mu.computeResult({ aleph1: 2.6 }), 210);
    assert.equal(mu.computeResult({ aleph1: '4' }), 70);
    const componentCalls = [];
    const output = mu.formatBaseEquationValues({
      values: { aleph1: Infinity }, result: 70,
      formatComponent(value) {
        componentCalls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output, 'component:70 = component:7 × component:10');
    assert.deepEqual(componentCalls, [70, 7, 10]);
    assert.deepEqual(lookupCalls, ['lambda', 'lambda', 'lambda']);
  });

  // --- assets/towerEquations/advanced/nuEquation.js --------------------
  await test('Nu equation: metadata and dynamic statistics preserve finite-only clamping', async () => {
    const { equation: nu } = await importAdvancedEquationModule('nu');
    assert.equal(nu.mathSymbol, String.raw`\nu`);
    assert.deepEqual(nu.variables.map((variable) => variable.key), [
      'mu', 'damageTotal', 'kills', 'lamed1', 'attackSpeed', 'rangeMeters',
    ]);
    const [, damageTotal, kills, , attackSpeed, rangeMeters] = nu.variables;
    const dynamicContext = { stats: { nuOverkillTotal: 2500, nuKills: 6 } };
    assert.equal(damageTotal.computeValue({ dynamicContext }), 2500);
    assert.equal(kills.computeValue({ dynamicContext }), 6);
    assert.equal(attackSpeed.computeValue({ dynamicContext }), 1.6);
    assert.equal(rangeMeters.computeValue({ dynamicContext }), 3.3);
    for (const malformed of [null, 4, { stats: { nuOverkillTotal: '9', nuKills: Infinity } }]) {
      assert.equal(damageTotal.computeValue({ dynamicContext: malformed }), 0);
      assert.equal(kills.computeValue({ dynamicContext: malformed }), 0);
    }
  });

  await test('Nu equation: Mu sub-equation preserves every helper lookup and fallback in order', async () => {
    const { equation: nu, blueprintContext, formatCalls } = await importAdvancedEquationModule('nu');
    const calls = [];
    const nuBlueprint = { id: 'nu-blueprint' };
    const piBlueprint = { id: 'pi-blueprint' };
    blueprintContext.getTowerEquationBlueprint = (towerId) => {
      calls.push(['blueprint', towerId]);
      return towerId === 'pi' ? piBlueprint : nuBlueprint;
    };
    blueprintContext.computeTowerVariableValue = (towerId, variableKey, blueprint) => {
      calls.push(['variable', towerId, variableKey, blueprint]);
      if (variableKey === 'damageTotal') return 2000;
      if (variableKey === 'kills') return 3;
      if (variableKey === 'lamed1') return 2;
      return 0;
    };
    const lines = nu.variables[0].getSubEquations({
      blueprint: null, towerId: 'nu', value: 10,
    });
    assert.equal(lines[1].values,
      String.raw`\( game:68.33329631010781 = game:10 \times (whole:4^{\ln(decimal:4:2)}) \)`);
    assert.deepEqual(calls, [
      ['blueprint', 'nu'],
      ['variable', 'nu', 'damageTotal', nuBlueprint],
      ['variable', 'nu', 'kills', nuBlueprint],
      ['blueprint', 'pi'],
      ['variable', 'pi', 'lamed1', piBlueprint],
    ]);
    assert.deepEqual(formatCalls, [
      ['game', 68.33329631010781], ['game', 10], ['whole', 4], ['decimal', 4, 2],
    ]);
  });

  await test('Nu equation: Pi Lamed lookup and dynamic sub-equations retain formatter order', async () => {
    const { equation: nu, blueprintContext, formatCalls } = await importAdvancedEquationModule('nu');
    const piBlueprint = { id: 'pi' };
    const calls = [];
    blueprintContext.getTowerEquationBlueprint = (towerId) => {
      calls.push(['blueprint', towerId]);
      return piBlueprint;
    };
    blueprintContext.computeTowerVariableValue = (towerId, variableKey, blueprint) => {
      calls.push(['variable', towerId, variableKey, blueprint]);
      return -4;
    };
    assert.equal(nu.variables[3].computeValue(), 1);
    nu.variables[1].getSubEquations({
      dynamicContext: { stats: { nuKills: 7 } }, value: Infinity,
    });
    nu.variables[4].getSubEquations({
      dynamicContext: { stats: { nuKills: 7 } }, value: Infinity,
    });
    nu.variables[5].getSubEquations({
      dynamicContext: { stats: { nuKills: 7 } }, value: Infinity,
    });
    assert.deepEqual(calls, [
      ['blueprint', 'pi'], ['variable', 'pi', 'lamed1', piBlueprint],
    ]);
    assert.deepEqual(formatCalls, [
      ['decimal', 0, 2], ['whole', 7],
      ['decimal', 1.7000000000000002, 2], ['whole', 7],
      ['decimal', 3.35, 2], ['whole', 7],
    ]);
  });

  await test('Nu equation: result and base formatting retain logarithmic clamps and non-finite fallback', async () => {
    const { equation: nu, formatCalls } = await importAdvancedEquationModule('nu');
    assert.equal(
      nu.computeResult({ mu: 10, damageTotal: 2000, kills: 3, lamed1: 2 }),
      68.33329631010781,
    );
    assert.equal(nu.computeResult({ mu: '10', damageTotal: 2000, kills: 3, lamed1: 2 }), 0);
    assert.equal(nu.computeResult({ mu: 10, damageTotal: Infinity, kills: Infinity, lamed1: 2 }), 10);
    const calls = [];
    const output = nu.formatBaseEquationValues({
      values: { mu: 10, damageTotal: 2000, kills: 3, lamed1: 2 },
      result: 68.33329631010781,
      formatComponent(value) {
        calls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output,
      'component:68.33329631010781 = component:10 × (component:4^{decimal:1.3862943611198906:3})');
    assert.deepEqual(calls, [68.33329631010781, 10, 4]);
    assert.deepEqual(formatCalls, [['decimal', Math.log(4), 3]]);
  });

  // --- assets/towerEquations/advanced/xiEquation.js --------------------
  await test('Xi equation: metadata and all five direct cost formulas remain exact', async () => {
    const { equation: xi } = await importAdvancedEquationModule('xi');
    assert.equal(xi.mathSymbol, String.raw`\xi`);
    assert.deepEqual(xi.variables.map((variable) => variable.key), [
      'nu', 'aleph1', 'aleph2', 'aleph3', 'aleph4', 'aleph5',
    ]);
    assert.deepEqual(xi.variables.slice(1).map((variable) => variable.cost(2.5)), [
      7, 8, 4.5, 15, 23,
    ]);
    assert.deepEqual(xi.variables.slice(1).map((variable) => variable.cost(-10)), [
      1, 1, 1, 1, 1,
    ]);
    assert.deepEqual(xi.variables.slice(1).map((variable) => variable.cost(Infinity)), [
      Infinity, Infinity, Infinity, Infinity, Infinity,
    ]);
  });

  await test('Xi equation: Nu sub-equation preserves chain helper order, rounding, and fallbacks', async () => {
    const { equation: xi, blueprintContext, formatCalls } = await importAdvancedEquationModule('xi');
    const calls = [];
    const fallbackBlueprint = { id: 'xi' };
    blueprintContext.getTowerEquationBlueprint = (towerId) => {
      calls.push(['blueprint', towerId]);
      return fallbackBlueprint;
    };
    blueprintContext.computeTowerVariableValue = (towerId, variableKey, blueprint) => {
      calls.push(['variable', towerId, variableKey, blueprint]);
      return variableKey === 'aleph4' ? 2.6 : 4;
    };
    const lines = xi.variables[0].getSubEquations({
      blueprint: null, towerId: 'xi', value: 10,
    });
    assert.equal(lines[1].values,
      String.raw`\( game:122.86035066475314 = game:10 \times whole:6^{decimal:1.4:2} \)`);
    assert.deepEqual(calls, [
      ['blueprint', 'xi'],
      ['variable', 'xi', 'aleph4', fallbackBlueprint],
      ['variable', 'xi', 'aleph5', fallbackBlueprint],
    ]);
    assert.deepEqual(formatCalls, [
      ['game', 122.86035066475314], ['game', 10], ['whole', 6], ['decimal', 1.4, 2],
    ]);
  });

  await test('Xi equation: Aleph sub-equations preserve fractional values and formatter order', async () => {
    const { equation: xi, formatCalls } = await importAdvancedEquationModule('xi');
    for (const variable of xi.variables.slice(1)) {
      variable.getSubEquations({ level: 2.5, value: NaN });
    }
    assert.deepEqual(formatCalls, [
      ['decimal', 2.25, 2], ['whole', 2.5],
      ['decimal', 6.25, 2], ['whole', 2.5],
      ['decimal', 1.25, 2], ['whole', 2.5],
      ['whole', 5.5], ['whole', 2.5],
      ['decimal', 1.25, 2], ['whole', 2.5],
    ]);
  });

  await test('Xi equation: result remains Nu-only while base formatting preserves callback order', async () => {
    const { equation: xi } = await importAdvancedEquationModule('xi');
    assert.equal(xi.computeResult({ nu: 8, aleph5: 100 }), 8);
    assert.equal(xi.computeResult({ nu: -8, aleph5: 100 }), 0);
    assert.equal(xi.computeResult({ nu: '8', aleph5: 100 }), 0);
    const calls = [];
    const output = xi.formatBaseEquationValues({
      values: { nu: -8 }, result: 5,
      formatComponent(value) {
        calls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output, 'component:5 = component:0 × (\\text{chain}^{\\text{exp}})');
    assert.deepEqual(calls, [5, 0]);
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

  // --- assets/towerEquations/advanced/omicronEquation.js -----------------
  await test('Omicron equation: metadata, references, costs, and value formatting remain exact', async () => {
    const { equation: omicron, formatCalls } = await importAdvancedEquationModule('omicron');
    assert.equal(omicron.mathSymbol, 'ο');
    assert.equal(omicron.baseEquation, String.raw`\( ο = \delta \times \xi \)`);
    assert.deepEqual(omicron.variables.map(({ key, upgradable }) => ({ key, upgradable })), [
      { key: 'delta', upgradable: false },
      { key: 'xi', upgradable: false },
      { key: 'aleph1', upgradable: true },
      { key: 'aleph2', upgradable: true },
      { key: 'aleph3', upgradable: true },
    ]);
    assert.deepEqual(omicron.variables.slice(0, 2).map((variable) => variable.reference), [
      'delta', 'xi',
    ]);
    const [delta, xi, aleph1, aleph2, aleph3] = omicron.variables;
    assert.deepEqual([
      aleph1.cost(-3), aleph1.cost(2.5),
      aleph2.cost(-3), aleph2.cost(2.5),
      aleph3.cost(-3), aleph3.cost(2.5),
    ], [1, 16, 1, 17, 1, 20.5]);
    assert.equal(delta.format(-2), 'game:0');
    assert.equal(xi.format(4.5), 'decimal:4.5:2');
    assert.equal(aleph1.format(3), 'decimal:4:2%');
    assert.equal(aleph2.format(3), 'decimal:1.3:2 m/s');
    assert.equal(aleph3.format(3), 'whole:4 units');
    assert.deepEqual(formatCalls, [
      ['game', 0], ['decimal', 4.5, 2], ['decimal', 4, 2],
      ['decimal', 1.3, 2], ['whole', 4],
    ]);
  });

  await test('Omicron equation: Delta sub-equations preserve helper call counts and spawn-rate math', async () => {
    const { equation: omicron, blueprintContext, formatCalls } =
      await importAdvancedEquationModule('omicron');
    const calls = [];
    const deltaBlueprint = { id: 'delta-blueprint' };
    blueprintContext.calculateTowerEquationResult = (towerId) => {
      calls.push(['result', towerId]);
      return 4;
    };
    blueprintContext.getTowerEquationBlueprint = (towerId) => {
      calls.push(['blueprint', towerId]);
      return deltaBlueprint;
    };
    blueprintContext.computeTowerVariableValue = (towerId, variableKey, blueprint) => {
      calls.push(['variable', towerId, variableKey, blueprint]);
      return 2;
    };
    assert.deepEqual(omicron.variables[0].getSubEquations({
      blueprint: null, towerId: 'omicron', value: 10,
    }), [
      { expression: String.raw`\( atk = \delta \times \xi \)` },
      { values: String.raw`\( game:40 = game:10 \times game:4 \)`, variant: 'values' },
      { expression: String.raw`\( \text{spd} = \text{spd}_{\delta} / 5 \)` },
      { values: String.raw`\( decimal:0.008:3 = decimal:0.04:3 / 5 \)`, variant: 'values' },
    ]);
    assert.deepEqual(calls, [
      ['result', 'xi'], ['result', 'xi'],
      ['blueprint', 'delta'],
      ['variable', 'delta', 'aleph1', deltaBlueprint],
      ['variable', 'delta', 'aleph1', deltaBlueprint],
    ]);
    assert.deepEqual(formatCalls, [
      ['game', 40], ['game', 10], ['game', 4],
      ['decimal', 0.008, 3], ['decimal', 0.04, 3],
    ]);
    formatCalls.length = 0;
    blueprintContext.calculateTowerEquationResult = null;
    blueprintContext.getTowerEquationBlueprint = null;
    blueprintContext.computeTowerVariableValue = null;
    assert.deepEqual(omicron.variables[0].getSubEquations({
      blueprint: null, towerId: 'omicron', value: NaN,
    }), [
      { expression: String.raw`\( atk = \delta \times \xi \)` },
      { values: String.raw`\( game:0 = game:0 \times game:0 \)`, variant: 'values' },
      { expression: String.raw`\( \text{spd} = \text{spd}_{\delta} / 5 \)` },
      { values: String.raw`\( decimal:0.04:3 = decimal:0.2:3 / 5 \)`, variant: 'values' },
    ]);
  });

  await test('Omicron equation: Xi sub-equations, result fallbacks, and base formatting stay exact', async () => {
    const { equation: omicron, blueprintContext } = await importAdvancedEquationModule('omicron');
    const calls = [];
    blueprintContext.calculateTowerEquationResult = (towerId) => {
      calls.push(towerId);
      return towerId === 'delta' ? 3 : 5;
    };
    assert.deepEqual(omicron.variables[1].getSubEquations({
      blueprint: null, towerId: 'omicron', value: NaN,
    }), [
      { expression: String.raw`\( atk = \delta \times \xi \)` },
      { values: String.raw`\( game:0 = game:3 \times game:0 \)`, variant: 'values' },
    ]);
    assert.deepEqual(calls, ['delta', 'delta']);
    assert.equal(omicron.computeResult({ delta: 4, xi: 5 }), 20);
    calls.length = 0;
    assert.equal(omicron.computeResult({ delta: '4', xi: Infinity }), 15);
    assert.deepEqual(calls, ['delta', 'delta', 'xi', 'xi']);
    blueprintContext.calculateTowerEquationResult = null;
    assert.equal(omicron.computeResult({}), 0);
    const componentCalls = [];
    const output = omicron.formatBaseEquationValues({
      values: { delta: 4, xi: -5 },
      result: -20,
      formatComponent(value) {
        componentCalls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output, 'component:-20 = component:4 × component:0');
    assert.deepEqual(componentCalls, [-20, 4, 0]);
  });

  await test('Omicron equation: golden equation emits literal \\times LaTeX with no tab character', async () => {
    // Authorized display fix: the original JS used `\times` inside a plain
    // template literal, which JavaScript interprets as TAB + "imes" and breaks
    // the golden equation on the omicron tower card. The migrated source must
    // emit the literal `\times` LaTeX operator like every other blueprint.
    const { equation: omicron } = await importAdvancedEquationModule('omicron');
    const output = omicron.formatGoldenEquation({
      formatVariable: (key) => `var:${key}`,
      formatResult: () => 'result:o',
    });
    assert.equal(output, '\\( result:o = var:delta \\times var:xi \\)');
    assert.ok(!output.includes('\t'), 'golden equation must not contain a raw tab character');
  });

  // --- assets/towerEquations/advanced/piEquation.js ----------------------
  await test('Pi equation: metadata, glyph identity, costs, and value formatting remain exact', async () => {
    const { equation: pi, formatCalls } = await importAdvancedEquationModule('pi');
    assert.equal(pi.mathSymbol, String.raw`\pi`);
    assert.equal(pi.baseEquation, String.raw`\( \pi = \omicron^{|\theta| / (100 - \text{Bet}_{1})} \)`);
    assert.deepEqual(pi.variables.map(({ key, upgradable }) => ({ key, upgradable })), [
      { key: 'omicron', upgradable: false },
      { key: 'bet1', upgradable: true },
      { key: 'lamed1', upgradable: true },
      { key: 'rng', upgradable: false },
    ]);
    const [omicron, bet1, lamed1, rng] = pi.variables;
    assert.equal(bet1.symbol, '⁦בּ₁⁩');
    assert.equal(bet1.glyphLabel, '⁦בּ₁⁩');
    assert.deepEqual(
      [bet1.glyphCurrency, bet1.maxLevel, lamed1.glyphCurrency, lamed1.maxLevel],
      ['aleph', 50, 'aleph', 10],
    );
    assert.deepEqual([
      bet1.cost(-3), bet1.cost(NaN), bet1.cost(2.9),
      lamed1.cost(-3), lamed1.cost(2.9),
    ], [2, 2, 8, 5, 15]);
    assert.equal(omicron.format(4.5), 'decimal:4.5:2');
    assert.equal(bet1.format(150), 'whole:1 divisor');
    assert.equal(bet1.format(NaN), 'whole:100 divisor');
    assert.equal(lamed1.format(2.5), 'whole:4.5 lasers');
    assert.equal(rng.format(999), 'decimal:4:2m');
    assert.deepEqual([rng.baseValue, rng.includeInMasterEquation], [4, false]);
    assert.deepEqual(formatCalls, [
      ['decimal', 4.5, 2], ['whole', 1], ['whole', 100],
      ['whole', 4.5], ['decimal', 4, 2],
    ]);
  });

  await test('Pi equation: Omicron sub-equations preserve blueprint fallback and the 180° example', async () => {
    const { equation: pi, blueprintContext, formatCalls } = await importAdvancedEquationModule('pi');
    const calls = [];
    const piBlueprint = { id: 'pi-blueprint' };
    blueprintContext.getTowerEquationBlueprint = (towerId) => {
      calls.push(['blueprint', towerId]);
      return piBlueprint;
    };
    blueprintContext.computeTowerVariableValue = (towerId, variableKey, blueprint) => {
      calls.push(['variable', towerId, variableKey, blueprint]);
      return 60;
    };
    const attack = Math.pow(2, 180 / 40);
    assert.deepEqual(pi.variables[0].getSubEquations({
      blueprint: null, towerId: 'pi', value: 2,
    }), [
      { expression: String.raw`\( \text{atk} = \omicron^{|\theta| / (100 - \text{Bet}_{1})} \)` },
      {
        values: String.raw`\( game:${attack} = decimal:2:2^{180 / whole:40} \text{ (at } 180°) \)`,
        variant: 'values',
      },
    ]);
    assert.deepEqual(calls, [['blueprint', 'pi'], ['variable', 'pi', 'bet1', piBlueprint]]);
    assert.deepEqual(formatCalls, [['game', attack], ['decimal', 2, 2], ['whole', 40]]);
  });

  await test('Pi equation: Bet₁ and Lamed₁ sub-equations preserve divisor math and the glyph line', async () => {
    const { equation: pi, blueprintContext, formatCalls } = await importAdvancedEquationModule('pi');
    const calls = [];
    blueprintContext.calculateTowerEquationResult = (towerId) => {
      calls.push(towerId);
      return 2;
    };
    const attack = Math.pow(2, 360 / 97);
    assert.deepEqual(pi.variables[1].getSubEquations({
      blueprint: {}, towerId: 'pi', level: 3.7, value: NaN,
    }), [
      { expression: String.raw`\( \text{divisor} = 100 - \text{Bet}_{1} \)` },
      { values: String.raw`\( whole:97 = 100 - whole:3 \)`, variant: 'values' },
      {
        expression: String.raw`\( \text{dmg at } 360° = game:${attack} \)`,
        variant: 'values',
        glyphEquation: true,
      },
    ]);
    assert.deepEqual(calls, ['omicron']);
    assert.deepEqual(formatCalls, [['whole', 97], ['whole', 3], ['game', attack]]);
    formatCalls.length = 0;
    assert.deepEqual(pi.variables[2].getSubEquations({ level: 2.9, value: NaN }), [
      { expression: String.raw`\( \text{numLaser} = 2 + \text{Lamed}_{1} \)` },
      { values: String.raw`\( whole:4 = 2 + whole:2 \)`, variant: 'values' },
    ]);
    assert.deepEqual(pi.variables[3].getSubEquations(), [
      { expression: String.raw`\( \text{rng} = 4\text{m} \)` },
    ]);
    assert.deepEqual(formatCalls, [['whole', 4], ['whole', 2]]);
  });

  await test('Pi equation: result clamps, helper fallback, and base formatting remain exact', async () => {
    const { equation: pi, blueprintContext } = await importAdvancedEquationModule('pi');
    assert.equal(pi.computeResult({ omicron: 4, bet1: 90 }), Math.pow(4, 36));
    assert.equal(pi.computeResult({ omicron: 4, bet1: 200 }), Math.pow(4, 50));
    assert.equal(pi.computeResult({ omicron: 0.5, bet1: 0 }), 1);
    const calls = [];
    blueprintContext.calculateTowerEquationResult = (towerId) => {
      calls.push(towerId);
      return 2;
    };
    assert.equal(pi.computeResult({ bet1: 40 }), Math.pow(2, 6));
    assert.deepEqual(calls, ['omicron']);
    blueprintContext.calculateTowerEquationResult = () => NaN;
    assert.equal(pi.computeResult({}), 1);
    const componentCalls = [];
    const output = pi.formatBaseEquationValues({
      values: { omicron: 3, bet1: 50 },
      result: 7,
      formatComponent(value) {
        componentCalls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output, 'component:7 = component:3^{360°/component:50}');
    assert.deepEqual(componentCalls, [7, 3, 50]);
  });

  // --- assets/towerEquations/advanced/chiEquation.js ----------------------
  await test('Chi equation: metadata and Phi-squared core computations remain exact', async () => {
    const { equation: chi, blueprintContext } = await importAdvancedEquationModule('chi');
    assert.equal(chi.mathSymbol, String.raw`\chi`);
    assert.equal(
      chi.baseEquation,
      String.raw`\( \chi = \text{core} \times \text{hpFrac} \times (1 + \text{spd}) \times \text{thralls} \)`,
    );
    assert.deepEqual(chi.variables.map(({ key, upgradable }) => ({ key, upgradable })), [
      { key: 'phiAnchor', upgradable: false },
      { key: 'core', upgradable: false },
      { key: 'healthFraction', upgradable: false },
      { key: 'speedBonus', upgradable: false },
      { key: 'maxThralls', upgradable: false },
    ]);
    assert.equal(chi.variables[0].reference, 'phi');
    assert.deepEqual(chi.variables.map((variable) => variable.includeInMasterEquation), [
      false, true, true, true, true,
    ]);
    const calls = [];
    blueprintContext.calculateTowerEquationResult = (towerId) => {
      calls.push(towerId);
      return 3;
    };
    const [, core, healthFraction, speedBonus, maxThralls] = chi.variables;
    assert.equal(core.computeValue(), 9);
    const normalized = Math.log10(10);
    assert.equal(healthFraction.computeValue(), 0.28 + normalized * 0.05);
    assert.equal(speedBonus.computeValue(), 0.12 + normalized * 0.035);
    assert.equal(maxThralls.computeValue(), 3);
    assert.deepEqual(calls, ['phi', 'phi', 'phi', 'phi']);
    blueprintContext.calculateTowerEquationResult = () => 0;
    assert.equal(core.computeValue(), 1);
    blueprintContext.calculateTowerEquationResult = null;
    assert.equal(core.computeValue(), 1);
  });

  await test('Chi equation: sub-equations preserve clamp displays and percentage formatting', async () => {
    const { equation: chi, blueprintContext, formatCalls } = await importAdvancedEquationModule('chi');
    blueprintContext.calculateTowerEquationResult = () => 3;
    const [phiAnchor, , healthFraction, , maxThralls] = chi.variables;
    assert.deepEqual(phiAnchor.getSubEquations({ value: NaN }), [
      { expression: String.raw`\( \phi_{\text{anchor}} = \phi \)` },
      { values: String.raw`\( game:3 = \phi \)` },
    ]);
    assert.deepEqual(healthFraction.getSubEquations({ value: NaN }), [
      {
        expression: String.raw`\( \text{hpFrac} = \operatorname{clamp}(0.28 + \log_{10}(\chi_{\text{core}} + 1) \times 0.05,\,0.25,\,0.85) \)`,
      },
      {
        values: String.raw`\( percent:0.33 = \operatorname{clamp}(0.28 + decimal:1:2 \times 0.05,\,0.25,\,0.85) \)`,
        variant: 'values',
      },
    ]);
    assert.deepEqual(maxThralls.getSubEquations({ value: 7.4 }), [
      { expression: String.raw`\( \text{thralls} = 2 + \left\lfloor \log_{10}(\chi_{\text{core}} + 1) \right\rceil \)` },
      { values: String.raw`\( whole:7.4 = 2 + \left\lfloor decimal:1:2 \right\rceil \)`, variant: 'values' },
    ]);
    assert.deepEqual(formatCalls, [
      ['game', 3],
      ['percent', 0.33], ['decimal', 1, 2],
      ['whole', 7.4], ['decimal', 1, 2],
    ]);
  });

  await test('Chi equation: result coercion, clamping, and base formatting remain exact', async () => {
    const { equation: chi, formatCalls } = await importAdvancedEquationModule('chi');
    assert.equal(
      chi.computeResult({ core: 9, healthFraction: 0.5, speedBonus: 0.5, maxThralls: 3 }),
      20.25,
    );
    assert.equal(
      chi.computeResult({ core: '2', healthFraction: 0, speedBonus: -3, maxThralls: '0' }),
      0.5,
    );
    assert.equal(chi.computeResult({}), 0.25);
    const componentCalls = [];
    const output = chi.formatBaseEquationValues({
      values: { core: 4, healthFraction: 0.9, speedBonus: 0.25, maxThralls: 2.5 },
      result: 11,
      formatComponent(value) {
        componentCalls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output, 'component:11 = component:4 × percent:0.85 × component:1.25 × component:2.5');
    assert.deepEqual(componentCalls, [11, 4, 1.25, 2.5]);
    assert.deepEqual(formatCalls, [['percent', 0.85]]);
  });

  // --- assets/towerEquations/advanced/psiEquation.js ----------------------
  await test('Psi equation: metadata, glyph labels, and every cost curve remain exact', async () => {
    const { equation: psi } = await importAdvancedEquationModule('psi');
    assert.equal(psi.mathSymbol, String.raw`\psi`);
    assert.equal(
      psi.baseEquation,
      String.raw`\( \psi = \text{merge}_{\text{CD}} \times \text{count}_{\text{max}} \)`,
    );
    assert.deepEqual(psi.variables.map(({ key, glyphLabel }) => ({ key, glyphLabel })), [
      { key: 'mergeCooldown', glyphLabel: 'ℵ₁' },
      { key: 'maxMergeCount', glyphLabel: 'ℵ₂' },
      { key: 'mergeSpeedExponent', glyphLabel: 'ℵ₃' },
      { key: 'aoeRadiusMultiplier', glyphLabel: 'ℵ₄' },
      { key: 'aoeDamageMultiplier', glyphLabel: 'ℵ₅' },
      { key: 'rangeMeters', glyphLabel: 'ℵ₆' },
      { key: 'allowBossMerges', glyphLabel: 'ℵ₇' },
    ]);
    assert.deepEqual(psi.variables.map((variable) => variable.includeInMasterEquation), [
      true, true, false, false, false, false, false,
    ]);
    assert.deepEqual(psi.variables.map((variable) => variable.cost(0)), [
      140, 180, 150, 190, 200, 160, 500,
    ]);
    assert.deepEqual(psi.variables.map((variable) => variable.cost(2.9)), [
      219, 314, 246, 321, 365, 258, Number.MAX_SAFE_INTEGER,
    ]);
    assert.deepEqual(psi.variables.map((variable) => variable.cost(-5)), [
      140, 180, 150, 190, 200, 160, 500,
    ]);
  });

  await test('Psi equation: value formatting and upgrade metadata remain exact', async () => {
    const { equation: psi } = await importAdvancedEquationModule('psi');
    const [cooldown, count, exponent, radius, damage, range, boss] = psi.variables;
    assert.deepEqual(psi.variables.map(({ baseValue, step }) => [baseValue, step]), [
      [6.0, -0.5], [3, 1], [0.5, 0.05], [1.0, 0.15], [1.0, 0.2], [7.0, 0.5], [0, 1],
    ]);
    assert.equal(cooldown.format(NaN), 'decimal:0.5:2s');
    assert.equal(cooldown.format(4.25), 'decimal:4.25:2s');
    assert.equal(count.format(5.7), 'whole:5 enemies');
    assert.equal(exponent.format(0), 'decimal:0.1:3');
    assert.equal(radius.format(1.5), 'decimal:1.5:2× (decimal:3:2m)');
    assert.equal(damage.format(-2), 'decimal:0:2× HP');
    assert.equal(range.format(0), 'decimal:0.5:2m');
    assert.equal(boss.format(1), 'Enabled');
    assert.equal(boss.format(0.9), 'Disabled');
  });

  await test('Psi equation: sub-equations preserve rank derivation and quantized displays', async () => {
    const { equation: psi, formatCalls } = await importAdvancedEquationModule('psi');
    const [cooldown, count, exponent, radius, damage, range, boss] = psi.variables;
    assert.deepEqual(cooldown.getSubEquations({ value: 4.2 }), [
      { expression: String.raw`\( \text{CD} = 6.0 - 0.5 \times \aleph_{1} \)` },
      { expression: String.raw`\( \text{CD} \ge 0.5\,\text{s} \)` },
      { values: String.raw`\( decimal:4.5:2\,\text{s} = 6.0 - 0.5 \times whole:3 \)`, variant: 'values' },
    ]);
    assert.deepEqual(count.getSubEquations({ value: 7.9 }), [
      { expression: String.raw`\( \text{count}_{\text{max}} = 3 + \aleph_{2} \)` },
      { expression: String.raw`\( \text{count}_{\text{max}} \ge 2 \)` },
      { values: String.raw`\( whole:7 = 3 + whole:4 \)`, variant: 'values' },
    ]);
    assert.deepEqual(exponent.getSubEquations({ value: 0.65 }), [
      { expression: String.raw`\( \text{exp}_{\text{spd}} = 0.5 + 0.05 \times \aleph_{3} \)` },
      { expression: String.raw`\( \text{speed}_{\psi} = \overline{\text{speed}}^{\text{exp}_{\text{spd}}} \)` },
      { values: String.raw`\( decimal:0.65:3 = 0.5 + 0.05 \times whole:3 \)`, variant: 'values' },
    ]);
    assert.deepEqual(radius.getSubEquations({ value: 1.45 }), [
      { expression: String.raw`\( \text{R}_{\text{AoE}} = 1.0 + 0.15 \times \aleph_{4} \)` },
      { expression: String.raw`\( \text{radius} = 2.0 \times \text{R}_{\text{AoE}} \)` },
      { values: String.raw`\( decimal:2.9:2\,\text{m} = 2.0 \times decimal:1.45:2 \)`, variant: 'values' },
    ]);
    assert.deepEqual(damage.getSubEquations({ value: 1.4 }), [
      { expression: String.raw`\( \text{D}_{\text{AoE}} = 1.0 + 0.2 \times \aleph_{5} \)` },
      { expression: String.raw`\( \text{dmg}_{\text{AoE}} = \text{HP}_{\psi} \times \text{D}_{\text{AoE}} \)` },
      { values: String.raw`\( decimal:1.4:2 = 1.0 + 0.2 \times whole:1 \)`, variant: 'values' },
    ]);
    assert.deepEqual(range.getSubEquations({ value: 9.5 }), [
      { expression: String.raw`\( m = 7.0 + 0.5 \times \aleph_{6} \)` },
      { values: String.raw`\( decimal:9.5:2\,\text{m} = 7.0 + 0.5 \times whole:5 \)`, variant: 'values' },
    ]);
    assert.deepEqual(boss.getSubEquations({ value: 1 }), [
      { expression: String.raw`\( \text{boss} = \aleph_{7} \ge 1 \)` },
      { values: String.raw`\( \text{status} = \text{enabled} \)`, variant: 'values' },
    ]);
    assert.deepEqual(boss.getSubEquations({ value: 0.9 })[1], {
      values: String.raw`\( \text{status} = \text{disabled} \)`,
      variant: 'values',
    });
    assert.deepEqual(formatCalls, [
      ['decimal', 4.5, 2], ['whole', 3],
      ['whole', 7], ['whole', 4],
      ['decimal', 0.65, 3], ['whole', 3],
      ['decimal', 2.9, 2], ['decimal', 1.45, 2],
      ['decimal', 1.4, 2], ['whole', 1],
      ['decimal', 9.5, 2], ['whole', 5],
    ]);
  });

  await test('Psi equation: utility result and base formatting remain exact', async () => {
    const { equation: psi, formatCalls } = await importAdvancedEquationModule('psi');
    assert.equal(psi.computeResult({ mergeCooldown: 4, maxMergeCount: 6 }), 15);
    assert.equal(psi.computeResult({}), 5);
    assert.equal(psi.computeResult({ mergeCooldown: 0.1, maxMergeCount: 1.9 }), 40);
    const componentCalls = [];
    const output = psi.formatBaseEquationValues({
      values: { mergeCooldown: 4, maxMergeCount: 6.9 },
      result: 15,
      formatComponent(value) {
        componentCalls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output, 'component:15 = component:6 ÷ decimal:4:2');
    assert.deepEqual(componentCalls, [15, 6]);
    assert.deepEqual(formatCalls, [['decimal', 4, 2]]);
  });

  // --- assets/towerEquations/advanced/omegaEquation.js --------------------
  await test('Omega equation: metadata, glyph labels, and cost curves remain exact', async () => {
    const { equation: omega } = await importAdvancedEquationModule('omega');
    assert.equal(omega.mathSymbol, String.raw`\Omega`);
    assert.equal(omega.baseEquation, String.raw`\( \Omega = \text{slice} \times \text{HP}_{\text{max}} \)`);
    assert.deepEqual(omega.variables.map(({ key, glyphLabel }) => ({ key, glyphLabel })), [
      { key: 'omega_range', glyphLabel: 'ℵ₁' },
      { key: 'omega_particleCount', glyphLabel: 'ℵ₂' },
      { key: 'omega_cooldown', glyphLabel: 'ℵ₃' },
      { key: 'omega_sliceFrac', glyphLabel: 'ℵ₄' },
      { key: 'omega_priorityMode', glyphLabel: 'ℵ₅' },
      { key: 'omega_multiMode', glyphLabel: 'ℵ₆' },
    ]);
    assert.deepEqual(omega.variables.map((variable) => variable.includeInMasterEquation), [
      false, false, false, true, false, false,
    ]);
    assert.deepEqual(omega.variables.map((variable) => variable.cost(0)), [
      400, 500, 600, 800, 150, 200,
    ]);
    assert.deepEqual(omega.variables.map((variable) => variable.cost(2.9)), [
      784, 1051, 1350, 2048, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER,
    ]);
    assert.deepEqual(omega.variables.map((variable) => variable.cost(-5)), [
      400, 500, 600, 800, 150, 200,
    ]);
  });

  await test('Omega equation: value formatting preserves derived ranges, caps, and mode labels', async () => {
    const { equation: omega } = await importAdvancedEquationModule('omega');
    const [range, particles, cooldown, slice, priority, multi] = omega.variables;
    assert.equal(range.format(0.5), 'decimal:1.5:2× (decimal:10.5:2m)');
    assert.equal(particles.format(5.7), 'whole:13 particles');
    assert.equal(cooldown.format(1), 'decimal:2:2× (decimal:2:2s)');
    assert.equal(slice.format(0.5), 'decimal:40:1%');
    assert.equal(slice.format(-1), 'decimal:10:1%');
    assert.equal(priority.format(1), 'Strongest (HP)');
    assert.equal(priority.format(0.9), 'First (Exit)');
    assert.equal(multi.format(1), 'Multi-target');
    assert.equal(multi.format(NaN), 'Single-target');
  });

  await test('Omega equation: sub-equations preserve NaN fallbacks and derived displays', async () => {
    const { equation: omega, formatCalls } = await importAdvancedEquationModule('omega');
    const [range, particles, cooldown, slice, priority, multi] = omega.variables;
    assert.deepEqual(range.getSubEquations({ value: NaN }), [
      { expression: String.raw`\( \text{R}_{\Omega} = 1 + 0.15 \times \aleph_{1} \)` },
      { expression: String.raw`\( \text{range} = 7.0 \times \text{R}_{\Omega} \)` },
      { values: String.raw`\( decimal:14:2\,\text{m} = 7.0 \times decimal:2:2 \)`, variant: 'values' },
    ]);
    assert.deepEqual(particles.getSubEquations({ value: 5.9 }), [
      { expression: String.raw`\( \text{N}_{\text{orb}} = 8 + 2 \times \aleph_{2} \)` },
      { values: String.raw`\( whole:13 = 8 + 2 \times whole:2 \)`, variant: 'values' },
    ]);
    assert.deepEqual(cooldown.getSubEquations({ value: 1 }), [
      { expression: String.raw`\( \text{C}^{-1} = 1 + 0.2 \times \aleph_{3} \)` },
      { expression: String.raw`\( \text{cooldown} = 4.0 / \text{C}^{-1} \)` },
      { values: String.raw`\( decimal:2:2\,\text{s} = 4.0 / decimal:2:2 \)`, variant: 'values' },
    ]);
    assert.deepEqual(slice.getSubEquations({ value: 0.045 }), [
      { expression: String.raw`\( \text{slice} = \min(0.40, 0.10 + 0.015 \times \aleph_{4}) \)` },
      {
        values: String.raw`\( decimal:14.500000000000002:1\% = \min(40\%, 10\% + 1.5\% \times whole:3) \)`,
        variant: 'values',
      },
    ]);
    assert.deepEqual(priority.getSubEquations({ value: 1 }), [
      { expression: String.raw`\( \text{mode}_{\text{pri}} = \aleph_{5} \ge 1 \)` },
      { values: String.raw`\( \text{mode} = \text{strongest} \)`, variant: 'values' },
    ]);
    assert.deepEqual(multi.getSubEquations({ value: 0 }), [
      { expression: String.raw`\( \text{mode}_{\text{dist}} = \aleph_{6} \ge 1 \)` },
      { values: String.raw`\( \text{mode} = \text{single} \)`, variant: 'values' },
    ]);
    assert.deepEqual(formatCalls, [
      ['decimal', 14, 2], ['decimal', 2, 2],
      ['whole', 13], ['whole', 2],
      ['decimal', 2, 2], ['decimal', 2, 2],
      ['decimal', 14.500000000000002, 1], ['whole', 3],
    ]);
  });

  await test('Omega equation: slice-percentage result and base formatting remain exact', async () => {
    const { equation: omega, formatCalls } = await importAdvancedEquationModule('omega');
    assert.equal(omega.computeResult({ omega_sliceFrac: 5 }), 40);
    assert.equal(omega.computeResult({}), 10);
    assert.equal(omega.computeResult({ omega_sliceFrac: '0.1' }), 20);
    assert.equal(omega.computeResult({ omega_sliceFrac: -3 }), 10);
    const componentCalls = [];
    const output = omega.formatBaseEquationValues({
      values: { omega_sliceFrac: 5 },
      result: 40,
      formatComponent(value) {
        componentCalls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output, 'component:40% = decimal:40:1% of max HP');
    assert.deepEqual(componentCalls, [40]);
    assert.deepEqual(formatCalls, [['decimal', 40, 1]]);
  });

  // --- assets/towerEquations/basicTowers.js -------------------------------
  await test('Alpha equation: metadata, costs, glyph-rank sub-equations, and result remain exact', async () => {
    const { module, blueprintContext, formatCalls } = await importGroupedEquationModule('basicTowers');
    const { alpha } = module;
    assert.equal(alpha.mathSymbol, String.raw`\alpha`);
    assert.equal(alpha.baseEquation, 'α = Atk × Spd');
    assert.deepEqual(alpha.variables.map(({ key, glyphLabel, baseValue, step }) => ({
      key, glyphLabel, baseValue, step,
    })), [
      { key: 'atk', glyphLabel: 'ℵ₁', baseValue: 5, step: 5 },
      { key: 'speed', glyphLabel: 'ℵ₂', baseValue: 0.5, step: 0.5 },
    ]);
    const [atk, speed] = alpha.variables;
    assert.deepEqual([atk.cost(-5), atk.cost(0), atk.cost(2.5)], [1, 1, 3.5]);
    assert.equal(speed.cost, undefined);
    assert.equal(atk.format(7), 'whole:7 Atk');
    assert.equal(speed.format(1.5), 'decimal:1.5:2 Spd');
    const rankCalls = [];
    blueprintContext.deriveGlyphRankFromLevel = (level, minimum) => {
      rankCalls.push([level, minimum]);
      return 3;
    };
    formatCalls.length = 0;
    assert.deepEqual(atk.getSubEquations({ level: 2, value: 15 }), [
      {
        expression: String.raw`\( \text{Atk} = 5 \times \aleph_{1} \)`,
        values: String.raw`\( whole:15 = 5 \times whole:3 \)`,
      },
    ]);
    assert.deepEqual(speed.getSubEquations({ level: 2, value: NaN }), [
      {
        expression: String.raw`\( \text{Spd} = 0.5 \times \aleph_{2} \)`,
        values: String.raw`\( decimal:1.5:2 = 0.5 \times decimal:3:2 \)`,
      },
    ]);
    assert.deepEqual(rankCalls, [[2, 1], [2, 1]]);
    assert.deepEqual(formatCalls, [
      ['whole', 15], ['whole', 3],
      ['decimal', 1.5, 2], ['decimal', 3, 2],
    ]);
    assert.equal(alpha.computeResult({ atk: 4, speed: 2 }), 8);
    assert.equal(alpha.computeResult({ atk: '4', speed: 2 }), 0);
    const componentCalls = [];
    const output = alpha.formatBaseEquationValues({
      values: { atk: 4, speed: Infinity },
      result: 8,
      formatComponent(value) {
        componentCalls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output, 'component:8 = component:4 × component:0');
    assert.deepEqual(componentCalls, [8, 4, 0]);
  });

  await test('Beta equation: metadata, glyph sink fields, and every cost curve remain exact', async () => {
    const { module } = await importGroupedEquationModule('basicTowers');
    const { beta } = module;
    assert.equal(beta.mathSymbol, String.raw`\beta`);
    assert.equal(beta.baseEquation, 'β = Atk × Spd × Rng × Slw');
    assert.deepEqual(beta.variables.map(({ key, upgradable }) => ({ key, upgradable })), [
      { key: 'attack', upgradable: true },
      { key: 'speed', upgradable: false },
      { key: 'range', upgradable: false },
      { key: 'betSlow', upgradable: true },
      { key: 'slw', upgradable: false },
      { key: 'slwTime', upgradable: true },
    ]);
    const [, speed, range, betSlow, slw, slwTime] = beta.variables;
    assert.equal(betSlow.symbol, '⁦בּ₁⁩');
    assert.deepEqual(
      [betSlow.glyphCurrency, betSlow.attachedToVariable, betSlow.renderControlsInline],
      ['aleph', 'slw', true],
    );
    assert.deepEqual([betSlow.cost(-3), betSlow.cost(2.9)], [1, 3]);
    assert.deepEqual([slwTime.cost(-2), slwTime.cost(3)], [1, 8]);
    assert.deepEqual([slwTime.baseValue, slwTime.step], [0.5, 0.1]);
    assert.deepEqual([speed.lockedNote, range.lockedNote], [
      'Connect α lattices to accelerate β cadence.',
      'Entangle α lattices to extend β reach.',
    ]);
    assert.equal(slw.format(-3), 'decimal:0:2% slow');
    assert.equal(slwTime.format(2.5), 'decimal:2.5:2 s');
    assert.equal(betSlow.format(-4), 'whole:0');
  });

  await test('Beta equation: attack/speed/range computations preserve helper wiring and errors', async () => {
    const { module, blueprintContext } = await importGroupedEquationModule('basicTowers');
    const { beta } = module;
    const [attack, speed, range] = beta.variables;
    // The original module calls context helpers without optional chaining; an
    // uninitialized context therefore throws a TypeError.
    assert.throws(() => attack.computeValue({ blueprint: {}, towerId: 'beta' }), TypeError);
    const calls = [];
    const betaBlueprint = { id: 'beta-blueprint' };
    blueprintContext.getTowerEquationBlueprint = (towerId) => {
      calls.push(['blueprint', towerId]);
      return betaBlueprint;
    };
    blueprintContext.ensureTowerUpgradeState = (towerId, blueprint) => {
      calls.push(['state', towerId, blueprint]);
      return { variables: { attack: { level: 4 } } };
    };
    blueprintContext.deriveGlyphRankFromLevel = (level, minimum) => {
      calls.push(['rank', level, minimum]);
      return 2;
    };
    blueprintContext.calculateTowerEquationResult = (towerId) => {
      calls.push(['result', towerId]);
      return 10;
    };
    assert.equal(attack.computeValue({ blueprint: null, towerId: 'beta' }), 20);
    assert.deepEqual(calls, [
      ['blueprint', 'beta'],
      ['state', 'beta', betaBlueprint],
      ['rank', 4, 1],
      ['result', 'alpha'],
    ]);
    calls.length = 0;
    const provided = { id: 'provided' };
    assert.equal(attack.computeValue({ blueprint: provided, towerId: 'beta' }), 20);
    assert.deepEqual(calls[0], ['state', 'beta', provided]);
    const connectionCalls = [];
    blueprintContext.getDynamicConnectionCount = (towerType) => {
      connectionCalls.push(towerType);
      return 2;
    };
    assert.equal(speed.computeValue(), 3.5);
    assert.equal(range.computeValue(), 3);
    assert.deepEqual(connectionCalls, ['alpha', 'alpha']);
    assert.deepEqual(speed.getSubEquations(), [
      {
        expression: String.raw`\( \text{Spd} = 0.5 + 1.5 \left( \alpha_{\beta} \right) \)`,
        values: String.raw`\( decimal:3.5:2 = 0.5 + 1.5 \left( whole:2 \right) \)`,
      },
    ]);
  });

  await test('Beta equation: slow-field coercion, cap, sub-equations, and result remain exact', async () => {
    const { module, blueprintContext } = await importGroupedEquationModule('basicTowers');
    const { beta } = module;
    const slw = beta.variables[4];
    const variableCalls = [];
    let betSlowValue = '7';
    blueprintContext.getTowerEquationBlueprint = () => ({ id: 'beta-blueprint' });
    blueprintContext.computeTowerVariableValue = (towerId, variableKey, blueprint) => {
      variableCalls.push([towerId, variableKey, blueprint]);
      return betSlowValue;
    };
    assert.equal(slw.computeValue({ blueprint: {}, towerId: 'beta' }), 34);
    betSlowValue = 25;
    assert.equal(slw.computeValue({ blueprint: {}, towerId: 'beta' }), 60);
    betSlowValue = 'invalid';
    assert.ok(Number.isNaN(slw.computeValue({ blueprint: {}, towerId: 'beta' })));
    betSlowValue = 10;
    assert.deepEqual(slw.getSubEquations({ blueprint: {}, towerId: 'beta' }), [
      {
        expression: String.raw`\( \text{Slw\%} = 20 + 2\,\text{Bet}_{1} \)`,
        values: String.raw`\( decimal:40:2\% = 20 + 2 \times whole:10 \)`,
      },
      {
        expression: String.raw`\( \text{Slw\%} \leq 60 \)`,
        glyphEquation: true,
      },
    ]);
    assert.deepEqual(variableCalls.map(([, key]) => key), [
      'betSlow', 'betSlow', 'betSlow', 'betSlow',
    ]);
    assert.equal(beta.computeResult({ attack: 2, speed: 3, range: 4, slw: 50 }), 12);
    assert.equal(beta.computeResult({ attack: 2, speed: 3, range: 4, slw: -50 }), 0);
    const componentCalls = [];
    const output = beta.formatBaseEquationValues({
      values: { attack: 2, speed: 3, range: 4, slw: 50 },
      result: 12,
      formatComponent(value) {
        componentCalls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output, 'component:12 = component:2 × component:3 × component:4 × component:50%');
    // slowText is built before the returned template, so slw formats first.
    assert.deepEqual(componentCalls, [50, 12, 2, 3, 4]);
  });

  await test('Gamma equation: metadata, costs, inherited chains, and result remain exact', async () => {
    const { module, blueprintContext } = await importGroupedEquationModule('basicTowers');
    const { gamma } = module;
    assert.equal(gamma.mathSymbol, String.raw`\gamma`);
    assert.equal(gamma.baseEquation, 'γ = Atk × Spd × Rng × Prc × Brst');
    assert.deepEqual(gamma.variables.map((variable) => variable.key), [
      'attack', 'speed', 'range', 'pierce', 'brst',
    ]);
    const [attack, speed, range, pierce, brst] = gamma.variables;
    assert.deepEqual([brst.cost(-3), brst.cost(2)], [5, 125]);
    assert.equal(pierce.cost, undefined);
    assert.deepEqual([pierce.baseValue, pierce.step, brst.baseValue, brst.step], [1, 1, 5, 5]);
    const calls = [];
    blueprintContext.getTowerEquationBlueprint = () => ({ id: 'gamma-blueprint' });
    blueprintContext.ensureTowerUpgradeState = () => ({ variables: {} });
    blueprintContext.deriveGlyphRankFromLevel = (level, minimum) => {
      calls.push(['rank', level, minimum]);
      return 3;
    };
    blueprintContext.calculateTowerEquationResult = (towerId) => {
      calls.push(['result', towerId]);
      return 7;
    };
    blueprintContext.getDynamicConnectionCount = (towerType) => {
      calls.push(['connections', towerType]);
      return 2;
    };
    assert.equal(attack.computeValue({ blueprint: {}, towerId: 'gamma' }), 21);
    assert.equal(speed.computeValue(), 1);
    assert.equal(range.computeValue(), 5);
    assert.deepEqual(calls, [
      ['rank', 0, 1], ['result', 'beta'],
      ['connections', 'alpha'], ['connections', 'beta'],
    ]);
    assert.deepEqual(pierce.getSubEquations({ level: 1, value: NaN }), [
      {
        expression: String.raw`\( \text{Prc} = \aleph_{2} \)`,
        values: String.raw`\( whole:3 = whole:3 \)`,
      },
    ]);
    assert.deepEqual(brst.getSubEquations({ level: 1, value: NaN }), [
      {
        expression: String.raw`\( \text{Brst} = 5 \times (1 + \aleph) \)`,
        values: String.raw`\( decimal:20:2 = 5 \times (1 + whole:3) \)`,
      },
    ]);
    assert.equal(gamma.computeResult({ attack: 2, speed: 3, range: 4, pierce: 5, brst: 6 }), 720);
    const componentCalls = [];
    const output = gamma.formatBaseEquationValues({
      values: { attack: 2, speed: 3, range: 4, pierce: 5, brst: 6 },
      result: 720,
      formatComponent(value) {
        componentCalls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(
      output,
      'component:720 = component:2 × component:3 × component:4 × component:5 × component:6s',
    );
    // burstText is built before the returned template, so brst formats first.
    assert.deepEqual(componentCalls, [6, 720, 2, 3, 4, 5]);
  });

  // --- assets/towerEquations/infinityTower.js ------------------------------
  await test('Infinity equation: metadata, factory variables, and cost curves remain exact', async () => {
    const { module } = await importGroupedEquationModule('infinityTower');
    const { infinity } = module;
    assert.equal(infinity.mathSymbol, String.raw`\infty`);
    assert.equal(infinity.baseEquation, String.raw`\( \infty = \text{Exp} \times \text{Rng} \)`);
    assert.deepEqual(infinity.variables.map((variable) => variable.key), [
      'exponent', 'range', 'bonusMultiplier',
      'mulAleph', 'mulBet', 'mulLamed', 'mulTsadi', 'mulShin', 'mulKuf',
    ]);
    const [exponent, range, bonusMultiplier, mulAleph] = infinity.variables;
    assert.deepEqual([exponent.cost(2), range.cost(2), mulAleph.cost(2)], [22, 29, 11]);
    assert.equal(bonusMultiplier.cost, undefined);
    assert.equal(range.baseValue, 2 * Math.E);
    assert.equal(bonusMultiplier.baseValue, Math.E);
    assert.deepEqual(
      infinity.variables.slice(3).map(({ symbol, upgradable, includeInMasterEquation }) => ({
        symbol, upgradable, includeInMasterEquation,
      })),
      [
        { symbol: 'ℵ', upgradable: true, includeInMasterEquation: false },
        { symbol: 'ב', upgradable: true, includeInMasterEquation: false },
        { symbol: 'ל', upgradable: true, includeInMasterEquation: false },
        { symbol: 'צ', upgradable: true, includeInMasterEquation: false },
        { symbol: 'ש', upgradable: true, includeInMasterEquation: false },
        { symbol: 'ק', upgradable: true, includeInMasterEquation: false },
      ],
    );
    assert.equal(exponent.format(1.5), 'decimal:1.5:2 Exp');
    assert.equal(range.format(3), 'decimal:3:2m');
    assert.equal(bonusMultiplier.format(2), '×decimal:2:2');
    assert.equal(mulAleph.format(0), 'whole:1 ℵ');
  });

  await test('Infinity equation: exponent preserves two-read unspent-Thero coercion and notes', async () => {
    const { module, blueprintContext } = await importGroupedEquationModule('infinityTower');
    const { infinity } = module;
    const [exponent] = infinity.variables;
    blueprintContext.getTowerEquationBlueprint = () => ({ id: 'infinity-blueprint' });
    blueprintContext.ensureTowerUpgradeState = () => ({ variables: { exponent: { level: 2 } } });
    blueprintContext.deriveGlyphRankFromLevel = () => 2;
    let unspentReads = 0;
    const changingContext = {
      get unspentThero() {
        unspentReads += 1;
        return unspentReads === 1 ? 100 : '1000';
      },
    };
    assert.equal(exponent.computeValue({
      blueprint: {}, towerId: 'infinity', dynamicContext: changingContext,
    }), Math.log(1000) * 2);
    assert.equal(unspentReads, 2);
    assert.equal(exponent.computeValue({
      blueprint: {}, towerId: 'infinity', dynamicContext: null,
    }), 0);
    assert.equal(exponent.computeValue({
      blueprint: {}, towerId: 'infinity', dynamicContext: { unspentThero: '50' },
    }), 0);
    assert.deepEqual(exponent.getSubEquations({
      level: 3, value: NaN, dynamicContext: { unspentThero: 1000 },
    }), [
      {
        expression: String.raw`\( \text{Exp} = \ln(\text{þ}) \times \aleph_{1} \)`,
        values: String.raw`\( decimal:${Math.log(1000) * 2}:2 = \ln(game:1000) \times whole:2 \)`,
      },
      {
        expression: String.raw`\( \text{þ} = \text{unspent thero (player money)} \)`,
        variant: 'note',
      },
    ]);
  });

  await test('Infinity equation: range and glyph allocations preserve rank math and identities', async () => {
    const { module, blueprintContext } = await importGroupedEquationModule('infinityTower');
    const { infinity } = module;
    const [, range, , mulAleph] = infinity.variables;
    const stateCalls = [];
    blueprintContext.getTowerEquationBlueprint = () => ({ id: 'infinity-blueprint' });
    blueprintContext.ensureTowerUpgradeState = (towerId, blueprint) => {
      stateCalls.push([towerId, blueprint]);
      return { variables: { range: { level: 5 }, mulAleph: { level: 3 } } };
    };
    blueprintContext.deriveGlyphRankFromLevel = (level) => (Number(level) || 0) + 1;
    assert.equal(range.computeValue({ blueprint: {}, towerId: 'infinity' }), 2 * Math.E + 2.5);
    assert.equal(mulAleph.computeValue({ blueprint: {}, towerId: 'infinity' }), 4);
    assert.deepEqual(range.getSubEquations({ level: 5, value: NaN }), [
      {
        expression: String.raw`\( \text{Rng} = 2e + 0.5(\aleph_{2} - 1) \)`,
        values: String.raw`\( decimal:${2 * Math.E}:2 = decimal:${2 * Math.E}:2 + 0.5(whole:6 - 1) \)`,
      },
      {
        expression: String.raw`\( e \approx 2.718 \text{ (Euler's number)} \)`,
        variant: 'note',
      },
    ]);
    assert.deepEqual(mulAleph.getSubEquations({ value: 4 }), [
      {
        expression: String.raw`\( \text{ℵ} = whole:4 \)`,
        variant: 'values',
        glyphEquation: true,
      },
    ]);
  });

  await test('Infinity equation: fused multiplier order, fallbacks, and result remain exact', async () => {
    const { module, blueprintContext } = await importGroupedEquationModule('infinityTower');
    const { infinity } = module;
    const bonusMultiplier = infinity.variables[2];
    const variableCalls = [];
    const glyphValues = { mulAleph: 3, mulBet: 2 };
    blueprintContext.getTowerEquationBlueprint = () => ({ id: 'infinity-blueprint' });
    blueprintContext.computeTowerVariableValue = (towerId, variableKey) => {
      variableCalls.push(variableKey);
      return glyphValues[variableKey];
    };
    assert.equal(
      bonusMultiplier.computeValue({ blueprint: {}, towerId: 'infinity' }),
      Math.max(1, Math.log(6)),
    );
    assert.deepEqual(variableCalls, [
      'mulAleph', 'mulBet', 'mulLamed', 'mulTsadi', 'mulShin', 'mulKuf',
    ]);
    const lines = bonusMultiplier.getSubEquations({ blueprint: {}, towerId: 'infinity', value: NaN });
    assert.equal(
      lines[0].values,
      String.raw`\( decimal:${Math.log(6)}:2 = \ln(whole:3 \times whole:2 \times whole:1 \times whole:1 \times whole:1 \times whole:1) \)`,
    );
    assert.equal(lines[0].glyphEquation, true);
    assert.deepEqual(lines[1], {
      expression: String.raw`\( \text{Allocate glyphs below to boost the fused product} \)`,
      variant: 'note',
    });
    assert.equal(infinity.computeResult({ exponent: 2, range: 3 }), 6);
    assert.equal(infinity.computeResult({}), 0);
    assert.equal(infinity.computeResult({ exponent: 2 }), 2 * (2 * Math.E));
    const componentCalls = [];
    const output = infinity.formatBaseEquationValues({
      values: { exponent: 2 },
      result: 6,
      formatComponent(value) {
        componentCalls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output, `component:6 = component:2 × component:${2 * Math.E}`);
    assert.deepEqual(componentCalls, [6, 2, 2 * Math.E]);
  });

  // --- assets/towerEquations/greekTowers.js --------------------------------
  await test('Delta equation: metadata, costs, gamma inheritance, and golden equation remain exact', async () => {
    const { module, blueprintContext } = await importGroupedEquationModule('greekTowers');
    const { delta } = module;
    assert.equal(delta.mathSymbol, String.raw`\delta`);
    assert.equal(delta.baseEquation, String.raw`\( \delta = \gamma \cdot \ln(\gamma + 1) \)`);
    assert.deepEqual(delta.variables.map(({ key, upgradable, maxLevel }) => ({ key, upgradable, maxLevel })), [
      { key: 'gamma', upgradable: false, maxLevel: undefined },
      { key: 'aleph1', upgradable: true, maxLevel: 4 },
      { key: 'regen', upgradable: false, maxLevel: undefined },
      { key: 'aleph2', upgradable: true, maxLevel: undefined },
    ]);
    const [gamma, aleph1, , aleph2] = delta.variables;
    assert.deepEqual([aleph1.cost(0), aleph1.cost(2.9), aleph1.cost(NaN)], [5, 20, 5]);
    assert.deepEqual([aleph2.cost(0), aleph2.cost(3)], [3, 24]);
    assert.deepEqual(gamma.getSubEquations({ value: 4 }), [
      { expression: String.raw`\( atk = \gamma \cdot \ln(\gamma + 1) \)` },
      {
        values: String.raw`\( game:${4 * Math.log(5)} = game:4 \cdot decimal:${Math.log(5)}:3 \)`,
        variant: 'values',
      },
    ]);
    const definitionCalls = [];
    blueprintContext.getTowerDefinition = (towerId) => {
      definitionCalls.push(towerId);
      return { damage: 6 };
    };
    blueprintContext.calculateTowerEquationResult = () => NaN;
    const lines = aleph1.getSubEquations({ value: 2.4 });
    assert.equal(lines.length, 7);
    assert.equal(lines[1].values, String.raw`\( game:36 = game:6^{whole:2} \)`);
    assert.equal(lines[3].values, String.raw`\( game:25\,\text{s} = 5^{whole:2} \)`);
    assert.equal(lines[5].values, String.raw`\( whole:5 = 3 + whole:2 \)`);
    assert.deepEqual(definitionCalls, ['gamma']);
    assert.equal(delta.computeResult({ gamma: 4 }), 4 * Math.log(5));
    assert.equal(delta.computeResult({ gamma: -4 }), 0);
    const output = delta.formatGoldenEquation({
      formatVariable: (key) => `var:${key}`,
      formatResult: () => 'result:d',
    });
    assert.equal(output, '\\( result:d = var:gamma \\times \\ln(var:gamma + 1) \\)');
  });

  await test('Delta equation: regeneration chain preserves helper wiring and health division', async () => {
    const { module, blueprintContext } = await importGroupedEquationModule('greekTowers');
    const regen = module.delta.variables[2];
    const calls = [];
    const deltaBlueprint = { id: 'delta-blueprint' };
    blueprintContext.getTowerEquationBlueprint = (towerId) => {
      calls.push(['blueprint', towerId]);
      return deltaBlueprint;
    };
    blueprintContext.computeTowerVariableValue = (towerId, variableKey, blueprint) => {
      calls.push(['variable', towerId, variableKey, blueprint]);
      return 2;
    };
    blueprintContext.getTowerDefinition = () => null;
    blueprintContext.calculateTowerEquationResult = () => 5;
    assert.equal(regen.computeValue({ blueprint: null, towerId: 'delta' }), 25 / 20);
    assert.deepEqual(calls, [
      ['blueprint', 'delta'],
      ['variable', 'delta', 'aleph1', deltaBlueprint],
    ]);
    // Missing definition and non-positive equation results fall back to gamma=1.
    blueprintContext.calculateTowerEquationResult = () => 0;
    assert.equal(regen.computeValue({ blueprint: deltaBlueprint, towerId: 'delta' }), 1 / 20);
    assert.deepEqual(regen.getSubEquations({ blueprint: deltaBlueprint, towerId: 'delta' })[1], {
      values: String.raw`\( game:${1 / 20} = game:1 / 20 \)`,
      variant: 'values',
    });
  });

  await test('Epsilon equation: metadata, log-based sub-equations, and zero result remain exact', async () => {
    const { module, blueprintContext } = await importGroupedEquationModule('greekTowers');
    const { epsilon } = module;
    assert.equal(epsilon.mathSymbol, String.raw`\varepsilon`);
    assert.equal(epsilon.baseEquation, String.raw`\( \text{Atk} = (\text{NumHits})^{2} \)`);
    assert.deepEqual(epsilon.variables.map((variable) => variable.key), ['aleph1', 'aleph2', 'aleph3']);
    assert.deepEqual(epsilon.variables.map((variable) => variable.cost(2.5)), [3.5, 3.5, 3.5]);
    blueprintContext.getTowerEquationBlueprint = () => ({});
    const [aleph1, aleph2, aleph3] = epsilon.variables;
    assert.deepEqual(aleph1.getSubEquations({ blueprint: null, towerId: 'epsilon', value: 3 }), [
      { expression: String.raw`\( \text{Spd} = 10 \cdot \log(\aleph_{1} + 1) \)` },
      {
        values: String.raw`\( decimal:${10 * Math.log(4)}:2 = 10 \cdot \log( whole:3 + 1 ) \)`,
        variant: 'values',
        glyphEquation: true,
      },
    ]);
    assert.equal(
      aleph2.getSubEquations({ value: 3 })[1].values,
      String.raw`\( decimal:${5 * Math.log(5)}:2 = 5 \cdot \log( whole:3 + 2 ) \)`,
    );
    assert.equal(
      aleph3.getSubEquations({ value: 3 })[1].values,
      String.raw`\( decimal:${2 * (10 - 3 * Math.log(3))}:2 = 2 ( 10 - whole:3 \cdot decimal:${Math.log(3)}:2 ) \)`,
    );
    assert.equal(
      aleph3.getSubEquations({ value: 0 })[1].values,
      String.raw`\( decimal:20:2 = 2 ( 10 - whole:0 \cdot decimal:0:2 ) \)`,
    );
    assert.equal(epsilon.computeResult({ aleph1: 5 }), 0);
    assert.equal(epsilon.formatGoldenEquation(), String.raw`\( \text{Atk} = (\text{NumHits})^{2} \)`);
  });

  await test('Zeta equation: metadata, cascade cost gate, and derived stat clamps remain exact', async () => {
    const { module, blueprintContext } = await importGroupedEquationModule('greekTowers');
    const { zeta } = module;
    assert.equal(zeta.mathSymbol, String.raw`\zeta`);
    assert.deepEqual(zeta.variables.map((variable) => variable.key), [
      'aleph1', 'aleph2', 'aleph3', 'aleph4', 'aleph5', 'aleph6',
      'crt', 'atk', 'spd', 'rng', 'tot',
    ]);
    const aleph4 = zeta.variables[3];
    assert.deepEqual([aleph4.cost(0), aleph4.cost(1), aleph4.cost(2), aleph4.cost(9)], [10, 10, Infinity, Infinity]);
    assert.deepEqual([aleph4.maxLevel, zeta.variables[2].maxLevel], [2, 3]);
    const values = { aleph1: 2, aleph2: 3, aleph3: 4, aleph4: 5, aleph5: '2', aleph6: '3' };
    blueprintContext.getTowerEquationBlueprint = () => ({});
    blueprintContext.computeTowerVariableValue = (towerId, variableKey) => values[variableKey];
    blueprintContext.calculateTowerEquationResult = () => 10;
    const [, , , , , , crt, atk, spd, rng, tot] = zeta.variables;
    // Raw helper values multiply with native coercion before the 1-floor.
    assert.equal(crt.computeValue({ blueprint: null, towerId: 'zeta' }), 6);
    values.crt = 6;
    assert.equal(atk.computeValue({ blueprint: null, towerId: 'zeta' }), 10 * 6 * 2);
    assert.equal(spd.computeValue({ blueprint: null, towerId: 'zeta' }), 1);
    values.aleph2 = 100;
    assert.equal(spd.computeValue({ blueprint: null, towerId: 'zeta' }), 7);
    assert.equal(rng.computeValue({ blueprint: null, towerId: 'zeta' }), 1.5 + 0.5 * 4);
    assert.equal(tot.computeValue({ blueprint: null, towerId: 'zeta' }), 4);
    assert.deepEqual(tot.getSubEquations({ blueprint: null, towerId: 'zeta' })[1], {
      values: String.raw`\( whole:4 = 2 + whole:2 \)`,
      variant: 'values',
    });
    assert.equal(
      zeta.computeResult({ atk: 2, crt: 3, spd: 4, rng: 5, tot: 6 }),
      2 * 3 * 4 * 5 * 6,
    );
    assert.equal(zeta.computeResult({ atk: 2, spd: 4, rng: 5, tot: 6 }), 2 * 1 * 4 * 5 * 6);
    const componentCalls = [];
    const output = zeta.formatBaseEquationValues({
      values: { atk: 2, crt: 3, spd: 4, rng: 5, tot: 6 },
      result: 720,
      formatComponent(value) {
        componentCalls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(
      output,
      'component:720 = component:2 × component:3 × component:4 × component:5 × component:6',
    );
    assert.deepEqual(componentCalls, [720, 2, 3, 4, 5, 6]);
  });

  await test('Zeta equation: aleph sub-equations preserve level fallbacks and formatter order', async () => {
    const { module, formatCalls } = await importGroupedEquationModule('greekTowers');
    const [aleph1, aleph2, , , aleph5] = module.zeta.variables;
    assert.deepEqual(aleph1.getSubEquations({ level: 2, value: NaN }), [
      { expression: String.raw`\( \aleph_{1} = 1 + \text{Level} \)` },
      { values: String.raw`\( whole:3 = 1 + whole:2 \)`, variant: 'values' },
    ]);
    assert.deepEqual(aleph2.getSubEquations({ level: 2, value: 9 })[1], {
      values: String.raw`\( whole:9 = whole:2 \)`,
      variant: 'values',
    });
    assert.deepEqual(aleph5.getSubEquations({ level: 3, value: NaN })[1], {
      values: String.raw`\( decimal:2.5:2 = 1 + 0.5 \times decimal:3:2 \)`,
      variant: 'values',
    });
    assert.deepEqual(formatCalls, [
      ['whole', 3], ['whole', 2],
      ['whole', 9], ['whole', 2],
      ['decimal', 2.5, 2], ['decimal', 3, 2],
    ]);
  });

  await test('Eta equation: attack exponent, ring clamps, and Bet₁ cost ladder remain exact', async () => {
    const { module, blueprintContext } = await importGroupedEquationModule('greekTowers');
    const { eta } = module;
    assert.equal(eta.baseEquation, String.raw`\( \text{Eta} = \dots \)`);
    assert.deepEqual(eta.variables.map((variable) => variable.key), [
      'atk', 'aleph1', 'crt', 'bet1', 'totRing', 'totOrb', 'spdRing',
      'aleph2', 'aleph3', 'aleph4', 'aleph5', 'rng', 'aleph6',
    ]);
    const bet1 = eta.variables[3];
    assert.deepEqual([bet1.cost(0), bet1.cost(1), bet1.cost(2), bet1.cost(9.5)], [1, 5, 10, 10]);
    assert.deepEqual([bet1.glyphCurrency, bet1.maxLevel], ['aleph', 3]);
    const values = { aleph1: 3, crt: 2, bet1: 2, aleph6: 9 };
    blueprintContext.getTowerEquationBlueprint = () => ({});
    blueprintContext.computeTowerVariableValue = (towerId, variableKey) => values[variableKey];
    blueprintContext.calculateTowerEquationResult = () => 4;
    const [atk, , , , totRing, , spdRing, , , , , rng] = eta.variables;
    assert.equal(atk.computeValue({ blueprint: null, towerId: 'eta' }), 144);
    values.crt = 0;
    assert.equal(atk.computeValue({ blueprint: null, towerId: 'eta' }), 1);
    assert.equal(totRing.computeValue({ blueprint: null, towerId: 'eta' }), 4);
    values.bet1 = 9;
    assert.equal(totRing.computeValue({ blueprint: null, towerId: 'eta' }), 5);
    assert.equal(rng.computeValue({ blueprint: null, towerId: 'eta' }), 10);
    values.aleph6 = 2;
    assert.equal(rng.computeValue({ blueprint: null, towerId: 'eta' }), 7);
    const ringValues = { aleph2: 1, aleph3: 2, aleph4: 3, aleph5: 4 };
    blueprintContext.computeTowerVariableValue = (towerId, variableKey) => ringValues[variableKey];
    const lines = spdRing.getSubEquations({ blueprint: null, towerId: 'eta' });
    assert.equal(lines.length, 10);
    const denominator = 1 + 2 + 3 + 4;
    assert.equal(
      lines[1].values,
      String.raw`\( decimal:${1 / denominator}:3 = \frac{1}{whole:1 + whole:2 + whole:3 + whole:4} \)`,
    );
    assert.equal(
      lines[9].values,
      String.raw`\( decimal:${(1 + 2 ** 4) / denominator}:3 = \frac{1 + 2^{whole:4}}{whole:1 + whole:2 + whole:3 + whole:4} \)`,
    );
    assert.equal(eta.computeResult({ atk: 9, crt: 5 }), 9);
    assert.equal(eta.formatGoldenEquation(), String.raw`\( \text{Eta} = \dots \)`);
  });

  await test('Theta equation: slow and efficacy formulas preserve clamps and direct formatting', async () => {
    const { module, blueprintContext } = await importGroupedEquationModule('greekTowers');
    const { theta } = module;
    assert.equal(theta.baseEquation, String.raw`\( \Theta = \text{Rng} \times \text{Slw} \)`);
    assert.deepEqual(theta.variables.map((variable) => variable.key), [
      'rng', 'slw', 'aleph1', 'eff', 'aleph2', 'aleph3',
    ]);
    assert.deepEqual(theta.variables[0].getSubEquations(), [
      { expression: String.raw`\( \text{Rng} = 0.5 \)` },
      { values: String.raw`\( 0.5 = 0.5 \)`, variant: 'values' },
    ]);
    const values = { aleph1: 3, aleph2: 2, aleph3: 1 };
    blueprintContext.getTowerEquationBlueprint = () => ({});
    blueprintContext.computeTowerVariableValue = (towerId, variableKey) => values[variableKey];
    const [, slw, , eff] = theta.variables;
    const expectedSlow = 95 * (1 - Math.exp(-0.1 * 3) * (1 + 0.1 * Math.sin(3))) + 5;
    assert.equal(slw.computeValue({ blueprint: null, towerId: 'theta' }), expectedSlow);
    const expectedEff = (100 * Math.exp(1 / 2) * (1 + (1 / (1.1 + 1)) * Math.sin(0))) / 100;
    assert.equal(eff.computeValue({ blueprint: null, towerId: 'theta' }), expectedEff);
    assert.deepEqual(eff.getSubEquations({ blueprint: null, towerId: 'theta' })[1], {
      values: String.raw`\( \text{Eff}(0) = decimal:${100 * Math.exp(1 / 2)}:1\% \)`,
      variant: 'values',
    });
    assert.equal(theta.computeResult({ rng: 0.5, slw: 40 }), 20);
    assert.equal(
      theta.formatBaseEquationValues({ values: { rng: 0.5, slw: 40 } }),
      'decimal:20:2 = decimal:0.5:2 × decimal:40:2%',
    );
  });

  await test('Iota equation: keyless attack variable, coupling curve, and metadata remain exact', async () => {
    const { module } = await importGroupedEquationModule('greekTowers');
    const { iota } = module;
    assert.equal(iota.baseEquation, String.raw`\( \iota = \text{Atk} \times \text{Spd} \times m \)`);
    assert.deepEqual(iota.variables.map((variable) => variable.key), [
      'aleph0', 'aleph1', 'aleph2', 'aleph3', 'phaseCoupling',
      undefined, 'spd', 'rangeMeters', 'debuff', 'debuffDuration',
    ]);
    assert.equal(iota.variables[5].symbol, 'Atk');
    const [aleph0, aleph1, aleph2, aleph3, phaseCoupling] = iota.variables;
    assert.deepEqual(
      [aleph0.cost(2.9), aleph1.cost(2.9), aleph2.cost(2.9), aleph3.cost(2.9), phaseCoupling.cost(2.9)],
      [4, 5, 6, 7, 5],
    );
    assert.equal(phaseCoupling.glyphCurrency, 'aleph');
    assert.equal(phaseCoupling.format(2.9), 'decimal:0.4:2× coupling');
    assert.equal(phaseCoupling.format(5), `decimal:${0.20 * 5 + 0.05 * 2}:2× coupling`);
    assert.equal(phaseCoupling.format(-1), 'decimal:0:2× coupling');
    const lines = phaseCoupling.getSubEquations({ level: 5, value: NaN });
    assert.equal(
      lines[1].values,
      String.raw`\( decimal:${0.20 * 5 + 0.05 * 2}:2 = 0.20 \times whole:5 + 0.05 \times \max(0,\, whole:5 - 3) \)`,
    );
    assert.equal(lines[1].glyphEquation, true);
  });

  await test('Iota equation: pulse formulas preserve link/aleph math and combined result', async () => {
    const { module, blueprintContext } = await importGroupedEquationModule('greekTowers');
    const { iota } = module;
    const connections = { alpha: 1, beta: 2, gamma: 4 };
    const alephs = { aleph0: 1, aleph1: 2, aleph2: 3, aleph3: 4 };
    const variableCalls = [];
    blueprintContext.getTowerEquationBlueprint = () => ({});
    blueprintContext.getDynamicConnectionCount = (towerType) => connections[towerType];
    blueprintContext.computeTowerVariableValue = (towerId, variableKey) => {
      variableCalls.push([towerId, variableKey]);
      return alephs[variableKey];
    };
    const [, , , , , attack, spd, rangeMeters, debuff, debuffDuration] = iota.variables;
    const connectionMultiplier = 1 + 0.18 * 1 + 0.24 * 2;
    const gammaMultiplier = 1 + 0.45 * Math.sqrt(4);
    const alephMultiplier = 1 + 0.35 * 1 + 0.25 * 2 + 0.2 * 3 + 0.15 * 4;
    assert.equal(
      attack.computeValue({ blueprint: null, towerId: 'iota' }),
      240 * connectionMultiplier * gammaMultiplier * alephMultiplier,
    );
    assert.deepEqual(variableCalls, [
      ['iota', 'aleph0'], ['iota', 'aleph1'], ['iota', 'aleph2'], ['iota', 'aleph3'],
    ]);
    const expectedSpeed = 0.22
      + 0.05 * (1 - Math.exp(-0.6 * 2))
      + 0.03 * (1 - Math.exp(-0.4 * 3))
      + 0.01 * (2 + 0.5 * 4);
    assert.equal(spd.computeValue({ blueprint: null, towerId: 'iota' }), expectedSpeed);
    const expectedRange = 4.2
      + 1.1 * Math.log(1 + 1 + 0.5 * 2 + 0.25 * 3)
      + 0.35 * Math.log(1 + 1 + 2 + 0.5 * 4);
    assert.equal(rangeMeters.computeValue({ blueprint: null, towerId: 'iota' }), expectedRange);
    const expectedResidue = 0.30 + 0.05 * 1 + 0.06 * 2 + 0.08 * 4 + 0.12 * 2 + 0.08 * 3 + 0.06 * 4;
    assert.equal(debuff.computeValue({ blueprint: null, towerId: 'iota' }), expectedResidue);
    const expectedDuration = 3.5 + 0.5 * 1 + 0.25 * 2 + 0.35 * Math.sqrt(4)
      + 0.8 * Math.sqrt(1) + 0.6 * 2 + 0.4 * 3;
    assert.equal(debuffDuration.computeValue({ blueprint: null, towerId: 'iota' }), expectedDuration);
    const attackLines = attack.getSubEquations({ blueprint: null, towerId: 'iota', value: 500 });
    assert.equal(
      attackLines[3].values,
      String.raw`\( game:${500 / 7} = \frac{game:500}{whole:7} \)`,
    );
    assert.equal(iota.computeResult({ attack: 2, spd: 3, rangeMeters: 4 }), 24);
    const componentCalls = [];
    const output = iota.formatBaseEquationValues({
      values: { attack: 2, spd: 3, rangeMeters: Infinity },
      formatComponent(value) {
        componentCalls.push(value);
        return `component:${value}`;
      },
    });
    assert.equal(output, 'component:0 = component:2 × component:3 × component:0');
    assert.deepEqual(componentCalls, [0, 2, 3, 0]);
  });

  // --- assets/gameUnits.js -------------------------------------------------
  await test('game units: conversion factors, guards, and round trips remain exact', async () => {
    const units = await importAsEsm('assets/gameUnits.js');
    assert.equal(units.ALPHA_BASE_RADIUS_FACTOR, 0.025);
    assert.equal(units.ALPHA_BASE_DIAMETER_FACTOR, 0.05);
    assert.equal(units.DEFAULT_TOWER_DIAMETER_METERS, 1);
    assert.equal(units.metersToCanvasFraction(2), 0.1);
    assert.equal(units.metersToCanvasFraction(0), 0);
    assert.equal(units.metersToCanvasFraction(-1), 0);
    assert.equal(units.metersToCanvasFraction(NaN), 0);
    assert.equal(units.canvasFractionToMeters(0.1), 2);
    assert.equal(units.canvasFractionToMeters(Infinity), 0);
    assert.equal(units.metersToPixels(2, 800), 80);
    assert.equal(units.metersToPixels(2, 0), 0);
    assert.equal(units.metersToPixels(NaN, 800), 0);
  });

  // --- assets/geometryHelpers.js -------------------------------------------
  await test('geometry helpers: clamps, orientation transforms, and segment distance remain exact', async () => {
    const geometry = await importAsEsm('assets/geometryHelpers.js');
    assert.equal(geometry.clampNormalizedCoordinate(NaN), 0.5);
    assert.equal(geometry.clampNormalizedCoordinate(0), 0.02);
    assert.equal(geometry.clampNormalizedCoordinate(1), 0.98);
    assert.equal(geometry.clampNormalizedCoordinate(0.4), 0.4);
    assert.deepEqual(geometry.sanitizeNormalizedPoint(null), { x: 0.5, y: 0.5 });
    assert.deepEqual(geometry.sanitizeNormalizedPoint('bad'), { x: 0.5, y: 0.5 });
    assert.deepEqual(
      geometry.sanitizeNormalizedPoint({ x: 0.3, y: 2, speedMultiplier: 1.5 }),
      { x: 0.3, y: 0.98, speedMultiplier: 1.5 },
    );
    assert.deepEqual(
      geometry.sanitizeNormalizedPoint({ x: NaN, y: 0.7, speedMultiplier: Infinity }),
      { x: 0.5, y: 0.7 },
    );
    assert.deepEqual(
      geometry.transformPointForOrientation({ x: 0.3, y: 0.7 }, 'landscape'),
      { x: 0.7, y: 0.7 },
    );
    assert.deepEqual(
      geometry.transformPointForOrientation({ x: 0.3, y: 0.7 }, 'portrait'),
      { x: 0.3, y: 0.7 },
    );
    assert.deepEqual(
      geometry.transformPointFromOrientation({ x: 0.7, y: 0.3 }, 'landscape'),
      { x: 0.7, y: 0.7 },
    );
    assert.equal(
      geometry.distanceSquaredToSegment({ x: 1, y: 1 }, { x: 0, y: 0 }, { x: 0, y: 0 }),
      2,
    );
    assert.equal(
      geometry.distanceSquaredToSegment({ x: 5, y: 1 }, { x: 0, y: 0 }, { x: 2, y: 0 }),
      10,
    );
    assert.equal(
      geometry.distanceSquaredToSegment({ x: 1, y: 1 }, { x: 0, y: 0 }, { x: 2, y: 0 }),
      1,
    );
  });

  // --- assets/playfield/constants.js and utils -----------------------------
  await test('playfield constants, easing, and combat-number trimming remain exact', async () => {
    const constants = await importAsEsm('assets/playfield/constants.js');
    assert.equal(constants.PLAYFIELD_VIEW_DRAG_THRESHOLD, 6);
    assert.equal(constants.PLAYFIELD_VIEW_PAN_MARGIN_METERS, 4);
    assert.deepEqual(
      [constants.PI, constants.HALF_PI, constants.TWO_PI, constants.PI_OVER_6],
      [Math.PI, Math.PI / 2, Math.PI * 2, Math.PI / 6],
    );
    const mathUtils = await importAsEsm('assets/playfield/utils/math.js');
    assert.equal(mathUtils.easeInCubic(0.5), 0.125);
    assert.equal(mathUtils.easeInCubic(-1), 0);
    assert.equal(mathUtils.easeInCubic(2), 1);
    assert.equal(mathUtils.easeOutCubic(0.5), 0.875);
    assert.equal(mathUtils.easeOutCubic(2), 1);
    // Facade harness: identity formatting stub exposes the exact trimming regexes.
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-unit-test-combat-format-'));
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
    const facadeDest = path.join(tmpDir, 'assets', 'playfield', 'utils', 'formatting.js');
    const coreDest = path.join(tmpDir, 'scripts', 'core', 'formatting.js');
    fs.mkdirSync(path.dirname(facadeDest), { recursive: true });
    fs.mkdirSync(path.dirname(coreDest), { recursive: true });
    fs.copyFileSync(
      path.join(rootDir, 'assets', 'playfield', 'utils', 'formatting.js'),
      facadeDest,
    );
    fs.writeFileSync(
      coreDest,
      'export function formatGameNumber(value) { return value; }',
    );
    const facade = await import(pathToFileURL(facadeDest).href);
    assert.equal(facade.formatCombatNumber('1.50'), '1.5');
    assert.equal(facade.formatCombatNumber('2.00'), '2');
    assert.equal(facade.formatCombatNumber('1.50 × 10^5'), '1.5 × 10^5');
    assert.equal(facade.formatCombatNumber('2.00 × 10^5'), '2 × 10^5');
    assert.equal(facade.formatCombatNumber('12.34'), '12.34');
    assert.equal(facade.formatCombatNumber(7), 7);
  });

  // --- scripts/core/mathUtils.js -------------------------------------------
  await test('math utils: clamp variants, lerp, and seeded random range remain exact', async () => {
    const mathUtils = await importAsEsm('scripts/core/mathUtils.js');
    assert.equal(mathUtils.clamp(5, 0, 3), 3);
    assert.equal(mathUtils.clamp(-5, 0, 3), 0);
    // Pre-existing behavior: plain clamp propagates NaN through min/max.
    assert.ok(Number.isNaN(mathUtils.clamp(NaN, 0, 3)));
    assert.equal(mathUtils.clampSafe(NaN, 0, 3), 0);
    assert.equal(mathUtils.clampSafe(5, 0, 3), 3);
    assert.equal(mathUtils.lerp(2, 6, 0.25), 3);
    assert.equal(mathUtils.lerp(2, 6, 2), 10);
    const originalRandom = Math.random;
    try {
      Math.random = () => 0.5;
      assert.equal(mathUtils.randomBetween(2, 6), 4);
    } finally {
      Math.random = originalRandom;
    }
  });

  // --- scripts/core/mathTokens.js ------------------------------------------
  await test('math tokens: regex escaping and equation tokenization remain exact', async () => {
    const tokens = await importAsEsm('scripts/core/mathTokens.js');
    assert.equal(tokens.escapeRegExp(42), '');
    // Pre-existing behavior: the malformed escape class only matches a special
    // character when it is immediately followed by a backslash and ']', so
    // typical symbols pass through unescaped.
    assert.equal(tokens.escapeRegExp('a+b*c'), 'a+b*c');
    assert.equal(tokens.escapeRegExp('x^2'), 'x^2');
    assert.equal(tokens.escapeRegExp(String.raw`a+\]b`), String.raw`a\+\]b`);
    assert.deepEqual(tokens.tokenizeEquationParts('', [{ key: 'a', symbol: 'A' }]), [
      { text: '', variableKey: null },
    ]);
    assert.deepEqual(tokens.tokenizeEquationParts('α = Atk × Spd'), [
      { text: 'α = Atk × Spd', variableKey: null },
    ]);
    assert.deepEqual(tokens.tokenizeEquationParts('α = Atk × Spd', [
      { key: 'atk', symbol: 'Atk' },
      { key: 'speed', symbol: 'Spd' },
      null,
      { key: 'ghost', symbol: '' },
    ]), [
      { text: 'α = ', variableKey: null },
      { text: 'Atk', variableKey: 'atk' },
      { text: ' × ', variableKey: null },
      { text: 'Spd', variableKey: 'speed' },
    ]);
    assert.deepEqual(tokens.tokenizeEquationParts('Spd!', [{ key: 'speed', symbol: 'Spd' }]), [
      { text: 'Spd', variableKey: 'speed' },
      { text: '!', variableKey: null },
    ]);
  });

  // --- assets/formatHelpers.js ---------------------------------------------
  await test('format helpers: subscripts, durations, rewards, and relative time remain exact', async () => {
    const helpers = await importAsEsm('assets/formatHelpers.js');
    assert.equal(helpers.toSubscriptNumber(12), '₁₂');
    assert.equal(helpers.toSubscriptNumber(NaN), '₀');
    assert.equal(helpers.toSubscriptNumber(-3), '₀');
    assert.equal(helpers.formatGlyphLabel('ℵ', 4.9), 'ℵ₄');
    assert.equal(helpers.formatAlephLabel(0), 'ℵ₀');
    assert.equal(helpers.formatDuration(NaN), '—');
    assert.equal(helpers.formatDuration(-1), '—');
    assert.equal(helpers.formatDuration(150), '2m 30s');
    assert.equal(helpers.formatDuration(120), '2m');
    assert.equal(helpers.formatDuration(45), '45s');
    assert.equal(
      helpers.formatRewards(100, 2.6, NaN, (value) => `fmt:${value}`),
      'fmt:100 Σ · +3 Motes/min',
    );
    assert.equal(helpers.formatRewards(NaN, NaN, NaN, () => ''), '—');
    const originalNow = Date.now;
    try {
      Date.now = () => 1_000_000;
      assert.equal(helpers.formatRelativeTime(NaN), null);
      assert.equal(helpers.formatRelativeTime(1_000_500), 'soon');
      assert.equal(helpers.formatRelativeTime(999_000), 'just now');
      assert.equal(helpers.formatRelativeTime(990_000), '10s ago');
      assert.equal(helpers.formatRelativeTime(1_000_000 - 120_000), '2m ago');
      assert.equal(helpers.formatRelativeTime(1_000_000 - 2 * 3_600_000), '2h ago');
      assert.equal(helpers.formatRelativeTime(1_000_000 - 48 * 3_600_000), '2d ago');
    } finally {
      Date.now = originalNow;
    }
  });

  // --- assets/waveEncoder.js -----------------------------------------------
  await test('wave encoder: compact parsing preserves groups, boss adjustment, and letter gate', async () => {
    const encoder = await importAsEsm('assets/waveEncoder.js');
    const waves = encoder.parseCompactWaveString('1:10A1e2+6B5e2/1.5|2:15B5e3/1.2/0.5|3:20C1e4/1.0/0.3/1e5');
    assert.equal(waves.length, 3);
    const [first, second, third] = waves;
    assert.equal(first.count, 16);
    assert.equal(first.minionCount, 16);
    assert.equal(first.interval, 1.5);
    assert.deepEqual(first.enemyGroups.map(({ count, hp, speed, reward, enemyType }) => ({
      count, hp, speed, reward, enemyType,
    })), [
      { count: 10, hp: 100, speed: 0.05, reward: 10, enemyType: 'A' },
      { count: 6, hp: 500, speed: 0.045, reward: 50, enemyType: 'B' },
    ]);
    assert.equal(first.hp, 100);
    assert.equal(first.codexId, 'etype');
    assert.equal('delay' in first, false);
    assert.equal(second.delay, 0.5);
    assert.equal(third.delay, 0.3);
    assert.equal(third.boss.hp, 100000);
    assert.equal(third.boss.reward, 15000);
    assert.equal(third.boss.speed, (55 / 1000) * 0.5);
    assert.equal(third.boss.symbol, 'C');
    // Boss waves reserve one slot from the last group.
    assert.equal(third.enemyGroups[0].count, 19);
    assert.equal(third.minionCount, 19);
    assert.equal(third.count, 20);
    // Letters beyond O exist in ENEMY_TYPES but are rejected by the group regex.
    assert.equal(encoder.ENEMY_TYPES.R.id, 'nullifier');
    assert.deepEqual(encoder.parseCompactWaveString('1:10R1e2/1.5'), []);
    assert.deepEqual(encoder.parseCompactWaveString(null), []);
    assert.deepEqual(encoder.parseCompactWaveString('no-colon'), []);
  });

  await test('wave encoder: encoding, defaults, and validation preserve legacy behavior', async () => {
    const encoder = await importAsEsm('assets/waveEncoder.js');
    const encoded = encoder.encodeWavesToCompact([
      {
        enemyGroups: [
          { count: 10, hp: 100, enemyType: 'A' },
          { count: 6, hp: 500, codexId: 'divisor' },
        ],
        interval: 1.5,
      },
      { count: 15, hp: 5000, codexId: 'divisor', interval: 1.2, delay: 0.5 },
      {
        count: 20,
        hp: 12345,
        codexId: 'prime',
        interval: 1,
        boss: { hp: 100000 },
      },
    ]);
    // Pre-existing behavior: a boss wave without an authored delay writes the
    // zero delay slot twice, which shifts the boss HP out of the parser's
    // four-part destructuring and silently drops the boss on round trip.
    assert.equal(encoded, '1:10A1e2+6B5e2/1.5|2:15B5e3/1.2/0.5|3:21C1.23e4/1/0/0/1e5');
    assert.equal(encoder.encodeWavesToCompact([]), '');
    assert.equal(encoder.encodeWavesToCompact([{ count: 0, hp: 5, codexId: 'prime', interval: 1 }]), '');
    const roundTrip = encoder.parseCompactWaveString(encoded);
    assert.equal(roundTrip.length, 3);
    assert.equal(roundTrip[2].boss, undefined);
    assert.equal(roundTrip[2].count, 21);
    const defaults = encoder.createDefaultWaveString(1);
    assert.equal(defaults.split('|').length, 5);
    assert.equal(defaults.split('|')[0], '1:8A1e2/1.5');
    assert.equal(encoder.createDefaultWaveString(0), '');
    const valid = encoder.validateWaveString('1:10A1e2/1.5');
    assert.deepEqual(valid, { valid: true, errors: [] });
    const invalid = encoder.validateWaveString('1:10R1e2/0');
    assert.equal(invalid.valid, false);
    assert.deepEqual(invalid.errors, [
      "Wave 1: Invalid group format '10R1e2' (expected: [Count][EnemyType][Mantissa]e[Exponent])",
      "Wave 1: Invalid interval '0' (must be positive number)",
    ]);
    assert.equal(encoder.validateWaveString('').valid, false);
    assert.equal(encoder.validateWaveString('nocolon').valid, false);
  });

  // --- scripts/features/towers/alephChain.js -------------------------------
  await test('aleph chain registry: normalization, squared chaining, and upgrades remain exact', async () => {
    const chain = await importAsEsm('scripts/features/towers/alephChain.js');
    assert.deepEqual(chain.ALEPH_CHAIN_DEFAULT_UPGRADES, { x: 1, y: 1, z: 3 });
    assert.equal(Object.isFrozen(chain.ALEPH_CHAIN_DEFAULT_UPGRADES), true);
    const registry = chain.createAlephChainRegistry({ upgrades: { x: -2, y: 2.5, z: 5.9 } });
    assert.equal(registry.getRangeMultiplier(), 1);
    assert.equal(registry.getSpeedMultiplier(), 2.5);
    assert.equal(registry.getLinkCount(), 5);
    assert.equal(registry.registerTower('', 5), null);
    const firstState = registry.registerTower('t1', 3);
    assert.deepEqual(firstState, {
      towerId: 't1', index: 0, baseDamage: 3, totalDamage: 3,
      rangeMultiplier: 1, speedMultiplier: 2.5, linkCount: 5,
    });
    registry.registerTower('t2', 10);
    registry.registerTower('t3', NaN);
    assert.equal(registry.getState('t2').totalDamage, 9);
    assert.equal(registry.getState('t3').totalDamage, 81);
    assert.equal(registry.getState('t3').baseDamage, 0);
    registry.registerTower('t1', 2);
    assert.equal(registry.getState('t3').totalDamage, 16);
    registry.unregisterTower('t2');
    assert.equal(registry.getState('t3').totalDamage, 4);
    registry.setUpgrades({ z: 0.5 });
    assert.equal(registry.getLinkCount(), 1);
    assert.equal(registry.getSpeedMultiplier(), 2.5);
    const overflow = chain.createAlephChainRegistry();
    overflow.registerTower('big', 1e200);
    overflow.registerTower('next', 1);
    assert.equal(overflow.getState('next').totalDamage, Number.MAX_VALUE);
    const copies = registry.getAllStates();
    copies.clear();
    assert.equal(registry.getAllStates().size, 2);
    registry.reset();
    assert.equal(registry.getAllStates().size, 0);
    assert.equal(registry.getState('t1'), null);
  });

  // --- assets/gameplayConfigLoaders.js -------------------------------------
  await test('gameplay config loaders: fallback URL, fetch chain, and embedded lookup remain exact', async () => {
    const loaders = await importAsEsm('assets/gameplayConfigLoaders.js');
    assert.equal(loaders.resolveFallbackUrl('./data/config.json'), null);
    const fetchCalls = [];
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (url, options) => {
        fetchCalls.push([url, options]);
        if (url === 'https://ok.example/config.json') {
          return { ok: true, json: async () => ({ from: url }) };
        }
        if (url === 'https://bad.example/config.json') {
          return { ok: false, status: 503 };
        }
        throw new Error(`network refused: ${url}`);
      };
      assert.deepEqual(
        await loaders.fetchJsonWithFallback('https://ok.example/config.json', './data/config.json'),
        { from: 'https://ok.example/config.json' },
      );
      assert.deepEqual(fetchCalls, [
        ['https://ok.example/config.json', { cache: 'no-store' }],
      ]);
      await assert.rejects(
        loaders.fetchJsonWithFallback('https://bad.example/config.json', './data/config.json'),
        /Failed to load JSON from https:\/\/bad\.example\/config\.json: 503/,
      );
      await assert.rejects(
        loaders.fetchJsonWithFallback('https://down.example/config.json', './data/config.json'),
        /network refused/,
      );
      await assert.rejects(loaders.fetchJsonWithFallback(null, './data/config.json'), /JSON fetch failed/);
      globalThis.fetch = undefined;
      await assert.rejects(
        loaders.loadGameplayConfigViaFetch('https://ok.example/config.json', './data/config.json'),
        /Fetch API is unavailable/,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
    const globalRoot = globalThis;
    const embedded = { defaults: {} };
    try {
      globalRoot.__THERO_EMBEDDED_GAMEPLAY_CONFIG__ = embedded;
      assert.equal(loaders.getEmbeddedGameplayConfig(), embedded);
      globalRoot.__THERO_EMBEDDED_GAMEPLAY_CONFIG__ = 'not-an-object';
      assert.equal(loaders.getEmbeddedGameplayConfig(), null);
      globalRoot.__CUSTOM_CONFIG_KEY__ = embedded;
      assert.equal(loaders.getEmbeddedGameplayConfig('__CUSTOM_CONFIG_KEY__'), embedded);
    } finally {
      delete globalRoot.__THERO_EMBEDDED_GAMEPLAY_CONFIG__;
      delete globalRoot.__CUSTOM_CONFIG_KEY__;
    }
    assert.equal(await loaders.importJsonModule(''), null);
  });

  // --- assets/enemies.js ---------------------------------------------------
  await test('enemy shells: definitions, seeded assignment, and sprite gating remain exact', async () => {
    const enemies = await importAsEsm('assets/enemies.js');
    assert.equal(enemies.ENEMY_SHELL_DEFINITIONS.length, 10);
    assert.equal(enemies.ENEMY_SHELL_DEFINITIONS[0].id, 'armadillo_blue');
    assert.equal(enemies.ENEMY_SHELL_DEFINITIONS[4].backSprite, null);
    const originalRandom = Math.random;
    try {
      Math.random = () => 0.45;
      const enemy = {};
      enemies.assignRandomShell(enemy);
      const expected = enemies.ENEMY_SHELL_DEFINITIONS[4];
      assert.equal(enemy.shellId, expected.id);
      assert.equal(enemy.shellFrontSprite, expected.frontSprite);
      assert.equal(enemy.shellBackSprite, expected.backSprite);
      Math.random = () => 0;
      enemies.assignRandomShell(enemy);
      assert.equal(enemy.shellId, expected.id);
      enemies.assignRandomShell(null);
    } finally {
      Math.random = originalRandom;
    }
    assert.equal(enemies.getEnemyShellSprites(null), null);
    assert.equal(enemies.getEnemyShellSprites({}), null);
    // Node has no Image constructor, so sprites never cache and gating returns null.
    assert.equal(
      enemies.getEnemyShellSprites({ shellFrontSprite: 'front.png', shellBackSprite: 'back.png' }),
      null,
    );
  });

  // --- assets/levels.js ----------------------------------------------------
  await test('levels: clone helpers and configuration normalization remain exact', async () => {
    const levels = await importLevelsModule();
    assert.deepEqual(levels.cloneVectorArray('nope'), []);
    assert.deepEqual(levels.cloneVectorArray([{ x: 1, y: NaN }, null, { x: '2', y: 3 }]), [
      { x: 1, y: 0 },
      { x: 2, y: 3 },
    ]);
    assert.deepEqual(levels.cloneWaveArray([null])[0], {
      count: 0, interval: 1, hp: 0, speed: 0, reward: 0,
    });
    const cloned = levels.cloneWaveArray([{ count: '4', interval: 2, extra: 'kept', enemyGroups: [{ count: 1 }] }])[0];
    assert.deepEqual(cloned, {
      count: 0, interval: 2, hp: 0, speed: 0, reward: 0,
      extra: 'kept', minionCount: undefined, enemyGroups: [{ count: 1 }],
    });
    levels.setLevelBlueprints([{ id: 'L1', isStoryLevel: 1 }, { id: 'L2' }]);
    assert.equal(levels.levelBlueprints[0].isStoryLevel, true);
    assert.equal(levels.levelLookup.get('L2').isStoryLevel, false);
    levels.setLevelConfigs([
      null,
      { id: 'L1', waves: '1:2A1e2/1.5', path: [{ x: 0.1, y: 0.2 }] },
      { id: 'Developer - Test Range', waves: [] },
    ]);
    const parsed = levels.levelConfigs.get('L1');
    assert.equal(parsed.waves.length, 1);
    assert.equal(parsed.waves[0].hp, 100);
    assert.deepEqual(parsed.path, [{ x: 0.1, y: 0.2 }]);
    const testRange = levels.levelConfigs.get('Developer - Test Range');
    assert.equal(testRange.lives, Number.POSITIVE_INFINITY);
    assert.equal(testRange.preventDefeat, true);
    assert.equal(testRange.endlessCycleHpMultiplier, 100);
    assert.equal(testRange.waves.length, 20);
    assert.deepEqual(testRange.waves[0], {
      label: 'Epsilon Type calibration', count: 1, interval: 5,
      hp: 10000, speed: 0.05, reward: 0, color: '#4a90e2', codexId: 'etype',
    });
    assert.equal(levels.isStoryOnlyLevel('L1'), true);
    assert.equal(levels.isStoryOnlyLevel('missing'), false);
  });

  await test('levels: progression, unlock chain, and multiplier overrides remain exact', async () => {
    const levels = await importLevelsModule();
    levels.setLevelBlueprints([{ id: 'A' }, { id: 'B' }, { id: 'C' }]);
    levels.setLevelConfigs([{ id: 'A', waves: [] }, { id: 'B', waves: [] }, { id: 'C', waves: [] }]);
    assert.deepEqual(levels.initializeInteractiveLevelProgression(), ['A', 'B', 'C']);
    assert.equal(levels.isLevelUnlocked('A'), true);
    assert.equal(levels.isLevelUnlocked('B'), false);
    assert.equal(levels.isLevelUnlocked('not-interactive'), true);
    levels.setDeveloperModeUnlockOverride(true);
    assert.equal(levels.isLevelUnlocked('B'), true);
    levels.setDeveloperModeUnlockOverride(false);
    levels.levelState.set('A', { completed: true });
    levels.unlockNextInteractiveLevel('A');
    assert.equal(levels.isLevelUnlocked('B'), true);
    assert.equal(levels.isLevelUnlocked('C'), false);
    assert.equal(levels.getCompletedInteractiveLevelCount(), 1);
    assert.equal(levels.getBaseStartingTheroMultiplier(3), 8);
    assert.equal(levels.getStartingTheroMultiplier(), 2);
    assert.equal(levels.setDeveloperTheroMultiplierOverride(5), 5);
    assert.equal(levels.getStartingTheroMultiplier(), 5);
    assert.equal(levels.setDeveloperTheroMultiplierOverride(-1), null);
    assert.equal(levels.getStartingTheroMultiplier(), 2);
    assert.equal(levels.isSecretLevelId('The Secret Vault'), true);
    assert.equal(levels.isSecretLevelId('Prologue - 1'), false);
    assert.equal(levels.getPreviousInteractiveLevelId('B'), 'A');
    assert.equal(levels.getPreviousInteractiveLevelId('A'), null);
  });

  await test('levels: progress snapshot round trip and prologue migration remain exact', async () => {
    const levels = await importLevelsModule();
    levels.setLevelBlueprints([
      { id: 'Prologue - 1' }, { id: 'Prologue - 2' }, { id: 'Prologue - 3' },
      { id: 'Prologue - Story', isStoryLevel: true }, { id: 'Next' },
    ]);
    levels.setLevelConfigs([
      { id: 'Prologue - 1', waves: [] }, { id: 'Prologue - 2', waves: [] },
      { id: 'Prologue - 3', waves: [] }, { id: 'Next', waves: [] },
    ]);
    levels.initializeInteractiveLevelProgression();
    levels.levelState.set('Prologue - 1', {
      entered: true, completed: true, bestWave: 7.5,
      lastResult: { outcome: 'victory', timestamp: 123, stats: { kills: 9, bogus: NaN } },
    });
    const snapshot = levels.getLevelProgressSnapshot();
    assert.deepEqual(snapshot, {
      version: 1,
      unlocked: ['Prologue - 1'],
      state: [{
        id: 'Prologue - 1', entered: true, completed: true, bestWave: 7.5,
        lastResult: { outcome: 'victory', timestamp: 123, stats: { kills: 9 } },
      }],
    });
    assert.equal(levels.applyLevelProgressSnapshot(null), false);
    const restored = levels.applyLevelProgressSnapshot({
      state: [
        { id: 'Prologue - 1', completed: true },
        { id: 'Prologue - 2', completed: true },
        { id: 'Prologue - 3', completed: true },
        null,
      ],
      unlocked: ['Prologue - 1', 'Prologue - 2', 'Prologue - 3', 'unknown'],
    });
    assert.equal(restored, true);
    // Prologue migration marks the story level complete and unlocked.
    assert.equal(levels.unlockedLevels.has('Prologue - Story'), true);
    assert.deepEqual(levels.levelState.get('Prologue - Story'), {
      entered: true, running: false, completed: true, storySeen: true,
    });
    // Empty unlock list rebuilds the chain from completed state.
    levels.applyLevelProgressSnapshot({
      state: [{ id: 'Prologue - 1', completed: true }],
      unlocked: [],
    });
    assert.equal(levels.unlockedLevels.has('Prologue - 1'), true);
    assert.equal(levels.unlockedLevels.has('Prologue - 2'), true);
  });

  // --- assets/configuration.js ---------------------------------------------
  await test('configuration: applied defaults, loadout normalization, and ladder mirrors remain exact', async () => {
    const { configuration, towersTab, codex, levels, loaders, achievements } =
      await importConfigurationModule();
    const baseResources = {};
    const resourceState = {};
    configuration.registerResourceContainers({ baseResources, resourceState });
    loaders.loaderBehavior.fetchResult = {
      defaults: {
        towerLoadoutLimit: 3.9,
        baseStartThero: 200,
        baseCoreIntegrity: 500,
        initialTowerLoadout: ['beta', 'beta', 'nope', 'alpha', 'gamma'],
        initialUnlockedTowers: ['gamma', 'nope'],
      },
      enemies: [{ id: 'prime' }],
      maps: [
        { id: 'M1', title: 'T1', campaign: 'Story', path: 'p' },
        { id: 'Old Ladder', campaign: 'Ladder' },
        { id: 'Dev Ladder', campaign: 'Ladder', developerOnly: true },
        { id: 'S1', campaign: 'Story', isStoryLevel: true },
      ],
      levels: [{ id: 'M1', displayName: 'D1' }],
    };
    const applied = await configuration.ensureGameplayConfigLoaded();
    assert.equal(configuration.getTowerLoadoutLimit(), 3);
    assert.equal(configuration.getBaseStartThero(), 200);
    assert.equal(configuration.getBaseCoreIntegrity(), 500);
    assert.equal(baseResources.score, 800);
    assert.equal(resourceState.score, 800);
    assert.deepEqual(
      [baseResources.scoreRate, baseResources.energyRate, baseResources.fluxRate],
      [1, 0, 0],
    );
    assert.deepEqual(towersTab.loadoutState.selected, ['beta', 'alpha', 'gamma']);
    assert.deepEqual(Array.from(towersTab.unlockState.unlocked).sort(), ['alpha', 'beta', 'gamma']);
    assert.deepEqual(towersTab.calls.filter(([name]) => name === 'setMergingLogicUnlocked'), [
      ['setMergingLogicUnlocked', true],
    ]);
    assert.deepEqual(codex.codexCalls, [[{ id: 'prime' }]]);
    const ladderMaps = applied.maps.filter((map) => map.campaign === 'Ladder');
    assert.deepEqual(ladderMaps, [
      { id: 'Dev Ladder', campaign: 'Ladder', developerOnly: true },
      {
        id: 'Ladder - M1', title: 'T1 (Endless)', campaign: 'Ladder', path: 'p',
        focus: 'p', example: 'Endless mirror of the story map.', forceEndlessMode: true,
      },
    ]);
    assert.deepEqual(applied.levels[1], {
      id: 'Ladder - M1', displayName: 'D1 (Endless)', campaign: 'Ladder',
      forceEndlessMode: true, isStoryLevel: false,
    });
    assert.deepEqual(achievements.achievementCalls, ['generateLevelAchievements']);
    assert.deepEqual(
      levels.levelCalls.map(([name]) => name),
      ['setLevelBlueprints', 'setLevelConfigs', 'initializeInteractiveLevelProgression', 'pruneLevelState'],
    );
    // A second call reuses the cached configuration without invoking loaders.
    loaders.loaderBehavior.calls.length = 0;
    assert.equal(await configuration.ensureGameplayConfigLoaded(), applied);
    assert.deepEqual(loaders.loaderBehavior.calls, []);
    assert.equal(configuration.getGameplayConfigData(), applied);
    configuration.resetGameplayConfigCache();
    assert.equal(configuration.getGameplayConfigData(), null);
  });

  await test('configuration: loader fallback order, setter guards, and starting Thero remain exact', async () => {
    const { configuration, loaders, levels } = await importConfigurationModule();
    configuration.registerResourceContainers({ baseResources: {}, resourceState: {} });
    loaders.loaderBehavior.fetchError = new Error('fetch down');
    loaders.loaderBehavior.embedded = { defaults: { baseStartThero: 75 } };
    await configuration.ensureGameplayConfigLoaded();
    assert.deepEqual(loaders.loaderBehavior.calls, ['fetch', 'embedded']);
    assert.equal(configuration.getBaseStartThero(), 75);
    configuration.resetGameplayConfigCache();
    loaders.loaderBehavior.calls.length = 0;
    loaders.loaderBehavior.embedded = null;
    loaders.loaderBehavior.moduleResult = { defaults: {} };
    await configuration.ensureGameplayConfigLoaded();
    assert.deepEqual(loaders.loaderBehavior.calls, ['fetch', 'embedded', 'module']);
    assert.equal(configuration.getBaseStartThero(), 50);
    configuration.resetGameplayConfigCache();
    loaders.loaderBehavior.moduleResult = null;
    await assert.rejects(configuration.ensureGameplayConfigLoaded(), /fetch down/);
    levels.multiplierBox.value = 3;
    configuration.setBaseStartThero(100);
    assert.equal(configuration.calculateStartingThero(), 300);
    configuration.setBaseStartThero(-5);
    assert.equal(configuration.getBaseStartThero(), 100);
    configuration.setBaseCoreIntegrity(0);
    assert.equal(configuration.getBaseCoreIntegrity(), 100);
    configuration.setBaseCoreIntegrity(250);
    assert.equal(configuration.getBaseCoreIntegrity(), 250);
    configuration.overrideTowerLoadoutLimit(NaN);
    assert.equal(configuration.getTowerLoadoutLimit(), 2);
    configuration.overrideTowerLoadoutLimit(4.7);
    assert.equal(configuration.getTowerLoadoutLimit(), 4);
  });

  // --- assets/tutorialState.js ---------------------------------------------
  await test('tutorial state: storage keys, unlock flows, and prologue checks remain exact', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-unit-test-tutorial-'));
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
    const assetsDir = path.join(tmpDir, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.copyFileSync(path.join(rootDir, 'assets', 'tutorialState.js'), path.join(assetsDir, 'tutorialState.js'));
    fs.writeFileSync(
      path.join(assetsDir, 'autoSave.js'),
      `export const storage = new Map();
       export const writes = [];
       export function readStorage(key) { return storage.has(key) ? storage.get(key) : null; }
       export function writeStorage(key, value) { writes.push([key, value]); storage.set(key, value); }`,
    );
    const tutorial = await import(pathToFileURL(path.join(assetsDir, 'tutorialState.js')).href);
    const storageStub = await import(pathToFileURL(path.join(assetsDir, 'autoSave.js')).href);
    assert.equal(tutorial.isTutorialCompleted(), false);
    storageStub.storage.set('glyph-defense-idle:tutorial-state', 'completed');
    storageStub.storage.set('glyph-defense-idle:towers-tab-unlocked', 'true');
    storageStub.storage.set('glyph-defense-idle:codex-unlocked', 'false');
    tutorial.loadTutorialState();
    assert.equal(tutorial.isTutorialCompleted(), true);
    assert.equal(tutorial.isTowersTabUnlocked(), true);
    assert.equal(tutorial.isCodexUnlocked(), false);
    assert.equal(tutorial.isAchievementsUnlocked(), false);
    tutorial.unlockCodex();
    tutorial.unlockAchievements();
    assert.deepEqual(storageStub.writes, [
      ['glyph-defense-idle:codex-unlocked', 'true'],
      ['glyph-defense-idle:achievements-unlocked', 'true'],
    ]);
    tutorial.resetTutorialState();
    assert.equal(tutorial.isTutorialCompleted(), false);
    assert.equal(tutorial.isTowersTabUnlocked(), false);
    assert.deepEqual(storageStub.writes.slice(2), [
      ['glyph-defense-idle:tutorial-state', ''],
      ['glyph-defense-idle:towers-tab-unlocked', ''],
      ['glyph-defense-idle:codex-unlocked', ''],
      ['glyph-defense-idle:achievements-unlocked', ''],
    ]);
    const prologueIds = ['Prologue - 1', 'Prologue - 2', 'Prologue - 3', 'Prologue - Story'];
    assert.deepEqual(tutorial.getPrologueLevelIds(), prologueIds);
    tutorial.getPrologueLevelIds().push('mutation');
    assert.deepEqual(tutorial.getPrologueLevelIds(), prologueIds);
    assert.equal(tutorial.isPrologueLevel('Prologue - 2'), true);
    assert.equal(tutorial.isPrologueLevel('Next'), false);
    const checked = [];
    tutorial.checkTutorialCompletion((levelId) => {
      checked.push(levelId);
      return true;
    });
    assert.deepEqual(checked, prologueIds);
    assert.equal(tutorial.isTutorialCompleted(), true);
    checked.length = 0;
    tutorial.checkTutorialCompletion(() => {
      checked.push('called');
      return false;
    });
    assert.deepEqual(checked, []);
  });

  // --- assets/powder/powderState.js ----------------------------------------
  await test('powder state context: configuration, initial state, and element wiring remain exact', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-unit-test-powder-state-'));
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
    const powderDir = path.join(tmpDir, 'assets', 'powder');
    const towersDir = path.join(tmpDir, 'scripts', 'features', 'towers');
    fs.mkdirSync(powderDir, { recursive: true });
    fs.mkdirSync(towersDir, { recursive: true });
    fs.copyFileSync(
      path.join(rootDir, 'assets', 'powder', 'powderState.js'),
      path.join(powderDir, 'powderState.js'),
    );
    fs.writeFileSync(
      path.join(towersDir, 'powderTower.js'),
      `export const DEFAULT_MOTE_PALETTE = { defaultMarker: true };
       export const mergeCalls = [];
       export function mergeMotePalette(palette) {
         mergeCalls.push(palette);
         return { merged: palette };
       }`,
    );
    const stateModule = await import(pathToFileURL(path.join(powderDir, 'powderState.js')).href);
    const towerStub = await import(pathToFileURL(path.join(towersDir, 'powderTower.js')).href);
    const context = stateModule.createPowderStateContext();
    assert.deepEqual(context.powderConfig, {
      sandOffsetInactive: 0, sandOffsetActive: 1, duneHeightBase: 1, duneHeightMax: 6,
      thetaBase: 1.3, zetaBase: 1.6, simulatedDuneGainMax: 3.4, wallBaseGapMotes: 5,
      wallGapPerGlyph: 1, wallMaxGapMotes: 75, alephTierAdvanceCount: 30,
      alephWallTierMin: 1, alephWallTierMax: 15, wallGapViewportRatio: 0.15,
    });
    assert.equal(context.powderState.sandOffset, 1);
    assert.equal(context.powderState.simulationMode, 'sand');
    assert.equal(context.powderState.wallGapTarget, 5);
    assert.deepEqual(context.powderState.motePalette, { merged: { defaultMarker: true } });
    assert.deepEqual(towerStub.mergeCalls, [{ defaultMarker: true }]);
    assert.deepEqual(context.powderState.alephTierTransition, {
      active: false, stage: 'idle', triggerGlyphCount: 0, lockedGlyphsLit: null,
      sourceTier: 1, targetTier: 1, timers: [],
    });
    assert.deepEqual(context.powderGlyphColumns, []);
    assert.equal(context.getPowderElements(), null);
    const elements = { marker: true };
    context.setPowderElements(elements);
    assert.equal(context.getPowderElements(), elements);
  });

  // --- assets/powderDropQueue.js -------------------------------------------
  await test('powder drop queue: flush normalization, color cloning, and clearing remain exact', async () => {
    const queueModule = await importAsEsm('assets/powderDropQueue.js');
    const scheduled = [];
    const drops = [];
    const simulation = { queueDrop: (payload) => drops.push(payload) };
    queueModule.flushPendingMoteDrops({
      powderState: { pendingMoteDrops: null },
      powderSimulation: null,
      schedulePowderBasinSave: () => scheduled.push('no-sim'),
    });
    assert.deepEqual(scheduled, []);
    const color = { r: 1, g: 2 };
    const pending = [4.4, { size: 2.6, color }, { size: 0.2 }, 'invalid', { size: NaN }];
    queueModule.flushPendingMoteDrops({
      powderState: { pendingMoteDrops: pending },
      powderSimulation: simulation,
      schedulePowderBasinSave: () => scheduled.push('saved'),
    });
    assert.deepEqual(drops, [
      { size: 4 },
      { size: 3, color: { r: 1, g: 2 } },
      { size: 1 },
    ]);
    assert.notEqual(drops[1].color, color);
    assert.deepEqual(pending, []);
    assert.deepEqual(scheduled, ['saved']);
  });

  // --- assets/powderEventLog.js --------------------------------------------
  await test('powder event log: entry formats, ordering, and retention limit remain exact', async () => {
    const logModule = await importAsEsm('assets/powderEventLog.js');
    const fragmentItems = [];
    const fakeDocument = {
      createDocumentFragment: () => ({
        items: [],
        append(item) { this.items.push(item); },
      }),
      createElement: () => ({ textContent: '' }),
    };
    const logList = {
      innerHTML: '',
      hiddenAttr: false,
      lastFragment: null,
      setAttribute() { this.hiddenAttr = true; },
      removeAttribute() { this.hiddenAttr = false; },
      append(fragment) {
        this.lastFragment = fragment;
        fragmentItems.length = 0;
        fragment.items.forEach((item) => fragmentItems.push(item.textContent));
      },
    };
    const logEmpty = { hidden: false };
    const originalDocument = globalThis.document;
    try {
      globalThis.document = fakeDocument;
      logModule.configurePowderEventLog({
        formatGameNumber: (value) => `game:${value}`,
        formatDecimal: (value, digits) => `decimal:${value}:${digits}`,
        formatSignedPercentage: (value) => `signed:${value}`,
        getCurrentPowderBonuses: () => ({ sandBonus: 0.25, duneBonus: 0, crystalBonus: 0, totalMultiplier: 1 }),
        powderState: { duneHeight: 3, charges: 2 },
        powderElements: { logList, logEmpty },
      });
      logModule.recordPowderEvent('unknown-type');
      assert.deepEqual(fragmentItems, []);
      logModule.recordPowderEvent('sand-stabilized');
      logModule.recordPowderEvent('dune-raise', {});
      logModule.recordPowderEvent('crystal-charge', {});
      logModule.recordPowderEvent('developer-adjust', { field: 'glyphs', value: '12' });
      assert.deepEqual(fragmentItems, [
        'Developer adjusted Glyph reserves · game:12.',
        'Crystal lattice charged (2/3) · Resonance rising.',
        `Dune surveyed · h = 3, Δm = decimal:${Math.log2(4)}:2.`,
        'Sandfall stabilized · Mote bonus signed:0.25.',
      ]);
      logModule.recordPowderEvent('crystal-charge', { charges: 0 });
      assert.equal(fragmentItems[0], 'Crystal lattice charged (0/3) · Resonance rising.');
      logModule.recordPowderEvent('mode-switch');
      logModule.recordPowderEvent('sand-released');
      logModule.recordPowderEvent('achievement-unlocked', {});
      assert.equal(fragmentItems.length, 6);
      assert.equal(fragmentItems[0], 'Achievement seal unlocked.');
      assert.equal(logEmpty.hidden, true);
    } finally {
      globalThis.document = originalDocument;
    }
  });

  // --- assets/powderPersistence.js -----------------------------------------
  await test('powder persistence: snapshot cloning, migration, and guarded restore remain exact', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thero-unit-test-powder-persistence-'));
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
    const assetsDir = path.join(tmpDir, 'assets');
    const towersDir = path.join(tmpDir, 'scripts', 'features', 'towers');
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.mkdirSync(towersDir, { recursive: true });
    for (const fileName of ['powderPersistence.js', 'saveCompatibility.js']) {
      fs.copyFileSync(path.join(rootDir, 'assets', fileName), path.join(assetsDir, fileName));
    }
    fs.writeFileSync(
      path.join(towersDir, 'powderTower.js'),
      `export function mergeMotePalette(palette) {
         return { defaultMerged: palette };
       }`,
    );
    const persistenceModule = await import(pathToFileURL(path.join(assetsDir, 'powderPersistence.js')).href);
    assert.throws(() => persistenceModule.createPowderPersistence({}), /Well persistence requires state and configuration\./);
    const powderState = {
      sandOffset: 1, duneHeight: 4, charges: 2, simulatedDuneGain: 1.5, wallGlyphsLit: 3,
      glyphsAwarded: 7, pendingMoteDrops: [{ size: 2 }], motePalette: { sand: '#fff' },
      wallGapTarget: 9, viewTransform: { scale: 2, nested: { x: 1 } },
      alephWallTier: 2, alephTierAlephValue: 5, alephTierTransitionCheckpoint: 1,
      simulationMode: 'crystal', loadedSimulationState: { fallback: true },
    };
    const paletteCalls = [];
    const domCalls = [];
    const saveCalls = [];
    const persistence = persistenceModule.createPowderPersistence({
      powderState,
      powderConfig: { marker: true },
      mergeMotePalette: (palette) => {
        paletteCalls.push(palette);
        return { customMerged: palette };
      },
      applyMindGatePaletteToDom: (palette) => domCalls.push(palette),
      schedulePowderBasinSave: () => saveCalls.push('saved'),
      getPowderSimulation: () => null,
    });
    const snapshot = persistence.getPowderBasinSnapshot();
    assert.deepEqual(snapshot.wellOfInspiration.motePalette, { customMerged: { sand: '#fff' } });
    assert.deepEqual(snapshot.wellOfInspiration.pendingMoteDrops, [{ size: 2 }]);
    assert.notEqual(snapshot.wellOfInspiration.pendingMoteDrops[0], powderState.pendingMoteDrops[0]);
    assert.deepEqual(snapshot.wellOfInspiration.viewTransform, { scale: 2, nested: { x: 1 } });
    assert.notEqual(snapshot.wellOfInspiration.viewTransform.nested, powderState.viewTransform.nested);
    assert.equal(snapshot.wellOfInspiration.simulationMode, 'sand');
    assert.deepEqual(snapshot.simulation, { fallback: true });
    persistence.applyPowderBasinSnapshot(null);
    assert.deepEqual(saveCalls, []);
    persistence.applyPowderBasinSnapshot({
      wellOfInspiration: {
        duneHeight: 6,
        charges: Infinity,
        motePalette: { sand: '#123' },
        pendingMoteDrops: [{ size: 5 }, 'raw'],
        viewTransform: { scale: 3 },
        wallGlyphsLit: '4',
      },
      simulation: { restored: true },
    });
    assert.equal(powderState.duneHeight, 6);
    assert.equal(powderState.charges, 2);
    assert.equal(powderState.wallGlyphsLit, '4');
    assert.deepEqual(powderState.motePalette, { customMerged: { sand: '#123' } });
    assert.deepEqual(domCalls, [{ customMerged: { sand: '#123' } }]);
    assert.deepEqual(powderState.pendingMoteDrops, [{ size: 5 }, 'raw']);
    assert.deepEqual(powderState.viewTransform, { scale: 3 });
    assert.equal(powderState.simulationMode, 'sand');
    assert.deepEqual(powderState.loadedSimulationState, { restored: true });
    assert.deepEqual(saveCalls, ['saved']);
    // Legacy aliases route through the shared migration helper.
    persistence.applyPowderBasinSnapshot({ powder: { duneHeight: 2 } });
    assert.equal(powderState.duneHeight, 2);
    assert.equal(powderState.loadedSimulationState, null);
    assert.deepEqual(paletteCalls, [{ sand: '#fff' }, { sand: '#123' }]);
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
