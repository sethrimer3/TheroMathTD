/**
 * Tokenisation helpers used to split upgrade equations into highlightable spans.
 */

/** Upgradable variable metadata consumed when tokenizing equation text. */
export interface EquationVariableToken {
  key: string;
  symbol: string;
}

/** One rendered span of equation text, optionally bound to an upgrade card. */
export interface EquationTokenSpan {
  text: string;
  variableKey: string | null;
}

/**
 * Escapes special characters so dynamically built regular expressions stay valid.
 * @param value Symbol text supplied by blueprint metadata.
 * @returns Regex safe symbol string.
 */
export function escapeRegExp(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

/**
 * Breaks equation text into tokens so the UI can bind spans to upgrade cards.
 * @param equationText Base equation pulled from the blueprint.
 * @param variableTokens Upgradable variable metadata.
 * @returns Token list for DOM generation.
 */
export function tokenizeEquationParts(
  equationText: string,
  variableTokens: readonly (EquationVariableToken | null | undefined)[] = [],
): EquationTokenSpan[] {
  if (!equationText || !variableTokens.length) {
    return [{ text: equationText, variableKey: null }];
  }

  const tokenLookup = new Map<string, string>();
  const patterns = variableTokens
    .filter((token): token is EquationVariableToken => Boolean(token && token.symbol))
    .map((token) => {
      tokenLookup.set(token.symbol, token.key);
      return escapeRegExp(token.symbol);
    });

  if (!patterns.length) {
    return [{ text: equationText, variableKey: null }];
  }

  const regex = new RegExp(`(${patterns.join('|')})`, 'g');
  const tokens: EquationTokenSpan[] = [];
  let lastIndex = 0;

  equationText.replace(regex, (match, _token: string, offset: number) => {
    if (offset > lastIndex) {
      tokens.push({ text: equationText.slice(lastIndex, offset), variableKey: null });
    }
    tokens.push({ text: match, variableKey: tokenLookup.get(match) || null });
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < equationText.length) {
    tokens.push({ text: equationText.slice(lastIndex), variableKey: null });
  }

  return tokens;
}
