/** Preserve the original Map validation boundary before narrowing the injected store. */
function hasSetMethod(value) {
    return ((typeof value === 'object' || typeof value === 'function') &&
        value !== null &&
        typeof value.set === 'function');
}
/** Preserve the original Set validation boundary before narrowing the listener store. */
function hasAddMethod(value) {
    return ((typeof value === 'object' || typeof value === 'function') &&
        value !== null &&
        typeof value.add === 'function');
}
/** Narrow unknown values exactly where the original implementation used Number.isFinite. */
function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}
/** Read a possible iterator without broadening the public unlock input contract. */
function getIterator(value) {
    return Object(value)[Symbol.iterator];
}
/**
 * Encapsulate discovery bookkeeping while retaining the Towers tab's injected
 * Maps, resolver callbacks, ordering, and synchronous notification behavior.
 */
export function createTowerVariableDiscoveryManager({ universalVariableLibrary = new Map(), discoveredVariables = new Map(), discoveredVariableListeners = new Set(), getTowerDefinition = () => null, getOrderedTowerDefinitions = () => [], getTowerOrderIndex = () => new Map(), getTowerEquationBlueprint = () => null, getDefaultUnlockCollection = () => null, } = {}) {
    if (!hasSetMethod(discoveredVariables)) {
        throw new Error('createTowerVariableDiscoveryManager requires a Map for discoveredVariables.');
    }
    if (!hasAddMethod(discoveredVariableListeners)) {
        throw new Error('createTowerVariableDiscoveryManager requires a Set for discoveredVariableListeners.');
    }
    // Validation intentionally mirrors the legacy set/add checks; the live caller supplies real Map/Set instances.
    const discoveredVariableMap = discoveredVariables;
    const listenerSet = discoveredVariableListeners;
    const variableLibrary = universalVariableLibrary instanceof Map
        ? universalVariableLibrary
        : new Map(Array.isArray(universalVariableLibrary)
            ? universalVariableLibrary
            : []);
    /** Normalize all universal-library keys to trimmed lowercase strings. */
    function normalizeVariableLibraryKey(value) {
        if (typeof value !== 'string') {
            return null;
        }
        const trimmed = value.trim();
        return trimmed ? trimmed.toLowerCase() : null;
    }
    /** Resolve legacy variable aliases in their established precedence order. */
    function resolveVariableLookupKey(variable) {
        if (!variable) {
            return null;
        }
        if (typeof variable === 'string') {
            return normalizeVariableLibraryKey(variable);
        }
        const candidates = [
            variable.libraryKey,
            variable.key,
            variable.symbol,
            variable.equationSymbol,
        ];
        for (const candidate of candidates) {
            const normalized = normalizeVariableLibraryKey(candidate);
            if (normalized) {
                return normalized;
            }
        }
        return null;
    }
    /** Find universal metadata for either a key or an authored variable. */
    function getUniversalVariableMetadata(variableOrKey) {
        const lookupKey = resolveVariableLookupKey(variableOrKey);
        if (!lookupKey) {
            return null;
        }
        return variableLibrary.get(lookupKey) || null;
    }
    /** Build the stable tower/key compound id used by the discovery Map. */
    function buildDiscoveredVariableId(towerId, variable) {
        if (!towerId || !variable) {
            return null;
        }
        const key = typeof variable.key === 'string' && variable.key.trim()
            ? variable.key.trim()
            : null;
        if (key) {
            return `${towerId}::${key}`;
        }
        const libraryKey = resolveVariableLookupKey(variable);
        if (libraryKey) {
            return `${towerId}::${libraryKey}`;
        }
        const symbol = typeof variable.symbol === 'string' && variable.symbol.trim()
            ? variable.symbol.trim().toLowerCase()
            : null;
        if (symbol) {
            return `${towerId}::${symbol}`;
        }
        return null;
    }
    /** Enrich a discovered authored variable with tower and universal metadata. */
    function createDiscoveredVariableRecord(towerId, variable, variableId) {
        if (!towerId || !variable || !variableId) {
            return null;
        }
        const definition = getTowerDefinition(towerId);
        const universal = getUniversalVariableMetadata(variable);
        const symbol = (typeof variable.symbol === 'string' && variable.symbol.trim()) ||
            (typeof variable.equationSymbol === 'string' && variable.equationSymbol.trim()) ||
            (typeof universal?.symbol === 'string' && universal.symbol) ||
            (typeof variable.key === 'string' && variable.key.trim()
                ? variable.key.trim().toUpperCase()
                : '');
        const name = (typeof variable.name === 'string' && variable.name.trim()) ||
            (typeof variable.tooltipName === 'string' && variable.tooltipName.trim()) ||
            (typeof universal?.name === 'string' && universal.name) ||
            symbol ||
            'Variable';
        const description = (typeof variable.description === 'string' && variable.description.trim()) ||
            (typeof variable.tooltipDescription === 'string' &&
                variable.tooltipDescription.trim()) ||
            (typeof universal?.description === 'string' && universal.description) ||
            '';
        const units = (typeof variable.units === 'string' && variable.units.trim()) ||
            (typeof universal?.units === 'string' ? universal.units : null);
        const towerOrderIndex = getTowerOrderIndex();
        return {
            id: variableId,
            towerId,
            towerName: typeof definition?.name === 'string' && definition.name.trim()
                ? definition.name.trim()
                : towerId,
            towerSymbol: typeof definition?.symbol === 'string' && definition.symbol.trim()
                ? definition.symbol.trim()
                : towerId,
            towerTier: isFiniteNumber(definition?.tier) ? definition.tier : null,
            towerOrder: towerOrderIndex?.get(towerId) ?? Number.MAX_SAFE_INTEGER,
            key: typeof variable.key === 'string' && variable.key.trim()
                ? variable.key.trim()
                : null,
            libraryKey: resolveVariableLookupKey(variable),
            symbol,
            name,
            description,
            units,
            glyphLabel: typeof variable.glyphLabel === 'string' && variable.glyphLabel.trim()
                ? variable.glyphLabel.trim()
                : null,
        };
    }
    /** Normalize Set, array, iterable, and object-key unlock collections. */
    function normalizeTowerIdCollection(source) {
        const normalized = new Set();
        const addValue = (value) => {
            if (typeof value !== 'string') {
                return;
            }
            const trimmed = value.trim();
            if (trimmed) {
                normalized.add(trimmed);
            }
        };
        if (!source) {
            return normalized;
        }
        if (source instanceof Set || Array.isArray(source)) {
            source.forEach(addValue);
            return normalized;
        }
        if (typeof getIterator(source) === 'function') {
            for (const entry of source) {
                addValue(entry);
            }
            return normalized;
        }
        if (typeof source === 'object') {
            Object.keys(source).forEach(addValue);
        }
        return normalized;
    }
    /** Sort and clone records so callers cannot mutate the owned Map entries. */
    function getDiscoveredVariablesSnapshot() {
        const entries = Array.from(discoveredVariableMap.values());
        entries.sort((a, b) => {
            if (a.towerOrder !== b.towerOrder) {
                return a.towerOrder - b.towerOrder;
            }
            if (a.towerId !== b.towerId) {
                return a.towerId.localeCompare(b.towerId);
            }
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
        return entries.map((entry) => ({ ...entry }));
    }
    /** Notify each valid listener with one shared snapshot and isolate failures. */
    function notifyDiscoveredVariableListeners() {
        if (!listenerSet.size) {
            return;
        }
        const snapshot = getDiscoveredVariablesSnapshot();
        listenerSet.forEach((listener) => {
            if (typeof listener !== 'function') {
                return;
            }
            try {
                listener(snapshot);
            }
            catch (error) {
                console.warn('Discovered variable listener failed.', error);
            }
        });
    }
    /** Discover every new variable in a tower blueprint and optionally notify. */
    function discoverTowerVariables(towerId, { notify = true } = {}) {
        if (!towerId) {
            return false;
        }
        const blueprint = getTowerEquationBlueprint(towerId);
        if (!blueprint || !Array.isArray(blueprint.variables)) {
            return false;
        }
        let changed = false;
        blueprint.variables.forEach((variable) => {
            const variableId = buildDiscoveredVariableId(towerId, variable);
            if (!variableId || discoveredVariableMap.has(variableId)) {
                return;
            }
            const record = createDiscoveredVariableRecord(towerId, variable, variableId);
            if (!record) {
                return;
            }
            discoveredVariableMap.set(variableId, record);
            changed = true;
        });
        if (changed && notify) {
            notifyDiscoveredVariableListeners();
        }
        return changed;
    }
    /** Return a defensive, sorted snapshot of the discovery state. */
    function getDiscoveredVariables() {
        return getDiscoveredVariablesSnapshot();
    }
    /** Subscribe immediately and return an idempotent removal closure. */
    function addDiscoveredVariablesListener(listener) {
        if (typeof listener !== 'function') {
            return () => { };
        }
        listenerSet.add(listener);
        try {
            listener(getDiscoveredVariables());
        }
        catch (error) {
            console.warn('Discovered variable listener failed during subscription.', error);
        }
        return () => {
            listenerSet.delete(listener);
        };
    }
    /** Rebuild discovery state from current unlocks in canonical tower order. */
    function initializeDiscoveredVariablesFromUnlocks(unlockCollection) {
        discoveredVariableMap.clear();
        const unlocked = normalizeTowerIdCollection(unlockCollection);
        if (!unlocked.size) {
            const fallbackCollection = getDefaultUnlockCollection?.();
            if (fallbackCollection instanceof Set) {
                fallbackCollection.forEach((towerId) => {
                    if (typeof towerId === 'string' && towerId.trim()) {
                        unlocked.add(towerId.trim());
                    }
                });
            }
        }
        const orderedDefinitions = (() => {
            const definitions = getOrderedTowerDefinitions?.();
            if (Array.isArray(definitions) && definitions.length) {
                return definitions;
            }
            return [];
        })();
        if (orderedDefinitions.length) {
            orderedDefinitions.forEach((definition) => {
                if (typeof definition?.id === 'string' &&
                    unlocked.has(definition.id)) {
                    discoverTowerVariables(definition.id, { notify: false });
                }
            });
        }
        else if (unlocked.size) {
            unlocked.forEach((towerId) => {
                discoverTowerVariables(towerId, { notify: false });
            });
        }
        notifyDiscoveredVariableListeners();
    }
    return {
        getUniversalVariableMetadata,
        discoverTowerVariables,
        getDiscoveredVariables,
        addDiscoveredVariablesListener,
        initializeDiscoveredVariablesFromUnlocks,
        buildDiscoveredVariableId,
    };
}
