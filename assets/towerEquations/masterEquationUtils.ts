import type {
  TowerEquationBlueprint,
  TowerEquationDefinition,
  TowerEquationVariable,
} from '../towerBlueprintPresenter.js';

/** Supported authored display formats; every other runtime value still selects plain text. */
export type MasterEquationFormat = 'plain' | 'latex';

/** One derived variable term with both display representations retained. */
export interface MasterEquationTerm {
  plain: string;
  latex: string;
}

/** The left-hand master symbol in plain and LaTeX form. */
export interface MasterEquationSymbolPair {
  plain: string;
  latex: string;
}

/** Complete immutable-by-convention result of master-equation derivation. */
export interface DerivedMasterEquationStructure {
  symbol: MasterEquationSymbolPair;
  terms: MasterEquationTerm[];
}

/** Trusted TypeScript-facing derivation parameters backed by Phase 8 contracts. */
export interface MasterEquationDerivationParameters {
  blueprint?: TowerEquationBlueprint | null;
  definition?: TowerEquationDefinition | null;
  towerId?: string;
}

/** Trusted TypeScript-facing text parameters; the unknown overload preserves JavaScript callers. */
export interface MasterEquationTextParameters extends MasterEquationDerivationParameters {
  format?: MasterEquationFormat;
  fallback?: string;
}

type PropertySource = object & { readonly [key: string]: unknown };
type UntrustedTowerEquationVariable = PropertySource
  & Partial<Record<keyof TowerEquationVariable, unknown>>;

interface RawDerivationParameters {
  blueprint: unknown;
  definition: unknown;
  towerId: unknown;
}

interface RawTextParameters extends RawDerivationParameters {
  format: unknown;
  fallback: unknown;
}

const MULTIPLY_SYMBOL = ' × ';

/** Permit property reads from the same object/function values JavaScript destructuring accepts. */
function isPropertySource(value: unknown): value is PropertySource {
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}

/** Match the original variable boundary exactly: arrays count, functions do not. */
function isVariableObject(value: unknown): value is UntrustedTowerEquationVariable {
  return typeof value === 'object' && value !== null;
}

/** Read a possibly inherited property without asserting an untrusted object schema. */
function readProperty(source: unknown, key: string): unknown {
  return isPropertySource(source) ? source[key] : undefined;
}

/** Preserve default destructuring for primitives while retaining null's native failure class. */
function readDerivationParameters(params: unknown): RawDerivationParameters {
  if (params === null) {
    throw new TypeError('Cannot destructure master equation parameters from null.');
  }
  return {
    blueprint: readProperty(params, 'blueprint'),
    definition: readProperty(params, 'definition'),
    towerId: readProperty(params, 'towerId'),
  };
}

/** Apply the original per-property defaults only when a property is undefined. */
function readTextParameters(params: unknown): RawTextParameters {
  const derivation = readDerivationParameters(params);
  const format = readProperty(params, 'format');
  const fallback = readProperty(params, 'fallback');
  return {
    ...derivation,
    format: format === undefined ? 'plain' : format,
    fallback: fallback === undefined ? '' : fallback,
  };
}

/** Detect attachment metadata using the inherited truthy-trim/category rules. */
function isAttachmentVariable(variable: unknown): boolean {
  if (!isVariableObject(variable)) {
    return false;
  }
  const attachedToVariable = variable.attachedToVariable;
  if (typeof attachedToVariable === 'string' && attachedToVariable.trim()) {
    return true;
  }
  return variable.category === 'attachment';
}

/** Keep every object-like variable except explicit false and attachment records. */
function shouldIncludeInMasterEquation(variable: unknown): boolean {
  if (!isVariableObject(variable)) {
    return false;
  }
  if (variable.includeInMasterEquation === false) {
    return false;
  }
  if (isAttachmentVariable(variable)) {
    return false;
  }
  return true;
}

/** Normalize only the two wrappers recognized by the original plain-label path. */
function normalizePlainLabel(label: unknown): string {
  if (typeof label !== 'string') {
    return '';
  }
  const trimmed = label.trim();
  if (!trimmed) {
    return '';
  }
  const latexMatch = trimmed.match(/^\\text\{(.+?)\}$/u);
  if (latexMatch) {
    return latexMatch[1].trim();
  }
  const wrappedMatch = trimmed.match(/^\\\((.+)\\\)$/u);
  if (wrappedMatch) {
    return wrappedMatch[1].trim();
  }
  return trimmed;
}

/** Derive a plain variable label with the exact authored candidate precedence. */
function derivePlainVariableLabel(variable: unknown): string {
  if (!isVariableObject(variable)) {
    return '';
  }
  const candidates = [
    variable.masterEquationSymbol,
    variable.masterEquationLabel,
    variable.equationSymbol,
    variable.symbol,
    variable.name,
    variable.key,
  ];
  for (const candidate of candidates) {
    const normalized = normalizePlainLabel(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return '';
}

/** Derive a LaTeX variable label without correcting the inherited wrapper branch order. */
function deriveLatexVariableLabel(variable: unknown, fallbackPlain: unknown): string {
  if (!isVariableObject(variable)) {
    return '';
  }
  const candidates = [
    variable.masterEquationLatex,
    variable.equationSymbol,
    variable.symbol,
  ];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') {
      continue;
    }
    const trimmed = candidate.trim();
    if (!trimmed) {
      continue;
    }
    if (trimmed.startsWith('\\')) {
      return trimmed;
    }
    if (trimmed.startsWith('\\(') && trimmed.endsWith('\\)')) {
      return trimmed.slice(2, -2).trim();
    }
  }
  const plain = normalizePlainLabel(fallbackPlain);
  if (!plain) {
    return '';
  }
  return `\\text{${plain}}`;
}

