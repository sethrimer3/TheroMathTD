import { formatWholeNumber } from '../../scripts/core/formatting.js';
import type { TowerEquationBlueprint } from '../towerBlueprintPresenter.js';

/** Match Number.isFinite's existing number-only acceptance at an unknown value boundary. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Mind Gate blueprint with two directly upgradeable glyph conduits. */
export const mindGate = {
  mathSymbol: String.raw`\mathfrak{G}`,
  baseEquation: String.raw`\( \mathfrak{G} = \text{Life} \times \text{Regeneration} \)`,
  variables: [
    {
      key: 'life',
      symbol: 'Life',
      name: 'Life',
      masterEquationSymbol: 'Life',
      description: 'Glyph lifeforce braided into the Mind Gate core.',
      baseValue: 1,
      step: 1,
      upgradable: true,
      format: (value) => `${formatWholeNumber(value)} ℵ₁`,
      cost: (level) => Math.max(1, 1 + level),
      getSubEquations({ level, value }) {
        const invested = Math.max(0, Number.isFinite(level) ? level : 0);
        const rank = Math.max(1, Number.isFinite(value) ? value : 1);
        return [
          {
            expression: String.raw`\( \text{Life} = 100^{\aleph_{1} / \aleph_{2}} \)`,
          },
          {
            values: String.raw`\( ${formatWholeNumber(rank)} = 1 + ${formatWholeNumber(invested)} \)`,
            variant: 'values',
            glyphEquation: true,
          },
        ];
      },
    },
    {
      key: 'recovery',
      symbol: 'Reg',
      name: 'Regeneration',
      masterEquationSymbol: 'Reg',
      description: 'Restorative glyph cadence that rethreads the gate between waves.',
      baseValue: 2,
      step: 1,
      upgradable: true,
      format: (value) => `${formatWholeNumber(value)} ℵ₂`,
      cost: (level) => Math.max(1, 2 + level),
      getSubEquations({ level, value }) {
        const invested = Math.max(0, Number.isFinite(level) ? level : 0);
        const rank = Math.max(1, Number.isFinite(value) ? value : 2);
        return [
          {
            expression: String.raw`\( \text{Reg} = \frac{100 \times \aleph_{2}}{\aleph_{1}} \)`,
          },
          {
            values: String.raw`\( ${formatWholeNumber(rank)} = 2 + ${formatWholeNumber(invested)} \)`,
            variant: 'values',
            glyphEquation: true,
          },
        ];
      },
    },
  ],
  computeResult(values) {
    const life = Math.max(1, isFiniteNumber(values.life) ? values.life : 1);
    const recovery = Math.max(1, isFiniteNumber(values.recovery) ? values.recovery : 1);
    return life * recovery;
  },
  formatGoldenEquation({ formatVariable, formatResult }) {
    return String.raw`\( ${formatResult()} = ${formatVariable('life')} \times ${formatVariable('recovery')} \)`;
  },
} satisfies TowerEquationBlueprint;
