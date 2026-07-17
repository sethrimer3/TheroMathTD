import towers from './data/towers/index.js';
import {
  setTowerDefinitions,
  setTowerLoadoutLimit,
  getTowerLoadoutState,
  getTowerUnlockState,
  getTowerDefinition,
  setMergingLogicUnlocked,
  initializeDiscoveredVariablesFromUnlocks,
} from './towersTab.js';
import { setEnemyCodexEntries } from './codex.js';
import {
  setLevelBlueprints,
  setLevelConfigs,
  initializeInteractiveLevelProgression,
  pruneLevelState,
  getStartingTheroMultiplier,
} from './levels.js';
import { generateLevelAchievements } from './achievementsTab.js';
import {
  getEmbeddedGameplayConfig,
  loadGameplayConfigViaFetch,
  loadGameplayConfigViaModule,
} from './gameplayConfigLoaders.js';

const GAMEPLAY_CONFIG_RELATIVE_PATH = './data/gameplayConfig.json';
const GAMEPLAY_CONFIG_URL = new URL(GAMEPLAY_CONFIG_RELATIVE_PATH, import.meta.url);

export const FALLBACK_TOWER_LOADOUT_LIMIT = 2;
export const FALLBACK_BASE_START_THERO = 50;
export const FALLBACK_BASE_CORE_INTEGRITY = 100;
export const FALLBACK_BASE_SCORE_RATE = 1;
export const FALLBACK_BASE_ENERGY_RATE = 0;
export const FALLBACK_BASE_FLUX_RATE = 0;

/** Untrusted campaign map record carried through the gameplay configuration. */
interface ConfigMapRecord {
  id?: unknown;
  title?: unknown;
  campaign?: unknown;
  developerOnly?: unknown;
  isStoryLevel?: unknown;
  focus?: unknown;
  path?: unknown;
  example?: unknown;
  [key: string]: unknown;
}

/** Untrusted level record carried through the gameplay configuration. */
interface ConfigLevelRecord {
  id?: unknown;
  displayName?: unknown;
  [key: string]: unknown;
}

/** Resource container registered by the bootstrap sequence. */
export interface ConfigurationResourceContainer {
  score?: number;
  scoreRate?: number;
  energyRate?: number;
  fluxRate?: number;
  [key: string]: unknown;
}

/** Narrow arbitrary configuration payloads to inspectable objects. */
function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Match `Number.isFinite` while narrowing candidate values to numbers. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

let gameplayConfigData: Record<string, unknown> | null = null;

let TOWER_LOADOUT_LIMIT = FALLBACK_TOWER_LOADOUT_LIMIT;
let BASE_START_THERO = FALLBACK_BASE_START_THERO;
let BASE_CORE_INTEGRITY = FALLBACK_BASE_CORE_INTEGRITY;

let baseResourcesRef: ConfigurationResourceContainer | null = null;
let resourceStateRef: ConfigurationResourceContainer | null = null;

function buildLadderCampaignMirrors(config: Record<string, unknown> = {}): Record<string, unknown> {
  const maps: ConfigMapRecord[] = Array.isArray(config.maps) ? config.maps : [];
  const levels: ConfigLevelRecord[] = Array.isArray(config.levels) ? config.levels : [];
  const levelLookup = new Map(levels.map((level) => [level.id, level]));

  const preservedMaps = maps.filter((map) => map?.campaign !== 'Ladder' || map?.developerOnly);
  const ladderMaps: ConfigMapRecord[] = [];
  const ladderLevels: ConfigLevelRecord[] = [];

  preservedMaps.forEach((map) => {
    if (!map || map.campaign !== 'Story' || map.isStoryLevel) {
      return;
    }

    const matchingLevel = levelLookup.get(map.id);
    if (!matchingLevel) {
      return;
    }

    const ladderId = `Ladder - ${map.id}`;
    const ladderTitle = `${map.title} (Endless)`;
    const ladderDisplayName = `${matchingLevel.displayName || map.title} (Endless)`;

    ladderMaps.push({
      ...map,
      id: ladderId,
      title: ladderTitle,
      campaign: 'Ladder',
      focus: map.focus || map.path,
      example: map.example ? `${map.example} (Endless)` : 'Endless mirror of the story map.',
      forceEndlessMode: true,
    });

    ladderLevels.push({
      ...matchingLevel,
      id: ladderId,
      displayName: ladderDisplayName,
      campaign: 'Ladder',
      forceEndlessMode: true,
      isStoryLevel: false,
    });
  });

  return {
    ...config,
    maps: [...preservedMaps, ...ladderMaps],
    levels: [...levels, ...ladderLevels],
  };
}

