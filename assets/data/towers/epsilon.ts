/**
 * Epsilon Tower definition extracted from the gameplay configuration.
 */
import type { TowerDefinition } from './types.js';

export const EPSILON_TOWER = Object.freeze({
  id: 'epsilon',
  symbol: 'ε',
  name: 'ε Tower',
  tier: 5,
  baseCost: 50000,
  damage: 44,
  rate: 1.4,
  range: 0.26,
  icon: 'assets/images/tower-epsilon.svg',
  nextTierId: 'zeta',
} as const satisfies TowerDefinition);

export default EPSILON_TOWER;
