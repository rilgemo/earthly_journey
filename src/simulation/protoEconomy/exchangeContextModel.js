const {
  calculateResourceAsymmetry,
  clamp01,
  resourceVectorFromTrace,
  vectorMagnitude
} = require('./interactionBalance');
const { getTrustLevel } = require('./trustExchangeGraph');

function sameLocation(first = {}, second = {}) {
  return first.position && second.position && first.position === second.position;
}

function needAlignmentScore(giverTrace = {}, receiverTrace = {}, resourcesOut = {}) {
  const receiverNeeds = receiverTrace.needProfile || receiverTrace.needs || {};
  const total = Object.values(resourcesOut).reduce((sum, value) => sum + Math.max(0, value || 0), 0);
  if (!total) return 0;

  let score = 0;
  if ((resourcesOut.food || 0) > 0) score += (receiverNeeds.hunger || receiverNeeds.food || 0) / 100;
  if ((resourcesOut.water || 0) > 0) score += (receiverNeeds.thirst || receiverNeeds.water || 0) / 100;
  if ((resourcesOut.arcane || 0) > 0) score += (receiverNeeds.manaNeed || receiverNeeds.arcane || 0) / 100;
  if ((resourcesOut.protection || 0) > 0) score += (receiverNeeds.safetyNeed || receiverNeeds.safety || 0) / 100;
  if ((resourcesOut.knowledge || 0) > 0) score += (receiverNeeds.knowledge || receiverNeeds.socialNeed || 0) / 100;

  return clamp01(score || 0.2);
}

function localInteractionFrequency(giverTrace = {}, receiverTrace = {}, trace = {}) {
  const localAgents = (trace.agents || []).filter(agent => agent.position && agent.position === giverTrace.position);
  const communicationBoost = [giverTrace, receiverTrace].some(agent => agent.communicationTrace) ? 0.25 : 0;
  return clamp01((localAgents.length - 1) / 5 + communicationBoost);
}

function behavioralHistoryScore(giverTrace = {}, receiverTrace = {}, behaviorSignatures = {}) {
  const giver = behaviorSignatures[giverTrace.agentId] || {};
  const receiver = behaviorSignatures[receiverTrace.agentId] || {};
  return clamp01(((giver.stabilityScore || 0) + (receiver.stabilityScore || 0)) / 2);
}

function perceptionAlignmentScore(giverTrace = {}, receiverTrace = {}, perceptionAlignment = {}) {
  const pairKey = `${giverTrace.agentId}->${receiverTrace.agentId}`;
  if (Number.isFinite(perceptionAlignment[pairKey])) return clamp01(perceptionAlignment[pairKey]);

  const giverConfidence = giverTrace.perception?.beliefState?.confidenceScore
    || giverTrace.perception?.confidenceScore
    || 0.5;
  const receiverConfidence = receiverTrace.perception?.beliefState?.confidenceScore
    || receiverTrace.perception?.confidenceScore
    || 0.5;
  return clamp01(1 - Math.abs(giverConfidence - receiverConfidence));
}

function dominantDriver(contextFactors = {}) {
  return Object.entries(contextFactors)
    .sort((first, second) => second[1] - first[1])[0]?.[0] || 'resourceAsymmetry';
}

function buildExchangeContext({
  giverTrace = {},
  receiverTrace = {},
  trace = {},
  trustGraph = {},
  behaviorSignatures = {},
  perceptionAlignment = {}
} = {}) {
  const giverResources = resourceVectorFromTrace(giverTrace);
  const receiverResources = resourceVectorFromTrace(receiverTrace);
  const asymmetry = calculateResourceAsymmetry(giverResources, receiverResources);
  const resourcesOut = asymmetry.differences;
  const reverse = calculateResourceAsymmetry(receiverResources, giverResources);
  const trustLevel = getTrustLevel(giverTrace.agentId, receiverTrace.agentId, trustGraph);
  const proximity = sameLocation(giverTrace, receiverTrace) ? 1 : 0;

  const contextFactors = {
    resourceAsymmetry: asymmetry.asymmetryScore,
    localInteractionFrequency: localInteractionFrequency(giverTrace, receiverTrace, trace),
    trustRelationshipStrength: trustLevel,
    perceivedNeedAlignment: needAlignmentScore(giverTrace, receiverTrace, resourcesOut),
    priorInteractionHistory: behavioralHistoryScore(giverTrace, receiverTrace, behaviorSignatures),
    perceptionAlignment: perceptionAlignmentScore(giverTrace, receiverTrace, perceptionAlignment),
    spatialProximity: proximity
  };

  const interactionScore = clamp01(
    contextFactors.resourceAsymmetry * 0.28
    + contextFactors.localInteractionFrequency * 0.12
    + contextFactors.trustRelationshipStrength * 0.18
    + contextFactors.perceivedNeedAlignment * 0.16
    + contextFactors.priorInteractionHistory * 0.1
    + contextFactors.perceptionAlignment * 0.06
    + contextFactors.spatialProximity * 0.1
  );

  return {
    giverResources,
    receiverResources,
    resourcesOut,
    resourcesIn: reverse.differences,
    trustLevel,
    contextFactors,
    interactionScore,
    dominantDriver: dominantDriver(contextFactors),
    hasExchangeableAsymmetry: vectorMagnitude(resourcesOut) > 0
  };
}

module.exports = {
  buildExchangeContext,
  dominantDriver,
  needAlignmentScore,
  sameLocation
};
