const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const entriesToCopy = ['index.html', 'assets', 'scripts'];

function copyEntry(name) {
  const source = path.join(rootDir, name);
  const target = path.join(distDir, name);

  if (!fs.existsSync(source)) {
    throw new Error(`Missing required build entry: ${name}`);
  }

  fs.cpSync(source, target, {
    recursive: true,
    force: true,
    errorOnExist: false,
    // Skip TypeScript sources: compiled .js siblings (produced by `tsc` +
    // scripts/sync-ts-output.cjs, run before this script as part of `npm run
    // build`) already sit next to them and are what the runtime imports.
    filter: (src) => !src.endsWith('.ts'),
  });
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const entry of entriesToCopy) {
  copyEntry(entry);
}

console.log(`Static build copied ${entriesToCopy.join(', ')} to dist/.`);
