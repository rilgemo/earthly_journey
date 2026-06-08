function buildCultureTrace({ culture, timeWindow, detectedPatterns, clusterMapping, metrics }) {
  return Object.freeze({
    cultureId: culture.cultureId,
    timeWindow,
    detectedPatterns: Object.freeze(detectedPatterns),
    stabilityScore: metrics.stabilityScore,
    clusterMapping: Object.freeze(clusterMapping),
    driftIndex: metrics.driftIndex,
    convergenceIndex: metrics.convergenceIndex
  });
}

module.exports = {
  buildCultureTrace
};
