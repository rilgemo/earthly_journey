function buildReasonTrace(score) {
  const components = score.components || {};
  return [
    `base:${(components.base || 0).toFixed(2)}`,
    `need:${(components.needScore || 0).toFixed(2)}`,
    `memory:${(components.memoryScore || 0).toFixed(2)}`,
    `skill:${(components.skillScore || 0).toFixed(2)}`,
    `trait:${(components.traitScore || 0).toFixed(2)}`,
    `knowledge:${(components.knowledgeScore || 0).toFixed(2)}`,
    `environment:${(components.environmentScore || 0).toFixed(2)}`,
    `influence:${(components.influenceScore || 0).toFixed(2)}`,
    `demand:${(components.demandScore || 0).toFixed(2)}`,
    `typology:${(components.typologyModifier || 1).toFixed(2)}`
  ];
}

function enrichIntents(scoringResult, actions = []) {
  const actionById = new Map(actions.map(action => [action.id, action]));
  const enrichedIntents = scoringResult.intentScores.map(score => Object.freeze({
    intent: score.intent,
    action: actionById.get(score.intent),
    category: score.category,
    score: score.score,
    components: score.components,
    reasonTrace: Object.freeze(buildReasonTrace(score)),
    enrichment: Object.freeze({
      labels: Object.freeze([`category:${score.category}`]),
      fallbackCandidate: false,
      skillSuggestions: Object.freeze([])
    })
  }));

  return Object.freeze({
    ...scoringResult,
    enrichedIntents: Object.freeze(enrichedIntents),
    enrichmentSummary: Object.freeze({
      labelsAttached: enrichedIntents.length,
      fallbackCandidatesAdded: 0,
      scoreOrderingPreserved: true
    })
  });
}

module.exports = {
  enrichIntents
};
