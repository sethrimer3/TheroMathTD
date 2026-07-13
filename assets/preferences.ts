import {
  getGameNumberNotation,
  setGameNumberNotation,
  addGameNumberNotationChangeListener,
  GAME_NUMBER_NOTATIONS,
  formatGameNumber,
  type GameNumberNotation,
} from '../scripts/core/formatting.js';
import {
  writeStorage,
  readStorage,
  NOTATION_STORAGE_KEY,
  GLYPH_EQUATIONS_STORAGE_KEY,
  DAMAGE_NUMBER_TOGGLE_STORAGE_KEY,
  DAMAGE_NUMBER_MODE_STORAGE_KEY,
  WAVE_KILL_TALLY_STORAGE_KEY,
  WAVE_DAMAGE_TALLY_STORAGE_KEY,
  GRAPHICS_MODE_STORAGE_KEY,
  TRACK_RENDER_MODE_STORAGE_KEY,
  TRACK_TRACER_TOGGLE_STORAGE_KEY,
  TOWER_LOADOUT_SLOTS_STORAGE_KEY,
  FRAME_RATE_LIMIT_STORAGE_KEY,
  FPS_COUNTER_TOGGLE_STORAGE_KEY,
  PLAYFIELD_ENEMY_PARTICLES_STORAGE_KEY,
  PLAYFIELD_EDGE_CRYSTALS_STORAGE_KEY,
  PLAYFIELD_BACKGROUND_PARTICLES_STORAGE_KEY,
  AUTO_GRAPHICS_TOGGLE_STORAGE_KEY,
  CRYSTAL_BACKGROUND_SPRITES_STORAGE_KEY,
  INVERT_CAROUSEL_DRAG_STORAGE_KEY,
} from './autoSave.js';
import { setAutoGraphicsEnabled } from './performanceMonitor.js';

/**
 * Minimal shape of the playfield/powder-simulation objects preferences reach into.
 * These are legacy JavaScript objects; only the members preferences.ts actually calls
 * are declared here (typed adapter, not a full playfield/simulation schema).
 */
interface PlayfieldLike {
  draw?: () => void;
  clearDamageNumbers?: () => void;
  clearWaveTallies?: (options: { type: 'kills' | 'damage' }) => void;
}

interface PowderSimulationLike {
  render?: () => void;
}

/** Shared shape for functions that optionally persist a preference to storage. */
interface PersistOptions {
  persist?: boolean;
}

const TOWER_LOADOUT_TOGGLE_SIDE_STORAGE_KEY = 'towerLoadoutToggleSide';
// Persist the preferred location for spire option buttons.
const SPIRE_OPTIONS_PLACEMENT_STORAGE_KEY = 'spireOptionsPlacement';

const GRAPHICS_MODES = Object.freeze({
  LOW: 'low',
  HIGH: 'high',
} as const);

export type GraphicsMode = (typeof GRAPHICS_MODES)[keyof typeof GRAPHICS_MODES];

export const TRACK_RENDER_MODES = Object.freeze({
  GRADIENT: 'gradient',
  BLUR: 'blur',
  RIVER: 'river',
} as const);

export type TrackRenderMode = (typeof TRACK_RENDER_MODES)[keyof typeof TRACK_RENDER_MODES];

let notationToggleButton: HTMLElement | null = null;
let notationRefreshHandler: () => void = () => {};
let notationPreviewValue: HTMLElement | null = null;

let glyphEquationsVisible = false;
let glyphEquationToggleInput: HTMLInputElement | null = null;
let glyphEquationToggleStateLabel: HTMLElement | null = null;

let damageNumbersEnabled = true;
let damageNumberToggleInput: HTMLInputElement | null = null;
let damageNumberToggleStateLabel: HTMLElement | null = null;

// Damage number display mode: 'damage' shows damage dealt, 'remaining' shows remaining HP
export const DAMAGE_NUMBER_MODES = Object.freeze({
  DAMAGE: 'damage',
  REMAINING: 'remaining',
} as const);

export type DamageNumberMode = (typeof DAMAGE_NUMBER_MODES)[keyof typeof DAMAGE_NUMBER_MODES];

let damageNumberMode: DamageNumberMode = DAMAGE_NUMBER_MODES.DAMAGE;
let damageNumberModeButton: HTMLElement | null = null;

// Toggle state for the wave kill tally overlay.
let waveKillTalliesEnabled = true;
let waveKillTallyToggleInput: HTMLInputElement | null = null;
let waveKillTallyToggleStateLabel: HTMLElement | null = null;

// Toggle state for the wave damage tally overlay.
let waveDamageTalliesEnabled = true;
let waveDamageTallyToggleInput: HTMLInputElement | null = null;
let waveDamageTallyToggleStateLabel: HTMLElement | null = null;

// Toggle state for the luminous track tracer overlay.
let trackTracerEnabled = true;
let trackTracerToggleInput: HTMLInputElement | null = null;
let trackTracerToggleStateLabel: HTMLElement | null = null;

// Preferred tower loadout slot count; players can cycle between 1–4 slots in Options.
let preferredLoadoutSlots = 2;
let loadoutSlotButton: HTMLElement | null = null;
let loadoutSlotChangeHandler: (slots: number) => void = () => {};

// Frame rate limit preference; defaults to 60 fps, range 30–120.
let frameRateLimit = 60;
let frameRateLimitSlider: HTMLInputElement | null = null;
let frameRateLimitValueLabel: HTMLElement | null = null;
let frameRateLimitChangeHandler: (fps: number) => void = () => {};

// Toggle state for the FPS counter overlay.
let fpsCounterEnabled = false;
let fpsCounterToggleInput: HTMLInputElement | null = null;
let fpsCounterToggleStateLabel: HTMLElement | null = null;
// FPS counter element displayed in the top-left corner.
let fpsCounterElement: HTMLElement | null = null;
let fpsCounterLastUpdate = 0;
let fpsCounterFrameCount = 0;

let graphicsModeButton: HTMLElement | null = null;
let trackRenderModeButton: HTMLElement | null = null;
// Cache the preview line and tracer so track mode changes can mirror the canvas style.
let trackRenderPreviewLine: HTMLElement | null = null;
let trackRenderPreviewTracer: HTMLElement | null = null;
let desktopCursorMediaQuery: MediaQueryList | null = null;
let desktopCursorActive = false;
let activeGraphicsMode: GraphicsMode = GRAPHICS_MODES.HIGH;
// Remember the player's explicit graphics preference so temporary auto-performance downgrades do not overwrite it.
let preferredGraphicsMode: GraphicsMode = GRAPHICS_MODES.HIGH;
let activeTrackRenderMode: TrackRenderMode = TRACK_RENDER_MODES.GRADIENT;

const LOADOUT_TOGGLE_SIDES = Object.freeze({
  LEFT: 'left',
  RIGHT: 'right',
} as const);

export type LoadoutToggleSide = (typeof LOADOUT_TOGGLE_SIDES)[keyof typeof LOADOUT_TOGGLE_SIDES];

let towerLoadoutToggleSide: LoadoutToggleSide = LOADOUT_TOGGLE_SIDES.LEFT;
let towerLoadoutShell: HTMLElement | null = null;
let loadoutToggleSideButton: HTMLElement | null = null;

// Map spire options placement labels to storage-friendly values.
const SPIRE_OPTIONS_PLACEMENTS = Object.freeze({
  CORNER: 'corner',
  FOOTER: 'footer',
} as const);

export type SpireOptionsPlacement = (typeof SPIRE_OPTIONS_PLACEMENTS)[keyof typeof SPIRE_OPTIONS_PLACEMENTS];

// Track the active spire options placement so UI elements can toggle visibility.
let spireOptionsPlacement: SpireOptionsPlacement = SPIRE_OPTIONS_PLACEMENTS.FOOTER;
let spireOptionsPlacementButton: HTMLElement | null = null;

let powderSimulationGetter: () => PowderSimulationLike | null = () => null;
let playfieldGetter: () => PlayfieldLike | null = () => null;

// Cycle through every available notation in the menu so players can preview formats quickly.
const NOTATION_SEQUENCE: GameNumberNotation[] = [
  GAME_NUMBER_NOTATIONS.LETTERS,
  GAME_NUMBER_NOTATIONS.SCIENTIFIC,
  GAME_NUMBER_NOTATIONS.ENGINEERING,
  GAME_NUMBER_NOTATIONS.ABC,
];

