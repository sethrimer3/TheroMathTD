// Developer control bindings for active game systems only.

let developerContext = null;

const developerControlElements = {
  container: null,
  fields: {
    moteBank: null,
    moteRate: null,
    startThero: null,
    theroMultiplier: null,
    glyphsAleph: null,
  },
  toggles: {
    infiniteThero: null,
  },
};

function getContext() {
  return developerContext || {};
}

function isDeveloperModeActive() {
  return Boolean(getContext().isDeveloperModeActive?.());
}

function recordDeveloperAdjustment(field, value) {
  if (isDeveloperModeActive()) {
    getContext().recordPowderEvent?.('developer-adjust', { field, value });
  }
}

function formatDeveloperInteger(value) {
  return Number.isFinite(value) ? String(Math.max(0, Math.round(value))) : '';
}

function formatDeveloperFloat(value, precision = 2) {
  if (!Number.isFinite(value)) {
    return '';
  }
  const normalized = Math.max(0, value);
  return Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(precision);
}

function refreshWellDisplay() {
  const context = getContext();
  context.updateStatusDisplays?.();
  context.updatePowderDisplay?.();
  context.schedulePowderBasinSave?.();
}

function setDeveloperInfiniteTheroEnabled(active) {
  getContext().setDeveloperInfiniteTheroEnabled?.(Boolean(active));
  recordDeveloperAdjustment('infinite-thero', active ? 'enabled' : 'disabled');
}

function setDeveloperIdleMoteBank(value) {
  if (!Number.isFinite(value)) {
    return;
  }
  const normalized = Math.max(0, Math.floor(value));
  const context = getContext();
  const simulation = context.getPowderSimulation?.();
  if (simulation) {
    simulation.idleBank = normalized;
  }
  context.handlePowderIdleBankChange?.(simulation?.idleBank ?? normalized, 'sand');
  recordDeveloperAdjustment('idle-mote-bank', normalized);
  refreshWellDisplay();
}

function setDeveloperIdleMoteRate(value) {
  if (!Number.isFinite(value)) {
    return;
  }
  const normalized = Math.max(0, value);
  const context = getContext();
  const simulation = context.getPowderSimulation?.();
  if (simulation) {
    simulation.idleDrainRate = normalized;
  }
  if (context.powderState) {
    context.powderState.idleDrainRate = normalized;
  }
  recordDeveloperAdjustment('idle-mote-rate', normalized);
  refreshWellDisplay();
}

function setDeveloperBaseStartThero(value) {
  if (!Number.isFinite(value)) {
    return;
  }
  const normalized = Math.max(0, value);
  const context = getContext();
  context.setBaseStartThero?.(normalized);
  recordDeveloperAdjustment('base-start-thero', normalized);
  context.updateLevelCards?.();
  context.updatePowderLedger?.();
  context.updateStatusDisplays?.();
}

function setDeveloperTheroMultiplier(value) {
  const context = getContext();
  if (value === null || value === undefined) {
    context.clearDeveloperTheroMultiplierOverride?.();
    recordDeveloperAdjustment('thero-multiplier', 'default');
  } else if (Number.isFinite(value)) {
    const normalized = Math.max(0, value);
    context.setDeveloperTheroMultiplierOverride?.(normalized);
    recordDeveloperAdjustment('thero-multiplier', normalized);
  } else {
    return;
  }
  context.updateLevelCards?.();
  context.updatePowderLedger?.();
  context.updateStatusDisplays?.();
}

function setDeveloperGlyphs(value) {
  if (!Number.isFinite(value)) {
    return;
  }
  const normalized = Math.max(0, Math.floor(value));
  const context = getContext();
  if (context.powderState) {
    context.powderState.glyphsAwarded = normalized;
    context.powderState.wallGlyphsLit = normalized;
  }
  context.setGlyphCurrency?.(normalized);
  if (context.gameStats && typeof context.gameStats === 'object') {
    context.gameStats.enemiesDefeated = normalized;
    context.gameStats.towersPlaced = Math.min(context.gameStats.towersPlaced, normalized);
  }
  recordDeveloperAdjustment('glyphs-well', normalized);
  refreshWellDisplay();
}

