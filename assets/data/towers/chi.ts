/**
 * Chi Tower definition extracted from the gameplay configuration.
 */
import type { TowerDefinition } from './types.js';

export const CHI_TOWER = Object.freeze({
  id: 'chi',
  symbol: 'χ',
  name: 'χ Tower',
  tier: 22,
  baseCost: 920000000000000,
  damage: 5800,
  rate: 0.44,
  range: 0.68,
  icon: 'assets/images/tower-chi.svg',
  nextTierId: 'psi',
} as const satisfies TowerDefinition);

export default CHI_TOWER;
