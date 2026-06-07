const { freezeSnapshot } = require('../behavior/behaviorTraceRecorder');
const { cloneSnapshot } = require('../replayBuffer');
const { hasResourceFlow } = require('./interactionBalance');
const { buildExchangeContext } = require('./exchangeContextModel');
const { deriveTrustFromTrace } = require('./trustExchangeGraph');

function exchangeMode(context) {
  if (context.trustLevel >= 0.75 && hasResourceFlow(context.resourcesIn)) {
    return 'direct_barter_interaction';
  }
  if (context.trustLevel >= 0.7) return 'trust_weighted_gifting';
  if (context.contextFactors.priorInteractionHistory >= 0.55) return 'delayed_reciprocal_assistance';
  return 'situational_cooperation_event';
}

function reciprocityExpectation(context) {
  if (hasResourceFlow(context.resourcesIn)) return 'immediate_balance';
  if (context.trustLevel >= 0.65) return 'delayed_return_interaction';
  if (context.contextFactors.localInteractionFrequency >= 0.5) return 'distributed_social_obligation';
  return 'partial_contribution_over_time';
}

function createExchangeEvent({
  giverTrace,
  receiverTrace,
  context,
  tickId,
  pairIndex
}) {
  return {
    eventId: `exchange:${tickId}:${giverTrace.agentId}:${receiverTrace.agentId}:${pairIndex}`,
    giver: giverTrace.agentId,
    receiver: receiverTrace.agentId,
    resourcesOut: context.resourcesOut,
    resourcesIn: context.resourcesIn,
    contextState: {
      tickId,
      giverAction: giverTrace.actionSelected,
      receiverAction: receiverTrace.actionSelected,
      tileId: giverTrace.position || null,
      mode: exchangeMode(context),
      dominantDriver: context.dominantDriver,
      interactionScore: context.interactionScore,
      factors: context.contextFactors
    },
    trustLevel: context.trustLevel,
    reciprocityExpectation: reciprocityExpectation(context),
    temporalDistance: 0
  };
}

function detectExchangeEvents({
  trace = {},
  trustGraph = null,
  behaviorSignatures = {},
  perceptionAlignment = {},
  threshold = 0.45
} = {}) {
  const graph = trustGraph || deriveTrustFromTrace(trace);
  const agents = (trace.agents || [])
    .filter(agent => agent?.agentId && !agent.actionRejected);
  const events = [];

  for (let i = 0; i < agents.length; i += 1) {
    for (let j = i + 1; j < agents.length; j += 1) {
      const firstToSecond = buildExchangeContext({
        giverTrace: agents[i],
        receiverTrace: agents[j],
        trace,
        trustGraph: graph,
        behaviorSignatures,
        perceptionAlignment
      });
      const secondToFirst = buildExchangeContext({
        giverTrace: agents[j],
        receiverTrace: agents[i],
        trace,
        trustGraph: graph,
        behaviorSignatures,
        perceptionAlignment
      });
      const chosen = firstToSecond.interactionScore >= secondToFirst.interactionScore
        ? { giver: agents[i], receiver: agents[j], context: firstToSecond }
        : { giver: agents[j], receiver: agents[i], context: secondToFirst };

      if (!chosen.context.hasExchangeableAsymmetry) continue;
      if (!chosen.context.contextFactors.spatialProximity) continue;
      if (chosen.context.interactionScore < threshold) continue;

      events.push(createExchangeEvent({
        giverTrace: chosen.giver,
        receiverTrace: chosen.receiver,
        context: chosen.context,
        tickId: trace.tickId ?? 0,
        pairIndex: events.length
      }));
    }
  }

  return freezeSnapshot(cloneSnapshot(events));
}

module.exports = {
  createExchangeEvent,
  detectExchangeEvents,
  exchangeMode,
  reciprocityExpectation
};
