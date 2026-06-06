const { FIELD_TYPES } = require('../elementalField/fieldState');

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function magnitude(fields = {}) {
  return FIELD_TYPES.reduce((sum, field) => sum + Math.abs(fields[field] || 0), 0);
}

function computeFieldMetrics(fieldDynamics = {}) {
  const pre = fieldDynamics.preDiffusionState || {};
  const post = fieldDynamics.postDiffusionState || {};
  const final = fieldDynamics.finalFieldState || {};
  const tileIds = Object.keys(final);
  const fieldDeltaMagnitude = average(tileIds.map(tileId => {
    return FIELD_TYPES.reduce((sum, field) => {
      return sum + Math.abs((final[tileId]?.[field] || 0) - (pre[tileId]?.[field] || 0));
    }, 0);
  }));
  const regionalVariance = average(FIELD_TYPES.map(field => {
    const values = tileIds.map(tileId => final[tileId]?.[field] || 0);
    const mean = average(values);
    return average(values.map(value => (value - mean) ** 2));
  }));
  const diffusionRatePressure = average(tileIds.map(tileId => {
    return FIELD_TYPES.reduce((sum, field) => {
      return sum + Math.abs((post[tileId]?.[field] || 0) - (pre[tileId]?.[field] || 0));
    }, 0);
  }));

  return {
    fieldDeltaMagnitude,
    regionalVariance,
    diffusionRatePressure,
    fieldInstabilityIndex: Math.min(1, (fieldDeltaMagnitude / 10) + (regionalVariance / 100) + (diffusionRatePressure / 10))
  };
}

function computeSocialMetrics(agents = [], agentLog = []) {
  const density = agents.reduce((counts, agent) => {
    if (agent.location) counts[agent.location] = (counts[agent.location] || 0) + 1;
    return counts;
  }, {});
  const counts = Object.values(density);
  const agentClusteringDensity = counts.length ? Math.max(...counts) : 0;
  const communicationFrequency = agentLog.filter(entry => entry.action === 'share_information').length;
  const conflictEventRate = agentLog.filter(entry => {
    const action = String(entry.action || '');
    return action.includes('attack') || action.includes('combat') || action.includes('fight');
  }).length;

  return {
    agentClusteringDensity,
    communicationFrequency,
    conflictEventRate,
    socialInstabilityIndex: Math.min(
      1,
      (agentClusteringDensity / 10) + (communicationFrequency / 20) + (conflictEventRate / 10)
    )
  };
}

function computeEmergenceMetrics(emergence = {}, agentLog = []) {
  const actionCounts = agentLog.reduce((counts, entry) => {
    if (entry.action) counts[entry.action] = (counts[entry.action] || 0) + 1;
    return counts;
  }, {});
  const actionTotal = Object.values(actionCounts).reduce((sum, count) => sum + count, 0);
  const repeatedActivityAmplification = actionTotal
    ? Math.max(...Object.values(actionCounts)) / actionTotal
    : 0;
  const memoryImprintIntensity = (emergence.memoryImprintLog || [])
    .reduce((sum, proposal) => sum + magnitude(proposal.fields), 0);
  const feedbackLoopIntensity = (emergence.finalPerturbationQueue || emergence.perturbations || [])
    .reduce((sum, proposal) => sum + magnitude(proposal.fields), 0);

  return {
    repeatedActivityAmplification,
    memoryImprintIntensity,
    feedbackLoopIntensity,
    emergenceInstabilityIndex: Math.min(
      1,
      (repeatedActivityAmplification * 0.4) + (memoryImprintIntensity / 5) + (feedbackLoopIntensity / 10)
    )
  };
}

function computeStabilityMetrics({ fieldDynamics, emergence, agents, agentLog } = {}) {
  const field = computeFieldMetrics(fieldDynamics);
  const social = computeSocialMetrics(agents, agentLog);
  const coupledEmergence = computeEmergenceMetrics(emergence, agentLog);
  const globalSystemStabilityScore = Math.max(
    0,
    1 - average([
      field.fieldInstabilityIndex,
      social.socialInstabilityIndex,
      coupledEmergence.emergenceInstabilityIndex
    ])
  );

  return {
    ...field,
    ...social,
    ...coupledEmergence,
    globalSystemStabilityScore
  };
}

module.exports = {
  computeFieldMetrics,
  computeSocialMetrics,
  computeEmergenceMetrics,
  computeStabilityMetrics
};
