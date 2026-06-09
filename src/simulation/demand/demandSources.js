const DEMAND_TYPES = Object.freeze([
  'food',
  'tools',
  'materials',
  'healing',
  'arcane',
  'safety',
  'shelter'
]);

function average(values = []) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function biologicalStress(agent) {
  const conditions = Object.values(agent.biology?.condition || {});
  if (!conditions.length) return 0;
  return conditions.reduce((sum, state) => (
    sum + ({ sound: 0, strained: 1, impaired: 2, collapsed: 3 }[state] || 0)
  ), 0);
}

function totalFields(world = {}) {
  const totals = {};
  const areas = world.areas instanceof Map ? [...world.areas.values()] : Object.values(world.areas || {});
  areas.forEach(area => {
    Object.entries(area.field || {}).forEach(([field, value]) => {
      if (!totals[field]) totals[field] = [];
      totals[field].push(value || 0);
    });
  });
  return Object.fromEntries(Object.entries(totals).map(([field, values]) => [field, average(values)]));
}

function deriveDemandSignals(world = {}, agents = []) {
  const explicit = world.demandSignals || {};
  const fields = totalFields(world);
  const population = agents.length;
  const injuries = agents.map(biologicalStress);
  const fatigue = agents.map(agent => Math.max(0, agent.needs?.fatigue || 0));
  const manaInstability = agents.map(agent => Math.max(0, (1 - (agent.mana?.stability ?? 1)) * 100));
  const monsters = agents.filter(agent => agent.type === 'monster').length;

  return {
    populationConsumption: explicit.populationConsumption ?? population * 2,
    foodProduction: explicit.foodProduction ?? 0,
    toolDecay: explicit.toolDecay ?? population * 0.4,
    toolCreation: explicit.toolCreation ?? 0,
    craftingUsage: explicit.craftingUsage ?? population * 0.5,
    resourceAvailability: explicit.resourceAvailability ?? Math.max(0, (fields.earth || 0) * 0.1),
    injury: explicit.injury ?? average(injuries),
    fatigue: explicit.fatigue ?? average(fatigue),
    diseasePressure: explicit.diseasePressure ?? 0,
    manaInstability: explicit.manaInstability ?? average(manaInstability),
    fieldImbalance: explicit.fieldImbalance ?? Math.abs((fields.arcane || 0) - 20) * 0.5,
    arcaneConsumption: explicit.arcaneConsumption ?? 0,
    monsterPressure: explicit.monsterPressure ?? monsters * 10,
    hostileEvents: explicit.hostileEvents ?? 0,
    violenceIndex: explicit.violenceIndex ?? 0,
    populationPressure: explicit.populationPressure ?? population * 2,
    housingCapacity: explicit.housingCapacity ?? 0
  };
}

function calculateDemandSources(world = {}, agents = []) {
  const signals = deriveDemandSignals(world, agents);
  return {
    food: Math.max(0, signals.populationConsumption - signals.foodProduction),
    tools: Math.max(0, signals.toolDecay - signals.toolCreation),
    materials: Math.max(0, signals.craftingUsage - signals.resourceAvailability),
    healing: Math.max(0, signals.injury + signals.fatigue + signals.diseasePressure),
    arcane: Math.max(0, signals.manaInstability + signals.fieldImbalance + signals.arcaneConsumption),
    safety: Math.max(0, signals.monsterPressure + signals.hostileEvents + signals.violenceIndex),
    shelter: Math.max(0, signals.populationPressure - signals.housingCapacity)
  };
}

module.exports = {
  DEMAND_TYPES,
  calculateDemandSources,
  deriveDemandSignals,
  totalFields
};
