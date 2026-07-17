// Shared math utility functions for the Thero Idle game.
// Consolidates helpers that were previously duplicated across tower, terrarium,
// and renderer modules.  See docs/JAVASCRIPT_MODULE_SYSTEM.md §Shared Utility Patterns.

/**
 * Clamp a numeric value to the [min, max] range.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Clamp with a NaN / Infinity guard – returns min for non-finite inputs.
 * Preferred in rendering paths where upstream computation may produce NaN.
 */
export function clampSafe(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

/**
 * Linearly interpolate between two values without clamping t.
 * @param a - Start value.
 * @param b - End value.
 * @param t - Blend factor.
 * @returns Interpolated value.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Generate a random float within the provided range [min, max).
 */
export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
