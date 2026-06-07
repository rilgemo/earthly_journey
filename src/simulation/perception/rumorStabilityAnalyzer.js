const { claimOf, latestBeliefsByKey } = require('./beliefConvergenceModel');

function claimKey(claim) {
  return typeof claim === 'object' ? JSON.stringify(claim) : String(claim);
}

function claimsMatch(first, second, tolerance = 0.05) {
  if (typeof first === 'number' && typeof second === 'number') {
    const scale = Math.max(1, Math.abs(second));
    return Math.abs(first - second) / scale <= tolerance;
  }
  return claimKey(first) === claimKey(second);
}

function buildRumorClusters(beliefStore = {}) {
  const clusters = {};
  Object.entries(beliefStore).forEach(([agentId, state]) => {
    Object.entries(latestBeliefsByKey(state)).forEach(([eventKey, event]) => {
      const claim = claimOf(event);
      const key = `${eventKey}:${claimKey(claim)}`;
      if (!clusters[key]) {
        clusters[key] = { eventKey, claim, members: [], totalConfidence: 0 };
      }
      clusters[key].members.push(agentId);
      clusters[key].totalConfidence += event.confidence ?? 0;
    });
  });

  return Object.values(clusters).map(cluster => ({
    ...cluster,
    averageConfidence: cluster.members.length
      ? cluster.totalConfidence / cluster.members.length
      : 0,
    strength: cluster.totalConfidence
  }));
}

function analyzeRumorStability({
  realityClaims = {},
  beliefStore = {},
  previousClusters = [],
  stableSupport = 2,
  stableConfidence = 0.6
} = {}) {
  const clusters = buildRumorClusters(beliefStore).map(cluster => {
    const truth = realityClaims[cluster.eventKey];
    const isTrue = truth !== undefined && claimsMatch(cluster.claim, truth);
    const stable = cluster.members.length >= stableSupport && cluster.averageConfidence >= stableConfidence;
    return {
      ...cluster,
      truth,
      isTrue,
      classification: stable
        ? (isTrue ? 'stable_truth' : 'stable_false_belief')
        : (isTrue ? 'unstable_truth' : 'unstable_rumor')
    };
  });
  const previousKeys = new Set(previousClusters.map(cluster => `${cluster.eventKey}:${claimKey(cluster.claim)}`));
  const persistent = clusters.filter(cluster => previousKeys.has(`${cluster.eventKey}:${claimKey(cluster.claim)}`));

  return {
    clusters,
    stableFalseBeliefs: clusters.filter(cluster => cluster.classification === 'stable_false_belief'),
    unstableTruths: clusters.filter(cluster => cluster.classification === 'unstable_truth'),
    metrics: {
      rumorClusterStrength: clusters.reduce((sum, cluster) => sum + cluster.strength, 0),
      misinformationPersistenceRate: clusters.length ? persistent.length / clusters.length : 0
    }
  };
}

module.exports = {
  analyzeRumorStability,
  buildRumorClusters,
  claimsMatch
};
