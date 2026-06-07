const { SEMANTIC_REGISTRY } = require('./semanticRegistry');
const { compareSemanticLayers } = require('./layerComparator');
const { detectSemanticDrift } = require('./driftDetector');

function buildRecommendedFixes(inconsistencies) {
  return inconsistencies.map(item => {
    if (item.type === 'missing mapping') {
      return `Add a semanticRegistry entry for runtime term "${item.term}".`;
    }
    if (item.type === 'orphan narrative term') {
      return `Map or remove narrative term "${item.term}".`;
    }
    if (item.type === 'outdated alias usage') {
      return `Replace outdated alias "${item.term}" with its current narrative term.`;
    }
    if (item.type === 'mixed-layer ambiguity') {
      return `Split runtime and narrative terminology in "${item.term}" or mark it as allowMixedLayer.`;
    }
    return `Review ${item.type} for "${item.term}".`;
  }).sort();
}

function freezeReport(report) {
  report.inconsistencies.forEach(Object.freeze);
  report.recommendedFixes = Object.freeze(report.recommendedFixes);
  report.orphanRuntimeTerms = Object.freeze(report.orphanRuntimeTerms);
  report.orphanNarrativeTerms = Object.freeze(report.orphanNarrativeTerms);
  report.mappingGraph.forEach(Object.freeze);
  report.mappingGraph = Object.freeze(report.mappingGraph);
  report.inconsistencies = Object.freeze(report.inconsistencies);
  return Object.freeze(report);
}

function buildSemanticConsistencyReport(input = {}, options = {}) {
  const registry = options.registry || SEMANTIC_REGISTRY;
  const comparison = compareSemanticLayers(input, registry);
  const inconsistencies = detectSemanticDrift(input, registry);
  const totalTerms = comparison.runtimeTerms.length + comparison.narrativeTerms.length;
  const mappedTerms = comparison.mappedRuntimeTerms.length;
  const driftScore = totalTerms === 0
    ? 0
    : Number((inconsistencies.length / totalTerms).toFixed(4));

  return freezeReport({
    timestamp: options.timestamp || '1970-01-01T00:00:00.000Z',
    totalTerms,
    mappedTerms,
    orphanRuntimeTerms: comparison.orphanRuntimeTerms,
    orphanNarrativeTerms: comparison.orphanNarrativeTerms,
    driftScore,
    inconsistencies,
    recommendedFixes: buildRecommendedFixes(inconsistencies),
    mappingGraph: comparison.mappingGraph
  });
}

module.exports = {
  buildSemanticConsistencyReport
};
