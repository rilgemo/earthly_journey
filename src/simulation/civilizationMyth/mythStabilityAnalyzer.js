function analyzeMythStability({ narrativeStatements = [], causalInterpretations = [], civilizationMemory = {} } = {}) {
  const narrativeScore = Math.min(1, narrativeStatements.length / 5);
  const causalScore = Math.min(1, causalInterpretations.length / 5);
  const memoryScore = civilizationMemory.driftResistanceIndex || 0;
  return Number(((narrativeScore + causalScore + memoryScore) / 3).toFixed(4));
}

function detectContradictions(causalInterpretations = []) {
  const bySource = causalInterpretations.reduce((result, interpretation) => {
    if (!result[interpretation.sourceMemory]) result[interpretation.sourceMemory] = new Set();
    result[interpretation.sourceMemory].add(interpretation.interpretedCause);
    return result;
  }, {});

  return Object.freeze(Object.entries(bySource)
    .filter(([, causes]) => causes.size > 1)
    .map(([sourceMemory, causes]) => Object.freeze({
      sourceMemory,
      causes: Object.freeze([...causes].sort())
    })));
}

module.exports = {
  analyzeMythStability,
  detectContradictions
};
