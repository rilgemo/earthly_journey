const { calculateDemandEntropy } = require('./demandMetrics');
const { DEMAND_TYPES } = require('./demandSources');

function clampDemand(value) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function createDemandIndex(values = {}) {
  const demands = Object.fromEntries(DEMAND_TYPES.map(type => [type, clampDemand(values[type])]));
  const dominantDemand = DEMAND_TYPES.reduce((dominant, type) => (
    demands[type] > demands[dominant] ? type : dominant
  ), DEMAND_TYPES[0]);
  const totalDemand = DEMAND_TYPES.reduce((sum, type) => sum + demands[type], 0);

  return Object.freeze({
    ...demands,
    dominantDemand: totalDemand ? dominantDemand : null,
    totalDemand,
    demandEntropy: calculateDemandEntropy(demands)
  });
}

module.exports = {
  clampDemand,
  createDemandIndex
};
