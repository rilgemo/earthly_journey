const { detectCulturePatterns } = require('./culturePatternDetector');
const { calculateBehavioralConvergence } = require('./behavioralConvergenceModel');

function calculateCultureStabilityIndex(traces = [], options = {}) {
  const patterns = detectCulturePatterns(traces, options);
  const convergence = calculateBehavioralConvergence(traces);
  const timeWindow = Math.max(1, traces.length);
  const persistenceScore = Math.min(1, patterns.length / Math.max(1, options.expectedPatternCount || 3));
  const stabilityScore = Number(((persistenceScore * 0.5) + (convergence.convergenceIndex * 0.5)).toFixed(4));
  const driftIndex = Number((1 - stabilityScore).toFixed(4));

  return Object.freeze({
    stabilityScore,
    driftIndex,
    convergenceIndex: convergence.convergenceIndex,
    participationEntropy: convergence.participationEntropy,
    timeWindow
  });
}

module.exports = {
  calculateCultureStabilityIndex
};
