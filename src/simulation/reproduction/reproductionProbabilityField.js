const { resolveConditionSignals } = require('../life/conditionCapacityModel');

function clamp(value, min = -1, max = 1) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
}

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function biologicalField(agent) {
  if (agent.life?.alive === false || agent._pendingDeath) return -1;
  if (agent.life?.lifeStage && agent.life.lifeStage !== 'adult') return -0.75;

  const signals = resolveConditionSignals(agent.biology);
  return clamp(
    0.5
      - (signals.collapsedDimensions.length * 0.5)
      - (signals.stressedDimensions.length * 0.12)
      - (signals.constrainedDimensions.length * 0.08)
  );
}

function memoryEntries(agent) {
  return [
    ...(agent.memory?.shortTerm || []),
    ...(agent.memory?.longTerm || []),
    ...(agent.memory?.recentEvents || [])
  ];
}

function directedBondSignal(source, targetId) {
  const related = memoryEntries(source).filter(memory => (
    memory.target === targetId
    || memory.agentId === targetId
    || memory.sourceId === targetId
  ));
  if (!related.length) return 0;
  return clamp(related.reduce((sum, memory) => sum + clamp((memory.strength || 0) / 100), 0) / related.length);
}

function bondField(agentA, agentB) {
  return clamp((directedBondSignal(agentA, agentB.id) + directedBondSignal(agentB, agentA.id)) / 2);
}

function competitionField(agentA, agentB, context) {
  if (agentA.location !== agentB.location) return -0.25;
  const localCount = context.locationCounts.get(agentA.location) || 0;
  const resourceCount = Object.keys(context.world.resourceMap?.[agentA.location] || {}).length;
  return clamp(-Math.max(0, localCount - 1) * 0.1 + Math.min(resourceCount, 4) * 0.05);
}

function demandField(context) {
  const values = Object.values(context.world.demandIndex || {}).filter(Number.isFinite);
  if (!values.length) return 0;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return clamp(-average / 100);
}

function structureField(agentA, agentB, context) {
  if (agentA.location !== agentB.location) return -0.5;
  const localCount = context.locationCounts.get(agentA.location) || 0;
  return clamp((Math.min(localCount, 6) - 2) / 4);
}

function createContext(agents, world) {
  const locationCounts = new Map();
  agents.forEach(agent => {
    locationCounts.set(agent.location, (locationCounts.get(agent.location) || 0) + 1);
  });
  return { world, locationCounts };
}

function createPairResult(agentA, agentB, context) {
  const components = Object.freeze({
    bio: clamp((biologicalField(agentA) + biologicalField(agentB)) / 2),
    bond: bondField(agentA, agentB),
    competition: competitionField(agentA, agentB, context),
    demand: demandField(context),
    structure: structureField(agentA, agentB, context)
  });
  const combinedField = Object.values(components).reduce((sum, value) => sum + value, 0);

  return Object.freeze({
    pair: Object.freeze([agentA.id, agentB.id].sort()),
    probabilityVector: Object.freeze({
      pairAttractor: sigmoid(combinedField),
      groupAttractor: sigmoid(combinedField + components.structure - Math.abs(components.bond)),
      independentAttractor: sigmoid(-combinedField)
    }),
    components,
    combinedField
  });
}

function computeReproductionProbabilityField(agents = [], world = {}) {
  const stableAgents = agents.slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const context = createContext(stableAgents, world);
  const results = [];

  for (let left = 0; left < stableAgents.length; left += 1) {
    for (let right = left + 1; right < stableAgents.length; right += 1) {
      results.push(createPairResult(stableAgents[left], stableAgents[right], context));
    }
  }

  return Object.freeze(results);
}

module.exports = {
  biologicalField,
  bondField,
  competitionField,
  computeReproductionProbabilityField,
  demandField,
  sigmoid,
  structureField
};
