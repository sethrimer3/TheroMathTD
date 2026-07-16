import type { TowerEquationVariable } from './towerBlueprintPresenter.js';
import type { UniversalTowerVariableMetadata } from './towerVariableDiscovery.js';

/** Mutable DOM/timer state retained by the Towers tab between tooltip events. */
export interface TowerEquationTooltipState {
  element: HTMLElement | null;
  currentTarget: HTMLElement | null;
  hideTimeoutId: number | null;
}

type PanelElementProvider = () => HTMLElement | null;
type UniversalVariableMetadataResolver = (
  variable: TowerEquationVariable,
) => UniversalTowerVariableMetadata | null;
type FrameScheduler = (callback: FrameRequestCallback) => number;

/** Factory configuration supplied by the still-JavaScript Towers tab. */
export interface TowerEquationTooltipOptions {
  tooltipState?: unknown;
  getPanelElement?: PanelElementProvider;
  getUniversalVariableMetadata?: UniversalVariableMetadataResolver;
  tooltipId?: string;
  tooltipMarginPx?: number;
  requestAnimationFrame?: unknown;
}

/** Public tooltip helpers consumed by the Towers tab and upgrade overlay. */
export interface TowerEquationTooltipController {
  ensureTooltipElement: () => HTMLElement | null;
  buildVariableTooltip: (
    variable: TowerEquationVariable | null | undefined,
    fallbackSymbol?: unknown,
  ) => string;
  hideTooltip: (options?: { immediate?: boolean }) => void;
  handlePointerEnter: (event: unknown) => void;
  handlePointerLeave: () => void;
  handleFocus: (event: unknown) => void;
  handleBlur: () => void;
}

interface TooltipEventLike {
  currentTarget?: unknown;
}

/** Preserve the original truthy state validation before using the injected bucket. */
function hasTooltipState(value: unknown): value is TowerEquationTooltipState {
  return Boolean(value);
}

/** Narrow optional requestAnimationFrame injection without weakening its input type. */
function isFrameScheduler(value: unknown): value is FrameScheduler {
  return typeof value === 'function';
}

/** Read an event's optional currentTarget without assuming a browser Event instance. */
function getEventCurrentTarget(event: unknown): unknown {
  if ((typeof event !== 'object' && typeof event !== 'function') || event === null) {
    return undefined;
  }
  return (event as TooltipEventLike).currentTarget;
}

/**
 * Coordinate tooltip construction, text, positioning, accessibility, and
 * pointer/focus lifecycle while retaining the Towers tab's shared state.
 */
