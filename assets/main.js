import {
  alephChainUpgradeState,
  getAlephChainUpgrades,
  updateAlephChainUpgrades,
  applyAlephChainUpgradeSnapshot,
  resetAlephChainUpgrades,
} from './alephUpgradeState.js';
import { renderMathElement } from '../scripts/core/mathText.js';
import {
  formatGameNumber,
  formatWholeNumber,
  formatDecimal,
  formatPercentage,
  formatSignedPercentage,
  getGameNumberNotation,
} from '../scripts/core/formatting.js';
import {
  DEFAULT_AUDIO_MANIFEST,
  AudioManager,
  AUDIO_SETTINGS_STORAGE_KEY,
  applyStoredAudioSettings,
  bindAudioControls as bindAudioControlElements,
} from './audioSystem.js';
import { createAudioOrchestration } from './audioOrchestration.js';
import { initializeStartupOverlay, dismissStartupOverlay } from './startupOverlay.js';
import {
  FALLBACK_BASE_SCORE_RATE,
  FALLBACK_BASE_ENERGY_RATE,
  FALLBACK_BASE_FLUX_RATE,
  ensureGameplayConfigLoaded,
  calculateStartingThero,
  getTowerLoadoutLimit,
  overrideTowerLoadoutLimit,
  getBaseStartThero,
  registerResourceContainers,
  setBaseStartThero,
  getBaseCoreIntegrity,
} from './configuration.js';
import { createResourceStateContainers } from './state/resourceState.js';
import {
  setNotationRefreshHandler,
  bindNotationToggle,
  applyNotationPreference,
  bindGlyphEquationToggle,
  applyGlyphEquationPreference,
  applyDamageNumberPreference,
  applyDamageNumberMode,
  bindDamageNumberToggle,
  bindDamageNumberModeToggle,
  applyWaveKillTallyPreference,
  applyWaveDamageTallyPreference,
  bindWaveKillTallyToggle,
  bindWaveDamageTallyToggle,
  applyTrackTracerPreference,
  bindTrackTracerToggle,
  bindLoadoutSlotButton,
  applyGraphicsMode,
  initializeGraphicsMode,
  bindGraphicsModeToggle,
  isLowGraphicsModeActive,
  setGraphicsModeContext,
  areGlyphEquationsVisible,
  areDamageNumbersEnabled,
  areWaveKillTalliesEnabled,
  areWaveDamageTalliesEnabled,
  areTrackTracersEnabled,
  getActiveGraphicsMode,
  getPreferredGraphicsMode,
  bindTrackRenderModeButton,
  initializeTrackRenderMode,
  initializeLoadoutSlotPreference,
  setLoadoutSlotChangeHandler,
  bindFrameRateLimitSlider,
  initializeFrameRateLimitPreference,
  applyFrameRateLimitPreference,
  bindFpsCounterToggle,
  initializeFpsCounterPreference,
  applyFpsCounterPreference,
  bindEnemyParticlesToggle,
  initializeEnemyParticlesPreference,
  bindEdgeCrystalsToggle,
  initializeEdgeCrystalsPreference,
  bindCrystalBackgroundSpritesToggle,
  initializeCrystalBackgroundSpritesPreference,
  bindBackgroundParticlesToggle,
  initializeBackgroundParticlesPreference,
  bindPlayfieldTrackTypeButton,
  bindTowerLoadoutToggleSideButton,
  initializeTowerLoadoutToggleSidePreference,
  bindSpireOptionsPlacementButton,
  initializeSpireOptionsPlacementPreference,
  bindAutoGraphicsToggle,
  initializeAutoGraphicsPreference,
  bindInvertCarouselDragToggle,
  initializeInvertCarouselDragPreference,
} from './preferences.js';
import { SimplePlayfield, configurePlayfieldSystem } from './playfield.js';
import { setDevLayerVisible, getDevLayerDefault, resetDevLayerFlags } from './playfield/render/CanvasRenderer.js';
import { configurePerformanceMonitor } from './performanceMonitor.js';
import * as PlayfieldStatsPanel from './playfieldStatsPanel.js';
import {
  configureAutoSave,
  loadPersistentState,
  schedulePowderSave,
  schedulePowderBasinSave,
  startAutoSaveLoop,
  stopAutoSaveLoop,
  commitAutoSave,
  writeStorageJson,
  GRAPHICS_MODE_STORAGE_KEY,
  NOTATION_STORAGE_KEY,
  GLYPH_EQUATIONS_STORAGE_KEY,
  POWDER_STORAGE_KEY,
  GAME_STATS_STORAGE_KEY,
  POWDER_BASIN_STORAGE_KEY,
  TOWER_UPGRADE_STORAGE_KEY,
  SHIN_STATE_STORAGE_KEY,
  KUF_STATE_STORAGE_KEY,
} from './autoSave.js';
import {
  configurePowderEventLog,
  updatePowderLogDisplay,
  recordPowderEvent,
} from './powderEventLog.js';
import { createPowderPersistence } from './powderPersistence.js';
import { createPowderDisplaySystem } from './powderDisplay.js';
import { createPowderViewportController } from './powderViewportController.js';
import { createPowderResizeObserver } from './powderResizeObserver.js';
// DOM helpers extracted from main.js to hydrate the Well of Inspiration.
import { createPowderUiDomHelpers } from './powderUiDomHelpers.js';
// Aleph tier-transition animation: wall-exit, golden glyph collection, wall-enter, palette scaling.
import { createAlephTierTransitionController } from './alephTierTransitionController.js';
import { createResourceHud } from './resourceHud.js';
import { flushPendingMoteDrops } from './powderDropQueue.js';
import { createSpireResourceState } from './state/spireResourceState.js';
import { createPowderStateContext } from './powder/powderState.js';
import { createSpireResourcePersistence } from './spireResourcePersistence.js';
import { createLevelCombatController } from './levelCombatController.js';
// Alpha tower sprite tint cache builder for palette-synced shot particles.
import { refreshAlphaShotSpritePaletteCache } from '../scripts/features/towers/alphaTower.js';
// Beta tower sprite tint cache builder for palette-synced shot particles.
import { refreshBetaShotSpritePaletteCache } from '../scripts/features/towers/betaTower.js';
import { refreshGammaShotSpritePaletteCache } from '../scripts/features/towers/gammaTower.js';
// Delta tower sprite tint cache builder for palette-synced ship sprites.
import { refreshDeltaShipSpritePaletteCache } from '../scripts/features/towers/deltaTower.js';
// Well of Inspiration palette and simulation helpers (internally Aleph for save compatibility).
import {
  DEFAULT_MOTE_PALETTE,
  POWDER_CELL_SIZE_PX,
  PowderSimulation,
  mergeMotePalette,
} from '../scripts/features/towers/powderTower.js';
// Shared color palette orchestration utilities.
import {
  configureColorSchemeSystem,
  bindColorSchemeButton,
  initializeColorScheme,
  COLOR_SCHEME_STORAGE_KEY,
} from './colorSchemeUtils.js';
import {
  configureAchievementsTab,
  generateLevelAchievements,
  bindAchievements,
  evaluateAchievements,
  notifyAchievementsTabVisibilityChange,
} from './achievementsTab.js';
import { initializeBoostsSection } from './boostsSection.js';
import {
  loadMonetizationState,
} from './state/monetizationState.js';
import {
  configureFieldNotesOverlay,
  initializeFieldNotesOverlay,
  openFieldNotesOverlay,
  isFieldNotesOverlayVisible,
  setFieldNotesOpenButton,
} from './fieldNotesOverlay.js';
import {
  configurePlayfieldOutcome,
  setPlayfieldOutcomeElements,
  bindPlayfieldOutcomeEvents,
  hidePlayfieldOutcome,
  showPlayfieldOutcome,
  exitToLevelSelectionFromOutcome,
  handleOutcomeRetryRequest,
} from './playfieldOutcome.js';
import {
  codexState,
  enemyCodexElements,
  getEnemyCodexEntries,
  renderEnemyCodex,
  bindCodexControls,
  initializePerformanceCodex,
  initializeEnemyCodexOverlay,
} from './codex.js';
import {
  getTowerDefinitions,
  getTowerDefinition,
  getTowerLoadoutState,
  getTowerUnlockState,
  getMergeProgressState,
  setLoadoutElements,
  setAudioManager as setTowersAudioManager,
  setPlayfield as setTowersPlayfield,
  setGlyphCurrency,
  addGlyphCurrency,
  getGlyphCurrency,
  setTheroSymbol,
  setHideUpgradeMatrixCallback,
  setRenderUpgradeMatrixCallback,
  setMergingLogicUnlocked,
  refreshTowerLoadoutDisplay,
  updateTowerSelectionButtons,
  renderTowerUpgradeOverlay,
  closeTowerUpgradeOverlay,
  getTowerUpgradeOverlayElement,
  isTowerUpgradeOverlayActive,
  getActiveTowerUpgradeId,
  bindTowerUpgradeOverlay,
  bindTowerCardUpgradeInteractions,
  updateTowerCardVisibility,
  injectTowerCardPreviews,
  refreshTowerCardBackgroundAnimations,
  simplifyTowerCards,
  annotateTowerCardsWithCost,
  stageTowerCardEntrance,
  initializeTowerSelection,
  initializeTowerVisibilityToggle,
  initializeTowerElementDebugControls,
  synchronizeTowerCardMasterEquations,
  syncLoadoutToPlayfield,
  pruneLockedTowersFromLoadout,
  unlockTower,
  isTowerUnlocked,
  initializeDiscoveredVariablesFromUnlocks,
  addDiscoveredVariablesListener,
  getDiscoveredVariables,
  getTowerUpgradeStateSnapshot,
  initializeT2Toggles,
  applyTowerUpgradeStateSnapshot,
  clearTowerUpgradeState,
  configureTowersTabCallbacks,
  refreshTowerIconPalettes,
  closeLoadoutWheel,
} from './towersTab.js';
import _towers from './data/towers/index.js'; // Modular tower definitions sourced from dedicated files.
import { initializeTowerTreeMap, refreshTowerTreeMap } from './towerTreeMap.js';
// Particle-based visual scrollbar for reliable touch scrolling on Android.
import { initParticleScrollbar, notifyParticleScrollbarTabChanged } from './particleScrollbar.js';
import { createLevelEditorController } from './levelEditor.js';
import { createLevelPreviewRenderer, getPreviewPointsForLevel } from './levelPreviewRenderer.js';
import { createLevelOverlayController } from './levelOverlayController.js';
import { createLevelGridController } from './levelGridController.js';
import { createLevelStoryScreen } from './levelStoryScreen.js';
import { createPlayfieldMenuController } from './playfieldMenu.js';
import { createManualDropController } from './manualDropController.js';
import { createSpireStoryManager } from './spireStoryManager.js';
import { bindPageLifecycleEvents } from './pageLifecycle.js';
import { bindCollapsibleMenu } from './settingsMenuController.js';
import { createVariableLibraryController } from './variableLibraryController.js';
import { createUpgradeMatrixOverlay } from './upgradeMatrixOverlay.js';
import { createLevelSummaryHelpers } from './levelSummary.js';
import { initializePlayfieldBackgroundVideo } from './playfieldBackgroundVideo.js';
import {
  applyPowderVisualSettings,
  bindPowderSpireOptions,
  initializePowderSpirePreferences,
  setPowderCameraModeHandler,
  setPowderSimulationGetter,
  updatePowderRenderSizeControlsVisibility,
} from './powderSpirePreferences.js';
import { bindSpireOptionsDropdown, closeAllSpireDropdowns } from './spireOptionsDropdowns.js';
import { bindPlayfieldOptions, initializePlayfieldPreferences } from './playfield/playfieldPreferences.js';
import { createDeveloperModeManager } from './developerModeManager.js';
import {
  configureDeveloperControls,
  bindDeveloperControls,
  syncDeveloperControlValues,
  updateDeveloperControlsVisibility,
} from './developerControls.js';
import {
  configureTabManager,
  getActiveTabId,
  initializeTabs,
  setActiveTab,
} from './uiTabManager.js';
import {
  pruneLevelState,
  getCompletedInteractiveLevelCount,
  getBaseStartingTheroMultiplier,
  getStartingTheroMultiplier,
  setDeveloperTheroMultiplierOverride,
  getDeveloperTheroMultiplierOverride,
  clearDeveloperTheroMultiplierOverride,
  isInteractiveLevel,
  isSecretLevelId,
  isLevelUnlocked,
  isLevelCompleted,
  unlockLevel,
  unlockNextInteractiveLevel,
  getPreviousInteractiveLevelId,
  levelBlueprints,
  levelLookup,
  levelConfigs,
  levelState,
  interactiveLevelOrder,
  unlockedLevels,
  levelSetEntries,
  isStoryOnlyLevel,
  getLevelProgressSnapshot,
  applyLevelProgressSnapshot,
  setDeveloperModeUnlockOverride,
} from './levels.js';
import {
  isTutorialCompleted,
  loadTutorialState,
  checkTutorialCompletion,
  isTowersTabUnlocked,
  unlockTowersTab as unlockTowersTabState,
  isAchievementsUnlocked,
  unlockAchievements,
} from './tutorialState.js';
import {
  updateTabLockStates,
  initializeTabLockStates,
  unlockAchievementsTab,
  unlockTowersTab,
} from './tabLockManager.js';
import {
  createOverlayHelpers,
  triggerButtonRipple,
  scrollPanelToElement,
  enablePanelWheelScroll,
} from './uiHelpers.js';
import { clampNormalizedCoordinate } from './geometryHelpers.js';
import { createPlayfieldLayoutController } from './playfieldLayoutController.js';
import { createSpireCameraController } from './spireCameraController.js';

