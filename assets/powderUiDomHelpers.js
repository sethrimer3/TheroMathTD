import {
  POWDER_CELL_SIZE_PX,
  clampUnitInterval,
  colorToRgbaString,
  resolvePaletteColorStops,
} from '../scripts/features/towers/powderTower.js';
import { formatAlephLabel } from './formatHelpers.js';

const GOLD_ALEPH_SPRITE_PATH = 'assets/sprites/spires/alephSpire/Gold_Aleph.webp';
const GOLD_NUMBER_SPRITE_PATH_PREFIX = 'assets/sprites/goldNumbers/Gold_';

/**
 * Factory that bundles DOM helpers used by the Well of Inspiration overlay.
 * @param {Object} options - Dependency injection container for DOM bindings and utilities.
 * @returns {Object} Powder overlay helper functions consumed by main.js.
 */
export function createPowderUiDomHelpers(options = {}) {
  const {
    powderGlyphColumns = [],
  } = options;

  /**
   * Render one Aleph wall glyph from the dedicated golden Aleph and golden digit sprites.
   * @param {HTMLElement} glyphElement - Glyph container anchored to the wall.
   * @param {number} index - Glyph index rendered as ℵ + decimal digits (supports cyclic tier-local indices).
   */
  function renderPowderGlyphSprite(glyphElement, index) {
    if (!glyphElement || typeof document === 'undefined') {
      return;
    }
    const normalized = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
    const displayValue = `${normalized}`;
    // Prefix with "a:" so future glyph sprite families can reuse this cache key without collisions.
    const currentSignature = `a:${displayValue}`;
    if (glyphElement.dataset.spriteSignature === currentSignature) {
      return;
    }
    glyphElement.dataset.spriteSignature = currentSignature;
    glyphElement.textContent = '';
    glyphElement.setAttribute('aria-label', formatAlephLabel(normalized));

    const strip = document.createElement('span');
    strip.className = 'powder-glyph-sprite-strip';

    const alephSprite = document.createElement('img');
    alephSprite.className = 'powder-glyph-sprite powder-glyph-sprite--aleph';
    alephSprite.src = GOLD_ALEPH_SPRITE_PATH;
    alephSprite.alt = '';
    alephSprite.decoding = 'async';
    strip.appendChild(alephSprite);

    displayValue.split('').forEach((digit) => {
      const digitSprite = document.createElement('img');
      digitSprite.className = 'powder-glyph-sprite powder-glyph-sprite--digit';
      digitSprite.src = `${GOLD_NUMBER_SPRITE_PATH_PREFIX}${digit}.webp`;
      digitSprite.alt = '';
      digitSprite.decoding = 'async';
      strip.appendChild(digitSprite);
    });

    glyphElement.appendChild(strip);
  }

  function applyMindGatePaletteToDom(palette) {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    if (!root || typeof root.style?.setProperty !== 'function') {
      return;
    }
    const stops = resolvePaletteColorStops(palette);
    if (!Array.isArray(stops) || stops.length === 0) {
      return;
    }

    const denominator = Math.max(1, stops.length - 1);
    const maxAlpha = 0.32;
    const minAlpha = 0.18;
    const gradientParts = [];
    stops.forEach((stop, index) => {
      const offset = denominator === 0 ? 0 : index / denominator;
      const alpha = maxAlpha - (maxAlpha - minAlpha) * offset;
      const color = colorToRgbaString(stop, alpha);
      const percent = Math.round(offset * 100);
      gradientParts.push(`${color} ${percent}%`);
    });
    if (gradientParts.length === 1) {
      gradientParts.push(`${colorToRgbaString(stops[0], minAlpha)} 100%`);
    }

    const gradientValue = `linear-gradient(140deg, ${gradientParts.join(', ')})`;
    root.style.setProperty('--mind-gate-gradient', gradientValue);

    const primaryStop = stops[stops.length - 1];
    const secondaryStop = stops[0];
    root.style.setProperty('--mind-gate-highlight', colorToRgbaString(primaryStop, 0.92));
    root.style.setProperty('--mind-gate-glow-primary', colorToRgbaString(primaryStop, 0.55));
    root.style.setProperty('--mind-gate-icon-glow', colorToRgbaString(primaryStop, 0.55));
    root.style.setProperty('--mind-gate-text-glow', colorToRgbaString(primaryStop, 0.65));
    root.style.setProperty('--mind-gate-glow-secondary', colorToRgbaString(secondaryStop, 0.3));
  }

  // Convert a normalized glyph height into its zero-based tier index.
  function createGlyphIndexNormalizer(base, spacing) {
    return (value) => {
      if (!Number.isFinite(value)) {
        return 0;
      }
      return Math.floor((value - base) / spacing);
    };
  }

  // Powder Spire simulation metrics are supplied via the powder spire module.
  function updatePowderGlyphColumns(info = {}) {
    const rows = Number.isFinite(info.rows) && info.rows > 0 ? info.rows : 1;
    const cellSize = Number.isFinite(info.cellSize) && info.cellSize > 0 ? info.cellSize : POWDER_CELL_SIZE_PX;
    const scrollOffset = Number.isFinite(info.scrollOffset) ? Math.max(0, info.scrollOffset) : 0;
    const highestRawInput = Number.isFinite(info.highestNormalized) ? info.highestNormalized : 0;
    const totalRawInput = Number.isFinite(info.totalNormalized) ? info.totalNormalized : highestRawInput;
    const highestNormalized = Math.max(0, highestRawInput, totalRawInput);
    const tierAdvanceAlephCount = Number.isFinite(info.tierAdvanceAlephCount) && info.tierAdvanceAlephCount > 0
      ? Math.max(1, Math.floor(info.tierAdvanceAlephCount))
      : 30;
    const minAlephWallTier = Number.isFinite(info.minAlephWallTier) && info.minAlephWallTier > 0
      ? Math.max(1, Math.floor(info.minAlephWallTier))
      : 1;
    const maxAlephWallTier = Number.isFinite(info.maxAlephWallTier) && info.maxAlephWallTier > 0
      ? Math.max(minAlephWallTier, Math.floor(info.maxAlephWallTier))
      : 15;
    // Keep Aleph milestones on a fixed 100-mote vertical cadence so wall-width changes never shift threshold spacing.
    const glyphSpacingRows = 100;
    const GLYPH_SPACING_NORMALIZED = glyphSpacingRows / Math.max(1, rows);
    const GLYPH_BASE_NORMALIZED = GLYPH_SPACING_NORMALIZED;
    const safeRows = Math.max(1, rows);
    const basinHeight = safeRows * cellSize;
    const viewTopNormalized = scrollOffset / safeRows;
    const viewBottomNormalized = (scrollOffset + safeRows) / safeRows;
    const bufferGlyphs = 2;

    const normalizeIndex = createGlyphIndexNormalizer(GLYPH_BASE_NORMALIZED, GLYPH_SPACING_NORMALIZED);

    const rawMinIndex = normalizeIndex(viewTopNormalized);
    const rawMaxIndex = Math.ceil(
      (viewBottomNormalized - GLYPH_BASE_NORMALIZED) / GLYPH_SPACING_NORMALIZED,
    );
    const minIndex = Math.max(0, (Number.isFinite(rawMinIndex) ? rawMinIndex : 0) - bufferGlyphs);
    const maxIndex = Math.max(
      minIndex,
      (Number.isFinite(rawMaxIndex) ? rawMaxIndex : 0) + bufferGlyphs,
    );

    const glyphHeightForIndex = (index) =>
      GLYPH_BASE_NORMALIZED + Math.max(0, index) * GLYPH_SPACING_NORMALIZED;

    if (powderGlyphColumns.length) {
      powderGlyphColumns.forEach((column) => {
        column.glyphs.forEach((glyph, index) => {
          if (index < minIndex || index > maxIndex) {
            column.element.removeChild(glyph);
            column.glyphs.delete(index);
          }
        });

        for (let index = minIndex; index <= maxIndex; index += 1) {
          let glyph = column.glyphs.get(index);
          if (!glyph) {
            glyph = document.createElement('span');
            glyph.className = 'powder-glyph';
            glyph.dataset.alephIndex = String(index);
            column.element.appendChild(glyph);
            column.glyphs.set(index, glyph);
          }
          // Cycle displayed Aleph digits every tier so each tier restarts at ℵ0 through ℵ(n-1).
          renderPowderGlyphSprite(glyph, index % tierAdvanceAlephCount);
          const glyphNormalized = glyphHeightForIndex(index);
          const relativeRows = glyphNormalized * safeRows - scrollOffset;
          const topPx = basinHeight - relativeRows * cellSize;
          glyph.style.top = `${topPx.toFixed(1)}px`;
          const achieved = highestNormalized >= glyphNormalized;
          glyph.classList.toggle('powder-glyph--achieved', achieved);
        }
      });
    }

    const glyphsLit =
      highestNormalized >= GLYPH_BASE_NORMALIZED
        ? Math.max(
            0,
            Math.floor((highestNormalized - GLYPH_BASE_NORMALIZED) / GLYPH_SPACING_NORMALIZED) + 1,
          )
        : 0;
    const achievedIndex = glyphsLit > 0 ? glyphsLit - 1 : 0;
    const nextIndex = glyphsLit;
    const previousThreshold =
      glyphsLit > 0
        ? GLYPH_BASE_NORMALIZED + (glyphsLit - 1) * GLYPH_SPACING_NORMALIZED
        : 0;
    const nextThreshold = GLYPH_BASE_NORMALIZED + glyphsLit * GLYPH_SPACING_NORMALIZED;
    const span = Math.max(GLYPH_SPACING_NORMALIZED, nextThreshold - previousThreshold);
    const progressFraction = clampUnitInterval((highestNormalized - previousThreshold) / span);
    const remainingToNext = Math.max(0, nextThreshold - highestNormalized);
    // Convert normalized remaining height into mote-height so Δh readouts are always in gameplay units.
    const remainingToNextMotes = remainingToNext * safeRows;
    const alephInTier = glyphsLit % tierAdvanceAlephCount;
    const tier = Math.max(
      minAlephWallTier,
      Math.min(maxAlephWallTier, minAlephWallTier + Math.floor(glyphsLit / tierAdvanceAlephCount)),
    );
    const remainingAlephToNextTier = Math.max(0, tierAdvanceAlephCount - alephInTier);

    if (powderGlyphColumns.length) {
      powderGlyphColumns.forEach((column) => {
        column.glyphs.forEach((glyph, index) => {
          const isTarget = index === nextIndex;
          const glyphNormalized = glyphHeightForIndex(index);
          glyph.classList.toggle('powder-glyph--target', isTarget);
          glyph.classList.toggle('powder-glyph--achieved', highestNormalized >= glyphNormalized);
        });
      });
    }

    return {
      achievedCount: achievedIndex,
      nextIndex,
      highestRaw: highestNormalized,
      glyphsLit,
      progressFraction,
      remainingToNext,
      remainingToNextMotes,
      tier,
      alephInTier,
      tierAdvanceAlephCount,
      remainingAlephToNextTier,
    };
  }

  return {
    applyMindGatePaletteToDom,
    updatePowderGlyphColumns,
  };
}

export default createPowderUiDomHelpers;
