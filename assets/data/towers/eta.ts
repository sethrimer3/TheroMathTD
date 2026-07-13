/**
 * Eta Tower definition extracted from the gameplay configuration.
 */
import type { TowerDefinition } from './types.js';

export const ETA_TOWER = Object.freeze({
  id: 'eta',
  symbol: 'η',
  name: 'η Tower',
  tier: 7,
  baseCost: 1000000,
  damage: 96,
  rate: 1.1,
  range: 0.32,
  icon: 'assets/images/tower-eta.svg',
  nextTierId: 'theta',
} as const satisfies TowerDefinition);

export default ETA_TOWER;