// Present a fixed quadrillion-scale value to mirror how damage numbers fly out of enemies.
const NOTATION_PREVIEW_DAMAGE = 5.1e15;

export function setNotationRefreshHandler(handler: unknown): void {
  notationRefreshHandler = typeof handler === 'function' ? (handler as () => void) : () => {};
}

function resolveNotationLabel(notation: GameNumberNotation): string {
  switch (notation) {
    case GAME_NUMBER_NOTATIONS.SCIENTIFIC:
      return 'Scientific';
    case GAME_NUMBER_NOTATIONS.ENGINEERING:
      return 'Engineering';
    case GAME_NUMBER_NOTATIONS.ABC:
      return 'ABC';
    default:
      return 'Letters';
  }
}

/**
 * Rotate through the supported notation sequence when the toggle is pressed.
 */
function getNextNotation(current: GameNumberNotation): GameNumberNotation {
  const index = NOTATION_SEQUENCE.indexOf(current);
  const nextIndex = index >= 0 ? (index + 1) % NOTATION_SEQUENCE.length : 0;
  return NOTATION_SEQUENCE[nextIndex];
}

function updateNotationToggleLabel(): void {
  if (!notationToggleButton) {
    return;
  }
  const notation = getGameNumberNotation();
  const label = resolveNotationLabel(notation);
  // Use a centered dot to separate the label from the current notation, matching the UI spec.
  notationToggleButton.textContent = `Notation · ${label}`;
  notationToggleButton.setAttribute('aria-label', `Switch number notation (current: ${label})`);
}

/**
 * Refresh the quadrillion-scale damage preview to mirror the active notation choice.
 */
function updateNotationPreviewDamage(): void {
  if (!notationPreviewValue) {
    notationPreviewValue = document.getElementById('notation-preview-value');
  }
  if (!notationPreviewValue) {
    return;
  }
  const formattedDamage = formatGameNumber(NOTATION_PREVIEW_DAMAGE);
  notationPreviewValue.textContent = `${formattedDamage} dmg`;
}

function handleNotationChange(): void {
  updateNotationToggleLabel();
  updateNotationPreviewDamage();
  notationRefreshHandler();
}

addGameNumberNotationChangeListener(handleNotationChange);

export function applyNotationPreference(notation: string, { persist = true }: PersistOptions = {}): GameNumberNotation {
  const resolved = setGameNumberNotation(notation);
  if (persist) {
    writeStorage(NOTATION_STORAGE_KEY, resolved);
  }
  return resolved;
}

export function toggleNotationPreference(): void {
  const current = getGameNumberNotation();
  const next = getNextNotation(current);
  applyNotationPreference(next);
}

export function bindNotationToggle(): void {
  notationToggleButton = document.getElementById('notation-toggle-button');
  notationPreviewValue = document.getElementById('notation-preview-value');
  if (!notationToggleButton) {
    return;
  }
  notationToggleButton.addEventListener('click', () => {
    toggleNotationPreference();
  });
  updateNotationToggleLabel();
  updateNotationPreviewDamage();
}

function normalizeGlyphEquationPreference(value: unknown): boolean {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
      return true;
    }
    if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
      return false;
    }
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0;
  }
  return Boolean(value);
}

function normalizeDamageNumberPreference(value: unknown): boolean {
  return normalizeGlyphEquationPreference(value);
}

/**
 * Clamp the preferred loadout slot count between the supported 1–4 range.
 */
function normalizeLoadoutSlotPreference(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return 2;
  }
  return Math.min(4, Math.max(1, Math.floor(numeric)));
}

function updateGlyphEquationToggleUi(): void {
  if (glyphEquationToggleInput) {
    glyphEquationToggleInput.checked = glyphEquationsVisible;
    glyphEquationToggleInput.setAttribute('aria-checked', glyphEquationsVisible ? 'true' : 'false');
    const controlShell = glyphEquationToggleInput.closest('.settings-toggle-control');
    if (controlShell) {
      controlShell.classList.toggle('is-active', glyphEquationsVisible);
    }
  }
  if (glyphEquationToggleStateLabel) {
    glyphEquationToggleStateLabel.textContent = glyphEquationsVisible ? 'On' : 'Off';
  }
}

function updateDamageNumberToggleUi(): void {
  if (damageNumberToggleInput) {
    damageNumberToggleInput.checked = damageNumbersEnabled;
    damageNumberToggleInput.setAttribute('aria-checked', damageNumbersEnabled ? 'true' : 'false');
    const controlShell = damageNumberToggleInput.closest('.settings-toggle-control');
    if (controlShell) {
      controlShell.classList.toggle('is-active', damageNumbersEnabled);
    }
  }
  if (damageNumberToggleStateLabel) {
    damageNumberToggleStateLabel.textContent = damageNumbersEnabled ? 'On' : 'Off';
  }
}

// Update the damage number mode button to reflect the current mode.
function updateDamageNumberModeUi(): void {
  if (damageNumberModeButton) {
    const modeLabel = damageNumberMode === DAMAGE_NUMBER_MODES.REMAINING ? 'Remaining Life' : 'Damage Numbers';
    damageNumberModeButton.textContent = `Damage Display · ${modeLabel}`;
  }
}

// Synchronize the wave kill tally toggle control with the in-memory state.
function updateWaveKillTallyToggleUi(): void {
  if (waveKillTallyToggleInput) {
    waveKillTallyToggleInput.checked = waveKillTalliesEnabled;
    waveKillTallyToggleInput.setAttribute('aria-checked', waveKillTalliesEnabled ? 'true' : 'false');
    const controlShell = waveKillTallyToggleInput.closest('.settings-toggle-control');
    if (controlShell) {
      controlShell.classList.toggle('is-active', waveKillTalliesEnabled);
    }
  }
  if (waveKillTallyToggleStateLabel) {
    waveKillTallyToggleStateLabel.textContent = waveKillTalliesEnabled ? 'On' : 'Off';
  }
}

// Synchronize the wave damage tally toggle control with the in-memory state.
function updateWaveDamageTallyToggleUi(): void {
  if (waveDamageTallyToggleInput) {
    waveDamageTallyToggleInput.checked = waveDamageTalliesEnabled;
    waveDamageTallyToggleInput.setAttribute('aria-checked', waveDamageTalliesEnabled ? 'true' : 'false');
    const controlShell = waveDamageTallyToggleInput.closest('.settings-toggle-control');
    if (controlShell) {
      controlShell.classList.toggle('is-active', waveDamageTalliesEnabled);
    }
  }
  if (waveDamageTallyToggleStateLabel) {
    waveDamageTallyToggleStateLabel.textContent = waveDamageTalliesEnabled ? 'On' : 'Off';
  }
}

// Synchronize the track tracer toggle so the label reflects the active preference.
function updateTrackTracerToggleUi(): void {
  if (trackTracerToggleInput) {
    trackTracerToggleInput.checked = trackTracerEnabled;
    trackTracerToggleInput.setAttribute('aria-checked', trackTracerEnabled ? 'true' : 'false');
    const controlShell = trackTracerToggleInput.closest('.settings-toggle-control');
    if (controlShell) {
      controlShell.classList.toggle('is-active', trackTracerEnabled);
    }
  }
  if (trackTracerToggleStateLabel) {
    trackTracerToggleStateLabel.textContent = trackTracerEnabled ? 'On' : 'Off';
  }
}

// Mirror the active track mode and tracer toggle in the preview line beneath the control.
function updateTrackRenderPreview(): void {
  if (!trackRenderPreviewLine) {
    trackRenderPreviewLine = document.getElementById('track-render-preview-line');
  }
  if (!trackRenderPreviewTracer) {
    trackRenderPreviewTracer = document.getElementById('track-render-preview-tracer');
  }
  if (!trackRenderPreviewLine) {
    return;
  }
  trackRenderPreviewLine.dataset.mode = activeTrackRenderMode;
  trackRenderPreviewLine.classList.toggle('is-tracer-enabled', trackTracerEnabled);
  if (trackRenderPreviewTracer) {
    trackRenderPreviewTracer.setAttribute('aria-hidden', trackTracerEnabled ? 'false' : 'true');
  }
}

