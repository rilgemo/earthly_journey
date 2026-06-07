const { freezeSnapshot } = require('../behavior/behaviorTraceRecorder');
const { calculatePressure } = require('./pressureModel');

function createFallbackRegion(trace = {}) {
  const activeTiles = [...new Set((trace.agents || [])
    .map(agent => agent.position)
    .filter(Boolean))];
  if (!activeTiles.length) return [];
  return [{
    id: `region:${activeTiles.sort().join('|')}`,
    tiles: activeTiles,
    persistenceScore: 0,
    metrics: {}
  }];
}

function createPopulationTensionMap({
  trace = {},
  settlements = trace.settlements,
  perceptionDrift = {},
  trustNetwork = {},
  behaviorSignatures = {}
} = {}) {
  const regions = settlements?.settlements?.length
    ? settlements.settlements
    : createFallbackRegion(trace);

  const regionPressures = regions.map(region => ({
    regionId: region.id,
    tiles: [...(region.tiles || [])],
    ...calculatePressure({
      settlement: region,
      trace,
      perceptionDrift,
      trustNetwork,
      behaviorSignatures
    })
  }));

  return freezeSnapshot({
    tick: trace.tickId || 0,
    regionPressures,
    heatmap: Object.fromEntries(regionPressures.flatMap(region => (
      region.tiles.map(tileId => [tileId, region.pressureScore])
    )))
  });
}

module.exports = {
  createFallbackRegion,
  createPopulationTensionMap
};
