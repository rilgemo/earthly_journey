const { assertNoIdentityLeak } = require('../identity/identityGuard');
const { scoreIntents } = require('./intentScorer');
const { enrichIntents } = require('./intentEnricher');
const { resolveFinalIntent } = require('./intentResolver');
const { buildIntentTrace } = require('./intentTraceBuilder');

function execute(agent, actions = [], context = {}) {
  assertNoIdentityLeak({ agent, actions, context });
  const scoringResult = scoreIntents(agent, actions, context);
  const enrichmentResult = enrichIntents(scoringResult, actions);
  const resolutionResult = resolveFinalIntent(enrichmentResult.enrichedIntents, context);
  const intentTrace = buildIntentTrace({ scoringResult, enrichmentResult, resolutionResult });

  return Object.freeze({
    scoringResult,
    enrichmentResult,
    resolutionResult,
    intentTrace,
    enrichedIntents: enrichmentResult.enrichedIntents,
    finalIntent: resolutionResult.selectedIntent
  });
}

module.exports = {
  execute
};