export function applyGlyphEquationPreference(preference: unknown, { persist = true }: PersistOptions = {}): boolean {
  const enabled = normalizeGlyphEquationPreference(preference);
  glyphEquationsVisible = enabled;
  const body = typeof document !== 'undefined' ? document.body : null;
  if (body) {
    body.classList.toggle('show-glyph-equations', glyphEquationsVisible);
  }
  updateGlyphEquationToggleUi();
  if (persist) {
    writeStorage(GLYPH_EQUATIONS_STORAGE_KEY, glyphEquationsVisible ? '1' : '0');
  }
  return glyphEquationsVisible;
}

export function bindGlyphEquationToggle(): void {
  glyphEquationToggleInput = document.getElementById('glyph-equation-toggle') as HTMLInputElement | null;
  glyphEquationToggleStateLabel = document.getElementById('glyph-equation-toggle-state');
  if (!glyphEquationToggleInput) {
    return;
  }
  glyphEquationToggleInput.addEventListener('change', (event) => {
    applyGlyphEquationPreference((event?.target as HTMLInputElement | null)?.checked);
  });
  updateGlyphEquationToggleUi();
}

export function bindDamageNumberToggle(): void {
  damageNumberToggleInput = document.getElementById('damage-number-toggle') as HTMLInputElement | null;
  damageNumberToggleStateLabel = document.getElementById('damage-number-toggle-state');
  if (!damageNumberToggleInput) {
    return;
  }
  damageNumberToggleInput.addEventListener('change', (event) => {
    applyDamageNumberPreference((event?.target as HTMLInputElement | null)?.checked);
  });
  updateDamageNumberToggleUi();
}

/**
 * Bind the damage number mode toggle button (Damage Numbers vs Remaining Life).
 */
export function bindDamageNumberModeToggle(): void {
  damageNumberModeButton = document.getElementById('damage-number-mode-button');
  if (!damageNumberModeButton) {
    return;
  }
  damageNumberModeButton.addEventListener('click', () => {
    toggleDamageNumberMode();
  });
  updateDamageNumberModeUi();
}

export function applyDamageNumberPreference(preference: unknown, { persist = true }: PersistOptions = {}): boolean {
  const enabled = normalizeDamageNumberPreference(preference);
  damageNumbersEnabled = enabled;
  updateDamageNumberToggleUi();
  if (!enabled) {
    const playfield = playfieldGetter();
    if (playfield && typeof playfield.clearDamageNumbers === 'function') {
      playfield.clearDamageNumbers();
    }
  }
  if (persist) {
    writeStorage(DAMAGE_NUMBER_TOGGLE_STORAGE_KEY, damageNumbersEnabled ? '1' : '0');
  }
  return damageNumbersEnabled;
}

/**
 * Apply the damage number display mode (damage vs remaining life).
 */
export function applyDamageNumberMode(mode: string, { persist = true }: PersistOptions = {}): DamageNumberMode {
  const normalizedMode: DamageNumberMode =
    mode === DAMAGE_NUMBER_MODES.DAMAGE || mode === DAMAGE_NUMBER_MODES.REMAINING
      ? mode
      : DAMAGE_NUMBER_MODES.DAMAGE;
  damageNumberMode = normalizedMode;
  updateDamageNumberModeUi();
  // Clear existing damage numbers when switching modes to avoid confusion
  const playfield = playfieldGetter();
  if (playfield && typeof playfield.clearDamageNumbers === 'function') {
    playfield.clearDamageNumbers();
  }
  if (persist) {
    writeStorage(DAMAGE_NUMBER_MODE_STORAGE_KEY, damageNumberMode);
  }
  return damageNumberMode;
}

/**
 * Cycle to the next damage number mode.
 */
export function toggleDamageNumberMode(): void {
  const next: DamageNumberMode = damageNumberMode === DAMAGE_NUMBER_MODES.DAMAGE
    ? DAMAGE_NUMBER_MODES.REMAINING
    : DAMAGE_NUMBER_MODES.DAMAGE;
  applyDamageNumberMode(next);
}

/**
 * Bind the visual settings toggle that controls wave kill tally scribbles.
 */
export function bindWaveKillTallyToggle(): void {
  waveKillTallyToggleInput = document.getElementById('wave-kill-tally-toggle') as HTMLInputElement | null;
  waveKillTallyToggleStateLabel = document.getElementById('wave-kill-tally-toggle-state');
  if (!waveKillTallyToggleInput) {
    return;
  }
  waveKillTallyToggleInput.addEventListener('change', (event) => {
    applyWaveKillTallyPreference((event?.target as HTMLInputElement | null)?.checked);
  });
  updateWaveKillTallyToggleUi();
}

/**
 * Persist and apply the wave kill tally overlay preference.
 */
export function applyWaveKillTallyPreference(preference: unknown, { persist = true }: PersistOptions = {}): boolean {
  const enabled = normalizeDamageNumberPreference(preference);
  waveKillTalliesEnabled = enabled;
  updateWaveKillTallyToggleUi();
  if (!enabled) {
    const playfield = playfieldGetter();
    if (playfield && typeof playfield.clearWaveTallies === 'function') {
      playfield.clearWaveTallies({ type: 'kills' });
    }
  }
  if (persist) {
    writeStorage(WAVE_KILL_TALLY_STORAGE_KEY, waveKillTalliesEnabled ? '1' : '0');
  }
  return waveKillTalliesEnabled;
}

/**
 * Bind the visual settings toggle that controls wave damage tally scribbles.
 */
export function bindWaveDamageTallyToggle(): void {
  waveDamageTallyToggleInput = document.getElementById('wave-damage-tally-toggle') as HTMLInputElement | null;
  waveDamageTallyToggleStateLabel = document.getElementById('wave-damage-tally-toggle-state');
  if (!waveDamageTallyToggleInput) {
    return;
  }
  waveDamageTallyToggleInput.addEventListener('change', (event) => {
    applyWaveDamageTallyPreference((event?.target as HTMLInputElement | null)?.checked);
  });
  updateWaveDamageTallyToggleUi();
}

/**
 * Persist and apply the wave damage tally overlay preference.
 */
export function applyWaveDamageTallyPreference(preference: unknown, { persist = true }: PersistOptions = {}): boolean {
  const enabled = normalizeDamageNumberPreference(preference);
  waveDamageTalliesEnabled = enabled;
  updateWaveDamageTallyToggleUi();
  if (!enabled) {
    const playfield = playfieldGetter();
    if (playfield && typeof playfield.clearWaveTallies === 'function') {
      playfield.clearWaveTallies({ type: 'damage' });
    }
  }
  if (persist) {
    writeStorage(WAVE_DAMAGE_TALLY_STORAGE_KEY, waveDamageTalliesEnabled ? '1' : '0');
  }
  return waveDamageTalliesEnabled;
}

/**
 * Persist and apply the glowing track tracer preference.
 */
export function applyTrackTracerPreference(preference: unknown, { persist = true }: PersistOptions = {}): boolean {
  const enabled = normalizeDamageNumberPreference(preference);
  trackTracerEnabled = enabled;
  updateTrackTracerToggleUi();
  updateTrackRenderPreview();
  if (persist) {
    writeStorage(TRACK_TRACER_TOGGLE_STORAGE_KEY, trackTracerEnabled ? '1' : '0');
  }
  const playfield = playfieldGetter();
  if (playfield && typeof playfield.draw === 'function') {
    playfield.draw();
  }
  return trackTracerEnabled;
}

/**
 * Bind the visual settings toggle that controls the luminous track tracer.
 */
export function bindTrackTracerToggle(): void {
  trackTracerToggleInput = document.getElementById('track-tracer-toggle') as HTMLInputElement | null;
  trackTracerToggleStateLabel = document.getElementById('track-tracer-toggle-state');
  if (!trackTracerToggleInput) {
    return;
  }
  trackTracerToggleInput.addEventListener('change', (event) => {
    applyTrackTracerPreference((event?.target as HTMLInputElement | null)?.checked);
  });
  updateTrackTracerToggleUi();
}

/**
 * Refresh the loadout slot button copy so the Options card always mirrors the active preference.
 */
