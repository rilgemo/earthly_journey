const { actionSequence, detectLoops } = require('./behaviorPatternExtractor');

function distribution(actions = []) {
  const counts = actions.reduce((result, action) => {
    result[action] = (result[action] || 0) + 1;
    return result;
  }, {});
  return Object.fromEntries(Object.entries(counts).map(([action, count]) => [action, count / actions.length]));
}

function calculateActionEntropy(history = []) {
  const actions = actionSequence(history);
  if (!actions.length) return 0;
  const probabilities = Object.values(distribution(actions));
  return probabilities.reduce((entropy, probability) => (
    entropy - (probability * Math.log2(probability))
  ), 0);
}

function calculateRoutineStability(history = []) {
  const actions = actionSequence(history);
  if (!actions.length) return 0;
  const maximum = Math.max(...Object.values(distribution(actions)));
  const loops = detectLoops(history);
  const loopStrength = loops[0]?.strength || 0;
  return Math.min(1, (maximum + loopStrength) / 2);
}

function calculateBehavioralDrift(history = []) {
  const actions = actionSequence(history);
  if (actions.length < 2) return 0;
  const midpoint = Math.floor(actions.length / 2);
  const first = distribution(actions.slice(0, midpoint));
  const second = distribution(actions.slice(midpoint));
  const keys = new Set([...Object.keys(first), ...Object.keys(second)]);
  return [...keys].reduce((sum, key) => sum + Math.abs((first[key] || 0) - (second[key] || 0)), 0) / 2;
}

function calculateCycleStrength(history = []) {
  return detectLoops(history)[0]?.strength || 0;
}

function calculateVariationIndex(history = []) {
  const actions = actionSequence(history);
  if (actions.length < 2) return 0;
  let changes = 0;
  for (let index = 1; index < actions.length; index += 1) {
    if (actions[index] !== actions[index - 1]) changes += 1;
  }
  return changes / (actions.length - 1);
}

function calculateBehaviorMetrics(history = []) {
  return {
    entropyScore: calculateActionEntropy(history),
    stabilityScore: calculateRoutineStability(history),
    behavioralDrift: calculateBehavioralDrift(history),
    cycleStrength: calculateCycleStrength(history),
    variationIndex: calculateVariationIndex(history)
  };
}

module.exports = {
  calculateActionEntropy,
  calculateBehaviorMetrics,
  calculateBehavioralDrift,
  calculateCycleStrength,
  calculateRoutineStability,
  calculateVariationIndex,
  distribution
};
