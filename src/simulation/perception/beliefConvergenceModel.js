const { createBeliefState } = require('./beliefState');

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function claimOf(event) {
  return event?.claim ?? event?.target ?? event?.value;
}

function latestBeliefsByKey(state) {
  return (state?.perceivedEvents || []).reduce((result, event) => {
    const key = event.eventKey || event.id || event.type || 'belief';
    result[key] = event;
    return result;
  }, {});
}

function getPairTrust(network = {}, firstId, secondId) {
  const forward = network[firstId]?.[secondId];
  const backward = network[secondId]?.[firstId];
  const values = [forward, backward].filter(value => typeof value === 'number');
  if (!values.length) return 0;
  return clamp01(values.reduce((sum, value) => sum + value, 0) / values.length / 100);
}

function averagePairTrust(network, agentIds) {
  const values = [];
  for (let first = 0; first < agentIds.length; first += 1) {
    for (let second = first + 1; second < agentIds.length; second += 1) {
      values.push(getPairTrust(network, agentIds[first], agentIds[second]));
    }
  }
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function convergeNumericClaims(entries, strength) {
  const weightedTotal = entries.reduce((sum, entry) => sum + (entry.claim * entry.confidence), 0);
  const totalConfidence = entries.reduce((sum, entry) => sum + entry.confidence, 0) || 1;
  const consensus = weightedTotal / totalConfidence;
  return entries.map(entry => ({
    ...entry,
    convergedClaim: entry.claim + ((consensus - entry.claim) * strength)
  }));
}

function convergeCategoricalClaims(entries, strength) {
  const support = entries.reduce((result, entry) => {
    const key = String(entry.claim);
    result[key] = (result[key] || 0) + entry.confidence;
    return result;
  }, {});
  const [consensus] = Object.entries(support).sort((a, b) => b[1] - a[1])[0] || [];
  return entries.map(entry => ({
    ...entry,
    convergedClaim: strength >= 0.5 ? consensus : entry.claim
  }));
}

function convergeBeliefs(beliefStore = {}, trustNetwork = {}, options = {}) {
  const threshold = options.trustThreshold ?? 0.65;
  const repetitionThreshold = options.repetitionThreshold ?? 2;
  const confidenceThreshold = options.confidenceThreshold ?? 0.6;
  const convergenceRate = options.convergenceRate ?? 0.35;
  const byKey = {};

  Object.entries(beliefStore).forEach(([agentId, state]) => {
    Object.entries(latestBeliefsByKey(state)).forEach(([eventKey, event]) => {
      if (!byKey[eventKey]) byKey[eventKey] = [];
      byKey[eventKey].push({
        agentId,
        event,
        claim: claimOf(event),
        confidence: event.confidence ?? 0
      });
    });
  });

  const nextStore = Object.fromEntries(Object.entries(beliefStore)
    .map(([agentId, state]) => [agentId, createBeliefState(state)]));
  let convergedClaims = 0;
  let eligibleClaims = 0;

  Object.entries(byKey).forEach(([eventKey, entries]) => {
    if (entries.length < repetitionThreshold) return;
    eligibleClaims += 1;
    const trust = averagePairTrust(trustNetwork, entries.map(entry => entry.agentId));
    const confidence = entries.reduce((sum, entry) => sum + entry.confidence, 0) / entries.length;
    if (trust < threshold || confidence < confidenceThreshold) return;

    const strength = clamp01(convergenceRate * trust);
    const numeric = entries.every(entry => typeof entry.claim === 'number');
    const converged = numeric
      ? convergeNumericClaims(entries, strength)
      : convergeCategoricalClaims(entries, strength);

    converged.forEach(entry => {
      const state = nextStore[entry.agentId];
      state.perceivedEvents = state.perceivedEvents.map(event => {
        const key = event.eventKey || event.id || event.type || 'belief';
        if (key !== eventKey) return event;
        return {
          ...event,
          claim: entry.convergedClaim,
          confidence: clamp01((event.confidence ?? 0) + (strength * 0.1)),
          convergenceCount: (event.convergenceCount || 0) + 1
        };
      });
      state.beliefVersion += 1;
    });
    convergedClaims += 1;
  });

  return {
    beliefStore: nextStore,
    metrics: {
      convergenceScore: eligibleClaims ? convergedClaims / eligibleClaims : 0,
      convergedClaims,
      eligibleClaims
    }
  };
}

module.exports = {
  averagePairTrust,
  claimOf,
  convergeBeliefs,
  latestBeliefsByKey
};