function updateLoadoutSlotButton(): void {
  if (!loadoutSlotButton) {
    return;
  }
  loadoutSlotButton.textContent = `Slots · ${preferredLoadoutSlots}`;
  loadoutSlotButton.setAttribute('aria-label', `Cycle loadout slots (current: ${preferredLoadoutSlots})`);
}

/**
 * Allow the bootstrapper to register a callback whenever the loadout slot preference changes.
 */
export function setLoadoutSlotChangeHandler(handler: unknown): void {
  loadoutSlotChangeHandler = typeof handler === 'function' ? (handler as (slots: number) => void) : () => {};
}

/**
 * Persist and apply the preferred loadout slot count.
 */
export function applyLoadoutSlotPreference(preference: unknown, { persist = true }: PersistOptions = {}): number {
  const normalized = normalizeLoadoutSlotPreference(preference);
  preferredLoadoutSlots = normalized;
  updateLoadoutSlotButton();
  loadoutSlotChangeHandler(preferredLoadoutSlots);
  if (persist) {
    writeStorage(TOWER_LOADOUT_SLOTS_STORAGE_KEY, String(preferredLoadoutSlots));
  }
  return preferredLoadoutSlots;
}

/**
 * Bind the Options card button that cycles through 1–4 loadout slots.
 */
export function bindLoadoutSlotButton(): void {
  loadoutSlotButton = document.getElementById('loadout-slot-button');
  if (!loadoutSlotButton) {
    return;
  }
  loadoutSlotButton.addEventListener('click', () => {
    const next = preferredLoadoutSlots >= 4 ? 1 : preferredLoadoutSlots + 1;
    applyLoadoutSlotPreference(next);
  });
  updateLoadoutSlotButton();
}

/**
 * Initialize the loadout slot preference from storage so the slot limit persists across sessions.
 */
export function initializeLoadoutSlotPreference({ defaultSlots = 2 }: { defaultSlots?: number } = {}): number {
  const stored = Number.parseInt(readStorage(TOWER_LOADOUT_SLOTS_STORAGE_KEY) ?? '', 10);
  const normalizedStored = Number.isFinite(stored) ? normalizeLoadoutSlotPreference(stored) : null;
  const fallback = normalizeLoadoutSlotPreference(defaultSlots);
  return applyLoadoutSlotPreference(normalizedStored ?? fallback, { persist: false });
}

/**
 * Report the current preferred loadout slot count.
 */
export function getPreferredLoadoutSlots(): number {
  return preferredLoadoutSlots;
}

/**
 * Clamp the frame rate limit between the supported 30–120 range.
 */
function normalizeFrameRateLimitPreference(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return 60;
  }
  return Math.min(120, Math.max(30, Math.floor(numeric)));
}

/**
 * Update the frame rate limit slider UI to reflect the current value.
 */
function updateFrameRateLimitUi(): void {
  if (frameRateLimitSlider) {
    frameRateLimitSlider.value = String(frameRateLimit);
  }
  if (frameRateLimitValueLabel) {
    frameRateLimitValueLabel.textContent = `${frameRateLimit} fps`;
  }
}

/**
 * Allow the bootstrapper to register a callback whenever the frame rate limit changes.
 */
export function setFrameRateLimitChangeHandler(handler: unknown): void {
  frameRateLimitChangeHandler = typeof handler === 'function' ? (handler as (fps: number) => void) : () => {};
}

/**
 * Persist and apply the frame rate limit preference.
 */
export function applyFrameRateLimitPreference(preference: unknown, { persist = true }: PersistOptions = {}): number {
  const normalized = normalizeFrameRateLimitPreference(preference);
  frameRateLimit = normalized;
  updateFrameRateLimitUi();
  frameRateLimitChangeHandler(frameRateLimit);
  if (persist) {
    writeStorage(FRAME_RATE_LIMIT_STORAGE_KEY, String(frameRateLimit));
  }
  return frameRateLimit;
}

/**
 * Bind the visual settings slider for frame rate limit.
 */
export function bindFrameRateLimitSlider(): void {
  frameRateLimitSlider = document.getElementById('frame-rate-limit') as HTMLInputElement | null;
  frameRateLimitValueLabel = document.getElementById('frame-rate-limit-value');
  if (!frameRateLimitSlider) {
    return;
  }
  frameRateLimitSlider.addEventListener('input', (event) => {
    applyFrameRateLimitPreference(Number((event.target as HTMLInputElement).value));
  });
  updateFrameRateLimitUi();
}

/**
 * Initialize the frame rate limit preference from storage.
 */
export function initializeFrameRateLimitPreference(): number {
  const stored = Number.parseInt(readStorage(FRAME_RATE_LIMIT_STORAGE_KEY) ?? '', 10);
  const normalized = Number.isFinite(stored) ? normalizeFrameRateLimitPreference(stored) : 60;
  return applyFrameRateLimitPreference(normalized, { persist: false });
}

/**
 * Report the current frame rate limit.
 */
export function getFrameRateLimit(): number {
  return frameRateLimit;
}

/**
 * Synchronize the FPS counter toggle control with the in-memory state.
 */
function updateFpsCounterToggleUi(): void {
  if (fpsCounterToggleInput) {
    fpsCounterToggleInput.checked = fpsCounterEnabled;
    fpsCounterToggleInput.setAttribute('aria-checked', fpsCounterEnabled ? 'true' : 'false');
    const controlShell = fpsCounterToggleInput.closest('.settings-toggle-control');
    if (controlShell) {
      controlShell.classList.toggle('is-active', fpsCounterEnabled);
    }
  }
  if (fpsCounterToggleStateLabel) {
    fpsCounterToggleStateLabel.textContent = fpsCounterEnabled ? 'On' : 'Off';
  }
}

/**
 * Update the FPS counter element visibility based on the toggle state.
 */
function updateFpsCounterVisibility(): void {
  if (!fpsCounterElement) {
    fpsCounterElement = document.getElementById('fps-counter');
  }
  if (fpsCounterElement) {
    (fpsCounterElement as HTMLElement & { hidden: boolean }).hidden = !fpsCounterEnabled;
    fpsCounterElement.setAttribute('aria-hidden', fpsCounterEnabled ? 'false' : 'true');
  }
}

/**
 * Persist and apply the FPS counter visibility preference.
 */
export function applyFpsCounterPreference(preference: unknown, { persist = true }: PersistOptions = {}): boolean {
  const enabled = normalizeDamageNumberPreference(preference);
  fpsCounterEnabled = enabled;
  updateFpsCounterToggleUi();
  updateFpsCounterVisibility();
  if (persist) {
    writeStorage(FPS_COUNTER_TOGGLE_STORAGE_KEY, fpsCounterEnabled ? '1' : '0');
  }
  return fpsCounterEnabled;
}

/**
 * Bind the visual settings toggle for FPS counter visibility.
 */
export function bindFpsCounterToggle(): void {
  fpsCounterToggleInput = document.getElementById('fps-counter-toggle') as HTMLInputElement | null;
  fpsCounterToggleStateLabel = document.getElementById('fps-counter-toggle-state');
  if (!fpsCounterToggleInput) {
    return;
  }
  fpsCounterToggleInput.addEventListener('change', (event) => {
    applyFpsCounterPreference((event?.target as HTMLInputElement | null)?.checked);
  });
  updateFpsCounterToggleUi();
}

/**
 * Initialize the FPS counter preference from storage.
 */
export function initializeFpsCounterPreference(): boolean {
  const stored = readStorage(FPS_COUNTER_TOGGLE_STORAGE_KEY);
  const normalized = stored === '1' || stored === 'true';
  return applyFpsCounterPreference(normalized, { persist: false });
}

/**
 * Reports whether the FPS counter overlay is active.
 */
export function isFpsCounterEnabled(): boolean {
  return fpsCounterEnabled;
}

/**
 * Update the FPS counter display with the current frame rate.
 * Call this from the game loop to update the displayed FPS.
 */
export function updateFpsCounter(timestamp: number): void {
  if (!fpsCounterEnabled) {
    return;
  }
  if (!fpsCounterElement) {
    fpsCounterElement = document.getElementById('fps-counter');
  }
  if (!fpsCounterElement) {
    return;
  }

  fpsCounterFrameCount++;
  const elapsed = timestamp - fpsCounterLastUpdate;
  // Update the display approximately every 500ms for stability.
  if (elapsed >= 500) {
    const fps = Math.round((fpsCounterFrameCount * 1000) / elapsed);
    fpsCounterElement.textContent = String(fps);
    fpsCounterFrameCount = 0;
    fpsCounterLastUpdate = timestamp;
  }
}

