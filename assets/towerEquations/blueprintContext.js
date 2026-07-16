/**
 * Mutable dependency container retained by every importing equation module.
 * Initialization mutates this object in place so previously imported references stay live.
 */
export const blueprintContext = {
    deriveGlyphRankFromLevel: null,
    getTowerEquationBlueprint: null,
    ensureTowerUpgradeState: null,
    calculateTowerEquationResult: null,
    getDynamicConnectionCount: null,
    getTowerDefinition: null,
    computeTowerVariableValue: null,
};
export function initializeBlueprintContext(helpers) {
    Object.assign(blueprintContext, helpers);
}
