const { calculateDemandSources } = require('./demandSources');
const { createDemandIndex } = require('./demandIndex');

const ACTION_DEMAND_PROFILES = Object.freeze({
  forage: Object.freeze({ food: 0.04, materials: 0.01 }),
  farm: Object.freeze({ food: 0.05 }),
  hunt: Object.freeze({ food: 0.04, safety: 0.01 }),
  forge: Object.freeze({ tools: 0.05 }),
  mine: Object.freeze({ tools: 0.02, materials: 0.05 }),
  craft_item: Object.freeze({ tools: 0.03, shelter: 0.02 }),
  chop_wood: Object.freeze({ materials: 0.04, shelter: 0.03 }),
  rest: Object.freeze({ healing: 0.03 }),
  study_arcane: Object.freeze({ arcane: 0.04 }),
  meditate: Object.freeze({ arcane: 0.04, healing: 0.01 }),
  channel_arcane: Object.freeze({ arcane: 0.02 }),
  defend: Object.freeze({ safety: 0.05 }),
  attack: Object.freeze({ safety: 0.03 }),
  flee: Object.freeze({ safety: 0.02 })
});

function smoothDemand(previous = {}, current = {}, damping = 0.25) {
  const gain = Math.max(0, Math.min(1, damping));
  return Object.fromEntries(Object.keys(current).map(type => [
    type,
    (previous[type] || 0) + (((current[type] || 0) - (previous[type] || 0)) * gain)
  ]));
}

function calculateWorldDemand(world = {}, agents = [], previousDemand = {}, options = {}) {
  const sources = calculateDemandSources(world, agents);
  const smoothed = smoothDemand(previousDemand, sources, options.damping ?? world.demandConfig?.damping ?? 0.25);
  return {
    sources: Object.freeze({ ...sources }),
    index: createDemandIndex(smoothed)
  };
}

function getDemandOpportunityScore(actionId, demandIndex = {}) {
  return Object.entries(ACTION_DEMAND_PROFILES[actionId] || {}).reduce((sum, [demand, weight]) => (
    sum + ((demandIndex[demand] || 0) * weight)
  ), 0);
}

module.exports = {
  ACTION_DEMAND_PROFILES,
  calculateWorldDemand,
  getDemandOpportunityScore,
  smoothDemand
};