function resolveGraphicsModeLabel(mode: GraphicsMode = activeGraphicsMode): string {
  return mode === GRAPHICS_MODES.LOW ? 'Low' : 'High';
}

function updateGraphicsModeButton(): void {
  if (!graphicsModeButton) {
    return;
  }
  const label = resolveGraphicsModeLabel();
  // Mirror the centered dot separator for the graphics button label as well.
  graphicsModeButton.textContent = `Graphics · ${label}`;
  graphicsModeButton.setAttribute('aria-label', `Switch graphics quality (current: ${label})`);
}

function updateDesktopCursorClass(enabled: boolean): void {
  const body = typeof document !== 'undefined' ? document.body : null;
  if (!body) {
    return;
  }
  const nextState = Boolean(enabled);
  if (nextState === desktopCursorActive) {
    return;
  }
  desktopCursorActive = nextState;
  body.classList.toggle('mouse-cursor-gem', desktopCursorActive);
}

function evaluateDesktopCursorPreferenceFallback(): void {
  if (typeof navigator === 'undefined') {
    updateDesktopCursorClass(false);
    return;
  }
  const userAgent = navigator.userAgent || '';
  const mobilePattern = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i;
  updateDesktopCursorClass(!mobilePattern.test(userAgent));
}

export function initializeDesktopCursorPreference(): void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    evaluateDesktopCursorPreferenceFallback();
    return;
  }
  try {
    desktopCursorMediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    updateDesktopCursorClass(desktopCursorMediaQuery.matches);
    const listener = (event: MediaQueryListEvent) => {
      updateDesktopCursorClass(event.matches);
    };
    // Use modern addEventListener API; deprecated addListener removed to fix console error
    if (typeof desktopCursorMediaQuery.addEventListener === 'function') {
      desktopCursorMediaQuery.addEventListener('change', listener);
    } else {
      // Extremely rare - addEventListener has been supported since 2013. Suggest browser update.
      console.warn('MediaQueryList.addEventListener not available. Consider updating your browser; cursor detection will not update dynamically.');
    }
  } catch (error) {
    console.warn('Desktop cursor media query failed; falling back to user agent detection.', error);
    evaluateDesktopCursorPreferenceFallback();
  }
}

export function setGraphicsModeContext({
  getPowderSimulation,
  getPlayfield,
}: {
  getPowderSimulation?: () => PowderSimulationLike | null;
  getPlayfield?: () => PlayfieldLike | null;
} = {}): void {
  if (typeof getPowderSimulation === 'function') {
    powderSimulationGetter = getPowderSimulation;
  }
  if (typeof getPlayfield === 'function') {
    playfieldGetter = getPlayfield;
  }
}

export function applyGraphicsMode(mode: string, { persist = true }: PersistOptions = {}): GraphicsMode {
  const normalized: GraphicsMode = mode === GRAPHICS_MODES.LOW ? GRAPHICS_MODES.LOW : GRAPHICS_MODES.HIGH;
  activeGraphicsMode = normalized;
  // Only mutate the preferred mode when this call is intended to persist the player's explicit choice.
  if (persist) {
    preferredGraphicsMode = normalized;
  }

  const body = typeof document !== 'undefined' ? document.body : null;
  if (body) {
    body.classList.toggle('graphics-mode-low', normalized === GRAPHICS_MODES.LOW);
    body.classList.toggle('graphics-mode-high', normalized === GRAPHICS_MODES.HIGH);
  }

  updateGraphicsModeButton();

  if (persist) {
    writeStorage(GRAPHICS_MODE_STORAGE_KEY, normalized);
  }

  const powderSimulation = powderSimulationGetter();
  if (powderSimulation && typeof powderSimulation.render === 'function') {
    powderSimulation.render();
  }

  const playfield = playfieldGetter();
  if (playfield && typeof playfield.draw === 'function') {
    playfield.draw();
  }

  return normalized;
}

export function isLowGraphicsModeActive(): boolean {
  return activeGraphicsMode === GRAPHICS_MODES.LOW;
}

export function getActiveGraphicsMode(): GraphicsMode {
  return activeGraphicsMode;
}

export function getPreferredGraphicsMode(): GraphicsMode {
  return preferredGraphicsMode;
}

export function toggleGraphicsMode(): void {
  const next: GraphicsMode = activeGraphicsMode === GRAPHICS_MODES.LOW ? GRAPHICS_MODES.HIGH : GRAPHICS_MODES.LOW;
  applyGraphicsMode(next);
}

export function areGlyphEquationsVisible(): boolean {
  return glyphEquationsVisible;
}

export function areDamageNumbersEnabled(): boolean {
  return damageNumbersEnabled;
}

/**
 * Get the current damage number display mode.
 */
export function getDamageNumberMode(): DamageNumberMode {
  return damageNumberMode;
}

/**
 * Reports whether the kill tally scribble overlay is active.
 */
export function areWaveKillTalliesEnabled(): boolean {
  return waveKillTalliesEnabled;
}

/**
 * Reports whether the damage tally scribble overlay is active.
 */
export function areWaveDamageTalliesEnabled(): boolean {
  return waveDamageTalliesEnabled;
}

/**
 * Reports whether the luminous track tracer overlay is active.
 */
export function areTrackTracersEnabled(): boolean {
  return trackTracerEnabled;
}

export function bindGraphicsModeToggle(): void {
  graphicsModeButton = document.getElementById('graphics-mode-button');
  if (!graphicsModeButton) {
    return;
  }
  graphicsModeButton.addEventListener('click', () => {
    toggleGraphicsMode();
  });
  updateGraphicsModeButton();
}

export function initializeGraphicsMode(): void {
  const stored = readStorage(GRAPHICS_MODE_STORAGE_KEY);
  const normalized: GraphicsMode | null =
    stored === GRAPHICS_MODES.LOW || stored === GRAPHICS_MODES.HIGH ? stored : null;
  // Default brand-new installs to high fidelity so visuals match the intended presentation out of the box.
  const fallback: GraphicsMode = GRAPHICS_MODES.HIGH;
  // Seed the preferred mode first so autosave snapshots always reflect the player's durable choice.
  preferredGraphicsMode = normalized || fallback;
  applyGraphicsMode(normalized || fallback, { persist: !normalized });
}

function resolveTrackRenderModeLabel(mode: TrackRenderMode = activeTrackRenderMode): string {
  switch (mode) {
    case TRACK_RENDER_MODES.BLUR:
      return 'Blurred';
    case TRACK_RENDER_MODES.RIVER:
      return 'River';
    case TRACK_RENDER_MODES.GRADIENT:
    default:
      return 'Gradient';
  }
}

function updateTrackRenderModeButton(): void {
  if (!trackRenderModeButton) {
    return;
  }
  const label = resolveTrackRenderModeLabel();
  trackRenderModeButton.textContent = `Track · ${label}`;
  trackRenderModeButton.setAttribute('aria-label', `Switch track visuals (current: ${label})`);
}

function cycleTrackRenderMode(): void {
  const modes = Object.values(TRACK_RENDER_MODES);
  if (!modes.length) {
    return;
  }
  const currentIndex = modes.indexOf(activeTrackRenderMode);
  const next = modes[(currentIndex + 1) % modes.length];
  applyTrackRenderMode(next);
}

export function getTrackRenderMode(): TrackRenderMode {
  return activeTrackRenderMode;
}

export function applyTrackRenderMode(mode: string, { persist = true }: PersistOptions = {}): TrackRenderMode {
  const validModes: readonly string[] = Object.values(TRACK_RENDER_MODES);
  const normalized: TrackRenderMode = validModes.includes(mode) ? (mode as TrackRenderMode) : TRACK_RENDER_MODES.GRADIENT;
  activeTrackRenderMode = normalized;
  updateTrackRenderModeButton();
  updateTrackRenderPreview();

  if (persist) {
    writeStorage(TRACK_RENDER_MODE_STORAGE_KEY, normalized);
  }

  const playfield = playfieldGetter();
  if (playfield && typeof playfield.draw === 'function') {
    playfield.draw();
  }

  return normalized;
}

