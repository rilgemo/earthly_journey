function clampMultiplier(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0.25, Math.min(3, value));
}

function calculateAffinityScore(affinities = {}, context = {}) {
  const entries = Object.entries(affinities);
  if (!entries.length) return 0;
  const weighted = entries.reduce((sum, [key, weight]) => {
    const value = context.resourceContext?.[key] ?? context.fieldContext?.[key] ?? 0;
    return sum + (value * weight);
  }, 0);
  const totalWeight = entries.reduce((sum, [, weight]) => sum + Math.abs(weight), 0) || 1;
  return Math.max(0, weighted / totalWeight);
}

function calculateResourceModifier(affinities, context) {
  const resourceAffinities = Object.fromEntries(Object.entries(affinities)
    .filter(([key]) => key.endsWith('Potential')));
  return clampMultiplier(0.75 + calculateAffinityScore(resourceAffinities, context));
}

function calculateFieldModifier(affinities, context) {
  const fieldAffinities = Object.fromEntries(Object.entries(affinities)
    .filter(([key]) => !key.endsWith('Potential')));
  return clampMultiplier(0.85 + (calculateAffinityScore(fieldAffinities, context) * 0.5));
}

function calculateCoherenceBonus(affinities, context) {
  if (!context.neighborResources?.length) return 1;
  const resourceKeys = Object.keys(affinities).filter(key => key.endsWith('Potential'));
  if (!resourceKeys.length) return 1;
  const average = resourceKeys.reduce((sum, key) => {
    const local = context.resourceContext?.[key] || 0;
    const neighborAverage = context.neighborResources
      .reduce((innerSum, neighbor) => innerSum + (neighbor[key] || 0), 0) / context.neighborResources.length;
    return sum + (1 - Math.min(1, Math.abs(local - neighborAverage)));
  }, 0) / resourceKeys.length;
  return clampMultiplier(1 + (average * 0.15));
}

function calculateDiminishingReturn(actionHistory = [], actionId) {
  const repeats = actionHistory.filter(entry => entry.action === actionId).length;
  return clampMultiplier(1 / (1 + (repeats * 0.05)));
}

module.exports = {
  calculateCoherenceBonus,
  calculateDiminishingReturn,
  calculateFieldModifier,
  calculateResourceModifier,
  clampMultiplier
};
