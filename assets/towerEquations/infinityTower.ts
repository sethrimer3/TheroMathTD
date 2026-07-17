/**
 * Infinity Tower Blueprint
 *
 * The Infinity Tower provides exponential bonuses to all towers within its range.
 * It replaces the Aleph0-Aleph5 series with a unified support tower.
 */

import {
  formatWholeNumber,
  formatDecimal,
  formatGameNumber,
} from '../../scripts/core/formatting.js';
import type {
  TowerEquationBlueprint,
  TowerEquationVariable,
} from '../towerBlueprintPresenter.js';
import { blueprintContext } from './blueprintContext.js';

// Helper function accessor
const ctx = () => blueprintContext;

/**
 * The original module calls context helpers without optional chaining, so an
 * uninitialized slot throws the same TypeError the JavaScript source produced.
 */
function requireHelper<Key extends
  | 'deriveGlyphRankFromLevel'
  | 'getTowerEquationBlueprint'
  | 'ensureTowerUpgradeState'
  | 'computeTowerVariableValue'>(key: Key): NonNullable<(typeof blueprintContext)[Key]> {
  const helper = ctx()[key];
  if (typeof helper !== 'function') {
    throw new TypeError(`ctx(...).${key} is not a function`);
  }
  return helper;
}

/** Match `Number.isFinite` while narrowing equation values to numbers. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Match optional property access for object/function dynamic contexts. */
function readProperty(source: unknown, key: string): unknown {
  if ((typeof source === 'object' && source !== null) || typeof source === 'function') {
    return Reflect.get(source, key);
  }
  return undefined;
}

/** Preserve Math.max's native coercion for a JavaScript-originated unknown value. */
function mathMaxWithUnknown(first: number, second: unknown): number {
  return Reflect.apply(Math.max, undefined, [first, second]);
}

// Euler's number for calculations
const EULER = Math.E; // ≈ 2.71828

/** The six glyph allocation values fused into the Mul sub-equation. */
interface GlyphAllocations {
  aleph: number;
  bet: number;
  lamed: number;
  tsadi: number;
  shin: number;
  kuf: number;
}

/**
 * Compute the 6 glyph allocations for the Mul sub-equation.
 */
function computeGlyphAllocations(
  towerId: string,
  blueprint: TowerEquationBlueprint | null | undefined,
): GlyphAllocations {
  const effectiveBlueprint = blueprint || requireHelper('getTowerEquationBlueprint')(towerId);
  const computeVariableValue = requireHelper('computeTowerVariableValue');
  const alephVal = computeVariableValue(towerId, 'mulAleph', effectiveBlueprint);
  const betVal = computeVariableValue(towerId, 'mulBet', effectiveBlueprint);
  const lamedVal = computeVariableValue(towerId, 'mulLamed', effectiveBlueprint);
  const tsadiVal = computeVariableValue(towerId, 'mulTsadi', effectiveBlueprint);
  const shinVal = computeVariableValue(towerId, 'mulShin', effectiveBlueprint);
  const kufVal = computeVariableValue(towerId, 'mulKuf', effectiveBlueprint);

  return {
    aleph: Math.max(1, isFiniteNumber(alephVal) ? alephVal : 1),
    bet: Math.max(1, isFiniteNumber(betVal) ? betVal : 1),
    lamed: Math.max(1, isFiniteNumber(lamedVal) ? lamedVal : 1),
    tsadi: Math.max(1, isFiniteNumber(tsadiVal) ? tsadiVal : 1),
    shin: Math.max(1, isFiniteNumber(shinVal) ? shinVal : 1),
    kuf: Math.max(1, isFiniteNumber(kufVal) ? kufVal : 1),
  };
}

/**
 * Factory function to create a glyph allocation variable.
 */
