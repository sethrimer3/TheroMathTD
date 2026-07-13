/**
 * Xi Tower definition extracted from the gameplay configuration.
 */
import type { TowerDefinition } from './types.js';

export const XI_TOWER = Object.freeze({
  id: 'xi',
  symbol: 'ξ',
  name: 'ξ Tower',
  tier: 14,
  baseCost: 23000000000,
  damage: 860,
  rate: 0.64,
  range: 0.48,
  icon: 'assets/images/tower-xi.svg',
  nextTierId: 'omicron',
} as const satisfies TowerDefinition);

export default XI_TOWER;
