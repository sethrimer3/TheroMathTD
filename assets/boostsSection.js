// Boosts section UI for the achievements tab.
// Provides in-app purchase option and ad-based boost buttons.

import '../scripts/core/formatting.js';
import {
  loadMonetizationState,
  getMonetizationState,
  unlockPremium,
} from './state/monetizationState.js';

let boostsContainer = null;
let dropdownContent = null;
let isDropdownOpen = false;
/**
 * Handle premium unlock button click.
 */
async function handlePremiumUnlock() {
  const confirmed = window.confirm(
    'This is a mock purchase for $4.99 that would unlock all premium features. Proceed?'
  );
  
  if (!confirmed) {
    return;
  }
  
  unlockPremium();
  
  // Update UI to show unlocked state
  const premiumButton = boostsContainer?.querySelector('[data-action="unlock-premium"]');
  if (premiumButton) {
    premiumButton.disabled = true;
    premiumButton.textContent = '✓ Premium Unlocked';
    premiumButton.classList.add('boost-button--unlocked');
  }
}

/**
 * Toggle dropdown visibility.
 */
function toggleDropdown() {
  if (!boostsContainer || !dropdownContent) {
    return;
  }
  
  isDropdownOpen = !isDropdownOpen;
  
  const toggleButton = boostsContainer.querySelector('[data-action="toggle-boosts"]');
  if (toggleButton) {
    toggleButton.setAttribute('aria-expanded', String(isDropdownOpen));
    toggleButton.textContent = isDropdownOpen ? '▼ Boosts - Support the Dev' : '▶ Boosts - Support the Dev';
  }
  
  if (isDropdownOpen) {
    dropdownContent.hidden = false;
    dropdownContent.style.display = 'block';
  } else {
    dropdownContent.hidden = true;
    dropdownContent.style.display = 'none';
  }
}

/**
 * Create the boosts section UI.
 * @returns {HTMLElement} The boosts container element
 */
function createBoostsUI() {
  const container = document.createElement('div');
  container.className = 'boosts-section';
  container.id = 'boosts-section';
  
  // Toggle button
  const toggleButton = document.createElement('button');
  toggleButton.className = 'boosts-toggle action-button';
  toggleButton.type = 'button';
  toggleButton.setAttribute('data-action', 'toggle-boosts');
  toggleButton.setAttribute('aria-expanded', 'false');
  toggleButton.textContent = '▶ Boosts - Support the Dev';
  toggleButton.addEventListener('click', toggleDropdown);
  container.appendChild(toggleButton);
  
  // Dropdown content
  const dropdown = document.createElement('div');
  dropdown.className = 'boosts-dropdown';
  dropdown.hidden = true;
  dropdown.style.display = 'none';
  dropdownContent = dropdown;
  
  // Premium unlock section
  const premiumSection = document.createElement('div');
  premiumSection.className = 'boosts-premium-section';
  
  const state = getMonetizationState();
  
  const premiumButton = document.createElement('button');
  premiumButton.className = 'boost-button boost-button--premium action-button';
  premiumButton.type = 'button';
  premiumButton.setAttribute('data-action', 'unlock-premium');
  
  if (state.premiumUnlocked) {
    premiumButton.disabled = true;
    premiumButton.textContent = '✓ Premium Unlocked';
    premiumButton.classList.add('boost-button--unlocked');
  } else {
    premiumButton.textContent = '🔓 Unlock Everything - $4.99';
    premiumButton.addEventListener('click', handlePremiumUnlock);
  }
  
  premiumSection.appendChild(premiumButton);
  dropdown.appendChild(premiumSection);
  
  container.appendChild(dropdown);
  
  return container;
}

/**
 * Initialize the boosts section in the achievements tab.
 */
export function initializeBoostsSection() {
  // Load state from storage
  loadMonetizationState();
  
  // Find achievements panel
  const achievementsPanel = document.getElementById('panel-achievements');
  if (!achievementsPanel) {
    console.warn('Achievements panel not found');
    return;
  }
  
  // Create and insert boosts section at the top
  boostsContainer = createBoostsUI();
  
  // Insert after the header but before the achievement note
  const header = achievementsPanel.querySelector('.panel-header');
  if (header && header.nextSibling) {
    achievementsPanel.insertBefore(boostsContainer, header.nextSibling);
  } else {
    achievementsPanel.insertBefore(boostsContainer, achievementsPanel.firstChild);
  }
  
}

/**
 * Clean up the boosts section.
 */
export function cleanupBoostsSection() {
  if (boostsContainer && boostsContainer.parentNode) {
    boostsContainer.parentNode.removeChild(boostsContainer);
  }
  
  boostsContainer = null;
  dropdownContent = null;
  isDropdownOpen = false;
}
