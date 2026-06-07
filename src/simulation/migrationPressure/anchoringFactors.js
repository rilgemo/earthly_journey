const { average, clamp01 } = require('./instabilityCalculator');

function calculateTrustDensity(trustNetwork = {}) {
  const values = [];
  Object.values(trustNetwork).forEach(edges => {
    Object.values(edges || {}).forEach(value => {
      if (typeof value === 'number') values.push(value / 100);
    });
  });
  return clamp01(average(values));
}

function calculateCommunicationStrength(trace = {}) {
  const communications = (trace.agents || []).filter(agent => agent.communicationTrace).length;
  const agents = (trace.agents || []).length || 1;
  return clamp01(communications / agents);
}

function calculateBehavioralLockIn(signatures = {}) {
  return clamp01(average(Object.values(signatures)
    .map(signature => signature.stabilityScore || 0)));
}

function calculateAnchoringFactors({ settlement = {}, trace = {}, trustNetwork = {}, behaviorSignatures = {} } = {}) {
  const trustDensity = calculateTrustDensity(trustNetwork);
  const communicationStrength = calculateCommunicationStrength(trace);
  const settlementInertia = clamp01(((settlement.persistenceScore || 0) + (settlement.metrics?.activityStability || 0)) / 2);
  const behavioralLockIn = calculateBehavioralLockIn(behaviorSignatures);
  const socialAnchoring = clamp01((trustDensity + communicationStrength) / 2);

  return {
    socialAnchoring,
    trustDensity,
    communicationStrength,
    settlementInertia,
    behavioralLockIn
  };
}

module.exports = {
  calculateAnchoringFactors,
  calculateBehavioralLockIn,
  calculateCommunicationStrength,
  calculateTrustDensity
};
