/**
 * T1 Tower definition — plots a polar rose graph around itself.
 * The glowing tracer head sweeps the curve continuously, leaving a damaging trail.
 */
import type { TowerDefinition } from './types.js';

export const T1_TOWER = Object.freeze({
  id: 't1',
  symbol: 'T₁',
  name: 'T₁ Tower',
  tier: 0,
  baseCost: 1,
  damage: 10,
  rate: 0,
  range: 0.4,
  diameterMeters: 1,
  icon: 'assets/images/tower-t1.svg',
} as const satisfies TowerDefinition);

export default T1_TOWER;
