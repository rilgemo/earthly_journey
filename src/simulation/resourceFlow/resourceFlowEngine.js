const { freezeSnapshot } = require('../behavior/behaviorTraceRecorder');
const { createResourceMap } = require('../resourceGeography/resourceMap');
const { createResourceSnapshot } = require('../resourceGeography/resourceSnapshot');
const { applyDepletion, collectDepletion } = require('./depletionModel');
const { applyDiffusion } = require('./flowGradient');
const { applyRegeneration } = require('./regenerationModel');
const { calculateBalance, clampTile, cloneTiles } = require('./resourceBalance');

function runResourceFlowTick({
  resourceMap,
  baselineMap,
  actionYieldSnapshots = [],
  world = {},
  config = {}
}) {
  if (!resourceMap) {
    return { resourceMap: null, trace: null };
  }

  const preSnapshot = createResourceSnapshot(resourceMap);
  const baseline = baselineMap || resourceMap;
  const tiles = cloneTiles(resourceMap);
  const depletion = collectDepletion(actionYieldSnapshots, config);
  applyDepletion(tiles, depletion.byTile);
  const postDepletionMap = createResourceMap({ width: resourceMap.width, height: resourceMap.height, tiles });
  const regeneration = applyRegeneration(tiles, baseline.tiles || {}, world, config);
  const postRegenerationMap = createResourceMap({ width: resourceMap.width, height: resourceMap.height, tiles });
  const diffusion = applyDiffusion(tiles, config);
  const clampedTiles = Object.fromEntries(Object.entries(diffusion.tiles)
    .map(([tileId, tile]) => [tileId, clampTile(tile)]));
  const updatedMap = createResourceMap({
    width: resourceMap.width,
    height: resourceMap.height,
    tiles: clampedTiles
  });
  const postSnapshot = createResourceSnapshot(updatedMap);

  return {
    resourceMap: updatedMap,
    trace: freezeSnapshot({
      preResourceState: preSnapshot,
      postDepletionState: createResourceSnapshot(postDepletionMap),
      postRegenerationState: createResourceSnapshot(postRegenerationMap),
      finalResourceState: postSnapshot,
      depletionHeatmap: depletion.byTile,
      depletionEvents: depletion.events,
      regenerationMap: regeneration.deltas,
      diffusionVectors: diffusion.vectors,
      balance: calculateBalance(resourceMap, updatedMap)
    })
  };
}

module.exports = {
  runResourceFlowTick
};
