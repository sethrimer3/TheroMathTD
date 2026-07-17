/**
 * Basic Tower Blueprints
 *
 * Foundational towers that form the core progression: alpha, beta, gamma.
 * These towers introduce players to the basic mechanics and upgrade systems.
 */

import {
  formatWholeNumber,
  formatDecimal,
  formatGameNumber,
} from '../../scripts/core/formatting.js';
import type {
  TowerEquationBlueprint,
  TowerUpgradeState,
} from '../towerBlueprintPresenter.js';
import { blueprintContext } from './blueprintContext.js';

// Helper function accessors for cleaner code
const ctx = () => blueprintContext;

/**
 * The original module calls context helpers without optional chaining, so an
 * uninitialized slot throws the same TypeError the JavaScript source produced.
 */
function requireHelper<Key extends
  | 'deriveGlyphRankFromLevel'
  | 'getTowerEquationBlueprint'
  | 'ensureTowerUpgradeState'
  | 'calculateTowerEquationResult'
  | 'getDynamicConnectionCount'
  | 'computeTowerVariableValue'>(key: Key): NonNullable<(typeof blueprintContext)[Key]> {
  const helper = ctx()[key];
  if (typeof helper !== 'function') {
    throw new TypeError(`ctx(...).${key} is not a function`);
  }
  return helper;
}

/** Preserve Math.max's native coercion for a JavaScript-originated unknown value. */
function mathMaxWithUnknown(first: number, second: unknown): number {
  return Reflect.apply(Math.max, undefined, [first, second]);
}

/** Match `Number.isFinite` while narrowing equation values to numbers. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Read one presenter-owned upgrade level with the original `|| 0` fallback. */
function readUpgradeLevel(state: TowerUpgradeState, key: string): number {
  return state.variables?.[key]?.level || 0;
}

// Render Bet₁ with a dagesh and an enforced left-to-right order so the subscript stays on the right.
const BET1_GLYPH = '\u2066\u05D1\u05BC\u2081\u2069';

export const alpha = {
  mathSymbol: String.raw`\alpha`,
  baseEquation: 'α = Atk × Spd',
  variables: [
    {
      key: 'atk',
      symbol: 'Atk',
      equationSymbol: 'Atk',
      glyphLabel: 'ℵ₁',
      name: 'Atk',
      description: 'Projectile damage carried by each glyph bullet.',
      baseValue: 5,
      step: 5,
      upgradable: true,
      format: (value) => `${formatWholeNumber(value)} Atk`,
      cost: (level) => Math.max(1, 1 + level),
      getSubEquations({ level, value }) {
        const glyphRank = requireHelper('deriveGlyphRankFromLevel')(level, 1);
        const attackValue = Number.isFinite(value) ? value : 0;
        return [
          {
            expression: String.raw`\( \text{Atk} = 5 \times \aleph_{1} \)`,
            values: String.raw`\( ${formatWholeNumber(attackValue)} = 5 \times ${formatWholeNumber(glyphRank)} \)`,
          },
        ];
      },
    },
    {
      key: 'speed',
      symbol: 'Spd',
      equationSymbol: 'Spd',
      glyphLabel: 'ℵ₂',
      name: 'Spd',
      description: 'Oscillation cadence braided from the second glyph conduit.',
      baseValue: 0.5,
      step: 0.5,
      upgradable: true,
      format: (value) => `${formatDecimal(value, 2)} Spd`,
      getSubEquations({ level, value }) {
        const glyphRank = requireHelper('deriveGlyphRankFromLevel')(level, 1);
        const speedValue = Number.isFinite(value) ? value : glyphRank * 0.5;
        return [
          {
            expression: String.raw`\( \text{Spd} = 0.5 \times \aleph_{2} \)`,
            values: String.raw`\( ${formatDecimal(speedValue, 2)} = 0.5 \times ${formatDecimal(glyphRank, 2)} \)`,
          },
        ];
      },
    },
  ],
  computeResult(values) {
    const attack = isFiniteNumber(values.atk) ? values.atk : 0;
    const speed = isFiniteNumber(values.speed) ? values.speed : 0;
    return attack * speed;
  },
  formatBaseEquationValues({ values, result, formatComponent }) {
    const attack = isFiniteNumber(values.atk) ? values.atk : 0;
    const speed = isFiniteNumber(values.speed) ? values.speed : 0;
    return `${formatComponent(result)} = ${formatComponent(attack)} × ${formatComponent(speed)}`;
  },
} satisfies TowerEquationBlueprint;