function createGlyphVariable(
  key: string,
  symbol: string,
  name: string,
  description: string,
): TowerEquationVariable {
  return {
    key,
    symbol,
    equationSymbol: symbol,
    glyphLabel: symbol,
    name,
    description,
    upgradable: true,
    baseValue: 1,
    step: 1,
    includeInMasterEquation: false,
    format: (value) => `${formatWholeNumber(Math.max(1, value))} ${symbol}`,
    cost: (level) => Math.max(1, Math.floor(5 * Math.pow(1.5, level))),
    computeValue({ blueprint, towerId: tid }) {
      const effectiveBlueprint = blueprint || requireHelper('getTowerEquationBlueprint')(tid);
      const state = requireHelper('ensureTowerUpgradeState')(tid, effectiveBlueprint);
      const level = state.variables?.[key]?.level || 0;
      return Math.max(1, requireHelper('deriveGlyphRankFromLevel')(level, 1));
    },
    getSubEquations({ value }) {
      const rank = Math.max(1, Number.isFinite(value) ? value : 1);
      return [
        {
          expression: String.raw`\( \text{${symbol}} = ${formatWholeNumber(rank)} \)`,
          variant: 'values',
          glyphEquation: true,
        },
      ];
    },
  };
}

export const infinity = {
  mathSymbol: String.raw`\infty`,
  baseEquation: String.raw`\( \infty = \text{Exp} \times \text{Rng} \)`,
  variables: [
    {
      key: 'exponent',
      symbol: 'Exp',
      equationSymbol: 'Exp',
      glyphLabel: 'ℵ₁',
      name: 'Exp',
      description: 'Exponent bonus applied to all towers within range. Equals the natural logarithm of player\'s unspent thero (money).',
      upgradable: true,
      baseValue: 1,
      step: 0.1,
      format: (value) => `${formatDecimal(value, 2)} Exp`,
      cost: (level) => Math.max(1, Math.floor(10 * Math.pow(1.5, level))),
      computeValue({ blueprint, towerId, dynamicContext }) {
        // Get player's unspent thero (money) from dynamic context; the second
        // read preserves the original property-getter call count.
        const unspentThero = Number.isFinite(readProperty(dynamicContext, 'unspentThero'))
          ? mathMaxWithUnknown(1, readProperty(dynamicContext, 'unspentThero'))
          : 1;

        // Get upgrade level for this variable
        const effectiveBlueprint = blueprint || requireHelper('getTowerEquationBlueprint')(towerId);
        const state = requireHelper('ensureTowerUpgradeState')(towerId, effectiveBlueprint);
        const level = state.variables?.exponent?.level || 0;
        const glyphRank = requireHelper('deriveGlyphRankFromLevel')(level, 1);

        // Base exponent is ln(unspentThero), multiplied by glyph rank to reward upgrades
        const baseExponent = Math.log(unspentThero);
        return Math.max(0, baseExponent * glyphRank);
      },
      getSubEquations({ level, value, dynamicContext }) {
        const unspentThero = Number.isFinite(readProperty(dynamicContext, 'unspentThero'))
          ? mathMaxWithUnknown(1, readProperty(dynamicContext, 'unspentThero'))
          : 1;
        const glyphRank = requireHelper('deriveGlyphRankFromLevel')(level, 1);
        const baseExponent = Math.log(unspentThero);
        const exponentValue = Number.isFinite(value) ? value : baseExponent * glyphRank;

        return [
          {
            expression: String.raw`\( \text{Exp} = \ln(\text{þ}) \times \aleph_{1} \)`,
            values: String.raw`\( ${formatDecimal(exponentValue, 2)} = \ln(${formatGameNumber(unspentThero)}) \times ${formatWholeNumber(glyphRank)} \)`,
          },
          {
            expression: String.raw`\( \text{þ} = \text{unspent thero (player money)} \)`,
            variant: 'note',
          },
        ];
      },
    },
    {
      key: 'range',
      symbol: 'Rng',
      equationSymbol: 'Rng',
      glyphLabel: 'ℵ₂',
      name: 'Rng',
      description: 'Radius of effect in meters. Base range is 2×e (Euler\'s number).',
      upgradable: true,
      baseValue: 2 * EULER,
      step: 0.5,
      format: (value) => `${formatDecimal(value, 2)}m`,
      cost: (level) => Math.max(1, Math.floor(15 * Math.pow(1.4, level))),
      computeValue({ blueprint, towerId }) {
        const effectiveBlueprint = blueprint || requireHelper('getTowerEquationBlueprint')(towerId);
        const state = requireHelper('ensureTowerUpgradeState')(towerId, effectiveBlueprint);
        const level = state.variables?.range?.level || 0;
        const glyphRank = requireHelper('deriveGlyphRankFromLevel')(level, 1);

        // Base range is 2×e, extended by glyph upgrades
        const baseRange = 2 * EULER;
        return baseRange + (glyphRank - 1) * 0.5;
      },
      getSubEquations({ level, value }) {
        const glyphRank = requireHelper('deriveGlyphRankFromLevel')(level, 1);
        const rangeValue = Number.isFinite(value) ? value : (2 * EULER);

        return [
          {
            expression: String.raw`\( \text{Rng} = 2e + 0.5(\aleph_{2} - 1) \)`,
            values: String.raw`\( ${formatDecimal(rangeValue, 2)} = ${formatDecimal(2 * EULER, 2)} + 0.5(${formatWholeNumber(glyphRank)} - 1) \)`,
          },
          {
            expression: String.raw`\( e \approx 2.718 \text{ (Euler's number)} \)`,
            variant: 'note',
          },
        ];
      },
    },
    {
      key: 'bonusMultiplier',
      symbol: 'Mul',
      equationSymbol: 'Mul',
      glyphLabel: 'ℵ₃',
      name: 'Mul',
      description: 'Bonus multiplier base derived from a glyph fusion product inside a natural log.',
      upgradable: false,
      baseValue: EULER,
      format: (value) => `×${formatDecimal(value, 2)}`,
      computeValue({ blueprint, towerId }) {
        const glyphAllocations = computeGlyphAllocations(towerId, blueprint);
        const product = Object.values(glyphAllocations).reduce(
          (total, count) => total * count,
          1,
        );
        const fusedMultiplier = Math.log(product);
        return Math.max(1, fusedMultiplier);
      },
      getSubEquations({ blueprint, towerId, value }) {
        const glyphAllocations = computeGlyphAllocations(towerId, blueprint);
        const product = Object.values(glyphAllocations).reduce(
          (total, count) => total * count,
          1,
        );
        const multiplierValue = Number.isFinite(value) ? value : Math.max(1, Math.log(product));

        return [
          {
            expression: String.raw`\( \text{Mul} = \ln(\aleph \times \text{ב} \times \text{ל} \times \text{צ} \times \text{ש} \times \text{ק}) \)`,
            values: String.raw`\( ${formatDecimal(multiplierValue, 2)} = \ln(${formatWholeNumber(glyphAllocations.aleph)} \times ${formatWholeNumber(glyphAllocations.bet)} \times ${formatWholeNumber(glyphAllocations.lamed)} \times ${formatWholeNumber(glyphAllocations.tsadi)} \times ${formatWholeNumber(glyphAllocations.shin)} \times ${formatWholeNumber(glyphAllocations.kuf)}) \)`,
            glyphEquation: true,
          },
          {
            expression: String.raw`\( \text{Allocate glyphs below to boost the fused product} \)`,
            variant: 'note',
          },
        ];
      },
    },
    // Individual glyph allocation variables for the Mul sub-equation
    createGlyphVariable('mulAleph', 'ℵ', 'ℵ Glyph', 'Allocate Aleph glyphs to boost the Mul fusion product.'),
    createGlyphVariable('mulBet', 'ב', 'ב Glyph', 'Allocate Bet glyphs to boost the Mul fusion product.'),
    createGlyphVariable('mulLamed', 'ל', 'ל Glyph', 'Allocate Lamed glyphs to boost the Mul fusion product.'),
    createGlyphVariable('mulTsadi', 'צ', 'צ Glyph', 'Allocate Tsadi glyphs to boost the Mul fusion product.'),
    createGlyphVariable('mulShin', 'ש', 'ש Glyph', 'Allocate Shin glyphs to boost the Mul fusion product.'),
    createGlyphVariable('mulKuf', 'ק', 'ק Glyph', 'Allocate Kuf glyphs to boost the Mul fusion product.'),
  ],
  computeResult(values) {
    const exp = isFiniteNumber(values.exponent) ? values.exponent : 0;
    const range = isFiniteNumber(values.range) ? values.range : (2 * EULER);

    // The "power" of infinity tower is the product of its stats
    // This doesn't directly translate to damage but represents its support capability
    return Math.max(0, exp * range);
  },
  formatBaseEquationValues({ values, result, formatComponent }) {
    const exp = isFiniteNumber(values.exponent) ? values.exponent : 0;
    const range = isFiniteNumber(values.range) ? values.range : (2 * EULER);

    return `${formatComponent(result)} = ${formatComponent(exp)} × ${formatComponent(range)}`;
  },
} satisfies TowerEquationBlueprint;
