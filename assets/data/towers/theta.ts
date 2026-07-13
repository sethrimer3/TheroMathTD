/**
 * Theta Tower definition extracted from the gameplay configuration.
 */
import type { TowerDefinition } from './types.js';

export const THETA_TOWER = Object.freeze({
  id: 'theta',
  symbol: 'θ',
  name: 'θ Tower',
  tier: 8,
  baseCost: 4000000,
  damage: 132,
  rate: 0.98,
  range: 0.1,
  icon: 'assets/images/tower-theta.svg',
  nextTierId: 'iota',
} as const satisfies TowerDefinition);

export default THETA_TOWER;
