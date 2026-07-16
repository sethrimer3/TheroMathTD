'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

function collectLocalImportGraph(entryRelativePath) {
  const visited = new Set();
  const visit = (relativePath) => {
    const normalized = relativePath.replaceAll('\\', '/');
    if (visited.has(normalized)) {
      return;
    }
    visited.add(normalized);
    const source = read(normalized);
    const importPattern = /(?:from\s+|import\s*)['"]([^'"]+)['"]/g;
    for (const match of source.matchAll(importPattern)) {
      if (!match[1].startsWith('.')) {
        continue;
      }
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(normalized), match[1]));
      if (resolved.endsWith('.js') && fs.existsSync(path.join(root, resolved))) {
        visit(resolved);
      }
    }
  };
  visit(entryRelativePath);
  return visited;
}

const index = read('index.html');
const nav = index.match(/<nav class="tab-bar"[\s\S]*?<\/nav>/)?.[0] || '';
assert.ok(nav, 'primary tab navigation must exist');

const retiredLabels = ['Bet Spire', 'Lamed Spire', 'Tsadi Spire', 'Shin Spire', 'Kuf Spire'];
for (const label of retiredLabels) {
  assert.equal(nav.includes(label), false, `${label} must not appear in active navigation`);
  assert.equal(index.includes(label), false, `${label} must not appear in active HTML`);
}

const tabIds = [...nav.matchAll(/data-tab="([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(tabIds, ['tower', 'towers', 'powder', 'achievements', 'options']);
assert.equal((nav.match(/class="[^"]*tab-button--stacked/g) || []).length, 1);
assert.match(nav, /data-tab="powder"[\s\S]*?aria-label="Well of Inspiration"/);
assert.match(nav, /aria-controls="panel-powder"/);
assert.match(index, /id="panel-powder"[\s\S]*?aria-labelledby="tab-powder"/);
assert.match(index, /id="panel-achievements"[\s\S]*?aria-labelledby="tab-achievements"/);

const activeGraph = collectLocalImportGraph('assets/main.js');
const retiredRuntimeModules = [
  'betSpireConfig.js',
  'betSpirePlaceholder.js',
  'lamedSpireUi.js',
  'tsadiSpireUi.js',
  'shinState.js',
  'shinUI.js',
  'kufState.js',
  'kufUI.js',
  'betTerrariumController.js',
  'achievementsTerrariumPreferences.js',
  'fluidSpirePreferences.js',
  'developerSpamController.js',
  'spireIdleGeneration.js',
  'spireIdleApplication.js',
  'cardinalWardenSimulation.js',
  'shinTower.js',
];
for (const moduleName of retiredRuntimeModules) {
  assert.equal(
    [...activeGraph].some((file) => file.endsWith(`/${moduleName}`) || file === `assets/${moduleName}`),
    false,
    `${moduleName} must not be reachable from assets/main.js`,
  );
}
assert.equal(
  [...activeGraph].some((file) => /assets\/fluidTerrarium[^/]*\.js$/i.test(file)),
  false,
  'legacy Terrarium modules must not be reachable from assets/main.js',
);

const activeSource = [...activeGraph].map((file) => read(file)).join('\n');
assert.doesNotMatch(
  activeSource,
  /getElementById\(['"](?:offline-(?:bet|lamed|tsadi|shin|kuf)|tab-(?:fluid|lamed|tsadi|shin|kuf)|panel-(?:fluid|lamed|tsadi|shin|kuf))/i,
  'active initialization must not query retired DOM ids',
);
assert.match(activeSource, /configureAchievementsTab\(/, 'Achievements must still be configured');
assert.match(activeSource, /bindAchievements\(\)/, 'Achievements must still initialize');
assert.doesNotMatch(activeSource, /stopBetSpireRender|resumeBetSpireRender/);
assert.doesNotMatch(activeSource, /glyphCurrency:\s*['"](?:bet|lamed|tsadi|shin|kuf)['"]/i);
assert.equal(index.includes('achievements-terrarium-host'), false, 'Achievements Terrarium DOM must stay disabled');

assert.equal(fs.existsSync(path.join(root, 'assets/legacy/achievementsTerrarium/README.md')), false);
assert.equal(fs.existsSync(path.join(root, 'assets/betTerrariumController.js')), false);
assert.equal(fs.existsSync(path.join(root, 'assets/achievementsTerrariumPreferences.js')), false);

console.log(`Retired-Spire checks passed (${activeGraph.size} active modules inspected).`);
