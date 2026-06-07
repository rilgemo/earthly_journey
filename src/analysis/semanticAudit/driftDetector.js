const { SEMANTIC_REGISTRY } = require('./semanticRegistry');
const { createTermMapper, normalizeTerm } = require('./termMapper');

function createInconsistency(type, term, message, source = 'semantic-audit') {
  return Object.freeze({ type, term, message, source });
}

function detectSemanticDrift(input = {}, registry = SEMANTIC_REGISTRY) {
  const mapper = createTermMapper(registry);
  const runtimeTerms = [...(input.runtimeTerms || [])];
  const narrativeTerms = [
    ...(input.narrativeTerms || []),
    ...(input.inspectorLabels || []),
    ...(input.testDescriptions || []),
    ...(input.architectureTerms || [])
  ];
  const inconsistencies = [];

  runtimeTerms.forEach(term => {
    if (!mapper.hasRuntime(term)) {
      inconsistencies.push(createInconsistency(
        'missing mapping',
        term,
        `Runtime term "${term}" has no narrative mapping.`
      ));
    }
  });

  narrativeTerms.forEach(term => {
    if (!mapper.hasNarrative(term) && !mapper.hasRuntime(term)) {
      inconsistencies.push(createInconsistency(
        'orphan narrative term',
        term,
        `Narrative term "${term}" is not mapped to a runtime term.`
      ));
    }
  });

  const runtimeCategories = new Map();
  registry.forEach(entry => {
    const key = normalizeTerm(entry.runtimeTerm);
    const existing = runtimeCategories.get(key) || new Set();
    existing.add(entry.category);
    runtimeCategories.set(key, existing);
  });

  runtimeCategories.forEach((categories, runtimeTerm) => {
    if (categories.size > 1) {
      inconsistencies.push(createInconsistency(
        'inconsistent mapping',
        runtimeTerm,
        `Runtime term "${runtimeTerm}" is mapped to incompatible categories: ${[...categories].join(', ')}.`
      ));
    }
  });

  const narrativeOwners = new Map();
  registry.forEach(entry => {
    entry.narrativeTerms.forEach(narrativeTerm => {
      const key = normalizeTerm(narrativeTerm);
      const owners = narrativeOwners.get(key) || new Set();
      owners.add(entry.runtimeTerm);
      narrativeOwners.set(key, owners);
    });
  });

  narrativeOwners.forEach((owners, narrativeTerm) => {
    if (owners.size > 1) {
      inconsistencies.push(createInconsistency(
        'inconsistent mapping',
        narrativeTerm,
        `Narrative term "${narrativeTerm}" maps to multiple runtime terms: ${[...owners].join(', ')}.`
      ));
    }
  });

  const outdatedAliases = input.outdatedAliases || {};
  Object.entries(outdatedAliases).forEach(([alias, replacement]) => {
    if (narrativeTerms.some(term => normalizeTerm(term) === normalizeTerm(alias))) {
      inconsistencies.push(createInconsistency(
        'outdated alias usage',
        alias,
        `Outdated alias "${alias}" should use "${replacement}".`
      ));
    }
  });

  const mixedLayerFiles = input.files || [];
  mixedLayerFiles.forEach(file => {
    const terms = file.terms || [];
    const hasRuntime = terms.some(term => mapper.hasRuntime(term));
    const hasNarrative = terms.some(term => mapper.hasNarrative(term));
    if (hasRuntime && hasNarrative && file.allowMixedLayer !== true) {
      inconsistencies.push(createInconsistency(
        'mixed-layer ambiguity',
        file.path || 'unknown',
        `File "${file.path || 'unknown'}" mixes runtime and narrative terms without an explicit allowance.`,
        file.path || 'unknown'
      ));
    }
  });

  return Object.freeze(inconsistencies);
}

module.exports = {
  detectSemanticDrift
};
