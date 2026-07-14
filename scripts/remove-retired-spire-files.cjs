'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const files = [
  'assets/betParticleInventory.js', 'assets/betSpireConfig.js', 'assets/betSpireDrawSystem.js',
  'assets/betSpireForgeSystem.js', 'assets/betSpireInputSystem.js', 'assets/betSpireMergeSystem.js',
  'assets/betSpireParticle.js', 'assets/betSpireParticlePreferences.js', 'assets/betSpirePlaceholder.js',
  'assets/betSpireRender.js', 'assets/betSpireUpgradeMenu.js', 'assets/cardinalWardenUI.js',
  'assets/lamedSpirePreferences.js', 'assets/lamedSpireUi.js', 'assets/tsadiBindingUi.js',
  'assets/tsadiMoleculeNameGenerator.js', 'assets/tsadiSpirePreferences.js', 'assets/tsadiUpgradeUi.js',
  'assets/tsadiVermiculateBackground.js', 'assets/shinGraphemeCodex.js', 'assets/shinGraphemeCodexUI.js',
  'assets/shinShapeBackground.js', 'assets/shinSpirePreferences.js', 'assets/shinState.js', 'assets/shinUI.js',
  'assets/kufCombatSystem.js', 'assets/kufEnemyDefinitions.js', 'assets/kufInputController.js',
  'assets/kufMapData.js', 'assets/kufRenderer.js', 'assets/kufSimulation.js', 'assets/kufSimulationConfig.js',
  'assets/kufSpirePreferences.js', 'assets/kufState.js', 'assets/kufTrainingSystem.js', 'assets/kufUI.js',
  'assets/data/kufMaps.json', 'assets/data/shinFractals.json', 'assets/data/shinFractalTree.json',
  'assets/audio/sfx/lamed_spire_rumble.ogg', 'assets/sprites/idleScreen/bet_resourceIcon.webp',
  'assets/sprites/idleScreen/lamed__resourceIcon.webp', 'assets/sprites/idleScreen/tsadi_resourceIcon.webp',
  'assets/sprites/idleScreen/shin_resourceIcon.webp', 'assets/sprites/idleScreen/kuf_resourceIcon.webp',
  'scripts/features/towers/fluidTower.js', 'scripts/features/towers/lamedStarfield.js',
  'scripts/features/towers/lamedTower.js', 'scripts/features/towers/lamedTowerData.js',
  'scripts/features/towers/lamedTowerPhysics.js', 'scripts/features/towers/lamedTowerRenderer.js',
  'scripts/features/towers/tsadiBindingSystem.js', 'scripts/features/towers/tsadiTower.js',
  'scripts/features/towers/tsadiTowerData.js', 'scripts/features/towers/tsadiTowerPhysics.js',
  'scripts/features/towers/tsadiTowerRenderer.js',
  'docs/IDLE_SYSTEM.md', 'docs/bet-spire-sprite-guide.md', 'docs/LAMED_PHASE_FIX.md',
  'docs/SHIN_SPIRE_TRANSLATION.md', 'docs/SPIRE_IDLE_IMPLEMENTATION_SUMMARY.md', 'docs/SPIRE_IDLE_REWORK.md',
];
const dirs = [
  'assets/sprites/spires/lamedSpire', 'assets/sprites/spires/tsadiSpire',
  'assets/sprites/spires/shinSpire', 'assets/sprites/spires/kufSpire',
  'assets/sprites/spires/betSpire/generators', 'scripts/features/kuf',
];
for (const relative of files) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep)) throw new Error(`Unsafe target ${target}`);
  if (fs.existsSync(target)) fs.rmSync(target);
}
for (const relative of dirs) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep)) throw new Error(`Unsafe target ${target}`);
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true });
}
console.log('Retired spire source, data, docs, and exclusive assets removed.');
