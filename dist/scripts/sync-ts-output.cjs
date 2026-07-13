// Copies tsc's compiled .js output (build/ts-out/) back over the matching
// source files in assets/, so the runtime import graph and the no-build
// "open index.html directly" workflow keep working with plain .js files.
//
// We intentionally do NOT set tsc's outDir to the same folder as the .ts
// sources: doing so makes tsc refuse to emit because allowJs pulls in the
// plain-JS files those modules import (e.g. assets/autoSave.js) as
// "inputs", and tsc will not overwrite an input file with its own output.
// Instead tsc emits to build/ts-out/, and this script selectively copies
// back only the files that were actually authored as .ts, leaving every
// plain .js file (and its behavior) completely untouched.
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const tsOutDir = path.join(rootDir, 'build', 'ts-out');
const tsconfigPath = path.join(rootDir, 'tsconfig.json');

const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
const tsSources = tsconfig.include || [];

if (!tsSources.length) {
  console.warn('sync-ts-output: no TypeScript sources listed in tsconfig.json include[].');
}

for (const relativeTsPath of tsSources) {
  const relativeJsPath = relativeTsPath.replace(/\.ts$/, '.js');
  const compiledPath = path.join(tsOutDir, path.basename(relativeJsPath));
  const destinationPath = path.join(rootDir, relativeJsPath);

  if (!fs.existsSync(compiledPath)) {
    throw new Error(`sync-ts-output: expected compiled output at ${compiledPath}, but it was not found.`);
  }

  fs.copyFileSync(compiledPath, destinationPath);
  console.log(`sync-ts-output: ${path.relative(rootDir, compiledPath)} -> ${relativeJsPath}`);
}
