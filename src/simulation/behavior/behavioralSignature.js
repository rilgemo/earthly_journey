const { extractBehaviorPatterns } = require('./behaviorPatternExtractor');
const { calculateBehaviorMetrics, distribution } = require('./behaviorMetrics');

function dominantActions(history = [], limit = 5) {
  const counts = history.reduce((result, entry) => {
    if (entry.action) result[entry.action] = (result[entry.action] || 0) + 1;
    return result;
  }, {});
  const total = history.length || 1;
  return Object.entries(counts)
    .map(([action, count]) => ({ action, count, frequency: count / total }))
    .sort((first, second) => second.count - first.count || first.action.localeCompare(second.action))
    .slice(0, limit);
}

function createBehavioralSignature(history = []) {
  const patterns = extractBehaviorPatterns(history);
  const metrics = calculateBehaviorMetrics(history);
  return {
    dominantActions: dominantActions(history),
    actionHeatmap: distribution(history.map(entry => entry.action).filter(Boolean)),
    transitionMatrix: patterns.transitionMatrix,
    loopPatterns: patterns.loopPatterns,
    explorationIndex: patterns.explorationIndex,
    stabilityScore: metrics.stabilityScore,
    entropyScore: metrics.entropyScore,
    behavioralDrift: metrics.behavioralDrift,
    cycleStrength: metrics.cycleStrength,
    variationIndex: metrics.variationIndex,
    frequentSequences: patterns.frequentSequences,
    stableCycles: patterns.stableCycles,
    sampleSize: history.length
  };
}

function createBehavioralSignatures(historyByAgent = {}) {
  return Object.fromEntries(Object.entries(historyByAgent)
    .map(([agentId, history]) => [agentId, createBehavioralSignature(history)]));
}

module.exports = {
  createBehavioralSignature,
  createBehavioralSignatures,
  dominantActions
};
