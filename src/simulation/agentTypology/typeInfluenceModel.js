const { getAgentTypeProfile } = require('./agentTypeRegistry');

function clamp(value, min = 0, max = 2) {
  return Math.max(min, Math.min(max, value));
}

function getCategoryWeight(profile, action = {}) {
  const key = action.category || action.type || action.id;
  return profile.categoryWeights[key] ?? 1;
}

function calculateTypeInfluence(profileOrTypeId, action = {}, context = {}) {
  const profile = typeof profileOrTypeId === 'string'
    ? getAgentTypeProfile(profileOrTypeId)
    : profileOrTypeId;
  const memories = context.memories || [];
  const field = context.perception?.field || {};
  const needs = context.needs?.profile || {};
  const demandIndex = context.demandIndex || {};

  const fieldMagnitude = ['fire', 'water', 'earth', 'arcane']
    .reduce((sum, key) => sum + Math.abs(field[key] || 0), 0);
  const fieldModifier = clamp(1 + (fieldMagnitude * 0.05 * (profile.fieldSensitivity.general - 1)), 0.2, 2);
  const memoryModifier = clamp(1 + (memories.length * 0.02 * (profile.memoryPersistenceBias - 1)), 0.2, 2);
  const socialModifier = action.type === 'social'
    ? clamp(profile.socialCouplingStrength, 0.1, 2.5)
    : 1;
  const volatilityModifier = clamp(profile.actionVolatility, 0.1, 2.5);
  const resourcePressure = Object.entries(profile.resourceDependenceProfile)
    .reduce((sum, [key, weight]) => sum + ((demandIndex[key] || needs[key] || 0) * weight), 0);
  const resourceModifier = clamp(1 + (resourcePressure * 0.001), 0.2, 2);
  const categoryModifier = clamp(getCategoryWeight(profile, action), 0.1, 2.5);
  const finalModifier = clamp(
    fieldModifier * memoryModifier * socialModifier * volatilityModifier * resourceModifier * categoryModifier,
    0.05,
    4
  );

  return Object.freeze({
    typeId: profile.typeId,
    fieldModifier,
    memoryModifier,
    socialModifier,
    volatilityModifier,
    resourceModifier,
    categoryModifier,
    finalModifier
  });
}

module.exports = {
  calculateTypeInfluence,
  clamp
};
