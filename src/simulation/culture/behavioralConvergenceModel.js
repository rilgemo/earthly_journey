const { collectAgentEvents } = require('./culturePatternDetector');

function entropy(counts = {}) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  if (!total) return 0;
  return Object.values(counts).reduce((sum, count) => {
    const probability = count / total;
    return probability ? sum - (probability * Math.log2(probability)) : sum;
  }, 0);
}

function calculateBehavioralConvergence(traces = []) {
  const events = collectAgentEvents(traces);
  const counts = events.reduce((result, event) => {
    result[event.action] = (result[event.action] || 0) + 1;
    return result;
  }, {});
  const uniqueActions = Object.keys(counts).length;
  const maxEntropy = uniqueActions ? Math.log2(uniqueActions) : 1;
  const participationEntropy = entropy(counts);
  const convergenceIndex = maxEntropy ? 1 - (participationEntropy / maxEntropy) : 0;

  return Object.freeze({
    convergenceIndex: Number(Math.max(0, convergenceIndex).toFixed(4)),
    participationEntropy: Number(participationEntropy.toFixed(4)),
    actionDistribution: Object.freeze(counts)
  });
}

module.exports = {
  calculateBehavioralConvergence,
  entropy
};
