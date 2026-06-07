function buildIntentTrace({ scoringResult, enrichmentResult, resolutionResult }) {
  return Object.freeze({
    phaseA: Object.freeze({
      deterministicSeedHash: scoringResult.deterministicSeedHash,
      rawScores: Object.freeze(scoringResult.intentScores.map(score => Object.freeze({
        intent: score.intent,
        score: score.score,
        components: score.components
      }))),
      scoreBreakdown: scoringResult.scoreBreakdown
    }),
    phaseB: Object.freeze({
      enrichmentSummary: enrichmentResult.enrichmentSummary,
      enrichedContext: Object.freeze(enrichmentResult.enrichedIntents.map(intent => Object.freeze({
        intent: intent.intent,
        labels: intent.enrichment.labels,
        fallbackCandidate: intent.enrichment.fallbackCandidate,
        skillSuggestions: intent.enrichment.skillSuggestions
      })))
    }),
    phaseC: Object.freeze({
      selectedIntent: resolutionResult.selectedIntentId,
      selectionSet: resolutionResult.selectionSet,
      rationale: resolutionResult.rationale
    })
  });
}

module.exports = {
  buildIntentTrace
};
