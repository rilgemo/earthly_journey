function cloneValue(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }

  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function createDecisionTrace({
  agentId,
  tick,
  candidates = [],
  influenceField = {},
  resolutionResult = null
} = {}) {
  const selected = resolutionResult?.intent || null;
  const candidateTraces = candidates.map(candidate => ({
    intent: candidate.intent,
    category: candidate.category,
    score: candidate.score
  }));
  const breakdown = candidates.reduce((result, candidate) => {
    result[candidate.intent] = {
      ...(candidate.components || {})
    };
    return result;
  }, {});

  const trace = {
    agentId,
    tick,
    selected,
    candidates: candidateTraces,
    breakdown,
    influenceContributions: {
      profile: influenceField.profile || {},
      sources: influenceField.sources || {},
      topInfluences: influenceField.topInfluences || []
    },
    resolutionResult: resolutionResult ? {
      selectedIntent: resolutionResult.intent,
      finalScore: resolutionResult.score,
      reasonTrace: resolutionResult.reasonTrace || []
    } : null
  };

  return deepFreeze(cloneValue(trace));
}

module.exports = {
  createDecisionTrace,
  cloneValue,
  deepFreeze
};
