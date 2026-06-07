const { DEMAND_TYPES } = require('./demandSources');

function calculateDemandEntropy(demand = {}) {
  const total = DEMAND_TYPES.reduce((sum, type) => sum + Math.max(0, demand[type] || 0), 0);
  if (!total) return 0;
  return DEMAND_TYPES.reduce((entropy, type) => {
    const probability = Math.max(0, demand[type] || 0) / total;
    return probability ? entropy - (probability * Math.log2(probability)) : entropy;
  }, 0);
}

function calculateDemandTrend(history = []) {
  if (history.length < 2) return Object.fromEntries(DEMAND_TYPES.map(type => [type, 0]));
  const previous = history[history.length - 2];
  const latest = history[history.length - 1];
  return Object.fromEntries(DEMAND_TYPES.map(type => [
    type,
    (latest[type] || 0) - (previous[type] || 0)
  ]));
}

module.exports = {
  calculateDemandEntropy,
  calculateDemandTrend
};
