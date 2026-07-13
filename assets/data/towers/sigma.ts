/**
 * Sigma Tower definition extracted from the gameplay configuration.
 */
import type { TowerDefinition } from './types.js';

export const SIGMA_TOWER = Object.freeze({
  id: 'sigma',
  symbol: 'σ',
  name: 'σ Tower',
  tier: 18,
  baseCost: 8000000000000,
  damage: 2800,
  rate: 0.52,
  range: 0.6,
  icon: 'assets/images/tower-sigma.svg',
  nextTierId: 'tau',
} as const satisfies TowerDefinition);

export default SIGMA_TOWER;
