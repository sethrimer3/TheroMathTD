import { TOWER_EQUATION_BLUEPRINTS } from './towerEquations/index.js';
/** Preserve the original function-only dependency validation while narrowing unknown input. */
function isTowerDefinitionResolver(value) {
    return typeof value === 'function';
}
/** Preserve the original optional dynamic-context fallback check. */
function isDynamicContextProvider(value) {
    return typeof value === 'function';
}
/** Preserve the original optional formatter fallback checks. */
function isWholeNumberFormatter(value) {
    return typeof value === 'function';
}
function isDecimalFormatter(value) {
    return typeof value === 'function';
}
/** Match the original truthy object boundary, including arrays. */
function isObjectLike(value) {
    return typeof value === 'object' && value !== null;
}
/** Match `Number.isFinite` while narrowing the accepted value to a number. */
function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}
const authoredTowerBlueprints = TOWER_EQUATION_BLUEPRINTS;
/**
 * Factory responsible for managing tower equation blueprint access, glyph state,
 * and cached equation math independently of the Towers tab UI.
 */
export function createTowerBlueprintPresenter({ getTowerDefinition, getDynamicContext, formatters = {}, } = {}) {
    if (!isTowerDefinitionResolver(getTowerDefinition)) {
        throw new Error('createTowerBlueprintPresenter requires getTowerDefinition.');
    }
    const resolveTowerDefinition = getTowerDefinition;
    const resolveDynamicContext = isDynamicContextProvider(getDynamicContext)
        ? getDynamicContext
        : () => null;
    const formatWholeNumber = isWholeNumberFormatter(formatters.formatWholeNumber)
        ? formatters.formatWholeNumber
        : (value) => String(value ?? 0);
    const formatDecimal = isDecimalFormatter(formatters.formatDecimal)
        ? formatters.formatDecimal
        : (value) => String(value ?? 0);
    const fallbackTowerBlueprints = new Map();
    const towerUpgradeState = new Map();
    const towerEquationCache = new Map();
    /** Provide a consistent fallback blueprint when a tower lacks authored data. */
    function getTowerEquationBlueprint(towerId) {
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
        const fallbackBlueprint = {
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
    function ensureTowerUpgradeState(towerId, blueprint = null) {
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
    function getTowerUpgradeStateSnapshot() {
        const snapshot = {};
        towerUpgradeState.forEach((state, towerId) => {
            if (!state || !state.variables) {
                return;
            }
            const variables = {};
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
    function applyTowerUpgradeStateSnapshot(snapshot) {
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
                if (isObjectLike(savedVariable) &&
                    isFiniteNumber(savedVariable.level) &&
                    savedVariable.level > 0) {
                    if (!state.variables[variableKey]) {
                        state.variables[variableKey] = { level: 0 };
                    }
                    state.variables[variableKey].level = Math.max(0, savedVariable.level);
                }
            });
        });
    }
    /** Sum the glyph cost invested across every tower variable. */
    function calculateInvestedGlyphs() {
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
                const variable = (blueprint?.variables || []).find((entry) => entry.key === variableKey) || null;
                for (let levelIndex = 0; levelIndex < levels; levelIndex += 1) {
                    const cost = calculateTowerVariableUpgradeCost(variable, levelIndex);
                    total += Math.max(1, cost);
                }
            });
        });
        return total;
    }
    /** Evaluate the cost progression for a single glyph variable. */
    function calculateTowerVariableUpgradeCost(variable, level) {
        if (!variable) {
            return 1;
        }
        if (typeof variable.cost === 'function') {
            const value = variable.cost(level);
            if (isFiniteNumber(value) && value > 0) {
                return Math.max(1, Math.floor(value));
            }
        }
        else if (isFiniteNumber(variable.cost)) {
            return Math.max(1, Math.floor(variable.cost));
        }
        return Math.max(1, 1 + level);
    }
    /** Resolve a single blueprint variable value with dependency safeguards. */
    function computeTowerVariableValue(towerId, variableKey, blueprint = null, visited = new Set()) {
        if (!towerId || !variableKey) {
            return 0;
        }
        const effectiveBlueprint = blueprint || getTowerEquationBlueprint(towerId);
        const variable = (effectiveBlueprint?.variables || []).find((entry) => entry.key === variableKey) || null;
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
            }
            catch (error) {
                console.warn('Failed to evaluate custom tower variable computeValue', error);
            }
        }
        let baseValue = 0;
        if (typeof variable.getBase === 'function') {
            baseValue = variable.getBase({ definition, towerId });
        }
        else if (variable.stat && isFiniteNumber(definition?.[variable.stat])) {
            baseValue = definition[variable.stat];
        }
        else if (isFiniteNumber(variable.baseValue)) {
            baseValue = variable.baseValue;
        }
        const normalizedBaseValue = isFiniteNumber(baseValue) ? baseValue : 0;
        const state = ensureTowerUpgradeState(towerId, effectiveBlueprint);
        const level = state.variables?.[variableKey]?.level || 0;
        if (variable.upgradable === false) {
            return normalizedBaseValue;
        }
        const step = typeof variable.getStep === 'function'
            ? variable.getStep(level, { definition, towerId })
            : isFiniteNumber(variable.step)
                ? variable.step
                : 0;
        return normalizedBaseValue + level * step;
    }
    /** Evaluate the final blueprint result with memoized recursion protection. */
    function calculateTowerEquationResult(towerId, visited = new Set()) {
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
        const values = {};
        (blueprint.variables || []).forEach((variable) => {
            const valueKey = String(variable.key);
            values[valueKey] = computeTowerVariableValue(towerId, variable.key, blueprint, visited);
        });
        let result = 0;
        if (typeof blueprint.computeResult === 'function') {
            result = blueprint.computeResult(values, { definition: resolveTowerDefinition(towerId) });
        }
        else {
            result = Object.values(values).reduce((total, value) => {
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
    function invalidateTowerEquationCache() {
        towerEquationCache.clear();
    }
    /** Reset upgrade investments and cached math for one or all towers. */
    function clearTowerUpgradeState(targetTowerId = null) {
        if (typeof targetTowerId === 'string' && targetTowerId.trim()) {
            towerUpgradeState.delete(targetTowerId.trim());
        }
        else {
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
