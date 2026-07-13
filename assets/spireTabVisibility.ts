/**
 * Factory that encapsulates DOM toggles for the spire tab stack and their floating menu
 * controls. The implementation previously lived in `assets/main.js`, which made the file
 * responsible for low-level UI state in addition to orchestration. Extracting the helper
 * keeps the tab visibility logic cohesive and easier to test in isolation.
 */

/** Mutable cache of split powder/fluid tab DOM references, populated lazily. */
export interface FluidTabElements {
  tabStack?: HTMLElement | null;
  powderTabButton?: HTMLButtonElement | null;
  tabButton?: HTMLButtonElement | null;
}

/** Resource HUD elements consulted for badge visibility toggling. */
export interface SpireResourceHudElements {
  tabFluidBadge?: HTMLElement | null;
  [key: string]: unknown;
}

/** Per-spire unlock/stat bag; only the `unlocked` flag is read by this module. */
interface SpireUnlockState {
  unlocked?: boolean;
  [key: string]: unknown;
}

export interface SpireResourceState {
  lamed?: SpireUnlockState;
  tsadi?: SpireUnlockState;
  shin?: SpireUnlockState;
  kuf?: SpireUnlockState;
  [key: string]: unknown;
}

/** Powder progression state; only the fluid-unlock flag is read by this module. */
export interface PowderVisibilityState {
  fluidUnlocked?: boolean;
  [key: string]: unknown;
}

export interface SpireTabVisibilityManagerOptions {
  /** Mutable references for fluid tab DOM nodes. */
  fluidElements: FluidTabElements;
  /** Getter that returns the latest resource HUD elements. */
  getResourceElements?: () => SpireResourceHudElements | null | undefined;
  /** Unlock flags and stats for each spire. */
  spireResourceState?: SpireResourceState;
  /** Powder progression state including the fluid unlock flag. */
  powderState?: PowderVisibilityState;
}

export interface SpireTabVisibilityManager {
  updateFluidTabAvailability: () => void;
  updateSpireTabVisibility: () => void;
}

interface StackedTabButtonStateOptions {
  /** Whether the associated feature is available. */
  unlocked: boolean;
  /** Accessible label while locked. */
  lockedLabel?: string;
}

