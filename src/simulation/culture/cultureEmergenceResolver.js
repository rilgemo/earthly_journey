const { detectCulturePatterns, collectAgentEvents } = require('./culturePatternDetector');
const { analyzeCulturalClusters } = require('./culturalClusterAnalyzer');
const { calculateCultureStabilityIndex } = require('./cultureStabilityIndex');
const { buildCultureTrace } = require('./cultureTraceBuilder');

function typologyComposition(events) {
  return Object.freeze(events.reduce((result, event) => {
    result[event.typeId] = (result[event.typeId] || 0) + 1;
    return result;
  }, {}));
}

function createEnvironmentalContextSignature(context = {}) {
  return Object.freeze({
    demandKeys: Object.keys(context.demandIndex || {}).sort(),
    resourceSignature: context.resourceGeography?.metrics ? 'resource-metrics-present' : 'resource-metrics-absent',
    migrationPressure: context.migrationPressure ? 'migration-pressure-present' : 'migration-pressure-absent'
  });
}

function resolveCultureEmergence({ traces = [], settlementSnapshot = {}, context = {} } = {}) {
  const events = collectAgentEvents(traces);
  const detectedPatterns = detectCulturePatterns(traces);
  const clusterMapping = analyzeCulturalClusters(traces, settlementSnapshot);
  const metrics = calculateCultureStabilityIndex(traces);
  const dominantBehaviors = detectedPatterns.slice(0, 5);
  const cultureId = `culture:${dominantBehaviors.map(pattern => pattern.action).join('|') || 'none'}`;
  const culture = Object.freeze({
    cultureId,
    originClusters: Object.freeze(clusterMapping.map(cluster => cluster.originCluster)),
    dominantBehaviors: Object.freeze(dominantBehaviors),
    stabilityScore: metrics.stabilityScore,
    participationDistribution: metrics.participationEntropy,
    typologyComposition: typologyComposition(events),
    environmentalContextSignature: createEnvironmentalContextSignature(context)
  });

  return Object.freeze({
    culture,
    cultureTrace: buildCultureTrace({
      culture,
      timeWindow: metrics.timeWindow,
      detectedPatterns,
      clusterMapping,
      metrics
    })
  });
}

module.exports = {
  resolveCultureEmergence,
  typologyComposition,
  createEnvironmentalContextSignature
};
