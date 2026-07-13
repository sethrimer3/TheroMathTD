/**
 * Iota Tower definition extracted from the gameplay configuration.
 */
import type { TowerDefinition } from './types.js';

export const IOTA_TOWER = Object.freeze({
  id: 'iota',
  symbol: 'ι',
  name: 'ι Tower',
  tier: 9,
  baseCost: 60000000,
  damage: 240,
  rate: 0.85,
  range: 0.38,
  icon: 'assets/images/tower-iota.svg',
  nextTierId: 'kappa',
} as const satisfies TowerDefinition);

export default IOTA_TOWER;
