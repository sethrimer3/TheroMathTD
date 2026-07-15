import { TOWER_EQUATION_BLUEPRINTS } from './towerEquations/index.js';

/** Minimal enriched tower definition surface read by equation presentation. */
export interface TowerEquationDefinition {
  symbol?: unknown;
  [stat: string]: unknown;
}

/** Dynamic Towers-tab context passed through to authored variables without inspection. */
export type TowerEquationDynamicContext = unknown;

/** Mutable level record retained for each tower variable. */
export interface TowerVariableUpgradeState {
  level: number;
}

/** Mutable per-tower upgrade state owned by this presenter. */
export interface TowerUpgradeState {
  variables: Record<string, TowerVariableUpgradeState>;
}

/** Exact serialized variable state emitted by the presenter. */
export interface SerializedTowerVariableUpgradeState {
  level: number;
}

/** Exact serialized per-tower state emitted by the presenter. */
export interface SerializedTowerUpgradeState {
  variables: Record<string, SerializedTowerVariableUpgradeState>;
}

/** Base tower-upgrade snapshot owned by this module, before Aleph wrapping. */
export type TowerUpgradeStateSnapshot = Record<string, SerializedTowerUpgradeState>;

/** Untrusted saved payload accepted by the additive restore function. */
export type TowerUpgradeStateSnapshotInput = unknown;

/** Values assembled for an authored equation result callback. */
export type TowerEquationValueMap = Record<string, unknown>;

/** Context supplied to custom variable computation callbacks. */
export interface TowerVariableComputationContext {
  definition: TowerEquationDefinition | null | undefined;
  towerId: string;
  blueprint: TowerEquationBlueprint | null | undefined;
  dynamicContext: TowerEquationDynamicContext;
}

/** Context supplied to variable base and step callbacks. */
export interface TowerVariableDefinitionContext {
  definition: TowerEquationDefinition | null | undefined;
  towerId: string;
}

/** Context supplied to custom final-result callbacks. */
export interface TowerResultComputationContext {
  definition: TowerEquationDefinition | null | undefined;
}

/** Formatter surface used by fallback blueprints. */
export interface TowerBlueprintFormatters {
  formatWholeNumber?: unknown;
  formatDecimal?: unknown;
}

/** Variable fields consumed directly by the presenter and fallback blueprint. */
export interface TowerEquationVariable {
  key?: string;
  libraryKey?: string;
  symbol?: string;
  equationSymbol?: string;
  name?: string;
  tooltipName?: string;
  description?: string | null;
  tooltipDescription?: string;
  units?: string;
  glyphLabel?: string;
  stat?: string;
  upgradable?: boolean;
  format?: (value: number) => string;
  cost?: number | ((level: number) => unknown);
  reference?: string;
  transform?: (referencedValue: number) => number;
  exponent?: number;
  computeValue?: (context: TowerVariableComputationContext) => unknown;
  getBase?: (context: TowerVariableDefinitionContext) => number;
  baseValue?: number;
  getStep?: (level: number, context: TowerVariableDefinitionContext) => number;
  step?: number;
}

/** Golden-equation formatting helpers supplied by the Towers-tab UI. */
export interface GoldenEquationFormatContext {
  formatVariable: (variableKey: string) => string;
  formatResult: () => string;
}

/** Minimal authored/fallback blueprint contract owned by this presenter. */
export interface TowerEquationBlueprint {
  mathSymbol?: unknown;
  baseEquation?: string;
  variables?: readonly TowerEquationVariable[];
  computeResult?: (
    values: TowerEquationValueMap,
    context: TowerResultComputationContext,
  ) => unknown;
  formatGoldenEquation?: (context: GoldenEquationFormatContext) => string;
}

/** Factory dependencies accepted from the still-JavaScript Towers tab. */
export interface TowerBlueprintPresenterOptions {
  getTowerDefinition?: unknown;
  getDynamicContext?: unknown;
  formatters?: TowerBlueprintFormatters;
}

/** Public controller returned to the Towers tab and re-exported to runtime consumers. */
export interface TowerBlueprintPresenterController {
  getTowerEquationBlueprint: (
    towerId: string | null | undefined,
  ) => TowerEquationBlueprint | null | undefined;
  ensureTowerUpgradeState: (
    towerId: string | null | undefined,
    blueprint?: TowerEquationBlueprint | null,
  ) => TowerUpgradeState;
  getTowerUpgradeStateSnapshot: () => TowerUpgradeStateSnapshot;
  applyTowerUpgradeStateSnapshot: (snapshot: TowerUpgradeStateSnapshotInput) => void;
  calculateInvestedGlyphs: () => number;
  calculateTowerVariableUpgradeCost: (
    variable: TowerEquationVariable | null | undefined,
    level: number,
  ) => number;
  computeTowerVariableValue: (
    towerId: string | null | undefined,
    variableKey: string | null | undefined,
    blueprint?: TowerEquationBlueprint | null,
    visited?: Set<string>,
  ) => unknown;
  calculateTowerEquationResult: (
    towerId: string | null | undefined,
    visited?: Set<string>,
  ) => number;
  invalidateTowerEquationCache: () => void;
  clearTowerUpgradeState: (targetTowerId?: string | null) => void;
}

