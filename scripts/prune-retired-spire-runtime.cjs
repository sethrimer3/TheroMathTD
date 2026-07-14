'use strict';
const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '..', 'assets', 'main.js');
let source = fs.readFileSync(file, 'utf8');

function removeRange(start, end, replacement = '') {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw new Error(`Missing range: ${start.slice(0, 50)} ... ${end.slice(0, 50)}`);
  source = source.slice(0, a) + replacement + source.slice(b);
}

function removeLines(tokens) {
  source = source.split(/(?<=\n)/).filter((line) => !tokens.some((token) => line.includes(token))).join('');
}

removeLines([
  'bindFluidControls,', 'updateFluidDisplay,', 'getLamedSparkBank,', 'setLamedSparkBank,',
  'getTsadiParticleBank,', 'setTsadiParticleBank,', 'getTsadiBindingAgents,', 'setTsadiBindingAgents,',
  'addIterons,', 'updateShinDisplay,', 'getIteronBank,', 'getKufGlyphs,', 'setKufGlyphs,',
  'onTsadiBindingAgentsChange:', 'getFluidSimulation:', 'getLamedSimulation:', 'getTsadiSimulation:',
  'setFluidSimulation:', 'updateSpireTabVisibility,', 'checkAndUnlockSpires,', 'getShinGlyphs,',
  'setShinGlyphs,', 'setIterationRate,', 'updateBetSpireDebugControlsVisibility,',
  'setKufTotalShards,', 'resetKufState,', 'setTrackedKufGlyphs,', 'refreshEnemyAlmanac,',
  'unlockAllFractals,', 'refreshFractalTabs,', 'resetShinState,', 'stopLamedDeveloperSpamLoop,',
  'updateFluidTabAvailability,', 'reconcileGlyphCurrencyFromState,', 'getShinStateSnapshot,',
  'getKufStateSnapshot,', 'unlockTerrariumCelestialBody,', 'addTerrariumCreature,', 'addTerrariumItem,',
]);

removeRange(
  '  async function applyPowderSimulationMode(mode) {',
  '  function _handlePowderModeToggle()',
  `  async function applyPowderSimulationMode() {
    if (powderState.modeSwitchPending) return;
    powderState.modeSwitchPending = true;
    try {
      if (!sandSimulation && powderSimulation instanceof PowderSimulation) sandSimulation = powderSimulation;
      if (!sandSimulation && powderElements.simulationCanvas) {
        const { left: leftInset, right: rightInset } = getSimulationWallInsets();
        sandSimulation = new PowderSimulation({
          canvas: powderElements.simulationCanvas,
          cellSize: POWDER_CELL_SIZE_PX,
          grainSizes: [1],
          scrollThreshold: 0.75,
          wallInsetLeft: leftInset,
          wallInsetRight: rightInset,
          wallGapCells: powderConfig.wallBaseGapMotes,
          gapWidthRatio: powderConfig.wallGapViewportRatio,
          maxDuneGain: powderConfig.simulatedDuneGainMax,
          idleDrainRate: resolveAlephTierRate(
            powderState.alephBaseIdleDrainRate ?? powderState.idleDrainRate,
            powderState.alephWallTier,
          ),
          motePalette: resolveAlephTierStubPalette(powderState.alephWallTier),
          onIdleBankChange: (value) => handlePowderIdleBankChange(value, 'sand'),
          onHeightChange: (info) => handlePowderHeightChange(info, 'sand'),
          onWallMetricsChange: (metrics) => handlePowderWallMetricsChange(metrics, 'sand'),
          onViewTransformChange: handlePowderViewTransformChange,
        });
      }
      if (!sandSimulation) throw new Error('Well of Inspiration simulation unavailable.');
      powderSimulation = sandSimulation;
      powderSimulation.applyProfile(powderSimulation.getDefaultProfile() || undefined);
      syncAlephTierVisualProfile(resolveAlephTierProgress(powderState.wallGlyphsLit || 0));
      powderSimulation.setFlowOffset(powderState.sandOffset);
      powderState.motePalette = powderSimulation.getEffectiveMotePalette();
      applyMindGatePaletteToDom(powderState.motePalette);
      powderState.idleDrainRate = powderSimulation.idleDrainRate;
      powderState.simulationMode = 'sand';
      if (powderState.alephTierTransition?.active) {
        setAlephTierTransitionSpawnState({ spawnEnabled: false, floorDrainEnabled: true, clearPendingDrops: true });
        setAlephTierTransitionVisualState(powderState.alephTierTransition.stage || 'walls-exiting');
      } else {
        setAlephTierTransitionSpawnState({ spawnEnabled: true, floorDrainEnabled: false, clearPendingDrops: false });
        setAlephTierTransitionVisualState('idle');
      }
      powderSimulation.setWallGapTarget(powderState.wallGapTarget || powderConfig.wallBaseGapMotes, { skipRebuild: true });
      powderSimulation.handleResize();
      applyLoadedPowderSimulationState(powderSimulation);
      flushPendingMoteDrops();
      powderSimulation.start();
      applyPowderVisualSettings();
      initializePowderViewInteraction();
      handlePowderViewTransformChange(powderSimulation.getViewTransform());
      refreshPowderWallDecorations();
      handlePowderHeightChange(powderSimulation.getStatus());
      const tierVisualGlyphs = getTierVisualGlyphCount(powderState.wallGlyphsLit || 0);
      updatePowderWallGapFromGlyphs(tierVisualGlyphs);
      syncAlephTierVisualProfile(resolveAlephTierProgress(tierVisualGlyphs));
      updateMoteStatsDisplays();
    } finally {
      powderState.modeSwitchPending = false;
      ensurePowderBasinResizeObserver();
      refreshPowderWallDecorations();
    }
  }

  function _handlePowderModeToggle()`,
);

removeRange(
  '  function _handlePowderModeToggle() {',
  '  /**\r\n   * Check and automatically unlock spires',
  '',
);
removeRange(
  '      // Generate iterons based on highest score reached in Cardinal Warden',
  '      updateStatusDisplays();',
  '',
);
removeRange(
  "    bindSpireOptionsDropdown({\r\n      toggleId: 'fluid-options-toggle-button'",
  "    bindSpireOptionsDropdown({\r\n      toggleId: 'cognitive-realm-options-toggle'",
  '',
);
removeRange(
  "    bindSpireOptionsDropdown({\r\n      toggleId: 'achievements-terrarium-options-toggle-button'",
  '    initializePowderSpirePreferences();',
  '',
);
removeRange(
  '    initializeFluidSpirePreferences();',
  '    initializeColorScheme();',
  '',
);
source = source.replace('    await applyPowderSimulationMode(powderState.simulationMode);', '    await applyPowderSimulationMode();');
fs.writeFileSync(file, source);
console.log('Retired spire runtime branches pruned.');