export const beta = {
  mathSymbol: String.raw`\beta`,
  baseEquation: 'β = Atk × Spd × Rng × Slw',
  variables: [
    {
      key: 'attack',
      symbol: 'Atk',
      equationSymbol: 'Atk',
      glyphLabel: 'ℵ₁',
      name: 'Atk',
      description: 'Direct strike power mirrored from α.',
      upgradable: true,
      format: (value) => `${formatGameNumber(value)} Atk`,
      computeValue({ blueprint, towerId }) {
        const effectiveBlueprint = blueprint || requireHelper('getTowerEquationBlueprint')(towerId);
        const state = requireHelper('ensureTowerUpgradeState')(towerId, effectiveBlueprint);
        const level = readUpgradeLevel(state, 'attack');
        const glyphRank = requireHelper('deriveGlyphRankFromLevel')(level, 1);
        const alphaValue = requireHelper('calculateTowerEquationResult')('alpha');
        return alphaValue * glyphRank;
      },
      getSubEquations({ level }) {
        const glyphRank = requireHelper('deriveGlyphRankFromLevel')(level, 1);
        const alphaValue = requireHelper('calculateTowerEquationResult')('alpha');
        const attackValue = alphaValue * glyphRank;
        return [
          {
            expression: String.raw`\( \text{Atk} = \alpha \times \aleph_{1} \)`,
            values: String.raw`\( ${formatDecimal(attackValue, 2)} = ${formatDecimal(alphaValue, 2)} \times ${formatWholeNumber(glyphRank)} \)`,
          },
        ];
      },
    },
    {
      key: 'speed',
      symbol: 'Spd',
      equationSymbol: 'Spd',
      name: 'Spd',
      description: 'Cadence accelerated by neighbouring α lattices.',
      upgradable: false,
      lockedNote: 'Connect α lattices to accelerate β cadence.',
      computeValue() {
        const alphaConnections = requireHelper('getDynamicConnectionCount')('alpha');
        return 0.5 + 1.5 * alphaConnections;
      },
      format: (value) => `${formatDecimal(value, 2)} Spd`,
      getSubEquations() {
        const alphaConnections = requireHelper('getDynamicConnectionCount')('alpha');
        const speedValue = 0.5 + 1.5 * alphaConnections;
        return [
          {
            expression: String.raw`\( \text{Spd} = 0.5 + 1.5 \left( \alpha_{\beta} \right) \)`,
            values: String.raw`\( ${formatDecimal(speedValue, 2)} = 0.5 + 1.5 \left( ${formatWholeNumber(alphaConnections)} \right) \)`,
          },
        ];
      },
    },
    {
      key: 'range',
      symbol: 'Rng',
      equationSymbol: 'Rng',
      name: 'Rng',
      description: 'Coverage extended by α lattice entanglement.',
      upgradable: false,
      lockedNote: 'Entangle α lattices to extend β reach.',
      computeValue() {
        return 1 + requireHelper('getDynamicConnectionCount')('alpha');
      },
      format: (value) => `${formatDecimal(value, 2)} Rng`,
      getSubEquations() {
        const alphaConnections = requireHelper('getDynamicConnectionCount')('alpha');
        const rangeValue = 1 + alphaConnections;
        return [
          {
            expression: String.raw`\( \text{Rng} = 1 + \left( \alpha_{\beta} \right) \)`,
            values: String.raw`\( ${formatDecimal(rangeValue, 2)} = 1 + \left( ${formatWholeNumber(alphaConnections)} \right) \)`,
          },
        ];
      },
    },
    // Well glyph sink that fuels beta's slowing field potency.
    {
      key: 'betSlow',
      symbol: BET1_GLYPH,
      equationSymbol: 'Bet₁',
      glyphLabel: BET1_GLYPH,
      name: 'Bet₁ Slow Weave',
      description: 'Invest Bet glyphs to deepen β’s slowing field.',
      baseValue: 0,
      step: 1,
      upgradable: true,
      glyphCurrency: 'aleph',
      attachedToVariable: 'slw',
      format: (value) => formatWholeNumber(Math.max(0, value)),
      cost: (level) => Math.max(1, 1 + Math.max(0, Math.floor(Number.isFinite(level) ? level : 0))),
      renderControlsInline: true,
    },
    // Derived slow percentage surfaced as its own sub-equation box for clarity.
    {
      key: 'slw',
      symbol: 'Slw%',
      equationSymbol: 'Slw%',
      masterEquationSymbol: 'Slw',
      name: 'Slow Field',
      description: 'Percentage of enemy speed β shears away within its conduit.',
      upgradable: false,
      format: (value) => `${formatDecimal(Math.max(0, value), 2)}% slow`,
      computeValue({ blueprint, towerId }) {
        const effectiveBlueprint = blueprint || requireHelper('getTowerEquationBlueprint')(towerId);
        const bet1 = mathMaxWithUnknown(
          0,
          requireHelper('computeTowerVariableValue')(towerId, 'betSlow', effectiveBlueprint),
        );
        const slowPercent = 20 + 2 * bet1;
        return Math.min(60, Math.max(0, slowPercent));
      },
      getSubEquations({ blueprint, towerId }) {
        const effectiveBlueprint = blueprint || requireHelper('getTowerEquationBlueprint')(towerId);
        const bet1 = mathMaxWithUnknown(
          0,
          requireHelper('computeTowerVariableValue')(towerId, 'betSlow', effectiveBlueprint),
        );
        const slowPercent = Math.min(60, Math.max(0, 20 + 2 * bet1));
        return [
          {
            expression: String.raw`\( \text{Slw\%} = 20 + 2\,\text{Bet}_{1} \)`,
            values: String.raw`\( ${formatDecimal(slowPercent, 2)}\% = 20 + 2 \times ${formatWholeNumber(bet1)} \)`,
          },
          {
            expression: String.raw`\( \text{Slw\%} \leq 60 \)`,
            glyphEquation: true,
          },
        ];
      },
    },
    {
      key: 'slwTime',
      symbol: 'SlwTime',
      equationSymbol: 'SlwTime',
      masterEquationSymbol: 'SlwTime',
      name: 'Slow Duration',
      description: 'Length of β’s slowing tether after it sticks to a target.',
      attachedToVariable: 'slw',
      includeInMasterEquation: false,
      baseValue: 0.5,
      step: 0.1,
      upgradable: true,
      cost: (level) => Math.max(1, Math.pow(2, Math.max(0, level))),
      format: (value) => `${formatDecimal(Math.max(0, value), 2)} s`,
      getSubEquations({ level, value }) {
        const glyphRank = requireHelper('deriveGlyphRankFromLevel')(level, 0);
        const durationSeconds = Number.isFinite(value) ? Math.max(0, value) : 0.5 + 0.1 * glyphRank;
        return [
          {
            expression: String.raw`\( \text{SlwTime} = 0.5 + 0.1\,\aleph \)`,
            values: String.raw`\( ${formatDecimal(durationSeconds, 2)} = 0.5 + 0.1 \times ${formatWholeNumber(
              glyphRank,
            )} \)`,
          },
        ];
      },
    },
  ],
  computeResult(values) {
    const attack = isFiniteNumber(values.attack) ? values.attack : 0;
    const speed = isFiniteNumber(values.speed) ? values.speed : 0;
    const range = isFiniteNumber(values.range) ? values.range : 0;
    const slowPercent = isFiniteNumber(values.slw) ? Math.max(0, values.slw) : 0;
    const slowFactor = slowPercent / 100;
    return attack * speed * range * slowFactor;
  },
  formatBaseEquationValues({ values, result, formatComponent }) {
    const attack = isFiniteNumber(values.attack) ? values.attack : 0;
    const speed = isFiniteNumber(values.speed) ? values.speed : 0;
    const range = isFiniteNumber(values.range) ? values.range : 0;
    const slowPercent = isFiniteNumber(values.slw) ? Math.max(0, values.slw) : 0;
    const slowText = `${formatComponent(slowPercent)}%`;
    return `${formatComponent(result)} = ${formatComponent(attack)} × ${formatComponent(speed)} × ${formatComponent(range)} × ${slowText}`;
  },
} satisfies TowerEquationBlueprint;

