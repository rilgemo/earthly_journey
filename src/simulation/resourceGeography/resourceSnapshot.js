const { freezeSnapshot } = require('../behavior/behaviorTraceRecorder');
const { cloneSnapshot } = require('../replayBuffer');
const { calculateResourceMetrics } = require('./resourceMetrics');

function createResourceSnapshot(resourceMap) {
  if (!resourceMap) return null;
  return freezeSnapshot({
    map: cloneSnapshot(resourceMap),
    metrics: calculateResourceMetrics(resourceMap)
  });
}

function getWorldResourceSnapshot(world = {}) {
  return createResourceSnapshot(world.resourceMap || world.resourceGeography || null);
}

module.exports = {
  createResourceSnapshot,
  getWorldResourceSnapshot
};