/** Resolve the plain left-hand symbol with the exact existing fallback timing. */
function derivePlainSymbol(blueprint: unknown, definition: unknown, towerId: unknown): string {
  const masterEquationSymbol = readProperty(blueprint, 'masterEquationSymbol');
  if (typeof masterEquationSymbol === 'string') {
    const trimmed = masterEquationSymbol.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  const definitionSymbol = readProperty(definition, 'symbol');
  if (typeof definitionSymbol === 'string' && definitionSymbol.trim()) {
    return definitionSymbol.trim();
  }
  const mathSymbolValue = readProperty(blueprint, 'mathSymbol');
  if (typeof mathSymbolValue === 'string') {
    const mathSymbol = mathSymbolValue.trim();
    if (mathSymbol.startsWith('\\')) {
      return mathSymbol.replace(/^\\/, '');
    }
  }
  const definitionName = readProperty(definition, 'name');
  if (typeof definitionName === 'string' && definitionName.trim()) {
    return definitionName.trim();
  }
  if (typeof towerId === 'string' && towerId.trim()) {
    return towerId.trim();
  }
  return '';
}

/** Resolve the LaTeX left-hand symbol before falling back through the plain form. */
function deriveLatexSymbol(blueprint: unknown, definition: unknown, towerId: unknown): string {
  const masterEquationLatex = readProperty(blueprint, 'masterEquationLatex');
  if (typeof masterEquationLatex === 'string') {
    const trimmed = masterEquationLatex.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  const mathSymbol = readProperty(blueprint, 'mathSymbol');
  if (typeof mathSymbol === 'string') {
    const trimmed = mathSymbol.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  const plain = derivePlainSymbol(blueprint, definition, towerId);
  if (!plain) {
    return '';
  }
  if (/^\\/.test(plain)) {
    return plain;
  }
  return `\\text{${plain}}`;
}

/** Build the public structure from already-read untrusted parameter fields. */
function deriveStructureFromFields({
  blueprint,
  definition,
  towerId,
}: RawDerivationParameters): DerivedMasterEquationStructure {
  const plainSymbol = derivePlainSymbol(blueprint, definition, towerId);
  const latexSymbol = deriveLatexSymbol(blueprint, definition, towerId);
  const terms: MasterEquationTerm[] = [];
  const possibleVariables = readProperty(blueprint, 'variables');
  const variables: readonly unknown[] = Array.isArray(possibleVariables) ? possibleVariables : [];
  variables.forEach((variable) => {
    if (!shouldIncludeInMasterEquation(variable)) {
      return;
    }
    const plain = derivePlainVariableLabel(variable);
    if (!plain) {
      return;
    }
    const latex = deriveLatexVariableLabel(variable, plain);
    terms.push({ plain, latex });
  });
  return {
    symbol: { plain: plainSymbol, latex: latexSymbol },
    terms,
  };
}

/** Derive the structure of a blueprint's master equation. */
export function deriveMasterEquationStructure(
  params?: MasterEquationDerivationParameters,
): DerivedMasterEquationStructure;
export function deriveMasterEquationStructure(params?: unknown): DerivedMasterEquationStructure;
export function deriveMasterEquationStructure(
  params: unknown = {},
): DerivedMasterEquationStructure {
  return deriveStructureFromFields(readDerivationParameters(params));
}

/** Generate a master equation string while reflecting malformed fallback values honestly. */
export function generateMasterEquationText(params?: MasterEquationTextParameters): string;
export function generateMasterEquationText(params?: unknown): unknown;
export function generateMasterEquationText(params: unknown = {}): unknown {
  const { blueprint, definition, towerId, format, fallback } = readTextParameters(params);
  const { symbol, terms } = deriveStructureFromFields({ blueprint, definition, towerId });
  if (!symbol.plain && !symbol.latex) {
    return fallback;
  }
  if (!terms.length) {
    if (format === 'latex') {
      const left = symbol.latex || (symbol.plain ? `\\text{${symbol.plain}}` : '');
      return left ? String.raw`\( ${left} = 0 \)` : fallback;
    }
    const left = symbol.plain || symbol.latex;
    return left ? `${left} = 0` : fallback;
  }
  if (format === 'latex') {
    const left = symbol.latex || (symbol.plain ? `\\text{${symbol.plain}}` : '');
    if (!left) {
      return fallback;
    }
    const rightTerms = terms
      .map(({ latex, plain }) => {
        if (latex && latex.trim()) {
          return latex.trim();
        }
        if (plain && plain.trim()) {
          return `\\text{${plain.trim()}}`;
        }
        return '';
      })
      .filter(Boolean);
    if (!rightTerms.length) {
      return fallback;
    }
    return String.raw`\( ${left} = ${rightTerms.join(' \\times ')} \)`;
  }
  const left = symbol.plain || symbol.latex;
  if (!left) {
    return fallback;
  }
  const right = terms
    .map(({ plain, latex }) => {
      const candidate = plain || latex;
      return candidate ? normalizePlainLabel(candidate) : '';
    })
    .filter(Boolean);
  if (!right.length) {
    return fallback;
  }
  return `${left} = ${right.join(MULTIPLY_SYMBOL)}`;
}
