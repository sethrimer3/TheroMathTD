/**
 * Gamma Tower definition extracted from the gameplay configuration.
 */
import type { TowerDefinition } from './types.js';

export const GAMMA_TOWER = Object.freeze({
  id: 'gamma',
  symbol: 'γ',
  name: 'γ Tower',
  tier: 3,
  baseCost: 1000,
  damage: 72,
  rate: 1.2,
  range: 0.28,
  icon: 'assets/images/tower-gamma.svg',
  nextTierId: 'delta',
} as const satisfies TowerDefinition);

export default GAMMA_TOWER;