export function createSpireTabVisibilityManager({
  fluidElements,
  getResourceElements,
  spireResourceState,
  powderState,
}: SpireTabVisibilityManagerOptions): SpireTabVisibilityManager {
  /**
   * Swap stacked tab icons to a placeholder instead of removing them from the DOM.
   * Keeping the controls visible preserves the 3x2 layout regardless of unlock state.
   */
  function setStackedTabButtonState(
    tabButton: HTMLButtonElement | null | undefined,
    { unlocked, lockedLabel = 'Unknown Spire' }: StackedTabButtonStateOptions,
  ): void {
    if (!tabButton) {
      return;
    }

    const icon = tabButton.querySelector<HTMLElement>('.tab-icon');
    if (icon && !tabButton.dataset.unlockedIcon) {
      // Capture the original glyph once so we can restore it when the spire unlocks later in the run.
      tabButton.dataset.unlockedIcon = icon.textContent?.trim() || '';
    }
    if (!tabButton.dataset.unlockedAriaLabel) {
      tabButton.dataset.unlockedAriaLabel = tabButton.getAttribute('aria-label') || '';
    }

    if (icon) {
      icon.textContent = unlocked ? tabButton.dataset.unlockedIcon ?? '' : '?';
    }

    tabButton.removeAttribute('hidden');
    tabButton.setAttribute('aria-hidden', 'false');
    tabButton.disabled = !unlocked;
    tabButton.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
    tabButton.setAttribute('aria-label', unlocked ? tabButton.dataset.unlockedAriaLabel ?? '' : lockedLabel);
  }

  /**
   * Update the split powder/fluid tab visibility and associated badges when the Bet Spire Terrarium
   * unlocks or locks. Resource badge visibility depends on the current unlock state.
   */
  function updateFluidTabAvailability(): void {
    if (!fluidElements.tabStack) {
      // Cache the split tab wrapper so we can toggle stacked layout states when the Bet Spire Terrarium unlocks.
      fluidElements.tabStack = document.getElementById('tab-powder-stack');
    }
    if (!fluidElements.powderTabButton) {
      // Store the top-half button reference so focus/disable states can stay synchronized with the stack.
      fluidElements.powderTabButton = document.getElementById('tab-powder') as HTMLButtonElement | null;
    }
    if (!fluidElements.tabButton) {
      fluidElements.tabButton = document.getElementById('tab-fluid') as HTMLButtonElement | null;
    }
    const tabStack = fluidElements.tabStack;
    const powderTab = fluidElements.powderTabButton;
    const tabButton = fluidElements.tabButton;
    if (!powderTab || !tabButton) {
      return;
    }

    const resourceElements = typeof getResourceElements === 'function' ? getResourceElements() || {} : {};

    if (tabStack) {
      // Keep the stack split so both halves of the powder/fluid control remain visible in the grid.
      tabStack.classList.add('tab-button-stack--split');
      tabStack.classList.remove('tab-button-stack--active');
      tabStack.setAttribute('aria-hidden', 'false');
    }

    setStackedTabButtonState(tabButton, {
      unlocked: Boolean(powderState?.fluidUnlocked),
      lockedLabel: 'Locked Bet Spire',
    });

    if (resourceElements.tabFluidBadge) {
      if (powderState?.fluidUnlocked) {
        resourceElements.tabFluidBadge.removeAttribute('hidden');
        resourceElements.tabFluidBadge.setAttribute('aria-hidden', 'false');
      } else {
        resourceElements.tabFluidBadge.setAttribute('hidden', '');
        resourceElements.tabFluidBadge.setAttribute('aria-hidden', 'true');
      }
    }
  }

  /**
   * Update visibility for all spire tabs based on unlock status.
   */
  function updateSpireTabVisibility(): void {
    updateFluidTabAvailability();

    const spireStack = document.getElementById('spire-tab-stack');
    if (spireStack) {
      const layoutClasses = [
        'spire-tab-stack--layout-1',
        'spire-tab-stack--layout-2',
        'spire-tab-stack--layout-3',
        'spire-tab-stack--layout-4',
        'spire-tab-stack--layout-5',
        'spire-tab-stack--layout-6',
      ];
      layoutClasses.forEach((className) => spireStack.classList.remove(className));
      spireStack.classList.add('spire-tab-stack--layout-6');
    }

    /**
     * Toggle visibility for the floating menu toggle button that lives inside a spire panel.
     */
    function syncSpireToggle(spireId: string, unlocked: boolean): void {
      const toggle = document.getElementById(`spire-menu-toggle-${spireId}`) as HTMLButtonElement | null;
      if (!toggle) {
        return;
      }
      if (unlocked) {
        toggle.removeAttribute('hidden');
        toggle.setAttribute('aria-hidden', 'false');
        toggle.disabled = false;
      } else {
        toggle.setAttribute('hidden', '');
        toggle.setAttribute('aria-hidden', 'true');
        toggle.disabled = true;
        toggle.classList.remove('spire-menu-toggle--active');
        toggle.setAttribute('aria-expanded', 'false');
      }
    }

    /**
     * Keep the stacked spire tab buttons in sync with the corresponding unlocks so locked
     * spires no longer leak visible icons into the primary tab bar.
     */
    function syncSpireTabButton(spireId: string, unlocked: boolean): void {
      const tabButton = document.getElementById(`tab-${spireId}`) as HTMLButtonElement | null;
      if (!tabButton) {
        return;
      }

      setStackedTabButtonState(tabButton, {
        unlocked,
        lockedLabel: 'Unknown Spire',
      });
    }

    const spireConfigs: { id: string; unlocked: boolean }[] = [
      { id: 'lamed', unlocked: Boolean(spireResourceState?.lamed?.unlocked) },
      { id: 'tsadi', unlocked: Boolean(spireResourceState?.tsadi?.unlocked) },
      { id: 'shin', unlocked: Boolean(spireResourceState?.shin?.unlocked) },
      { id: 'kuf', unlocked: Boolean(spireResourceState?.kuf?.unlocked) },
    ];

    spireConfigs.forEach(({ id, unlocked }) => {
      syncSpireTabButton(id, unlocked);
      syncSpireToggle(id, unlocked);
    });

    // Layout is fixed to the 3x2 grid above, so no additional adjustments are needed here.
  }

  return {
    updateFluidTabAvailability,
    updateSpireTabVisibility,
  };
}
