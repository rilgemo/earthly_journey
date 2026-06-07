const { freezeSnapshot } = require('../behavior/behaviorTraceRecorder');
const { cloneSnapshot } = require('../replayBuffer');

function createReciprocityState(maxHistory = 100) {
  return {
    maxHistory,
    chains: []
  };
}

function pairKey(giver, receiver) {
  return `${giver}->${receiver}`;
}

function oppositePairKey(giver, receiver) {
  return `${receiver}->${giver}`;
}

function findPriorOpposite(chains, event) {
  const opposite = oppositePairKey(event.giver, event.receiver);
  return chains
    .filter(link => link.pairKey === opposite)
    .sort((first, second) => second.tickId - first.tickId)[0] || null;
}

function updateReciprocityState(state = createReciprocityState(), events = [], tickId = 0) {
  const chains = cloneSnapshot(state.chains || []);
  const links = [];

  events.forEach(event => {
    const prior = findPriorOpposite(chains, event);
    const link = {
      linkId: `reciprocity:${tickId}:${event.giver}:${event.receiver}`,
      eventId: event.eventId,
      pairKey: pairKey(event.giver, event.receiver),
      participants: [event.giver, event.receiver],
      tickId,
      type: prior ? 'delayed_return_interaction' : event.reciprocityExpectation,
      priorEventId: prior?.eventId || null,
      temporalDistance: prior ? Math.max(0, tickId - prior.tickId) : event.temporalDistance,
      relationalContinuity: prior ? 'returning' : 'open'
    };
    chains.push(link);
    links.push(link);
  });

  while (chains.length > (state.maxHistory || 100)) chains.shift();

  return freezeSnapshot({
    state: {
      maxHistory: state.maxHistory || 100,
      chains
    },
    links
  });
}

module.exports = {
  createReciprocityState,
  pairKey,
  updateReciprocityState
};