export const gamma = {
  mathSymbol: String.raw`\gamma`,
  baseEquation: 'γ = Atk × Spd × Rng × Prc × Brst',
  variables: [
    {
      key: 'attack',
      symbol: 'Atk',
      equationSymbol: 'Atk',
      glyphLabel: 'ℵ₁',
      name: 'Atk',
      description: 'Strike intensity carried forward from β.',
      upgradable: true,
      format: (value) => `${formatGameNumber(value)} Atk`,
      computeValue({ blueprint, towerId }) {
        const effectiveBlueprint = blueprint || requireHelper('getTowerEquationBlueprint')(towerId);
        const state = requireHelper('ensureTowerUpgradeState')(towerId, effectiveBlueprint);
        const level = readUpgradeLevel(state, 'attack');
        const glyphRank = requireHelper('deriveGlyphRankFromLevel')(level, 1);
        const betaValue = requireHelper('calculateTowerEquationResult')('beta');
        return betaValue * glyphRank;
      },
      getSubEquations({ level }) {
        const glyphRank = requireHelper('deriveGlyphRankFromLevel')(level, 1);
        const betaValue = requireHelper('calculateTowerEquationResult')('beta');
        const attackValue = betaValue * glyphRank;
        return [
          {
            expression: String.raw`\( \text{Atk} = \beta \times \aleph_{1} \)`,
            values: String.raw`\( ${formatDecimal(attackValue, 2)} = ${formatDecimal(betaValue, 2)} \times ${formatWholeNumber(glyphRank)} \)`,
          },
        ];
      },
    },
    {
      key: 'speed',
      symbol: 'Spd',
      equationSymbol: 'Spd',
      name: 'Spd',
      description: 'Cadence tuned by neighbouring α lattices.',
      upgradable: false,
      lockedNote: 'Link α lattices to accelerate γ cadence.',
      computeValue() {
        const alphaConnections = requireHelper('getDynamicConnectionCount')('alpha');
        return 0.5 + 0.25 * alphaConnections;
      },
      format: (value) => `${formatDecimal(value, 2)} Spd`,
      getSubEquations() {
        const alphaConnections = requireHelper('getDynamicConnectionCount')('alpha');
        const speedValue = 0.5 + 0.25 * alphaConnections;
        return [
          {
            expression: String.raw`\( \text{Spd} = 0.5 + 0.25 \left( \alpha_{\gamma} \right) \)`,
            values: String.raw`\( ${formatDecimal(speedValue, 2)} = 0.5 + 0.25 \left( ${formatWholeNumber(alphaConnections)} \right) \)`,
          },
        ];
      },
    },
    {
      key: 'range',
      symbol: 'Rng',
      equationSymbol: 'Rng',
      name: 'Rng',
      description: 'Arc reach extended by neighbouring β conductors.',
      upgradable: false,
      lockedNote: 'Bind β lattices to extend γ reach.',
      computeValue() {
        const betaConnections = requireHelper('getDynamicConnectionCount')('beta');
        return 1 + 2 * betaConnections;
      },
      format: (value) => `${formatDecimal(value, 2)} Rng`,
      getSubEquations() {
        const betaConnections = requireHelper('getDynamicConnectionCount')('beta');
        const rangeValue = 1 + 2 * betaConnections;
        return [
          {
            expression: String.raw`\( \text{Rng} = 1 + 2 \left( \beta_{\gamma} \right) \)`,
            values: String.raw`\( ${formatDecimal(rangeValue, 2)} = 1 + 2 \left( ${formatWholeNumber(betaConnections)} \right) \)`,
          },
        ];
      },
    },
    {
      key: 'pierce',
      symbol: 'Prc',
      equationSymbol: 'Prc',
      glyphLabel: 'ℵ₂',
      name: 'Prc',
      description: 'Piercing depth braided from the second glyph conduit.',
      baseValue: 1,
      step: 1,
      upgradable: true,
      format: (value) => `${formatWholeNumber(value)} Prc`,
      getSubEquations({ level, value }) {
        const glyphRank = requireHelper('deriveGlyphRankFromLevel')(level, 1);
        const pierceValue = Number.isFinite(value) ? value : glyphRank;
        return [
          {
            expression: String.raw`\( \text{Prc} = \aleph_{2} \)`,
            values: String.raw`\( ${formatWholeNumber(pierceValue)} = ${formatWholeNumber(glyphRank)} \)`,
          },
        ];
      },
    },
    {
      key: 'brst',
      symbol: 'Brst',
      equationSymbol: 'Brst',
      masterEquationSymbol: 'Brst',
      glyphLabel: 'ℵ',
      name: 'Brst',
      description: 'Time γ keeps orbiting a target with star-tracing hits.',
      baseValue: 5,
      step: 5,
      upgradable: true,
      cost: (level) => Math.max(1, 5 * Math.pow(5, Math.max(0, level))),
      format: (value) => `${formatDecimal(Math.max(0, value), 2)} s`,
      getSubEquations({ level, value }) {
        const glyphRank = requireHelper('deriveGlyphRankFromLevel')(level, 0);
        const burstSeconds = Number.isFinite(value) ? Math.max(0, value) : 5 * (1 + glyphRank);
        return [
          {
            expression: String.raw`\( \text{Brst} = 5 \times (1 + \aleph) \)`,
            values: String.raw`\( ${formatDecimal(burstSeconds, 2)} = 5 \times (1 + ${formatWholeNumber(glyphRank)}) \)`,
          },
        ];
      },
    },
  ],
  computeResult(values) {
    const attack = isFiniteNumber(values.attack) ? values.attack : 0;
    const speed = isFiniteNumber(values.speed) ? values.speed : 0;
    const range = isFiniteNumber(values.range) ? values.range : 0;
    const pierce = isFiniteNumber(values.pierce) ? values.pierce : 0;
    const burst = isFiniteNumber(values.brst) ? values.brst : 0;
    return attack * speed * range * pierce * burst;
  },
  formatBaseEquationValues({ values, result, formatComponent }) {
    const attack = isFiniteNumber(values.attack) ? values.attack : 0;
    const speed = isFiniteNumber(values.speed) ? values.speed : 0;
    const range = isFiniteNumber(values.range) ? values.range : 0;
    const pierce = isFiniteNumber(values.pierce) ? values.pierce : 0;
    const burst = isFiniteNumber(values.brst) ? values.brst : 0;
    const burstText = `${formatComponent(burst)}s`;
    return `${formatComponent(result)} = ${formatComponent(attack)} × ${formatComponent(speed)} × ${formatComponent(range)} × ${formatComponent(pierce)} × ${burstText}`;
  },
} satisfies TowerEquationBlueprint;