export function bindTrackRenderModeButton(): void {
  trackRenderModeButton = document.getElementById('track-graphics-button');
  if (!trackRenderModeButton) {
    return;
  }
  trackRenderModeButton.addEventListener('click', () => {
    cycleTrackRenderMode();
  });
  updateTrackRenderModeButton();
  updateTrackRenderPreview();
}

export function initializeTrackRenderMode(): void {
  const stored = readStorage(TRACK_RENDER_MODE_STORAGE_KEY);
  const validModes: readonly string[] = Object.values(TRACK_RENDER_MODES);
  const normalized: TrackRenderMode = stored && validModes.includes(stored) ? (stored as TrackRenderMode) : TRACK_RENDER_MODES.GRADIENT;
  applyTrackRenderMode(normalized, { persist: false });
}

// Enemy Particles Settings
let enemyParticlesEnabled = true;
let enemyParticlesToggle: HTMLInputElement | null = null;
let enemyParticlesStateLabel: HTMLElement | null = null;

/**
 * Synchronize the enemy particles toggle control with the in-memory state.
 */
function updateEnemyParticlesToggleUi(): void {
  if (enemyParticlesToggle) {
    enemyParticlesToggle.checked = enemyParticlesEnabled;
    enemyParticlesToggle.setAttribute('aria-checked', enemyParticlesEnabled ? 'true' : 'false');
    const controlShell = enemyParticlesToggle.closest('.settings-toggle-control');
    if (controlShell) {
      controlShell.classList.toggle('is-active', enemyParticlesEnabled);
    }
  }
  if (enemyParticlesStateLabel) {
    enemyParticlesStateLabel.textContent = enemyParticlesEnabled ? 'On' : 'Off';
  }
}

/**
 * Persist and apply the enemy particles preference.
 */
export function applyEnemyParticlesPreference(preference: unknown, { persist = true }: PersistOptions = {}): boolean {
  const enabled = normalizeGlyphEquationPreference(preference);
  enemyParticlesEnabled = enabled;
  updateEnemyParticlesToggleUi();
  if (persist) {
    writeStorage(PLAYFIELD_ENEMY_PARTICLES_STORAGE_KEY, enemyParticlesEnabled ? '1' : '0');
  }
  const playfield = playfieldGetter();
  if (playfield && typeof playfield.draw === 'function') {
    playfield.draw();
  }
  return enemyParticlesEnabled;
}

/**
 * Bind the visual settings toggle for enemy particles.
 */
export function bindEnemyParticlesToggle(): void {
  enemyParticlesToggle = document.getElementById('playfield-enemy-particles-toggle') as HTMLInputElement | null;
  enemyParticlesStateLabel = document.getElementById('playfield-enemy-particles-state');
  if (!enemyParticlesToggle) {
    return;
  }
  enemyParticlesToggle.addEventListener('change', (event) => {
    applyEnemyParticlesPreference((event?.target as HTMLInputElement | null)?.checked);
  });
  updateEnemyParticlesToggleUi();
}

/**
 * Initialize the enemy particles preference from storage.
 */
export function initializeEnemyParticlesPreference(): boolean {
  const stored = readStorage(PLAYFIELD_ENEMY_PARTICLES_STORAGE_KEY);
  const normalized = stored === '0' || stored === 'false' ? false : true;
  return applyEnemyParticlesPreference(normalized, { persist: false });
}

/**
 * Reports whether enemy particles are enabled.
 */
export function areEnemyParticlesEnabled(): boolean {
  return enemyParticlesEnabled;
}

// Edge Crystals Settings
let edgeCrystalsEnabled = true;
let edgeCrystalsToggle: HTMLInputElement | null = null;
let edgeCrystalsStateLabel: HTMLElement | null = null;

/**
 * Synchronize the edge crystals toggle control with the in-memory state.
 */
function updateEdgeCrystalsToggleUi(): void {
  if (edgeCrystalsToggle) {
    edgeCrystalsToggle.checked = edgeCrystalsEnabled;
    edgeCrystalsToggle.setAttribute('aria-checked', edgeCrystalsEnabled ? 'true' : 'false');
    const controlShell = edgeCrystalsToggle.closest('.settings-toggle-control');
    if (controlShell) {
      controlShell.classList.toggle('is-active', edgeCrystalsEnabled);
    }
  }
  if (edgeCrystalsStateLabel) {
    edgeCrystalsStateLabel.textContent = edgeCrystalsEnabled ? 'On' : 'Off';
  }
}

/**
 * Persist and apply the edge crystals preference.
 */
export function applyEdgeCrystalsPreference(preference: unknown, { persist = true }: PersistOptions = {}): boolean {
  const enabled = normalizeGlyphEquationPreference(preference);
  edgeCrystalsEnabled = enabled;
  updateEdgeCrystalsToggleUi();
  if (persist) {
    writeStorage(PLAYFIELD_EDGE_CRYSTALS_STORAGE_KEY, edgeCrystalsEnabled ? '1' : '0');
  }
  const playfield = playfieldGetter();
  if (playfield && typeof playfield.draw === 'function') {
    playfield.draw();
  }
  return edgeCrystalsEnabled;
}

/**
 * Bind the visual settings toggle for edge crystals.
 */
export function bindEdgeCrystalsToggle(): void {
  edgeCrystalsToggle = document.getElementById('playfield-edge-crystals-toggle') as HTMLInputElement | null;
  edgeCrystalsStateLabel = document.getElementById('playfield-edge-crystals-state');
  if (!edgeCrystalsToggle) {
    return;
  }
  edgeCrystalsToggle.addEventListener('change', (event) => {
    applyEdgeCrystalsPreference((event?.target as HTMLInputElement | null)?.checked);
  });
  updateEdgeCrystalsToggleUi();
}

/**
 * Initialize the edge crystals preference from storage.
 */
export function initializeEdgeCrystalsPreference(): boolean {
  const stored = readStorage(PLAYFIELD_EDGE_CRYSTALS_STORAGE_KEY);
  // Default to false (off) when no stored preference exists, since edge crystals can cause lag.
  const normalized = stored === null || stored === undefined
    ? false
    : stored !== '0' && stored !== 'false';
  return applyEdgeCrystalsPreference(normalized, { persist: false });
}

/**
 * Reports whether edge crystals are enabled.
 */
export function areEdgeCrystalsEnabled(): boolean {
  return edgeCrystalsEnabled;
}

// Background Particles Settings
let backgroundParticlesEnabled = true;
let backgroundParticlesToggle: HTMLInputElement | null = null;
let backgroundParticlesStateLabel: HTMLElement | null = null;

/**
 * Synchronize the background particles toggle control with the in-memory state.
 */
function updateBackgroundParticlesToggleUi(): void {
  if (backgroundParticlesToggle) {
    backgroundParticlesToggle.checked = backgroundParticlesEnabled;
    backgroundParticlesToggle.setAttribute('aria-checked', backgroundParticlesEnabled ? 'true' : 'false');
    const controlShell = backgroundParticlesToggle.closest('.settings-toggle-control');
    if (controlShell) {
      controlShell.classList.toggle('is-active', backgroundParticlesEnabled);
    }
  }
  if (backgroundParticlesStateLabel) {
    backgroundParticlesStateLabel.textContent = backgroundParticlesEnabled ? 'On' : 'Off';
  }
}

/**
 * Persist and apply the background particles preference.
 */
export function applyBackgroundParticlesPreference(preference: unknown, { persist = true }: PersistOptions = {}): boolean {
  const enabled = normalizeGlyphEquationPreference(preference);
  backgroundParticlesEnabled = enabled;
  updateBackgroundParticlesToggleUi();
  if (persist) {
    writeStorage(PLAYFIELD_BACKGROUND_PARTICLES_STORAGE_KEY, backgroundParticlesEnabled ? '1' : '0');
  }
  const playfield = playfieldGetter();
  if (playfield && typeof playfield.draw === 'function') {
    playfield.draw();
  }
  return backgroundParticlesEnabled;
}

/**
 * Bind the visual settings toggle for background particles.
 */
