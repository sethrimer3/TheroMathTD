// Factory for creating the paired resource containers that power the HUD.

/** Dependency/config argument accepted by {@link createResourceStateContainers}. */
export interface ResourceStateContainerDependencies {
  /** Optional callback that computes the initial Thero score. Falls back to 0 when absent/non-function. */
  calculateStartingThero?: (() => number) | null;
  baseScoreRate: number;
  baseEnergyRate: number;
  baseFluxRate: number;
  /**
   * Optional callback invoked with the freshly created container pair so other
   * subsystems (autosave, HUD) can register the exact same object references.
   */
  registerResourceContainers?: ((containers: ResourceStateContainerPair) => void) | null;
}

/** Immutable-in-practice baseline values used to reset {@link RuntimeResourceState}. */
export interface BaseResourceContainer {
  score: number;
  scoreRate: number;
  energyRate: number;
  fluxRate: number;
}

/** Mutable, ticking resource state consumed by the game loop/HUD. */
export interface RuntimeResourceState {
  score: number;
  scoreRate: number;
  energyRate: number;
  fluxRate: number;
  running: boolean;
}

/** The paired containers returned by the factory and handed to callers/registration callback. */
export interface ResourceStateContainerPair {
  baseResources: BaseResourceContainer;
  resourceState: RuntimeResourceState;
}

/**
 * Builds the base resource containers used by the HUD and autosave systems.
 * Explicit dependencies keep the creation logic isolated from main.js so future
 * refactors can import the containers without pulling in the entire main loop.
 */
export function createResourceStateContainers({
  calculateStartingThero,
  baseScoreRate,
  baseEnergyRate,
  baseFluxRate,
  registerResourceContainers,
}: ResourceStateContainerDependencies): ResourceStateContainerPair {
  const startingScore = typeof calculateStartingThero === 'function'
    ? calculateStartingThero()
    : 0;

  const baseResources: BaseResourceContainer = {
    score: startingScore,
    scoreRate: baseScoreRate,
    energyRate: baseEnergyRate,
    fluxRate: baseFluxRate,
  };

  const resourceState: RuntimeResourceState = {
    score: baseResources.score,
    scoreRate: baseResources.scoreRate,
    energyRate: baseResources.energyRate,
    fluxRate: baseResources.fluxRate,
    running: false,
  };

  if (typeof registerResourceContainers === 'function') {
    registerResourceContainers({ baseResources, resourceState });
  }

  return { baseResources, resourceState };
}