type TowerDefinitionResolver = (
  towerId: string,
) => TowerEquationDefinition | null | undefined;
type DynamicContextProvider = () => TowerEquationDynamicContext;
type WholeNumberFormatter = (value: number) => string;
type DecimalFormatter = (value: number, fractionDigits?: number) => string;
type ObjectLike = object & { [key: string]: unknown };

/** Preserve the original function-only dependency validation while narrowing unknown input. */
function isTowerDefinitionResolver(value: unknown): value is TowerDefinitionResolver {
  return typeof value === 'function';
}

/** Preserve the original optional dynamic-context fallback check. */
function isDynamicContextProvider(value: unknown): value is DynamicContextProvider {
  return typeof value === 'function';
}

/** Preserve the original optional formatter fallback checks. */
function isWholeNumberFormatter(value: unknown): value is WholeNumberFormatter {
  return typeof value === 'function';
}

function isDecimalFormatter(value: unknown): value is DecimalFormatter {
  return typeof value === 'function';
}

/** Match the original truthy object boundary, including arrays. */
function isObjectLike(value: unknown): value is ObjectLike {
  return typeof value === 'object' && value !== null;
}

/** Match `Number.isFinite` while narrowing the accepted value to a number. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

const authoredTowerBlueprints: Record<string, TowerEquationBlueprint> =
  TOWER_EQUATION_BLUEPRINTS;

/**
 * Factory responsible for managing tower equation blueprint access, glyph state,
 * and cached equation math independently of the Towers tab UI.
 */
