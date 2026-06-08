const { scoreIntents } = require('../../simulation/intent/intentScorer');
const { enrichIntents } = require('../../simulation/intent/intentEnricher');
const { resolveFinalIntent } = require('../../simulation/intent/intentResolver');

function snapshot(value) {
  return JSON.stringify(value);
}

function validatePhaseA(agent, actions, context) {
  const before = snapshot({ agent, actions, context });
  const first = scoreIntents(agent, actions, context);
  const second = scoreIntents(agent, actions, context);
  const after = snapshot({ agent, actions, context });

  return Object.freeze({
    phase: 'A',
    deterministic: JSON.stringify(first) === JSON.stringify(second),
    mutationFree: before === after,
    hashStable: first.deterministicSeedHash === second.deterministicSeedHash,
    valid: JSON.stringify(first) === JSON.stringify(second) && before === after
  });
}

function validatePhaseB(scoringResult, actions) {
  const beforeScores = scoringResult.intentScores.map(score => score.score);
  const beforeOrder = scoringResult.intentScores.map(score => score.intent);
  const enriched = enrichIntents(scoringResult, actions);
  const afterScores = enriched.enrichedIntents.map(intent => intent.score);
  const afterOrder = enriched.enrichedIntents.map(intent => intent.intent);

  return Object.freeze({
    phase: 'B',
    scorePreserved: JSON.stringify(beforeScores) === JSON.stringify(afterScores),
    orderPreserved: JSON.stringify(beforeOrder) === JSON.stringify(afterOrder),
    valid: JSON.stringify(beforeScores) === JSON.stringify(afterScores)
      && JSON.stringify(beforeOrder) === JSON.stringify(afterOrder)
  });
}

function validatePhaseC(enrichedIntents, context = {}) {
  const resolved = resolveFinalIntent(enrichedIntents, context);
  const selectedFromProvided = !resolved.selectedIntentId
    || enrichedIntents.some(intent => intent.intent === resolved.selectedIntentId);

  return Object.freeze({
    phase: 'C',
    selectedFromProvided,
    candidateCountPreserved: resolved.selectionSet.length === enrichedIntents.length,
    valid: selectedFromProvided && resolved.selectionSet.length === enrichedIntents.length
  });
}

function validateIntentPhaseIsolation(agent, actions, context = {}) {
  const phaseA = validatePhaseA(agent, actions, context);
  const scoring = scoreIntents(agent, actions, context);
  const phaseB = validatePhaseB(scoring, actions);
  const enriched = enrichIntents(scoring, actions);
  const phaseC = validatePhaseC(enriched.enrichedIntents, context);

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