/** Return the registered containers or throw the original registration error. */
function requireResourceContainers(): {
  baseResources: ConfigurationResourceContainer;
  resourceState: ConfigurationResourceContainer;
} {
  if (!baseResourcesRef || !resourceStateRef) {
    throw new Error('Resource containers have not been registered. Call registerResourceContainers first.');
  }
  return { baseResources: baseResourcesRef, resourceState: resourceStateRef };
}

export function registerResourceContainers({ baseResources, resourceState }: {
  baseResources: ConfigurationResourceContainer;
  resourceState: ConfigurationResourceContainer;
}): void {
  baseResourcesRef = baseResources;
  resourceStateRef = resourceState;
}

async function applyGameplayConfigInternal(
  config: unknown = {},
): Promise<Record<string, unknown>> {
  const { baseResources, resourceState } = requireResourceContainers();

  // Runtime entry validation: non-object payloads normalize to an empty record.
  gameplayConfigData = isObjectLike(config) ? config : {};

  const defaultsSource = gameplayConfigData.defaults;
  const defaults: Record<string, unknown> = isObjectLike(defaultsSource) ? defaultsSource : {};

  TOWER_LOADOUT_LIMIT =
    isFiniteNumber(defaults.towerLoadoutLimit) && defaults.towerLoadoutLimit > 0
      ? Math.max(1, Math.floor(defaults.towerLoadoutLimit))
      : FALLBACK_TOWER_LOADOUT_LIMIT;
  setTowerLoadoutLimit(TOWER_LOADOUT_LIMIT);

  BASE_START_THERO =
    isFiniteNumber(defaults.baseStartThero) && defaults.baseStartThero > 0
      ? defaults.baseStartThero
      : FALLBACK_BASE_START_THERO;

  BASE_CORE_INTEGRITY =
    isFiniteNumber(defaults.baseCoreIntegrity) && defaults.baseCoreIntegrity > 0
      ? defaults.baseCoreIntegrity
      : FALLBACK_BASE_CORE_INTEGRITY;

  const startingThero = calculateStartingThero();
  baseResources.score = startingThero;
  resourceState.score = startingThero;
  baseResources.scoreRate = FALLBACK_BASE_SCORE_RATE;
  baseResources.energyRate = FALLBACK_BASE_ENERGY_RATE;
  baseResources.fluxRate = FALLBACK_BASE_FLUX_RATE;
  resourceState.scoreRate = baseResources.scoreRate;
  resourceState.energyRate = baseResources.energyRate;
  resourceState.fluxRate = baseResources.fluxRate;

  const towerDefinitions = towers.map((tower) => ({ ...tower }));
  gameplayConfigData.towers = towerDefinitions;
  setTowerDefinitions(towerDefinitions);

  const loadoutState = getTowerLoadoutState();
  const unlockState = getTowerUnlockState();

  const loadoutCandidates: unknown[] = Array.isArray(defaults.initialTowerLoadout)
    ? defaults.initialTowerLoadout
    : loadoutState.selected;

  const normalizedLoadout: string[] = [];
  loadoutCandidates.forEach((towerId: unknown) => {
    if (
      typeof towerId === 'string' &&
      getTowerDefinition(towerId) &&
      !normalizedLoadout.includes(towerId) &&
      normalizedLoadout.length < TOWER_LOADOUT_LIMIT
    ) {
      normalizedLoadout.push(towerId);
    }
  });
  if (!normalizedLoadout.length && towerDefinitions.length) {
    normalizedLoadout.push(towerDefinitions[0].id);
  }
  loadoutState.selected = normalizedLoadout;
  setTowerLoadoutLimit(TOWER_LOADOUT_LIMIT);

  const unlocked = new Set<string>(
    Array.isArray(defaults.initialUnlockedTowers)
      ? defaults.initialUnlockedTowers.filter(
        (towerId: unknown): towerId is string => Boolean(getTowerDefinition(towerId)),
      )
      : [],
  );
  loadoutState.selected.forEach((towerId: string) => {
    if (towerId) {
      unlocked.add(towerId);
    }
  });
  unlockState.unlocked = unlocked;
  setMergingLogicUnlocked(unlocked.has('beta'));
  initializeDiscoveredVariablesFromUnlocks(unlocked);

  setEnemyCodexEntries(gameplayConfigData.enemies);

  gameplayConfigData = buildLadderCampaignMirrors(gameplayConfigData);

  setLevelBlueprints(gameplayConfigData.maps);
  setLevelConfigs(gameplayConfigData.levels);
  initializeInteractiveLevelProgression();
  pruneLevelState();

  await generateLevelAchievements();

  return gameplayConfigData;
}

