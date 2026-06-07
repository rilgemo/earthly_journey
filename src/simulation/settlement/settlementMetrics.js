const RESOURCE_ACTIONS = new Set([
  'farm', 'forage', 'gather_water', 'hunt', 'chop_wood', 'mine', 'forge', 'craft_item'
]);

const DEMAND_ACTIONS = Object.freeze({
  food: new Set(['farm', 'forage', 'hunt']),
  tools: new Set(['forge', 'mine', 'craft_item']),
  materials: new Set(['mine', 'chop_wood', 'craft_item']),
  healing: new Set(['rest', 'forage']),
  arcane: new Set(['cast_magic', 'channel_arcane', 'study_arcane', 'meditate']),
  safety: new Set(['attack', 'defend', 'flee']),
  shelter: new Set(['chop_wood', 'mine', 'craft_item'])
});

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function demandAlignment(entries, demandIndex = {}) {
  if (!entries.length) return 0;
  const matched = entries.reduce((sum, entry) => {
    return sum + Object.entries(DEMAND_ACTIONS).reduce((score, [demand, actions]) => {
      return score + (actions.has(entry.action) ? (demandIndex[demand] || 0) / 100 : 0);
    }, 0);
  }, 0);
  return clamp01(matched / entries.length);
}

function calculateSettlementMetrics(entries, {
  windowSize = 1,
  persistenceTicks = 1,
  demandIndex = {},
  previousActivity = entries.length
} = {}) {
  const activeTicks = new Set(entries.map(entry => entry.tick)).size;
  const resourceInteractions = entries.filter(entry => RESOURCE_ACTIONS.has(entry.action)).length;
  const growthRate = previousActivity
    ? (entries.length - previousActivity) / previousActivity
    : (entries.length ? 1 : 0);

  return {
    populationDensity: clamp01(entries.length / Math.max(1, windowSize * 2)),
    resourcePressure: clamp01(resourceInteractions / Math.max(1, entries.length)),
    demandAlignment: demandAlignment(entries, demandIndex),
    activityStability: clamp01(activeTicks / Math.max(1, persistenceTicks)),
    growthRate: Math.max(-1, Math.min(1, growthRate)),
    decayRisk: clamp01(1 - (activeTicks / Math.max(1, windowSize)))
  };
}

module.exports = {
  DEMAND_ACTIONS,
  RESOURCE_ACTIONS,
  calculateSettlementMetrics,
  clamp01,
  demandAlignment
};
