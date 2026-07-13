/**
 * Provides helpers for rendering and parsing math flavoured text so the rest of the
 * UI code can stay focused on gameplay concerns.
 */

/**
 * Minimal shape of the subset of the global MathJax API this module relies on.
 * MathJax itself is loaded from a third-party script tag with no bundled types,
 * so only the members actually used here are declared.
 */
interface MathJaxLike {
  startup?: {
    promise?: Promise<unknown>;
  };
  typesetPromise?: (elements: HTMLElement[]) => Promise<unknown>;
}

declare global {
  interface Window {
    MathJax?: MathJaxLike;
  }
}

/**
 * Regular expression that captures characters typically associated with math
 * expressions so we can quickly decide if text needs special formatting.
 */
export const MATH_SYMBOL_REGEX = /[\\^_=+\-*{}]|[0-9]|[×÷±√∞∑∏∆∇∂→←↺⇥]|[α-ωΑ-Ωℵ℘ℏℙℚℝℤℂℑℜητβγΩΣΨΔφϕλψρμνσπθ]/u;

/**
 * Sends a DOM element through MathJax so TeX expressions render elegantly.
 * @param element Element that potentially contains TeX text.
 */
// Track render attempts so we can safely retry once MathJax initialises on slower devices.
const mathElementRenderAttempts = new WeakMap<HTMLElement, number>();
// Cap retries to avoid runaway timers if MathJax fails to load entirely.
const MAX_MATH_RENDER_ATTEMPTS = 10;
// Small delay between retries gives MathJax time to attach its typeset helpers.
const MATH_RENDER_RETRY_DELAY_MS = 80;

export function renderMathElement(element: HTMLElement | null | undefined): void {
  if (!element) {
    return;
  }

  const mathJax = window.MathJax;
  if (!mathJax) {
    const attempt = (mathElementRenderAttempts.get(element) || 0) + 1;
    if (attempt > MAX_MATH_RENDER_ATTEMPTS) {
      return;
    }
    mathElementRenderAttempts.set(element, attempt);
    setTimeout(() => renderMathElement(element), MATH_RENDER_RETRY_DELAY_MS);
    return;
  }

  const typeset = (): void => {
    if (typeof mathJax.typesetPromise === 'function') {
      mathElementRenderAttempts.delete(element);
      mathJax.typesetPromise([element]).catch((error: unknown) => {
        console.warn('MathJax typeset failed', error);
      });
      return;
    }

    // Defer rendering until MathJax attaches its typesetting helpers during load.
    const attempt = (mathElementRenderAttempts.get(element) || 0) + 1;
    if (attempt > MAX_MATH_RENDER_ATTEMPTS) {
      return;
    }
    mathElementRenderAttempts.set(element, attempt);
    setTimeout(() => typeset(), MATH_RENDER_RETRY_DELAY_MS);
  };

  if (mathJax.startup && mathJax.startup.promise) {
    mathJax.startup.promise.then(typeset);
  } else {
    typeset();
  }
}

/**
 * Determines if the provided string should be treated as a math expression.
 * @param text Text pulled from tooltips or blueprint metadata.
 * @returns True when the text likely contains math markup.
 */
export function isLikelyMathExpression(text: string | null | undefined): boolean {
  if (!text) {
    return false;
  }
  if (text.startsWith('\\(') || text.startsWith('\\[')) {
    return true;
  }
  if (MATH_SYMBOL_REGEX.test(text)) {
    return true;
  }
  if (/\b(?:sin|cos|tan|log|exp|sqrt)\b/i.test(text)) {
    return true;
  }
  return false;
}

/**
 * Converts inline parenthetical expressions into MathJax friendly delimiters.
 * @param text Source string supplied by designers.
 * @returns Annotated text ready for MathJax.
 */
export function annotateMathText(text: string): string {
  if (typeof text !== 'string' || text.indexOf('(') === -1) {
    return text;
  }

  let output = '';
  let outsideBuffer = '';
  let insideBuffer = '';
  let depth = 0;

  const flushOutside = (): void => {
    if (outsideBuffer) {
      output += outsideBuffer;
      outsideBuffer = '';
    }
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === '(') {
      if (depth === 0) {
        flushOutside();
        insideBuffer = '';
      } else {
        insideBuffer += char;
      }
      depth += 1;
      continue;
    }

    if (char === ')') {
      if (depth === 0) {
        outsideBuffer += char;
        continue;
      }
      depth -= 1;
      if (depth === 0) {
        const content = insideBuffer;
        const trimmed = content.trim();
        if (!trimmed) {
          output += '()';
        } else if (isLikelyMathExpression(trimmed)) {
          output += `\\(${trimmed}\\)`;
        } else {
          output += `(${content})`;
        }
        insideBuffer = '';
      } else {
        insideBuffer += char;
      }
      continue;
    }

    if (depth === 0) {
      outsideBuffer += char;
    } else {
      insideBuffer += char;
    }
  }

  if (insideBuffer && depth > 0) {
    output += `(${insideBuffer}`;
  }

  if (outsideBuffer) {
    output += outsideBuffer;
  }

  return output;
}

/**
 * Converts simple TeX commands into plain text so we can generate fallbacks.
 * @param expression MathJax flavoured expression.
 * @returns Plain text version for DOM inspection.
 */
export function convertMathExpressionToPlainText(expression: string): string {
  if (typeof expression !== 'string') {
    return '';
  }

  let text = expression;
  text = text.replace(/\\\(|\\\)|\\\[|\\\]/g, '');
  text = text.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2');
  text = text.replace(/\\sqrt\{([^}]*)\}/g, '√($1)');
  text = text.replace(/\\cdot/g, '·');
  text = text.replace(/\\times/g, '×');
  text = text.replace(/\\ln/g, 'ln');
  text = text.replace(/\\log/g, 'log');
  text = text.replace(/\\left|\\right/g, '');
  text = text.replace(/\\mathcal\{([^}]*)\}/g, '$1');
  text = text.replace(/\\text\{([^}]*)\}/g, '$1');
  text = text.replace(/\\operatorname\{([^}]*)\}/g, '$1');
  text = text.replace(/\\,|\\!|\\;/g, ' ');
  text = text.replace(/\\([a-zA-Z]+)/g, (match: string, command: string) => {
    const lookupKey = `\\${command}`;
    if (GREEK_SYMBOL_LOOKUP.has(lookupKey)) {
      return GREEK_SYMBOL_LOOKUP.get(lookupKey) as string;
    }
    return command;
  });
  text = text.replace(/[{}]/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

/**
 * Normalised map between TeX commands and human friendly Greek symbols.
 */
const GREEK_SYMBOL_LOOKUP = new Map<string, string>([
  ['\\alpha', 'α'],
  ['\\beta', 'β'],
  ['\\aleph', 'ℵ'],
  ['\\gamma', 'γ'],
  ['\\delta', 'δ'],
  ['\\epsilon', 'ε'],
  ['\\theta', 'θ'],
  ['\\lambda', 'λ'],
  ['\\mu', 'μ'],
  ['\\nu', 'ν'],
  ['\\pi', 'π'],
  ['\\phi', 'φ'],
  ['\\psi', 'ψ'],
  ['\\sigma', 'σ'],
  ['\\tau', 'τ'],
  ['\\omega', 'ω'],
  ['\\Omega', 'Ω'],
  ['\\Gamma', 'Γ'],
  ['\\Delta', 'Δ'],
  ['\\Lambda', 'Λ'],
  ['\\Phi', 'Φ'],
  ['\\Psi', 'Ψ'],
]);
