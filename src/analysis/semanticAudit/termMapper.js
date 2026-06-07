const { SEMANTIC_REGISTRY } = require('./semanticRegistry');

function normalizeTerm(term) {
  return String(term || '').trim().toLowerCase();
}

function createTermMapper(registry = SEMANTIC_REGISTRY) {
  const runtimeMap = new Map();
  const narrativeMap = new Map();

  registry.forEach(entry => {
    runtimeMap.set(normalizeTerm(entry.runtimeTerm), entry);
    entry.narrativeTerms.forEach(narrativeTerm => {
      const key = normalizeTerm(narrativeTerm);
      const existing = narrativeMap.get(key) || [];
      narrativeMap.set(key, [...existing, entry]);
    });
  });

  return Object.freeze({
    registry,
    getByRuntime(runtimeTerm) {
      return runtimeMap.get(normalizeTerm(runtimeTerm)) || null;
    },
    getByNarrative(narrativeTerm) {
      return Object.freeze([...(narrativeMap.get(normalizeTerm(narrativeTerm)) || [])]);
    },
    hasRuntime(runtimeTerm) {
      return runtimeMap.has(normalizeTerm(runtimeTerm));
    },
    hasNarrative(narrativeTerm) {
      return narrativeMap.has(normalizeTerm(narrativeTerm));
    },
    toMappingGraph() {
      return Object.freeze(registry.map(entry => Object.freeze({
        runtimeTerm: entry.runtimeTerm,
        narrativeTerms: entry.narrativeTerms,
        category: entry.category,
        stability: entry.stability
      })));
    }
  });
}

function extractTerms(source = {}) {
  return Object.freeze({
    runtimeTerms: Object.freeze([...(source.runtimeTerms || [])]),
    narrativeTerms: Object.freeze([...(source.narrativeTerms || [])]),
    inspectorLabels: Object.freeze([...(source.inspectorLabels || [])]),
    testDescriptions: Object.freeze([...(source.testDescriptions || [])]),
    architectureTerms: Object.freeze([...(source.architectureTerms || [])])
  });
}

module.exports = {
  createTermMapper,
  extractTerms,
  normalizeTerm
};
