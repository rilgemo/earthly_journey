function analyzeStabilityPersistence({
  compressedPatterns = [],
  settlementSnapshots = [],
  resourceHistory = []
} = {}) {
  const patternScore = Math.min(1, compressedPatterns.length / 10);
  const settlementScore = Math.min(1, settlementSnapshots.length / 5);
  const resourceScore = Math.min(1, resourceHistory.length / 5);
  const structuralStabilityScore = Number(((patternScore + settlementScore + resourceScore) / 3).toFixed(4));
  const crossAgentPersistenceIndex = Number(Math.min(1, compressedPatterns
    .filter(pattern => pattern.sources.length > 1).length / Math.max(1, compressedPatterns.length)).toFixed(4));
  const environmentalCouplingStrength = Number(Math.min(1, resourceScore + (settlementScore * 0.25)).toFixed(4));

  return Object.freeze({
    structuralStabilityScore,
    crossAgentPersistenceIndex,
    environmentalCouplingStrength
  });
}

module.exports = {
  analyzeStabilityPersistence
};
