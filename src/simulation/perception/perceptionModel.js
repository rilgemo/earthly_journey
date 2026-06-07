const { applyBeliefUpdate, createBeliefState } = require('./beliefState');
const { distortInformation } = require('./perceptionDistortion');

function deepFreeze(value, visited = new Set()) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value) || visited.has(value)) return value;
  visited.add(value);
  Object.values(value).forEach(entry => deepFreeze(entry, visited));
  return Object.freeze(value);
}

function cloneRealityValue(value, visited = new Map()) {
  if (typeof value === 'function' || value === undefined) return undefined;
  if (!value || typeof value !== 'object') return value;
  if (visited.has(value)) return visited.get(value);

  if (Array.isArray(value)) {
    const copy = [];
    visited.set(value, copy);
    value.forEach(item => copy.push(cloneRealityValue(item, visited)));
    return copy;
  }

  if (value instanceof Map) {
    const copy = {};
    visited.set(value, copy);
    value.forEach((entry, key) => {
      copy[key] = cloneRealityValue(entry, visited);
    });
    return copy;
  }

  const copy = {};
  visited.set(value, copy);
  Object.entries(value).forEach(([key, entry]) => {
    const cloned = cloneRealityValue(entry, visited);
    if (cloned !== undefined) copy[key] = cloned;
  });
  return copy;
}

function createRealitySnapshot(reality) {
  return deepFreeze(cloneRealityValue(reality));
}

function findRealityAgent(reality, targetId) {
  return (reality?.agents || []).find(agent => agent.id === targetId);
}

function perceiveReality({ reality, beliefState, event, observer = {}, options = {} }) {
  const realitySnapshot = createRealitySnapshot(reality);
  const target = findRealityAgent(realitySnapshot, event.targetId);
  const distorted = distortInformation(event, {
    ...options,
    distance: options.distance ?? observer.distance ?? 0,
    observationRange: options.observationRange ?? observer.observationRange ?? 10,
    currentTick: options.currentTick ?? realitySnapshot.tick ?? event.tick,
    sourceType: 'observed'
  });
  const update = {
    eventKey: distorted.event.eventKey,
    event: distorted.event,
    confidence: distorted.confidence,
    sourceId: observer.id,
    perceivedWorld: event.worldClaim,
    perceivedSkills: target ? cloneRealityValue(target.skills || {}) : undefined,
    perceivedIdentity: target ? [...(target.identities || [])] : undefined
  };

  return {
    reality: realitySnapshot,
    beliefState: applyBeliefUpdate(beliefState || createBeliefState(), update),
    update,
    distortion: distorted.factors
  };
}

function mapReplayFrameToPerception(frame, perceptionsByAgent = {}) {
  return deepFreeze({
    realityFrame: cloneRealityValue(frame),
    perceptionSnapshots: cloneRealityValue(perceptionsByAgent)
  });
}

module.exports = {
  cloneRealityValue,
  createRealitySnapshot,
  deepFreeze,
  mapReplayFrameToPerception,
  perceiveReality
};
