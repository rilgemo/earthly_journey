function extractCrossGenerationalPatterns({
  cultureTraces = [],
  behavioralHistory = [],
  demandHistory = []
} = {}) {
  const culturePatterns = cultureTraces.flatMap(trace => (
    (trace.detectedPatterns || []).map(pattern => ({
      type: 'Cultural Stability Memory',
      key: `culture:${pattern.action}`,
      action: pattern.action,
      count: pattern.count || 1,
      source: 'culture'
    }))
  ));
  const behaviorPatterns = behavioralHistory.flatMap(entry => (
    (entry.dominantActions || []).map(action => ({
      type: 'Behavioral Civilization Memory',
      key: `behavior:${action.action}`,
      action: action.action,
      count: action.count || 1,
      source: 'behavior'
    }))
  ));
  const demandPatterns = demandHistory.flatMap(entry => (
    Object.entries(entry)
      .filter(([key, value]) => key !== 'tick' && typeof value === 'number' && value > 0)
      .map(([key, value]) => ({
        type: 'Demand Structure Memory',
        key: `demand:${key}`,
        action: key,
        count: value,
        source: 'demand'
      }))
  ));

  return Object.freeze([...culturePatterns, ...behaviorPatterns, ...demandPatterns]
    .sort((first, second) => first.key.localeCompare(second.key)));
}

module.exports = {
  extractCrossGenerationalPatterns
};