const developerFieldHandlers = {
  moteBank: setDeveloperIdleMoteBank,
  moteRate: setDeveloperIdleMoteRate,
  startThero: setDeveloperBaseStartThero,
  theroMultiplier: setDeveloperTheroMultiplier,
  glyphsAleph: setDeveloperGlyphs,
};

function syncDeveloperControlValues() {
  const { fields, toggles } = developerControlElements;
  const context = getContext();
  if (fields.moteBank) {
    fields.moteBank.value = formatDeveloperInteger(context.getCurrentIdleMoteBank?.());
  }
  if (fields.moteRate) {
    fields.moteRate.value = formatDeveloperFloat(context.getCurrentMoteDispenseRate?.());
  }
  if (fields.startThero) {
    fields.startThero.value = formatDeveloperInteger(context.getBaseStartThero?.());
  }
  if (fields.theroMultiplier) {
    const override = context.getDeveloperTheroMultiplierOverride?.();
    fields.theroMultiplier.placeholder = formatDeveloperFloat(
      context.getBaseStartingTheroMultiplier?.(),
      2,
    );
    fields.theroMultiplier.value = Number.isFinite(override) && override >= 0
      ? formatDeveloperFloat(override, 2)
      : '';
  }
  if (fields.glyphsAleph) {
    fields.glyphsAleph.value = formatDeveloperInteger(context.powderState?.glyphsAwarded);
  }
  if (toggles.infiniteThero) {
    toggles.infiniteThero.checked = Boolean(context.isDeveloperInfiniteTheroEnabled?.());
  }
}

function updateDeveloperControlsVisibility() {
  const active = isDeveloperModeActive();
  const { container, fields, toggles } = developerControlElements;
  if (container) {
    container.hidden = !active;
    container.setAttribute('aria-hidden', active ? 'false' : 'true');
  }
  [...Object.values(fields), ...Object.values(toggles)].forEach((input) => {
    if (input) {
      input.disabled = !active;
    }
  });
  if (active) {
    syncDeveloperControlValues();
  }
  const context = getContext();
  context.updateDeveloperMapElementsVisibility?.();
  context.updatePowderRenderSizeControlsVisibility?.(active);
  context.updatePlayfieldDevLayerTogglesVisibility?.();
}

function handleDeveloperFieldCommit(event) {
  const input = event?.target;
  if (!input || !(input instanceof HTMLInputElement)) {
    return;
  }
  const handler = developerFieldHandlers[input.dataset?.developerField];
  if (!handler || !isDeveloperModeActive()) {
    syncDeveloperControlValues();
    return;
  }
  const rawValue = input.value.trim();
  const parsed = rawValue === '' ? null : Number.parseFloat(rawValue);
  if (parsed === null || Number.isFinite(parsed)) {
    handler(parsed);
  }
  syncDeveloperControlValues();
}

function handleDeveloperToggleChange(event) {
  const input = event?.target;
  if (!input || !(input instanceof HTMLInputElement)) {
    return;
  }
  if (input.dataset?.developerToggle === 'infiniteThero' && isDeveloperModeActive()) {
    setDeveloperInfiniteTheroEnabled(input.checked);
  }
  syncDeveloperControlValues();
}

function bindDeveloperControls() {
  developerControlElements.container = document.getElementById('developer-control-panel');
  document.querySelectorAll('[data-developer-field]').forEach((input) => {
    const field = input.dataset.developerField;
    if (!(field in developerControlElements.fields)) {
      return;
    }
    developerControlElements.fields[field] = input;
    input.disabled = true;
    input.addEventListener('change', handleDeveloperFieldCommit);
    input.addEventListener('blur', handleDeveloperFieldCommit);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleDeveloperFieldCommit(event);
      }
    });
  });
  document.querySelectorAll('[data-developer-toggle]').forEach((input) => {
    const field = input.dataset.developerToggle;
    if (!(field in developerControlElements.toggles)) {
      return;
    }
    developerControlElements.toggles[field] = input;
    input.disabled = true;
    input.addEventListener('change', handleDeveloperToggleChange);
  });
  syncDeveloperControlValues();
  updateDeveloperControlsVisibility();
}

export function configureDeveloperControls(context = {}) {
  developerContext = context;
}

export {
  bindDeveloperControls,
  syncDeveloperControlValues,
  updateDeveloperControlsVisibility,
};
