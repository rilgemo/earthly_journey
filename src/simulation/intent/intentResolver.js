const { resolveIntent } = require('../resolutionModel');

function resolveFinalIntent(enrichedIntents = [], context = {}) {
  const selected = resolveIntent(enrichedIntents, context);
  return Object.freeze({
    selectedIntent: selected,
    selectedIntentId: selected ? selected.intent : null,
    selectionSet: Object.freeze(enrichedIntents.map(intent => intent.intent)),
    rationale: selected ? Object.freeze(selected.reasonTrace || []) : Object.freeze([])
  });
}

module.exports = {
  resolveFinalIntent
};