(() => {
  'use strict';

  initializeStartupOverlay();

  // Wire performance instrumentation into the graphics preference system for auto fallbacks.
  configurePerformanceMonitor({
    applyGraphicsMode,
    getActiveGraphicsMode,
    isLowGraphicsModeActive,
  });

  let updateStatusDisplays = () => {};
  let bindStatusElements = () => {};
  let registerResourceHudRefreshCallback = () => {};
  const THERO_SYMBOL = 'þ';
  const _COMMUNITY_DISCORD_INVITE = 'https://discord.gg/UzqhfsZQ8n'; // Reserved for future placement.

  setTheroSymbol(THERO_SYMBOL);

  const { getLevelSummary, describeLevelLastResult } = createLevelSummaryHelpers({
    getCompletedInteractiveLevelCount,
    getStartingTheroMultiplier,
    isInteractiveLevel,
    levelConfigs,
    getBaseStartThero,
    theroSymbol: THERO_SYMBOL,
    isDeveloperInfiniteTheroEnabled,
  });

  // Gameplay configuration, resource baselines, and fluid profile loading now reside in configuration.js.

  // Re-renders UI panels that depend on the number formatting preference.
  function refreshNotationDisplays() {
    updateStatusDisplays();
    updatePowderStockpileDisplay();
    updatePowderLedger();
    refreshTowerLoadoutDisplay();
    updateTowerSelectionButtons();
    if (isTowerUpgradeOverlayActive()) {
      const activeUpgradeId = getActiveTowerUpgradeId();
      if (activeUpgradeId) {
        renderTowerUpgradeOverlay(activeUpgradeId);
      }
    }
    generateLevelAchievements();
  }

  setNotationRefreshHandler(refreshNotationDisplays);

  function getOmegaPatternForTier(tier) {
    const normalized = Number.isFinite(tier) ? Math.max(24, Math.floor(tier)) : 24;
    const stage = Math.max(0, normalized - 24);
    const radius = 60 + stage * 18;
    const loops = 1.6 + stage * 0.45;
    const ratio = 1.8 + stage * 0.28;
    const swirl = 0.8 + stage * 0.18;
    const swirlFrequency = 2.4 + stage * 0.55;
    const envelopePower = 1.1 + stage * 0.12;
    const returnCurve = 0.55 + stage * 0.1;
    const duration = 2 + stage * 0.4;
    const projectileCount = Math.min(22, 10 + stage * 3);
    const baseSize = 4 + stage * 0.45;
    const phaseShift = 0.35 + stage * 0.05;
    return {
      radius,
      loops,
      ratio,
      swirl,
      swirlFrequency,
      envelopePower,
      returnCurve,
      duration,
      projectileCount,
      baseSize,
      phaseShift,
    };
  }

  // applyGameplayConfig, ensureGameplayConfigLoaded, and calculateStartingThero are provided by configuration.js.

  let levelGrid = null;
  let activeLevelEl = null;
  let leaveLevelBtn = null;
  let levelPreviewRenderer = null;
  let levelOverlayController = null;
  let activeLevelId = null;

  // Level combat controller – declared early for late-binding in callback registrations;
  // instantiated after the remaining level dependencies are available.
  let levelCombatCtrl;

  const PERSISTENT_STORAGE_KEYS = [
    GRAPHICS_MODE_STORAGE_KEY,
    NOTATION_STORAGE_KEY,
    GLYPH_EQUATIONS_STORAGE_KEY,
    POWDER_STORAGE_KEY,
    GAME_STATS_STORAGE_KEY,
    POWDER_BASIN_STORAGE_KEY,
    TOWER_UPGRADE_STORAGE_KEY,
    AUDIO_SETTINGS_STORAGE_KEY,
    COLOR_SCHEME_STORAGE_KEY,
    // Retired storage keys remain in reset coverage for compatibility with old saves.
    KUF_STATE_STORAGE_KEY,
    SHIN_STATE_STORAGE_KEY,
  ].filter(Boolean);

  // Initialize overlay helpers from uiHelpers module
  const overlayHelpers = createOverlayHelpers();
  const { cancelOverlayHide: _cancelOverlayHide, scheduleOverlayHide, revealOverlay } = overlayHelpers;

  const upgradeMatrixOverlayController = createUpgradeMatrixOverlay({
    revealOverlay,
    scheduleOverlayHide,
    getTowerDefinitions,
    getTowerDefinition,
    isTowerUnlocked,
    formatGameNumber,
    theroSymbol: THERO_SYMBOL,
  });
  const {
    bindUpgradeMatrix,
    hideUpgradeMatrix,
    renderUpgradeMatrix,
    handleKeydown: handleUpgradeMatrixKeydown,
  } = upgradeMatrixOverlayController;

  const variableLibraryController = createVariableLibraryController({
    revealOverlay,
    scheduleOverlayHide,
    getDiscoveredVariables,
    addDiscoveredVariablesListener,
  });

  // Developer map element references allow quick toggles for spawning and clearing obstacles.
  let developerModeActive = false;
  // Developer sandbox toggle that forces all levels to start with infinite Thero for rapid testing.
  let developerInfiniteTheroEnabled = false;

  let playfield = null;
  let activeLevelIsInteractive = false;
  let playfieldMenuController = null;
  let audioManager = null;

  // ── Playfield layout controller (extracted from main.js) ──────────────
  const layoutCtrl = createPlayfieldLayoutController({
    getPlayfield: () => playfield,
    getActiveLevelId: () => activeLevelId,
    getActiveLevelIsInteractive: () => activeLevelIsInteractive,
    getPlayfieldMenuController: () => playfieldMenuController,
  });

  // Thin delegates so existing call sites continue to work unchanged.
  const _syncPlayfieldSettingsVisibility = layoutCtrl.syncPlayfieldSettingsVisibility;
  const _togglePlayfieldFullscreen = layoutCtrl.togglePlayfieldFullscreen;
  const _syncPlayfieldFullscreenState = layoutCtrl.syncPlayfieldFullscreenState;
  const _updatePlayfieldFullscreenButton = layoutCtrl.updatePlayfieldFullscreenButton;
  const updateLayoutVisibility = layoutCtrl.updateLayoutVisibility;


  const playfieldElements = {
    container: null,
    canvas: null,
    message: null,
    wave: null,
    health: null,
    energy: null,
    progress: null,
    startButton: null,
    speedButton: null,
    autoAnchorButton: null,
    slots: [],
  };

  // Developer layer toggles – bind checkboxes to setDevLayerVisible and update state labels.
  const devLayerToggleConfigs = [
    { id: 'dev-layer-background-toggle', stateId: 'dev-layer-background-state', layer: 'background' },
    { id: 'dev-layer-track-toggle', stateId: 'dev-layer-track-state', layer: 'track' },
    // Gate-level debug toggles let developer mode isolate Mind Gate sub-effects independently of the whole track layer.
    { id: 'dev-layer-mind-gate-background-toggle', stateId: 'dev-layer-mind-gate-background-state', layer: 'mindGateBackground' },
    { id: 'dev-layer-mind-gate-wave-toggle', stateId: 'dev-layer-mind-gate-wave-state', layer: 'mindGateWave' },
    { id: 'dev-layer-mind-gate-particles-toggle', stateId: 'dev-layer-mind-gate-particles-state', layer: 'mindGateParticles' },
    { id: 'dev-layer-mind-gate-symbol-toggle', stateId: 'dev-layer-mind-gate-symbol-state', layer: 'mindGateSymbol' },
    // Shadow Gate toggles mirror Mind Gate controls for one-to-one visual profiling.
    { id: 'dev-layer-shadow-gate-background-toggle', stateId: 'dev-layer-shadow-gate-background-state', layer: 'shadowGateBackground' },
    { id: 'dev-layer-shadow-gate-particles-toggle', stateId: 'dev-layer-shadow-gate-particles-state', layer: 'shadowGateParticles' },
    { id: 'dev-layer-shadow-gate-symbol-toggle', stateId: 'dev-layer-shadow-gate-symbol-state', layer: 'shadowGateSymbol' },
    { id: 'dev-layer-sunlight-toggle', stateId: 'dev-layer-sunlight-state', layer: 'sunlight' },
    { id: 'dev-layer-sunlight-v2-toggle', stateId: 'dev-layer-sunlight-v2-state', layer: 'sunlightV2' },
    { id: 'dev-layer-towers-toggle', stateId: 'dev-layer-towers-state', layer: 'towers' },
    { id: 'dev-layer-enemies-toggle', stateId: 'dev-layer-enemies-state', layer: 'enemies' },
    { id: 'dev-layer-projectiles-toggle', stateId: 'dev-layer-projectiles-state', layer: 'projectiles' },
    { id: 'dev-layer-ui-overlay-toggle', stateId: 'dev-layer-ui-overlay-state', layer: 'uiOverlay' },
  ];

  function bindDevLayerToggles() {
    devLayerToggleConfigs.forEach(({ id, stateId, layer }) => {
      const toggle = document.getElementById(id);
      const stateLabel = document.getElementById(stateId);
      if (!toggle) {
        return;
      }
      toggle.addEventListener('change', (event) => {
        const visible = Boolean(event?.target?.checked);
        setDevLayerVisible(layer, visible);
        if (stateLabel) {
          stateLabel.textContent = visible ? 'On' : 'Off';
        }
        // Trigger an immediate redraw so the change is visible at once.
        if (typeof playfield?.draw === 'function') {
          playfield.draw();
        }
      });
    });
  }

  function updatePlayfieldDevLayerTogglesVisibility() {
    const section = document.getElementById('playfield-dev-layers-section');
    if (!section) {
      return;
    }
    const active = Boolean(developerModeActive);
    section.hidden = !active;
    section.setAttribute('aria-hidden', active ? 'false' : 'true');
    // Reset all layer flags to visible when developer mode is turned off so the game renders normally.
    if (!active) {
      resetDevLayerFlags();
      devLayerToggleConfigs.forEach(({ id, stateId, layer }) => {
        const toggle = document.getElementById(id);
        const stateLabel = document.getElementById(stateId);
        // Layers that default to off (e.g. sunlightV2) stay unchecked after reset.
        const defaultOn = getDevLayerDefault(layer);
        if (toggle) {
          toggle.checked = defaultOn;
        }
        if (stateLabel) {
          stateLabel.textContent = defaultOn ? 'On' : 'Off';
        }
      });
    }
  }

  const levelEditor = createLevelEditorController({
    playfieldElements,
    getPlayfield: () => playfield,
    getLevelConfigs: () => levelConfigs,
    isDeveloperModeActive: () => developerModeActive,
  });

  // Allow developer controls to flip the infinite Thero sandbox flag and refresh level UI accordingly.
  function setDeveloperInfiniteTheroEnabled(active) {
    developerInfiniteTheroEnabled = Boolean(active);
    updateLevelCards();
    updateActiveLevelBanner();
  }

  // Keep dependent systems aware of whether infinite Thero is active while developer mode is enabled.
  function isDeveloperInfiniteTheroEnabled() {
    return Boolean(developerModeActive && developerInfiniteTheroEnabled);
  }

  const {
    setLevelEditorSurface,
    resetLevelEditorSurface,
    configureLevelEditorForLevel,
    syncLevelEditorVisibility,
    updateDeveloperMapElementsVisibility,
    setDeveloperMapPlacementMode,
    handleDeveloperMapPlacementRequest,
    initializeDeveloperMapElements,
    initializeLevelEditorElements,
    activateDeveloperMapToolsForLevel,
    deactivateDeveloperMapTools,
    isDeveloperMapToolsActive,
    hideLevelEditorPanel,
    setOverlayPreviewLevel,
  } = levelEditor;

  // Centralize quick menu controls (commence/retry/dev tools/stats) outside of main.js.
  playfieldMenuController = createPlayfieldMenuController({
    getActiveLevelId: () => activeLevelId,
    isActiveLevelInteractive: () => activeLevelIsInteractive,
    getPlayfield: () => playfield,
    getStartButton: () => playfieldElements.startButton,
    isDeveloperModeActive: () => developerModeActive,
    getLevelById: (levelId) => levelLookup.get(levelId),
    isDeveloperMapToolsActive,
    activateDeveloperMapToolsForLevel,
    deactivateDeveloperMapTools,
    clearPendingLevel: () => {
      if (levelCombatCtrl) levelCombatCtrl.clearPendingLevel();
    },
    requestLayoutRefresh: () => {
      updateLayoutVisibility();
    },
    leaveActiveLevel: (...args) => levelCombatCtrl.leaveActiveLevel(...args),
    onStatsPanelVisibilityChange: (visible) => {
      if (playfield && typeof playfield.setStatsPanelEnabled === 'function') {
        playfield.setStatsPanelEnabled(visible);
      }
    },
    focusStatsPanel: () => {
      if (typeof PlayfieldStatsPanel.focusPanel === 'function') {
        PlayfieldStatsPanel.focusPanel();
      }
    },
    resetStatsPanel: () => {
      if (typeof PlayfieldStatsPanel.resetPanel === 'function') {
        PlayfieldStatsPanel.resetPanel();
      }
    },
    getAudioManager: () => audioManager,
    setPlayfieldMessage: (message) => {
      if (playfield?.messageEl) {
        playfield.messageEl.textContent = message;
      }
    },
  });

  configurePlayfieldOutcome({
    getPlayfield: () => playfield,
    leaveActiveLevel: (...args) => levelCombatCtrl.leaveActiveLevel(...args),
    updateLayoutVisibility,
    getStartButton: () => playfieldElements.startButton,
  });

  const gameStats = {
    manualVictories: 0,
    towersPlaced: 0,
    maxTowersSimultaneous: 0,
    autoAnchorPlacements: 0,
    powderActions: 0,
    enemiesDefeated: 0,
    highestPowderMultiplier: 1,
  };

  audioManager = new AudioManager(DEFAULT_AUDIO_MANIFEST);
  setTowersAudioManager(audioManager);

  // Will be assigned once levelStoryScreen is available (see createSpireStoryManager call below).
  let spireStoryManager = null;

  configureFieldNotesOverlay({
    revealOverlay,
    scheduleOverlayHide,
    audioManager,
    // Lazy proxy so the field notes overlay can be configured before the story manager is created.
    getStoryEntries: () => spireStoryManager ? spireStoryManager.buildSeenStoryEntries() : Promise.resolve([]),
  });

  const {
    suppressAudioPlayback,
    releaseAudioSuppression,
    isAudioSuppressed: _isAudioSuppressed,
    syncAudioControlsFromManager,
    bindAudioControls,
    determineMusicKey: _determineMusicKey,
    refreshTabMusic,
  } = createAudioOrchestration({
    audioManager,
    bindAudioControlElements,
    writeStorageJson,
    audioSettingsStorageKey: AUDIO_SETTINGS_STORAGE_KEY,
    getActiveTabId,
    isPlayfieldInteractiveLevelActive: () =>
      Boolean(
        playfield &&
          typeof playfield.isInteractiveLevelActive === 'function' &&
          playfield.isInteractiveLevelActive(),
      ),
  });

  // Cached reference to the notation toggle control inside the Codex panel.
  let _notationToggleButton = null;

  const { baseResources, resourceState } = createResourceStateContainers({
    calculateStartingThero,
    baseScoreRate: FALLBACK_BASE_SCORE_RATE,
    baseEnergyRate: FALLBACK_BASE_ENERGY_RATE,
    baseFluxRate: FALLBACK_BASE_FLUX_RATE,
    registerResourceContainers,
  });

  const {
    powderConfig,
    powderState,
    powderGlyphColumns,
    getPowderElements,
    setPowderElements,
  } = createPowderStateContext();

  const spireResourceState = createSpireResourceState();

  const {
    getTowerUpgradeStateSnapshotWithAleph,
    applyTowerUpgradeStateSnapshotWithAleph,
    getSpireResourceStateSnapshot,
    applySpireResourceStateSnapshot,
  } = createSpireResourcePersistence({
    spireResourceState,
    getTowerUpgradeStateSnapshot,
    applyTowerUpgradeStateSnapshot,
    getAlephChainUpgrades,
    applyAlephChainUpgradeSnapshot,
    getPlayfield: () => playfield,
  });

  // Ensure compact autosave remains the active basin persistence strategy.
  document.addEventListener('DOMContentLoaded', () => {
    try {
      if (window.powderSimulation) {
        window.powderSimulation.useCompactAutosave = true;
      }
    } catch (_e) {
      // Ignore assignment failures caused by missing window globals during SSR/tests.
    }
  });

  const resourceHud = createResourceHud({
    formatGameNumber,
    formatWholeNumber,
    getStartingTheroMultiplier,
    getGlyphCurrency,
    powderState,
  });

  bindStatusElements = resourceHud.bindStatusElements;
  updateStatusDisplays = resourceHud.updateStatusDisplays;
  registerResourceHudRefreshCallback = resourceHud.registerStatusRefreshCallback;
  const {
    applyMindGatePaletteToDom,
    updatePowderGlyphColumns,
  } = createPowderUiDomHelpers({
    powderGlyphColumns,
  });

  const powderPersistence = createPowderPersistence({
    powderState,
    powderConfig,
    mergeMotePalette,
    applyMindGatePaletteToDom,
    schedulePowderBasinSave,
    getPowderSimulation: () => powderSimulation,
  });
  const getPowderBasinSnapshot = powderPersistence.getPowderBasinSnapshot;
  const applyPowderBasinSnapshot = (snapshot) => {
    powderPersistence.applyPowderBasinSnapshot(snapshot);
  };

  // Declare simulation instances early to avoid Temporal Dead Zone errors when referenced in initialization functions.
  let sandSimulation = null;
  let powderSimulation = null;
  // ── Developer spam controller (extracted from main.js) ────────────────

  // Surface the active powder simulation so Aleph visual preferences can reapply on swaps.
  setPowderSimulationGetter(() => powderSimulation);

  // Initialize the Towers tab emblem to the default mote palette before any theme swaps occur.
  applyMindGatePaletteToDom(powderState.motePalette);

  const {
    powderElements,
    bindPowderControls,
    updateResourceRates,
    updatePowderStockpileDisplay,
    updatePowderLedger,
    triggerPowderBasinPulse: _triggerPowderBasinPulse,
    toggleSandfallStability: _toggleSandfallStability,
    surveyRidgeHeight: _surveyRidgeHeight,
    chargeCrystalMatrix: _chargeCrystalMatrix,
    refreshPowderSystems,
    updatePowderDisplay,
    getPowderCurrency,
    setPowderCurrency,
    getCurrentPowderBonuses,
    resetPowderUiState,
  } = createPowderDisplaySystem({
    powderState,
    powderConfig,
    powderGlyphColumns,
    formatWholeNumber,
    formatGameNumber,
    formatDecimal,
    formatPercentage,
    renderMathElement,
    getBaseStartThero,
    resourceState,
    baseResources,
    schedulePowderSave,
    recordPowderEvent,
    notifyPowderAction,
    notifyPowderMultiplier,
    updateStatusDisplays,
    THERO_SYMBOL,
    updatePowderLogDisplay,
    getPowderSimulation: () => powderSimulation,
    spireResourceState,
  });

  setPowderElements(powderElements);

  registerResourceHudRefreshCallback(updatePowderModeButton);

  // Provide the developer controls module with runtime state references once all powder helpers are wired.
  configureDeveloperControls({
    isDeveloperModeActive: () => developerModeActive,
    isDeveloperInfiniteTheroEnabled,
    setDeveloperInfiniteTheroEnabled,
    recordPowderEvent,
    getPowderSimulation: () => powderSimulation,
    powderState,
    schedulePowderBasinSave,
    updatePowderDisplay,
    setBaseStartThero,
    updateLevelCards,
    updatePowderLedger,
    updateStatusDisplays,
    setDeveloperTheroMultiplierOverride,
    clearDeveloperTheroMultiplierOverride,
    getDeveloperTheroMultiplierOverride,
    getBaseStartingTheroMultiplier,
    getBaseStartThero,
    getGlyphCurrency,
    setGlyphCurrency,
    spireResourceState,
    gameStats,
    updateDeveloperMapElementsVisibility,
    updatePowderRenderSizeControlsVisibility,
    updatePlayfieldDevLayerTogglesVisibility,
  });

  // Keep the active Well ledger isolated from persistence and reward systems.
  configurePowderEventLog({
    formatGameNumber,
    formatDecimal,
    formatSignedPercentage,
    getCurrentPowderBonuses,
    powderState,
    powderElements,
  });

  const {
    applyPowderViewportTransform: _applyPowderViewportTransform,
    handlePowderViewTransformChange,
    handlePowderWallMetricsChange,
    updatePowderWallGapFromGlyphs,
    resolveAlephTierProgress,
    initializePowderViewInteraction,
  } = createPowderViewportController({
    getActiveSimulation: () => powderSimulation,
    getPowderElements: () => powderElements,
    powderState,
    powderConfig,
    schedulePowderBasinSave,
    isDeveloperModeActive: () => developerModeActive,
  });

  // ── Spire camera controller (extracted from main.js) ──────────────────
  const cameraCtrl = createSpireCameraController({
    powderState,
    getPowderSimulation: () => powderSimulation,
    handlePowderViewTransformChange,
    handlePowderWallMetricsChange,
    schedulePowderBasinSave,
  });

  // Thin delegates so existing call sites continue to work unchanged.
  const _resetPowderCameraTransform = cameraCtrl.resetPowderCameraTransform;
  const setPowderCameraMode = cameraCtrl.setPowderCameraMode;
  const refreshPowderWallDecorations = cameraCtrl.refreshPowderWallDecorations;

  // Hook the Well of Inspiration settings toggle into the camera control handler.
  setPowderCameraModeHandler((enabled) => {
    setPowderCameraMode(enabled);
  });

  // ── Level combat controller (extracted from main.js) ──────────────────
  levelCombatCtrl = createLevelCombatController({
    getActiveLevelId: () => activeLevelId,
    setActiveLevelId: (id) => { activeLevelId = id; },
    getActiveLevelIsInteractive: () => activeLevelIsInteractive,
    setActiveLevelIsInteractive: (val) => { activeLevelIsInteractive = val; },
    resourceState,
    baseResources,
    levelState,
    levelLookup,
    levelConfigs,
    getPlayfield: () => playfield,
    getLevelOverlayController: () => levelOverlayController,
    getLevelStoryScreen: () => levelStoryScreen,
    getPlayfieldMenuController: () => playfieldMenuController,
    getAudioManager: () => audioManager,
    getLeaveLevelBtn: () => leaveLevelBtn,
    hidePlayfieldOutcome,
    showPlayfieldOutcome,
    exitToLevelSelectionFromOutcome,
    handleOutcomeRetryRequest,
    isLevelUnlocked,
    isStoryOnlyLevel,
    isInteractiveLevel,
    isLevelCompleted,
    getPreviousInteractiveLevelId,
    unlockNextInteractiveLevel,
    unlockLevel,
    formatWholeNumber,
    checkTutorialCompletion,
    isTutorialCompleted,
    updateTabLockStates,
    isTowersTabUnlocked,
    unlockTowersTabState,
    unlockTowersTab,
    unlockAchievements,
    unlockAchievementsTab,
    ensureResourceTicker,
    updateActiveLevelBanner,
    updateLevelCards,
    updateResourceRates,
    updatePowderLedger,
    updateStatusDisplays,
    updateTowerSelectionButtons,
    updateLayoutVisibility,
    notifyLevelVictory,
    commitAutoSave,
    closeLoadoutWheel,
    refreshTabMusic,
    deactivateDeveloperMapTools,
  });

  // Thin delegates so existing call sites continue to work unchanged.
  const handlePlayfieldCombatStart = levelCombatCtrl.handlePlayfieldCombatStart;
  const handlePlayfieldVictory = levelCombatCtrl.handlePlayfieldVictory;
  const handlePlayfieldDefeat = levelCombatCtrl.handlePlayfieldDefeat;
  const handleLevelSelection = levelCombatCtrl.handleLevelSelection;
  const cancelPendingLevel = levelCombatCtrl.cancelPendingLevel;
  const confirmPendingLevel = levelCombatCtrl.confirmPendingLevel;
  const _startLevel = levelCombatCtrl.startLevel;
  const leaveActiveLevel = levelCombatCtrl.leaveActiveLevel;
  const _focusLeaveLevelButton = levelCombatCtrl.focusLeaveLevelButton;

  // Allow the overlay confirmation gesture to begin levels through the shared controller.
  if (levelOverlayController) {
    levelOverlayController.setConfirmHandler(confirmPendingLevel);
  }

  const { initializeManualDropHandlers } = createManualDropController({
    getActiveTabId,
    getSandSimulation: () => sandSimulation,
  });

  const {
    ensurePowderBasinResizeObserver,
    getPowderBasinObserver,
    setPowderBasinObserver,
    getPendingPowderResizeFrame,
    setPendingPowderResizeFrame,
    getPendingPowderResizeIsTimeout,
    setPendingPowderResizeIsTimeout,
    getObservedPowderResizeElements,
    setObservedPowderResizeElements,
  } = createPowderResizeObserver({
    getPowderSimulation: () => powderSimulation,
    handlePowderViewTransformChange,
    getPowderElements,
  });

  const { bindDeveloperModeToggle, refreshDeveloperModeState } = createDeveloperModeManager({
    getDeveloperModeActive: () => developerModeActive,
    setDeveloperModeActive: (value) => {
      developerModeActive = value;
    },
    getTowerDefinitions,
    getTowerLoadoutState,
    getTowerLoadoutLimit,
    unlockTower,
    initializeDiscoveredVariablesFromUnlocks,
    pruneLockedTowersFromLoadout,
    getTowerUnlockState,
    setMergingLogicUnlocked,
    powderState,
    spireResourceState,
    setDeveloperInfiniteTheroEnabled,
    getPowderSimulation: () => powderSimulation,
    setPowderSimulation: (value) => {
      powderSimulation = value;
    },
    getSandSimulation: () => sandSimulation,
    setSandSimulation: (value) => {
      sandSimulation = value;
    },
    unlockedLevels,
    interactiveLevelOrder,
    levelState,
    levelBlueprints,
    setDeveloperModeUnlockOverride,
    getEnemyCodexEntries,
    codexState,
    renderEnemyCodex,
    updateLevelCards,
    updateActiveLevelBanner,
    updateTowerCardVisibility,
    updateTowerSelectionButtons,
    syncLoadoutToPlayfield,
    updateStatusDisplays,
    evaluateAchievements,
    updateResourceRates,
    updatePowderLedger,
    updateDeveloperControlsVisibility,
    syncDeveloperControlValues,
    syncLevelEditorVisibility,
    updateDeveloperMapElementsVisibility,
    getPlayfield: () => playfield,
    getPlayfieldMenuController: () => playfieldMenuController,
    refreshPowderWallDecorations,
    clearDeveloperTheroMultiplierOverride,
    deactivateDeveloperMapTools,
    setDeveloperMapPlacementMode,
    persistentStorageKeys: PERSISTENT_STORAGE_KEYS,
    stopAutoSaveLoop,
    pruneLevelState,
    resetPowderUiState,
    refreshPowderSystems,
    updatePowderModeButton,
    updatePowderLogDisplay,
    setPowderCurrency,
    gameStats,
    resourceState,
    baseResources,
    powderConfig,
    applyMindGatePaletteToDom,
    mergeMotePalette,
    defaultMotePalette: DEFAULT_MOTE_PALETTE,
    resetAlephChainUpgrades,
    updatePowderWallGapFromGlyphs,
    clearTowerUpgradeState,
    setPowderBasinObserver,
    getPowderBasinObserver,
    setPendingPowderResizeFrame,
    getPendingPowderResizeFrame,
    setPendingPowderResizeIsTimeout,
    getPendingPowderResizeIsTimeout,
    setObservedPowderResizeElements,
    getObservedPowderResizeElements,
    updateTabLockStates,
    isTutorialCompleted,
  });

  // ── Level Grid Controller ───────────────────────────────────────────
  // Centralizes the DOM-heavy level card grid: build, update, set/campaign
  // expansion, lock state management, and the active-level banner. Delegates
  // extracted from main.js to reduce cognitive load and line count.
  const levelGridCtrl = createLevelGridController({
    levelBlueprints,
    levelState,
    levelConfigs,
    levelLookup,
    levelSetEntries,
    isLevelUnlocked,
    isStoryOnlyLevel,
    isInteractiveLevel,
    isSecretLevelId,
    getPreviewPointsForLevel,
    clampNormalizedCoordinate,
    formatWholeNumber,
    getLevelSummary,
    describeLevelLastResult,
    triggerButtonRipple,
    getDeveloperModeActive: () => developerModeActive,
    getActiveLevelId: () => activeLevelId,
    getGameStats: () => gameStats,
    // Read current progression data through getters because levels.js swaps these exports after config load.
    getLevelBlueprints: () => levelBlueprints,
    getLevelLookup: () => levelLookup,
    onLevelSelect: (level) => handleLevelSelection(level),
    onMenuSelectSfx: () => {
      if (audioManager) {
        audioManager.playSfx('menuSelect');
      }
    },
  });
  levelGridCtrl.attachDocumentListeners();

  // Thin delegates that forward to the level grid controller so hoisted function names
  // remain available to callback registrations earlier in the IIFE. Call these wrappers when passing
  // function references so the signatures match what external modules expect.
  function buildLevelCards() { levelGridCtrl.buildLevelCards(); }
  function updateLevelCards() { levelGridCtrl.updateLevelCards(); }
  function updateActiveLevelBanner() { levelGridCtrl.updateActiveLevelBanner(); }
  function _updateLevelSetLocks() { levelGridCtrl.updateLevelSetLocks(); }

  // The retired multi-Spire mode switch has no active button; retain the callback seam for shared HUD refreshes.
  function updatePowderModeButton() {
    return;
  }


  async function applyPowderSimulationMode() {
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
          motePalette: resolveAlephTierStubPalette(powderState.alephWallTier),
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
      flushPendingMoteDrops({ powderState, powderSimulation, schedulePowderBasinSave });
      powderSimulation.start();
      applyPowderVisualSettings();
      initializePowderViewInteraction();
      handlePowderViewTransformChange(powderSimulation.getViewTransform());
      refreshPowderWallDecorations();
      handlePowderHeightChange(powderSimulation.getStatus());
      const tierVisualGlyphs = getTierVisualGlyphCount(powderState.wallGlyphsLit || 0);
      updatePowderWallGapFromGlyphs(tierVisualGlyphs);
      syncAlephTierVisualProfile(resolveAlephTierProgress(tierVisualGlyphs));
    } finally {
      powderState.modeSwitchPending = false;
      ensurePowderBasinResizeObserver();
      refreshPowderWallDecorations();
    }
  }

  let resourceTicker = null;
  let lastResourceTick = 0;

  const POWDER_WALL_TEXTURE_ASPECT = 800 / 300; // Preserve the native 1.5:4 wall sprite ratio (300px × 800px).
  const POWDER_WALL_TEXTURE_FALLBACK_PX = 192; // Fallback repeat distance when wall sizing has not been measured yet.
  const ALEPH_RIGHT_WALL_SPRITE_OFFSET_PX = 3; // Shift the right Aleph wall sprite outward so it no longer overlaps the mote pile.
  // ── Aleph tier-transition controller (extracted from main.js) ─────────
  const alephTierCtrl = createAlephTierTransitionController({
    powderState,
    powderConfig,
    getPowderElements: () => powderElements,
    getSandSimulation: () => sandSimulation,
    getPowderSimulation: () => powderSimulation,
    getApplyMindGatePaletteToDom: () => applyMindGatePaletteToDom,
    getResolveAlephTierProgress: () => resolveAlephTierProgress,
  });

  // Thin delegates so existing call sites in main.js continue to work unchanged.
  const resolveAlephTierStubPalette = alephTierCtrl.resolveAlephTierStubPalette;
  const getTierVisualGlyphCount = alephTierCtrl.getTierVisualGlyphCount;
  const setAlephTierTransitionVisualState = alephTierCtrl.setAlephTierTransitionVisualState;
  const setAlephTierTransitionSpawnState = alephTierCtrl.setAlephTierTransitionSpawnState;
  const maybeStartAlephTierTransition = alephTierCtrl.maybeStartAlephTierTransition;
  const bindAlephTierTransitionControls = alephTierCtrl.bindAlephTierTransitionControls;
  const syncAlephTierVisualProfile = alephTierCtrl.syncAlephTierVisualProfile;

  /**
   * Resolve the repeating wall texture height so the masonry tiles retain their native aspect ratio.
   *
   * @param {HTMLElement|null} wallElement - Wall element whose visual width drives the texture repeat distance.
   * @returns {number} Pixel height used to repeat the wall texture.
   */
  function resolveWallTextureRepeatPx(wallElement) {
    // Honor any inline tile height overrides first so CSS calculations stay in sync with JS scroll offsets.
    const inlineTileHeight = wallElement?.style?.getPropertyValue?.('--powder-wall-tile-height');
    const parsedTileHeight = inlineTileHeight ? Number.parseFloat(inlineTileHeight) : NaN;
    if (Number.isFinite(parsedTileHeight) && parsedTileHeight > 0) {
      return parsedTileHeight;
    }

    // Prefer an explicitly measured wall width when available to maintain the sprite's 1.5:4 ratio.
    const inlineWidth = wallElement?.style?.getPropertyValue?.('--powder-wall-visual-width');
    const parsedWidth = inlineWidth ? Number.parseFloat(inlineWidth) : NaN;
    if (Number.isFinite(parsedWidth) && parsedWidth > 0) {
      return parsedWidth * POWDER_WALL_TEXTURE_ASPECT;
    }

    if (wallElement && typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
      const computedStyles = window.getComputedStyle(wallElement);
      if (computedStyles) {
        const computedTileHeight = Number.parseFloat(computedStyles.getPropertyValue('--powder-wall-tile-height'));
        if (Number.isFinite(computedTileHeight) && computedTileHeight > 0) {
          return computedTileHeight;
        }

        const computedWidth = Number.parseFloat(computedStyles.getPropertyValue('--powder-wall-visual-width'));
        if (Number.isFinite(computedWidth) && computedWidth > 0) {
          return computedWidth * POWDER_WALL_TEXTURE_ASPECT;
        }
      }
    }

    return POWDER_WALL_TEXTURE_FALLBACK_PX;
  }

  // Configure the autosave helpers so they can persist powder, stats, and preference state.
  configureAutoSave({
    audioStorageKey: AUDIO_SETTINGS_STORAGE_KEY,
    getPowderCurrency,
    onPowderCurrencyLoaded: (value) => {
      setPowderCurrency(value);
    },
    getPowderBasinSnapshot,
    applyPowderBasinSnapshot,
    getTowerUpgradeStateSnapshot: getTowerUpgradeStateSnapshotWithAleph,
    applyTowerUpgradeStateSnapshot: applyTowerUpgradeStateSnapshotWithAleph,
    getLevelProgressSnapshot,
    applyLevelProgressSnapshot,
    applyStoredAudioSettings,
    syncAudioControlsFromManager,
    applyNotationPreference,
    handleNotationFallback: refreshNotationDisplays,
    applyGlyphEquationPreference,
    applyDamageNumberPreference,
    applyDamageNumberMode,
    applyWaveKillTallyPreference,
    applyWaveDamageTallyPreference,
    applyTrackTracerPreference,
    applyFrameRateLimitPreference,
    applyFpsCounterPreference,
    getGameStatsSnapshot: () => gameStats,
    mergeLoadedGameStats: (stored) => {
      if (!stored) {
        return;
      }
      Object.entries(stored).forEach(([key, value]) => {
        if (Object.prototype.hasOwnProperty.call(gameStats, key) && Number.isFinite(value)) {
          gameStats[key] = value;
        }
      });
      // Recompute achievement thresholds after loading persisted statistics.
      evaluateAchievements();
    },
    statKeys: Object.keys(gameStats),
    getPreferenceSnapshot: () => ({
      notation: getGameNumberNotation(),
      // Persist the explicit user preference instead of temporary auto-performance overrides.
      graphics: getPreferredGraphicsMode(),
      glyphEquations: areGlyphEquationsVisible() ? '1' : '0',
      damageNumbers: areDamageNumbersEnabled() ? '1' : '0',
      waveKillTallies: areWaveKillTalliesEnabled() ? '1' : '0',
      waveDamageTallies: areWaveDamageTalliesEnabled() ? '1' : '0',
      trackTracer: areTrackTracersEnabled() ? '1' : '0',
    }),
    getSpireResourceStateSnapshot,
    applySpireResourceStateSnapshot,
  });

  levelOverlayController = createLevelOverlayController({
    document,
    describeLevelLastResult,
    getLevelSummary,
    getLevelState: (levelId) => levelState.get(levelId) || null,
    getLevelById: (levelId) => levelLookup.get(levelId) || null,
    getActiveLevelId: () => activeLevelId,
    revealOverlay,
    scheduleOverlayHide,
  });

  const levelStoryScreen = createLevelStoryScreen({
    levelState,
    onStoryComplete: (levelId) => {
      if (!levelId) {
        return;
      }
      const existingState = levelState.get(levelId) || {
        entered: false,
        running: false,
        completed: false,
      };
      if (existingState.storySeen) {
        return;
      }
      levelState.set(levelId, { ...existingState, storySeen: true });
      commitAutoSave();
    },
  });
  // Spire story manager handles narrative reveal state for each spire tab.
  spireStoryManager = createSpireStoryManager({
    spireResourceState,
    getLevelStoryScreen: () => levelStoryScreen,
    levelBlueprints,
    getLevelState: (id) => levelState.get(id),
    isStoryOnlyLevel,
    commitAutoSave,
  });

  /**
   * Resize active spire simulations so their canvases track the responsive layout.
   */
  setGraphicsModeContext({
    getPowderSimulation: () => powderSimulation,
    getPlayfield: () => playfield,
  });

  // Synchronize the shared palette module with powder simulation and playfield rendering.
  configureColorSchemeSystem({
    onPaletteChange: (palette) => {
      powderState.motePalette = palette;
      // Broadcast palette swaps to the Mind Gate badge so theme toggles remain cohesive.
      applyMindGatePaletteToDom(powderState.motePalette);
      refreshTowerIconPalettes();
      if (powderSimulation && typeof powderSimulation.setMotePalette === 'function') {
        powderSimulation.setMotePalette(palette);
        powderSimulation.render();
      }
    },
    onSchemeApplied: () => {
      if (playfield) {
        playfield.draw();
      }
      // Rebuild cached alpha, beta, gamma, and delta sprites so palette swaps tint the new particles.
      refreshAlphaShotSpritePaletteCache();
      refreshBetaShotSpritePaletteCache();
      refreshGammaShotSpritePaletteCache();
      refreshDeltaShipSpritePaletteCache();
      refreshTowerIconPalettes();
    },
  });

  configurePlayfieldSystem({
    alephChainUpgrades: alephChainUpgradeState,
    theroSymbol: THERO_SYMBOL,
    calculateStartingThero,
    updateStatusDisplays,
    notifyEnemyDefeated,
    notifyAutoAnchorUsed,
    getOmegaPatternForTier,
    isFieldNotesOverlayVisible,
    getBaseStartThero,
    getBaseCoreIntegrity,
    handleDeveloperMapPlacement: handleDeveloperMapPlacementRequest,
    // Share developer toggle so level thero caps can be bypassed during sandboxing.
    isDeveloperModeActive: () => developerModeActive,
    isDeveloperInfiniteTheroEnabled,
    // Provide the playfield with the active graphics mode to prune visual effects.
    isLowGraphicsMode: () => isLowGraphicsModeActive(),
  });

  // Restore a serialized sand simulation once the canvas has been configured.
  function applyLoadedPowderSimulationState(simulation) {
    if (!simulation || typeof simulation.importState !== 'function') {
      return;
    }
    const stateKey = 'loadedSimulationState';
    const pendingKey = 'pendingMoteDrops';
    const initialLoadKey = 'initialLoadRestored';
    const snapshot = powderState[stateKey];
    if (!snapshot || typeof snapshot !== 'object') {
      return;
    }
    
    // On initial page load, use rectangle restoration if available
    // On subsequent tab switches, use full grain restoration
    const isInitialLoad = !powderState[initialLoadKey];
    if (isInitialLoad && snapshot.compactHeightLine && Number.isFinite(snapshot.moteCount)) {
      // Mark that initial load restoration has been completed
      powderState[initialLoadKey] = true;
      // Rectangle restoration will be handled by _synthesizeRectangleState in importState
    }
    
    const applied = simulation.importState(snapshot);
    if (!applied) {
      return;
    }
    powderState[stateKey] = null;
    powderState.motePalette = simulation.getEffectiveMotePalette();
    // Apply the restored palette so the Towers tab matches the revived basin state.
    applyMindGatePaletteToDom(powderState.motePalette);
    if (Array.isArray(powderState[pendingKey])) {
      powderState[pendingKey].length = 0;
    }
    // Restore wall gap from saved glyph number to ensure wall width matches saved progress
    if (Number.isFinite(powderState.wallGlyphsLit)) {
      const tierVisualGlyphs = getTierVisualGlyphCount(powderState.wallGlyphsLit);
      updatePowderWallGapFromGlyphs(tierVisualGlyphs);
      syncAlephTierVisualProfile(resolveAlephTierProgress(tierVisualGlyphs));
    }
    // Writing back the hydrated state keeps restored motes available for the next session.
    schedulePowderBasinSave();
  }

  function getSimulationWallInsets() {
    const elements = powderElements;
    const fallback = 68;
    const left = elements.leftWall ? Math.max(fallback, elements.leftWall.offsetWidth || 0) : fallback;
    const right = elements.rightWall ? Math.max(fallback, elements.rightWall.offsetWidth || 0) : fallback;
    return { left, right };
  }

  function stopResourceTicker() {
    if (resourceTicker) {
      clearInterval(resourceTicker);
      resourceTicker = null;
    }
  }

  // Maintain a lightweight ticker while an active defense is running.
  function ensureResourceTicker() {
    if (!resourceState.running) {
      stopResourceTicker();
      return;
    }

    if (resourceTicker || typeof window === 'undefined') {
      return;
    }

    lastResourceTick =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();

    resourceTicker = window.setInterval(() => {
      if (!resourceState.running) {
        stopResourceTicker();
        return;
      }

      const now =
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now();
      const deltaSeconds = Math.max(0, (now - lastResourceTick) / 1000);
      lastResourceTick = now;
      if (deltaSeconds <= 0) {
        return;
      }

      const scoreGain = resourceState.scoreRate * deltaSeconds;
      if (Number.isFinite(scoreGain) && scoreGain > 0) {
        resourceState.score += scoreGain;
      }

      updateStatusDisplays();
    }, 1000 / 30);
  }

  // Collapsible settings menus use a shared helper to eliminate duplicate expand/collapse logic.
  function bindVisualSettingsMenu() {
    bindCollapsibleMenu({ triggerId: 'visual-settings-menu-button', menuId: 'visual-settings-menu' });
  }

  function bindControlSettingsMenu() {
    bindCollapsibleMenu({ triggerId: 'control-settings-menu-button', menuId: 'control-settings-menu' });
  }

  function bindLeaveLevelButton() {
    if (!leaveLevelBtn) return;
    leaveLevelBtn.addEventListener('click', () => {
      leaveActiveLevel();
    });
  }


  // Field notes overlay logic handled by fieldNotesOverlay.js.

  function notifyAutoAnchorUsed(currentPlaced, totalAnchors) {
    if (!Number.isFinite(currentPlaced)) {
      return;
    }
    const normalizedTotal = Number.isFinite(totalAnchors)
      ? Math.max(0, totalAnchors)
      : Math.max(0, currentPlaced);
    const cappedPlaced = Math.max(0, Math.min(currentPlaced, normalizedTotal));
    gameStats.autoAnchorPlacements = Math.max(gameStats.autoAnchorPlacements, cappedPlaced);
    evaluateAchievements();
  }

  function notifyEnemyDefeated() {
    gameStats.enemiesDefeated += 1;
    evaluateAchievements();
  }

  function notifyLevelVictory(levelId) {
    if (!isInteractiveLevel(levelId)) {
      return;
    }
    gameStats.manualVictories += 1;
    evaluateAchievements();
  }

  function notifyPowderAction() {
    gameStats.powderActions += 1;
    evaluateAchievements();
  }

  function notifyPowderMultiplier(value) {
    if (!Number.isFinite(value)) {
      return;
    }
    if (value > gameStats.highestPowderMultiplier) {
      gameStats.highestPowderMultiplier = value;
    }
    evaluateAchievements();
  }

  function handlePowderHeightChange(info, _source) {
    if (!info) {
      return;
    }


    const previousGain = powderState.simulatedDuneGain;
    const normalizedHeight = Number.isFinite(info.normalizedHeight)
      ? Math.max(0, Math.min(1, info.normalizedHeight))
      : 0;
    const clampedGain = Number.isFinite(info.duneGain)
      ? Math.max(0, Math.min(powderConfig.simulatedDuneGainMax, info.duneGain))
      : 0;
    const scrollOffset = Number.isFinite(info.scrollOffset) ? Math.max(0, info.scrollOffset) : 0;
    const totalNormalized = Number.isFinite(info.totalNormalized)
      ? Math.max(0, info.totalNormalized)
      : normalizedHeight;
    const cellSize = Number.isFinite(info.cellSize)
      ? Math.max(1, info.cellSize)
      : POWDER_CELL_SIZE_PX;
    const rows = Number.isFinite(info.rows) ? Math.max(1, info.rows) : 1;
    const highestNormalizedRaw = Number.isFinite(info.highestNormalized)
      ? Math.max(0, info.highestNormalized)
      : totalNormalized;
    const _highestNormalized = Math.max(0, Math.min(1, highestNormalizedRaw));
    const _highestDisplay = formatDecimal(Math.max(0, highestNormalizedRaw), 2);

    powderState.simulatedDuneGain = clampedGain;
    // Capture the current height profile so dune progress resumes accurately after reloads.
    schedulePowderBasinSave();

    if (powderElements.basin) {
      powderElements.basin.style.setProperty('--powder-crest', normalizedHeight.toFixed(3));
    }

    const wallShiftPx = scrollOffset * cellSize;
    const textureRepeat = resolveWallTextureRepeatPx(powderElements.leftWall || powderElements.rightWall);
    const rawTextureOffset =
      Number.isFinite(textureRepeat) && textureRepeat > 0 ? wallShiftPx % textureRepeat : wallShiftPx;
    const wallTextureOffset = Number.isFinite(rawTextureOffset) ? rawTextureOffset : 0;
    const wallOffsetValue = `${wallTextureOffset.toFixed(1)}px`;

    if (powderElements.leftWall) {
      powderElements.leftWall.style.transform = '';
      // Apply the offset via a CSS variable so the wall texture scrolls without breaking wall markers.
      powderElements.leftWall.style.setProperty('--powder-wall-shift', wallOffsetValue);
    }
    if (powderElements.rightWall) {
      powderElements.rightWall.style.transform = '';
      powderElements.rightWall.style.setProperty(
        '--powder-right-wall-sprite-offset-x',
        `${ALEPH_RIGHT_WALL_SPRITE_OFFSET_PX}px`,
      );
      powderElements.rightWall.style.setProperty('--powder-wall-shift', wallOffsetValue);
    }

    const _basinHeight = rows * cellSize;

    const glyphMetrics = updatePowderGlyphColumns({
      scrollOffset,
      rows,
      cellSize,
      highestNormalized: highestNormalizedRaw,
      totalNormalized,
      // Tie vertical Aleph spacing to the live wall gap so each lane costs 100 motes of ascent.
      wallGapMotes: Number.isFinite(powderState.wallGapTarget)
        ? Math.max(1, powderState.wallGapTarget)
        : Math.max(1, powderConfig.wallBaseGapMotes),
      tierAdvanceAlephCount: powderConfig.alephTierAdvanceCount,
      minAlephWallTier: powderConfig.alephWallTierMin,
      maxAlephWallTier: powderConfig.alephWallTierMax,
    });

    if (powderElements.nextGlyphProgress) {
      if (glyphMetrics) {
        const clampedProgress = Math.min(1, Math.max(0, glyphMetrics.progressFraction));
        // Show progress climbing toward the next glyph instead of counting down from 100%.
        const progressPercent = formatDecimal(clampedProgress * 100, 1);
        const remainingHeightMotes = Number.isFinite(glyphMetrics.remainingToNextMotes)
          ? Math.max(0, glyphMetrics.remainingToNextMotes)
          : Math.max(0, glyphMetrics.remainingToNext);
        const remainingHeight = formatDecimal(remainingHeightMotes, 2);
        const tier = Number.isFinite(glyphMetrics.tier) ? Math.max(1, Math.floor(glyphMetrics.tier)) : 1;
        const alephInTier = Number.isFinite(glyphMetrics.alephInTier) ? Math.max(0, Math.floor(glyphMetrics.alephInTier)) : 0;
        const tierAdvance = Number.isFinite(glyphMetrics.tierAdvanceAlephCount)
          ? Math.max(1, Math.floor(glyphMetrics.tierAdvanceAlephCount))
          : 30;
        powderElements.nextGlyphProgress.textContent = `Tier ${tier} · ℵ ${alephInTier}/${tierAdvance} · ${progressPercent}% to next glyph · Δh ${remainingHeight}`;
      } else {
        powderElements.nextGlyphProgress.textContent = '—';
      }
    }

    if (glyphMetrics) {
      const { glyphsLit, highestRaw, progressFraction } = glyphMetrics;
      const tierProgress = resolveAlephTierProgress(glyphsLit);
      maybeStartAlephTierTransition(glyphsLit, tierProgress);
      const tierVisualGlyphsLit = getTierVisualGlyphCount(glyphsLit);
      const visualTierProgress = resolveAlephTierProgress(tierVisualGlyphsLit);
      const transitionActive = Boolean(powderState.alephTierTransition?.active);
      syncAlephTierVisualProfile(visualTierProgress);
      // Award glyph currency the moment a new Aleph threshold is illuminated.
      const previousAwarded = Number.isFinite(powderState.glyphsAwarded)
        ? Math.max(0, powderState.glyphsAwarded)
        : 0;
      if (glyphsLit > previousAwarded) {
        const newlyEarned = glyphsLit - previousAwarded;
        addGlyphCurrency(newlyEarned);
        powderState.glyphsAwarded = glyphsLit;
      } else if (!Number.isFinite(powderState.glyphsAwarded) || powderState.glyphsAwarded < glyphsLit) {
        powderState.glyphsAwarded = Math.max(previousAwarded, glyphsLit);
      }
      updatePowderWallGapFromGlyphs(tierVisualGlyphsLit);
      if (powderElements.leftWall) {
        powderElements.leftWall.classList.toggle('wall-awake', highestRaw > 0);
      }
      if (powderElements.rightWall) {
        powderElements.rightWall.classList.toggle(
          'wall-awake',
          tierVisualGlyphsLit > 0 || progressFraction >= 0.6,
        );
      }

      if (glyphsLit !== powderState.wallGlyphsLit) {
        powderState.wallGlyphsLit = glyphsLit;
      }
      if (!transitionActive) {
        powderState.alephTierTransitionCheckpoint = Math.max(
          powderState.alephTierTransitionCheckpoint || 0,
          glyphsLit,
        );
      }
    }

    if (Math.abs(previousGain - clampedGain) > 0.01) {
      refreshPowderSystems();
    }

  }

  configureAchievementsTab({
    levelConfigs,
    levelState,
    getInteractiveLevelOrder: () => interactiveLevelOrder,
    isLevelCompleted,
    THERO_SYMBOL,
    recordPowderEvent,
    updateResourceRates,
    updatePowderLedger,
    updateStatusDisplays,
    gameStats,
    spireResourceState,
    powderState,
  });

  async function init() {
    // Configure towersTab callbacks to avoid circular dependency
    configureTowersTabCallbacks({
      updateStatusDisplays,
    });

    levelGrid = document.getElementById('level-grid');
    activeLevelEl = document.getElementById('active-level');
    leaveLevelBtn = document.getElementById('leave-level');
    levelGridCtrl.bindElements({ levelGrid, activeLevelEl, leaveLevelBtn });
    if (levelOverlayController) {
      levelOverlayController.bindOverlayElements();
    }
    if (levelStoryScreen) {
      levelStoryScreen.bindElements({
        overlay: document.getElementById('level-story-overlay'),
        label: document.getElementById('level-story-label'),
        sections: document.getElementById('level-story-sections'),
        prompt: document.getElementById('level-story-prompt'),
      });
    }
    // Bind layout controller DOM references and fullscreen event listeners.
    layoutCtrl.bindElements();
    if (playfieldMenuController) {
      // Wire the playfield quick menu buttons through the dedicated controller.
      playfieldMenuController.bindMenuElements({
        button: document.getElementById('playfield-menu-button'),
        panel: document.getElementById('playfield-menu-panel'),
        commence: document.getElementById('playfield-menu-commence'),
        levelSelect: document.getElementById('playfield-menu-level-select'),
        retry: document.getElementById('playfield-menu-retry-wave'),
        devTools: document.getElementById('playfield-menu-dev-tools'),
        stats: document.getElementById('playfield-menu-stats'),
      });
    }
    // Default to the level selection view until a combat encounter begins.
    updateLayoutVisibility();
    // Instantiate overlay preview renderer so level cards share the same editor plumbing.
    levelPreviewRenderer = createLevelPreviewRenderer({
      getOverlayElement: () => levelOverlayController?.getOverlayElement() || null,
      getOverlayPreviewElement: () => levelOverlayController?.getOverlayPreviewElement() || null,
      getLevelConfigs: () => levelConfigs,
      getPlayfield: () => playfield,
      playfieldElements,
      isDeveloperModeActive: () => developerModeActive,
      getActiveLevelId: () => activeLevelId,
      isActiveLevelInteractive: () => activeLevelIsInteractive,
      setOverlayPreviewLevel,
      hideLevelEditorPanel,
      resetLevelEditorSurface,
      setLevelEditorSurface,
      configureLevelEditorForLevel,
    });
    if (levelOverlayController) {
      levelOverlayController.setPreviewRenderer(levelPreviewRenderer);
    }

    // Attach the particle scrollbar canvas to the right edge for reliable touch scrolling on Android.
    initParticleScrollbar();

    initializeLevelEditorElements();
    initializeDeveloperMapElements();

    // Apply the preferred graphics fidelity before other controls render.
    initializeGraphicsMode();
    initializeTrackRenderMode();
    initializeFrameRateLimitPreference();
    initializeFpsCounterPreference();
    initializeAutoGraphicsPreference();
    bindGraphicsModeToggle();
    bindVisualSettingsMenu();
    bindControlSettingsMenu();
    bindInvertCarouselDragToggle();
    initializeInvertCarouselDragPreference();
    bindColorSchemeButton();
    bindTrackRenderModeButton();
    // Expose a tactile toggle for the luminous track tracer overlay.
    bindTrackTracerToggle();
    bindLoadoutSlotButton();
    bindNotationToggle();
    bindGlyphEquationToggle();
    bindDamageNumberToggle();
    bindDamageNumberModeToggle();
    bindWaveKillTallyToggle();
    bindWaveDamageTallyToggle();
    bindFrameRateLimitSlider();
    bindFpsCounterToggle();
    bindAutoGraphicsToggle();

    // Bind playfield visual settings
    bindEnemyParticlesToggle();
    initializeEnemyParticlesPreference();
    bindEdgeCrystalsToggle();
    initializeEdgeCrystalsPreference();
    bindCrystalBackgroundSpritesToggle();
    initializeCrystalBackgroundSpritesPreference();
    bindBackgroundParticlesToggle();
    initializeBackgroundParticlesPreference();
    bindPlayfieldTrackTypeButton();
    initializeTowerLoadoutToggleSidePreference();
    bindTowerLoadoutToggleSideButton();
    // Sync the spire options placement toggle before binding render-specific buttons.
    initializeSpireOptionsPlacementPreference();
    bindSpireOptionsPlacementButton();
    initializePlayfieldPreferences();
    bindPlayfieldOptions();
    // Bind developer layer visibility toggles (only visible when developer mode is active).
    bindDevLayerToggles();

    // Bind playfield settings dropdown using the spire options dropdown behavior
    bindSpireOptionsDropdown({
      toggleId: 'playfield-settings-toggle',
      menuId: 'playfield-settings-menu',
      spireId: 'playfield-settings',
    });
    
    // Activate the Well of Inspiration options dropdown.
    bindSpireOptionsDropdown({
      toggleId: 'powder-spire-options-toggle-button',
      menuId: 'powder-options-menu',
      spireId: 'powder',
      // Sync the footer spire button with the corner cog.
      extraToggleIds: ['powder-options-toggle-button'],
      // Close the Well of Inspiration popover when clicking outside.
      closeOnOutside: true,
    });
    initializePowderSpirePreferences();
    bindPowderSpireOptions();
    initializeColorScheme();
    bindAudioControls();

    const towerPanel = document.getElementById('panel-tower');
    const towersPanel = document.getElementById('panel-towers');
    const optionsPanel = document.getElementById('panel-options');
    enablePanelWheelScroll(towerPanel, isFieldNotesOverlayVisible);
    enablePanelWheelScroll(towersPanel, isFieldNotesOverlayVisible);
    enablePanelWheelScroll(optionsPanel, isFieldNotesOverlayVisible);

    playfieldElements.container = document.getElementById('playfield');
    playfieldElements.canvas = document.getElementById('playfield-canvas');
    playfieldElements.message = document.getElementById('playfield-message');
    playfieldElements.wave = document.getElementById('playfield-wave');
    playfieldElements.health = document.getElementById('playfield-health');
    playfieldElements.energy = document.getElementById('playfield-energy');
    playfieldElements.progress = document.getElementById('playfield-progress');
    playfieldElements.startButton =
      document.getElementById('playfield-menu-commence') ||
      document.getElementById('playfield-start');
    playfieldElements.speedButton = document.getElementById('playfield-speed');
    playfieldElements.autoAnchorButton = document.getElementById('playfield-auto');
    playfieldElements.autoWaveCheckbox = document.getElementById('playfield-auto-wave');
    playfieldElements.slots = Array.from(document.querySelectorAll('.tower-slot'));
    PlayfieldStatsPanel.registerStatsElements({
      container: document.getElementById('playfield-combat-stats'),
      towerList: document.getElementById('playfield-combat-stats-towers'),
      attackList: document.getElementById('playfield-combat-stats-log'),
      enemyList: document.getElementById('playfield-combat-stats-enemies'),
      currentWaveList: document.getElementById('playfield-combat-stats-current-wave'),
      nextWaveList: document.getElementById('playfield-combat-stats-next-wave'),
      activeEnemyList: document.getElementById('playfield-combat-stats-active-enemies'),
      emptyTowerNote: document.getElementById('playfield-combat-stats-tower-empty'),
      emptyAttackNote: document.getElementById('playfield-combat-stats-log-empty'),
      emptyEnemyNote: document.getElementById('playfield-combat-stats-enemy-empty'),
      emptyCurrentWaveNote: document.getElementById('playfield-combat-stats-current-empty'),
      emptyNextWaveNote: document.getElementById('playfield-combat-stats-next-empty'),
      emptyActiveEnemyNote: document.getElementById('playfield-combat-stats-active-empty'),
      dialog: document.getElementById('playfield-combat-stats-dialog'),
      dialogTitle: document.getElementById('playfield-combat-stats-dialog-title'),
      dialogList: document.getElementById('playfield-combat-stats-dialog-list'),
      dialogClose: document.getElementById('playfield-combat-stats-dialog-close'),
    });
    setPlayfieldOutcomeElements({
      overlay: document.getElementById('playfield-outcome'),
      title: document.getElementById('playfield-outcome-title'),
      subtitle: document.getElementById('playfield-outcome-subtitle'),
      primary: document.getElementById('playfield-outcome-primary'),
      secondary: document.getElementById('playfield-outcome-secondary'),
    });
    bindPlayfieldOutcomeEvents();
    hidePlayfieldOutcome();

    setLoadoutElements({
      shell: document.getElementById('tower-loadout-shell'),
      container: document.getElementById('tower-loadout'),
      grid: document.getElementById('tower-loadout-grid'),
      note: document.getElementById('tower-loadout-note'),
      toggle: document.getElementById('tower-loadout-toggle'),
    });
    setLoadoutSlotChangeHandler((slotCount) => {
      overrideTowerLoadoutLimit(slotCount);
      syncLoadoutToPlayfield();
    });

    setHideUpgradeMatrixCallback(hideUpgradeMatrix);
    setRenderUpgradeMatrixCallback(renderUpgradeMatrix);

    bindTowerUpgradeOverlay();

    // Synchronize tab interactions with overlay state, audio cues, and banner refreshes.
    configureTabManager({
      getOverlayActiveState: () => Boolean(levelOverlayController?.isOverlayActive()),
      isFieldNotesOverlayVisible,
      onTabChange: (tabId) => {
        closeAllSpireDropdowns();
        // Hide the tower selection wheel whenever players leave the Stage tab.
        if (tabId !== 'tower' && playfield && typeof playfield.closeTowerSelectionWheel === 'function') {
          playfield.closeTowerSelectionWheel();
        }
        // Hide the loadout wheel whenever players leave the Tower tab.
        if (tabId !== 'tower' && typeof closeLoadoutWheel === 'function') {
          closeLoadoutWheel();
        }
        refreshTabMusic();
        if (tabId === 'towers') {
          updateTowerCardVisibility();
          refreshTowerCardBackgroundAnimations();
          requestAnimationFrame(() => stageTowerCardEntrance({ delayBetweenMs: 40 }));
        } else if (tabId === 'powder') {
          if (sandSimulation && typeof sandSimulation.handleResize === 'function') {
            sandSimulation.handleResize();
          }
          initializePowderViewInteraction();
        }

        // Handle achievements tab visibility for sparkle management
        // Notify achievements tab when visibility changes
        if (typeof notifyAchievementsTabVisibilityChange === 'function') {
          notifyAchievementsTabVisibilityChange(tabId === 'achievements');
        }

        notifyParticleScrollbarTabChanged();
      },
      onTowerTabActivated: () => {
        updateActiveLevelBanner();
      },
      playTabSelectSfx: () => {
        if (audioManager) {
          audioManager.playSfx('menuSelect');
        }
      },
    });

    initializeTabs();
    await initializeFieldNotesOverlay();
    bindCodexControls({
      setActiveTab,
      openFieldNotesOverlay,
      scrollPanelToElement,
      onOpenButtonReady: setFieldNotesOpenButton,
    });
    // Hydrate the diagnostics card once codex controls exist.
    initializePerformanceCodex();
    try {
      await ensureGameplayConfigLoaded();
    } catch (error) {
      console.error('Thero Idle failed to load gameplay data', error);
      if (playfieldElements.message) {
        playfieldElements.message.textContent =
          'Unable to load gameplay data—refresh the page to retry.';
      }
      await dismissStartupOverlay();
      return;
    }

    refreshDeveloperModeState();

    if (levelStoryScreen) {
      levelStoryScreen.preloadStories();
    }

    setMergingLogicUnlocked(getMergeProgressState().mergingLogicUnlocked);

    initializeLoadoutSlotPreference({ defaultSlots: getTowerLoadoutLimit() });

    enemyCodexElements.list = document.getElementById('enemy-codex-list');
    enemyCodexElements.empty = document.getElementById('enemy-codex-empty');
    enemyCodexElements.note = document.getElementById('enemy-codex-note');
    initializeEnemyCodexOverlay();
    bindDeveloperModeToggle();
    bindDeveloperControls();
    if (audioManager) {
      const activationElements = [
        playfieldElements.startButton,
        playfieldElements.speedButton,
        playfieldElements.autoAnchorButton,
        playfieldElements.autoWaveCheckbox,
        playfieldElements.canvas,
        ...playfieldElements.slots,
      ].filter(Boolean);
      audioManager.registerActivationElements(activationElements);
    }

    if (leaveLevelBtn) {
      leaveLevelBtn.disabled = true;
    }

    initializePlayfieldBackgroundVideo();

    if (playfieldElements.canvas && playfieldElements.container) {
      playfield = new SimplePlayfield({
        canvas: playfieldElements.canvas,
        container: playfieldElements.container,
        messageEl: playfieldElements.message,
        waveEl: playfieldElements.wave,
        healthEl: playfieldElements.health,
        energyEl: playfieldElements.energy,
        progressEl: playfieldElements.progress,
        startButton: playfieldElements.startButton,
        speedButton: playfieldElements.speedButton,
        autoAnchorButton: playfieldElements.autoAnchorButton,
        autoWaveCheckbox: playfieldElements.autoWaveCheckbox,
        slotButtons: playfieldElements.slots,
        audioManager,
        onVictory: handlePlayfieldVictory,
        onDefeat: handlePlayfieldDefeat,
        onCombatStart: handlePlayfieldCombatStart,
      });
      setTowersPlayfield(playfield);
      playfield.draw();
      if (playfieldMenuController) {
        playfieldMenuController.syncStatsPanelVisibility();
      }
    }

    refreshTabMusic({ restart: true });

    loadPersistentState();
    // Load tutorial state after persistent state is loaded
    loadTutorialState();
    // Check if tutorial should be completed based on level progress
    checkTutorialCompletion(isLevelCompleted);
    // Initialize tab lock states based on tutorial completion
    initializeTabLockStates(isTutorialCompleted());
    // Unlock tabs based on saved state
    if (isTowersTabUnlocked()) {
      unlockTowersTab();
    }
    if (isAchievementsUnlocked()) {
      unlockAchievementsTab();
    }
    // Reapply developer mode boosts after progression restore so level unlocks stay in sync.
    refreshDeveloperModeState();

    bindStatusElements();
    bindPowderControls();
    bindAlephTierTransitionControls();
    ensurePowderBasinResizeObserver();
    await applyPowderSimulationMode();
    bindAchievements();
    // Initialize boosts section in achievements tab
    loadMonetizationState();
    initializeBoostsSection();
    updatePowderLogDisplay();
    updateResourceRates();
    updatePowderDisplay();
    // Begin the recurring autosave cadence once the core systems are initialized.
    startAutoSaveLoop();

    await dismissStartupOverlay();
    injectTowerCardPreviews();
    refreshTowerCardBackgroundAnimations();
    simplifyTowerCards();
    annotateTowerCardsWithCost();
    synchronizeTowerCardMasterEquations();
    updateTowerCardVisibility();
    // If the player loaded directly into the towers tab, the entrance animation
    // was scheduled before injectTowerCardPreviews/updateTowerCardVisibility ran,
    // so cards were still hidden at that point. Re-run the entrance now that all
    // cards are properly injected and their visibility is up-to-date.
    if (getActiveTabId() === 'towers') {
      requestAnimationFrame(() => {
        stageTowerCardEntrance({ delayBetweenMs: 40 });
      });
    }
    initializeTowerTreeMap({
      toggleButton: document.getElementById('tower-tree-map-toggle'),
      mapContainer: document.getElementById('tower-tree-map'),
      cardGrid: document.getElementById('tower-card-grid'),
    });
    refreshTowerTreeMap();
    initializeTowerSelection();
    initializeTowerVisibilityToggle();
    initializeTowerElementDebugControls();
    initializeT2Toggles();
    bindTowerCardUpgradeInteractions();
    syncLoadoutToPlayfield();
    renderEnemyCodex();

    buildLevelCards();
    updateLevelCards();
    variableLibraryController.bindVariableLibrary();
    bindUpgradeMatrix();
    bindLeaveLevelButton();
    initializeManualDropHandlers();
    
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init().catch(console.error));
  } else {
    init().catch(console.error);
  }

  bindPageLifecycleEvents({
    commitAutoSave,
    suppressAudioPlayback,
    releaseAudioSuppression,
    refreshTabMusic,
    audioManager,
  });

  document.addEventListener('keydown', (event) => {
    const overlay = levelOverlayController?.getOverlayElement
      ? levelOverlayController.getOverlayElement()
      : null;
    const towerUpgradeOverlay = getTowerUpgradeOverlayElement();
    if (towerUpgradeOverlay && towerUpgradeOverlay.classList.contains('active')) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeTowerUpgradeOverlay();
        return;
      }
      if ((event.key === 'Enter' || event.key === ' ') && event.target === towerUpgradeOverlay) {
        event.preventDefault();
        closeTowerUpgradeOverlay();
        return;
      }
    }

    if (
      handleUpgradeMatrixKeydown(event, {
        isLevelOverlayActive: Boolean(overlay && overlay.classList.contains('active')),
      })
    ) {
      return;
    }

    if (variableLibraryController.handleKeydown(event)) {
      return;
    }

    if (!overlay) return;
    const hidden = overlay.getAttribute('aria-hidden');
    const isActive = overlay.classList.contains('active');
    if (hidden !== 'false' && !isActive) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelPendingLevel();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      confirmPendingLevel();
    }
  });

  const upgradeNamespace =
    (window.theroIdleUpgrades = window.theroIdleUpgrades || window.glyphDefenseUpgrades || {});
  upgradeNamespace.alephChain = {
    // Surface the current Aleph chain upgrades so the Codex and dev tools can inspect live values.
    get: () => getAlephChainUpgrades(),
    // Accept upgrade adjustments from external scripts while keeping the playfield synchronized.
    set: (updates) => updateAlephChainUpgrades(updates, { playfield }),
  };

  window.glyphDefenseUpgrades = upgradeNamespace;

})();
