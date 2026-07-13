// Copies tsc's compiled .js output (build/ts-out/) back over the matching
// source files next to their .ts sources, so the runtime import graph and the
// no-build "open index.html directly" workflow keep working with plain .js
// files.
//
// We intentionally do NOT set tsc's outDir to the same folder as the .ts
// sources: doing so makes tsc refuse to emit because allowJs pulls in the
// plain-JS files those modules import (e.g. assets/autoSave.js) as
// "inputs", and tsc will not overwrite an input file with its own output.
// Instead tsc emits to build/ts-out/, and this script selectively copies
// back only the compiled files that correspond to an authored .ts source,
// leaving every plain .js file (and its behavior) completely untouched.
//
// tsconfig.json's `include` is a glob (`assets/**/*.ts`, `scripts/**/*.ts`)
// rather than an explicit file list, so this script cannot enumerate sources
// from tsconfig directly. Instead it recursively walks build/ts-out/ (the
// compiled output tree, which mirrors rootDir "." via tsc's directory
// structure) and, for every compiled .js file found there, checks whether a
// same-relative-path .ts file exists back in the repo. If it does, that .js
// is a genuine compiled sibling of an authored .ts module and gets copied
// back. If it doesn't (e.g. the .js was only pulled in by `allowJs` for type
// inference from some other .ts file, or is a declaration file), it is left
// alone — those aren't authored TypeScript output and must not be copied
// over unrelated hand-written JavaScript.
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const tsOutDir = path.join(rootDir, 'build', 'ts-out');

/** Recursively collect every file path under `dir` (absolute paths). */
function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return out;
    throw err;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

if (!fs.existsSync(tsOutDir)) {
  console.warn(`sync-ts-output: compiled output directory not found at ${tsOutDir}; nothing to sync.`);
  process.exit(0);
}

const compiledFiles = walk(tsOutDir, []);

// Only plain compiled .js files count — skip declaration files (.d.ts),
// declaration maps (.d.ts.map), and source maps; those are not the runtime
// module siblings this script exists to restore.
const compiledJsFiles = compiledFiles.filter(
  (file) => file.endsWith('.js') && !file.endsWith('.d.js')
);

let syncedCount = 0;

for (const compiledPath of compiledJsFiles) {
  const relativeJsPath = path.relative(tsOutDir, compiledPath);
  const relativeTsPath = relativeJsPath.replace(/\.js$/, '.ts');
  const sourceTsPath = path.join(rootDir, relativeTsPath);

  // Only copy back compiled output that corresponds to an authored .ts
  // source still present in the repo. This is what excludes plain .js files
  // that allowJs merely pulled into the program for type-checking (they have
  // no .ts sibling and must not be overwritten).
  if (!fs.existsSync(sourceTsPath)) {
    continue;
  }

  const destinationPath = path.join(rootDir, relativeJsPath);
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(compiledPath, destinationPath);
  console.log(`sync-ts-output: ${path.relative(rootDir, compiledPath)} -> ${relativeJsPath}`);
  syncedCount += 1;
}

if (syncedCount === 0) {
  console.warn('sync-ts-output: no compiled .js output matched an authored .ts source.');
}
