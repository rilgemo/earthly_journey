const { average, clamp01 } = require('./instabilityCalculator');
const { calculateAnchoringFactors } = require('./anchoringFactors');

function resourceVolatility(resourceFlow = {}) {
  const delta = resourceFlow.balance?.delta || {};
  const total = resourceFlow.balance?.before || {};
  const volatilityFor = resource => clamp01(Math.abs(delta[resource] || 0) / Math.max(1, total[resource] || 1));
  return {
    foodVolatility: volatilityFor('foodPotential'),
    waterVolatility: volatilityFor('waterPotential'),
    materialVolatility: volatilityFor('materialPotential'),
    arcaneVolatility: volatilityFor('arcanePotential')
  };
}

function perceptionMismatch(perceptionDrift = {}) {
  const drift = perceptionDrift.metrics?.perceptionDriftIndex || {};
  return clamp01(average(Object.values(drift)));
}

function informationLag(perceptionDrift = {}) {
  return clamp01(perceptionDrift.metrics?.globalBeliefEntropy || 0);
}

function createStabilityField({
  settlement = {},
  trace = {},
  resourceFlow = trace.resourceFlow,
  perceptionDrift = {},
  trustNetwork = {},
  behaviorSignatures = {}
} = {}) {
  const volatility = resourceVolatility(resourceFlow || {});
  const resourceStability = clamp01(1 - average(Object.values(volatility)));
  const anchors = calculateAnchoringFactors({ settlement, trace, trustNetwork, behaviorSignatures });
  return {
    resourceStability,
    ...volatility,
    ...anchors,
    perceptionMismatch: perceptionMismatch(perceptionDrift),
    informationLag: informationLag(perceptionDrift)
  };
}

module.exports = {
  createStabilityField,
  informationLag,
  perceptionMismatch,
  resourceVolatility
};
