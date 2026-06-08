function reinterpretCauses(civilizationMemoryTrace = {}, symbolicEntities = []) {
  return Object.freeze((civilizationMemoryTrace.memoryGraph?.nodes || []).map(node => {
    const symbol = symbolicEntities.find(entity => entity.sourceMemory === node.id);
    return Object.freeze({
      mappingId: `cause:${node.id}`,
      sourceMemory: node.id,
      interpretedCause: symbol?.symbolicEntity || 'The Unnamed Pattern',
      simplification: node.sources?.join('+') || 'unknown',
      ambiguityScore: Number((1 / Math.max(1, node.sources?.length || 1)).toFixed(4))
    });
  }).sort((first, second) => first.mappingId.localeCompare(second.mappingId)));
}

module.exports = {
  reinterpretCauses
};
