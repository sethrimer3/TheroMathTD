const fs = require('node:fs');
const path = require('node:path');

// Keep the roadmap check anchored to the repository rather than the caller's directory.
const rootDir = path.resolve(__dirname, '..');
const sourceRoots = ['assets', 'scripts'];
const inventoryPath = path.join(rootDir, 'docs', 'TypeScriptMigrationRoadmapInventory.md');
const planPath = path.join(rootDir, 'JavaToTypeScriptConversionPlan.md');

// Normalize paths so Markdown, Windows, and Node comparisons use one representation.
function toRepoPath(filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join('/');
}

// Recursively enumerate only source-language files used by the migration inventory.
function collectSourceFiles(directory, extension, results = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(absolutePath, extension, results);
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      results.push(absolutePath);
    }
  }
  return results;
}

// Extract static ES-module edges; dynamic data imports are intentionally outside this graph.
function readStaticSpecifiers(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const specifiers = [];
  const patterns = [
    /(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]/g,
    /import\s*['"]([^'"]+)['"]/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1].startsWith('.')) {
        specifiers.push(match[1]);
      }
    }
  }
  return [...new Set(specifiers)];
}

// Resolve local runtime imports exactly as the unbundled browser graph expects them.
function resolveRuntimeImport(importerPath, specifier) {
  const candidate = path.resolve(path.dirname(importerPath), specifier);
  const candidates = path.extname(candidate)
    ? [candidate]
    : [`${candidate}.js`, path.join(candidate, 'index.js')];
  return candidates.find((filePath) => fs.existsSync(filePath)) ?? null;
}

// Traverse the browser entry graph while retaining generated JavaScript compatibility siblings.
function collectReachableRuntimeFiles(entryPath) {
  const reachable = new Set();
  const pending = [entryPath];
  while (pending.length > 0) {
    const currentPath = pending.pop();
    const repoPath = toRepoPath(currentPath);
    if (reachable.has(repoPath)) {
      continue;
    }
    reachable.add(repoPath);
    for (const specifier of readStaticSpecifiers(currentPath)) {
      const resolved = resolveRuntimeImport(currentPath, specifier);
      if (!resolved) {
        throw new Error(`Unresolved static import from ${repoPath}: ${specifier}`);
      }
      if (resolved.endsWith('.js')) {
        pending.push(resolved);
      }
    }
  }
  return reachable;
}

// Read one Markdown section without allowing paths from neighboring tables to leak in.
function readSection(markdown, heading, nextHeading) {
  const start = markdown.indexOf(heading);
  const end = markdown.indexOf(nextHeading, start + heading.length);
  if (start < 0 || end < 0) {
    throw new Error(`Roadmap section not found: ${heading}`);
  }
  return markdown.slice(start, end);
}

// Pull source paths from code spans and reject duplicate phase assignments.
function extractJavaScriptPaths(markdownSection) {
  return [...markdownSection.matchAll(/`((?:assets|scripts)\/[A-Za-z0-9_&./-]+\.js)`/g)]
    .map((match) => match[1]);
}

// Convert an array to a sorted set while reporting repeated documentation entries.
function toUniqueSet(paths, label) {
  const seen = new Set();
  const duplicates = new Set();
  for (const filePath of paths) {
    if (seen.has(filePath)) {
      duplicates.add(filePath);
    }
    seen.add(filePath);
  }
  if (duplicates.size > 0) {
    throw new Error(`${label} contains duplicate paths:\n${[...duplicates].sort().join('\n')}`);
  }
  return seen;
}

// Compare two classifications with a useful path-level failure instead of only a count mismatch.
function assertSameSet(actual, documented, label) {
  const missing = [...actual].filter((filePath) => !documented.has(filePath)).sort();
  const unexpected = [...documented].filter((filePath) => !actual.has(filePath)).sort();
  if (missing.length > 0 || unexpected.length > 0) {
    const details = [
      missing.length > 0 ? `Missing from ${label}:\n${missing.join('\n')}` : '',
      unexpected.length > 0 ? `Unexpected in ${label}:\n${unexpected.join('\n')}` : '',
    ].filter(Boolean).join('\n\n');
    throw new Error(details);
  }
}

// Parse one machine-readable count marker shared by the ledger and inventory appendix.
function readCountMarker(markdown, label) {
  const match = markdown.match(/<!-- migration-roadmap-counts: ts=(\d+) generated=(\d+) active_js=(\d+) candidates=(\d+) -->/);
  if (!match) {
    throw new Error(`Missing migration-roadmap-counts marker in ${label}`);
  }
  return {
    ts: Number(match[1]),
    generated: Number(match[2]),
    activeJs: Number(match[3]),
    candidates: Number(match[4]),
  };
}

