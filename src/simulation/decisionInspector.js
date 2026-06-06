const { cloneValue, deepFreeze } = require('./decisionTrace');

function inspectDecision(decisionTrace) {
  if (!decisionTrace) return null;

  const inspection = {
    agentId: decisionTrace.agentId,
    tick: decisionTrace.tick,
    selected: decisionTrace.selected,
    candidateRanking: [...(decisionTrace.candidates || [])]
      .sort((a, b) => b.score - a.score),
    breakdown: decisionTrace.breakdown || {},
    influenceContributions: decisionTrace.influenceContributions || {},
    resolutionResult: decisionTrace.resolutionResult || null
  };

  return deepFreeze(cloneValue(inspection));
}

function hasTraceIntegrity(decisionTrace) {
  if (!decisionTrace) return false;
  if (!decisionTrace.resolutionResult) return decisionTrace.selected === null;

  return decisionTrace.selected === decisionTrace.resolutionResult.selectedIntent
    && decisionTrace.candidates.some(candidate => candidate.intent === decisionTrace.selected);
}

module.exports = {
  inspectDecision,
  hasTraceIntegrity
};
