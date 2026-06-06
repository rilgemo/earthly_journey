const { ReplayBuffer } = require('../replayBuffer');
const { createPlayableWorldSlice } = require('../scenarios/playableWorldSlice');
const { tickManager } = require('../tickManager');
const { TraceCollector } = require('../traceCollector');
const {
  createActionDistribution,
  createSimulationReport,
  normalizeAction,
  printSimulationReport
} = require('./simulationReport');

const TRACKED_FIELDS = Object.freeze(['fire', 'water', 'life', 'arcane']);

function countPopulation(agents) {
  return agents.reduce((counts, agent) => {
    if ((agent.hp ?? agent.state?.hp ?? 0) > 0 && counts[agent.type] !== undefined) {
      counts[agent.type] += 1;
    }
    return counts;
  }, { npc: 0, animal: 0, monster: 0 });
}

function countMemories(agents) {
  return agents.reduce((count, agent) => {
    return count + (agent.memory?.shortTerm?.length || 0) + (agent.memory?.longTerm?.length || 0);
  }, 0);
}

function summarizeFields(world) {
  const totals = Object.fromEntries(TRACKED_FIELDS.map(field => [field, 0]));

  world.areas.forEach(area => {
    TRACKED_FIELDS.forEach(field => {
      totals[field] += area.field[field] || 0;
    });
  });

  return totals;
}

function createScenarioSnapshot(world, agents, summary) {
  return {
    tick: world.tick,
    currentDay: summary.currentDay,
    scenarioSummary: summary,
    population: countPopulation(agents),
    fields: summarizeFields(world),
    stability: world.lastStabilityTrace,
    coupledEmergence: world.lastEmergenceTrace
  };
}

function summarizeStability(traces) {
  const totals = {
    fieldInstability: 0,
    socialInstability: 0,
    emergenceInstability: 0,
    globalStabilityScore: 0
  };

  traces.forEach(trace => {
    const metrics = trace.stability?.metrics || {};
    totals.fieldInstability += metrics.fieldInstabilityIndex || 0;
    totals.socialInstability += metrics.socialInstabilityIndex || 0;
    totals.emergenceInstability += metrics.emergenceInstabilityIndex || 0;
    totals.globalStabilityScore += metrics.globalSystemStabilityScore || 0;
  });

  const divisor = traces.length || 1;
  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value / divisor]));
}

function runScenario({ days, seed = 12345, pretty = false, logger = console.log } = {}) {
  if (!Number.isInteger(days) || days <= 0) {
    throw new Error('Scenario days must be a positive integer');
  }

  const scenario = createPlayableWorldSlice({ seed });
  const { world, agents } = scenario;
  const initialPopulation = countPopulation(agents);
  const initialFields = summarizeFields(world);
  const actionDistribution = createActionDistribution();
  const socialMetrics = {
    memoriesCreated: 0,
    memoriesTransferred: 0,
    memoriesForgotten: 0
  };
  const eventSummary = {
    combat: 0,
    death: 0,
    communication: 0,
    field: 0
  };
  const traceCollector = new TraceCollector(days);
  const replayBuffer = new ReplayBuffer(days);

  for (let day = 1; day <= days; day += 1) {
    const populationBefore = countPopulation(agents);
    const memoriesBefore = countMemories(agents);
    tickManager(agents, world, traceCollector);
    const trace = traceCollector.getLatest();
    const memoriesCreated = trace.agents.reduce((sum, agentTrace) => {
      return sum + (agentTrace.memoryUpdates?.length || 0);
    }, 0);
    const memoriesAfter = countMemories(agents);

    socialMetrics.memoriesCreated += memoriesCreated;
    socialMetrics.memoriesTransferred += trace.agents.filter(agentTrace => agentTrace.communicationTrace).length;
    socialMetrics.memoriesForgotten += Math.max(0, memoriesBefore + memoriesCreated - memoriesAfter);

    trace.agents.forEach(agentTrace => {
      const action = normalizeAction(agentTrace.actionSelected);
      if (action) actionDistribution[action] += 1;
      if (/attack|combat|fight/.test(agentTrace.actionSelected || '')) eventSummary.combat += 1;
    });

    const populationAfter = countPopulation(agents);
    eventSummary.death += Object.keys(populationAfter)
      .reduce((sum, type) => sum + Math.max(0, populationBefore[type] - populationAfter[type]), 0);
    eventSummary.communication += trace.agents.filter(agentTrace => agentTrace.communicationTrace).length;
    eventSummary.field += trace.fieldDynamics?.conversionEvents?.length || 0;

    const summary = {
      currentDay: day,
      population: populationAfter,
      deaths: Object.fromEntries(
        Object.keys(initialPopulation).map(type => [type, initialPopulation[type] - populationAfter[type]])
      ),
      stabilityScore: trace.stability?.metrics?.globalSystemStabilityScore || 0
    };
    replayBuffer.push({
      tick: world.tick,
      worldSnapshot: createScenarioSnapshot(world, agents, summary),
      trace,
      timestamp: day
    });
  }

  const population = countPopulation(agents);
  const finalFields = summarizeFields(world);
  const report = createSimulationReport({
    scenario: scenario.name,
    daysSimulated: days,
    population,
    deaths: Object.fromEntries(
      Object.keys(initialPopulation).map(type => [type, initialPopulation[type] - population[type]])
    ),
    actionDistribution,
    socialMetrics,
    fieldMetrics: Object.fromEntries(
      TRACKED_FIELDS.map(field => [`${field}Drift`, finalFields[field] - initialFields[field]])
    ),
    stabilityMetrics: summarizeStability(traceCollector.getAll()),
    eventSummary,
    replay: {
      frameCount: replayBuffer.size(),
      latestTick: replayBuffer.latest()?.tick || 0
    }
  });

  if (pretty) printSimulationReport(report, logger);

  return {
    report,
    replayBuffer,
    traceCollector
  };
}

module.exports = {
  countPopulation,
  runScenario,
  summarizeFields
};
