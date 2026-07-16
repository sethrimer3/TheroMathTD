export function createPowderDisplaySystem({
  powderState,
  powderConfig,
  powderGlyphColumns,
  formatGameNumber,
  formatDecimal,
  formatPercentage,
  renderMathElement,
  getBaseStartThero,
  resourceState,
  baseResources,
  recordPowderEvent,
  notifyPowderAction,
  notifyPowderMultiplier,
  notifyPowderSigils,
  updateStatusDisplays,
  THERO_SYMBOL,
  updatePowderLogDisplay,
  updateMoteGemInventoryDisplay,
  SIGIL_LADDER_IS_STUB,
  getPowderSimulation,
}) {
  let powderCurrency = 0;
  let powderBasinPulseTimer = null;
  let currentPowderBonuses = {
    sandBonus: 0,
    duneBonus: 0,
    crystalBonus: 0,
    totalMultiplier: 1,
  };

  const powderElements = {
    sandfallFormula: null,
    sandfallNote: null,
    sandfallButton: null,
    duneFormula: null,
    duneNote: null,
    duneButton: null,
    crystalFormula: null,
    crystalNote: null,
    crystalButton: null,
    stockpile: null,
    nextGlyphProgress: null,
    gemInventoryList: null,
    gemInventoryEmpty: null,
    craftingButton: null,
    ledgerBaseScore: null,
    ledgerCurrentScore: null,
    ledgerFlux: null,
    ledgerEnergy: null,
    sigilEntries: [],
    logList: null,
    logEmpty: null,
    simulationCanvas: null,
    simulationCard: null,
    basin: null,
    viewport: null,
    wallMarker: null,
    wallGlyphColumns: [],
    leftWall: null,
    rightWall: null,
    leftHitbox: null,
    rightHitbox: null,
    modeToggle: null,
    stage: null,
    tierGoldenAleph: null,
  };

  function setPowderCurrency(value) {
    const normalized = Number.isFinite(value) ? Math.max(0, value) : 0;
    powderCurrency = normalized;
    updatePowderStockpileDisplay();
  }

  function getPowderCurrency() {
    return powderCurrency;
  }

  function getCurrentPowderBonuses() {
    return currentPowderBonuses;
  }

  function resetPowderUiState() {
    currentPowderBonuses = {
      sandBonus: 0,
      duneBonus: 0,
      crystalBonus: 0,
      totalMultiplier: 1,
    };
    if (powderBasinPulseTimer) {
      clearTimeout(powderBasinPulseTimer);
      powderBasinPulseTimer = null;
    }
    if (powderElements.nextGlyphProgress) {
      powderElements.nextGlyphProgress.textContent = '—';
    }
  }

  function calculatePowderBonuses() {
    const sandBonus = powderState.sandOffset > 0 ? 0.15 + powderState.sandOffset * 0.03 : 0;
    const effectiveDuneHeight = Math.max(1, powderState.duneHeight + powderState.simulatedDuneGain);
    const duneBonus = Math.log2(effectiveDuneHeight + 1) * 0.04;

    const baseCrystalProduct = powderConfig.thetaBase * powderConfig.zetaBase;
    const chargedTheta = powderConfig.thetaBase + powderState.charges * 0.6;
    const chargedZeta = powderConfig.zetaBase + powderState.charges * 0.5;
    const crystalGain = Math.max(0, Math.sqrt(chargedTheta * chargedZeta) - Math.sqrt(baseCrystalProduct));
    const crystalBonus = crystalGain * 0.05;

    const totalMultiplier = 1 + sandBonus + duneBonus + crystalBonus;

    return { sandBonus, duneBonus, crystalBonus, totalMultiplier };
  }

  function updateResourceRates() {
    currentPowderBonuses = calculatePowderBonuses();
    const totalMultiplier = Math.max(0, currentPowderBonuses.totalMultiplier || 1);
    resourceState.scoreRate = baseResources.scoreRate * totalMultiplier;
    resourceState.energyRate = baseResources.energyRate * totalMultiplier;
    resourceState.fluxRate = baseResources.fluxRate * totalMultiplier;
    updateStatusDisplays();
  }

  function updatePowderStockpileDisplay() {
    if (powderElements.stockpile) {
      powderElements.stockpile.textContent = `${formatGameNumber(powderCurrency)} Mote Gems`;
    }
  }

  function updatePowderLedger() {
    if (powderElements.ledgerBaseScore) {
      powderElements.ledgerBaseScore.textContent = `${formatGameNumber(getBaseStartThero())} ${THERO_SYMBOL}`;
    }
    if (powderElements.ledgerCurrentScore) {
      powderElements.ledgerCurrentScore.textContent = `${formatGameNumber(resourceState.score)} ${THERO_SYMBOL}`;
    }
    if (powderElements.ledgerFlux) {
      powderElements.ledgerFlux.textContent = `${formatGameNumber(resourceState.fluxRate)} Flux/sec`;
    }
    if (powderElements.ledgerEnergy) {
      powderElements.ledgerEnergy.textContent = `${formatGameNumber(resourceState.energyRate)} Energy/sec`;
    }
  }

  function bindPowderControls() {
    powderElements.stockpile = document.getElementById('powder-stockpile');
    powderElements.nextGlyphProgress = document.getElementById('powder-next-glyph-progress');
    powderElements.gemInventoryList = document.getElementById('powder-gem-inventory');
    powderElements.gemInventoryEmpty = document.getElementById('powder-gem-empty');
    powderElements.craftingButton = document.getElementById('powder-crafting-button');
    powderElements.ledgerBaseScore =
      document.getElementById('powder-ledger-base-score') || document.getElementById('powder-ledger-base');
    powderElements.ledgerCurrentScore =
      document.getElementById('powder-ledger-current-score') || document.getElementById('powder-ledger-score');
    powderElements.ledgerFlux = document.getElementById('powder-ledger-flux');
    powderElements.ledgerEnergy = document.getElementById('powder-ledger-energy');
    powderElements.logList = document.getElementById('powder-log');
    powderElements.logEmpty = document.getElementById('powder-log-empty');
    powderElements.simulationCanvas = document.getElementById('powder-canvas');
    powderElements.simulationCard = document.getElementById('powder-simulation-card');
    powderElements.stage = document.getElementById('powder-stage');
    powderElements.basin = document.getElementById('powder-basin');
    powderElements.viewport = document.getElementById('powder-viewport');
    powderElements.wallMarker = document.getElementById('powder-wall-marker');
    powderElements.leftWall = document.getElementById('powder-wall-left');
    powderElements.rightWall = document.getElementById('powder-wall-right');
    powderElements.leftHitbox = document.getElementById('powder-wall-hitbox-left');
    powderElements.rightHitbox = document.getElementById('powder-wall-hitbox-right');
    powderElements.sandfallFormula = document.getElementById('powder-sandfall-formula');
    powderElements.sandfallNote = document.getElementById('powder-sandfall-note');
    powderElements.sandfallButton = document.getElementById('powder-sandfall-button');
    powderElements.duneFormula = document.getElementById('powder-dune-formula');
    powderElements.duneNote = document.getElementById('powder-dune-note');
    powderElements.duneButton = document.getElementById('powder-dune-button');
    powderElements.crystalFormula = document.getElementById('powder-crystal-formula');
    powderElements.crystalNote = document.getElementById('powder-crystal-note');
    powderElements.crystalButton = document.getElementById('powder-crystal-button');
    powderElements.tierGoldenAleph = document.getElementById('powder-tier-golden-aleph');

    const glyphColumnNodes = document.querySelectorAll('[data-powder-glyph-column]');
    powderElements.wallGlyphColumns = Array.from(glyphColumnNodes);
    powderGlyphColumns.length = 0;
    powderElements.wallGlyphColumns.forEach((element) => {
      powderGlyphColumns.push({ element, glyphs: new Map() });
    });

    const sigilList = document.getElementById('powder-sigil-list');
    powderElements.sigilEntries = sigilList ? Array.from(sigilList.querySelectorAll('li')) : [];

    if (powderElements.sandfallButton) {
      powderElements.sandfallButton.addEventListener('click', (event) => {
        event.preventDefault();
        toggleSandfallStability();
      });
    }

    if (powderElements.duneButton) {
      powderElements.duneButton.addEventListener('click', (event) => {
        event.preventDefault();
        surveyRidgeHeight();
      });
    }

    if (powderElements.crystalButton) {
      powderElements.crystalButton.addEventListener('click', (event) => {
        event.preventDefault();
        chargeCrystalMatrix();
      });
    }

    updateMoteGemInventoryDisplay();
    updatePowderLogDisplay();
    updatePowderLedger();
    updatePowderDisplay();
  }

  function triggerPowderBasinPulse() {
    if (!powderElements.basin) {
      return;
    }
    powderElements.basin.classList.remove('powder-basin--pulse');
    if (powderBasinPulseTimer) {
      clearTimeout(powderBasinPulseTimer);
    }
    requestAnimationFrame(() => {
      if (!powderElements.basin) {
        return;
      }
      powderElements.basin.classList.add('powder-basin--pulse');
      powderBasinPulseTimer = setTimeout(() => {
        if (powderElements.basin) {
          powderElements.basin.classList.remove('powder-basin--pulse');
        }
        powderBasinPulseTimer = null;
      }, 900);
    });
  }

  function toggleSandfallStability() {
    powderState.sandOffset =
      powderState.sandOffset > 0 ? powderConfig.sandOffsetInactive : powderConfig.sandOffsetActive;

    const powderSimulation = getPowderSimulation();
    if (powderSimulation) {
      powderSimulation.setFlowOffset(powderState.sandOffset);
    }

    refreshPowderSystems();
    recordPowderEvent(powderState.sandOffset > 0 ? 'sand-stabilized' : 'sand-released');
    notifyPowderAction();
  }

  function surveyRidgeHeight() {
    if (powderState.duneHeight >= powderConfig.duneHeightMax) {
      recordPowderEvent('dune-max');
      return;
    }

    powderState.duneHeight += 1;
    refreshPowderSystems();
    recordPowderEvent('dune-raise', { height: powderState.duneHeight });
    notifyPowderAction();
  }

  function releaseCrystalPulse(charges) {
    const chargedTheta = powderConfig.thetaBase + charges * 0.6;
    const chargedZeta = powderConfig.zetaBase + charges * 0.5;
    const resonance = Math.sqrt(chargedTheta * chargedZeta);
    const pulseBonus = resonance * 0.008;

    resourceState.score += resourceState.score * pulseBonus;
    updateStatusDisplays();

    return pulseBonus;
  }

  function chargeCrystalMatrix() {
    if (powderState.charges < 3) {
      powderState.charges += 1;
      refreshPowderSystems();
      recordPowderEvent('crystal-charge', { charges: powderState.charges });
      notifyPowderAction();
      return;
    }

    const pulseBonus = releaseCrystalPulse(powderState.charges);
    powderState.charges = 0;
    refreshPowderSystems(pulseBonus);
    recordPowderEvent('crystal-release', { pulseBonus });
    notifyPowderAction();
  }

  function refreshPowderSystems(pulseBonus) {
    updateResourceRates();
    updatePowderDisplay(pulseBonus);
  }

  function updatePowderDisplay(pulseBonus) {
    const totalMultiplier = currentPowderBonuses.totalMultiplier;
    notifyPowderMultiplier(totalMultiplier);

    if (SIGIL_LADDER_IS_STUB) {
      if (powderElements.sigilEntries && powderElements.sigilEntries.length) {
        powderElements.sigilEntries.forEach((sigil) => {
          sigil.classList.remove('sigil-reached');
        });
      }
      notifyPowderSigils(0);
    } else if (powderElements.sigilEntries && powderElements.sigilEntries.length) {
      let reached = 0;
      powderElements.sigilEntries.forEach((sigil) => {
        const threshold = Number.parseFloat(sigil.dataset.sigilThreshold);
        if (!Number.isFinite(threshold)) {
          return;
        }
        if (totalMultiplier >= threshold) {
          sigil.classList.add('sigil-reached');
          reached += 1;
        } else {
          sigil.classList.remove('sigil-reached');
        }
      });
      notifyPowderSigils(reached);
    } else {
      notifyPowderSigils(0);
    }

    updatePowderLedger();

    if (powderElements.sandfallFormula) {
      const offset = powderState.sandOffset;
      powderElements.sandfallFormula.textContent =
        offset > 0 ? `\\( \\Psi(g) = 2.7\\, \\sin(t) + ${formatDecimal(offset, 1)} \\)` : '\\( \\Psi(g) = 2.7\\, \\sin(t) \\)';
      renderMathElement(powderElements.sandfallFormula);
    }

    if (powderElements.sandfallNote) {
      const bonusText = formatPercentage(currentPowderBonuses.sandBonus);
      powderElements.sandfallNote.textContent =
        powderState.sandOffset > 0
          ? `Flow stabilized—captured grains grant +${bonusText} Mote Gems.`
          : 'Crest is unstable—Mote Gems drift off the board.';
    }

    if (powderElements.sandfallButton) {
      powderElements.sandfallButton.textContent = powderState.sandOffset > 0 ? 'Release Flow' : 'Stabilize Flow';
    }

    if (powderElements.duneFormula) {
      const height = Math.max(1, powderState.duneHeight + powderState.simulatedDuneGain);
      const logValue = Math.log2(height + 1);
      powderElements.duneFormula.textContent = `\\( \\Delta m = \\log_{2}(${formatDecimal(height, 2)} + 1) = ${formatDecimal(
        logValue,
        2,
      )} \\)`;
      renderMathElement(powderElements.duneFormula);
    }

    if (powderElements.duneNote) {
      const crestHeight = Math.max(1, powderState.duneHeight + powderState.simulatedDuneGain);
      powderElements.duneNote.textContent = `Channel bonus: +${formatPercentage(
        currentPowderBonuses.duneBonus,
      )} to energy gain · crest h = ${formatDecimal(crestHeight, 2)}.`;
    }

    if (powderElements.duneButton) {
      const reachedMax = powderState.duneHeight >= powderConfig.duneHeightMax;
      powderElements.duneButton.disabled = reachedMax;
      powderElements.duneButton.textContent = reachedMax ? 'Ridge Surveyed' : 'Survey Ridge';
    }

    if (powderElements.crystalFormula) {
      const charges = powderState.charges;
      const theta = powderConfig.thetaBase + charges * 0.6;
      const zeta = powderConfig.zetaBase + charges * 0.5;
      const root = Math.sqrt(theta * zeta);
      powderElements.crystalFormula.textContent = `\\( Q = \\sqrt{${formatDecimal(theta, 2)} \\cdot ${formatDecimal(
        zeta,
        2,
      )}} = ${formatDecimal(root, 2)} \\)`;
      renderMathElement(powderElements.crystalFormula);
    }

    if (powderElements.crystalButton) {
      powderElements.crystalButton.textContent = powderState.charges < 3 ? `Crystallize (${powderState.charges}/3)` : 'Release Pulse';
    }

    if (powderElements.crystalNote) {
      if (typeof pulseBonus === 'number') {
        powderElements.crystalNote.textContent = `Pulse released! Σ score surged by +${formatPercentage(pulseBonus)}.`;
      } else if (powderState.charges >= 3) {
        powderElements.crystalNote.textContent = 'Pulse ready—channel the matrix to unleash stored Σ energy.';
      } else if (currentPowderBonuses.crystalBonus <= 0) {
        powderElements.crystalNote.textContent = 'Crystal resonance is dormant—no pulse prepared.';
      } else {
        powderElements.crystalNote.textContent = `Stored resonance grants +${formatPercentage(
          currentPowderBonuses.crystalBonus,
        )} to all rates.`;
      }
    }

    updatePowderStockpileDisplay();
  }

  return {
    powderElements,
    bindPowderControls,
    updateResourceRates,
    updatePowderStockpileDisplay,
    updatePowderLedger,
    triggerPowderBasinPulse,
    toggleSandfallStability,
    surveyRidgeHeight,
    chargeCrystalMatrix,
    refreshPowderSystems,
    updatePowderDisplay,
    getPowderCurrency,
    setPowderCurrency,
    getCurrentPowderBonuses,
    resetPowderUiState,
  };
}
