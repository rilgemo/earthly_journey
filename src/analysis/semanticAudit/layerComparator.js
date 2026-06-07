const { SEMANTIC_REGISTRY } = require('./semanticRegistry');
const { createTermMapper } = require('./termMapper');

function compareSemanticLayers(input = {}, registry = SEMANTIC_REGISTRY) {
  const mapper = createTermMapper(registry);
  const runtimeTerms = [...new Set(input.runtimeTerms || [])].sort();
  const narrativeTerms = [...new Set([
    ...(input.narrativeTerms || []),
    ...(input.inspectorLabels || []),
    ...(input.testDescriptions || []),
    ...(input.architectureTerms || [])
  ])].sort();

  const mappedRuntimeTerms = runtimeTerms.filter(term => mapper.hasRuntime(term));
  const orphanRuntimeTerms = runtimeTerms.filter(term => !mapper.hasRuntime(term));
  const orphanNarrativeTerms = narrativeTerms.filter(
    term => !mapper.hasNarrative(term) && !mapper.hasRuntime(term)
  );

  return Object.freeze({
    mappingGraph: mapper.toMappingGraph(),
    runtimeTerms: Object.freeze(runtimeTerms),
    narrativeTerms: Object.freeze(narrativeTerms),
    mappedRuntimeTerms: Object.freeze(mappedRuntimeTerms),
    orphanRuntimeTerms: Object.freeze(orphanRuntimeTerms),
    orphanNarrativeTerms: Object.freeze(orphanNarrativeTerms)
  });
}

module.exports = {
  compareSemanticLayers
};
