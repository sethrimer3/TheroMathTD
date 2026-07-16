import type {
  TowerBlueprintPresenterController,
  TowerEquationDefinition,
} from '../towerBlueprintPresenter.js';

type PresenterContextHelpers = Pick<
  TowerBlueprintPresenterController,
  | 'getTowerEquationBlueprint'
  | 'ensureTowerUpgradeState'
  | 'calculateTowerEquationResult'
  | 'computeTowerVariableValue'
>;

/** Normalize a possibly malformed glyph level and optional minimum into a rank. */
export type DeriveGlyphRankFromLevel = (level: unknown, minimum?: unknown) => number;

/** Read the live connection count for one tower-type identifier. */
export type GetDynamicConnectionCount = (
  towerType: string | null | undefined,
) => number;

/** Resolve live tower metadata through the Towers-tab definition map. */
export type GetTowerDefinition = (
  towerId: string | null | undefined,
) => TowerEquationDefinition | null;

/** The seven helpers injected by the Towers tab after module initialization. */
export interface TowerBlueprintContextHelpers extends PresenterContextHelpers {
  deriveGlyphRankFromLevel: DeriveGlyphRankFromLevel;
  getDynamicConnectionCount: GetDynamicConnectionCount;
  getTowerDefinition: GetTowerDefinition;
}

/** Stable shared object whose known helper slots remain nullable until initialization. */
export type TowerBlueprintContext = {
  [Key in keyof TowerBlueprintContextHelpers]: TowerBlueprintContextHelpers[Key] | null;
} & {
  [key: string]: unknown;
  [key: symbol]: unknown;
};

/**
 * Mutable dependency container retained by every importing equation module.
 * Initialization mutates this object in place so previously imported references stay live.
 */
export const blueprintContext: TowerBlueprintContext = {
  deriveGlyphRankFromLevel: null,
  getTowerEquationBlueprint: null,
  ensureTowerUpgradeState: null,
  calculateTowerEquationResult: null,
  getDynamicConnectionCount: null,
  getTowerDefinition: null,
  computeTowerVariableValue: null,
};

/** Merge a partial or JavaScript-originated source with native Object.assign semantics. */
export function initializeBlueprintContext(
  helpers?: Partial<TowerBlueprintContextHelpers> | null,
): void;
export function initializeBlueprintContext(helpers?: unknown): void;
export function initializeBlueprintContext(helpers?: unknown): void {
  Object.assign(blueprintContext, helpers);
}
