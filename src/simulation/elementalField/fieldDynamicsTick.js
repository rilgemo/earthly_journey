const { addFieldDelta, cloneFieldState, snapshotAreas } = require('./fieldState');
const { diffuseFields } = require('./diffusionEngine');
const { applyConversions } = require('./conversionMatrix');
const { restoreEquilibrium } = require('./equilibriumEngine');

function applyPerturbations(tiles, perturbations = []) {
  const next = Object.fromEntries(
    Object.entries(tiles).map(([tileId, tile]) => [
      tileId,
      { ...tile, field: cloneFieldState(tile.field) }
    ])
  );

  perturbations.forEach(request => {
    if (!next[request.tileId]) return;
    next[request.tileId].field = addFieldDelta(next[request.tileId].field, request.perturbation);
  });

  return next;
}

function runFieldDynamicsTick(areas, perturbations = [], config = {}) {
  const initial = snapshotAreas(areas);
  const perturbed = applyPerturbations(initial, perturbations);
  const preDiffusionState = Object.fromEntries(
    Object.entries(perturbed).map(([tileId, tile]) => [tileId, cloneFieldState(tile.field)])
  );
  const diffused = diffuseFields(perturbed, config.diffusionRate ?? 0.1);
  const postDiffusionState = Object.fromEntries(
    Object.entries(diffused).map(([tileId, tile]) => [tileId, cloneFieldState(tile.field)])
  );
  const conversion = applyConversions(diffused, config.conversionRate ?? 0.01, config.conversionMatrix);
  const equilibrium = restoreEquilibrium(conversion.tiles, config.regenRate ?? 0.01);
  const finalFieldState = Object.fromEntries(
    Object.entries(equilibrium.tiles).map(([tileId, tile]) => [tileId, cloneFieldState(tile.field)])
  );

  return {
    preDiffusionState,
    postDiffusionState,
    conversionEvents: conversion.conversionEvents,
    equilibriumDelta: equilibrium.equilibriumDelta,
    finalFieldState
  };
}

module.exports = {
  applyPerturbations,
  runFieldDynamicsTick
};
