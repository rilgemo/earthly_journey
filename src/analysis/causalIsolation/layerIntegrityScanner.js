function scanLayerIntegrity({ before, after, scoringResult, enrichmentResult, resolutionResult }) {
  const hiddenMutations = JSON.stringify(before) !== JSON.stringify(after);
  const phaseBScoreChange = JSON.stringify(scoringResult.intentScores.map(score => score.score))
    !== JSON.stringify(enrichmentResult.enrichedIntents.map(intent => intent.score));
  const phaseCInjectedCandidate = resolutionResult.selectedIntentId
    && !resolutionResult.selectionSet.includes(resolutionResult.selectedIntentId);

  const violations = [];
  if (hiddenMutations) violations.push('hidden mutation path');
  if (phaseBScoreChange) violations.push('cross-phase leakage');
  if (phaseCInjectedCandidate) violations.push('phase C candidate injection');

  return Object.freeze({
    hiddenMutations,
    phaseBScoreChange,
    phaseCInjectedCandidate,
    violations: Object.freeze(violations),
    valid: violations.length === 0
  });
}

module.exports = {
  scanLayerIntegrity
};