export function createTowerEquationTooltipSystem(
  {
    tooltipState,
    getPanelElement = () => null,
    getUniversalVariableMetadata = () => null,
    tooltipId = 'tower-upgrade-equation-tooltip',
    tooltipMarginPx = 12,
    requestAnimationFrame: requestAnimationFrameOption,
  }: TowerEquationTooltipOptions = {},
): TowerEquationTooltipController {
  if (!hasTooltipState(tooltipState)) {
    throw new Error('createTowerEquationTooltipSystem requires a tooltipState object.');
  }
  const state = tooltipState;

  const scheduleTimeout =
    typeof window !== 'undefined' && typeof window.setTimeout === 'function'
      ? window.setTimeout.bind(window)
      : (handler: TimerHandler, delay?: number) => setTimeout(handler, delay);
  const clearScheduledTimeout =
    typeof window !== 'undefined' && typeof window.clearTimeout === 'function'
      ? window.clearTimeout.bind(window)
      : (timeoutId: number) => clearTimeout(timeoutId);
  const requestFrame = isFrameScheduler(requestAnimationFrameOption)
    ? requestAnimationFrameOption
    : typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame.bind(window)
      : (callback: FrameRequestCallback) => scheduleTimeout(callback, 16);

  /** Create the shared tooltip element once and reuse it while connected. */
  function ensureTooltipElement(): HTMLElement | null {
    if (state.element && state.element.isConnected) {
      return state.element;
    }

    if (typeof document === 'undefined') {
      return null;
    }

    const panel = getPanelElement();
    if (!panel) {
      return null;
    }

    const tooltip = document.createElement('div');
    tooltip.className = 'tower-upgrade-formula-tooltip';
    tooltip.id = tooltipId;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.hidden = true;
    panel.append(tooltip);
    state.element = tooltip;
    return tooltip;
  }

  /** Format authored and universal metadata using the inherited precedence. */
  function buildVariableTooltip(
    variable: TowerEquationVariable | null | undefined,
    fallbackSymbol: unknown = '',
  ): string {
    if (!variable) {
      return typeof fallbackSymbol === 'string' ? fallbackSymbol.trim() : '';
    }

    const universal = getUniversalVariableMetadata(variable);
    const fallback = typeof fallbackSymbol === 'string' ? fallbackSymbol.trim() : '';
    const symbol =
      (typeof variable.equationSymbol === 'string' && variable.equationSymbol.trim()) ||
      (typeof variable.symbol === 'string' && variable.symbol.trim()) ||
      (typeof universal?.symbol === 'string' ? universal.symbol : '') ||
      (typeof variable.key === 'string' && variable.key.trim()
        ? variable.key.trim().toUpperCase()
        : '') ||
      fallback;
    const name =
      (typeof variable.tooltipName === 'string' && variable.tooltipName.trim()) ||
      (typeof variable.name === 'string' && variable.name.trim()) ||
      (typeof universal?.name === 'string' ? universal.name : '');
    const units =
      (typeof variable.units === 'string' && variable.units.trim()) ||
      (typeof universal?.units === 'string' ? universal.units : '');
    const description =
      (typeof variable.tooltipDescription === 'string' &&
        variable.tooltipDescription.trim()) ||
      (typeof variable.description === 'string' && variable.description.trim()) ||
      (typeof universal?.description === 'string' ? universal.description : '');

    if (!symbol && !name && !units && !description) {
      return '';
    }

    const header = symbol && name ? `${symbol}: ${name}` : symbol || name || '';
    const headerWithUnits = header
      ? `${header}${units ? ` (${units})` : ''}`
      : units
        ? `(${units})`
        : '';
    if (description) {
      return headerWithUnits ? `${headerWithUnits} ${description}` : description;
    }
    return headerWithUnits;
  }

  /** Clamp the tooltip to its panel and prefer the side with usable space. */
  function positionTooltip(target: HTMLElement | null, tooltip: HTMLElement | null): void {
    if (!target || !tooltip) {
      return;
    }

    const panel = getPanelElement();
    if (!panel) {
      return;
    }

    const panelRect = panel.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    tooltip.style.maxWidth = `${Math.max(220, panelRect.width - tooltipMarginPx * 2)}px`;
    tooltip.style.left = `${tooltipMarginPx}px`;
    tooltip.style.top = `${tooltipMarginPx}px`;

    const tooltipRect = tooltip.getBoundingClientRect();
    const centerOffset = targetRect.left + targetRect.width / 2 - panelRect.left;
    const idealLeft = centerOffset - tooltipRect.width / 2;
    const maxLeft = panelRect.width - tooltipRect.width - tooltipMarginPx;
    const clampedLeft = Math.min(
      Math.max(idealLeft, tooltipMarginPx),
      Math.max(maxLeft, tooltipMarginPx),
    );

    const spaceBelow = panelRect.bottom - targetRect.bottom;
    const spaceAbove = targetRect.top - panelRect.top;
    let top: number;
    if (spaceBelow >= tooltipRect.height + tooltipMarginPx || spaceBelow >= spaceAbove) {
      top = targetRect.bottom - panelRect.top + tooltipMarginPx;
    } else {
      top = targetRect.top - panelRect.top - tooltipRect.height - tooltipMarginPx;
    }
    const maxTop = panelRect.height - tooltipRect.height - tooltipMarginPx;
    const clampedTop = Math.min(
      Math.max(top, tooltipMarginPx),
      Math.max(maxTop, tooltipMarginPx),
    );

    tooltip.style.left = `${clampedLeft}px`;
    tooltip.style.top = `${clampedTop}px`;
  }

  /** Hide immediately for blur or after the inherited pointer-leave delay. */
  function hideTooltip({ immediate = false }: { immediate?: boolean } = {}): void {
    const tooltip = state.element;

    if (state.hideTimeoutId) {
      clearScheduledTimeout(state.hideTimeoutId);
      state.hideTimeoutId = null;
    }

    if (!tooltip) {
      if (state.currentTarget) {
        state.currentTarget.removeAttribute('aria-describedby');
        state.currentTarget = null;
      }
      return;
    }

    const finalize = (): void => {
      tooltip.dataset.visible = 'false';
      tooltip.setAttribute('aria-hidden', 'true');
      tooltip.hidden = true;
      tooltip.textContent = '';
      state.hideTimeoutId = null;
      if (state.currentTarget) {
        state.currentTarget.removeAttribute('aria-describedby');
        state.currentTarget = null;
      }
    };

    if (immediate) {
      finalize();
      return;
    }

    tooltip.dataset.visible = 'false';
    tooltip.setAttribute('aria-hidden', 'true');
    state.hideTimeoutId = scheduleTimeout(finalize, 160);
  }

  /** Show tooltip text, wire ARIA, and position it on the next frame. */
  function showTooltip(target: HTMLElement | null): void {
    if (!target) {
      return;
    }

    const tooltipText =
      typeof target.dataset.tooltip === 'string' ? target.dataset.tooltip : '';
    if (!tooltipText) {
      return;
    }

    const tooltip = ensureTooltipElement();
    if (!tooltip) {
      return;
    }

    if (state.hideTimeoutId) {
      clearScheduledTimeout(state.hideTimeoutId);
      state.hideTimeoutId = null;
    }

    if (state.currentTarget && state.currentTarget !== target) {
      state.currentTarget.removeAttribute('aria-describedby');
    }

    tooltip.textContent = tooltipText;
    tooltip.hidden = false;
    tooltip.dataset.visible = 'true';
    tooltip.setAttribute('aria-hidden', 'false');
    state.currentTarget = target;
    target.setAttribute('aria-describedby', tooltipId);

    requestFrame(() => {
      positionTooltip(target, tooltip);
    });
  }

  /** Show only for real HTMLElement pointer targets. */
  function handlePointerEnter(event: unknown): void {
    const target = getEventCurrentTarget(event);
    if (target instanceof HTMLElement) {
      showTooltip(target);
    }
  }

  function handlePointerLeave(): void {
    hideTooltip();
  }

  /** Show only for real HTMLElement focus targets. */
  function handleFocus(event: unknown): void {
    const target = getEventCurrentTarget(event);
    if (target instanceof HTMLElement) {
      showTooltip(target);
    }
  }

  function handleBlur(): void {
    hideTooltip({ immediate: true });
  }

  return {
    ensureTooltipElement,
    buildVariableTooltip,
    hideTooltip,
    handlePointerEnter,
    handlePointerLeave,
    handleFocus,
    handleBlur,
  };
}

export default createTowerEquationTooltipSystem;
