// Tab lock manager for controlling tab access based on tutorial completion.

import {
  isTowersTabUnlocked,
  isAchievementsUnlocked,
} from './tutorialState.js';

interface TabButtonStateOptions {
  /** Whether the tab should be accessible. */
  unlocked: boolean;
  /** Accessible label while locked. */
  lockedLabel?: string;
}

/**
 * Set tab button locked or unlocked state.
 */
function setTabButtonState(
  tabButton: HTMLButtonElement | null,
  { unlocked, lockedLabel = 'Locked' }: TabButtonStateOptions,
): void {
  if (!tabButton) {
    return;
  }

  const icon = tabButton.querySelector<HTMLElement>('.tab-icon');
  const shouldPreserveIcon = tabButton.dataset.preserveIcon === 'true';
  if (icon && !tabButton.dataset.unlockedIcon && !shouldPreserveIcon) {
    // Capture the original icon once so we can restore it when unlocked
    tabButton.dataset.unlockedIcon = icon.textContent?.trim() || '';
  }
  if (!tabButton.dataset.unlockedAriaLabel) {
    tabButton.dataset.unlockedAriaLabel = tabButton.getAttribute('aria-label') || '';
  }

  if (icon && !shouldPreserveIcon) {
    icon.textContent = unlocked ? tabButton.dataset.unlockedIcon ?? '' : '?';
  }

  tabButton.disabled = !unlocked;
  tabButton.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
  tabButton.setAttribute('aria-label', unlocked ? tabButton.dataset.unlockedAriaLabel ?? '' : lockedLabel);
}

/**
 * Update tab lock states based on tutorial completion.
 * Tabs can be unlocked either by completing the tutorial or by individual unlock triggers.
 */
export function updateTabLockStates(tutorialCompleted: boolean): void {
  // Stage tab is always unlocked
  const stageTab = document.getElementById('tab-tower') as HTMLButtonElement | null;
  if (stageTab) {
    setTabButtonState(stageTab, {
      unlocked: true,
    });
  }

  // Towers tab: unlocked if tutorial completed OR if individually unlocked via entering first level
  const towersTab = document.getElementById('tab-towers') as HTMLButtonElement | null;
  if (towersTab) {
    setTabButtonState(towersTab, {
      unlocked: tutorialCompleted || isTowersTabUnlocked(),
      lockedLabel: 'Locked - Complete Tutorial',
    });
  }

  // Achievements tab: unlocked if tutorial completed OR if individually unlocked
  const achievementsTab = document.getElementById('tab-achievements') as HTMLButtonElement | null;
  if (achievementsTab) {
    setTabButtonState(achievementsTab, {
      unlocked: tutorialCompleted || isAchievementsUnlocked(),
      lockedLabel: 'Locked - Complete Tutorial',
    });
  }

  // Codex (options) tab: always unlocked because it contains core game settings.
  const codexTab = document.getElementById('tab-options') as HTMLButtonElement | null;
  if (codexTab) {
    setTabButtonState(codexTab, {
      unlocked: true,
    });
  }

  // Lock the Well of Inspiration until the tutorial is complete.
  const powderTab = document.getElementById('tab-powder') as HTMLButtonElement | null;
  if (powderTab) {
    setTabButtonState(powderTab, {
      unlocked: tutorialCompleted,
      lockedLabel: 'Locked - Complete Tutorial',
    });
  }

}

/**
 * Initialize tab lock states on page load.
 */
export function initializeTabLockStates(tutorialCompleted: boolean): void {
  updateTabLockStates(tutorialCompleted);
}

/**
 * Unlock the Codex tab.
 */
export function unlockCodexTab(): void {
  const codexTab = document.getElementById('tab-options') as HTMLButtonElement | null;
  if (codexTab) {
    setTabButtonState(codexTab, {
      unlocked: true,
    });
  }
}

/**
 * Unlock the Achievements tab.
 */
export function unlockAchievementsTab(): void {
  const achievementsTab = document.getElementById('tab-achievements') as HTMLButtonElement | null;
  if (achievementsTab) {
    setTabButtonState(achievementsTab, {
      unlocked: true,
    });
  }
}

/**
 * Unlock the Towers tab.
 */
export function unlockTowersTab(): void {
  const towersTab = document.getElementById('tab-towers') as HTMLButtonElement | null;
  if (towersTab) {
    setTabButtonState(towersTab, {
      unlocked: true,
    });
  }
}