export function bindBackgroundParticlesToggle(): void {
  backgroundParticlesToggle = document.getElementById('playfield-background-particles-toggle') as HTMLInputElement | null;
  backgroundParticlesStateLabel = document.getElementById('playfield-background-particles-state');
  if (!backgroundParticlesToggle) {
    return;
  }
  backgroundParticlesToggle.addEventListener('change', (event) => {
    applyBackgroundParticlesPreference((event?.target as HTMLInputElement | null)?.checked);
  });
  updateBackgroundParticlesToggleUi();
}

/**
 * Initialize the background particles preference from storage.
 */
export function initializeBackgroundParticlesPreference(): boolean {
  const stored = readStorage(PLAYFIELD_BACKGROUND_PARTICLES_STORAGE_KEY);
  const normalized = stored === '0' || stored === 'false' ? false : true;
  return applyBackgroundParticlesPreference(normalized, { persist: false });
}

/**
 * Reports whether background particles are enabled.
 */
export function areBackgroundParticlesEnabled(): boolean {
  return backgroundParticlesEnabled;
}

// Toggle state for the automatic graphics switching system.
let autoGraphicsEnabled = false;
let autoGraphicsToggleInput: HTMLInputElement | null = null;
let autoGraphicsToggleStateLabel: HTMLElement | null = null;

/**
 * Synchronize the auto-graphics toggle control with the in-memory state.
 */
function updateAutoGraphicsToggleUi(): void {
  if (autoGraphicsToggleInput) {
    autoGraphicsToggleInput.checked = autoGraphicsEnabled;
    autoGraphicsToggleInput.setAttribute('aria-checked', autoGraphicsEnabled ? 'true' : 'false');
    const controlShell = autoGraphicsToggleInput.closest('.settings-toggle-control');
    if (controlShell) {
      controlShell.classList.toggle('is-active', autoGraphicsEnabled);
    }
  }
  if (autoGraphicsToggleStateLabel) {
    autoGraphicsToggleStateLabel.textContent = autoGraphicsEnabled ? 'On' : 'Off';
  }
}

/**
 * Persist and apply the auto-graphics switching preference.
 */
export function applyAutoGraphicsPreference(preference: unknown, { persist = true }: PersistOptions = {}): boolean {
  const enabled = Boolean(preference);
  autoGraphicsEnabled = enabled;
  updateAutoGraphicsToggleUi();
  setAutoGraphicsEnabled(enabled);
  if (persist) {
    writeStorage(AUTO_GRAPHICS_TOGGLE_STORAGE_KEY, autoGraphicsEnabled ? '1' : '0');
  }
  return autoGraphicsEnabled;
}

/**
 * Bind the settings toggle that controls automatic graphics-quality switching.
 */
export function bindAutoGraphicsToggle(): void {
  autoGraphicsToggleInput = document.getElementById('auto-graphics-toggle') as HTMLInputElement | null;
  autoGraphicsToggleStateLabel = document.getElementById('auto-graphics-toggle-state');
  if (!autoGraphicsToggleInput) {
    return;
  }
  autoGraphicsToggleInput.addEventListener('change', (event) => {
    applyAutoGraphicsPreference((event?.target as HTMLInputElement | null)?.checked);
  });
  updateAutoGraphicsToggleUi();
}

/**
 * Initialize the auto-graphics preference from storage.
 * Defaults to disabled so players must explicitly opt in.
 */
export function initializeAutoGraphicsPreference(): boolean {
  const stored = readStorage(AUTO_GRAPHICS_TOGGLE_STORAGE_KEY);
  const normalized = stored === '1' || stored === 'true';
  return applyAutoGraphicsPreference(normalized, { persist: false });
}

/**
 * Reports whether the automatic graphics-quality switching system is enabled.
 */
export function isAutoGraphicsSwitchingEnabled(): boolean {
  return autoGraphicsEnabled;
}

let playfieldTrackTypeButton: HTMLElement | null = null;

/**
 * Update the playfield track type button to show current mode.
 */
function updatePlayfieldTrackTypeButton(): void {
  if (!playfieldTrackTypeButton) {
    return;
  }
  const label = resolveTrackRenderModeLabel();
  playfieldTrackTypeButton.textContent = `Track Type · ${label}`;
  playfieldTrackTypeButton.setAttribute('aria-label', `Switch track type (current: ${label})`);
}

/**
 * Bind the playfield track type button to cycle through modes.
 */
export function bindPlayfieldTrackTypeButton(): void {
  playfieldTrackTypeButton = document.getElementById('playfield-track-type-button');
  if (!playfieldTrackTypeButton) {
    return;
  }
  playfieldTrackTypeButton.addEventListener('click', () => {
    cycleTrackRenderMode();
    updatePlayfieldTrackTypeButton();
  });
  updatePlayfieldTrackTypeButton();
}

// Tower Loadout Toggle Side

// Apply the preferred toggle side to the shell so the button sits beside the tray.
function applyTowerLoadoutToggleSideDom(): void {
  if (!towerLoadoutShell) {
    towerLoadoutShell = document.getElementById('tower-loadout-shell');
  }
  if (!towerLoadoutShell) {
    return;
  }
  towerLoadoutShell.dataset.toggleSide = towerLoadoutToggleSide;
}

// Refresh the toggle-side button label to mirror the current position.
function updateTowerLoadoutToggleSideUi(): void {
  if (!loadoutToggleSideButton) {
    return;
  }
  const label = towerLoadoutToggleSide === LOADOUT_TOGGLE_SIDES.RIGHT ? 'Right' : 'Left';
  loadoutToggleSideButton.textContent = `Tower Toggle · ${label}`;
  loadoutToggleSideButton.setAttribute('aria-label', `Move tower toggle to the ${label.toLowerCase()} side`);
}

// Persist and apply the requested side so the loadout toggle slides beside the tower chips.
export function applyTowerLoadoutToggleSidePreference(preference: string, { persist = true }: PersistOptions = {}): LoadoutToggleSide {
  const normalized: LoadoutToggleSide = preference === LOADOUT_TOGGLE_SIDES.RIGHT
    ? LOADOUT_TOGGLE_SIDES.RIGHT
    : LOADOUT_TOGGLE_SIDES.LEFT;
  towerLoadoutToggleSide = normalized;
  updateTowerLoadoutToggleSideUi();
  applyTowerLoadoutToggleSideDom();
  if (persist) {
    writeStorage(TOWER_LOADOUT_TOGGLE_SIDE_STORAGE_KEY, normalized);
  }
  return normalized;
}

// Initialize the loadout toggle side from persisted storage without forcing a write.
export function initializeTowerLoadoutToggleSidePreference(): LoadoutToggleSide {
  const stored = readStorage(TOWER_LOADOUT_TOGGLE_SIDE_STORAGE_KEY);
  const normalized: LoadoutToggleSide = stored === LOADOUT_TOGGLE_SIDES.RIGHT
    ? LOADOUT_TOGGLE_SIDES.RIGHT
    : LOADOUT_TOGGLE_SIDES.LEFT;
  return applyTowerLoadoutToggleSidePreference(normalized, { persist: false });
}

// Wire the playfield settings control so players can flip the loadout toggle side.
export function bindTowerLoadoutToggleSideButton(): void {
  loadoutToggleSideButton = document.getElementById('tower-loadout-toggle-side-button');
  towerLoadoutShell = document.getElementById('tower-loadout-shell');
  if (!loadoutToggleSideButton) {
    return;
  }
  loadoutToggleSideButton.addEventListener('click', () => {
    const nextSide: LoadoutToggleSide = towerLoadoutToggleSide === LOADOUT_TOGGLE_SIDES.LEFT
      ? LOADOUT_TOGGLE_SIDES.RIGHT
      : LOADOUT_TOGGLE_SIDES.LEFT;
    applyTowerLoadoutToggleSidePreference(nextSide);
  });
  updateTowerLoadoutToggleSideUi();
  applyTowerLoadoutToggleSideDom();
}

// Apply the active spire options placement to the document so CSS can react.
function applySpireOptionsPlacementDom(): void {
  if (!document.body) {
    return;
  }
  document.body.dataset.spireOptionsPlacement = spireOptionsPlacement;
}