export function createTowerBlueprintPresenter(
  {
    getTowerDefinition,
    getDynamicContext,
    formatters = {},
  }: TowerBlueprintPresenterOptions = {},
): TowerBlueprintPresenterController {
  if (!isTowerDefinitionResolver(getTowerDefinition)) {
    throw new Error('createTowerBlueprintPresenter requires getTowerDefinition.');
  }

  const resolveTowerDefinition = getTowerDefinition;
  const resolveDynamicContext = isDynamicContextProvider(getDynamicContext)
    ? getDynamicContext
    : () => null;
  const formatWholeNumber = isWholeNumberFormatter(formatters.formatWholeNumber)
    ? formatters.formatWholeNumber
    : (value: number) => String(value ?? 0);
  const formatDecimal = isDecimalFormatter(formatters.formatDecimal)
    ? formatters.formatDecimal
    : (value: number) => String(value ?? 0);

  const fallbackTowerBlueprints = new Map<string, TowerEquationBlueprint>();
  const towerUpgradeState = new Map<string, TowerUpgradeState>();
  const towerEquationCache = new Map<string, number>();

  /** Provide a consistent fallback blueprint when a tower lacks authored data. */
  function getTowerEquationBlueprint(
    towerId: string | null | undefined,
  ): TowerEquationBlueprint | null | undefined {
    if (!towerId) {
      return null;
    }
    if (Object.prototype.hasOwnProperty.call(authoredTowerBlueprints, towerId)) {
      return authoredTowerBlueprints[towerId];
    }
    if (fallbackTowerBlueprints.has(towerId)) {
      return fallbackTowerBlueprints.get(towerId);
    }
    const definition = resolveTowerDefinition(towerId);
    if (!definition) {
      return null;
    }
    const fallbackBlueprint: TowerEquationBlueprint = {
      mathSymbol: definition.symbol ? definition.symbol : towerId,
      baseEquation: `\\( ${definition.symbol || towerId} = X \\times Y \\)`,
      variables: [
        {
          key: 'damage',
          symbol: 'X',
          name: 'Damage',
          description: 'Base strike damage coursing through the lattice.',
          stat: 'damage',
          upgradable: false,
          format: (value) => formatWholeNumber(value),
        },
        {
          key: 'rate',
          symbol: 'Y',
          name: 'Attack Speed',
          description: 'Attacks per second released by the glyph.',
          stat: 'rate',
          upgradable: false,
          format: (value) => formatDecimal(value, 2),
        },
      ],
      computeResult(values) {
        const damage = isFiniteNumber(values.damage) ? values.damage : 0;
        const rate = isFiniteNumber(values.rate) ? values.rate : 0;
        return damage * rate;
      },
      formatGoldenEquation({ formatVariable, formatResult }) {
        return `\\( ${formatResult()} = ${formatVariable('damage')} \\times ${formatVariable('rate')} \\)`;
      },
    };
    fallbackTowerBlueprints.set(towerId, fallbackBlueprint);
    return fallbackBlueprint;
  }

  /** Ensure the glyph investment map exists for the requested tower. */
  function ensureTowerUpgradeState(
    towerId: string | null | undefined,
    blueprint: TowerEquationBlueprint | null = null,
  ): TowerUpgradeState {
    if (!towerId) {
      return { variables: {} };
    }
    const effectiveBlueprint = blueprint || getTowerEquationBlueprint(towerId);
    let state = towerUpgradeState.get(towerId);
    if (!state) {
      state = { variables: {} };
      towerUpgradeState.set(towerId, state);
    }
    if (!state.variables) {
      state.variables = {};
    }
    const variables = effectiveBlueprint?.variables || [];
    variables.forEach((variable) => {
      const stateKey = String(variable.key);
      if (!state.variables[stateKey]) {
        state.variables[stateKey] = { level: 0 };
      }
    });
    return state;
  }

  /** Provide a serializable snapshot of all glyph investments. */
  function getTowerUpgradeStateSnapshot(): TowerUpgradeStateSnapshot {
    const snapshot: TowerUpgradeStateSnapshot = {};
    towerUpgradeState.forEach((state, towerId) => {
      if (!state || !state.variables) {
        return;
      }
      const variables: Record<string, SerializedTowerVariableUpgradeState> = {};
      Object.keys(state.variables).forEach((key) => {
        const variableState = state.variables[key];
        if (variableState && isFiniteNumber(variableState.level)) {
          variables[key] = { level: Math.max(0, variableState.level) };
        }
      });
      if (Object.keys(variables).length > 0) {
        snapshot[towerId] = { variables };
      }
    });
    return snapshot;
  }

  /** Restore glyph investments from a serialized snapshot. */
  function applyTowerUpgradeStateSnapshot(snapshot: TowerUpgradeStateSnapshotInput): void {
    if (!isObjectLike(snapshot)) {
      return;
    }
    Object.keys(snapshot).forEach((towerId) => {
      const savedState = snapshot[towerId];
      if (!isObjectLike(savedState) || !isObjectLike(savedState.variables)) {
        return;
      }
      const savedVariables = savedState.variables;
      const blueprint = getTowerEquationBlueprint(towerId);
      const state = ensureTowerUpgradeState(towerId, blueprint);
      Object.keys(savedVariables).forEach((variableKey) => {
        const savedVariable = savedVariables[variableKey];
        if (
          isObjectLike(savedVariable) &&
          isFiniteNumber(savedVariable.level) &&
          savedVariable.level > 0
        ) {
          if (!state.variables[variableKey]) {
            state.variables[variableKey] = { level: 0 };
          }
          state.variables[variableKey].level = Math.max(0, savedVariable.level);
        }
      });
    });
  }

  /** Sum the glyph cost invested across every tower variable. */
  function calculateInvestedGlyphs(): number {
    let total = 0;
    towerUpgradeState.forEach((state, towerId) => {
      if (!state || !state.variables) {
        return;
      }
      const blueprint = getTowerEquationBlueprint(towerId);
      Object.entries(state.variables).forEach(([variableKey, variableState]) => {
        const levels = isFiniteNumber(variableState?.level)
          ? Math.max(0, variableState.level)
          : 0;
        if (levels <= 0) {
          return;
        }
        const variable =
          (blueprint?.variables || []).find((entry) => entry.key === variableKey) || null;
        for (let levelIndex = 0; levelIndex < levels; levelIndex += 1) {
          const cost = calculateTowerVariableUpgradeCost(variable, levelIndex);
          total += Math.max(1, cost);
        }
      });
    });
    return total;
  }

  /** Evaluate the cost progression for a single glyph variable. */
  function calculateTowerVariableUpgradeCost(
    variable: TowerEquationVariable | null | undefined,
    level: number,
  ): number {
    if (!variable) {
      return 1;
    }
    if (typeof variable.cost === 'function') {
      const value = variable.cost(level);
      if (isFiniteNumber(value) && value > 0) {
        return Math.max(1, Math.floor(value));
      }
    } else if (isFiniteNumber(variable.cost)) {
      return Math.max(1, Math.floor(variable.cost));
    }
    return Math.max(1, 1 + level);
  }

  /** Resolve a single blueprint variable value with dependency safeguards. */
  function computeTowerVariableValue(
    towerId: string | null | undefined,
    variableKey: string | null | undefined,
    blueprint: TowerEquationBlueprint | null = null,
    visited: Set<string> = new Set(),
  ): unknown {
    if (!towerId || !variableKey) {
      return 0;
    }
    const effectiveBlueprint = blueprint || getTowerEquationBlueprint(towerId);
    const variable =
      (effectiveBlueprint?.variables || []).find((entry) => entry.key === variableKey) || null;
    if (!variable) {
      return 0;
    }

    if (variable.reference) {
      const referencedValue = calculateTowerEquationResult(variable.reference, visited);
      if (!isFiniteNumber(referencedValue)) {
        return 0;
      }
      if (typeof variable.transform === 'function') {
        return variable.transform(referencedValue);
      }
      if (isFiniteNumber(variable.exponent)) {
        return referencedValue ** variable.exponent;
      }
      return referencedValue;
    }

    const definition = resolveTowerDefinition(towerId);

    if (typeof variable.computeValue === 'function') {
      try {
        const computedValue = variable.computeValue({
          definition,
          towerId,
          blueprint: effectiveBlueprint,
          dynamicContext: resolveDynamicContext(),
        });
        if (isFiniteNumber(computedValue)) {
          return computedValue;
        }
      } catch (error) {
        console.warn('Failed to evaluate custom tower variable computeValue', error);
      }
    }

    let baseValue: unknown = 0;
    if (typeof variable.getBase === 'function') {
      baseValue = variable.getBase({ definition, towerId });
    } else if (variable.stat && isFiniteNumber(definition?.[variable.stat])) {
      baseValue = definition[variable.stat];
    } else if (isFiniteNumber(variable.baseValue)) {
      baseValue = variable.baseValue;
    }
    const normalizedBaseValue = isFiniteNumber(baseValue) ? baseValue : 0;

    const state = ensureTowerUpgradeState(towerId, effectiveBlueprint);
    const level = state.variables?.[variableKey]?.level || 0;
    if (variable.upgradable === false) {
      return normalizedBaseValue;
    }

    const step =
      typeof variable.getStep === 'function'
        ? variable.getStep(level, { definition, towerId })
        : isFiniteNumber(variable.step)
          ? variable.step
          : 0;

    return normalizedBaseValue + level * step;
  }

  /** Evaluate the final blueprint result with memoized recursion protection. */
  function calculateTowerEquationResult(
    towerId: string | null | undefined,
    visited: Set<string> = new Set(),
  ): number {
    if (!towerId) {
      return 0;
    }
    if (towerEquationCache.has(towerId)) {
      return towerEquationCache.get(towerId) ?? 0;
    }
    if (visited.has(towerId)) {
      return 0;
    }
    visited.add(towerId);

    const blueprint = getTowerEquationBlueprint(towerId);
    if (!blueprint) {
      visited.delete(towerId);
      return 0;
    }

    ensureTowerUpgradeState(towerId, blueprint);
    const values: TowerEquationValueMap = {};
    (blueprint.variables || []).forEach((variable) => {
      const valueKey = String(variable.key);
      values[valueKey] = computeTowerVariableValue(
        towerId,
        variable.key,
        blueprint,
        visited,
      );
    });

    let result: unknown = 0;
    if (typeof blueprint.computeResult === 'function') {
      result = blueprint.computeResult(values, { definition: resolveTowerDefinition(towerId) });
    } else {
      result = Object.values(values).reduce<number>((total, value) => {
        const contribution = isFiniteNumber(value) ? value : 0;
        return total === 0 ? contribution : total * contribution;
      }, 0);
    }

    const safeResult = isFiniteNumber(result) ? result : 0;
    towerEquationCache.set(towerId, safeResult);
    visited.delete(towerId);
    return safeResult;
  }

  /** Clear cached equation results so future calls recompute fresh values. */
  function invalidateTowerEquationCache(): void {
    towerEquationCache.clear();
  }

  /** Reset upgrade investments and cached math for one or all towers. */
  function clearTowerUpgradeState(targetTowerId: string | null = null): void {
    if (typeof targetTowerId === 'string' && targetTowerId.trim()) {
      towerUpgradeState.delete(targetTowerId.trim());
    } else {
      towerUpgradeState.clear();
    }
    invalidateTowerEquationCache();
  }

  return {
    getTowerEquationBlueprint,
    ensureTowerUpgradeState,
    getTowerUpgradeStateSnapshot,
    applyTowerUpgradeStateSnapshot,
    calculateInvestedGlyphs,
    calculateTowerVariableUpgradeCost,
    computeTowerVariableValue,
    calculateTowerEquationResult,
    invalidateTowerEquationCache,
    clearTowerUpgradeState,
  };
}
