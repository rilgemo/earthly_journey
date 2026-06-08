const { collectAgentEvents } = require('./culturePatternDetector');

function analyzeCulturalClusters(traces = [], settlementSnapshot = {}) {
  const events = collectAgentEvents(traces);
  const settlements = settlementSnapshot.settlements || [];

  if (!settlements.length) {
    const byPosition = events.reduce((result, event) => {
      const key = event.position || 'unknown';
      if (!result[key]) result[key] = [];
      result[key].push(event);
      return result;
    }, {});

    return Object.freeze(Object.entries(byPosition).map(([position, entries]) => Object.freeze({
      clusterId: `cluster:${position}`,
      originCluster: position,
      agentCount: new Set(entries.map(entry => entry.agentId)).size,
      actionCount: entries.length
    })));
  }

  return Object.freeze(settlements.map(settlement => {
    const entries = events.filter(event => settlement.tiles?.includes(event.position));
    return Object.freeze({
      clusterId: settlement.id,
      originCluster: settlement.id,
      agentCount: new Set(entries.map(entry => entry.agentId)).size,
      actionCount: entries.length,
      dominantActivities: settlement.dominantActivities || []
    });
  }));
}

module.exports = {
  analyzeCulturalClusters
};
