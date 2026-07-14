/** Resource counters for active game systems. */
export function createResourceHud({
  formatGameNumber,
  formatWholeNumber,
  getStartingTheroMultiplier,
  getGlyphCurrency,
  getCurrentIdleMoteBank,
  powderState,
}) {
  const resourceElements = {
    theroMultiplier: null,
    glyphsAlephTotal: null,
    glyphsAlephUnused: null,
    tabGlyphBadge: null,
    tabMoteBadge: null,
  };
  const statusRefreshCallbacks = new Set();

  function bindStatusElements() {
    resourceElements.theroMultiplier = document.getElementById('level-thero-multiplier');
    resourceElements.glyphsAlephTotal = document.getElementById('tower-glyphs-aleph-total');
    resourceElements.glyphsAlephUnused = document.getElementById('tower-glyphs-aleph-unused');
    resourceElements.tabGlyphBadge = document.getElementById('tab-glyph-badge');
    resourceElements.tabMoteBadge = document.getElementById('tab-mote-badge');
    updateStatusDisplays();
  }

  function updateStatusDisplays() {
    const theroMultiplier = getStartingTheroMultiplier();
    if (resourceElements.theroMultiplier) {
      const multiplierLabel = formatGameNumber(theroMultiplier);
      resourceElements.theroMultiplier.textContent = `×${multiplierLabel}`;
      resourceElements.theroMultiplier.setAttribute('aria-label', `Thero multiplier ×${multiplierLabel}`);
    }

    const totalGlyphs = Math.max(0, Math.floor(powderState.glyphsAwarded || 0));
    const unusedGlyphs = Math.max(0, Math.floor(getGlyphCurrency())) || 0;
    if (resourceElements.glyphsAlephTotal) {
      resourceElements.glyphsAlephTotal.textContent = `${formatWholeNumber(totalGlyphs)} ℵ`;
    }
    if (resourceElements.glyphsAlephUnused) {
      resourceElements.glyphsAlephUnused.textContent = unusedGlyphs > 0
        ? `${formatWholeNumber(unusedGlyphs)} Unallocated`
        : '';
    }
    if (resourceElements.tabGlyphBadge) {
      const label = formatWholeNumber(unusedGlyphs);
      resourceElements.tabGlyphBadge.textContent = label;
      resourceElements.tabGlyphBadge.setAttribute('aria-label', `${label} unused Well glyphs`);
      resourceElements.tabGlyphBadge.toggleAttribute('hidden', unusedGlyphs <= 0);
      resourceElements.tabGlyphBadge.setAttribute('aria-hidden', unusedGlyphs > 0 ? 'false' : 'true');
    }

    if (resourceElements.tabMoteBadge) {
      const label = formatGameNumber(getCurrentIdleMoteBank());
      resourceElements.tabMoteBadge.textContent = label;
      resourceElements.tabMoteBadge.setAttribute('aria-label', `${label} motes in bank`);
      resourceElements.tabMoteBadge.removeAttribute('hidden');
      resourceElements.tabMoteBadge.setAttribute('aria-hidden', 'false');
    }

    statusRefreshCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('Resource HUD status refresh callback failed', error);
      }
    });
  }

  function registerStatusRefreshCallback(callback) {
    if (typeof callback === 'function') {
      statusRefreshCallbacks.add(callback);
    }
  }

  return {
    resourceElements,
    bindStatusElements,
    updateStatusDisplays,
    registerStatusRefreshCallback,
  };
}
