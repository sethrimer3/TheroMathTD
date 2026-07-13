/**
 * Density Collapse Tower definition — creates a heatmap field from graph
 * points that collapses into area-of-effect explosions.
 */
import type { TowerDefinition } from './types.js';

export const DENSITY_COLLAPSE_TOWER = Object.freeze({
  id: 'density_collapse',
  symbol: 'Ω̃',
  name: 'Density Collapse Tower',
  tier: 0,
  baseCost: 1,
  damage: 3,
  rate: 0,
  range: 0.4,
  diameterMeters: 1,
  icon: 'assets/images/tower-density-collapse.svg',
  description: 'Builds a heatmap field that collapses into explosions at the centroid.',
} as const satisfies TowerDefinition);

export default DENSITY_COLLAPSE_TOWER;
