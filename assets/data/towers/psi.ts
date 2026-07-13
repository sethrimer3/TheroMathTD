/**
 * Psi Tower definition extracted from the gameplay configuration.
 */
import type { TowerDefinition } from './types.js';

export const PSI_TOWER = Object.freeze({
  id: 'psi',
  symbol: 'ψ',
  name: 'ψ Tower',
  tier: 23,
  baseCost: 3000000000000000,
  damage: 6800,
  rate: 0.42,
  range: 0.7,
  icon: 'assets/images/tower-psi.svg',
  nextTierId: 'omega',
} as const satisfies TowerDefinition);

export default PSI_TOWER;
