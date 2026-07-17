/**
 * Shared palette, color conversion, and numeric normalization helpers for the Powder Spire.
 *
 * Extracted from the massive powderTower module to keep visual math utilities
 * accessible without loading the full simulation implementation.
 */

/** Sanitized RGB payload used across the mote palette pipeline. */
export interface MoteRgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Fully populated mote palette. Canonical background values are CSS color
 * strings, but merge preserves whatever truthy value a legacy save carried.
 */
export interface MotePalette {
  stops: MoteRgbColor[];
  restAlpha: number;
  freefallAlpha: number;
  backgroundTop: unknown;
  backgroundBottom: unknown;
}

/** Narrow arbitrary palette payloads to inspectable objects. */
function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Match `Number.isFinite` while narrowing candidate components to numbers. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Default gradient, opacity, and background values for mote rendering.
 */
export const DEFAULT_MOTE_PALETTE = {
  stops: [
    { r: 247, g: 213, b: 101 },
    { r: 247, g: 213, b: 101 },
    { r: 247, g: 213, b: 101 },
  ],
  restAlpha: 0.9,
  freefallAlpha: 0.6,
  backgroundTop: '#000000',
  backgroundBottom: '#000000',
};

/**
 * Clamp helper for values expected to live in the inclusive [0, 1] range.
 * @param value Raw floating-point input.
 * @returns Clamped value between 0 and 1 (or 0 for invalid inputs).
 */