export async function ensureGameplayConfigLoaded(): Promise<Record<string, unknown>> {
  if (gameplayConfigData) {
    return gameplayConfigData;
  }

  let lastError: unknown = null;

  try {
    const configFromFetch = await loadGameplayConfigViaFetch(
      GAMEPLAY_CONFIG_URL.href,
      GAMEPLAY_CONFIG_RELATIVE_PATH,
    );
    if (configFromFetch) {
      return applyGameplayConfigInternal(configFromFetch);
    }
  } catch (error) {
    lastError = error;
    console.warn('Primary gameplay-config fetch failed; falling back to alternate loaders.', error);
  }

  const embeddedConfig = getEmbeddedGameplayConfig();
  if (embeddedConfig) {
    return applyGameplayConfigInternal(embeddedConfig);
  }

  try {
    const configFromModule = await loadGameplayConfigViaModule(GAMEPLAY_CONFIG_URL.href);
    if (configFromModule) {
      return applyGameplayConfigInternal(configFromModule);
    }
  } catch (error) {
    lastError = error;
  }

  console.error('Unable to load gameplay configuration', lastError);
  throw lastError || new Error('Unable to load gameplay configuration');
}

export function calculateStartingThero(): number {
  return BASE_START_THERO * getStartingTheroMultiplier();
}

export function getTowerLoadoutLimit(): number {
  return TOWER_LOADOUT_LIMIT;
}

/**
 * Allow players to override the tower loadout slot count via preferences.
 */
export function overrideTowerLoadoutLimit(limit: number): void {
  if (!Number.isFinite(limit) || limit <= 0) {
    return;
  }
  const normalizedLimit = Math.max(1, Math.floor(limit));
  TOWER_LOADOUT_LIMIT = normalizedLimit;
  setTowerLoadoutLimit(normalizedLimit);
}

export function getBaseStartThero(): number {
  return BASE_START_THERO;
}

export function setBaseStartThero(value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    return;
  }
  BASE_START_THERO = value;
}

export function getBaseCoreIntegrity(): number {
  return BASE_CORE_INTEGRITY;
}

export function setBaseCoreIntegrity(value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    return;
  }
  BASE_CORE_INTEGRITY = value;
}

export function getGameplayConfigData(): Record<string, unknown> | null {
  return gameplayConfigData;
}

export function resetGameplayConfigCache(): void {
  gameplayConfigData = null;
}
