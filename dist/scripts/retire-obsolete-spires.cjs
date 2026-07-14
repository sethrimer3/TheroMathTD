'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function edit(relativePath, transform) {
  const filePath = path.join(root, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const updated = transform(source);
  if (updated === source) {
    throw new Error(`No changes made to ${relativePath}`);
  }
  fs.writeFileSync(filePath, updated);
}

function removeBetween(source, start, end, replacement = '') {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) {
    throw new Error(`Unable to locate range: ${start.slice(0, 60)} ... ${end.slice(0, 60)}`);
  }
  return source.slice(0, startIndex) + replacement + source.slice(endIndex);
}

function removeFunction(source, name) {
  const marker = `  function ${name}(`;
  const start = source.indexOf(marker);
  if (start < 0) {
    throw new Error(`Unable to locate function ${name}`);
  }
  const bodyMarker = source.indexOf(') {', start);
  const brace = bodyMarker + 2;
  if (bodyMarker < 0) {
    throw new Error(`Unable to locate body of function ${name}`);
  }
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = brace; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        let end = index + 1;
        while (source[end] === '\r' || source[end] === '\n') end += 1;
        return source.slice(0, start) + source.slice(end);
      }
    }
  }
  throw new Error(`Unable to find end of function ${name}`);
}

function removeImportByModule(source, moduleName) {
  const moduleIndex = source.indexOf(`${moduleName}.js';`);
  if (moduleIndex < 0) {
    throw new Error(`Unable to locate import for ${moduleName}`);
  }
  const importStart = source.lastIndexOf('\nimport ', moduleIndex) + 1;
  const importEnd = source.indexOf('\n', moduleIndex) + 1;
  if (importStart < 0 || importEnd <= 0) {
    throw new Error(`Unable to bound import for ${moduleName}`);
  }
  return source.slice(0, importStart) + source.slice(importEnd);
}

if (process.env.MAIN_ONLY !== '1') edit('index.html', (source) => {
  let result = removeBetween(
    source,
    '        <section\r\n          class="panel"\r\n          data-panel="fluid"',
    '        <section\r\n          class="panel"\r\n          data-panel="achievements"',
  );
  result = removeBetween(
    result,
    '          <!-- Floating toggle button for spire menu (mobile) -->',
    '          <section class="powder-stage"',
  );
  result = removeBetween(
    result,
    '                <div class="powder-alt-render-panel">',
    '          <section class="panel-grid powder-summary"',
    '              </div>\r\n            </article>\r\n          </section>\r\n',
  );
  result = removeBetween(
    result,
    '          <header class="panel-header">Achievements Terrarium</header>',
    '          <div class="achievement-grid" id="achievement-grid" role="list"></div>',
    '          <header class="panel-header">Achievements</header>\r\n          <p class="achievement-note">Each sealed proof adds <strong>+1 mote per minute</strong> to the idle bank.</p>\r\n',
  );
  for (const id of ['fluid', 'lamed', 'tsadi', 'shin', 'kuf']) {
    const buttonPattern = new RegExp(`\\s*<button\\s+class="tab-button[^>]*?"[\\s\\S]*?id="tab-${id}"[\\s\\S]*?<\\/button>`, 'g');
    result = result.replace(buttonPattern, '');
  }
  return result
    .replaceAll('Aleph Spire', 'Well of Inspiration')
    .replaceAll('Aleph spire', 'Well of Inspiration');
});

