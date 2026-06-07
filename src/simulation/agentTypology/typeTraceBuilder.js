const { resolveAgentTypology } = require('./typologyResolver');

function summarizeActiveWeights(weights = []) {
  return Object.freeze(weights.map(weight => Object.freeze({
    action: weight.action,
    modifier: weight.modifier,
    category: weight.category
  })));
}

function buildAgentTypologySnapshot(agent, weights = []) {
  const profile = resolveAgentTypology(agent);
  const modifiers = weights.map(weight => weight.modifier ?? 1);
  const averageModifier = modifiers.length
    ? modifiers.reduce((sum, value) => sum + value, 0) / modifiers.length
    : 1;

  return Object.freeze({
    agentId: agent?.id,
    typeId: profile.typeId,
    activeWeights: summarizeActiveWeights(weights),
    influenceSummary: Object.freeze({
      stabilityProfile: profile.stabilityProfile,
      fieldSensitivity: profile.fieldSensitivity.general,
      socialCouplingStrength: profile.socialCouplingStrength,
      memoryPersistenceBias: profile.memoryPersistenceBias,
      actionVolatility: profile.actionVolatility
    }),
    deviationFromBaseline: Number((averageModifier - 1).toFixed(4))
  });
}

module.exports = {
  buildAgentTypologySnapshot
};
