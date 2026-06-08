function buildIntentTrace({ scoringResult, enrichmentResult, resolutionResult }) {
  const causalTrace = Object.freeze({
    phaseAHash: scoringResult.deterministicSeedHash,
    phaseBMetadata: enrichmentResult.enrichmentSummary,
    phaseCSelection: resolutionResult.selectedIntentId,
    externalInfluenceVector: Object.freeze({
      Field: 0,
      Demand: 0,
      Typology: 0,
      Memory: 0,
      Settlement: 0
    }),
    deterministicSeed: scoringResult.deterministicSeedHash
  });

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
    }),
    causalTrace
  });
}

module.exports = {
  buildIntentTrace
};
