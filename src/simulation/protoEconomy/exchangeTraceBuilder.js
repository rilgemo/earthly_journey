const { freezeSnapshot } = require('../behavior/behaviorTraceRecorder');
const { cloneSnapshot } = require('../replayBuffer');
const { buildTrustExchangeGraph } = require('./trustExchangeGraph');

function resourceFlowFor(event = {}) {
  return {
    out: cloneSnapshot(event.resourcesOut || {}),
    in: cloneSnapshot(event.resourcesIn || {})
  };
}

function buildExchangeSnapshot({ trace = {}, events = [], reciprocity = {} } = {}) {
  const linksByEvent = Object.fromEntries((reciprocity.links || [])
    .map(link => [link.eventId, link]));
  const eventSnapshots = events.map(event => {
    const link = linksByEvent[event.eventId] || null;
    return {
      eventId: event.eventId,
      participants: {
        giver: event.giver,
        receiver: event.receiver
      },
      resourceFlow: resourceFlowFor(event),
      contextFactors: cloneSnapshot(event.contextState?.factors || {}),
      trustContribution: event.trustLevel,
      reciprocityLink: link,
      dominantDriver: event.contextState?.dominantDriver || 'resourceAsymmetry',
      mode: event.contextState?.mode,
      interactionScore: event.contextState?.interactionScore || 0
    };
  });

  return freezeSnapshot({
    tickId: trace.tickId ?? 0,
    eventCount: eventSnapshots.length,
    events: eventSnapshots,
    trustGraph: buildTrustExchangeGraph(events),
    reciprocityChains: cloneSnapshot(reciprocity.state?.chains || []),
    resourceFlowByAgent: eventSnapshots.reduce((acc, event) => {
      const giver = event.participants.giver;
      const receiver = event.participants.receiver;
      acc[giver] = acc[giver] || { out: {}, in: {} };
      acc[receiver] = acc[receiver] || { out: {}, in: {} };
      Object.entries(event.resourceFlow.out || {}).forEach(([key, value]) => {
        acc[giver].out[key] = (acc[giver].out[key] || 0) + value;
        acc[receiver].in[key] = (acc[receiver].in[key] || 0) + value;
      });
      return acc;
    }, {})
  });
}

module.exports = {
  buildExchangeSnapshot,
  resourceFlowFor
};
