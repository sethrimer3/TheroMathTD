// Format Helper Functions
// Extracted from main.js - utility functions for formatting labels, durations, and timestamps

/** Unicode subscript digits for formatting glyph labels */
const subscriptDigits: Record<string, string> = {
  0: '₀',
  1: '₁',
  2: '₂',
  3: '₃',
  4: '₄',
  5: '₅',
  6: '₆',
  7: '₇',
  8: '₈',
  9: '₉',
};

/**
 * Convert a number to subscript format
 * @param value - The number to convert
 * @returns The number in subscript format (e.g., "₀", "₁₂", "₃₄₅")
 */
export function toSubscriptNumber(value: number): string {
  const normalized = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return `${normalized}`
    .split('')
    .map((digit) => subscriptDigits[digit] || digit)
    .join('');
}

/**
 * Format a glyph label with subscript numbering for the given symbol.
 * Shared helper used by formatAlephLabel and any future active glyph types.
 * @param symbol - The glyph symbol prefix (for example, 'ℵ').
 * @param index - The glyph index (0-based).
 * @returns Formatted label like "ℵ₀" or "ℵ₁".
 */
export function formatGlyphLabel(symbol: string, index: number): string {
  const normalized = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  return `${symbol}${toSubscriptNumber(normalized)}`;
}

/**
 * Format an Aleph glyph label with subscript numbering
 * @param index - The glyph index (0-based)
 * @returns Formatted label like "ℵ₀", "ℵ₁", "ℵ₂", etc.
 */
export function formatAlephLabel(index: number): string {
  return formatGlyphLabel('ℵ', index);
}

/**
 * Format a duration in seconds to a human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted duration like "5s", "2m 30s", "15m", etc.
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '—';
  }
  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (minutes && secs) {
    return `${minutes}m ${secs}s`;
  }
  if (minutes) {
    return `${minutes}m`;
  }
  return `${secs}s`;
}

/**
 * Format level rewards into a human-readable string
 * @param rewardScore - Score reward (Σ)
 * @param rewardFlux - Flux reward (Motes/min)
 * @param rewardEnergy - Energy reward (TD/s)
 * @returns Formatted rewards string
 */
export function formatRewards(
  rewardScore: number,
  rewardFlux: number,
  rewardEnergy: number,
  formatGameNumber: (value: number) => string,
): string {
  const parts: string[] = [];
  if (Number.isFinite(rewardScore)) {
    parts.push(`${formatGameNumber(rewardScore)} Σ`);
  }
  if (Number.isFinite(rewardFlux)) {
    parts.push(`+${Math.round(rewardFlux)} Motes/min`);
  }
  if (Number.isFinite(rewardEnergy)) {
    parts.push(`+${Math.round(rewardEnergy)} TD/s`);
  }
  return parts.length ? parts.join(' · ') : '—';
}

/**
 * Format a timestamp as relative time (e.g., "5s ago", "2m ago", "3h ago")
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted relative time or null if invalid
 */
export function formatRelativeTime(timestamp: number): string | null {
  if (!Number.isFinite(timestamp)) {
    return null;
  }
  const diff = Date.now() - timestamp;
  if (!Number.isFinite(diff)) {
    return null;
  }
  if (diff < 0) {
    return 'soon';
  }
  const seconds = Math.round(diff / 1000);
  if (seconds < 5) {
    return 'just now';
  }
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
