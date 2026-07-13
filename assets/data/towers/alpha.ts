/**
 * Alpha Tower definition extracted from the gameplay configuration.
 */
import type { TowerDefinition } from './types.js';

export const ALPHA_TOWER = Object.freeze({
  id: 'alpha',
  symbol: 'α',
  name: 'α Tower',
  tier: 1,
  baseCost: 10,
  damage: 28,
  rate: 1.25,
  range: 0.24,
  diameterMeters: 1,
  icon: 'assets/images/tower-alpha.svg',
  nextTierId: 'beta',
} as const satisfies TowerDefinition);

export default ALPHA_TOWER;
