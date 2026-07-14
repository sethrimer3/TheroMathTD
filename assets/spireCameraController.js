'use strict';

/**
 * Factory that manages Well of Inspiration camera controls (zoom and pan).
 * Retired Spire camera hooks are intentionally excluded from the active runtime.
 *
 * @param {object} deps
 * @param {object} deps.powderState - Shared Well of Inspiration state.
 * @param {Function} deps.getPowderSimulation - Returns the active simulation.
 * @param {Function} deps.handlePowderViewTransformChange - Handles camera updates.
 * @param {Function} deps.handlePowderWallMetricsChange - Handles wall metric updates.
 */
export function createSpireCameraController({
  powderState,
  getPowderSimulation,
  handlePowderViewTransformChange,
  handlePowderWallMetricsChange,
}) {
  /** Restore the Well of Inspiration to its default framing. */
  function resetPowderCameraTransform() {
    const powderSimulation = getPowderSimulation();
    if (!powderSimulation) return;

    if (typeof powderSimulation.setZoom === 'function') {
      powderSimulation.setZoom(1);
    } else if (typeof powderSimulation.applyZoomFactor === 'function') {
      const currentScale = powderSimulation.getViewTransform?.()?.scale || 1;
      if (Math.abs(currentScale - 1) > 0.0001) {
        powderSimulation.applyZoomFactor(1 / currentScale);
      }
    }
    if (typeof powderSimulation.setViewCenterNormalized === 'function') {
      powderSimulation.setViewCenterNormalized({ x: 0.5, y: 0.5 });
    }
    handlePowderViewTransformChange(powderSimulation.getViewTransform());
  }

  /** Toggle camera controls and optionally reset the view transform. */
  function setPowderCameraMode(enabled, options = {}) {
    const nextState = Boolean(enabled);
    powderState.alephCameraMode = nextState;
    if (!nextState && !options.skipTransformReset) {
      if (getPowderSimulation()) {
        resetPowderCameraTransform();
      } else {
        powderState.viewTransform = { scale: 1, normalizedCenter: { x: 0.5, y: 0.5 } };
      }
    }
  }

  /** Refresh wall decorations for the sole active Spire simulation. */
  function refreshPowderWallDecorations() {
    const powderSimulation = getPowderSimulation();
    handlePowderWallMetricsChange(
      powderSimulation ? powderSimulation.getWallMetrics() : null,
      'sand',
    );
  }

  return {
    resetPowderCameraTransform,
    setPowderCameraMode,
    refreshPowderWallDecorations,
  };
}
