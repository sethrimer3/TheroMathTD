/**
 * Pi Tower definition extracted from the gameplay configuration.
 */
import type { TowerDefinition } from './types.js';

export const PI_TOWER = Object.freeze({
  id: 'pi',
  symbol: 'π',
  name: 'π Tower',
  tier: 16,
  baseCost: 780000000000,
  damage: 1900,
  rate: 0.56,
  range: 0.56,
  icon: 'assets/images/tower-pi.svg',
  nextTierId: 'rho',
} as const satisfies TowerDefinition);

export default PI_TOWER;
