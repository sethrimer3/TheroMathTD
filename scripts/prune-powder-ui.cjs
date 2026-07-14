'use strict';
const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '..', 'assets', 'powderUiDomHelpers.js');
let source = fs.readFileSync(file, 'utf8');
function cut(start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw new Error(`Missing ${start} ... ${end}`);
  source = source.slice(0, a) + source.slice(b);
}
source = source.replace("import { formatAlephLabel, formatBetLabel } from './formatHelpers.js';", "import { formatAlephLabel } from './formatHelpers.js';");
source = source.replace(' * Factory that bundles DOM helpers used by the powder and Bet Spire Terrarium overlays.', ' * Factory that bundles DOM helpers used by the Well of Inspiration overlay.');
source = source.replace(/\r?\n    fluidElements,\r?\n    achievementsTerrariumElements,/, '');
source = source.replace(/\r?\n    fluidGlyphColumns = \[\],/, '');
cut('  // Collect references to the Bet Spire UI so powderDisplay can hydrate the fluid viewport.', '  function applyMindGatePaletteToDom');
cut('  function removeFluidGlyph(', '  return {\r\n    bindFluidControls,');
source = source.replace('  return {\r\n    bindFluidControls,\r\n    bindAchievementsTerrariumControls,\r\n', '  return {\r\n');
source = source.replace('    updatePowderGlyphColumns,\r\n    updateFluidGlyphColumns,', '    updatePowderGlyphColumns,');
fs.writeFileSync(file, source);
console.log('Powder UI helper isolated from legacy Terrarium code.');
