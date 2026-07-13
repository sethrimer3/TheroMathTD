/**
 * Delta Tower definition extracted from the gameplay configuration.
 */
import type { TowerDefinition } from './types.js';

export const DELTA_TOWER = Object.freeze({
  id: 'delta',
  symbol: 'δ',
  name: 'δ Tower',
  tier: 4,
  baseCost: 10000,
  damage: 56,
  rate: 0.95,
  range: 0.44,
  icon: 'assets/images/tower-delta.svg',
  nextTierId: 'epsilon',
} as const satisfies TowerDefinition);

export default DELTA_TOWER;
