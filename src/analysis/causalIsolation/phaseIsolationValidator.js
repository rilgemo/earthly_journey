function validatePhaseA({ firstScoring, secondScoring, beforeSnapshot, afterSnapshot }) {
  const deterministic = JSON.stringify(firstScoring) === JSON.stringify(secondScoring);
  const mutationFree = beforeSnapshot === afterSnapshot;
  const hashStable = firstScoring?.deterministicSeedHash === secondScoring?.deterministicSeedHash;

  return Object.freeze({
    phase: 'A',
    deterministic,
    mutationFree,
    hashStable,
    valid: deterministic && mutationFree && hashStable
  });
}

function validatePhaseB(scoringResult, enrichmentResult) {
  const beforeScores = (scoringResult?.intentScores || []).map(score => score.score);
  const beforeOrder = (scoringResult?.intentScores || []).map(score => score.intent);
  const afterScores = (enrichmentResult?.enrichedIntents || []).map(intent => intent.score);
  const afterOrder = (enrichmentResult?.enrichedIntents || []).map(intent => intent.intent);

  return Object.freeze({
    phase: 'B',
    scorePreserved: JSON.stringify(beforeScores) === JSON.stringify(afterScores),
    orderPreserved: JSON.stringify(beforeOrder) === JSON.stringify(afterOrder),
    valid: JSON.stringify(beforeScores) === JSON.stringify(afterScores)
      && JSON.stringify(beforeOrder) === JSON.stringify(afterOrder)
  });
}

function validatePhaseC(enrichedIntents, resolutionResult) {
  const selectedFromProvided = !resolutionResult?.selectedIntentId
    || (enrichedIntents || []).some(intent => intent.intent === resolutionResult.selectedIntentId);

  return Object.freeze({
    phase: 'C',
    selectedFromProvided,
    candidateCountPreserved: (resolutionResult?.selectionSet || []).length === (enrichedIntents || []).length,
    valid: selectedFromProvided && (resolutionResult?.selectionSet || []).length === (enrichedIntents || []).length
  });
}

function validateIntentPhaseIsolation({
  firstScoring,
  secondScoring,
  enrichmentResult,
  resolutionResult,
  beforeSnapshot,
  afterSnapshot
}) {
  const phaseA = validatePhaseA({ firstScoring, secondScoring, beforeSnapshot, afterSnapshot });
  const phaseB = validatePhaseB(firstScoring, enrichmentResult);
  const phaseC = validatePhaseC(enrichmentResult?.enrichedIntents || [], resolutionResult);

  return Object.freeze({
    phaseA,
    phaseB,
    phaseC,
    valid: phaseA.valid && phaseB.valid && phaseC.valid
  });
}

module.exports = {
  validatePhaseA,
  validatePhaseB,
  validatePhaseC,
  validateIntentPhaseIsolation
};
