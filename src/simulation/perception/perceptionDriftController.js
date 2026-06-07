const { createBeliefState } = require('./beliefState');
const { claimOf, convergeBeliefs, latestBeliefsByKey } = require('./beliefConvergenceModel');
const { seededUnit } = require('./perceptionDistortion');
const { analyzeRumorStability } = require('./rumorStabilityAnalyzer');

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function claimDivergence(claim, truth, maxDrift = 1) {
  if (truth === undefined) return 0;
  if (typeof claim === 'number' && typeof truth === 'number') {
    return clamp(Math.abs(claim - truth) / Math.max(1, Math.abs(truth)), 0, maxDrift);
  }
  return claim === truth ? 0 : 1;
}

function calculateDriftRate({
  distance = 0,
  trust = 0.5,
  memoryAge = 0,
  repetition = 1,
  baseRate = 0.03,
  maxRate = 0.12
} = {}) {
  const pressure = baseRate
    * (1 + Math.max(0, distance) / 20)
    * (1 + Math.max(0, memoryAge) / 50)
    * (1 + Math.max(0, repetition - 1) / 10)
    * (1.25 - clamp(trust, 0, 1));
  return clamp(pressure, 0, maxRate);
}

function calculateBeliefEntropy(beliefStore = {}) {
  const byKey = {};
  Object.values(beliefStore).forEach(state => {
    Object.entries(latestBeliefsByKey(state)).forEach(([eventKey, event]) => {
      const claim = String(claimOf(event));
      if (!byKey[eventKey]) byKey[eventKey] = {};
      byKey[eventKey][claim] = (byKey[eventKey][claim] || 0) + 1;
    });
  });

  const entropies = Object.values(byKey).map(counts => {
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    return Object.values(counts).reduce((entropy, count) => {
      const probability = count / total;
      return entropy - (probability * Math.log2(probability));
    }, 0);
  });
  return entropies.length ? entropies.reduce((sum, value) => sum + value, 0) / entropies.length : 0;
}

function driftBeliefState(agentId, state, realityClaims, tick, seed, config) {
  const maxDrift = config.maxDrift ?? 1;
  const maxEvents = config.maxEventsPerAgent ?? 100;
  const current = createBeliefState(state);
  const perceivedEvents = current.perceivedEvents.slice(-maxEvents).map((event, index) => {
    const eventKey = event.eventKey || event.id || event.type || 'belief';
    const truth = realityClaims[eventKey];
    const claim = claimOf(event);
    if (typeof claim !== 'number' || typeof truth !== 'number') return { ...event };

    const rate = calculateDriftRate({
      distance: event.distance || 0,
      trust: event.trust ?? 0.5,
      memoryAge: Math.max(0, tick - (event.tick || tick)),
      repetition: event.repetition || event.convergenceCount || 1,
      baseRate: config.baseRate,
      maxRate: config.maxRate
    });
    const direction = seededUnit(seed, `${agentId}:${eventKey}:${index}`) >= 0.5 ? 1 : -1;
    const limit = Math.max(1, Math.abs(truth)) * maxDrift;
    return {
      ...event,
      claim: clamp(claim + (direction * rate * Math.max(1, Math.abs(truth))), truth - limit, truth + limit),
      driftRate: rate
    };
  });

  return createBeliefState({
    ...current,
    perceivedEvents,
    beliefVersion: current.beliefVersion + 1
  });
}

function calculateDriftMetrics(realityClaims, beliefStore, convergenceScore, rumorMetrics, maxDrift) {
  const perAgent = Object.fromEntries(Object.entries(beliefStore).map(([agentId, state]) => {
    const beliefs = Object.values(latestBeliefsByKey(state));
    const values = beliefs.map(event => (
      claimDivergence(claimOf(event), realityClaims[event.eventKey || event.id || event.type], maxDrift)
    ));
    return [agentId, values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0];
  }));

  return {
    perceptionDriftIndex: perAgent,
    globalBeliefEntropy: calculateBeliefEntropy(beliefStore),
    rumorClusterStrength: rumorMetrics.rumorClusterStrength,
    convergenceScore,
    misinformationPersistenceRate: rumorMetrics.misinformationPersistenceRate
  };
}

function runPerceptionDriftTick({
  realityClaims = {},
  beliefStore = {},
  trustNetwork = {},
  previousRumorClusters = [],
  tick = 0,
  seed = 0,
  config = {}
} = {}) {
  const realityBefore = JSON.stringify(realityClaims);
  const driftedStore = Object.fromEntries(Object.entries(beliefStore).map(([agentId, state]) => [
    agentId,
    driftBeliefState(agentId, state, realityClaims, tick, seed, config)
  ]));
  const convergence = convergeBeliefs(driftedStore, trustNetwork, config);
  const rumorAnalysis = analyzeRumorStability({
    realityClaims,
    beliefStore: convergence.beliefStore,
    previousClusters: previousRumorClusters,
    stableSupport: config.stableSupport,
    stableConfidence: config.stableConfidence
  });
  const metrics = calculateDriftMetrics(
    realityClaims,
    convergence.beliefStore,
    convergence.metrics.convergenceScore,
    rumorAnalysis.metrics,
    config.maxDrift ?? 1
  );

  if (JSON.stringify(realityClaims) !== realityBefore) {
    throw new Error('Perception drift attempted to mutate reality');
  }

  return {
    beliefStore: convergence.beliefStore,
    metrics,
    rumorAnalysis,
    logs: [
      { type: 'drift', tick, globalBeliefEntropy: metrics.globalBeliefEntropy },
      { type: 'convergence', tick, score: metrics.convergenceScore }
    ]
  };
}

module.exports = {
  calculateBeliefEntropy,
  calculateDriftRate,
  claimDivergence,
  runPerceptionDriftTick
};
