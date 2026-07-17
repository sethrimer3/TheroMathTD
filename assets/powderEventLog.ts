// Maintain the Well of Inspiration's recent active-action ledger.

/** Live Well bonuses read when composing ledger entries. */
export interface PowderBonusSummary {
  sandBonus: number;
  duneBonus: number;
  crystalBonus: number;
  totalMultiplier: number;
  [key: string]: unknown;
}

/** DOM references for the visible Well event list. */
export interface PowderEventLogElements {
  logList?: HTMLElement | null;
  logEmpty?: HTMLElement | null;
  [key: string]: unknown;
}

/** Injected Well state and formatting helpers used by ledger entries. */
export interface PowderEventLogDependencies {
  formatGameNumber: (value: unknown) => string;
  formatDecimal: (value: unknown, digits?: number) => string;
  formatSignedPercentage: (value: unknown) => string;
  getCurrentPowderBonuses: () => PowderBonusSummary;
  powderState: Record<string, unknown> | null;
  powderElements: PowderEventLogElements | null;
}

const POWDER_LOG_LIMIT = 6;
const powderLog: string[] = [];

const dependencies: PowderEventLogDependencies = {
  formatGameNumber: (value) => String(Number(value) || 0),
  formatDecimal: (value) => String(Number(value) || 0),
  formatSignedPercentage: (value) => String(Number(value) || 0),
  getCurrentPowderBonuses: () => ({ sandBonus: 0, duneBonus: 0, crystalBonus: 0, totalMultiplier: 1 }),
  powderState: null,
  powderElements: null,
};

/** Inject the live Well state and formatting helpers used by ledger entries. */
export function configurePowderEventLog(config: Partial<PowderEventLogDependencies> = {}): void {
  Object.assign(dependencies, config);
}

/** Rebuild the visible Well event list from the most recent entries. */
export function updatePowderLogDisplay(): void {
  const { logList, logEmpty } = dependencies.powderElements || {};
  if (!logList || !logEmpty) {
    return;
  }

  logList.innerHTML = '';
  if (!powderLog.length) {
    logList.setAttribute('hidden', '');
    logEmpty.hidden = false;
    return;
  }

  logList.removeAttribute('hidden');
  logEmpty.hidden = true;
  const fragment = document.createDocumentFragment();
  powderLog.forEach((entry) => {
    const item = document.createElement('li');
    item.textContent = entry;
    fragment.append(item);
  });
  logList.append(fragment);
}

/** Append a formatted entry for an active Well interaction. */
export function recordPowderEvent(type: string, context: Record<string, unknown> = {}): void {
  const powderState = dependencies.powderState || {};
  const powderBonuses = dependencies.getCurrentPowderBonuses();
  let entry = '';

  switch (type) {
    case 'sand-stabilized':
      entry = `Sandfall stabilized · Mote bonus ${dependencies.formatSignedPercentage(powderBonuses.sandBonus)}.`;
      break;
    case 'sand-released':
      entry = 'Sandfall released · Flow returns to natural mote drift.';
      break;
    case 'dune-raise': {
      const { height = powderState.duneHeight } = context;
      const safeHeight = typeof height === 'number' && Number.isFinite(height) ? height : 0;
      entry = `Dune surveyed · h = ${safeHeight}, Δm = ${dependencies.formatDecimal(Math.log2(Math.max(0, safeHeight) + 1), 2)}.`;
      break;
    }
    case 'dune-max':
      entry = 'Dune survey halted · Ridge already at maximum elevation.';
      break;
    case 'crystal-charge':
      entry = `Crystal lattice charged (${context.charges ?? powderState.charges}/3) · Resonance rising.`;
      break;
    case 'crystal-release':
      entry = `Crystal pulse released · Σ surged ${dependencies.formatSignedPercentage(context.pulseBonus || 0)}.`;
      break;
    case 'achievement-unlocked':
      entry = `${context.title || 'Achievement'} seal unlocked.`;
      break;
    case 'developer-adjust': {
      const fieldLabels: Record<string, string> = {
        'base-start-thero': 'Base start Θ',
        glyphs: 'Glyph reserves',
      };
      const label = (typeof context.field === 'string' ? fieldLabels[context.field] : undefined)
        || context.field
        || 'value';
      entry = `Developer adjusted ${label} · ${dependencies.formatGameNumber(Number(context.value) || 0)}.`;
      break;
    }
    case 'mode-switch':
      entry = 'Well of Inspiration simulation engaged.';
      break;
    default:
      return;
  }

  powderLog.unshift(entry);
  if (powderLog.length > POWDER_LOG_LIMIT) {
    powderLog.length = POWDER_LOG_LIMIT;
  }
  updatePowderLogDisplay();
}
