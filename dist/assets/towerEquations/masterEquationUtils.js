const MULTIPLY_SYMBOL = ' × ';
/** Permit property reads from the same object/function values JavaScript destructuring accepts. */
function isPropertySource(value) {
    return (typeof value === 'object' && value !== null) || typeof value === 'function';
}
/** Match the original variable boundary exactly: arrays count, functions do not. */
function isVariableObject(value) {
    return typeof value === 'object' && value !== null;
}
/** Read a possibly inherited property without asserting an untrusted object schema. */
function readProperty(source, key) {
    return isPropertySource(source) ? source[key] : undefined;
}
/** Preserve default destructuring for primitives while retaining null's native failure class. */
function readDerivationParameters(params) {
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
function readTextParameters(params) {
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
function isAttachmentVariable(variable) {
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
function shouldIncludeInMasterEquation(variable) {
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
function normalizePlainLabel(label) {
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
function derivePlainVariableLabel(variable) {
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
function deriveLatexVariableLabel(variable, fallbackPlain) {
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
function derivePlainSymbol(blueprint, definition, towerId) {
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
function deriveLatexSymbol(blueprint, definition, towerId) {
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
function deriveStructureFromFields({ blueprint, definition, towerId, }) {
    const plainSymbol = derivePlainSymbol(blueprint, definition, towerId);
    const latexSymbol = deriveLatexSymbol(blueprint, definition, towerId);
    const terms = [];
    const possibleVariables = readProperty(blueprint, 'variables');
    const variables = Array.isArray(possibleVariables) ? possibleVariables : [];
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
export function deriveMasterEquationStructure(params = {}) {
    return deriveStructureFromFields(readDerivationParameters(params));
}
export function generateMasterEquationText(params = {}) {
    const { blueprint, definition, towerId, format, fallback } = readTextParameters(params);
    const { symbol, terms } = deriveStructureFromFields({ blueprint, definition, towerId });
    if (!symbol.plain && !symbol.latex) {
        return fallback;
    }
    if (!terms.length) {
        if (format === 'latex') {
            const left = symbol.latex || (symbol.plain ? `\\text{${symbol.plain}}` : '');
            return left ? String.raw `\( ${left} = 0 \)` : fallback;
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
        return String.raw `\( ${left} = ${rightTerms.join(' \\times ')} \)`;
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
