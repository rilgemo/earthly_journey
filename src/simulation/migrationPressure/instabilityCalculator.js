function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function average(values = []) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function classifyRisk(pressureScore) {
  if (pressureScore < 0.25) return 'stable';
  if (pressureScore < 0.5) return 'stressed';
  if (pressureScore < 0.75) return 'fragile';
  return 'collapsing';
}

function dominantFactor(breakdown = {}) {
  const positive = Object.entries(breakdown)
    .filter(([key]) => !['socialAnchoringStrength', 'settlementInertia', 'behavioralStability'].includes(key))
    .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]));
  return positive[0]?.[0] || 'none';
}

module.exports = {
  average,
  clamp01,
  classifyRisk,
  dominantFactor
};
