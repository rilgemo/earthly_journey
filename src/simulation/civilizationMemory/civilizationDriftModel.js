function calculateCivilizationDrift(memoryGraph = {}, stability = {}) {
  const nodes = memoryGraph.nodes || [];
  const decayedNodes = nodes
    .filter(node => node.weight < 2)
    .map(node => Object.freeze({ id: node.id, reason: 'low persistence weight' }));
  const stableNodes = nodes
    .filter(node => node.weight >= 2)
    .map(node => Object.freeze({ id: node.id, weight: node.weight }));
  const driftResistanceIndex = Number((
    (stability.structuralStabilityScore || 0) * 0.5
    + (stability.crossAgentPersistenceIndex || 0) * 0.5
  ).toFixed(4));
  const driftEvents = decayedNodes.map(node => Object.freeze({
    memoryId: node.id,
    type: 'decay',
    reason: node.reason
  }));

  return Object.freeze({
    stableNodes: Object.freeze(stableNodes),
    decayedNodes: Object.freeze(decayedNodes),
    driftEvents: Object.freeze(driftEvents),
    driftResistanceIndex
  });
}

module.exports = {
  calculateCivilizationDrift
};
