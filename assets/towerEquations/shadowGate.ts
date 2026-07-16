import { codexState, getEnemyCodexEntry } from '../codex.js';
import type { TowerEquationBlueprint } from '../towerBlueprintPresenter.js';

/** Minimal Codex entry surface read by the Shadow Gate's dynamic label. */
interface ShadowGateCodexEntry {
  symbol?: unknown;
}

/** Keep the JavaScript-owned Codex dependency narrow at this equation boundary. */
const encounteredEnemies: ReadonlySet<string> = codexState.encounteredEnemies;
const resolveEnemyEntry: (id: string) => ShadowGateCodexEntry | null | undefined =
  getEnemyCodexEntry;

/** Resolve the math symbols for every enemy the player has encountered so far. */
function resolveEncounteredEnemySymbols(): string {
  const ids = Array.from(encounteredEnemies);
  const symbols = ids.map((id) => resolveEnemyEntry(id)?.symbol).filter(Boolean);
  return symbols.join(', ');
}

/** Passive Shadow Gate blueprint whose display name tracks the live enemy Codex. */
export const shadowGate = {
  mathSymbol: String.raw`\wp`,
  baseEquation: String.raw`\( \wp = x \)`,
  variables: [
    {
      key: 'enemies',
      symbol: 'x',
      /** Dynamically surface the math symbols of all encountered enemy types. */
      get name() {
        return resolveEncounteredEnemySymbols();
      },
      upgradable: false,
    },
  ],
  computeResult() {
    /** The Shadow Gate is a passive nexus with no numerical output. */
    return 0;
  },
  formatGoldenEquation() {
    /** The gate maps the known enemy set onto x as a purely symbolic equation. */
    return String.raw`\( \wp = x \)`;
  },
} satisfies TowerEquationBlueprint;
