// Developer mode toggle and reset orchestration extracted from main.js.
// This module centralizes the DOM bindings, persistence, and state mutation
// required to enable the "developer lattice" workflow without bloating the main orchestrator.

const DEVELOPER_RESET_DEFAULT_LABEL = 'Delete Player Data';
const DEVELOPER_RESET_CONFIRM_LABEL = 'Are you sure?';
const DEVELOPER_RESET_CONFIRM_WINDOW_MS = 5000;
const DEVELOPER_RESET_RELOAD_DELAY_MS = 900;
const DEVELOPER_MODE_STORAGE_KEY = 'glyph-defense-idle:developer-mode';
const DEVELOPER_RESOURCE_GRANT = Number.MAX_SAFE_INTEGER;

export function createDeveloperModeManager(options = {}) {
  const {
    getDeveloperModeActive,
    setDeveloperModeActive,
    getTowerDefinitions,
    getTowerLoadoutState,
    getTowerLoadoutLimit,
    unlockTower,
    initializeDiscoveredVariablesFromUnlocks,
    pruneLockedTowersFromLoadout,
    getTowerUnlockState,
    setMergingLogicUnlocked,
    powderState,
    setDeveloperInfiniteTheroEnabled,
    getPowderSimulation,
    setPowderSimulation,
    getSandSimulation,
    setSandSimulation,
    unlockedLevels,
    interactiveLevelOrder,
    levelState,
    levelBlueprints,
    setDeveloperModeUnlockOverride,
    getEnemyCodexEntries,
    codexState,
    renderEnemyCodex,
    refreshEnemyAlmanac,
    updateLevelCards,
    updateActiveLevelBanner,
    updateTowerCardVisibility,
    updateTowerSelectionButtons,
    syncLoadoutToPlayfield,
    updateStatusDisplays,
    evaluateAchievements,
    refreshAchievementPowderRate,
    updateResourceRates,
    updatePowderLedger,
    updateDeveloperControlsVisibility,
    syncDeveloperControlValues,
    syncLevelEditorVisibility,
    updateDeveloperMapElementsVisibility,
    getPlayfield,
    getPlayfieldMenuController,
    refreshPowderWallDecorations,
    clearDeveloperTheroMultiplierOverride,
    deactivateDeveloperMapTools,
    setDeveloperMapPlacementMode,
    persistentStorageKeys = [],
    stopAutoSaveLoop,
    pruneLevelState,
    resetPowderUiState,
    resetActiveMoteGems,
    updateMoteGemInventoryDisplay,
    refreshPowderSystems,
    updatePowderModeButton,
    updatePowderLogDisplay,
    setPowderCurrency,
    idleLevelRuns,
    gameStats,
    resourceState,
    baseResources,
    powderConfig,
    applyMindGatePaletteToDom,
    mergeMotePalette,
    defaultMotePalette,
    resetAlephChainUpgrades,
    reconcileGlyphCurrencyFromState,
    updatePowderWallGapFromGlyphs,
    moteGemState,
    clearTowerUpgradeState,
    setPowderBasinObserver,
    getPowderBasinObserver,
    setPendingPowderResizeFrame,
    getPendingPowderResizeFrame,
    setPendingPowderResizeIsTimeout,
    getPendingPowderResizeIsTimeout,
    setObservedPowderResizeElements,
    getObservedPowderResizeElements: _getObservedPowderResizeElements,
    updateTabLockStates,
    isTutorialCompleted,
  } = options;

  const developerModeElements = {
    toggle: null,
    stageToggle: null,
    note: null,
    resetButton: null,
  };

  const developerResetState = {
    confirming: false,
    timeoutId: null,
  };

  function isDeveloperModeActive() {
    return Boolean(typeof getDeveloperModeActive === 'function' && getDeveloperModeActive());
  }

  function setDeveloperModeFlag(active) {
    if (typeof setDeveloperModeActive === 'function') {
      setDeveloperModeActive(active);
    }
  }

  function persistDeveloperModeState(active) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    try {
      window.localStorage.setItem(DEVELOPER_MODE_STORAGE_KEY, active ? 'true' : 'false');
    } catch (error) {
      console.warn('Failed to persist developer mode state.', error);
    }
  }

  function setDeveloperNoteVisibility(visible) {
    if (developerModeElements.note) {
      developerModeElements.note.hidden = !visible;
    }
  }

  function updateDeveloperBanksForSimulation(simulation, { bank = null, rate = null } = {}) {
    if (!simulation) {
      return;
    }
    if (Number.isFinite(bank) && typeof simulation.idleBank !== 'undefined') {
      simulation.idleBank = bank;
    }
    if (Number.isFinite(rate) && typeof simulation.idleDrainRate !== 'undefined') {
      simulation.idleDrainRate = rate;
    }
  }

  function updateWellSimulationBank() {
    updateDeveloperBanksForSimulation(getSandSimulation?.(), {
      bank: DEVELOPER_RESOURCE_GRANT,
      rate: 0,
    });
  }

  function enableDeveloperMode() {
    const developerModeWasActive = isDeveloperModeActive();
    setDeveloperModeFlag(true);
    if (developerModeElements.toggle && !developerModeElements.toggle.checked) {
      developerModeElements.toggle.checked = true;
    }
    // Sync the stage tab toggle when enabling developer mode.
    if (developerModeElements.stageToggle && !developerModeElements.stageToggle.checked) {
      developerModeElements.stageToggle.checked = true;
    }
    // Ensure level lock checks bypass progression when developer mode is active.
    setDeveloperModeUnlockOverride?.(true);
    // Unlock all tabs by treating the tutorial as complete in developer mode.
    updateTabLockStates?.(true);

    const towers = typeof getTowerDefinitions === 'function' ? getTowerDefinitions() : [];
    const loadoutState = typeof getTowerLoadoutState === 'function' ? getTowerLoadoutState() : null;
    towers.forEach((definition) => {
      if (definition?.id && typeof unlockTower === 'function') {
        unlockTower(definition.id, { silent: true });
      }
    });
    if (typeof initializeDiscoveredVariablesFromUnlocks === 'function') {
      const unlockedIds = towers.map((definition) => definition?.id).filter((id) => typeof id === 'string');
      initializeDiscoveredVariablesFromUnlocks(unlockedIds);
    }
    if (loadoutState && typeof getTowerLoadoutLimit === 'function') {
      loadoutState.selected = towers.slice(0, getTowerLoadoutLimit()).map((definition) => definition?.id);
    }
    pruneLockedTowersFromLoadout?.();

    if (powderState) {
      powderState.idleMoteBank = DEVELOPER_RESOURCE_GRANT;
      powderState.idleDrainRate = 0;
    }
    if (!developerModeWasActive) {
      setDeveloperInfiniteTheroEnabled?.(true);
    }
    updateWellSimulationBank();

    if (unlockedLevels?.clear) {
      unlockedLevels.clear();
    }
    interactiveLevelOrder?.forEach((levelId) => {
      unlockedLevels?.add?.(levelId);
      const existing = levelState?.get?.(levelId) || {};
      levelState?.set?.(levelId, {
        ...existing,
        entered: true,
        running: false,
        completed: true,
      });
    });
    levelBlueprints?.forEach?.((level) => {
      if (!levelState?.has?.(level?.id)) {
        levelState?.set?.(level?.id, { entered: true, running: false, completed: true });
      }
    });

    const codexEntries = typeof getEnemyCodexEntries === 'function' ? getEnemyCodexEntries() : [];
    if (codexState) {
      codexState.encounteredEnemies = new Set(codexEntries.map((entry) => entry?.id));
    }

    renderEnemyCodex?.();
    refreshEnemyAlmanac?.();
    updateLevelCards?.();
    updateActiveLevelBanner?.();
    updateTowerCardVisibility?.();
    updateTowerSelectionButtons?.();
    syncLoadoutToPlayfield?.();
    updateStatusDisplays?.();
    evaluateAchievements?.();
    refreshAchievementPowderRate?.();
    updateResourceRates?.();
    updatePowderLedger?.();

    setDeveloperNoteVisibility(true);
    updateDeveloperControlsVisibility?.();
    syncDeveloperControlValues?.();
    syncLevelEditorVisibility?.();

    const playfieldMenuController = typeof getPlayfieldMenuController === 'function'
      ? getPlayfieldMenuController()
      : null;
    playfieldMenuController?.updateMenuState?.();
    updateDeveloperMapElementsVisibility?.();

    const playfieldInstance = typeof getPlayfield === 'function' ? getPlayfield() : null;
    if (playfieldInstance?.messageEl) {
      playfieldInstance.messageEl.textContent =
        'Developer lattice engaged—every tower, level, and codex entry is unlocked.';
    }

    refreshPowderWallDecorations?.();

    persistDeveloperModeState(true);
  }

  function disableDeveloperMode() {
    setDeveloperModeFlag(false);
    if (developerModeElements.toggle && developerModeElements.toggle.checked) {
      developerModeElements.toggle.checked = false;
    }
    // Sync the stage tab toggle when disabling developer mode.
    if (developerModeElements.stageToggle && developerModeElements.stageToggle.checked) {
      developerModeElements.stageToggle.checked = false;
    }
    setDeveloperInfiniteTheroEnabled?.(false);
    // Restore normal level lock behavior once developer mode is disabled.
    setDeveloperModeUnlockOverride?.(false);
    // Restore tab locks based on actual tutorial completion state.
    const tutorialComplete = typeof isTutorialCompleted === 'function'
      ? isTutorialCompleted()
      : false;
    updateTabLockStates?.(tutorialComplete);
    persistDeveloperModeState(false);

    deactivateDeveloperMapTools?.({ force: true, silent: true });
    setDeveloperMapPlacementMode?.(null);
    updateDeveloperMapElementsVisibility?.();

    const unlockState = typeof getTowerUnlockState === 'function' ? getTowerUnlockState() : null;
    if (unlockState) {
      unlockState.unlocked = new Set(['alpha']);
    }
    setMergingLogicUnlocked?.(false);
    initializeDiscoveredVariablesFromUnlocks?.(unlockState?.unlocked);
    const loadoutState = typeof getTowerLoadoutState === 'function' ? getTowerLoadoutState() : null;
    if (loadoutState) {
      loadoutState.selected = ['alpha'];
    }
    pruneLockedTowersFromLoadout?.();

    if (codexState) {
      codexState.encounteredEnemies = new Set();
    }

    levelState?.clear?.();
    unlockedLevels?.clear?.();
    const firstLevel = Array.isArray(interactiveLevelOrder) ? interactiveLevelOrder[0] : null;
    if (firstLevel) {
      unlockedLevels?.add?.(firstLevel);
    }

    clearDeveloperTheroMultiplierOverride?.();
    const playfieldInstance = typeof getPlayfield === 'function' ? getPlayfield() : null;
    if (playfieldInstance?.leaveLevel) {
      playfieldInstance.leaveLevel();
    }

    renderEnemyCodex?.();
    updateLevelCards?.();
    updateActiveLevelBanner?.();
    updateTowerCardVisibility?.();
    updateTowerSelectionButtons?.();
    syncLoadoutToPlayfield?.();
    updateStatusDisplays?.();
    evaluateAchievements?.();
    refreshAchievementPowderRate?.();
    updateResourceRates?.();
    updatePowderLedger?.();

    setDeveloperNoteVisibility(false);
    updateDeveloperControlsVisibility?.();
    syncDeveloperControlValues?.();

    const playfieldMenuController = typeof getPlayfieldMenuController === 'function'
      ? getPlayfieldMenuController()
      : null;
    playfieldMenuController?.updateMenuState?.();
    refreshPowderWallDecorations?.();
  }

  function resetDeveloperResetButtonConfirmation({ label = DEVELOPER_RESET_DEFAULT_LABEL, warning = false } = {}) {
    developerResetState.confirming = false;
    if (developerResetState.timeoutId) {
      clearTimeout(developerResetState.timeoutId);
      developerResetState.timeoutId = null;
    }
    const button = developerModeElements.resetButton;
    if (!button) {
      return;
    }
    button.disabled = false;
    button.textContent = label;
    if (warning) {
      button.classList.add('developer-reset-button--warning');
    } else {
      button.classList.remove('developer-reset-button--warning');
    }
  }

  function clearPersistentStorageKeys() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return true;
    }
    let success = true;
    persistentStorageKeys.forEach((key) => {
      if (!key || typeof key !== 'string') {
        return;
      }
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        success = false;
        console.warn(`Failed to remove storage key "${key}" while deleting player data.`, error);
      }
    });
    return success;
  }

  function resetPlayerProgressState() {
    if (gameStats) {
      gameStats.manualVictories = 0;
      gameStats.idleVictories = 0;
      gameStats.towersPlaced = 0;
      gameStats.maxTowersSimultaneous = 0;
      gameStats.autoAnchorPlacements = 0;
      gameStats.powderActions = 0;
      gameStats.enemiesDefeated = 0;
      gameStats.idleMillisecondsAccumulated = 0;
      gameStats.powderSigilsReached = 0;
      gameStats.highestPowderMultiplier = 1;
    }
    if (resourceState && baseResources) {
      resourceState.score = baseResources.score;
      resourceState.scoreRate = baseResources.scoreRate;
      resourceState.energyRate = baseResources.energyRate;
      resourceState.fluxRate = baseResources.fluxRate;
      resourceState.running = false;
    }

    setPowderCurrency?.(0);
    idleLevelRuns?.clear?.();

    if (powderState?.viewInteraction?.destroy) {
      try {
        powderState.viewInteraction.destroy();
      } catch (error) {
        console.warn('Failed to destroy powder interaction while resetting player data.', error);
      }
    }
    if (powderState) {
      powderState.viewInteraction = null;
    }

    const powderSimulation = typeof getPowderSimulation === 'function' ? getPowderSimulation() : null;
    if (powderSimulation?.stop) {
      try {
        powderSimulation.stop();
      } catch (error) {
        console.warn('Failed to stop powder simulation while resetting player data.', error);
      }
    }
    setPowderSimulation?.(null);
    setSandSimulation?.(null);

    const observer = typeof getPowderBasinObserver === 'function' ? getPowderBasinObserver() : null;
    if (observer?.disconnect) {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Failed to disconnect powder observer while resetting player data.', error);
      }
    }
    setPowderBasinObserver?.(null);

    const pendingFrame = typeof getPendingPowderResizeFrame === 'function'
      ? getPendingPowderResizeFrame()
      : null;
    const pendingIsTimeout = Boolean(
      typeof getPendingPowderResizeIsTimeout === 'function' && getPendingPowderResizeIsTimeout(),
    );
    if (pendingFrame !== null && typeof window !== 'undefined') {
      if (pendingIsTimeout && typeof window.clearTimeout === 'function') {
        window.clearTimeout(pendingFrame);
      } else if (!pendingIsTimeout && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(pendingFrame);
      }
    }
    setPendingPowderResizeFrame?.(null);
    setPendingPowderResizeIsTimeout?.(false);
    setObservedPowderResizeElements?.(new WeakSet());

    if (powderState && powderConfig) {
      powderState.sandOffset = powderConfig.sandOffsetActive;
      powderState.duneHeight = powderConfig.duneHeightBase;
      powderState.charges = 0;
      powderState.simulatedDuneGain = 0;
      powderState.wallGlyphsLit = 0;
      powderState.glyphsAwarded = 0;
      powderState.idleMoteBank = 100;
      powderState.idleDrainRate = 0;
      powderState.pendingMoteDrops = [];
      powderState.idleBankHydrated = false;
      powderState.motePalette = typeof mergeMotePalette === 'function'
        ? mergeMotePalette(defaultMotePalette)
        : defaultMotePalette;
      applyMindGatePaletteToDom?.(powderState.motePalette);
      powderState.simulationMode = 'sand';
      powderState.wallGapTarget = powderConfig.wallBaseGapMotes;
      powderState.modeSwitchPending = false;
      powderState.viewTransform = null;
      powderState.loadedSimulationState = null;
    }

    resetPowderUiState?.();
    clearTowerUpgradeState?.();
    resetAlephChainUpgrades?.({ playfield: getPlayfield?.() });
    reconcileGlyphCurrencyFromState?.();

    resetActiveMoteGems?.();
    if (moteGemState) {
      moteGemState.active.length = 0;
      if (typeof moteGemState.nextId === 'number') {
        moteGemState.nextId = 1;
      }
      moteGemState.inventory?.clear?.();
      moteGemState.autoCollectUnlocked = false;
      moteGemState.autoCollectDelayMs = 0;
    }
    updateMoteGemInventoryDisplay?.();

    updatePowderWallGapFromGlyphs?.(0);
    refreshPowderWallDecorations?.();
    refreshPowderSystems?.();
    updatePowderModeButton?.();
    updateStatusDisplays?.();
    updatePowderLogDisplay?.();
  }

  function executePlayerDataReset() {
    try {
      stopAutoSaveLoop?.();
    } catch (error) {
      console.warn('Autosave loop did not stop cleanly before deleting player data.', error);
    }

    const developerModeWasEnabled = isDeveloperModeActive()
      || (developerModeElements.toggle && developerModeElements.toggle.checked);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(DEVELOPER_MODE_STORAGE_KEY, developerModeWasEnabled ? 'true' : 'false');
      } catch (error) {
        console.warn('Failed to preserve developer mode state.', error);
      }
    }

    let encounteredError = false;
    if (!clearPersistentStorageKeys()) {
      encounteredError = true;
    }
    try {
      resetPlayerProgressState();
    } catch (error) {
      encounteredError = true;
      console.error('Failed to reset runtime state after deleting player data.', error);
    }
    try {
      disableDeveloperMode();
    } catch (error) {
      encounteredError = true;
      console.error('Failed to disable developer mode while deleting player data.', error);
    }
    try {
      pruneLevelState?.();
    } catch (error) {
      encounteredError = true;
      console.error('Failed to prune level state after deleting player data.', error);
    }

    const button = developerModeElements.resetButton;
    if (encounteredError) {
      if (button) {
        resetDeveloperResetButtonConfirmation({
          label: 'Deletion failed · Retry',
          warning: true,
        });
      }
      return;
    }

    if (button) {
      button.textContent = 'Player data deleted · Reloading…';
    }
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        window.location.reload();
      }, DEVELOPER_RESET_RELOAD_DELAY_MS);
    }
  }

  function handleDeveloperResetClick() {
    const button = developerModeElements.resetButton;
    if (!button) {
      return;
    }

    if (!developerResetState.confirming) {
      developerResetState.confirming = true;
      button.textContent = DEVELOPER_RESET_CONFIRM_LABEL;
      button.classList.add('developer-reset-button--warning');
      if (developerResetState.timeoutId) {
        clearTimeout(developerResetState.timeoutId);
      }
      if (typeof window !== 'undefined') {
        developerResetState.timeoutId = window.setTimeout(() => {
          resetDeveloperResetButtonConfirmation();
        }, DEVELOPER_RESET_CONFIRM_WINDOW_MS);
      }
      return;
    }

    developerResetState.confirming = false;
    if (developerResetState.timeoutId) {
      clearTimeout(developerResetState.timeoutId);
      developerResetState.timeoutId = null;
    }

    button.disabled = true;
    button.classList.remove('developer-reset-button--warning');
    button.textContent = 'Wiping save data…';
    executePlayerDataReset();
  }

  function bindDeveloperModeToggle() {
    developerModeElements.toggle = document.getElementById('codex-developer-mode');
    developerModeElements.note = document.getElementById('codex-developer-note');
    developerModeElements.resetButton = document.getElementById('developer-reset-button');
    // Bind the stage tab developer mode toggle for quick access.
    developerModeElements.stageToggle = document.getElementById('stage-developer-mode');

    if (developerModeElements.resetButton) {
      developerModeElements.resetButton.addEventListener('click', handleDeveloperResetClick);
      resetDeveloperResetButtonConfirmation();
    }

    // Bind the stage toggle change event to mirror the codex toggle behavior.
    // Only handle user-initiated events to avoid potential recursion.
    if (developerModeElements.stageToggle) {
      developerModeElements.stageToggle.addEventListener('change', (event) => {
        if (!event.isTrusted) {
          return;
        }
        if (event.target.checked) {
          enableDeveloperMode();
        } else {
          disableDeveloperMode();
        }
      });
    }

    if (!developerModeElements.toggle) {
      // If the codex toggle is missing, still sync state to the stage toggle.
      let shouldEnableDeveloperMode = false;
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const savedState = window.localStorage.getItem(DEVELOPER_MODE_STORAGE_KEY);
          if (savedState !== null) {
            shouldEnableDeveloperMode = savedState === 'true';
          }
        } catch (error) {
          console.warn('Failed to restore developer mode state.', error);
        }
      }
      if (developerModeElements.stageToggle) {
        developerModeElements.stageToggle.checked = shouldEnableDeveloperMode;
      }
      if (shouldEnableDeveloperMode) {
        enableDeveloperMode();
      }
      return;
    }

    developerModeElements.toggle.addEventListener('change', (event) => {
      if (!event.isTrusted) {
        return;
      }
      if (event.target.checked) {
        enableDeveloperMode();
      } else {
        disableDeveloperMode();
      }
    });

    let shouldEnableDeveloperMode = false;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedState = window.localStorage.getItem(DEVELOPER_MODE_STORAGE_KEY);
        if (savedState !== null) {
          shouldEnableDeveloperMode = savedState === 'true';
        }
      } catch (error) {
        console.warn('Failed to restore developer mode state.', error);
      }
    }

    developerModeElements.toggle.checked = shouldEnableDeveloperMode;
    // Sync the stage toggle state with the codex toggle on initialization.
    if (developerModeElements.stageToggle) {
      developerModeElements.stageToggle.checked = shouldEnableDeveloperMode;
    }
    if (shouldEnableDeveloperMode) {
      enableDeveloperMode();
    } else {
      setDeveloperNoteVisibility(false);
    }
  }

  function refreshDeveloperModeState() {
    const toggleEnabled = Boolean(developerModeElements.toggle?.checked);
    if (isDeveloperModeActive() || toggleEnabled) {
      enableDeveloperMode();
    }
  }

  return {
    bindDeveloperModeToggle,
    refreshDeveloperModeState,
  };
}