// Parse phase assignments from the inventory table for cross-document count checks.
function readInventoryPhaseCounts(activeSection) {
  const counts = new Map();
  for (const line of activeSection.split(/\r?\n/)) {
    const match = line.match(/^\|\s*(\d+)\s*\|/);
    if (!match) {
      continue;
    }
    counts.set(Number(match[1]), extractJavaScriptPaths(line).length);
  }
  return counts;
}

// Parse the explicit module count embedded in each future-phase scope cell.
function readPlanPhaseCounts(planMarkdown) {
  const counts = new Map();
  for (const line of planMarkdown.split(/\r?\n/)) {
    const phaseMatch = line.match(/^\|\s*(\d+)\s*\|/);
    if (!phaseMatch || Number(phaseMatch[1]) < 21 || Number(phaseMatch[1]) > 55) {
      continue;
    }
    const countMatch = line.match(/;\s*(\d+)\s+(?:module|modules|backlog conversions)\b/);
    if (!countMatch) {
      throw new Error(`Phase ${phaseMatch[1]} lacks an explicit module count in the main plan`);
    }
    counts.set(Number(phaseMatch[1]), Number(countMatch[1]));
  }
  return counts;
}

// Build the live classification from the source tree and browser import graph.
const javascriptFiles = sourceRoots.flatMap((root) => (
  collectSourceFiles(path.join(rootDir, root), '.js')
));
const typeScriptFiles = sourceRoots.flatMap((root) => (
  collectSourceFiles(path.join(rootDir, root), '.ts')
)).filter((filePath) => !filePath.endsWith('.d.ts'));
const generatedJavaScript = new Set(typeScriptFiles
  .map((filePath) => toRepoPath(filePath).replace(/\.ts$/, '.js'))
  .filter((repoPath) => fs.existsSync(path.join(rootDir, repoPath))));
const authoredJavaScript = new Set(javascriptFiles
  .map(toRepoPath)
  .filter((repoPath) => !generatedJavaScript.has(repoPath)));
const reachableRuntime = collectReachableRuntimeFiles(path.join(rootDir, 'assets', 'main.js'));
const activeJavaScript = new Set([...authoredJavaScript]
  .filter((repoPath) => reachableRuntime.has(repoPath)));
const candidateJavaScript = new Set([...authoredJavaScript]
  .filter((repoPath) => !reachableRuntime.has(repoPath)));

// Read both authoritative roadmap surfaces and their scoped path tables.
const inventoryMarkdown = fs.readFileSync(inventoryPath, 'utf8');
const planMarkdown = fs.readFileSync(planPath, 'utf8');
const activeSection = readSection(
  inventoryMarkdown,
  '## Active module-to-phase coverage',
  '## Retirement/deletion candidates and ambiguous files',
);
const candidateSection = readSection(
  inventoryMarkdown,
  '## Retirement/deletion candidates and ambiguous files',
  '## Mechanical reconciliation rules',
);
const documentedActive = toUniqueSet(extractJavaScriptPaths(activeSection), 'Active coverage');
const documentedCandidates = toUniqueSet(extractJavaScriptPaths(candidateSection), 'Decision coverage');

// Require the live graph and documentation classifications to match path-for-path.
assertSameSet(activeJavaScript, documentedActive, 'active coverage');
assertSameSet(candidateJavaScript, documentedCandidates, 'decision coverage');

// Require the human-readable ledger and appendix to publish the same live totals.
const actualCounts = {
  ts: typeScriptFiles.length,
  generated: generatedJavaScript.size,
  activeJs: activeJavaScript.size,
  candidates: candidateJavaScript.size,
};
for (const [label, marker] of [
  ['inventory', readCountMarker(inventoryMarkdown, 'inventory')],
  ['main plan', readCountMarker(planMarkdown, 'main plan')],
]) {
  if (JSON.stringify(marker) !== JSON.stringify(actualCounts)) {
    throw new Error(`${label} count marker ${JSON.stringify(marker)} does not match live counts ${JSON.stringify(actualCounts)}`);
  }
}

// Require every conversion phase's advertised count to match its exact inventory row.
const inventoryPhaseCounts = readInventoryPhaseCounts(activeSection);
inventoryPhaseCounts.set(54, 0);
const planPhaseCounts = readPlanPhaseCounts(planMarkdown);
for (let phase = 21; phase <= 55; phase += 1) {
  if (!inventoryPhaseCounts.has(phase)) {
    throw new Error(`Inventory appendix has no assignment row or gate for Phase ${phase}`);
  }
  if (planPhaseCounts.get(phase) !== inventoryPhaseCounts.get(phase)) {
    throw new Error(`Phase ${phase} count mismatch: plan=${planPhaseCounts.get(phase)}, inventory=${inventoryPhaseCounts.get(phase)}`);
  }
}

console.log(
  `Migration roadmap verified: ${actualCounts.ts} TS sources, ${actualCounts.generated} generated siblings, `
  + `${actualCounts.activeJs} active JS modules, ${actualCounts.candidates} decision candidates.`,
);
