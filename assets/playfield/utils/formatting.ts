import { formatGameNumber } from '../../../scripts/core/formatting.js';

// Present combat-facing numbers with trimmed trailing zeros while respecting notation preferences.
export function formatCombatNumber(value: number): string {
  const label = formatGameNumber(value);
  if (typeof label !== 'string') {
    return label;
  }
  const trimmedDecimals = label.replace(/(\.\d*?)(0+)(?=(?:\s| ×|$))/g, (_match, decimals: string) => {
    const stripped = decimals.replace(/0+$/, '');
    return stripped;
  });
  return trimmedDecimals.replace(/\.($|(?=\s)|(?= ×))/g, '');
}