// Refresh the spire options placement toggle text to match the selected layout.
function updateSpireOptionsPlacementUi(): void {
  if (!spireOptionsPlacementButton) {
    return;
  }
  const label = spireOptionsPlacement === SPIRE_OPTIONS_PLACEMENTS.CORNER ? 'Top Right' : 'Bottom';
  spireOptionsPlacementButton.textContent = `Spire Options · ${label}`;
  spireOptionsPlacementButton.setAttribute('aria-label', `Place spire options in the ${label.toLowerCase()} position`);
}

// Persist and apply the requested spire options placement so the UI can hide the unused button set.
export function applySpireOptionsPlacementPreference(preference: string, { persist = true }: PersistOptions = {}): SpireOptionsPlacement {
  const normalized: SpireOptionsPlacement = preference === SPIRE_OPTIONS_PLACEMENTS.CORNER
    ? SPIRE_OPTIONS_PLACEMENTS.CORNER
    : SPIRE_OPTIONS_PLACEMENTS.FOOTER;
  spireOptionsPlacement = normalized;
  updateSpireOptionsPlacementUi();
  applySpireOptionsPlacementDom();
  if (persist) {
    writeStorage(SPIRE_OPTIONS_PLACEMENT_STORAGE_KEY, normalized);
  }
  return normalized;
}

// Initialize the spire options placement from storage without writing back.
export function initializeSpireOptionsPlacementPreference(): SpireOptionsPlacement {
  const stored = readStorage(SPIRE_OPTIONS_PLACEMENT_STORAGE_KEY);
  const normalized: SpireOptionsPlacement = stored === SPIRE_OPTIONS_PLACEMENTS.CORNER
    ? SPIRE_OPTIONS_PLACEMENTS.CORNER
    : SPIRE_OPTIONS_PLACEMENTS.FOOTER;
  return applySpireOptionsPlacementPreference(normalized, { persist: false });
}

// Wire the codex options toggle so players can swap between corner and bottom spire buttons.
export function bindSpireOptionsPlacementButton(): void {
  spireOptionsPlacementButton = document.getElementById('spire-options-placement-button');
  if (!spireOptionsPlacementButton) {
    return;
  }
  spireOptionsPlacementButton.addEventListener('click', () => {
    const nextPlacement: SpireOptionsPlacement = spireOptionsPlacement === SPIRE_OPTIONS_PLACEMENTS.CORNER
      ? SPIRE_OPTIONS_PLACEMENTS.FOOTER
      : SPIRE_OPTIONS_PLACEMENTS.CORNER;
    applySpireOptionsPlacementPreference(nextPlacement);
  });
  updateSpireOptionsPlacementUi();
  applySpireOptionsPlacementDom();
}

// Crystal Background Sprites Settings
let crystalBackgroundSpritesEnabled = false;
let crystalBackgroundSpritesToggle: HTMLInputElement | null = null;
let crystalBackgroundSpritesStateLabel: HTMLElement | null = null;

/**
 * Synchronize the crystal background sprites toggle control with the in-memory state.
 */
function updateCrystalBackgroundSpritesToggleUi(): void {
  if (crystalBackgroundSpritesToggle) {
    crystalBackgroundSpritesToggle.checked = crystalBackgroundSpritesEnabled;
    crystalBackgroundSpritesToggle.setAttribute('aria-checked', crystalBackgroundSpritesEnabled ? 'true' : 'false');
    const controlShell = crystalBackgroundSpritesToggle.closest('.settings-toggle-control');
    if (controlShell) {
      controlShell.classList.toggle('is-active', crystalBackgroundSpritesEnabled);
    }
  }
  if (crystalBackgroundSpritesStateLabel) {
    crystalBackgroundSpritesStateLabel.textContent = crystalBackgroundSpritesEnabled ? 'On' : 'Off';
  }
}

/**
 * Persist and apply the crystal background sprites preference.
 */
export function applyCrystalBackgroundSpritesPreference(preference: unknown, { persist = true }: PersistOptions = {}): boolean {
  const enabled = normalizeGlyphEquationPreference(preference);
  crystalBackgroundSpritesEnabled = enabled;
  updateCrystalBackgroundSpritesToggleUi();
  if (persist) {
    writeStorage(CRYSTAL_BACKGROUND_SPRITES_STORAGE_KEY, crystalBackgroundSpritesEnabled ? '1' : '0');
  }
  const playfield = playfieldGetter();
  if (playfield && typeof playfield.draw === 'function') {
    playfield.draw();
  }
  return crystalBackgroundSpritesEnabled;
}

/**
 * Bind the visual settings toggle for crystal background sprites.
 */
export function bindCrystalBackgroundSpritesToggle(): void {
  crystalBackgroundSpritesToggle = document.getElementById('crystal-background-sprites-toggle') as HTMLInputElement | null;
  crystalBackgroundSpritesStateLabel = document.getElementById('crystal-background-sprites-state');
  if (!crystalBackgroundSpritesToggle) {
    return;
  }
  crystalBackgroundSpritesToggle.addEventListener('change', (event) => {
    applyCrystalBackgroundSpritesPreference((event?.target as HTMLInputElement | null)?.checked);
  });
  updateCrystalBackgroundSpritesToggleUi();
}

/**
 * Initialize the crystal background sprites preference from storage.
 * Defaults to off since it is a heavy visual effect.
 */
export function initializeCrystalBackgroundSpritesPreference(): boolean {
  const stored = readStorage(CRYSTAL_BACKGROUND_SPRITES_STORAGE_KEY);
  const normalized = stored === null || stored === undefined
    ? false
    : stored !== '0' && stored !== 'false';
  return applyCrystalBackgroundSpritesPreference(normalized, { persist: false });
}

/**
 * Reports whether crystal background sprites are enabled.
 */
export function areCrystalBackgroundSpritesEnabled(): boolean {
  return crystalBackgroundSpritesEnabled;
}

// ────────────────────────────────────────────────────────────────────────────
// Invert Tower Carousel Drag
// ────────────────────────────────────────────────────────────────────────────

let invertCarouselDragEnabled = true; // Default inverted so dragging up scrolls down.
let invertCarouselDragToggleInput: HTMLInputElement | null = null;
let invertCarouselDragToggleStateLabel: HTMLElement | null = null;

/**
 * Bind the invert carousel drag toggle checkbox to its UI elements.
 */
export function bindInvertCarouselDragToggle(): void {
  invertCarouselDragToggleInput = document.getElementById('invert-carousel-drag-toggle') as HTMLInputElement | null;
  invertCarouselDragToggleStateLabel = document.getElementById('invert-carousel-drag-toggle-state');
  if (!invertCarouselDragToggleInput) {
    return;
  }
  invertCarouselDragToggleInput.addEventListener('change', (event) => {
    applyInvertCarouselDragPreference((event?.target as HTMLInputElement | null)?.checked);
  });
  updateInvertCarouselDragToggleUi();
}

function updateInvertCarouselDragToggleUi(): void {
  if (invertCarouselDragToggleInput) {
    invertCarouselDragToggleInput.checked = invertCarouselDragEnabled;
    invertCarouselDragToggleInput.setAttribute('aria-checked', invertCarouselDragEnabled ? 'true' : 'false');
  }
  if (invertCarouselDragToggleStateLabel) {
    invertCarouselDragToggleStateLabel.textContent = invertCarouselDragEnabled ? 'On' : 'Off';
  }
}

/**
 * Apply the invert carousel drag preference and optionally persist it.
 */
export function applyInvertCarouselDragPreference(preference: unknown, { persist = true }: PersistOptions = {}): boolean {
  invertCarouselDragEnabled = Boolean(preference);
  updateInvertCarouselDragToggleUi();
  if (persist) {
    writeStorage(INVERT_CAROUSEL_DRAG_STORAGE_KEY, invertCarouselDragEnabled ? '1' : '0');
  }
  return invertCarouselDragEnabled;
}

/**
 * Load the persisted invert carousel drag preference from storage.
 */
export function initializeInvertCarouselDragPreference(): boolean {
  const stored = readStorage(INVERT_CAROUSEL_DRAG_STORAGE_KEY);
  // Default to true (inverted) when no stored value exists.
  const normalized = stored === null || stored === undefined
    ? true
    : stored !== '0' && stored !== 'false';
  return applyInvertCarouselDragPreference(normalized, { persist: false });
}

/**
 * Reports whether the tower carousel drag direction is inverted.
 */
export function isCarouselDragInverted(): boolean {
  return invertCarouselDragEnabled;
}
