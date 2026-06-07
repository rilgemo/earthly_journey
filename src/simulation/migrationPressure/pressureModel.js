const { clamp01, classifyRisk, dominantFactor } = require('./instabilityCalculator');
const { createStabilityField } = require('./stabilityField');

function demandPressureGap(settlement = {}, demand = {}) {
  const totalDemand = demand.index?.totalDemand ?? demand.totalDemand ?? 0;
  const alignment = settlement.metrics?.demandAlignment || 0;
  return clamp01((totalDemand / 100) * (1 - alignment));
}

function calculatePressure({ settlement = {}, trace = {}, perceptionDrift = {}, trustNetwork = {}, behaviorSignatures = {} } = {}) {
  const field = createStabilityField({
    settlement,
    trace,
    perceptionDrift,
    trustNetwork,
    behaviorSignatures
  });
  const resourceInstability = clamp01(1 - field.resourceStability);
  const environmentalVolatility = clamp01((
    field.foodVolatility + field.waterVolatility + field.materialVolatility + field.arcaneVolatility
  ) / 4);
  const gap = demandPressureGap(settlement, trace.demand || {});
  const socialAnchoringStrength = field.socialAnchoring;
  const settlementInertia = field.settlementInertia;
  const behavioralStability = field.behavioralLockIn;

  const breakdown = {
    resourceInstability,
    environmentalVolatility,
    perceptionMismatch: field.perceptionMismatch,
    demandPressureGap: gap,
    socialAnchoringStrength,
    settlementInertia,
    behavioralStability
  };
  const pressureScore = clamp01(
    resourceInstability
    + environmentalVolatility
    + field.perceptionMismatch
    + gap
    - (socialAnchoringStrength * 0.5)
    - (settlementInertia * 0.35)
    - (behavioralStability * 0.3)
  );
  const stabilityScore = clamp01(1 - pressureScore);

  return {
    stabilityField: field,
    stabilityScore,
    pressureScore,
    breakdown,
    dominantInstabilitySource: dominantFactor(breakdown),
    dominantFactor: dominantFactor(breakdown),
    riskClassification: classifyRisk(pressureScore)
  };
}

module.exports = {
  calculatePressure,
  demandPressureGap
};