edit('assets/main.js', (source) => {
  let result = source;
  const singleLineImports = [
    'betTerrariumController', 'betSpireRender', 'betParticleInventory', 'betSpireUpgradeMenu',
    'tsadiUpgradeUi', 'tsadiBindingUi', 'spireTabVisibility', 'tsadiMoleculeNameGenerator',
    'spireIdleApplication', 'fluidTower', 'lamedTower', 'shinGraphemeCodexUI',
    'kufUI', 'lamedSpireUi', 'achievementsTerrariumPreferences', 'kufSpirePreferences',
  ];
  for (const moduleName of singleLineImports) result = removeImportByModule(result, moduleName);
  const multilineModules = [
    'shinState', 'shinUI', 'cardinalWardenUI', 'shinShapeBackground', 'tsadiVermiculateBackground',
    'kufState', 'lamedSpirePreferences', 'fluidSpirePreferences', 'betSpireParticlePreferences',
    'tsadiSpirePreferences', 'shinSpirePreferences',
  ];
  for (const moduleName of multilineModules) result = removeImportByModule(result, moduleName);
  result = removeImportByModule(result, 'tsadiTower');

  for (const name of [
    '_awardBetGlyphs', 'updateTsadiStatusNote', 'syncTsadiBindingAgents', 'applyIdleTimeToSpire',
    'updateLamedStatistics', 'captureLamedSimulationSnapshot', 'captureTsadiSimulationSnapshot',
    'getFluidUnlockGlyphCost', 'unlockFluidStudy', 'attemptFluidUnlock', 'enterFluidStudy',
    'exitFluidStudy', 'checkAndUnlockSpires', 'scheduleSpireResize', 'updateFluidDisplay',
  ]) {
    result = removeFunction(result, name);
  }

  result = removeBetween(
    result,
    '  // Fluid simulation has been disabled to prevent creation errors',
    '  // Ensure compact autosave remains the active basin persistence strategy.',
    '  const {\r\n    powderConfig,\r\n    powderState,\r\n    powderGlyphColumns,\r\n    getPowderElements,\r\n    setPowderElements,\r\n  } = createPowderStateContext();\r\n\r\n  const spireResourceState = createSpireResourceState();\r\n\r\n',
  );
  result = removeBetween(
    result,
    '  const {\r\n    ensureLamedBankSeeded,',
    '  const idleBankCtrl = createIdleResourceBankController({',
  );
  result = result.replace(/\r?\n  const lamedSpireUi = createLamedSpireUi\([\s\S]*?\);\r?\n/, '\r\n');
  result = removeBetween(
    result,
    '  // Track Tsadi status messaging so advanced molecule unlocks surface clearly in the UI.',
    '  // Initialize the Towers tab emblem to the default mote palette before any theme swaps occur.',
  );
  result = removeBetween(
    result,
    '  const { initializeTsadiBindingUi,',
    '  const {\r\n    powderElements,',
  );
  result = removeBetween(
    result,
    '    /**\r\n     * Stop all Fluid/Bet terrarium animations to conserve resources.',
    '    // Synchronize tab interactions with overlay state, audio cues, and banner refreshes.',
  );
  result = removeBetween(
    result,
    "        if (previousTabId === 'tsadi' && tabId !== 'tsadi') {",
    '        // Update cognitive realm map visibility based on tab and level state',
    "        refreshTabMusic();\r\n        if (tabId === 'towers') {\r\n          updateTowerCardVisibility();\r\n          refreshTowerCardBackgroundAnimations();\r\n          requestAnimationFrame(() => stageTowerCardEntrance({ delayBetweenMs: 40 }));\r\n        } else if (tabId === 'powder') {\r\n          if (sandSimulation && typeof sandSimulation.handleResize === 'function') {\r\n            sandSimulation.handleResize();\r\n          }\r\n          initializePowderViewInteraction();\r\n        }\r\n\r\n",
  );
  result = result.replace(/\r?\n    \/\/ Keep the responsive spire canvases[\s\S]*?updateSpireTabVisibility\(\);/, '');
  result = removeBetween(
    result,
    '    const savedKufState = readStorageJson(KUF_STATE_STORAGE_KEY);',
    '    enemyCodexElements.list =',
  );
  result = removeBetween(
    result,
    '    enforceFluidStudyDisabledState();',
    '    // Reapply developer mode boosts after progression restore so level unlocks stay in sync.',
  );
  result = removeBetween(
    result,
    '    bindFluidControls();',
    '    ensurePowderBasinResizeObserver();',
    '    initializeSpireGemMenus();\r\n',
  );
  result = removeBetween(
    result,
    '    // Initialize Bet Spire particle physics render and inventory display',
    '  }\r\n\r\n  if (document.readyState',
  );
  result = result.replace(/,\r?\n    stopBetSpireRender,\r?\n    resumeBetSpireRender/, '');
  return result
    .replaceAll('Aleph Spire', 'Well of Inspiration')
    .replaceAll('Aleph spire', 'Well of Inspiration');
});

console.log('Obsolete spire UI and runtime integration removed.');
