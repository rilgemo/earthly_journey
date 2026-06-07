const { freezeSnapshot } = require('../behavior/behaviorTraceRecorder');
const { getEnvironmentalYieldContext } = require('./environmentalYieldMap');
const { getYieldProfile } = require('./yieldProfiles');
const {
  calculateCoherenceBonus,
  calculateDiminishingReturn,
  calculateFieldModifier,
  calculateResourceModifier
} = require('./yieldModifiers');

function applyMultiplier(baseYield = {}, multiplier = 1) {
  return Object.fromEntries(Object.entries(baseYield)
    .map(([type, value]) => [type, Math.max(0, Math.min(100, value * multiplier))]));
}

function totalYield(yieldMap = {}) {
  return Object.values(yieldMap).reduce((sum, value) => sum + value, 0);
}

function yieldResolver(action, context = {}) {
  const actionId = typeof action === 'string' ? action : action?.id;
  const profile = getYieldProfile(actionId);
  const tileContext = context.tileContext || getEnvironmentalYieldContext({
    world: context.world,
    tileId: context.tileId,
    field: context.field
  });
  const modifiers = {
    resourceGeography: calculateResourceModifier(profile.affinities, tileContext),
    elementalField: calculateFieldModifier(profile.affinities, tileContext),
    environmentalCoherence: calculateCoherenceBonus(profile.affinities, tileContext),
    diminishingReturn: calculateDiminishingReturn(context.actionHistory || [], actionId)
  };
  const environmentalMultiplier = Object.values(modifiers)
    .reduce((product, value) => product * value, 1);
  const finalYield = applyMultiplier(profile.baseYield, environmentalMultiplier);

  return freezeSnapshot({
    actionType: actionId,
    actionId,
    tileContext,
    baseYield: profile.baseYield,
    environmentalMultiplier,
    finalYield,
    totalYield: totalYield(finalYield),
    modifiers,
    breakdown: {
      resourceAffinities: Object.fromEntries(Object.entries(profile.affinities)
        .filter(([key]) => key.endsWith('Potential'))),
      fieldAffinities: Object.fromEntries(Object.entries(profile.affinities)
        .filter(([key]) => !key.endsWith('Potential'))),
      bounded: true
    },
    environmentalBreakdown: {
      resourceContext: tileContext.resourceContext,
      fieldContext: tileContext.fieldContext,
      neighborCount: tileContext.neighborResources.length
    }
  });
}

module.exports = {
  applyMultiplier,
  totalYield,
  yieldResolver
};
