const RESOURCE_KEYS = [
  'food',
  'wood',
  'water',
  'material',
  'arcane',
  'knowledge',
  'protection'
];

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function clamp100(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function normalizeTrust(value, fallback = 0.5) {
  if (!Number.isFinite(value)) return fallback;
  return value > 1 ? clamp01(value / 100) : clamp01(value);
}

function normalizeResourceKey(key) {
  if (key === 'materials') return 'material';
  if (key === 'knowledgeLearned') return 'knowledge';
  return key;
}

function createEmptyResourceVector() {
  return Object.fromEntries(RESOURCE_KEYS.map(key => [key, 0]));
}

function resourceVectorFromYield(snapshot = {}) {
  const vector = createEmptyResourceVector();
  Object.entries(snapshot.finalYield || {}).forEach(([key, value]) => {
    const normalized = normalizeResourceKey(key);
    if (RESOURCE_KEYS.includes(normalized)) {
      vector[normalized] = clamp100((vector[normalized] || 0) + value);
    }
  });
  return vector;
}

function resourceVectorFromTrace(agentTrace = {}) {
  const vector = resourceVectorFromYield(agentTrace.actionYieldSnapshot);
  if (agentTrace.knowledgeLearned?.length) {
    vector.knowledge = clamp100(vector.knowledge + agentTrace.knowledgeLearned.length * 10);
  }
  if (['attack', 'defend', 'flee'].includes(agentTrace.actionSelected)) {
    vector.protection = clamp100(vector.protection + 10);
  }
  return vector;
}

function vectorMagnitude(vector = {}) {
  return RESOURCE_KEYS.reduce((sum, key) => sum + Math.max(0, vector[key] || 0), 0);
}

function calculateResourceAsymmetry(first = {}, second = {}) {
  const differences = {};
  let totalDifference = 0;
  RESOURCE_KEYS.forEach(key => {
    const delta = Math.max(0, (first[key] || 0) - (second[key] || 0));
    differences[key] = clamp100(delta);
    totalDifference += delta;
  });

  return {
    differences,
    asymmetryScore: clamp01(totalDifference / 100)
  };
}

function hasResourceFlow(vector = {}) {
  return RESOURCE_KEYS.some(key => (vector[key] || 0) > 0);
}

module.exports = {
  RESOURCE_KEYS,
  calculateResourceAsymmetry,
  clamp01,
  clamp100,
  createEmptyResourceVector,
  hasResourceFlow,
  normalizeTrust,
  resourceVectorFromTrace,
  resourceVectorFromYield,
  vectorMagnitude
};