export function clampUnitInterval(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

/**
 * Normalizes floating-point inputs for persistence so NaN/Infinity never leak into saves.
 * @param value Number to sanitize.
 * @param fallback Default to return when value is not finite.
 * @returns Safe floating-point value.
 */
export function normalizeFiniteNumber(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return value;
}

/**
 * Normalizes integer inputs for persistence while enforcing deterministic rounding.
 * @param value Number to sanitize.
 * @param fallback Default to return when the input is not finite.
 * @returns Rounded integer.
 */
export function normalizeFiniteInteger(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.round(value);
}

/**
 * Creates a sanitized clone of an RGB payload so callers never mutate shared palette data.
 * @param color RGB payload to clone.
 * @returns Safe copy or null when invalid.
 */
export function cloneMoteColor(color: MoteRgbColor | null | undefined): MoteRgbColor | null {
  if (!color || typeof color !== 'object') {
    return null;
  }
  if (!Number.isFinite(color.r) || !Number.isFinite(color.g) || !Number.isFinite(color.b)) {
    return null;
  }
  return {
    r: Math.max(0, Math.min(255, Math.round(color.r))),
    g: Math.max(0, Math.min(255, Math.round(color.g))),
    b: Math.max(0, Math.min(255, Math.round(color.b))),
  };
}

/**
 * Converts HSL coordinates into RGB space for gradient synthesis.
 * @param h Hue in degrees.
 * @param s Saturation 0-1.
 * @param l Lightness 0-1.
 * @returns Converted RGB payload.
 */
export function hslToRgbColor(h: number, s: number, l: number): MoteRgbColor {
  const hue = ((h % 360) + 360) % 360;
  const sat = clampUnitInterval(s);
  const light = clampUnitInterval(l);
  if (sat === 0) {
    const value = Math.round(light * 255);
    return { r: value, g: value, b: value };
  }
  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  const convert = (t: number): number => {
    let temp = t;
    if (temp < 0) {
      temp += 1;
    }
    if (temp > 1) {
      temp -= 1;
    }
    if (temp < 1 / 6) {
      return p + (q - p) * 6 * temp;
    }
    if (temp < 1 / 2) {
      return q;
    }
    if (temp < 2 / 3) {
      return p + (q - p) * (2 / 3 - temp) * 6;
    }
    return p;
  };
  const r = convert(hue / 360 + 1 / 3);
  const g = convert(hue / 360);
  const b = convert(hue / 360 - 1 / 3);
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Parses a hexadecimal color string (#rgb, #rgba, #rrggbb, or #rrggbbaa) into RGB components.
 * @param value CSS hex string.
 * @returns RGB payload or null on failure.
 */
function parseHexColor(value: unknown): MoteRgbColor | null {
  if (typeof value !== 'string') {
    return null;
  }
  let hex = value.trim();
  if (!hex) {
    return null;
  }
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }
  if (hex.length !== 6 && hex.length !== 8) {
    return null;
  }
  const int = Number.parseInt(hex.slice(0, 6), 16);
  if (Number.isNaN(int)) {
    return null;
  }
  return {
    r: (int >> 16) & 0xff,
    g: (int >> 8) & 0xff,
    b: int & 0xff,
  };
}

/**
 * Parses rgb()/rgba() strings into RGB payloads.
 * @param value CSS rgb(a) string.
 * @returns RGB payload or null when invalid.
 */
function parseRgbColor(value: unknown): MoteRgbColor | null {
  if (typeof value !== 'string') {
    return null;
  }
  const match = value
    .trim()
    .match(/^rgba?\((\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)(?:[,\s]+([0-9.]+))?\)$/i);
  if (!match) {
    return null;
  }
  const r = Number.parseFloat(match[1]);
  const g = Number.parseFloat(match[2]);
  const b = Number.parseFloat(match[3]);
  if ([r, g, b].some((component) => Number.isNaN(component))) {
    return null;
  }
  return { r, g, b };
}

/**
 * Parses hsl()/hsla() strings into RGB payloads.
 * @param value CSS hsl(a) string.
 * @returns RGB payload or null when invalid.
 */
function parseHslColor(value: unknown): MoteRgbColor | null {
  if (typeof value !== 'string') {
    return null;
  }
  const match = value
    .trim()
    .match(/^hsla?\(([-\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%(?:[,\s]+([0-9.]+))?\)$/i);
  if (!match) {
    return null;
  }
  const h = Number.parseFloat(match[1]);
  const s = Number.parseFloat(match[2]) / 100;
  const l = Number.parseFloat(match[3]) / 100;
  if ([h, s, l].some((component) => Number.isNaN(component))) {
    return null;
  }
  return hslToRgbColor(h, s, l);
}

/**
 * Parses mixed CSS color formats (hex, rgb, hsl, or object forms) into RGB payloads.
 * @param value CSS color candidate.
 * @returns RGB payload or null on failure.
 */
export function parseCssColor(value: unknown): MoteRgbColor | null {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return parseHexColor(value) || parseRgbColor(value) || parseHslColor(value);
  }
  if (isObjectLike(value)) {
    if ('r' in value && 'g' in value && 'b' in value) {
      return {
        r: isFiniteNumber(value.r) ? value.r : 0,
        g: isFiniteNumber(value.g) ? value.g : 0,
        b: isFiniteNumber(value.b) ? value.b : 0,
      };
    }
    if ('h' in value && 's' in value && 'l' in value) {
      return hslToRgbColor(Number(value.h), Number(value.s), Number(value.l));
    }
  }
  return null;
}

/**
 * Blends two RGB colors together using the provided ratio.
 * @param colorA First color.
 * @param colorB Second color.
 * @param ratio Blend ratio in [0, 1].
 * @returns Mixed RGB payload.
 */
export function mixRgbColors(
  colorA: MoteRgbColor | null | undefined,
  colorB: MoteRgbColor | null | undefined,
  ratio: number,
): MoteRgbColor {
  const t = clampUnitInterval(ratio);
  const a = colorA || { r: 0, g: 0, b: 0 };
  const b = colorB || { r: 0, g: 0, b: 0 };
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

/**
 * Formats an RGB color into an rgba() CSS string with normalized alpha.
 * @param color RGB payload to stringify.
 * @param alpha Opacity value between 0 and 1.
 * @returns CSS rgba() string.
 */
export function colorToRgbaString(color: MoteRgbColor | null | undefined, alpha = 1): string {
  const safeColor = color || { r: 0, g: 0, b: 0 };
  const r = Math.round(Math.max(0, Math.min(255, safeColor.r || 0)));
  const g = Math.round(Math.max(0, Math.min(255, safeColor.g || 0)));
  const b = Math.round(Math.max(0, Math.min(255, safeColor.b || 0)));
  const normalizedAlpha = clampUnitInterval(alpha);
  return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha.toFixed(3)})`;
}

/**
 * Resolves the configured mote palette into a full structure with fallbacks.
 * @param palette User-supplied palette overrides.
 * @returns Fully populated palette definition.
 */
export function mergeMotePalette(palette: unknown): MotePalette {
  if (!palette || !isObjectLike(palette)) {
    return {
      ...DEFAULT_MOTE_PALETTE,
      stops: DEFAULT_MOTE_PALETTE.stops.map((stop) => ({ ...stop })),
    };
  }

  const stops: MoteRgbColor[] = Array.isArray(palette.stops) && palette.stops.length
    ? palette.stops
        .map((stop: unknown) => {
          if (stop && isObjectLike(stop)) {
            const color: unknown = parseCssColor(stop) || stop;
            if (color && isObjectLike(color) && 'r' in color && 'g' in color && 'b' in color) {
              return {
                r: isFiniteNumber(color.r) ? color.r : 0,
                g: isFiniteNumber(color.g) ? color.g : 0,
                b: isFiniteNumber(color.b) ? color.b : 0,
              };
            }
          }
          return null;
        })
        .filter((stop): stop is MoteRgbColor => Boolean(stop))
    : DEFAULT_MOTE_PALETTE.stops.map((stop) => ({ ...stop }));

  if (!stops.length) {
    stops.push(...DEFAULT_MOTE_PALETTE.stops.map((stop) => ({ ...stop })));
  }

  return {
    stops,
    restAlpha: isFiniteNumber(palette.restAlpha) ? palette.restAlpha : DEFAULT_MOTE_PALETTE.restAlpha,
    freefallAlpha: isFiniteNumber(palette.freefallAlpha)
      ? palette.freefallAlpha
      : DEFAULT_MOTE_PALETTE.freefallAlpha,
    backgroundTop: palette.backgroundTop || DEFAULT_MOTE_PALETTE.backgroundTop,
    backgroundBottom: palette.backgroundBottom || DEFAULT_MOTE_PALETTE.backgroundBottom,
  };
}

/**
 * Ensures palette color stops always include at least two unique colors plus boundaries.
 * @param palette Palette definition.
 * @returns Normalized color stops.
 */
export function resolvePaletteColorStops(palette: unknown): MoteRgbColor[] {
  const reference: Record<string, unknown> = palette && isObjectLike(palette)
    ? palette
    : DEFAULT_MOTE_PALETTE;
  const stops: MoteRgbColor[] = [];
  const pushStop = (candidate: unknown): void => {
    const color = normalizePaletteColorStop(candidate);
    if (!color) {
      return;
    }
    const last = stops[stops.length - 1];
    if (last && last.r === color.r && last.g === color.g && last.b === color.b) {
      return;
    }
    stops.push(color);
  };

  pushStop(reference.backgroundTop);

  const baseStops: readonly unknown[] = Array.isArray(reference.stops) && reference.stops.length
    ? reference.stops
    : DEFAULT_MOTE_PALETTE.stops;
  baseStops.forEach((stop) => pushStop(stop));

  pushStop(reference.backgroundBottom);

  if (!stops.length) {
    DEFAULT_MOTE_PALETTE.stops.forEach((stop) => pushStop(stop));
  }

  if (stops.length === 1) {
    stops.push({ ...stops[0] });
  }

  return stops;
}

/**
 * Builds a palette from the current document theme variables.
 * @returns Palette with colors sampled from CSS custom properties.
 */
export function computeMotePaletteFromTheme(): MotePalette {
  if (typeof window === 'undefined') {
    return mergeMotePalette(DEFAULT_MOTE_PALETTE);
  }
  const root = document.body || document.documentElement;
  if (!root) {
    return mergeMotePalette(DEFAULT_MOTE_PALETTE);
  }
  const styles = window.getComputedStyle(root);
  const accent = parseCssColor(styles.getPropertyValue('--accent')) || DEFAULT_MOTE_PALETTE.stops[1];
  const accentSecondary =
    parseCssColor(styles.getPropertyValue('--accent-2')) || DEFAULT_MOTE_PALETTE.stops[2];
  const accentWarm = parseCssColor(styles.getPropertyValue('--accent-3')) || DEFAULT_MOTE_PALETTE.stops[0];
  const deepBase = { r: 15, g: 16, b: 24 };
  const lowBase = { r: 23, g: 26, b: 39 };
  const stops = [
    mixRgbColors(accentWarm, { r: 255, g: 255, b: 255 }, 0.12),
    mixRgbColors(accent, accentSecondary, 0.25),
    mixRgbColors(accentSecondary, { r: 255, g: 255, b: 255 }, 0.18),
  ];

  return mergeMotePalette({
    stops,
    restAlpha: 0.9,
    freefallAlpha: 0.62,
    backgroundTop: colorToRgbaString(mixRgbColors(deepBase, accent, 0.22), 1),
    backgroundBottom: colorToRgbaString(mixRgbColors(lowBase, accentSecondary, 0.18), 1),
  });
}

/**
 * Normalizes a palette stop candidate into a sanitized RGB payload.
 * @param stop Color candidate provided by callers.
 * @returns Sanitized RGB payload or null when invalid.
 */
function normalizePaletteColorStop(stop: unknown): MoteRgbColor | null {
  if (!stop) {
    return null;
  }

  let color: unknown = null;
  if (typeof stop === 'string') {
    color = parseCssColor(stop);
  } else if (isObjectLike(stop)) {
    if ('r' in stop && 'g' in stop && 'b' in stop) {
      color = stop;
    } else {
      color = parseCssColor(stop);
    }
  }

  if (!color || !isObjectLike(color)
    || !isFiniteNumber(color.r) || !isFiniteNumber(color.g) || !isFiniteNumber(color.b)) {
    return null;
  }

  return {
    r: Math.max(0, Math.min(255, Math.round(color.r))),
    g: Math.max(0, Math.min(255, Math.round(color.g))),
    b: Math.max(0, Math.min(255, Math.round(color.b))),
  };
}
