function createBeliefState(overrides = {}) {
  const perceivedEvents = [...(overrides.perceivedEvents || [])];
  const confidenceMap = { ...(overrides.confidenceMap || {}) };

  return {
    perceivedWorld: { ...(overrides.perceivedWorld || {}) },
    perceivedIdentity: [...(overrides.perceivedIdentity || [])],
    perceivedSkills: { ...(overrides.perceivedSkills || {}) },
    perceivedEvents,
    confidenceMap,
    confidenceScore: overrides.confidenceScore ?? averageConfidence(confidenceMap),
    beliefVersion: overrides.beliefVersion || 0
  };
}

function averageConfidence(confidenceMap) {
  const values = Object.values(confidenceMap).filter(value => typeof value === 'number');
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function createBeliefId(update) {
  const eventKey = update.eventKey || update.event?.id || update.event?.type || 'belief';
  const claim = update.claim ?? update.event?.claim ?? update.event?.target ?? update.event?.value ?? 'unknown';
  const source = update.sourceId || update.event?.source || 'observation';
  return update.beliefId || `${eventKey}:${String(claim)}:${source}`;
}

function applyBeliefUpdate(state, update) {
  const current = createBeliefState(state);
  const beliefId = createBeliefId(update);
  const confidence = Math.max(0, Math.min(1, update.confidence ?? 0));
  const perceivedEvents = update.event
    ? [...current.perceivedEvents, { ...update.event, beliefId, confidence }]
    : current.perceivedEvents;
  const confidenceMap = { ...current.confidenceMap, [beliefId]: confidence };

  return createBeliefState({
    perceivedWorld: {
      ...current.perceivedWorld,
      ...(update.perceivedWorld || {})
    },
    perceivedIdentity: update.perceivedIdentity
      ? [...update.perceivedIdentity]
      : current.perceivedIdentity,
    perceivedSkills: {
      ...current.perceivedSkills,
      ...(update.perceivedSkills || {})
    },
    perceivedEvents,
    confidenceMap,
    confidenceScore: averageConfidence(confidenceMap),
    beliefVersion: current.beliefVersion + 1
  });
}

function getConflictingBeliefs(state, eventKey) {
  const events = (state?.perceivedEvents || []).filter(event => (
    event.eventKey === eventKey || event.id === eventKey
  ));
  const claims = new Set(events.map(event => event.claim ?? event.target ?? event.value));
  return claims.size > 1 ? events : [];
}

function createBeliefStore(agentIds = []) {
  return Object.fromEntries(agentIds.map(agentId => [agentId, createBeliefState()]));
}

function updateAgentBelief(store, agentId, update) {
  return {
    ...(store || {}),
    [agentId]: applyBeliefUpdate(store?.[agentId] || createBeliefState(), update)
  };
}

module.exports = {
  applyBeliefUpdate,
  createBeliefId,
  createBeliefStore,
  createBeliefState,
  getConflictingBeliefs,
  updateAgentBelief
};
